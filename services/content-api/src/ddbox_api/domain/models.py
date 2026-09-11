from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Annotated, Any, Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    ModelWrapValidatorHandler,
    PrivateAttr,
    field_validator,
    model_validator,
)
from pydantic import (
    ValidationError as PydanticValidationError,
)


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


class MeasurementConsentMode(StrEnum):
    UNSET = "unset"
    NECESSARY = "necessary"
    ALL = "all"


class AttributionStatus(StrEnum):
    CAPTURED = "captured"
    CONSENT_DENIED = "consent_denied"
    NO_VALID_TOUCH = "no_valid_touch"
    EXPIRED = "expired"
    INVALID = "invalid"
    UNAVAILABLE = "unavailable"
    LEGACY_UNKNOWN = "legacy_unknown"


class AttributionDropReason(StrEnum):
    INVALID_ATTRIBUTION = "invalid_attribution"
    INVALID_MEASUREMENT_CONSENT = "invalid_measurement_consent"
    CONSENT_NOT_GRANTED = "consent_not_granted"
    CONSENT_UNAVAILABLE = "consent_unavailable"
    CLIENT_TIME_INVALID = "client_time_invalid"


_ATTRIBUTION_TTL = timedelta(days=90)
_CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_CONTROLLED_TOKEN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._~-]*$")
_NUMERIC_ID = re.compile(r"^\d+$")
_UNRESOLVED_VALUE_TRACK = re.compile(r"\{[^{}]+\}")
_EMAIL_LIKE_VALUE = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
_FORMULA_PHONE_VALUE = re.compile(r"^[+()\d.\-\s]+$")
LEAD_BUSINESS_FIELDS = (
    "company",
    "consent",
    "contact_name",
    "customer_path",
    "delivery_province",
    "dimensions",
    "email",
    "line_id",
    "phone",
    "preferred_contact",
    "product_type",
    "project_details",
    "quantity",
    "required_date",
)


def _has_likely_personal_data(value: str) -> bool:
    if _EMAIL_LIKE_VALUE.search(value):
        return True
    digit_count = sum(character.isdigit() for character in value)
    return 8 <= digit_count <= 15 and _FORMULA_PHONE_VALUE.fullmatch(value) is not None


def _valid_attribution_text(
    value: str,
    maximum_length: int,
    *,
    controlled_token: bool = False,
    reject_likely_pii: bool = False,
) -> bool:
    if (
        not value
        or value != value.strip()
        or len(value) > maximum_length
        or _CONTROL_CHARACTERS.search(value)
        or _UNRESOLVED_VALUE_TRACK.search(value)
    ):
        return False
    if controlled_token and _CONTROLLED_TOKEN.fullmatch(value) is None:
        return False
    return not (reject_likely_pii and _has_likely_personal_data(value))


class AttributionTouch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_id: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    adgroup_id: str | None = None
    gclid: str | None = None
    landing_path: str
    captured_at: datetime
    expires_at: datetime

    @field_validator("utm_source", "utm_medium")
    @classmethod
    def validate_controlled_token(cls, value: str | None) -> str | None:
        if value is not None and not _valid_attribution_text(
            value,
            100,
            controlled_token=True,
            reject_likely_pii=True,
        ):
            raise ValueError("must be a valid attribution token")
        return value

    @field_validator("utm_campaign")
    @classmethod
    def validate_campaign(cls, value: str | None) -> str | None:
        if value is not None and not _valid_attribution_text(value, 200, reject_likely_pii=True):
            raise ValueError("must be a valid campaign value")
        return value

    @field_validator("utm_content")
    @classmethod
    def validate_campaign_content(cls, value: str | None) -> str | None:
        if value is not None and not (
            _valid_attribution_text(value, 200)
            and (_NUMERIC_ID.fullmatch(value) or not _has_likely_personal_data(value))
        ):
            raise ValueError("must be a valid campaign content value")
        return value

    @field_validator("utm_term")
    @classmethod
    def validate_term(cls, value: str | None) -> str | None:
        if value is not None and not _valid_attribution_text(value, 300, reject_likely_pii=True):
            raise ValueError("must be a valid attribution term")
        return value

    @field_validator("utm_id", "adgroup_id")
    @classmethod
    def validate_numeric_id(cls, value: str | None) -> str | None:
        if value is not None and not (
            _valid_attribution_text(value, 100) and _NUMERIC_ID.fullmatch(value)
        ):
            raise ValueError("must be a numeric identifier string")
        return value

    @field_validator("gclid")
    @classmethod
    def validate_gclid(cls, value: str | None) -> str | None:
        if value is not None and not (
            len(value.encode("utf-8")) <= 512
            and _valid_attribution_text(value, len(value))
            and not any(character.isspace() for character in value)
        ):
            raise ValueError("must be a valid opaque click identifier")
        return value

    @field_validator("landing_path")
    @classmethod
    def validate_landing_path(cls, value: str) -> str:
        if (
            not value.startswith("/")
            or len(value) > 2048
            or "?" in value
            or "#" in value
            or _CONTROL_CHARACTERS.search(value)
        ):
            raise ValueError("must be an internal path without a query or fragment")
        return value

    @field_validator("captured_at", "expires_at")
    @classmethod
    def validate_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_touch(self) -> Self:
        if not ((self.utm_source is not None and self.utm_medium is not None) or self.gclid):
            raise ValueError("requires source and medium or a GCLID")
        lifetime = self.expires_at - self.captured_at
        if lifetime <= timedelta(0) or lifetime > _ATTRIBUTION_TTL:
            raise ValueError("attribution lifetime must be between zero and 90 days")
        return self


class LeadAttribution(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: Literal[1]
    model: Literal["first_last_tagged"]
    first_touch: AttributionTouch | None
    last_touch: AttributionTouch | None

    @model_validator(mode="after")
    def validate_touches(self) -> Self:
        if self.first_touch is None or self.last_touch is None:
            raise ValueError("first and last touch must both be present")
        if self.first_touch.captured_at > self.last_touch.captured_at:
            raise ValueError("first touch cannot be newer than last touch")
        return self


class MeasurementConsentSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: MeasurementConsentMode
    version: int | None = Field(default=None, ge=1)
    updated_at: datetime | None = None

    @field_validator("updated_at")
    @classmethod
    def validate_updated_at_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_snapshot(self) -> Self:
        if self.mode == MeasurementConsentMode.UNSET:
            if self.version is not None or self.updated_at is not None:
                raise ValueError("unset consent cannot include version or update time")
        elif self.version is None or self.updated_at is None:
            raise ValueError("saved consent requires version and update time")
        return self


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    _attribution_drop_reason: AttributionDropReason | None = PrivateAttr(default=None)

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
    submission_path: str | None = Field(default=None, max_length=2048)
    campaign_source: str | None = Field(default=None, max_length=200)
    measurement_consent: MeasurementConsentSnapshot | None = None
    attribution: LeadAttribution | None = None
    website: str = Field(default="", max_length=0, exclude=True)

    @model_validator(mode="wrap")
    @classmethod
    def tolerate_invalid_optional_metadata(
        cls,
        data: Any,
        handler: ModelWrapValidatorHandler[Self],
    ) -> Self:
        drop_reason: AttributionDropReason | None = None
        try:
            model = handler(data)
        except PydanticValidationError as error:
            if not isinstance(data, dict):
                raise
            metadata_fields = {"attribution", "measurement_consent"}
            error_fields = {item["loc"][0] for item in error.errors() if len(item["loc"]) > 0}
            if not error_fields or not error_fields.issubset(metadata_fields):
                raise
            sanitized = dict(data)
            if "measurement_consent" in error_fields:
                sanitized["measurement_consent"] = None
                sanitized["attribution"] = None
                drop_reason = AttributionDropReason.INVALID_MEASUREMENT_CONSENT
            else:
                sanitized["attribution"] = None
                drop_reason = AttributionDropReason.INVALID_ATTRIBUTION
            model = handler(sanitized)

        if model.attribution is not None and (
            model.measurement_consent is None
            or model.measurement_consent.mode != MeasurementConsentMode.ALL
        ):
            model.attribution = None
            drop_reason = (
                AttributionDropReason.CONSENT_UNAVAILABLE
                if model.measurement_consent is None
                or model.measurement_consent.mode == MeasurementConsentMode.UNSET
                else AttributionDropReason.CONSENT_NOT_GRANTED
            )
        model._attribution_drop_reason = drop_reason
        return model

    @field_validator("submission_path")
    @classmethod
    def validate_submission_path(cls, value: str | None) -> str | None:
        if value is not None and (
            not value.startswith("/")
            or "?" in value
            or "#" in value
            or _CONTROL_CHARACTERS.search(value)
        ):
            raise ValueError("must be an internal path without a query or fragment")
        return value

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

    @property
    def attribution_drop_reason(self) -> AttributionDropReason | None:
        return self._attribution_drop_reason


def lead_business_data(payload: LeadCreate) -> dict[str, Any]:
    return payload.model_dump(mode="json", include=set(LEAD_BUSINESS_FIELDS))


class LeadReceipt(BaseModel):
    reference: str
    duplicate: bool
    next_step: str = "ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับผ่านช่องทางที่เลือก"


class StoredLead(BaseModel):
    id: str
    reference: str
    payload: LeadCreate
    payload_fingerprint: str
    payload_fingerprint_version: Literal[1, 2] = 1
    idempotency_hash: str
    created_at: datetime
    lead_origin: Literal["website_form"] = "website_form"
    attribution_status: AttributionStatus = AttributionStatus.LEGACY_UNKNOWN
    attribution_drop_reason: AttributionDropReason | None = None
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
