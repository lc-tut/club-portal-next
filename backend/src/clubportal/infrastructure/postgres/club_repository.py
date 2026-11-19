"""サークルのリポジトリ(usecase/ports.pyのClubRepositoryの実装)"""

from uuid import UUID

from sqlalchemy import Engine
from sqlmodel import Session, col, select

from clubportal.domain.club import Club, ClubImage, ImageKind, Photo, Video
from clubportal.domain.search import escape_like
from clubportal.infrastructure.postgres.tables import (
    ClubImageRow,
    ClubPhotoRow,
    ClubRow,
    ClubVideoRow,
)


class SqlClubRepository:
    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def list_by_reading(self, contains: str | None = None) -> list[Club]:
        statement = select(ClubRow)
        if contains:
            pattern = f"%{escape_like(contains)}%"
            statement = statement.where(
                col(ClubRow.search_text).ilike(pattern, escape="\\")
            )
        # 文字コード順(英字→ひらがな)、読み仮名のない枠は最後
        statement = statement.order_by(
            col(ClubRow.name_reading).collate("C").asc().nulls_last()
        )
        with Session(self._engine) as session:
            return [_to_club(row) for row in session.exec(statement)]

    def get(self, club_id: UUID) -> Club | None:
        with Session(self._engine) as session:
            row = session.get(ClubRow, club_id)
            if row is None:
                return None
            photos = session.exec(
                select(ClubPhotoRow)
                .where(ClubPhotoRow.club_id == club_id)
                .order_by(col(ClubPhotoRow.position))
            )
            videos = session.exec(
                select(ClubVideoRow)
                .where(ClubVideoRow.club_id == club_id)
                .order_by(col(ClubVideoRow.position))
            )
            return _to_club(
                row,
                photos=tuple(Photo(p.position, p.image_id) for p in photos),
                videos=tuple(Video(v.position, v.youtube_video_id) for v in videos),
            )

    def get_image(self, image_id: UUID) -> ClubImage | None:
        with Session(self._engine) as session:
            row = session.get(ClubImageRow, image_id)
            if row is None:
                return None
            return ClubImage(id=row.id, club_id=row.club_id, kind=ImageKind(row.kind))


def _to_club(
    row: ClubRow,
    photos: tuple[Photo, ...] = (),
    videos: tuple[Video, ...] = (),
) -> Club:
    return Club(
        id=row.id,
        name=row.name,
        name_reading=row.name_reading,
        description=row.description,
        icon_image_id=row.icon_image_id,
        is_hidden=row.is_hidden,
        calendar_id=row.calendar_id,
        x_username=row.x_username,
        instagram_username=row.instagram_username,
        youtube_handle=row.youtube_handle,
        website_url=row.website_url,
        photos=photos,
        videos=videos,
    )
