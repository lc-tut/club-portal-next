-- 開発用DBの初期化(compose.dev.yamlだけで使う)
-- ボリュームを作った最初の1回だけ実行される、作り直すには mise run db:reset
--
-- clubportal(POSTGRES_USER)はマイグレーション用で、DDLを実行できる
-- clubportal_appはアプリ用で、テーブルごとの読み書きの権限だけをマイグレーションで与える
-- パスワードは開発専用の固定値、本番ではDocker secretsで渡す
CREATE ROLE clubportal_app LOGIN PASSWORD 'clubportal-app-dev-only';

-- テスト用のDB(テストのたびに中身を消して入れ直す)
CREATE DATABASE clubportal_test OWNER clubportal;
