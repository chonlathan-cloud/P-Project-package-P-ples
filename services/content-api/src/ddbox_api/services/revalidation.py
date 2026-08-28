from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)


class RevalidationGateway:
    def __init__(self, url: str | None, token: str | None) -> None:
        self._url = url
        self._token = token

    def revalidate_gallery(self) -> None:
        if not self._url:
            logger.info("revalidation_skipped", extra={"reason": "not_configured"})
            return
        headers = {"Authorization": f"Bearer {self._token}"} if self._token else {}
        try:
            response = httpx.post(
                self._url,
                json={"tags": ["gallery"]},
                headers=headers,
                timeout=5.0,
            )
            response.raise_for_status()
            logger.info("revalidation_succeeded", extra={"target": "gallery"})
        except httpx.HTTPError:
            logger.exception("revalidation_failed", extra={"target": "gallery"})
