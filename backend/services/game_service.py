"""Service managing the HANDVERSE arcade games catalog and game session persistence."""

from pathlib import Path
import sqlite3
from typing import List, Optional
from config import settings
from schemas.games import (
    BestScoreEntry,
    BestScoresResponse,
    GameCard,
    GameListResponse,
    GameSessionCreate,
    GameSessionHistoryResponse,
    GameSessionResponse,
)

# 10 Planned Games with detailed engine specifications
ARCADE_GAMES: List[GameCard] = [
    GameCard(
        id="fruit-slice",
        title="Fruit Slice",
        description="Slice flying tropical fruits with high-speed virtual blade hand slashes while dodging hazard bombs.",
        category="Action",
        difficulty="Medium",
        control_type="Index Finger Slash",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 07",
        features=["Real-time velocity tracking", "Combo multiplier system", "Particle blade trails"],
        icon_name="Sword",
        color="#FF2D95",
        supported_gestures=["INDEX_POINTING", "SWIPE_LEFT", "SWIPE_RIGHT", "SWIPE_UP", "SWIPE_DOWN"],
        min_tracking_requirements="Webcam 30+ FPS, 1 hand, low-latency motion smoothing",
        game_config={"time_limit": 60, "initial_lives": 3, "base_points": 100, "combo_timeout": 2.5},
    ),
    GameCard(
        id="neon-dodge",
        title="Neon Dodge",
        description="Guide your energy core through intense waves of neon lasers and kinetic obstacles.",
        category="Arcade",
        difficulty="Hard",
        control_type="Open Palm Steering",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 07",
        features=["Precision coordinate mapping", "Accelerating speed curves", "Dynamic neon barriers"],
        icon_name="ShieldAlert",
        color="#FF00A8",
        supported_gestures=["OPEN_PALM", "CLOSED_FIST"],
        min_tracking_requirements="Webcam 30+ FPS, 1 hand, high sensitivity cursor",
        game_config={"time_limit": 90, "initial_lives": 3, "base_points": 150, "combo_timeout": 3.0},
    ),
    GameCard(
        id="gem-catcher",
        title="Gem Catcher",
        description="Catch falling crystalline gems into your magnetic basket before they hit the abyss.",
        category="Casual",
        difficulty="Easy",
        control_type="Palm Horizontal Glide",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 08",
        features=["Item physics gravity", "Bonus multipliers", "Audio chime feedback"],
        icon_name="Diamond",
        color="#FF78BD",
        supported_gestures=["OPEN_PALM"],
        min_tracking_requirements="Webcam, 1 hand, horizontal axis calibration",
        game_config={"time_limit": 60, "initial_lives": 5, "base_points": 50, "combo_timeout": 2.0},
    ),
    GameCard(
        id="pinch-pop",
        title="Pinch Pop",
        description="Pinch thumb and index finger precisely to pop floating reactive neon bubbles.",
        category="Precision",
        difficulty="Easy",
        control_type="Thumb & Index Pinch",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 08",
        features=["Micro-pinch distance threshold", "Burst chain reactions", "Timed time-attack mode"],
        icon_name="Sparkles",
        color="#FF2D95",
        supported_gestures=["PINCH", "OPEN_PALM"],
        min_tracking_requirements="Webcam, 1 hand, pinch threshold calibration",
        game_config={"time_limit": 45, "initial_lives": 3, "base_points": 100, "combo_timeout": 2.0},
    ),
    GameCard(
        id="hand-archery",
        title="Hand Archery",
        description="Draw back your virtual bowstring with one hand, aim with the other, and release to strike bullseyes.",
        category="Simulation",
        difficulty="Hard",
        control_type="Two-Hand Bow Draw",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 09",
        features=["Two-hand spatial depth", "Tension force physics", "Wind deflection drift"],
        icon_name="Target",
        color="#FF00A8",
        supported_gestures=["PINCH", "OPEN_PALM", "TWO_HAND_PINCH"],
        min_tracking_requirements="Webcam, 2 hands tracked simultaneously",
        game_config={"time_limit": 60, "initial_lives": 3, "base_points": 200, "combo_timeout": 3.0},
    ),
    GameCard(
        id="air-paint-challenge",
        title="Air Paint Challenge",
        description="Draw glowing neon shapes and trace arcade symbols mid-air using your fingertip brush.",
        category="Creative",
        difficulty="Medium",
        control_type="Index Point & Draw",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 09",
        features=["Smoothed spline rendering", "Color wheel palette selection", "Shape accuracy scoring"],
        icon_name="Palette",
        color="#FF78BD",
        supported_gestures=["INDEX_POINTING", "PINCH", "CLOSED_FIST"],
        min_tracking_requirements="Webcam, 1 hand, high precision cursor smoothing",
        game_config={"time_limit": 60, "initial_lives": 3, "base_points": 100, "combo_timeout": 4.0},
    ),
    GameCard(
        id="gesture-memory-master",
        title="Gesture Memory Master",
        description="Repeat increasingly complex sequence of hand gestures (Fist, Palm, Thumbs Up, Point) under time pressure.",
        category="Puzzle",
        difficulty="Medium",
        control_type="Multi-Gesture Sequencer",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 10",
        features=["State-machine classification", "Memory pattern engine", "Tempo acceleration"],
        icon_name="BrainCircuit",
        color="#FF2D95",
        supported_gestures=["CLOSED_FIST", "OPEN_PALM", "THUMBS_UP", "INDEX_POINTING", "VICTORY"],
        min_tracking_requirements="Webcam, 1 hand, rapid multi-gesture classification",
        game_config={"time_limit": 90, "initial_lives": 3, "base_points": 250, "combo_timeout": 3.0},
    ),
    GameCard(
        id="hand-tennis",
        title="Hand Tennis",
        description="Use your open palm as a reactive cyber paddle to rally high-velocity plasma balls against AI or local opponents.",
        category="Sports",
        difficulty="Medium",
        control_type="Open Palm Paddle",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 10",
        features=["Impact angle deflection", "Spin curve physics", "Adaptive AI rally difficulty"],
        icon_name="Activity",
        color="#FF00A8",
        supported_gestures=["OPEN_PALM"],
        min_tracking_requirements="Webcam, 1 hand, high velocity tracking",
        game_config={"time_limit": 120, "initial_lives": 3, "base_points": 100, "combo_timeout": 2.5},
    ),
    GameCard(
        id="space-blaster",
        title="Space Blaster",
        description="Pilot a starfighter with hand tilt coordinates and fire laser blasts by forming a fist or finger gun.",
        category="Action",
        difficulty="Hard",
        control_type="Hand Tilt & Fist Trigger",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 11",
        features=["Dual-axis pitch/roll", "Rapid-fire gesture detection", "Epic boss encounters"],
        icon_name="Rocket",
        color="#FF78BD",
        supported_gestures=["OPEN_PALM", "CLOSED_FIST", "INDEX_POINTING"],
        min_tracking_requirements="Webcam, 1 hand, roll/tilt calculation",
        game_config={"time_limit": 90, "initial_lives": 3, "base_points": 150, "combo_timeout": 2.5},
    ),
    GameCard(
        id="hand-maze-escape",
        title="Hand Maze Escape",
        description="Navigate a delicate spark through perilous electrified mazes without grazing the deadly walls.",
        category="Precision",
        difficulty="Hard",
        control_type="Continuous Point Follower",
        status="Coming Soon",
        is_playable=False,
        planned_module="Module 11",
        features=["Sub-pixel collision detection", "Tremor dampening filters", "Time-trial checkpoints"],
        icon_name="Compass",
        color="#FF2D95",
        supported_gestures=["INDEX_POINTING", "PINCH"],
        min_tracking_requirements="Webcam, 1 hand, 1€ filter tremor reduction",
        game_config={"time_limit": 60, "initial_lives": 3, "base_points": 300, "combo_timeout": 5.0},
    ),
    # Interactive Game Engine Test Arena / Sandbox (Module 06 demonstration testbed)
    GameCard(
        id="engine-sandbox",
        title="Game Engine Motion Arena",
        description="Interactive testing arena demonstrating the reusable Game Engine: real-time hand cursor, pinch popping, target scoring, combo multipliers, life loss, and pause state machine.",
        category="Engine Demo",
        difficulty="Normal",
        control_type="Cursor + Pinch + Gestures",
        status="Active Engine Demo",
        is_playable=True,
        planned_module="Module 06",
        features=[
            "Full 8-state Game State Machine",
            "Delta-time 60 FPS Game Loop",
            "Pinch popping & slicing mechanics",
            "Combo streak & milestone multipliers",
            "Live tracking loss fail-safe auto-pause",
            "Session statistics persistence",
        ],
        icon_name="Flame",
        color="#FF00A8",
        supported_gestures=["OPEN_PALM", "CLOSED_FIST", "PINCH", "INDEX_POINTING", "SWIPE_LEFT", "SWIPE_RIGHT"],
        min_tracking_requirements="Webcam with active hand detection",
        game_config={"time_limit": 45, "initial_lives": 3, "base_points": 100, "combo_timeout": 2.5},
    ),
]


class GameService:
    """Provides filtered queries, catalog metadata, and session persistence for the arcade."""

    db_path: Path = getattr(settings, "DATABASE_PATH", Path("data/handverse.db"))

    @classmethod
    def _get_connection(cls) -> sqlite3.Connection:
        cls.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(cls.db_path)
        conn.execute(
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
        return conn

    @staticmethod
    def get_all_games(
        search: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
    ) -> GameListResponse:
        filtered = ARCADE_GAMES

        if search:
            query = search.strip().lower()
            filtered = [
                g for g in filtered
                if query in g.title.lower() or query in g.description.lower()
            ]

        if category and category.lower() != "all":
            filtered = [g for g in filtered if g.category.lower() == category.lower()]

        if difficulty and difficulty.lower() != "all":
            filtered = [g for g in filtered if g.difficulty.lower() == difficulty.lower()]

        categories = sorted(list({g.category for g in ARCADE_GAMES}))
        difficulties = ["Easy", "Medium", "Hard", "Extreme"]

        return GameListResponse(
            total=len(filtered),
            categories=["All"] + categories,
            difficulties=["All"] + difficulties,
            games=filtered,
        )

    @staticmethod
    def get_game_by_id(game_id: str) -> Optional[GameCard]:
        for game in ARCADE_GAMES:
            if game.id == game_id:
                return game
        return None

    @classmethod
    def record_session(cls, session: GameSessionCreate) -> GameSessionResponse:
        """Store a completed or ended game session with duplicate check."""
        game = cls.get_game_by_id(session.game_id)
        if not game:
            raise ValueError(f"Game with ID '{session.game_id}' is not registered.")

        conn = cls._get_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # Check for duplicate session ID
                cursor.execute("SELECT id FROM game_sessions WHERE session_id = ?", (session.session_id,))
                existing = cursor.fetchone()
                if existing:
                    raise ValueError(f"Game session '{session.session_id}' has already been recorded.")

                cursor.execute(
                    """
                    INSERT INTO game_sessions (
                        session_id, game_id, player_name, difficulty,
                        score, duration_seconds, highest_combo, accuracy_percent, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session.session_id,
                        session.game_id,
                        session.player_name,
                        session.difficulty,
                        session.score,
                        session.duration_seconds,
                        session.highest_combo,
                        session.accuracy_percent,
                        session.status,
                    ),
                )
                inserted_id = cursor.lastrowid
                cursor.execute("SELECT created_at FROM game_sessions WHERE id = ?", (inserted_id,))
                created_at = cursor.fetchone()[0]

            return GameSessionResponse(
                id=inserted_id,
                session_id=session.session_id,
                game_id=session.game_id,
                player_name=session.player_name,
                difficulty=session.difficulty,
                score=session.score,
                duration_seconds=session.duration_seconds,
                highest_combo=session.highest_combo,
                accuracy_percent=session.accuracy_percent,
                status=session.status,
                created_at=str(created_at),
            )
        finally:
            conn.close()

    @classmethod
    def get_session_history(
        cls,
        game_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> GameSessionHistoryResponse:
        """Fetch past session history with optional game_id filtering."""
        conn = cls._get_connection()
        try:
            cursor = conn.cursor()
            if game_id:
                cursor.execute(
                    """
                    SELECT id, session_id, game_id, player_name, difficulty,
                           score, duration_seconds, highest_combo, accuracy_percent, status, created_at
                    FROM game_sessions
                    WHERE game_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (game_id, limit, offset),
                )
                rows = cursor.fetchall()
                cursor.execute("SELECT COUNT(*) FROM game_sessions WHERE game_id = ?", (game_id,))
                total = cursor.fetchone()[0]
            else:
                cursor.execute(
                    """
                    SELECT id, session_id, game_id, player_name, difficulty,
                           score, duration_seconds, highest_combo, accuracy_percent, status, created_at
                    FROM game_sessions
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
                rows = cursor.fetchall()
                cursor.execute("SELECT COUNT(*) FROM game_sessions")
                total = cursor.fetchone()[0]

            sessions = [
                GameSessionResponse(
                    id=row[0],
                    session_id=row[1],
                    game_id=row[2],
                    player_name=row[3],
                    difficulty=row[4],
                    score=row[5],
                    duration_seconds=row[6],
                    highest_combo=row[7],
                    accuracy_percent=row[8],
                    status=row[9],
                    created_at=str(row[10]),
                )
                for row in rows
            ]
            return GameSessionHistoryResponse(total=total, sessions=sessions)
        finally:
            conn.close()

    @classmethod
    def get_best_scores(cls, game_id: Optional[str] = None) -> BestScoresResponse:
        """Fetch best high score per game and difficulty tier."""
        conn = cls._get_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT game_id, difficulty, MAX(score) as best_score,
                       MAX(highest_combo) as highest_combo, created_at, player_name
                FROM game_sessions
            """
            params = []
            if game_id:
                query += " WHERE game_id = ?"
                params.append(game_id)
            query += " GROUP BY game_id, difficulty ORDER BY best_score DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()
            entries = [
                BestScoreEntry(
                    game_id=row[0],
                    difficulty=row[1],
                    best_score=row[2],
                    highest_combo=row[3],
                    achieved_at=str(row[4]),
                    player_name=row[5],
                )
                for row in rows
            ]
            return BestScoresResponse(scores=entries)
        finally:
            conn.close()
