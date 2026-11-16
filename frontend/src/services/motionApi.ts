/** REST API client for Hand Calibration and Motion Control (Module 05). */

import {
  CalibrationStatusResponse,
  MotionSettings,
} from '../types/motion';

const BASE_URL = '/api';

export const motionApi = {
  /** Start a guided calibration sequence */
  async startCalibration(handMode: string = 'AUTO'): Promise<CalibrationStatusResponse> {
    const res = await fetch(`${BASE_URL}/calibration/start?hand_mode=${handMode}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start calibration session');
    return res.json();
  },

  /** Capture target corner or center coordinate */
  async capturePoint(pointName: string, x?: number, y?: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/calibration/capture-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ point_name: pointName, x, y }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to capture calibration point');
    }
    return res.json();
  },

  /** Finalize and lock calibration boundaries */
  async completeCalibration(): Promise<any> {
    const res = await fetch(`${BASE_URL}/calibration/complete`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to complete calibration');
    }
    return res.json();
  },

  /** Get live status of calibration progress and bounds */
  async getCalibrationStatus(): Promise<CalibrationStatusResponse> {
    const res = await fetch(`${BASE_URL}/calibration/status`);
    if (!res.ok) throw new Error('Failed to retrieve calibration status');
    return res.json();
  },

  /** Reset calibration to factory defaults */
  async resetCalibration(): Promise<CalibrationStatusResponse> {
    const res = await fetch(`${BASE_URL}/calibration/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset calibration');
    return res.json();
  },

  /** Get user motion settings */
  async getMotionSettings(): Promise<MotionSettings> {
    const res = await fetch(`${BASE_URL}/motion/settings`);
    if (!res.ok) throw new Error('Failed to get motion settings');
    return res.json();
  },

  /** Save and apply user motion settings */
  async updateMotionSettings(settings: MotionSettings): Promise<MotionSettings> {
    const res = await fetch(`${BASE_URL}/motion/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update motion settings');
    return res.json();
  },

  /** Get high-level motion controller status */
  async getMotionStatus(): Promise<any> {
    const res = await fetch(`${BASE_URL}/motion/status`);
    if (!res.ok) throw new Error('Failed to get motion status');
    return res.json();
  },
};
