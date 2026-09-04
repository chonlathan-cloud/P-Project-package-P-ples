from __future__ import annotations

from datetime import datetime
from threading import RLock
from typing import Literal

from ddbox_api.domain.errors import ConflictError, NotFoundError
from ddbox_api.domain.models import (
    ContentDocument,
    ContentKind,
    ContentStatus,
    GalleryItem,
    LineGroupCandidate,
    NotificationStatus,
    PricingBenchmark,
    StoredLead,
    StructuredContent,
    utc_now,
)


class InMemoryContentRepository:
    def __init__(self) -> None:
        self._content: dict[ContentKind, dict[str, ContentDocument]] = {
            kind: {} for kind in ContentKind
        }
        self._content_slugs: dict[ContentKind, dict[str, str]] = {kind: {} for kind in ContentKind}
        self._gallery: dict[str, GalleryItem] = {}
        self._gallery_slugs: dict[str, str] = {}
        self._pricing: dict[str, PricingBenchmark] = {}
        self._leads: dict[str, StoredLead] = {}
        self._idempotency: dict[str, str] = {}
        self._line_group_candidates: dict[str, LineGroupCandidate] = {}
        self._lock = RLock()

    def create_content(self, document: ContentDocument) -> ContentDocument:
        with self._lock:
            slugs = self._content_slugs[document.kind]
            if document.content.slug in slugs:
                raise ConflictError(f"{document.kind.value} slug already exists")
            self._content[document.kind][document.id] = document.model_copy(deep=True)
            slugs[document.content.slug] = document.id
            return document.model_copy(deep=True)

    def list_content(self, kind: ContentKind) -> list[ContentDocument]:
        with self._lock:
            documents = [item.model_copy(deep=True) for item in self._content[kind].values()]
            return sorted(documents, key=lambda item: item.updated_at, reverse=True)

    def get_content(self, kind: ContentKind, document_id: str) -> ContentDocument | None:
        with self._lock:
            document = self._content[kind].get(document_id)
            return document.model_copy(deep=True) if document else None

    def update_content(
        self,
        kind: ContentKind,
        document_id: str,
        expected_version: int,
        content: StructuredContent,
        actor_uid: str,
    ) -> ContentDocument:
        with self._lock:
            current = self._content[kind].get(document_id)
            if current is None:
                raise NotFoundError(f"{kind.value} not found")
            if current.version != expected_version:
                raise ConflictError(f"{kind.value} changed; reload before saving")
            if current.content.slug != content.slug:
                if current.published_at is not None:
                    raise ConflictError("slug cannot change after first publish")
                slugs = self._content_slugs[kind]
                if content.slug in slugs:
                    raise ConflictError(f"{kind.value} slug already exists")
                del slugs[current.content.slug]
                slugs[content.slug] = document_id
            updated = current.model_copy(
                update={
                    "content": content,
                    "has_unpublished_changes": True,
                    "version": current.version + 1,
                    "updated_at": utc_now(),
                    "updated_by": actor_uid,
                }
            )
            self._content[kind][document_id] = updated
            return updated.model_copy(deep=True)

    def transition_content(
        self,
        kind: ContentKind,
        document_id: str,
        expected_version: int,
        status: ContentStatus,
        actor_uid: str,
    ) -> ContentDocument:
        with self._lock:
            current = self._content[kind].get(document_id)
            if current is None:
                raise NotFoundError(f"{kind.value} not found")
            if current.version != expected_version:
                raise ConflictError(f"{kind.value} changed; reload before changing status")
            now = utc_now()
            update: dict[str, object] = {
                "status": status,
                "version": current.version + 1,
                "updated_at": now,
                "updated_by": actor_uid,
            }
            if status == ContentStatus.PUBLISHED:
                update.update(
                    {
                        "published_content": current.content.model_copy(deep=True),
                        "published_at": now,
                        "has_unpublished_changes": False,
                    }
                )
            published = current.model_copy(update=update)
            self._content[kind][document_id] = published
            return published.model_copy(deep=True)

    def list_published_content(self, kind: ContentKind) -> list[ContentDocument]:
        with self._lock:
            documents = [
                item.model_copy(update={"content": item.published_content}, deep=True)
                for item in self._content[kind].values()
                if item.status == ContentStatus.PUBLISHED and item.published_content is not None
            ]
            return sorted(
                documents,
                key=lambda item: item.published_at or item.created_at,
                reverse=True,
            )

    def get_published_content_by_slug(self, kind: ContentKind, slug: str) -> ContentDocument | None:
        with self._lock:
            document_id = self._content_slugs[kind].get(slug)
            document = self._content[kind].get(document_id) if document_id else None
            if (
                document is None
                or document.status != ContentStatus.PUBLISHED
                or document.published_content is None
            ):
                return None
            return document.model_copy(update={"content": document.published_content}, deep=True)

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

    def claim_notification(
        self, lead_id: str, lease_until: datetime
    ) -> tuple[Literal["claimed", "busy", "sent", "missing"], StoredLead | None]:
        with self._lock:
            lead = self._leads.get(lead_id)
            if lead is None:
                return "missing", None
            if lead.notification_status == NotificationStatus.SENT:
                return "sent", lead.model_copy(deep=True)
            now = utc_now()
            if (
                lead.notification_status == NotificationStatus.PROCESSING
                and lead.notification_lease_until
                and lead.notification_lease_until > now
            ):
                return "busy", lead.model_copy(deep=True)
            claimed = lead.model_copy(
                update={
                    "notification_status": NotificationStatus.PROCESSING,
                    "notification_attempts": lead.notification_attempts + 1,
                    "notification_lease_until": lease_until,
                    "notification_last_error": None,
                }
            )
            self._leads[lead_id] = claimed
            return "claimed", claimed.model_copy(deep=True)

    def mark_notification_sent(self, lead_id: str, channel: str, sent_at: datetime) -> None:
        with self._lock:
            lead = self._leads.get(lead_id)
            if lead is None:
                raise NotFoundError("lead not found")
            self._leads[lead_id] = lead.model_copy(
                update={
                    "notification_status": NotificationStatus.SENT,
                    "notification_channel": channel,
                    "notification_sent_at": sent_at,
                    "notification_lease_until": None,
                    "notification_last_error": None,
                }
            )

    def mark_notification_failed(self, lead_id: str, error_code: str) -> None:
        with self._lock:
            lead = self._leads.get(lead_id)
            if lead is None:
                raise NotFoundError("lead not found")
            self._leads[lead_id] = lead.model_copy(
                update={
                    "notification_status": NotificationStatus.FAILED,
                    "notification_lease_until": None,
                    "notification_last_error": error_code,
                }
            )

    def upsert_line_group_candidate(self, candidate: LineGroupCandidate) -> None:
        with self._lock:
            existing = self._line_group_candidates.get(candidate.id)
            if existing:
                candidate = candidate.model_copy(
                    update={
                        "first_seen_at": existing.first_seen_at,
                        "status": existing.status,
                    }
                )
            self._line_group_candidates[candidate.id] = candidate.model_copy(deep=True)

    def get_line_group_candidate(self, candidate_id: str) -> LineGroupCandidate | None:
        with self._lock:
            candidate = self._line_group_candidates.get(candidate_id)
            return candidate.model_copy(deep=True) if candidate else None
