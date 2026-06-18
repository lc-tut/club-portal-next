from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Announcement(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    club_id: str = Field(foreign_key="club.id", index=True)
    title: str = Field(max_length=30)
    body: str
    calendar_embed_url: str | None = None
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    club: "Club" = Relationship(back_populates="announcements")
