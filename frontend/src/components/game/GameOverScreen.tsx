/** Game Over Screen (Module 06 - Section 11.E). */

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Award, Trophy, Timer, Flame, Target } from 'lucide-react';
import { GameEngineStateSnapshot } from '../../game-engine/GameEngine';

interface GameOverScreenProps {
  snapshot: GameEngineStateSnapshot;
  onPlayAgain: () => void;
  onViewResults: () => void;
  onExit: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  snapshot,
  onPlayAgain,
  onViewResults,
  onExit,
}) => {
  const { score, highestCombo, accuracy, level } = snapshot;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        className="relative w-full max-w-md rounded-3xl bg-[#19101D] border-2 border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.3)] p-6 sm:p-8 text-center text-white overflow-hidden space-y-6"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-[#FF2D95] to-[#FF00A8]" />

        {/* Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-400">
            SESSION TERMINATED
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-300 to-red-500 tracking-wider">
            GAME OVER
          </h2>
        </div>

        {/* Score Showcase */}
        <div className="py-4 px-6 rounded-2xl bg-[#08060A] border border-[#2D1B36] space-y-1">
          <span className="text-xs font-mono uppercase text-[#FF78BD]">
            FINAL SCORE
          </span>
          <div className="text-4xl sm:text-5xl font-heading font-black text-white">
            {score.toLocaleString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-[#08060A] border border-[#2D1B36]">
            <Flame className="w-4 h-4 text-[#FF2D95] mx-auto mb-1" />
            <div className="text-[10px] font-mono text-zinc-400 uppercase">MAX COMBO</div>
            <div className="text-base font-heading font-black text-white">{highestCombo}x</div>
          </div>

          <div className="p-3 rounded-xl bg-[#08060A] border border-[#2D1B36]">
            <Target className="w-4 h-4 text-[#FF78BD] mx-auto mb-1" />
            <div className="text-[10px] font-mono text-zinc-400 uppercase">ACCURACY</div>
            <div className="text-base font-heading font-black text-white">{accuracy}%</div>
          </div>

          <div className="p-3 rounded-xl bg-[#08060A] border border-[#2D1B36]">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[10px] font-mono text-zinc-400 uppercase">WAVE</div>
            <div className="text-base font-heading font-black text-white">{level.levelNumber}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onViewResults}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,45,149,0.4)] hover:shadow-[0_0_30px_#FF2D95] transition-all flex items-center justify-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>View Score Breakdown</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPlayAgain}
              className="py-3 px-3 rounded-xl bg-[#08060A] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-all text-xs font-mono uppercase flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>

            <button
              onClick={onExit}
              className="py-3 px-3 rounded-xl bg-[#08060A] border border-[#2D1B36] text-zinc-400 hover:text-white transition-all text-xs font-mono uppercase flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Arcade Menu</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
