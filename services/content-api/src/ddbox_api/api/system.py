from fastapi import APIRouter, Request

router = APIRouter(tags=["system"])


@router.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz")
def readiness(request: Request) -> dict[str, str]:
    return {"status": "ready", "environment": request.app.state.settings.environment}
