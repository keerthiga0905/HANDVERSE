/** Right-sidebar telemetry dashboard for real-time tracking metrics, finger states, and gesture recognition. */

import React from 'react';
import {
  Activity,
  Hand,
  Wifi,
  WifiOff,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { HandDetection } from '../types/tracking';

interface TrackingMetricsPanelProps {
  hands: HandDetection[];
  handsDetected: number;
  trackingStatus: string;
  twoHandGesture?: string | null;
  latencyMs: number;
  fps: number;
  wsConnected: boolean;
  cameraActive: boolean;
  activeDeviceLabel: string;
  onOpenSettings?: () => void;
}

export const TrackingMetricsPanel: React.FC<TrackingMetricsPanelProps> = ({
  hands,
  handsDetected,
  trackingStatus,
  twoHandGesture,
  latencyMs,
  fps,
  wsConnected,
  cameraActive,
  activeDeviceLabel,
  onOpenSettings,
}) => {
  const rightHand = hands.find((h) => h.handedness === 'Right');
  const leftHand = hands.find((h) => h.handedness === 'Left');
  const activeHand = rightHand || leftHand || (hands.length > 0 ? hands[0] : null);

  const fingerOrder = ['thumb', 'index', 'middle', 'ring', 'little'];

  return (
    <div className="space-y-4">
      {/* 1. Primary Recognized Gesture Display Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#19101D] to-[#251027] border-2 border-[#FF2D95]/60 p-5 shadow-[0_0_25px_rgba(255,45,149,0.25)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2D95]" />
            CURRENT GESTURE
          </span>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
              wsConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{wsConnected ? 'AI ENGINE ACTIVE' : 'WS OFFLINE'}</span>
          </div>
        </div>

        {/* Large Gesture Label */}
        <div className="pt-1">
          <div className="text-2xl sm:text-3xl font-heading font-black text-white truncate">
            {twoHandGesture
              ? twoHandGesture.replace(/_/g, ' ')
              : activeHand && activeHand.primary_gesture !== 'NONE'
              ? activeHand.primary_gesture.replace(/_/g, ' ')
              : handsDetected > 0
              ? 'HAND DETECTED'
              : 'WAITING FOR HAND'}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono text-[#B8A9B8]">
            <span>
              HAND: <strong className="text-white">{activeHand ? activeHand.handedness.toUpperCase() : '--'}</strong>
            </span>
            <span>
              CONF: <strong className="text-[#FF78BD]">{activeHand ? `${Math.round(activeHand.gesture_confidence * 100)}%` : '--'}</strong>
            </span>
          </div>
        </div>

        {/* Two-Hand Banner if active */}
        {twoHandGesture && (
          <div className="p-2 rounded-xl bg-[#FF2D95]/15 border border-[#FF2D95] text-xs font-mono text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF2D95] animate-pulse" />
            <span>COOPERATIVE: {twoHandGesture.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      {/* 2. Finger Extension Status Matrix */}
      <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>FINGER STATES ({activeHand ? activeHand.handedness : 'NONE'})</span>
          <span>{handsDetected} HAND(S)</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {fingerOrder.map((fName) => {
            const isExt = activeHand?.finger_states?.[fName] === 'EXTENDED';
            return (
              <div
                key={fName}
                className={`p-2 rounded-xl border transition-all ${
                  isExt
                    ? 'bg-[#FF2D95]/20 border-[#FF2D95] text-white shadow-[0_0_10px_rgba(255,45,149,0.3)]'
                    : 'bg-[#120B14] border-[#2D1B36] text-zinc-500'
                }`}
              >
                <div className="text-[10px] font-mono uppercase truncate">{fName.slice(0, 3)}</div>
                <div className={`text-[10px] font-bold mt-0.5 ${isExt ? 'text-[#FF78BD]' : 'text-zinc-600'}`}>
                  {isExt ? 'EXT' : 'FOLD'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pinch Status & Strength Meter */}
      <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#FF2D95]" />
            PINCH STATUS
          </span>
          <span className={activeHand?.is_pinching ? 'text-[#FF2D95] font-bold' : 'text-zinc-500'}>
            {activeHand?.is_pinching ? 'PINCH ACTIVE' : 'RELEASED'}
          </span>
        </div>

        {/* Pinch Strength Bar */}
        <div className="h-2 w-full bg-[#120B14] rounded-full overflow-hidden p-0.5 border border-[#2D1B36]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] transition-all duration-75 shadow-[0_0_10px_#FF2D95]"
            style={{ width: `${(activeHand?.pinch_strength || 0) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>DISTANCE: {activeHand?.pinch_distance?.toFixed(2) ?? '--'}</span>
          <span>STRENGTH: {Math.round((activeHand?.pinch_strength || 0) * 100)}%</span>
        </div>
      </div>

      {/* 4. Left vs Right Dual Hand Detection Mini-Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className={`p-3 rounded-xl border ${
          rightHand
            ? 'bg-[#19101D] border-[#FF2D95]'
            : 'bg-[#120B14] border-[#2D1B36] opacity-60'
        }`}>
          <div className="text-[10px] text-[#FF78BD]">RIGHT HAND</div>
          <div className="font-bold text-white truncate mt-0.5">
            {rightHand ? rightHand.primary_gesture.replace(/_/g, ' ') : 'OFFLINE'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {rightHand ? `${Math.round(rightHand.gesture_confidence * 100)}%` : '--'}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${
          leftHand
            ? 'bg-[#19101D] border-[#00E5FF]'
            : 'bg-[#120B14] border-[#2D1B36] opacity-60'
        }`}>
          <div className="text-[10px] text-[#38BDF8]">LEFT HAND</div>
          <div className="font-bold text-white truncate mt-0.5">
            {leftHand ? leftHand.primary_gesture.replace(/_/g, ' ') : 'OFFLINE'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {leftHand ? `${Math.round(leftHand.gesture_confidence * 100)}%` : '--'}
          </div>
        </div>
      </div>

      {/* 5. Performance Diagnostics & Quick Sensitivity Link */}
      <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-4 space-y-2 text-xs font-mono">
        <div className="flex justify-between text-zinc-400">
          <span>Inference Latency:</span>
          <span className="text-[#FF78BD] font-bold">{latencyMs > 0 ? `${latencyMs} ms` : '--'}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Stream Framerate:</span>
          <span className="text-white font-bold">{fps} FPS</span>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full mt-2 py-2 rounded-xl bg-[#120B14] hover:bg-[#FF2D95]/20 border border-[#2D1B36] hover:border-[#FF2D95] text-xs font-mono text-[#FF78BD] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Tune Sensitivity Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
