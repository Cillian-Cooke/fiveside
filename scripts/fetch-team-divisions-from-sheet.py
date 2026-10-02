#!/usr/bin/env python3
"""Parse team → division + Contact section colour from the league sheet Contact Info tab."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

TCD_SCRIPTS = Path(__file__).resolve().parents[2] / "tcd5aside" / "scripts"
sys.path.insert(0, str(TCD_SCRIPTS))

from contact_info_layout import parse_contact_layout  # noqa: E402

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"
DEFAULT_SHEET_NAME = "Contact Info"


def build_teams(
    contacts: list[dict], division_colors: dict[str, str]
) -> dict[str, dict[str, str]]:
    teams: dict[str, dict[str, str]] = {}
    for row in contacts:
        name = row.get("team", "")
        if not name or name == "Mixed League":
            continue
        if name in teams:
            continue
        division = row.get("division", "")
        color = division_colors.get(division) or row.get("color") or ""
        teams[name] = {"division": division, "color": color}
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
