"""
VRAM Manager — Automatic model unloading after idle timeout.

Tracks last usage time per model and unloads after configurable timeout.
Designed for shared GPU environments (multiple services on one RTX 3090).

Usage in a service:
    from vram_manager import VramManager

    vram = VramManager(idle_timeout=300)  # 5 min

    # Before using a model
    vram.touch()

    # Call periodically (e.g., from health check or background task)
    vram.check_idle(unload_fn=my_unload_function)
"""

import os
import time
import logging
import threading
from typing import Optional, Callable

logger = logging.getLogger(__name__)

DEFAULT_IDLE_TIMEOUT = int(os.getenv("VRAM_IDLE_TIMEOUT", "300"))  # 5 minutes


class VramManager:
    def __init__(self, idle_timeout: int = DEFAULT_IDLE_TIMEOUT, service_name: str = "unknown"):
        self.idle_timeout = idle_timeout
        self.service_name = service_name
        self.last_used: float = 0.0
        self.model_loaded: bool = False
        self._lock = threading.Lock()
        self._timer: Optional[threading.Timer] = None

    def touch(self):
        """Mark the model as recently used. Call before/after each inference."""
        with self._lock:
            self.last_used = time.time()
            self.model_loaded = True
            self._schedule_check()

    def mark_loaded(self):
        """Mark that a model has been loaded into VRAM."""
        with self._lock:
            self.model_loaded = True
            self.last_used = time.time()
            self._schedule_check()
            logger.info(f"[{self.service_name}] Model loaded, idle timeout: {self.idle_timeout}s")

    def mark_unloaded(self):
        """Mark that a model has been unloaded from VRAM."""
        with self._lock:
            self.model_loaded = False
            if self._timer:
                self._timer.cancel()
                self._timer = None
            logger.info(f"[{self.service_name}] Model unloaded, VRAM freed")

    def is_idle(self) -> bool:
        """Check if the model has been idle longer than the timeout."""
        if not self.model_loaded:
            return False
        return (time.time() - self.last_used) > self.idle_timeout

    def seconds_until_unload(self) -> Optional[float]:
        """Seconds until the model will be unloaded, or None if not loaded."""
        if not self.model_loaded:
            return None
        remaining = self.idle_timeout - (time.time() - self.last_used)
        return max(0, remaining)

    def check_and_unload(self, unload_fn: Callable[[], None]) -> bool:
        """Check if idle and unload if so. Returns True if unloaded."""
        if self.is_idle():
            logger.info(f"[{self.service_name}] Idle for >{self.idle_timeout}s, unloading model...")
            try:
                unload_fn()
                self.mark_unloaded()
                return True
            except Exception as e:
                logger.error(f"[{self.service_name}] Failed to unload: {e}")
        return False

    def _schedule_check(self):
        """Schedule an idle check after the timeout period."""
        if self._timer:
            self._timer.cancel()

        self._timer = threading.Timer(
            self.idle_timeout + 5,  # Small buffer
            self._auto_check,
        )
        self._timer.daemon = True
        self._timer.start()

    def _auto_check(self):
        """Auto-triggered idle check (called by timer)."""
        # This is just a log — actual unloading needs the unload_fn
        # which depends on the service. The service should call check_and_unload.
        if self.is_idle():
            logger.info(f"[{self.service_name}] Model idle for >{self.idle_timeout}s — ready to unload")

    def status(self) -> dict:
        """Get current VRAM manager status."""
        return {
            "model_loaded": self.model_loaded,
            "idle_seconds": round(time.time() - self.last_used, 1) if self.model_loaded else None,
            "idle_timeout": self.idle_timeout,
            "seconds_until_unload": round(self.seconds_until_unload(), 1) if self.model_loaded else None,
        }
