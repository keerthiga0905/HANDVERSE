import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Crosshair,
  Gauge,
  Sparkles,
  Lock,
  Trophy,
  RotateCcw,
  Hand,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { CursorState } from '../types/motion';

interface MotionControlDashboardProps {
  cursor: CursorState | null;
  secondaryCursor?: CursorState | null;
  isCalibrated: boolean;
  fps: number;
  latencyMs: number;
}

interface TargetItem {
  id: number;
  x: number; // 0.1 to 0.9
  y: number; // 0.1 to 0.9
  points: number;
  color: string;
}

export const MotionControlDashboard: React.FC<MotionControlDashboardProps> = ({
  cursor,
  secondaryCursor,
  isCalibrated,
  fps,
  latencyMs,
}) => {
  // Interactive Target Playground state
  const [targets, setTargets] = useState<TargetItem[]>([
    { id: 1, x: 0.25, y: 0.30, points: 100, color: '#FF2D95' },
    { id: 2, x: 0.75, y: 0.25, points: 150, color: '#00E5FF' },
    { id: 3, x: 0.50, y: 0.65, points: 200, color: '#FF00A8' },
    { id: 4, x: 0.20, y: 0.70, points: 120, color: '#FBBF24' },
    { id: 5, x: 0.80, y: 0.70, points: 180, color: '#10B981' },
  ]);
  const [score, setScore] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [poppedFeedback, setPoppedFeedback] = useState<string | null>(null);

  // Check collision between virtual cursor and targets when clicking/pinching
  useEffect(() => {
    if (!cursor || !cursor.is_active || (!cursor.is_clicking && !cursor.is_pressed)) {
      return;
    }

    const hitRadius = 0.08; // Normalized hit proximity threshold

    targets.forEach((tgt) => {
      const dist = Math.hypot(cursor.x - tgt.x, cursor.y - tgt.y);
      if (dist < hitRadius) {
        // Pop target!
        setScore((s) => s + tgt.points);
        setHits((h) => h + 1);
        setPoppedFeedback(`+${tgt.points} PINCH HIT!`);

        // Respawn target in a new random location
        setTargets((prev) =>
          prev.map((t) =>
            t.id === tgt.id
              ? {
                  ...t,
                  x: 0.15 + Math.random() * 0.70,
                  y: 0.15 + Math.random() * 0.70,
                }
              : t
          )
        );

        setTimeout(() => setPoppedFeedback(null), 900);
      }
    });
  }, [cursor?.is_clicking, cursor?.is_pressed, cursor?.x, cursor?.y, targets]);

  return (
    <div className="w-full space-y-6 rounded-3xl bg-[#120B14] border border-[#2D1B36] p-6 lg:p-8 shadow-[0_0_35px_rgba(255,45,149,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2D1B36] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF2D95]" />
            <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
              REAL-TIME CONTROL TELEMETRY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white mt-1">
            Motion Engine Telemetry & Playground
          </h2>
          <p className="text-xs font-subheading text-[#B8A9B8]">
            Sub-millisecond coordinate telemetry, velocity vectors, and interactive pinch-to-pop targets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#08060A] px-3.5 py-1.5 rounded-xl border border-[#2D1B36]">
            <span className="text-xs font-mono text-zinc-400">SCORE:</span>
            <span className="text-sm font-mono font-bold text-[#FF78BD]">{score}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#08060A] px-3.5 py-1.5 rounded-xl border border-[#2D1B36]">
            <span className="text-xs font-mono text-zinc-400">HITS:</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{hits}</span>
          </div>

          <button
            onClick={() => {
              setScore(0);
              setHits(0);
            }}
            className="p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-zinc-400 hover:text-white transition-colors"
            title="Reset Score"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telemetry Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Active Hand */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">ACTIVE HAND</span>
          <div className="text-sm font-heading font-black text-white mt-1 flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-[#FF2D95]" />
            <span>{cursor?.hand ? `${cursor.hand} Hand` : 'No Hand'}</span>
          </div>
        </div>

        {/* Normalized Coords */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">NORMALIZED (X, Y)</span>
          <div className="text-sm font-mono font-bold text-[#FF78BD] mt-1">
            {cursor ? `${cursor.x.toFixed(3)}, ${cursor.y.toFixed(3)}` : '0.000, 0.000'}
          </div>
        </div>

        {/* Mapped Screen Pixels */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">SCREEN PIXELS</span>
          <div className="text-sm font-mono font-bold text-white mt-1">
            {cursor ? `${cursor.screen_x}x, ${cursor.screen_y}y` : '0x, 0y'}
          </div>
        </div>

        {/* Speed & Velocity */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">SPEED / VELOCITY</span>
          <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
            {cursor ? `${cursor.speed.toFixed(2)} norm/s` : '0.00'}
          </div>
        </div>

        {/* Action / Click State */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">POINTER ACTION</span>
          <div
            className={`text-sm font-mono font-bold mt-1 ${
              cursor?.is_pressed
                ? 'text-amber-400 animate-pulse'
                : cursor?.is_clutched
                ? 'text-yellow-500'
                : 'text-zinc-400'
            }`}
          >
            {cursor?.is_clutched
              ? 'FIST CLUTCH'
              : cursor?.is_pressed
              ? 'PINCH PRESSED'
              : 'HOVERING'}
          </div>
        </div>

        {/* Calibration & Pipeline Health */}
        <div className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">CALIBRATION</span>
          <div className="text-sm font-mono font-bold mt-1">
            {isCalibrated ? (
              <span className="text-emerald-400">CALIBRATED</span>
            ) : (
              <span className="text-amber-400">DEFAULT</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Click Playground Target Arena */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2D95]" />
            PRECISION TARGET ARENA: Move cursor and PINCH to pop targets!
          </span>
          {poppedFeedback && (
            <span className="text-emerald-400 font-bold animate-bounce">
              {poppedFeedback}
            </span>
          )}
        </div>

        <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-[#08060A] border-2 border-[#2D1B36] overflow-hidden">
          {/* Subtle Gridlines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#19101D_1px,transparent_1px),linear-gradient(to_bottom,#19101D_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

          {/* Floating Targets */}
          {targets.map((tgt) => (
            <motion.div
              key={tgt.id}
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2 + tgt.id * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center justify-center pointer-events-auto"
              style={{
                left: `${tgt.x * 100}%`,
                top: `${tgt.y * 100}%`,
              }}
            >
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs shadow-lg transition-transform hover:scale-110"
                style={{
                  borderColor: tgt.color,
                  backgroundColor: `${tgt.color}22`,
                  boxShadow: `0 0 20px ${tgt.color}66`,
                  color: tgt.color,
                }}
              >
                {tgt.points}
              </div>
            </motion.div>
          ))}

          {/* Mirrored Cursor Echo in Playground */}
          {cursor && cursor.is_active && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-transform duration-75"
              style={{
                left: `${cursor.x * 100}%`,
                top: `${cursor.y * 100}%`,
              }}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  cursor.is_pressed
                    ? 'border-white bg-[#FF2D95] scale-125 shadow-[0_0_25px_#FF2D95]'
                    : 'border-[#FF2D95] bg-[#FF2D95]/20 shadow-[0_0_15px_#FF2D95]'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
