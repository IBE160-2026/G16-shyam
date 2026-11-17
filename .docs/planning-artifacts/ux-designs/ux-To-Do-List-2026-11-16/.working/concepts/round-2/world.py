#!/usr/bin/env python3
"""Kartet's visual world, shared by both round-2 concepts.

The user pinned concept 03 "Kartet" as the overall design — colours, type, sizing —
in .docs/planning-artifacts/ux-designs/decisions.md. Every value here is lifted from
03-kartet/palette.json and its CONCEPT.md, not re-invented. The two round-2 concepts
differ in how the borrowed frame structures are reconciled with Kartet's punch
mechanic, never in palette or faces.
"""

# ─── ISOM inks: each does one job and only that job ─────────────────────────
CHROME = "#EDE4D3"   # map-margin paper: rail, header, tab bar
GROUND = "#FCFBF8"   # runnable ground: the work area
WHITE = "#FFFFFF"    # settled: nothing proposed, nothing wrong
INK = "#1B1915"      # terrain ink
INK2 = "#5C5345"     # secondary
HAIR = "#CBB08E"     # contour hairline — rules only, never a drawn map
HAIR2 = "#9B6B3F"    # contour emphasised
PURPLE = "#8E2E7E"   # course: a proposal not yet yours. Reserved absolutely.
PWASH = "#F8EAF4"
YELLOW = "#F2CB5A"   # open land: the due-this-week window
YPALE = "#FAEDC4"
OLIVE = "#4E7033"    # thicket: Need Attention, and nowhere else
OPALE = "#E4EBD8"
MARSH = "#6BA3D6"    # marsh: the inert — archive, an engine not in use
MINK = "#1F5878"
MPALE = "#E2EEF7"

UI = "'Archivo','Helvetica Neue',Arial,sans-serif"
CD = "'Barlow Condensed','Arial Narrow',sans-serif"
TAB = "font-variant-numeric:tabular-nums"


def clip(s, size, maxw, font_factor=0.52):
    """Truncate to a pixel budget so a sheet column never runs into its neighbour."""
    n = int(maxw / (size * font_factor))
    return s if len(s) <= n else s[:max(1, n - 1)].rstrip(" ,.") + "…"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def t(x, y, s, size=11, fill=INK, font=UI, w=400, anchor="start", ls=0,
      deco=None, op=None):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    d = f' text-decoration="{deco}"' if deco else ""
    o = f' opacity="{op}"' if op else ""
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" '
            f'font-weight="{w}" fill="{fill}"{a}{l}{d}{o} style="{TAB}">{esc(s)}</text>')


def lab(x, y, s, size=9, fill=INK2, ls=0.6, anchor="start", w=700, upper=True):
    """Barlow Condensed 700 — band labels, nav, apparatus, control numerals."""
    return t(x, y, s.upper() if upper else s, size, fill, CD, w, anchor, ls)


def rect(x, y, w, h, fill="none", stroke=None, sw=1, rx=0, dash=None, op=None):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    r = f' rx="{rx}"' if rx else ""
    o = f' opacity="{op}"' if op else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"{s}{d}{r}{o}/>'


def hr(x1, y, x2, c=HAIR, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{c}" stroke-width="{sw}"{d}/>'


def vr(x, y1, y2, c=HAIR, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{c}" stroke-width="{sw}"{d}/>'


def band(x, y, w, title, count=None, ink=INK, fill=None, h=22):
    """A 22px band row — Kartet's section header. Colour names the list."""
    g = rect(x, y, w, h, fill=fill) if fill else ""
    g += lab(x + 8, y + h - 7, title, 10.5, ink, 0.9)
    if count is not None:
        g += lab(x + w - 8, y + h - 7, str(count), 10.5, ink, 0.6, "end")
    g += hr(x, y + h, x + w, HAIR2 if fill else HAIR, 1.2)
    return g


def btn(x, y, w, s, h=22, kind="ghost", size=9.5):
    """Standard controls. The world is in the ink, never in the control's shape."""
    if kind == "solid":
        return rect(x, y, w, h, fill=INK) + lab(x + w / 2, y + h / 2 + 3.6, s, size,
                                                WHITE, 0.7, "middle")
    if kind == "purple":
        return (rect(x, y, w, h, fill=WHITE) + rect(x, y, w, h, stroke=PURPLE, sw=1.2) +
                lab(x + w / 2, y + h / 2 + 3.6, s, size, PURPLE, 0.7, "middle"))
    return (rect(x, y, w, h, fill=WHITE) + rect(x, y, w, h, stroke=INK2, sw=1) +
            lab(x + w / 2, y + h / 2 + 3.6, s, size, INK, 0.7, "middle"))


def cbox(x, y, checked=False, s=12):
    g = rect(x, y, s, s, fill=WHITE) + rect(x, y, s, s, stroke=INK2, sw=1)
    if checked:
        g += (f'<path d="M{x+2.6} {y+s/2} l{s*0.22} {s*0.24} l{s*0.44} -{s*0.48}" '
              f'fill="none" stroke="{INK}" stroke-width="1.7" stroke-linecap="square"/>')
    return g


def select(x, y, w, s, h=24):
    g = rect(x, y, w, h, fill=WHITE) + rect(x, y, w, h, stroke=INK2, sw=1)
    g += t(x + 9, y + h / 2 + 4, s, 10.5, INK, UI, 400)
    g += (f'<path d="M{x+w-19} {y+h/2-2} l4.5 4.5 l4.5 -4.5" fill="none" '
          f'stroke="{INK2}" stroke-width="1.3"/>')
    return g


def field(x, y, w, s, h=26, placeholder=False, focus=False):
    g = rect(x, y, w, h, fill=WHITE)
    g += rect(x, y, w, h, stroke=INK if focus else INK2, sw=1.4 if focus else 1)
    g += t(x + 10, y + h / 2 + 4, s, 10.5, INK2 if placeholder else INK, UI, 400)
    return g


def toggle(x, y, on=False, w=36, h=18):
    g = rect(x, y, w, h, rx=h / 2, fill=INK if on else WHITE)
    if not on:
        g += rect(x, y, w, h, rx=h / 2, stroke=INK2, sw=1)
    cx = x + w - h / 2 if on else x + h / 2
    g += (f'<circle cx="{cx}" cy="{y+h/2}" r="{h/2-2.6}" fill="{WHITE if on else WHITE}" '
          f'stroke="{"none" if on else INK2}" stroke-width="1"/>')
    return g


# ─── the punch: Kartet's signature, shared by both concepts ─────────────────
def control(cx, cy, n, state="open", r=9):
    """A numbered orienteering control. open | punched | struck."""
    if state == "punched":
        g = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}"/>'
        g += lab(cx, cy + 3.4, str(n), 10, WHITE, 0, "middle")
        for dx, dy in ((-r - 3, -r - 3), (r + 3, -r - 3), (-r - 3, r + 3), (r + 3, r + 3)):
            g += f'<circle cx="{cx+dx*0.62}" cy="{cy+dy*0.62}" r="0.9" fill="{INK2}"/>'
        return g
    if state == "struck":
        g = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WHITE}" stroke="{INK2}" stroke-width="1.6"/>'
        g += lab(cx, cy + 3.4, str(n), 10, INK2, 0, "middle")
        g += (f'<line x1="{cx-r-4}" y1="{cy+r+4}" x2="{cx+r+4}" y2="{cy-r-4}" '
              f'stroke="{INK2}" stroke-width="1.6"/>')
        return g
    g = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WHITE}" stroke="{PURPLE}" stroke-width="1.8"/>'
    g += lab(cx, cy + 3.4, str(n), 10, PURPLE, 0, "middle")
    return g


def start_triangle(x, y, s=9, c=PURPLE):
    """The start marker: this task still has a control open."""
    return (f'<path d="M{x} {y-s*0.62} L{x+s*0.58} {y+s*0.42} L{x-s*0.58} {y+s*0.42} Z" '
            f'fill="none" stroke="{c}" stroke-width="1.5"/>')


def prio(x, y, level, h=10):
    """Priority as a bar ladder plus its word — never colour alone."""
    n = {"high": 3, "medium": 2, "low": 1}[level]
    g = ""
    for i in range(3):
        bh = 3.2 + i * 3.2
        g += rect(x + i * 4.2, y + h - bh, 2.8, bh,
                  fill=INK if i < n else "none", stroke=None if i < n else HAIR)
    return g


def engine_chip(x, y, name="Rule Engine", size=9, fill=None):
    """Provenance: a boxed initial plus the spelled-out name. Never colour alone."""
    i = "R" if name.startswith("Rule") else "M"
    c = fill or INK2
    return (rect(x, y - 8, 10, 10, stroke=c, sw=1) +
            lab(x + 5, y - 0.6, i, 7.5, c, 0, "middle") +
            lab(x + 14, y, name, size, c, 0.6))


def tag_pill(x, y, name, h=14):
    """A tag reads as a terrain patch, in the ink that names its context."""
    w = 8 + len(name) * 4.9
    return (rect(x, y, w, h, fill=OPALE) + rect(x, y, w, h, stroke=HAIR, sw=0.8) +
            lab(x + w / 2, y + h - 4, name, 9, INK, 0.4, "middle"), w)


def due_pill(x, y, s, kind="week", h=14):
    """Due date in the ink of its window: yellow = this week, olive = past due."""
    fill = {"week": YELLOW, "past": OLIVE, "none": WHITE}[kind]
    ink = WHITE if kind == "past" else INK
    w = 8 + len(s) * 4.6
    g = rect(x, y, w, h, fill=fill)
    if kind == "none":
        g += rect(x, y, w, h, stroke=HAIR, sw=0.8)
    g += lab(x + w / 2, y + h - 4, s, 9, ink, 0.4, "middle")
    return g, w


def icon(x, y, kind, c=INK2, sw=1.3):
    p = {
        "today": f'<rect x="{x}" y="{y+1}" width="13" height="12"/>'
                 f'<line x1="{x}" y1="{y+5}" x2="{x+13}" y2="{y+5}"/>'
                 f'<line x1="{x+4}" y1="{y-1}" x2="{x+4}" y2="{y+2}"/>'
                 f'<line x1="{x+9}" y1="{y-1}" x2="{x+9}" y2="{y+2}"/>',
        "lists": f'<line x1="{x}" y1="{y+2}" x2="{x+13}" y2="{y+2}"/>'
                 f'<line x1="{x}" y1="{y+6.5}" x2="{x+13}" y2="{y+6.5}"/>'
                 f'<line x1="{x}" y1="{y+11}" x2="{x+13}" y2="{y+11}"/>',
        "archive": f'<rect x="{x}" y="{y}" width="13" height="4"/>'
                   f'<path d="M{x+1.5} {y+4} v8 h10 v-8"/>'
                   f'<line x1="{x+5}" y1="{y+7.5}" x2="{x+8}" y2="{y+7.5}"/>',
        "settings": f'<circle cx="{x+6.5}" cy="{y+6}" r="3.2"/>'
                    f'<path d="M{x+6.5} {y-0.5} v2.2 M{x+6.5} {y+9.8} v2.2 '
                    f'M{x-0.4} {y+6} h2.2 M{x+11.2} {y+6} h2.2"/>',
        "undo": f'<path d="M{x+2} {y+4} h7 a4 4 0 1 1 -4 4"/>'
                f'<path d="M{x+2} {y+4} l3 -3 M{x+2} {y+4} l3 3"/>',
    }[kind]
    return (f'<g fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="square" '
            f'stroke-linejoin="miter">{p}</g>')


def svg(w, h, body, ground=GROUND):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">{rect(0,0,w,h,fill=ground)}{body}</svg>')


# ─── the content corpus, identical across every concept and round ───────────
TASKS = [
    # text, due, due-kind, tag, priority, past-due
    ("Submit assignment in IBE160 Friday", "Fri 20 Nov", "week", "school", "high", False),
    ("Group meeting about the presentation tomorrow", "Tue 17 Nov", "week", "group", "high", False),
    ("Pick up shift timesheet from boss today", "Mon 16 Nov", "week", "work", "high", False),
    ("Study for the exam", "", "none", "school", "high", False),
    ("Buy birthday present next week", "Mon 23 Nov", "none", "personal", "medium", False),
    ("Call the doctor", "", "none", "personal", "medium", False),
    ("Clean the kitchen eventually", "", "none", "personal", "low", False),
    ("Figure out the thing", "", "none", "", "medium", False),
    ("Submit lab report in IBE160", "Sat 14 Nov", "past", "school", "high", True),
    ("Pay rent", "Tue 10 Nov", "past", "personal", "medium", True),
]
DUE_WEEK = [TASKS[0], TASKS[1], TASKS[2]]
ATTN = [TASKS[8], TASKS[9]]
HIGH = [TASKS[0], TASKS[1], TASKS[2], TASKS[3], TASKS[8]]

HERO = "Submit assignment in IBE160 Friday"
PARTS = [("Tags", "school"), ("Priority", "high"), ("Summary", "Submit assignment in IBE160")]

# Settings copy — the meanings are fixed by FR-9 / FR-11 / FR-17 / FR-18.
NOKEY = "No API Key is configured."
NOKEY_SUB = ("Every suggestion is produced by the Rule Engine, on this device, offline. "
             "This is the normal state, not a limitation.")
DISCLOSE = [
    "Your task text is sent to the Anthropic API.",
    "The key is your own, and the call is billed to it.",
    "The Rule Engine stays the fallback and answers whenever a cloud call fails.",
]
ORG_FAIL = "This key’s organization does not permit calls from a browser."
ORG_SUB = ("The key itself is valid. Replacing it, or pasting a new one, will not change "
           "this — the restriction belongs to the organization, not to your key.")
OTHER_FAILS = [
    ("The API Key was rejected.", "Check it and paste it again. This one you can fix."),
    ("This key’s credit or quota is used up.",
     "Add credit at the provider, or leave Cloud Suggestions off."),
]


# ─── mobile chrome ──────────────────────────────────────────────────────────
MW, MH = 360, 800


def m_head(title="To-Do-List", right="Mon 16 Nov"):
    g = rect(0, 0, MW, 40, fill=CHROME)
    g += lab(14, 26, title, 14, INK, 1.5)
    g += lab(MW - 14, 26, right, 9.5, INK2, 0.6, "end")
    g += hr(0, 40, MW, HAIR2, 1.2)
    return g


def m_tabs(active="today"):
    g = rect(0, 754, MW, 46, fill=CHROME) + hr(0, 754, MW, HAIR2, 1.2)
    for k, l, x in (("today", "Today", 32), ("lists", "Lists", 118),
                    ("archive", "Archive", 204), ("settings", "Settings", 290)):
        c = INK if k == active else INK2
        g += icon(x + 11, 766, k, c, 1.5 if k == active else 1.2)
        g += lab(x + 17, 792, l, 9, c, 0.7, "middle")
        if k == active:
            g += rect(x + 2, 756, 31, 2.2, fill=PURPLE if False else INK)
    return g


def m_capture(y=50, text="Type a task the way you say it", focus=False, placeholder=True):
    g = field(14, y, 258, text, 30, placeholder=placeholder, focus=focus)
    g += btn(278, y, 68, "Add", 30, "solid", 10.5)
    return g


def m_row(x, y, task, w=332, checked=False, control_open=False):
    """One task row — 46px, Kartet's mobile rhythm."""
    text, due, kind, tag, p, past = task
    g = cbox(x, y + 6, checked)
    tx = x + 22
    if control_open:
        g += start_triangle(x + w - 8, y + 11)
    g += t(tx, y + 14, text, 10.5, INK2 if checked else INK, UI, 400,
           deco="line-through" if checked else None)
    cx = tx
    if tag:
        pill, pw = tag_pill(cx, y + 22, tag)
        g += pill
        cx += pw + 5
    else:
        g += lab(cx, y + 32, "no tag", 9, INK2, 0.5)
        cx += 38
    g += prio(cx, y + 23, p)
    cx += 18
    if due:
        pill, pw = due_pill(cx, y + 22, due, kind)
        g += pill
    return g


# ─── desktop chrome ─────────────────────────────────────────────────────────
DW, DH = 1280, 800
RAILW = 196


def d_rail(active="Today", counts=None):
    c = counts or {"Today": 10, "Due this week": 3, "Need Attention": 2,
                   "High priority": 5, "school": 3, "group": 1, "work": 1,
                   "personal": 4, "Archive": 4}
    g = rect(0, 0, RAILW, DH, fill=CHROME) + vr(RAILW, 0, DH, HAIR2, 1.2)
    g += lab(20, 30, "To-Do-List", 15, INK, 1.4)
    g += hr(20, 42, RAILW - 20, HAIR)
    y = 66
    g += lab(20, y, "Lists", 9.5, INK2, 0.9)
    y += 16
    for n, tint in (("Today", None), ("Due this week", YELLOW),
                    ("Need Attention", OLIVE), ("High priority", None)):
        act = n == active
        if act:
            g += rect(10, y - 11, RAILW - 20, 24, fill=GROUND)
            g += rect(10, y - 11, 2.6, 24, fill=INK)
        if tint:
            g += rect(RAILW - 46, y - 8, 7, 7, fill=tint)
        g += t(22, y + 5, n, 10.5, INK, UI, 600 if act else 400)
        g += lab(RAILW - 20, y + 5, str(c[n]), 10, INK2, 0.5, "end")
        y += 27
    y += 8
    g += lab(20, y, "Tags in use", 9.5, INK2, 0.9)
    g += lab(RAILW - 20, y, "4", 9.5, INK2, 0.5, "end")
    y += 16
    for n in ("school", "group", "work", "personal"):
        act = n == active
        if act:
            g += rect(10, y - 11, RAILW - 20, 24, fill=GROUND)
            g += rect(10, y - 11, 2.6, 24, fill=INK)
        g += t(22, y + 5, n, 10.5, INK, UI, 600 if act else 400)
        g += lab(RAILW - 20, y + 5, str(c[n]), 10, INK2, 0.5, "end")
        y += 25
    y += 10
    g += hr(20, y, RAILW - 20, HAIR)
    y += 20
    for n, tint in (("Archive", MARSH), ("Settings", None)):
        act = n == active
        if act:
            g += rect(10, y - 11, RAILW - 20, 24, fill=GROUND)
            g += rect(10, y - 11, 2.6, 24, fill=INK)
        if tint:
            g += rect(RAILW - 46, y - 8, 7, 7, fill=tint)
        g += t(22, y + 5, n, 10.5, INK, UI, 600 if act else 400)
        if n in c:
            g += lab(RAILW - 20, y + 5, str(c[n]), 10, INK2, 0.5, "end")
        y += 27
    g += hr(20, DH - 74, RAILW - 20, HAIR)
    g += engine_chip(20, DH - 54, "Rule Engine")
    g += lab(20, DH - 38, "on device · no network", 9, INK2, 0.5)
    g += lab(20, DH - 26, "no account · no key", 9, INK2, 0.5)
    return g


def d_head(title, x=RAILW + 26, right="Mon 16 Nov 2026", w=None, note=None):
    g = lab(x, 32, title, 16, INK, 1.2)
    g += lab((w or DW - 26), 32, right, 9.5, INK2, 0.6, "end")
    g += hr(x, 44, w or DW - 26, HAIR2, 1.2)
    if note:
        g += lab(x, 60, note, 9, INK2, 0.5)
    return g


def legend(x, y, w, cols=2, title="What the inks mean", which="both"):
    """Published legend — the proof that nothing here is carried by colour alone."""
    g = band(x, y, w, title)
    rows = [(YELLOW, "Open land", "due inside this week"),
            (OLIVE, "Thicket", "past due and not completed"),
            (MARSH, "Marsh", "archived, or an engine not in use"),
            (PURPLE, "Course", "proposed by an engine — not yours yet"),
            (WHITE, "Runnable", "settled: nothing proposed, nothing wrong")]
    marks = [("prio", "Bar ladder", "high · medium · low, beside the word"),
             ("punch", "Punched control", "a part you accepted, in the record"),
             ("struck", "Struck control", "a part you rejected, never re-proposed"),
             ("start", "Start triangle", "this task still has a control open"),
             ("engine", "R · Rule Engine", "which engine proposed it, named not coloured")]
    if which == "marks":
        rows = []
    for i, (c, n, d) in enumerate(rows):
        yy = y + 38 + i * 19
        g += rect(x + 8, yy - 8, 11, 11, fill=c)
        if c == WHITE:
            g += rect(x + 8, yy - 8, 11, 11, stroke=HAIR, sw=0.8)
        g += lab(x + 26, yy, n, 9.5, INK, 0.5)
        g += t(x + 92, yy, d, 9, INK2, UI, 400)
    if which == "inks":
        return g
    cx = x + w / 2 + 8 if cols == 2 else x
    base = y + 38 if (cols == 2 and rows) else y + 38 + len(rows) * 19
    for i, (k, n, d) in enumerate(marks):
        yy = base + i * 19
        if k == "prio":
            g += prio(cx + 8, yy - 9, "high")
        elif k == "punch":
            g += control(cx + 14, yy - 4, 1, "punched", 7)
        elif k == "struck":
            g += control(cx + 14, yy - 4, 2, "struck", 7)
        elif k == "start":
            g += start_triangle(cx + 14, yy - 4, 9)
        else:
            g += rect(cx + 8, yy - 8, 10, 10, stroke=INK2, sw=1)
            g += lab(cx + 13, yy - 0.6, "R", 7.5, INK2, 0, "middle")
        g += lab(cx + 30, yy, n, 9.5, INK, 0.5)
        g += t(cx + 110, yy, d, 9, INK2, UI, 400)
    return g
