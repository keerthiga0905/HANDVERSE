"""Screen mapping and interaction area calibration module for HANDVERSE.

Maps camera-space coordinates into Pygame window coordinates with deadzones
and custom interaction bounds.
Implementation will be finalized in subsequent modules.
"""

from typing import Tuple


class CalibrationManager:
    """Manages coordinate space transformations and user calibration bounds."""

    def __init__(
        self,
        screen_size: Tuple[int, int] = (1280, 720),
        margin: float = 0.1,
    ) -> None:
        self.screen_width, self.screen_height = screen_size
        self.margin = margin

    def map_to_screen(self, norm_x: float, norm_y: float) -> Tuple[int, int]:
        """Convert normalized camera coordinates [0.0, 1.0] to screen pixels."""
        clamped_x = max(self.margin, min(1.0 - self.margin, norm_x))
        clamped_y = max(self.margin, min(1.0 - self.margin, norm_y))

        adjusted_x = (clamped_x - self.margin) / (1.0 - 2 * self.margin)
        adjusted_y = (clamped_y - self.margin) / (1.0 - 2 * self.margin)

        screen_x = int(adjusted_x * self.screen_width)
        screen_y = int(adjusted_y * self.screen_height)
        return screen_x, screen_y
