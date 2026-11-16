/** Master HANDVERSE Application component with animated screen router and global providers. */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { BackendProvider } from './context/BackendContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ParticleBackground } from './components/ParticleBackground';
import { GlowingCursor } from './components/GlowingCursor';
import { IntroScreen } from './components/IntroScreen';

import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ArcadePage } from './pages/ArcadePage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { GestureLabPage } from './pages/GestureLabPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

const MainAppLayout: React.FC = () => {
  const { activePage } = useNavigation();
  const { settings } = useSettings();

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'arcade':
        return <ArcadePage />;
      case 'tutorial':
        return <HowToPlayPage />;
      case 'gesture-lab':
        return <GestureLabPage />;
      case 'calibration':
        return <CalibrationPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08060A] text-white flex flex-col justify-between selection:bg-[#FF2D95] selection:text-white">
      {/* Dynamic Backgrounds & Custom Cursor */}
      <ParticleBackground />
      <GlowingCursor />

      {/* Persistent Navigation Header */}
      <Navbar />

      {/* Animated Page Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: settings.reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: settings.reducedMotion ? 0 : -12 }}
            transition={{
              duration: settings.reducedMotion ? 0.01 : 0.3,
              ease: 'easeInOut',
            }}
          >
            {renderActivePage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Arcade Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Only display intro once per session, or allow replay
    return !sessionStorage.getItem('handverse_intro_viewed');
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('handverse_intro_viewed', 'true');
    setShowIntro(false);
  };

  return (
    <SettingsProvider>
      <BackendProvider>
        <NavigationProvider>
          {showIntro ? (
            <IntroScreen onComplete={handleIntroComplete} />
          ) : (
            <MainAppLayout />
          )}
        </NavigationProvider>
      </BackendProvider>
    </SettingsProvider>
  );
};

export default App;
