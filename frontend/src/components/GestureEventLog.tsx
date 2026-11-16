import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, Zap, Sparkles, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RotateCw, Hand } from 'lucide-react';
import { GestureEvent } from '../types/tracking';

interface GestureEventLogProps {
  events: GestureEvent[];
  onClear: () => void;
}

export const GestureEventLog: React.FC<GestureEventLogProps> = ({ events, onClear }) => {
  const getEventBadge = (eventType: string) => {
    if (eventType.includes('PINCH_STARTED')) {
      return {
        bg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    if (eventType.includes('PINCH_RELEASED')) {
      return {
        bg: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
        icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      };
    }
    if (eventType.includes('SWIPE_LEFT')) {
      return {
        bg: 'bg-sky-950/60 border-sky-500/50 text-sky-300',
        icon: <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />,
      };
    }
    if (eventType.includes('SWIPE_RIGHT')) {
      return {
        bg: 'bg-sky-950/60 border-sky-500/50 text-sky-300',
        icon: <ArrowRight className="w-3.5 h-3.5 text-sky-400" />,
      };
    }
    if (eventType.includes('SWIPE_UP')) {
      return {
        bg: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
        icon: <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />,
      };
    }
    if (eventType.includes('SWIPE_DOWN')) {
      return {
        bg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
        icon: <ArrowDown className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    if (eventType.includes('CIRCULAR')) {
      return {
        bg: 'bg-[#FF2D95]/20 border-[#FF2D95]/50 text-[#FF78BD]',
        icon: <RotateCw className="w-3.5 h-3.5 text-[#FF2D95]" />,
      };
    }
    return {
      bg: 'bg-[#FF2D95]/10 border-[#FF2D95]/40 text-pink-300',
      icon: <Zap className="w-3.5 h-3.5 text-[#FF2D95]" />,
    };
  };

  return (
    <div className="w-full rounded-3xl bg-[#120B14] border border-[#2D1B36] p-6 shadow-[0_0_35px_rgba(255,45,149,0.06)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2D1B36] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#19101D] border border-[#FF2D95]/40 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#FF2D95]" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-black text-white flex items-center gap-2">
              <span>Discrete Gesture Event Log</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#19101D] border border-[#2D1B36] text-[#FF78BD]">
                {events.length} captured
              </span>
            </h3>
            <p className="text-[11px] font-subheading text-[#B8A9B8]">
              Dispatched game input triggers: swipes, pinches, and confirmed poses with timestamps.
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={events.length === 0}
          className="p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-zinc-400 hover:text-white hover:border-[#FF2D95] transition-colors disabled:opacity-40"
          title="Clear Event Log"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Event Stream Container */}
      <div className="h-48 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-8">
            <Hand className="w-8 h-8 mb-2 opacity-40 text-[#FF2D95]" />
            <p className="text-xs">Awaiting gesture event triggers...</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Perform swipes, pinches, or static poses in front of the camera.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((evt, idx) => {
              const badge = getEventBadge(evt.event_type);
              const timeStr = new Date(evt.timestamp * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              });
              const ms = Math.floor((evt.timestamp * 1000) % 1000)
                .toString()
                .padStart(3, '0');

              return (
                <motion.div
                  key={`${evt.timestamp}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#19101D] border border-[#2D1B36]/80 hover:border-[#FF2D95]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">
                      {timeStr}.{ms}
                    </span>

                    {/* Event Type Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{evt.event_type}</span>
                    </div>

                    {/* Handedness Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                        evt.handedness === 'Right'
                          ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                          : evt.handedness === 'Left'
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {evt.handedness} Hand
                    </span>
                  </div>

                  {/* Confidence / Details */}
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-[11px]">
                      {evt.gesture.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-[#FF78BD]">
                      {Math.round(evt.confidence * 100)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
