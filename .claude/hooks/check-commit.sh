#!/usr/bin/env bash
# Bashの直前に呼ばれる。`git commit`のときだけ、ステージした差分の追加行に
# 個人情報や秘密鍵らしきものがないかを調べ、見つかればコミットを止める。
set -u

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Blocked: hookの入力を読めませんでした。python3が使えるか確認してください。" >&2
  exit 2
fi

case "$COMMAND" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

FINDINGS=$(git diff --cached -U0 --no-color | python3 -c '
import re, sys

# 例示用として許すドメイン
allowed_domains = ("example.com", "example.org", "example.net",
                   "users.noreply.github.com", "noreply.github.com",
                   "group.calendar.google.com")
email = re.compile(r"[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
student_id = re.compile(r"\b[Cc]0[A-Za-z][0-9]{5}\b")
# パターンを分割して書く(このファイル自体が検出されないように)
secret = re.compile("AGE-SECRET" + "-KEY-|-----BEGIN [A-Z ]*PRIVATE" + " KEY-----")

current = None
found = []
for line in sys.stdin:
    if line.startswith("+++ b/"):
        current = line[6:].strip()
        continue
    if not line.startswith("+") or line.startswith("+++"):
        continue
    text = line[1:]
    for m in email.finditer(text):
        domain = m.group(1).lower()
        if not any(domain == d or domain.endswith("." + d) for d in allowed_domains):
            found.append(f"{current}: メールアドレスらしき文字列(ドメイン {domain})")
    if student_id.search(text):
        found.append(f"{current}: 学籍番号らしき文字列")
    if secret.search(text):
        found.append(f"{current}: 秘密鍵らしき文字列")

print("\n".join(sorted(set(found))))
')

if [ -n "$FINDINGS" ]; then
  {
    echo "Blocked: ステージした差分に個人情報または秘密情報らしきものがあります。"
    echo "$FINDINGS"
    echo "テストデータにはexample.comのアドレスを使い、秘密情報はsopsで暗号化してください。"
    echo "誤検知なら、利用者に確認を取ってからhooks/check-commit.shの許可リストを直してください。"
  } >&2
  exit 2
fi

exit 0
