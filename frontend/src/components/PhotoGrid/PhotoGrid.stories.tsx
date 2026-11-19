import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PhotoGrid } from "./PhotoGrid";

const photo = (n: number) =>
  `/seed-images/20000000-0000-4000-8000-00000000000${n}.webp`;

const meta = {
  title: "詳細/PhotoGrid",
  component: PhotoGrid,
  args: { clubName: "写真部" },
} satisfies Meta<typeof PhotoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePhotos: Story = {
  name: "三枚",
  args: { photoSrcs: [photo(1), photo(2), photo(3)] },
};

export const OnePhoto: Story = {
  name: "一枚",
  args: { photoSrcs: [photo(1)] },
};

// 上限の6枚(2段に並ぶ)
export const SixPhotos: Story = {
  name: "六枚",
  args: {
    photoSrcs: [1, 2, 3, 1, 2, 3].map((n, i) => `${photo(n)}?story=${i}`),
  },
};
