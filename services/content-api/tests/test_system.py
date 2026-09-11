from fastapi.testclient import TestClient


def test_health_and_request_id(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "test-request-id"})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request-id"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_readiness_reports_environment(client: TestClient) -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "environment": "test"}


def test_cors_exposes_authenticated_export_metadata(client: TestClient) -> None:
    response = client.get(
        "/v1/admin/leads/export?created_from=2026-09-01T00:00:00Z&created_to=2026-09-02T00:00:00Z",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.status_code == 403
    exposed = {
        value.strip().lower()
        for value in response.headers["access-control-expose-headers"].split(",")
    }
    assert exposed == {
        "content-disposition",
        "x-ddbox-export-id",
        "x-ddbox-record-count",
        "x-request-id",
    }
