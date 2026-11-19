"""公開中のサークルの一覧・検索・詳細(GET /api/clubs、GET /api/clubs/{id})"""

from typing import Any

import httpx2
import pytest
from seed_data import (
    EMPTY_FRAME,
    ESS,
    HIDDEN_CLUB,
    INCOMPLETE_CLUB,
    PHOTO_CLUB,
    PHOTO_CLUB_ICON,
    PHOTO_CLUB_PHOTOS,
    PUBLIC_NAMES_IN_ORDER,
    UNKNOWN_CLUB,
)


def names(response: httpx2.Response) -> list[str]:
    body: dict[str, Any] = response.json()
    return [club["name"] for club in body["items"]]


def assert_problem(response: httpx2.Response, status: int) -> None:
    """エラーはRFC 9457(Problem Details)の形で返す"""
    assert response.status_code == status
    assert response.headers["content-type"] == "application/problem+json"
    body = response.json()
    assert body["status"] == status
    assert body["title"]


# ---- 一覧 ----


def test_list_returns_public_clubs_in_reading_order(client: httpx2.Client) -> None:
    response = client.get("/api/clubs")

    assert response.status_code == 200
    assert names(response) == PUBLIC_NAMES_IN_ORDER


def test_list_item_has_summary_fields(client: httpx2.Client) -> None:
    items = client.get("/api/clubs").json()["items"]
    photo_club = next(item for item in items if item["id"] == str(PHOTO_CLUB))

    assert photo_club == {
        "id": str(PHOTO_CLUB),
        "name": "写真部",
        "description": (
            "学内外で撮影会を開き、写真展で作品を発表しています。\n"
            "初心者向けにカメラの貸し出しもあります。見学はいつでも歓迎です。"
        ),
        "icon_image_id": str(PHOTO_CLUB_ICON),
    }


# ---- 検索 ----


@pytest.mark.parametrize(
    ("q", "expected"),
    [
        # 説明に一致、非公開とアイコンなしのサークルにも「撮影」があるが出さない
        ("撮影", ["写真部"]),
        # 全角で入力しても一致する
        ("ＥＳＳ", ["ESS"]),
        ("ess", ["ESS"]),
        # 読み仮名に一致
        ("しゃしん", ["写真部"]),
        # %と_はワイルドカードではなく文字として探す
        ("100%", ["ボードゲーム同好会"]),
        ("%", ["ボードゲーム同好会"]),
        ("_", []),
        # 該当なし
        ("存在しない語", []),
    ],
)
def test_search(client: httpx2.Client, q: str, expected: list[str]) -> None:
    response = client.get("/api/clubs", params={"q": q})

    assert response.status_code == 200
    assert names(response) == expected


@pytest.mark.parametrize("q", ["", "   "])
def test_blank_query_returns_all(client: httpx2.Client, q: str) -> None:
    response = client.get("/api/clubs", params={"q": q})

    assert response.status_code == 200
    assert names(response) == PUBLIC_NAMES_IN_ORDER


@pytest.mark.parametrize(
    "params",
    [
        {"q": "あ" * 51},  # 検索語は50文字まで
        {"q": "写真\n部"},  # 制御文字
        {"q": "写真", "sort": "name"},  # 未知のパラメータ
    ],
    ids=["51文字", "制御文字", "未知のパラメータ"],
)
def test_invalid_query_is_rejected(
    client: httpx2.Client, params: dict[str, str]
) -> None:
    assert_problem(client.get("/api/clubs", params=params), 422)


def test_query_of_50_chars_is_accepted(client: httpx2.Client) -> None:
    response = client.get("/api/clubs", params={"q": "あ" * 50})

    assert response.status_code == 200


# ---- 詳細 ----


def test_detail_returns_all_public_fields(client: httpx2.Client) -> None:
    response = client.get(f"/api/clubs/{PHOTO_CLUB}")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(PHOTO_CLUB),
        "name": "写真部",
        "description": (
            "学内外で撮影会を開き、写真展で作品を発表しています。\n"
            "初心者向けにカメラの貸し出しもあります。見学はいつでも歓迎です。"
        ),
        "icon_image_id": str(PHOTO_CLUB_ICON),
        "calendar_id": "c_cpsamplephoto0000@group.calendar.google.com",
        "x_username": "cp_sample_photo",
        "instagram_username": "cp.sample.photo",
        "youtube_handle": "@cp-sample-photo",
        "website_url": "https://example.com/photo-club",
        "photos": [
            {"position": i, "image_id": str(image_id)}
            for i, image_id in enumerate(PHOTO_CLUB_PHOTOS)
        ],
        "videos": [
            {"position": 0, "youtube_video_id": "cpSample001"},
            {"position": 1, "youtube_video_id": "cpSample002"},
        ],
    }


def test_detail_without_optional_fields(client: httpx2.Client) -> None:
    body = client.get(f"/api/clubs/{ESS}").json()

    assert body["calendar_id"] is None
    assert body["x_username"] is None
    assert body["website_url"] is None
    assert body["photos"] == []
    assert body["videos"] == []


@pytest.mark.parametrize(
    "club_id",
    [HIDDEN_CLUB, INCOMPLETE_CLUB, EMPTY_FRAME, UNKNOWN_CLUB, "not-a-uuid"],
    ids=["非公開", "アイコンなし", "作った直後の枠", "存在しない", "UUIDでない"],
)
def test_detail_of_non_public_club_is_not_found(
    client: httpx2.Client, club_id: object
) -> None:
    assert_problem(client.get(f"/api/clubs/{club_id}"), 404)


def test_unknown_route_is_problem(client: httpx2.Client) -> None:
    assert_problem(client.get("/api/no-such-route"), 404)
