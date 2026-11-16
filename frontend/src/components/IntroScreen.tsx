/** Loading and Intro Screen with neon animations, glowing rings, glitch logo and progress bar. */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gamepad2, ArrowRight } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Rapid initial progress, smooth completion in ~1.8 seconds
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(100, prev + step);
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08060A] text-white overflow-hidden px-4"
      >
        {/* Background pulsing concentric neon rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.15, 0.35, 0.15],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full border border-[#FF2D95]/30 shadow-[0_0_80px_rgba(255,45,149,0.2)]"
          />
          <motion.div
            animate={{
              scale: [1.2, 0.95, 1.2],
              opacity: [0.2, 0.45, 0.2],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full border border-[#FF00A8]/40 border-dashed"
          />
          <motion.div
            animate={{
              scale: [0.8, 1.1, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] rounded-full bg-gradient-radial from-[#FF2D95]/20 to-transparent blur-2xl"
          />
        </div>

        {/* Center content container */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
          {/* Logo icon with hot pink glow badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            className="relative mb-6"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#19101D] border-2 border-[#FF2D95] shadow-[0_0_30px_#FF2D95] flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#FF2D95]" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF00A8] flex items-center justify-center shadow-[0_0_15px_#FF00A8]"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>

          {/* Glitch-inspired glowing title */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95] font-heading drop-shadow-[0_0_20px_rgba(255,45,149,0.7)]">
              HANDVERSE
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm sm:text-base font-subheading font-medium tracking-widest text-[#B8A9B8] uppercase"
          >
            Your Hands. Your Moves. Your Arcade.
          </motion.p>

          {/* Progress bar container */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 w-full"
          >
            <div className="flex justify-between items-center text-xs font-mono text-[#FF78BD] mb-2 px-1">
              <span>SYSTEM BOOT</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-[#120B14] rounded-full overflow-hidden p-0.5 border border-[#FF2D95]/30">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] shadow-[0_0_12px_#FF2D95]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-xs font-mono text-zinc-500">
              {progress < 40 && 'Initializing Vision Core & MediaPipe...'}
              {progress >= 40 && progress < 80 && 'Loading Arcade Shaders & Audio Buffers...'}
              {progress >= 80 && 'Synthesizing Neural Gesture Pipeline...'}
            </p>
          </motion.div>

          {/* Quick Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onComplete}
            className="mt-8 inline-flex items-center gap-2 text-xs font-mono text-[#B8A9B8] hover:text-[#FF2D95] transition-colors py-1 px-3 rounded-lg border border-zinc-800 hover:border-[#FF2D95]/40"
          >
            Skip Intro <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
