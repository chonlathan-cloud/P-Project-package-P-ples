from __future__ import annotations

import base64
import hashlib
import hmac
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ddbox_api.config import Settings
from ddbox_api.main import create_app
from ddbox_api.repositories.memory import InMemoryContentRepository
from ddbox_api.services import line_webhook as line_webhook_module

CHANNEL_SECRET = "test-line-channel-secret"  # noqa: S105 - isolated test fixture
GROUP_ID = "C0123456789abcdef0123456789abcdef"
BOT_ID = "U0123456789abcdef0123456789abcdef"


def _client(tmp_path: Path) -> tuple[TestClient, InMemoryContentRepository]:
    repository = InMemoryContentRepository()
    settings = Settings(
        environment="test",
        auth_mode="test",
        data_backend="memory",
        public_api_url="http://testserver",
        media_root=tmp_path / "media",
        line_channel_secret=CHANNEL_SECRET,
    )
    return (
        TestClient(
            create_app(settings=settings, repository=repository, media_root=tmp_path / "media")
        ),
        repository,
    )


def _signed(payload: dict[str, object]) -> tuple[bytes, str]:
    body = json.dumps(payload, separators=(",", ":")).encode()
    signature = base64.b64encode(
        hmac.new(CHANNEL_SECRET.encode(), body, hashlib.sha256).digest()
    ).decode()
    return body, signature


def test_join_event_records_group_candidate_without_returning_group_id(tmp_path: Path) -> None:
    client, repository = _client(tmp_path)
    body, signature = _signed(
        {
            "destination": BOT_ID,
            "events": [{"type": "join", "source": {"type": "group", "groupId": GROUP_ID}}],
        }
    )

    response = client.post(
        "/v1/integrations/line/webhook",
        content=body,
        headers={"content-type": "application/json", "x-line-signature": signature},
    )

    assert response.status_code == 200
    assert response.json() == {"accepted": True, "group_candidates_recorded": 1}
    assert GROUP_ID not in response.text
    candidate_id = hashlib.sha256(GROUP_ID.encode()).hexdigest()
    candidate = repository.get_line_group_candidate(candidate_id)
    assert candidate is not None
    assert candidate.group_id == GROUP_ID
    assert candidate.status == "candidate"


def test_registration_command_can_capture_an_existing_group(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client, repository = _client(tmp_path)
    log_record: dict[str, object] = {}

    def capture_log(message: str, *, extra: dict[str, object]) -> None:
        log_record["message"] = message
        log_record.update(extra)

    monkeypatch.setattr(line_webhook_module.logger, "info", capture_log)
    body, signature = _signed(
        {
            "destination": BOT_ID,
            "events": [
                {
                    "type": "message",
                    "source": {"type": "group", "groupId": GROUP_ID},
                    "message": {"type": "text", "text": "  #DDBOX-REGISTER  "},
                }
            ],
        }
    )

    response = client.post(
        "/v1/integrations/line/webhook",
        content=body,
        headers={"x-line-signature": signature},
    )

    assert response.status_code == 200
    candidate_id = hashlib.sha256(GROUP_ID.encode()).hexdigest()
    assert repository.get_line_group_candidate(candidate_id) is not None
    assert log_record == {
        "message": "line_webhook_event_summary",
        "event_count": 1,
        "event_types": ["message"],
        "source_types": ["group"],
        "registration_message_events": 1,
        "group_candidates_recorded": 1,
    }
    assert GROUP_ID not in str(log_record)
    assert BOT_ID not in str(log_record)


def test_invalid_signature_is_rejected_without_writing(tmp_path: Path) -> None:
    client, repository = _client(tmp_path)
    body, _ = _signed(
        {
            "destination": BOT_ID,
            "events": [{"type": "join", "source": {"type": "group", "groupId": GROUP_ID}}],
        }
    )

    response = client.post(
        "/v1/integrations/line/webhook",
        content=body,
        headers={"x-line-signature": "invalid"},
    )

    assert response.status_code == 403
    candidate_id = hashlib.sha256(GROUP_ID.encode()).hexdigest()
    assert repository.get_line_group_candidate(candidate_id) is None
