from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Header, Query, Request, Response, status

from ddbox_api.auth import AdminPrincipal, require_admin
from ddbox_api.dependencies import (
    get_gallery_service,
    get_lead_export_service,
    get_media_store,
    get_revalidation,
    get_structured_content_service,
)
from ddbox_api.domain.errors import ValidationError
from ddbox_api.domain.models import (
    ContentDocument,
    ContentKind,
    ContentResource,
    ContentUpdateRequest,
    ContentVersionRequest,
    GalleryItem,
    GalleryItemCreate,
    GalleryPublishRequest,
    MediaAsset,
    StructuredContent,
    UploadSession,
    UploadSessionCreate,
)
from ddbox_api.services.gallery import GalleryService
from ddbox_api.services.lead_exports import LeadExportService
from ddbox_api.services.media import MediaStore
from ddbox_api.services.revalidation import RevalidationGateway
from ddbox_api.services.structured_content import StructuredContentService

router = APIRouter(prefix="/v1/admin", tags=["admin"])


@router.get("/leads/export")
def export_leads(
    created_from: Annotated[datetime, Query()],
    created_to: Annotated[datetime, Query()],
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[LeadExportService, Depends(get_lead_export_service)],
) -> Response:
    export = service.create(created_from, created_to)
    return Response(
        content=export.content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": f'attachment; filename="{export.filename}"',
            "X-DDBox-Export-ID": export.export_id,
            "X-DDBox-Record-Count": str(export.record_count),
        },
    )


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


@router.get("/{resource}", response_model=list[ContentDocument])
def list_structured_content(
    resource: ContentResource,
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> list[ContentDocument]:
    return service.list_all(resource.kind)


@router.post("/{resource}", response_model=ContentDocument, status_code=status.HTTP_201_CREATED)
def create_structured_content(
    resource: ContentResource,
    payload: StructuredContent,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> ContentDocument:
    return service.create(resource.kind, payload, principal.uid)


@router.get("/{resource}/{document_id}", response_model=ContentDocument)
def get_structured_content(
    resource: ContentResource,
    document_id: str,
    _principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> ContentDocument:
    return service.get(resource.kind, document_id)


@router.put("/{resource}/{document_id}", response_model=ContentDocument)
def update_structured_content(
    resource: ContentResource,
    document_id: str,
    payload: ContentUpdateRequest,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
) -> ContentDocument:
    return service.update(
        resource.kind,
        document_id,
        payload.expected_version,
        payload.content,
        principal.uid,
    )


@router.post("/publish/{kind}/{document_id}", response_model=ContentDocument)
def publish_structured_content(
    kind: ContentKind,
    document_id: str,
    payload: ContentVersionRequest,
    background_tasks: BackgroundTasks,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
    revalidation: Annotated[RevalidationGateway, Depends(get_revalidation)],
) -> ContentDocument:
    document = service.publish(kind, document_id, payload.expected_version, principal.uid)
    background_tasks.add_task(revalidation.revalidate_content, f"{kind.value}s")
    return document


@router.post("/archive/{kind}/{document_id}", response_model=ContentDocument)
def archive_structured_content(
    kind: ContentKind,
    document_id: str,
    payload: ContentVersionRequest,
    background_tasks: BackgroundTasks,
    principal: Annotated[AdminPrincipal, Depends(require_admin)],
    service: Annotated[StructuredContentService, Depends(get_structured_content_service)],
    revalidation: Annotated[RevalidationGateway, Depends(get_revalidation)],
) -> ContentDocument:
    document = service.archive(kind, document_id, payload.expected_version, principal.uid)
    background_tasks.add_task(revalidation.revalidate_content, f"{kind.value}s")
    return document
