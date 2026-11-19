"""公開画面のユースケース(ポートをフェイクに差し替えた単体テスト)"""

from dataclasses import dataclass, field, replace
from uuid import UUID

import pytest

from clubportal.domain.club import Club, ClubImage, ImageKind, Photo
from clubportal.domain.errors import ClubNotFound, ImageNotFound
from clubportal.usecase.get_public_club import GetPublicClub
from clubportal.usecase.get_public_image import GetPublicImage
from clubportal.usecase.list_public_clubs import ListPublicClubs

CLUB_ID = UUID("00000000-0000-4000-8000-000000000001")
ICON = UUID("10000000-0000-4000-8000-000000000001")
PHOTO = UUID("20000000-0000-4000-8000-000000000001")
OLD_ICON = UUID("10000000-0000-4000-8000-000000000099")

PUBLIC = Club(
    id=CLUB_ID,
    name="写真部",
    name_reading="しゃしんぶ",
    description="撮影会を開いています",
    icon_image_id=ICON,
    is_hidden=False,
    photos=(Photo(position=0, image_id=PHOTO),),
)
HIDDEN = replace(
    PUBLIC, id=UUID("00000000-0000-4000-8000-000000000007"), is_hidden=True
)


@dataclass
class FakeClubRepository:
    clubs: list[Club]
    images: dict[UUID, ClubImage] = field(default_factory=dict)
    received_contains: list[str | None] = field(default_factory=list)

    def list_by_reading(self, contains: str | None = None) -> list[Club]:
        self.received_contains.append(contains)
        return list(self.clubs)

    def get(self, club_id: UUID) -> Club | None:
        return next((c for c in self.clubs if c.id == club_id), None)

    def get_image(self, image_id: UUID) -> ClubImage | None:
        return self.images.get(image_id)


@dataclass
class FakeImageStore:
    files: dict[UUID, bytes]

    def read(self, image_id: UUID) -> bytes | None:
        return self.files.get(image_id)


# ---- 一覧と検索 ----


def test_list_returns_only_public_clubs() -> None:
    repo = FakeClubRepository(clubs=[PUBLIC, HIDDEN])

    assert ListPublicClubs(repo).execute() == [PUBLIC]


@pytest.mark.parametrize(
    ("query", "expected_contains"),
    [
        (None, None),
        ("", None),
        ("   ", None),
        ("  ＥＳＳ ", "ess"),
    ],
    ids=["なし", "空文字", "空白だけ", "正規化する"],
)
def test_list_passes_normalized_query(
    query: str | None, expected_contains: str | None
) -> None:
    repo = FakeClubRepository(clubs=[])

    ListPublicClubs(repo).execute(query)

    assert repo.received_contains == [expected_contains]


# ---- 詳細 ----


def test_get_public_club() -> None:
    repo = FakeClubRepository(clubs=[PUBLIC])

    assert GetPublicClub(repo).execute(CLUB_ID) == PUBLIC


@pytest.mark.parametrize("club_id", [HIDDEN.id, UUID(int=0)], ids=["非公開", "なし"])
def test_get_non_public_club_raises_not_found(club_id: UUID) -> None:
    repo = FakeClubRepository(clubs=[PUBLIC, HIDDEN])

    with pytest.raises(ClubNotFound):
        GetPublicClub(repo).execute(club_id)


# ---- 画像 ----


def _image(image_id: UUID, club_id: UUID = CLUB_ID) -> ClubImage:
    return ClubImage(id=image_id, club_id=club_id, kind=ImageKind.ICON)


def _image_usecase(
    clubs: list[Club], image_ids: list[tuple[UUID, UUID]], files: dict[UUID, bytes]
) -> GetPublicImage:
    images = {image_id: _image(image_id, club_id) for image_id, club_id in image_ids}
    return GetPublicImage(FakeClubRepository(clubs, images), FakeImageStore(files))


@pytest.mark.parametrize("image_id", [ICON, PHOTO], ids=["アイコン", "写真"])
def test_get_public_image(image_id: UUID) -> None:
    usecase = _image_usecase([PUBLIC], [(image_id, CLUB_ID)], {image_id: b"webp"})

    assert usecase.execute(image_id) == b"webp"


@pytest.mark.parametrize(
    ("clubs", "image_ids", "files", "image_id"),
    [
        ([PUBLIC], [], {ICON: b"webp"}, ICON),
        ([HIDDEN], [(ICON, HIDDEN.id)], {ICON: b"webp"}, ICON),
        ([PUBLIC], [(OLD_ICON, CLUB_ID)], {OLD_ICON: b"webp"}, OLD_ICON),
        ([PUBLIC], [(ICON, CLUB_ID)], {}, ICON),
    ],
    ids=[
        "画像の行がない",
        "非公開のサークル",
        "今は使っていない画像",
        "ファイルがない",
    ],
)
def test_get_image_raises_not_found(
    clubs: list[Club],
    image_ids: list[tuple[UUID, UUID]],
    files: dict[UUID, bytes],
    image_id: UUID,
) -> None:
    with pytest.raises(ImageNotFound):
        _image_usecase(clubs, image_ids, files).execute(image_id)
