import enum
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class ClubTag(str, enum.Enum):
    culture = "culture"
    sports = "sports"
    other = "other"


class Club(SQLModel, table=True):
    id: str = Field(primary_key=True, max_length=5)
    name: str
    short_description: str = Field(max_length=30)
    description_external: str
    description_internal: str
    tag: ClubTag
    icon_path: str
    cover_path: str
    calendar_embed_url: str | None = None
    youtube_url: str | None = None
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    images: list["ClubImage"] = Relationship(
        back_populates="club",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "ClubImage.sort_order"},
    )
    sns_links: list["ClubSnsLink"] = Relationship(
        back_populates="club",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "ClubSnsLink.sort_order"},
    )
    announcements: list["Announcement"] = Relationship(
        back_populates="club",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    admins: list["ClubAdmin"] = Relationship(
        back_populates="club",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ClubImage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    club_id: str = Field(foreign_key="club.id", index=True)
    image_path: str
    sort_order: int = Field(default=0)

    club: Club = Relationship(back_populates="images")


class ClubSnsLink(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    club_id: str = Field(foreign_key="club.id", index=True)
    url: str
    sort_order: int = Field(default=0)

    club: Club = Relationship(back_populates="sns_links")
