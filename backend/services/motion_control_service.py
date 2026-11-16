"""Master Motion Control Service for HANDVERSE (Module 05).

Coordinates multi-hand cursor calculation, calibration mapping, hand selection logic,
discrete pointer event emission, and SQLite configuration persistence.
"""

import json
import logging
import sqlite3
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from config import settings
from schemas.gesture import GestureEngineResult
from schemas.motion import CursorState, MotionControlResult, MotionSettings
from schemas.tracking import HandDetection
from services.calibration_service import CalibrationService
from services.cursor_service import CursorService

logger = logging.getLogger("HANDVERSE.MotionControlService")


class MotionControlService:
    """Master motion controller coordinating calibration, multi-hand virtual cursors, and pointer events."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        self.db_path = db_path or getattr(settings, "DATABASE_PATH", Path("data/handverse.db"))
        self.settings = MotionSettings()
        self.calibrator = CalibrationService(db_path=self.db_path)

        # Primary and secondary cursor pipelines
        self.primary_cursor_svc = CursorService("primary", self.calibrator, self.settings)
        self.secondary_cursor_svc = CursorService("secondary", self.calibrator, self.settings)

        self.last_primary_active: bool = False
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
        """Load motion settings from SQLite database."""
        try:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM settings WHERE key = 'motion_settings';")
                row = cursor.fetchone()
                if row:
                    data = json.loads(row[0])
                    self.settings = MotionSettings(**data)
                    self.primary_cursor_svc.update_settings(self.settings)
                    self.secondary_cursor_svc.update_settings(self.settings)
                    logger.info("Restored motion settings from SQLite database.")
            finally:
                conn.close()
        except Exception as exc:
            logger.warning(f"Could not load motion settings from DB: {exc}")

    def save_to_db(self) -> None:
        """Persist current motion settings to SQLite database."""
        try:
            conn = self._get_connection()
            try:
                with conn:
                    cursor = conn.cursor()
                    val = self.settings.model_dump_json()
                    cursor.execute(
                        """
                        INSERT INTO settings (key, value) VALUES ('motion_settings', ?)
                        ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                        """,
                        (val,),
                    )
                logger.info("Saved motion settings to SQLite database.")
            finally:
                conn.close()
        except Exception as exc:
            logger.error(f"Failed to save motion settings to DB: {exc}")

    def update_settings(self, new_settings: MotionSettings) -> MotionSettings:
        """Apply updated motion control parameters."""
        self.settings = new_settings
        self.primary_cursor_svc.update_settings(new_settings)
        self.secondary_cursor_svc.update_settings(new_settings)
        self.save_to_db()
        return self.settings

    def process_tracking(
        self,
        detected_hands: List[HandDetection],
        gesture_res: Optional[GestureEngineResult] = None,
        viewport_w: int = 1920,
        viewport_h: int = 1080,
        timestamp: Optional[float] = None,
    ) -> MotionControlResult:
        """Process incoming hand detections into motion control output."""
        now = timestamp if timestamp is not None else time.time()
        events: List[str] = []

        if not self.settings.enable_virtual_cursor:
            return MotionControlResult(
                primary_cursor=None,
                secondary_cursor=None,
                both_hands_active=False,
                is_calibrated=self.calibrator.profile.is_calibrated,
                active_hand=self.settings.control_hand,
                events=[],
            )

        # 1. Select primary and secondary hands based on control_hand preference
        primary_hand, secondary_hand = self._select_hands(detected_hands)

        # 2. Compute primary cursor state
        primary_cursor = self.primary_cursor_svc.process_hand(
            primary_hand, viewport_w, viewport_h, now
        )

        # 3. Compute secondary cursor state if present
        secondary_cursor = self.secondary_cursor_svc.process_hand(
            secondary_hand, viewport_w, viewport_h, now
        )

        # 4. Generate discrete motion events
        if primary_cursor is not None:
            if not self.last_primary_active:
                events.append("TRACKING_ACQUIRED")
                self.last_primary_active = True

            if primary_cursor.is_clicking:
                events.append("CURSOR_CLICKED")
            elif primary_cursor.is_pressed:
                events.append("CURSOR_PRESSED")
        else:
            if self.last_primary_active:
                events.append("TRACKING_LOST")
                self.last_primary_active = False

        both_hands = bool(primary_hand is not None and secondary_hand is not None)

        return MotionControlResult(
            primary_cursor=primary_cursor,
            secondary_cursor=secondary_cursor,
            both_hands_active=both_hands,
            is_calibrated=self.calibrator.profile.is_calibrated,
            active_hand=self.settings.control_hand,
            events=events,
        )

    def _select_hands(
        self, detected_hands: List[HandDetection]
    ) -> Tuple[Optional[HandDetection], Optional[HandDetection]]:
        """Identify which hand drives the primary vs secondary cursor."""
        if not detected_hands:
            return None, None

        mode = self.settings.control_hand.upper()

        if mode == "RIGHT":
            # Primary must be Right hand if present
            right_hand = next((h for h in detected_hands if h.handedness == "Right"), None)
            left_hand = next((h for h in detected_hands if h.handedness == "Left"), None)
            if right_hand:
                return right_hand, left_hand
            # If right not present, fallback to first available
            return detected_hands[0], None

        elif mode == "LEFT":
            # Primary must be Left hand if present
            left_hand = next((h for h in detected_hands if h.handedness == "Left"), None)
            right_hand = next((h for h in detected_hands if h.handedness == "Right"), None)
            if left_hand:
                return left_hand, right_hand
            # If left not present, fallback to first available
            return detected_hands[0], None

        else:  # "AUTO"
            # Prefer Right hand as primary if present, Left as secondary
            right_hand = next((h for h in detected_hands if h.handedness == "Right"), None)
            left_hand = next((h for h in detected_hands if h.handedness == "Left"), None)

            if right_hand and left_hand:
                return right_hand, left_hand
            elif right_hand:
                return right_hand, None
            elif left_hand:
                return left_hand, None
            else:
                return detected_hands[0], None

    def reset(self) -> None:
        """Reset internal cursor filter states."""
        self.primary_cursor_svc.reset()
        self.secondary_cursor_svc.reset()
        self.last_primary_active = False
