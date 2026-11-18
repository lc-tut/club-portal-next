import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // storyがまだない間(P0)も失敗させない
    passWithNoTests: true,
    projects: [
      {
        // ロジックの単体テスト(*.test.ts)、型のテストも行う
        extends: true,
        resolve: { alias: { "@": path.join(dirname, "src") } },
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "node",
          typecheck: { enabled: true, include: ["src/**/*.test.{ts,tsx}"] },
        },
      },
      {
        // 部品のstoryをブラウザで描画し、a11yも検査する
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
