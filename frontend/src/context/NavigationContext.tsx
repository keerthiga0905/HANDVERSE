/** Navigation context for managing active view and route transitions. */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageId } from '../types';

interface NavigationContextType {
  activePage: PageId;
  navigateTo: (page: PageId) => void;
  selectedGameId: string | null;
  openGameModal: (gameId: string) => void;
  closeGameModal: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>(() => {
    const hash = window.location.hash.replace('#', '') as PageId;
    const validPages: PageId[] = ['home', 'dashboard', 'arcade', 'tutorial', 'gesture-lab', 'profile', 'settings'];
    return validPages.includes(hash) ? hash : 'home';
  });

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    window.location.hash = activePage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      const validPages: PageId[] = ['home', 'dashboard', 'arcade', 'tutorial', 'gesture-lab', 'profile', 'settings'];
      if (validPages.includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: PageId) => {
    setActivePage(page);
  };

  const openGameModal = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const closeGameModal = () => {
    setSelectedGameId(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        navigateTo,
        selectedGameId,
        openGameModal,
        closeGameModal,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
