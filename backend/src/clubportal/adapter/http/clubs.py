"""公開中のサークルの一覧・検索・詳細"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from clubportal.adapter.http.problem import problem_responses
from clubportal.adapter.http.validation import (
    parse_canonical_uuid,
    reject_invisible_chars,
)
from clubportal.domain.club import Club
from clubportal.usecase.get_public_club import GetPublicClub
from clubportal.usecase.list_public_clubs import ListPublicClubs

# ---- 入力 ----


class ClubListQuery(BaseModel):
    # 未知のパラメータは拒否する(要件定義の第9節)
    model_config = ConfigDict(extra="forbid")

    # 検索語は50文字まで、制御文字や見えない文字は受け付けない
    q: Annotated[str, AfterValidator(reject_invisible_chars)] | None = Field(
        default=None, max_length=50
    )


# ---- 出力 ----


class ClubSummary(BaseModel):
    id: UUID
    name: str
    description: str
    icon_image_id: UUID


class ClubListResponse(BaseModel):
    items: list[ClubSummary]


class PhotoOut(BaseModel):
    position: int
    image_id: UUID


class VideoOut(BaseModel):
    position: int
    youtube_video_id: str


class ClubDetail(BaseModel):
    id: UUID
    name: str
    description: str
    icon_image_id: UUID
    calendar_id: str | None
    x_username: str | None
    instagram_username: str | None
    youtube_handle: str | None
    website_url: str | None
    photos: list[PhotoOut]
    videos: list[VideoOut]


def _required[T](value: T | None) -> T:
    # 公開中のサークルでは必須項目が必ずある(domainのis_publicで確かめ済み)
    if value is None:
        raise ValueError("公開中のサークルに必須項目がない")
    return value


def _summary(club: Club) -> ClubSummary:
    return ClubSummary(
        id=club.id,
        name=_required(club.name),
        description=_required(club.description),
        icon_image_id=_required(club.icon_image_id),
    )


def _detail(club: Club) -> ClubDetail:
    return ClubDetail(
        id=club.id,
        name=_required(club.name),
        description=_required(club.description),
        icon_image_id=_required(club.icon_image_id),
        calendar_id=club.calendar_id,
        x_username=club.x_username,
        instagram_username=club.instagram_username,
        youtube_handle=club.youtube_handle,
        website_url=club.website_url,
        photos=[
            PhotoOut(position=p.position, image_id=p.image_id) for p in club.photos
        ],
        videos=[
            VideoOut(position=v.position, youtube_video_id=v.youtube_video_id)
            for v in club.videos
        ],
    )


def parse_id(value: str) -> UUID:
    """正規の形のUUIDでないIDは、存在しないものと同じく404にする"""
    parsed = parse_canonical_uuid(value)
    if parsed is None:
        raise HTTPException(status_code=404)
    return parsed


def create_clubs_router(
    list_public_clubs: ListPublicClubs, get_public_club: GetPublicClub
) -> APIRouter:
    router = APIRouter(tags=["clubs"])

    @router.get("/api/clubs", responses=problem_responses(422))
    def list_clubs(query: Annotated[ClubListQuery, Query()]) -> ClubListResponse:
        clubs = list_public_clubs.execute(query.q)
        return ClubListResponse(items=[_summary(club) for club in clubs])

    @router.get("/api/clubs/{club_id}", responses=problem_responses(404, 422))
    def get_club(club_id: str) -> ClubDetail:
        return _detail(get_public_club.execute(parse_id(club_id)))

    return router
