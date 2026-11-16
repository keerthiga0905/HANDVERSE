"""Centralized API route aggregation."""

from fastapi import APIRouter
from api.health import router as health_router
from api.games import router as games_router
from api.config import router as config_router
from api.gestures import router as gestures_router
from api.calibration import router as calibration_router
from api.motion import router as motion_router
from api.game_sessions import router as game_sessions_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(games_router)
api_router.include_router(game_sessions_router)
api_router.include_router(config_router)
api_router.include_router(gestures_router)
api_router.include_router(calibration_router)
api_router.include_router(motion_router)
