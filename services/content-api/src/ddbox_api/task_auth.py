from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ddbox_api.domain.errors import ForbiddenError


@dataclass(frozen=True)
class TaskPrincipal:
    email: str


class TaskTokenVerifier(Protocol):
    def verify(self, token: str) -> TaskPrincipal: ...


class GoogleOidcTaskTokenVerifier:
    def __init__(self, audience: str, expected_email: str) -> None:
        self._audience = audience
        self._expected_email = expected_email

    def verify(self, token: str) -> TaskPrincipal:
        try:
            claims: dict[str, Any] = id_token.verify_oauth2_token(  # type: ignore[no-untyped-call]
                token,
                google_requests.Request(),
                audience=self._audience,
            )
        except Exception as error:
            raise ForbiddenError("invalid task identity token") from error
        email = claims.get("email")
        if email != self._expected_email or claims.get("email_verified") is not True:
            raise ForbiddenError("task identity is not authorized")
        return TaskPrincipal(email=str(email))


class TestTaskTokenVerifier:
    def verify(self, token: str) -> TaskPrincipal:
        if token != "test-task-token":  # noqa: S105 - isolated test-mode verifier
            raise ForbiddenError("invalid task identity token")
        return TaskPrincipal(email="test-task-invoker@example.invalid")


class UnconfiguredTaskTokenVerifier:
    def verify(self, token: str) -> TaskPrincipal:
        del token
        raise ForbiddenError("task authentication is not configured")
