from __future__ import annotations

from io import BytesIO
from typing import Any

import pytest
from PIL import Image

from ddbox_api.domain.errors import NotFoundError
from ddbox_api.domain.models import UploadSessionCreate
from ddbox_api.services.media import CloudStorageMediaStore


class FakeCredentials:
    valid = True
    token = "-".join(("short", "lived", "test", "value"))

    def refresh(self, _request: object) -> None:
        self.valid = True


class FakeBlob:
    def __init__(self, name: str) -> None:
        self.name = name
        self.data: bytes | None = None
        self.content_type: str | None = None
        self.size: int | None = None
        self.deleted = False
        self.signed_url_kwargs: dict[str, Any] | None = None

    def generate_signed_url(self, **kwargs: Any) -> str:
        self.signed_url_kwargs = kwargs
        return f"https://storage.example/{self.name}?signed=true"

    def exists(self, client: object) -> bool:
        del client
        return self.data is not None and not self.deleted

    def reload(self, client: object) -> None:
        del client

    def download_as_bytes(self, **kwargs: Any) -> bytes:
        del kwargs
        if self.data is None or self.deleted:
            raise AssertionError("blob is unavailable")
        return self.data

    def upload_from_string(self, data: bytes | str, content_type: str) -> None:
        self.data = data.encode() if isinstance(data, str) else data
        self.content_type = content_type
        self.size = len(self.data)
        self.deleted = False

    def delete(self, client: object) -> None:
        del client
        self.deleted = True


class FakeBucket:
    def __init__(self) -> None:
        self.blobs: dict[str, FakeBlob] = {}

    def blob(self, name: str) -> FakeBlob:
        return self.blobs.setdefault(name, FakeBlob(name))


class FakeStorageClient:
    def __init__(self) -> None:
        self.active_bucket = FakeBucket()

    def bucket(self, _name: str) -> FakeBucket:
        return self.active_bucket


def _png() -> bytes:
    output = BytesIO()
    Image.new("RGB", (64, 48), color=(255, 204, 0)).save(output, "PNG")
    return output.getvalue()


def test_gcs_upload_session_is_stateless_and_finalization_is_idempotent() -> None:
    client = FakeStorageClient()
    credentials = FakeCredentials()
    store = CloudStorageMediaStore(
        project_id="example-project",
        bucket_name="example-media",
        public_api_url="https://api.example",
        max_upload_bytes=1_000_000,
        token_key="a" * 32,
        signing_service_account="api@example-project.iam.gserviceaccount.com",
        client=client,  # type: ignore[arg-type]
        credentials=credentials,  # type: ignore[arg-type]
    )
    raw = _png()
    request = UploadSessionCreate(
        filename="sample.png",
        content_type="image/png",
        size=len(raw),
        purpose="gallery",
        alt="ภาพตัวอย่างกล่องสีเหลือง",
    )

    session = store.create_session(request)
    staging = client.active_bucket.blob(f"staging/{session.id}/original")
    assert staging.signed_url_kwargs is not None
    assert staging.signed_url_kwargs["method"] == "PUT"
    assert staging.signed_url_kwargs["content_type"] == "image/png"
    staging.upload_from_string(raw, content_type="image/png")

    asset = store.finalize(session.id, session.finalize_token)
    assert asset.width == 64
    assert asset.height == 48
    assert staging.deleted
    webp, content_type = store.read_variant(asset.id, "image.webp")
    assert webp
    assert content_type == "image/webp"

    repeated = store.finalize(session.id, session.finalize_token)
    assert repeated == asset


def test_gcs_finalize_rejects_tampered_token() -> None:
    store = CloudStorageMediaStore(
        project_id="example-project",
        bucket_name="example-media",
        public_api_url="https://api.example",
        max_upload_bytes=1_000_000,
        token_key="b" * 32,
        signing_service_account="api@example-project.iam.gserviceaccount.com",
        client=FakeStorageClient(),  # type: ignore[arg-type]
        credentials=FakeCredentials(),  # type: ignore[arg-type]
    )
    raw = _png()
    session = store.create_session(
        UploadSessionCreate(
            filename="sample.png",
            content_type="image/png",
            size=len(raw),
            purpose="gallery",
            alt="ภาพตัวอย่างกล่องสีเหลือง",
        )
    )

    with pytest.raises(NotFoundError):
        store.finalize(session.id, f"{session.finalize_token}tampered")
