"""Gesture catalog and sensitivity configuration REST API router."""

from typing import Any, Dict, List
from fastapi import APIRouter
from schemas.gesture import GestureSettings

router = APIRouter(prefix="/gestures", tags=["Gestures"])

# In-memory settings instance
current_gesture_settings = GestureSettings()

GESTURE_CATALOG: List[Dict[str, Any]] = [
    # Static Gestures
    {
        "id": "OPEN_PALM",
        "name": "Open Palm",
        "type": "STATIC",
        "category": "Navigation & Deflection",
        "instructions": "Extend all 5 fingers facing forward.",
        "expected_movement": "Hold steady in frame.",
        "icon": "Hand",
        "used_in": "Movement, Menu, Shields",
    },
    {
        "id": "CLOSED_FIST",
        "name": "Closed Fist",
        "type": "STATIC",
        "category": "Action & Stopping",
        "instructions": "Curl all fingers firmly towards palm.",
        "expected_movement": "Clench fist facing camera.",
        "icon": "CircleDot",
        "used_in": "Pause, Brake, Charge Cannon",
    },
    {
        "id": "INDEX_POINTING",
        "name": "Index Pointing",
        "type": "STATIC",
        "category": "Aiming & Precision",
        "instructions": "Extend index finger only; fold remaining 4 fingers.",
        "expected_movement": "Aim with fingertip.",
        "icon": "Navigation",
        "used_in": "Virtual Blade, Crosshair, Paint",
    },
    {
        "id": "PINCH",
        "name": "Pinch",
        "type": "STATIC",
        "category": "Selection & Triggers",
        "instructions": "Bring tips of thumb and index finger together.",
        "expected_movement": "Touch fingertips together firmly.",
        "icon": "Sparkles",
        "used_in": "Click, Grab, Bubble Pop, Shoot",
    },
    {
        "id": "VICTORY_SIGN",
        "name": "Victory Sign",
        "type": "STATIC",
        "category": "Special Action",
        "instructions": "Extend index and middle fingers in a 'V'; fold others.",
        "expected_movement": "Hold V sign facing camera.",
        "icon": "Award",
        "used_in": "Super Ability, Score Boost",
    },
    {
        "id": "THUMBS_UP",
        "name": "Thumbs Up",
        "type": "STATIC",
        "category": "Affirmation & Power",
        "instructions": "Extend thumb straight upward; curl other 4 fingers.",
        "expected_movement": "Thumb pointing to ceiling.",
        "icon": "ThumbsUp",
        "used_in": "Ready Check, Confirm, Boost",
    },
    {
        "id": "THREE_FINGERS",
        "name": "Three Fingers",
        "type": "STATIC",
        "category": "Custom Action",
        "instructions": "Extend index, middle, and ring fingers; fold thumb and pinky.",
        "expected_movement": "Hold 3 fingers upward.",
        "icon": "Layers",
        "used_in": "Weapon Switch, Secondary Skill",
    },
    # Two-Hand Gestures
    {
        "id": "BOTH_OPEN_PALMS",
        "name": "Both Open Palms",
        "type": "TWO_HAND",
        "category": "Power Surge",
        "instructions": "Show both open palms simultaneously.",
        "expected_movement": "Both hands facing camera.",
        "icon": "Shield",
        "used_in": "Energy Barrier, Ultimate Shield",
    },
    {
        "id": "BOTH_HANDS_PINCHING",
        "name": "Both Hands Pinching",
        "type": "TWO_HAND",
        "category": "Dual Precision",
        "instructions": "Pinch thumb and index on both hands at once.",
        "expected_movement": "Dual synchronized pinch.",
        "icon": "Target",
        "used_in": "Bowstring Draw, Zoom In/Out",
    },
    {
        "id": "HANDS_APART",
        "name": "Hands Apart",
        "type": "TWO_HAND",
        "category": "Expansion",
        "instructions": "Move both hands outward away from each other.",
        "expected_movement": "Rapid lateral separation.",
        "icon": "Maximize2",
        "used_in": "Shockwave, Viewport Zoom Out",
    },
    {
        "id": "HANDS_TOGETHER",
        "name": "Hands Together",
        "type": "TWO_HAND",
        "category": "Contraction",
        "instructions": "Bring both hands inward towards center.",
        "expected_movement": "Rapid lateral convergence.",
        "icon": "Minimize2",
        "used_in": "Gravitational Pull, Sonic Clap",
    },
    # Dynamic Gestures
    {
        "id": "SWIPE_LEFT",
        "name": "Swipe Left",
        "type": "DYNAMIC",
        "category": "Kinetic Movement",
        "instructions": "Swiftly sweep hand horizontally to the left.",
        "expected_movement": "Fast horizontal left movement (>1.2 m/s).",
        "icon": "ArrowLeft",
        "used_in": "Dash Left, Previous Card",
    },
    {
        "id": "SWIPE_RIGHT",
        "name": "Swipe Right",
        "type": "DYNAMIC",
        "category": "Kinetic Movement",
        "instructions": "Swiftly sweep hand horizontally to the right.",
        "expected_movement": "Fast horizontal right movement (>1.2 m/s).",
        "icon": "ArrowRight",
        "used_in": "Dash Right, Next Card",
    },
    {
        "id": "SWIPE_UP",
        "name": "Swipe Up",
        "type": "DYNAMIC",
        "category": "Kinetic Movement",
        "instructions": "Swiftly sweep hand vertically upward.",
        "expected_movement": "Fast upward movement.",
        "icon": "ArrowUp",
        "used_in": "Jump, Launch Rocket",
    },
    {
        "id": "SWIPE_DOWN",
        "name": "Swipe Down",
        "type": "DYNAMIC",
        "category": "Kinetic Movement",
        "instructions": "Swiftly sweep hand vertically downward.",
        "expected_movement": "Fast downward movement.",
        "icon": "ArrowDown",
        "used_in": "Crouch, Ground Slam",
    },
    {
        "id": "CIRCULAR_MOVEMENT",
        "name": "Circular Movement",
        "type": "DYNAMIC",
        "category": "Kinetic Flow",
        "instructions": "Move your hand in a complete circular loop.",
        "expected_movement": "360-degree continuous loop.",
        "icon": "RotateCw",
        "used_in": "Shield Charge, Portal Summon",
    },
]


@router.get("", response_model=List[Dict[str, Any]])
async def get_gesture_catalog():
    """Return all 16 supported gestures with instructions and metadata."""
    return GESTURE_CATALOG


@router.get("/settings", response_model=GestureSettings)
async def get_gesture_settings():
    """Return current gesture detection thresholds and sensitivity."""
    return current_gesture_settings


@router.post("/settings", response_model=GestureSettings)
async def update_gesture_settings(new_settings: GestureSettings):
    """Update runtime gesture detection thresholds and sensitivity."""
    global current_gesture_settings
    current_gesture_settings = new_settings

    # Also update active tracking service instance
    from api.websocket import get_tracking_service

    service = get_tracking_service()
    if hasattr(service, "gesture_engine"):
        service.gesture_engine.update_settings(new_settings)

    return current_gesture_settings
