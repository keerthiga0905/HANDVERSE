"""Master Gesture Recognition Engine for HANDVERSE (Module 04).

Coordinates finger classification, pinch hysteresis, kinetic trajectory analysis,
two-hand cooperative processing, temporal stabilization, and event generation.
"""

import time
from typing import Dict, List, Optional

from schemas.gesture import (
    FingerState,
    GestureEngineResult,
    GestureEvent,
    GestureSettings,
    GestureType,
    HandGestureResult,
)
from schemas.tracking import HandDetection, LandmarkPoint
from services.finger_classifier import FingerClassifier
from services.gesture_event_manager import GestureEventManager
from services.gesture_stabilizer import GestureStabilizer
from services.pinch_detector import PinchDetector
from services.swipe_detector import DynamicGestureDetector
from services.two_hand_detector import TwoHandDetector


class GestureRecognitionEngine:
    """End-to-end AI gesture recognition engine analyzing 21-landmark skeletal feeds."""

    def __init__(self, settings: Optional[GestureSettings] = None) -> None:
        self.settings = settings or GestureSettings()

        self.finger_classifier = FingerClassifier()
        self.pinch_detector = PinchDetector(
            activation_threshold=self.settings.pinch_activation_threshold,
            release_threshold=self.settings.pinch_release_threshold,
        )
        self.dynamic_detector = DynamicGestureDetector(
            speed_threshold=self.settings.swipe_speed_threshold,
            min_displacement=self.settings.swipe_min_distance,
            cooldown_sec=self.settings.gesture_cooldown_ms / 1000.0,
        )
        self.two_hand_detector = TwoHandDetector(
            sensitivity=self.settings.two_hand_sensitivity,
            cooldown_sec=self.settings.gesture_cooldown_ms / 1000.0,
        )
        self.stabilizer = GestureStabilizer(
            confirmation_frames=self.settings.static_confirmation_frames
        )
        self.event_manager = GestureEventManager(
            event_cooldown_sec=self.settings.gesture_cooldown_ms / 1000.0
        )

    def update_settings(self, new_settings: GestureSettings) -> None:
        """Apply updated runtime sensitivity and threshold preferences."""
        self.settings = new_settings
        self.pinch_detector.update_thresholds(
            new_settings.pinch_activation_threshold, new_settings.pinch_release_threshold
        )
        self.dynamic_detector.update_settings(
            new_settings.swipe_speed_threshold,
            new_settings.swipe_min_distance,
            new_settings.gesture_cooldown_ms / 1000.0,
        )
        self.two_hand_detector.update_settings(
            new_settings.two_hand_sensitivity, new_settings.gesture_cooldown_ms / 1000.0
        )
        self.stabilizer.update_confirmation_frames(new_settings.static_confirmation_frames)
        self.event_manager.update_cooldown(new_settings.gesture_cooldown_ms / 1000.0)

    def process_gestures(
        self,
        hand_detections: List[HandDetection],
        timestamp: Optional[float] = None,
    ) -> GestureEngineResult:
        """Process detected hands and evaluate all 16 static, dynamic, and multi-hand gestures.

        Args:
            hand_detections: MediaPipe detected hand landmarks
            timestamp: Optional epoch timestamp

        Returns:
            GestureEngineResult containing per-hand gestures, multi-hand states, and events.
        """
        now = timestamp if timestamp is not None else time.time()
        hand_results: List[HandGestureResult] = []
        emitted_events: List[GestureEvent] = []

        active_handedness_set = {h.handedness for h in hand_detections}

        # Reset stabilizer/events for hands that left the frame
        for side in ["Left", "Right"]:
            if side not in active_handedness_set:
                self.stabilizer.reset_hand(side)
                self.event_manager.reset_hand(side)

        # 1. Process Individual Hands (Static + Pinch + Dynamic)
        for hand in hand_detections:
            handedness = hand.handedness
            lms = hand.landmarks

            # A. Evaluate Pinch Status
            is_pinching, pinch_strength, pinch_dist, pinch_started, pinch_released = (
                self.pinch_detector.evaluate_pinch(lms, handedness=handedness)
            )

            # Generate pinch events on state changes
            if pinch_started:
                emitted_events.append(
                    self.event_manager.create_pinch_event(
                        "PINCH_STARTED", handedness, pinch_strength, pinch_dist, now
                    )
                )
            elif pinch_released:
                emitted_events.append(
                    self.event_manager.create_pinch_event(
                        "PINCH_RELEASED", handedness, pinch_strength, pinch_dist, now
                    )
                )

            # B. Evaluate Finger Extension States
            finger_states_enum = self.finger_classifier.classify_all_fingers(
                lms, sensitivity=self.settings.sensitivity
            )
            finger_states_str = {k: v.value for k, v in finger_states_enum.items()}

            # C. Classify Raw Static Gesture
            raw_gesture, raw_conf = self._classify_static_gesture(
                lms, finger_states_enum, is_pinching, pinch_strength
            )

            # D. Apply Temporal Smoothing / Stabilization
            stable_gesture, stable_conf = self.stabilizer.stabilize(
                handedness, raw_gesture, raw_conf
            )

            # E. Check for State Change Static Events
            static_events = self.event_manager.check_static_transitions(
                handedness, stable_gesture, stable_conf, now
            )
            emitted_events.extend(static_events)

            # F. Evaluate Dynamic Gestures (Swipes, Circle)
            dynamic_res = self.dynamic_detector.evaluate(lms, handedness, now)
            if dynamic_res:
                dyn_gesture, dyn_conf = dynamic_res
                # Dynamic movement produces an immediate discrete event
                emitted_events.append(
                    self.event_manager.create_dynamic_event(
                        dyn_gesture, handedness, dyn_conf, now
                    )
                )
                # For high-impact visual feedback, temporarily indicate dynamic gesture
                stable_gesture = dyn_gesture
                stable_conf = dyn_conf

            hand_results.append(
                HandGestureResult(
                    handedness=handedness,
                    primary_gesture=stable_gesture,
                    gesture_confidence=stable_conf,
                    finger_states=finger_states_str,
                    is_pinching=is_pinching,
                    pinch_strength=pinch_strength,
                    pinch_distance=pinch_dist,
                    pinch_started=pinch_started,
                    pinch_released=pinch_released,
                )
            )

        # 2. Process Two-Hand Cooperative Gestures (if exactly 2 hands)
        two_hand_gesture: Optional[str] = None
        two_hand_conf: float = 0.0

        if len(hand_detections) == 2 and len(hand_results) == 2:
            two_hand_res = self.two_hand_detector.evaluate(
                hand_detections, hand_results, now
            )
            if two_hand_res:
                two_hand_gesture, two_hand_conf = two_hand_res
                emitted_events.append(
                    self.event_manager.create_two_hand_event(
                        two_hand_gesture, two_hand_conf, now
                    )
                )

        return GestureEngineResult(
            hands=hand_results,
            two_hand_gesture=two_hand_gesture,
            two_hand_confidence=two_hand_conf,
            events=emitted_events,
        )

    def _classify_static_gesture(
        self,
        landmarks: List[LandmarkPoint],
        finger_states: Dict[str, FingerState],
        is_pinching: bool,
        pinch_strength: float,
    ) -> (str, float):
        """Classify static geometric hand poses based on finger states and joint geometry."""
        t_ext = finger_states["thumb"] == FingerState.EXTENDED
        i_ext = finger_states["index"] == FingerState.EXTENDED
        m_ext = finger_states["middle"] == FingerState.EXTENDED
        r_ext = finger_states["ring"] == FingerState.EXTENDED
        l_ext = finger_states["little"] == FingerState.EXTENDED

        # 1. THUMBS UP (Thumb extended upward, all 4 other fingers folded)
        if t_ext and (not i_ext) and (not m_ext) and (not r_ext) and (not l_ext):
            if self.finger_classifier.is_thumbs_up_orientation(landmarks):
                return (GestureType.THUMBS_UP.value, 0.95)

        # 2. CLOSED FIST (All 4 main fingers folded inward into palm)
        if (not i_ext) and (not m_ext) and (not r_ext) and (not l_ext):
            return (GestureType.CLOSED_FIST.value, 0.96)

        # 3. OPEN PALM (All 5 fingers extended)
        if t_ext and i_ext and m_ext and r_ext and l_ext:
            return (GestureType.OPEN_PALM.value, 0.98)

        # 4. PINCH (Thumb and Index tips touching while not in a tight fist)
        if is_pinching:
            conf = min(0.99, max(0.80, pinch_strength))
            return (GestureType.PINCH.value, conf)

        # 5. INDEX FINGER POINTING (Index extended, remaining fingers folded)
        if i_ext and (not m_ext) and (not r_ext) and (not l_ext):
            return (GestureType.INDEX_POINTING.value, 0.95)

        # 6. VICTORY SIGN (Index and Middle extended, Ring and Little folded)
        if i_ext and m_ext and (not r_ext) and (not l_ext):
            return (GestureType.VICTORY_SIGN.value, 0.96)

        # 7. THREE FINGER GESTURE (Index, Middle, Ring extended, Thumb and Little folded)
        if i_ext and m_ext and r_ext and (not l_ext):
            return (GestureType.THREE_FINGERS.value, 0.94)

        return (GestureType.NONE.value, 0.50)

    def reset(self) -> None:
        """Reset internal history and states."""
        self.pinch_detector.reset()
        self.dynamic_detector.reset()
        self.two_hand_detector.reset()
        self.stabilizer.reset_all()
        self.event_manager.reset_all()
