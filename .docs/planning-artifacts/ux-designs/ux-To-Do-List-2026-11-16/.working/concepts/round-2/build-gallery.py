#!/usr/bin/env python3
"""Assemble round 2 into one reviewable gallery.

Usage, from the project root:
    uv run python .docs/.../concepts/round-2/build-gallery.py
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

HAND = [
    ("06-kurs", "Kurs", "the course stays a separate layer", "a"),
    ("07-beskrivelse", "Beskrivelse", "the sheet is read across the row", "b"),
]

# Which concept each frame's structure comes from — straight out of decisions.md.
PROV = [
    ("m1", "Today — cold open", "01 Date Due"),
    ("m2", "Capture, suggestion pending", "05 Tett"),
    ("m3", "Review — all three proposed", "03 Kartet"),
    ("m4", "Review — editing Priority only", "03 Kartet"),
    ("m5", "Review — partial, undo live", "01 Date Due"),
    ("m6", "Task detail", "05 Tett"),
    ("m7", "Smart list", "05 Tett"),
    ("m8", "Settings — no API key", "01 Date Due"),
    ("m9", "First run", "01 Date Due + 05 Tett"),
    ("d1", "Today — cold open", "05 Tett"),
    ("d2", "Review — all three proposed", "05 Tett"),
    ("d3", "Review — editing Priority only", "03 Kartet"),
    ("d4", "Review — partial, undo live", "05 Tett"),
    ("d5", "Task detail in the shell", "03 Kartet"),
    ("d6", "Archive", "03 Kartet"),
    ("d7", "Settings", "05 Tett"),
    ("d8", "Settings — persistent failure", "05 Tett"),
]

OPEN = [
    ("d5 has an alternative you flagged",
     "You wrote that d5 &laquo;kan også vurderes fra nr. 1 Due date&raquo;. Both concepts "
     "currently build d5 from Kartet, as your primary choice. The Date Due variant is a "
     "separate frame if you want to see it."),
    ("The three open decisions are still open",
     "Interface language, accessibility standard, and whether priority and engine "
     "provenance may ever be carried by colour alone. Both concepts render English, hold "
     "4.5:1 on body text, and carry every state in a mark as well as an ink — but none of "
     "that is confirmed, and Settings states the language question on screen rather than "
     "hiding it."),
]


def section(md, heading):
    m = re.search(rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s|\Z)", md,
                  re.MULTILINE | re.DOTALL)
    if not m:
        return ""
    body = m.group(1).strip().replace("&", "&amp;").replace("<", "&lt;")
    body = re.sub(r"`([^`]+)`", r"<code>\1</code>", body)
    body = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", body)
    body = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", body)
    paras = [p.strip().replace("\n", " ") for p in re.split(r"\n\s*\n", body) if p.strip()]
    return "".join(f"<p>{p}</p>" for p in paras)


def strip_svg(raw, px):
    raw = re.sub(r"<\?xml[^>]*\?>", "", raw)
    raw = re.sub(r"<!DOCTYPE[^>]*>", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r'\swidth="[^"]*"', "", raw, count=1)
    raw = re.sub(r'\sheight="[^"]*"', "", raw, count=1)
    return raw.replace("<svg", f'<svg width="{px}"', 1)


def main():
    fonts, cards = [], []
    for slug, name, tag, tone in HAND:
        d = HERE / slug
        meta = json.loads((d / "palette.json").read_text(encoding="utf-8"))
        for f in meta.get("fonts", []):
            if f not in fonts:
                fonts.append(f)
        md = (d / "CONCEPT.md").read_text(encoding="utf-8")
        chips = "".join(
            f'<span class="chip" title="{k}: {v}"><i style="background:{v}"></i>{k}</span>'
            for k, v in meta["colors"].items())
        thumbs = ""
        for stem, lblw, px in (("m3-review-proposed", "360 px", 290),
                               ("d2-review-proposed", "1280 px", 760)):
            f = d / f"{stem}.svg"
            if f.exists():
                thumbs += ('<div class="th"><div class="shot">'
                           + strip_svg(f.read_text(encoding="utf-8"), px)
                           + f'</div><span>{lblw} &middot; {stem}</span></div>')
        cards.append(f"""
<article class="card {tone}" id="{slug}">
  <div class="head">
    <h3>{name}<span class="badge">{tag}</span></h3>
    <div class="fonts">Kartet's world, unchanged &middot; {' &middot; '.join(meta['fonts'])}</div>
    <div class="palette">{chips}</div>
  </div>
  <div class="thumbs">{thumbs}</div>
  <div class="prose">
    <section><h4>Thesis</h4>{section(md, 'Thesis')}</section>
    <section><h4>Signature move</h4>{section(md, 'Signature move')}</section>
    <section><h4>Accept / edit / reject</h4>{section(md, 'Accept / edit / reject')}</section>
    <section><h4>360 and 1280</h4>{section(md, '360 and 1280')}</section>
    <section class="risk"><h4>Honest risk</h4>{section(md, 'Honest risk')}</section>
  </div>
  <a class="open" href="{slug}/concept.html">Open all 17 frames &rarr;</a>
</article>""")

    fams = "&".join("family=" + f.replace(" ", "+") + ":wght@300;400;500;600;700;800"
                    for f in fonts)
    prov = "".join(
        f'<tr><td><code>{k}</code></td><td>{n}</td>'
        f'<td class="{"gap" if "not assigned" in s else ""}">{s}</td></tr>'
        for k, n, s in PROV)
    openq = "".join(f"<li><b>{h}</b> {b}</li>" for h, b in OPEN)

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Round 2 — two concepts from your decisions</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fams}&display=swap">
<style>
  :root {{ color-scheme: dark; --ink:#e9e9ec; --dim:#9093a0; --faint:#6a6d7a;
    --bg:#13141a; --panel:#1b1c24; --line:#2b2d38; --line2:#3a3d4b; --purple:#c58bbd; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--ink);
    font:15px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }}
  code {{ font:12.5px/1.4 ui-monospace,Consolas,monospace; background:#262833;
    padding:1px 5px; border-radius:2px; color:#cfd2dd; }}
  header {{ padding:56px 40px 36px; border-bottom:1px solid var(--line); max-width:1500px; }}
  h1 {{ margin:0 0 14px; font-size:clamp(28px,4vw,40px); letter-spacing:-0.025em;
    font-weight:750; line-height:1.12; }}
  .lede {{ max-width:70ch; color:#c6c8d2; font-size:16px; }}
  .lede p {{ margin:0 0 12px; }}
  .quote {{ margin:22px 0 0; padding:16px 20px; border-left:2px solid var(--purple);
    background:#1a1b23; color:#bfc2cd; font-size:14px; max-width:78ch; }}
  .quote b {{ color:var(--ink); }}
  .meta {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }}
  .meta span {{ font:11.5px/1 ui-monospace,monospace; color:var(--dim);
    border:1px solid var(--line2); border-radius:2px; padding:6px 9px; }}
  main {{ padding:36px 40px; max-width:1500px; }}
  h2.sec {{ font-size:12px; text-transform:uppercase; letter-spacing:0.13em;
    color:var(--dim); margin:44px 0 16px; font-weight:650; }}
  h2.sec:first-child {{ margin-top:0; }}
  table {{ border-collapse:collapse; font-size:13px; max-width:820px; width:100%; }}
  th,td {{ text-align:left; padding:7px 12px 7px 0; border-bottom:1px solid var(--line);
    color:#bdc0cb; }}
  th {{ color:var(--dim); font-size:11px; text-transform:uppercase;
    letter-spacing:0.1em; font-weight:650; }}
  td.gap {{ color:#e0b06a; }}
  .card {{ background:var(--panel); border:1px solid var(--line); border-radius:5px;
    padding:28px 30px 24px; margin-bottom:28px; }}
  .head h3 {{ margin:0 0 10px; font-size:26px; letter-spacing:-0.02em; font-weight:700;
    display:flex; align-items:center; gap:12px; flex-wrap:wrap; }}
  .badge {{ font:10.5px/1 ui-monospace,monospace; text-transform:uppercase;
    letter-spacing:0.09em; padding:5px 8px; border-radius:2px; font-weight:500;
    border:1px solid var(--purple); color:var(--purple); }}
  .fonts {{ font:11.5px/1.5 ui-monospace,monospace; color:var(--faint); margin-bottom:10px; }}
  .palette {{ display:flex; flex-wrap:wrap; gap:5px; }}
  .chip {{ display:inline-flex; align-items:center; gap:6px; font:11px/1 ui-monospace,monospace;
    color:#aeb1bd; border:1px solid var(--line2); border-radius:2px; padding:4px 7px; }}
  .chip i {{ width:11px; height:11px; border-radius:2px; box-shadow:inset 0 0 0 1px #0005; }}
  .thumbs {{ display:flex; gap:20px; align-items:flex-start; margin:24px 0 4px;
    overflow-x:auto; padding-bottom:12px; }}
  .th {{ flex:0 0 auto; }}
  .th .shot {{ border:1px solid var(--line2); border-radius:3px; overflow:hidden;
    background:#fff; line-height:0; }}
  .th .shot svg {{ display:block; }}
  .th span {{ display:block; margin-top:7px; font:11px/1 ui-monospace,monospace;
    color:var(--faint); }}
  .prose {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr));
    gap:22px 40px; margin-top:20px; align-items:start; }}
  .prose section {{ min-width:0; }}
  .prose section.risk {{ border-top:1px solid var(--line); padding-top:14px; }}
  .prose h4 {{ margin:0 0 6px; font-size:11px; text-transform:uppercase;
    letter-spacing:0.12em; color:var(--dim); font-weight:650; }}
  .prose p {{ margin:0 0 10px; color:#bdc0cb; font-size:13.5px; }}
  .prose strong {{ color:var(--ink); font-weight:650; }}
  .open {{ display:inline-block; margin-top:18px; font:12.5px/1 ui-monospace,monospace;
    color:var(--ink); text-decoration:none; border:1px solid var(--line2);
    border-radius:2px; padding:10px 14px; }}
  .open:hover {{ border-color:#5a5e70; background:#22242e; }}
  .oq {{ padding:18px 22px; background:var(--panel); border:1px solid var(--line);
    border-radius:4px; max-width:82ch; }}
  .oq ul {{ margin:0; padding-left:18px; }}
  .oq li {{ margin-bottom:11px; color:#b9bcc8; font-size:13.5px; }}
  .oq b {{ color:var(--ink); font-weight:650; }}
  footer {{ padding:32px 40px 72px; border-top:1px solid var(--line); margin-top:44px;
    max-width:80ch; color:#9ea1ad; font-size:13.5px; }}
  footer b {{ color:var(--ink); }}
  @media (max-width:900px) {{ header, main {{ padding:32px 20px; }} }}
</style></head><body>
<header>
  <h1>Two ways to build the design you chose</h1>
  <div class="lede">
    <p>Both concepts are the merge you asked for: <b>Kartet's world</b> &mdash; its colours, type
    and sizing, unchanged &mdash; carrying the per-frame layouts you picked from Date Due, Tett and
    Kartet. Same seventeen surfaces, same content, same two widths as round&nbsp;1.</p>
    <p>What is left to choose is the one thing your decisions did not settle: <b>how the borrowed
    frames and Kartet's punch mechanic are reconciled</b>. That changes every review screen, so it
    is a real decision rather than a detail.</p>
  </div>
  <div class="quote">From <code>decisions.md</code>: &laquo;Jeg ønsker å bruke nr.&nbsp;3 Kartet
  design for det overordnede design, dvs farger, tekst, størrelse, osv.&raquo; &mdash; taken
  literally: <b>no colour, face or size in either concept departs from Kartet.</b></div>
  <div class="meta">
    <span>surface mode: operate</span><span>build path: code-led</span>
    <span>world: pinned, not rolled</span><span>17 frames &times; 2 concepts</span>
    <span>360 &amp; 1280 px</span>
  </div>
</header>
<main>
<h2 class="sec">Where each frame's structure comes from</h2>
<table><tr><th>Frame</th><th>Surface</th><th>Structure from</th></tr>{prov}</table>

<h2 class="sec">The two concepts</h2>
{''.join(cards)}

<h2 class="sec">Open, and waiting on you</h2>
<div class="oq"><ul>{openq}</ul></div>
</main>
<footer>
  <p><b>When you pick one.</b> The chosen concept becomes the direction contract, and
  <code>DESIGN.md</code> and <code>EXPERIENCE.md</code> close around it &mdash; information
  architecture, state vocabulary, microcopy, accessibility floor and the four user journeys. Both
  files still hold frontmatter only.</p>
  <p>You can also take one concept's review grammar and the other's lists; they share a single
  world module, so mixing them is a change of a few functions rather than a redraw.</p>
</footer>
</body></html>
"""
    out = HERE / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out}")
    print(f"concepts: {len(cards)}/{len(HAND)}")


if __name__ == "__main__":
    main()
