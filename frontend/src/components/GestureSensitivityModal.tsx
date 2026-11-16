import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw, Check, Zap, Gauge, Flame, Sparkles } from 'lucide-react';
import { GestureSettings, DEFAULT_GESTURE_SETTINGS } from '../types/tracking';

interface GestureSensitivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GestureSettings;
  onSave: (newSettings: GestureSettings) => void;
}

export const GestureSensitivityModal: React.FC<GestureSensitivityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<GestureSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof GestureSettings, val: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleReset = () => {
    setLocalSettings({ ...DEFAULT_GESTURE_SETTINGS });
  };

  const handleSave = () => {
    onSave(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-[#120B14] border-2 border-[#FF2D95]/40 shadow-[0_0_50px_rgba(255,45,149,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#2D1B36] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF2D95]/20 border border-[#FF2D95] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-[#FF2D95]" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-white">
                  Gesture Engine Calibration
                </h3>
                <p className="text-xs font-subheading text-[#B8A9B8]">
                  Adjust real-time tracking thresholds, pinch hysteresis, and swipe velocities.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#19101D] text-zinc-400 hover:text-white border border-[#2D1B36] hover:border-[#FF2D95] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sliders Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* 1. Sensitivity Multiplier */}
            <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#FF2D95]" /> Global Gesture Sensitivity
                </span>
                <span className="text-[#FF78BD] font-bold text-sm">
                  {localSettings.sensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={localSettings.sensitivity}
                onChange={(e) => handleChange('sensitivity', parseFloat(e.target.value))}
                className="w-full accent-[#FF2D95] bg-[#08060A] h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-[#B8A9B8]">
                Scales finger extension margins. Higher values make gestures trigger more easily.
              </p>
            </div>

            {/* 2. Pinch Hysteresis Dual Controls */}
            <div className="p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pinch Hysteresis Control (Dual Threshold)</span>
              </div>

              {/* Pinch Activation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">Pinch Activation Distance</span>
                  <span className="text-amber-400 font-bold">
                    {localSettings.pinch_activation_threshold.toFixed(2)} Dpalm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.60"
                  step="0.01"
                  value={localSettings.pinch_activation_threshold}
                  onChange={(e) => handleChange('pinch_activation_threshold', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pinch Release */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">Pinch Release Distance</span>
                  <span className="text-emerald-400 font-bold">
                    {localSettings.pinch_release_threshold.toFixed(2)} Dpalm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="0.80"
                  step="0.01"
                  value={localSettings.pinch_release_threshold}
                  onChange={(e) => handleChange('pinch_release_threshold', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#B8A9B8]">
                Dual thresholds eliminate flickering. Pinch activates at ≤ {localSettings.pinch_activation_threshold} and stays held until fingers release beyond ≥ {localSettings.pinch_release_threshold}.
              </p>
            </div>

            {/* 3. Static Temporal Smoothing Window */}
            <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white font-bold">Temporal Confirmation Frames</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {localSettings.static_confirmation_frames} frames
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={localSettings.static_confirmation_frames}
                onChange={(e) => handleChange('static_confirmation_frames', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-[#B8A9B8]">
                Frames required to confirm static gestures. 3 frames (default) rejects camera noise while maintaining snappy reaction.
              </p>
            </div>

            {/* 4. Dynamic Swipe Speed & Distance */}
            <div className="p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Dynamic Swipe Thresholds</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">Swipe Velocity Threshold</span>
                  <span className="text-sky-400 font-bold">
                    {localSettings.swipe_speed_threshold.toFixed(2)} norm/s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="1.80"
                  step="0.05"
                  value={localSettings.swipe_speed_threshold}
                  onChange={(e) => handleChange('swipe_speed_threshold', parseFloat(e.target.value))}
                  className="w-full accent-sky-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">Minimum Trajectory Travel</span>
                  <span className="text-sky-300 font-bold">
                    {localSettings.swipe_min_distance.toFixed(2)} screen
                  </span>
                </div>
                <input
                  type="range"
                  min="0.08"
                  max="0.35"
                  step="0.01"
                  value={localSettings.swipe_min_distance}
                  onChange={(e) => handleChange('swipe_min_distance', parseFloat(e.target.value))}
                  className="w-full accent-sky-300 bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* 5. Cooldown & Two-Hand Multiplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold">Event Cooldown</span>
                  <span className="text-[#FF78BD] font-bold">
                    {Math.round(localSettings.gesture_cooldown_ms)} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1000"
                  step="50"
                  value={localSettings.gesture_cooldown_ms}
                  onChange={(e) => handleChange('gesture_cooldown_ms', parseFloat(e.target.value))}
                  className="w-full accent-[#FF2D95] bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500">
                  Prevents duplicate rapid triggering of swipes and actions.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold">Two-Hand Sensitivity</span>
                  <span className="text-purple-400 font-bold">
                    {localSettings.two_hand_sensitivity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={localSettings.two_hand_sensitivity}
                  onChange={(e) => handleChange('two_hand_sensitivity', parseFloat(e.target.value))}
                  className="w-full accent-purple-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500">
                  Multiplier for Hands Apart/Together detection speed.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[#2D1B36] flex items-center justify-between bg-[#08060A]">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] text-zinc-400 hover:text-white text-xs font-subheading font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-subheading font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={savedSuccess}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white text-xs font-subheading font-bold uppercase tracking-wider shadow-[0_0_20px_#FF2D95] hover:scale-105 transition-all flex items-center gap-2"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Applied!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
