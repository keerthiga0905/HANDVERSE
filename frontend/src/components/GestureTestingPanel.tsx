import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hand,
  Crosshair,
  Sparkles,
  Zap,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Target,
  Trophy,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Layers,
  Activity,
  Flame,
} from 'lucide-react';
import { HandDetection } from '../types/tracking';

export interface GestureItemConfig {
  id: string;
  name: string;
  category: 'STATIC' | 'TWO_HAND' | 'DYNAMIC';
  description: string;
  arcadeAction: string;
  icon: React.ReactNode;
}

export const GESTURE_LIBRARY: GestureItemConfig[] = [
  // 1. Static Gestures
  {
    id: 'OPEN_PALM',
    name: 'Open Palm',
    category: 'STATIC',
    description: 'All 5 fingers fully extended and spread out flat.',
    arcadeAction: 'Navigation, Glide & Force Shield',
    icon: <Hand className="w-5 h-5 text-[#FF2D95]" />,
  },
  {
    id: 'CLOSED_FIST',
    name: 'Closed Fist',
    category: 'STATIC',
    description: 'All 4 fingers curled tightly into the palm.',
    arcadeAction: 'Emergency Brake, Shield & Charge',
    icon: <div className="w-5 h-5 rounded-full border-2 border-[#FF2D95] bg-[#FF2D95]/30" />,
  },
  {
    id: 'INDEX_POINTING',
    name: 'Index Pointing',
    category: 'STATIC',
    description: 'Index finger extended straight, remaining fingers curled.',
    arcadeAction: 'Crosshair Aiming & Laser Targeting',
    icon: <Crosshair className="w-5 h-5 text-[#FF78BD]" />,
  },
  {
    id: 'PINCH',
    name: 'Pinch Trigger',
    category: 'STATIC',
    description: 'Thumb tip and index fingertip touching with hysteresis.',
    arcadeAction: 'Primary Weapon Fire & UI Select',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'VICTORY_SIGN',
    name: 'Victory Sign',
    category: 'STATIC',
    description: 'Index and middle fingers extended in a V-shape.',
    arcadeAction: 'Double Laser Blast & Special Skill',
    icon: <span className="font-mono text-sm font-bold text-[#FF2D95]">✌️</span>,
  },
  {
    id: 'THUMBS_UP',
    name: 'Thumbs Up',
    category: 'STATIC',
    description: 'Thumb extended upwards, remaining fingers folded in.',
    arcadeAction: 'Ready / Confirm & Overdrive Turbo',
    icon: <span className="font-mono text-sm font-bold text-emerald-400">👍</span>,
  },
  {
    id: 'THREE_FINGERS',
    name: 'Three Fingers',
    category: 'STATIC',
    description: 'Index, middle, and ring fingers extended together.',
    arcadeAction: 'Tri-Beam Cannon & Weapon Swap',
    icon: <span className="font-mono text-sm font-bold text-cyan-400">🖖</span>,
  },

  // 2. Two-Hand Gestures
  {
    id: 'BOTH_OPEN_PALMS',
    name: 'Dual Open Palms',
    category: 'TWO_HAND',
    description: 'Both left and right hands open facing camera.',
    arcadeAction: 'Hyperspace Shield & Screen Wipe',
    icon: <Layers className="w-5 h-5 text-[#FF00A8]" />,
  },
  {
    id: 'BOTH_HANDS_PINCHING',
    name: 'Dual Pinch',
    category: 'TWO_HAND',
    description: 'Simultaneous pinch gesture on both hands.',
    arcadeAction: 'Camera Zoom & Dual Lock-on',
    icon: <Zap className="w-5 h-5 text-yellow-300" />,
  },
  {
    id: 'HANDS_APART',
    name: 'Hands Apart',
    category: 'TWO_HAND',
    description: 'Both hands spreading outward away from each other.',
    arcadeAction: 'Shockwave Explosion & Super Expansion',
    icon: <div className="flex gap-1 text-[#FF78BD] font-bold text-xs"><span>◀</span><span>▶</span></div>,
  },
  {
    id: 'HANDS_TOGETHER',
    name: 'Hands Together',
    category: 'TWO_HAND',
    description: 'Both hands converging inward towards each other.',
    arcadeAction: 'Energy Core Compression & Magnet',
    icon: <div className="flex gap-1 text-[#FF78BD] font-bold text-xs"><span>▶</span><span>◀</span></div>,
  },

  // 3. Dynamic Gestures
  {
    id: 'SWIPE_LEFT',
    name: 'Swipe Left',
    category: 'DYNAMIC',
    description: 'Swift linear hand sweep toward the left side.',
    arcadeAction: 'Dash Dodge Left & Previous Menu',
    icon: <ArrowLeft className="w-5 h-5 text-sky-400" />,
  },
  {
    id: 'SWIPE_RIGHT',
    name: 'Swipe Right',
    category: 'DYNAMIC',
    description: 'Swift linear hand sweep toward the right side.',
    arcadeAction: 'Dash Dodge Right & Next Menu',
    icon: <ArrowRight className="w-5 h-5 text-sky-400" />,
  },
  {
    id: 'SWIPE_UP',
    name: 'Swipe Up',
    category: 'DYNAMIC',
    description: 'Fast upward hand flick against gravity.',
    arcadeAction: 'High Jump & Anti-Gravity Lift',
    icon: <ArrowUp className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'SWIPE_DOWN',
    name: 'Swipe Down',
    category: 'DYNAMIC',
    description: 'Fast downward hand slash.',
    arcadeAction: 'Slide, Crouch & Ground Pound',
    icon: <ArrowDown className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'CIRCULAR_MOVEMENT',
    name: 'Vortex Spin',
    category: 'DYNAMIC',
    description: 'Continuous circular hand motion in the 2D plane.',
    arcadeAction: 'Cyclone Vortex Shield & Recharging',
    icon: <RotateCw className="w-5 h-5 text-[#FF2D95]" />,
  },
];

interface GestureTestingPanelProps {
  hands: HandDetection[];
  twoHandGesture?: string | null;
  onOpenSettings?: () => void;
}

export const GestureTestingPanel: React.FC<GestureTestingPanelProps> = ({
  hands,
  twoHandGesture,
  onOpenSettings,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'STATIC' | 'TWO_HAND' | 'DYNAMIC'>('ALL');
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [practiceTargetIndex, setPracticeTargetIndex] = useState<number>(0);
  const [practiceStreak, setPracticeStreak] = useState<number>(0);
  const [practiceSuccessFeedback, setPracticeSuccessFeedback] = useState<boolean>(false);

  // Derive active gestures across all detected hands + two-hand engine
  const activeGestures = new Set<string>();
  hands.forEach((h) => {
    if (h.primary_gesture && h.primary_gesture !== 'UNKNOWN') {
      activeGestures.add(h.primary_gesture);
    }
    if (h.is_pinching) {
      activeGestures.add('PINCH');
    }
  });

  if (twoHandGesture && twoHandGesture !== 'NONE') {
    activeGestures.add(twoHandGesture);
  }

  // Increment counters when gestures are detected
  useEffect(() => {
    if (activeGestures.size === 0) return;

    setCounters((prev) => {
      const next = { ...prev };
      activeGestures.forEach((g) => {
        next[g] = (next[g] || 0) + 1;
      });
      return next;
    });

    // Handle practice mode verification
    if (practiceMode) {
      const currentTarget = GESTURE_LIBRARY[practiceTargetIndex]?.id;
      if (currentTarget && activeGestures.has(currentTarget) && !practiceSuccessFeedback) {
        setPracticeSuccessFeedback(true);
        setPracticeStreak((s) => s + 1);

        // Advance to next target after brief celebration
        setTimeout(() => {
          setPracticeTargetIndex((prev) => (prev + 1) % GESTURE_LIBRARY.length);
          setPracticeSuccessFeedback(false);
        }, 1200);
      }
    }
  }, [activeGestures, practiceMode, practiceTargetIndex, practiceSuccessFeedback]);

  const filteredGestures = GESTURE_LIBRARY.filter((g) => {
    if (filter === 'ALL') return true;
    return g.category === filter;
  });

  const resetAllCounters = () => {
    setCounters({});
    setPracticeStreak(0);
  };

  const currentPracticeTarget = GESTURE_LIBRARY[practiceTargetIndex];

  return (
    <div className="w-full space-y-6 rounded-3xl bg-[#120B14] border border-[#2D1B36] p-6 lg:p-8 shadow-[0_0_35px_rgba(255,45,149,0.08)]">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#2D1B36] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF2D95]" />
            <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
              16 REAL-TIME RECOGNITION MODELS
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white mt-1">
            Gesture Recognition Matrix
          </h2>
          <p className="text-xs font-subheading text-[#B8A9B8]">
            Perform hand gestures in view of the webcam. Watch corresponding cards light up in neon pink instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Practice Mode Toggle */}
          <button
            onClick={() => setPracticeMode(!practiceMode)}
            className={`px-4 py-2 rounded-xl font-subheading font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              practiceMode
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-[#19101D] text-zinc-300 border border-[#2D1B36] hover:border-[#FF2D95]'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span>Practice Mode: {practiceMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset Counters */}
          <button
            onClick={resetAllCounters}
            className="p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-zinc-400 hover:text-white hover:border-[#FF2D95] transition-colors"
            title="Reset Recognition Counters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sensitivity Settings Modal Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-4 py-2 rounded-xl bg-[#19101D] border border-[#FF2D95]/40 hover:border-[#FF2D95] text-white font-subheading font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(255,45,149,0.15)] transition-all"
            >
              <Sliders className="w-4 h-4 text-[#FF2D95]" />
              <span>Sensitivity</span>
            </button>
          )}
        </div>
      </div>

      {/* Practice Mode Interactive Banner */}
      <AnimatePresence>
        {practiceMode && currentPracticeTarget && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-5 rounded-2xl border transition-all ${
              practiceSuccessFeedback
                ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-[#19101D] via-[#24132B] to-[#19101D] border-[#FF2D95]/50 shadow-[0_0_25px_rgba(255,45,149,0.2)]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border text-2xl transition-all ${
                    practiceSuccessFeedback
                      ? 'bg-emerald-500/20 border-emerald-400 animate-bounce'
                      : 'bg-[#08060A] border-[#FF2D95] shadow-[0_0_15px_#FF2D95]'
                  }`}
                >
                  {practiceSuccessFeedback ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    currentPracticeTarget.icon
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FF78BD]">
                    <span>TARGET GESTURE #{practiceTargetIndex + 1} OF {GESTURE_LIBRARY.length}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D95]" />
                    <span className="text-zinc-400 font-bold">{currentPracticeTarget.category}</span>
                  </div>
                  <h3 className="text-xl font-heading font-black text-white mt-0.5">
                    {practiceSuccessFeedback ? 'EXCELLENT! DETECTED!' : `Perform: ${currentPracticeTarget.name}`}
                  </h3>
                  <p className="text-xs text-[#B8A9B8]">
                    {currentPracticeTarget.description} • {currentPracticeTarget.arcadeAction}
                  </p>
                </div>
              </div>

              {/* Streak Tracker */}
              <div className="flex items-center gap-4 bg-[#08060A]/80 px-4 py-2.5 rounded-xl border border-[#2D1B36]">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-sm">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{practiceStreak} STREAK</span>
                </div>
                <button
                  onClick={() => setPracticeTargetIndex((prev) => (prev + 1) % GESTURE_LIBRARY.length)}
                  className="text-xs font-mono text-zinc-400 hover:text-white underline underline-offset-4"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'ALL', label: 'All Gestures (16)' },
            { id: 'STATIC', label: 'Static (7)' },
            { id: 'TWO_HAND', label: 'Two-Hand (4)' },
            { id: 'DYNAMIC', label: 'Dynamic Swipes & Spins (5)' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-subheading font-bold uppercase tracking-wider transition-all ${
              filter === tab.id
                ? 'bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white shadow-[0_0_15px_#FF2D95]'
                : 'bg-[#19101D] text-[#B8A9B8] border border-[#2D1B36] hover:text-white hover:border-[#FF2D95]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of 16 Gesture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredGestures.map((item) => {
          const isActive = activeGestures.has(item.id);
          const count = counters[item.id] || 0;
          const isTarget = practiceMode && currentPracticeTarget?.id === item.id;

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-2xl p-5 border transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-br from-[#FF2D95]/20 via-[#19101D] to-[#FF00A8]/10 border-[#FF2D95] shadow-[0_0_30px_rgba(255,45,149,0.4)] ring-2 ring-[#FF2D95]/50'
                  : isTarget
                  ? 'bg-[#19101D] border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-[#19101D] border-[#2D1B36] hover:border-[#FF2D95]/30'
              }`}
            >
              {/* Active Pulse Glow Indicator */}
              {isActive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2D95]/20 rounded-full blur-2xl pointer-events-none" />
              )}

              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                      isActive
                        ? 'bg-[#FF2D95] border-white text-white shadow-[0_0_15px_#FF2D95]'
                        : 'bg-[#08060A] border-[#2D1B36] text-[#FF2D95]'
                    }`}
                  >
                    {item.icon}
                  </div>

                  {/* Category Badge & Detection Counter */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        item.category === 'DYNAMIC'
                          ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                          : item.category === 'TWO_HAND'
                          ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                          : 'bg-[#FF2D95]/10 border-[#FF2D95]/30 text-[#FF78BD]'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        count > 0
                          ? 'bg-[#FF2D95]/30 border border-[#FF2D95] text-white'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {count}x
                    </span>
                  </div>
                </div>

                {/* Gesture Title */}
                <div>
                  <h3 className="text-base font-black font-heading text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#FF2D95] animate-ping" />
                    )}
                  </h3>
                  <p className="text-xs font-subheading text-[#B8A9B8] mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Card Footer: Arcade Action + Status */}
              <div className="mt-4 pt-3 border-t border-[#2D1B36]/80 flex items-center justify-between">
                <div className="text-[10px] font-mono text-[#FF78BD] truncate max-w-[140px]">
                  🎮 {item.arcadeAction}
                </div>

                <div
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : isTarget
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-600'
                  }`}
                >
                  {isActive ? 'ACTIVE' : isTarget ? 'TARGET' : 'READY'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
