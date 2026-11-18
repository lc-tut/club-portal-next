"""ヘルスチェック

アプリのプロセスが応答できるかだけを返す(DBには触れない)
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: Literal["ok"]


@router.get("/api/health", tags=["health"])
def get_health() -> HealthResponse:
    return HealthResponse(status="ok")
