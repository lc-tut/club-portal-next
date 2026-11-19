"""検索の正規化とエスケープ(要件定義の第7節)

検索語は保存時と同じく、前後の空白を除いてNFKC正規化し、小文字にする
ILIKEの特殊文字(%、_、\\)はエスケープしてから部分一致を取る
"""

import pytest
from clubportal.domain.search import (
    build_search_text,
    escape_like,
    normalize_for_search,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("写真", "写真"),
        ("  写真  ", "写真"),
        ("ESS", "ess"),
        ("ＥＳＳ", "ess"),  # 全角英字
        ("１００％", "100%"),  # 全角数字と記号
        ("ｶﾒﾗ", "カメラ"),  # 半角カナ
        ("Linux Club", "linux club"),
    ],
)
def test_normalize_for_search(raw: str, expected: str) -> None:
    assert normalize_for_search(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("写真", "写真"),
        ("100%", "100\\%"),
        ("a_b", "a\\_b"),
        ("back\\slash", "back\\\\slash"),
        ("%_\\", "\\%\\_\\\\"),
    ],
)
def test_escape_like(raw: str, expected: str) -> None:
    assert escape_like(raw) == expected


def test_build_search_text_joins_normalized_fields_with_newline() -> None:
    text = build_search_text(name="ＥＳＳ", name_reading="ess", description="英語")

    assert text == "ess\ness\n英語"


def test_build_search_text_skips_missing_fields() -> None:
    assert (
        build_search_text(name="写真部", name_reading=None, description=None)
        == "写真部"
    )
