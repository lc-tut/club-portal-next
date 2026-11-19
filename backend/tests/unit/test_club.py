"""公開条件(要件定義の第3節)

サークル名、読み仮名、説明、アイコンがすべてあり、adminが非公開にしていなければ公開する
"""

from dataclasses import replace
from uuid import UUID

import pytest

from clubportal.domain.club import Club, Photo

ICON = UUID("10000000-0000-4000-8000-000000000001")
PHOTO = UUID("20000000-0000-4000-8000-000000000001")

COMPLETE = Club(
    id=UUID("00000000-0000-4000-8000-000000000001"),
    name="写真部",
    name_reading="しゃしんぶ",
    description="撮影会を開いています",
    icon_image_id=ICON,
    is_hidden=False,
)


@pytest.mark.parametrize(
    ("changes", "expected"),
    [
        ({}, True),
        ({"name": None}, False),
        ({"name_reading": None}, False),
        ({"description": None}, False),
        ({"icon_image_id": None}, False),
        ({"name": "  "}, False),
        ({"description": ""}, False),
        ({"is_hidden": True}, False),
        ({"name": None, "is_hidden": True}, False),
    ],
    ids=[
        "すべてあり",
        "名前なし",
        "読み仮名なし",
        "説明なし",
        "アイコンなし",
        "名前が空白だけ",
        "説明が空文字",
        "adminが非公開",
        "名前なしかつ非公開",
    ],
)
def test_is_public(changes: dict[str, object], expected: bool) -> None:
    club = replace(COMPLETE, **changes)  # type: ignore[arg-type]

    assert club.is_public() is expected


def test_new_frame_is_not_public() -> None:
    frame = Club(
        id=UUID("00000000-0000-4000-8000-000000000009"),
        name=None,
        name_reading=None,
        description=None,
        icon_image_id=None,
        is_hidden=False,
    )

    assert frame.is_public() is False


@pytest.mark.parametrize(
    ("image_id", "expected"),
    [
        (ICON, True),
        (PHOTO, True),
        (UUID("10000000-0000-4000-8000-0000000000ff"), False),
    ],
    ids=["アイコン", "写真", "使っていない画像"],
)
def test_uses_image(image_id: UUID, expected: bool) -> None:
    """今使っている画像(アイコンと写真)だけを配る、差し替えや削除で外れた画像は配らない"""
    club = replace(COMPLETE, photos=(Photo(position=0, image_id=PHOTO),))

    assert club.uses_image(image_id) is expected
