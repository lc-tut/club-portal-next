#!/usr/bin/env bash
# Edit/Writeの直後に呼ばれ、編集したファイルにフォーマッタをかける。
# フォーマッタがまだ入っていないとき(P0の途中など)は何もしない。失敗しても作業は止めない。
set -u

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null) || exit 0
[ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ] || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-.}"
REL="${FILE_PATH#"$ROOT"/}"

run() {
  if command -v mise >/dev/null 2>&1; then
    mise exec -- "$@"
  else
    "$@"
  fi
}

case "$REL" in
  backend/*.py)
    if [ -f "$ROOT/backend/pyproject.toml" ]; then
      (cd "$ROOT/backend" && run uv run --quiet ruff format "$FILE_PATH" >/dev/null 2>&1 \
        && run uv run --quiet ruff check --fix --quiet "$FILE_PATH" >/dev/null 2>&1)
    fi
    ;;
  frontend/*.ts|frontend/*.tsx|frontend/*.js|frontend/*.jsx|frontend/*.mjs|frontend/*.cjs|frontend/*.css|frontend/*.json)
    if [ -d "$ROOT/frontend/node_modules" ]; then
      (cd "$ROOT/frontend" && run pnpm exec prettier --write "$FILE_PATH" >/dev/null 2>&1)
    fi
    ;;
esac

exit 0
