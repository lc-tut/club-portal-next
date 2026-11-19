import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VideoList } from "./VideoList";

// シードの架空の動画IDなので、埋め込みの中身は「再生できない」表示になる
const meta = {
  title: "詳細/VideoList",
  component: VideoList,
  args: { clubName: "写真部" },
} satisfies Meta<typeof VideoList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoVideos: Story = {
  name: "二本",
  args: { videoIds: ["cpSample001", "cpSample002"] },
};

export const InvalidIdHidden: Story = {
  name: "形の正しくないIDは出さない",
  args: { videoIds: ["not/an/id"] },
};
