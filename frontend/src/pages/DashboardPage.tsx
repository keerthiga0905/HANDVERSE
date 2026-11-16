/** Premium Gaming Dashboard with featured game banner, categories, and system overview. */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Play,
  Sparkles,
  ArrowRight,
  Camera,
  Trophy,
  User,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Game } from '../types';
import { ApiService } from '../services/api';
import { useNavigation } from '../context/NavigationContext';
import { useBackend } from '../context/BackendContext';
import { GameCardItem } from '../components/GameCardItem';

export const DashboardPage: React.FC = () => {
  const { navigateTo, openGameModal } = useNavigation();
  const { isConnected, health } = useBackend();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getGames()
      .then((data) => setGames(data.games))
      .catch((err) => console.error('Failed to load games:', err))
      .finally(() => setLoading(false));
  }, []);

  const featuredGame = games.find((g) => g.id === 'fruit-slice') || games[0];

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* =========================================================================
          WELCOME HERO / FEATURED GAME BANNER
      ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-r from-[#19101D] via-[#150D19] to-[#251027] border-2 border-[#FF2D95]/40 p-6 sm:p-10 shadow-[0_0_50px_rgba(255,45,149,0.25)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF2D95]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF2D95]" />
                FEATURED SPOTLIGHT
              </span>
              <span className="text-xs font-mono text-zinc-400">MODULE 04 ROADMAP</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
              {featuredGame ? featuredGame.title : 'Fruit Slice'}
            </h1>

            <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] leading-relaxed">
              {featuredGame
                ? featuredGame.description
                : 'Experience lightning-fast motion slashing. Slice high-velocity targets mid-air with pure finger tracking.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => featuredGame && openGameModal(featuredGame.id)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(255,45,149,0.5)] hover:shadow-[0_0_35px_#FF2D95] transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Coming Soon (Details)</span>
              </button>

              <button
                onClick={() => navigateTo('gesture-lab')}
                className="px-6 py-3 rounded-xl bg-[#120B14] border border-[#2D1B36] hover:border-[#FF2D95] text-white font-subheading font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#FF78BD]" />
                <span>Test Camera Stream</span>
              </button>
            </div>
          </div>

          {/* Quick Player Profile Preview Card */}
          <div className="w-full lg:w-80 rounded-2xl bg-[#08060A]/80 border border-[#2D1B36] p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#19101D] border-2 border-[#FF2D95] flex items-center justify-center shadow-[0_0_15px_#FF2D95]">
                <User className="w-6 h-6 text-[#FF2D95]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-base">Arcade Pilot</h3>
                <span className="text-xs font-mono text-[#FF78BD]">Level 1 • Ready</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#120B14] border border-[#2D1B36]">
                <div className="text-zinc-400">GAMES</div>
                <div className="text-white font-bold text-sm mt-0.5">10 Planned</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#120B14] border border-[#2D1B36]">
                <div className="text-zinc-400">BACKEND</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">
                  {isConnected ? 'ONLINE' : 'SYNCING'}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('profile')}
              className="w-full py-2 rounded-lg bg-[#19101D] hover:bg-[#FF2D95]/20 text-xs font-mono text-[#B8A9B8] hover:text-white border border-[#2D1B36] transition-colors"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ARCADE GAME LIBRARY PREVIEW
      ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
              Arcade Game Library
            </h2>
            <p className="text-xs sm:text-sm font-subheading text-[#B8A9B8]">
              Browse 10 gesture-controlled arcade titles built for web browser execution.
            </p>
          </div>

          <button
            onClick={() => navigateTo('arcade')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-[#FF2D95] hover:text-[#FF78BD] transition-colors"
          >
            <span>View All Games</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Featured Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-500 font-mono">
              Loading arcade library from backend...
            </div>
          ) : (
            games.slice(0, 4).map((game) => <GameCardItem key={game.id} game={game} />)
          )}
        </div>
      </section>

      {/* =========================================================================
          QUICK SHORTCUTS & SYSTEM DIAGNOSTICS
      ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tutorial Shortcut */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF2D95]/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#FF2D95]" />
            </div>
            <h3 className="font-heading font-bold text-white text-lg">Gesture Tutorial</h3>
            <p className="text-xs font-subheading text-[#B8A9B8]">
              Master open palms, closed fists, pinches, and swipe gestures before entering matches.
            </p>
          </div>
          <button
            onClick={() => navigateTo('tutorial')}
            className="mt-6 w-full py-2.5 rounded-xl bg-[#120B14] hover:bg-[#FF2D95]/20 border border-[#2D1B36] hover:border-[#FF2D95]/50 text-xs font-mono text-white transition-all"
          >
            Open Gesture Guide
          </button>
        </div>

        {/* Gesture Lab Shortcut */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF00A8]/40 flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#FF00A8]" />
            </div>
            <h3 className="font-heading font-bold text-white text-lg">Webcam Gesture Lab</h3>
            <p className="text-xs font-subheading text-[#B8A9B8]">
              Test your browser camera stream, verify frame rates, and adjust lighting alignment.
            </p>
          </div>
          <button
            onClick={() => navigateTo('gesture-lab')}
            className="mt-6 w-full py-2.5 rounded-xl bg-[#120B14] hover:bg-[#FF00A8]/20 border border-[#2D1B36] hover:border-[#FF00A8]/50 text-xs font-mono text-white transition-all"
          >
            Launch Camera Test
          </button>
        </div>

        {/* System Diagnostics */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF78BD]/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#FF78BD]" />
            </div>
            <h3 className="font-heading font-bold text-white text-lg">Engine Diagnostics</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>FastAPI Service:</span>
                <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isConnected ? 'ONLINE (8000)' : 'SYNCING'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Vite Client:</span>
                <span className="text-emerald-400">ONLINE (5173)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Target Pipeline:</span>
                <span className="text-[#FF78BD]">60 FPS Vision</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigateTo('settings')}
            className="mt-6 w-full py-2.5 rounded-xl bg-[#120B14] hover:bg-[#FF78BD]/20 border border-[#2D1B36] hover:border-[#FF78BD]/50 text-xs font-mono text-white transition-all"
          >
            Manage Settings
          </button>
        </div>
      </section>
    </div>
  );
};
