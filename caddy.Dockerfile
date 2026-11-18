# Caddyを非rootで動かすためのイメージ
# 証明書などを置く/dataと/configを、動かすユーザーの持ち物にしておく
FROM caddy:2.11.9-alpine
RUN mkdir -p /data /config && chown -R 1000:1000 /data /config
COPY Caddyfile /etc/caddy/Caddyfile
USER 1000:1000
