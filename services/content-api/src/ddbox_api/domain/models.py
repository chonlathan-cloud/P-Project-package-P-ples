from __future__ import annotations

import re
from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


def utc_now() -> datetime:
    return datetime.now(UTC)


class ContentStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class GalleryEvidenceType(StrEnum):
    CUSTOMER_WORK = "customer_work"
    CONCEPT = "concept"


class MediaRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    url: str = Field(min_length=1, max_length=2048)
    fallback_url: str | None = Field(default=None, max_length=2048)
    width: int = Field(gt=0, le=20_000)
    height: int = Field(gt=0, le=20_000)
    alt: str = Field(min_length=3, max_length=300)


class GallerySpecs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    material: str | None = Field(default=None, max_length=160)
    quantity: str | None = Field(default=None, max_length=120)
    application: str | None = Field(default=None, max_length=200)


def _migrate_legacy_gallery_image(data: Any) -> Any:
    if isinstance(data, dict) and "images" not in data and "image" in data:
        migrated = dict(data)
        migrated["images"] = [migrated.pop("image")]
        return migrated
    return data


class GalleryItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=3, max_length=120)
    locale: Literal["th"] = "th"
    title: str = Field(min_length=3, max_length=160)
    summary: str = Field(min_length=3, max_length=500)
    category: str = Field(min_length=2, max_length=80)
    images: list[MediaRef] = Field(min_length=1, max_length=12)
    evidence_type: GalleryEvidenceType = GalleryEvidenceType.CUSTOMER_WORK
    pricing_benchmark_id: str | None = Field(default=None, min_length=3, max_length=120)
    specs: GallerySpecs = Field(default_factory=GallerySpecs)
    customer_permission: bool = False

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_image(cls, data: Any) -> Any:
        return _migrate_legacy_gallery_image(data)


class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    slug: str
    locale: Literal["th"] = "th"
    title: str
    summary: str
    category: str
    images: list[MediaRef] = Field(min_length=1, max_length=12)
    evidence_type: GalleryEvidenceType = GalleryEvidenceType.CUSTOMER_WORK
    pricing_benchmark_id: str | None = None
    specs: GallerySpecs = Field(default_factory=GallerySpecs)
    customer_permission: bool
    status: ContentStatus = ContentStatus.DRAFT
    version: int = 1
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    created_by: str
    updated_by: str

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_image(cls, data: Any) -> Any:
        return _migrate_legacy_gallery_image(data)


class PricingBenchmark(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=3, max_length=120)
    locale: Literal["th"] = "th"
    label: str = Field(min_length=3, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    starting_price_min_satang: int = Field(ge=0)
    starting_price_max_satang: int | None = Field(default=None, ge=0)
    benchmark_min_satang: int = Field(ge=0)
    benchmark_max_satang: int | None = Field(default=None, ge=0)
    benchmark_open_ended: bool = False
    unit: Literal["ใบ", "ชิ้น"]
    quantity_basis: str | None = Field(default=None, max_length=120)
    material: str = Field(min_length=2, max_length=200)
    disclaimer: str = Field(min_length=10, max_length=500)
    status: ContentStatus = ContentStatus.DRAFT
    version: int = Field(default=1, ge=1)
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    created_by: str
    updated_by: str

    @model_validator(mode="after")
    def validate_price_ranges(self) -> PricingBenchmark:
        if (
            self.starting_price_max_satang is not None
            and self.starting_price_max_satang < self.starting_price_min_satang
        ):
            raise ValueError("starting price maximum must not be below minimum")
        if (
            self.benchmark_max_satang is not None
            and self.benchmark_max_satang < self.benchmark_min_satang
        ):
            raise ValueError("benchmark maximum must not be below minimum")
        return self


class GalleryPublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=1)


class ContentKind(StrEnum):
    PRODUCT = "product"
    OFFER = "offer"
    FAQ = "faq"
    PAGE = "page"


class ContentResource(StrEnum):
    PRODUCTS = "products"
    OFFERS = "offers"
    FAQS = "faqs"
    PAGES = "pages"

    @property
    def kind(self) -> ContentKind:
        return ContentKind(self.value[:-1])


class PlainTextModel(BaseModel):
    @model_validator(mode="after")
    def reject_html_markup(self) -> PlainTextModel:
        values: list[Any] = list(self.model_dump(mode="python").values())
        while values:
            value = values.pop()
            if isinstance(value, str) and re.search(r"<\s*/?\s*[a-zA-Z][^>]*>", value):
                raise ValueError("HTML markup is not allowed in structured content")
            if isinstance(value, dict):
                values.extend(value.values())
            elif isinstance(value, list):
                values.extend(value)
        return self


class SeoFields(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, max_length=70)
    description: str | None = Field(default=None, max_length=170)
    canonical_override: str | None = Field(
        default=None,
        pattern=r"^(?:https://[^\s]+|/[a-z0-9/_-]*)$",
        max_length=2048,
    )
    social_image_id: str | None = Field(default=None, min_length=1, max_length=128)


class ContentCore(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=120)
    locale: Literal["th"] = "th"
    title: str = Field(min_length=3, max_length=160)
    summary: str = Field(min_length=3, max_length=500)
    seo: SeoFields = Field(default_factory=SeoFields)


class ContentDetailItem(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=3, max_length=1000)


class ContentImage(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    src: str = Field(pattern=r"^/images/[a-zA-Z0-9/_\-.]+$", max_length=500)
    alt: str = Field(min_length=3, max_length=300)


class ProductContent(ContentCore):
    kind: Literal[ContentKind.PRODUCT] = ContentKind.PRODUCT
    display_order: int = Field(default=0, ge=0, le=10_000)
    category: str = Field(min_length=2, max_length=80)
    overview: str | None = Field(default=None, max_length=1000)
    pricing_benchmark_id: str | None = Field(default=None, min_length=3, max_length=120)
    hero_image: ContentImage | None = None
    evidence_image: ContentImage | None = None
    applications: list[ContentDetailItem] = Field(default_factory=list, max_length=12)
    fit: list[str] = Field(default_factory=list, max_length=12)
    brief: list[str] = Field(default_factory=list, max_length=12)
    decisions: list[ContentDetailItem] = Field(default_factory=list, max_length=12)
    materials: list[str] = Field(default_factory=list, max_length=12)
    use_cases: list[str] = Field(default_factory=list, max_length=12)
    moq_guidance: str | None = Field(default=None, max_length=300)
    lead_time_wording: str | None = Field(default=None, max_length=300)
    media_ids: list[str] = Field(default_factory=list, max_length=20)


class OfferContent(ContentCore):
    kind: Literal[ContentKind.OFFER] = ContentKind.OFFER
    display_order: int = Field(default=0, ge=0, le=10_000)
    label: str | None = Field(default=None, max_length=80)
    status_label: str | None = Field(default=None, max_length=80)
    audience: str = Field(min_length=3, max_length=500)
    quote_path: Literal["needs_guidance", "has_specifications"] = "needs_guidance"
    inputs: list[str] = Field(default_factory=list, max_length=12)
    checks: list[ContentDetailItem] = Field(default_factory=list, max_length=12)
    moq_guidance: str | None = Field(default=None, max_length=300)
    benefits: list[str] = Field(min_length=1, max_length=12)
    cta_label: str = Field(min_length=3, max_length=80)
    cta_href: str = Field(
        pattern=r"^/[a-z0-9/_-]*(?:\?[a-z0-9_=&-]+)?$",
        max_length=500,
    )
    proof_reference_ids: list[str] = Field(default_factory=list, max_length=20)


class FaqContent(ContentCore):
    kind: Literal[ContentKind.FAQ] = ContentKind.FAQ
    question: str = Field(min_length=5, max_length=300)
    answer: str = Field(min_length=10, max_length=3000)
    page_scopes: list[str] = Field(min_length=1, max_length=20)
    order: int = Field(default=0, ge=0, le=10_000)


class TextPageSection(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    type: Literal["text"] = "text"
    key: str | None = Field(
        default=None,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        max_length=80,
    )
    heading: str = Field(min_length=3, max_length=160)
    paragraphs: list[str] = Field(min_length=1, max_length=12)
    bullets: list[str] = Field(default_factory=list, max_length=20)
    items: list[ContentDetailItem] = Field(default_factory=list, max_length=20)


class EntityListPageSection(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    type: Literal["entity_list"] = "entity_list"
    key: str | None = Field(
        default=None,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        max_length=80,
    )
    heading: str = Field(min_length=3, max_length=160)
    entity_kind: Literal["products", "offers", "faqs", "gallery_items"]
    entity_ids: list[str] = Field(min_length=1, max_length=24)


class CtaPageSection(PlainTextModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    type: Literal["cta"] = "cta"
    key: str | None = Field(
        default=None,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        max_length=80,
    )
    heading: str = Field(min_length=3, max_length=160)
    body: str = Field(min_length=3, max_length=500)
    label: str = Field(min_length=3, max_length=80)
    href: str = Field(
        pattern=r"^/[a-z0-9/_-]*(?:\?[a-z0-9_=&-]+)?$",
        max_length=500,
    )


PageSection = Annotated[
    TextPageSection | EntityListPageSection | CtaPageSection,
    Field(discriminator="type"),
]


class PageContent(ContentCore):
    kind: Literal[ContentKind.PAGE] = ContentKind.PAGE
    sections: list[PageSection] = Field(min_length=1, max_length=30)


StructuredContent = Annotated[
    ProductContent | OfferContent | FaqContent | PageContent,
    Field(discriminator="kind"),
]


class ContentDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: ContentKind
    content: StructuredContent
    published_content: StructuredContent | None = None
    status: ContentStatus = ContentStatus.DRAFT
    has_unpublished_changes: bool = True
    version: int = Field(default=1, ge=1)
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    created_by: str
    updated_by: str

    @model_validator(mode="after")
    def validate_content_kinds(self) -> ContentDocument:
        if self.content.kind != self.kind:
            raise ValueError("content kind must match document kind")
        if self.published_content and self.published_content.kind != self.kind:
            raise ValueError("published content kind must match document kind")
        return self


class PublishedContentDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: ContentKind
    content: StructuredContent
    version: int = Field(ge=1)
    published_at: datetime


class ContentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=1)
    content: StructuredContent


class ContentVersionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=1)


class ContactPreference(StrEnum):
    PHONE = "phone"
    LINE = "line"
    EMAIL = "email"


class CustomerPath(StrEnum):
    HAS_SPECIFICATIONS = "has_specifications"
    NEEDS_GUIDANCE = "needs_guidance"


class NotificationStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    SENT = "sent"
    FAILED = "failed"


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
    notification_status: NotificationStatus = NotificationStatus.PENDING
    notification_attempts: int = Field(default=0, ge=0)
    notification_lease_until: datetime | None = None
    notification_channel: Literal["logging", "line", "gmail"] | None = None
    notification_last_error: str | None = Field(default=None, max_length=80)
    notification_sent_at: datetime | None = None


class LineGroupCandidate(BaseModel):
    """A LINE group observed through a verified webhook, pending explicit promotion."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[0-9a-f]{64}$")
    group_id: str = Field(pattern=r"^C[0-9a-f]{32}$")
    bot_user_id: str | None = Field(default=None, pattern=r"^U[0-9a-f]{32}$")
    event_type: Literal["join", "registration_message"]
    first_seen_at: datetime
    last_seen_at: datetime
    status: Literal["candidate", "active"] = "candidate"


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
