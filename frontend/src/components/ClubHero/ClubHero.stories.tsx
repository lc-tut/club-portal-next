import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClubLinks } from "@/components/ClubLinks/ClubLinks";

import { ClubHero } from "./ClubHero";

const meta = {
  title: "詳細/ClubHero",
  component: ClubHero,
  parameters: { layout: "fullscreen" },
  args: {
    name: "写真部",
    iconSrc: "/seed-images/10000000-0000-4000-8000-000000000001.webp",
  },
} satisfies Meta<typeof ClubHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLinks: Story = {
  name: "リンクあり",
  args: {
    links: (
      <ClubLinks
        xUsername="cp_sample_photo"
        instagramUsername="cp.sample.photo"
        youtubeHandle="@cp-sample-photo"
        websiteUrl="https://example.com/photo-club"
      />
    ),
  },
};

export const WithoutLinks: Story = { name: "リンクなし" };

export const LongName: Story = {
  name: "名前が長い",
  args: { name: "とても長い名前のサークルでも折り返して表示される同好会" },
};
