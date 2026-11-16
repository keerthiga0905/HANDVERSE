"""Foundational tests for HANDVERSE Module 01.

Validates project configuration, directory structure, module importability,
and foundational database operations.
"""

from pathlib import Path
import sys
import tempfile

import pygame
import pytest

import config
from core.calibration import CalibrationManager
from core.camera import CameraService
from core.game_manager import GameManager, GameState
from core.gesture_recognition import GestureRecognizer, GestureType
from core.gesture_smoothing import GestureSmoother
from data.database import DatabaseManager


def test_configuration_defaults() -> None:
    """Verify application configuration has valid parameters."""
    assert config.APPLICATION_NAME == "HANDVERSE"
    assert config.WINDOW_WIDTH == 1280
    assert config.WINDOW_HEIGHT == 720
    assert config.TARGET_FPS == 60
    assert config.CAMERA_INDEX == 0
    assert config.CAMERA_WIDTH == 640
    assert config.CAMERA_HEIGHT == 480
    assert 0.0 < config.HAND_TRACKING_CONFIDENCE <= 1.0
    assert config.MAX_NUM_HANDS >= 1
    assert config.DEFAULT_GESTURE_SENSITIVITY > 0.0
    assert isinstance(config.SOUND_ENABLED, bool)


def test_project_directories_exist() -> None:
    """Verify all required top-level and asset directories exist on disk."""
    base_dir = config.BASE_DIR
    assert (base_dir / "core").is_dir()
    assert (base_dir / "games").is_dir()
    assert (base_dir / "ui").is_dir()
    assert (base_dir / "data").is_dir()
    assert (base_dir / "assets").is_dir()
    assert (base_dir / "assets" / "images").is_dir()
    assert (base_dir / "assets" / "sounds").is_dir()
    assert (base_dir / "assets" / "fonts").is_dir()
    assert (base_dir / "tests").is_dir()
    assert (base_dir / "utils").is_dir()


def test_database_manager_initialization() -> None:
    """Verify SQLite database manager initializes tables without errors."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_db_path = Path(tmp_dir) / "test_handverse.db"
        db = DatabaseManager(test_db_path)
        db.initialize_schema()

        assert test_db_path.exists()

        conn = db.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = {row[0] for row in cursor.fetchall()}
            assert "high_scores" in tables
            assert "settings" in tables
        finally:
            conn.close()


def test_core_classes_instantiation() -> None:
    """Verify core classes can be instantiated and initialized cleanly."""
    camera = CameraService(camera_index=0)
    assert not camera.is_running
    camera.start()
    assert camera.is_running
    camera.release()
    assert not camera.is_running

    smoother = GestureSmoother(alpha=0.5)
    pos1 = smoother.smooth(10.0, 20.0)
    assert pos1 == (10.0, 20.0)
    pos2 = smoother.smooth(20.0, 30.0)
    assert pos2 == (15.0, 25.0)

    calibration = CalibrationManager(screen_size=(1280, 720), margin=0.1)
    sx, sy = calibration.map_to_screen(0.5, 0.5)
    assert 0 <= sx <= 1280
    assert 0 <= sy <= 720

    game_mgr = GameManager()
    assert game_mgr.state == GameState.WELCOME
    game_mgr.set_state(GameState.MAIN_MENU)
    assert game_mgr.state == GameState.MAIN_MENU

    recognizer = GestureRecognizer()
    assert recognizer.recognize(None) == GestureType.NONE


def test_app_lifecycle_headless(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify HandverseApp initializes, renders a frame, and cleans up cleanly."""
    import os
    from main import HandverseApp

    # Set SDL dummy drivers for headless testing
    monkeypatch.setenv("SDL_VIDEODRIVER", "dummy")
    monkeypatch.setenv("SDL_AUDIODRIVER", "dummy")

    app = HandverseApp()
    try:
        app.initialize()
        assert app.is_running
        assert app.screen is not None

        # Simulate one update and render cycle
        app.update(0.016)
        app.render()
    finally:
        app.cleanup()
        assert not pygame.get_init()

