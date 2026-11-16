/** HANDVERSE Hand Motion Calibration Studio (Module 05).
 * Real-time 5-step hand calibration wizard, One Euro movement smoothing,
 * virtual cursor overlay, and interactive precision target playground.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Crosshair,
  Compass,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

import {
  HandDetection,
  TrackingResult,
} from '../types/tracking';
import {
  CalibrationBounds,
  CalibrationStatusResponse,
  CursorState,
  DEFAULT_MOTION_SETTINGS,
  MotionSettings,
} from '../types/motion';
import { HandSkeletonOverlay } from '../components/HandSkeletonOverlay';
import { VirtualCursor } from '../components/VirtualCursor';
import { CalibrationTarget } from '../components/CalibrationTarget';
import { CalibrationWizard } from '../components/CalibrationWizard';
import { ControlSettings } from '../components/ControlSettings';
import { MotionControlDashboard } from '../components/MotionControlDashboard';
import { motionApi } from '../services/motionApi';

export const CalibrationPage: React.FC = () => {
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

  // Tracking & Motion state
  const [hands, setHands] = useState<HandDetection[]>([]);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [secondaryCursor, setSecondaryCursor] = useState<CursorState | null>(null);
  const [twoHandGesture, setTwoHandGesture] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [incomingFps, setIncomingFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(performance.now());

  // Calibration and Settings state
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatusResponse | null>(null);
  const [settings, setSettings] = useState<MotionSettings>(() => {
    try {
      const saved = localStorage.getItem('handverse_motion_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read motion settings from localStorage:', e);
    }
    return DEFAULT_MOTION_SETTINGS;
  });
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'PLAYGROUND' | 'SETTINGS'>('WIZARD');

  // Refresh calibration status from backend
  const refreshCalibrationStatus = useCallback(async () => {
    try {
      const res = await motionApi.getCalibrationStatus();
      setCalibrationStatus(res);
    } catch (err) {
      console.warn('Could not fetch calibration status:', err);
    }
  }, []);

  useEffect(() => {
    refreshCalibrationStatus();
  }, [refreshCalibrationStatus]);

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

          // Sync motion settings over WebSocket
          try {
            socket.send(
              JSON.stringify({
                type: 'UPDATE_MOTION_SETTINGS',
                settings,
              })
            );
          } catch (e) {
            console.error('Failed to sync motion settings on WS open:', e);
          }
        };

        socket.onmessage = (event) => {
          try {
            const data: TrackingResult = JSON.parse(event.data);

            if (data.type === 'tracking_result') {
              setHands(data.hands || []);
              setHandsDetected(data.hands_detected);
              setLatencyMs(data.processing_time_ms);
              setTwoHandGesture(data.two_hand_gesture || null);

              // Module 05 Virtual Cursor
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

              // Update FPS counter
              frameCountRef.current += 1;
              const now = performance.now();
              if (now - lastFpsCalcTimeRef.current >= 1000) {
                setIncomingFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFpsCalcTimeRef.current = now;
              }
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
  }, [settings]);

  // 3. Update motion settings and persist
  const handleSettingsChange = (newSettings: MotionSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('handverse_motion_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not save motion settings to localStorage:', e);
    }

    // Sync via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'UPDATE_MOTION_SETTINGS',
          settings: newSettings,
        })
      );
    }
  };

  // 4. Start webcam stream
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

      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch (err: any) {
      console.error('Webcam acquisition error:', err);
      setIsStreaming(false);
      setCameraError(err.message || 'Failed to initialize video capture stream.');
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
    setIncomingFps(0);
  };

  // 6. Viewport dimensions update
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

  // 7. Video frame transmitter (~15 FPS JPEG)
  useEffect(() => {
    if (!isStreaming) return;

    let frameInterval: any;
    const captureWidth = 640;

    const captureAndSendFrame = () => {
      const video = videoRef.current;
      const ws = wsRef.current;

      if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;
      if (video.readyState < 2) return;
      if (ws.bufferedAmount > 0) return;

      const captureCanvas = captureCanvasRef.current || document.createElement('canvas');
      captureCanvasRef.current = captureCanvas;

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const aspect = videoHeight / videoWidth;

      captureCanvas.width = captureWidth;
      captureCanvas.height = Math.round(captureWidth * aspect);

      const ctx = captureCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.save();
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      ctx.restore();

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

    frameInterval = setInterval(captureAndSendFrame, 66);
    return () => clearInterval(frameInterval);
  }, [isStreaming]);

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

  const bounds = calibrationStatus?.bounds;

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            MODULE 05 • HAND CALIBRATION & MOTION ENGINE
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          Motion Control Studio
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] max-w-3xl">
          Calibrate physical camera space to virtual screen coordinates with adaptive One Euro smoothing, pinch click mapping, and multi-hand support.
        </p>
      </div>

      {/* Main Studio Viewport & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* =========================================================================
            LEFT/CENTER: LIVE CAMERA VIEWPORT + CALIBRATION OVERLAY + VIRTUAL CURSOR
        ========================================================================= */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={videoContainerRef}
            className="relative w-full aspect-video rounded-3xl bg-[#08060A] border-2 border-[#FF2D95]/40 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(255,45,149,0.25)]"
          >
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isStreaming ? 'block' : 'hidden'
              }`}
            />

            {/* AI Hand Skeleton Overlay Canvas */}
            {isStreaming && (
              <HandSkeletonOverlay
                hands={hands}
                twoHandGesture={twoHandGesture}
                width={viewportSize.width}
                height={viewportSize.height}
              />
            )}

            {/* Virtual Cursor Overlay (Module 05 Core) */}
            {isStreaming && settings.enable_virtual_cursor && (
              <VirtualCursor
                cursor={cursor}
                secondaryCursor={secondaryCursor}
                width={viewportSize.width}
                height={viewportSize.height}
                showTrail={true}
              />
            )}

            {/* Calibrated Bounding Box Visualization */}
            {isStreaming && bounds && bounds.is_valid && (
              <div
                className="absolute border-2 border-dashed border-[#FF2D95]/50 pointer-events-none rounded-2xl"
                style={{
                  left: `${bounds.min_x * 100}%`,
                  top: `${bounds.min_y * 100}%`,
                  width: `${bounds.width * 100}%`,
                  height: `${bounds.height * 100}%`,
                  boxShadow: 'inset 0 0 30px rgba(255,45,149,0.1)',
                }}
              >
                <div className="absolute top-2 left-2 text-[9px] font-mono text-[#FF78BD] uppercase bg-black/60 px-1.5 py-0.5 rounded">
                  CALIBRATED VOLUME
                </div>
              </div>
            )}

            {/* Interactive Corner Calibration Targets in Wizard Mode */}
            {isStreaming && activeTab === 'WIZARD' && (
              <>
                <CalibrationTarget
                  name="top_left"
                  label="Top-Left"
                  normX={0.18}
                  normY={0.18}
                  isTargetActive={calibrationStatus?.active_step === 3 && !calibrationStatus?.points_captured.includes('top_left')}
                  isCaptured={Boolean(calibrationStatus?.points_captured.includes('top_left'))}
                  onClick={() => motionApi.capturePoint('top_left')}
                />
                <CalibrationTarget
                  name="top_right"
                  label="Top-Right"
                  normX={0.82}
                  normY={0.18}
                  isTargetActive={calibrationStatus?.active_step === 3 && !calibrationStatus?.points_captured.includes('top_right')}
                  isCaptured={Boolean(calibrationStatus?.points_captured.includes('top_right'))}
                  onClick={() => motionApi.capturePoint('top_right')}
                />
                <CalibrationTarget
                  name="bottom_left"
                  label="Bottom-Left"
                  normX={0.18}
                  normY={0.82}
                  isTargetActive={calibrationStatus?.active_step === 3 && !calibrationStatus?.points_captured.includes('bottom_left')}
                  isCaptured={Boolean(calibrationStatus?.points_captured.includes('bottom_left'))}
                  onClick={() => motionApi.capturePoint('bottom_left')}
                />
                <CalibrationTarget
                  name="bottom_right"
                  label="Bottom-Right"
                  normX={0.82}
                  normY={0.82}
                  isTargetActive={calibrationStatus?.active_step === 3 && !calibrationStatus?.points_captured.includes('bottom_right')}
                  isCaptured={Boolean(calibrationStatus?.points_captured.includes('bottom_right'))}
                  onClick={() => motionApi.capturePoint('bottom_right')}
                />
                <CalibrationTarget
                  name="center"
                  label="Center"
                  normX={0.50}
                  normY={0.50}
                  isTargetActive={calibrationStatus?.active_step === 4}
                  isCaptured={Boolean(calibrationStatus?.points_captured.includes('center'))}
                  onClick={() => motionApi.capturePoint('center')}
                />
              </>
            )}

            {/* Offline View */}
            {!isStreaming && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-[#19101D] border border-[#FF2D95]/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,149,0.2)]">
                  <CameraOff className="w-10 h-10 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-white text-lg">
                    Motion Camera Offline
                  </h3>
                  <p className="text-xs font-subheading text-[#B8A9B8] max-w-md">
                    Start camera to begin hand calibration and test the virtual cursor engine.
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

          {/* Controls Bar */}
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

              {/* Camera selection */}
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (isStreaming) stopCamera();
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
            </div>

            {/* Navigation Tabs between Wizard, Playground & Settings */}
            <div className="flex items-center gap-1.5 bg-[#08060A] p-1 rounded-xl border border-[#2D1B36]">
              {(
                [
                  { id: 'WIZARD', label: 'Calibration Wizard' },
                  { id: 'PLAYGROUND', label: 'Playground' },
                  { id: 'SETTINGS', label: 'Tuning' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white shadow-[0_0_10px_#FF2D95]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: QUICK TELEMETRY & CALIBRATION OVERVIEW
        ========================================================================= */}
        <div className="space-y-4">
          {/* Real-Time Cursor Indicator Card */}
          <div className="p-6 rounded-3xl bg-[#120B14] border border-[#2D1B36] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D1B36] pb-3">
              <span className="text-xs font-mono text-[#FF78BD] font-bold">VIRTUAL CURSOR STATUS</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  cursor?.is_active
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {cursor?.is_active ? 'TRACKING' : 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Hand:</span>
                <span className="text-white font-bold">{cursor?.hand || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Norm Coordinates:</span>
                <span className="text-[#FF78BD]">
                  {cursor ? `(${cursor.x.toFixed(2)}, ${cursor.y.toFixed(2)})` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Screen Pixels:</span>
                <span className="text-white">
                  {cursor ? `${cursor.screen_x}x, ${cursor.screen_y}y` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Speed:</span>
                <span className="text-cyan-400 font-bold">
                  {cursor ? `${cursor.speed.toFixed(2)} n/s` : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pinch Trigger:</span>
                <span
                  className={`font-bold ${
                    cursor?.is_pressed ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                >
                  {cursor?.is_pressed ? 'PRESSED' : 'RELEASED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">FPS / Latency:</span>
                <span className="text-zinc-300">
                  {incomingFps} FPS • {latencyMs} ms
                </span>
              </div>
            </div>
          </div>

          {/* Calibration Profile Card */}
          <div className="p-6 rounded-3xl bg-[#120B14] border border-[#2D1B36] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D1B36] pb-3">
              <span className="text-xs font-mono text-zinc-400 font-bold">CALIBRATION BOUNDS</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  calibrationStatus?.is_calibrated
                    ? 'bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/40'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                }`}
              >
                {calibrationStatus?.is_calibrated ? 'ACTIVE' : 'UNCALIBRATED'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Box Width:</span>
                <span className="text-white font-bold">
                  {bounds ? `${(bounds.width * 100).toFixed(0)}%` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Box Height:</span>
                <span className="text-white font-bold">
                  {bounds ? `${(bounds.height * 100).toFixed(0)}%` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Captured Points:</span>
                <span className="text-[#FF78BD]">
                  {calibrationStatus?.points_captured.length || 0} / 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABBED SECTIONS: WIZARD, PLAYGROUND, OR SETTINGS
      ========================================================================= */}
      {activeTab === 'WIZARD' && (
        <CalibrationWizard
          hands={hands}
          status={calibrationStatus}
          onCalibrationChange={refreshCalibrationStatus}
        />
      )}

      {activeTab === 'PLAYGROUND' && (
        <MotionControlDashboard
          cursor={cursor}
          secondaryCursor={secondaryCursor}
          isCalibrated={Boolean(calibrationStatus?.is_calibrated)}
          fps={incomingFps}
          latencyMs={latencyMs}
        />
      )}

      {activeTab === 'SETTINGS' && (
        <ControlSettings
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onRecalibrate={() => setActiveTab('WIZARD')}
        />
      )}
    </div>
  );
};
