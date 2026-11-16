/** Master Game Engine TypeScript Type Definitions (Module 06). */

export type GameState =
  | 'IDLE'
  | 'READY'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'RESULTS';

export type Difficulty = 'Easy' | 'Normal' | 'Medium' | 'Hard' | 'Extreme';

export type GameInputEventType =
  | 'POINTER_MOVE'
  | 'POINTER_DOWN'
  | 'POINTER_UP'
  | 'PINCH_START'
  | 'PINCH_RELEASE'
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'TWO_HAND_DETECTED'
  | 'TRACKING_LOST'
  | 'TRACKING_RECOVERED';

export interface GameInputEvent {
  type: GameInputEventType;
  timestamp: number;
  x?: number; // Normalized 0..1
  y?: number; // Normalized 0..1
  dx?: number;
  dy?: number;
  speed?: number;
  hand?: 'Left' | 'Right';
  confidence?: number;
  data?: any;
}

export interface ScoreBreakdown {
  baseScore: number;
  comboMultiplier: number;
  accuracyBonus: number;
  timeBonus: number;
  levelBonus: number;
  penalties: number;
  totalScore: number;
}

export interface LevelConfig {
  levelNumber: number;
  speedMultiplier: number;
  targetScore: number;
  timeLimit: number;
  description: string;
}

export interface GameEngineConfig {
  timeLimit: number;
  initialLives: number;
  basePoints: number;
  comboTimeout: number;
  maxCombo: number;
  difficulty: Difficulty;
  trackingLossTimeout: number; // in seconds
  autoPauseOnTrackingLoss: boolean;
  soundEnabled: boolean;
  masterVolume: number; // 0..1
}

export interface GameSessionStats {
  sessionId: string;
  gameId: string;
  playerName: string;
  difficulty: Difficulty;
  score: number;
  durationSeconds: number;
  highestCombo: number;
  accuracyPercent: number;
  hits: number;
  misses: number;
  status: 'completed' | 'game_over' | 'aborted';
  createdAt: string;
}

export interface AchievementEvent {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  unlockedAt: number;
}
