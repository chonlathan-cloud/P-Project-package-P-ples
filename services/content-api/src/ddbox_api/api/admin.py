from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Header, Query, Request, Response, status

from ddbox_api.auth import AdminPrincipal, require_admin
from ddbox_api.dependencies import get_gallery_service, get_media_store, get_revalidation
from ddbox_api.domain.errors import ValidationError
from ddbox_api.domain.models import (
    GalleryItem,
    GalleryItemCreate,
    GalleryPublishRequest,
    MediaAsset,
    UploadSession,
    UploadSessionCreate,
)
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.media import MediaStore
from ddbox_api.services.revalidation import RevalidationGateway

router = APIRouter(prefix="/v1/admin", tags=["admin"])


@router.post("/gallery-items", response_model=GalleryItem, status_code=status.HTTP_201_CREATED)
def create_gallery_item(
    payload: GalleryItemCreate,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[GalleryService, Depends(get_gallery_service)],
) -> GalleryItem:
    return service.create_draft(payload, principal.uid)


@router.get("/gallery-items/{item_id}/preview", response_model=GalleryItem)
def preview_gallery_item(
    item_id: str,
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[GalleryService, Depends(get_gallery_service)],
) -> GalleryItem:
    return service.get_preview(item_id)


@router.post("/publish/gallery-item/{item_id}", response_model=GalleryItem)
def publish_gallery_item(
    item_id: str,
    payload: GalleryPublishRequest,
    background_tasks: BackgroundTasks,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    revalidation: Annotated[RevalidationGateway, Depends(get_revalidation)],
) -> GalleryItem:
    item = service.publish(item_id, payload.expected_version, principal.uid)
    background_tasks.add_task(revalidation.revalidate_gallery)
    return item


@router.post("/media/uploads", response_model=UploadSession, status_code=status.HTTP_201_CREATED)
def create_upload_session(
    payload: UploadSessionCreate,
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    store: Annotated[MediaStore, Depends(get_media_store)],
) -> UploadSession:
    return store.create_session(payload)


@router.put("/media/uploads/{session_id}/content", status_code=status.HTTP_204_NO_CONTENT)
async def upload_content(
    session_id: str,
    request: Request,
    store: Annotated[MediaStore, Depends(get_media_store)],
    token: Annotated[str, Query(min_length=20)],
    content_type: Annotated[str | None, Header(alias="Content-Type")] = None,
) -> Response:
    if not content_type:
        raise ValidationError("Content-Type is required")
    body = await request.body()
    store.put(session_id, token, body, content_type)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/media/uploads/{session_id}/finalize", response_model=MediaAsset)
def finalize_upload(
    session_id: str,
    token: Annotated[str, Header(alias="X-Media-Finalize-Token", min_length=20)],
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    store: Annotated[MediaStore, Depends(get_media_store)],
) -> MediaAsset:
    return store.finalize(session_id, token)
