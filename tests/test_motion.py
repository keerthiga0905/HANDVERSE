"""Automated unit and integration test suite for Module 05: Hand Calibration & Motion Control Engine.

Tests:
1. One Euro Filter and 2D movement smoothing.
2. Calibration boundary derivation, validation, and coordinate normalization.
3. Fist clutch and pinch click action mapping.
4. Left-hand, right-hand, and auto hand selection modes.
5. Two-hand dual cursor tracking.
6. Calibration and motion settings SQLite persistence and reset.
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

from schemas.calibration import (
    CalibrationBounds,
    CalibrationCaptureRequest,
    Point2D,
)
from schemas.motion import CursorState, MotionSettings
from schemas.tracking import HandDetection, LandmarkPoint
from services.calibration_service import CalibrationService
from services.cursor_service import CursorService
from services.motion_control_service import MotionControlService
from services.smoothing_service import CursorSmoother2D, OneEuroFilter


# ==============================================================================
# 1. Smoothing & One Euro Filter Tests
# ==============================================================================
def test_one_euro_filter_stationary_jitter_reduction():
    """Verify One Euro Filter significantly dampens stationary noise."""
    filt = OneEuroFilter(freq=30.0, min_cutoff=1.0, beta=0.01)
    base_pos = 0.50
    noisy_samples = [base_pos + 0.04 * ((-1) ** i) for i in range(20)]

    filtered_vals = []
    t = 1000.0
    for s in noisy_samples:
        t += 0.033
        filtered_vals.append(filt.filter(s, timestamp=t))

    # Variance of filtered samples should be much lower than raw noise
    raw_jitter = max(noisy_samples) - min(noisy_samples)
    filtered_jitter = max(filtered_vals[-10:]) - min(filtered_vals[-10:])

    assert raw_jitter >= 0.07
    assert filtered_jitter < 0.02, f"Filtered jitter too high: {filtered_jitter}"


def test_one_euro_filter_dynamic_adaptation():
    """Verify filter responds rapidly during fast displacement (low lag)."""
    filt = OneEuroFilter(freq=30.0, min_cutoff=0.8, beta=2.0)
    t = 1000.0

    # Initialize at 0.1
    filt.filter(0.1, timestamp=t)
    t += 0.033

    # Fast leap to 0.8 in 3 frames
    v1 = filt.filter(0.4, timestamp=t)
    t += 0.033
    v2 = filt.filter(0.7, timestamp=t)
    t += 0.033
    v3 = filt.filter(0.8, timestamp=t)

    # Filter should follow swift movement closely
    assert v3 > 0.70


def test_cursor_smoother_reset_on_gap():
    """Verify 2D cursor smoother resets cleanly after long tracking gap (>350ms)."""
    smoother = CursorSmoother2D()
    t = 1000.0

    smoother.smooth(0.2, 0.2, timestamp=t)
    t += 0.033
    smoother.smooth(0.22, 0.21, timestamp=t)

    # Simulate 1 second tracking loss
    t += 1.0
    sx, sy, vx, vy, speed = smoother.smooth(0.8, 0.8, timestamp=t)

    # Should reset to new position immediately without smoothing across the gap
    assert abs(sx - 0.8) < 0.05
    assert abs(sy - 0.8) < 0.05


# ==============================================================================
# 2. Calibration Bounds & Normalization Tests
# ==============================================================================
def test_calibration_bounds_calculation():
    """Verify boundary derivation from 4 corners and center."""
    tl = Point2D(x=0.20, y=0.20)
    tr = Point2D(x=0.80, y=0.22)
    bl = Point2D(x=0.18, y=0.78)
    br = Point2D(x=0.82, y=0.80)
    center = Point2D(x=0.50, y=0.50)

    bounds = CalibrationBounds.from_points(tl, tr, bl, br, center)

    assert bounds.is_valid is True
    assert bounds.min_x == 0.18
    assert bounds.max_x == 0.82
    assert bounds.min_y == 0.20
    assert bounds.max_y == 0.80
    assert bounds.width == pytest.approx(0.64, 0.01)
    assert bounds.height == pytest.approx(0.60, 0.01)


def test_calibration_bounds_rejects_undersized():
    """Verify calibration bounds validator rejects degenerate/tiny boxes."""
    tl = Point2D(x=0.50, y=0.50)
    tr = Point2D(x=0.55, y=0.50)
    bl = Point2D(x=0.50, y=0.55)
    br = Point2D(x=0.55, y=0.55)

    bounds = CalibrationBounds.from_points(tl, tr, bl, br)
    assert bounds.is_valid is False
    assert bounds.width < 0.15


def test_calibration_service_workflow(tmp_path):
    """Verify full 5-step calibration capture, completion, and reset."""
    db_file = tmp_path / "test_cal.db"
    calibrator = CalibrationService(db_path=db_file)

    # Start calibration
    calibrator.start_calibration(hand_mode="RIGHT")
    assert calibrator.profile.is_calibrated is False

    # Capture 4 corners
    calibrator.capture_point(CalibrationCaptureRequest(point_name="top_left", x=0.2, y=0.2))
    calibrator.capture_point(CalibrationCaptureRequest(point_name="top_right", x=0.8, y=0.2))
    calibrator.capture_point(CalibrationCaptureRequest(point_name="bottom_left", x=0.2, y=0.8))
    calibrator.capture_point(CalibrationCaptureRequest(point_name="bottom_right", x=0.8, y=0.8))
    calibrator.capture_point(CalibrationCaptureRequest(point_name="center", x=0.5, y=0.5))

    success, msg, bounds = calibrator.complete_calibration()
    assert success is True
    assert calibrator.profile.is_calibrated is True

    # Test coordinate mapping
    # Center (0.5, 0.5) should map to screen center (0.5, 0.5)
    sx, sy = calibrator.map_to_screen_space(0.5, 0.5, sensitivity=1.0, margin=0.0)
    assert pytest.approx(sx, 0.05) == 0.50
    assert pytest.approx(sy, 0.05) == 0.50

    # Top-left (0.2, 0.2) should map to screen edge (0.0, 0.0)
    sx, sy = calibrator.map_to_screen_space(0.2, 0.2, sensitivity=1.0, margin=0.0)
    assert sx == 0.0
    assert sy == 0.0

    # Reset calibration
    calibrator.reset_calibration()
    assert calibrator.profile.is_calibrated is False


# ==============================================================================
# 3. Virtual Cursor & Action Mapping Tests
# ==============================================================================
def create_dummy_hand(
    x: float, y: float, handedness: str = "Right", is_pinching: bool = False, gesture: str = "OPEN_PALM"
) -> HandDetection:
    """Helper to synthesize a HandDetection with index fingertip at (x, y)."""
    landmarks = [LandmarkPoint(id=i, x=x, y=y, z=0.0) for i in range(21)]
    # Landmark 8 is index tip
    landmarks[8] = LandmarkPoint(id=8, x=x, y=y, z=0.0)
    # Landmark 4 is thumb tip
    landmarks[4] = LandmarkPoint(id=4, x=x + (0.02 if is_pinching else 0.15), y=y, z=0.0)

    return HandDetection(
        handedness=handedness,
        confidence=0.95,
        landmarks=landmarks,
        primary_gesture=gesture,
        is_pinching=is_pinching,
        pinch_strength=1.0 if is_pinching else 0.0,
    )


def test_cursor_pinch_click_and_press(tmp_path):
    """Verify pinch gesture triggers single-frame is_clicking and sustained is_pressed."""
    calibrator = CalibrationService(db_path=tmp_path / "cal.db")
    cursor_svc = CursorService("test", calibrator)

    t = 1000.0
    # 1. Hovering (no pinch)
    h1 = create_dummy_hand(0.5, 0.5, is_pinching=False)
    c1 = cursor_svc.process_hand(h1, timestamp=t)
    assert c1.is_clicking is False
    assert c1.is_pressed is False

    # 2. Pinch starts (rising edge)
    t += 0.033
    h2 = create_dummy_hand(0.5, 0.5, is_pinching=True)
    c2 = cursor_svc.process_hand(h2, timestamp=t)
    assert c2.is_clicking is True, "Expected is_clicking=True on pinch start"
    assert c2.is_pressed is True

    # 3. Pinch continues held
    t += 0.033
    h3 = create_dummy_hand(0.5, 0.5, is_pinching=True)
    c3 = cursor_svc.process_hand(h3, timestamp=t)
    assert c3.is_clicking is False, "is_clicking should only be True for one frame"
    assert c3.is_pressed is True, "is_pressed should stay True while holding"

    # 4. Pinch released
    t += 0.033
    h4 = create_dummy_hand(0.5, 0.5, is_pinching=False)
    c4 = cursor_svc.process_hand(h4, timestamp=t)
    assert c4.is_clicking is False
    assert c4.is_pressed is False


def test_cursor_fist_clutch(tmp_path):
    """Verify CLOSED_FIST gesture freezes cursor position (clutch mode)."""
    calibrator = CalibrationService(db_path=tmp_path / "cal.db")
    settings = MotionSettings(fist_clutch_enabled=True)
    cursor_svc = CursorService("test", calibrator, settings=settings)

    t = 1000.0
    # Start at 0.5
    h1 = create_dummy_hand(0.5, 0.5, gesture="OPEN_PALM")
    c1 = cursor_svc.process_hand(h1, timestamp=t)
    locked_x = c1.x

    # Move hand while clenching fist
    t += 0.033
    h2 = create_dummy_hand(0.8, 0.8, gesture="CLOSED_FIST")
    c2 = cursor_svc.process_hand(h2, timestamp=t)

    assert c2.is_clutched is True
    assert abs(c2.x - locked_x) < 0.02, "Cursor should remain locked during fist clutch"


# ==============================================================================
# 4. Multi-Hand & Motion Control Service Tests
# ==============================================================================
def test_motion_control_hand_selection(tmp_path):
    """Verify right/left/auto hand selection modes."""
    service = MotionControlService(db_path=tmp_path / "motion.db")

    right_hand = create_dummy_hand(0.7, 0.5, handedness="Right")
    left_hand = create_dummy_hand(0.3, 0.5, handedness="Left")

    # Mode: RIGHT
    service.update_settings(MotionSettings(control_hand="RIGHT"))
    res_right = service.process_tracking([left_hand, right_hand])
    assert res_right.primary_cursor.hand == "Right"
    assert res_right.secondary_cursor.hand == "Left"

    # Mode: LEFT
    service.update_settings(MotionSettings(control_hand="LEFT"))
    res_left = service.process_tracking([left_hand, right_hand])
    assert res_left.primary_cursor.hand == "Left"
    assert res_left.secondary_cursor.hand == "Right"

    # Mode: AUTO with only Left hand present
    service.update_settings(MotionSettings(control_hand="AUTO"))
    res_auto = service.process_tracking([left_hand])
    assert res_auto.primary_cursor.hand == "Left"
    assert res_auto.secondary_cursor is None


def test_motion_control_tracking_events(tmp_path):
    """Verify discrete tracking acquired, clicked, and lost events."""
    service = MotionControlService(db_path=tmp_path / "motion.db")
    t = 1000.0

    # 1. No hand initially
    res0 = service.process_tracking([], timestamp=t)
    assert res0.primary_cursor is None

    # 2. Hand enters frame -> TRACKING_ACQUIRED
    t += 0.033
    hand = create_dummy_hand(0.5, 0.5, is_pinching=False)
    res1 = service.process_tracking([hand], timestamp=t)
    assert "TRACKING_ACQUIRED" in res1.events

    # 3. Pinch clicked -> CURSOR_CLICKED
    t += 0.033
    hand_pinch = create_dummy_hand(0.5, 0.5, is_pinching=True)
    res2 = service.process_tracking([hand_pinch], timestamp=t)
    assert "CURSOR_CLICKED" in res2.events

    # 4. Hand disappears -> TRACKING_LOST
    t += 0.033
    res3 = service.process_tracking([], timestamp=t)
    assert "TRACKING_LOST" in res3.events
