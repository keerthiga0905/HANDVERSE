/** Pause Menu Overlay (Module 06 - Section 11.D). */

import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Home, Hand } from 'lucide-react';

interface GamePauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GamePauseOverlay: React.FC<GamePauseOverlayProps> = ({
  onResume,
  onRestart,
  onExit,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="w-full max-w-sm rounded-3xl bg-[#19101D] border-2 border-[#FF2D95]/50 shadow-[0_0_50px_rgba(255,45,149,0.3)] p-6 sm:p-8 text-center text-white space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95] tracking-wider">
            GAME PAUSED
          </h2>
          <p className="text-xs font-mono text-[#B8A9B8]">
            Motion engine suspended
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,45,149,0.4)] hover:shadow-[0_0_30px_#FF2D95] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-[#08060A] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-all text-xs font-mono uppercase flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Wave</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-3 px-4 rounded-xl bg-[#08060A] border border-[#2D1B36] text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-all text-xs font-mono uppercase flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Exit to Arcade</span>
          </button>
        </div>

        {/* Hand gesture reminder */}
        <div className="pt-2 border-t border-[#2D1B36] flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
          <Hand className="w-3.5 h-3.5 text-[#FF2D95]" />
          <span>Form a <strong>Closed Fist</strong> to Resume</span>
        </div>
      </motion.div>
    </div>
  );
};
