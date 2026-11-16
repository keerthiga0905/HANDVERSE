"""Unit and integration tests for MediaPipe Hand Tracking Engine (Module 03)."""

import sys
from pathlib import Path
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.core.model_manager import ModelManager
except ImportError:
    from core.model_manager import ModelManager
try:
    from backend.main import app
except ImportError:
    from main import app
from schemas.tracking import HandDetection, LandmarkPoint, TrackingResult, TrackingStatus
from services.frame_processor import FrameProcessor, FrameProcessorError
from services.tracking_service import TrackingService

client = TestClient(app)


def create_test_jpeg(width: int = 320, height: int = 240, color: tuple = (100, 150, 200)) -> bytes:
    """Helper to synthesize valid JPEG encoded bytes."""
    img = np.full((height, width, 3), color, dtype=np.uint8)
    # Draw simple visual shapes
    cv2.circle(img, (width // 2, height // 2), 40, (255, 255, 255), -1)
    success, buffer = cv2.imencode(".jpg", img)
    assert success
    return buffer.tobytes()


# ==============================================================================
# 1. JPEG Frame Decoding & Preprocessing Tests
# ==============================================================================
def test_valid_jpeg_frame_decoding():
    """Verify FrameProcessor successfully decodes valid JPEG byte buffer."""
    processor = FrameProcessor(max_width=640)
    jpeg_bytes = create_test_jpeg(320, 240)

    rgb_image, orig_w, orig_h, duration_ms = processor.decode_and_prepare(jpeg_bytes)

    assert rgb_image is not None
    assert isinstance(rgb_image, np.ndarray)
    assert orig_w == 320
    assert orig_h == 240
    assert rgb_image.shape == (240, 320, 3)
    assert duration_ms >= 0


def test_frame_resizing_optimization():
    """Verify FrameProcessor scales down large images to max_width."""
    processor = FrameProcessor(max_width=640)
    large_bytes = create_test_jpeg(1280, 720)

    rgb_image, orig_w, orig_h, _ = processor.decode_and_prepare(large_bytes)

    assert orig_w == 1280
    assert orig_h == 720
    assert rgb_image.shape[1] == 640  # downscaled width
    assert rgb_image.shape[0] == 360  # preserved aspect ratio


def test_invalid_and_corrupt_frame_handling():
    """Verify FrameProcessor rejects empty, corrupted, and invalid byte streams."""
    processor = FrameProcessor(max_width=640)

    # Empty bytes
    with pytest.raises(FrameProcessorError):
        processor.decode_and_prepare(b"")

    # Corrupted / non-image bytes
    with pytest.raises(FrameProcessorError):
        processor.decode_and_prepare(b"corrupted_non_image_payload_bytes_12345")


# ==============================================================================
# 2. Tracking Service & Schema Validation Tests
# ==============================================================================
def test_no_hand_detection_result():
    """Verify TrackingService returns zero hands and NO_HAND status on blank image."""
    service = TrackingService(max_width=640)
    blank_jpeg = create_test_jpeg(320, 240, color=(0, 0, 0))

    result = service.process_frame(blank_jpeg, client_frame_id=42)

    assert isinstance(result, TrackingResult)
    assert result.type == "tracking_result"
    assert result.frame_id == 42
    assert result.hands_detected == 0
    assert result.tracking_status == TrackingStatus.NO_HAND.value
    assert len(result.hands) == 0
    assert result.processing_time_ms > 0


def test_landmark_response_schema_and_coordinates():
    """Verify HandDetection and LandmarkPoint schemas enforce correct types and bounds."""
    # Synthesize 21 landmarks
    landmarks = [
        LandmarkPoint(id=i, x=round(i * 0.04, 3), y=round(i * 0.04, 3), z=0.01)
        for i in range(21)
    ]
    assert len(landmarks) == 21

    detection = HandDetection(
        handedness="Right",
        confidence=0.98,
        landmarks=landmarks,
    )

    result = TrackingResult(
        type="tracking_result",
        timestamp=1234567.89,
        frame_id=1,
        hands_detected=1,
        tracking_status=TrackingStatus.ONE_HAND.value,
        processing_time_ms=12.4,
        hands=[detection],
    )

    data = result.model_dump()
    assert data["hands_detected"] == 1
    assert data["hands"][0]["handedness"] == "Right"
    assert len(data["hands"][0]["landmarks"]) == 21
    assert 0.0 <= data["hands"][0]["landmarks"][0]["x"] <= 1.0


def test_two_hand_response_handling():
    """Verify TrackingResult schema handles two distinct hands simultaneously."""
    left_hand = HandDetection(
        handedness="Left",
        confidence=0.95,
        landmarks=[LandmarkPoint(id=i, x=0.2, y=0.5, z=0.0) for i in range(21)],
    )
    right_hand = HandDetection(
        handedness="Right",
        confidence=0.97,
        landmarks=[LandmarkPoint(id=i, x=0.8, y=0.5, z=0.0) for i in range(21)],
    )

    result = TrackingResult(
        type="tracking_result",
        timestamp=1234567.89,
        frame_id=10,
        hands_detected=2,
        tracking_status=TrackingStatus.TWO_HANDS.value,
        processing_time_ms=16.8,
        hands=[left_hand, right_hand],
    )

    assert result.hands_detected == 2
    assert result.tracking_status == "two_hands"
    assert {h.handedness for h in result.hands} == {"Left", "Right"}


def test_missing_model_file_handling():
    """Verify ModelManager raises FileNotFoundError when configured path is missing."""
    original_path = ModelManager.get_model_path()
    try:
        ModelManager.set_model_path(Path("non_existent_model_dir/hand.task"))
        assert not ModelManager.is_model_available()
    finally:
        ModelManager.set_model_path(original_path)


# ==============================================================================
# 3. WebSocket Connection & Streaming Tests
# ==============================================================================
def test_websocket_connection_and_handshake():
    """Verify WebSocket client establishes connection and receives handshake message."""
    with client.websocket_connect("/ws/hand-tracking") as websocket:
        handshake = websocket.receive_json()
        assert handshake["type"] == "CONNECTION_ESTABLISHED"
        assert handshake["channel"] == "hand-tracking"
        assert handshake["max_hands"] == 2


def test_websocket_binary_frame_processing():
    """Verify WebSocket accepts binary JPEG frame and returns TrackingResult JSON."""
    test_jpeg = create_test_jpeg(320, 240)

    with client.websocket_connect("/ws/hand-tracking") as websocket:
        # Read handshake
        _ = websocket.receive_json()

        # Send binary JPEG frame
        websocket.send_bytes(test_jpeg)

        # Receive tracking result
        response = websocket.receive_json()
        assert response["type"] == "tracking_result"
        assert "frame_id" in response
        assert "hands_detected" in response
        assert "processing_time_ms" in response
        assert isinstance(response["hands"], list)


def test_websocket_ping_pong():
    """Verify WebSocket supports client keepalive ping/pong."""
    with client.websocket_connect("/ws/hand-tracking") as websocket:
        _ = websocket.receive_json()

        websocket.send_json({"type": "PING", "timestamp": 12345})
        response = websocket.receive_json()
        assert response["type"] == "PONG"
        assert response["timestamp"] == 12345
