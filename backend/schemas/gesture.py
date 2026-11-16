"""Pydantic schemas for AI Hand Gesture Recognition Engine (Module 04)."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FingerState(str, Enum):
    """Extension status of an individual finger."""

    EXTENDED = "EXTENDED"
    FOLDED = "FOLDED"


class GestureType(str, Enum):
    """Complete enumeration of supported 16 static, dynamic, and two-hand gestures."""

    NONE = "NONE"
    # Static Gestures (1-7)
    OPEN_PALM = "OPEN_PALM"
    CLOSED_FIST = "CLOSED_FIST"
    INDEX_POINTING = "INDEX_POINTING"
    PINCH = "PINCH"
    VICTORY_SIGN = "VICTORY_SIGN"
    THUMBS_UP = "THUMBS_UP"
    THREE_FINGERS = "THREE_FINGERS"

    # Two-Hand Gestures (8-11)
    BOTH_OPEN_PALMS = "BOTH_OPEN_PALMS"
    BOTH_HANDS_PINCHING = "BOTH_HANDS_PINCHING"
    HANDS_APART = "HANDS_APART"
    HANDS_TOGETHER = "HANDS_TOGETHER"

    # Dynamic Gestures (12-16)
    SWIPE_LEFT = "SWIPE_LEFT"
    SWIPE_RIGHT = "SWIPE_RIGHT"
    SWIPE_UP = "SWIPE_UP"
    SWIPE_DOWN = "SWIPE_DOWN"
    CIRCULAR_MOVEMENT = "CIRCULAR_MOVEMENT"


class GestureEvent(BaseModel):
    """Structured discrete event emitted on gesture state transitions."""

    event_type: str = Field(..., description="Unique event identifier e.g. PINCH_STARTED, SWIPE_LEFT")
    gesture: str = Field(..., description="Gesture name")
    handedness: str = Field(..., description="'Left', 'Right', 'Both', or 'System'")
    confidence: float = Field(..., description="Confidence score [0.0, 1.0]")
    timestamp: float = Field(..., description="Unix timestamp of event generation")
    metadata: Dict[str, float] = Field(default_factory=dict, description="Custom kinematic telemetry")


class HandGestureResult(BaseModel):
    """Per-hand gesture classification analysis."""

    handedness: str
    primary_gesture: str = "NONE"
    gesture_confidence: float = 0.0
    finger_states: Dict[str, str] = Field(
        default_factory=lambda: {
            "thumb": "FOLDED",
            "index": "FOLDED",
            "middle": "FOLDED",
            "ring": "FOLDED",
            "little": "FOLDED",
        }
    )
    is_pinching: bool = False
    pinch_strength: float = 0.0
    pinch_distance: float = 1.0
    pinch_started: bool = False
    pinch_released: bool = False


class GestureEngineResult(BaseModel):
    """Complete aggregated gesture recognition output returned across WebSocket."""

    hands: List[HandGestureResult] = Field(default_factory=list)
    two_hand_gesture: Optional[str] = None
    two_hand_confidence: float = 0.0
    events: List[GestureEvent] = Field(default_factory=list)


class GestureSettings(BaseModel):
    """Configurable gesture recognition parameters and thresholds."""

    sensitivity: float = Field(1.0, ge=0.5, le=2.0, description="Overall sensitivity multiplier")
    pinch_activation_threshold: float = Field(0.35, ge=0.15, le=0.60)
    pinch_release_threshold: float = Field(0.50, ge=0.25, le=0.80)
    static_confirmation_frames: int = Field(3, ge=1, le=8)
    swipe_speed_threshold: float = Field(0.70, ge=0.30, le=1.80)
    swipe_min_distance: float = Field(0.15, ge=0.08, le=0.40)
    gesture_cooldown_ms: float = Field(400.0, ge=150.0, le=1000.0)
    two_hand_sensitivity: float = Field(1.0, ge=0.5, le=2.0)
