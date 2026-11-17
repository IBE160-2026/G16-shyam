#!/usr/bin/env python3
"""Inline a concept's SVG frames into a reviewable concept.html.

Usage, from the project root:
    python .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/.working/concepts/build-concept-page.py <NN-slug>

Reads <NN-slug>/palette.json for the concept name and Google Font families,
inlines every .svg frame in the documented order, and writes <NN-slug>/concept.html.
Frames are inlined (not <img>) so the Google Fonts faces actually apply to SVG text.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

ORDER = [
    ("m1-today", "Today — cold open", "mobile"),
    ("m2-capture-pending", "Capture, suggestion pending", "mobile"),
    ("m3-review-proposed", "Review — all three parts proposed", "mobile"),
    ("m4-review-editing", "Review — editing Priority only", "mobile"),
    ("m5-review-partial-undo", "Review — partial, with undo live", "mobile"),
    ("m6-task-detail", "Task detail", "mobile"),
    ("m7-smartlist", "Smart List — Need Attention", "mobile"),
    ("m8-settings-no-key", "Settings — no API Key", "mobile"),
    ("m9-first-run", "First run", "mobile"),
    ("d1-today", "Today — cold open", "desktop"),
    ("d2-review-proposed", "Review — all three parts proposed", "desktop"),
    ("d3-review-editing", "Review — editing Priority only", "desktop"),
    ("d4-review-partial-undo", "Review — partial, with undo live", "desktop"),
    ("d5-task-detail", "Task detail in the shell", "desktop"),
    ("d6-archive", "Archive", "desktop"),
    ("d7-settings-cloud-off", "Settings — key saved, Cloud Suggestions off", "desktop"),
    ("d8-settings-failure", "Settings — persistent failure", "desktop"),
]

HERO = {"m3-review-proposed", "m4-review-editing", "m5-review-partial-undo",
        "d2-review-proposed", "d3-review-editing", "d4-review-partial-undo"}


def strip_svg(raw: str) -> str:
    """Remove XML prolog and DOCTYPE so the SVG can be inlined in HTML."""
    raw = re.sub(r"<\?xml[^>]*\?>", "", raw)
    raw = re.sub(r"<!DOCTYPE[^>]*>", "", raw, flags=re.IGNORECASE)
    return raw.strip()


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    slug = sys.argv[1]
    d = HERE / slug
    if not d.is_dir():
        print(f"error: no such concept directory: {d}")
        return 1

    meta = {"name": slug, "fonts": [], "colors": {}}
    pj = d / "palette.json"
    if pj.exists():
        try:
            meta.update(json.loads(pj.read_text(encoding="utf-8")))
        except json.JSONDecodeError as exc:
            print(f"warning: palette.json is not valid JSON ({exc}); continuing without it")

    fonts = [f for f in meta.get("fonts", []) if isinstance(f, str) and f.strip()]
    font_link = ""
    if fonts:
        fams = "&".join(
            "family=" + f.strip().replace(" ", "+") + ":wght@300;400;500;600;700;800"
            for f in fonts
        )
        font_link = (
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fams}&display=swap">'
        )

    chips = "".join(
        f'<span class="chip"><i style="background:{v}"></i>'
        f'<code>{k}</code><code class="hex">{v}</code></span>'
        for k, v in (meta.get("colors") or {}).items()
    )

    sections = []
    missing = []
    for kind in ("mobile", "desktop"):
        rows = []
        for stem, label, k in ORDER:
            if k != kind:
                continue
            f = d / f"{stem}.svg"
            if not f.exists():
                missing.append(f"{stem}.svg")
                rows.append(
                    f'<figure class="frame {kind} absent"><div class="ph">not drawn</div>'
                    f'<figcaption><b>{stem}</b>{label}</figcaption></figure>'
                )
                continue
            hero = " hero" if stem in HERO else ""
            rows.append(
                f'<figure class="frame {kind}{hero}">{strip_svg(f.read_text(encoding="utf-8"))}'
                f'<figcaption><b>{stem}</b>{label}'
                + ('<em>accept / edit / reject</em>' if hero else '')
                + '</figcaption></figure>'
            )
        title = "Mobile — 360 × 800" if kind == "mobile" else "Desktop — 1280 × 800"
        sections.append(f'<h2>{title}</h2><div class="strip {kind}">' + "".join(rows) + "</div>")

    concept_md = ""
    cm = d / "CONCEPT.md"
    if cm.exists():
        concept_md = cm.read_text(encoding="utf-8")

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{meta.get('name', slug)} — To-Do-List concept</title>
{font_link}
<style>
  :root {{ color-scheme: light; }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; background:#15161a; color:#e8e8ea;
    font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }}
  header {{ padding:40px 32px 24px; border-bottom:1px solid #2c2d33; }}
  h1 {{ margin:0 0 6px; font-size:28px; letter-spacing:-0.02em; font-weight:700; }}
  .slug {{ color:#8b8d96; font-size:13px; }}
  .chips {{ display:flex; flex-wrap:wrap; gap:6px; margin-top:18px; }}
  .chip {{ display:inline-flex; align-items:center; gap:6px; background:#1e1f25;
    border:1px solid #2c2d33; border-radius:2px; padding:4px 8px; font-size:11px; }}
  .chip i {{ width:12px; height:12px; border-radius:2px; box-shadow:inset 0 0 0 1px #0004; }}
  .chip code {{ color:#b9bbc4; }} .chip .hex {{ color:#6e7079; }}
  main {{ padding:32px; }}
  h2 {{ font-size:12px; text-transform:uppercase; letter-spacing:0.12em; color:#8b8d96;
    margin:40px 0 16px; font-weight:600; }}
  h2:first-child {{ margin-top:0; }}
  .strip {{ display:flex; gap:20px; overflow-x:auto; padding-bottom:16px; align-items:flex-start; }}
  .frame {{ margin:0; flex:0 0 auto; }}
  .frame svg {{ display:block; background:#fff; border:1px solid #2c2d33; border-radius:3px; }}
  .frame.mobile svg {{ width:360px; height:800px; }}
  .frame.desktop svg {{ width:640px; height:400px; }}
  .frame.desktop.hero svg {{ width:1280px; height:800px; }}
  figcaption {{ margin-top:8px; font-size:11px; color:#8b8d96; max-width:360px; }}
  figcaption b {{ display:block; color:#d6d7dd; font-family:ui-monospace,monospace; font-weight:500; }}
  figcaption em {{ display:inline-block; margin-top:4px; padding:1px 6px; border-radius:2px;
    background:#3a2f12; color:#e8c877; font-style:normal; font-size:10px;
    text-transform:uppercase; letter-spacing:0.08em; }}
  .absent .ph {{ width:360px; height:800px; display:grid; place-items:center;
    border:1px dashed #44464f; border-radius:3px; color:#6e7079; font-size:12px; }}
  .doc {{ max-width:70ch; margin:56px 0 0; padding-top:28px; border-top:1px solid #2c2d33;
    white-space:pre-wrap; font-size:13px; line-height:1.7; color:#c3c5cd; }}
  .warn {{ margin:24px 32px 0; padding:10px 14px; border:1px solid #5a3a3a; background:#2a1c1c;
    border-radius:3px; color:#e0a3a3; font-size:12px; }}
</style></head><body>
<header>
  <h1>{meta.get('name', slug)}</h1>
  <div class="slug">{slug} &middot; To-Do-List &middot; concept exploration, 2026-11-16</div>
  <div class="chips">{chips}</div>
</header>
{'<div class="warn">Frames not drawn: ' + ', '.join(missing) + '</div>' if missing else ''}
<main>
{''.join(sections)}
<div class="doc">{concept_md.replace('&', '&amp;').replace('<', '&lt;')}</div>
</main></body></html>
"""
    out = d / "concept.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out}")
    print(f"frames inlined: {len(ORDER) - len(missing)}/{len(ORDER)}")
    if missing:
        print("MISSING: " + ", ".join(missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
