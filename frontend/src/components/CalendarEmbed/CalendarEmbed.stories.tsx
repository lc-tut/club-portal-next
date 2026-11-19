import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CalendarEmbed } from "./CalendarEmbed";

// シードの架空のカレンダーIDなので、埋め込みの中身は「見つからない」表示になる
const meta = {
  title: "詳細/CalendarEmbed",
  component: CalendarEmbed,
  args: {
    calendarId: "c_cpsamplephoto0000@group.calendar.google.com",
    clubName: "写真部",
  },
} satisfies Meta<typeof CalendarEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "通常" };
