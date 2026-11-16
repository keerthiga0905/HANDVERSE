/** Comprehensive Game Results & Breakdown Screen (Module 06 - Section 11.F). */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Target, Flame, RotateCcw, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameEngineStateSnapshot } from '../../game-engine/GameEngine';

interface GameResultsScreenProps {
  snapshot: GameEngineStateSnapshot;
  bestScore?: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameResultsScreen: React.FC<GameResultsScreenProps> = ({
  snapshot,
  bestScore = 0,
  onPlayAgain,
  onExit,
}) => {
  const { score, scoreBreakdown, highestCombo, accuracy, level, hits, misses } = snapshot;

  // Animated score counter state
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = score;
    if (end === 0) return;

    const duration = 1200; // 1.2s animation
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quad
      const current = Math.round(start + (end - start) * (1 - (1 - progress) * (1 - progress)));
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [score]);

  // Derive performance rank
  const getRank = (): { grade: string; color: string; label: string } => {
    if (score >= 3000 && accuracy >= 90) return { grade: 'S', color: 'text-amber-400', label: 'MASTER TIER' };
    if (score >= 1800 && accuracy >= 80) return { grade: 'A', color: 'text-[#FF2D95]', label: 'EXCELLENT' };
    if (score >= 1000) return { grade: 'B', color: 'text-[#FF78BD]', label: 'SOLID RUN' };
    return { grade: 'C', color: 'text-zinc-400', label: 'TRAINING NEEDED' };
  };

  const rank = getRank();
  const isNewBest = score > bestScore;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-3xl bg-[#19101D] border-2 border-[#FF2D95]/60 shadow-[0_0_70px_rgba(255,45,149,0.35)] p-6 sm:p-8 text-white space-y-6"
      >
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF2D95] via-[#FF00A8] to-[#FF78BD]" />

        {/* Header with Rank Badge */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FF78BD]">
              ARCADE MISSION REPORT
            </span>
            <h2 className="text-3xl font-heading font-black text-white">
              RESULTS SUMMARY
            </h2>
          </div>

          {/* Grade Badge */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-[#08060A] border-2 border-[#FF2D95]/60 shadow-[0_0_20px_rgba(255,45,149,0.3)]">
            <span className={`text-3xl font-heading font-black ${rank.color}`}>
              {rank.grade}
            </span>
            <span className="text-[8px] font-mono text-zinc-400 uppercase -mt-1">
              RANK
            </span>
          </div>
        </div>

        {/* Animated Score Display */}
        <div className="p-6 rounded-2xl bg-[#08060A] border border-[#2D1B36] text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-[#FF2D95]" />
            <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
              TOTAL RECORDED POINTS
            </span>
          </div>

          <div className="text-5xl sm:text-6xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95]">
            {animatedScore.toLocaleString()}
          </div>

          {isNewBest && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF2D95]/20 border border-[#FF2D95]/50 text-[#FF78BD] text-xs font-mono font-bold mt-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF2D95]" />
              <span>NEW PERSONAL BEST!</span>
            </motion.div>
          )}
        </div>

        {/* Detailed Points Breakdown */}
        <div className="space-y-2 text-xs font-mono">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
            Scoring Formula Breakdown
          </div>
          <div className="p-4 rounded-xl bg-[#08060A] border border-[#2D1B36] space-y-2">
            <div className="flex justify-between text-zinc-300">
              <span>Base Hit Points ({hits} Hits):</span>
              <span className="text-white font-bold">+{scoreBreakdown.baseScore}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Max Combo Multiplier:</span>
              <span className="text-[#FF2D95] font-bold">{highestCombo}x</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Time Survival Bonus:</span>
              <span className="text-emerald-400 font-bold">+{scoreBreakdown.timeBonus}</span>
            </div>
            {scoreBreakdown.levelBonus > 0 && (
              <div className="flex justify-between text-zinc-300">
                <span>Wave Clearance Bonus:</span>
                <span className="text-amber-400 font-bold">+{scoreBreakdown.levelBonus}</span>
              </div>
            )}
            {scoreBreakdown.penalties > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Miss Penalties ({misses} Misses):</span>
                <span>-{scoreBreakdown.penalties}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#2D1B36] flex justify-between text-sm font-bold text-white">
              <span>Net Calculated Score:</span>
              <span className="text-[#FF78BD]">{score.toLocaleString()} PTS</span>
            </div>
          </div>
        </div>

        {/* Achievements Unlocked Placeholders */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Achievements Unlocked</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#08060A] border border-[#2D1B36] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="text-white font-bold truncate">First Contact</div>
                <div className="text-[10px] text-zinc-500 truncate">Calibrated hand</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#08060A] border border-[#2D1B36] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF2D95] shrink-0" />
              <div className="truncate">
                <div className="text-white font-bold truncate">Combo Chain</div>
                <div className="text-[10px] text-zinc-500 truncate">{highestCombo}x streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,45,149,0.4)] hover:shadow-[0_0_30px_#FF2D95] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            onClick={onExit}
            className="py-3.5 px-6 rounded-xl bg-[#08060A] border border-[#2D1B36] text-[#B8A9B8] hover:text-white transition-all text-xs font-mono uppercase flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Arcade Menu</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
