"""Virtual Cursor calculation and action mapping service (Module 05).

Translates index fingertip and palm landmark positions into smooth virtual cursor motions,
pinch clicks, drag states, and fist clutch locks.
"""

import time
from typing import Optional, Tuple
from schemas.motion import CursorState, MotionSettings
from schemas.tracking import HandDetection
from services.calibration_service import CalibrationService
from services.smoothing_service import CursorSmoother2D


class CursorService:
    """Manages virtual cursor position mapping, filtering, and click actions for a single hand channel."""

    def __init__(
        self,
        hand_id: str,
        calibration_service: CalibrationService,
        settings: Optional[MotionSettings] = None,
    ) -> None:
        self.hand_id = hand_id
        self.calibrator = calibration_service
        self.settings = settings or MotionSettings()

        self.smoother = CursorSmoother2D(
            min_cutoff=self.settings.one_euro_min_cutoff,
            beta=self.settings.one_euro_beta,
            smoothing_intensity=self.settings.smoothing_factor,
        )

        self.last_pressed: bool = False
        self.clutch_locked_x: Optional[float] = None
        self.clutch_locked_y: Optional[float] = None

    def update_settings(self, new_settings: MotionSettings) -> None:
        """Update runtime motion parameters."""
        self.settings = new_settings
        self.smoother.update_parameters(
            min_cutoff=new_settings.one_euro_min_cutoff,
            beta=new_settings.one_euro_beta,
            smoothing_intensity=new_settings.smoothing_factor,
        )

    def process_hand(
        self,
        hand: Optional[HandDetection],
        viewport_w: int = 1920,
        viewport_h: int = 1080,
        timestamp: Optional[float] = None,
    ) -> Optional[CursorState]:
        """Convert hand landmarks into virtual cursor state.

        Args:
            hand: Detected hand model with 21 landmarks and gesture states
            viewport_w: Reference screen width in pixels for screen_x calculation
            viewport_h: Reference screen height in pixels for screen_y calculation
            timestamp: Frame timestamp
        """
        now = timestamp if timestamp is not None else time.time()

        if hand is None or not hand.landmarks or len(hand.landmarks) < 21:
            self.smoother.reset()
            self.last_pressed = False
            self.clutch_locked_x = None
            self.clutch_locked_y = None
            return None

        # Primary pointing tracking landmark: Index Fingertip (Landmark 8)
        index_tip = hand.landmarks[8]
        raw_x = index_tip.x
        raw_y = index_tip.y

        # Fist clutch lock check: if user makes a tight fist, lock cursor position
        is_fist = hand.primary_gesture == "CLOSED_FIST"
        is_clutched = bool(self.settings.fist_clutch_enabled and is_fist)

        if is_clutched:
            if self.clutch_locked_x is None:
                self.clutch_locked_x = self.smoother.last_x if self.smoother.last_x is not None else raw_x
                self.clutch_locked_y = self.smoother.last_y if self.smoother.last_y is not None else raw_y
            norm_x = self.clutch_locked_x
            norm_y = self.clutch_locked_y
        else:
            self.clutch_locked_x = None
            self.clutch_locked_y = None

            # 1. Map camera coordinate to calibrated screen space
            norm_x, norm_y = self.calibrator.map_to_screen_space(
                raw_x,
                raw_y,
                sensitivity=self.settings.sensitivity * self.settings.cursor_speed,
                margin=self.settings.boundary_margin,
            )

        # 2. Smooth coordinates using 1€ filter and compute velocities
        smooth_x, smooth_y, vx, vy, speed = self.smoother.smooth(norm_x, norm_y, timestamp=now)

        # 3. Action mapping: Pinch -> Click & Press
        current_pinching = bool(hand.is_pinching)
        is_clicking = False
        is_pressed = False

        if self.settings.pinch_click_enabled:
            # Trigger single-frame click on pinch leading edge
            if current_pinching and not self.last_pressed:
                is_clicking = True
            is_pressed = current_pinching
            self.last_pressed = current_pinching
        else:
            self.last_pressed = False

        # Compute mapped pixel coordinates on reference screen
        px_x = int(round(smooth_x * viewport_w))
        px_y = int(round(smooth_y * viewport_h))

        return CursorState(
            x=round(smooth_x, 4),
            y=round(smooth_y, 4),
            raw_x=round(raw_x, 4),
            raw_y=round(raw_y, 4),
            screen_x=px_x,
            screen_y=px_y,
            velocity_x=vx,
            velocity_y=vy,
            speed=speed,
            is_pressed=is_pressed,
            is_clicking=is_clicking,
            is_clutched=is_clutched,
            hand=hand.handedness,
            tracking_confidence=hand.confidence,
            is_active=True,
            gesture=hand.primary_gesture,
            pinch_strength=hand.pinch_strength,
        )

    def reset(self) -> None:
        """Reset internal filter and clutch memory."""
        self.smoother.reset()
        self.last_pressed = False
        self.clutch_locked_x = None
        self.clutch_locked_y = None
