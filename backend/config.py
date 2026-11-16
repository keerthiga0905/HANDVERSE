"""Backend configuration settings for HANDVERSE API."""

from pathlib import Path
from typing import List
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = ROOT_DIR / "data"
DATABASE_PATH = DATA_DIR / "handverse.db"


class Settings(BaseModel):
    """API server settings."""

    app_name: str = "HANDVERSE API"
    app_version: str = "0.2.0"
    tagline: str = "YOUR HANDS. YOUR MOVES. YOUR ARCADE."
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = True
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    camera_index: int = 0
    camera_resolution: tuple[int, int] = (640, 480)
    target_fps: int = 60
    max_hands: int = 2
    default_gesture_sensitivity: float = 1.0


settings = Settings()
