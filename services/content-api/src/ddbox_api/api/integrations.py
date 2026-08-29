from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from ddbox_api.dependencies import get_line_webhook_service
from ddbox_api.services.line_webhook import LineWebhookService

router = APIRouter(prefix="/v1/integrations", tags=["integrations"])


@router.post("/line/webhook")
async def line_webhook(
    request: Request,
    service: Annotated[LineWebhookService, Depends(get_line_webhook_service)],
    x_line_signature: Annotated[str | None, Header(alias="x-line-signature")] = None,
) -> dict[str, int | bool]:
    if not service.configured:
        raise HTTPException(status_code=503, detail="LINE webhook is not configured")
    raw_body = await request.body()
    if len(raw_body) > 1_000_000:
        raise HTTPException(status_code=413, detail="LINE webhook payload is too large")
    recorded = service.process(raw_body, x_line_signature or "")
    return {"accepted": True, "group_candidates_recorded": recorded}
