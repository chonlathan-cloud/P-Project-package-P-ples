from __future__ import annotations

import re
from typing import Any

from google.api_core.exceptions import AlreadyExists
from google.cloud import tasks_v2

LEAD_ID_PATTERN = re.compile(r"^[0-9a-f]{32}$")


class CloudTasksNotificationPublisher:
    """Publish PII-free lead notification tasks with deterministic task names."""

    def __init__(
        self,
        project_id: str,
        location: str,
        queue_id: str,
        target_url: str,
        service_account_email: str,
        audience: str,
        client: Any | None = None,
    ) -> None:
        self._project_id = project_id
        self._location = location
        self._queue_id = queue_id
        self._target_url = target_url.rstrip("/")
        self._service_account_email = service_account_email
        self._audience = audience
        self._client_instance = client

    @property
    def _client(self) -> Any:
        if self._client_instance is None:
            self._client_instance = tasks_v2.CloudTasksClient()
        return self._client_instance

    def enqueue(self, lead_id: str) -> str:
        if not LEAD_ID_PATTERN.fullmatch(lead_id):
            raise ValueError("lead ID must be a 32-character lowercase hexadecimal value")
        parent = self._client.queue_path(self._project_id, self._location, self._queue_id)
        task_name = str(
            self._client.task_path(
                self._project_id,
                self._location,
                self._queue_id,
                f"lead-{lead_id}",
            )
        )
        task = tasks_v2.Task(
            name=task_name,
            http_request=tasks_v2.HttpRequest(
                http_method=tasks_v2.HttpMethod.POST,
                url=f"{self._target_url}/v1/internal/lead-notifications/{lead_id}",
                headers={"Content-Type": "application/json"},
                body=b"{}",
                oidc_token=tasks_v2.OidcToken(
                    service_account_email=self._service_account_email,
                    audience=self._audience,
                ),
            ),
        )
        try:
            created = self._client.create_task(parent=parent, task=task)
            return str(created.name)
        except AlreadyExists:
            return task_name
