from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request, status

from ddbox_api.dependencies import get_gallery_service, get_lead_service, get_pricing_service
from ddbox_api.domain.errors import ValidationError
from ddbox_api.domain.models import GalleryItem, LeadCreate, LeadReceipt, PricingBenchmark
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.leads import LeadService
from ddbox_api.services.pricing import PricingService

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
    if not receipt.duplicate:
        background_tasks.add_task(service.notify, lead_id)
    return receipt
