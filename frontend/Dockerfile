# フロントの本番用イメージ(Next.jsのstandalone出力)
# Node 25以降はcorepackが同梱されないので、pnpmはnpmで入れる

FROM node:26.13.1-slim AS builder
RUN npm install --global pnpm@12.21.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


FROM node:26.13.1-slim
# OSのパッケージをセキュリティ修正まで上げる
# 実行にはnodeだけを使うので、同梱のnpmとcorepackは消す(脆弱性スキャンの対象を減らすため)
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# rootでは動かさない(nodeユーザーはイメージに用意されている)
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
