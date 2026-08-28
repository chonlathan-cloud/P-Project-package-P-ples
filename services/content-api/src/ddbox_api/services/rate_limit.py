from __future__ import annotations

from collections import defaultdict, deque
from threading import RLock
from time import monotonic

from ddbox_api.domain.errors import DomainError


class RateLimitError(DomainError):
    code = "rate_limited"
    status_code = 429


class InMemoryRateLimiter:
    """Per-instance protection for local/MVP use; production should use a shared edge control."""

    def __init__(self, limit: int = 10, window_seconds: int = 60) -> None:
        self._limit = limit
        self._window = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = RLock()

    def check(self, key: str) -> None:
        now = monotonic()
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - self._window:
                events.popleft()
            if len(events) >= self._limit:
                raise RateLimitError("too many lead submissions; try again later")
            events.append(now)
