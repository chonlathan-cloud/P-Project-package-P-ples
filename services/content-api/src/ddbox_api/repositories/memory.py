from __future__ import annotations

from threading import RLock

from ddbox_api.domain.errors import ConflictError, NotFoundError
from ddbox_api.domain.models import (
    ContentStatus,
    GalleryItem,
    PricingBenchmark,
    StoredLead,
    utc_now,
)


class InMemoryContentRepository:
    def __init__(self) -> None:
        self._gallery: dict[str, GalleryItem] = {}
        self._gallery_slugs: dict[str, str] = {}
        self._pricing: dict[str, PricingBenchmark] = {}
        self._leads: dict[str, StoredLead] = {}
        self._idempotency: dict[str, str] = {}
        self._lock = RLock()

    def create_gallery_item(self, item: GalleryItem) -> GalleryItem:
        with self._lock:
            if item.slug in self._gallery_slugs:
                raise ConflictError("gallery slug already exists")
            self._gallery[item.id] = item.model_copy(deep=True)
            self._gallery_slugs[item.slug] = item.id
            return item.model_copy(deep=True)

    def get_gallery_item(self, item_id: str) -> GalleryItem | None:
        with self._lock:
            item = self._gallery.get(item_id)
            return item.model_copy(deep=True) if item else None

    def get_gallery_item_by_slug(self, slug: str) -> GalleryItem | None:
        with self._lock:
            item_id = self._gallery_slugs.get(slug)
            item = self._gallery.get(item_id) if item_id else None
            return item.model_copy(deep=True) if item else None

    def publish_gallery_item(
        self, item_id: str, expected_version: int, actor_uid: str
    ) -> GalleryItem:
        with self._lock:
            item = self._gallery.get(item_id)
            if item is None:
                raise NotFoundError("gallery item not found")
            if item.version != expected_version:
                raise ConflictError("gallery item changed; reload before publishing")
            now = utc_now()
            published = item.model_copy(
                update={
                    "status": ContentStatus.PUBLISHED,
                    "version": item.version + 1,
                    "updated_at": now,
                    "published_at": now,
                    "updated_by": actor_uid,
                }
            )
            self._gallery[item_id] = published
            return published.model_copy(deep=True)

    def list_published_gallery_items(self) -> list[GalleryItem]:
        with self._lock:
            items = [
                item.model_copy(deep=True)
                for item in self._gallery.values()
                if item.status == ContentStatus.PUBLISHED
            ]
            return sorted(
                items,
                key=lambda item: item.published_at or item.created_at,
                reverse=True,
            )

    def list_published_pricing_benchmarks(self) -> list[PricingBenchmark]:
        with self._lock:
            return sorted(
                (
                    item.model_copy(deep=True)
                    for item in self._pricing.values()
                    if item.status == ContentStatus.PUBLISHED
                ),
                key=lambda item: item.label,
            )

    def seed_pricing_benchmark(self, item: PricingBenchmark) -> None:
        """Test support for exercising the public pricing contract."""
        with self._lock:
            self._pricing[item.id] = item.model_copy(deep=True)

    def create_lead_once(
        self,
        lead: StoredLead,
        idempotency_hash: str,
        payload_fingerprint: str,
    ) -> tuple[StoredLead, bool]:
        with self._lock:
            existing_id = self._idempotency.get(idempotency_hash)
            if existing_id:
                existing = self._leads[existing_id]
                if existing.payload_fingerprint != payload_fingerprint:
                    raise ConflictError("idempotency key was already used for another payload")
                return existing.model_copy(deep=True), True
            self._leads[lead.id] = lead.model_copy(deep=True)
            self._idempotency[idempotency_hash] = lead.id
            return lead.model_copy(deep=True), False

    def get_lead(self, lead_id: str) -> StoredLead | None:
        with self._lock:
            lead = self._leads.get(lead_id)
            return lead.model_copy(deep=True) if lead else None

    def mark_notification(self, lead_id: str, status: str) -> None:
        with self._lock:
            lead = self._leads.get(lead_id)
            if lead is None:
                raise NotFoundError("lead not found")
            self._leads[lead_id] = lead.model_copy(update={"notification_status": status})
