// PostCSSの設定(Next.jsとStorybookの両方が読む)
//
// FontsourceのCSSはfont-display: swapで固定なので、blockに書き換える(要件定義の第12節)
// - swapは、先にほかのフォントで描いてから置き換えるので、2回目以降の表示でも置き換えが見える
// - optionalは、Chromeではキャッシュからの読み込みでも間に合わず、Webフォントがほぼ使われない
// - blockは、届くまで(最大3秒)文字を描かずに待つので、ほかのフォントを描かない
//   2回目以降はキャッシュから届き、最初からNoto Sans JPで描かれる
//   1回目は、フォントが届くまで文字が見えない

const fontDisplayBlock = () => ({
  postcssPlugin: "font-display-block",
  AtRule: {
    "font-face": (rule) => {
      rule.walkDecls("font-display", (decl) => {
        decl.value = "block";
      });
    },
  },
});
fontDisplayBlock.postcss = true;

const config = {
  plugins: [fontDisplayBlock],
};

export default config;
