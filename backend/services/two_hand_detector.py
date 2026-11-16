"""Two-Hand gesture recognition and multi-hand coordination processor."""

from collections import deque
import math
import time
from typing import Deque, Dict, List, Optional, Tuple

from schemas.gesture import HandGestureResult
from schemas.tracking import HandDetection, LandmarkPoint


class TwoHandDetector:
    """Classifies cooperative two-hand interactions (Both Palms, Both Pinching, Hands Apart/Together)."""

    def __init__(self, sensitivity: float = 1.0, cooldown_sec: float = 0.50) -> None:
        self.sensitivity = sensitivity
        self.cooldown_sec = cooldown_sec

        # History of distance between hands: (timestamp, distance)
        self._distance_history: Deque[Tuple[float, float]] = deque(maxlen=25)
        self._last_trigger_time: float = 0.0

    def update_settings(self, sensitivity: float, cooldown_sec: float) -> None:
        """Update sensitivity parameters."""
        self.sensitivity = sensitivity
        self.cooldown_sec = cooldown_sec

    def evaluate(
        self,
        hand_detections: List[HandDetection],
        hand_gestures: List[HandGestureResult],
        current_time: Optional[float] = None,
    ) -> Optional[Tuple[str, float]]:
        """Evaluate two detected hands for multi-hand arcade gestures.

        Returns:
            Tuple of (two_hand_gesture_name, confidence) if detected, else None.
        """
        # Exactly two hands must be visible
        if len(hand_detections) != 2 or len(hand_gestures) != 2:
            self._distance_history.clear()
            return None

        now = current_time if current_time is not None else time.time()

        # Find hands and their centers
        hand1_lms = hand_detections[0].landmarks
        hand2_lms = hand_detections[1].landmarks

        c1 = ((hand1_lms[0].x + hand1_lms[9].x) * 0.5, (hand1_lms[0].y + hand1_lms[9].y) * 0.5)
        c2 = ((hand2_lms[0].x + hand2_lms[9].x) * 0.5, (hand2_lms[0].y + hand2_lms[9].y) * 0.5)

        distance = math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)
        self._distance_history.append((now, distance))

        g1 = hand_gestures[0]
        g2 = hand_gestures[1]

        # 1. Dynamic Relative Distance Gestures (HANDS_APART / HANDS_TOGETHER) evaluated first
        if (now - self._last_trigger_time) >= self.cooldown_sec and len(self._distance_history) >= 4:
            current_dist = distance
            # Find sample from 100ms to 380ms ago
            past_sample: Optional[Tuple[float, float]] = None
            for t, d in self._distance_history:
                dt = now - t
                if 0.10 <= dt <= 0.38:
                    past_sample = (t, d)
                    break

            if past_sample:
                dt = now - past_sample[0]
                delta_d = current_dist - past_sample[1]
                rate_of_change = abs(delta_d) / max(0.01, dt)

                min_delta = 0.10 / self.sensitivity
                min_rate = 0.35 / self.sensitivity

                if rate_of_change > min_rate and abs(delta_d) > min_delta:
                    self._last_trigger_time = now
                    self._distance_history.clear()

                    confidence = min(0.98, 0.75 + (rate_of_change / 1.5) * 0.23)

                    if delta_d > 0:
                        return ("HANDS_APART", round(confidence, 2))
                    else:
                        return ("HANDS_TOGETHER", round(confidence, 2))

        # 2. BOTH HANDS PINCHING (instantaneous)
        if g1.is_pinching and g2.is_pinching:
            conf = min(0.99, (g1.pinch_strength + g2.pinch_strength) * 0.5)
            return ("BOTH_HANDS_PINCHING", round(conf, 2))

        # 3. BOTH OPEN PALMS (instantaneous)
        if g1.primary_gesture == "OPEN_PALM" and g2.primary_gesture == "OPEN_PALM":
            conf = min(0.99, (g1.gesture_confidence + g2.gesture_confidence) * 0.5)
            return ("BOTH_OPEN_PALMS", round(conf, 2))

        return None

    def reset(self) -> None:
        """Reset historical distance buffer."""
        self._distance_history.clear()
        self._last_trigger_time = 0.0
