/** Responsive Top Navigation Bar with active indicator, health pill, and mobile drawer. */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Flame,
  Home,
  BookOpen,
  Camera,
  Compass,
  User,
  Settings,
  Menu,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useSettings } from '../context/SettingsContext';
import { useBackend } from '../context/BackendContext';
import { PageId } from '../types';

export const Navbar: React.FC = () => {
  const { activePage, navigateTo } = useNavigation();
  const { settings, updateSetting, isFullscreen, toggleFullscreen } = useSettings();
  const { isConnected, health } = useBackend();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: PageId; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'arcade', label: 'Game Arcade', icon: Gamepad2 },
    { id: 'game-engine', label: 'Game Engine', icon: Flame },
    { id: 'tutorial', label: 'How to Play', icon: BookOpen },
    { id: 'gesture-lab', label: 'Gesture Lab', icon: Camera },
    { id: 'calibration', label: 'Calibration', icon: Compass },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (pageId: PageId) => {
    navigateTo(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2D1B36] bg-[#08060A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-11 h-11 rounded-xl bg-[#19101D] border border-[#FF2D95]/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,45,149,0.4)] group-hover:shadow-[0_0_25px_#FF2D95] transition-all">
            <Gamepad2 className="w-6 h-6 text-[#FF2D95] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF78BD] to-[#FF2D95]">
                HANDVERSE
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FF2D95]/20 text-[#FF78BD] border border-[#FF2D95]/40">
                ARCADE
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-[#B8A9B8] hidden md:block">
              MOTION GAMING PLATFORM
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-subheading font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#B8A9B8] hover:text-white hover:bg-[#19101D]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF2D95]' : 'text-[#B8A9B8]'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF2D95]/20 to-[#FF00A8]/10 border border-[#FF2D95]/60 shadow-[0_0_15px_rgba(255,45,149,0.3)] -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Backend Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Connection Status Badge */}
          <div
            title={isConnected ? `FastAPI v${health?.version || '0.2.0'} Online` : 'Connecting to localhost:8000...'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-400 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span className="text-[11px]">{isConnected ? 'API LIVE' : 'SYNCING'}</span>
          </div>

          {/* Sound Mute/Unmute Quick Toggle */}
          <button
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            className="p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-[#B8A9B8] hover:text-[#FF2D95] hover:border-[#FF2D95]/50 transition-colors"
            title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Fullscreen Quick Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-[#19101D] border border-[#2D1B36] text-[#B8A9B8] hover:text-[#FF2D95] hover:border-[#FF2D95]/50 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#19101D] border border-[#FF2D95]/40 text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#FF2D95]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-[#2D1B36] bg-[#08060A]/95 px-4 pt-2 pb-6 space-y-2 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#2D1B36]/60">
              <span className="text-xs font-mono text-[#B8A9B8]">NAVIGATION MENU</span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  isConnected
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                }`}
              >
                {isConnected ? 'API LIVE :8000' : 'API OFFLINE'}
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-subheading font-medium text-base transition-all ${
                    isActive
                      ? 'bg-[#FF2D95]/20 text-white border border-[#FF2D95]/50 shadow-[0_0_15px_rgba(255,45,149,0.3)]'
                      : 'text-[#B8A9B8] hover:text-white hover:bg-[#19101D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF2D95]' : 'text-[#B8A9B8]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-[#FF2D95] shadow-[0_0_6px_#FF2D95]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
