/** Player Profile Page with cyber avatar, stats, achievement previews, and honest empty states. */

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Award,
  Clock,
  Flame,
  Gamepad2,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-contact',
    title: 'First Contact',
    description: 'Launch the HANDVERSE arcade for the first time.',
    icon: 'Sparkles',
    unlocked: true,
    unlockedAt: 'Module 02 Active',
  },
  {
    id: 'camera-pilot',
    title: 'Camera Calibrated',
    description: 'Stream webcam video inside the Gesture Lab.',
    icon: 'Shield',
    unlocked: true,
    unlockedAt: 'Verified in Lab',
  },
  {
    id: 'blade-master',
    title: 'Blade Virtuoso',
    description: 'Slice 100 fruits in Fruit Slice without missing a target.',
    icon: 'Trophy',
    unlocked: false,
  },
  {
    id: 'neon-sovereign',
    title: 'Neon Sovereign',
    description: 'Survive 3 minutes on Hard difficulty in Neon Dodge.',
    icon: 'Flame',
    unlocked: false,
  },
  {
    id: 'precision-pinch',
    title: 'Precision Specialist',
    description: 'Pop 50 bubbles in under 30 seconds in Pinch Pop.',
    icon: 'Award',
    unlocked: false,
  },
  {
    id: 'zen-archer',
    title: 'Zen Marksman',
    description: 'Hit 5 consecutive bullseyes in Hand Archery.',
    icon: 'Gamepad2',
    unlocked: false,
  },
];

export const ProfilePage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            PLAYER IDENTITY & RECORDS
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          Player Profile
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] max-w-2xl">
          Track lifetime motion gaming achievements, high scores, and arcade session logs.
        </p>
      </div>

      {/* =========================================================================
          PROFILE BANNER & IDENTITY CARD
      ========================================================================= */}
      <section className="relative rounded-3xl bg-[#19101D] border-2 border-[#FF2D95]/40 p-6 sm:p-8 shadow-[0_0_40px_rgba(255,45,149,0.2)] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF2D95]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar with glowing ring */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#120B14] border-2 border-[#FF2D95] shadow-[0_0_25px_#FF2D95] flex items-center justify-center">
              <User className="w-12 h-12 text-[#FF2D95]" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF00A8] text-white shadow-[0_0_10px_#FF00A8]">
              PILOT
            </span>
          </div>

          {/* User Details */}
          <div className="space-y-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Arcade Pilot #01
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/40 w-fit mx-auto sm:mx-0">
                Level 1 • Recruit
              </span>
            </div>
            <p className="text-xs font-mono text-[#B8A9B8]">
              Local SQLite Profile • Windows 11 Arcade Terminal
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HONEST STATS GRID (Empty States for Future Modules)
      ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-2 text-center">
          <span className="text-xs font-mono text-zinc-400 uppercase">Games Played</span>
          <div className="text-3xl sm:text-4xl font-heading font-black text-white">0</div>
          <p className="text-[11px] font-mono text-[#FF78BD]">Waiting for Module 04</p>
        </div>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-2 text-center">
          <span className="text-xs font-mono text-zinc-400 uppercase">High Score</span>
          <div className="text-3xl sm:text-4xl font-heading font-black text-white">--</div>
          <p className="text-[11px] font-mono text-[#B8A9B8]">No games completed</p>
        </div>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-2 text-center">
          <span className="text-xs font-mono text-zinc-400 uppercase">Favourite Game</span>
          <div className="text-sm sm:text-base font-heading font-bold text-white truncate pt-2">
            Fruit Slice
          </div>
          <p className="text-[11px] font-mono text-[#B8A9B8]">Most previewed</p>
        </div>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-2 text-center">
          <span className="text-xs font-mono text-zinc-400 uppercase">Achievements</span>
          <div className="text-3xl sm:text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FF78BD]">
            2 / 6
          </div>
          <p className="text-[11px] font-mono text-emerald-400">Foundation Ready</p>
        </div>
      </section>

      {/* =========================================================================
          ACHIEVEMENTS BADGE COLLECTION
      ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF2D95]" />
            <span>Arcade Achievements</span>
          </h3>
          <span className="text-xs font-mono text-zinc-400">2 UNLOCKED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-2xl bg-[#19101D] border p-5 flex items-start gap-4 transition-all ${
                ach.unlocked
                  ? 'border-[#FF2D95]/60 shadow-[0_0_20px_rgba(255,45,149,0.2)]'
                  : 'border-[#2D1B36] opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  ach.unlocked
                    ? 'bg-[#120B14] border border-[#FF2D95] text-[#FF2D95]'
                    : 'bg-[#120B14] border border-zinc-800 text-zinc-600'
                }`}
              >
                {ach.unlocked ? <Sparkles className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-white">{ach.title}</h4>
                  {ach.unlocked && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs font-subheading text-[#B8A9B8] leading-relaxed">
                  {ach.description}
                </p>
                {ach.unlockedAt && (
                  <p className="text-[10px] font-mono text-[#FF78BD] pt-1">{ach.unlockedAt}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          RECENT GAME HISTORY (Honest Empty State)
      ========================================================================= */}
      <section className="space-y-4">
        <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FF2D95]" />
          <span>Match History</span>
        </h3>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-8 text-center space-y-3">
          <Gamepad2 className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-heading font-bold text-white">No Matches Recorded Yet</h4>
          <p className="text-xs font-subheading text-[#B8A9B8] max-w-sm mx-auto">
            Arcade match history and high score tables will be logged locally in SQLite once gameplay starts in Module 04.
          </p>
          <button
            onClick={() => navigateTo('arcade')}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#FF2D95] hover:text-[#FF78BD] transition-colors pt-2"
          >
            <span>Explore Upcoming Games</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
