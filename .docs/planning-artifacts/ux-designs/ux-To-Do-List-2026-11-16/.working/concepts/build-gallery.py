#!/usr/bin/env python3
"""Assemble the five concept directories into one reviewable gallery, index.html.

Usage, from the project root:
    python .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/.working/concepts/build-gallery.py

Reads each concept's palette.json and CONCEPT.md, inlines its two hero frames
(the mobile and desktop accept/edit/reject screens) as thumbnails, and writes index.html.
Frames are inlined rather than <img>-linked so the Google Fonts faces apply to SVG text.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

# slug, display name, verdict badge, badge tone
HAND = [
    ("01-date-due",    "Date Due",    "the roll's lead",            "lead"),
    ("02-margin",      "Margin",      "strongest on resonance",     "pick"),
    ("03-kartet",      "Kartet",      "beat the lead on both axes", "win"),
    ("04-centre-rail", "Centre Rail", "holds on product clarity",   "alt"),
    ("05-tett",        "Tett",        "holds on density",           "alt"),
]

CANON = {
    "name": "The familiar road",
    "body": (
        "The category standard, played straight: a white card list with a left checkbox, a floating "
        "compose button, pastel pill tags, a right-side detail drawer, the platform system font. "
        "Todoist, TickTick and Things all live here, and it is a legitimate destination — it is "
        "what a grader will recognise instantly, and familiar-and-effective is not a failure of "
        "nerve. It is listed because the choice should be yours rather than mine. The cost is that "
        "the design criterion rewards <em>et gjennomarbeidet design</em>, and a competent copy of "
        "the category default is the one thing in this round that cannot be told apart from what any "
        "other student would ship."
    ),
}

DEMOTED = [
    ("Interactive type specimen", "declined",
     "Lost both axes: a type foundry is not this student's world, and a continuous axis slider "
     "misrepresents a priority that has exactly three values. Its live-readout discipline was taken "
     "into Date Due instead — the apparatus states its own numbers rather than hiding them."),
    ("Vertical video feed", "held back",
     "One task owning the whole phone viewport with the actions as a right rail is genuinely strong "
     "for review on a phone, but it cannot show three Smart Lists at once on a cold open, and it has "
     "no answer at 1280 px. Its queue-clears-in-place discipline went into Date Due."),
    ("Jet-age ticket wallet", "held back",
     "Its state vocabulary fits unusually well — validated, used and void stamp themselves on the "
     "coupon, which is exactly completed, archived and rejected here. Held back because it shares "
     "Date Due's material family, so it would have duplicated the lead rather than contrasted with "
     "it. Its nothing-disappears-it-cancels discipline went into Date Due."),
]

OPEN_QUESTIONS = [
    ("Interface language", "The PRD fixes <em>task text</em> as English only and calls the "
     "<em>interface</em> language a separate question it does not answer. Every concept renders "
     "English strings as a working assumption. Confirm or change it."),
    ("Accessibility standard", "Nothing is named anywhere beyond NFR-4's 360 px and 1280 px. "
     "WCAG 2.2 AA is a reasonable floor; the concepts were held to 4.5:1 body contrast regardless. "
     "Decide whether AA is the committed bar."),
    ("Colour-only encoding", "All five concepts carry priority and engine provenance in a mark, "
     "shape or label as well as colour, on the assumption that colour alone is not enough. Confirm "
     "it, because it constrains the palette of whichever concept wins."),
]


def section(md: str, heading: str) -> str:
    """Pull one '## Heading' section out of a CONCEPT.md as escaped HTML."""
    m = re.search(rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s|\Z)", md,
                  re.MULTILINE | re.DOTALL)
    if not m:
        return ""
    body = m.group(1).strip()
    body = body.replace("&", "&amp;").replace("<", "&lt;")
    body = re.sub(r"`([^`]+)`", r"<code>\1</code>", body)
    body = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", body)
    paras = [p.strip().replace("\n", " ") for p in re.split(r"\n\s*\n", body) if p.strip()]
    return "".join(f"<p>{p}</p>" for p in paras)


def strip_svg(raw: str, px: int) -> str:
    raw = re.sub(r"<\?xml[^>]*\?>", "", raw)
    raw = re.sub(r"<!DOCTYPE[^>]*>", "", raw, flags=re.IGNORECASE)
    raw = raw.strip()
    # force a render width; viewBox carries the aspect
    raw = re.sub(r'\swidth="[^"]*"', "", raw, count=1)
    raw = re.sub(r'\sheight="[^"]*"', "", raw, count=1)
    return raw.replace("<svg", f'<svg width="{px}"', 1)


def main() -> int:
    all_fonts: list[str] = []
    cards = []
    absent = []

    for slug, name, badge, tone in HAND:
        d = HERE / slug
        if not d.is_dir():
            absent.append(name)
            continue

        meta = {"name": name, "fonts": [], "colors": {}}
        pj = d / "palette.json"
        if pj.exists():
            try:
                meta.update(json.loads(pj.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                pass
        for f in meta.get("fonts", []):
            if isinstance(f, str) and f.strip() and f.strip() not in all_fonts:
                all_fonts.append(f.strip())

        md = (d / "CONCEPT.md").read_text(encoding="utf-8") if (d / "CONCEPT.md").exists() else ""
        thesis = section(md, "Thesis") or "<p><em>No thesis recorded.</em></p>"
        move = section(md, "Signature move")
        risk = section(md, "Honest risk")
        review = section(md, "Accept / edit / reject")
        widths = section(md, "360 and 1280")

        chips = "".join(
            f'<span class="chip" title="{k}: {v}"><i style="background:{v}"></i>{k}</span>'
            for k, v in (meta.get("colors") or {}).items()
        )
        fonts_line = " &middot; ".join(meta.get("fonts", [])) or "—"

        thumbs = ""
        mobile = d / "m3-review-proposed.svg"
        desktop = d / "d2-review-proposed.svg"
        if mobile.exists():
            thumbs += ('<div class="th ph"><div class="shot">'
                       + strip_svg(mobile.read_text(encoding="utf-8"), 300)
                       + '</div><span>360 px</span></div>')
        if desktop.exists():
            thumbs += ('<div class="th dk"><div class="shot">'
                       + strip_svg(desktop.read_text(encoding="utf-8"), 760)
                       + '</div><span>1280 px</span></div>')
        if not thumbs:
            thumbs = '<div class="th absent">hero frames not drawn</div>'

        cards.append(f"""
<article class="card {tone}" id="{slug}">
  <div class="head">
    <h3>{meta.get('name', name)}<span class="badge {tone}">{badge}</span></h3>
    <div class="palette">{chips}</div>
    <div class="fonts">{fonts_line}</div>
  </div>
  <div class="thumbs">{thumbs}</div>
  <div class="prose">
    <section><h4>Thesis</h4>{thesis}</section>
    {f'<section><h4>Signature move</h4>{move}</section>' if move else ''}
    {f'<section><h4>Accept / edit / reject</h4>{review}</section>' if review else ''}
    {f'<section><h4>360 and 1280</h4>{widths}</section>' if widths else ''}
    {f'<section class="risk"><h4>Honest risk</h4>{risk}</section>' if risk else ''}
  </div>
  <a class="open" href="{slug}/concept.html">Open all 17 frames &rarr;</a>
</article>""")

    fonts_link = ""
    if all_fonts:
        fams = "&".join("family=" + f.replace(" ", "+") + ":wght@300;400;500;600;700;800"
                        for f in all_fonts)
        fonts_link = (
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fams}&display=swap">'
        )

    oq = "".join(f"<li><b>{t}</b> {b}</li>" for t, b in OPEN_QUESTIONS)
    dem = "".join(
        f'<div class="dcard"><h5>{n}<span class="dbadge">{v}</span></h5><p>{b}</p></div>'
        for n, v, b in DEMOTED
    )

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>To-Do-List — five design concepts</title>
{fonts_link}
<style>
  :root {{ color-scheme: dark; --ink:#e9e9ec; --dim:#9093a0; --faint:#6a6d7a;
    --bg:#13141a; --panel:#1b1c24; --line:#2b2d38; --line2:#3a3d4b;
    --lead:#d8a24a; --pick:#7fb3e0; --win:#7ec98f; --alt:#a79bd4; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--ink);
    font:15px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }}
  code {{ font:12.5px/1.4 ui-monospace,"SFMono-Regular",Consolas,monospace;
    background:#262833; padding:1px 5px; border-radius:2px; color:#cfd2dd; }}
  header {{ padding:56px 40px 40px; border-bottom:1px solid var(--line); max-width:1500px; }}
  h1 {{ margin:0 0 14px; font-size:clamp(28px,4vw,42px); letter-spacing:-0.025em;
    font-weight:750; line-height:1.1; }}
  .lede {{ max-width:68ch; color:#c6c8d2; font-size:16px; }}
  .lede p {{ margin:0 0 12px; }}
  .meta {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }}
  .meta span {{ font:11.5px/1 ui-monospace,monospace; color:var(--dim);
    border:1px solid var(--line2); border-radius:2px; padding:6px 9px; }}
  .oq {{ margin:28px 0 0; padding:18px 22px; background:var(--panel);
    border:1px solid var(--line); border-radius:4px; max-width:78ch; }}
  .oq h2 {{ margin:0 0 10px; font-size:12px; text-transform:uppercase;
    letter-spacing:0.13em; color:var(--dim); font-weight:650; }}
  .oq ul {{ margin:0; padding-left:18px; }}
  .oq li {{ margin-bottom:9px; color:#b9bcc8; font-size:13.5px; }}
  .oq b {{ color:var(--ink); font-weight:650; }}
  main {{ padding:40px; max-width:1500px; }}
  .card {{ background:var(--panel); border:1px solid var(--line); border-radius:5px;
    padding:28px 30px 24px; margin-bottom:28px; }}
  .card.lead {{ border-color:#4a3c22; }}
  .head h3 {{ margin:0 0 14px; font-size:25px; letter-spacing:-0.02em; font-weight:700;
    display:flex; align-items:center; gap:12px; flex-wrap:wrap; }}
  .badge {{ font:10.5px/1 ui-monospace,monospace; text-transform:uppercase;
    letter-spacing:0.09em; padding:5px 8px; border-radius:2px; font-weight:500;
    border:1px solid currentColor; }}
  .badge.lead {{ color:var(--lead); }} .badge.pick {{ color:var(--pick); }}
  .badge.win {{ color:var(--win); }} .badge.alt {{ color:var(--alt); }}
  .palette {{ display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; }}
  .chip {{ display:inline-flex; align-items:center; gap:6px; font:11px/1 ui-monospace,monospace;
    color:#aeb1bd; border:1px solid var(--line2); border-radius:2px; padding:4px 7px; }}
  .chip i {{ width:11px; height:11px; border-radius:2px; box-shadow:inset 0 0 0 1px #0005; }}
  .fonts {{ font:11.5px/1.4 ui-monospace,monospace; color:var(--faint); }}
  .thumbs {{ display:flex; gap:20px; align-items:flex-start; margin:24px 0 4px;
    overflow-x:auto; padding-bottom:12px; }}
  .th {{ flex:0 0 auto; }}
  .th .shot {{ border:1px solid var(--line2); border-radius:3px; overflow:hidden;
    background:#fff; line-height:0; }}
  .th .shot svg {{ display:block; }}
  .th span {{ display:block; margin-top:7px; font:11px/1 ui-monospace,monospace;
    color:var(--faint); }}
  .th.absent {{ color:var(--faint); font-size:12px; border:1px dashed var(--line2);
    padding:40px; border-radius:3px; }}
  .prose {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr));
    gap:22px 40px; margin-top:22px; align-items:start; }}
  .prose section {{ min-width:0; }}
  .prose section.risk {{ border-top:1px solid var(--line); padding-top:14px; }}
  .prose h4 {{ margin:0 0 6px; font-size:11px; text-transform:uppercase;
    letter-spacing:0.12em; color:var(--dim); font-weight:650; }}
  .prose p {{ margin:0 0 10px; color:#bdc0cb; font-size:13.5px; line-height:1.6; }}
  .prose strong {{ color:var(--ink); font-weight:650; }}
  .open {{ display:inline-block; margin-top:18px; font:12.5px/1 ui-monospace,monospace;
    color:var(--ink); text-decoration:none; border:1px solid var(--line2);
    border-radius:2px; padding:10px 14px; }}
  .open:hover {{ border-color:#5a5e70; background:#22242e; }}
  h2.sec {{ font-size:12px; text-transform:uppercase; letter-spacing:0.13em;
    color:var(--dim); margin:48px 0 16px; font-weight:650; }}
  .canon {{ border:1px solid var(--line); border-radius:4px; padding:22px 26px;
    max-width:78ch; background:#171821; }}
  .canon h3 {{ margin:0 0 8px; font-size:17px; font-weight:650; color:#c6c8d2; }}
  .canon p {{ margin:0; color:#9ea1ad; font-size:13.5px; }}
  .demoted {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
    gap:14px; max-width:1200px; }}
  .dcard {{ border:1px solid var(--line); border-radius:3px; padding:14px 16px;
    background:#16171f; }}
  .dcard h5 {{ margin:0 0 6px; font-size:13px; font-weight:600; color:#a9acb8;
    display:flex; gap:8px; align-items:center; flex-wrap:wrap; }}
  .dbadge {{ font:9.5px/1 ui-monospace,monospace; text-transform:uppercase;
    letter-spacing:0.09em; color:var(--faint); border:1px solid var(--line2);
    padding:3px 6px; border-radius:2px; }}
  .dcard p {{ margin:0; font-size:12.5px; color:#838693; line-height:1.55; }}
  footer {{ padding:36px 40px 72px; border-top:1px solid var(--line); margin-top:48px;
    max-width:78ch; color:#9ea1ad; font-size:13.5px; }}
  footer b {{ color:var(--ink); }}
  .warn {{ margin:24px 40px 0; padding:11px 15px; border:1px solid #5a3a3a;
    background:#2a1c1c; border-radius:3px; color:#e0a3a3; font-size:12.5px; }}
  @media (max-width:900px) {{
    header, main {{ padding:32px 20px; }} .prose {{ columns:1; }}
  }}
</style></head><body>
<header>
  <h1>Five ways this app could look</h1>
  <div class="lede">
    <p>Each concept below is a complete visual world applied to all seventeen surfaces of
    To-Do-List &mdash; the same tasks, the same strings, the same states, so what differs is the
    world and not the content. Pick one and we go into detail on it; nothing here is committed.</p>
    <p>The six accept / edit / reject frames are the ones to look at hardest. Your instructor's
    feedback on the product brief asks for exactly that, in those words: <em>&laquo;Vis i UX-steget
    hvordan godta/endre/avvis ser ut p&aring; mobil og PC&raquo;</em> &mdash; so every concept draws
    that flow at 360&nbsp;px and at 1280&nbsp;px, in three states each: all three parts proposed,
    one part being edited, and one part accepted with its undo still live.</p>
  </div>
  <div class="meta">
    <span>surface mode: operate</span><span>build path: code-led</span>
    <span>seed:936505b7939c1812</span><span>17 frames &times; 5 concepts</span>
    <span>360 &amp; 1280 px</span>
  </div>
  <div class="oq">
    <h2>Three things no concept may decide for you</h2>
    <ul>{oq}</ul>
  </div>
</header>
{'<div class="warn">Concepts missing from the gallery: ' + ', '.join(absent) + '</div>' if absent else ''}
<main>
{''.join(cards)}
<h2 class="sec">The quiet door &mdash; always available, never recommended</h2>
<div class="canon"><h3>{CANON['name']}</h3><p>{CANON['body']}</p></div>
<h2 class="sec">Weighed and not carried forward</h2>
<div class="demoted">{dem}</div>
</main>
<footer>
  <p><b>What happens when you pick one.</b> The chosen world gets written down as a direction
  contract, then <code>DESIGN.md</code> and <code>EXPERIENCE.md</code> close around it &mdash; the
  information architecture, the state vocabulary, the microcopy, the accessibility floor and the four
  user journeys. Both files currently hold frontmatter only, on purpose.</p>
  <p>You can also ask for a fresh hand of five instead, steered <b>safer</b> (closer to what a grader
  recognises) or <b>bolder</b> (foreign forms at full commitment), and every world already shown is
  eliminated from it.</p>
</footer>
</body></html>
"""
    out = HERE / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out}")
    print(f"concepts in gallery: {len(cards)}/{len(HAND)}")
    if absent:
        print("MISSING: " + ", ".join(absent))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
