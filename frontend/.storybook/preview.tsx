import type { Preview } from "@storybook/nextjs-vite";

import "@fontsource-variable/noto-sans-jp";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // a11yの違反があればテストを失敗させる
      test: "error",
    },
  },
};

export default preview;
