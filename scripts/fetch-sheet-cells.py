#!/usr/bin/env python3
"""Fetch league fixtures tab as rows with cell text + background colour (public xlsx export)."""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
import zipfile
from xml.etree import ElementTree as ET

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
COLS = 20
SKIP_RGB = frozenset(
    {
        "FFFFFFFF",
        "00000000",
        "FFF0F0F0",
        "FFE7E6E6",
        "FFD3D3D3",
        "FFCCCCCC",
    }
)
GREY_MIXED = "#B7B7B7"
DIVISION_LABEL = re.compile(r"^Division \d+$")


def col_letters_to_index(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def cell_ref_indices(ref: str) -> tuple[int, int]:
    m = re.match(r"^([A-Z]+)(\d+)$", ref)
    if not m:
        return 0, 0
    return int(m.group(2)) - 1, col_letters_to_index(m.group(1))


def download_xlsx(sheet_id: str) -> bytes:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def load_styles(z: zipfile.ZipFile) -> tuple[list[dict], list[ET.Element]]:
    styles = ET.fromstring(z.read("xl/styles.xml"))
    fills: list[dict] = []
    for fill in styles.findall(".//m:fill", NS):
        fg = fill.find(".//m:fgColor", NS)
        fills.append(dict(fg.attrib) if fg is not None else {})
    xfs = styles.findall(".//m:cellXfs/m:xf", NS)
    return fills, xfs


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in ss.findall("m:si", NS):
        out.append("".join(t.text or "" for t in si.findall(".//m:t", NS)))
    return out


def load_theme_rgbs(z: zipfile.ZipFile) -> list[str]:
    path = "xl/theme/theme1.xml"
    if path not in z.namelist():
        return []
    ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
    root = ET.fromstring(z.read(path))
    scheme = root.find(".//a:clrScheme", ns)
    if scheme is None:
        return []
    out: list[str] = []
    for child in list(scheme):
        srgb = child.find(".//a:srgbClr", ns)
        sys = child.find(".//a:sysClr", ns)
        if srgb is not None and srgb.get("val"):
            out.append(srgb.get("val", "").upper())
        elif sys is not None and sys.get("lastClr"):
            out.append(sys.get("lastClr", "").upper())
        else:
            out.append("000000")
    return out


def apply_tint(rgb: str, tint: float) -> str:
    if len(rgb) != 6:
        return rgb
    channels = [int(rgb[i : i + 2], 16) for i in (0, 2, 4)]
    out = []
    for channel in channels:
        if tint < 0:
            value = channel * (1 + tint)
        else:
            value = channel * (1 - tint) + 255 * tint
        out.append(f"{max(0, min(255, round(value))):02X}")
    return "".join(out)


def rgb_to_hex(fg: dict, theme_rgbs: list[str]) -> str | None:
    rgb = fg.get("rgb")
    if rgb and rgb not in SKIP_RGB and len(rgb) == 8:
        return "#" + rgb[2:].upper()
    theme = fg.get("theme")
    if theme is None or not theme_rgbs:
        return None
    idx = int(theme)
    if idx >= len(theme_rgbs):
        return None
    raw = theme_rgbs[idx]
    tint = float(fg.get("tint", "0") or "0")
    if tint:
        raw = apply_tint(raw, tint)
    hex_color = "#" + raw.upper()
    if hex_color in {"#FFFFFF", "#000000"}:
        return None
    return hex_color


def cell_style_hex(
    style_index: int,
    fills: list[dict],
    xfs: list[ET.Element],
    theme_rgbs: list[str],
) -> str | None:
    if style_index >= len(xfs):
        return None
    fill_id = int(xfs[style_index].get("fillId", "0"))
    if fill_id >= len(fills):
        return None
    return rgb_to_hex(fills[fill_id], theme_rgbs)


def cell_text(cell: ET.Element, shared: list[str]) -> str:
    v = cell.find("m:v", NS)
    if v is not None and v.text is not None:
        if cell.get("t") == "s":
            return shared[int(v.text)]
        return v.text
    is_elem = cell.find("m:is", NS)
    if is_elem is not None:
        return "".join(t.text or "" for t in is_elem.findall(".//m:t", NS))
    return ""


REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def worksheet_targets(z: zipfile.ZipFile) -> list[tuple[str, str]]:
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    out: list[tuple[str, str]] = []
    for sh in wb.findall("m:sheets/m:sheet", NS):
        name = sh.attrib.get("name", "")
        if sh.attrib.get("state") == "hidden":
            continue
        if "contact" in name.lower():
            continue
        rid = sh.attrib.get(f"{REL_NS}id")
        target = rel_map.get(rid or "")
        if not target:
            continue
        if not target.startswith("xl/"):
            target = "xl/" + target.lstrip("/")
        out.append((name, target))
    return out


def parse_worksheet(
    z: zipfile.ZipFile,
    path: str,
    fills: list[dict],
    xfs: list[ET.Element],
    shared: list[str],
    theme_rgbs: list[str],
) -> tuple[list[list[dict]], dict[str, str]]:
    sh = ET.fromstring(z.read(path))
    sparse: dict[tuple[int, int], dict] = {}
    legend_by_division: dict[str, str] = {}

    for row_el in sh.findall(".//m:sheetData/m:row", NS):
        for cell in row_el.findall("m:c", NS):
            ref = cell.get("r")
            if not ref:
                continue
            r_idx, c_idx = cell_ref_indices(ref)
            text = cell_text(cell, shared)
            style = int(cell.get("s", "0"))
            color = cell_style_hex(style, fills, xfs, theme_rgbs)
            sparse[(r_idx, c_idx)] = {"text": text, "color": color}

            label = text.strip().replace("\n", " ")
            if DIVISION_LABEL.match(label) or label == "Mixed":
                if color:
                    legend_by_division[label if label != "Mixed" else "Mixed Division"] = color

    if not sparse:
        return [], legend_by_division

    max_row = max(r for r, _ in sparse)
    max_col = max(max(c for _, c in sparse) + 1, COLS)
    rows: list[list[dict]] = []
    for r in range(max_row + 1):
        row: list[dict] = []
        for c in range(max_col):
            cell = sparse.get((r, c), {"text": "", "color": None})
            row.append(cell)
        rows.append(row)
    return rows, legend_by_division


def parse_workbook(xlsx: bytes) -> tuple[list[dict], dict[str, str], dict[str, str]]:
    z = zipfile.ZipFile(__import__("io").BytesIO(xlsx))
    fills, xfs = load_styles(z)
    shared = load_shared_strings(z)
    theme_rgbs = load_theme_rgbs(z)
    tabs: list[dict] = []
    legend: dict[str, str] = {}
    for name, path in worksheet_targets(z):
        rows, tab_legend = parse_worksheet(z, path, fills, xfs, shared, theme_rgbs)
        if len(rows) < 5:
            continue
        tabs.append({"name": name, "rows": rows})
        legend.update(tab_legend)

    color_to_division: dict[str, str] = {}
    for division, color in legend.items():
        color_to_division[color.upper()] = division
    if GREY_MIXED not in color_to_division:
        color_to_division[GREY_MIXED] = "Mixed Division"
    return tabs, legend, color_to_division


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID)
    args = parser.parse_args()
    try:
        xlsx = download_xlsx(args.sheet_id)
        tabs, legend, color_to_division = parse_workbook(xlsx)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
    print(
        json.dumps(
            {
                "tabs": tabs,
                "legend": legend,
                "colorToDivision": color_to_division,
            }
        )
    )


if __name__ == "__main__":
    main()
