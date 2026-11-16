"""Gesture and coordinate smoothing module for HANDVERSE.

Applies filtering (e.g. Exponential Moving Average or 1-Euro Filter)
to minimize jitter from sensor and landmark noise.
Implementation will be finalized in subsequent modules.
"""

from typing import Tuple


class GestureSmoother:
    """Filters noisy landmark and pointer positions across consecutive frames."""

    def __init__(self, alpha: float = 0.5) -> None:
        self.alpha = alpha
        self.last_position: Tuple[float, float] = (0.0, 0.0)
        self.initialized: bool = False

    def smooth(self, x: float, y: float) -> Tuple[float, float]:
        """Apply smoothing filter to an (x, y) coordinate pair."""
        if not self.initialized:
            self.last_position = (x, y)
            self.initialized = True
            return self.last_position

        smoothed_x = self.alpha * x + (1.0 - self.alpha) * self.last_position[0]
        smoothed_y = self.alpha * y + (1.0 - self.alpha) * self.last_position[1]
        self.last_position = (smoothed_x, smoothed_y)
        return self.last_position

    def reset(self) -> None:
        """Reset historical positions."""
        self.initialized = False
        self.last_position = (0.0, 0.0)
