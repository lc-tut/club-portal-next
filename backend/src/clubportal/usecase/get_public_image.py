"""公開中のサークルの画像

本人に非公開のサークルの画像を見せる処理はP2で足す
"""

from uuid import UUID

from clubportal.domain.errors import ImageNotFound
from clubportal.usecase.ports import ClubRepository, ImageStore


class GetPublicImage:
    def __init__(self, clubs: ClubRepository, images: ImageStore) -> None:
        self._clubs = clubs
        self._images = images

    def execute(self, image_id: UUID) -> bytes:
        """公開中のサークルが今使っている画像だけを返す、それ以外はないものとして扱う"""
        image = self._clubs.get_image(image_id)
        if image is None:
            raise ImageNotFound
        club = self._clubs.get(image.club_id)
        if club is None or not club.is_public() or not club.uses_image(image_id):
            raise ImageNotFound
        data = self._images.read(image_id)
        if data is None:
            raise ImageNotFound
        return data
