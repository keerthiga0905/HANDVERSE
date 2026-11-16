"""Game sessions and arcade scores persistence API router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from schemas.games import (
    BestScoresResponse,
    GameSessionCreate,
    GameSessionHistoryResponse,
    GameSessionResponse,
)
from services.game_service import GameService

router = APIRouter(prefix="/game-sessions", tags=["Game Sessions"])


@router.post("", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
async def record_game_session(session_data: GameSessionCreate) -> GameSessionResponse:
    """Record a completed or ended game session.
    
    Validates data, checks for duplicate session IDs, and saves performance statistics.
    """
    try:
        return GameService.record_session(session_data)
    except ValueError as err:
        err_msg = str(err)
        if "already been recorded" in err_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.get("/history", response_model=GameSessionHistoryResponse)
async def get_session_history(
    game_id: Optional[str] = Query(None, description="Optional game ID filter"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
) -> GameSessionHistoryResponse:
    """Retrieve history of past arcade game sessions."""
    return GameService.get_session_history(game_id=game_id, limit=limit, offset=offset)


@router.get("/best-scores", response_model=BestScoresResponse)
async def get_best_scores(
    game_id: Optional[str] = Query(None, description="Optional game ID filter"),
) -> BestScoresResponse:
    """Retrieve highest scores per game and difficulty level."""
    return GameService.get_best_scores(game_id=game_id)
