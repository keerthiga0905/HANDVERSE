import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crosshair } from 'lucide-react';

interface CalibrationTargetProps {
  name: string;
  label: string;
  normX: number; // 0.0 - 1.0
  normY: number; // 0.0 - 1.0
  isTargetActive: boolean;
  isCaptured: boolean;
  holdProgress?: number; // 0.0 - 1.0
  onClick?: () => void;
}

export const CalibrationTarget: React.FC<CalibrationTargetProps> = ({
  name,
  label,
  normX,
  normY,
  isTargetActive,
  isCaptured,
  holdProgress = 0,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`absolute z-30 transition-all duration-300 cursor-pointer ${
        isTargetActive ? 'scale-110' : 'scale-100 opacity-80'
      }`}
      style={{
        left: `${normX * 100}%`,
        top: `${normY * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer Pulse Ring when Target is Active */}
      {isTargetActive && !isCaptured && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border-2 border-[#FF2D95] shadow-[0_0_20px_#FF2D95]"
        />
      )}

      {/* Target Container */}
      <div
        className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center p-1 transition-all ${
          isCaptured
            ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
            : isTargetActive
            ? 'bg-[#19101D] border-[#FF2D95] shadow-[0_0_25px_#FF2D95]'
            : 'bg-[#08060A]/80 border-[#2D1B36] hover:border-[#FF2D95]/50'
        }`}
      >
        {isCaptured ? (
          <Check className="w-6 h-6 text-emerald-400" />
        ) : (
          <Crosshair
            className={`w-5 h-5 ${
              isTargetActive ? 'text-[#FF2D95] animate-spin-slow' : 'text-zinc-500'
            }`}
          />
        )}

        <span
          className={`text-[8px] font-mono uppercase mt-0.5 font-bold ${
            isCaptured
              ? 'text-emerald-300'
              : isTargetActive
              ? 'text-[#FF78BD]'
              : 'text-zinc-500'
          }`}
        >
          {label}
        </span>

        {/* Hold Progress Bar */}
        {isTargetActive && holdProgress > 0 && !isCaptured && (
          <div className="absolute -bottom-2 inset-x-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] transition-all duration-75"
              style={{ width: `${holdProgress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
