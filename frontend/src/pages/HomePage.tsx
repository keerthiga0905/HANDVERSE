/** Home / Landing page with hero banner, 3D hand visual, feature cards, and honest stats. */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  BookOpen,
  Sparkles,
  Camera,
  Cpu,
  Layers,
  ArrowRight,
  Hand,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const HomePage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="relative z-10 w-full min-h-screen pb-20">
      {/* =========================================================================
          HERO SECTION
      ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#19101D] border border-[#FF2D95]/40 text-xs sm:text-sm font-mono text-[#FF78BD] shadow-[0_0_20px_rgba(255,45,149,0.2)] mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#FF2D95] animate-pulse" />
          <span>WEB-BASED MOTION GAMING PLATFORM</span>
        </motion.div>

        {/* Large Brand Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black font-heading tracking-tight text-white mb-6 drop-shadow-[0_0_35px_rgba(255,45,149,0.5)]"
        >
          HAND<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF78BD] via-[#FF2D95] to-[#FF00A8]">VERSE</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-3xl font-subheading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95] tracking-wider max-w-3xl mb-8"
        >
          YOUR HANDS. YOUR MOVES. YOUR ARCADE.
        </motion.p>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm sm:text-base text-[#B8A9B8] font-subheading max-w-2xl leading-relaxed mb-10"
        >
          Experience zero-latency webcam gesture gaming directly inside your browser. No extra sensors, no downloads, and zero physical controllers required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => navigateTo('arcade')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-base tracking-wider uppercase shadow-[0_0_30px_rgba(255,45,149,0.6)] hover:shadow-[0_0_45px_#FF2D95] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Gamepad2 className="w-5 h-5" />
            <span>EXPLORE GAMES</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigateTo('tutorial')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#19101D] border border-[#FF2D95]/40 hover:border-[#FF2D95] text-white font-subheading font-bold text-base tracking-wider uppercase hover:bg-[#19101D]/80 hover:shadow-[0_0_20px_rgba(255,45,149,0.25)] transition-all flex items-center justify-center gap-3"
          >
            <BookOpen className="w-5 h-5 text-[#FF78BD]" />
            <span>HOW TO PLAY</span>
          </button>
        </motion.div>

        {/* Animated Hand Visual Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-4xl relative rounded-3xl bg-gradient-to-b from-[#19101D] to-[#120B14] border-2 border-[#FF2D95]/40 p-6 sm:p-10 shadow-[0_0_60px_rgba(255,45,149,0.25)] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF2D95]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FF00A8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-4 max-w-md">
              <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider px-3 py-1 rounded bg-[#FF2D95]/10 border border-[#FF2D95]/30">
                CYBERNETIC VISION STACK
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Forget keyboards. Forget controllers. Just move your hands and play.
              </h2>
              <p className="text-sm font-subheading text-[#B8A9B8]">
                Every flick, slash, pinch, and swipe translates instantaneously into reactive arcade physics powered by MediaPipe keypoint detection.
              </p>
              <button
                onClick={() => navigateTo('gesture-lab')}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[#FF2D95] hover:text-[#FF78BD] transition-colors"
              >
                Launch Gesture Lab Camera Test <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Glowing Hand Tracking Schematic Graphic */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-[#08060A] border border-[#2D1B36] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-arcade-grid opacity-40" />
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 w-44 h-44 rounded-full border-2 border-[#FF2D95] border-dashed flex items-center justify-center shadow-[0_0_30px_rgba(255,45,149,0.4)]"
              >
                <Hand className="w-24 h-24 text-[#FF2D95] drop-shadow-[0_0_20px_#FF2D95]" />
                {/* Simulated tracking landmark points */}
                <span className="absolute top-4 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#FF00A8]" />
                <span className="absolute top-12 left-10 w-2.5 h-2.5 rounded-full bg-[#FF78BD] shadow-[0_0_8px_#FF00A8]" />
                <span className="absolute top-12 right-10 w-2.5 h-2.5 rounded-full bg-[#FF78BD] shadow-[0_0_8px_#FF00A8]" />
                <span className="absolute bottom-8 left-14 w-2 h-2 rounded-full bg-[#FF2D95]" />
                <span className="absolute bottom-8 right-14 w-2 h-2 rounded-full bg-[#FF2D95]" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          FEATURE CARDS SECTION
      ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FF78BD]">
            ARCADE CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white mt-2">
            Engineered For Pure Immersion
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] p-8 shadow-[0_8px_32px_rgb(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,45,149,0.3)] transition-all">
            <div className="w-14 h-14 rounded-xl bg-[#120B14] border border-[#FF2D95]/60 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,45,149,0.3)]">
              <Camera className="w-7 h-7 text-[#FF2D95]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white mb-3">
              1. Real-Time Hand Tracking
            </h3>
            <p className="text-sm font-subheading text-[#B8A9B8] leading-relaxed">
              Extracts 21 3D hand landmarks per frame with low jitter. Operates natively using standard laptop or desktop webcams at up to 60 FPS.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] p-8 shadow-[0_8px_32px_rgb(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,45,149,0.3)] transition-all">
            <div className="w-14 h-14 rounded-xl bg-[#120B14] border border-[#FF00A8]/60 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,0,168,0.3)]">
              <Zap className="w-7 h-7 text-[#FF00A8]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white mb-3">
              2. Gesture-Powered Gameplay
            </h3>
            <p className="text-sm font-subheading text-[#B8A9B8] leading-relaxed">
              Supports continuous velocity slashes, two-hand tension draws, precision pinch triggers, and palm deflection paddles across diverse game genres.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] p-8 shadow-[0_8px_32px_rgb(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,45,149,0.3)] transition-all">
            <div className="w-14 h-14 rounded-xl bg-[#120B14] border border-[#FF78BD]/60 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,120,189,0.3)]">
              <Layers className="w-7 h-7 text-[#FF78BD]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white mb-3">
              3. Multiple Arcade Games
            </h3>
            <p className="text-sm font-subheading text-[#B8A9B8] leading-relaxed">
              A curated catalog of 10 motion-controlled titles ranging from fast-paced action slicing to spatial puzzles and air drawing challenges.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HONEST STATS SECTION (No fake metrics)
      ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl bg-[#120B14] border border-[#2D1B36] p-8 sm:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FF78BD]">
                10
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#B8A9B8] uppercase">
                Planned Games
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#FF78BD] to-[#FF2D95]">
                7
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#B8A9B8] uppercase">
                Gesture Types
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D95] to-[#FF00A8]">
                60
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#B8A9B8] uppercase">
                Target FPS
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-heading text-white">
                0
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#B8A9B8] uppercase">
                Hardware Required
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
