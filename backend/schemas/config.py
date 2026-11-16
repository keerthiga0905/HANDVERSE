"""System configuration schema."""

from typing import Dict, List, Any
from pydantic import BaseModel


class SystemConfigResponse(BaseModel):
    """Runtime configuration sent to frontend client."""

    app_name: str
    app_version: str
    tagline: str
    theme: Dict[str, str]
    supported_gestures: List[Dict[str, str]]
    tracking_defaults: Dict[str, Any]
    websocket_url: str
