from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

from ddbox_api.domain.models import ContentKind, ContentStatus, StructuredContent
from ddbox_api.services.structured_content import StructuredContentService

MigrationAction = Literal["create_publish", "update_publish", "publish", "unchanged"]


@dataclass(frozen=True)
class MigrationItemResult:
    kind: ContentKind
    slug: str
    action: MigrationAction


class StructuredContentMigration:
    """Idempotently reconciles a reviewed manifest through normal CMS semantics."""

    def __init__(self, service: StructuredContentService) -> None:
        self._service = service

    def plan(self, contents: Iterable[StructuredContent]) -> list[MigrationItemResult]:
        return self._reconcile(contents, actor_uid="dry-run", apply=False)

    def apply(
        self, contents: Iterable[StructuredContent], actor_uid: str
    ) -> list[MigrationItemResult]:
        return self._reconcile(contents, actor_uid=actor_uid, apply=True)

    def _reconcile(
        self,
        contents: Iterable[StructuredContent],
        actor_uid: str,
        *,
        apply: bool,
    ) -> list[MigrationItemResult]:
        grouped: dict[ContentKind, list[StructuredContent]] = {kind: [] for kind in ContentKind}
        seen: set[tuple[ContentKind, str]] = set()
        for content in contents:
            key = (content.kind, content.slug)
            if key in seen:
                entry = f"{content.kind.value}/{content.slug}"
                raise ValueError(f"duplicate structured-content manifest entry: {entry}")
            seen.add(key)
            grouped[content.kind].append(content)

        results: list[MigrationItemResult] = []
        for kind, desired_items in grouped.items():
            existing = {
                document.content.slug: document for document in self._service.list_all(kind)
            }
            for desired in desired_items:
                current = existing.get(desired.slug)
                if current is None:
                    action: MigrationAction = "create_publish"
                    if apply:
                        created = self._service.create(kind, desired, actor_uid)
                        self._service.publish(kind, created.id, created.version, actor_uid)
                elif current.content != desired:
                    action = "update_publish"
                    if apply:
                        updated = self._service.update(
                            kind,
                            current.id,
                            current.version,
                            desired,
                            actor_uid,
                        )
                        self._service.publish(kind, updated.id, updated.version, actor_uid)
                elif current.status != ContentStatus.PUBLISHED or current.has_unpublished_changes:
                    action = "publish"
                    if apply:
                        self._service.publish(
                            kind,
                            current.id,
                            current.version,
                            actor_uid,
                        )
                else:
                    action = "unchanged"
                results.append(MigrationItemResult(kind=kind, slug=desired.slug, action=action))
        return results
