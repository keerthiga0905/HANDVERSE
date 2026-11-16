"""Game catalog schemas."""

from typing import List, Optional
from pydantic import BaseModel


class GameCard(BaseModel):
    """Arcade game card metadata."""

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


class GameListResponse(BaseModel):
    """Response containing full games list."""

    total: int
    categories: List[str]
    difficulties: List[str]
    games: List[GameCard]
