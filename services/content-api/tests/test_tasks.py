from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from google.api_core.exceptions import AlreadyExists
from pydantic import ValidationError as PydanticValidationError

from ddbox_api.config import Settings
from ddbox_api.domain.errors import ForbiddenError
from ddbox_api.main import create_app
from ddbox_api.repositories.memory import InMemoryContentRepository
from ddbox_api.services.leads import LeadService
from ddbox_api.services.tasks import CloudTasksNotificationPublisher
from ddbox_api.task_auth import GoogleOidcTaskTokenVerifier


def _lead_payload() -> dict[str, object]:
    return {
        "customer_path": "needs_guidance",
        "product_type": "กล่องสำหรับสินค้าทดสอบ",
        "project_details": "ต้องการคำแนะนำรูปแบบกล่องสำหรับสินค้าทดสอบ",
        "contact_name": "ผู้ติดต่อทดสอบ",
        "phone": "0812345678",
        "preferred_contact": "phone",
        "consent": True,
    }


class _Publisher:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.lead_ids: list[str] = []

    def enqueue(self, lead_id: str) -> str:
        self.lead_ids.append(lead_id)
        if self.error:
            raise self.error
        return f"queues/test/tasks/lead-{lead_id}"


class _Gateway:
    def __init__(self, failures: int = 0) -> None:
        self.failures = failures
        self.calls = 0

    def notify_lead(self, lead: Any) -> str:
        self.calls += 1
        if self.calls <= self.failures:
            raise httpx.HTTPError("notification unavailable")
        return "line"


def _durable_client(
    tmp_path: Path, gateway: _Gateway, publisher: _Publisher
) -> tuple[TestClient, InMemoryContentRepository]:
    repository = InMemoryContentRepository()
    settings = Settings(
        environment="test",
        auth_mode="test",
        data_backend="memory",
        public_api_url="http://testserver",
        media_root=tmp_path / "media",
    )
    app = create_app(settings=settings, repository=repository, media_root=tmp_path / "media")
    app.state.lead_service = LeadService(repository, gateway, publisher)
    return TestClient(app, raise_server_exceptions=False), repository


def test_durable_task_delivery_is_authenticated_and_idempotent(tmp_path: Path) -> None:
    publisher = _Publisher()
    gateway = _Gateway()
    client, repository = _durable_client(tmp_path, gateway, publisher)

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "durable-task-test-1234"},
        json=_lead_payload(),
    )

    assert response.status_code == 201
    assert len(publisher.lead_ids) == 1
    lead_id = publisher.lead_ids[0]
    assert client.post(f"/v1/internal/lead-notifications/{lead_id}").status_code == 403
    delivered = client.post(
        f"/v1/internal/lead-notifications/{lead_id}",
        headers={"Authorization": "Bearer test-task-token"},
    )
    assert delivered.status_code == 204
    assert repository.get_lead(lead_id).notification_status == "sent"  # type: ignore[union-attr]

    repeated = client.post(
        f"/v1/internal/lead-notifications/{lead_id}",
        headers={"Authorization": "Bearer test-task-token"},
    )
    assert repeated.status_code == 204
    assert gateway.calls == 1


def test_failed_delivery_returns_retryable_status_and_can_recover(tmp_path: Path) -> None:
    publisher = _Publisher()
    gateway = _Gateway(failures=1)
    client, repository = _durable_client(tmp_path, gateway, publisher)
    assert (
        client.post(
            "/v1/leads",
            headers={"Idempotency-Key": "durable-task-retry-1234"},
            json=_lead_payload(),
        ).status_code
        == 201
    )
    lead_id = publisher.lead_ids[0]
    headers = {"Authorization": "Bearer test-task-token"}

    first = client.post(f"/v1/internal/lead-notifications/{lead_id}", headers=headers)
    assert first.status_code == 503
    failed = repository.get_lead(lead_id)
    assert failed is not None
    assert failed.notification_status == "failed"
    assert failed.notification_attempts == 1

    second = client.post(f"/v1/internal/lead-notifications/{lead_id}", headers=headers)
    assert second.status_code == 204
    recovered = repository.get_lead(lead_id)
    assert recovered is not None
    assert recovered.notification_status == "sent"
    assert recovered.notification_attempts == 2


def test_enqueue_failure_preserves_lead_for_same_key_retry(tmp_path: Path) -> None:
    publisher = _Publisher(error=RuntimeError("queue unavailable"))
    client, repository = _durable_client(tmp_path, _Gateway(), publisher)
    headers = {"Idempotency-Key": "durable-enqueue-retry-1234"}

    first = client.post("/v1/leads", headers=headers, json=_lead_payload())
    second = client.post("/v1/leads", headers=headers, json=_lead_payload())

    assert first.status_code == 503
    assert second.status_code == 503
    assert len(publisher.lead_ids) == 2
    assert publisher.lead_ids[0] == publisher.lead_ids[1]
    lead = repository.get_lead(publisher.lead_ids[0])
    assert lead is not None
    assert lead.notification_status == "pending"


class _CloudTasksClient:
    def __init__(self, already_exists: bool = False) -> None:
        self.already_exists = already_exists
        self.parent: str | None = None
        self.task: Any | None = None

    def queue_path(self, project: str, location: str, queue: str) -> str:
        return f"projects/{project}/locations/{location}/queues/{queue}"

    def task_path(self, project: str, location: str, queue: str, task: str) -> str:
        return f"{self.queue_path(project, location, queue)}/tasks/{task}"

    def create_task(self, *, parent: str, task: Any) -> Any:
        self.parent = parent
        self.task = task
        if self.already_exists:
            raise AlreadyExists("task exists")
        return type("CreatedTask", (), {"name": task.name})()


@pytest.mark.parametrize("already_exists", [False, True])
def test_cloud_tasks_publisher_uses_deterministic_pii_free_oidc_task(
    already_exists: bool,
) -> None:
    client = _CloudTasksClient(already_exists=already_exists)
    publisher = CloudTasksNotificationPublisher(
        project_id="project-id",
        location="asia-southeast1",
        queue_id="lead-notifications",
        target_url="https://api.example.test/",
        service_account_email="tasks@example.iam.gserviceaccount.com",
        audience="https://api.example.test",
        client=client,
    )
    lead_id = "a" * 32

    task_name = publisher.enqueue(lead_id)

    assert task_name.endswith(f"/tasks/lead-{lead_id}")
    assert client.task.http_request.body == b"{}"
    assert client.task.http_request.url.endswith(f"/lead-notifications/{lead_id}")
    assert client.task.http_request.oidc_token.service_account_email == (
        "tasks@example.iam.gserviceaccount.com"
    )
    assert "ผู้ติดต่อ" not in str(client.task)


def test_cloud_tasks_settings_require_complete_delivery_identity() -> None:
    with pytest.raises(PydanticValidationError, match="missing Cloud Tasks configuration"):
        Settings(notification_delivery="cloud_tasks")


def test_google_oidc_verifier_requires_exact_verified_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    verifier = GoogleOidcTaskTokenVerifier(
        audience="https://api.example.test",
        expected_email="tasks@example.iam.gserviceaccount.com",
    )
    monkeypatch.setattr(
        "ddbox_api.task_auth.id_token.verify_oauth2_token",
        lambda *_args, **_kwargs: {
            "email": "tasks@example.iam.gserviceaccount.com",
            "email_verified": True,
        },
    )

    principal = verifier.verify("signed-token")

    assert principal.email == "tasks@example.iam.gserviceaccount.com"

    monkeypatch.setattr(
        "ddbox_api.task_auth.id_token.verify_oauth2_token",
        lambda *_args, **_kwargs: {
            "email": "other@example.iam.gserviceaccount.com",
            "email_verified": True,
        },
    )
    with pytest.raises(ForbiddenError, match="task identity is not authorized"):
        verifier.verify("wrong-identity-token")
