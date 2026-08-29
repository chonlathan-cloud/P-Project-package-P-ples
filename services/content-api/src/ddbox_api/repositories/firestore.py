from __future__ import annotations

from typing import cast

from google.api_core.exceptions import AlreadyExists
from google.cloud import firestore

from ddbox_api.domain.errors import ConflictError, NotFoundError
from ddbox_api.domain.models import (
    ContentStatus,
    GalleryItem,
    LineGroupCandidate,
    PricingBenchmark,
    StoredLead,
    utc_now,
)


class FirestoreContentRepository:
    """Firestore adapter. Collection names are stable; the database is environment-configured."""

    def __init__(self, project_id: str, database: str) -> None:
        self._project_id = project_id
        self._database = database
        self._client_instance: firestore.Client | None = None

    @property
    def _client(self) -> firestore.Client:
        """Create the network-aware client on first repository use, not at process import."""
        if self._client_instance is None:
            self._client_instance = firestore.Client(
                project=self._project_id,
                database=self._database,
            )
        return self._client_instance

    def create_gallery_item(self, item: GalleryItem) -> GalleryItem:
        slug_ref = self._client.collection("gallery_slugs").document(item.slug)
        item_ref = self._client.collection("gallery_items").document(item.id)
        transaction = self._client.transaction()

        @firestore.transactional
        def create(transaction: firestore.Transaction) -> None:
            if slug_ref.get(transaction=transaction).exists:
                raise ConflictError("gallery slug already exists")
            transaction.create(slug_ref, {"item_id": item.id})
            transaction.create(item_ref, item.model_dump(mode="json"))
            self._append_audit(transaction, item.created_by, "create", "gallery_item", item.id)

        try:
            create(transaction)
        except AlreadyExists as error:
            raise ConflictError("gallery item already exists") from error
        return item

    def get_gallery_item(self, item_id: str) -> GalleryItem | None:
        snapshot = self._client.collection("gallery_items").document(item_id).get()
        return GalleryItem.model_validate(snapshot.to_dict()) if snapshot.exists else None

    def get_gallery_item_by_slug(self, slug: str) -> GalleryItem | None:
        slug_snapshot = self._client.collection("gallery_slugs").document(slug).get()
        if not slug_snapshot.exists:
            return None
        item_id = str(slug_snapshot.get("item_id"))
        return self.get_gallery_item(item_id)

    def publish_gallery_item(
        self, item_id: str, expected_version: int, actor_uid: str
    ) -> GalleryItem:
        item_ref = self._client.collection("gallery_items").document(item_id)
        transaction = self._client.transaction()

        @firestore.transactional
        def publish(transaction: firestore.Transaction) -> GalleryItem:
            snapshot = item_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise NotFoundError("gallery item not found")
            item = GalleryItem.model_validate(snapshot.to_dict())
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
            transaction.set(item_ref, published.model_dump(mode="json"))
            self._append_audit(transaction, actor_uid, "publish", "gallery_item", item_id)
            return published

        return cast(GalleryItem, publish(transaction))

    def list_published_gallery_items(self) -> list[GalleryItem]:
        query = (
            self._client.collection("gallery_items")
            .where(filter=firestore.FieldFilter("status", "==", ContentStatus.PUBLISHED.value))
            .order_by("published_at", direction=firestore.Query.DESCENDING)
            .limit(100)
        )
        return [GalleryItem.model_validate(snapshot.to_dict()) for snapshot in query.stream()]

    def list_published_pricing_benchmarks(self) -> list[PricingBenchmark]:
        query = (
            self._client.collection("pricing_benchmarks")
            .where(filter=firestore.FieldFilter("status", "==", ContentStatus.PUBLISHED.value))
            .limit(100)
        )
        items = [PricingBenchmark.model_validate(snapshot.to_dict()) for snapshot in query.stream()]
        return sorted(items, key=lambda item: item.label)

    def create_lead_once(
        self,
        lead: StoredLead,
        idempotency_hash: str,
        payload_fingerprint: str,
    ) -> tuple[StoredLead, bool]:
        key_ref = self._client.collection("lead_idempotency").document(idempotency_hash)
        lead_ref = self._client.collection("leads").document(lead.id)
        transaction = self._client.transaction()

        @firestore.transactional
        def create(transaction: firestore.Transaction) -> tuple[StoredLead, bool]:
            existing_key = key_ref.get(transaction=transaction)
            if existing_key.exists:
                if existing_key.get("payload_fingerprint") != payload_fingerprint:
                    raise ConflictError("idempotency key was already used for another payload")
                existing_lead = (
                    self._client.collection("leads")
                    .document(str(existing_key.get("lead_id")))
                    .get(transaction=transaction)
                )
                return StoredLead.model_validate(existing_lead.to_dict()), True
            transaction.create(lead_ref, lead.model_dump(mode="json"))
            transaction.create(
                key_ref,
                {
                    "lead_id": lead.id,
                    "payload_fingerprint": payload_fingerprint,
                    "created_at": lead.created_at,
                },
            )
            return lead, False

        return cast(tuple[StoredLead, bool], create(transaction))

    def get_lead(self, lead_id: str) -> StoredLead | None:
        snapshot = self._client.collection("leads").document(lead_id).get()
        return StoredLead.model_validate(snapshot.to_dict()) if snapshot.exists else None

    def mark_notification(self, lead_id: str, status: str) -> None:
        self._client.collection("leads").document(lead_id).update({"notification_status": status})

    def upsert_line_group_candidate(self, candidate: LineGroupCandidate) -> None:
        candidate_ref = self._client.collection("line_notification_targets").document(candidate.id)
        transaction = self._client.transaction()

        @firestore.transactional
        def upsert(transaction: firestore.Transaction) -> None:
            existing = candidate_ref.get(transaction=transaction)
            payload = candidate.model_dump(mode="json")
            if existing.exists:
                payload["first_seen_at"] = existing.get("first_seen_at")
                payload["status"] = existing.get("status") or "candidate"
                transaction.set(candidate_ref, payload)
                return
            transaction.create(candidate_ref, payload)

        upsert(transaction)

    def get_line_group_candidate(self, candidate_id: str) -> LineGroupCandidate | None:
        snapshot = self._client.collection("line_notification_targets").document(candidate_id).get()
        return LineGroupCandidate.model_validate(snapshot.to_dict()) if snapshot.exists else None

    def _append_audit(
        self,
        transaction: firestore.Transaction,
        actor_uid: str,
        action: str,
        entity_type: str,
        entity_id: str,
    ) -> None:
        audit_ref = self._client.collection("audit_logs").document()
        transaction.create(
            audit_ref,
            {
                "actor_uid": actor_uid,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "created_at": utc_now(),
            },
        )
