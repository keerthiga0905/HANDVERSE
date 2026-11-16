/** Animated Countdown Screen (Module 06 - Section 11.B). */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameCountdownScreenProps {
  countdownNumber: number | null; // 3, 2, 1, or 0 (0 = "GO!")
}

export const GameCountdownScreen: React.FC<GameCountdownScreenProps> = ({ countdownNumber }) => {
  if (countdownNumber === null) return null;

  const displayLabel = countdownNumber === 0 ? 'GO!' : countdownNumber.toString();

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLabel}
          initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
          animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
          exit={{ scale: 2.0, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative flex flex-col items-center"
        >
          {/* Outer glowing halo */}
          <div className="absolute w-48 h-48 rounded-full bg-[#FF2D95]/30 blur-3xl animate-pulse" />

          {/* Glowing Neon Digits */}
          <span
            className={`font-heading font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white via-[#FF78BD] to-[#FF00A8] drop-shadow-[0_0_40px_#FF2D95] ${
              countdownNumber === 0 ? 'text-8xl sm:text-9xl text-[#FF00A8]' : 'text-8xl sm:text-9xl'
            }`}
          >
            {displayLabel}
          </span>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-mono uppercase tracking-[0.3em] text-[#FF78BD] mt-4"
          >
            {countdownNumber === 0 ? 'MOTION SENSORS ENGAGED' : 'CALIBRATING HAND SENSORS...'}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
