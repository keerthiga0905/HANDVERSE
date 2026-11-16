"""Arcade games catalog API router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from schemas.games import GameCard, GameListResponse
from services.game_service import GameService

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("", response_model=GameListResponse)
async def list_games(
    search: Optional[str] = Query(None, description="Search query for title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
) -> GameListResponse:
    """Retrieve filtered list of arcade games."""
    return GameService.get_all_games(search=search, category=category, difficulty=difficulty)


@router.get("/{game_id}", response_model=GameCard)
async def get_game(game_id: str) -> GameCard:
    """Retrieve detailed game card by its unique identifier."""
    game = GameService.get_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found.")
    return game
