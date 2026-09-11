from __future__ import annotations

from datetime import datetime
from typing import Literal, Protocol

from ddbox_api.domain.models import (
    ContentDocument,
    ContentKind,
    ContentStatus,
    GalleryItem,
    LineGroupCandidate,
    PricingBenchmark,
    StoredLead,
    StructuredContent,
)


class ContentRepository(Protocol):
    def create_content(self, document: ContentDocument) -> ContentDocument: ...

    def list_content(self, kind: ContentKind) -> list[ContentDocument]: ...

    def get_content(self, kind: ContentKind, document_id: str) -> ContentDocument | None: ...

    def update_content(
        self,
        kind: ContentKind,
        document_id: str,
        expected_version: int,
        content: StructuredContent,
        actor_uid: str,
    ) -> ContentDocument: ...

    def transition_content(
        self,
        kind: ContentKind,
        document_id: str,
        expected_version: int,
        status: ContentStatus,
        actor_uid: str,
    ) -> ContentDocument: ...

    def list_published_content(self, kind: ContentKind) -> list[ContentDocument]: ...

    def get_published_content_by_slug(
        self, kind: ContentKind, slug: str
    ) -> ContentDocument | None: ...

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
        compatible_payload_fingerprints: frozenset[str] = frozenset(),
    ) -> tuple[StoredLead, bool]: ...

    def get_lead(self, lead_id: str) -> StoredLead | None: ...

    def list_leads(
        self,
        created_from: datetime,
        created_to: datetime,
        *,
        after_id: str | None = None,
        limit: int = 500,
    ) -> list[StoredLead]: ...

    def claim_notification(
        self, lead_id: str, lease_until: datetime
    ) -> tuple[Literal["claimed", "busy", "sent", "missing"], StoredLead | None]: ...

    def mark_notification_sent(self, lead_id: str, channel: str, sent_at: datetime) -> None: ...

    def mark_notification_failed(self, lead_id: str, error_code: str) -> None: ...

    def upsert_line_group_candidate(self, candidate: LineGroupCandidate) -> None: ...

    def get_line_group_candidate(self, candidate_id: str) -> LineGroupCandidate | None: ...


class NotificationGateway(Protocol):
    def notify_lead(self, lead: StoredLead) -> str: ...


class NotificationTaskPublisher(Protocol):
    def enqueue(self, lead_id: str) -> str: ...
