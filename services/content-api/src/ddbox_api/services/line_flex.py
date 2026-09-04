from __future__ import annotations

from datetime import timedelta, timezone
from typing import Any

from ddbox_api.domain.models import ContactPreference, CustomerPath, LeadCreate, StoredLead

BRAND_YELLOW = "#FFCC00"
ACTION_RED = "#C92A36"
TEXT_PRIMARY = "#111827"
TEXT_MUTED = "#4B5563"
BORDER = "#D1D5DB"
ERROR = "#B42318"

_PATH_LABELS = {
    CustomerPath.HAS_SPECIFICATIONS: "มีสเปกแล้ว — ขอใบเสนอราคา",
    CustomerPath.NEEDS_GUIDANCE: "ต้องการคำแนะนำบรรจุภัณฑ์",
}

_CONTACT_LABELS = {
    ContactPreference.PHONE: "โทรศัพท์",
    ContactPreference.LINE: "LINE",
    ContactPreference.EMAIL: "อีเมล",
}


def customer_path_label(path: CustomerPath) -> str:
    return _PATH_LABELS[path]


def _truncate(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    return f"{value[: limit - 1].rstrip()}…"


def _value_row(label: str, value: str, *, bold: bool = False) -> dict[str, Any]:
    value_text: dict[str, Any] = {
        "type": "text",
        "text": value,
        "wrap": True,
        "color": TEXT_PRIMARY,
        "size": "sm",
        "flex": 4,
    }
    if bold:
        value_text["weight"] = "bold"

    return {
        "type": "box",
        "layout": "baseline",
        "spacing": "sm",
        "margin": "md",
        "contents": [
            {
                "type": "text",
                "text": label,
                "color": TEXT_MUTED,
                "size": "sm",
                "flex": 2,
            },
            value_text,
        ],
    }


def _section_title(text: str, *, margin: str | None = None) -> dict[str, Any]:
    component: dict[str, Any] = {
        "type": "text",
        "text": text,
        "color": TEXT_MUTED,
        "size": "sm",
        "weight": "bold",
    }
    if margin:
        component["margin"] = margin
    return component


def _preferred_contact(payload: LeadCreate) -> str:
    values = {
        ContactPreference.PHONE: payload.phone,
        ContactPreference.LINE: payload.line_id,
        ContactPreference.EMAIL: str(payload.email) if payload.email else None,
    }
    channel = _CONTACT_LABELS[payload.preferred_contact]
    value = values[payload.preferred_contact]
    return f"{channel} • {value}" if value else channel


def _environment_warning(environment: str) -> str | None:
    if environment == "production":
        return None
    label = environment.upper() if environment else "NON-PRODUCTION"
    return f"{label} ENVIRONMENT • ห้ามติดต่อลูกค้า"


def _created_at_label(lead: StoredLead) -> str:
    bangkok = timezone(timedelta(hours=7))
    return lead.created_at.astimezone(bangkok).strftime("%d/%m/%Y %H:%M")


def _source_label(payload: LeadCreate) -> str:
    if payload.campaign_source:
        return _truncate(payload.campaign_source, 80)
    return "Website"


def _job_rows(payload: LeadCreate) -> list[dict[str, Any]]:
    quantity = f"{payload.quantity:,} ใบ" if payload.quantity is not None else "ยังไม่ระบุ"
    rows = [
        _value_row("ประเภทงาน", payload.product_type, bold=True),
        _value_row("จำนวน", quantity, bold=True),
        _value_row("ต้องการใช้", payload.required_date or "ยังไม่ระบุ"),
        _value_row("จังหวัดจัดส่ง", payload.delivery_province or "ยังไม่ระบุ"),
    ]

    if payload.dimensions:
        dimension_label = (
            "ขนาดกล่อง"
            if payload.customer_path == CustomerPath.HAS_SPECIFICATIONS
            else "ขนาดสินค้า"
        )
        rows.append(_value_row(dimension_label, payload.dimensions))
    return rows


def _contact_rows(payload: LeadCreate) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if payload.company:
        rows.append(_value_row("บริษัท/แบรนด์", payload.company, bold=True))
    rows.extend(
        [
            _value_row("ผู้ติดต่อ", payload.contact_name),
            _value_row("ช่องทางสะดวก", _preferred_contact(payload)),
        ]
    )
    return rows


def build_lead_flex_contents(
    lead: StoredLead,
    *,
    environment: str = "production",
    lead_detail_base_url: str = "",
) -> dict[str, Any]:
    payload = lead.payload
    warning = _environment_warning(environment)

    body_contents: list[dict[str, Any]] = []
    if warning:
        body_contents.extend(
            [
                {
                    "type": "text",
                    "text": warning,
                    "size": "sm",
                    "weight": "bold",
                    "color": ERROR,
                    "wrap": True,
                },
                {"type": "separator", "margin": "lg", "color": BORDER},
            ]
        )

    body_contents.append(_section_title("ข้อมูลงาน", margin="xl" if warning else None))
    body_contents.extend(_job_rows(payload))
    body_contents.extend(
        [
            {"type": "separator", "margin": "xxl", "color": BORDER},
            _section_title("ผู้ติดต่อ", margin="xxl"),
        ]
    )
    body_contents.extend(_contact_rows(payload))
    body_contents.extend(
        [
            {"type": "separator", "margin": "xxl", "color": BORDER},
            _section_title("รายละเอียด", margin="xxl"),
            {
                "type": "text",
                "text": _truncate(payload.project_details, 800),
                "color": TEXT_PRIMARY,
                "size": "sm",
                "wrap": True,
                "margin": "sm",
            },
            {
                "type": "text",
                "text": (
                    f"{lead.reference} • {_source_label(payload)} • {_created_at_label(lead)}"
                ),
                "color": TEXT_MUTED,
                "size": "xs",
                "wrap": True,
                "margin": "xxl",
            },
        ]
    )

    bubble: dict[str, Any] = {
        "type": "bubble",
        "size": "mega",
        "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": BRAND_YELLOW,
            "paddingAll": "24px",
            "contents": [
                {
                    "type": "text",
                    "text": "DD BOX PRINTING",
                    "size": "xs",
                    "weight": "bold",
                    "color": TEXT_PRIMARY,
                },
                {
                    "type": "text",
                    "text": "Lead ใหม่",
                    "size": "xl",
                    "weight": "bold",
                    "color": TEXT_PRIMARY,
                    "margin": "sm",
                },
                {
                    "type": "text",
                    "text": customer_path_label(payload.customer_path),
                    "size": "sm",
                    "weight": "bold",
                    "color": TEXT_PRIMARY,
                    "wrap": True,
                    "margin": "sm",
                },
            ],
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "24px",
            "contents": body_contents,
        },
    }

    if lead_detail_base_url:
        detail_uri = f"{lead_detail_base_url.rstrip('/')}/{lead.reference}"
        bubble["footer"] = {
            "type": "box",
            "layout": "vertical",
            "paddingStart": "24px",
            "paddingEnd": "24px",
            "paddingBottom": "24px",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": ACTION_RED,
                    "height": "sm",
                    "action": {
                        "type": "uri",
                        "label": "เปิดรายละเอียด Lead",
                        "uri": detail_uri,
                    },
                }
            ],
        }

    return bubble


def build_lead_flex_message(
    lead: StoredLead,
    *,
    environment: str = "production",
    lead_detail_base_url: str = "",
) -> dict[str, Any]:
    payload = lead.payload
    quantity = f"{payload.quantity:,} ใบ" if payload.quantity is not None else "ยังไม่ระบุจำนวน"
    alt_text = _truncate(
        f"Lead ใหม่ {lead.reference} • {customer_path_label(payload.customer_path)} • "
        f"{payload.product_type} • {quantity}",
        400,
    )
    return {
        "type": "flex",
        "altText": alt_text,
        "contents": build_lead_flex_contents(
            lead,
            environment=environment,
            lead_detail_base_url=lead_detail_base_url,
        ),
    }
