from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="DDBOX_",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["local", "test", "staging", "production"] = "local"
    release: str = "dev"
    data_backend: Literal["memory", "firestore"] = "memory"
    media_backend: Literal["local", "gcs"] = "local"
    auth_mode: Literal["firebase", "test"] = "firebase"
    gcp_project_id: str | None = None
    firestore_database: str | None = None
    storage_bucket: str | None = None
    media_token_key: str | None = None
    media_signing_service_account: str | None = None
    web_revalidation_url: str | None = None
    web_revalidation_token: str | None = None
    public_api_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"
    media_root: Path = Path(".local/media")
    max_upload_bytes: int = 10 * 1024 * 1024

    @model_validator(mode="after")
    def validate_environment(self) -> Settings:
        if self.environment in {"staging", "production"}:
            if self.data_backend != "firestore":
                raise ValueError("staging and production require DDBOX_DATA_BACKEND=firestore")
            if self.media_backend != "gcs":
                raise ValueError("staging and production require DDBOX_MEDIA_BACKEND=gcs")
            required = {
                "DDBOX_GCP_PROJECT_ID": self.gcp_project_id,
                "DDBOX_FIRESTORE_DATABASE": self.firestore_database,
                "DDBOX_STORAGE_BUCKET": self.storage_bucket,
                "DDBOX_MEDIA_TOKEN_KEY": self.media_token_key,
                "DDBOX_MEDIA_SIGNING_SERVICE_ACCOUNT": self.media_signing_service_account,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(f"missing production configuration: {', '.join(missing)}")
        if self.auth_mode == "test" and self.environment != "test":
            raise ValueError("test authentication is allowed only in the test environment")
        if self.media_token_key and len(self.media_token_key) < 32:
            raise ValueError("DDBOX_MEDIA_TOKEN_KEY must contain at least 32 characters")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
