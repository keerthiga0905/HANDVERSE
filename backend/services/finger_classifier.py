"""Rotation-invariant and scale-normalized finger state classification."""

import math
from typing import Dict, List, Tuple
from schemas.gesture import FingerState
from schemas.tracking import LandmarkPoint


def euclidean_dist(p1: LandmarkPoint, p2: LandmarkPoint) -> float:
    """Calculate Euclidean distance between two 3D landmark points."""
    return math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2)


def calculate_angle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint) -> float:
    """Calculate interior angle at joint b (degrees) formed by rays b->a and b->c."""
    v1 = (a.x - b.x, a.y - b.y, a.z - b.z)
    v2 = (c.x - b.x, c.y - b.y, c.z - b.z)

    dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
    mag1 = math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2)
    mag2 = math.sqrt(v2[0] ** 2 + v2[1] ** 2 + v2[2] ** 2)

    if mag1 * mag2 == 0:
        return 0.0

    cos_val = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_val))


class FingerClassifier:
    """Evaluates 21 hand landmarks to classify individual finger extension states."""

    # Finger landmark indices: (MCP, PIP, DIP, TIP)
    FINGER_CHAINS = {
        "index": (5, 6, 7, 8),
        "middle": (9, 10, 11, 12),
        "ring": (13, 14, 15, 16),
        "little": (17, 18, 19, 20),
    }

    @staticmethod
    def get_palm_scale(landmarks: List[LandmarkPoint]) -> float:
        """Calculate palm baseline scale: distance from wrist (0) to middle MCP (9)."""
        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        dist = euclidean_dist(wrist, middle_mcp)
        return max(dist, 0.05)  # Guard against zero-division

    @classmethod
    def classify_all_fingers(
        cls, landmarks: List[LandmarkPoint], sensitivity: float = 1.0
    ) -> Dict[str, FingerState]:
        """Determine extension state for all five fingers."""
        if len(landmarks) < 21:
            return {f: FingerState.FOLDED for f in ["thumb", "index", "middle", "ring", "little"]}

        palm_scale = cls.get_palm_scale(landmarks)
        wrist = landmarks[0]
        states: Dict[str, FingerState] = {}

        # 1. Classify standard 4 fingers (Index, Middle, Ring, Little)
        for finger_name, (mcp_idx, pip_idx, dip_idx, tip_idx) in cls.FINGER_CHAINS.items():
            mcp = landmarks[mcp_idx]
            pip = landmarks[pip_idx]
            tip = landmarks[tip_idx]

            dist_wrist_tip = euclidean_dist(wrist, tip)
            dist_wrist_pip = euclidean_dist(wrist, pip)
            dist_mcp_tip = euclidean_dist(mcp, tip)

            # Joint angles
            pip_angle = calculate_angle(mcp, pip, landmarks[dip_idx])

            # Normalized metric comparisons
            is_extended_dist = (dist_wrist_tip > dist_wrist_pip * (1.08 / sensitivity))
            is_mcp_extended = (dist_mcp_tip > palm_scale * (0.65 / sensitivity))
            is_straight = pip_angle > 135.0

            if (is_extended_dist and is_mcp_extended) or (is_extended_dist and is_straight):
                states[finger_name] = FingerState.EXTENDED
            else:
                states[finger_name] = FingerState.FOLDED

        # 2. Classify Thumb (Landmarks 1: CMC, 2: MCP, 3: IP, 4: TIP)
        thumb_cmc = landmarks[1]
        thumb_mcp = landmarks[2]
        thumb_ip = landmarks[3]
        thumb_tip = landmarks[4]
        pinky_mcp = landmarks[17]
        index_mcp = landmarks[5]

        dist_thumb_pinky = euclidean_dist(thumb_tip, pinky_mcp)
        dist_thumb_mcp = euclidean_dist(thumb_tip, thumb_mcp)
        thumb_angle = calculate_angle(thumb_mcp, thumb_ip, thumb_tip)
        dist_thumb_index_mcp = euclidean_dist(thumb_tip, index_mcp)

        # Extended: thumb tip points outward away from pinky MCP and IP angle is relatively straight
        thumb_extended = (
            (dist_thumb_pinky > palm_scale * (0.85 / sensitivity))
            and (dist_thumb_index_mcp > palm_scale * (0.45 / sensitivity))
            and (thumb_angle > 130.0 or dist_thumb_mcp > palm_scale * 0.40)
        )

        states["thumb"] = FingerState.EXTENDED if thumb_extended else FingerState.FOLDED

        return states

    @classmethod
    def is_thumbs_up_orientation(cls, landmarks: List[LandmarkPoint]) -> bool:
        """Check if hand is in a true 'Thumbs Up' physical orientation."""
        wrist = landmarks[0]
        thumb_mcp = landmarks[2]
        thumb_tip = landmarks[4]
        middle_mcp = landmarks[9]

        palm_scale = cls.get_palm_scale(landmarks)

        # In standard screen coordinates, Y decreases upward (0 is top)
        # Thumb tip must be noticeably higher (smaller Y) than wrist and thumb MCP
        vertical_rise = wrist.y - thumb_tip.y
        mcp_rise = thumb_mcp.y - thumb_tip.y

        # Upward orientation condition
        is_upward = (vertical_rise > palm_scale * 0.50) and (mcp_rise > palm_scale * 0.20)

        # Thumb angle should be largely vertical (dx should not dwarf dy)
        dx = abs(thumb_tip.x - thumb_mcp.x)
        dy = abs(thumb_tip.y - thumb_mcp.y)
        is_vertical_alignment = dy > 0.02 and (dx / dy < 1.3)

        return is_upward and is_vertical_alignment
