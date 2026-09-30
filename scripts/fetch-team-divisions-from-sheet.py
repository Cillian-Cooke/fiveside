#!/usr/bin/env python3
"""Parse team → division from the league sheet Contact Info tab (public gviz CSV)."""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import urllib.parse
import urllib.request

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"
DEFAULT_SHEET_NAME = "Contact Info"

DIVISION_HEADER = re.compile(r"^Division \d+$")


def fetch_contact_rows(sheet_id: str, sheet_name: str) -> list[list[str]]:
    quoted = urllib.parse.quote(sheet_name)
    url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq"
        f"?tqx=out:csv&sheet={quoted}"
    )
    with urllib.request.urlopen(url, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    return [row for row in reader]


def parse_divisions(rows: list[list[str]]) -> dict[str, str]:
    current: str | None = None
    teams: dict[str, str] = {}
    for row in rows:
        name = (row[1] if len(row) > 1 else "").strip()
        if not name:
            continue
        if DIVISION_HEADER.match(name) or name in ("Mixed Division", "Mixed"):
            current = "Mixed Division" if name == "Mixed" else name
            continue
        if current:
            teams[name] = current
    return teams


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID)
    parser.add_argument("--sheet-name", default=DEFAULT_SHEET_NAME)
    args = parser.parse_args()
    try:
        rows = fetch_contact_rows(args.sheet_id, args.sheet_name)
        teams = parse_divisions(rows)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
    print(json.dumps({"teams": teams, "count": len(teams)}))


if __name__ == "__main__":
    main()
