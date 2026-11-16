"""Game lifecycle and state management module for HANDVERSE.

Controls arcade state transitions, game selection, scoring loops, and pauses.
Implementation will be finalized in subsequent modules.
"""

from enum import Enum, auto
from typing import Optional


class GameState(Enum):
    """Global states of the HANDVERSE arcade system."""

    WELCOME = auto()
    MAIN_MENU = auto()
    CALIBRATION = auto()
    PLAYING = auto()
    GAME_OVER = auto()
    PAUSED = auto()


class GameManager:
    """Orchestrates game state flow and active arcade modules."""

    def __init__(self) -> None:
        self.state: GameState = GameState.WELCOME
        self.active_game_id: Optional[str] = None
        self.score: int = 0

    def set_state(self, new_state: GameState) -> None:
        """Transition system to a new application state."""
        self.state = new_state

    def update(self, dt: float) -> None:
        """Update active game logic step."""
        pass
