#!/usr/bin/env python3
"""Render a concept's frames into two contact sheets so they can actually be looked at.

Usage, from the project root:
    uv run python .docs/.../concepts/verify.py <slug> [<slug> ...]

Writes .verify/<slug>-mobile.png and .verify/<slug>-desktop.png.
Frames are inlined into an HTML wrapper that links the concept's Google Fonts, so the
typography rendered is the real typography rather than a fallback substitution.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VERIFY = HERE / ".verify"

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

MOBILE = ["m1-today", "m2-capture-pending", "m3-review-proposed", "m4-review-editing",
          "m5-review-partial-undo", "m6-task-detail", "m7-smartlist",
          "m8-settings-no-key", "m9-first-run"]
DESKTOP = ["d1-today", "d2-review-proposed", "d3-review-editing", "d4-review-partial-undo",
           "d5-task-detail", "d6-archive", "d7-settings-cloud-off", "d8-settings-failure"]


def strip_svg(raw: str, px: int) -> str:
    raw = re.sub(r"<\?xml[^>]*\?>", "", raw)
    raw = re.sub(r"<!DOCTYPE[^>]*>", "", raw, flags=re.IGNORECASE)
    raw = raw.strip()
    raw = re.sub(r'\swidth="[^"]*"', "", raw, count=1)
    raw = re.sub(r'\sheight="[^"]*"', "", raw, count=1)
    return raw.replace("<svg", f'<svg width="{px}"', 1)


def sheet(d: Path, slug: str, stems: list[str], px: int, per_row: int, fonts: list[str]) -> str:
    link = ""
    if fonts:
        fams = "&".join("family=" + f.replace(" ", "+") + ":wght@300;400;500;600;700;800"
                        for f in fonts)
        link = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
                + fams + '&display=swap">')
    cells = []
    for s in stems:
        f = d / f"{s}.svg"
        if not f.exists():
            cells.append(f'<div class="c absent">{s} — MISSING</div>')
            continue
        cells.append(f'<div class="c"><div class="lbl">{s}</div>'
                     + strip_svg(f.read_text(encoding="utf-8"), px) + "</div>")
    return f"""<!doctype html><html><head><meta charset="utf-8">{link}
<style>
 html,body{{margin:0;background:#4a4d57;font:12px ui-sans-serif,system-ui,sans-serif;}}
 .grid{{display:grid;grid-template-columns:repeat({per_row},{px}px);gap:14px;padding:14px;
   width:max-content;}}
 .c svg{{display:block;background:#fff;border:1px solid #23252c;}}
 .lbl{{color:#e6e7ea;font:11px/1.6 ui-monospace,monospace;padding-bottom:3px;}}
 .absent{{color:#ffb4b4;border:1px dashed #a06a6a;padding:30px;text-align:center;}}
</style></head><body><div class="grid">{''.join(cells)}</div></body></html>"""


def shoot(html: Path, png: Path, w: int, h: int) -> bool:
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
           "--force-device-scale-factor=1", f"--window-size={w},{h}",
           "--virtual-time-budget=7000", "--default-background-color=4a4d57",
           f"--screenshot={png}", html.resolve().as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if not png.exists():
        print(f"  render failed for {png.name}: {r.stderr.strip()[:300]}")
        return False
    return True


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    VERIFY.mkdir(exist_ok=True)
    for slug in sys.argv[1:]:
        d = HERE / slug
        if not d.is_dir():
            print(f"{slug}: no such directory")
            continue
        fonts = []
        pj = d / "palette.json"
        if pj.exists():
            try:
                fonts = json.loads(pj.read_text(encoding="utf-8")).get("fonts", [])
            except json.JSONDecodeError:
                pass

        tag = slug.replace("/", "-").replace("\\", "-")
        mw, mh = 230, 511                      # 360x800 scaled to 230 wide
        h_m = (mh + 34) + 28
        p = VERIFY / f"{tag}-mobile.html"
        p.write_text(sheet(d, slug, MOBILE, mw, 9, fonts), encoding="utf-8")
        ok = shoot(p, VERIFY / f"{tag}-mobile.png", mw * 9 + 14 * 10 + 20, h_m + 20)
        print(f"{slug}: mobile sheet {'ok' if ok else 'FAILED'}")

        dw = 600                               # 1280x800 scaled to 600 wide
        dh = int(600 * 800 / 1280)
        rows = (len(DESKTOP) + 1) // 2
        p = VERIFY / f"{tag}-desktop.html"
        p.write_text(sheet(d, slug, DESKTOP, dw, 2, fonts), encoding="utf-8")
        ok = shoot(p, VERIFY / f"{tag}-desktop.png",
                   dw * 2 + 14 * 3 + 20, rows * (dh + 34 + 14) + 40)
        print(f"{slug}: desktop sheet {'ok' if ok else 'FAILED'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
