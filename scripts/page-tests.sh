#!/usr/bin/env bash
# ページのテスト(frontend/tests/pages)を流す
# テスト用DBにシードを入れ、backendとnext start(本番と同じビルド)を起動してから実行し、最後に止める
# mise run test(test:pages)から呼ぶ、環境変数はmise.tomlの[env]から受け取る
# 引数はvitestに渡す(例:mise exec -- scripts/page-tests.sh tests/pages/list.test.ts)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=18000
FRONTEND_PORT=13000
IMAGE_DIR="$(mktemp -d)"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  rm -r "$IMAGE_DIR"
}
trap cleanup EXIT

wait_for() {
  for _ in $(seq 1 60); do
    if curl -fs -o /dev/null "$1"; then
      return 0
    fi
    sleep 1
  done
  echo "起動しなかった: $1" >&2
  return 1
}

cd "$ROOT"

echo "テスト用DBにシードを入れる"
docker compose -f compose.dev.yaml exec -T db \
  psql -v ON_ERROR_STOP=1 -q -U clubportal -d clubportal_test < db/seeds/dev.sql
cp db/seeds/images/*.webp "$IMAGE_DIR"/

echo "フロントを本番と同じ形でビルドする"
pnpm --dir frontend exec next build > /dev/null

echo "backendとフロントを起動する"
CLUBPORTAL_DATABASE_URL="$CLUBPORTAL_TEST_DATABASE_URL" \
CLUBPORTAL_IMAGE_DIR="$IMAGE_DIR" \
  backend/.venv/bin/uvicorn --factory clubportal.main:create_app \
  --host 127.0.0.1 --port "$BACKEND_PORT" --log-level warning &
PIDS+=($!)

export CLUBPORTAL_PUBLIC_ORIGIN="http://localhost:$FRONTEND_PORT"
(
  cd frontend
  CLUBPORTAL_API_INTERNAL_URL="http://127.0.0.1:$BACKEND_PORT" \
    exec node_modules/.bin/next start -H 127.0.0.1 -p "$FRONTEND_PORT"
) > /dev/null &
PIDS+=($!)

wait_for "http://127.0.0.1:$BACKEND_PORT/api/health"
wait_for "http://127.0.0.1:$FRONTEND_PORT/"

echo "ページのテストを流す"
PAGE_TEST_BASE_URL="http://127.0.0.1:$FRONTEND_PORT" \
  pnpm --dir frontend exec vitest run --project pages "$@"
