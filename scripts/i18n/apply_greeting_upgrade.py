#!/usr/bin/env python3
"""Merge greeting-upgrade overlays into messages/*.json home objects."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MESSAGES = ROOT / "messages"
OVERLAYS = Path(__file__).resolve().parent / "greeting-upgrade"
EN_OVERLAY = Path(__file__).resolve().parent / "greeting_upgrade_en.json"


def merge(dst: dict, src: dict) -> None:
    for key, value in src.items():
        if isinstance(value, dict) and isinstance(dst.get(key), dict):
            merge(dst[key], value)
        else:
            dst[key] = value


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def apply_locale(locale: str, overlay: dict) -> None:
    path = MESSAGES / f"{locale}.json"
    data = load(path)
    home = data.setdefault("home", {})
    merge(home, overlay)
    dump(path, data)


def main() -> None:
    english = load(EN_OVERLAY)
    apply_locale("en", english)
    if OVERLAYS.is_dir():
        for path in sorted(OVERLAYS.glob("*.json")):
            apply_locale(path.stem, load(path))
    hans = MESSAGES / "zh-Hans.json"
    zh = MESSAGES / "zh.json"
    if hans.exists():
        dump(zh, load(hans))
    print("greeting upgrade overlays applied")


if __name__ == "__main__":
    main()
