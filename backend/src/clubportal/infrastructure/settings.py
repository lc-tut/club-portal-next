"""アプリの設定(環境変数から読む)

秘密情報を含む値は、本番ではDocker secretsのファイルから読む(P5で足す)
"""

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    # SQLAlchemyの形式(postgresql+psycopg://...)、アプリ用のユーザーで接続する
    database_url: str
    # 画像のファイル({id}.webp)を置くディレクトリ
    image_dir: Path

    @classmethod
    def from_env(cls) -> Settings:
        return cls(
            database_url=_require("CLUBPORTAL_DATABASE_URL"),
            image_dir=Path(_require("CLUBPORTAL_IMAGE_DIR")),
        )


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"環境変数{name}が設定されていない")
    return value
