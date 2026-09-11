from __future__ import annotations

from typing import cast

from fastapi import Request

from ddbox_api.auth import TokenVerifier
from ddbox_api.repositories.base import ContentRepository
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.lead_exports import LeadExportService
from ddbox_api.services.leads import LeadService
from ddbox_api.services.line_webhook import LineWebhookService
from ddbox_api.services.media import MediaStore
from ddbox_api.services.pricing import PricingService
from ddbox_api.services.revalidation import RevalidationGateway
from ddbox_api.services.structured_content import StructuredContentService
from ddbox_api.task_auth import TaskTokenVerifier


def get_repository(request: Request) -> ContentRepository:
    return cast(ContentRepository, request.app.state.repository)


def get_verifier(request: Request) -> TokenVerifier:
    return cast(TokenVerifier, request.app.state.token_verifier)


def get_gallery_service(request: Request) -> GalleryService:
    return cast(GalleryService, request.app.state.gallery_service)


def get_pricing_service(request: Request) -> PricingService:
    return cast(PricingService, request.app.state.pricing_service)


def get_lead_service(request: Request) -> LeadService:
    return cast(LeadService, request.app.state.lead_service)


def get_lead_export_service(request: Request) -> LeadExportService:
    return cast(LeadExportService, request.app.state.lead_export_service)


def get_line_webhook_service(request: Request) -> LineWebhookService:
    return cast(LineWebhookService, request.app.state.line_webhook_service)


def get_media_store(request: Request) -> MediaStore:
    return cast(MediaStore, request.app.state.media_store)


def get_revalidation(request: Request) -> RevalidationGateway:
    return cast(RevalidationGateway, request.app.state.revalidation)


def get_task_token_verifier(request: Request) -> TaskTokenVerifier:
    return cast(TaskTokenVerifier, request.app.state.task_token_verifier)


def get_structured_content_service(request: Request) -> StructuredContentService:
    return cast(StructuredContentService, request.app.state.structured_content_service)
