/** Visual Tutorial and Gesture Guide Page with animated demonstrations. */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hand,
  BookOpen,
  Camera,
  Sun,
  Maximize2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface GestureTutorial {
  id: string;
  name: string;
  category: string;
  description: string;
  howToPerform: string;
  usedInGames: string[];
  animationType: 'pulse' | 'pinch' | 'swipe-left' | 'swipe-right' | 'point' | 'fist' | 'two-hand';
}

const GESTURES: GestureTutorial[] = [
  {
    id: 'open-palm',
    name: 'Open Palm',
    category: 'Steering & Deflection',
    description: 'Keep all five fingers extended facing towards the webcam. Acts as an interactive cyber shield or paddle.',
    howToPerform: 'Hold your hand open 2 feet in front of your camera with fingers naturally spread.',
    usedInGames: ['Neon Dodge', 'Hand Tennis', 'Gem Catcher'],
    animationType: 'pulse',
  },
  {
    id: 'closed-fist',
    name: 'Closed Fist',
    category: 'Power & Braking',
    description: 'Curl all fingers firmly inward into a fist. Used for hard stops, charging ultimate abilities, or firing cannons.',
    howToPerform: 'Close your fingers into a ball with knuckles aligned towards the lens.',
    usedInGames: ['Space Blaster', 'Gesture Memory Master'],
    animationType: 'fist',
  },
  {
    id: 'index-pointing',
    name: 'Index Pointing',
    category: 'Precision Aiming & Slicing',
    description: 'Extend only your index finger while curling remaining fingers. The tip serves as an ultra-precise crosshair or brush.',
    howToPerform: 'Point index finger upward or forward, tracking your motion across the camera frame.',
    usedInGames: ['Fruit Slice', 'Air Paint Challenge', 'Hand Maze Escape'],
    animationType: 'point',
  },
  {
    id: 'pinch',
    name: 'Pinch (Thumb & Index)',
    category: 'Micro-Interactions',
    description: 'Bring the tips of your thumb and index finger together until they touch, then release to register a digital click.',
    howToPerform: 'Pinch fingertips within 20mm distance to trigger bubble pops or select items.',
    usedInGames: ['Pinch Pop', 'Arcade Menu UI'],
    animationType: 'pinch',
  },
  {
    id: 'two-hand',
    name: 'Two-Hand Gesture',
    category: 'Dual Coordination',
    description: 'Engage both left and right hands simultaneously in the camera viewport for spatial depth actions.',
    howToPerform: 'Raise both hands in front of the camera, aligning spatial distance between them.',
    usedInGames: ['Hand Archery', 'Dual Blaster'],
    animationType: 'two-hand',
  },
  {
    id: 'swipe-left',
    name: 'Swipe Left',
    category: 'Kinetic Movement',
    description: 'Swiftly propel your hand horizontally from right to left across the field of view.',
    howToPerform: 'Accelerate hand leftward with rapid velocity (above 1.2 m/s).',
    usedInGames: ['Fruit Slice', 'Card Navigator'],
    animationType: 'swipe-left',
  },
  {
    id: 'swipe-right',
    name: 'Swipe Right',
    category: 'Kinetic Movement',
    description: 'Swiftly propel your hand horizontally from left to right across the field of view.',
    howToPerform: 'Accelerate hand rightward with rapid velocity across camera frame.',
    usedInGames: ['Fruit Slice', 'Card Navigator'],
    animationType: 'swipe-right',
  },
];

export const HowToPlayPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [activeGesture, setActiveGesture] = useState<string>('open-palm');

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            TUTORIAL ACADEMY
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          How to Play HANDVERSE
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] max-w-2xl">
          Master real-time motion mechanics. Learn proper lighting, hand placement, and gesture execution for tournament-grade precision.
        </p>
      </div>

      {/* =========================================================================
          CAMERA SETUP BEST PRACTICES (3 Key Tips)
      ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF2D95]/50 flex items-center justify-center">
            <Sun className="w-5 h-5 text-[#FF2D95]" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">1. Clean Lighting</h3>
          <p className="text-xs font-subheading text-[#B8A9B8] leading-relaxed">
            Ensure good ambient front light on your hands. Avoid intense backlights or glaring windows directly behind you to prevent silhouetting.
          </p>
        </div>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF00A8]/50 flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-[#FF00A8]" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">2. Distance & Frame</h3>
          <p className="text-xs font-subheading text-[#B8A9B8] leading-relaxed">
            Sit approximately 1.5 to 3 feet (45–90 cm) away from your webcam. Keep your wrists and palms comfortably inside the camera boundaries.
          </p>
        </div>

        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#120B14] border border-[#FF78BD]/50 flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#FF78BD]" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">3. Camera Calibration</h3>
          <p className="text-xs font-subheading text-[#B8A9B8] leading-relaxed">
            Use the Gesture Lab to preview your live webcam stream and check resolution before starting any game session.
          </p>
        </div>
      </section>

      {/* =========================================================================
          7 ILLUSTRATED GESTURE CARDS
      ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
              7 Supported Gesture Mechanics
            </h2>
            <p className="text-xs sm:text-sm font-subheading text-[#B8A9B8]">
              Interactive reference for every hand movement recognized across our arcade titles.
            </p>
          </div>
          <button
            onClick={() => navigateTo('gesture-lab')}
            className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-[#FF2D95] hover:text-[#FF78BD] transition-colors"
          >
            <span>Live Camera Test in Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GESTURES.map((gesture) => {
            const isSelected = activeGesture === gesture.id;
            return (
              <motion.div
                key={gesture.id}
                onClick={() => setActiveGesture(gesture.id)}
                whileHover={{ y: -4 }}
                className={`rounded-2xl bg-[#19101D] border p-6 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#FF2D95] shadow-[0_0_25px_rgba(255,45,149,0.35)]'
                    : 'border-[#2D1B36] hover:border-[#FF2D95]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#FF2D95]/15 text-[#FF78BD] border border-[#FF2D95]/30">
                      {gesture.category}
                    </span>
                    <Hand className="w-4 h-4 text-[#FF2D95]" />
                  </div>

                  <h3 className="text-xl font-heading font-bold text-white mb-2">
                    {gesture.name}
                  </h3>
                  <p className="text-xs font-subheading text-[#B8A9B8] leading-relaxed mb-4">
                    {gesture.description}
                  </p>

                  <div className="p-3 rounded-xl bg-[#120B14] border border-[#2D1B36] mb-4 space-y-1">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase">
                      Execution Technique:
                    </div>
                    <div className="text-xs text-zinc-200 font-subheading">
                      {gesture.howToPerform}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2D1B36]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">
                    Used In Games:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {gesture.usedInGames.map((game, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#08060A] text-zinc-300 border border-zinc-800"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Next Step Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-[#19101D] to-[#120B14] border border-[#FF2D95]/40 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-white">
            Ready to test your camera setup?
          </h3>
          <p className="text-xs sm:text-sm font-subheading text-[#B8A9B8] mt-1">
            Open the Gesture Lab to grant camera permission and verify live video streaming.
          </p>
        </div>
        <button
          onClick={() => navigateTo('gesture-lab')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,45,149,0.5)] hover:shadow-[0_0_30px_#FF2D95] transition-all flex items-center gap-2 shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Gesture Lab</span>
        </button>
      </section>
    </div>
  );
};
