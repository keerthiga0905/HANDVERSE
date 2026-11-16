"""Motion control and virtual cursor configuration REST API router (Module 05)."""

from fastapi import APIRouter
from schemas.motion import MotionControlResult, MotionSettings

router = APIRouter(prefix="/motion", tags=["Motion Control"])


def get_motion_service():
    """Retrieve shared MotionControlService instance via TrackingService."""
    from api.websocket import get_tracking_service
    tracking_service = get_tracking_service()
    return tracking_service.motion_control


@router.get("/settings", response_model=MotionSettings)
async def get_motion_settings():
    """Retrieve current motion control, sensitivity, and smoothing settings."""
    service = get_motion_service()
    return service.settings


@router.post("/settings", response_model=MotionSettings)
@router.put("/settings", response_model=MotionSettings)
async def update_motion_settings(new_settings: MotionSettings):
    """Update runtime motion control parameters."""
    service = get_motion_service()
    return service.update_settings(new_settings)


@router.get("/status")
async def get_motion_status():
    """Return high-level operational status of the motion control engine."""
    service = get_motion_service()
    return {
        "is_calibrated": service.calibrator.profile.is_calibrated,
        "control_hand": service.settings.control_hand,
        "virtual_cursor_enabled": service.settings.enable_virtual_cursor,
        "pinch_click_enabled": service.settings.pinch_click_enabled,
        "fist_clutch_enabled": service.settings.fist_clutch_enabled,
        "sensitivity": service.settings.sensitivity,
        "smoothing_factor": service.settings.smoothing_factor,
        "bounds": service.calibrator.profile.bounds,
    }
