# バックエンドの本番用イメージ
# 依存を入れる段とアプリを動かす段を分け、動かす段にはuvもソースも入れない

FROM python:3.15.2-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1 \
    UV_PYTHON_DOWNLOADS=0
WORKDIR /app

# 依存だけを先に入れる(ソースを変えても、この層はキャッシュが効く)
# BuildKitのない環境でもビルドできるよう、RUN --mountは使わない
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-editable

COPY src ./src
RUN uv sync --locked --no-editable


FROM python:3.15.2-slim
# OSのパッケージをセキュリティ修正まで上げる
# アプリはpipを使わないので消す(pipが内部に持つライブラリも脆弱性スキャンの対象になるため)
# rootでは動かさない
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip uninstall --yes pip \
    && useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
USER 10001
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2)"]
CMD ["uvicorn", "clubportal.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header"]
