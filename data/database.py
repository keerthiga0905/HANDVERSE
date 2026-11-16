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
        finally:
            conn.close()
