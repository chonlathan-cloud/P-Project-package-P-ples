from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from io import BytesIO
from pathlib import Path
from threading import RLock
from typing import Protocol, cast
from uuid import uuid4

import google.auth
import google.cloud.storage as storage
from google.auth.credentials import Credentials
from google.auth.transport.requests import Request
from google.cloud.exceptions import NotFound as GoogleNotFound
from PIL import Image, UnidentifiedImageError

from ddbox_api.domain.errors import NotFoundError, ValidationError
from ddbox_api.domain.models import MediaAsset, UploadSession, UploadSessionCreate, utc_now

Image.MAX_IMAGE_PIXELS = 40_000_000
_UPLOAD_TTL = timedelta(minutes=10)
_VARIANTS = {"image.webp": "image/webp", "image.jpg": "image/jpeg"}


class MediaStore(Protocol):
    def create_session(self, request: UploadSessionCreate) -> UploadSession: ...

    def put(self, session_id: str, token: str, body: bytes, content_type: str) -> None: ...

    def finalize(self, session_id: str, token: str) -> MediaAsset: ...

    def read_variant(self, asset_id: str, filename: str) -> tuple[bytes, str]: ...


@dataclass
class PendingUpload:
    request: UploadSessionCreate
    token: str
    expires_at: datetime
    raw: bytes | None = None


class LocalMediaStore:
    """Local/test adapter. It intentionally keeps pending sessions in one process."""

    def __init__(self, root: Path, public_api_url: str, max_upload_bytes: int) -> None:
        self._root = root.resolve()
        self._root.mkdir(parents=True, exist_ok=True)
        self._public_api_url = public_api_url.rstrip("/")
        self._max_upload_bytes = max_upload_bytes
        self._pending: dict[str, PendingUpload] = {}
        self._assets: dict[str, MediaAsset] = {}
        self._lock = RLock()

    def create_session(self, request: UploadSessionCreate) -> UploadSession:
        _validate_size(request, self._max_upload_bytes)
        session_id = uuid4().hex
        token = secrets.token_urlsafe(32)
        expires_at = utc_now() + _UPLOAD_TTL
        with self._lock:
            self._pending[session_id] = PendingUpload(request, token, expires_at)
        return UploadSession(
            id=session_id,
            upload_url=(
                f"{self._public_api_url}/v1/admin/media/uploads/{session_id}/content?token={token}"
            ),
            finalize_token=token,
            expires_at=expires_at,
        )

    def put(self, session_id: str, token: str, body: bytes, content_type: str) -> None:
        pending = self._get_pending(session_id, token)
        if utc_now() >= pending.expires_at:
            raise ValidationError("upload session expired")
        _validate_upload(body, content_type, pending.request, self._max_upload_bytes)
        pending.raw = body

    def finalize(self, session_id: str, token: str) -> MediaAsset:
        pending = self._get_pending(session_id, token)
        if pending.raw is None:
            raise ValidationError("upload content has not been received")
        image, actual_type = _decode_image(pending.raw, pending.request.content_type)
        asset_id = uuid4().hex
        asset_dir = self._root / asset_id
        asset_dir.mkdir(parents=True, exist_ok=False)
        webp, fallback = _render_variants(image)
        (asset_dir / "image.webp").write_bytes(webp)
        (asset_dir / "image.jpg").write_bytes(fallback)
        asset = _media_asset(
            asset_id=asset_id,
            request=pending.request,
            actual_type=actual_type,
            raw=pending.raw,
            width=image.width,
            height=image.height,
            public_api_url=self._public_api_url,
        )
        with self._lock:
            self._assets[asset_id] = asset
            self._pending.pop(session_id, None)
        return asset

    def read_variant(self, asset_id: str, filename: str) -> tuple[bytes, str]:
        content_type = _variant_content_type(filename)
        path = self._root / asset_id / filename
        if not path.is_file():
            raise NotFoundError("media asset not found")
        return path.read_bytes(), content_type

    def _get_pending(self, session_id: str, token: str) -> PendingUpload:
        with self._lock:
            pending = self._pending.get(session_id)
        if pending is None or not secrets.compare_digest(pending.token, token):
            raise NotFoundError("upload session not found")
        return pending


class CloudStorageMediaStore:
    """Private GCS media with stateless upload sessions and API-served public variants."""

    def __init__(
        self,
        project_id: str,
        bucket_name: str,
        public_api_url: str,
        max_upload_bytes: int,
        token_key: str,
        signing_service_account: str,
        *,
        client: storage.Client | None = None,
        credentials: Credentials | None = None,
    ) -> None:
        if len(token_key) < 32:
            raise ValueError("media token key must contain at least 32 characters")
        self._project_id = project_id
        self._bucket_name = bucket_name
        self._credentials = credentials
        self._client = client
        self._bucket: storage.Bucket | None = None
        self._public_api_url = public_api_url.rstrip("/")
        self._max_upload_bytes = max_upload_bytes
        self._token_key = token_key.encode()
        self._signing_service_account = signing_service_account

    def create_session(self, request: UploadSessionCreate) -> UploadSession:
        _validate_size(request, self._max_upload_bytes)
        session_id = uuid4().hex
        expires_at = utc_now() + _UPLOAD_TTL
        token = self._encode_token(session_id, request, expires_at)
        credentials = self._get_credentials()
        if not credentials.valid or not credentials.token:
            credentials.refresh(Request())  # type: ignore[no-untyped-call]
        upload_url = (
            self._get_bucket()
            .blob(f"staging/{session_id}/original")
            .generate_signed_url(
                expiration=expires_at,
                method="PUT",
                content_type=request.content_type,
                version="v4",
                credentials=credentials,
                service_account_email=self._signing_service_account,
                access_token=credentials.token,
            )
        )
        return UploadSession(
            id=session_id,
            upload_url=upload_url,
            finalize_token=token,
            expires_at=expires_at,
        )

    def put(self, session_id: str, token: str, body: bytes, content_type: str) -> None:
        del session_id, token, body, content_type
        raise NotFoundError("direct API upload is unavailable for this environment")

    def finalize(self, session_id: str, token: str) -> MediaAsset:
        request = self._decode_token(session_id, token)
        client = self._get_client()
        bucket = self._get_bucket()
        metadata_blob = bucket.blob(f"ready/{session_id}/metadata.json")
        if metadata_blob.exists(client=client):
            return MediaAsset.model_validate_json(metadata_blob.download_as_bytes())

        source = bucket.blob(f"staging/{session_id}/original")
        try:
            source.reload(client=client)
        except GoogleNotFound as error:
            raise NotFoundError("uploaded media was not found") from error
        if source.size != request.size or source.content_type != request.content_type:
            raise ValidationError("uploaded object metadata does not match the upload session")
        raw = source.download_as_bytes(start=0, end=self._max_upload_bytes)
        _validate_upload(raw, request.content_type, request, self._max_upload_bytes)
        image, actual_type = _decode_image(raw, request.content_type)
        webp, fallback = _render_variants(image)
        prefix = f"ready/{session_id}"
        bucket.blob(f"{prefix}/image.webp").upload_from_string(webp, content_type="image/webp")
        bucket.blob(f"{prefix}/image.jpg").upload_from_string(fallback, content_type="image/jpeg")
        asset = _media_asset(
            asset_id=session_id,
            request=request,
            actual_type=actual_type,
            raw=raw,
            width=image.width,
            height=image.height,
            public_api_url=self._public_api_url,
        )
        metadata_blob.upload_from_string(asset.model_dump_json(), content_type="application/json")
        source.delete(client=client)
        return asset

    def read_variant(self, asset_id: str, filename: str) -> tuple[bytes, str]:
        content_type = _variant_content_type(filename)
        blob = self._get_bucket().blob(f"ready/{asset_id}/{filename}")
        try:
            return blob.download_as_bytes(), content_type
        except GoogleNotFound as error:
            raise NotFoundError("media asset not found") from error

    def _get_credentials(self) -> Credentials:
        if self._credentials is None:
            credentials, _ = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            self._credentials = credentials
        return self._credentials

    def _get_client(self) -> storage.Client:
        if self._client is None:
            self._client = storage.Client(
                project=self._project_id,
                credentials=self._get_credentials(),
            )
        return self._client

    def _get_bucket(self) -> storage.Bucket:
        if self._bucket is None:
            self._bucket = self._get_client().bucket(self._bucket_name)
        return self._bucket

    def _encode_token(
        self, session_id: str, request: UploadSessionCreate, expires_at: datetime
    ) -> str:
        payload = {
            "sid": session_id,
            "exp": int(expires_at.timestamp()),
            "request": request.model_dump(mode="json"),
        }
        body = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
        signature = _b64encode(hmac.digest(self._token_key, body.encode(), "sha256"))
        return f"{body}.{signature}"

    def _decode_token(self, session_id: str, token: str) -> UploadSessionCreate:
        try:
            body, supplied_signature = token.split(".", maxsplit=1)
            expected_signature = _b64encode(hmac.digest(self._token_key, body.encode(), "sha256"))
            if not hmac.compare_digest(supplied_signature, expected_signature):
                raise ValueError
            payload = cast(dict[str, object], json.loads(_b64decode(body)))
            if payload.get("sid") != session_id:
                raise ValueError
            expires_at = datetime.fromtimestamp(int(cast(int, payload["exp"])), UTC)
            if utc_now() >= expires_at:
                raise ValidationError("upload session expired")
            return UploadSessionCreate.model_validate(payload["request"])
        except ValidationError:
            raise
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise NotFoundError("upload session not found") from error


def _validate_size(request: UploadSessionCreate, max_upload_bytes: int) -> None:
    if request.size > max_upload_bytes:
        raise ValidationError("upload exceeds the configured size limit")


def _validate_upload(
    body: bytes,
    content_type: str,
    request: UploadSessionCreate,
    max_upload_bytes: int,
) -> None:
    if content_type != request.content_type:
        raise ValidationError("upload content type does not match the declared type")
    if len(body) != request.size:
        raise ValidationError("upload size does not match the declared size")
    if len(body) > max_upload_bytes:
        raise ValidationError("upload exceeds the configured size limit")


def _decode_image(raw: bytes, expected_type: str) -> tuple[Image.Image, str]:
    try:
        image = Image.open(BytesIO(raw))
        image.verify()
        image = Image.open(BytesIO(raw))
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValidationError("uploaded file is not a safe decodable image") from error
    actual_types = {
        "JPEG": "image/jpeg",
        "PNG": "image/png",
        "WEBP": "image/webp",
        "AVIF": "image/avif",
    }
    actual_type = actual_types.get(image.format or "")
    if actual_type != expected_type:
        raise ValidationError("image bytes do not match the declared content type")
    return image, actual_type


def _render_variants(image: Image.Image) -> tuple[bytes, bytes]:
    normalized = image.convert("RGB")
    webp = BytesIO()
    fallback = BytesIO()
    normalized.save(webp, "WEBP", quality=82, method=6)
    normalized.save(fallback, "JPEG", quality=85, optimize=True)
    return webp.getvalue(), fallback.getvalue()


def _media_asset(
    *,
    asset_id: str,
    request: UploadSessionCreate,
    actual_type: str,
    raw: bytes,
    width: int,
    height: int,
    public_api_url: str,
) -> MediaAsset:
    base_url = f"{public_api_url}/media/{asset_id}"
    return MediaAsset(
        id=asset_id,
        original_filename=request.filename,
        content_type=actual_type,
        width=width,
        height=height,
        checksum_sha256=hashlib.sha256(raw).hexdigest(),
        url=f"{base_url}/image.webp",
        fallback_url=f"{base_url}/image.jpg",
        alt=request.alt,
        created_at=utc_now(),
    )


def _variant_content_type(filename: str) -> str:
    content_type = _VARIANTS.get(filename)
    if content_type is None:
        raise NotFoundError("media asset not found")
    return content_type


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
