"""入力の検証で共通に使う関数(要件定義の第3節、第9節)"""

import re
import unicodedata
from uuid import UUID

# 制御文字(Cc)、書式文字(Cf:双方向制御やゼロ幅文字など)、行区切り(Zl)、段落区切り(Zp)
# 表示の偽装に使えるので、外から来る文字列には入れさせない
_INVISIBLE_CATEGORIES = {"Cc", "Cf", "Zl", "Zp"}

# 正規の形のUUID(小文字、ハイフンつき36文字)
_CANONICAL_UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


def reject_invisible_chars(value: str) -> str:
    """見えない文字を含んでいればValueErrorにする(Pydanticのバリデータから使う)"""
    if any(unicodedata.category(char) in _INVISIBLE_CATEGORIES for char in value):
        raise ValueError("制御文字や見えない文字は使えない")
    return value


def parse_canonical_uuid(value: str) -> UUID | None:
    """正規の形のUUIDだけを受け付ける

    大文字やハイフンなしなどの表記揺れを同じものとして扱わない
    (同じ内容が別のURLで出たり、閲覧数が割れたりしないように)
    """
    if not _CANONICAL_UUID.fullmatch(value):
        return None
    return UUID(value)
