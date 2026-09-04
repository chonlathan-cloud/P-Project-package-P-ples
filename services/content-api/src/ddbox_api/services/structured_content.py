from __future__ import annotations

from uuid import uuid4

from ddbox_api.domain.errors import NotFoundError, ValidationError
from ddbox_api.domain.models import (
    ContentDocument,
    ContentKind,
    ContentStatus,
    PublishedContentDocument,
    StructuredContent,
    utc_now,
)
from ddbox_api.repositories.base import ContentRepository


class StructuredContentService:
    def __init__(self, repository: ContentRepository) -> None:
        self._repository = repository

    def create(
        self, kind: ContentKind, content: StructuredContent, actor_uid: str
    ) -> ContentDocument:
        self._validate_kind(kind, content)
        now = utc_now()
        document = ContentDocument(
            id=uuid4().hex,
            kind=kind,
            content=content,
            created_at=now,
            updated_at=now,
            created_by=actor_uid,
            updated_by=actor_uid,
        )
        return self._repository.create_content(document)

    def list_all(self, kind: ContentKind) -> list[ContentDocument]:
        return self._repository.list_content(kind)

    def get(self, kind: ContentKind, document_id: str) -> ContentDocument:
        document = self._repository.get_content(kind, document_id)
        if document is None:
            raise NotFoundError(f"{kind.value} not found")
        return document

    def update(
        self,
        kind: ContentKind,
        document_id: str,
        expected_version: int,
        content: StructuredContent,
        actor_uid: str,
    ) -> ContentDocument:
        self._validate_kind(kind, content)
        return self._repository.update_content(
            kind, document_id, expected_version, content, actor_uid
        )

    def publish(
        self, kind: ContentKind, document_id: str, expected_version: int, actor_uid: str
    ) -> ContentDocument:
        return self._repository.transition_content(
            kind,
            document_id,
            expected_version,
            ContentStatus.PUBLISHED,
            actor_uid,
        )

    def archive(
        self, kind: ContentKind, document_id: str, expected_version: int, actor_uid: str
    ) -> ContentDocument:
        return self._repository.transition_content(
            kind,
            document_id,
            expected_version,
            ContentStatus.ARCHIVED,
            actor_uid,
        )

    def list_published(self, kind: ContentKind) -> list[PublishedContentDocument]:
        return [
            self._public_document(document)
            for document in self._repository.list_published_content(kind)
        ]

    def get_published_by_slug(self, kind: ContentKind, slug: str) -> PublishedContentDocument:
        document = self._repository.get_published_content_by_slug(kind, slug)
        if document is None:
            raise NotFoundError(f"published {kind.value} not found")
        return self._public_document(document)

    @staticmethod
    def _validate_kind(kind: ContentKind, content: StructuredContent) -> None:
        if content.kind != kind:
            raise ValidationError("content kind does not match the requested resource")

    @staticmethod
    def _public_document(document: ContentDocument) -> PublishedContentDocument:
        if document.published_at is None:
            raise RuntimeError("published content is missing its publication timestamp")
        return PublishedContentDocument(
            id=document.id,
            kind=document.kind,
            content=document.content,
            version=document.version,
            published_at=document.published_at,
        )
