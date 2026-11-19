"""画像の配信(GET /api/images/{id}、要件定義の第8節、第9節)

公開中のサークルが今使っている画像(アイコンと写真)だけを配る
本人に非公開のサークルの画像を見せる処理はP2で足す
"""

from uuid import UUID

import httpx2
import pytest
from conftest import SEED_IMAGES
from seed_data import (
    HIDDEN_CLUB_ICON,
    PHOTO_CLUB_ICON,
    PHOTO_CLUB_PHOTOS,
    UNKNOWN_IMAGE,
)


@pytest.mark.parametrize(
    "image_id",
    [PHOTO_CLUB_ICON, PHOTO_CLUB_PHOTOS[0]],
    ids=["アイコン", "写真"],
)
def test_public_image_is_served_with_safe_headers(
    client: httpx2.Client, image_id: UUID
) -> None:
    response = client.get(f"/api/images/{image_id}")

    assert response.status_code == 200
    assert response.content == (SEED_IMAGES / f"{image_id}.webp").read_bytes()
    assert response.headers["content-type"] == "image/webp"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["content-security-policy"] == "default-src 'none'; sandbox"


@pytest.mark.parametrize(
    "image_id",
    [HIDDEN_CLUB_ICON, UNKNOWN_IMAGE, "not-a-uuid"],
    ids=["非公開のサークル", "存在しない", "UUIDでない"],
)
def test_image_not_public_is_not_found(client: httpx2.Client, image_id: object) -> None:
    response = client.get(f"/api/images/{image_id}")

    assert response.status_code == 404
    assert response.headers["content-type"] == "application/problem+json"
