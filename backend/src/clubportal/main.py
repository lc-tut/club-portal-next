"""合成ルート(アプリを組み立てる唯一の場所)

各層の実装をここでつなぐ
DIコンテナは使わず、コンストラクタに依存を渡す
起動:uvicorn --factory clubportal.main:create_app
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute

from clubportal.adapter.http import health
from clubportal.adapter.http.clubs import create_clubs_router
from clubportal.adapter.http.images import create_images_router
from clubportal.adapter.http.problem import add_problem_handlers
from clubportal.infrastructure.postgres.club_repository import SqlClubRepository
from clubportal.infrastructure.postgres.database import create_db_engine
from clubportal.infrastructure.settings import Settings
from clubportal.infrastructure.storage.image_store import LocalImageStore
from clubportal.usecase.get_public_club import GetPublicClub
from clubportal.usecase.get_public_image import GetPublicImage
from clubportal.usecase.list_public_clubs import ListPublicClubs


def _operation_id(route: APIRoute) -> str:
    return route.name


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()

    # 外部機能の実装
    engine = create_db_engine(settings.database_url)
    clubs = SqlClubRepository(engine)
    images = LocalImageStore(settings.image_dir)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        engine.dispose()

    app = FastAPI(
        title="ClubPortal API",
        version="0.1.0",
        # APIの契約はapi/openapi.yamlに置く
        # 実行中のサーバーからはドキュメント画面とスキーマを配らない
        # (公開する入口を増やさないため)
        openapi_url=None,
        docs_url=None,
        redoc_url=None,
        # operationIdは関数名にする(生成するフロントの型で読みやすくするため)
        generate_unique_id_function=_operation_id,
        lifespan=lifespan,
    )
    add_problem_handlers(app)

    app.include_router(health.router)
    app.include_router(
        create_clubs_router(
            list_public_clubs=ListPublicClubs(clubs),
            get_public_club=GetPublicClub(clubs),
        )
    )
    app.include_router(create_images_router(GetPublicImage(clubs, images)))
    return app
