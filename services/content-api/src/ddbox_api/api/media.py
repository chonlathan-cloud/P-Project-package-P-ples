from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from ddbox_api.dependencies import get_media_store
from ddbox_api.services.media import MediaStore

router = APIRouter(tags=["media"])


@router.get("/media/{asset_id}/{filename}")
def get_media(
    asset_id: str,
    filename: str,
    store: Annotated[MediaStore, Depends(get_media_store)],
) -> Response:
    body, content_type = store.read_variant(asset_id, filename)
    return Response(
        content=body,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
