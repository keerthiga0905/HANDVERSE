"""Discrete gesture event generation, deduplication, and lifecycle dispatcher."""

import time
from typing import Dict, List, Optional
from schemas.gesture import GestureEvent


class GestureEventManager:
    """Detects gesture state transitions and emits discrete arcade events."""

    def __init__(self, event_cooldown_sec: float = 0.40) -> None:
        self.event_cooldown_sec = event_cooldown_sec

        # Last stable gesture state per hand
        self._last_gestures: Dict[str, str] = {"Left": "NONE", "Right": "NONE"}

        # Last event timestamp per event_type and hand
        self._last_event_times: Dict[str, float] = {}

    def update_cooldown(self, cooldown_sec: float) -> None:
        """Update minimum delay between identical events."""
        self.event_cooldown_sec = cooldown_sec

    def check_static_transitions(
        self,
        handedness: str,
        current_gesture: str,
        confidence: float,
        timestamp: Optional[float] = None,
    ) -> List[GestureEvent]:
        """Check for state changes in static gestures and emit corresponding events."""
        now = timestamp if timestamp is not None else time.time()
        events: List[GestureEvent] = []

        last_gesture = self._last_gestures.get(handedness, "NONE")

        # Detect rising edge transition into a valid gesture
        if current_gesture != last_gesture and current_gesture != "NONE":
            event_key = f"{handedness}_{current_gesture}"
            last_time = self._last_event_times.get(event_key, 0.0)

            if (now - last_time) >= self.event_cooldown_sec:
                event_type = f"{current_gesture}_DETECTED"
                events.append(
                    GestureEvent(
                        event_type=event_type,
                        gesture=current_gesture,
                        handedness=handedness,
                        confidence=confidence,
                        timestamp=now,
                    )
                )
                self._last_event_times[event_key] = now

        self._last_gestures[handedness] = current_gesture
        return events

    def create_pinch_event(
        self,
        event_type: str,  # "PINCH_STARTED" or "PINCH_RELEASED"
        handedness: str,
        strength: float,
        distance: float,
        timestamp: Optional[float] = None,
    ) -> GestureEvent:
        """Create a dedicated pinch transition event."""
        now = timestamp if timestamp is not None else time.time()
        return GestureEvent(
            event_type=event_type,
            gesture="PINCH",
            handedness=handedness,
            confidence=round(strength if event_type == "PINCH_STARTED" else 1.0, 2),
            timestamp=now,
            metadata={"pinch_strength": strength, "pinch_distance": distance},
        )

    def create_dynamic_event(
        self,
        gesture_name: str,
        handedness: str,
        confidence: float,
        timestamp: Optional[float] = None,
    ) -> GestureEvent:
        """Create an event for dynamic kinetic gestures (Swipes, Circle)."""
        now = timestamp if timestamp is not None else time.time()
        return GestureEvent(
            event_type=gesture_name,
            gesture=gesture_name,
            handedness=handedness,
            confidence=confidence,
            timestamp=now,
        )

    def create_two_hand_event(
        self,
        gesture_name: str,
        confidence: float,
        timestamp: Optional[float] = None,
    ) -> GestureEvent:
        """Create an event for cooperative two-hand interactions."""
        now = timestamp if timestamp is not None else time.time()
        return GestureEvent(
            event_type=gesture_name,
            gesture=gesture_name,
            handedness="Both",
            confidence=confidence,
            timestamp=now,
        )

    def reset_hand(self, handedness: str) -> None:
        """Reset state tracking for specific hand."""
        self._last_gestures[handedness] = "NONE"

    def reset_all(self) -> None:
        """Reset all event registers."""
        self._last_gestures = {"Left": "NONE", "Right": "NONE"}
        self._last_event_times.clear()
