"""HANDVERSE - Application Entry Point.

Module 01: Project Foundation.
Initializes runtime systems, sets up Pygame display, presents the foundational
welcome screen, and ensures graceful resource cleanup on termination.
"""

from dataclasses import dataclass
import logging
import math
import sys
from typing import Tuple

import pygame

from config import (
    APPLICATION_NAME,
    APPLICATION_VERSION,
    DEFAULT_CONFIG,
    TARGET_FPS,
    WINDOW_HEIGHT,
    WINDOW_TITLE,
    WINDOW_WIDTH,
    AppConfig,
)

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("HANDVERSE")


@dataclass
class UIColors:
    """Color palette for the foundational welcome screen."""

    BACKGROUND: Tuple[int, int, int] = (14, 17, 27)
    CARD_BG: Tuple[int, int, int] = (24, 29, 45)
    CARD_BORDER: Tuple[int, int, int] = (56, 68, 105)
    PRIMARY: Tuple[int, int, int] = (0, 229, 255)  # Cyan neon
    ACCENT: Tuple[int, int, int] = (168, 85, 247)  # Violet
    TEXT_MAIN: Tuple[int, int, int] = (245, 247, 250)
    TEXT_MUTED: Tuple[int, int, int] = (148, 163, 184)
    SUCCESS: Tuple[int, int, int] = (34, 197, 94)


class HandverseApp:
    """Core application controller for HANDVERSE arcade foundation."""

    def __init__(self, config: AppConfig = DEFAULT_CONFIG) -> None:
        self.config = config
        self.screen: pygame.Surface
        self.clock: pygame.time.Clock
        self.is_running: bool = False
        self.colors = UIColors()
        self.animation_time: float = 0.0

    def initialize(self) -> None:
        """Initialize Pygame subsystems, display surface, and timing clocks."""
        logger.info("Initializing HANDVERSE runtime engine...")

        # Initialize core Pygame modules
        pygame.init()
        pygame.font.init()

        # Setup display surface and window caption
        self.screen = pygame.display.set_mode(self.config.display.resolution)
        pygame.display.set_caption(self.config.display.title)

        # Initialize internal clock
        self.clock = pygame.time.Clock()
        self.is_running = True
        logger.info("Pygame window initialized: %dx%d @ %d FPS", WINDOW_WIDTH, WINDOW_HEIGHT, TARGET_FPS)

    def handle_events(self) -> None:
        """Poll and dispatch OS and Pygame window events."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                logger.info("Close window requested by user.")
                self.is_running = False

            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_ESCAPE, pygame.K_q):
                    logger.info("Exit requested via keypress.")
                    self.is_running = False

    def update(self, dt: float) -> None:
        """Update foundation animations and frame delta."""
        self.animation_time += dt

    def render(self) -> None:
        """Render the foundational welcome screen."""
        self.screen.fill(self.colors.BACKGROUND)

        # Subtle pulsing animated glow accent
        glow_pulse = (math.sin(self.animation_time * 2.5) + 1.0) * 0.5
        accent_color = (
            int(self.colors.PRIMARY[0] * (0.7 + 0.3 * glow_pulse)),
            int(self.colors.PRIMARY[1] * (0.7 + 0.3 * glow_pulse)),
            int(self.colors.PRIMARY[2] * (0.7 + 0.3 * glow_pulse)),
        )

        center_x = WINDOW_WIDTH // 2
        center_y = WINDOW_HEIGHT // 2

        # Card Container
        card_w, card_h = 760, 420
        card_rect = pygame.Rect(center_x - card_w // 2, center_y - card_h // 2, card_w, card_h)
        pygame.draw.rect(self.screen, self.colors.CARD_BG, card_rect, border_radius=16)
        pygame.draw.rect(self.screen, self.colors.CARD_BORDER, card_rect, width=2, border_radius=16)

        # Neon top accent bar on card
        accent_bar_rect = pygame.Rect(card_rect.left, card_rect.top, card_w, 4)
        pygame.draw.rect(self.screen, accent_color, accent_bar_rect, border_top_left_radius=16, border_top_right_radius=16)

        # Typography setup
        title_font = pygame.font.SysFont("Segoe UI", 48, bold=True)
        subtitle_font = pygame.font.SysFont("Segoe UI", 18)
        body_font = pygame.font.SysFont("Consolas", 15)
        footer_font = pygame.font.SysFont("Segoe UI", 14)

        # Title: HANDVERSE
        title_surf = title_font.render(APPLICATION_NAME, True, self.colors.TEXT_MAIN)
        title_rect = title_surf.get_rect(center=(center_x, center_y - 130))
        self.screen.blit(title_surf, title_rect)

        # Subtitle
        sub_text = "Hand-Motion-Controlled Gaming Arcade"
        sub_surf = subtitle_font.render(sub_text, True, accent_color)
        sub_rect = sub_surf.get_rect(center=(center_x, center_y - 80))
        self.screen.blit(sub_surf, sub_rect)

        # Status badge
        badge_rect = pygame.Rect(center_x - 170, center_y - 45, 340, 32)
        pygame.draw.rect(self.screen, (22, 38, 46), badge_rect, border_radius=8)
        pygame.draw.rect(self.screen, self.colors.PRIMARY, badge_rect, width=1, border_radius=8)

        badge_surf = footer_font.render("● MODULE 01: PROJECT FOUNDATION ACTIVE", True, self.colors.PRIMARY)
        badge_surf_rect = badge_surf.get_rect(center=badge_rect.center)
        self.screen.blit(badge_surf_rect_render := badge_surf, badge_surf_rect)

        # Foundation Specs / Info Lines
        info_lines = [
            f"Resolution: {WINDOW_WIDTH}x{WINDOW_HEIGHT}   |   Target FPS: {TARGET_FPS}   |   Version: {APPLICATION_VERSION}",
            "Engine: Pygame   |   Vision Pipeline: OpenCV & MediaPipe Ready",
            "Hardware: Video Capture Ready   |   Persistent Store: SQLite Ready",
        ]

        start_y = center_y + 15
        for idx, line in enumerate(info_lines):
            line_surf = body_font.render(line, True, self.colors.TEXT_MUTED)
            line_rect = line_surf.get_rect(center=(center_x, start_y + (idx * 26)))
            self.screen.blit(line_surf, line_rect)

        # Exit Instructions Footer
        exit_surf = footer_font.render(
            "Press [ESC] or close window to exit cleanly",
            True,
            self.colors.TEXT_MAIN,
        )
        exit_rect = exit_surf.get_rect(center=(center_x, center_y + 145))
        self.screen.blit(exit_surf, exit_rect)

        # Flip display surface
        pygame.display.flip()

    def run(self) -> int:
        """Run the main application loop with lifecycle management."""
        try:
            self.initialize()
            logger.info("Application loop started. Press ESC or close window to exit.")

            while self.is_running:
                # Calculate delta time in seconds
                dt = self.clock.tick(self.config.display.fps) / 1000.0

                self.handle_events()
                self.update(dt)
                self.render()

            logger.info("Exiting application loop gracefully.")
            return 0

        except Exception as exc:
            logger.critical("Unexpected runtime exception in application: %s", exc, exc_info=True)
            return 1

        finally:
            self.cleanup()

    def cleanup(self) -> None:
        """Release all allocated system and graphics resources."""
        logger.info("Releasing resources and terminating subsystems...")
        try:
            pygame.quit()
        except Exception as exc:
            logger.warning("Error during Pygame shutdown: %s", exc)
        logger.info("Cleanup completed successfully.")


def main() -> int:
    """Application entry point function."""
    app = HandverseApp()
    return app.run()


if __name__ == "__main__":
    sys.exit(main())
