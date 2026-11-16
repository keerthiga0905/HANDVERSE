"""Health check schema."""

from typing import Dict, Any
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """API health status response."""

    status: str
    app_name: str
    version: str
    timestamp: str
    services: Dict[str, Any]
