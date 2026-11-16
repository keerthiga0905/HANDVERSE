"""Automated integration tests for HANDVERSE FastAPI backend."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.main import app
except ImportError:
    from main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root discovery endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "HANDVERSE API"
    assert data["docs"] == "/docs"
    assert data["health"] == "/api/health"


def test_health_check_endpoint():
    """Verify /api/health endpoint returns healthy status and service map."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "HANDVERSE API"
    assert "services" in data
    assert data["services"]["api"] == "online"


def test_games_catalog_endpoint():
    """Verify /api/games endpoint returns all 10 planned arcade titles."""
    response = client.get("/api/games")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["games"]) == 10
    assert "Action" in data["categories"]
    assert "Easy" in data["difficulties"]


def test_games_search_and_filter():
    """Verify query filtering by search string, category, and difficulty."""
    # Test search query
    response = client.get("/api/games?search=Fruit")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["games"][0]["id"] == "fruit-slice"

    # Test category filter
    response_cat = client.get("/api/games?category=Action")
    assert response_cat.status_code == 200
    data_cat = response_cat.json()
    assert data_cat["total"] >= 1
    assert all(g["category"] == "Action" for g in data_cat["games"])

    # Test difficulty filter
    response_diff = client.get("/api/games?difficulty=Hard")
    assert response_diff.status_code == 200
    data_diff = response_diff.json()
    assert all(g["difficulty"] == "Hard" for g in data_diff["games"])


def test_single_game_endpoint():
    """Verify /api/games/{id} retrieves specific game metadata."""
    response = client.get("/api/games/neon-dodge")
    assert response.status_code == 200
    game = response.json()
    assert game["title"] == "Neon Dodge"
    assert game["status"] == "Coming Soon"
    assert game["is_playable"] is False
    assert len(game["features"]) > 0

    # 404 on non-existent game
    response_404 = client.get("/api/games/non-existent-game")
    assert response_404.status_code == 404


def test_config_endpoint():
    """Verify /api/config delivers UI palette, gestures, and WebSocket URI."""
    response = client.get("/api/config")
    assert response.status_code == 200
    config = response.json()
    assert config["app_name"] == "HANDVERSE API"
    assert config["theme"]["primary_pink"] == "#FF2D95"
    assert config["theme"]["background"] == "#08060A"
    assert len(config["supported_gestures"]) == 7
    assert "ws://" in config["websocket_url"]
