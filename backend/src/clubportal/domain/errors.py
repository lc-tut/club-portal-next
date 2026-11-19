"""ドメインのエラー

内側の層はここで定義した例外だけを投げ、HTTP層でステータスコードに対応づける
"""


class DomainError(Exception):
    """ドメインのエラーの基底"""


class NotFoundError(DomainError):
    """対象がない、または見せてはいけない(どちらも同じく404にする)"""


class ClubNotFound(NotFoundError):
    pass


class ImageNotFound(NotFoundError):
    pass
