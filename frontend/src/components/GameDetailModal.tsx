/** Game detail modal explaining mechanics, hand gestures, and rollout status. */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hand, Shield, Sparkles, AlertCircle, Camera, CheckCircle2, Flame } from 'lucide-react';
import { Game } from '../types';
import { useNavigation } from '../context/NavigationContext';

interface GameDetailModalProps {
  game: Game | null;
  onClose: () => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({ game, onClose }) => {
  const { navigateTo } = useNavigation();

  if (!game) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl rounded-2xl bg-[#19101D] border-2 border-[#FF2D95]/60 shadow-[0_0_50px_rgba(255,45,149,0.3)] p-6 sm:p-8 overflow-hidden text-white"
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF2D95] via-[#FF00A8] to-[#FF78BD]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#120B14] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/40">
              {game.category}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Difficulty: <strong className="text-white">{game.difficulty}</strong>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95] mb-4">
            {game.title}
          </h2>

          <p className="text-sm font-subheading text-[#B8A9B8] leading-relaxed mb-6">
            {game.description}
          </p>

          {/* Hand Control Specifications */}
          <div className="p-4 rounded-xl bg-[#120B14] border border-[#2D1B36] mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#FF78BD]">
              <Hand className="w-4 h-4 text-[#FF2D95]" />
              <span>Gesture Control Interface</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {game.control_type}
            </p>
            <p className="text-xs text-[#B8A9B8]">
              Powered by real-time webcam landmark coordinate tracking. No physical input devices required.
            </p>
          </div>

          {/* Planned Features */}
          <div className="space-y-2 mb-6">
            <h4 className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
              Engine Features & Physics
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {game.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-subheading text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2D95] shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Honest Rollout Status Warning */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Development Roadmap: {game.planned_module}</p>
              <p className="text-amber-300/80 mt-0.5">
                The visual UI and game catalog are active in Module 02. The MediaPipe gesture ML pipeline and game loop will be implemented in subsequent modules.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onClose();
                navigateTo('game-engine');
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,45,149,0.4)] hover:shadow-[0_0_30px_#FF2D95] transition-all flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Launch in Game Engine</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#120B14] border border-[#2D1B36] text-[#B8A9B8] hover:text-white transition-colors text-sm font-subheading"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
