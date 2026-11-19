"""ヘルスチェック(GET /api/health)"""

import httpx2


def test_health_returns_ok(client: httpx2.Client) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.json() == {"status": "ok"}
