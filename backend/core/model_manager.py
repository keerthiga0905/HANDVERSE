"""MediaPipe HandLandmarker lifecycle and model asset manager."""

import logging
import os
from pathlib import Path
from typing import Optional

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

logger = logging.getLogger("HANDVERSE.ModelManager")

# Locate model asset
CORE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CORE_DIR.parent
DEFAULT_MODEL_PATH = BACKEND_DIR / "assets" / "models" / "hand_landmarker.task"


class ModelManager:
    """Singleton model lifecycle manager for MediaPipe HandLandmarker."""

    _instance: Optional["ModelManager"] = None
    _detector: Optional[vision.HandLandmarker] = None
    _model_path: Path = DEFAULT_MODEL_PATH

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_model_path(cls) -> Path:
        """Return configured model file path."""
        return cls._model_path

    @classmethod
    def set_model_path(cls, path: Path) -> None:
        """Override model file path."""
        cls._model_path = path

    @classmethod
    def is_model_available(cls) -> bool:
        """Check if hand_landmarker.task model file exists on disk."""
        return cls._model_path.exists() and cls._model_path.stat().st_size > 0

    @classmethod
    def initialize_detector(
        cls,
        max_num_hands: int = 2,
        min_detection_confidence: float = 0.5,
        min_hand_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> vision.HandLandmarker:
        """Initialize and cache the HandLandmarker detector instance."""
        if cls._detector is not None:
            return cls._detector

        if not cls.is_model_available():
            logger.info(f"Downloading MediaPipe model asset to '{cls._model_path}'...")
            cls._model_path.parent.mkdir(parents=True, exist_ok=True)
            import urllib.request
            model_url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
            try:
                urllib.request.urlretrieve(model_url, str(cls._model_path))
                logger.info("MediaPipe model asset downloaded successfully.")
            except Exception as dl_err:
                err_msg = (
                    f"MediaPipe model asset not found at '{cls._model_path}' and download failed: {dl_err}. "
                    f"Download manually from: {model_url}"
                )
                logger.error(err_msg)
                raise FileNotFoundError(err_msg)

        logger.info(f"Initializing MediaPipe HandLandmarker from '{cls._model_path}'...")

        try:
            base_options = python.BaseOptions(model_asset_path=str(cls._model_path))
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=max_num_hands,
                min_hand_detection_confidence=min_detection_confidence,
                min_hand_presence_confidence=min_hand_presence_confidence,
                min_tracking_confidence=min_tracking_confidence,
                running_mode=vision.RunningMode.IMAGE,
            )
            cls._detector = vision.HandLandmarker.create_from_options(options)
            logger.info("MediaPipe HandLandmarker initialized successfully.")
            return cls._detector
        except Exception as exc:
            logger.critical(f"Failed to create MediaPipe HandLandmarker: {exc}", exc_info=True)
            raise

    @classmethod
    def get_detector(cls) -> vision.HandLandmarker:
        """Retrieve the active detector instance, initializing if necessary."""
        if cls._detector is None:
            return cls.initialize_detector()
        return cls._detector

    @classmethod
    def shutdown(cls) -> None:
        """Release MediaPipe model resources."""
        if cls._detector is not None:
            logger.info("Closing MediaPipe HandLandmarker...")
            try:
                cls._detector.close()
            except Exception as exc:
                logger.warning(f"Error during HandLandmarker close: {exc}")
            finally:
                cls._detector = None
