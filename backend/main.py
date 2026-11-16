"""HANDVERSE - FastAPI Web Backend.

Module 03: Real-Time AI Hand Tracking Engine.
Provides RESTful APIs and low-latency WebSocket streaming for MediaPipe HandLandmarker.
"""

from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import settings
from api.routes import api_router
from api.websocket import router as websocket_router
from core.model_manager import ModelManager

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("HANDVERSE.Backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    logger.info("Initializing HANDVERSE backend and MediaPipe model...")
    try:
        ModelManager.initialize_detector()
        logger.info("MediaPipe HandLandmarker successfully preloaded.")
    except Exception as exc:
        logger.warning(
            f"MediaPipe model initialization deferred or model file missing: {exc}"
        )
    yield
    logger.info("Shutting down HANDVERSE backend and cleaning up vision models...")
    ModelManager.shutdown()


app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    description="Backend REST API and real-time WebSocket AI hand-tracking engine for HANDVERSE.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware configuration for localhost development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST API Routers under /api
app.include_router(api_router)

# Register WebSocket Routers (/ws/hand-tracking and /ws/tracking)
app.include_router(websocket_router)


@app.get("/")
async def root():
    """Root entry point with service metadata."""
    return JSONResponse({
        "app": settings.app_name,
        "version": "0.3.0",
        "tagline": settings.tagline,
        "docs": "/docs",
        "health": "/api/health",
        "games": "/api/games",
        "config": "/api/config",
        "websocket_tracking": "/ws/hand-tracking",
    })


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting {settings.app_name} on http://{settings.host}:{settings.port}")
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
