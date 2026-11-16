"""Hand calibration REST API router (Module 05)."""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from schemas.calibration import (
    CalibrationBounds,
    CalibrationCaptureRequest,
    CalibrationProfile,
    CalibrationStatusResponse,
)

router = APIRouter(prefix="/calibration", tags=["Hand Calibration"])


def get_calibration_service():
    """Retrieve shared CalibrationService instance via TrackingService."""
    from api.websocket import get_tracking_service
    tracking_service = get_tracking_service()
    return tracking_service.motion_control.calibrator


@router.post("/start", response_model=CalibrationStatusResponse)
async def start_calibration(hand_mode: str = "AUTO"):
    """Start or restart the guided 5-step calibration process."""
    calibrator = get_calibration_service()
    return calibrator.start_calibration(hand_mode=hand_mode)


@router.post("/capture-point")
async def capture_calibration_point(request: CalibrationCaptureRequest):
    """Capture a target coordinate (top_left, top_right, bottom_left, bottom_right, center)."""
    calibrator = get_calibration_service()

    # If coordinates were not explicitly provided in the request body,
    # sample current active hand index fingertip from tracking service
    if request.x is None or request.y is None:
        from api.websocket import get_tracking_service
        service = get_tracking_service()
        cursor = service.motion_control.primary_cursor_svc.smoother.last_x
        if cursor is not None:
            request.x = service.motion_control.primary_cursor_svc.smoother.last_x
            request.y = service.motion_control.primary_cursor_svc.smoother.last_y
        else:
            raise HTTPException(
                status_code=400,
                detail="Coordinates not provided and no hand currently active to sample.",
            )

    success, message, active_step = calibrator.capture_point(request)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "point_captured": request.point_name,
        "x": request.x,
        "y": request.y,
        "active_step": active_step,
        "points_captured": list(calibrator.points_buffer.keys()),
    }


@router.post("/complete")
async def complete_calibration():
    """Validate captured targets and lock active CalibrationBounds."""
    calibrator = get_calibration_service()
    success, message, bounds = calibrator.complete_calibration()
    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "is_calibrated": True,
        "bounds": bounds,
    }


@router.get("/status", response_model=CalibrationStatusResponse)
async def get_calibration_status():
    """Return live status of calibration progress and boundaries."""
    calibrator = get_calibration_service()
    return calibrator.get_status()


@router.post("/reset", response_model=CalibrationStatusResponse)
async def reset_calibration():
    """Reset calibration bounds to defaults."""
    calibrator = get_calibration_service()
    return calibrator.reset_calibration()
