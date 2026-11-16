"""High-performance movement smoothing using the One Euro (1€) filter and EMA algorithms.

Provides jitter-free stationary cursor stability and zero-lag dynamic responsiveness.
Reference: Casiez et al., "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in HCI" (CHI 2012).
"""

import math
import time
from typing import Optional, Tuple


class LowPassFilter:
    """First-order low-pass filter with exponential smoothing."""

    def __init__(self, alpha: float = 1.0) -> None:
        self.set_alpha(alpha)
        self.y: Optional[float] = None
        self.s: Optional[float] = None

    def set_alpha(self, alpha: float) -> None:
        self.alpha = max(0.0, min(1.0, alpha))

    def filter(self, value: float) -> float:
        if self.y is None:
            self.s = value
        else:
            self.s = self.alpha * value + (1.0 - self.alpha) * self.s
        self.y = value
        return self.s

    def filter_with_alpha(self, value: float, alpha: float) -> float:
        self.set_alpha(alpha)
        return self.filter(value)

    def reset(self) -> None:
        self.y = None
        self.s = None


class OneEuroFilter:
    """Adaptive 1€ speed-based low-pass filter for 1D coordinates."""

    def __init__(
        self,
        freq: float = 30.0,
        min_cutoff: float = 0.8,
        beta: float = 1.5,
        d_cutoff: float = 1.0,
    ) -> None:
        """
        Args:
            freq: Sampling frequency estimate in Hz
            min_cutoff: Minimum cutoff frequency in Hz (lower = more stationary smoothing)
            beta: Speed coefficient for normalized coordinates (higher = faster adaptation to speed, lower lag)
            d_cutoff: Cutoff frequency for derivative in Hz
        """
        self.freq = max(1.0, freq)
        self.min_cutoff = max(0.01, min_cutoff)
        self.beta = max(0.0, beta)
        self.d_cutoff = max(0.01, d_cutoff)

        self.x_filter = LowPassFilter()
        self.dx_filter = LowPassFilter()
        self.last_time: Optional[float] = None

    def _alpha(self, rate: float, cutoff: float) -> float:
        tau = 1.0 / (2.0 * math.pi * cutoff)
        te = 1.0 / rate
        return 1.0 / (1.0 + tau / te)

    def filter(self, x: float, timestamp: Optional[float] = None) -> float:
        """Apply adaptive filter to new incoming position coordinate."""
        now = timestamp if timestamp is not None else time.time()

        if self.last_time is None:
            self.last_time = now
            return self.x_filter.filter(x)

        # Estimate sampling rate
        dt = now - self.last_time
        if dt <= 0.0001:
            return self.x_filter.s if self.x_filter.s is not None else x

        # If tracking was lost for more than 350ms, reset to prevent sudden snap
        if dt > 0.35:
            self.reset()
            self.last_time = now
            return self.x_filter.filter(x)

        self.last_time = now
        rate = 1.0 / dt

        # 1. Filter the derivative to get smooth velocity estimate
        prev_x = self.x_filter.y if self.x_filter.y is not None else x
        dx = (x - prev_x) * rate
        alpha_d = self._alpha(rate, self.d_cutoff)
        edx = self.dx_filter.filter_with_alpha(dx, alpha_d)

        # 2. Use filtered velocity to dynamically calculate cutoff frequency
        cutoff = self.min_cutoff + self.beta * abs(edx)
        alpha = self._alpha(rate, cutoff)

        # 3. Filter position using dynamic cutoff
        return self.x_filter.filter_with_alpha(x, alpha)

    def reset(self) -> None:
        """Clear filter states on tracking interruption."""
        self.x_filter.reset()
        self.dx_filter.reset()
        self.last_time = None


class CursorSmoother2D:
    """Dual-axis 2D cursor filter with configurable One Euro parameters and velocity estimation."""

    def __init__(
        self,
        min_cutoff: float = 0.8,
        beta: float = 1.5,
        smoothing_intensity: float = 0.5,
    ) -> None:
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.smoothing_intensity = smoothing_intensity

        eff_min_cutoff = max(0.1, min_cutoff * (1.8 - 1.4 * smoothing_intensity))
        eff_beta = max(0.05, beta * (0.2 + 2.0 * (1.0 - smoothing_intensity)))

        self.filter_x = OneEuroFilter(freq=30.0, min_cutoff=eff_min_cutoff, beta=eff_beta)
        self.filter_y = OneEuroFilter(freq=30.0, min_cutoff=eff_min_cutoff, beta=eff_beta)

        self.last_x: Optional[float] = None
        self.last_y: Optional[float] = None
        self.last_ts: Optional[float] = None
        self.velocity_x: float = 0.0
        self.velocity_y: float = 0.0
        self.speed: float = 0.0

    def update_parameters(
        self, min_cutoff: float, beta: float, smoothing_intensity: float
    ) -> None:
        """Update tuning parameters dynamically."""
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.smoothing_intensity = smoothing_intensity

        eff_min_cutoff = max(0.1, min_cutoff * (1.8 - 1.4 * smoothing_intensity))
        eff_beta = max(0.05, beta * (0.2 + 2.0 * (1.0 - smoothing_intensity)))

        self.filter_x.min_cutoff = eff_min_cutoff
        self.filter_x.beta = eff_beta
        self.filter_y.min_cutoff = eff_min_cutoff
        self.filter_y.beta = eff_beta

    def smooth(
        self, raw_x: float, raw_y: float, timestamp: Optional[float] = None
    ) -> Tuple[float, float, float, float, float]:
        """Smooth raw coordinates and compute instantaneous velocities.

        Returns:
            Tuple of (smoothed_x, smoothed_y, velocity_x, velocity_y, speed)
        """
        now = timestamp if timestamp is not None else time.time()

        smooth_x = self.filter_x.filter(raw_x, now)
        smooth_y = self.filter_y.filter(raw_y, now)

        # Clamping to [0.0, 1.0]
        smooth_x = max(0.0, min(1.0, smooth_x))
        smooth_y = max(0.0, min(1.0, smooth_y))

        # Calculate instantaneous velocity
        if self.last_ts is not None and self.last_x is not None and self.last_y is not None:
            dt = max(0.001, now - self.last_ts)
            if dt < 0.35:
                vx = (smooth_x - self.last_x) / dt
                vy = (smooth_y - self.last_y) / dt
                # Mild EMA on reported velocity for smooth telemetry display
                self.velocity_x = 0.7 * self.velocity_x + 0.3 * vx
                self.velocity_y = 0.7 * self.velocity_y + 0.3 * vy
                self.speed = math.hypot(self.velocity_x, self.velocity_y)
            else:
                self.velocity_x = 0.0
                self.velocity_y = 0.0
                self.speed = 0.0
        else:
            self.velocity_x = 0.0
            self.velocity_y = 0.0
            self.speed = 0.0

        self.last_x = smooth_x
        self.last_y = smooth_y
        self.last_ts = now

        return smooth_x, smooth_y, round(self.velocity_x, 3), round(self.velocity_y, 3), round(self.speed, 3)

    def reset(self) -> None:
        """Reset internal filter states."""
        self.filter_x.reset()
        self.filter_y.reset()
        self.last_x = None
        self.last_y = None
        self.last_ts = None
        self.velocity_x = 0.0
        self.velocity_y = 0.0
        self.speed = 0.0
