import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 本番のコンテナ用に、必要なファイルだけをまとめて出力する
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    // 開発中だけ/apiをFastAPIへ流して同一オリジンにする(本番はCaddyが振り分ける)
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
