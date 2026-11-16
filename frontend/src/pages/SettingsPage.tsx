/** Settings Page for persistent audio, visual, and input device preferences. */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Volume2,
  Music,
  Sparkles,
  Eye,
  Maximize2,
  Camera,
  Palette,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSetting, resetSettings, isFullscreen, toggleFullscreen } = useSettings();
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setAvailableCameras(devices.filter((d) => d.kind === 'videoinput'));
      }).catch(console.warn);
    }
  }, []);

  const triggerSaveNotice = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            SYSTEM PREFERENCES
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          Settings
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8]">
          Configure audio feedback, visual effects, and camera inputs. Changes are automatically saved to your browser storage.
        </p>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Preference updated and saved to localStorage.</span>
        </div>
      )}

      <div className="space-y-6">
        {/* =========================================================================
            AUDIO CONFIGURATION
        ========================================================================= */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-6">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#FF2D95]" />
            <span>Audio & Sound System</span>
          </h3>

          <div className="space-y-4">
            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2D1B36]">
              <div>
                <h4 className="text-sm font-semibold text-white">Sound Effects (SFX)</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Play audio feedback on gesture triggers, button clicks, and slices.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSetting('soundEnabled', !settings.soundEnabled);
                  triggerSaveNotice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.soundEnabled ? 'bg-[#FF2D95]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Music Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Arcade Background Music</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Stream ambient synthwave soundtrack during arcade matches.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSetting('musicEnabled', !settings.musicEnabled);
                  triggerSaveNotice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.musicEnabled ? 'bg-[#FF2D95]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            VISUAL & ANIMATION PREFERENCES
        ========================================================================= */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-6">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF2D95]" />
            <span>Visual Effects & Performance</span>
          </h3>

          <div className="space-y-4">
            {/* Particle Animations */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2D1B36]">
              <div>
                <h4 className="text-sm font-semibold text-white">Floating Neon Particles</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Enable kinetic background particles and cyber grid lines.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSetting('animationsEnabled', !settings.animationsEnabled);
                  triggerSaveNotice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.animationsEnabled ? 'bg-[#FF2D95]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.animationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Glowing Cursor */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2D1B36]">
              <div>
                <h4 className="text-sm font-semibold text-white">Pink Glowing Cursor</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Interactive neon cursor trailer for desktop pointer precision.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSetting('glowingCursor', !settings.glowingCursor);
                  triggerSaveNotice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.glowingCursor ? 'bg-[#FF2D95]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.glowingCursor ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2D1B36]">
              <div>
                <h4 className="text-sm font-semibold text-white">Reduced Motion Mode</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Disable continuous animations for lower CPU usage or accessibility.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSetting('reducedMotion', !settings.reducedMotion);
                  triggerSaveNotice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.reducedMotion ? 'bg-[#FF2D95]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Fullscreen Mode */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Arcade Fullscreen Display</h4>
                <p className="text-xs text-[#B8A9B8]">
                  Maximize the viewport to eliminate browser window distractions.
                </p>
              </div>
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 rounded-xl bg-[#120B14] hover:bg-[#FF2D95]/20 border border-[#2D1B36] hover:border-[#FF2D95] text-xs font-mono text-white transition-all flex items-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            HARDWARE & CAMERA PREFERENCES
        ========================================================================= */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-4">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#FF2D95]" />
            <span>Webcam Device Selection</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase">
              Preferred Video Input Source
            </label>
            <select
              value={settings.preferredCameraId}
              onChange={(e) => {
                updateSetting('preferredCameraId', e.target.value);
                triggerSaveNotice();
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08060A] border border-[#2D1B36] text-xs font-subheading text-white focus:outline-none focus:border-[#FF2D95]"
            >
              <option value="">Default System Camera</option>
              {availableCameras.map((cam, i) => (
                <option key={cam.deviceId || i} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =========================================================================
            THEME & BRAND NOTICE
        ========================================================================= */}
        <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 space-y-3">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#FF2D95]" />
            <span>Theme & Aesthetics</span>
          </h3>
          <p className="text-xs font-subheading text-[#B8A9B8]">
            HANDVERSE is locked to its signature <strong className="text-white">HOT PINK + NEON PINK + BLACK</strong> futuristic arcade theme. Glassmorphism and gradient borders are permanently enabled for high-fidelity immersion.
          </p>
        </div>

        {/* Reset Defaults */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => {
              resetSettings();
              triggerSaveNotice();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#120B14] hover:bg-zinc-800 border border-[#2D1B36] text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Preferences to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
