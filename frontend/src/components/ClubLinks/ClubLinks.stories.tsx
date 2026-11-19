import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClubLinks } from "./ClubLinks";

const meta = {
  title: "詳細/ClubLinks",
  component: ClubLinks,
} satisfies Meta<typeof ClubLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllLinks: Story = {
  name: "すべてあり",
  args: {
    xUsername: "cp_sample_photo",
    instagramUsername: "cp.sample.photo",
    youtubeHandle: "@cp-sample-photo",
    websiteUrl: "https://example.com/photo-club",
  },
};

export const SomeLinks: Story = {
  name: "一部だけ",
  args: {
    xUsername: "cp_sample_band",
    instagramUsername: null,
    youtubeHandle: null,
    websiteUrl: null,
  },
};

export const NoLinks: Story = {
  name: "なし",
  args: {
    xUsername: null,
    instagramUsername: null,
    youtubeHandle: null,
    websiteUrl: null,
  },
};
