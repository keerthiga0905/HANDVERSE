"""Tests for Module 06 - Game Engine & Game Sessions Persistence."""

import sys
import uuid
from pathlib import Path
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas.games import GameSessionCreate
from services.game_service import ARCADE_GAMES, GameService

PLANNED_GAMES_10 = [
    "fruit-slice",
    "neon-dodge",
    "gem-catcher",
    "pinch-pop",
    "hand-archery",
    "air-paint-challenge",
    "gesture-memory-master",
    "hand-tennis",
    "space-blaster",
    "hand-maze-escape",
]


def test_game_registry_all_ten_games_present():
    """Verify that all 10 planned games are registered in the engine catalog."""
    res = GameService.get_all_games()
    assert res.total >= 10

    game_ids = [g.id for g in res.games]
    for expected_id in PLANNED_GAMES_10:
        assert expected_id in game_ids, f"Expected planned game '{expected_id}' in registry."


def test_unimplemented_games_remain_coming_soon():
    """Verify that future games are not marked playable and remain 'Coming Soon'."""
    res = GameService.get_all_games()

    for game in res.games:
        if game.id in PLANNED_GAMES_10:
            assert game.is_playable is False, f"Game {game.id} should not be playable yet."
            assert game.status == "Coming Soon"
            assert len(game.supported_gestures) > 0
            assert "min_tracking_requirements" in game.model_dump()


def test_get_single_game_details():
    """Verify single game details and None on nonexistent game."""
    game = GameService.get_game_by_id("fruit-slice")
    assert game is not None
    assert game.id == "fruit-slice"
    assert game.title == "Fruit Slice"
    assert len(game.supported_gestures) > 0
    assert "time_limit" in game.game_config

    nonexistent = GameService.get_game_by_id("non-existent-game-xyz")
    assert nonexistent is None


def test_record_game_session_success_and_duplicate_prevention():
    """Verify session recording, data validation, and duplicate session_id rejection."""
    session_id = str(uuid.uuid4())
    payload = GameSessionCreate(
        session_id=session_id,
        game_id="engine-sandbox",
        player_name="Test Pilot",
        difficulty="Normal",
        score=1250,
        duration_seconds=45.2,
        highest_combo=8,
        accuracy_percent=92.5,
        status="completed",
    )

    # First submission -> recorded
    res = GameService.record_session(payload)
    assert res.session_id == session_id
    assert res.score == 1250
    assert res.highest_combo == 8
    assert res.player_name == "Test Pilot"

    # Duplicate submission with same session_id -> ValueError
    with pytest.raises(ValueError) as excinfo:
        GameService.record_session(payload)
    assert "already been recorded" in str(excinfo.value)


def test_record_game_session_invalid_game_rejected():
    """Verify invalid game ID is rejected."""
    bad_payload = GameSessionCreate(
        session_id=str(uuid.uuid4()),
        game_id="fake-nonexistent-game",
        player_name="Player 1",
        difficulty="Normal",
        score=100,
        duration_seconds=10.0,
    )
    with pytest.raises(ValueError) as excinfo:
        GameService.record_session(bad_payload)
    assert "is not registered" in str(excinfo.value)


def test_game_sessions_history_and_best_scores():
    """Verify history queries and best scores aggregation."""
    unique_id = str(uuid.uuid4())
    payload = GameSessionCreate(
        session_id=unique_id,
        game_id="engine-sandbox",
        player_name="Score Master",
        difficulty="Hard",
        score=4200,
        duration_seconds=58.5,
        highest_combo=18,
        accuracy_percent=96.0,
        status="completed",
    )
    GameService.record_session(payload)

    # Check history
    hist = GameService.get_session_history(game_id="engine-sandbox", limit=50, offset=0)
    assert hist.total >= 1
    session_ids = [s.session_id for s in hist.sessions]
    assert unique_id in session_ids

    # Check best scores
    best_res = GameService.get_best_scores(game_id="engine-sandbox")
    assert len(best_res.scores) >= 1
    hard_score = next((s for s in best_res.scores if s.difficulty == "Hard"), None)
    assert hard_score is not None
    assert hard_score.best_score >= 4200
