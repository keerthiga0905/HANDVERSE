"""High-level hand tracking pipeline service."""

import logging
import time
from typing import Optional

from schemas.tracking import TrackingResult, TrackingStatus
from services.frame_processor import FrameProcessor
from services.gesture_recognition import GestureRecognitionEngine
from services.hand_detector import HandDetector
from services.motion_control_service import MotionControlService

logger = logging.getLogger("HANDVERSE.TrackingService")


class TrackingService:
    """Coordinates decoding, MediaPipe inference, and structured result construction."""

    def __init__(self, max_width: int = 640) -> None:
        self.frame_processor = FrameProcessor(max_width=max_width)
        self.detector = HandDetector()
        self.gesture_engine = GestureRecognitionEngine()
        self.motion_control = MotionControlService()
        self.frame_counter: int = 0

    def process_frame(
        self,
        frame_bytes: bytes,
        client_frame_id: Optional[int] = None,
        client_timestamp: Optional[float] = None,
        server_queue_dropped: int = 0,
    ) -> TrackingResult:
        """Process incoming binary frame bytes and return verified tracking result.

        Args:
            frame_bytes: Raw JPEG compressed byte buffer
            client_frame_id: Optional frame ID sent by frontend
            client_timestamp: Optional capture timestamp from frontend
            server_queue_dropped: Number of dropped frames on server backlog

        Returns:
            TrackingResult schema populated with model detections and gesture classifications
        """
        start_time = time.perf_counter()
        now_ts = time.time()
        self.frame_counter += 1
        frame_id = client_frame_id if client_frame_id is not None else self.frame_counter

        # 1. Decode and prepare RGB image
        rgb_image, width, height, decode_ms = self.frame_processor.decode_and_prepare(frame_bytes)

        # 2. Run MediaPipe hand landmark detection with timing
        t_infer_start = time.perf_counter()
        detected_hands = self.detector.detect_hands(rgb_image)
        inference_ms = (time.perf_counter() - t_infer_start) * 1000.0
        hands_count = len(detected_hands)

        # 3. Run AI Gesture Recognition Engine (Module 04) with timing
        t_gesture_start = time.perf_counter()
        gesture_res = self.gesture_engine.process_gestures(detected_hands, timestamp=now_ts)
        gesture_ms = (time.perf_counter() - t_gesture_start) * 1000.0

        # Merge gesture attributes into detected_hands
        for i, h_detect in enumerate(detected_hands):
            if i < len(gesture_res.hands):
                g_hand = gesture_res.hands[i]
                h_detect.primary_gesture = g_hand.primary_gesture
                h_detect.gesture_confidence = g_hand.gesture_confidence
                h_detect.finger_states = g_hand.finger_states
                h_detect.is_pinching = g_hand.is_pinching
                h_detect.pinch_strength = g_hand.pinch_strength
                h_detect.pinch_distance = g_hand.pinch_distance
                h_detect.pinch_started = g_hand.pinch_started
                h_detect.pinch_released = g_hand.pinch_released

        # 4. Run Motion Control & Virtual Cursor Engine (Module 05) with timing
        t_motion_start = time.perf_counter()
        motion_res = self.motion_control.process_tracking(
            detected_hands, gesture_res=gesture_res, timestamp=now_ts
        )
        motion_ms = (time.perf_counter() - t_motion_start) * 1000.0

        # 5. Formulate tracking status
        if hands_count == 0:
            status = TrackingStatus.NO_HAND.value
        elif hands_count == 1:
            status = TrackingStatus.ONE_HAND.value
        else:
            status = TrackingStatus.TWO_HANDS.value

        total_duration_ms = (time.perf_counter() - start_time) * 1000.0

        # Convert events to list of dicts
        events_dicts = [e.model_dump() for e in gesture_res.events]

        return TrackingResult(
            type="tracking_result",
            timestamp=now_ts,
            frame_id=frame_id,
            hands_detected=hands_count,
            tracking_status=status,
            processing_time_ms=round(total_duration_ms, 2),
            hands=detected_hands,
            two_hand_gesture=gesture_res.two_hand_gesture,
            two_hand_confidence=gesture_res.two_hand_confidence,
            events=events_dicts,
            cursor=motion_res.primary_cursor,
            secondary_cursor=motion_res.secondary_cursor,
            is_calibrated=motion_res.is_calibrated,
            motion_events=motion_res.events,
            client_timestamp=client_timestamp,
            decode_time_ms=round(decode_ms, 2),
            inference_time_ms=round(inference_ms, 2),
            gesture_time_ms=round(gesture_ms, 2),
            motion_time_ms=round(motion_ms, 2),
            server_queue_dropped=server_queue_dropped,
        )
