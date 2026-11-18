# ClubPortal要件定義・設計

最終更新:2026-11-18

この文書は仕様の正とする。実装中に決まったことは、この文書に書き戻す。

- 画面デザイン案(見た目の正):https://claude.ai/artifact/6zyXnBMFkbhcQioYxZddgG
- 画面ごとの要点:[design.md](design.md)

## 1. 方針

ClubPortalは「後輩が1人で引き継げる最小の機能」と「過剰なほど厳格なセキュリティ」を両立させる。機能を足すかどうかは、次の3つで判断する。

- Pythonを学んだばかりの後輩が、1人で読んで直せるか。
- その機能がなくても、要件(サークル紹介、一覧と検索、編集、引き継ぎ、admin)を満たせないか。
- 新しい外部サービス、常駐プロセス、運用作業が増えないか。

用語:画面と文章では「サークル」、コード・DB・APIでは`club`に統一する(例:`clubs`テーブル、`/api/clubs`)。

前提:

- リポジトリは`lc-tut/club-portal-next`。既存の同名リポジトリは`archive-club-portal-next`にリネームしてからアーカイブし、空いた名前で新規作成する。
- 最初のIdPはGoogle(OIDC)とする。
- 既存のCirclePortal系リポジトリは参照しない。個人情報の扱いだけ`lc-tut/microservices-terraform`の`documents/terraform/03-member-management.md`の方針(内部IDは平文、PIIはSOPS+ageで暗号化したyaml)を踏襲する。

## 2. レビューで削ったもの・変えたもの

当初の要望から「持たなくても要件を満たせるもの」を削り、残すものは入力の形を狭めた。狭めた入力はそのままセキュリティ対策にもなる。

| 項目 | 当初の要望 | 決定 | 理由 |
| --- | --- | --- | --- |
| Googleカレンダー | 連携または埋め込み | 埋め込みのみ。保存するのは共有カレンダーのID(`…@group.calendar.google.com`)だけ | OAuthトークンの保存と更新が不要になる。個人カレンダーのIDはGmailアドレスそのものなので受け付けない |
| 活動の様子(動画) | YouTube埋め込み | 動画ID(11文字)だけ保存し、`youtube-nocookie.com`で埋め込む | iframeのHTMLや任意のURLを受けないことでXSSを防ぐ |
| OGP | 各サークルのOGP | アイコン(1:1)を`og:image`に使い、`twitter:card`は`summary`。OG画像の動的生成はしない | 画像生成のコードと依存を持たない |
| 全文検索 | あり | NFKC正規化した文字列にILIKEで部分一致。検索エンジンは入れない | 数百件までなら索引なしで足りる。PGroongaやMeilisearchは運用と引き継ぎの負担が大きい |
| 説明文 | 記述なし | プレーンテキスト(改行のみ、最大2000文字) | MarkdownやHTMLの無害化処理を持たない |
| 編集者 | サークル幹部のメール | 1サークルにつき1件 | 複数人の追加・削除の画面とテストが不要。分からなくなったらadminが登録し直す |
| 引き継ぎ | メールアドレスの登録変更 | 現編集者が新しいメールアドレスを2回入力して置き換える。旧編集者のセッションはその場で失効 | 招待メールや承認フローを持たない |
| メール送信 | 記述なし | 機能ごと持たない | SMTPの運用と送信元ドメインの管理を抱えない |
| 公開状態 | adminによる非公開 | 下書き機能なし。必須項目が揃い、adminが非公開にしていなければ公開 | 状態の組み合わせを増やさない |
| adminの権限 | メール登録、非公開 | 登録、メール変更、非公開のみ。サークルの内容は編集できない | adminが乗っ取られたときの被害を絞る |
| adminの管理 | 弊社と運用会社の担当者のみ | 管理画面は作らない。SOPSで暗号化したyamlをPRで変更する | 昇格の経路をGitのレビュー1本に絞る |
| 画像の保存先 | 記述なし | Dockerボリューム。操作はポート越し | S3やMinIOの運用を持たない。後から差し替えられる |
| 件数の上限 | 記述なし | 写真6枚、動画3本 | 画面とストレージの上限を決めておく |
| SNSリンク | X、Instagram、YouTube、独自サイト | 4項目で固定。XとInstagramはユーザー名、YouTubeはハンドルだけ保存し、リンクのURLは表示時に固定の書式で組み立てる | 任意のURLを受けないので、偽サイトへの誘導を防げる |
| URL | 記述なし | 自動のID(UUID)。例:`/clubs/{id}` | スラッグの入力、重複、変更を扱わない |
| ログインの制限 | 記述なし | ドメイン制限なし。許可はメールアドレス単位 | サークル共有のGmailでも引き継げる |
| Storybook | 使用 | コンポーネントにだけ使う。ページのstoryは作らない | ページはサーバー側のテストで確認する |

入れないもの:タグ、カテゴリ、お気に入り、多言語対応、ページング、通知、サークルの削除(非公開で代用する)、閲覧数を見る画面。

## 3. 機能要件

画面は公開2つ、編集者2つ、admin1つの計5画面に収める(ログインはIdPへのリダイレクトだけで画面を持たない)。

| 画面 | パス | 使う人 | できること |
| --- | --- | --- | --- |
| 一覧 | `/` | 誰でも | 公開中のサークルをアイコン・名前・説明の冒頭で一覧表示。サークル名、読み仮名、説明を対象に検索。全件を1画面に出し、ページングしない。並びは読み仮名のアルファベット順→あいうえお順 |
| 詳細 | `/clubs/{id}` | 誰でも | アイコン(カバー兼用)、名前、説明、リンク、活動スケジュール(カレンダー埋め込み)、活動の様子(写真、YouTube)を表示。OGPを出す |
| 編集 | `/edit` | 編集者 | 自分のサークルの全項目を編集。公開状態(公開中、必須項目が不足、adminによる非公開)を表示 |
| 引き継ぎ | `/edit/handover` | 編集者 | 後任のメールアドレスを2回入力して置き換える。実行すると自分はログアウトされる |
| admin | `/admin` | admin | 全サークル(非公開を含む)の一覧、サークル枠の作成(編集者のメール登録)、編集者メールの変更、非公開の切り替え |

初回登録の流れ:adminが編集者のメールアドレスだけでサークル枠を作る→そのアドレスでログインした人が`/edit`で名前などを入力する→必須項目が揃った時点で公開される。

公開条件:サークル名、読み仮名、説明、アイコンがすべてあり、かつadminが非公開にしていない。条件を満たさないサークルは、一覧にも詳細にも出さず404を返す。

入力項目と制約(制約はAPI側で検証する。フロントの検証は入力補助にすぎない):

| 項目 | 必須 | 保存する形 | 制約 |
| --- | --- | --- | --- |
| サークル名 | 必須 | 文字列 | 1〜50文字、改行不可、前後の空白を除去 |
| 読み仮名 | 必須 | 文字列 | 1〜100文字。ひらがな、長音符、英数字、空白のみ。一覧の並び順と検索に使う(例:しゃしんぶ、linux club) |
| 説明 | 必須 | プレーンテキスト | 1〜2000文字、改行可、制御文字は拒否 |
| アイコン | 必須 | WebP(再エンコード後) | PNGまたはWebP、縦横比1:1、256〜2048px、5MB以下 |
| 活動スケジュール | 任意 | カレンダーID | `…@group.calendar.google.com`の形式のみ。カレンダー自体を公開設定にする必要があることを画面に書く |
| 写真 | 任意 | WebP(再エンコード後) | 最大6枚、JPEG・PNG・WebP、5MB以下、長辺2048pxに縮小、EXIFなどのメタデータは削除 |
| YouTube動画 | 任意 | 動画ID | 最大3本。入力は動画URLでよいが、保存は`^[A-Za-z0-9_-]{11}$`に合うIDのみ |
| X | 任意 | ユーザー名 | `^[A-Za-z0-9_]{1,15}$` |
| Instagram | 任意 | ユーザー名 | `^[A-Za-z0-9._]{1,30}$` |
| YouTubeチャンネル | 任意 | ハンドル | `@`で始まるハンドルのみ(文字種と長さは実装時にYouTubeの仕様で確認する) |
| 独自サイト | 任意 | URL | `https://`のみ、2048文字以下、認証情報付きURL(`user@host`)は拒否 |

写真の上には「写っている人の同意を得た写真だけを載せる」という注意を表示する。

閲覧数:サークルごとの閲覧回数を日ごとに集計し、永続的に保存する。誰が見たかは記録しない。毎日1回、集計ジョブ(`docker compose run --rm backend python -m clubportal.jobs.collect_views`をホストのタイマーから実行)がCaddyのアクセスログから前日分を数え、`club_daily_views`に書き込む。数えるのは`/clubs/{id}`へのGETで応答が200のものだけで、User-Agentから明らかなbotは除く。アクセスログそのものは30日で削除する。画面は作らない。

## 4. 権限とアカウントの抽象化

ドメイン層とユースケース層が知っているのは「ログイン識別子(種類とダイジェスト)」だけにする。Googleもメールアドレスも、内側の層には現れない。

| 操作 | 未ログイン | 編集者 | admin |
| --- | --- | --- | --- |
| 公開中のサークルの一覧・検索・詳細 | 可 | 可 | 可 |
| 自分のサークルの閲覧(非公開でも) | 不可 | 可 | 不可 |
| 自分のサークルの内容の編集 | 不可 | 可 | 不可 |
| 自分のサークルの引き継ぎ | 不可 | 可 | 不可 |
| 全サークルの一覧(非公開を含む) | 不可 | 不可 | 可 |
| サークル枠の作成、編集者メールの変更 | 不可 | 不可 | 可 |
| 非公開の切り替え | 不可 | 不可 | 可 |

- 編集者:ログイン識別子が`club_editors`の行と一致する人。識別子は一意なので、1つのメールアドレスが編集できるのは1サークルだけ。
- admin:ログイン識別子が、起動時に読み込んだadminリストと一致する人。adminは弊社と運用会社の代表。編集者を兼ねてもよい。
- ロールはセッションに保存せず、リクエストごとに判定する。引き継ぎやadmin解除がその場で効く。

抽象化の形:

- `LoginIdentifier(kind, digest)`:ドメインの値オブジェクト。`kind`は当面`email`のみ。`digest`はHMAC-SHA256の値(第5節)。
- `IdentityProvider`ポート:認可用URLの生成と、コールバックを「検証済みの本人情報」に変える処理だけを持つ。実装は汎用のOIDCアダプタ1つにし、Googleからauthentikなどへの移行は設定(issuer、クライアントID、シークレット)の差し替えで済ませる。
- `IdentifierHasher`ポート:正規化とHMACの計算。テストではフェイクに差し替える。
- アダプタは、IdPが返すメールアドレスを`email_verified`が真のときだけ受け取り、その場で`LoginIdentifier`に変えて生の値を捨てる。

移行時の見通し:移行先のIdPが検証済みメールアドレスを返せば、データ移行は不要。返さない場合は`kind`に`oidc_subject`(issuerと`sub`の組のHMAC)を足し、adminが各サークルを登録し直す。テーブル構造は変わらない。

## 5. 個人情報の扱い

DBにはメールアドレスも氏名も平文で持たない。平文のメールアドレスが存在するのは、SOPSで暗号化したadminリストと、ログイン処理中のメモリだけにする。

| データ | 分類 | 保管方法 |
| --- | --- | --- |
| サークルの内容(名前、読み仮名、説明、画像、リンク、カレンダーID) | 公開情報 | DBと画像ボリュームに平文 |
| 閲覧回数の日次集計 | 統計情報 | DB(`club_daily_views`)。削除しない |
| 編集者のメールアドレス | 個人情報 | DBにはHMAC-SHA256の値だけ。平文は保存しない |
| adminのメールアドレス | 個人情報 | `secrets/admins.secrets.yaml.enc`(SOPS+age)。起動時に復号してHMACの値に変え、メモリにだけ持つ |
| HMAC鍵、OIDCのクライアントシークレット、DBのパスワード | 機密 | SOPSで暗号化してリポジトリに置き、デプロイ時にDocker secrets(ファイル)として渡す。環境変数には入れない |
| セッションID | 機密 | DBにはSHA-256の値だけ |
| IdPのアクセストークン、リフレッシュトークン | 機密 | 保存しない(ログイン完了で破棄) |
| 監査ログ | 仮名情報 | 操作者のHMACの値、操作、対象、日時。IPアドレスは持たない。30日で削除 |
| アクセスログ(Caddy) | 個人情報(IPアドレス) | 30日で削除。CookieとAuthorizationヘッダは出力しない |
| 氏名、学籍番号 | — | 持たない |

HMACの計算:前後の空白を除去→NFKC正規化→小文字化した文字列に、サーバーの秘密鍵でHMAC-SHA256をかける。Gmailのドットの省略など、プロバイダ固有の正規化はしない。

adminリストの形(復号後):

```yaml
admins:
  - id: "adm_7f3a9b2c5e1d"   # 平文でよい内部ID
    email: "…"
```

`.sops.yaml`の受信者(復号できる人)は、サーバーの鍵と弊社の管理者の鍵に限る。運用会社の代表はadminだが、復号はできない。

この方式で失うもの:

- 登録済みのメールアドレスを画面で確認できない。admin画面には登録日時だけを出す。打ち間違いは「登録したのにログインしても編集できない」という形で分かり、adminが登録し直して直す。入力時に2回入力させて打ち間違いを減らす。
- HMAC鍵を交換すると、すべての登録が一致しなくなる。鍵の交換は漏えい時に限り、adminが全サークルを登録し直す手順を運用文書に書く。

写真:再エンコードでEXIF(位置情報を含む)を必ず削除する。写っている人の同意は各サークルの責任とし、編集画面で注意を表示する。

## 6. アーキテクチャ

Caddyを入口にして、`/api`をFastAPI、それ以外をNext.jsに振り分け、同一オリジンで動かす。認証・認可・検証・保存はすべてバックエンドが受け持ち、Next.jsは表示だけを担う。

```mermaid
flowchart LR
  Browser[ブラウザ] --> Caddy[Caddy<br>TLS終端・振り分け]
  Caddy -- "/" --> Next[Next.js<br>表示とOGP。秘密情報なし]
  Caddy -- "/api" --> API[FastAPI<br>認証・認可・検証・保存]
  Next -- 公開APIのみ --> API
  API --> DB[(PostgreSQL)]
  API --> Vol[画像ボリューム]
  API --> IdP[IdP(Google)]
  API --> Sec[Docker secrets]
```

秘密情報とDBに触れるのはFastAPIだけで、Next.jsを差し替えても守るべき境界は動かない。

Next.jsの役割を絞る理由:

- 後からフロントを差し替えても、認証や検証を移植し直さずに済む。
- Next.jsは秘密情報を一切持たない。公開ページのサーバー描画(OGPのため)では公開APIだけを呼ぶ。編集画面とadmin画面はブラウザから同一オリジンのAPIを呼ぶ。
- APIクライアントと型は`openapi.yaml`から生成する。手書きの型を持たない。
- 公開ページは一定時間ごとの再生成(ISR)にする。初期値は60秒で、実装時に調整してよい。バックエンドからNext.jsへの通知は持たない。

バックエンドの層(内側から):

1. `domain`:`Club`、`LoginIdentifier`、値オブジェクト(サークル名、YouTube動画IDなど)、公開条件の判定、ドメインエラー。標準ライブラリの`dataclass`だけで書き、FastAPI、SQLModel、Pydanticをimportしない。
2. `usecase`:1ユースケース1ファイル。必要な外部機能(永続化、画像保存、IdP、時刻、ID生成、HMAC)は`ports.py`に`Protocol`で定義する。
3. `adapter/http`:FastAPIのルーター、リクエストとレスポンスのPydanticスキーマ、認証・認可・CSRFの依存。入力検証はここで終え、内側には検証済みの型だけを渡す。
4. `infrastructure`:SQLModelのテーブル定義とリポジトリ実装、画像の保存、OIDCクライアント、秘密情報の読み込み。

依存は外から内への一方向だけにし、組み立ては`main.py`(合成ルート)で行う。DIコンテナは使わない。エンドポイントは同期関数(`def`)で書く。`async`と同期の混在は入門者がつまずきやすく、この規模では性能上の利点も小さいため。

Goなど他言語の経験者が入ってきたときに備えた決め事:

- `api/openapi.yaml`をAPIの正としてコミットし、FastAPIが出力する内容との差分をCIで検査する。エラー応答はRFC 9457(Problem Details)に揃える。
- マイグレーションは素のSQLで書き、dbmateで流す。Alembicの自動生成は使わない。スキーマがPythonに依存しない。
- APIテストはHTTP越しのブラックボックステストとして書き、接続先を環境変数で切り替えられるようにする。別言語で書き直しても同じテストで互換性を確かめられる。
- SQLModelはテーブル定義にだけ使い、APIのスキーマやドメインの型と兼用しない。DBの列を足しただけでAPIに漏れる事故も防げる。
- 層の構成をGoの`internal/{domain,usecase,adapter,infrastructure}`と同じにし、ファイル単位で移植できるようにする。
- 型検査はmypyの`--strict`、依存の向きはimport-linterで機械的に検査する。例外はドメインで定義したものだけを投げ、HTTP層でステータスコードに対応づける。

ディレクトリ構成:

```text
club-portal-next/
├── mise.toml                 # python, uv, node, pnpm, dbmate, sops, age のバージョン固定とタスク
├── compose.yaml              # 本番: caddy, frontend, backend, db
├── compose.dev.yaml          # 開発: dbのみ
├── Caddyfile
├── api/openapi.yaml          # APIの契約(正)
├── db/migrations/            # 素のSQL(dbmate)
├── backend/
│   ├── pyproject.toml / uv.lock
│   ├── src/clubportal/
│   │   ├── main.py           # 合成ルート
│   │   ├── domain/
│   │   ├── usecase/          # ports.py + 1ユースケース1ファイル
│   │   ├── adapter/http/
│   │   ├── infrastructure/{postgres,storage,oidc,secrets}/
│   │   └── jobs/             # 閲覧数の日次集計など
│   └── tests/{unit,integration,api}/
├── frontend/
│   ├── package.json / pnpm-lock.yaml
│   └── src/
│       ├── app/              # App Routerのページ
│       ├── components/       # 部品 + *.stories.tsx + *.test.tsx
│       └── lib/api/          # openapi.yamlから生成
├── secrets/                  # .sops.yamlと*.encのみ
├── docs/                     # 要件定義、デザイン、運用手順、引き継ぎ手順
└── .github/                  # workflows, pull_request_template.md, CODEOWNERS
```

## 7. データモデル

テーブルは9つ。サークルに関わるものはすべて`club`を接頭にする。主キーはUUID、日時は`timestamptz`(UTC)。

| テーブル | 主な列 | 備考 |
| --- | --- | --- |
| `clubs` | `id`, `name`, `name_reading`, `description`, `icon_image_id`, `calendar_id`, `x_username`, `instagram_username`, `youtube_handle`, `website_url`, `is_hidden`, `search_text`, `created_at`, `updated_at` | 枠の作成直後は`name`などが空(NULL)。`name_reading`は保存時にNFKC正規化・小文字化し、一覧は`name_reading COLLATE "C"`の昇順で並べる(文字コード順なので英数字→ひらがなの順になる)。`search_text`は名前、読み仮名、説明を正規化して連結したもので、保存時にアプリが更新する |
| `club_photos` | `club_id`, `position`, `image_id` | 主キーは(`club_id`, `position`)。`position`は0〜5 |
| `club_videos` | `club_id`, `position`, `youtube_video_id` | 主キーは(`club_id`, `position`)。`position`は0〜2。IDの形式をCHECK制約でも縛る |
| `club_images` | `id`, `club_id`, `kind`(icon/photo), `width`, `height`, `byte_size`, `sha256`, `created_at` | 実体はボリュームの`/data/images/{id}.webp`。パスはIDから決め、DBには持たない |
| `club_editors` | `club_id`, `identifier_kind`, `identifier_digest`, `updated_at` | 主キーは`club_id`(1サークル1件)。(`identifier_kind`, `identifier_digest`)に一意制約 |
| `club_daily_views` | `club_id`, `date`, `view_count` | 主キーは(`club_id`, `date`)。閲覧回数の日次集計で、個人情報を含まないため削除しない。1日あたり最大でサークル数と同じ行数しか増えない |
| `auth_requests` | `state_digest`, `nonce`, `code_verifier`, `expires_at` | OIDCログインの途中状態。10分で期限切れ、使ったら削除 |
| `sessions` | `id_digest`, `identifier_kind`, `identifier_digest`, `csrf_token_digest`, `created_at`, `last_seen_at`, `expires_at` | ロールは持たない。識別子単位で一括失効できるように索引を張る |
| `audit_logs` | `id`, `actor_kind`, `actor_digest`, `action`, `club_id`, `created_at` | 変更前後の値は持たない。30日で削除 |

検索は、検索語を同じように正規化し、`%`、`_`、`\`をエスケープしたうえで`search_text ILIKE '%…%' ESCAPE '\'`で部分一致を取る。検索語は1〜50文字。

DBユーザーは2つに分ける。アプリ用はテーブルへのSELECT・INSERT・UPDATE・DELETEだけ、マイグレーション用だけがDDLを実行できる。`audit_logs`はアプリ用ユーザーからINSERTとSELECTしかできないようにする(30日経過分の削除はマイグレーション用ユーザーで行う定期ジョブで実施する)。

## 8. API一覧

エンドポイントは17本。編集者用APIはパスに`club_id`を取らず、セッションから対象を決める(他サークルを指定する余地をなくす)。

| メソッド | パス | 権限 | 内容 |
| --- | --- | --- | --- |
| GET | `/api/clubs?q=` | 誰でも | 公開条件を満たすサークルの一覧と検索(読み仮名順) |
| GET | `/api/clubs/{id}` | 誰でも | 詳細。公開条件を満たさなければ404 |
| GET | `/api/images/{id}` | 誰でも | 画像。公開条件を満たさないサークルの画像は、本人以外には404 |
| GET | `/api/auth/login` | 誰でも | IdPへリダイレクト |
| GET | `/api/auth/callback` | 誰でも | IdPからの戻り。セッションを発行 |
| POST | `/api/auth/logout` | ログイン中 | セッションを失効 |
| GET | `/api/me` | ログイン中 | ロール(編集者か、adminか)とCSRFトークン |
| GET | `/api/editor/club` | 編集者 | 自分のサークル(非公開でも可)と公開状態 |
| PUT | `/api/editor/club` | 編集者 | 名前、読み仮名、説明、カレンダーID、リンク、動画をまとめて更新 |
| PUT | `/api/editor/club/icon` | 編集者 | アイコンの差し替え(multipart) |
| POST | `/api/editor/club/photos` | 編集者 | 写真の追加(multipart) |
| DELETE | `/api/editor/club/photos/{position}` | 編集者 | 写真の削除 |
| PUT | `/api/editor/club/editor` | 編集者 | 引き継ぎ(新メールアドレスと2回目の入力)。自分の全セッションを失効 |
| GET | `/api/admin/clubs` | admin | 全サークルの一覧(非公開、必須項目不足を含む)と編集者の登録日時 |
| POST | `/api/admin/clubs` | admin | サークル枠の作成(編集者メールアドレスと2回目の入力) |
| PUT | `/api/admin/clubs/{id}/editor` | admin | 編集者メールアドレスの変更。旧編集者の全セッションを失効 |
| PUT | `/api/admin/clubs/{id}/visibility` | admin | 非公開の切り替え |

写真の並べ替えAPIは持たない(削除して追加し直す)。変更系API(POST、PUT、DELETE)はすべてCSRFトークンとOriginヘッダの検証を通す。

## 9. セキュリティ要件

機能は削ったが、セキュリティは削らない。各項目はテストまたはCIで機械的に確かめられる形で実装する。

認証とセッション:

- OIDCの認可コードフローにPKCE(S256)を併用し、`state`と`nonce`を必須にする。IDトークンは署名、`iss`、`aud`、`exp`、`nonce`を検証する。
- `email_verified`が真のメールアドレスだけを受け付ける。
- セッションIDは256bitの乱数。Cookieは`__Host-session`、`Secure`、`HttpOnly`、`SameSite=Lax`、`Path=/`。
- 有効期限はログインから7日(絶対期限。無操作による期限は設けない)。ログイン時に必ず新しいIDを発行する(セッション固定化対策)。
- ログアウト、引き継ぎ、adminによるメール変更では、対象の識別子の全セッションを失効させる。

認可:

- 既定で拒否する。全ルートと全ロールの期待値を1つの「権限表」としてテストに持ち、表に載っていないルートがあればテストを失敗させる。
- ロールはリクエストごとに`club_editors`とadminリストに照合して決める。

CSRF:

- `SameSite=Lax`に加えて、変更系APIで`Origin`ヘッダが自オリジンであることと、セッションに紐づいたCSRFトークン(`X-CSRF-Token`ヘッダ)を検証する。

入力と出力:

- 入力はPydanticで型、長さ、形式を検証し、未知のフィールドは拒否する(`extra="forbid"`)。
- フロントでは`dangerouslySetInnerHTML`をESLintで禁止する。iframeの`src`は固定の書式にIDを埋めるだけで組み立てる。
- 外部リンクには`rel="noopener noreferrer"`を付ける。

画像のアップロード:

- 拡張子と`Content-Type`は信用せず、Pillowでデコードできた形式だけを受け付ける。デコード前にピクセル数の上限を確かめ、展開爆弾を防ぐ。
- 必ずWebPに再エンコードし、メタデータを捨てる。ファイル名はランダムなIDにする。
- リクエストサイズの上限をCaddyとアプリの両方で設定する。
- 配信時は`Content-Type: image/webp`、`X-Content-Type-Options: nosniff`、`Content-Security-Policy: default-src 'none'; sandbox`を付ける。

HTTPヘッダ:

- CSPは自オリジンを基本に、`frame-src`は`https://calendar.google.com`と`https://www.youtube-nocookie.com`だけを許可する。`script-src`はnonce方式、`object-src 'none'`、`base-uri 'none'`、`frame-ancestors 'none'`、`form-action 'self'`。
- HSTS、`Referrer-Policy: strict-origin-when-cross-origin`、不要な機能を止める`Permissions-Policy`。
- フォントはセルフホストし、CDNからの読み込みは使わない。

レート制限:ログイン開始とコールバックはIPアドレスごと、変更系APIはセッションごとに上限を設ける。単一インスタンス前提なのでアプリ内のメモリで数える。

基盤:

- コンテナは非rootで実行し、ルートファイルシステムを読み取り専用にし、capabilitiesをすべて外し、`no-new-privileges`を付ける。
- DBはComposeの内部ネットワークにだけ置き、ポートを公開しない。
- 秘密情報はDocker secretsでファイルとして渡し、環境変数には入れない。
- DBのダンプと画像ボリュームを定期的にバックアップし、ageで暗号化して保管する。復元手順も運用文書に書き、実際に試す。

サプライチェーンとリポジトリ:

- 依存はロックファイル(`uv.lock`、`pnpm-lock.yaml`)で固定し、Renovateで更新する。
- CIでpip-audit、pnpm audit、Trivy(コンテナイメージ)、gitleaks、CodeQLを実行する。
- GitHub Actionsはコミットハッシュで固定し、`permissions`を最小にする。
- mainブランチはPR経由のみ。レビュー1件以上とCIの成功を必須にする。`secrets/`と`.github/`は運営側をCODEOWNERSにする。

ログ:メールアドレス、トークン、Cookieをログに出さない。ログインなどのテストでログ出力を取り、それらが含まれないことを確かめる。

## 10. 開発ルール

開発はテスト駆動で進め、仕様はまずテストとして書く。

TDDの手順:

1. Issueに受け入れ条件を箇条書きで書く。
2. 受け入れ条件をテストにし、失敗することを確かめてコミットする(`test:`)。
3. テストが通る最小の実装を書く(`feat:`)。
4. テストを通したまま整理する(`refactor:`)。

テストの種類:

| 対象 | 道具 | 内容 |
| --- | --- | --- |
| `domain`、`usecase` | pytest | ポートをフェイクに差し替えた単体テスト。テーブル駆動(`pytest.mark.parametrize`)で書く |
| `infrastructure` | pytest | 開発用コンテナのPostgreSQLに対する結合テスト |
| API | pytest + httpx | HTTP越しのブラックボックステスト。権限表テストを含む。既定はプロセス内で実行し、環境変数で起動中のサーバーに向けられる |
| フロントの部品 | Storybook + vitest | 状態ごとのstory(空、入力中、エラー、非公開など)を書き、vitestで実行する。a11yの検査もstoryに対して行う |
| フロントのロジック | vitest | YouTubeのURLからIDを取り出す処理など |

ツールの使い分け:

- mise:開発環境のツール(python、uv、node、pnpm、dbmate、sops、age)のバージョンを固定し、よく使う操作を`mise run`のタスクにする(`dev`、`test`、`lint`、`migrate`、`gen-api`)。
- Docker Compose:開発では`compose.dev.yaml`でDBだけを起動する。本番では`compose.yaml`で全体を起動する。
- 静的検査:バックエンドはruff、mypy(`--strict`)、import-linter。フロントはESLint、`tsc --noEmit`、Prettier。

CI(PRごと):静的検査、テスト、`openapi.yaml`の差分検査、空のDBへのマイグレーション適用、セキュリティスキャン(第9節)、コンテナイメージのビルド。

PRテンプレート(`.github/pull_request_template.md`):

```markdown
## 概要
<!-- 何を、なぜ変えたか -->

## 関連Issue
Closes #

## 変更の種類
- [ ] 機能追加
- [ ] 不具合の修正
- [ ] リファクタリング
- [ ] ドキュメント
- [ ] 依存関係の更新

## テスト(TDD)
- [ ] 実装より先にテストを書き、失敗することを確かめた(コミット: )
- [ ] 新しいAPIを権限表テストに追加した(該当する場合)
- [ ] 新しい部品や状態にstoryを追加した(該当する場合)

## セキュリティと個人情報
- [ ] メールアドレス、氏名、トークンをDB、ログ、テストデータに平文で入れていない
- [ ] 新しい入力には型、長さ、形式の検証がある
- [ ] 外部からの読み込み(CDN、iframe、フォント)を足していない。足した場合はCSPの変更と理由を書いた
- [ ] 秘密情報をコミットしていない

## 引き継ぎ
- [ ] 後輩が読んで分かる名前とコメントになっている
- [ ] 仕様や運用が変わる場合、docs/を更新した
- [ ] openapi.yamlとマイグレーションを更新した(該当する場合)

## スクリーンショット(UIを変えた場合)
```

## 11. フェーズ

6フェーズに分け、各フェーズの完了条件を満たしたら止まって確認を取る。どのフェーズも「テストを先に書く」。

| フェーズ | 内容 | 完了条件 | 状態 |
| --- | --- | --- | --- |
| P0:土台 | リポジトリ作成、mise、Compose、CI、PRテンプレート、CODEOWNERS、SOPSの設定、空のFastAPIとNext.js | `mise run dev`で起動し、ヘルスチェックのテストとCIが通る | 未着手 |
| P1:公開画面 | `clubs`と関連テーブル、一覧・検索・詳細のAPIと画面、OGP | シードデータで一覧・検索・詳細・OGPがテストで確認できる | 未着手 |
| P2:認証と編集 | OIDC、セッション、CSRF、編集APIと編集画面(画像以外) | 権限表テストが全ルート分通る | 未着手 |
| P3:画像 | アイコンと写真のアップロード、再エンコード、配信 | 偽装ファイル、巨大画像、EXIF付き画像のテストが通る | 未着手 |
| P4:adminと引き継ぎ | adminのAPIと画面、引き継ぎ、監査ログ | 引き継ぎ後に旧編集者が操作できないことをテストで確認できる | 未着手 |
| P5:強化と本番 | CSP、レート制限、コンテナの硬化、バックアップと復元、閲覧数の日次集計、運用手順と引き継ぎ手順、セキュリティの確認項目による点検 | 本番環境で動き、復元手順を一度実際に試している | 未着手 |

## 12. 決定事項と未決事項

2026-11-18に決めたこと:

- 編集者のメールアドレスは1サークル1件。
- 詳細ページのURLは自動のID。
- ログインはドメインを制限しない。
- リポジトリ名は`club-portal-next`。既存の同名リポジトリは`archive-club-portal-next`にリネームしてアーカイブする。
- コード・DB・APIでの呼び名は`club`。
- 一覧はアルファベット順→あいうえお順。漢字の名前を並べるために、読み仮名(必須)を入力項目に足した。
- adminは弊社と運用会社の代表。SOPSで復号できるのは弊社の管理者だけ。
- セッションの期限は7日。監査ログとアクセスログの保持は30日。
- 画像の上限は1ファイル5MB(アイコン、写真とも)。枚数の上限は写真6枚、動画3本。
- 公開ページの再生成間隔は60秒を初期値とし、実装時に調整してよい。
- 閲覧の記録はサークルごとの回数だけ。アクセスログから日ごとに集計して永続保存する(生のログは30日で削除)。閲覧数を見る画面は作らない。

P0で決めたこと(2026-11-18):

- リポジトリはpublic。無料のOrganizationでブランチ保護とCodeQLを使うため。
- 版:Python 3.15、Node.js 26(LTS)、PostgreSQL 18。ツールの版は`mise.toml`で固定する。
- フロントのAPIクライアントは、openapi-typescriptで型を生成し、openapi-fetchで呼ぶ。
- スタイルはCSS Modulesと、`frontend/src/styles/tokens.css`のCSS変数で書く。Tailwindは使わない。
- 開発用DBの接続情報は、開発専用の固定値としてコミットする(DBは127.0.0.1にだけ公開)。本番はDocker secretsで渡す。
- ヘルスチェック(`GET /api/health`)はアプリの生存だけを返し、DBに触れない。
- 実行中のAPIは、OpenAPIのドキュメント画面とスキーマを配らない。契約は`api/openapi.yaml`で共有する。
- pnpm auditは、本番の依存はmoderate以上、開発の依存を含めた全体はhigh以上で失敗にする。修正版のない脆弱性だけ、GHSA番号を理由つきで`frontend/pnpm-workspace.yaml`に書いて無視する。
- SOPSの受信者は、当面は弊社の管理者の鍵だけにする。サーバーの鍵はホスティング先が決まってから足す。

未決事項:

- [ ] 本番のホスティング先とドメイン
