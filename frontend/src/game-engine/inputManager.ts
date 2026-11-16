/** Reusable Game Input Abstraction & Gesture Event Dispatcher (Module 06). */

import { GameInputEvent, GameInputEventType } from './types';
import { CursorState } from '../types/motion';
import { TrackingResult } from '../types/tracking';

export type InputEventListener = (event: GameInputEvent) => void;

export class GameInputManager {
  private listeners: Set<InputEventListener> = new Set();

  // Internal state tracking
  private prevCursor: { x: number; y: number } | null = null;
  private prevPinching: boolean = false;
  private prevFist: boolean = false;
  private lastHandSeenTime: number = performance.now();
  private isTrackingLost: boolean = false;

  // Debounce timers for dynamic gestures
  private lastGestureTimes: Record<string, number> = {};
  private readonly GESTURE_DEBOUNCE_MS = 500;

  // Tracking loss configuration
  private trackingLossTimeoutMs: number = 1500;
  private minConfidence: number = 0.35;

  // Keyboard / Mouse emulation state
  private keyboardActive: boolean = false;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(options?: { trackingLossTimeoutSeconds?: number; minConfidence?: number }) {
    if (options?.trackingLossTimeoutSeconds) {
      this.trackingLossTimeoutMs = options.trackingLossTimeoutSeconds * 1000;
    }
    if (options?.minConfidence !== undefined) {
      this.minConfidence = options.minConfidence;
    }

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  public subscribe(listener: InputEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(event: GameInputEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[GameInputManager] Listener error:', err);
      }
    });
  }

  /**
   * Primary intake method called whenever fresh TrackingResult arrives from backend WebSocket.
   */
  public processTrackingResult(result: TrackingResult): void {
    const now = performance.now();
    const cursor = result.cursor;
    const hands = result.hands || [];

    // 1. Check hand presence & tracking loss
    if (hands.length === 0 || !cursor?.is_active) {
      if (!this.isTrackingLost && now - this.lastHandSeenTime > this.trackingLossTimeoutMs) {
        this.isTrackingLost = true;
        this.emit({
          type: 'TRACKING_LOST',
          timestamp: now,
        });
      }
      return;
    }

    // Hand is present
    this.lastHandSeenTime = now;
    if (this.isTrackingLost) {
      this.isTrackingLost = false;
      this.emit({
        type: 'TRACKING_RECOVERED',
        timestamp: now,
      });
    }

    // 2. Cursor coordinate movement
    if (cursor && cursor.tracking_confidence >= this.minConfidence) {
      const curX = cursor.x;
      const curY = cursor.y;
      let dx = 0;
      let dy = 0;

      if (this.prevCursor) {
        dx = curX - this.prevCursor.x;
        dy = curY - this.prevCursor.y;
      }

      this.prevCursor = { x: curX, y: curY };

      const activeHand = cursor.hand === 'Left' || cursor.hand === 'Right' ? cursor.hand : undefined;
      const isPinching = cursor.is_pressed || cursor.is_clicking;

      this.emit({
        type: 'POINTER_MOVE',
        timestamp: now,
        x: curX,
        y: curY,
        dx,
        dy,
        speed: cursor.speed,
        hand: activeHand,
        confidence: cursor.tracking_confidence,
      });

      // 3. Pinch events
      if (isPinching && !this.prevPinching) {
        this.prevPinching = true;
        this.emit({
          type: 'PINCH_START',
          timestamp: now,
          x: curX,
          y: curY,
          hand: activeHand,
        });
        this.emit({
          type: 'POINTER_DOWN',
          timestamp: now,
          x: curX,
          y: curY,
          hand: activeHand,
        });
      } else if (!isPinching && this.prevPinching) {
        this.prevPinching = false;
        this.emit({
          type: 'PINCH_RELEASE',
          timestamp: now,
          x: curX,
          y: curY,
          hand: activeHand,
        });
        this.emit({
          type: 'POINTER_UP',
          timestamp: now,
          x: curX,
          y: curY,
          hand: activeHand,
        });
      }

      // 4. Fist clutch events
      if (cursor.is_clutched && !this.prevFist) {
        this.prevFist = true;
        this.emit({
          type: 'CLOSED_FIST',
          timestamp: now,
          hand: activeHand,
        });
      } else if (!cursor.is_clutched && this.prevFist) {
        this.prevFist = false;
      }
    }

    // 5. Two-hand detection
    if (hands.length >= 2) {
      this.emit({
        type: 'TWO_HAND_DETECTED',
        timestamp: now,
        data: {
          left: hands.find((h) => h.handedness.toLowerCase() === 'left'),
          right: hands.find((h) => h.handedness.toLowerCase() === 'right'),
        },
      });
    }

    // 6. High-level gesture triggers with debouncing
    const gestures = hands.map((h) => ({
      type: h.primary_gesture,
      handedness: h.handedness,
      confidence: h.gesture_confidence,
    }));
    for (const g of gestures) {
      if (!g.type || g.type === 'UNKNOWN' || g.type === 'NONE') continue;
      const gType = g.type.toUpperCase();
      const lastTime = this.lastGestureTimes[gType] || 0;

      if (now - lastTime > this.GESTURE_DEBOUNCE_MS) {
        let mappedType: GameInputEventType | null = null;

        if (gType === 'OPEN_PALM') mappedType = 'OPEN_PALM';
        else if (gType === 'SWIPE_LEFT') mappedType = 'SWIPE_LEFT';
        else if (gType === 'SWIPE_RIGHT') mappedType = 'SWIPE_RIGHT';
        else if (gType === 'SWIPE_UP') mappedType = 'SWIPE_UP';
        else if (gType === 'SWIPE_DOWN') mappedType = 'SWIPE_DOWN';

        if (mappedType) {
          this.lastGestureTimes[gType] = now;
          this.emit({
            type: mappedType,
            timestamp: now,
            hand: (g.handedness === 'Left' || g.handedness === 'Right') ? g.handedness : undefined,
            confidence: g.confidence,
          });
        }
      }
    }
  }

  /**
   * Enable keyboard & mouse emulation for testing or desktop control.
   */
  public enableKeyboardMouseEmulation(): void {
    if (typeof window === 'undefined') return;
    this.keyboardActive = true;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public disableKeyboardMouseEmulation(): void {
    if (typeof window === 'undefined') return;
    this.keyboardActive = false;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.keyboardActive) return;
    const now = performance.now();

    if (e.code === 'Space') {
      this.emit({ type: 'PINCH_START', timestamp: now });
      this.emit({ type: 'POINTER_DOWN', timestamp: now });
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      this.emit({ type: 'CLOSED_FIST', timestamp: now });
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.keyboardActive) return;
    const now = performance.now();

    if (e.code === 'Space') {
      this.emit({ type: 'PINCH_RELEASE', timestamp: now });
      this.emit({ type: 'POINTER_UP', timestamp: now });
    }
  }

  public reset(): void {
    this.prevCursor = null;
    this.prevPinching = false;
    this.prevFist = false;
    this.isTrackingLost = false;
    this.lastHandSeenTime = performance.now();
    this.lastGestureTimes = {};
  }

  public destroy(): void {
    this.disableKeyboardMouseEmulation();
    this.listeners.clear();
  }
}
