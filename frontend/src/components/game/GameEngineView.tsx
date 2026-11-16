/** Master Reusable Game Engine View Container (Module 06).
 *
 * Integrates real webcam hand-tracking, WebSocket communication, the GameEngine state machine,
 * audio system, and all gameplay UI screens seamlessly.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Volume2, VolumeX, Keyboard, RefreshCw, X, Shield } from 'lucide-react';
import { GameEngine, GameEngineStateSnapshot } from '../../game-engine/GameEngine';
import { GAME_REGISTRY, GameRegistryEntry } from '../../game-engine/gameRegistry';
import { Difficulty } from '../../game-engine/types';
import { GameLaunchScreen } from './GameLaunchScreen';
import { GameCountdownScreen } from './GameCountdownScreen';
import { GameplayHUD } from './GameplayHUD';
import { GamePauseOverlay } from './GamePauseOverlay';
import { GameOverScreen } from './GameOverScreen';
import { GameResultsScreen } from './GameResultsScreen';
import { SandboxGameArena } from './SandboxGameArena';
import { HandSkeletonOverlay } from '../HandSkeletonOverlay';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { TrackingResult } from '../../types/tracking';
import { ApiService } from '../../services/api';

interface GameEngineViewProps {
  gameId?: string;
  onExit: () => void;
}

export const GameEngineView: React.FC<GameEngineViewProps> = ({
  gameId = 'engine-sandbox',
  onExit,
}) => {
  // Find game metadata
  const gameEntry =
    GAME_REGISTRY.find((g) => g.id === gameId) ||
    GAME_REGISTRY.find((g) => g.id === 'engine-sandbox')!;

  const [engine] = useState<GameEngine>(() => new GameEngine(gameEntry.id, 'Normal'));
  const [snapshot, setSnapshot] = useState<GameEngineStateSnapshot>(() => engine.getSnapshot());
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Normal');
  const [bestScore, setBestScore] = useState<number>(0);

  // Webcam & WebSocket Streaming State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const frameIdRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [keyboardMode, setKeyboardMode] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    webcamFps: 30,
    backendFps: 30,
    renderFps: 60,
    inferenceMs: 11,
    decodeMs: 2.5,
    gestureMs: 0.6,
    motionMs: 0.4,
    processingTimeMs: 14.5,
    networkRttMs: 12,
    endToEndLatencyMs: 42,
    clientDroppedFrames: 0,
    serverDroppedFrames: 0,
    inFlight: false,
    wsBufferedAmount: 0,
  });

  // Real-time hand cursor coordinates for rendering inside arena
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
    isVisible: boolean;
    isPinching: boolean;
  }>({
    x: 0.5,
    y: 0.5,
    isVisible: false,
    isPinching: false,
  });

  const [latestResult, setLatestResult] = useState<TrackingResult | null>(null);

  // Sync video stream to PiP
  useEffect(() => {
    if (pipVideoRef.current && videoRef.current?.srcObject) {
      pipVideoRef.current.srcObject = videoRef.current.srcObject;
    }
  }, [isCameraActive]);

  // Fetch best score on load
  useEffect(() => {
    ApiService.getBestScores(gameEntry.id)
      .then((res) => {
        const match = res.scores.find((s) => s.difficulty === selectedDifficulty);
        if (match) setBestScore(match.best_score);
      })
      .catch(() => {});
  }, [gameEntry.id, selectedDifficulty]);

  // Subscribe to engine state
  useEffect(() => {
    const unsubscribe = engine.subscribe((newSnapshot) => {
      setSnapshot({ ...newSnapshot });
    });
    return () => unsubscribe();
  }, [engine]);

  // Initialize engine on mount
  useEffect(() => {
    engine.init(gameEntry.id, selectedDifficulty);
    return () => {
      engine.destroy();
    };
  }, [engine, gameEntry.id, selectedDifficulty]);

  // Start webcam and WebSocket pipeline
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        connectWebSocket();
      }
    } catch (err) {
      console.error('[GameEngineView] Camera access error:', err);
      setCameraError('Failed to access webcam. Please allow camera permissions or enable Keyboard Mode.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Connect low-latency WebSocket with in-flight guard
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = 8000;
    const wsUrl = `${protocol}//${host}:${port}/ws/hand-tracking`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onmessage = (event) => {
      inFlightRef.current = false;
      try {
        const data: TrackingResult = JSON.parse(event.data);
        setLatestResult(data);

        // Feed tracking landmarks directly into game engine
        engine.feedTrackingResult(data);

        // Update active cursor coordinates
        if (data.cursor) {
          const c = data.cursor;
          setCursorPos({
            x: c.x,
            y: c.y,
            isVisible: c.is_active,
            isPinching: c.is_pressed || c.is_clicking,
          });
        }

        // Update telemetry metrics if present
        if (data.client_timestamp) {
          const nowSec = performance.now() / 1000.0;
          const rtt = Math.max(1, Math.round((nowSec - data.client_timestamp) * 1000));
          setMetrics((prev) => ({
            ...prev,
            endToEndLatencyMs: rtt,
            inferenceMs: data.inference_time_ms || prev.inferenceMs,
            decodeMs: data.decode_time_ms || prev.decodeMs,
            gestureMs: data.gesture_time_ms || prev.gestureMs,
            motionMs: data.motion_time_ms || prev.motionMs,
            serverDroppedFrames: data.server_queue_dropped || prev.serverDroppedFrames,
          }));
        }
      } catch (err) {
        console.error('[GameEngineView] Error parsing tracking message:', err);
      }
    };

    ws.onclose = () => {
      inFlightRef.current = false;
    };
  };

  // Video capture loop
  useEffect(() => {
    if (!isCameraActive) return;

    let active = true;
    let animId: number;

    const captureFrame = () => {
      if (!active) return;

      const video = videoRef.current;
      const ws = wsRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        ws &&
        ws.readyState === WebSocket.OPEN &&
        !inFlightRef.current
      ) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const targetW = 480;
        const targetH = Math.round((video.videoHeight / (video.videoWidth || 1)) * targetW) || 360;

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
          canvas.toBlob(
            (blob) => {
              if (blob && ws.readyState === WebSocket.OPEN && !inFlightRef.current) {
                inFlightRef.current = true;
                frameIdRef.current = (frameIdRef.current + 1) >>> 0;
                const nowSec = performance.now() / 1000.0;

                blob.arrayBuffer().then((buf) => {
                  const headerBuf = new ArrayBuffer(12);
                  const view = new DataView(headerBuf);
                  view.setUint32(0, frameIdRef.current, false);
                  view.setFloat64(4, nowSec, false);

                  const combined = new Uint8Array(12 + buf.byteLength);
                  combined.set(new Uint8Array(headerBuf), 0);
                  combined.set(new Uint8Array(buf), 12);

                  ws.send(combined.buffer);
                });
              }
            },
            'image/jpeg',
            0.6
          );
        }
      }

      animId = requestAnimationFrame(captureFrame);
    };

    animId = requestAnimationFrame(captureFrame);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [isCameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Keyboard emulation toggle
  const toggleKeyboardMode = () => {
    const next = !keyboardMode;
    setKeyboardMode(next);
    if (next) {
      engine.input.enableKeyboardMouseEmulation();
    } else {
      engine.input.disableKeyboardMouseEmulation();
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    engine.sound.setEnabled(!next);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#08060A] text-white flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* Hidden processing canvas & video */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {/* Top Controls Toolbar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#19101D] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-colors text-xs font-mono uppercase"
          >
            <X className="w-3.5 h-3.5" />
            <span>Arcade</span>
          </button>

          <span className="text-xs font-mono font-bold text-[#FF78BD] uppercase">
            {gameEntry.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-[#B8A9B8] hover:text-white transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FF2D95]" />}
          </button>

          {/* Keyboard / Mouse Mode Toggle */}
          <button
            onClick={toggleKeyboardMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono uppercase flex items-center gap-1.5 transition-all ${
              keyboardMode
                ? 'bg-[#FF2D95]/20 border-[#FF2D95] text-white shadow-[0_0_10px_#FF2D95]'
                : 'bg-[#19101D] border-[#2D1B36] text-zinc-400 hover:text-white'
            }`}
            title="Toggle Spacebar / Mouse click test mode"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keyboard Mode</span>
          </button>

          {/* Camera On / Off Button */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(255,45,149,0.4)] flex items-center gap-1.5 hover:shadow-[0_0_25px_#FF2D95] transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-xl bg-[#19101D] border border-red-500/40 text-red-400 text-xs font-mono uppercase flex items-center gap-1.5 hover:bg-red-950/30 transition-all"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Game Screen Container */}
      <div className="relative w-full max-w-5xl aspect-video rounded-3xl bg-[#19101D] border-2 border-[#2D1B36] overflow-hidden shadow-[0_0_60px_rgba(255,45,149,0.15)] flex items-center justify-center">
        {/* Interactive Game Arena Canvas */}
        <SandboxGameArena engine={engine} cursorPos={cursorPos} />

        {/* Heads Up Display (HUD) */}
        {['PLAYING', 'PAUSED', 'LEVEL_COMPLETE'].includes(snapshot.state) && (
          <GameplayHUD snapshot={snapshot} onPause={() => engine.pause()} />
        )}

        {/* State Overlay Screens */}
        <AnimatePresence>
          {['IDLE', 'READY'].includes(snapshot.state) && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <GameLaunchScreen
                game={gameEntry}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={(diff) => {
                  setSelectedDifficulty(diff);
                  engine.init(gameEntry.id, diff);
                }}
                bestScore={bestScore}
                onStart={() => {
                  if (!isCameraActive && !keyboardMode) {
                    startCamera();
                  }
                  engine.startCountdown();
                }}
                onBack={onExit}
              />
            </div>
          )}

          {snapshot.state === 'COUNTDOWN' && (
            <GameCountdownScreen countdownNumber={snapshot.countdownNumber} />
          )}

          {snapshot.state === 'PAUSED' && (
            <GamePauseOverlay
              onResume={() => engine.resume()}
              onRestart={() => engine.restart()}
              onExit={onExit}
            />
          )}

          {snapshot.state === 'GAME_OVER' && (
            <GameOverScreen
              snapshot={snapshot}
              onPlayAgain={() => engine.restart()}
              onViewResults={() => engine.viewResults()}
              onExit={onExit}
            />
          )}

          {snapshot.state === 'RESULTS' && (
            <GameResultsScreen
              snapshot={snapshot}
              bestScore={bestScore}
              onPlayAgain={() => engine.restart()}
              onExit={onExit}
            />
          )}
        </AnimatePresence>

        {/* Compact Picture-in-Picture Webcam Reticle (Bottom-Right) */}
        {isCameraActive && (
          <div className="absolute bottom-4 right-4 z-20 w-44 h-32 rounded-2xl bg-[#08060A]/90 border border-[#FF2D95]/40 overflow-hidden shadow-[0_0_25px_rgba(255,45,149,0.3)] pointer-events-none">
            <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 opacity-60"
            />
            {/* Skeletal tracking overlay in PiP */}
            {latestResult && (
              <HandSkeletonOverlay
                hands={latestResult.hands || []}
                twoHandGesture={latestResult.two_hand_gesture}
                width={176}
                height={128}
              />
            )}
            <div className="absolute top-1 left-2 text-[9px] font-mono uppercase text-[#FF78BD]">
              WEBCAM SENSOR
            </div>
          </div>
        )}

        {/* Top-Right Performance Telemetry Overlay */}
        {isCameraActive && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <PerformanceMonitor metrics={metrics} />
          </div>
        )}
      </div>

      {/* Camera Guidance Prompt if camera is not active */}
      {!isCameraActive && !keyboardMode && snapshot.state === 'PLAYING' && (
        <div className="mt-4 p-3 rounded-2xl bg-[#19101D] border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-3">
          <span>Webcam inactive. Click <strong>Start Camera</strong> above, or toggle <strong>Keyboard Mode</strong> to use Spacebar.</span>
        </div>
      )}
    </div>
  );
};
