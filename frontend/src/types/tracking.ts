/** MediaPipe Hand Tracking & Gesture Recognition TypeScript definitions (Module 04 & 05). */

import { CursorState } from './motion';

export interface LandmarkPoint {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface GestureEvent {
  event_type: string;
  gesture: string;
  handedness: string;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, number>;
}

export interface HandDetection {
  handedness: 'Left' | 'Right' | 'Unknown';
  confidence: number;
  landmarks: LandmarkPoint[];
  world_landmarks?: LandmarkPoint[];
  // Module 04 Gesture Recognition Telemetry
  primary_gesture: string;
  gesture_confidence: number;
  finger_states: Record<string, 'EXTENDED' | 'FOLDED'>;
  is_pinching: boolean;
  pinch_strength: number;
  pinch_distance: number;
  pinch_started?: boolean;
  pinch_released?: boolean;
}

export interface TrackingResult {
  type: string;
  timestamp: number;
  frame_id: number;
  hands_detected: number;
  tracking_status: string;
  processing_time_ms: number;
  hands: HandDetection[];
  two_hand_gesture?: string | null;
  two_hand_confidence?: number;
  events?: GestureEvent[];
  // Module 05 Motion Control Fields
  cursor?: CursorState | null;
  secondary_cursor?: CursorState | null;
  is_calibrated?: boolean;
  motion_events?: string[];
}

export interface TrackingHistoryItem {
  id: number;
  timestamp: number;
  handsDetected: number;
  latencyMs: number;
  confidence: number;
  gesture?: string;
}

export interface GestureCardInfo {
  id: string;
  name: string;
  type: 'STATIC' | 'TWO_HAND' | 'DYNAMIC';
  category: string;
  instructions: string;
  expected_movement: string;
  icon: string;
  used_in: string;
}

export interface GestureSettings {
  sensitivity: number;
  pinch_activation_threshold: number;
  pinch_release_threshold: number;
  static_confirmation_frames: number;
  swipe_speed_threshold: number;
  swipe_min_distance: number;
  gesture_cooldown_ms: number;
  two_hand_sensitivity: number;
}

export const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  sensitivity: 1.0,
  pinch_activation_threshold: 0.35,
  pinch_release_threshold: 0.50,
  static_confirmation_frames: 3,
  swipe_speed_threshold: 0.70,
  swipe_min_distance: 0.15,
  gesture_cooldown_ms: 400.0,
  two_hand_sensitivity: 1.0,
};

/** MediaPipe 21 Hand Landmark Connection Topology */
export const HAND_CONNECTIONS: [number, number][] = [
  // Palm base
  [0, 1], [0, 5], [0, 17],
  [5, 9], [9, 13], [13, 17],
  // Thumb
  [1, 2], [2, 3], [3, 4],
  // Index
  [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Little / Pinky
  [17, 18], [18, 19], [19, 20],
];

export const FINGERTIP_IDS = [4, 8, 12, 16, 20];
