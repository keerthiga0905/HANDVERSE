"""HANDVERSE - Global Configuration Module.

Centralized configuration settings for the HANDVERSE arcade application.
Provides structured, typed configuration classes and constants to avoid
hardcoding values throughout the codebase.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Tuple

# ==============================================================================
# Path Configuration
# ==============================================================================
BASE_DIR: Path = Path(__file__).resolve().parent
ASSETS_DIR: Path = BASE_DIR / "assets"
IMAGES_DIR: Path = ASSETS_DIR / "images"
SOUNDS_DIR: Path = ASSETS_DIR / "sounds"
FONTS_DIR: Path = ASSETS_DIR / "fonts"
DATA_DIR: Path = BASE_DIR / "data"
DATABASE_PATH: Path = DATA_DIR / "handverse.db"


# ==============================================================================
# Domain-Specific Configuration Dataclasses
# ==============================================================================
@dataclass(frozen=True)
class DisplayConfig:
    """Display, window, and rendering parameters."""

    title: str = "HANDVERSE - Motion Arcade"
    window_width: int = 1280
    window_height: int = 720
    fps: int = 60
    fullscreen: bool = False

    @property
    def resolution(self) -> Tuple[int, int]:
        """Return the window dimensions as a (width, height) tuple."""
        return self.window_width, self.window_height


@dataclass(frozen=True)
class CameraConfig:
    """Webcam capture and stream parameters."""

    camera_index: int = 0
    frame_width: int = 640
    frame_height: int = 480
    fps: int = 30

    @property
    def resolution(self) -> Tuple[int, int]:
        """Return the camera capture dimensions as a (width, height) tuple."""
        return self.frame_width, self.frame_height


@dataclass(frozen=True)
class TrackingConfig:
    """MediaPipe hand tracking and detection parameters."""

    max_num_hands: int = 2
    min_detection_confidence: float = 0.7
    min_tracking_confidence: float = 0.6
    gesture_sensitivity: float = 1.0  # Sensitivity multiplier (0.5 to 2.0)


@dataclass(frozen=True)
class AudioConfig:
    """Sound system and audio playback parameters."""

    sound_enabled: bool = True
    master_volume: float = 0.8
    sfx_volume: float = 0.7
    music_volume: float = 0.5


# ==============================================================================
# Master Application Configuration
# ==============================================================================
@dataclass(frozen=True)
class AppConfig:
    """Master application configuration aggregate."""

    app_name: str = "HANDVERSE"
    app_version: str = "0.1.0"
    display: DisplayConfig = field(default_factory=DisplayConfig)
    camera: CameraConfig = field(default_factory=CameraConfig)
    tracking: TrackingConfig = field(default_factory=TrackingConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)


# ==============================================================================
# Global Default Instance & Direct Constants
# ==============================================================================
DEFAULT_CONFIG: AppConfig = AppConfig()

# Application Identifiers
APPLICATION_NAME: str = DEFAULT_CONFIG.app_name
APPLICATION_VERSION: str = DEFAULT_CONFIG.app_version

# Window and Display
WINDOW_WIDTH: int = DEFAULT_CONFIG.display.window_width
WINDOW_HEIGHT: int = DEFAULT_CONFIG.display.window_height
TARGET_FPS: int = DEFAULT_CONFIG.display.fps
WINDOW_TITLE: str = DEFAULT_CONFIG.display.title

# Camera Settings
CAMERA_INDEX: int = DEFAULT_CONFIG.camera.camera_index
CAMERA_WIDTH: int = DEFAULT_CONFIG.camera.frame_width
CAMERA_HEIGHT: int = DEFAULT_CONFIG.camera.frame_height
CAMERA_RESOLUTION: Tuple[int, int] = DEFAULT_CONFIG.camera.resolution

# Tracking and Gesture Settings
HAND_TRACKING_CONFIDENCE: float = DEFAULT_CONFIG.tracking.min_detection_confidence
HAND_TRACKING_MIN_CONFIDENCE: float = DEFAULT_CONFIG.tracking.min_tracking_confidence
MAX_NUM_HANDS: int = DEFAULT_CONFIG.tracking.max_num_hands
DEFAULT_GESTURE_SENSITIVITY: float = DEFAULT_CONFIG.tracking.gesture_sensitivity

# Audio Settings
SOUND_ENABLED: bool = DEFAULT_CONFIG.audio.sound_enabled

# Compatibility Export for Backend Settings
try:
    from backend.config import settings
except Exception:
    settings = None

