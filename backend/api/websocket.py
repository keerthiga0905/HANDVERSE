"""Real-time WebSocket endpoints for low-latency AI hand tracking with latest-frame-only architecture."""

import asyncio
import base64
import json
import logging
import struct
import time
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from schemas.tracking import TrackingError, TrackingResult
from services.frame_processor import FrameProcessorError
from services.tracking_service import TrackingService

logger = logging.getLogger("HANDVERSE.WebSocket")
router = APIRouter(tags=["Hand Tracking WebSocket"])

_tracking_service: Optional[TrackingService] = None


def get_tracking_service() -> TrackingService:
    global _tracking_service
    if _tracking_service is None:
        _tracking_service = TrackingService(max_width=480)
    return _tracking_service


async def handle_hand_tracking_socket(websocket: WebSocket):
    """Zero-lag producer-consumer WebSocket handler enforcing latest-frame-only processing.

    Guarantees that stale frames never accumulate in memory or event loops.
    """
    await websocket.accept()
    logger.info("Client connected to real-time hand tracking WebSocket.")

    service = get_tracking_service()

    # Send initial handshake message
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "channel": "hand-tracking",
        "model": "MediaPipe HandLandmarker Tasks",
        "max_hands": 2,
        "target_fps": 20,
        "status": "ready",
    })

    # Latest-frame slot and synchronization primitives
    latest_slot = {"data": None, "pending": False}
    new_frame_event = asyncio.Event()
    dropped_frames_count = 0
    running = True

    async def receive_loop():
        """Producer task: continuously drains WebSocket messages with zero queuing delay."""
        nonlocal dropped_frames_count, running
        try:
            while running:
                message = await websocket.receive()

                if "bytes" in message and message["bytes"]:
                    raw_bytes = message["bytes"]

                    # Inspect binary header (12 bytes: uint32 frame_id, float64 timestamp)
                    # Raw JPEG starts with 0xFF, 0xD8
                    if len(raw_bytes) >= 12 and not (raw_bytes[0] == 0xFF and raw_bytes[1] == 0xD8):
                        try:
                            f_id, c_ts = struct.unpack("!Id", raw_bytes[:12])
                            jpeg_bytes = raw_bytes[12:]
                        except Exception:
                            f_id, c_ts = None, None
                            jpeg_bytes = raw_bytes
                    else:
                        f_id = None
                        c_ts = None
                        jpeg_bytes = raw_bytes

                    # If previous frame wasn't picked up by worker yet, it is superseded (dropped)
                    if latest_slot["pending"]:
                        dropped_frames_count += 1

                    latest_slot["data"] = (jpeg_bytes, f_id, c_ts)
                    latest_slot["pending"] = True
                    new_frame_event.set()

                elif "text" in message and message["text"]:
                    try:
                        text_data = json.loads(message["text"])
                        msg_type = text_data.get("type", "UNKNOWN")

                        if msg_type == "PING":
                            await websocket.send_json({
                                "type": "PONG",
                                "timestamp": text_data.get("timestamp"),
                                "server_time": time.time(),
                            })

                        elif msg_type == "UPDATE_GESTURE_SETTINGS":
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
                            # Base64 fallback frame
                            raw_b64 = text_data.get("data", "")
                            if "," in raw_b64:
                                raw_b64 = raw_b64.split(",", 1)[1]
                            jpeg_bytes = base64.b64decode(raw_b64)
                            f_id = text_data.get("frame_id")
                            c_ts = text_data.get("timestamp")

                            if latest_slot["pending"]:
                                dropped_frames_count += 1

                            latest_slot["data"] = (jpeg_bytes, f_id, c_ts)
                            latest_slot["pending"] = True
                            new_frame_event.set()

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
            pass
        except Exception as exc:
            logger.debug(f"WebSocket receive_loop terminated: {exc}")
        finally:
            running = False
            new_frame_event.set()

    async def process_loop():
        """Consumer task: executes inference on the latest frame only, discarding backlog."""
        nonlocal dropped_frames_count, running
        try:
            while running:
                await new_frame_event.wait()
                new_frame_event.clear()

                if not running:
                    break

                if not latest_slot["pending"] or latest_slot["data"] is None:
                    continue

                # Atomically extract freshest frame
                jpeg_bytes, f_id, c_ts = latest_slot["data"]
                latest_slot["pending"] = False

                current_dropped = dropped_frames_count
                dropped_frames_count = 0

                try:
                    # Execute CPU-intensive processing in background thread pool
                    result: TrackingResult = await asyncio.to_thread(
                        service.process_frame,
                        jpeg_bytes,
                        client_frame_id=f_id,
                        client_timestamp=c_ts,
                        server_queue_dropped=current_dropped,
                    )

                    # Send pre-serialized JSON string (fast path)
                    if running:
                        await websocket.send_text(result.model_dump_json())

                except FrameProcessorError as f_err:
                    err_payload = TrackingError(
                        frame_id=f_id,
                        error_code="INVALID_FRAME",
                        message=str(f_err),
                    )
                    if running:
                        await websocket.send_text(err_payload.model_dump_json())

                except Exception as exc:
                    logger.error(f"Inference error on frame {f_id}: {exc}")
                    err_payload = TrackingError(
                        frame_id=f_id,
                        error_code="INFERENCE_ERROR",
                        message="Error during hand landmark detection",
                    )
                    if running:
                        await websocket.send_text(err_payload.model_dump_json())

        except WebSocketDisconnect:
            pass
        except Exception as exc:
            logger.debug(f"WebSocket process_loop terminated: {exc}")
        finally:
            running = False

    # Run receiver and processor concurrently
    receiver_task = asyncio.create_task(receive_loop())
    processor_task = asyncio.create_task(process_loop())

    try:
        done, pending = await asyncio.wait(
            [receiver_task, processor_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    finally:
        running = False
        new_frame_event.set()
        logger.info("Cleaned up WebSocket tasks for hand tracking client.")


@router.websocket("/ws/hand-tracking")
async def hand_tracking_endpoint(websocket: WebSocket):
    """Primary WebSocket endpoint for real-time video streaming & hand landmark tracking."""
    await handle_hand_tracking_socket(websocket)


@router.websocket("/ws/tracking")
async def legacy_tracking_endpoint(websocket: WebSocket):
    """Alias WebSocket endpoint for backward compatibility."""
    await handle_hand_tracking_socket(websocket)
