"""サークルのリポジトリ(PostgreSQLとの結合テスト)

アプリ用のユーザー(権限を絞ったもの)で接続し、シードを入れたテスト用DBに対して実行する
"""

from collections.abc import Iterator

import psycopg
import pytest
from seed_data import (
    BOARD_GAME,
    PHOTO_CLUB,
    PHOTO_CLUB_ICON,
    PHOTO_CLUB_PHOTOS,
    UNKNOWN_CLUB,
    UNKNOWN_IMAGE,
)
from sqlalchemy import Engine
from support import require_env

from clubportal.domain.club import ImageKind, Photo, Video
from clubportal.domain.search import build_search_text
from clubportal.infrastructure.postgres.club_repository import SqlClubRepository
from clubportal.infrastructure.postgres.database import create_db_engine


@pytest.fixture
def repository(seeded_db: None, database_url: str) -> Iterator[SqlClubRepository]:
    engine: Engine = create_db_engine(database_url)
    yield SqlClubRepository(engine)
    engine.dispose()


def test_list_orders_by_reading_in_code_point_order(
    repository: SqlClubRepository,
) -> None:
    readings = [club.name_reading for club in repository.list_by_reading()]

    # 英字→ひらがなの順、読み仮名のない枠は最後
    assert readings == [
        "ess",
        "linux club",
        "えんげきぶ",
        "けいおんがくさーくる",
        "さどうぶ",
        "しゃしんぶ",
        "じゅんびちゅうのどうこうかい",
        "ぼーどげーむどうこうかい",
        None,
    ]


def test_list_filters_by_search_text_regardless_of_public_state(
    repository: SqlClubRepository,
) -> None:
    clubs = repository.list_by_reading(contains="撮影")

    # 公開かどうかはユースケースで判定する、リポジトリは一致したものをすべて返す
    assert [club.name for club in clubs] == ["演劇部", "写真部", "準備中の同好会"]


@pytest.mark.parametrize(
    ("contains", "expected_ids"),
    [("%", [BOARD_GAME]), ("_", []), ("\\", [])],
)
def test_list_escapes_like_wildcards(
    repository: SqlClubRepository, contains: str, expected_ids: list[object]
) -> None:
    clubs = repository.list_by_reading(contains=contains)

    assert [club.id for club in clubs] == expected_ids


def test_get_returns_club_with_photos_and_videos(
    repository: SqlClubRepository,
) -> None:
    club = repository.get(PHOTO_CLUB)

    assert club is not None
    assert club.name == "写真部"
    assert club.icon_image_id == PHOTO_CLUB_ICON
    assert club.website_url == "https://example.com/photo-club"
    assert club.photos == tuple(
        Photo(position=i, image_id=image_id)
        for i, image_id in enumerate(PHOTO_CLUB_PHOTOS)
    )
    assert club.videos == (
        Video(position=0, youtube_video_id="cpSample001"),
        Video(position=1, youtube_video_id="cpSample002"),
    )


def test_get_unknown_returns_none(repository: SqlClubRepository) -> None:
    assert repository.get(UNKNOWN_CLUB) is None


def test_get_image(repository: SqlClubRepository) -> None:
    image = repository.get_image(PHOTO_CLUB_ICON)

    assert image is not None
    assert image.club_id == PHOTO_CLUB
    assert image.kind is ImageKind.ICON
    assert repository.get_image(UNKNOWN_IMAGE) is None


def test_seed_search_text_follows_app_rule(seeded_db: None) -> None:
    """シードのsearch_text(SQLで作ったもの)が、アプリの規則と同じになっている"""
    admin_url = require_env("CLUBPORTAL_TEST_ADMIN_DATABASE_URL")
    with psycopg.connect(admin_url) as conn:
        rows = conn.execute(
            "SELECT name, name_reading, description, search_text FROM clubs"
        ).fetchall()

    for name, reading, description, search_text in rows:
        assert search_text == build_search_text(name, reading, description)
