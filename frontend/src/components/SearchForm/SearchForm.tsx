import styles from "./SearchForm.module.css";

type Props = {
  /** 今の検索語(入力欄の初期値) */
  query: string;
};

// GETのフォームで / に送る、ブラウザのJavaScriptがなくても検索できる
export function SearchForm({ query }: Props) {
  return (
    <form role="search" action="/" method="get" className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="q" className={styles.label}>
          キーワードで探す
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={50}
          placeholder="サークル名や活動内容"
          className={styles.input}
        />
      </div>
      <button type="submit" className={styles.button}>
        検索
      </button>
    </form>
  );
}
