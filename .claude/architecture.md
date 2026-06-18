# ClubPortal バックエンド設計

大学のサークル掲載サービス。トップページのみのシンプルな構成（遷移を最小化）。

## 技術スタック

- Backend: Python + FastAPI + SQLModel
- Frontend: Next.js（別リポジトリ/別ディレクトリ想定）
- DB: PostgreSQL
- 環境管理: mise
- デプロイ: Docker コンテナ
- 画像: ローカルディスク + Docker ボリューム保存、アップロード時に webp へ変換

## デザイン方針

- 余計な画面遷移を排除し、トップページ中心の構成
- イベント日程は自前実装せず Google カレンダー埋め込み（Club / Announcement 共通の仕組み）
- 管理画面は Plain Text のみ。リッチエディタ等は実装しない
- フォロー/入部機能は MVP では実装しない

## 認証モデル

- Google OAuth2 + 大学ドメイン（例: edu.teu.ac.jp）制限でログイン
- **ログイン済み = 学内ユーザー全般**（club admin に限らない）。ログイン状態により Club / Announcement の表示内容が変化する
  - 未ログイン: `description_external` のみ表示、`calendar_embed_url` 非表示
  - ログイン時: `description_internal` + `calendar_embed_url` も表示
- `ClubAdmin`（user_id, club_id）: そのサークルのプロフィール/お知らせ編集権限
  - club admin は自分の club に限り他の admin を追加/削除できる（superadmin 不要）
  - ただし club の admin が 0 人になる削除はできない（孤立防止）
- `User.is_superadmin`: 運営側フラグ。club の新規作成・削除のみに使う（club作成時に初期adminのメールも同時指定）

## ドメインモデル

### Club
5文字のランダムID（大小英数字）を主キーとする。重複時は再生成して採番。

| カラム | 型 | 備考 |
|---|---|---|
| id | str(5) PK | 英大文字・小文字・数字からランダム生成 |
| name | str | |
| short_description | str(≤30) | タイル表示用 |
| description_external | text | 学外向け詳細説明 |
| description_internal | text | 学内向け詳細説明（ログイン時のみ表示） |
| tag | enum(culture/sports/other) | 文化会/体育会/その他（実行委員等） |
| icon_path | str | 必須 |
| cover_path | str | 必須 |
| calendar_embed_url | str? | Google カレンダー埋め込みURL、ログイン時のみ表示 |
| youtube_url | str? | ギャラリーにタイルとして表示 |
| is_published | bool | |
| created_at / updated_at | datetime | |

### ClubImage（ギャラリー、最大5枚）
| カラム | 型 | 備考 |
|---|---|---|
| id | int/uuid PK | |
| club_id | FK Club | |
| image_path | str | |
| sort_order | int | 並べ替え用。管理画面からの並び替えAPIで更新 |

### ClubSnsLink
SNSリンクは配列管理・プレーンテキストURLのみ（プラットフォーム種別は持たない）。

| カラム | 型 | 備考 |
|---|---|---|
| id | int/uuid PK | |
| club_id | FK Club | |
| url | str | |
| sort_order | int | |

### Announcement
お知らせは画像なし。本文/タイトル/カレンダーのみが MVP スコープ（画像対応は要望があれば追加）。

| カラム | 型 | 備考 |
|---|---|---|
| id | int/uuid PK | |
| club_id | FK Club | |
| title | str(≤30) | |
| body | text | Plain text（絵文字等はそのまま文字列として許容） |
| calendar_embed_url | str? | Club と同じ仕組みを流用、ログイン時のみ表示 |
| is_published | bool | |
| created_at / updated_at | datetime | |

### User
| カラム | 型 | 備考 |
|---|---|---|
| id | int/uuid PK | |
| google_sub | str unique | Google OAuth subject |
| email | str unique | ドメイン制限済み |
| name | str | |
| is_superadmin | bool | |
| created_at | datetime | |

### ClubAdmin（多対多の中間テーブル）
| カラム | 型 | 備考 |
|---|---|---|
| user_id | FK User | 複合PK |
| club_id | FK Club | 複合PK |
| created_at | datetime | |

## API 一覧

### 公開（ログイン状態で内容が分岐するものは明記）
- `GET /clubs` — タイル一覧（id, name, short_description, icon_path, tag）。常に同一情報
- `GET /clubs/{club_id}` — 未ログイン: external情報のみ／ログイン: internal情報 + calendar_embed_url + youtube/画像
- `GET /announcements` — `?club_id=` を複数指定可能（`?club_id=AAAAA&club_id=BBBBB`）。タイトル等のプレビューのみ、未ログインでも閲覧可。お知らせ一覧ページから各サークルへの遷移に使う（API削減目的）

### ログイン必須（学内ユーザー全般）
- `GET /announcements/{id}` — お知らせ本文の詳細

### 認証
- `GET /auth/login` — Google OAuth 開始
- `GET /auth/callback` — コールバック、ドメイン検証、セッション発行
- `POST /auth/logout`
- `GET /auth/me` — 自分の情報＋管理権限のある club 一覧

### 管理API（対象 club の ClubAdmin であること）
- `PATCH /admin/clubs/{club_id}` — プロフィール編集
- `POST /admin/clubs/{club_id}/images` — アップロード（icon/cover/gallery種別、gallery最大5枚、webp変換）
- `DELETE /admin/clubs/{club_id}/images/{image_id}`
- `PATCH /admin/clubs/{club_id}/images/order` — `[{image_id, sort_order}, ...]` で一括並べ替え
- `POST /admin/clubs/{club_id}/announcements`
- `PATCH /admin/announcements/{id}`
- `DELETE /admin/announcements/{id}`
- `POST /admin/clubs/{club_id}/admins` — メールで管理者追加（その club の admin なら誰でも可）
- `DELETE /admin/clubs/{club_id}/admins/{user_id}` — 管理者解除（最後の1人は削除不可）

### 運営専用（is_superadmin）
- `POST /admin/clubs` — club新規作成（5文字ID自動生成）＋初期adminのメール指定
- `DELETE /admin/clubs/{club_id}`

## 画像アップロードの実装方針

- アップロード時に webp へ変換してローカルディスクに保存（Docker volume）
- サイズ上限は MVP では未設定だが、後から値を入れられるようアプリ設定（env変数 / config）駆動のバリデーションにしておく（DBにテーブルは不要）
