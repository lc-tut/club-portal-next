"""テーブル定義(SQLModel)

スキーマの正はdb/migrations/のSQL、ここはそれに合わせて書く
このクラスをAPIのスキーマやドメインの型と兼用しない(列を足したときにAPIへ漏れないように)
"""

from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class ClubRow(SQLModel, table=True):
    __tablename__ = "clubs"

    id: UUID = Field(primary_key=True)
    name: str | None = None
    name_reading: str | None = None
    description: str | None = None
    icon_image_id: UUID | None = None
    calendar_id: str | None = None
    x_username: str | None = None
    instagram_username: str | None = None
    youtube_handle: str | None = None
    website_url: str | None = None
    is_hidden: bool = False
    search_text: str = ""
    # DBの既定値(now())で入る
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClubImageRow(SQLModel, table=True):
    __tablename__ = "club_images"

    id: UUID = Field(primary_key=True)
    club_id: UUID
    kind: str
    width: int
    height: int
    byte_size: int
    sha256: str
    created_at: datetime | None = None


class ClubPhotoRow(SQLModel, table=True):
    __tablename__ = "club_photos"

    club_id: UUID = Field(primary_key=True)
    position: int = Field(primary_key=True)
    image_id: UUID


class ClubVideoRow(SQLModel, table=True):
    __tablename__ = "club_videos"

    club_id: UUID = Field(primary_key=True)
    position: int = Field(primary_key=True)
    youtube_video_id: str
