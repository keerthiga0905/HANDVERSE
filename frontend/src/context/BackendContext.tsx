/** Backend connection and health state provider. */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { HealthStatus } from '../types';
import { ApiService } from '../services/api';

interface BackendContextType {
  health: HealthStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshHealth: () => Promise<void>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const data = await ApiService.getHealth();
      setHealth(data);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll every 10 seconds for real-time connection status
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BackendContext.Provider
      value={{
        health,
        isConnected,
        isLoading,
        error,
        refreshHealth: checkHealth,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
