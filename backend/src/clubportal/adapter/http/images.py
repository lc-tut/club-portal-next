"""画像の配信(要件定義の第9節「画像のアップロード」の配信時の決まり)"""

from fastapi import APIRouter, Response

from clubportal.adapter.http.clubs import parse_id
from clubportal.adapter.http.problem import problem_responses
from clubportal.usecase.get_public_image import GetPublicImage

IMAGE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    # 画像として以外に解釈させない
    "Content-Security-Policy": "default-src 'none'; sandbox",
    # ほかのサイトから直接読み込ませない
    # (OGPを取りに来るbotはブラウザではないので影響しない)
    "Cross-Origin-Resource-Policy": "same-origin",
    # 非公開にしたときに長く残らないよう、キャッシュは短くする
    "Cache-Control": "public, max-age=60",
}


def create_images_router(get_public_image: GetPublicImage) -> APIRouter:
    router = APIRouter(tags=["images"])

    @router.get(
        "/api/images/{image_id}",
        response_class=Response,
        responses={
            200: {
                "content": {
                    "image/webp": {"schema": {"type": "string", "format": "binary"}}
                }
            },
            **problem_responses(404, 422),
        },
    )
    def get_image(image_id: str) -> Response:
        data = get_public_image.execute(parse_id(image_id))
        return Response(content=data, media_type="image/webp", headers=IMAGE_HEADERS)

    return router
