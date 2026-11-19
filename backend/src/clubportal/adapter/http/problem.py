"""エラー応答(RFC 9457 Problem Details)

ドメインのエラーとHTTPのエラーを、application/problem+jsonの形にそろえて返す
入力の値そのものは応答に含めない
"""

from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

from clubportal.domain.errors import ClubNotFound, ImageNotFound, NotFoundError

MEDIA_TYPE = "application/problem+json"


class Problem(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str | None = None


def problem_responses(*statuses: int) -> dict[int | str, dict[str, object]]:
    """OpenAPIに書くエラー応答(application/problem+json)

    パラメータのあるルートには422も渡す(FastAPI既定の422の形を契約に残さないため)
    """
    schema = Problem.model_json_schema()
    return {
        status: {
            "description": HTTPStatus(status).phrase,
            "content": {MEDIA_TYPE: {"schema": schema}},
        }
        for status in statuses
    }


_NOT_FOUND_DETAILS: dict[type[NotFoundError], str] = {
    ClubNotFound: "サークルが見つからない",
    ImageNotFound: "画像が見つからない",
}


def problem_response(status: int, detail: str | None = None) -> JSONResponse:
    problem = Problem(title=HTTPStatus(status).phrase, status=status, detail=detail)
    return JSONResponse(
        problem.model_dump(exclude_none=True), status_code=status, media_type=MEDIA_TYPE
    )


def add_problem_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:
        return problem_response(404, _NOT_FOUND_DETAILS.get(type(exc)))

    @app.exception_handler(RequestValidationError)
    def handle_validation(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return problem_response(422, "入力の形式が正しくない")

    @app.exception_handler(HTTPException)
    def handle_http(request: Request, exc: HTTPException) -> JSONResponse:
        return problem_response(exc.status_code)
