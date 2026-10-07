#!/usr/bin/env python3
"""Parse team → division + Contact section colour from the league sheet Contact Info tab."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from contact_info_layout import parse_contact_layout  # noqa: E402

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"
DEFAULT_SHEET_NAME = "Contact Info"


def canonical_division_label(division: str) -> str:
    if division in ("Mixed League", "Mixed"):
        return "Mixed Division"
    return division


def build_teams(
    contacts: list[dict], division_colors: dict[str, str]
) -> dict[str, dict[str, str]]:
    teams: dict[str, dict[str, str]] = {}
    for row in contacts:
        name = row.get("team", "")
        if not name or name == "Mixed League":
            continue
        division = row.get("division", "")
        color = division_colors.get(division) or row.get("color") or ""
        entry = {"division": division, "color": color}
        if name not in teams:
            teams[name] = entry
            continue
        existing = teams[name]
        if existing.get("division") == division:
            continue
        by_div = dict(existing.get("byDivision") or {})
        if not by_div:
            first = canonical_division_label(existing["division"])
            by_div[first] = {
                "division": existing["division"],
                "color": existing["color"],
            }
        label = canonical_division_label(division)
        by_div[label] = {"division": division, "color": color}
        teams[name] = {**existing, "byDivision": by_div}
    return teams


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID)
    parser.add_argument("--sheet-name", default=DEFAULT_SHEET_NAME)
    args = parser.parse_args()
    try:
        contacts, division_colors = parse_contact_layout(args.sheet_id, args.sheet_name)
        teams = build_teams(contacts, division_colors)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
    print(
        json.dumps(
            {
                "teams": teams,
                "division_colors": division_colors,
                "count": len(teams),
            }
        )
    )


if __name__ == "__main__":
    main()
