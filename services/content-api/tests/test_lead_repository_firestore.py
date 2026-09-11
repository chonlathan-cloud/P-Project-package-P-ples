from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, cast

from google.cloud import firestore

from ddbox_api.repositories.firestore import FirestoreContentRepository


class FakeSnapshot:
    exists = True


class FakeDocument:
    def __init__(self, snapshot: FakeSnapshot) -> None:
        self._snapshot = snapshot

    def get(self) -> FakeSnapshot:
        return self._snapshot


class FakeLeadQuery:
    def __init__(self) -> None:
        self.filters: list[firestore.FieldFilter] = []
        self.ordering: list[tuple[str, str]] = []
        self.page_limit: int | None = None
        self.cursor: FakeSnapshot | None = None
        self.snapshot = FakeSnapshot()

    def where(self, *, filter: firestore.FieldFilter) -> FakeLeadQuery:
        self.filters.append(filter)
        return self

    def order_by(self, field: str, *, direction: str) -> FakeLeadQuery:
        self.ordering.append((field, direction))
        return self

    def limit(self, value: int) -> FakeLeadQuery:
        self.page_limit = value
        return self

    def start_after(self, snapshot: FakeSnapshot) -> FakeLeadQuery:
        self.cursor = snapshot
        return self

    def document(self, _document_id: str) -> FakeDocument:
        return FakeDocument(self.snapshot)

    def stream(self) -> list[Any]:
        return []


class FakeFirestoreClient:
    def __init__(self, query: FakeLeadQuery) -> None:
        self.query = query

    def collection(self, name: str) -> FakeLeadQuery:
        assert name == "leads"
        return self.query


def test_firestore_lead_query_matches_json_timestamp_storage_and_cursor() -> None:
    query = FakeLeadQuery()
    repository = FirestoreContentRepository("test-project", "test-database")
    repository._client_instance = cast(Any, FakeFirestoreClient(query))
    range_start = datetime(2026, 9, 10, 7, 0, tzinfo=timezone(timedelta(hours=7)))
    range_end = range_start + timedelta(days=1)

    assert repository.list_leads(range_start, range_end, after_id="lead-1", limit=25) == []

    assert [(item.field_path, item.op_string, item.value) for item in query.filters] == [
        ("created_at", ">=", "2026-09-10T00:00:00.000000Z"),
        ("created_at", "<", "2026-09-11T00:00:00.000000Z"),
    ]
    assert query.ordering == [
        ("created_at", firestore.Query.ASCENDING),
        ("__name__", firestore.Query.ASCENDING),
    ]
    assert query.page_limit == 25
    assert query.cursor is query.snapshot
