import createClient from "openapi-fetch";

import type { paths } from "@/lib/api/schema";

/**
 * openapi.yamlから生成した型(lib/api/schema.d.ts)付きのAPIクライアントを作る
 *
 * - ブラウザからは同一オリジンの/apiを呼ぶので、baseUrlは空文字でよい
 * - サーバー描画では公開APIだけを呼ぶ(Next.jsは秘密情報を持たない)
 */
export function createApiClient(
  baseUrl: string,
  fetchImpl?: (request: Request) => Promise<Response>,
) {
  return createClient<paths>({ baseUrl, fetch: fetchImpl });
}
