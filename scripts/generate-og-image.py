#!/usr/bin/env python3
"""Render public/og-timetable.png for link previews (1200×630)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og-timetable.png"

W, H = 1200, 630
BG = (51, 54, 59)
TEXT = (246, 246, 245)
MUTED = (180, 184, 188)
ACCENT = (0, 90, 168)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def wrap(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def main() -> int:
    payload = json.loads(sys.stdin.read())
    title = payload.get("title", "Five-a-side fixtures")
    subtitle = payload.get("subtitle", "")
    columns: list[dict] = payload.get("columns", [])

    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    title_font = load_font(44, bold=True)
    sub_font = load_font(26)
    day_font = load_font(22, bold=True)
    line_font = load_font(17)

    draw.text((48, 40), title, fill=TEXT, font=title_font)
    if subtitle:
        draw.text((48, 98), subtitle, fill=MUTED, font=sub_font)

    col_count = max(len(columns), 1)
    gap = 16
    left, top = 48, 150
    col_w = (W - left * 2 - gap * (col_count - 1)) // col_count
    col_h = H - top - 48

    for i, col in enumerate(columns):
        x0 = left + i * (col_w + gap)
        draw.rounded_rectangle((x0, top, x0 + col_w, top + col_h), radius=12, fill=(42, 45, 50))
        draw.text((x0 + 14, top + 12), col.get("label", ""), fill=ACCENT, font=day_font)
        y = top + 48
        for entry in col.get("lines", []):
            for line in wrap(draw, entry, line_font, col_w - 28):
                if y > top + col_h - 24:
                    break
                draw.text((x0 + 14, y), line, fill=TEXT, font=line_font)
                y += 22
            y += 4

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, format="PNG", optimize=True)
    print(str(OUT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
