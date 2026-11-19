import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "共通/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = { name: "未ログイン" };
