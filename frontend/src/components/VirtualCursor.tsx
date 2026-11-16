import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorState } from '../types/motion';
import { Lock, Sparkles } from 'lucide-react';

interface VirtualCursorProps {
  cursor: CursorState | null;
  secondaryCursor?: CursorState | null;
  width: number;
  height: number;
  showTrail?: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({
  cursor,
  secondaryCursor,
  width,
  height,
  showTrail = true,
}) => {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef<number>(0);

  // Update motion trail
  useEffect(() => {
    if (!cursor || !cursor.is_active || !showTrail) {
      if (trail.length > 0) setTrail([]);
      return;
    }

    const pxX = Math.round(cursor.x * width);
    const pxY = Math.round(cursor.y * height);

    trailIdRef.current += 1;
    setTrail((prev) => [
      ...prev.slice(-6),
      { x: pxX, y: pxY, id: trailIdRef.current },
    ]);
  }, [cursor?.x, cursor?.y, cursor?.is_active, width, height, showTrail]);

  if (!cursor || !cursor.is_active) {
    return null;
  }

  const posX = cursor.x * width;
  const posY = cursor.y * height;
  const isRight = cursor.hand === 'Right';
  const primaryColor = isRight ? '#FF2D95' : '#00E5FF';
  const glowColor = isRight ? 'rgba(255, 45, 149, 0.6)' : 'rgba(0, 229, 255, 0.6)';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {/* Motion Trail Dots */}
      {showTrail &&
        trail.map((pt, idx) => {
          const ratio = (idx + 1) / (trail.length + 1);
          const size = 4 + ratio * 8;
          return (
            <div
              key={pt.id}
              className="absolute rounded-full transition-opacity duration-300 pointer-events-none"
              style={{
                left: `${pt.x}px`,
                top: `${pt.y}px`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: primaryColor,
                opacity: ratio * 0.45,
                filter: `blur(${Math.max(1, 3 - idx * 0.4)}px)`,
              }}
            />
          );
        })}

      {/* Primary Virtual Cursor Reticle */}
      <div
        className="absolute transition-transform duration-75 ease-out"
        style={{
          left: `${posX}px`,
          top: `${posY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Click Expanding Ripple Wave */}
        {cursor.is_clicking && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute rounded-full border-2 pointer-events-none"
            style={{
              borderColor: primaryColor,
              boxShadow: `0 0 30px ${primaryColor}`,
              width: '48px',
              height: '48px',
              left: '-24px',
              top: '-24px',
            }}
          />
        )}

        {/* Outer Pulsing Reticle Ring */}
        <div
          className={`relative rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
            cursor.is_pressed
              ? 'w-14 h-14 bg-[#FF2D95]/30 scale-90'
              : cursor.is_clutched
              ? 'w-12 h-12 bg-amber-500/20 border-amber-400'
              : 'w-12 h-12 bg-[#08060A]/40'
          }`}
          style={{
            borderColor: cursor.is_clutched ? '#F59E0B' : primaryColor,
            boxShadow: `0 0 20px ${cursor.is_clutched ? 'rgba(245,158,11,0.5)' : glowColor}`,
          }}
        >
          {/* Inner Core Dot */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-transform duration-100 ${
              cursor.is_pressed ? 'scale-125' : 'scale-100'
            }`}
            style={{
              backgroundColor: cursor.is_clutched ? '#FBBF24' : primaryColor,
              boxShadow: `0 0 10px ${cursor.is_clutched ? '#FBBF24' : primaryColor}`,
            }}
          />

          {/* Crosshair Lines */}
          <div
            className="absolute -top-2 w-0.5 h-2"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -bottom-2 w-0.5 h-2"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -left-2 w-2 h-0.5"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -right-2 w-2 h-0.5"
            style={{ backgroundColor: primaryColor }}
          />

          {/* Clutch Lock Indicator */}
          {cursor.is_clutched && (
            <div className="absolute -top-5 flex items-center gap-1 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded-md shadow-lg">
              <Lock className="w-2.5 h-2.5" />
              <span>CLUTCH</span>
            </div>
          )}

          {/* Pinch Indicator Badge */}
          {cursor.is_pressed && (
            <div className="absolute -bottom-5 flex items-center gap-1 bg-[#19101D] border border-[#FF2D95] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md shadow-[0_0_10px_#FF2D95]">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              <span>PINCH</span>
            </div>
          )}
        </div>

        {/* Hand Identifier Pill */}
        <div
          className="absolute left-7 top-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase backdrop-blur-sm shadow-md"
          style={{
            backgroundColor: 'rgba(8, 6, 10, 0.85)',
            borderColor: primaryColor,
            color: primaryColor,
          }}
        >
          {cursor.hand === 'Right' ? 'R-HAND' : 'L-HAND'}
        </div>
      </div>

      {/* Secondary Cursor if both hands active */}
      {secondaryCursor && secondaryCursor.is_active && (
        <div
          className="absolute transition-transform duration-75 ease-out opacity-75"
          style={{
            left: `${secondaryCursor.x * width}px`,
            top: `${secondaryCursor.y * height}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-9 h-9 rounded-full border border-[#00E5FF] bg-[#00E5FF]/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
          </div>
          <div className="absolute left-5 top-0 text-[9px] font-mono text-[#00E5FF] bg-black/80 px-1 rounded border border-[#00E5FF]/40">
            {secondaryCursor.hand === 'Right' ? 'R' : 'L'}
          </div>
        </div>
      )}
    </div>
  );
};
