"""公開中のサークルの一覧と検索"""

from clubportal.domain.club import Club
from clubportal.domain.search import normalize_for_search
from clubportal.usecase.ports import ClubRepository


class ListPublicClubs:
    def __init__(self, clubs: ClubRepository) -> None:
        self._clubs = clubs

    def execute(self, query: str | None = None) -> list[Club]:
        """公開中のサークルを読み仮名順に返す

        queryがあれば名前、読み仮名、説明に部分一致するものだけにする
        空白だけのqueryは、ないものとして全件を返す
        """
        normalized = normalize_for_search(query) if query is not None else ""
        found = self._clubs.list_by_reading(contains=normalized or None)
        return [club for club in found if club.is_public()]
