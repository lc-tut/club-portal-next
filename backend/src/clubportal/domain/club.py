"""サークル"""

from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True)
class Photo:
    """活動の様子の写真(positionは0〜5)"""

    position: int
    image_id: UUID


@dataclass(frozen=True)
class Video:
    """活動の様子のYouTube動画(positionは0〜2、保存するのは動画IDだけ)"""

    position: int
    youtube_video_id: str


@dataclass(frozen=True)
class Club:
    """サークル

    枠を作った直後は名前などが空(None)で、編集者が入力していく
    """

    id: UUID
    name: str | None
    name_reading: str | None
    description: str | None
    icon_image_id: UUID | None
    is_hidden: bool
    calendar_id: str | None = None
    x_username: str | None = None
    instagram_username: str | None = None
    youtube_handle: str | None = None
    website_url: str | None = None
    photos: tuple[Photo, ...] = field(default=())
    videos: tuple[Video, ...] = field(default=())

    def is_public(self) -> bool:
        """公開条件(要件定義の第3節)

        サークル名、読み仮名、説明、アイコンがすべてあり、adminが非公開にしていない
        """
        has_required = (
            _has_text(self.name)
            and _has_text(self.name_reading)
            and _has_text(self.description)
            and self.icon_image_id is not None
        )
        return has_required and not self.is_hidden


def _has_text(value: str | None) -> bool:
    return value is not None and value.strip() != ""
