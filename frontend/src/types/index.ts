/** Common TypeScript definitions for HANDVERSE */

export type PageId =
  | 'home'
  | 'dashboard'
  | 'arcade'
  | 'game-engine'
  | 'tutorial'
  | 'gesture-lab'
  | 'calibration'
  | 'profile'
  | 'settings';

export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  control_type: string;
  status: string;
  is_playable: boolean;
  planned_module: string;
  features: string[];
  icon_name: string;
  color: string;
  supported_gestures?: string[];
  min_tracking_requirements?: string;
  game_config?: Record<string, any>;
}

export interface SystemConfig {
  app_name: string;
  app_version: string;
  tagline: string;
  theme: Record<string, string>;
  supported_gestures: Array<{ id: string; name: string; action: string }>;
  tracking_defaults: {
    target_fps: number;
    max_hands: number;
    default_gesture_sensitivity: number;
  };
  websocket_url: string;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  timestamp: string;
  services: {
    api?: string;
    websocket?: string;
    database?: string;
    vision_engine?: string;
  };
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  glowingCursor: boolean;
  preferredCameraId: string;
  theme: 'neon-pink';
}
