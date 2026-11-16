/** HANDVERSE Hand Tracking & Gesture Recognition Studio (Module 04).
 * Real-time webcam capture, offscreen frame compressor, WebSocket streaming,
 * high-fidelity 21-landmark neon pink skeleton rendering, 16-gesture matrix,
 * discrete event logging, and live sensitivity calibration.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Video,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  AlertTriangle,
  Hand,
  Wifi,
  WifiOff,
  Activity,
  Layers,
} from 'lucide-react';

import {
  HandDetection,
  TrackingHistoryItem,
  TrackingResult,
  GestureEvent,
  GestureSettings,
  DEFAULT_GESTURE_SETTINGS,
} from '../types/tracking';
import { CursorState } from '../types/motion';
import { HandSkeletonOverlay } from '../components/HandSkeletonOverlay';
import { VirtualCursor } from '../components/VirtualCursor';
import { TrackingMetricsPanel } from '../components/TrackingMetricsPanel';
import { GestureTestingPanel } from '../components/GestureTestingPanel';
import { GestureSensitivityModal } from '../components/GestureSensitivityModal';
import { GestureEventLog } from '../components/GestureEventLog';
import { LandmarkInspector } from '../components/LandmarkInspector';
import { TrackingHistoryChart } from '../components/TrackingHistoryChart';

export const GestureLabPage: React.FC = () => {
  // Video and container elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Streaming & Hardware state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Overlay Canvas display dimensions
  const [viewportSize, setViewportSize] = useState({ width: 640, height: 480 });

  // WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  // Hand tracking telemetry
  const [hands, setHands] = useState<HandDetection[]>([]);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [secondaryCursor, setSecondaryCursor] = useState<CursorState | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string>('no_camera');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [incomingFps, setIncomingFps] = useState<number>(0);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);

  // Module 04: Gestures & Sensitivity State
  const [twoHandGesture, setTwoHandGesture] = useState<string | null>(null);
  const [twoHandConfidence, setTwoHandConfidence] = useState<number>(0);
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GestureSettings>(() => {
    try {
      const saved = localStorage.getItem('handverse_gesture_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read stored gesture settings:', e);
    }
    return DEFAULT_GESTURE_SETTINGS;
  });

  // FPS calculation helpers
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(performance.now());

  // 1. Enumerate available webcam input devices
  useEffect(() => {
    const listDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setCameraError('Webcam mediaDevices API not supported on this browser.');
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate media devices:', err);
      }
    };

    listDevices();
  }, [selectedDeviceId]);

  // 2. Manage WebSocket Connection to /ws/hand-tracking
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/hand-tracking`;
    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          setWsError(null);
          if (isStreaming) {
            setTrackingStatus('no_hand');
          }

          // Sync current gesture settings to backend upon connection
          try {
            socket.send(
              JSON.stringify({
                type: 'UPDATE_GESTURE_SETTINGS',
                settings,
              })
            );
          } catch (e) {
            console.error('Failed to sync settings on WS open:', e);
          }
        };

        socket.onmessage = (event) => {
          try {
            const data: TrackingResult = JSON.parse(event.data);

            if (data.type === 'tracking_result') {
              setHands(data.hands || []);
              setHandsDetected(data.hands_detected);
              setTrackingStatus(data.tracking_status);
              setLatencyMs(data.processing_time_ms);
              setTwoHandGesture(data.two_hand_gesture || null);
              setTwoHandConfidence(data.two_hand_confidence || 0);

              if (data.cursor) {
                setCursor(data.cursor);
              } else {
                setCursor(null);
              }
              if (data.secondary_cursor) {
                setSecondaryCursor(data.secondary_cursor);
              } else {
                setSecondaryCursor(null);
              }

              // Discrete event stream accumulation
              if (data.events && data.events.length > 0) {
                setEvents((prev) => [...data.events!, ...prev].slice(0, 50));
              }

              // Update FPS counter
              frameCountRef.current += 1;
              const now = performance.now();
              if (now - lastFpsCalcTimeRef.current >= 1000) {
                setIncomingFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFpsCalcTimeRef.current = now;
              }

              // Append to history buffer
              const avgConfidence = data.hands.length > 0 ? data.hands[0].confidence : 0;
              setHistory((prev) => [
                ...prev.slice(-39),
                {
                  id: data.frame_id,
                  timestamp: data.timestamp,
                  handsDetected: data.hands_detected,
                  latencyMs: data.processing_time_ms,
                  confidence: avgConfidence,
                  gesture: data.hands.length > 0 ? data.hands[0].primary_gesture : undefined,
                },
              ]);
            }
          } catch (err) {
            console.error('Error parsing WebSocket tracking result:', err);
          }
        };

        socket.onerror = () => {
          setWsConnected(false);
          setWsError('WebSocket connection error to localhost:8000.');
        };

        socket.onclose = () => {
          setWsConnected(false);
          if (isStreaming) {
            setTrackingStatus('disconnected');
          }
          // Attempt automatic reconnection in 2.5 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 2500);
        };
      } catch (err) {
        console.error('WebSocket connection setup failed:', err);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
    };
  }, [isStreaming, settings]);

  // 3. Save & Apply Sensitivity Settings
  const handleSaveSettings = async (newSettings: GestureSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('handverse_gesture_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
    }

    // Sync over WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'UPDATE_GESTURE_SETTINGS',
          settings: newSettings,
        })
      );
    }

    // Also persist to REST API
    try {
      await fetch('/api/gestures/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.warn('Failed to post settings to /api/gestures/settings:', err);
    }
  };

  // 4. Start browser webcam stream
  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
            updateViewportDimensions();
          }
        };
      }

      setIsStreaming(true);
      setTrackingStatus(wsConnected ? 'no_hand' : 'connecting');

      // Refresh device labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch (err: any) {
      console.error('Webcam acquisition error:', err);
      setIsStreaming(false);
      setTrackingStatus('error');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam hardware detected on this system.');
      } else {
        setCameraError(err.message || 'Failed to initialize video capture stream.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Stop webcam stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setHands([]);
    setHandsDetected(0);
    setCursor(null);
    setSecondaryCursor(null);
    setTrackingStatus('no_camera');
    setIncomingFps(0);
    setTwoHandGesture(null);
  };

  // 6. Update overlay canvas size to match video element
  const updateViewportDimensions = useCallback(() => {
    if (videoRef.current) {
      const rect = videoRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateViewportDimensions);
    return () => window.removeEventListener('resize', updateViewportDimensions);
  }, [updateViewportDimensions]);

  // 7. Real-time Video Frame Transmitter Loop (~15 FPS, max 640px wide, JPEG)
  useEffect(() => {
    if (!isStreaming) return;

    let frameInterval: any;
    const captureWidth = 640;

    const captureAndSendFrame = () => {
      const video = videoRef.current;
      const ws = wsRef.current;

      if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;
      if (video.readyState < 2) return; // HAVE_CURRENT_DATA
      if (ws.bufferedAmount > 0) return; // Skip frame if client-to-server buffer is congested

      const captureCanvas = captureCanvasRef.current || document.createElement('canvas');
      captureCanvasRef.current = captureCanvas;

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const aspect = videoHeight / videoWidth;

      captureCanvas.width = captureWidth;
      captureCanvas.height = Math.round(captureWidth * aspect);

      const ctx = captureCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // CRUCIAL: Mirror frame horizontally before transmission
      // This ensures MediaPipe coordinates match the selfie-mode user display!
      ctx.save();
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      ctx.restore();

      // Convert to compressed binary JPEG blob
      captureCanvas.toBlob(
        (blob) => {
          if (blob && ws && ws.readyState === WebSocket.OPEN && ws.bufferedAmount === 0) {
            ws.send(blob);
          }
        },
        'image/jpeg',
        0.65
      );
    };

    // ~15 FPS transmission interval (approx 66ms)
    frameInterval = setInterval(captureAndSendFrame, 66);

    return () => {
      clearInterval(frameInterval);
    };
  }, [isStreaming]);

  // Toggle fullscreen mode on video container
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeDevice = availableDevices.find((d) => d.deviceId === selectedDeviceId);

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            MODULE 04 • AI GESTURE RECOGNITION STUDIO
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          Real-Time Gesture Laboratory
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] max-w-3xl">
          Powered by real-time 21-landmark tracking, rotation-invariant joint angle analysis, dual-threshold pinch hysteresis, and trajectory velocity evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* =========================================================================
            LEFT/CENTER: WEBCAM FEED + SKELETON OVERLAY (2 Columns)
        ========================================================================= */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={videoContainerRef}
            className="relative w-full aspect-video rounded-3xl bg-[#08060A] border-2 border-[#FF2D95]/40 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(255,45,149,0.25)]"
          >
            {/* Live Video Element (Mirrored via CSS) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isStreaming ? 'block' : 'hidden'
              }`}
            />

            {/* AI Hand Skeleton Overlay Canvas with Floating Gesture Badges */}
            {isStreaming && (
              <HandSkeletonOverlay
                hands={hands}
                twoHandGesture={twoHandGesture}
                width={viewportSize.width}
                height={viewportSize.height}
              />
            )}

            {/* Virtual Cursor Overlay */}
            {isStreaming && (
              <VirtualCursor
                cursor={cursor}
                secondaryCursor={secondaryCursor}
                width={viewportSize.width}
                height={viewportSize.height}
              />
            )}

            {/* Offline View */}
            {!isStreaming && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-[#19101D] border border-[#FF2D95]/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,149,0.2)]">
                  <CameraOff className="w-10 h-10 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-white text-lg">
                    AI Vision Camera Offline
                  </h3>
                  <p className="text-xs font-subheading text-[#B8A9B8] max-w-md">
                    Click "Start Camera" to activate your webcam and stream real-time frames to the MediaPipe HandLandmarker engine.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  disabled={isLoading}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_#FF2D95] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>{isLoading ? 'Requesting Webcam...' : 'Start Camera'}</span>
                </button>
              </div>
            )}

            {/* Reticle Overlay Guide while streaming */}
            {isStreaming && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="relative w-72 h-80 sm:w-96 sm:h-96 rounded-3xl border border-[#FF2D95]/30 border-dashed flex flex-col items-center justify-between p-4">
                  <div className="w-full flex justify-between text-[10px] font-mono text-[#FF78BD] uppercase">
                    <span>TRACKING FIELD</span>
                    <span>1.5 - 3.0 FT</span>
                  </div>

                  {handsDetected === 0 && (
                    <div className="text-center space-y-1">
                      <div className="w-14 h-14 rounded-full border border-[#FF2D95]/40 mx-auto flex items-center justify-center animate-pulse">
                        <Hand className="w-7 h-7 text-[#FF2D95]" />
                      </div>
                      <p className="text-xs font-mono text-white drop-shadow-[0_2px_4px_black]">
                        Raise hand facing camera
                      </p>
                    </div>
                  )}

                  <div className="w-full text-center text-[10px] font-mono text-zinc-400">
                    {handsDetected > 0
                      ? `LOCKED: ${handsDetected} HAND(S) ACTIVE`
                      : 'STANDBY: WAITING FOR HAND ENTRY'}
                  </div>
                </div>

                {/* Corner Frame Accents */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#FF2D95]" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#FF2D95]" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#FF2D95]" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#FF2D95]" />
              </div>
            )}

            {/* Fullscreen Button */}
            {isStreaming && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#19101D]/80 border border-[#2D1B36] hover:border-[#FF2D95] text-white transition-colors z-30"
                title="Toggle Fullscreen Preview"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Error Banner */}
            {cameraError && (
              <div className="absolute inset-x-4 top-4 p-4 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-start gap-3 backdrop-blur-md shadow-xl z-30">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-100">Camera Error</p>
                  <p className="mt-0.5">{cameraError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar beneath video */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
            <div className="flex items-center gap-3">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_#FF2D95] transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 font-subheading font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}

              {/* Camera device dropdown */}
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (isStreaming) {
                    stopCamera();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#08060A] border border-[#2D1B36] text-xs font-subheading text-white focus:outline-none focus:border-[#FF2D95] max-w-[200px] truncate"
              >
                {availableDevices.length === 0 ? (
                  <option value="">Default Web Camera</option>
                ) : (
                  availableDevices.map((dev, i) => (
                    <option key={dev.deviceId || i} value={dev.deviceId}>
                      {dev.label || `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>

              {/* Sensitivity Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#08060A] border border-[#2D1B36] hover:border-[#FF2D95] text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-[#FF2D95]" />
                <span>Calibrate</span>
              </button>
            </div>

            {/* Telemetry Pill */}
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span>{isStreaming ? `${viewportSize.width}x${viewportSize.height} PX` : 'STANDBY'}</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT SIDEBAR: METRICS & HARDWARE TELEMETRY
        ========================================================================= */}
        <div>
          <TrackingMetricsPanel
            hands={hands}
            handsDetected={handsDetected}
            trackingStatus={trackingStatus}
            twoHandGesture={twoHandGesture}
            latencyMs={latencyMs}
            fps={incomingFps}
            wsConnected={wsConnected}
            cameraActive={isStreaming}
            activeDeviceLabel={activeDevice?.label || ''}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* =========================================================================
          MODULE 04 CORE: 16-GESTURE TESTING MATRIX & PRACTICE MODE
      ========================================================================= */}
      <GestureTestingPanel
        hands={hands}
        twoHandGesture={twoHandGesture}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* =========================================================================
          MODULE 04: DISCRETE GESTURE EVENT LOG
      ========================================================================= */}
      <GestureEventLog
        events={events}
        onClear={() => setEvents([])}
      />

      {/* =========================================================================
          BOTTOM SECTION: LANDMARK INSPECTOR & STREAM HISTORY
      ========================================================================= */}
      <div className="space-y-6 pt-4">
        {/* Live Landmark Coordinates Inspector */}
        <LandmarkInspector hands={hands} />

        {/* Tracking Stream History Chart */}
        <TrackingHistoryChart
          history={history}
          onClear={() => setHistory([])}
        />
      </div>

      {/* =========================================================================
          SENSITIVITY & HYSTERESIS CALIBRATION MODAL
      ========================================================================= */}
      <GestureSensitivityModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
