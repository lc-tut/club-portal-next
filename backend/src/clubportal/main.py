"""合成ルート(アプリを組み立てる唯一の場所)

各層の実装をここでつなぐ
DIコンテナは使わず、コンストラクタに依存を渡す
起動:uvicorn clubportal.main:app
"""

from fastapi import FastAPI

from clubportal.adapter.http import health


def create_app() -> FastAPI:
    app = FastAPI(
        title="ClubPortal API",
        version="0.1.0",
        # APIの契約はapi/openapi.yamlに置く
        # 実行中のサーバーからはドキュメント画面とスキーマを配らない
        # (公開する入口を増やさないため)
        openapi_url=None,
        docs_url=None,
        redoc_url=None,
    )
    app.include_router(health.router)
    return app


app = create_app()
