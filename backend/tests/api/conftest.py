"""APIテストの共通の準備

APIテストはHTTP越しのブラックボックステストとして書く(要件定義の第6節)
既定ではアプリをプロセス内で動かし、環境変数CLUBPORTAL_API_BASE_URLを
設定すると起動中のサーバー(例:http://127.0.0.1:8000)に向けて実行する
起動中のサーバーに向けるときは、そのサーバーもテスト用DBとシードの画像を使っていること
"""

import os
from collections.abc import Iterator
from pathlib import Path

import httpx2
import pytest

BASE_URL_ENV = "CLUBPORTAL_API_BASE_URL"


@pytest.fixture
def client(
    seeded_db: None, database_url: str, image_dir: Path
) -> Iterator[httpx2.Client]:
    base_url = os.environ.get(BASE_URL_ENV)
    if base_url:
        with httpx2.Client(base_url=base_url) as remote:
            yield remote
        return

    # プロセス内で動かすときだけアプリを読み込む
    from fastapi.testclient import TestClient

    from clubportal.infrastructure.settings import Settings
    from clubportal.main import create_app

    settings = Settings(database_url=database_url, image_dir=image_dir)
    with TestClient(create_app(settings)) as local:
        yield local
