"""Service managing the HANDVERSE arcade games catalog."""

from typing import List, Optional
from schemas.games import GameCard, GameListResponse

# 10 Planned Games with detailed metadata
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
        planned_module="Module 04",
        features=["Real-time velocity tracking", "Combo multiplier system", "Particle blade trails"],
        icon_name="Sword",
        color="#FF2D95",
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
        planned_module="Module 04",
        features=["Precision coordinate mapping", "Accelerating speed curves", "Dynamic neon barriers"],
        icon_name="ShieldAlert",
        color="#FF00A8",
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
        planned_module="Module 04",
        features=["Item physics gravity", "Bonus multipliers", "Audio chime feedback"],
        icon_name="Diamond",
        color="#FF78BD",
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
        planned_module="Module 05",
        features=["Micro-pinch distance threshold", "Burst chain reactions", "Timed time-attack mode"],
        icon_name="Sparkles",
        color="#FF2D95",
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
        planned_module="Module 05",
        features=["Two-hand spatial depth", "Tension force physics", "Wind deflection drift"],
        icon_name="Target",
        color="#FF00A8",
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
        planned_module="Module 05",
        features=["Smoothed spline rendering", "Color wheel palette selection", "Shape accuracy scoring"],
        icon_name="Palette",
        color="#FF78BD",
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
        planned_module="Module 05",
        features=["State-machine classification", "Memory pattern engine", "Tempo acceleration"],
        icon_name="BrainCircuit",
        color="#FF2D95",
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
        planned_module="Module 06",
        features=["Impact angle deflection", "Spin curve physics", "Adaptive AI rally difficulty"],
        icon_name="Activity",
        color="#FF00A8",
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
        planned_module="Module 06",
        features=["Dual-axis pitch/roll", "Rapid-fire gesture detection", "Epic boss encounters"],
        icon_name="Rocket",
        color="#FF78BD",
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
        planned_module="Module 06",
        features=["Sub-pixel collision detection", "Tremor dampening filters", "Time-trial checkpoints"],
        icon_name="Compass",
        color="#FF2D95",
    ),
]


class GameService:
    """Provides filtered queries and metadata for the game arcade."""

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
        difficulties = ["Easy", "Medium", "Hard"]

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
