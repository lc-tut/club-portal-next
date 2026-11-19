import { describe, expect, expectTypeOf, it, vi } from "vitest";

import type { components } from "@/lib/api/schema";
import { createApiClient } from "@/lib/apiClient";

type HealthResponse = components["schemas"]["HealthResponse"];

describe("createApiClient", () => {
  it("baseUrlにパスをつなげてリクエストし、応答を型付きで返す", async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      void request;
      return Response.json({ status: "ok" });
    });
    const client = createApiClient("http://api.example.com", fetchMock);

    const { data } = await client.GET("/api/health");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0].url).toBe(
      "http://api.example.com/api/health",
    );
    expect(data).toEqual({ status: "ok" });
    expectTypeOf(data).toEqualTypeOf<HealthResponse | undefined>();
  });

  it("openapi.yamlから生成した型にヘルスチェックの応答がある", () => {
    expectTypeOf<HealthResponse>().toEqualTypeOf<{ status: "ok" }>();
  });
});
