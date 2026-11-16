"""Temporal smoothing and consecutive-frame gesture stabilization filter."""

from collections import Counter, deque
from typing import Deque, Dict, Tuple


class GestureStabilizer:
    """Eliminates frame-to-frame classification jitter using majority voting and confirmation windows."""

    def __init__(self, confirmation_frames: int = 3) -> None:
        self.confirmation_frames = max(1, confirmation_frames)

        # Recent raw gesture classifications per hand: {"Left": deque, "Right": deque}
        self._history: Dict[str, Deque[str]] = {
            "Left": deque(maxlen=8),
            "Right": deque(maxlen=8),
        }

        # Confirmed active gesture per hand
        self._active_gestures: Dict[str, str] = {
            "Left": "NONE",
            "Right": "NONE",
        }

    def update_confirmation_frames(self, frames: int) -> None:
        """Update required consecutive-frame confirmation window."""
        self.confirmation_frames = max(1, frames)

    def stabilize(
        self, handedness: str, raw_gesture: str, raw_confidence: float
    ) -> Tuple[str, float]:
        """Apply sliding temporal window filter to stabilize gesture state.

        Returns:
            Tuple of (stabilized_gesture, smoothed_confidence)
        """
        history = self._history.setdefault(handedness, deque(maxlen=8))
        history.append(raw_gesture)

        current_active = self._active_gestures.get(handedness, "NONE")

        # If confirmation is 1, return immediately
        if self.confirmation_frames <= 1:
            self._active_gestures[handedness] = raw_gesture
            return (raw_gesture, raw_confidence)

        # Check if the last N frames match the new gesture
        if len(history) >= self.confirmation_frames:
            last_n = list(history)[-self.confirmation_frames :]
            if all(g == raw_gesture for g in last_n):
                self._active_gestures[handedness] = raw_gesture
                return (raw_gesture, raw_confidence)

        # Otherwise retain the previously confirmed gesture if recent support exists
        recent_counts = Counter(history)
        if current_active != "NONE" and recent_counts[current_active] >= 2:
            return (current_active, round(max(0.70, raw_confidence * 0.9), 2))

        # If no stable gesture yet, return most common recent gesture
        most_common, count = recent_counts.most_common(1)[0]
        if count >= self.confirmation_frames:
            self._active_gestures[handedness] = most_common
            return (most_common, raw_confidence)

        return (current_active, round(raw_confidence * 0.85, 2))

    def reset_hand(self, handedness: str) -> None:
        """Clear historical buffer for specific hand when leaving frame."""
        if handedness in self._history:
            self._history[handedness].clear()
            self._active_gestures[handedness] = "NONE"

    def reset_all(self) -> None:
        """Clear all buffers."""
        self._history = {"Left": deque(maxlen=8), "Right": deque(maxlen=8)}
        self._active_gestures = {"Left": "NONE", "Right": "NONE"}
