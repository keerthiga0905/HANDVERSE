"""MediaPipe Hand Landmark Detection Service."""

import logging
from typing import List, Optional
import mediapipe as mp
import numpy as np

from core.model_manager import ModelManager
from schemas.tracking import HandDetection, LandmarkPoint, WorldLandmarkPoint

logger = logging.getLogger("HANDVERSE.HandDetector")


class HandDetector:
    """Detects up to 2 hands and extracts 21 3D landmarks using MediaPipe Tasks."""

    def __init__(self) -> None:
        # Ensure detector is loaded via ModelManager
        self.detector = ModelManager.get_detector()

    def detect_hands(self, rgb_image: np.ndarray) -> List[HandDetection]:
        """Process RGB image array and extract all detected hand landmarks.

        Args:
            rgb_image: np.ndarray with shape (H, W, 3) in RGB format

        Returns:
            List of HandDetection models (empty list if no hands are detected)
        """
        # Wrap numpy image in MediaPipe Image container
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

        # Execute MediaPipe detection
        result = self.detector.detect(mp_image)

        detections: List[HandDetection] = []

        if not result.hand_landmarks or len(result.hand_landmarks) == 0:
            return detections

        num_hands = len(result.hand_landmarks)

        for i in range(num_hands):
            raw_landmarks = result.hand_landmarks[i]

            # Determine handedness and confidence score
            handedness_label = "Unknown"
            confidence_score = 0.95

            if result.handedness and i < len(result.handedness):
                categories = result.handedness[i]
                if categories and len(categories) > 0:
                    cat = categories[0]
                    raw_label = getattr(cat, "category_name", getattr(cat, "display_name", "Unknown"))
                    confidence_score = float(getattr(cat, "score", 0.95))
                    # For mirrored selfie camera streams, flip handedness to reflect the user's actual physical hand
                    if raw_label == "Left":
                        handedness_label = "Right"
                    elif raw_label == "Right":
                        handedness_label = "Left"
                    else:
                        handedness_label = raw_label

            # Map all 21 normalized landmarks
            landmarks_list: List[LandmarkPoint] = [
                LandmarkPoint(
                    id=idx,
                    x=float(lm.x),
                    y=float(lm.y),
                    z=float(lm.z),
                )
                for idx, lm in enumerate(raw_landmarks)
            ]

            # Map world landmarks if present
            world_landmarks_list: Optional[List[WorldLandmarkPoint]] = None
            if result.hand_world_landmarks and i < len(result.hand_world_landmarks):
                raw_world = result.hand_world_landmarks[i]
                world_landmarks_list = [
                    WorldLandmarkPoint(
                        id=idx,
                        x=float(wlm.x),
                        y=float(wlm.y),
                        z=float(wlm.z),
                    )
                    for idx, wlm in enumerate(raw_world)
                ]

            detections.append(
                HandDetection(
                    handedness=handedness_label,
                    confidence=round(confidence_score, 4),
                    landmarks=landmarks_list,
                    world_landmarks=world_landmarks_list,
                )
            )

        return detections
