"""ユースケースが使う外部機能(ポート)

実装はinfrastructureに置き、main.pyで組み立てる
テストではフェイクに差し替えられる
"""

from typing import Protocol
from uuid import UUID

from clubportal.domain.club import Club, ClubImage


class ClubRepository(Protocol):
    def list_by_reading(self, contains: str | None = None) -> list[Club]:
        """読み仮名の文字コード順に返す(公開かどうかは問わない)

        containsを渡すと、検索用の文字列に部分一致するものだけを返す
        containsは正規化済みの値を渡す、エスケープはリポジトリが行う
        """
        ...

    def get(self, club_id: UUID) -> Club | None:
        """写真と動画も含めて返す"""
        ...

    def get_image(self, image_id: UUID) -> ClubImage | None: ...


class ImageStore(Protocol):
    def read(self, image_id: UUID) -> bytes | None:
        """画像のファイル(WebP)の中身を返す、なければNone"""
        ...
