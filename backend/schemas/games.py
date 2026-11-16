"""Game catalog and game sessions schemas for HANDVERSE."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GameCard(BaseModel):
    """Arcade game card metadata and engine specifications."""

    id: str
    title: str
    description: str
    category: str
    difficulty: str
    control_type: str
    status: str
    is_playable: bool = False
    planned_module: str
    features: List[str]
    icon_name: str
    color: str
    supported_gestures: List[str] = Field(default_factory=list)
    min_tracking_requirements: str = "Webcam, 1 hand"
    game_config: Dict[str, Any] = Field(default_factory=dict)


class GameListResponse(BaseModel):
    """Response containing full games list."""

    total: int
    categories: List[str]
    difficulties: List[str]
    games: List[GameCard]


class GameSessionCreate(BaseModel):
    """Payload to record completed or ended game session."""

    session_id: str = Field(..., description="Unique UUID for this session to prevent duplicate submissions")
    game_id: str = Field(..., description="Target game identifier")
    player_name: str = Field(default="Player 1", description="Player profile name")
    difficulty: str = Field(default="Normal", description="Difficulty level: Easy, Normal, Hard, Extreme")
    score: int = Field(ge=0, description="Final score achieved")
    duration_seconds: float = Field(ge=0.0, description="Total game duration in seconds")
    highest_combo: int = Field(default=0, ge=0, description="Highest consecutive combo streak")
    accuracy_percent: float = Field(default=100.0, ge=0.0, le=100.0, description="Target hit accuracy percentage")
    status: str = Field(default="completed", description="Session completion status: completed, game_over, aborted")


class GameSessionResponse(BaseModel):
    """Stored game session details."""

    id: int
    session_id: str
    game_id: str
    player_name: str
    difficulty: str
    score: int
    duration_seconds: float
    highest_combo: int
    accuracy_percent: float
    status: str
    created_at: str


class GameSessionHistoryResponse(BaseModel):
    """List of past game sessions with count."""

    total: int
    sessions: List[GameSessionResponse]


class BestScoreEntry(BaseModel):
    """High score record per game and difficulty tier."""

    game_id: str
    difficulty: str
    best_score: int
    highest_combo: int
    achieved_at: str
    player_name: str


class BestScoresResponse(BaseModel):
    """Collection of high score records."""

    scores: List[BestScoreEntry]
