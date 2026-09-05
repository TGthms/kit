#!/usr/bin/env python3
"""Set existing nested JSON keys in a messages catalog without reshuffling."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def deep_get(obj: dict, path: str):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def deep_set(obj: dict, path: str, value) -> None:
    parts = path.split(".")
    cur = obj
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            raise KeyError(f"missing parent {part} in {path}")
        cur = nxt
    if parts[-1] not in cur:
        raise KeyError(f"missing key {path}")
    cur[parts[-1]] = value


def flatten(value, prefix=""):
    out = {}
    if isinstance(value, dict):
        for k, v in value.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
    else:
        out[prefix] = value
    return out


def apply_patch(catalog: dict, patch: dict) -> list[str]:
    changed = []
    for path, value in flatten(patch).items():
        if not isinstance(value, str):
            raise TypeError(f"{path} is not a string")
        old = deep_get(catalog, path)
        if old is None:
            raise KeyError(f"unknown path {path}")
        if old != value:
            deep_set(catalog, path, value)
            changed.append(path)
    return changed


def main() -> None:
    catalog_path = Path(sys.argv[1])
    patch_path = Path(sys.argv[2])
    catalog = json.loads(catalog_path.read_text())
    patch = json.loads(patch_path.read_text())
    changed = apply_patch(catalog, patch)
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print(f"{catalog_path.name}: {len(changed)} keys updated")


if __name__ == "__main__":
    main()
