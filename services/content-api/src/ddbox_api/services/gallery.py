from __future__ import annotations

from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4

from ddbox_api.domain.errors import NotFoundError, ValidationError
from ddbox_api.domain.models import GalleryEvidenceType, GalleryItem, GalleryItemCreate, utc_now
from ddbox_api.repositories.base import ContentRepository


class GalleryService:
    def __init__(self, repository: ContentRepository, public_api_url: str = "") -> None:
        self._repository = repository
        self._public_api_url = public_api_url.rstrip("/")

    def create_draft(self, payload: GalleryItemCreate, actor_uid: str) -> GalleryItem:
        now = utc_now()
        item = GalleryItem(
            id=uuid4().hex,
            **payload.model_dump(),
            created_at=now,
            updated_at=now,
            created_by=actor_uid,
            updated_by=actor_uid,
        )
        return self._repository.create_gallery_item(item)

    def get_preview(self, item_id: str) -> GalleryItem:
        item = self._repository.get_gallery_item(item_id)
        if item is None:
            raise NotFoundError("gallery item not found")
        return self._resolve_legacy_media_origins(item)

    def publish(self, item_id: str, expected_version: int, actor_uid: str) -> GalleryItem:
        item = self.get_preview(item_id)
        if item.evidence_type == GalleryEvidenceType.CUSTOMER_WORK and not item.customer_permission:
            raise ValidationError("customer publishing permission must be confirmed")
        if any(not image.alt.strip() for image in item.images):
            raise ValidationError("image alt text is required for every image")
        return self._repository.publish_gallery_item(item_id, expected_version, actor_uid)

    def list_published(self) -> list[GalleryItem]:
        return [
            self._resolve_legacy_media_origins(item)
            for item in self._repository.list_published_gallery_items()
        ]

    def _resolve_legacy_media_origins(self, item: GalleryItem) -> GalleryItem:
        if not self._public_api_url:
            return item

        def resolve(url: str | None) -> str | None:
            if url is None:
                return None
            parsed = urlsplit(url)
            if parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
                return url
            if not parsed.path.startswith("/media/"):
                return url
            public_origin = urlsplit(self._public_api_url)
            return urlunsplit(
                (
                    public_origin.scheme,
                    public_origin.netloc,
                    parsed.path,
                    parsed.query,
                    parsed.fragment,
                )
            )

        images = [
            image.model_copy(
                update={
                    "url": resolve(image.url),
                    "fallback_url": resolve(image.fallback_url),
                }
            )
            for image in item.images
        ]
        return item.model_copy(update={"images": images})
