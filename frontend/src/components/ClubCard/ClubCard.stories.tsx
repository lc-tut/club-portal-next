import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClubCard } from "./ClubCard";

const meta = {
  title: "一覧/ClubCard",
  component: ClubCard,
  args: {
    href: "/clubs/00000000-0000-4000-8000-000000000001",
    name: "写真部",
    description:
      "学内外で撮影会を開き、写真展で作品を発表しています。初心者向けにカメラの貸し出しもあります。",
    iconSrc: "/seed-images/10000000-0000-4000-8000-000000000001.webp",
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClubCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "通常" };

export const LongDescription: Story = {
  name: "説明が長い",
  args: {
    description: "説明が長いときは冒頭の2行だけを表示します。".repeat(10),
  },
};
