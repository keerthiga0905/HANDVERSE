"""Dynamic gesture recognition: Swipes and Circular Trajectories."""

from collections import deque
import math
import time
from typing import Deque, Dict, List, Optional, Tuple

from schemas.tracking import LandmarkPoint


class HandTrajectoryPoint:
    """Timestamped 2D coordinate point along hand trajectory."""

    def __init__(self, x: float, y: float, timestamp: float) -> None:
        self.x = x
        self.y = y
        self.timestamp = timestamp


class DynamicGestureDetector:
    """Detects rapid swipe motions and circular paths from temporal hand trajectories."""

    def __init__(
        self,
        speed_threshold: float = 0.70,  # normalized screen units per second
        min_displacement: float = 0.15,  # minimum distance traversed
        cooldown_sec: float = 0.45,
    ) -> None:
        self.speed_threshold = speed_threshold
        self.min_displacement = min_displacement
        self.cooldown_sec = cooldown_sec

        # Trajectory history per hand: max 30 points (approx 1 second at 30 fps)
        self._histories: Dict[str, Deque[HandTrajectoryPoint]] = {
            "Left": deque(maxlen=30),
            "Right": deque(maxlen=30),
        }

        # Timestamp of last triggered dynamic gesture per hand
        self._last_trigger_times: Dict[str, float] = {"Left": 0.0, "Right": 0.0}

    def update_settings(self, speed_threshold: float, min_displacement: float, cooldown_sec: float) -> None:
        """Update dynamic gesture tuning parameters."""
        self.speed_threshold = speed_threshold
        self.min_displacement = min_displacement
        self.cooldown_sec = cooldown_sec

    def evaluate(
        self, landmarks: List[LandmarkPoint], handedness: str = "Right", current_time: Optional[float] = None
    ) -> Optional[Tuple[str, float]]:
        """Evaluate landmarks trajectory and detect dynamic gestures.

        Returns:
            Tuple of (gesture_name, confidence) if a dynamic gesture triggered, else None.
        """
        if len(landmarks) < 21:
            return None

        now = current_time if current_time is not None else time.time()

        # Check cooldown
        if (now - self._last_trigger_times.get(handedness, 0.0)) < self.cooldown_sec:
            return None

        # Hand center: average of wrist (0) and middle MCP (9)
        center_x = (landmarks[0].x + landmarks[9].x) * 0.5
        center_y = (landmarks[0].y + landmarks[9].y) * 0.5

        history = self._histories.setdefault(handedness, deque(maxlen=30))
        history.append(HandTrajectoryPoint(center_x, center_y, now))

        if len(history) < 5:
            return None

        # 1. Check for Circular Movement (inspect window ~0.5s - 1.0s)
        circular_res = self._detect_circular_movement(history, now)
        if circular_res:
            self._last_trigger_times[handedness] = now
            history.clear()
            return ("CIRCULAR_MOVEMENT", circular_res)

        # 2. Check for Swipe Gestures (inspect window ~120ms - 350ms)
        swipe_res = self._detect_swipe(history, now)
        if swipe_res:
            gesture_name, confidence = swipe_res
            self._last_trigger_times[handedness] = now
            history.clear()
            return (gesture_name, confidence)

        return None

    def _detect_swipe(
        self, history: Deque[HandTrajectoryPoint], now: float
    ) -> Optional[Tuple[str, float]]:
        """Detect directional swipe movement."""
        current = history[-1]
        start_point: Optional[HandTrajectoryPoint] = None

        # Search from oldest point in the 100ms - 400ms window to maximize baseline stroke
        for pt in history:
            dt = current.timestamp - pt.timestamp
            if 0.10 <= dt <= 0.40:
                start_point = pt
                break

        if not start_point:
            return None

        dt = current.timestamp - start_point.timestamp
        if dt <= 0.04:
            return None

        dx = current.x - start_point.x
        dy = current.y - start_point.y
        dist = math.sqrt(dx ** 2 + dy ** 2)
        speed = dist / dt

        # Require sufficient displacement and speed
        if dist < self.min_displacement or speed < self.speed_threshold:
            return None

        # Check trajectory straightness: sum segment distances between start_point and current
        pts_in_window = [p for p in history if p.timestamp >= start_point.timestamp]
        total_path_len = 0.0
        for i in range(1, len(pts_in_window)):
            total_path_len += math.sqrt(
                (pts_in_window[i].x - pts_in_window[i - 1].x) ** 2
                + (pts_in_window[i].y - pts_in_window[i - 1].y) ** 2
            )

        # If path is curvier than a straight swipe (straightness ratio < 0.75), reject as swipe
        if total_path_len > 0 and (dist / total_path_len) < 0.75:
            return None

        # Check directional consistency: start velocity and end velocity must align (straight line, not arc)
        if len(pts_in_window) >= 4:
            v_start = (pts_in_window[1].x - pts_in_window[0].x, pts_in_window[1].y - pts_in_window[0].y)
            v_end = (current.x - pts_in_window[-2].x, current.y - pts_in_window[-2].y)
            mag_s = math.sqrt(v_start[0] ** 2 + v_start[1] ** 2)
            mag_e = math.sqrt(v_end[0] ** 2 + v_end[1] ** 2)
            if mag_s > 0.001 and mag_e > 0.001:
                cos_dir = (v_start[0] * v_end[0] + v_start[1] * v_end[1]) / (mag_s * mag_e)
                if cos_dir < 0.60:
                    return None  # Trajectory turned significantly (arc / curve), not a straight swipe

        abs_dx = abs(dx)
        abs_dy = abs(dy)

        # Determine dominant direction with strict directional bias (ratio > 1.5)
        if abs_dx > abs_dy * 1.5:
            confidence = min(1.0, 0.70 + (speed / 2.5) * 0.30)
            if dx < 0:
                return ("SWIPE_LEFT", round(confidence, 2))
            else:
                return ("SWIPE_RIGHT", round(confidence, 2))

        elif abs_dy > abs_dx * 1.5:
            confidence = min(1.0, 0.70 + (speed / 2.5) * 0.30)
            if dy < 0:
                return ("SWIPE_UP", round(confidence, 2))
            else:
                return ("SWIPE_DOWN", round(confidence, 2))

        return None

    def _detect_circular_movement(
        self, history: Deque[HandTrajectoryPoint], now: float
    ) -> Optional[float]:
        """Detect full or near-full circular hand trajectories."""
        # Need at least 12 trajectory samples covering at least 0.45 seconds
        valid_pts = [p for p in history if (now - p.timestamp) <= 1.0]
        if len(valid_pts) < 12:
            return None

        # Compute centroid of trajectory
        avg_x = sum(p.x for p in valid_pts) / len(valid_pts)
        avg_y = sum(p.y for p in valid_pts) / len(valid_pts)

        # Compute distances from centroid (radii)
        radii = [math.sqrt((p.x - avg_x) ** 2 + (p.y - avg_y) ** 2) for p in valid_pts]
        mean_radius = sum(radii) / len(radii)

        # Circle must be large enough (> 0.08 normalized units)
        if mean_radius < 0.08:
            return None

        # Check radius consistency (circle shouldn't be a straight line)
        variance = sum((r - mean_radius) ** 2 for r in radii) / len(radii)
        std_dev = math.sqrt(variance)
        if std_dev / mean_radius > 0.40:
            return None

        # Compute accumulated angular travel
        angles = [math.atan2(p.y - avg_y, p.x - avg_x) for p in valid_pts]
        total_angle_change = 0.0

        for i in range(1, len(angles)):
            diff = angles[i] - angles[i - 1]
            # Normalize angle difference to [-pi, pi]
            while diff > math.pi:
                diff -= 2 * math.pi
            while diff < -math.pi:
                diff += 2 * math.pi
            total_angle_change += diff

        # If accumulated angle change >= 1.75 * pi (~315 degrees in one direction)
        if abs(total_angle_change) >= 1.75 * math.pi:
            confidence = min(0.98, 0.75 + (abs(total_angle_change) / (2 * math.pi)) * 0.23)
            return round(confidence, 2)

        return None

    def reset(self) -> None:
        """Clear all historical trajectories."""
        self._histories["Left"].clear()
        self._histories["Right"].clear()
        self._last_trigger_times = {"Left": 0.0, "Right": 0.0}
