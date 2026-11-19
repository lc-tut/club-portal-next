import type { StorybookConfig } from "@storybook/nextjs-vite";

// storyは部品(src/components)にだけ書く、ページのstoryは作らない
const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/nextjs-vite",
  // storyで使う画像(シードの架空の画像)
  staticDirs: [{ from: "../../db/seeds/images", to: "/seed-images" }],
  core: {
    // 利用状況を外部へ送らない
    disableTelemetry: true,
  },
};

export default config;
