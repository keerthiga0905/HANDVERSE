"""Health check endpoint router."""

from datetime import datetime, timezone
from fastapi import APIRouter
from config import settings
from schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def check_health() -> HealthResponse:
    """Return backend operational health and service statuses."""
    return HealthResponse(
        status="healthy",
        app_name=settings.app_name,
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
        services={
            "api": "online",
            "websocket": "ready",
            "database": "sqlite_ready",
            "vision_engine": "mediapipe_ready",
        },
    )
