from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Response, status

from ddbox_api.dependencies import get_lead_service, get_task_token_verifier
from ddbox_api.domain.errors import ForbiddenError
from ddbox_api.services.leads import LeadService
from ddbox_api.task_auth import TaskTokenVerifier

router = APIRouter(prefix="/v1/internal", tags=["internal"])


@router.post(
    "/lead-notifications/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    include_in_schema=False,
)
def deliver_lead_notification(
    lead_id: str,
    service: Annotated[LeadService, Depends(get_lead_service)],
    verifier: Annotated[TaskTokenVerifier, Depends(get_task_token_verifier)],
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> Response:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ForbiddenError("task identity token is required")
    verifier.verify(token)
    service.deliver_notification(lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
