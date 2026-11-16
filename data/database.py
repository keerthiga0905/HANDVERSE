"""SQLite database manager for HANDVERSE.

Handles schema migrations, player profiles, and arcade high score records.
"""

from pathlib import Path
import sqlite3
from typing import Optional


class DatabaseManager:
    """Manages SQLite persistent storage for the arcade system."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._ensure_data_directory()

    def _ensure_data_directory(self) -> None:
        """Create parent directory for database file if it does not exist."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        """Create and return a new SQLite connection with foreign keys enabled."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def initialize_schema(self) -> None:
        """Create foundational application tables if they do not exist."""
        conn = self.get_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS high_scores (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        game_id TEXT NOT NULL,
                        player_name TEXT NOT NULL,
                        score INTEGER NOT NULL,
                        achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS game_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT UNIQUE NOT NULL,
                        game_id TEXT NOT NULL,
                        player_name TEXT NOT NULL DEFAULT 'Player 1',
                        difficulty TEXT NOT NULL,
                        score INTEGER NOT NULL,
                        duration_seconds REAL NOT NULL,
                        highest_combo INTEGER NOT NULL DEFAULT 0,
                        accuracy_percent REAL NOT NULL DEFAULT 100.0,
                        status TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);"
                )
                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);"
                )
        finally:
            conn.close()
