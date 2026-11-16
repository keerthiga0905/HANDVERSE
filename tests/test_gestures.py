"""Comprehensive Automated Test Suite for Module 04: AI Hand Gesture Recognition Engine.

Tests all 16 static, dynamic, and multi-hand gestures, pinch hysteresis,
cooldown periods, temporal stabilization, and edge conditions using synthetic landmark fixtures.
"""

import math
import sys
import time
from pathlib import Path
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas.gesture import FingerState, GestureSettings, GestureType
from schemas.tracking import HandDetection, LandmarkPoint
from services.finger_classifier import FingerClassifier
from services.gesture_event_manager import GestureEventManager
from services.gesture_recognition import GestureRecognitionEngine
from services.gesture_stabilizer import GestureStabilizer
from services.pinch_detector import PinchDetector
from services.swipe_detector import DynamicGestureDetector
from services.two_hand_detector import TwoHandDetector


# ==============================================================================
# Synthetic Landmark Fixture Generators
# ==============================================================================
def create_landmark(idx: int, x: float, y: float, z: float = 0.0) -> LandmarkPoint:
    return LandmarkPoint(id=idx, x=x, y=y, z=z)


def make_open_palm_landmarks(wrist_x: float = 0.5, wrist_y: float = 0.7) -> list[LandmarkPoint]:
    """Synthetic landmarks with all 5 fingers fully extended."""
    lms = [create_landmark(0, wrist_x, wrist_y)]  # 0: Wrist

    # Thumb (1-4): extended outward left
    lms.append(create_landmark(1, wrist_x - 0.04, wrist_y - 0.05))
    lms.append(create_landmark(2, wrist_x - 0.08, wrist_y - 0.10))
    lms.append(create_landmark(3, wrist_x - 0.12, wrist_y - 0.14))
    lms.append(create_landmark(4, wrist_x - 0.16, wrist_y - 0.17))  # Tip 4

    # Index (5-8): extended upward
    lms.append(create_landmark(5, wrist_x - 0.05, wrist_y - 0.18))
    lms.append(create_landmark(6, wrist_x - 0.05, wrist_y - 0.26))
    lms.append(create_landmark(7, wrist_x - 0.05, wrist_y - 0.32))
    lms.append(create_landmark(8, wrist_x - 0.05, wrist_y - 0.38))  # Tip 8

    # Middle (9-12): extended upward
    lms.append(create_landmark(9, wrist_x, wrist_y - 0.19))
    lms.append(create_landmark(10, wrist_x, wrist_y - 0.28))
    lms.append(create_landmark(11, wrist_x, wrist_y - 0.35))
    lms.append(create_landmark(12, wrist_x, wrist_y - 0.41))  # Tip 12

    # Ring (13-16): extended upward
    lms.append(create_landmark(13, wrist_x + 0.04, wrist_y - 0.18))
    lms.append(create_landmark(14, wrist_x + 0.04, wrist_y - 0.26))
    lms.append(create_landmark(15, wrist_x + 0.04, wrist_y - 0.32))
    lms.append(create_landmark(16, wrist_x + 0.04, wrist_y - 0.37))  # Tip 16

    # Pinky (17-20): extended upward
    lms.append(create_landmark(17, wrist_x + 0.08, wrist_y - 0.16))
    lms.append(create_landmark(18, wrist_x + 0.08, wrist_y - 0.22))
    lms.append(create_landmark(19, wrist_x + 0.08, wrist_y - 0.27))
    lms.append(create_landmark(20, wrist_x + 0.08, wrist_y - 0.32))  # Tip 20

    return lms


def make_fist_landmarks(wrist_x: float = 0.5, wrist_y: float = 0.7) -> list[LandmarkPoint]:
    """Synthetic landmarks with all 5 fingers curled firmly into a fist."""
    lms = [create_landmark(0, wrist_x, wrist_y)]

    # Thumb curled across index MCP
    lms.append(create_landmark(1, wrist_x - 0.02, wrist_y - 0.04))
    lms.append(create_landmark(2, wrist_x - 0.03, wrist_y - 0.08))
    lms.append(create_landmark(3, wrist_x - 0.01, wrist_y - 0.10))
    lms.append(create_landmark(4, wrist_x, wrist_y - 0.11))  # Tucked tip

    # Index curled
    lms.append(create_landmark(5, wrist_x - 0.04, wrist_y - 0.14))
    lms.append(create_landmark(6, wrist_x - 0.04, wrist_y - 0.18))
    lms.append(create_landmark(7, wrist_x - 0.03, wrist_y - 0.14))
    lms.append(create_landmark(8, wrist_x - 0.02, wrist_y - 0.11))  # Folded tip

    # Middle curled
    lms.append(create_landmark(9, wrist_x, wrist_y - 0.15))
    lms.append(create_landmark(10, wrist_x, wrist_y - 0.19))
    lms.append(create_landmark(11, wrist_x, wrist_y - 0.15))
    lms.append(create_landmark(12, wrist_x, wrist_y - 0.12))  # Folded tip

    # Ring curled
    lms.append(create_landmark(13, wrist_x + 0.03, wrist_y - 0.14))
    lms.append(create_landmark(14, wrist_x + 0.03, wrist_y - 0.18))
    lms.append(create_landmark(15, wrist_x + 0.02, wrist_y - 0.14))
    lms.append(create_landmark(16, wrist_x + 0.01, wrist_y - 0.11))  # Folded tip

    # Pinky curled
    lms.append(create_landmark(17, wrist_x + 0.06, wrist_y - 0.13))
    lms.append(create_landmark(18, wrist_x + 0.06, wrist_y - 0.16))
    lms.append(create_landmark(19, wrist_x + 0.05, wrist_y - 0.13))
    lms.append(create_landmark(20, wrist_x + 0.04, wrist_y - 0.10))  # Folded tip

    return lms


# ==============================================================================
# 1. Static Gesture Unit Tests (1-8)
# ==============================================================================
def test_open_palm_classification():
    """1. Verify OPEN_PALM recognizes when all 5 fingers are extended."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    lms = make_open_palm_landmarks()
    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)

    result = engine.process_gestures([detection])
    assert len(result.hands) == 1
    assert result.hands[0].primary_gesture == GestureType.OPEN_PALM.value
    assert all(s == FingerState.EXTENDED.value for s in result.hands[0].finger_states.values())


def test_closed_fist_classification():
    """2. Verify CLOSED_FIST recognizes when all fingers are curled."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    lms = make_fist_landmarks()
    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)

    result = engine.process_gestures([detection])
    assert len(result.hands) == 1
    assert result.hands[0].primary_gesture == GestureType.CLOSED_FIST.value


def test_index_pointing_classification():
    """3. Verify INDEX_POINTING recognizes when only index finger is extended."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    # Start with fist and extend only index
    lms = make_fist_landmarks()
    lms[6] = create_landmark(6, 0.46, 0.50)
    lms[7] = create_landmark(7, 0.46, 0.42)
    lms[8] = create_landmark(8, 0.46, 0.32)  # Extended tip

    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)
    result = engine.process_gestures([detection])

    assert result.hands[0].primary_gesture == GestureType.INDEX_POINTING.value
    assert result.hands[0].finger_states["index"] == FingerState.EXTENDED.value
    assert result.hands[0].finger_states["middle"] == FingerState.FOLDED.value


def test_pinch_activation_and_release():
    """4 & 5. Verify PINCH activation and release thresholds with hysteresis."""
    detector = PinchDetector(activation_threshold=0.35, release_threshold=0.50)
    lms = make_open_palm_landmarks()

    # Move thumb (4) and index (8) close together
    lms[4] = create_landmark(4, 0.50, 0.40)
    lms[8] = create_landmark(8, 0.51, 0.41)

    is_pinching, strength, dist, started, released = detector.evaluate_pinch(lms, "Right")
    assert is_pinching is True
    assert started is True
    assert released is False
    assert strength > 0.8

    # Second frame with same distance: started should now be False (not rising edge)
    is_pinching2, _, _, started2, released2 = detector.evaluate_pinch(lms, "Right")
    assert is_pinching2 is True
    assert started2 is False
    assert released2 is False

    # Pull fingers far apart: should trigger release
    lms[8] = create_landmark(8, 0.65, 0.25)
    is_pinching3, _, _, started3, released3 = detector.evaluate_pinch(lms, "Right")
    assert is_pinching3 is False
    assert started3 is False
    assert released3 is True


def test_victory_sign_classification():
    """6. Verify VICTORY_SIGN recognizes when index and middle are extended."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    lms = make_fist_landmarks()
    # Extend index (5-8) and middle (9-12)
    lms[6] = create_landmark(6, 0.45, 0.50)
    lms[7] = create_landmark(7, 0.44, 0.42)
    lms[8] = create_landmark(8, 0.43, 0.32)

    lms[10] = create_landmark(10, 0.51, 0.50)
    lms[11] = create_landmark(11, 0.52, 0.41)
    lms[12] = create_landmark(12, 0.53, 0.31)

    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)
    result = engine.process_gestures([detection])

    assert result.hands[0].primary_gesture == GestureType.VICTORY_SIGN.value


def test_thumbs_up_classification():
    """7. Verify THUMBS_UP recognizes upward thumb with other fingers folded."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    lms = make_fist_landmarks()
    # Extend thumb straight upward
    lms[1] = create_landmark(1, 0.48, 0.65)
    lms[2] = create_landmark(2, 0.48, 0.58)
    lms[3] = create_landmark(3, 0.48, 0.50)
    lms[4] = create_landmark(4, 0.48, 0.40)  # High thumb tip

    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)
    result = engine.process_gestures([detection])

    assert result.hands[0].primary_gesture == GestureType.THUMBS_UP.value


def test_three_finger_classification():
    """8. Verify THREE_FINGERS recognizes index, middle, ring extended."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))
    lms = make_fist_landmarks()
    # Extend Index (5-8)
    lms[6] = create_landmark(6, 0.45, 0.50)
    lms[7] = create_landmark(7, 0.45, 0.42)
    lms[8] = create_landmark(8, 0.45, 0.32)
    # Extend Middle (9-12)
    lms[10] = create_landmark(10, 0.50, 0.50)
    lms[11] = create_landmark(11, 0.50, 0.41)
    lms[12] = create_landmark(12, 0.50, 0.31)
    # Extend Ring (13-16)
    lms[14] = create_landmark(14, 0.55, 0.50)
    lms[15] = create_landmark(15, 0.55, 0.42)
    lms[16] = create_landmark(16, 0.55, 0.33)

    detection = HandDetection(handedness="Right", confidence=0.98, landmarks=lms)
    result = engine.process_gestures([detection])

    assert result.hands[0].primary_gesture == GestureType.THREE_FINGERS.value


# ==============================================================================
# 2. Dynamic Gesture Unit Tests (9-13)
# ==============================================================================
def test_swipe_left_and_right():
    """9 & 10. Verify SWIPE_LEFT and SWIPE_RIGHT detection from hand trajectory."""
    detector = DynamicGestureDetector(speed_threshold=0.6, min_displacement=0.15, cooldown_sec=0.2)

    # Simulate fast movement to the left over 200ms
    now = 1000.0
    detected_left = None
    for i in range(8):
        x = 0.70 - (i * 0.035)  # From 0.70 down to 0.455 (dx = -0.245)
        lms = make_open_palm_landmarks(wrist_x=x, wrist_y=0.5)
        res = detector.evaluate(lms, handedness="Right", current_time=now + (i * 0.025))
        if res:
            detected_left = res

    assert detected_left is not None
    assert detected_left[0] == "SWIPE_LEFT"

    # Reset cooldown and simulate fast movement to the right
    detector.reset()
    now = 2000.0
    detected_right = None
    for i in range(8):
        x = 0.30 + (i * 0.035)  # From 0.30 up to 0.545 (dx = +0.245)
        lms = make_open_palm_landmarks(wrist_x=x, wrist_y=0.5)
        res_right = detector.evaluate(lms, handedness="Right", current_time=now + (i * 0.025))
        if res_right:
            detected_right = res_right

    assert detected_right is not None
    assert detected_right[0] == "SWIPE_RIGHT"


def test_swipe_up_and_down():
    """11 & 12. Verify SWIPE_UP and SWIPE_DOWN detection."""
    detector = DynamicGestureDetector(speed_threshold=0.6, min_displacement=0.15, cooldown_sec=0.2)

    # Fast upward movement (Y decreases)
    now = 3000.0
    detected_up = None
    for i in range(8):
        y = 0.70 - (i * 0.035)
        lms = make_open_palm_landmarks(wrist_x=0.5, wrist_y=y)
        res_up = detector.evaluate(lms, handedness="Right", current_time=now + (i * 0.025))
        if res_up:
            detected_up = res_up

    assert detected_up is not None
    assert detected_up[0] == "SWIPE_UP"

    # Fast downward movement (Y increases)
    detector.reset()
    now = 4000.0
    detected_down = None
    for i in range(8):
        y = 0.30 + (i * 0.035)
        lms = make_open_palm_landmarks(wrist_x=0.5, wrist_y=y)
        res_down = detector.evaluate(lms, handedness="Right", current_time=now + (i * 0.025))
        if res_down:
            detected_down = res_down

    assert detected_down is not None
    assert detected_down[0] == "SWIPE_DOWN"


def test_circular_movement_detection():
    """13. Verify CIRCULAR_MOVEMENT detects complete 360-degree loop."""
    detector = DynamicGestureDetector(speed_threshold=0.4, cooldown_sec=0.2)
    center_x, center_y = 0.5, 0.5
    radius = 0.12

    # Simulate 16 points tracing a counter-clockwise circle
    now = 5000.0
    num_pts = 16
    detected = None

    for i in range(num_pts):
        angle = (2 * math.pi * i) / (num_pts - 1)
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        lms = make_open_palm_landmarks(wrist_x=x, wrist_y=y)
        res = detector.evaluate(lms, handedness="Right", current_time=now + (i * 0.04))
        if res and res[0] == "CIRCULAR_MOVEMENT":
            detected = res

    assert detected is not None
    assert detected[0] == "CIRCULAR_MOVEMENT"


# ==============================================================================
# 3. Two-Hand Gesture Unit Tests (14-17)
# ==============================================================================
def test_both_open_palms_and_pinching():
    """14 & 15. Verify BOTH_OPEN_PALMS and BOTH_HANDS_PINCHING."""
    engine = GestureRecognitionEngine(GestureSettings(static_confirmation_frames=1))

    # Two open palms
    left_palm = HandDetection(handedness="Left", confidence=0.98, landmarks=make_open_palm_landmarks(0.3, 0.5))
    right_palm = HandDetection(handedness="Right", confidence=0.98, landmarks=make_open_palm_landmarks(0.7, 0.5))

    result = engine.process_gestures([left_palm, right_palm])
    assert result.two_hand_gesture == "BOTH_OPEN_PALMS"

    # Two pinching hands
    left_pinch = make_open_palm_landmarks(0.3, 0.5)
    left_pinch[4] = create_landmark(4, 0.30, 0.40)
    left_pinch[8] = create_landmark(8, 0.31, 0.40)

    right_pinch = make_open_palm_landmarks(0.7, 0.5)
    right_pinch[4] = create_landmark(4, 0.70, 0.40)
    right_pinch[8] = create_landmark(8, 0.71, 0.40)

    d_left = HandDetection(handedness="Left", confidence=0.98, landmarks=left_pinch)
    d_right = HandDetection(handedness="Right", confidence=0.98, landmarks=right_pinch)

    result2 = engine.process_gestures([d_left, d_right])
    assert result2.two_hand_gesture == "BOTH_HANDS_PINCHING"


def test_hands_apart_and_together():
    """16 & 17. Verify HANDS_APART and HANDS_TOGETHER dynamic relative motion."""
    detector = TwoHandDetector(sensitivity=1.0, cooldown_sec=0.2)
    now = 6000.0

    # Moving apart: distance goes from 0.20 to 0.50 over 250ms
    res_apart = None
    for i in range(10):
        sep = 0.10 + (i * 0.02)
        h1 = HandDetection(handedness="Left", confidence=0.95, landmarks=make_open_palm_landmarks(0.5 - sep, 0.5))
        h2 = HandDetection(handedness="Right", confidence=0.95, landmarks=make_open_palm_landmarks(0.5 + sep, 0.5))
        from schemas.gesture import HandGestureResult
        g1 = HandGestureResult(handedness="Left", primary_gesture="OPEN_PALM", gesture_confidence=0.95)
        g2 = HandGestureResult(handedness="Right", primary_gesture="OPEN_PALM", gesture_confidence=0.95)

        r = detector.evaluate([h1, h2], [g1, g2], current_time=now + (i * 0.03))
        if r and r[0] == "HANDS_APART":
            res_apart = r
            break

    assert res_apart is not None
    assert res_apart[0] == "HANDS_APART"

    # Moving together: distance goes from 0.50 down to 0.15 over 250ms
    detector.reset()
    now = 7000.0
    res_together = None
    for i in range(10):
        sep = 0.25 - (i * 0.02)
        h1 = HandDetection(handedness="Left", confidence=0.95, landmarks=make_open_palm_landmarks(0.5 - sep, 0.5))
        h2 = HandDetection(handedness="Right", confidence=0.95, landmarks=make_open_palm_landmarks(0.5 + sep, 0.5))
        g1 = HandGestureResult(handedness="Left", primary_gesture="OPEN_PALM", gesture_confidence=0.95)
        g2 = HandGestureResult(handedness="Right", primary_gesture="OPEN_PALM", gesture_confidence=0.95)

        r = detector.evaluate([h1, h2], [g1, g2], current_time=now + (i * 0.03))
        if r and r[0] == "HANDS_TOGETHER":
            res_together = r
            break

    assert res_together is not None
    assert res_together[0] == "HANDS_TOGETHER"


# ==============================================================================
# 4. Stability, Cooldown, and Edge Cases (18-20)
# ==============================================================================
def test_gesture_stability_and_smoothing():
    """18. Verify GestureStabilizer rejects single-frame noise."""
    stabilizer = GestureStabilizer(confirmation_frames=3)

    # Start with steady OPEN_PALM
    g1, _ = stabilizer.stabilize("Right", "OPEN_PALM", 0.95)
    g2, _ = stabilizer.stabilize("Right", "OPEN_PALM", 0.95)
    g3, _ = stabilizer.stabilize("Right", "OPEN_PALM", 0.95)
    assert g3 == "OPEN_PALM"

    # Inject a 1-frame noisy glitch: FIST
    g_noisy, _ = stabilizer.stabilize("Right", "CLOSED_FIST", 0.90)
    # Must NOT switch to FIST on a single frame!
    assert g_noisy == "OPEN_PALM"

    # Return to OPEN_PALM
    g_return, _ = stabilizer.stabilize("Right", "OPEN_PALM", 0.95)
    assert g_return == "OPEN_PALM"


def test_cooldown_behavior():
    """19. Verify EventManager suppresses duplicate events within cooldown window."""
    event_mgr = GestureEventManager(event_cooldown_sec=0.40)
    now = 8000.0

    # First detection produces event
    events1 = event_mgr.check_static_transitions("Right", "OPEN_PALM", 0.95, timestamp=now)
    assert len(events1) == 1
    assert events1[0].event_type == "OPEN_PALM_DETECTED"

    # Consecutive frame with same gesture produces NO duplicate event
    events2 = event_mgr.check_static_transitions("Right", "OPEN_PALM", 0.95, timestamp=now + 0.03)
    assert len(events2) == 0

    # Rapid toggle within cooldown produces NO event
    events3 = event_mgr.check_static_transitions("Right", "CLOSED_FIST", 0.95, timestamp=now + 0.10)
    assert len(events3) == 1  # State changed to fist
    events4 = event_mgr.check_static_transitions("Right", "OPEN_PALM", 0.95, timestamp=now + 0.20)
    assert len(events4) == 0  # OPEN_PALM suppressed due to cooldown!


def test_no_hand_handling():
    """20. Verify engine safely handles empty detection lists without errors."""
    engine = GestureRecognitionEngine()
    result = engine.process_gestures([])
    assert len(result.hands) == 0
    assert result.two_hand_gesture is None
    assert len(result.events) == 0
