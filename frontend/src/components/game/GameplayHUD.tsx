/** Gameplay Heads-Up Display (HUD) (Module 06 - Section 11.C). */

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Timer, Flame, Pause, Activity, Wifi, Shield } from 'lucide-react';
import { GameEngineStateSnapshot } from '../../game-engine/GameEngine';

interface GameplayHUDProps {
  snapshot: GameEngineStateSnapshot;
  onPause: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({ snapshot, onPause }) => {
  const {
    score,
    lives,
    maxLives,
    level,
    remainingTime,
    timeProgress,
    combo,
    comboMultiplier,
    comboProgress,
    fps,
    isTrackingActive,
  } = snapshot;

  const seconds = Math.ceil(remainingTime);

  return (
    <div className="absolute inset-x-0 top-0 z-20 p-4 sm:p-6 pointer-events-none flex flex-col justify-between select-none">
      {/* Top Main Status Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Score & Multiplier */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#19101D]/90 border border-[#FF2D95]/40 backdrop-blur-md shadow-[0_0_20px_rgba(255,45,149,0.2)]">
            <span className="text-[10px] font-mono uppercase text-[#FF78BD] tracking-wider block">
              SCORE
            </span>
            <span className="text-2xl sm:text-3xl font-heading font-black text-white tracking-wider">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combo Multiplier Badge */}
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white shadow-[0_0_15px_#FF2D95] flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 fill-white" />
              <div className="text-xs font-heading font-black">
                {comboMultiplier}x
              </div>
            </motion.div>
          )}
        </div>

        {/* Center: Countdown Timer Bar */}
        <div className="hidden sm:flex flex-col items-center min-w-[180px]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white mb-1">
            <Timer className={`w-3.5 h-3.5 ${seconds <= 10 ? 'text-red-400 animate-pulse' : 'text-[#FF78BD]'}`} />
            <span className={seconds <= 10 ? 'text-red-400 font-black' : 'text-white'}>
              {seconds}s
            </span>
          </div>
          {/* Progress fill */}
          <div className="w-full h-2 rounded-full bg-[#08060A] border border-[#2D1B36] overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                seconds <= 10 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-gradient-to-r from-[#FF2D95] to-[#FF78BD]'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, timeProgress * 100))}%` }}
              transition={{ ease: 'linear', duration: 0.1 }}
            />
          </div>
        </div>

        {/* Right: Lives, Level & Pause */}
        <div className="flex items-center gap-3">
          {/* Lives Counter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#19101D]/90 border border-[#2D1B36] backdrop-blur-md">
            {Array.from({ length: maxLives }).map((_, idx) => {
              const isFilled = idx < lives;
              return (
                <Heart
                  key={idx}
                  className={`w-5 h-5 transition-all ${
                    isFilled
                      ? 'text-[#FF2D95] fill-[#FF2D95] shadow-[0_0_10px_#FF2D95]'
                      : 'text-zinc-600 fill-zinc-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Level Badge */}
          <div className="px-3 py-2 rounded-2xl bg-[#19101D]/90 border border-[#2D1B36] backdrop-blur-md text-center">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block">LVL</span>
            <span className="text-sm font-heading font-black text-[#FF78BD]">
              {level.levelNumber}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 rounded-2xl bg-[#19101D] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-all shadow-md active:scale-95"
            title="Pause Game (or form Closed Fist)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub-Bar: Combo streak progress & FPS/Tracking status */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        {/* Combo streak timer bar */}
        <div className="flex items-center gap-2">
          {combo > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#19101D]/80 border border-[#2D1B36]">
              <span className="text-white font-bold">{combo} STREAK</span>
              <div className="w-16 h-1.5 rounded-full bg-[#08060A] overflow-hidden">
                <div
                  className="h-full bg-[#FF2D95] rounded-full transition-all duration-75"
                  style={{ width: `${comboProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Real-time Tracking & FPS badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#08060A]/90 border border-[#2D1B36]">
            <Activity className="w-3 h-3 text-[#FF2D95]" />
            <span className="text-zinc-300 font-mono">{fps} FPS</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#08060A]/90 border border-[#2D1B36]">
            <Wifi className={`w-3 h-3 ${isTrackingActive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={isTrackingActive ? 'text-emerald-400' : 'text-amber-400'}>
              {isTrackingActive ? 'HAND SENSOR ACTIVE' : 'REACQUIRING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
