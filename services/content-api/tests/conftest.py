from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ddbox_api.config import Settings
from ddbox_api.main import create_app
from ddbox_api.repositories.memory import InMemoryContentRepository


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    settings = Settings(
        environment="test",
        auth_mode="test",
        data_backend="memory",
        public_api_url="http://testserver",
        media_root=tmp_path / "media",
    )
    app = create_app(
        settings=settings,
        repository=InMemoryContentRepository(),
        media_root=tmp_path / "media",
    )
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-admin-token"}
