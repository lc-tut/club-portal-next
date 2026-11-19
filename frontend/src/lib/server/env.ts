// サーバー側(Next.jsのサーバー)だけで読む環境変数
// Next.jsは秘密情報を持たないので、ここにあるのは接続先とURLの元だけ

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数${name}が設定されていない`);
  }
  return value;
}

/** サーバー描画で公開APIを呼ぶときの接続先(例:http://backend:8000) */
export function apiInternalUrl(): string {
  return requireEnv("CLUBPORTAL_API_INTERNAL_URL");
}

/** og:imageなどの絶対URLの元(例:https://clubportal.example.com) */
export function publicOrigin(): string {
  return requireEnv("CLUBPORTAL_PUBLIC_ORIGIN");
}
