"""Contact Info tab layout: team → section, division label, display colour (header fill)."""
from __future__ import annotations

import io
import re
import urllib.request
import zipfile
from xml.etree import ElementTree as ET

DEFAULT_SHEET_ID = "19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o"
DEFAULT_SHEET_NAME = "Contact Info"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
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
DIVISION_HEADER = re.compile(r"^Division \d+$")
SECTION_HEADERS = frozenset({"Mixed Division", "Mixed"})


def download_xlsx(sheet_id: str) -> bytes:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def _rgb_to_hex(fg: dict | None) -> str | None:
    if not fg:
        return None
    rgb = fg.get("rgb")
    if not rgb or rgb in SKIP_RGB or len(rgb) != 8:
        return None
    return "#" + rgb[2:].upper()


def _cell_text(cell: ET.Element, shared: list[str]) -> str:
    v = cell.find("m:v", NS)
    if v is not None and v.text is not None:
        if cell.get("t") == "s":
            return shared[int(v.text)]
        return v.text
    is_elem = cell.find("m:is", NS)
    if is_elem is not None:
        return "".join(t.text or "" for t in is_elem.findall(".//m:t", NS))
    return ""


def _cell_hex(cell: ET.Element, fills: list[dict], xfs: list[ET.Element]) -> str | None:
    style_index = int(cell.get("s", "0"))
    if style_index >= len(xfs):
        return None
    fill_id = int(xfs[style_index].get("fillId", "0"))
    if fill_id >= len(fills):
        return None
    return _rgb_to_hex(fills[fill_id])


def _header_hex(grid: dict, row: int) -> str | None:
    for col in ("B", "C"):
        h = grid.get((col, row), {}).get("color")
        if h:
            return h
    return None


def parse_contact_layout(
    sheet_id: str = DEFAULT_SHEET_ID,
    sheet_name: str = DEFAULT_SHEET_NAME,
) -> tuple[list[dict], dict[str, str]]:
    """Return (contacts with team/division/color, division_header_colors)."""
    data = download_xlsx(sheet_id)
    z = zipfile.ZipFile(io.BytesIO(data))
    styles = ET.fromstring(z.read("xl/styles.xml"))
    fills: list[dict] = []
    for fill in styles.findall(".//m:fill", NS):
        fg = fill.find(".//m:fgColor", NS)
        fills.append(dict(fg.attrib) if fg is not None else {})
    xfs = styles.findall(".//m:cellXfs/m:xf", NS)
    shared: list[str] = []
    if "xl/sharedStrings.xml" in z.namelist():
        ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in ss.findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.findall(".//m:t", NS)))

    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    path = None
    for sh in wb.findall("m:sheets/m:sheet", NS):
        if sh.attrib.get("name") == sheet_name:
            rid = sh.attrib.get(f"{REL_NS}id")
            target = rel_map.get(rid or "")
            if not target.startswith("xl/"):
                target = "xl/" + target.lstrip("/")
            path = target
    if not path:
        raise ValueError(f"Sheet tab not found: {sheet_name}")

    root = ET.fromstring(z.read(path))
    grid: dict[tuple[str, int], dict] = {}
    for row in root.findall(".//m:sheetData/m:row", NS):
        for cell in row.findall("m:c", NS):
            ref = cell.get("r", "")
            m = re.match(r"^([A-Z]+)(\d+)$", ref)
            if not m:
                continue
            col, r = m.group(1), int(m.group(2))
            grid[(col, r)] = {
                "text": _cell_text(cell, shared).strip(),
                "color": _cell_hex(cell, fills, xfs),
            }

    division_colors: dict[str, str] = {}
    current_div: str | None = None
    current_color: str | None = None
    contacts: list[dict] = []

    for r in range(1, 400):
        team = grid.get(("B", r), {}).get("text", "")
        if not team:
            continue
        if DIVISION_HEADER.match(team) or team in SECTION_HEADERS:
            current_div = "Mixed Division" if team == "Mixed" else team
            current_color = _header_hex(grid, r)
            if current_div and current_color:
                division_colors[current_div] = current_color
            continue
        if team == "Mixed League":
            current_div = "Mixed League"
            current_color = _header_hex(grid, r) or "#93C47D"
            division_colors["Mixed League"] = current_color
            continue
        if not current_div:
            continue
        contacts.append(
            {
                "team": team,
                "division": current_div,
                "color": current_color,
            }
        )

    return contacts, division_colors
