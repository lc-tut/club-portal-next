import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import storybook from "eslint-plugin-storybook";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      // HTMLの直接挿入はXSSの入口になるので禁止(CLAUDE.md、要件定義の第9節)
      "react/no-danger": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/font/google",
              message: "フォントはセルフホストする、next/font/localを使う",
            },
          ],
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    // openapi.yamlからの生成物
    "src/lib/api/**",
  ]),
]);

export default eslintConfig;
