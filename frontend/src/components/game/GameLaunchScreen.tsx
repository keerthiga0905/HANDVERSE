/** Game Launch Screen (Module 06 - Section 11.A). */

import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Trophy, Flame, Shield, Sparkles } from 'lucide-react';
import { Difficulty } from '../../game-engine/types';
import { GameRegistryEntry } from '../../game-engine/gameRegistry';

interface GameLaunchScreenProps {
  game: GameRegistryEntry;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  bestScore?: number;
  onStart: () => void;
  onBack: () => void;
}

export const GameLaunchScreen: React.FC<GameLaunchScreenProps> = ({
  game,
  selectedDifficulty,
  onSelectDifficulty,
  bestScore = 0,
  onStart,
  onBack,
}) => {
  const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Extreme'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full max-w-2xl mx-auto rounded-3xl bg-[#19101D] border-2 border-[#FF2D95]/40 shadow-[0_0_60px_rgba(255,45,149,0.25)] p-6 sm:p-10 text-white overflow-hidden"
    >
      {/* Neon Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF2D95] via-[#FF00A8] to-[#FF78BD]" />

      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08060A] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-colors text-xs font-mono uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Arcade Catalog</span>
        </button>

        {bestScore > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF2D95]/10 border border-[#FF2D95]/40 text-[#FF78BD] text-xs font-mono font-bold">
            <Trophy className="w-3.5 h-3.5 text-[#FF2D95]" />
            <span>BEST: {bestScore.toLocaleString()} PTS</span>
          </div>
        )}
      </div>

      {/* Game Title & Badge */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/30">
            {game.category}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            Control: <strong className="text-white">{game.controlType}</strong>
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95]">
          {game.title}
        </h1>
        <p className="text-sm font-subheading text-[#B8A9B8] leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8 space-y-3">
        <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#FF2D95]" />
          <span>Select Difficulty Level</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => onSelectDifficulty(diff)}
                className={`py-3 px-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#FF2D95]/20 border-[#FF2D95] text-white shadow-[0_0_15px_rgba(255,45,149,0.3)]'
                    : 'bg-[#08060A] border-[#2D1B36] text-[#B8A9B8] hover:border-[#FF2D95]/50 hover:text-white'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase">{diff}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {diff === 'Easy' && '5 Lives • 60s'}
                  {diff === 'Normal' && '3 Lives • 45s'}
                  {diff === 'Hard' && '2 Lives • 35s'}
                  {diff === 'Extreme' && '1 Life • 25s'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supported Gestures Pill list */}
      <div className="p-4 rounded-2xl bg-[#08060A] border border-[#2D1B36] mb-8 space-y-2">
        <div className="text-xs font-mono uppercase text-[#FF78BD] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF2D95]" />
          <span>Active Gesture Triggers</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {game.supportedGestures.map((g) => (
            <span
              key={g}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#19101D] border border-[#FF2D95]/20 text-zinc-300"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Play Action Button */}
      <button
        onClick={onStart}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF2D95] via-[#FF00A8] to-[#FF78BD] text-white font-heading font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(255,45,149,0.5)] hover:shadow-[0_0_45px_#FF2D95] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
      >
        <Play className="w-6 h-6 fill-white" />
        <span>INITIALIZE & PLAY NOW</span>
      </button>
    </motion.div>
  );
};
