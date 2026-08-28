from __future__ import annotations

from uuid import uuid4

from ddbox_api.domain.errors import NotFoundError, ValidationError
from ddbox_api.domain.models import GalleryItem, GalleryItemCreate, utc_now
from ddbox_api.repositories.base import ContentRepository


class GalleryService:
    def __init__(self, repository: ContentRepository) -> None:
        self._repository = repository

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
        return item

    def publish(self, item_id: str, expected_version: int, actor_uid: str) -> GalleryItem:
        item = self.get_preview(item_id)
        if not item.customer_permission:
            raise ValidationError("customer publishing permission must be confirmed")
        if not item.image.alt.strip():
            raise ValidationError("image alt text is required")
        return self._repository.publish_gallery_item(item_id, expected_version, actor_uid)

    def list_published(self) -> list[GalleryItem]:
        return self._repository.list_published_gallery_items()
