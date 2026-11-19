"""画像のファイル(usecase/ports.pyのImageStoreの実装)

画像はDockerボリュームに {id}.webp として置く、パスはIDから決めるのでDBには持たない
"""

from pathlib import Path
from uuid import UUID


class LocalImageStore:
    def __init__(self, base_dir: Path) -> None:
        self._base_dir = base_dir

    def read(self, image_id: UUID) -> bytes | None:
        # UUIDの文字列だけでファイル名を作るので、ディレクトリの外は指せない
        path = self._base_dir / f"{image_id}.webp"
        if not path.is_file():
            return None
        return path.read_bytes()
