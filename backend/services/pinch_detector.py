"""Hysteresis-based pinch detection between thumb tip and index tip."""

from typing import Dict, List, Tuple
from schemas.tracking import LandmarkPoint
from services.finger_classifier import euclidean_dist, FingerClassifier


class PinchDetector:
    """Detects precision pinch interactions with hysteresis thresholding."""

    def __init__(
        self,
        activation_threshold: float = 0.35,
        release_threshold: float = 0.50,
    ) -> None:
        self.activation_threshold = activation_threshold
        self.release_threshold = release_threshold

        # Historical state per handedness: {"Left": bool, "Right": bool}
        self._pinch_states: Dict[str, bool] = {"Left": False, "Right": False}

    def update_thresholds(self, activation: float, release: float) -> None:
        """Update hysteresis thresholds dynamically."""
        self.activation_threshold = activation
        self.release_threshold = max(release, activation + 0.05)

    def evaluate_pinch(
        self, landmarks: List[LandmarkPoint], handedness: str = "Right"
    ) -> Tuple[bool, float, float, bool, bool]:
        """Evaluate landmarks for pinch status.

        Returns:
            Tuple containing:
                - is_pinching: bool
                - pinch_strength: float [0.0, 1.0]
                - normalized_distance: float
                - pinch_started: bool (true only on rising edge)
                - pinch_released: bool (true only on falling edge)
        """
        if len(landmarks) < 21:
            return False, 0.0, 1.0, False, False

        thumb_tip = landmarks[4]
        index_tip = landmarks[8]

        palm_scale = FingerClassifier.get_palm_scale(landmarks)
        raw_dist = euclidean_dist(thumb_tip, index_tip)
        norm_dist = raw_dist / palm_scale

        was_pinching = self._pinch_states.get(handedness, False)
        is_pinching = was_pinching

        # Apply dual-threshold hysteresis
        if not was_pinching:
            if norm_dist <= self.activation_threshold:
                is_pinching = True
        else:
            if norm_dist >= self.release_threshold:
                is_pinching = False

        self._pinch_states[handedness] = is_pinching

        # Calculate smooth pinch strength [0.0, 1.0]
        if norm_dist <= self.activation_threshold * 0.7:
            pinch_strength = 1.0
        elif norm_dist >= self.release_threshold:
            pinch_strength = 0.0
        else:
            # Linear interpolation between release threshold and full contact
            pinch_strength = max(0.0, min(1.0, (self.release_threshold - norm_dist) / (self.release_threshold - self.activation_threshold * 0.7)))

        pinch_started = (not was_pinching) and is_pinching
        pinch_released = was_pinching and (not is_pinching)

        return (
            is_pinching,
            round(pinch_strength, 3),
            round(norm_dist, 3),
            pinch_started,
            pinch_released,
        )

    def reset(self) -> None:
        """Reset historical pinch state registers."""
        self._pinch_states = {"Left": False, "Right": False}
