"""権限表テスト(要件定義の第4節、第9節「認可」)

全ルートと全ロールの期待するステータスコードを1つの表(PERMISSIONS)に持つ
api/openapi.yamlにあって表にないルートがあれば失敗する
新しいルートを足したら、この表に行を足す
"""

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Any

import httpx2
import pytest
import yaml
from seed_data import PHOTO_CLUB, PHOTO_CLUB_ICON

OPENAPI_PATH = Path(__file__).resolve().parents[3] / "api" / "openapi.yaml"
HTTP_METHODS = {"get", "put", "post", "delete", "patch", "head", "options", "trace"}


class Role(StrEnum):
    ANONYMOUS = "anonymous"
    # P2でEDITOR、P4でADMINを足す


@dataclass(frozen=True)
class Route:
    method: str
    # openapi.yamlと同じ書き方(パス変数は{id}のまま)
    path: str
    expected: dict[Role, int]
    # パス変数があるときに実際にリクエストするURL
    url: str | None = None


PERMISSIONS: list[Route] = [
    Route("GET", "/api/health", {Role.ANONYMOUS: 200}),
    Route("GET", "/api/clubs", {Role.ANONYMOUS: 200}),
    Route(
        "GET",
        "/api/clubs/{club_id}",
        {Role.ANONYMOUS: 200},
        url=f"/api/clubs/{PHOTO_CLUB}",
    ),
    Route(
        "GET",
        "/api/images/{image_id}",
        {Role.ANONYMOUS: 200},
        url=f"/api/images/{PHOTO_CLUB_ICON}",
    ),
]


def routes_in_contract() -> set[tuple[str, str]]:
    contract: dict[str, Any] = yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))
    return {
        (method.upper(), path)
        for path, operations in contract.get("paths", {}).items()
        for method in operations
        if method in HTTP_METHODS
    }


def test_every_route_in_contract_is_in_table() -> None:
    in_table = {(route.method, route.path) for route in PERMISSIONS}

    assert routes_in_contract() == in_table


@pytest.mark.parametrize("route", PERMISSIONS, ids=lambda r: f"{r.method} {r.path}")
def test_every_route_has_expectation_for_every_role(route: Route) -> None:
    assert set(route.expected) == set(Role)


@pytest.mark.parametrize(
    ("route", "role"),
    [(route, role) for route in PERMISSIONS for role in Role],
    ids=lambda v: f"{v.method} {v.path}" if isinstance(v, Route) else str(v),
)
def test_permission(client: httpx2.Client, route: Route, role: Role) -> None:
    # P2でロールごとのログイン状態を作る、今は未ログインだけ
    response = client.request(route.method, route.url or route.path)

    assert response.status_code == route.expected[role]
