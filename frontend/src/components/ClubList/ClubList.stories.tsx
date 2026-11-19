import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClubList, type ClubListItem } from "./ClubList";

const icon = (n: number) =>
  `/seed-images/10000000-0000-4000-8000-00000000000${n}.webp`;

const clubs: ClubListItem[] = [
  {
    id: "2",
    name: "ESS",
    description: "英語でのディスカッションやスピーチの練習をしています。",
    iconSrc: icon(2),
  },
  {
    id: "6",
    name: "LinuxClub",
    description: "Linuxやサーバーの運用、Webアプリの開発を学んでいます。",
    iconSrc: icon(6),
  },
  {
    id: "3",
    name: "軽音楽サークル",
    description:
      "バンドを組んで学内のライブに出演しています。楽器の経験は問いません。",
    iconSrc: icon(3),
  },
  {
    id: "5",
    name: "茶道部",
    description: "週1回、お茶の稽古をしています。学園祭ではお茶会を開きます。",
    iconSrc: icon(5),
  },
  {
    id: "1",
    name: "写真部",
    description: "学内外で撮影会を開き、写真展で作品を発表しています。",
    iconSrc: icon(1),
  },
];

const meta = {
  title: "一覧/ClubList",
  component: ClubList,
} satisfies Meta<typeof ClubList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  name: "全件",
  args: { clubs, query: "" },
};

export const SearchResult: Story = {
  name: "検索結果",
  args: { clubs: [clubs[4]], query: "撮影" },
};

export const NoMatch: Story = {
  name: "該当なし",
  args: { clubs: [], query: "存在しない語" },
};

export const NoPublicClubs: Story = {
  name: "公開中のサークルがない",
  args: { clubs: [], query: "" },
};
