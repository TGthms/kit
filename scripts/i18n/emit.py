#!/usr/bin/env python3
"""Build complete locale JSON catalogs from English + override packs."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MESSAGES = ROOT / "messages"


def leaf_paths(obj, prefix=""):
    if isinstance(obj, dict):
        out = []
        for k, v in obj.items():
            out.extend(leaf_paths(v, f"{prefix}.{k}" if prefix else k))
        return out
    return [prefix]


def get_path(obj, path):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def set_path(obj, path, value):
    parts = path.split(".")
    cur = obj
    for part in parts[:-1]:
        cur = cur[part]
    cur[parts[-1]] = value


def load_en():
    return json.loads((MESSAGES / "en.json").read_text(encoding="utf-8"))


def apply(en, flat: dict[str, str]) -> dict:
    out = deepcopy(en)
    missing = []
    extra = []
    required = leaf_paths(en)
    req_set = set(required)
    for path in required:
        if path not in flat:
            missing.append(path)
    for path in flat:
        if path not in req_set:
            extra.append(path)
    if missing or extra:
        raise SystemExit(
            f"pack mismatch missing={len(missing)} extra={len(extra)}\n"
            f"missing sample={missing[:12]}\nextra sample={extra[:12]}"
        )
    for path, value in flat.items():
        if not isinstance(value, str) or not value.strip():
            raise SystemExit(f"empty translation: {path}")
        set_path(out, path, value)
    return out


def write_locale(code: str, tree: dict) -> None:
    path = MESSAGES / f"{code}.json"
    path.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)}")


def flat_from_lines(paths: list[str], text: str, code: str) -> dict[str, str]:
    lines = text.splitlines()
    if len(lines) != len(paths):
        raise SystemExit(f"{code}: expected {len(paths)} lines, got {len(lines)}")
    return dict(zip(paths, lines))


def main() -> None:
    en = load_en()
    paths = leaf_paths(en)
    values_dir = Path(__file__).parent / "values"
    for path in sorted(values_dir.glob("*.txt")):
        code = path.stem
        flat = flat_from_lines(paths, path.read_text(encoding="utf-8"), code)
        write_locale(code, apply(en, flat))
    hans = json.loads((MESSAGES / "zh-Hans.json").read_text(encoding="utf-8"))
    write_locale("zh", hans)


if __name__ == "__main__":
    main()
