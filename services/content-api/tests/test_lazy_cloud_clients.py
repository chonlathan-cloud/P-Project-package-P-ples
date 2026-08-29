from __future__ import annotations

from unittest.mock import patch

from ddbox_api.auth import TestTokenVerifier
from ddbox_api.config import Settings
from ddbox_api.main import create_app


def test_app_construction_does_not_discover_cloud_credentials() -> None:
    settings = Settings(
        environment="production",
        data_backend="firestore",
        media_backend="gcs",
        auth_mode="firebase",
        gcp_project_id="example-project",
        firestore_database="ddbox-test-db",
        storage_bucket="example-media",
        media_token_key="a" * 32,
        media_signing_service_account="api@example-project.iam.gserviceaccount.com",
    )

    with (
        patch(
            "ddbox_api.repositories.firestore.firestore.Client",
            side_effect=AssertionError("Firestore client initialized during startup"),
        ),
        patch(
            "ddbox_api.services.media.google.auth.default",
            side_effect=AssertionError("ADC discovered during startup"),
        ),
        patch(
            "ddbox_api.services.media.storage.Client",
            side_effect=AssertionError("Storage client initialized during startup"),
        ),
    ):
        app = create_app(settings=settings, token_verifier=TestTokenVerifier())

    assert app.title == "DD Box Content API"
