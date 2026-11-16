"""Audio playback and sound effects manager for HANDVERSE.

Wraps Pygame mixer to provide background music and sound effects playback.
Implementation will be finalized in subsequent modules.
"""

from pathlib import Path
from typing import Dict, Optional
import pygame


class AudioManager:
    """Manages sound effects, music playback, and audio volume."""

    def __init__(self, sound_enabled: bool = True) -> None:
        self.sound_enabled = sound_enabled
        self.sounds: Dict[str, pygame.mixer.Sound] = {}
        self.initialized: bool = False

    def initialize(self) -> bool:
        """Initialize Pygame audio mixer subsystem if sound is enabled."""
        if not self.sound_enabled:
            return False

        try:
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            self.initialized = True
            return True
        except pygame.error:
            self.initialized = False
            return False

    def play_sound(self, sound_name: str) -> None:
        """Play a cached sound effect."""
        if self.initialized and self.sound_enabled and sound_name in self.sounds:
            self.sounds[sound_name].play()

    def stop_all(self) -> None:
        """Stop all currently playing sound channels."""
        if self.initialized:
            pygame.mixer.stop()

    def shutdown(self) -> None:
        """Safely shut down the audio mixer."""
        if self.initialized:
            pygame.mixer.quit()
            self.initialized = False
