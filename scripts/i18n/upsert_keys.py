#!/usr/bin/env python3
"""Add or set nested JSON keys without reshuffling existing key order."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def upsert(obj: dict, path: str, value) -> str:
    parts = path.split(".")
    cur = obj
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            cur[part] = nxt
        cur = nxt
    key = parts[-1]
    if key in cur and cur[key] == value:
        return "same"
    if key in cur:
        cur[key] = value
        return "set"
    cur[key] = value
    return "add"


def flatten(value, prefix=""):
    out = {}
    if isinstance(value, dict):
        for k, v in value.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
    else:
        out[prefix] = value
    return out


def main() -> None:
    catalog_path = Path(sys.argv[1])
    patch_path = Path(sys.argv[2])
    catalog = json.loads(catalog_path.read_text())
    patch = json.loads(patch_path.read_text())
    added = set_ = same = 0
    for path, value in flatten(patch).items():
        if not isinstance(value, str):
            raise TypeError(f"{path} is not a string")
        result = upsert(catalog, path, value)
        if result == "add":
            added += 1
        elif result == "set":
            set_ += 1
        else:
            same += 1
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print(f"{catalog_path.name}: +{added} ~{set_} ={same}")


if __name__ == "__main__":
    main()
