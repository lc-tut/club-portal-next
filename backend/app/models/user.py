from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    google_sub: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    name: str
    is_superadmin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    club_admins: list["ClubAdmin"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ClubAdmin(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    club_id: str = Field(foreign_key="club.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="club_admins")
    club: "Club" = Relationship(back_populates="admins")
