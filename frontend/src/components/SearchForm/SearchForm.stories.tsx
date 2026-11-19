import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchForm } from "./SearchForm";

const meta = {
  title: "一覧/SearchForm",
  component: SearchForm,
} satisfies Meta<typeof SearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "空",
  args: { query: "" },
};

export const Filled: Story = {
  name: "入力済み",
  args: { query: "写真" },
};
