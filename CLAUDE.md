# ClubPortal

東京工科大学のサークル一覧アプリ。LinuxClubが開発し、後輩へ引き継いで運用する。

この文書は下書き。P0で実際のコマンドと構成が決まったら、「コマンド」の節を埋めて確定させる。

## まず読む文書

| 文書 | 役割 |
| --- | --- |
| `docs/requirements.md` | 仕様の正。決まったことはここに書き戻す。フェーズの進捗(第11節の「状態」)もここで管理する |
| `docs/design.md` | 画面ごとの要点とデザイントークン。見た目の正は文書内のデザイン案(リンク) |
| `docs/prompts/` | フェーズごとの作業指示 |

## 技術スタック

- バックエンド:Python、FastAPI、SQLModel(テーブル定義のみ)、uv
- DB:PostgreSQL。マイグレーションはdbmate(素のSQL)
- フロント:Next.js(App Router)、pnpm。表示だけを担う
- テスト:pytest、vitest、Storybook
- 環境:mise(開発ツールとタスク)、Docker Compose(開発ではDBのみ、本番は全体)、Caddy
- 秘密情報:SOPS+age

## コマンド

P0で確定させる。予定しているタスク:`mise run dev`、`mise run test`、`mise run lint`、`mise run migrate`、`mise run gen-api`。

## 守ること

- 呼び名:画面と文章では「サークル」、コード・DB・APIでは`club`。
- 個人情報:メールアドレスと氏名をDB、ログ、テストデータ、フィクスチャに平文で入れない。編集者の識別はHMAC-SHA256の値だけで行う(要件定義の第5節)。
- 秘密情報:`secrets/`には`.sops.yaml`と`*.enc`だけを置く。平文の秘密情報やメールアドレスはコミットしない。必要な変数名と例は`.example`ファイルに書く。
- 層の依存:`domain`→`usecase`→`adapter`/`infrastructure`の内向き一方向。`domain`はFastAPI、SQLModel、Pydanticをimportしない。SQLModelのモデルをAPIのスキーマに使わない。
- API:`api/openapi.yaml`が契約の正。APIを変えたら更新し、`frontend/src/lib/api/`を再生成する。
- 入力:外部から来るものはすべて`adapter/http`で検証してから内側へ渡す。任意のURLやHTMLを保存しない(要件定義の第3節の入力制約に従う)。
- フロント:`dangerouslySetInnerHTML`禁止、外部CDNの読み込み禁止、色や余白はCSS変数のトークン経由。
- 機能を増やさない:要件定義の第2節で削ったものを、相談なしに戻さない。
- 表記:日本語の文書・コメント・PRでは、日本語と英数字の間にスペースを入れない、丸カッコは半角、句読点の後ろにスペースを入れない。

## 進め方

- フェーズ(要件定義の第11節)ごとに進め、完了条件を満たしたら止まって報告する。合意なしに次のフェーズへ進まない。
- TDD:受け入れ条件をテストにし、失敗を確かめてから実装する。コミットは`test:`→`feat:`→`refactor:`の順に分ける。
- 新しいルートを足したら、権限表テストに行を足す。新しい部品や状態を足したら、storyを足す。
- 要件定義に書かれていない判断は、選択肢と推奨を出して止まる。

## Claude Codeの道具(`.claude/`)

| 種類 | 名前 | 使いどころ |
| --- | --- | --- |
| スキル | `/phase P1` | フェーズを1つ、計画→TDD→報告の順で進める。完了条件で止まる |
| スキル | `/check` | lint・型・依存の向き・テスト・OpenAPIの差分をまとめて実行し、失敗だけを報告する |
| スキル | `/privacy-check` | 個人情報や秘密情報が平文で入っていないかを点検する。PRやリリースの前に使う |
| サブエージェント | design-reviewer | UIを作った・直した後に、`docs/design.md`との食い違いを指摘だけ返す |
| サブエージェント | security-reviewer | 認証・認可・入力・画像・秘密情報に触れた後に、要件定義の第5節と第9節に照らして指摘だけ返す |
| hook | protect-files | `.env`、`secrets/`、`.git/`、ロックファイル、`api/openapi.yaml`、生成したAPIクライアントの直接編集を止める |
| hook | check-commit | `git commit`の前に、ステージした差分のメールアドレス・学籍番号・秘密鍵らしきものを検出して止める |
| hook | format | 編集したファイルにruffまたはPrettierをかける(入っていなければ何もしない) |

権限:push、`gh repo`・`gh secret`・`gh api`、`sops`、本番用Composeの操作は実行前に確認を取る。force push、`rm -rf`、`.env`と`secrets/`の平文ファイルの読み取りは禁止。hookはpython3を使う。

## デプロイ

未定(ホスティング先とドメインが未決)。手元からの本番デプロイはしない。
