"""FastAPIの実装からOpenAPIの定義を書き出す

使い方:mise run gen-api(内部で python -m clubportal.export_openapi api/openapi.yaml)
書き出したapi/openapi.yamlをコミットし、CIで実装との差分がないことを確かめる
"""

import sys
from pathlib import Path

import yaml

from clubportal.main import create_app


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("使い方: python -m clubportal.export_openapi <出力先>")
    schema = create_app().openapi()
    text = yaml.safe_dump(schema, allow_unicode=True, sort_keys=False)
    Path(sys.argv[1]).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
