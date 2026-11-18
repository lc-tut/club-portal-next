---
name: check
description: ClubPortalの静的検査・型検査・依存の向き・テスト・OpenAPIの差分をまとめて実行し、失敗だけを原因と直し方つきで報告する。コードを変えた区切りごとに使う。
allowed-tools: Bash(mise run lint) Bash(mise run lint *) Bash(mise run test) Bash(mise run test *) Bash(mise run gen-api) Bash(git diff *) Bash(git status *)
---

# まとめて検査する

次を順に実行する。途中で失敗しても最後まで実行し、結果をまとめて報告する。

1. `mise run lint`:ruff、mypy(`--strict`)、import-linter、ESLint、`tsc --noEmit`
2. `mise run test`:pytest、vitest(storyのテストを含む)
3. `mise run gen-api`のあとに`git diff --exit-code -- api/openapi.yaml frontend/src/lib/api`:実装と契約のずれ

報告のしかた:

- すべて通ったら「すべて通った」と一言だけ書く。
- 失敗があれば、失敗ごとに「どこで」「原因」「直し方」を書く。
- 修正はしない。直すかどうかは利用者の指示を待つ。ただし`/phase`の途中で呼ばれた場合は、そのフェーズの作業として直してよい。
