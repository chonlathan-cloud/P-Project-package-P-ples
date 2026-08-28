from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


def utc_now() -> datetime:
    return datetime.now(UTC)


class ContentStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class MediaRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    url: str = Field(min_length=1, max_length=2048)
    fallback_url: str | None = Field(default=None, max_length=2048)
    width: int = Field(gt=0, le=20_000)
    height: int = Field(gt=0, le=20_000)
    alt: str = Field(min_length=3, max_length=300)


class GalleryItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=3, max_length=120)
    locale: Literal["th"] = "th"
    title: str = Field(min_length=3, max_length=160)
    summary: str = Field(min_length=3, max_length=500)
    category: str = Field(min_length=2, max_length=80)
    image: MediaRef
    customer_permission: bool = False


class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    slug: str
    locale: Literal["th"] = "th"
    title: str
    summary: str
    category: str
    image: MediaRef
    customer_permission: bool
    status: ContentStatus = ContentStatus.DRAFT
    version: int = 1
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    created_by: str
    updated_by: str


class GalleryPublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=1)


class ContactPreference(StrEnum):
    PHONE = "phone"
    LINE = "line"
    EMAIL = "email"


class CustomerPath(StrEnum):
    HAS_SPECIFICATIONS = "has_specifications"
    NEEDS_GUIDANCE = "needs_guidance"


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    customer_path: CustomerPath
    product_type: str = Field(min_length=2, max_length=120)
    quantity: Annotated[int, Field(gt=0, le=10_000_000)] | None = None
    dimensions: str | None = Field(default=None, max_length=200)
    required_date: str | None = Field(default=None, max_length=80)
    delivery_province: str | None = Field(default=None, max_length=120)
    project_details: str = Field(min_length=10, max_length=3000)
    contact_name: str = Field(min_length=2, max_length=160)
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, pattern=r"^[0-9+()\-\s]{8,30}$")
    line_id: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    preferred_contact: ContactPreference
    consent: Literal[True]
    landing_page: str | None = Field(default=None, max_length=2048)
    campaign_source: str | None = Field(default=None, max_length=200)
    website: str = Field(default="", max_length=0, exclude=True)

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> LeadCreate:
        contact_values = {
            ContactPreference.PHONE: self.phone,
            ContactPreference.LINE: self.line_id,
            ContactPreference.EMAIL: self.email,
        }
        if not contact_values[self.preferred_contact]:
            raise ValueError(f"{self.preferred_contact.value} is required for preferred contact")
        if self.customer_path == CustomerPath.HAS_SPECIFICATIONS and self.quantity is None:
            raise ValueError("quantity is required when specifications are available")
        return self


class LeadReceipt(BaseModel):
    reference: str
    duplicate: bool
    next_step: str = "ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับผ่านช่องทางที่เลือก"


class StoredLead(BaseModel):
    id: str
    reference: str
    payload: LeadCreate
    payload_fingerprint: str
    idempotency_hash: str
    created_at: datetime
    notification_status: Literal["pending", "sent", "failed"] = "pending"


class UploadSessionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str = Field(min_length=1, max_length=180)
    content_type: Literal["image/jpeg", "image/png", "image/webp", "image/avif"]
    size: int = Field(gt=0)
    purpose: Literal["gallery"]
    alt: str = Field(min_length=3, max_length=300)


class UploadSession(BaseModel):
    id: str
    upload_url: str
    finalize_token: str
    expires_at: datetime


class MediaAsset(BaseModel):
    id: str
    original_filename: str
    content_type: str
    width: int
    height: int
    checksum_sha256: str
    url: str
    fallback_url: str
    alt: str
    created_at: datetime


class ProblemDetail(BaseModel):
    type: str
    title: str
    status: int
    detail: str
    code: str
    request_id: str
