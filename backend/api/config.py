"""System runtime configuration router."""

from fastapi import APIRouter
from config import settings
from schemas.config import SystemConfigResponse

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("", response_model=SystemConfigResponse)
async def get_system_config() -> SystemConfigResponse:
    """Return runtime configuration for client application."""
    return SystemConfigResponse(
        app_name=settings.app_name,
        app_version=settings.app_version,
        tagline=settings.tagline,
        theme={
            "background": "#08060A",
            "secondary_bg": "#120B14",
            "card_bg": "#19101D",
            "primary_pink": "#FF2D95",
            "neon_pink": "#FF00A8",
            "light_pink": "#FF78BD",
            "white": "#FFFFFF",
            "secondary_text": "#B8A9B8",
        },
        supported_gestures=[
            {"id": "open_palm", "name": "Open Palm", "action": "Steer / Navigate / Deflect"},
            {"id": "closed_fist", "name": "Closed Fist", "action": "Grab / Brake / Charge"},
            {"id": "index_pointing", "name": "Index Pointing", "action": "Draw / Aim / Select"},
            {"id": "pinch", "name": "Pinch", "action": "Click / Pop / Pick"},
            {"id": "two_hand", "name": "Two-Hand Gesture", "action": "Bow Draw / Dual Control"},
            {"id": "swipe_left", "name": "Swipe Left", "action": "Fast Dash / Previous Page"},
            {"id": "swipe_right", "name": "Swipe Right", "action": "Fast Dash / Next Page"},
        ],
        tracking_defaults={
            "target_fps": settings.target_fps,
            "max_hands": settings.max_hands,
            "default_gesture_sensitivity": settings.default_gesture_sensitivity,
        },
        websocket_url=f"ws://{settings.host}:{settings.port}/ws/tracking",
    )
