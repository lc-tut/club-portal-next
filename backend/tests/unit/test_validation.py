"""入力の検証で共通に使う関数"""

from uuid import UUID

import pytest

from clubportal.adapter.http.validation import (
    parse_canonical_uuid,
    reject_invisible_chars,
)

CANONICAL = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (CANONICAL, UUID(CANONICAL)),
        (CANONICAL.upper(), None),
        (CANONICAL.replace("-", ""), None),
        (f"{{{CANONICAL}}}", None),
        (f"urn:uuid:{CANONICAL}", None),
        (CANONICAL + " ", None),
        ("not-a-uuid", None),
    ],
    ids=[
        "正規の形",
        "大文字",
        "ハイフンなし",
        "波かっこ",
        "urn",
        "後ろに空白",
        "UUIDでない",
    ],
)
def test_parse_canonical_uuid(value: str, expected: UUID | None) -> None:
    assert parse_canonical_uuid(value) == expected


@pytest.mark.parametrize(
    "value",
    ["写真部", "Linux Club", "100%", "ＥＳＳ", "撮影会 見学"],
)
def test_visible_text_is_accepted(value: str) -> None:
    assert reject_invisible_chars(value) == value


@pytest.mark.parametrize(
    "value",
    ["写真\n部", "写真\x00部", "写真‮部", "写真⁦部", "写真​部", "写真 部", "写真 部"],
    ids=["改行", "NUL", "右から左", "方向の分離", "ゼロ幅", "行区切り", "段落区切り"],
)
def test_invisible_chars_are_rejected(value: str) -> None:
    with pytest.raises(ValueError, match="見えない文字"):
        reject_invisible_chars(value)
