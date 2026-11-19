"""テストの共通の値と関数(conftest.pyやテストからimportする)"""

import os
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SEED_SQL = REPO_ROOT / "db" / "seeds" / "dev.sql"
SEED_IMAGES = REPO_ROOT / "db" / "seeds" / "images"


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        pytest.fail(f"環境変数{name}がない、mise run testで実行する")
    return value
