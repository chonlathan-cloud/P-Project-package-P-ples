from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request, status

from ddbox_api.dependencies import (
    get_gallery_service,
    get_lead_service,
    get_pricing_service,
    get_structured_content_service,
)
from ddbox_api.domain.errors import ValidationError
from ddbox_api.domain.models import (
    ContentKind,
    GalleryItem,
    LeadCreate,
    LeadReceipt,
    PricingBenchmark,
    PublishedContentDocument,
)
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.leads import LeadService
from ddbox_api.services.pricing import PricingService
from ddbox_api.services.structured_content import StructuredContentService

router = APIRouter(prefix="/v1", tags=["public"])


@router.get("/gallery-items", response_model=list[GalleryItem])
def list_gallery_items(
    service: Annotated[GalleryService, Depends(get_gallery_service)],
) -> list[GalleryItem]:
    return service.list_published()


@router.get("/pricing-benchmarks", response_model=list[PricingBenchmark])
def list_pricing_benchmarks(
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> list[PricingBenchmark]:
    return service.list_published()


def _list_published_content(
    kind: ContentKind, service: StructuredContentService
) -> list[PublishedContentDocument]:
    return service.list_published(kind)


def _get_published_content(
    kind: ContentKind, slug: str, service: StructuredContentService
) -> PublishedContentDocument:
    return service.get_published_by_slug(kind, slug)


@router.get("/products", response_model=list[PublishedContentDocument])
def list_products(
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> list[PublishedContentDocument]:
    return _list_published_content(ContentKind.PRODUCT, service)


@router.get("/products/{slug}", response_model=PublishedContentDocument)
def get_product(
    slug: str,
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> PublishedContentDocument:
    return _get_published_content(ContentKind.PRODUCT, slug, service)


@router.get("/offers", response_model=list[PublishedContentDocument])
def list_offers(
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> list[PublishedContentDocument]:
    return _list_published_content(ContentKind.OFFER, service)


@router.get("/offers/{slug}", response_model=PublishedContentDocument)
def get_offer(
    slug: str,
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> PublishedContentDocument:
    return _get_published_content(ContentKind.OFFER, slug, service)


@router.get("/faqs", response_model=list[PublishedContentDocument])
def list_faqs(
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> list[PublishedContentDocument]:
    return _list_published_content(ContentKind.FAQ, service)


@router.get("/faqs/{slug}", response_model=PublishedContentDocument)
def get_faq(
    slug: str,
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> PublishedContentDocument:
    return _get_published_content(ContentKind.FAQ, slug, service)


@router.get("/pages", response_model=list[PublishedContentDocument])
def list_pages(
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> list[PublishedContentDocument]:
    return _list_published_content(ContentKind.PAGE, service)


@router.get("/pages/{slug}", response_model=PublishedContentDocument)
def get_page(
    slug: str,
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> PublishedContentDocument:
    return _get_published_content(ContentKind.PAGE, slug, service)


@router.post("/leads", response_model=LeadReceipt, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    service: Annotated[LeadService, Depends(get_lead_service)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> LeadReceipt:
    if not idempotency_key or not 16 <= len(idempotency_key) <= 200:
        raise ValidationError("Idempotency-Key must contain 16 to 200 characters")
    client_key = request.client.host if request.client else "unknown"
    request.app.state.lead_rate_limiter.check(client_key)
    receipt, lead_id = service.create(payload, idempotency_key)
    if service.uses_durable_tasks:
        service.enqueue_notification(lead_id)
    elif not receipt.duplicate:
        background_tasks.add_task(service.deliver_notification, lead_id)
    return receipt
