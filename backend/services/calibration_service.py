"""Calibration Service for HANDVERSE Motion Control (Module 05).

Coordinates guided multi-point capture, boundary validation, coordinate normalization,
and persistent SQLite storage.
"""

import json
import logging
import sqlite3
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from config import settings
from schemas.calibration import (
    CalibrationBounds,
    CalibrationCaptureRequest,
    CalibrationPoint,
    CalibrationProfile,
    CalibrationStatusResponse,
    Point2D,
)

logger = logging.getLogger("HANDVERSE.CalibrationService")


class CalibrationService:
    """Manages hand-space calibration state, boundary derivation, and persistence."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        self.db_path = db_path or getattr(settings, "DATABASE_PATH", Path("data/handverse.db"))
        self.profile = CalibrationProfile()
        self.active_step: int = 1
        self.points_buffer: Dict[str, Point2D] = {}
        self.load_from_db()

    def _get_connection(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )
        return conn

    def load_from_db(self) -> None:
        """Load stored calibration profile from SQLite database."""
        try:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM settings WHERE key = 'calibration_profile';")
                row = cursor.fetchone()
                if row:
                    data = json.loads(row[0])
                    self.profile = CalibrationProfile(**data)
                    logger.info("Restored saved calibration profile from SQLite database.")
            finally:
                conn.close()
        except Exception as exc:
            logger.warning(f"Could not load calibration profile from DB: {exc}")

    def save_to_db(self) -> None:
        """Persist current calibration profile to SQLite database."""
        try:
            conn = self._get_connection()
            try:
                with conn:
                    cursor = conn.cursor()
                    val = self.profile.model_dump_json()
                    cursor.execute(
                        """
                        INSERT INTO settings (key, value) VALUES ('calibration_profile', ?)
                        ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                        """,
                        (val,),
                    )
                logger.info("Saved calibration profile to SQLite database.")
            finally:
                conn.close()
        except Exception as exc:
            logger.error(f"Failed to save calibration profile to DB: {exc}")

    def start_calibration(self, hand_mode: str = "AUTO") -> CalibrationStatusResponse:
        """Initialize a new calibration sequence."""
        self.active_step = 1
        self.points_buffer = {}
        self.profile.hand_mode = hand_mode
        self.profile.is_calibrated = False
        return self.get_status("Calibration started. Place your hand steadily in camera view.")

    def capture_point(self, req: CalibrationCaptureRequest) -> Tuple[bool, str, int]:
        """Capture a landmark coordinate for a named calibration target.

        Target names: 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'
        """
        valid_targets = {"top_left", "top_right", "bottom_left", "bottom_right", "center"}
        if req.point_name not in valid_targets:
            return False, f"Invalid target name '{req.point_name}'. Expected one of {valid_targets}", self.active_step

        if req.x is None or req.y is None:
            return False, "Coordinates (x, y) must be provided.", self.active_step

        # Validate range [0.0, 1.0]
        clamped_x = max(0.0, min(1.0, float(req.x)))
        clamped_y = max(0.0, min(1.0, float(req.y)))

        self.points_buffer[req.point_name] = Point2D(x=clamped_x, y=clamped_y)
        logger.info(f"Captured calibration point '{req.point_name}': ({clamped_x:.3f}, {clamped_y:.3f})")

        # Update step progression
        captured_keys = set(self.points_buffer.keys())
        corners = {"top_left", "top_right", "bottom_left", "bottom_right"}

        if not corners.issubset(captured_keys):
            self.active_step = 3  # In corner capture stage
            remaining = corners - captured_keys
            msg = f"Target '{req.point_name}' captured. Remaining corners: {', '.join(remaining)}."
        elif "center" not in captured_keys:
            self.active_step = 4  # Corner done, ask for center
            msg = "All 4 corners captured! Now hold your hand at the center position."
        else:
            self.active_step = 5  # Ready to finalize
            msg = "All 5 calibration targets captured! Ready to complete calibration."

        return True, msg, self.active_step

    def complete_calibration(self) -> Tuple[bool, str, CalibrationBounds]:
        """Validate captured points and build permanent CalibrationBounds."""
        corners = {"top_left", "top_right", "bottom_left", "bottom_right"}
        if not corners.issubset(set(self.points_buffer.keys())):
            missing = corners - set(self.points_buffer.keys())
            return False, f"Cannot complete calibration: missing required corners {missing}", self.profile.bounds

        tl = self.points_buffer["top_left"]
        tr = self.points_buffer["top_right"]
        bl = self.points_buffer["bottom_left"]
        br = self.points_buffer["bottom_right"]
        ctr = self.points_buffer.get("center")

        bounds = CalibrationBounds.from_points(tl, tr, bl, br, ctr)

        if not bounds.is_valid:
            return False, (
                f"Calibration area too small (width: {bounds.width:.2f}, height: {bounds.height:.2f}). "
                "Minimum size is 0.15 x 0.15. Please spread corners further apart."
            ), bounds

        # Update profile
        self.profile.bounds = bounds
        self.profile.is_calibrated = True
        self.profile.points_captured = dict(self.points_buffer)
        self.profile.updated_at = time.time()
        self.active_step = 5

        # Persist to database
        self.save_to_db()

        return True, "Calibration completed successfully and saved to profile.", bounds

    def reset_calibration(self) -> CalibrationStatusResponse:
        """Reset active calibration to defaults."""
        self.profile = CalibrationProfile()
        self.points_buffer = {}
        self.active_step = 1
        self.save_to_db()
        return self.get_status("Calibration reset to factory defaults.")

    def map_to_screen_space(
        self, raw_x: float, raw_y: float, sensitivity: float = 1.0, margin: float = 0.05
    ) -> Tuple[float, float]:
        """Normalize camera-space coordinates into calibrated screen-space [0.0, 1.0].

        Args:
            raw_x: Normalized horizontal coordinate in [0, 1]
            raw_y: Normalized vertical coordinate in [0, 1]
            sensitivity: Gain multiplier
            margin: Edge margin deadzone
        """
        bounds = self.profile.bounds

        # Width and height of calibrated bounding box
        bw = max(0.05, bounds.width)
        bh = max(0.05, bounds.height)

        # 1. Normalize relative to calibration box
        norm_x = (raw_x - bounds.min_x) / bw
        norm_y = (raw_y - bounds.min_y) / bh

        # 2. Apply sensitivity centered around midpoint (0.5)
        # S > 1.0 expands reaching range; S < 1.0 requires wider physical motion
        mapped_x = 0.5 + (norm_x - 0.5) * sensitivity
        mapped_y = 0.5 + (norm_y - 0.5) * sensitivity

        # 3. Apply edge margin deadzone
        if margin > 0.0:
            scale = 1.0 + 2.0 * margin
            mapped_x = (mapped_x - margin) * scale
            mapped_y = (mapped_y - margin) * scale

        # 4. Strict clamp to screen bounds [0.0, 1.0]
        clamped_x = max(0.0, min(1.0, mapped_x))
        clamped_y = max(0.0, min(1.0, mapped_y))

        return clamped_x, clamped_y

    def get_status(self, message: str = "") -> CalibrationStatusResponse:
        """Construct current calibration status report."""
        msg = message or (
            "Calibration active and ready." if self.profile.is_calibrated else "System not calibrated."
        )
        return CalibrationStatusResponse(
            is_calibrated=self.profile.is_calibrated,
            active_step=self.active_step,
            points_captured=list(self.points_buffer.keys()),
            bounds=self.profile.bounds,
            hand_mode=self.profile.hand_mode,
            message=msg,
        )
