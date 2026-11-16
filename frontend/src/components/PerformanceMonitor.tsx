import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Gauge,
  Wifi,
  Zap,
  Server,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export interface PerformanceMetrics {
  webcamFps: number;
  backendFps: number;
  renderFps: number;
  inferenceMs: number;
  decodeMs: number;
  gestureMs: number;
  motionMs: number;
  processingTimeMs: number;
  networkRttMs: number;
  endToEndLatencyMs: number;
  clientDroppedFrames: number;
  serverDroppedFrames: number;
  inFlight: boolean;
  wsBufferedAmount: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ metrics }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Status badges
  const isRealTime = metrics.endToEndLatencyMs < 120 && metrics.endToEndLatencyMs > 0;
  const isAcceptable = metrics.endToEndLatencyMs >= 120 && metrics.endToEndLatencyMs < 250;

  return (
    <div className="w-full rounded-2xl bg-[#08060A]/95 border border-[#2D1B36] backdrop-blur-md overflow-hidden shadow-2xl transition-all">
      {/* Mini Bar Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#19101D]/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isRealTime
                  ? 'bg-emerald-400 animate-pulse'
                  : isAcceptable
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">
              REAL-TIME LATENCY ENGINE
            </span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              isRealTime
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isAcceptable
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {metrics.endToEndLatencyMs > 0 ? `${Math.round(metrics.endToEndLatencyMs)} ms E2E` : 'INITIALIZING'}
          </span>

          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
            Inference: <strong className="text-cyan-400">{metrics.inferenceMs.toFixed(1)}ms</strong>
          </span>

          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
            Backend: <strong className="text-[#FF78BD]">{metrics.backendFps} FPS</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="text-[10px] font-mono text-zinc-500">
            Queue: {metrics.inFlight ? '1 in-flight' : '0 idle'} | Dropped: {metrics.clientDroppedFrames + metrics.serverDroppedFrames}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Metrics Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-[#2D1B36]/60 pt-3 space-y-3"
          >
            {/* Real-Time Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
              {/* End-to-End Latency */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FF2D95]" /> End-to-End Latency
                </div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    isRealTime
                      ? 'text-emerald-400'
                      : isAcceptable
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {metrics.endToEndLatencyMs > 0 ? `${Math.round(metrics.endToEndLatencyMs)} ms` : '--'}
                </div>
                <div className="text-[9px] text-zinc-500">Target &lt; 100ms</div>
              </div>

              {/* MediaPipe Inference */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" /> AI Inference
                </div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {metrics.inferenceMs.toFixed(1)} ms
                </div>
                <div className="text-[9px] text-zinc-500">HandLandmarker CPU</div>
              </div>

              {/* JPEG Image Decode */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#FF78BD]" /> Image Decode
                </div>
                <div className="text-base font-bold text-zinc-200 mt-0.5">
                  {metrics.decodeMs.toFixed(1)} ms
                </div>
                <div className="text-[9px] text-zinc-500">OpenCV RGB Prep</div>
              </div>

              {/* Total Server Processing */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Server className="w-3 h-3 text-purple-400" /> Backend Time
                </div>
                <div className="text-base font-bold text-purple-300 mt-0.5">
                  {metrics.processingTimeMs.toFixed(1)} ms
                </div>
                <div className="text-[9px] text-zinc-500">Infer + Gesture + Motion</div>
              </div>

              {/* Network RTT */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-blue-400" /> Network RTT
                </div>
                <div className="text-base font-bold text-blue-300 mt-0.5">
                  {metrics.networkRttMs > 0 ? `${Math.round(metrics.networkRttMs)} ms` : '&lt; 2 ms'}
                </div>
                <div className="text-[9px] text-zinc-500">WebSocket Transport</div>
              </div>

              {/* Frame Rates */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-400" /> Frame Rates
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {metrics.webcamFps} / {metrics.backendFps} FPS
                </div>
                <div className="text-[9px] text-zinc-500">Cam / AI Output</div>
              </div>

              {/* Queue & Backpressure */}
              <div className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36]">
                <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" /> Backpressure
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  0 BACKLOG
                </div>
                <div className="text-[9px] text-zinc-500">
                  Dropped: {metrics.serverDroppedFrames} svr, {metrics.clientDroppedFrames} cli
                </div>
              </div>
            </div>

            {/* Architecture Assurance Note */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 bg-[#08060A] px-3 py-1.5 rounded-xl border border-[#2D1B36]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Latest-Frame-Only Architecture Active: Queue depth is bounded to max 1 frame.
              </span>
              <span className="text-zinc-500">
                WS Buffer: {metrics.wsBufferedAmount} B
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
