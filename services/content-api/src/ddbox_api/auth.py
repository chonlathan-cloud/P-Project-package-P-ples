from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, Protocol

import firebase_admin
from fastapi import Depends, Header
from firebase_admin import auth

from ddbox_api.config import Settings
from ddbox_api.domain.errors import ForbiddenError


@dataclass(frozen=True)
class AdminPrincipal:
    uid: str


class TokenVerifier(Protocol):
    def verify_admin(self, token: str) -> AdminPrincipal: ...


class FirebaseTokenVerifier:
    def __init__(self, settings: Settings) -> None:
        if not settings.gcp_project_id:
            raise ValueError("DDBOX_GCP_PROJECT_ID is required for Firebase authentication")
        try:
            app = firebase_admin.get_app("ddbox-content-api")
        except ValueError:
            app = firebase_admin.initialize_app(
                options={"projectId": settings.gcp_project_id}, name="ddbox-content-api"
            )
        self._app = app

    def verify_admin(self, token: str) -> AdminPrincipal:
        try:
            decoded = auth.verify_id_token(token, app=self._app, check_revoked=True)
        except Exception as error:
            raise ForbiddenError("invalid or expired Firebase token") from error
        if decoded.get("admin") is not True:
            raise ForbiddenError("admin authorization is required")
        uid = decoded.get("uid") or decoded.get("sub")
        if not isinstance(uid, str) or not uid:
            raise ForbiddenError("token does not identify an administrator")
        return AdminPrincipal(uid=uid)


class TestTokenVerifier:
    def verify_admin(self, token: str) -> AdminPrincipal:
        if token != "test-admin-token":  # noqa: S105 - isolated test-only verifier
            raise ForbiddenError("invalid test token")
        return AdminPrincipal(uid="test-admin")


class UnconfiguredTokenVerifier:
    def verify_admin(self, token: str) -> AdminPrincipal:
        raise ForbiddenError("Firebase authentication is not configured")


def get_token_verifier() -> TokenVerifier:
    raise RuntimeError("token verifier dependency was not configured")


def require_admin(
    verifier: Annotated[TokenVerifier, Depends(get_token_verifier)],
    authorization: str | None = Header(default=None),
) -> AdminPrincipal:
    if not authorization or not authorization.startswith("Bearer "):
        raise ForbiddenError("Bearer token is required")
    return verifier.verify_admin(authorization.removeprefix("Bearer ").strip())
