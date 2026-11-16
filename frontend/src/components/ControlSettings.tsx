import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Gauge,
  Sparkles,
  Lock,
  Hand,
  RotateCcw,
  Check,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { DEFAULT_MOTION_SETTINGS, MotionSettings } from '../types/motion';
import { motionApi } from '../services/motionApi';

interface ControlSettingsProps {
  settings: MotionSettings;
  onSettingsChange: (newSettings: MotionSettings) => void;
  onRecalibrate?: () => void;
}

export const ControlSettings: React.FC<ControlSettingsProps> = ({
  settings,
  onSettingsChange,
  onRecalibrate,
}) => {
  const [localSettings, setLocalSettings] = useState<MotionSettings>({ ...settings });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleChange = (key: keyof MotionSettings, val: any) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleReset = async () => {
    setLocalSettings({ ...DEFAULT_MOTION_SETTINGS });
    onSettingsChange({ ...DEFAULT_MOTION_SETTINGS });
    try {
      await motionApi.updateMotionSettings(DEFAULT_MOTION_SETTINGS);
      setSaveStatus('Defaults Restored');
      setTimeout(() => setSaveStatus(null), 1500);
    } catch (err) {
      console.warn('Reset error:', err);
    }
  };

  const handleSaveToBackend = async () => {
    try {
      await motionApi.updateMotionSettings(localSettings);
      setSaveStatus('Settings Saved');
      setTimeout(() => setSaveStatus(null), 1500);
    } catch (err) {
      console.warn('Save error:', err);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-[#120B14] border border-[#2D1B36] p-6 lg:p-8 space-y-6 shadow-[0_0_35px_rgba(255,45,149,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2D1B36] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FF2D95]" />
            <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
              MOTION ENGINE PARAMETERS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white mt-1">
            Control & Cursor Calibration
          </h2>
          <p className="text-xs font-subheading text-[#B8A9B8]">
            Configure One Euro movement smoothing, reach sensitivity, hand dominance, and click action triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl">
              {saveStatus}
            </span>
          )}

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-[#19101D] border border-[#2D1B36] text-zinc-400 hover:text-white hover:border-[#FF2D95] transition-colors"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =========================================================================
            COLUMN 1: SLIDERS & SENSITIVITY
        ========================================================================= */}
        <div className="space-y-4">
          {/* 1. Sensitivity Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#FF2D95]" /> Reach Sensitivity
              </span>
              <span className="text-[#FF78BD] font-bold text-sm">
                {localSettings.sensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={localSettings.sensitivity}
              onChange={(e) => handleChange('sensitivity', parseFloat(e.target.value))}
              className="w-full accent-[#FF2D95] bg-[#08060A] h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-[#B8A9B8]">
              Controls reach multiplier. Higher values let smaller hand motions sweep the full screen.
            </p>
          </div>

          {/* 2. Smoothing Intensity Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> One Euro Movement Smoothing
              </span>
              <span className="text-cyan-400 font-bold text-sm">
                {Math.round(localSettings.smoothing_factor * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={localSettings.smoothing_factor}
              onChange={(e) => handleChange('smoothing_factor', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Low (Direct / Raw)</span>
              <span>High (Silky / Stable)</span>
            </div>
          </div>

          {/* 3. Cursor Speed Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Cursor Speed Modifier
              </span>
              <span className="text-amber-400 font-bold text-sm">
                {localSettings.cursor_speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={localSettings.cursor_speed}
              onChange={(e) => handleChange('cursor_speed', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-[#08060A] h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-[#B8A9B8]">
              Linear tracking acceleration modifier across viewport pixels.
            </p>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: HAND SELECTION & FEATURE TOGGLES
        ========================================================================= */}
        <div className="space-y-4">
          {/* Hand Selection Segmented Control */}
          <div className="p-4 rounded-2xl bg-[#19101D] border border-[#2D1B36] space-y-3">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Hand className="w-4 h-4 text-[#FF2D95]" /> Active Control Hand
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'AUTO', label: 'Auto Detect' },
                  { id: 'RIGHT', label: 'Right Hand' },
                  { id: 'LEFT', label: 'Left Hand' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleChange('control_hand', tab.id)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                    localSettings.control_hand === tab.id
                      ? 'bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white shadow-[0_0_15px_#FF2D95]'
                      : 'bg-[#08060A] text-zinc-400 border border-[#2D1B36] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#B8A9B8]">
              Select which hand drives the primary reticle in single-cursor game modes.
            </p>
          </div>

          {/* Action Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pinch Click Toggle */}
            <label className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36] flex items-center justify-between cursor-pointer hover:border-[#FF2D95]/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pinch Click
                </span>
                <p className="text-[10px] text-zinc-400">Thumb-index click action</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.pinch_click_enabled}
                onChange={(e) => handleChange('pinch_click_enabled', e.target.checked)}
                className="w-4 h-4 accent-[#FF2D95] cursor-pointer"
              />
            </label>

            {/* Fist Clutch Toggle */}
            <label className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36] flex items-center justify-between cursor-pointer hover:border-[#FF2D95]/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Fist Clutch
                </span>
                <p className="text-[10px] text-zinc-400">Freeze position on fist</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.fist_clutch_enabled}
                onChange={(e) => handleChange('fist_clutch_enabled', e.target.checked)}
                className="w-4 h-4 accent-[#FF2D95] cursor-pointer"
              />
            </label>

            {/* Enable Virtual Cursor Toggle */}
            <label className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36] flex items-center justify-between cursor-pointer hover:border-[#FF2D95]/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-white">Virtual Cursor</span>
                <p className="text-[10px] text-zinc-400">Render reticle overlay</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.enable_virtual_cursor}
                onChange={(e) => handleChange('enable_virtual_cursor', e.target.checked)}
                className="w-4 h-4 accent-[#FF2D95] cursor-pointer"
              />
            </label>

            {/* Mirror Camera Preview Toggle */}
            <label className="p-3.5 rounded-2xl bg-[#19101D] border border-[#2D1B36] flex items-center justify-between cursor-pointer hover:border-[#FF2D95]/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-white">Mirror Preview</span>
                <p className="text-[10px] text-zinc-400">Selfie camera reflection</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.mirror_preview}
                onChange={(e) => handleChange('mirror_preview', e.target.checked)}
                className="w-4 h-4 accent-[#FF2D95] cursor-pointer"
              />
            </label>
          </div>

          {/* Recalibrate & Save Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {onRecalibrate && (
              <button
                onClick={onRecalibrate}
                className="flex-1 py-3 rounded-xl bg-[#19101D] border border-[#FF2D95]/40 hover:border-[#FF2D95] text-white font-subheading font-bold text-xs uppercase tracking-wider transition-all"
              >
                Recalibrate Hand Space
              </button>
            )}

            <button
              onClick={handleSaveToBackend}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_#FF2D95] hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
