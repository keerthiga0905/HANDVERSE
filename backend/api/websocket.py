"""Real-time WebSocket endpoints for video-frame streaming and AI hand tracking."""

import asyncio
import base64
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from schemas.tracking import TrackingError, TrackingResult
from services.frame_processor import FrameProcessorError
from services.tracking_service import TrackingService

logger = logging.getLogger("HANDVERSE.WebSocket")
router = APIRouter(tags=["Hand Tracking WebSocket"])

# Shared tracking service instance (lazy/cached)
_tracking_service: Optional[TrackingService] = None


def get_tracking_service() -> TrackingService:
    global _tracking_service
    if _tracking_service is None:
        _tracking_service = TrackingService(max_width=640)
    return _tracking_service


async def handle_hand_tracking_socket(websocket: WebSocket):
    """Core WebSocket handler for incoming webcam frames and landmark output."""
    await websocket.accept()
    logger.info("Client connected to real-time hand tracking WebSocket.")

    service = get_tracking_service()
    frame_sequence = 0

    # Send initial handshake message
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "channel": "hand-tracking",
        "model": "MediaPipe HandLandmarker Tasks",
        "max_hands": 2,
        "target_fps": 15,
        "status": "ready",
    })

    try:
        while True:
            # Receive either binary frame bytes or JSON command message
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                frame_bytes = message["bytes"]
                frame_sequence += 1

                try:
                    # Execute CPU-intensive image decode and MediaPipe inference in a separate thread
                    result: TrackingResult = await asyncio.to_thread(
                        service.process_frame, frame_bytes, frame_sequence
                    )
                    await websocket.send_json(result.model_dump())

                except FrameProcessorError as f_err:
                    err_payload = TrackingError(
                        frame_id=frame_sequence,
                        error_code="INVALID_FRAME",
                        message=str(f_err),
                    )
                    await websocket.send_json(err_payload.model_dump())

                except Exception as exc:
                    logger.error(f"Inference error on frame {frame_sequence}: {exc}")
                    err_payload = TrackingError(
                        frame_id=frame_sequence,
                        error_code="INFERENCE_ERROR",
                        message="Error during hand landmark detection",
                    )
                    await websocket.send_json(err_payload.model_dump())

            elif "text" in message and message["text"]:
                try:
                    text_data = json.loads(message["text"])
                    msg_type = text_data.get("type", "UNKNOWN")

                    if msg_type == "PING":
                        await websocket.send_json({
                            "type": "PONG",
                            "timestamp": text_data.get("timestamp"),
                        })

                    elif msg_type == "UPDATE_GESTURE_SETTINGS":
                        # Update dynamic runtime gesture thresholds
                        settings_dict = text_data.get("settings", {})
                        from schemas.gesture import GestureSettings
                        try:
                            new_settings = GestureSettings(**settings_dict)
                            service.gesture_engine.update_settings(new_settings)
                            await websocket.send_json({
                                "type": "SETTINGS_UPDATED",
                                "status": "success",
                            })
                        except Exception as s_err:
                            await websocket.send_json({
                                "type": "ERROR",
                                "message": f"Invalid gesture settings: {s_err}",
                            })

                    elif msg_type == "UPDATE_MOTION_SETTINGS":
                        # Update runtime motion control settings (Module 05)
                        settings_dict = text_data.get("settings", {})
                        from schemas.motion import MotionSettings
                        try:
                            new_motion_settings = MotionSettings(**settings_dict)
                            service.motion_control.update_settings(new_motion_settings)
                            await websocket.send_json({
                                "type": "MOTION_SETTINGS_UPDATED",
                                "status": "success",
                            })
                        except Exception as m_err:
                            await websocket.send_json({
                                "type": "ERROR",
                                "message": f"Invalid motion settings: {m_err}",
                            })

                    elif msg_type == "CAPTURE_CALIBRATION_POINT":
                        # Capture calibration target over WebSocket
                        from schemas.calibration import CalibrationCaptureRequest
                        try:
                            point_name = text_data.get("point_name", "")
                            cx = text_data.get("x")
                            cy = text_data.get("y")
                            req = CalibrationCaptureRequest(point_name=point_name, x=cx, y=cy)
                            success, msg, step = service.motion_control.calibrator.capture_point(req)
                            await websocket.send_json({
                                "type": "CALIBRATION_POINT_CAPTURED",
                                "point_name": point_name,
                                "success": success,
                                "message": msg,
                                "active_step": step,
                                "points_captured": list(service.motion_control.calibrator.points_buffer.keys()),
                            })
                        except Exception as c_err:
                            await websocket.send_json({
                                "type": "ERROR",
                                "message": f"Calibration capture error: {c_err}",
                            })

                    elif msg_type == "RESET_CALIBRATION":
                        service.motion_control.calibrator.reset_calibration()
                        await websocket.send_json({
                            "type": "CALIBRATION_RESET",
                            "status": "success",
                        })

                    elif msg_type == "FRAME_BASE64":
                        # Support base64 fallback frames
                        frame_sequence += 1
                        raw_b64 = text_data.get("data", "")
                        if "," in raw_b64:
                            raw_b64 = raw_b64.split(",", 1)[1]
                        frame_bytes = base64.b64decode(raw_b64)

                        result = await asyncio.to_thread(
                            service.process_frame, frame_bytes, frame_sequence
                        )
                        await websocket.send_json(result.model_dump())

                    else:
                        await websocket.send_json({
                            "type": "ACK",
                            "received_type": msg_type,
                        })

                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "tracking_error",
                        "error_code": "JSON_DECODE_ERROR",
                        "message": "Malformed JSON text packet received.",
                    })

    except WebSocketDisconnect:
        logger.info("Client disconnected from hand tracking WebSocket.")
    except Exception as exc:
        logger.error(f"Unexpected WebSocket failure: {exc}", exc_info=True)


@router.websocket("/ws/hand-tracking")
async def hand_tracking_endpoint(websocket: WebSocket):
    """Primary WebSocket endpoint for real-time video streaming & hand landmark tracking."""
    await handle_hand_tracking_socket(websocket)


@router.websocket("/ws/tracking")
async def legacy_tracking_endpoint(websocket: WebSocket):
    """Alias WebSocket endpoint for backward compatibility."""
    await handle_hand_tracking_socket(websocket)
