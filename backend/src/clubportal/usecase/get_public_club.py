"""公開中のサークルの詳細"""

from uuid import UUID

from clubportal.domain.club import Club
from clubportal.domain.errors import ClubNotFound
from clubportal.usecase.ports import ClubRepository


class GetPublicClub:
    def __init__(self, clubs: ClubRepository) -> None:
        self._clubs = clubs

    def execute(self, club_id: UUID) -> Club:
        """公開条件を満たさないサークルは、ないものとして扱う"""
        club = self._clubs.get(club_id)
        if club is None or not club.is_public():
            raise ClubNotFound
        return club
