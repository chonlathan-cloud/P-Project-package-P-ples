from __future__ import annotations

import logging
import time
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ddbox_api.api import admin, integrations, internal, media, public, system
from ddbox_api.auth import (
    FirebaseTokenVerifier,
    TestTokenVerifier,
    TokenVerifier,
    UnconfiguredTokenVerifier,
    get_token_verifier,
)
from ddbox_api.config import Settings, get_settings
from ddbox_api.dependencies import get_verifier
from ddbox_api.domain.errors import DomainError
from ddbox_api.logging import configure_logging
from ddbox_api.repositories.base import ContentRepository
from ddbox_api.repositories.firestore import FirestoreContentRepository
from ddbox_api.repositories.memory import InMemoryContentRepository
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.lead_exports import LeadExportService
from ddbox_api.services.leads import (
    GmailFallbackNotificationGateway,
    LeadService,
    LinePushNotificationGateway,
    LoggingNotificationGateway,
    PrimaryWithFallbackNotificationGateway,
)
from ddbox_api.services.line_webhook import LineWebhookService
from ddbox_api.services.media import CloudStorageMediaStore, LocalMediaStore, MediaStore
from ddbox_api.services.pricing import PricingService
from ddbox_api.services.rate_limit import InMemoryRateLimiter
from ddbox_api.services.revalidation import RevalidationGateway
from ddbox_api.services.structured_content import StructuredContentService
from ddbox_api.services.tasks import CloudTasksNotificationPublisher
from ddbox_api.task_auth import (
    GoogleOidcTaskTokenVerifier,
    TaskTokenVerifier,
    TestTaskTokenVerifier,
    UnconfiguredTaskTokenVerifier,
)

logger = logging.getLogger(__name__)


def _repository(settings: Settings) -> ContentRepository:
    if settings.data_backend == "firestore":
        if not settings.gcp_project_id or not settings.firestore_database:
            raise ValueError("Firestore backend requires project ID and named database")
        return FirestoreContentRepository(settings.gcp_project_id, settings.firestore_database)
    return InMemoryContentRepository()


def _verifier(settings: Settings) -> TokenVerifier:
    if settings.auth_mode == "test":
        return TestTokenVerifier()
    if settings.gcp_project_id:
        return FirebaseTokenVerifier(settings)
    return UnconfiguredTokenVerifier()


def _media_store(settings: Settings, media_root: Path | None) -> MediaStore:
    if settings.media_backend == "gcs":
        required = {
            "project_id": settings.gcp_project_id,
            "bucket_name": settings.storage_bucket,
            "token_key": settings.media_token_key,
            "signing_service_account": settings.media_signing_service_account,
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise ValueError(f"GCS media backend requires: {', '.join(missing)}")
        return CloudStorageMediaStore(
            project_id=str(required["project_id"]),
            bucket_name=str(required["bucket_name"]),
            public_api_url=settings.public_api_url,
            max_upload_bytes=settings.max_upload_bytes,
            token_key=str(required["token_key"]),
            signing_service_account=str(required["signing_service_account"]),
        )
    return LocalMediaStore(
        media_root or settings.media_root,
        settings.public_api_url,
        settings.max_upload_bytes,
    )


def _notification_gateway(
    settings: Settings,
) -> (
    LoggingNotificationGateway
    | LinePushNotificationGateway
    | PrimaryWithFallbackNotificationGateway
):
    if settings.notification_backend in {"line", "line_gmail"}:
        line_gateway = LinePushNotificationGateway(
            settings.line_channel_access_token,
            settings.line_notification_target_id,
            environment=settings.environment,
            lead_detail_base_url=settings.lead_detail_base_url,
        )
        if settings.notification_backend == "line_gmail":
            return PrimaryWithFallbackNotificationGateway(
                line_gateway,
                GmailFallbackNotificationGateway(
                    settings.notification_email,
                    settings.gmail_app_password,
                ),
            )
        return line_gateway
    return LoggingNotificationGateway()


def _task_publisher(settings: Settings) -> CloudTasksNotificationPublisher | None:
    if settings.notification_delivery != "cloud_tasks":
        return None
    return CloudTasksNotificationPublisher(
        project_id=str(settings.gcp_project_id),
        location=settings.cloud_tasks_location,
        queue_id=settings.cloud_tasks_queue,
        target_url=settings.notification_task_target_url,
        service_account_email=settings.notification_task_service_account,
        audience=settings.notification_task_audience,
    )


def _task_token_verifier(settings: Settings) -> TaskTokenVerifier:
    if settings.notification_delivery == "cloud_tasks":
        return GoogleOidcTaskTokenVerifier(
            audience=settings.notification_task_audience,
            expected_email=settings.notification_task_service_account,
        )
    if settings.auth_mode == "test":
        return TestTaskTokenVerifier()
    return UnconfiguredTaskTokenVerifier()


def create_app(
    settings: Settings | None = None,
    repository: ContentRepository | None = None,
    token_verifier: TokenVerifier | None = None,
    task_token_verifier: TaskTokenVerifier | None = None,
    media_root: Path | None = None,
) -> FastAPI:
    configure_logging()
    active_settings = settings or get_settings()
    app = FastAPI(
        title="DD Box Content API",
        version="0.1.0",
        docs_url="/docs" if active_settings.environment != "production" else None,
        redoc_url=None,
    )
    app.state.settings = active_settings
    app.state.repository = repository or _repository(active_settings)
    app.state.token_verifier = token_verifier or _verifier(active_settings)
    app.state.task_token_verifier = task_token_verifier or _task_token_verifier(active_settings)
    app.state.gallery_service = GalleryService(
        app.state.repository,
        active_settings.public_api_url,
    )
    app.state.structured_content_service = StructuredContentService(app.state.repository)
    app.state.pricing_service = PricingService(app.state.repository)
    app.state.lead_service = LeadService(
        app.state.repository,
        _notification_gateway(active_settings),
        _task_publisher(active_settings),
    )
    app.state.lead_export_service = LeadExportService(
        app.state.repository,
        active_settings.environment,
    )
    app.state.line_webhook_service = LineWebhookService(
        app.state.repository, active_settings.line_channel_secret
    )
    app.state.media_store = _media_store(active_settings, media_root)
    app.state.revalidation = RevalidationGateway(
        active_settings.web_revalidation_url, active_settings.web_revalidation_token
    )
    app.state.lead_rate_limiter = InMemoryRateLimiter()

    app.dependency_overrides[get_token_verifier] = get_verifier
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Idempotency-Key",
            "X-Media-Finalize-Token",
            "X-Request-ID",
        ],
        expose_headers=[
            "Content-Disposition",
            "X-DDBox-Export-ID",
            "X-DDBox-Record-Count",
            "X-Request-ID",
        ],
    )

    @app.middleware("http")
    async def request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = request.headers.get("X-Request-ID") or uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "route": request.url.path,
                "status": response.status_code,
                "latency_ms": round((time.perf_counter() - started) * 1000, 2),
            },
        )
        return response

    @app.exception_handler(DomainError)
    async def domain_error(request: Request, error: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={
                "type": f"https://ddboxprinting.com/problems/{error.code}",
                "title": error.code.replace("_", " ").title(),
                "status": error.status_code,
                "detail": str(error),
                "code": error.code,
                "request_id": getattr(request.state, "request_id", "unknown"),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "type": "https://ddboxprinting.com/problems/request-validation",
                "title": "Request Validation Error",
                "status": 422,
                "detail": "Request data did not satisfy the API contract",
                "code": "request_validation",
                "request_id": getattr(request.state, "request_id", "unknown"),
                "errors": [
                    {"type": item["type"], "location": item["loc"], "message": item["msg"]}
                    for item in error.errors()
                ],
            },
        )

    app.include_router(system.router)
    app.include_router(public.router)
    app.include_router(integrations.router)
    app.include_router(internal.router)
    app.include_router(admin.router)
    app.include_router(media.router)
    return app


app = create_app()
