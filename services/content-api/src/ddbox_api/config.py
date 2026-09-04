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
    notification_backend: Literal["logging", "line", "line_gmail"] = "logging"
    notification_delivery: Literal["background", "cloud_tasks"] = "background"
    line_channel_access_token: str = ""
    line_channel_secret: str = ""
    line_notification_target_id: str = ""
    lead_detail_base_url: str = ""
    gmail_app_password: str = ""
    notification_email: str = "paobansawang@gmail.com"
    cloud_tasks_location: str = ""
    cloud_tasks_queue: str = ""
    notification_task_target_url: str = ""
    notification_task_service_account: str = ""
    notification_task_audience: str = ""

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
        if self.notification_backend in {"line", "line_gmail"}:
            notification_required = {
                "DDBOX_LINE_CHANNEL_ACCESS_TOKEN": self.line_channel_access_token,
                "DDBOX_LINE_CHANNEL_SECRET": self.line_channel_secret,
                "DDBOX_LINE_NOTIFICATION_TARGET_ID": self.line_notification_target_id,
            }
            if self.notification_backend == "line_gmail":
                notification_required.update(
                    {
                        "DDBOX_GMAIL_APP_PASSWORD": self.gmail_app_password,
                        "DDBOX_NOTIFICATION_EMAIL": self.notification_email,
                    }
                )
            notification_missing = [
                name for name, value in notification_required.items() if not value
            ]
            if notification_missing:
                raise ValueError(
                    f"missing notification configuration: {', '.join(notification_missing)}"
                )
        if self.notification_delivery == "cloud_tasks":
            task_required = {
                "DDBOX_GCP_PROJECT_ID": self.gcp_project_id,
                "DDBOX_CLOUD_TASKS_LOCATION": self.cloud_tasks_location,
                "DDBOX_CLOUD_TASKS_QUEUE": self.cloud_tasks_queue,
                "DDBOX_NOTIFICATION_TASK_TARGET_URL": self.notification_task_target_url,
                "DDBOX_NOTIFICATION_TASK_SERVICE_ACCOUNT": (self.notification_task_service_account),
                "DDBOX_NOTIFICATION_TASK_AUDIENCE": self.notification_task_audience,
            }
            task_missing = [name for name, value in task_required.items() if not value]
            if task_missing:
                raise ValueError(f"missing Cloud Tasks configuration: {', '.join(task_missing)}")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
