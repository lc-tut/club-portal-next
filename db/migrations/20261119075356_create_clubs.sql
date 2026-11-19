-- migrate:up

-- サークル(要件定義の第7節)
-- 枠を作った直後はnameなどが空(NULL)で、公開条件はアプリ(domain)で判定する
CREATE TABLE clubs (
    id                  uuid PRIMARY KEY,
    name                text,
    -- 保存時にNFKC正規化と小文字化をする、一覧は name_reading COLLATE "C" の昇順
    name_reading        text,
    description         text,
    icon_image_id       uuid,
    calendar_id         text,
    x_username          text,
    instagram_username  text,
    youtube_handle      text,
    website_url         text,
    is_hidden           boolean NOT NULL DEFAULT false,
    -- 名前、読み仮名、説明を正規化して改行でつないだもの(保存時にアプリが更新する)
    search_text         text NOT NULL DEFAULT '',
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- サークルの画像
-- 実体は画像ボリュームの {id}.webp、パスはIDから決めるのでDBには持たない
CREATE TABLE club_images (
    id          uuid PRIMARY KEY,
    club_id     uuid NOT NULL REFERENCES clubs (id),
    kind        text NOT NULL CHECK (kind IN ('icon', 'photo')),
    width       integer NOT NULL CHECK (width > 0),
    height      integer NOT NULL CHECK (height > 0),
    byte_size   integer NOT NULL CHECK (byte_size > 0),
    sha256      text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clubs
    ADD CONSTRAINT clubs_icon_image_id_fkey
    FOREIGN KEY (icon_image_id) REFERENCES club_images (id);

-- 活動の様子の写真(最大6枚)
CREATE TABLE club_photos (
    club_id   uuid NOT NULL REFERENCES clubs (id),
    position  smallint NOT NULL CHECK (position BETWEEN 0 AND 5),
    image_id  uuid NOT NULL UNIQUE REFERENCES club_images (id),
    PRIMARY KEY (club_id, position)
);

-- 活動の様子のYouTube動画(最大3本、保存するのは動画IDだけ)
CREATE TABLE club_videos (
    club_id           uuid NOT NULL REFERENCES clubs (id),
    position          smallint NOT NULL CHECK (position BETWEEN 0 AND 2),
    youtube_video_id  text NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    PRIMARY KEY (club_id, position)
);

-- アプリ用のユーザーには読み書きだけを許す(DDLはこのマイグレーション用のユーザーだけ)
GRANT SELECT, INSERT, UPDATE, DELETE ON clubs, club_images, club_photos, club_videos TO clubportal_app;

-- migrate:down

DROP TABLE club_videos;
DROP TABLE club_photos;
ALTER TABLE clubs DROP CONSTRAINT clubs_icon_image_id_fkey;
DROP TABLE club_images;
DROP TABLE clubs;
