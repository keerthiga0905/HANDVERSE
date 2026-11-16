/** TypeScript definitions for Hand Calibration & Motion Control Engine (Module 05). */

export interface Point2D {
  x: number;
  y: number;
}

export interface CalibrationBounds {
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  center_x: number;
  center_y: number;
  width: number;
  height: number;
  is_valid: boolean;
}

export interface CalibrationPoint {
  name: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  x: number;
  y: number;
  timestamp?: number;
}

export interface CalibrationStatusResponse {
  is_calibrated: boolean;
  active_step: number;
  points_captured: string[];
  bounds: CalibrationBounds;
  hand_mode: 'RIGHT' | 'LEFT' | 'AUTO' | string;
  message: string;
}

export interface MotionSettings {
  sensitivity: number;
  smoothing_factor: number;
  one_euro_min_cutoff: number;
  one_euro_beta: number;
  control_hand: 'RIGHT' | 'LEFT' | 'AUTO';
  cursor_speed: number;
  boundary_margin: number;
  enable_virtual_cursor: boolean;
  mirror_preview: boolean;
  fist_clutch_enabled: boolean;
  pinch_click_enabled: boolean;
}

export const DEFAULT_MOTION_SETTINGS: MotionSettings = {
  sensitivity: 1.2,
  smoothing_factor: 0.5,
  one_euro_min_cutoff: 0.8,
  one_euro_beta: 1.5,
  control_hand: 'AUTO',
  cursor_speed: 1.0,
  boundary_margin: 0.04,
  enable_virtual_cursor: true,
  mirror_preview: true,
  fist_clutch_enabled: true,
  pinch_click_enabled: true,
};

export interface CursorState {
  x: number; // Normalized [0.0, 1.0]
  y: number; // Normalized [0.0, 1.0]
  raw_x: number;
  raw_y: number;
  screen_x: number;
  screen_y: number;
  velocity_x: number;
  velocity_y: number;
  speed: number;
  is_pressed: boolean;
  is_clicking: boolean;
  is_clutched: boolean;
  hand: 'Right' | 'Left' | 'Unknown';
  tracking_confidence: number;
  is_active: boolean;
  gesture: string;
  pinch_strength: number;
}

export interface MotionControlResult {
  primary_cursor: CursorState | null;
  secondary_cursor: CursorState | null;
  both_hands_active: boolean;
  is_calibrated: boolean;
  active_hand: string;
  events: string[];
}
