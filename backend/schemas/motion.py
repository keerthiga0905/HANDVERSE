"""Pydantic schemas for Virtual Cursor & Motion Control Engine (Module 05)."""

import time
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MotionSettings(BaseModel):
    """User-configurable motion-control parameters."""
    sensitivity: float = Field(default=1.2, ge=0.5, le=3.0, description="Movement gain multiplier")
    smoothing_factor: float = Field(default=0.5, ge=0.0, le=1.0, description="Overall smoothing intensity")
    one_euro_min_cutoff: float = Field(default=0.8, ge=0.1, le=5.0, description="One Euro min cutoff frequency (Hz)")
    one_euro_beta: float = Field(default=1.5, ge=0.01, le=20.0, description="One Euro velocity adaptation coefficient")
    control_hand: str = Field(default="AUTO", description="RIGHT, LEFT, or AUTO")
    cursor_speed: float = Field(default=1.0, ge=0.5, le=2.5, description="Cursor speed modifier")
    boundary_margin: float = Field(default=0.04, ge=0.0, le=0.20, description="Screen margin deadzone")
    enable_virtual_cursor: bool = Field(default=True, description="Enable virtual cursor rendering and calculations")
    mirror_preview: bool = Field(default=True, description="Mirror camera preview")
    fist_clutch_enabled: bool = Field(default=True, description="Freeze cursor when closed fist is detected (clutch)")
    pinch_click_enabled: bool = Field(default=True, description="Trigger clicks on pinch gestures")


class CursorState(BaseModel):
    """Real-time calculated virtual cursor state."""
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized smoothed screen X [0.0, 1.0]")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized smoothed screen Y [0.0, 1.0]")
    raw_x: float = Field(..., description="Unfiltered tracking coordinate X")
    raw_y: float = Field(..., description="Unfiltered tracking coordinate Y")
    screen_x: int = Field(default=0, description="Mapped pixel X on reference viewport")
    screen_y: int = Field(default=0, description="Mapped pixel Y on reference viewport")
    velocity_x: float = Field(default=0.0, description="Instantaneous horizontal velocity in norm/sec")
    velocity_y: float = Field(default=0.0, description="Instantaneous vertical velocity in norm/sec")
    speed: float = Field(default=0.0, description="Euclidean speed in norm/sec")
    is_pressed: bool = Field(default=False, description="Whether primary action/pinch is currently held down")
    is_clicking: bool = Field(default=False, description="Transient single-frame click trigger")
    is_clutched: bool = Field(default=False, description="Whether fist clutch is active, locking position")
    hand: str = Field(default="Unknown", description="Right, Left, or Unknown")
    tracking_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_active: bool = Field(default=True, description="Whether hand is currently tracked and in bounds")
    gesture: str = Field(default="NONE", description="Active gesture driving cursor")
    pinch_strength: float = Field(default=0.0, ge=0.0, le=1.0)


class MotionControlResult(BaseModel):
    """Output from the Motion Control Service for a single frame."""
    primary_cursor: Optional[CursorState] = None
    secondary_cursor: Optional[CursorState] = None
    both_hands_active: bool = False
    is_calibrated: bool = False
    active_hand: str = "AUTO"
    events: List[str] = Field(default_factory=list)
