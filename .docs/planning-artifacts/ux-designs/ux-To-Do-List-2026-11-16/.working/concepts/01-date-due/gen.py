#!/usr/bin/env python3
"""Generate the 17 'Date Due' concept frames.

World: the university library circulation system — the date-due slip, the card pocket,
the accession stamp. Every state is stamped, dated, and never removed.

Run from the project root:  uv run python <this file>
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent

# ─── palette ────────────────────────────────────────────────────────────────
GROUND = "#D7C6A2"   # kraft card stock — the shell's committed field
CARD   = "#EFE6D2"   # lighter card: records, inputs, panels
CARD2  = "#E6DAC0"   # secondary card: rails, apparatus columns
INK    = "#241C2E"   # stamp ink — primary text and marks
INK2   = "#4A4455"   # secondary ink
GRAPH  = "#575046"   # pencil graphite — apparatus, 4.7:1 on kraft
VERM   = "#A8271C"   # stamp vermilion — marks and rules only
VERMT  = "#8E1F16"   # vermilion for small text: 5.3:1 on kraft, 7.2:1 on card
RULE   = "#B9A982"   # hairline on kraft
RULE2  = "#CFC0A0"   # hairline on card
BLUE   = "#2C4A6E"   # the one cool ink: a part that has been accepted and set

UI = "'Public Sans','Helvetica Neue',Arial,sans-serif"
ST = "'Oswald','Arial Narrow',sans-serif"      # stamp lettering: caps, condensed
TAB = 'style="font-variant-numeric:tabular-nums"'


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ─── primitives ─────────────────────────────────────────────────────────────
def t(x, y, s, size=11, fill=INK, font=UI, w=400, anchor="start", ls=0, op=None,
      deco=None, style=""):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    o = f' opacity="{op}"' if op else ""
    d = f' text-decoration="{deco}"' if deco else ""
    st = f' style="{style}"' if style else ""
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" '
            f'font-weight="{w}" fill="{fill}"{a}{l}{o}{d}{st}>{esc(s)}</text>')


def lab(x, y, s, size=8, fill=GRAPH, ls=0.7, w=500, anchor="start"):
    """Small letterspaced stamp-caps label — the apparatus voice."""
    return t(x, y, s.upper(), size, fill, ST, w, anchor, ls)


def num(x, y, s, size=9, fill=INK, w=500, anchor="start", ls=0.4, font=None):
    return (f'<text x="{x}" y="{y}" font-family="{font or ST}" font-size="{size}" '
            f'font-weight="{w}" fill="{fill}" letter-spacing="{ls}"'
            f'{" text-anchor="+chr(34)+anchor+chr(34) if anchor!="start" else ""} '
            f'{TAB}>{esc(s)}</text>')


def rect(x, y, w, h, fill="none", stroke=None, sw=1, rx=0, op=None, dash=None):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{op}"' if op else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    r = f' rx="{rx}"' if rx else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"{s}{o}{d}{r}/>'


def hr(x1, y, x2, c=RULE, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{c}" stroke-width="{sw}"{d}/>'


def vr(x, y1, y2, c=RULE, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{c}" stroke-width="{sw}"{d}/>'


def stamp(x, y, w, h, text, color=VERM, rot=-2.2, size=10, fill_op=0.07):
    """A rubber-stamp strike: boxed caps, set a couple of degrees off square."""
    g = f'<g transform="rotate({rot} {x + w/2} {y + h/2})">'
    if fill_op and fill_op > 0:
        g += rect(x, y, w, h, fill=color, op=fill_op)
    g += rect(x, y, w, h, stroke=color, sw=1.3)
    g += t(x + w / 2, y + h / 2 + size * 0.36, text.upper(), size, color, ST, 600,
           "middle", 1.1)
    return g + '</g>'


def btn(x, y, w, s, h=20, primary=False, size=8.5, disabled=False):
    """A standard button. Nothing stamp-shaped: the world is in the ink, not the controls."""
    if primary:
        return (rect(x, y, w, h, fill=INK) +
                t(x + w / 2, y + h / 2 + 3, s.upper(), size, CARD, ST, 500, "middle", 0.8))
    c = RULE2 if disabled else GRAPH
    f = GRAPH if disabled else INK
    return (rect(x, y, w, h, fill=CARD) + rect(x, y, w, h, stroke=c, sw=1) +
            t(x + w / 2, y + h / 2 + 3, s.upper(), size, f, ST, 500, "middle", 0.8))


def cbox(x, y, checked=False, s=11):
    g = rect(x, y, s, s, fill=CARD) + rect(x, y, s, s, stroke=GRAPH, sw=1)
    if checked:
        g += (f'<path d="M{x+2.4} {y+s/2} l{s*0.22} {s*0.24} l{s*0.42} -{s*0.46}" '
              f'fill="none" stroke="{INK}" stroke-width="1.6" stroke-linecap="square"/>')
    return g


def prio(x, y, level, h=9):
    """Priority as a stack of bars plus its word — never colour alone."""
    n = {"high": 3, "medium": 2, "low": 1}[level]
    g = ""
    for i in range(3):
        bh = 3 + i * 3
        g += rect(x + i * 4, y + h - bh, 2.6, bh,
                  fill=INK if i < n else "none",
                  stroke=None if i < n else RULE)
    return g


def engine(x, y, name="Rule Engine", size=7.5):
    """Provenance: a boxed initial plus the spelled-out name. Never colour alone."""
    i = "R" if name.startswith("Rule") else "M"
    return (rect(x, y - 7, 9, 9, stroke=GRAPH, sw=0.9) +
            t(x + 4.5, y, i, 6.5, GRAPH, ST, 600, "middle", 0) +
            lab(x + 13, y, name, size, GRAPH, 0.6))


def icon(x, y, kind, c=GRAPH, sw=1.2):
    """Drawn icons, one stroke weight. Never a unicode glyph."""
    p = {
        "today": f'<rect x="{x}" y="{y+1}" width="13" height="12" rx="1"/>'
                 f'<line x1="{x}" y1="{y+5}" x2="{x+13}" y2="{y+5}"/>'
                 f'<line x1="{x+4}" y1="{y-1}" x2="{x+4}" y2="{y+2}"/>'
                 f'<line x1="{x+9}" y1="{y-1}" x2="{x+9}" y2="{y+2}"/>',
        "lists": f'<line x1="{x}" y1="{y+2}" x2="{x+13}" y2="{y+2}"/>'
                 f'<line x1="{x}" y1="{y+6.5}" x2="{x+13}" y2="{y+6.5}"/>'
                 f'<line x1="{x}" y1="{y+11}" x2="{x+13}" y2="{y+11}"/>',
        "archive": f'<rect x="{x}" y="{y}" width="13" height="4" rx="0.5"/>'
                   f'<path d="M{x+1.5} {y+4} v8 h10 v-8"/>'
                   f'<line x1="{x+5}" y1="{y+7.5}" x2="{x+8}" y2="{y+7.5}"/>',
        "settings": f'<circle cx="{x+6.5}" cy="{y+6}" r="3"/>'
                    f'<path d="M{x+6.5} {y-0.5} v2 M{x+6.5} {y+10} v2 '
                    f'M{x} {y+6} h2 M{x+11} {y+6} h2"/>',
    }[kind]
    return f'<g fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="square">{p}</g>'


def frame(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">{rect(0,0,w,h,fill=GROUND)}{body}</svg>')


# ─── shared chrome ──────────────────────────────────────────────────────────
TASKS = [
    ("Submit assignment in IBE160 Friday", "Fri 20 Nov", "school", "high", False),
    ("Group meeting about the presentation tomorrow", "Tue 17 Nov", "group", "high", False),
    ("Pick up shift timesheet from boss today", "Mon 16 Nov", "work", "high", False),
    ("Study for the exam", "", "school", "high", False),
    ("Buy birthday present next week", "Mon 23 Nov", "personal", "medium", False),
    ("Call the doctor", "", "personal", "medium", False),
    ("Clean the kitchen eventually", "", "personal", "low", False),
    ("Figure out the thing", "", "", "medium", False),
    ("Submit lab report in IBE160", "Sat 14 Nov", "school", "high", True),
    ("Pay rent", "Tue 10 Nov", "personal", "medium", True),
]


def mhead(title="To-Do-List", sub=None):
    g = (t(14, 25, title, 13.5, INK, ST, 600, ls=1.6) +
         icon(332, 11, "settings") + hr(0, 38, 360))
    if sub:
        g += lab(346, 25, sub, 8, GRAPH, 0.7, anchor="end")
    return g


def mtabs(active="today"):
    g = hr(0, 754, 360)
    items = [("today", "Today", 32), ("lists", "Lists", 118),
             ("archive", "Archive", 204), ("settings", "Settings", 290)]
    for k, l, x in items:
        c = INK if k == active else GRAPH
        g += icon(x + 11, 764, k, c, 1.3 if k == active else 1.1)
        g += lab(x + 17, 791, l, 7.5, c, 0.8, 500, "middle")
        if k == active:
            g += rect(x + 4, 758, 27, 1.6, fill=VERM)
    return g


def readout(x, y, pairs, w=332, gap=0):
    """Live readout: the apparatus states its own numbers rather than hiding them."""
    g = ""
    for i, (k, v) in enumerate(pairs):
        yy = y + i * 13
        g += lab(x, yy, k, 7.5, GRAPH, 0.7)
        g += num(x + w, yy, v, 8.5, INK, 500, "end")
    return g


def task_row(x, y, task, w=332, checked=False, compact=False):
    text, due, tag, p, overdue = task
    g = cbox(x + 2, y + 5, checked)
    tx = x + 21
    txt = text if len(text) < 44 else text
    g += t(tx, y + 14, txt, 10.5, GRAPH if checked else INK, UI, 400,
           deco="line-through" if checked else None)
    meta = []
    if due:
        meta.append(due.upper())
    if tag:
        meta.append(tag.upper())
    else:
        meta.append("NO TAG")
    meta.append(p.upper())
    g += lab(tx, y + 26, "  ·  ".join(meta), 7.5, VERMT if overdue else GRAPH, 0.6)
    g += prio(x + w - 14, y + 7, p)
    if overdue:
        g += stamp(x + w - 86, y + 18, 60, 13, "overdue", VERM, -2.6, 7.5, 0.1)
    return g


def marks_key(x, y, w=332, cols=1):
    """The legend for every mark. Publishes that nothing here is colour alone."""
    g = lab(x, y, "What the marks mean", 9, INK, 1.1, 600)
    g += hr(x, y + 5, x + w, RULE)
    rows = [("prio", "high · medium · low", "three bars, filled to the level, beside the word"),
            ("stamp", "set 16 Nov", "a part you accepted, with the day you accepted it"),
            ("struck", "struck through", "a part you rejected · kept legible, never re-proposed"),
            ("overdue", "OVERDUE", "due date in the past and not completed"),
            ("engine", "R · Rule Engine", "which engine proposed it, named not coloured")]
    per = (len(rows) + cols - 1) // cols
    for i, (kind, name, desc) in enumerate(rows):
        c, r = i // per, i % per
        cx, yy = x + c * (w / cols + 16), y + 22 + r * 24
        if kind == "prio":
            g += prio(cx + 2, yy - 8, "high")
        elif kind == "overdue":
            g += stamp(cx, yy - 10, 54, 13, "overdue", VERM, -2.6, 7, 0.1)
        elif kind == "stamp":
            g += stamp(cx, yy - 10, 54, 13, "set", BLUE, -1.8, 7, 0.08)
        elif kind == "struck":
            g += t(cx, yy, "high", 9.5, GRAPH, UI, 400, deco="line-through")
        else:
            g += rect(cx, yy - 8, 9, 9, stroke=GRAPH, sw=0.9)
            g += t(cx + 4.5, yy - 1, "R", 6.5, GRAPH, ST, 600, "middle", 0)
        g += lab(cx + 64, yy - 3, name, 7.5, INK, 0.7)
        g += lab(cx + 64, yy + 7, desc, 7, GRAPH, 0.4)
    return g


def section(x, y, title, count, w=332, color=INK):
    return (lab(x, y, title, 9, color, 1.1, 600) +
            num(x + w, y, str(count), 9, color, 500, "end") +
            hr(x, y + 5, x + w, RULE if color == INK else VERM, 1.2))


# ─── mobile frames ──────────────────────────────────────────────────────────
def m1_today():
    b = mhead()
    b += rect(14, 48, 250, 28, fill=CARD) + rect(14, 48, 250, 28, stroke=GRAPH, sw=1)
    b += t(23, 66, "Type a task the way you would say it", 10, GRAPH, UI, 400)
    b += btn(270, 48, 76, "Add", 28, primary=True, size=9.5)
    b += lab(14, 90, "Mon 16 Nov 2026 · reference date", 7.5, GRAPH, 0.7)
    b += num(346, 90, "10 ON FILE", 8, GRAPH, 500, "end")
    y = 108
    b += section(14, y, "Due this week", 3)
    y += 14
    for tk in TASKS[:3]:
        b += task_row(14, y, tk)
        b += hr(14, y + 34, 346, RULE2)
        y += 38
    y += 12
    b += section(14, y, "Need Attention", 2, color=VERM)
    y += 14
    for tk in TASKS[8:10]:
        b += task_row(14, y, tk)
        b += hr(14, y + 34, 346, RULE2)
        y += 38
    y += 12
    b += section(14, y, "High priority", 5)
    y += 14
    for tk in [TASKS[0], TASKS[1], TASKS[2], TASKS[3]]:
        b += task_row(14, y, tk)
        b += hr(14, y + 34, 346, RULE2)
        y += 38
    b += lab(14, y + 14, "Submit lab report in IBE160 — 1 more", 8, GRAPH, 0.5)
    b += marks_key(14, y + 46)
    b += hr(14, 700, 346, RULE)
    b += lab(14, 714, "Every list on this card is computed on this render.", 7.5, GRAPH, 0.5)
    b += lab(14, 725, "Membership is never stored. Nothing here was filed by hand.", 7.5, GRAPH, 0.5)
    b += mtabs("today")
    return frame(360, 800, b)


def m2_capture():
    b = mhead()
    b += rect(14, 48, 250, 28, fill=CARD) + rect(14, 48, 250, 28, stroke=INK, sw=1.4)
    b += t(23, 66, "Submit assignment in IBE160 Friday", 10, INK, UI, 400)
    b += rect(246, 53, 1.2, 18, fill=INK)
    b += btn(270, 48, 76, "Add", 28, primary=True, size=9.5)
    b += lab(14, 90, "Saved at 09:12 · before anything was proposed", 7.5, GRAPH, 0.7)
    # the just-filed record
    b += rect(14, 102, 332, 104, fill=CARD)
    b += rect(14, 102, 332, 104, stroke=GRAPH, sw=1)
    b += t(26, 124, "Submit assignment in IBE160 Friday", 11, INK, UI, 500)
    b += lab(26, 139, "Due Fri 20 Nov · parsed from “Friday” · applied directly", 7.5, GRAPH, 0.6)
    b += hr(26, 148, 334, RULE2)
    b += stamp(26, 156, 118, 17, "pending", GRAPH, -1.8, 8.5, 0.0)
    b += lab(152, 168, "The slip is open.", 8, GRAPH, 0.6)
    b += lab(152, 179, "Nothing is stamped yet.", 8, GRAPH, 0.6)
    b += lab(26, 196, "Fully editable while it waits · it never blocks", 7.5, GRAPH, 0.6)
    y = 226
    b += section(14, y, "Due this week", 3)
    y += 14
    for tk in TASKS[1:3]:
        b += task_row(14, y, tk)
        b += hr(14, y + 34, 346, RULE2)
        y += 38
    y += 12
    b += section(14, y, "Need Attention", 2, color=VERM)
    y += 14
    for tk in TASKS[8:10]:
        b += task_row(14, y, tk)
        b += hr(14, y + 34, 346, RULE2)
        y += 38
    y += 12
    b += section(14, y, "High priority", 5)
    y += 14
    for tk in TASKS[3:4]:
        b += task_row(14, y, tk)
        y += 38
    b += hr(14, 690, 346, RULE)
    b += lab(14, 704, "The pending mark is the one mark that shows offline.", 7.5, GRAPH, 0.5)
    b += lab(14, 715, "No spinner, no error, no banner — it reports a slip, not a network.",
             7.5, GRAPH, 0.5)
    b += mtabs("today")
    return frame(360, 800, b)


# ─── the review card: the graded surface ────────────────────────────────────
def part_block(x, y, w, name, value, state, engine_name="Rule Engine",
               date="16 Nov", edit_choice=None):
    """One reviewable part. state: proposed | accepted | struck | editing"""
    h = {"proposed": 84, "accepted": 78, "struck": 58, "editing": 102}[state]
    g = rect(x, y, w, h, fill=CARD) + rect(x, y, w, h, stroke=RULE2, sw=1)
    g += vr(x, y, y + h, INK if state == "editing" else RULE2, 2 if state == "editing" else 1)
    g += lab(x + 11, y + 16, name, 8.5, INK, 1.0, 600)
    g += engine(x + w - 92, y + 16, engine_name)
    tag = {"proposed": ("PROPOSED", VERMT), "accepted": ("ACCEPTED", BLUE),
           "struck": ("STRUCK", GRAPH), "editing": ("EDITING", INK)}[state]
    g += lab(x + w - 11, y + 16, tag[0], 7.5, tag[1], 0.9, 600, "end")
    g += hr(x + 11, y + 23, x + w - 11, RULE2)

    vy = y + 40
    if state == "struck":
        g += t(x + 11, vy, value, 11.5, GRAPH, UI, 500, deco="line-through")
        g += lab(x + 11, y + 50, "field unchanged · not proposed again for this task",
                 7.5, GRAPH, 0.5)
    elif state == "accepted":
        g += t(x + 11, vy, value, 11, BLUE, UI, 600)
        g += stamp(x + 11, y + 48, 92, 16, f"set {date}", BLUE, -1.8, 7.5, 0.08)
        g += btn(x + 111, y + 47, 54, "Undo", 18, size=8)
        g += lab(x + 173, y + 59, "one step back · restores the previous value",
                 7.5, GRAPH, 0.5)
    elif state == "editing":
        g += t(x + 11, vy - 4, "Your value, not the proposal", 9, GRAPH, UI, 400)
        bw = (w - 22 - 8) / 3
        for i, opt in enumerate(["low", "medium", "high"]):
            sel = opt == edit_choice
            bx = x + 11 + i * (bw + 4)
            g += rect(bx, vy + 4, bw, 22, fill=INK if sel else CARD)
            g += rect(bx, vy + 4, bw, 22, stroke=INK if sel else GRAPH, sw=1)
            g += t(bx + bw / 2, vy + 19, opt.upper(), 8.5, CARD if sel else INK,
                   ST, 500, "middle", 0.8)
        g += btn(x + 11, vy + 34, 56, "Save", 20, primary=True)
        g += btn(x + 71, vy + 34, 56, "Cancel", 20)
        g += lab(x + 134, vy + 48, "Editing writes your pick, not the proposal",
                 7.5, GRAPH, 0.5)
    else:
        g += t(x + 11, vy, value, 11, INK, UI, 500)
        bw = (w - 22 - 12) / 3
        for i, s in enumerate(["Accept", "Edit", "Reject"]):
            g += btn(x + 11 + i * (bw + 6), y + 48, bw, s, 20)
        g += lab(x + 11, y + 78, "this part only · the other two are untouched",
                 7.5, GRAPH, 0.5)
    return g, h


def review_card_m(states, title_note, readout_pairs, choice=None):
    b = mhead("To-Do-List")
    b += lab(14, 56, "Review", 11, INK, 1.2, 600)
    b += lab(346, 56, title_note, 7.5, VERMT, 0.7, 500, "end")
    b += hr(14, 62, 346, RULE)
    # the record itself — the task text, never rewritten
    b += rect(14, 72, 332, 56, fill=CARD2)
    b += rect(14, 72, 332, 56, stroke=GRAPH, sw=1)
    b += t(26, 94, "Submit assignment in IBE160 Friday", 11.5, INK, UI, 500)
    b += lab(26, 108, "Due Fri 20 Nov · parsed from “Friday”", 7.5, GRAPH, 0.6)
    b += lab(26, 119, "Applied directly · not part of this review · editable now",
             7.5, GRAPH, 0.6)
    y = 140
    for name, value, st in states:
        g, h = part_block(14, y, 332, name, value, st, edit_choice=choice)
        b += g
        y += h + 10
    b += hr(14, y + 2, 346, RULE)
    b += btn(14, y + 12, 96, "Accept all", 22)
    b += btn(118, y + 12, 96, "Reject all", 22)
    b += lab(14, y + 48, "Shortcuts. They do nothing the three blocks", 7.5, GRAPH, 0.5)
    b += lab(14, y + 59, "above cannot do one at a time.", 7.5, GRAPH, 0.5)
    b += hr(14, 688, 346, RULE)
    b += readout(14, 702, readout_pairs)
    b += mtabs("today")
    return frame(360, 800, b)


def m3():
    return review_card_m(
        [("Tags", "school", "proposed"),
         ("Priority", "high", "proposed"),
         ("Summary", "Submit assignment in IBE160", "proposed")],
        "3 parts await you",
        [("Nothing stamped yet", "0 OF 3"),
         ("Engine on this slip", "RULE ENGINE"),
         ("Works with no key, no network", "ON DEVICE")])


def m4():
    return review_card_m(
        [("Tags", "school", "accepted"),
         ("Priority", "medium", "editing"),
         ("Summary", "Submit assignment in IBE160", "accepted")],
        "1 part open · you are editing",
        [("Stamped so far", "2 OF 3"),
         ("One wrong field", "ONE CORRECTION"),
         ("Reference date", "MON 16 NOV 2026")],
        choice="high")


def m5():
    return review_card_m(
        [("Tags", "school", "accepted"),
         ("Priority", "high", "struck"),
         ("Summary", "Submit assignment in IBE160", "proposed")],
        "3 part-states on one slip",
        [("Stamped", "1 · TAGS"),
         ("Struck", "1 · PRIORITY"),
         ("Still open", "1 · SUMMARY")])


def m6_detail():
    b = mhead()
    b += lab(14, 56, "Task", 11, INK, 1.2, 600)
    b += lab(346, 56, "every field · one place", 7.5, GRAPH, 0.7, 500, "end")
    b += hr(14, 62, 346, RULE)
    y = 76
    fields = [("Task text", "Submit assignment in IBE160 Friday", True),
              ("Due date", "Fri 20 Nov 2026", True),
              ("Project", "IBE160", True),
              ("Notes", "Hand in the PDF, not the .docx", True)]
    for name, val, _ in fields:
        b += lab(14, y + 10, name, 8, GRAPH, 0.8)
        b += rect(14, y + 16, 332, 26, fill=CARD) + rect(14, y + 16, 332, 26, stroke=RULE2, sw=1)
        b += t(24, y + 33, val, 10.5, INK, UI, 400)
        b += lab(338, y + 10, "Edit", 7.5, VERMT, 0.7, 500, "end")
        y += 50
    b += hr(14, y + 4, 346, RULE)
    b += lab(14, y + 20, "Marks on this slip", 9, INK, 1.1, 600)
    y += 28
    marks = [("Tags", "school", "set 16 Nov · Rule Engine"),
             ("Priority", "high", "set 16 Nov · Rule Engine"),
             ("Summary", "Submit assignment in IBE160", "set 16 Nov · Rule Engine")]
    for n, v, when in marks:
        b += lab(14, y + 10, n, 8, GRAPH, 0.8)
        b += t(82, y + 11, v, 10, BLUE, UI, 500)
        b += lab(346, y + 10, when, 7.5, GRAPH, 0.6, 500, "end")
        b += hr(14, y + 17, 346, RULE2)
        y += 24
    b += cbox(14, y + 8)
    b += t(32, y + 18, "Not completed", 10.5, INK, UI, 400)
    y += 34
    b += btn(14, y, 104, "Complete", 24, primary=True)
    b += btn(126, y, 104, "Suggest again", 24)
    b += btn(238, y, 108, "Delete", 24)
    b += lab(14, y + 40, "Suggest again is always explicit. The app never", 7.5, GRAPH, 0.5)
    b += lab(14, y + 51, "re-proposes a part you struck.", 7.5, GRAPH, 0.5)
    b += hr(14, 688, 346, RULE)
    b += readout(14, 702, [("Completed tasks are archived after", "30 DAYS"),
                           ("Deleting is a separate, explicit act", "NOT THE SAME"),
                           ("Accession", "IBE160 · 16 NOV")])
    b += mtabs("lists")
    return frame(360, 800, b)


def m7_smartlist():
    b = mhead()
    b += lab(14, 56, "Need Attention", 12, VERM, 1.1, 600)
    b += num(346, 56, "2", 11, VERM, 600, "end")
    b += hr(14, 62, 346, VERM, 1.3)
    b += lab(14, 76, "Due date in the past and not completed", 8, GRAPH, 0.6)
    y = 92
    for tk in TASKS[8:10]:
        b += rect(14, y, 332, 54, fill=CARD)
        b += rect(14, y, 332, 54, stroke=RULE2, sw=1)
        b += task_row(14, y + 6, tk)
        b += hr(14, y + 54, 346, RULE2)
        y += 64
    y += 6
    b += lab(14, y, "All lists", 9, INK, 1.1, 600)
    b += hr(14, y + 5, 346, RULE)
    y += 18
    lists = [("Due this week", "3", False), ("Need Attention", "2", True),
             ("High priority", "5", False)]
    for n, c, act in lists:
        b += rect(14, y, 332, 28, fill=CARD2 if act else CARD)
        b += rect(14, y, 332, 28, stroke=VERM if act else RULE2, sw=1.2 if act else 1)
        b += t(26, y + 18, n, 10.5, VERMT if act else INK, UI, 500 if act else 400)
        b += num(334, y + 18, c, 9.5, INK, 500, "end")
        y += 32
    y += 8
    b += lab(14, y, "Tags in use", 9, INK, 1.1, 600)
    b += num(346, y, "4", 9, INK, 500, "end")
    b += hr(14, y + 5, 346, RULE)
    y += 18
    for n, c in [("school", "3"), ("group", "1"), ("work", "1"), ("personal", "4")]:
        b += t(26, y + 13, n, 10.5, INK, UI, 400)
        b += num(334, y + 13, c, 9.5, GRAPH, 500, "end")
        b += hr(14, y + 20, 346, RULE2)
        y += 26
    b += hr(14, 676, 346, RULE)
    b += readout(14, 690, [("A tag with no task keeps no list", "DERIVED"),
                           ("Computed on every render", "NEVER STORED"),
                           ("Reference date", "MON 16 NOV 2026")])
    b += mtabs("lists")
    return frame(360, 800, b)


def m8_settings_nokey():
    b = mhead()
    b += lab(14, 56, "Settings", 12, INK, 1.2, 600)
    b += hr(14, 62, 346, RULE)
    b += lab(14, 80, "Suggestion engine", 9, INK, 1.1, 600)
    b += hr(14, 85, 346, RULE2)
    b += rect(14, 94, 332, 76, fill=CARD)
    b += rect(14, 94, 332, 76, stroke=GRAPH, sw=1)
    b += engine(26, 116, "Rule Engine", 10)
    b += stamp(238, 104, 96, 17, "serving", INK, -1.6, 8, 0.08)
    b += t(26, 136, "No API Key is configured.", 11, INK, UI, 500)
    b += lab(26, 150, "Every suggestion is produced on this device, offline,", 7.5, GRAPH, 0.6)
    b += lab(26, 161, "with no account. This is the normal state, not a limit.", 7.5, GRAPH, 0.6)
    b += lab(14, 192, "API key", 9, INK, 1.1, 600)
    b += hr(14, 197, 346, RULE2)
    b += rect(14, 206, 244, 28, fill=CARD) + rect(14, 206, 244, 28, stroke=GRAPH, sw=1)
    b += t(24, 224, "Paste an Anthropic API Key", 10, GRAPH, UI, 400)
    b += btn(264, 206, 82, "Save", 28, size=9)
    b += lab(14, 248, "Optional. Stored on this device only. Never written to the",
             7.5, GRAPH, 0.6)
    b += lab(14, 259, "repository, and never sent anywhere but Anthropic.", 7.5, GRAPH, 0.6)
    b += lab(14, 286, "Cloud Suggestions", 9, INK, 1.1, 600)
    b += hr(14, 291, 346, RULE2)
    b += rect(14, 300, 332, 54, fill=CARD2, op=0.5)
    b += rect(14, 300, 332, 54, stroke=RULE2, sw=1, dash="3 3")
    b += lab(26, 322, "Appears once a key is saved", 8.5, GRAPH, 0.7)
    b += lab(26, 338, "Off until you turn it on. Saving a key never turns it on.",
             7.5, GRAPH, 0.6)
    b += lab(14, 378, "Measured accuracy", 9, INK, 1.1, 600)
    b += hr(14, 383, 346, RULE2)
    b += readout(14, 400, [("Fixture entries", "NOT SCORED YET"),
                           ("Tags · Priority · Due date · Placement", "REPORTED APART"),
                           ("Summary", "SCORED SEPARATELY")])
    b += lab(14, 446, "The app publishes its own score. It does not claim", 7.5, GRAPH, 0.6)
    b += lab(14, 457, "the suggestions are right.", 7.5, GRAPH, 0.6)
    b += lab(14, 486, "Archive", 9, INK, 1.1, 600)
    b += hr(14, 491, 346, RULE2)
    b += lab(14, 510, "Archive completed tasks after", 8.5, GRAPH, 0.7)
    b += rect(214, 498, 132, 24, fill=CARD) + rect(214, 498, 132, 24, stroke=GRAPH, sw=1)
    b += t(226, 514, "30 days", 10, INK, UI, 400)
    b += f'<path d="M326 508 l5 5 l5 -5" fill="none" stroke="{GRAPH}" stroke-width="1.3"/>'
    b += hr(14, 676, 346, RULE)
    b += lab(14, 690, "An engine problem, if there ever is one, is shown only", 7.5, GRAPH, 0.5)
    b += lab(14, 701, "here. Never a popup, banner, toast or badge anywhere", 7.5, GRAPH, 0.5)
    b += lab(14, 712, "else in the app.", 7.5, GRAPH, 0.5)
    b += mtabs("settings")
    return frame(360, 800, b)


def m9_firstrun():
    b = mhead()
    b += rect(14, 48, 250, 28, fill=CARD) + rect(14, 48, 250, 28, stroke=GRAPH, sw=1)
    b += t(23, 66, "Type a task the way you would say it", 10, GRAPH, UI, 400)
    b += btn(270, 48, 76, "Add", 28, primary=True, size=9.5)
    b += lab(14, 92, "Nothing on file yet", 9, INK, 1.1, 600)
    b += hr(14, 97, 346, RULE)
    b += t(14, 126, "Say it the way you would", 17, INK, UI, 600)
    b += t(14, 148, "say it out loud.", 17, INK, UI, 600)
    b += t(14, 176, "The app files it at once, then proposes a", 11, INK2, UI, 400)
    b += t(14, 192, "few marks for the slip. You stamp each one", 11, INK2, UI, 400)
    b += t(14, 208, "in, change it, or strike it out.", 11, INK2, UI, 400)
    b += rect(14, 230, 332, 140, fill=CARD)
    b += rect(14, 230, 332, 140, stroke=GRAPH, sw=1)
    b += t(26, 254, "Submit assignment in IBE160 Friday", 11, INK, UI, 500)
    b += lab(26, 268, "Due Fri 20 Nov · parsed from “Friday”", 7.5, GRAPH, 0.6)
    b += hr(26, 278, 334, RULE2)
    for i, (n, v) in enumerate([("Tags", "school"), ("Priority", "high"),
                                ("Summary", "Submit assignment in IBE160")]):
        yy = 296 + i * 24
        b += lab(26, yy, n, 8, GRAPH, 0.8)
        b += t(94, yy + 1, v, 10, VERMT, UI, 500)
        b += lab(334, yy, "PROPOSED", 7, VERMT, 0.8, 600, "end")
    b += lab(26, 362, "Three marks · each stamped, changed or struck on its own",
             7.5, GRAPH, 0.5)
    b += lab(14, 398, "The three parts", 9, INK, 1.1, 600)
    b += hr(14, 403, 346, RULE2)
    y = 418
    for n, d in [("Tags", "which of your four contexts it belongs to"),
                 ("Priority", "high, medium or low"),
                 ("Summary", "a short restatement of your own sentence")]:
        b += t(14, y + 11, n, 10.5, INK, UI, 600)
        b += lab(14, y + 24, d, 8, GRAPH, 0.5)
        b += hr(14, y + 32, 346, RULE2)
        y += 40
    b += lab(14, 560, "The lists build themselves", 9, INK, 1.1, 600)
    b += hr(14, 565, 346, RULE2)
    y = 580
    for n in ["Due this week", "Need Attention", "High priority"]:
        b += t(14, y + 11, n, 10.5, INK, UI, 400)
        b += num(346, y + 11, "0", 9.5, GRAPH, 500, "end")
        b += hr(14, y + 18, 346, RULE2)
        y += 26
    b += hr(14, 676, 346, RULE)
    b += readout(14, 690, [("Works offline", "NO ACCOUNT · NO KEY"),
                           ("Engine on this device", "RULE ENGINE"),
                           ("Reference date", "MON 16 NOV 2026")])
    b += mtabs("today")
    return frame(360, 800, b)


# ─── desktop shell ──────────────────────────────────────────────────────────
NAVW, APPX = 190, 962


def drail(active="Today"):
    g = rect(0, 0, NAVW, 800, fill=CARD2) + vr(NAVW, 0, 800, GRAPH)
    g += t(22, 32, "To-Do-List", 13, INK, ST, 600, ls=1.6)
    g += hr(22, 44, NAVW - 22, RULE)
    y = 68
    g += lab(22, y, "Lists", 8, GRAPH, 0.9)
    y += 16
    items = [("Today", "10"), ("Due this week", "3"), ("Need Attention", "2"),
             ("High priority", "5")]
    for n, c in items:
        act = n == active
        if act:
            g += rect(14, y - 11, NAVW - 28, 24, fill=CARD)
            g += rect(14, y - 11, NAVW - 28, 24, stroke=RULE2, sw=1)
            g += rect(14, y - 11, 2.4, 24, fill=VERM)
        g += t(26, y + 5, n, 10.5, VERMT if n == "Need Attention" else INK, UI,
               600 if act else 400)
        g += num(NAVW - 22, y + 5, c, 9, GRAPH, 500, "end")
        y += 28
    y += 8
    g += lab(22, y, "Tags in use", 8, GRAPH, 0.9)
    g += num(NAVW - 22, y, "4", 8, GRAPH, 500, "end")
    y += 16
    for n, c in [("school", "3"), ("group", "1"), ("work", "1"), ("personal", "4")]:
        act = n == active
        if act:
            g += rect(14, y - 11, NAVW - 28, 24, fill=CARD)
            g += rect(14, y - 11, NAVW - 28, 24, stroke=RULE2, sw=1)
        g += t(26, y + 5, n, 10.5, INK, UI, 600 if act else 400)
        g += num(NAVW - 22, y + 5, c, 9, GRAPH, 500, "end")
        y += 26
    y += 10
    g += hr(22, y, NAVW - 22, RULE)
    y += 20
    for n, c in [("Archive", "4"), ("Settings", "")]:
        act = n == active
        if act:
            g += rect(14, y - 11, NAVW - 28, 24, fill=CARD)
            g += rect(14, y - 11, NAVW - 28, 24, stroke=RULE2, sw=1)
            g += rect(14, y - 11, 2.4, 24, fill=VERM)
        g += t(26, y + 5, n, 10.5, INK, UI, 600 if act else 400)
        if c:
            g += num(NAVW - 22, y + 5, c, 9, GRAPH, 500, "end")
        y += 28
    g += hr(22, 726, NAVW - 22, RULE)
    g += engine(22, 748, "Rule Engine", 8)
    g += lab(22, 762, "on device · no network", 7.5, GRAPH, 0.6)
    g += lab(22, 774, "no account · no key", 7.5, GRAPH, 0.6)
    return g


def dhead(title, note=None):
    g = t(NAVW + 28, 34, title, 15, INK, ST, 600, ls=1.3)
    g += lab(APPX - 24, 34, "Mon 16 Nov 2026", 8.5, GRAPH, 0.8, 500, "end")
    g += hr(NAVW + 28, 46, APPX - 24, RULE)
    if note:
        g += lab(NAVW + 28, 62, note, 8, GRAPH, 0.6)
    return g


def dapp(pairs, title="On this slip"):
    """Right-hand apparatus column: the live readout."""
    g = vr(APPX, 0, 800, RULE)
    g += lab(APPX + 24, 34, title, 9, INK, 1.1, 600)
    g += hr(APPX + 24, 46, 1280 - 24, RULE)
    y = 68
    for k, v in pairs:
        if k == "—":
            g += hr(APPX + 24, y - 8, 1280 - 24, RULE2)
            y += 10
            continue
        g += lab(APPX + 24, y, k, 7.5, GRAPH, 0.7)
        g += num(1280 - 24, y, v, 8.5, INK, 500, "end")
        y += 15
    return g


def d1_today():
    b = drail("Today") + dhead("Today")
    b += rect(NAVW + 28, 62, 560, 30, fill=CARD)
    b += rect(NAVW + 28, 62, 560, 30, stroke=GRAPH, sw=1)
    b += t(NAVW + 40, 81, "Type a task the way you would say it", 10.5, GRAPH, UI, 400)
    b += btn(NAVW + 598, 62, 92, "Add", 30, primary=True, size=9.5)
    b += lab(NAVW + 28, 108, "Saved and filed before anything is proposed", 7.5, GRAPH, 0.6)
    col1, col2, cw = NAVW + 28, NAVW + 404, 352
    y1 = 130
    b += section(col1, y1, "Due this week", 3, cw)
    yy = y1 + 14
    for tk in TASKS[:3]:
        b += task_row(col1, yy, tk, cw)
        b += hr(col1, yy + 34, col1 + cw, RULE2)
        yy += 38
    yy += 16
    b += section(col1, yy, "Need Attention", 2, cw, VERM)
    yy += 14
    for tk in TASKS[8:10]:
        b += task_row(col1, yy, tk, cw)
        b += hr(col1, yy + 34, col1 + cw, RULE2)
        yy += 38
    y2 = 130
    b += section(col2, y2, "High priority", 5, cw)
    yy2 = y2 + 14
    for tk in [TASKS[0], TASKS[1], TASKS[2], TASKS[3], TASKS[8]]:
        b += task_row(col2, yy2, tk, cw)
        b += hr(col2, yy2 + 34, col2 + cw, RULE2)
        yy2 += 38
    yy2 += 16
    b += section(col2, yy2, "Everything on file", 10, cw)
    yy2 += 14
    for tk in TASKS[4:8]:
        b += task_row(col2, yy2, tk, cw)
        b += hr(col2, yy2 + 34, col2 + cw, RULE2)
        yy2 += 38
    b += marks_key(col1, max(yy, yy2) + 30, cw * 2 + 24, cols=2)
    b += dapp([("Tasks on file", "10"), ("Past due", "2"), ("Without a due date", "4"),
               ("Untagged", "1"), ("—", ""),
               ("Tags proposed by the engine", "ALL FOUR"),
               ("Lists built by hand", "NONE"),
               ("Membership stored", "NEVER"), ("—", ""),
               ("The no-match case", "“FIGURE OUT THE THING”"),
               ("earns no tag and medium", "A VALID OUTCOME"), ("—", ""),
               ("Network", "NOT IN USE"), ("Account", "NONE"),
               ("Reference date", "MON 16 NOV 2026")], "Counted on this render")
    return frame(1280, 800, b)


def review_card_d(states, note, app_pairs, choice=None):
    b = drail("Today") + dhead("Review", note)
    x, w = NAVW + 28, 700
    b += rect(x, 78, w, 62, fill=CARD2) + rect(x, 78, w, 62, stroke=GRAPH, sw=1)
    b += t(x + 16, 104, "Submit assignment in IBE160 Friday", 14, INK, UI, 500)
    b += lab(x + 16, 120, "Due Fri 20 Nov · parsed from “Friday” · applied directly, "
             "not part of this review", 7.5, GRAPH, 0.6)
    b += lab(x + w - 16, 104, "the slip", 8, GRAPH, 0.8, 500, "end")
    b += lab(x + w - 16, 120, "your sentence, never rewritten", 7.5, GRAPH, 0.6, 500, "end")
    y = 160
    for name, value, st in states:
        g, h = part_block(x, y, w, name, value, st, edit_choice=choice)
        b += g
        y += h + 12
    b += hr(x, y + 4, x + w, RULE)
    b += btn(x, y + 16, 108, "Accept all", 24)
    b += btn(x + 118, y + 16, 108, "Reject all", 24)
    b += lab(x + 240, y + 32, "Shortcuts. They do nothing the three blocks above cannot "
             "do one at a time.", 7.5, GRAPH, 0.5)
    y += 68
    b += marks_key(x, y, w, cols=2)
    y += 152
    b += hr(x, y, x + w, RULE)
    b += lab(x, y + 18, "The due date is not in this review", 8.5, INK, 0.9, 600)
    b += lab(x, y + 32, "“Friday” was parsed into Fri 20 Nov and applied straight to the "
             "record. It is deterministic,", 8, GRAPH, 0.5)
    b += lab(x, y + 44, "it is editable now, and it is never proposed — so it is not one of "
             "the three parts above.", 8, GRAPH, 0.5)
    b += dapp(app_pairs, "On this slip")
    return frame(1280, 800, b)


def d2():
    return review_card_d(
        [("Tags", "school", "proposed"), ("Priority", "high", "proposed"),
         ("Summary", "Submit assignment in IBE160", "proposed")],
        "three parts · none stamped yet",
        [("Parts proposed", "3"), ("Stamped", "0"), ("Struck", "0"), ("—", ""),
         ("Engine", "RULE ENGINE"), ("Where it ran", "THIS DEVICE"),
         ("Needed a key", "NO"), ("Needed a network", "NO"), ("—", ""),
         ("In the record now", "TAGS: NONE"), ("", "PRIORITY: MEDIUM"),
         ("", "SUMMARY: NONE"), ("—", ""),
         ("Nothing is written", "UNTIL YOU ACT"),
         ("The parsed due date", "ALREADY APPLIED")])


def d3():
    return review_card_d(
        [("Tags", "school", "accepted"), ("Priority", "medium", "editing"),
         ("Summary", "Submit assignment in IBE160", "accepted")],
        "one part open · you are editing priority",
        [("Stamped", "2 OF 3"), ("Open", "1 · PRIORITY"), ("—", ""),
         ("One wrong field costs", "ONE CORRECTION"),
         ("Tags and Summary", "ALREADY IN"), ("—", ""),
         ("Editing writes", "YOUR VALUE"), ("not", "THE PROPOSAL"), ("—", ""),
         ("Engine", "RULE ENGINE"), ("Reference date", "MON 16 NOV 2026")],
        choice="high")


def d4():
    return review_card_d(
        [("Tags", "school", "accepted"), ("Priority", "high", "struck"),
         ("Summary", "Submit assignment in IBE160", "proposed")],
        "three part-states on one slip",
        [("Stamped", "1 · TAGS"), ("Struck", "1 · PRIORITY"),
         ("Still open", "1 · SUMMARY"), ("—", ""),
         ("Undo on the stamped part", "ONE STEP"),
         ("restores", "THE PREVIOUS VALUE"), ("—", ""),
         ("The struck part", "STAYS LEGIBLE"),
         ("and is", "NOT RE-PROPOSED"), ("—", ""),
         ("Nothing disappears", "IT CANCELS"),
         ("Engine", "RULE ENGINE")])


def d5_detail():
    b = drail("Today") + dhead("Task")
    x, w = NAVW + 28, 700
    b += rect(x, 62, w, 54, fill=CARD2) + rect(x, 62, w, 54, stroke=GRAPH, sw=1)
    b += t(x + 16, 88, "Submit assignment in IBE160 Friday", 14, INK, UI, 500)
    b += lab(x + 16, 104, "Accession 16 Nov 2026 · on file 0 days", 7.5, GRAPH, 0.6)
    y = 136
    for name, val in [("Task text", "Submit assignment in IBE160 Friday"),
                      ("Due date", "Fri 20 Nov 2026"), ("Project", "IBE160"),
                      ("Notes", "Hand in the PDF, not the .docx")]:
        b += lab(x, y, name, 8, GRAPH, 0.8)
        b += rect(x + 110, y - 14, w - 190, 26, fill=CARD)
        b += rect(x + 110, y - 14, w - 190, 26, stroke=RULE2, sw=1)
        b += t(x + 122, y + 3, val, 10.5, INK, UI, 400)
        b += lab(x + w, y, "Edit", 7.5, VERMT, 0.7, 500, "end")
        y += 40
    b += hr(x, y, x + w, RULE)
    y += 22
    b += lab(x, y, "Marks on this slip", 9, INK, 1.1, 600)
    b += lab(x + w, y, "all three set by you · 16 Nov · Rule Engine", 7.5, GRAPH, 0.6,
             500, "end")
    y += 8
    b += hr(x, y, x + w, RULE2)
    y += 22
    for n, v in [("Tags", "school"), ("Priority", "high"),
                 ("Summary", "Submit assignment in IBE160")]:
        b += lab(x, y, n, 8, GRAPH, 0.8)
        b += t(x + 110, y + 1, v, 11, BLUE, UI, 500)
        b += stamp(x + 400, y - 11, 96, 16, "set 16 nov", BLUE, -1.6, 7.5, 0.08)
        b += engine(x + 520, y, "Rule Engine")
        b += hr(x, y + 12, x + w, RULE2)
        y += 32
    y += 10
    b += cbox(x, y - 8)
    b += t(x + 20, y + 2, "Not completed", 11, INK, UI, 400)
    y += 30
    b += btn(x, y, 118, "Complete", 26, primary=True)
    b += btn(x + 128, y, 118, "Suggest again", 26)
    b += btn(x + 256, y, 118, "Delete", 26)
    y += 60
    b += marks_key(x, y, w, cols=2)
    y += 150
    b += hr(x, y, x + w, RULE)
    b += lab(x, y + 18, "The history stays on the slip", 8.5, INK, 0.9, 600)
    b += lab(x, y + 32, "Completing this task keeps every mark it earned and moves it to the "
             "archive after thirty days.", 8, GRAPH, 0.5)
    b += lab(x, y + 44, "Nothing is deleted by completing. Delete is its own act, and it is "
             "the only one that destroys.", 8, GRAPH, 0.5)
    b += dapp([("Parts set by you", "3 OF 3"), ("Parts struck", "0"), ("—", ""),
               ("Suggest again", "ALWAYS EXPLICIT"),
               ("Editing the text", "RE-RUNS NOTHING"),
               ("A struck part", "NEVER RETURNS"), ("—", ""),
               ("Complete", "KEEPS EVERY MARK"),
               ("Archive after", "30 DAYS"),
               ("Delete", "A SEPARATE ACT"), ("—", ""),
               ("In these lists", "DUE THIS WEEK"), ("", "HIGH PRIORITY"),
               ("", "SCHOOL")], "This slip")
    return frame(1280, 800, b)


def d6_archive():
    b = drail("Archive") + dhead("Archive", "completed, kept, not deleted")
    x, w = NAVW + 28, 700
    y = 90
    b += lab(x, y, "Task", 8, GRAPH, 0.9)
    b += lab(x + 330, y, "Tag", 8, GRAPH, 0.9)
    b += lab(x + 420, y, "Completed", 8, GRAPH, 0.9)
    b += lab(x + 530, y, "Archived", 8, GRAPH, 0.9)
    b += hr(x, y + 6, x + w, RULE)
    y += 26
    arch = [("Clean the kitchen eventually", "personal", "Sat 10 Oct", "Mon 09 Nov"),
            ("Call the doctor", "personal", "Fri 02 Oct", "Sun 01 Nov"),
            ("Figure out the thing", "no tag", "Wed 30 Sep", "Fri 30 Oct"),
            ("Buy birthday present next week", "personal", "Mon 28 Sep", "Wed 28 Oct")]
    for n, tg, c, a in arch:
        b += cbox(x, y - 9, True)
        b += t(x + 20, y, n, 10.5, GRAPH, UI, 400, deco="line-through")
        b += t(x + 330, y, tg, 10, GRAPH, UI, 400)
        b += num(x + 420, y, c, 9, GRAPH, 400, font=UI)
        b += num(x + 530, y, a, 9, INK, 500, font=UI)
        b += btn(x + 616, y - 15, 84, "Restore", 20)
        b += hr(x, y + 12, x + w, RULE2)
        y += 34
    y += 20
    b += lab(x, y, "Retention", 9, INK, 1.1, 600)
    b += hr(x, y + 6, x + w, RULE2)
    y += 26
    b += lab(x, y, "Archive completed tasks after", 8.5, GRAPH, 0.7)
    b += rect(x + 190, y - 16, 130, 24, fill=CARD)
    b += rect(x + 190, y - 16, 130, 24, stroke=GRAPH, sw=1)
    b += t(x + 202, y, "30 days", 10, INK, UI, 400)
    b += f'<path d="M{x+300} {y-6} l5 5 l5 -5" fill="none" stroke="{GRAPH}" stroke-width="1.3"/>'
    b += lab(x, y + 30, "Changing this re-evaluates every completed task against the new value.",
             8, GRAPH, 0.5)
    b += lab(x, y + 44, "The same control is in Settings. The number is never in two places.",
             8, GRAPH, 0.5)
    b += dapp([("Archived", "4"), ("Completed, not yet archived", "0"), ("—", ""),
               ("An archived slip keeps", "EVERY MARK"),
               ("Restore puts it back", "WITH ITS MARKS"),
               ("Deleted", "NOTHING"), ("—", ""),
               ("The archive is not", "A WASTEBASKET"),
               ("Delete is", "ITS OWN ACT"), ("—", ""),
               ("Completed work leaves", "THE ACTIVE LISTS"),
               ("so the list stays", "WORTH TRUSTING")], "Not deleted")
    return frame(1280, 800, b)


def d7_settings_cloud():
    b = drail("Settings") + dhead("Settings", "one device · no account")
    x, w = NAVW + 28, 700
    y = 86
    b += lab(x, y, "API key", 9, INK, 1.1, 600)
    b += lab(x + w, y, "saved on this device", 7.5, GRAPH, 0.7, 500, "end")
    b += hr(x, y + 6, x + w, RULE2)
    y += 30
    b += rect(x, y - 18, 420, 28, fill=CARD) + rect(x, y - 18, 420, 28, stroke=GRAPH, sw=1)
    b += num(x + 12, y, "sk-ant-api03-••••••••••••••••••••••••••7Q4F", 10, INK, 400, font=UI)
    b += btn(x + 432, y - 18, 86, "Replace", 28, size=9)
    b += btn(x + 526, y - 18, 86, "Remove", 28, size=9)
    b += stamp(x + 624, y - 17, 76, 26, "a key", INK, -1.8, 9, 0.08)
    b += lab(x, y + 28, "Stored in this browser only. Never committed to the repository, "
             "and never", 8, GRAPH, 0.6)
    b += lab(x, y + 40, "sent anywhere until Cloud Suggestions is on.", 8, GRAPH, 0.6)
    y += 78
    b += lab(x, y, "Cloud Suggestions", 9, INK, 1.1, 600)
    b += lab(x + w, y, "off", 8.5, GRAPH, 0.9, 600, "end")
    b += hr(x, y + 6, x + w, RULE2)
    y += 34
    # a standard toggle, off
    b += rect(x, y - 12, 38, 19, rx=9.5, fill=CARD2)
    b += rect(x, y - 12, 38, 19, rx=9.5, stroke=GRAPH, sw=1)
    b += f'<circle cx="{x+10}" cy="{y-2.5}" r="6.4" fill="{CARD}" stroke="{GRAPH}" stroke-width="1"/>'
    b += t(x + 50, y + 2, "Use Cloud Suggestions", 11.5, INK, UI, 500)
    b += lab(x + 50, y + 18, "Off on first run, even when a key is already saved.",
             8, GRAPH, 0.6)
    y += 46
    b += rect(x, y, w, 92, fill=CARD) + rect(x, y, w, 92, stroke=RULE2, sw=1)
    b += rect(x, y, 2.4, 92, fill=VERM)
    b += lab(x + 16, y + 20, "Before you turn this on", 8.5, INK, 0.9, 600)
    for i, s in enumerate([
            "Your task text is sent to the Anthropic API.",
            "The key is your own, and the call is billed to it.",
            "The Rule Engine stays the fallback, and answers whenever a cloud call fails."]):
        b += t(x + 16, y + 40 + i * 16, "— " + s, 10, INK2, UI, 400)
    y += 112
    b += lab(x, y, "Engine in use", 9, INK, 1.1, 600)
    b += hr(x, y + 6, x + w, RULE2)
    y += 26
    b += engine(x, y, "Rule Engine", 10)
    b += stamp(x + 160, y - 13, 86, 18, "serving", INK, -1.6, 8, 0.08)
    b += lab(x, y + 20, "The Model Engine is not in use, because Cloud Suggestions is off.",
             8, GRAPH, 0.6)
    b += lab(x, y + 32, "Nothing is wrong.", 8, GRAPH, 0.6)
    b += dapp([("API key", "SAVED"), ("Cloud Suggestions", "OFF"),
               ("Engine serving", "RULE ENGINE"), ("—", ""),
               ("Saving a key", "TURNS NOTHING ON"),
               ("Turning it off", "STOPS EVERY CALL"),
               ("Re-saving a key", "DOES NOT RE-ENABLE"), ("—", ""),
               ("Task text sent so far", "NONE"),
               ("Analytics", "NONE"), ("Telemetry", "NONE"),
               ("Third-party script", "NONE"), ("—", ""),
               ("Engine problems appear", "ONLY ON THIS PAGE")], "What leaves this device")
    return frame(1280, 800, b)


def d8_settings_failure():
    b = drail("Settings") + dhead("Settings", "one device · no account")
    x, w = NAVW + 28, 700
    y = 86
    b += lab(x, y, "Engine status", 9, INK, 1.1, 600)
    b += hr(x, y + 6, x + w, RULE2)
    y += 28
    b += rect(x, y - 10, w, 108, fill=CARD) + rect(x, y - 10, w, 108, stroke=GRAPH, sw=1)
    b += engine(x + 16, y + 10, "Model Engine", 10)
    b += stamp(x + 540, y + 1, 144, 20, "not being used", GRAPH, -1.6, 8.5, 0.0)
    b += t(x + 16, y + 42, "This key’s organization does not permit calls from a browser.",
           12, INK, UI, 500)
    b += lab(x + 16, y + 60, "The key itself is valid. Replacing it, or pasting a new one, "
             "will not change this —", 8, GRAPH, 0.6)
    b += lab(x + 16, y + 72, "the restriction belongs to the organization, not to your key.",
             8, GRAPH, 0.6)
    b += hr(x + 16, y + 80, x + w - 16, RULE2)
    b += engine(x + 16, y + 96, "Rule Engine")
    b += lab(x + 110, y + 96, "is serving suggestions normally.", 8, INK, 0.6)
    y += 128
    b += lab(x, y, "The other two reasons this line can give", 9, INK, 1.1, 600)
    b += lab(x + w, y, "worded apart on purpose", 7.5, GRAPH, 0.7, 500, "end")
    b += hr(x, y + 6, x + w, RULE2)
    y += 24
    for head, sub in [
            ("The API Key was rejected.",
             "Check it and paste it again. This one you can fix."),
            ("This key’s credit or quota is used up.",
             "Add credit at the provider, or leave Cloud Suggestions off.")]:
        b += rect(x, y, w, 44, fill=CARD2, op=0.55)
        b += rect(x, y, w, 44, stroke=RULE2, sw=1)
        b += t(x + 16, y + 20, head, 11, INK2, UI, 500)
        b += lab(x + 16, y + 34, sub, 8, GRAPH, 0.6)
        y += 52
    y += 10
    b += lab(x, y, "Cloud Suggestions", 9, INK, 1.1, 600)
    b += hr(x, y + 6, x + w, RULE2)
    y += 30
    b += rect(x, y - 12, 38, 19, rx=9.5, fill=INK)
    b += f'<circle cx="{x+28}" cy="{y-2.5}" r="6.4" fill="{CARD}"/>'
    b += t(x + 50, y + 2, "Use Cloud Suggestions", 11.5, INK, UI, 500)
    b += lab(x + 50, y + 18, "Still on. It is the organization that refuses, not the switch.",
             8, GRAPH, 0.6)
    b += dapp([("Model Engine", "NOT IN USE"), ("Rule Engine", "SERVING"), ("—", ""),
               ("Suggestions missed", "NONE"),
               ("Errors shown in capture", "NONE"),
               ("Errors shown in review", "NONE"),
               ("Popups · banners · toasts", "NONE"), ("—", ""),
               ("This page is the only place", "AN ENGINE PROBLEM"),
               ("", "IS EVER VISIBLE"), ("—", ""),
               ("It clears on its own", "WHEN THE CAUSE DOES"),
               ("Nothing to dismiss", "NOTHING TO FIX")], "Where this is visible")
    return frame(1280, 800, b)


FRAMES = {
    "m1-today": m1_today, "m2-capture-pending": m2_capture,
    "m3-review-proposed": m3, "m4-review-editing": m4,
    "m5-review-partial-undo": m5, "m6-task-detail": m6_detail,
    "m7-smartlist": m7_smartlist, "m8-settings-no-key": m8_settings_nokey,
    "m9-first-run": m9_firstrun,
    "d1-today": d1_today, "d2-review-proposed": d2, "d3-review-editing": d3,
    "d4-review-partial-undo": d4, "d5-task-detail": d5_detail,
    "d6-archive": d6_archive, "d7-settings-cloud-off": d7_settings_cloud,
    "d8-settings-failure": d8_settings_failure,
}

if __name__ == "__main__":
    for name, fn in FRAMES.items():
        (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
        print("wrote", name)
    print(f"{len(FRAMES)} frames")
