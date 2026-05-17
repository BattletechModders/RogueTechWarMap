#!/usr/bin/env python3
"""Validates JSON syntax for all .json files in the repo."""

import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).parent.parent.parent
    errors: list[str] = []
    total = 0

    for f in sorted(root.rglob("*.json")):
        if any(p.startswith(".") for p in f.parts):
            continue
        # tsconfig*.json files are JSONC (JSON with Comments) — TypeScript handles them
        if f.name.startswith("tsconfig"):
            continue
        total += 1
        try:
            json.loads(f.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as e:
            errors.append(f"{f.relative_to(root)}: {e}")

    if errors:
        print(f"FAILED — {len(errors)} invalid JSON file(s) out of {total}:\n")
        for err in errors:
            print(f"  {err}")
        return 1

    print(f"OK — {total} JSON files valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
