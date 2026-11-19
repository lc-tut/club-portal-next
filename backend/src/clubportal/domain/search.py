"""検索の規則(要件定義の第2節、第7節)

検索エンジンは使わず、正規化した文字列にILIKEで部分一致を取る
保存する検索用の文字列(clubs.search_text)と検索語は、同じ規則で正規化する
"""

import unicodedata

# 名前、読み仮名、説明をつなぐ区切り
# 検索語には改行を入れられないので、項目をまたいで一致することはない
SEPARATOR = "\n"


def normalize_for_search(text: str) -> str:
    """前後の空白を除き、NFKC正規化して小文字にする"""
    return unicodedata.normalize("NFKC", text).strip().lower()


def escape_like(text: str) -> str:
    """ILIKEの特殊文字(\\、%、_)をエスケープする(ESCAPE '\\' と組み合わせて使う)"""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def build_search_text(
    name: str | None, name_reading: str | None, description: str | None
) -> str:
    """検索用の文字列を作る(ない項目は飛ばす)"""
    parts = [name, name_reading, description]
    return SEPARATOR.join(normalize_for_search(p) for p in parts if p is not None)
