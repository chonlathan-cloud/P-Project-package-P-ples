from __future__ import annotations

from typing import Protocol

from ddbox_api.domain.models import GalleryItem, PricingBenchmark, StoredLead


class ContentRepository(Protocol):
    def create_gallery_item(self, item: GalleryItem) -> GalleryItem: ...

    def get_gallery_item(self, item_id: str) -> GalleryItem | None: ...

    def get_gallery_item_by_slug(self, slug: str) -> GalleryItem | None: ...

    def publish_gallery_item(
        self, item_id: str, expected_version: int, actor_uid: str
    ) -> GalleryItem: ...

    def list_published_gallery_items(self) -> list[GalleryItem]: ...

    def list_published_pricing_benchmarks(self) -> list[PricingBenchmark]: ...

    def create_lead_once(
        self,
        lead: StoredLead,
        idempotency_hash: str,
        payload_fingerprint: str,
    ) -> tuple[StoredLead, bool]: ...

    def get_lead(self, lead_id: str) -> StoredLead | None: ...

    def mark_notification(self, lead_id: str, status: str) -> None: ...


class NotificationGateway(Protocol):
    def notify_lead(self, lead: StoredLead) -> None: ...
