/** Interactive Game Card with pink glowing borders, hover scaling, and status pills. */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Sword,
  ShieldAlert,
  Diamond,
  Target,
  Palette,
  BrainCircuit,
  Activity,
  Rocket,
  Compass,
  Play,
  Info,
  Hand,
} from 'lucide-react';
import { Game } from '../types';
import { useNavigation } from '../context/NavigationContext';

interface GameCardItemProps {
  game: Game;
}

// Icon map for custom dynamic icons
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sword,
  ShieldAlert,
  Diamond,
  Sparkles,
  Target,
  Palette,
  BrainCircuit,
  Activity,
  Rocket,
  Compass,
};

export const GameCardItem: React.FC<GameCardItemProps> = ({ game }) => {
  const { openGameModal } = useNavigation();
  const IconComponent = ICON_MAP[game.icon_name] || Sparkles;

  const difficultyColors = {
    Easy: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
    Medium: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
    Hard: 'bg-rose-950/60 text-rose-400 border-rose-500/40',
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,45,149,0.35)] overflow-hidden"
    >
      {/* Top ambient background glow */}
      <div
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{ backgroundColor: game.color || '#FF2D95' }}
      />

      <div>
        {/* Card Header: Category & Difficulty */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono tracking-wider uppercase text-[#FF78BD] bg-[#FF2D95]/10 px-2.5 py-1 rounded-md border border-[#FF2D95]/30">
            {game.category}
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border ${
              difficultyColors[game.difficulty] || 'text-zinc-400'
            }`}
          >
            {game.difficulty}
          </span>
        </div>

        {/* Game Visual / Thumbnail Illustration */}
        <div className="relative w-full h-36 rounded-xl bg-gradient-to-br from-[#120B14] to-[#25152B] border border-[#2D1B36] flex items-center justify-center mb-4 overflow-hidden group-hover:border-[#FF2D95]/40 transition-colors">
          {/* Cyber grid lines */}
          <div className="absolute inset-0 bg-arcade-grid opacity-30" />
          
          <motion.div
            whileHover={{ scale: 1.15, rotate: 5 }}
            className="w-16 h-16 rounded-2xl bg-[#19101D] border border-[#FF2D95]/60 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,149,0.3)] z-10"
          >
            <IconComponent className="w-8 h-8 text-[#FF2D95]" />
          </motion.div>

          {/* Planned Module Badge overlay */}
          <div className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-zinc-400 border border-zinc-800">
            {game.planned_module}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-heading font-bold text-white group-hover:text-[#FF78BD] transition-colors mb-2">
          {game.title}
        </h3>
        <p className="text-xs text-[#B8A9B8] font-subheading leading-relaxed line-clamp-2 mb-4">
          {game.description}
        </p>

        {/* Hand Control Type Tag */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#FF78BD] mb-5 bg-[#120B14] p-2 rounded-lg border border-[#2D1B36]">
          <Hand className="w-3.5 h-3.5 text-[#FF2D95] shrink-0" />
          <span className="truncate">{game.control_type}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#2D1B36] flex items-center gap-2">
        <button
          onClick={() => openGameModal(game.id)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,45,149,0.4)] hover:shadow-[0_0_25px_#FF2D95] transition-all flex items-center justify-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Coming Soon</span>
        </button>

        <button
          onClick={() => openGameModal(game.id)}
          className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36] text-[#B8A9B8] hover:text-white hover:border-[#FF2D95]/50 transition-colors"
          title="Game Details & Controls"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
