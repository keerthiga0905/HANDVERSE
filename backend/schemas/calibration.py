"""Pydantic schemas for Hand Calibration Engine (Module 05)."""

import time
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Point2D(BaseModel):
    """2D normalized point in camera coordinate space [0.0, 1.0]."""
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized horizontal coordinate")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized vertical coordinate")


class CalibrationPoint(BaseModel):
    """Specific calibration target capture point."""
    name: str = Field(..., description="Target point identifier: top_left, top_right, bottom_left, bottom_right, center")
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    timestamp: float = Field(default_factory=time.time)


class CalibrationBounds(BaseModel):
    """Calibrated interactive movement volume boundaries."""
    min_x: float = Field(default=0.15, ge=0.0, le=0.85)
    max_x: float = Field(default=0.85, ge=0.15, le=1.0)
    min_y: float = Field(default=0.15, ge=0.0, le=0.85)
    max_y: float = Field(default=0.85, ge=0.15, le=1.0)
    center_x: float = Field(default=0.50, ge=0.0, le=1.0)
    center_y: float = Field(default=0.50, ge=0.0, le=1.0)
    width: float = Field(default=0.70)
    height: float = Field(default=0.70)
    is_valid: bool = Field(default=True)

    @classmethod
    def from_points(
        cls,
        top_left: Point2D,
        top_right: Point2D,
        bottom_left: Point2D,
        bottom_right: Point2D,
        center: Optional[Point2D] = None,
    ) -> "CalibrationBounds":
        """Compute bounding envelope from the 4 corner points with safety margins."""
        min_x = max(0.0, min(top_left.x, bottom_left.x))
        max_x = min(1.0, max(top_right.x, bottom_right.x))
        min_y = max(0.0, min(top_left.y, top_right.y))
        max_y = min(1.0, max(bottom_left.y, bottom_right.y))

        width = round(max(0.0, max_x - min_x), 4)
        height = round(max(0.0, max_y - min_y), 4)

        cx = center.x if center else round((min_x + max_x) / 2.0, 4)
        cy = center.y if center else round((min_y + max_y) / 2.0, 4)

        # Minimum required volume: at least 0.15 width & height
        is_valid = width >= 0.15 and height >= 0.15 and min_x < max_x and min_y < max_y

        return cls(
            min_x=round(min_x, 4),
            max_x=round(max_x, 4),
            min_y=round(min_y, 4),
            max_y=round(max_y, 4),
            center_x=round(cx, 4),
            center_y=round(cy, 4),
            width=width,
            height=height,
            is_valid=is_valid,
        )


class CalibrationProfile(BaseModel):
    """Complete stored calibration profile."""
    id: str = "default"
    hand_mode: str = "AUTO"
    bounds: CalibrationBounds = Field(default_factory=CalibrationBounds)
    is_calibrated: bool = False
    points_captured: Dict[str, Point2D] = Field(default_factory=dict)
    updated_at: float = Field(default_factory=time.time)


class CalibrationStatusResponse(BaseModel):
    """Status returned by /api/calibration/status."""
    is_calibrated: bool
    active_step: int
    points_captured: List[str]
    bounds: CalibrationBounds
    hand_mode: str
    message: str


class CalibrationCaptureRequest(BaseModel):
    """Payload to capture a specific calibration target point."""
    point_name: str = Field(..., description="top_left, top_right, bottom_left, bottom_right, center")
    x: Optional[float] = None
    y: Optional[float] = None
    hand: Optional[str] = None
