"""Forwarder for ModelManager to support both root and backend path resolution."""
from backend.core.model_manager import ModelManager, DEFAULT_MODEL_PATH

__all__ = ["ModelManager", "DEFAULT_MODEL_PATH"]
