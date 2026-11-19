"""DBを使うテストの共通の準備

テスト用DB(clubportal_test)にシード(db/seeds/dev.sql)を入れ直してから実行する
接続先は環境変数で受け取る(mise.tomlの[env]、mise run testで設定される)
"""

import shutil
from pathlib import Path

import psycopg
import pytest
from support import SEED_IMAGES, SEED_SQL, require_env


@pytest.fixture
def seeded_db() -> None:
    """テスト用DBの中身を消し、シードを入れ直す(マイグレーション用のユーザーで行う)"""
    admin_url = require_env("CLUBPORTAL_TEST_ADMIN_DATABASE_URL")
    with psycopg.connect(admin_url, autocommit=True) as conn:
        conn.execute(SEED_SQL.read_bytes())


@pytest.fixture(scope="session")
def database_url() -> str:
    """アプリが使う接続先(権限を絞ったユーザー)"""
    return require_env("CLUBPORTAL_TEST_DATABASE_URL")


@pytest.fixture(scope="session")
def image_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """シードの画像を置いた画像ディレクトリ"""
    directory = tmp_path_factory.mktemp("images")
    for image in SEED_IMAGES.glob("*.webp"):
        shutil.copy(image, directory)
    return directory
