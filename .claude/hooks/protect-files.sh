#!/usr/bin/env bash
# Edit/Writeの直前に呼ばれ、手で書き換えてはいけないファイルへの書き込みを止める。
# 終了コード2で止めると、標準エラーの文がClaudeに理由として伝わる。
set -u

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Blocked: hookの入力を読めませんでした。python3が使えるか確認してください。" >&2
  exit 2
fi

FILE_PATH="${FILE_PATH//\\//}"
REL="${FILE_PATH#"${CLAUDE_PROJECT_DIR:-}"/}"

block() {
  echo "Blocked: ${REL} は直接編集できません。$1" >&2
  exit 2
}

case "$REL" in
  .env.example|*/.env.example)
    ;;
  .env|.env.*|*/.env|*/.env.*)
    block "秘密情報のファイルです。必要な変数名と例は.env.exampleに書いてください。" ;;
  secrets/.sops.yaml)
    ;;
  secrets/*)
    block "秘密情報はsopsコマンドで編集します(実行前に利用者の確認が必要)。平文のファイルは置きません。" ;;
  .git/*|*/.git/*)
    block "gitの内部ファイルです。" ;;
  uv.lock|*/uv.lock)
    block "uvのコマンド(uv add / uv lock)で更新してください。" ;;
  pnpm-lock.yaml|*/pnpm-lock.yaml)
    block "pnpmのコマンド(pnpm add / pnpm install)で更新してください。" ;;
  api/openapi.yaml)
    block "FastAPIの実装を変えてからmise run gen-apiで生成してください。" ;;
  frontend/src/lib/api/*)
    block "openapi.yamlからの生成物です。mise run gen-apiで生成してください。" ;;
esac

exit 0
