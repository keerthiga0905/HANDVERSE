"""Video frame decoder and image preprocessor for webcam streams."""

import time
from typing import Optional, Tuple
import cv2
import numpy as np


class FrameProcessorError(Exception):
    """Exception raised when frame decoding or validation fails."""
    pass


class FrameProcessor:
    """Decodes binary JPEG frames, validates dimensions, and prepares RGB arrays."""

    def __init__(self, max_width: int = 640) -> None:
        self.max_width = max_width

    def decode_and_prepare(
        self, frame_bytes: bytes
    ) -> Tuple[np.ndarray, int, int, float]:
        """Decode raw binary bytes into an RGB NumPy array.

        Returns:
            Tuple containing:
                - rgb_image: np.ndarray (H, W, 3) in RGB format
                - orig_width: int
                - orig_height: int
                - decode_duration_ms: float
        """
        start_time = time.perf_counter()

        if not frame_bytes or len(frame_bytes) == 0:
            raise FrameProcessorError("Received empty frame byte buffer.")

        # Decode JPEG bytes into OpenCV BGR image
        try:
            np_arr = np.frombuffer(frame_bytes, dtype=np.uint8)
            bgr_frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as exc:
            raise FrameProcessorError(f"OpenCV failed to decode byte stream: {exc}") from exc

        if bgr_frame is None or bgr_frame.size == 0:
            raise FrameProcessorError("Decoded image is None or has zero dimensions.")

        orig_height, orig_width = bgr_frame.shape[:2]

        if orig_width < 10 or orig_height < 10:
            raise FrameProcessorError(
                f"Image dimensions {orig_width}x{orig_height} are below minimal threshold."
            )

        # Downscale if exceeding max_width to optimize inference performance
        if orig_width > self.max_width:
            aspect_ratio = orig_height / orig_width
            new_width = self.max_width
            new_height = int(new_width * aspect_ratio)
            bgr_frame = cv2.resize(bgr_frame, (new_width, new_height), interpolation=cv2.INTER_AREA)

        # Convert BGR (OpenCV) to RGB (MediaPipe)
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)

        decode_duration_ms = (time.perf_counter() - start_time) * 1000.0
        return rgb_frame, orig_width, orig_height, decode_duration_ms
