#!/usr/bin/env python3
"""Fetch league fixtures sheet as JSON rows (stdlib csv handles multiline cells)."""
from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import urllib.request

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"


def fetch_rows(sheet_id: str, gid: str) -> list[list[str]]:
    url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/export"
        f"?format=csv&gid={gid}"
    )
    with urllib.request.urlopen(url, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows: list[list[str]] = []
    for row in reader:
        padded = row + [""] * (14 - len(row))
        rows.append(padded[:14])
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID)
    parser.add_argument("--gid", default="0")
    args = parser.parse_args()
    try:
        rows = fetch_rows(args.sheet_id, args.gid)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
    print(json.dumps({"rows": rows}))


if __name__ == "__main__":
    main()
