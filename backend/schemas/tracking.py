"""Pydantic schemas for real-time MediaPipe hand tracking."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from schemas.motion import CursorState


class TrackingStatus(str, Enum):
    """Real-time tracking operational status."""

    NO_CAMERA = "no_camera"
    CONNECTING = "connecting"
    NO_HAND = "no_hand"
    ONE_HAND = "one_hand"
    TWO_HANDS = "two_hands"
    TRACKING = "tracking"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class LandmarkPoint(BaseModel):
    """Normalized 3D landmark coordinate point."""

    id: int = Field(..., description="Landmark index (0-20)")
    x: float = Field(..., description="Normalized horizontal coordinate [0.0, 1.0]")
    y: float = Field(..., description="Normalized vertical coordinate [0.0, 1.0]")
    z: float = Field(..., description="Relative depth coordinate")


class WorldLandmarkPoint(BaseModel):
    """Metric 3D world landmark coordinate point (meters)."""

    id: int
    x: float
    y: float
    z: float


class HandDetection(BaseModel):
    """Landmark tracking results for an individual detected hand."""

    handedness: str = Field(..., description="'Left' or 'Right'")
    confidence: float = Field(..., description="Hand presence/detection confidence [0.0, 1.0]")
    landmarks: List[LandmarkPoint] = Field(..., description="21 normalized landmarks")
    world_landmarks: Optional[List[WorldLandmarkPoint]] = Field(
        default=None, description="21 metric world landmarks if available"
    )
    # Module 04 Gesture Fields
    primary_gesture: str = Field(default="NONE", description="Recognized primary gesture")
    gesture_confidence: float = Field(default=0.0, description="Confidence of recognized gesture")
    finger_states: Dict[str, str] = Field(
        default_factory=lambda: {
            "thumb": "FOLDED",
            "index": "FOLDED",
            "middle": "FOLDED",
            "ring": "FOLDED",
            "little": "FOLDED",
        }
    )
    is_pinching: bool = Field(default=False, description="Whether pinch is active")
    pinch_strength: float = Field(default=0.0, description="Pinch closure strength [0.0, 1.0]")
    pinch_distance: float = Field(default=1.0, description="Normalized pinch distance")
    pinch_started: bool = Field(default=False, description="Rising edge pinch event")
    pinch_released: bool = Field(default=False, description="Falling edge pinch event")


class TrackingResult(BaseModel):
    """Structured response payload returned via WebSocket for every video frame."""

    type: str = "tracking_result"
    timestamp: float = Field(..., description="Unix timestamp of frame processing")
    frame_id: int = Field(..., description="Sequential frame counter")
    hands_detected: int = Field(..., description="Number of hands detected (0, 1, or 2)")
    tracking_status: str = Field(..., description="Tracking status code (no_hand, one_hand, two_hands)")
    processing_time_ms: float = Field(..., description="Server-side processing duration in milliseconds")
    hands: List[HandDetection] = Field(default_factory=list, description="List of detected hands")
    # Module 04 Multi-Hand and Discrete Events
    two_hand_gesture: Optional[str] = Field(default=None, description="Cooperative two-hand gesture name")
    two_hand_confidence: float = Field(default=0.0, description="Confidence of two-hand gesture")
    events: List[Dict[str, Any]] = Field(default_factory=list, description="Discrete gesture events generated")
    # Module 05 Virtual Cursor & Motion Control Fields
    cursor: Optional[CursorState] = Field(default=None, description="Primary smoothed virtual cursor state")
    secondary_cursor: Optional[CursorState] = Field(default=None, description="Secondary virtual cursor state for two-hand mode")
    is_calibrated: bool = Field(default=False, description="Whether movement volume calibration is active")
    motion_events: List[str] = Field(default_factory=list, description="Motion pointer events (CLICKED, PRESSED, etc.)")
    # Performance Telemetry & Latency Profiling
    client_timestamp: Optional[float] = Field(default=None, description="Echoed client capture timestamp for end-to-end RTT")
    decode_time_ms: float = Field(default=0.0, description="Image JPEG decode duration in ms")
    inference_time_ms: float = Field(default=0.0, description="MediaPipe model inference duration in ms")
    gesture_time_ms: float = Field(default=0.0, description="Gesture classification duration in ms")
    motion_time_ms: float = Field(default=0.0, description="Motion control and One Euro smoothing duration in ms")
    server_queue_dropped: int = Field(default=0, description="Number of stale frames discarded by server queue")


class TrackingError(BaseModel):
    """Error payload returned when frame processing fails."""

    type: str = "tracking_error"
    frame_id: Optional[int] = None
    error_code: str
    message: str
