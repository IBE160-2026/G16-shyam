#!/usr/bin/env python3
"""Round 2, concept 07 — "Beskrivelse" (the control description sheet).

Same pinned world as 06: Kartet's inks and faces, unchanged. The difference is where
the merge is resolved. Orienteering's other artefact — the control description sheet,
a dense coded table read across the row — becomes the spine. The proposal is not a
floating layer beside the record; it is a column *in* the record's own sheet, so
"what it is now" and "what is proposed" sit on one line and are read together.
Tett's density is native here rather than imported, and Date Due's dated marks survive
literally, as dated entries in the description column.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from world import *  # noqa: F403,F401

OUT = Path(__file__).resolve().parent
ROW = 38          # the sheet's row pitch — denser than 06's 46
HEAD = 15


# ─── the sheet ──────────────────────────────────────────────────────────────
def sheet_head(x, y, w, cols, rule=HAIR2):
    g = ""
    for label, cx, anc in cols:
        g += lab(x + cx, y, label, 8.5, INK2, 0.75, anc)
    g += hr(x, y + 6, x + w, rule, 1.2)
    return g


def task_row(x, y, task, w, compact=True, checked=False, open_control=False):
    """A description-sheet record. One line on desktop; two at 360, columns intact."""
    text, due, kind, tag, p, past = task
    narrow = w < 420
    g = cbox(x + 2, y + 6, checked, 11)
    if narrow:
        g += t(x + 20, y + 15, clip(text, 10, w - 46), 10,
               INK2 if checked else INK, UI, 400,
               deco="line-through" if checked else None)
        cy = y + 22
        cx = x + 20
        if tag:
            pill, pw = tag_pill(cx, cy, tag)
            g += pill
            cx += pw + 8
        else:
            g += lab(cx, cy + 10, "no tag", 9, INK2, 0.5)
            cx += 40
        g += prio(cx, cy + 1, p)
        g += lab(cx + 20, cy + 10, p, 9, INK2, 0.5)
        if due:
            pill, pw = due_pill(x + w - 20 - (8 + len(due) * 4.6), cy, due, kind)
            g += pill
        else:
            g += lab(x + w - 20, cy + 10, "no due date", 9, INK2, 0.5, "end")
        if open_control:
            g += start_triangle(x + w - 8, y + 12)
        return g
    g += t(x + 20, y + 16, clip(text, 10, w - 236), 10, INK2 if checked else INK, UI, 400,
           deco="line-through" if checked else None)
    if open_control:
        g += start_triangle(x + w - 8, y + 13)
    cx = x + w - 212
    if tag:
        pill, _ = tag_pill(cx, y + 6, tag)
        g += pill
    else:
        g += lab(cx, y + 16, "no tag", 9, INK2, 0.5)
    g += prio(x + w - 130, y + 7, p)
    g += lab(x + w - 110, y + 16, p, 9, INK2, 0.5)
    if due:
        pill, pw = due_pill(x + w - 20 - (8 + len(due) * 4.6), y + 6, due, kind)
        g += pill
    else:
        g += lab(x + w - 20, y + 16, "—", 9, INK2, 0.5, "end")
    return g


def list_block(x, y, w, title, rows, count, ink=INK, tint=None, pitch=40):
    g = band(x, y, w, title, count, ink, tint)
    yy = y + 22
    g += sheet_head(x, yy + 10, w, [("task", 20, "start"),
                                    ("tag · priority · due", w - 20, "end")], HAIR)
    yy += 16
    for tk in rows:
        g += task_row(x, yy, tk, w)
        g += hr(x, yy + pitch, x + w, HAIR)
        yy += pitch
    return g, yy


# ─── the description sheet for a proposal ───────────────────────────────────
def desc_sheet_m(x, y, w, states, choice=None):
    """Mobile: the sheet keeps its columns, but a row takes two lines instead of one."""
    g = band(x, y, w, "Control description", "rule engine", PURPLE)
    yy = y + 22
    g += sheet_head(x, yy + 10, w, [("#", 8, "start"), ("control", 26, "start"),
                                    ("in the record → proposed", w - 8, "end")], PURPLE)
    yy += 16
    now = {"Tags": "none", "Priority": "medium", "Summary": "none"}
    heights = {"open": 70, "punched": 50, "struck": 46, "editing": 92}
    for i, (name, value, st) in enumerate(states, 1):
        h = heights[st]
        if st in ("open", "editing"):
            g += rect(x, yy, 2.4, h, fill=PURPLE)
        g += control(x + 14, yy + 14, i,
                     "punched" if st == "punched" else
                     "struck" if st == "struck" else "open", 7.5)
        g += lab(x + 28, yy + 17, name, 9.5, INK, 0.6)
        if st == "punched":
            g += lab(x + 92, yy + 17, "punched 16 nov 09:14", 8.5, INK2, 0.45)
            g += btn(x + w - 56, yy + 5, 52, "Undo", 18, "ghost", 8.5)
        elif st == "struck":
            g += lab(x + w - 8, yy + 17, "struck · never re-proposed", 8.5, INK2, 0.45, "end")
        elif st == "editing":
            g += lab(x + w - 8, yy + 17, "editing", 8.5, PURPLE, 0.45, "end")
        else:
            g += lab(x + w - 8, yy + 17, "awaiting you", 8.5, PURPLE, 0.45, "end")
        # the two values, side by side with an arrow between them
        vy = yy + 33
        rec = value if st == "punched" else now[name]
        g += t(x + 28, vy, clip(rec, 9.5, 104), 9.5,
               INK if st == "punched" else INK2, UI, 600 if st == "punched" else 400)
        g += lab(x + 140, vy, "→", 9.5, INK2, 0)
        prop = "your value" if st == "editing" else value
        g += t(x + 156, vy, clip(prop, 9.5, w - 168), 9.5,
               INK if st == "punched" else (INK2 if st == "struck" else PURPLE), UI,
               400 if st != "open" else 500,
               deco="line-through" if st == "struck" else None)
        if st == "open":
            bw = (w - 36) / 3
            for j, sname in enumerate(("Accept", "Edit", "Reject")):
                g += btn(x + 28 + j * (bw + 2), vy + 10, bw - 4, sname, 20,
                         "purple" if j == 0 else "ghost", 8.5)
        elif st == "editing":
            bw = (w - 36) / 3
            for j, opt in enumerate(("low", "medium", "high")):
                sel = opt == choice
                bx = x + 28 + j * (bw + 2)
                g += rect(bx, vy + 8, bw - 4, 19, fill=INK if sel else WHITE)
                g += rect(bx, vy + 8, bw - 4, 19, stroke=INK if sel else INK2, sw=1)
                g += lab(bx + (bw - 4) / 2, vy + 21, opt, 9, WHITE if sel else INK,
                         0.5, "middle")
            g += btn(x + 28, vy + 32, 62, "Apply", 19, "solid", 8.5)
            g += btn(x + 94, vy + 32, 62, "Cancel", 19, "ghost", 8.5)
            g += lab(x + 164, vy + 45, "writes your value", 8.5, INK2, 0.4)
        g += hr(x, yy + h, x + w, HAIR)
        yy += h
    return g, yy


def desc_sheet_d(x, y, w, states, choice=None):
    """Desktop: one line per control, read straight across the sheet."""
    g = band(x, y, w, "Control description · Rule Engine",
             f"{sum(1 for _,_,s in states if s in ('open','editing'))} of 3 open",
             PURPLE, PWASH)
    yy = y + 22
    cols = [("#", 12, "start"), ("control", 38, "start"),
            ("in the record now", 150, "start"), ("proposed", 330, "start"),
            ("description", 540, "start"), ("act on this control only", w - 20, "end")]
    g += sheet_head(x, yy + 12, w, cols, PURPLE)
    yy += 18
    now = {"Tags": "none", "Priority": "medium (default)", "Summary": "none"}
    desc = {"open": "awaiting you · nothing is written",
            "punched": "punched Mon 16 Nov 09:14 · rule engine",
            "struck": "struck · the field is unchanged, never re-proposed",
            "editing": "editing · writes your value"}
    for i, (name, value, st) in enumerate(states, 1):
        h = 64 if st == "editing" else 30
        if st in ("open", "editing"):
            g += rect(x, yy, 2.4, h, fill=PURPLE)
        g += control(x + 18, yy + 15, i,
                     "punched" if st == "punched" else
                     "struck" if st == "struck" else "open", 8)
        g += lab(x + 38, yy + 19, name, 10, INK, 0.6)
        g += t(x + 150, yy + 19, value if st == "punched" else now[name], 10,
               INK if st == "punched" else INK2, UI, 600 if st == "punched" else 400)
        if st == "struck":
            g += t(x + 330, yy + 19, value, 10, INK2, UI, 400, deco="line-through")
        elif st == "editing":
            g += t(x + 330, yy + 19, "your value", 10, PURPLE, UI, 400)
        else:
            g += t(x + 330, yy + 19, value, 10,
                   INK if st == "punched" else PURPLE, UI, 500)
        g += lab(x + 540, yy + 19, clip(desc[st], 9, 196, 0.42), 9, INK2, 0.45)
        if st == "punched":
            g += btn(x + w - 74, yy + 4, 70, "Undo", 22, "ghost", 9)
        elif st == "struck":
            g += lab(x + w - 20, yy + 19, "—", 9, INK2, 0.5, "end")
        elif st == "editing":
            bw = 84
            for j, opt in enumerate(("low", "medium", "high")):
                sel = opt == choice
                bx = x + w - 20 - (3 - j) * (bw + 6) + 6
                g += rect(bx, yy + 6, bw, 22, fill=INK if sel else WHITE)
                g += rect(bx, yy + 6, bw, 22, stroke=INK if sel else INK2, sw=1)
                g += lab(bx + bw / 2, yy + 21, opt, 9.5, WHITE if sel else INK,
                         0.6, "middle")
            g += btn(x + w - 20 - 170, yy + 34, 80, "Apply", 22, "solid", 9)
            g += btn(x + w - 20 - 84, yy + 34, 84, "Cancel", 22, "ghost", 9)
        else:
            g += btn(x + w - 20 - 236, yy + 4, 74, "Accept", 22, "purple", 9)
            g += btn(x + w - 20 - 156, yy + 4, 62, "Edit", 22, "ghost", 9)
            g += btn(x + w - 20 - 88, yy + 4, 88, "Reject", 22, "ghost", 9)
        g += hr(x, yy + h, x + w, HAIR)
        yy += h
    g += btn(x + 12, yy + 8, 100, "Punch all", 22, "ghost", 9.5)
    g += btn(x + 120, yy + 8, 100, "Strike all", 22, "ghost", 9.5)
    g += lab(x + 232, yy + 22, "shortcuts · they do nothing the three rows above cannot "
             "do one control at a time", 9, INK2, 0.45)
    return g, yy + 40


def record_line(x, y, w, open_controls=0):
    """The task itself, above the sheet — one band, never a separate object."""
    g = band(x, y, w, "The task", "your sentence, unchanged", INK)
    g += t(x + 8, y + 42, HERO, 12.5, INK, UI, 500)
    pill, pw = due_pill(x + 8, y + 50, "Fri 20 Nov", "week")
    g += pill
    g += lab(x + pw + 20, y + 60, "parsed from “Friday” · applied directly, never proposed",
             9, INK2, 0.5)
    if open_controls:
        g += start_triangle(x + w - 12, y + 44)
        g += lab(x + w - 24, y + 60,
                 f"{open_controls} control still open" if open_controls == 1
                 else f"{open_controls} controls still open", 9, PURPLE, 0.6, "end")
    g += hr(x, y + 68, x + w, HAIR)
    return g, 68


# ─── mobile ─────────────────────────────────────────────────────────────────
def m1_today():
    """Structure from 01 Date Due; read as a description sheet."""
    b = m_head() + m_capture(50)
    b += lab(14, 97, "reference date mon 16 nov 2026", 9, INK2, 0.6)
    b += lab(346, 97, "10 on file · 2 past due", 9, INK2, 0.5, "end")
    y = 106
    for title, rows, cnt, ink, tint in (("Due this week", DUE_WEEK, 3, INK, YPALE),
                                        ("Need Attention", ATTN, 2, OLIVE, OPALE),
                                        ("High priority", HIGH[:4], 5, INK, None)):
        g, y = list_block(14, y, 332, title, rows, cnt, ink, tint)
        b += g
        y += 10
    b += legend(14, y, 332, cols=1, which="inks")
    b += hr(14, 742, 346, HAIR)
    b += m_tabs("today")
    return svg(MW, MH, b)


def m2_capture():
    """Structure from 05 Tett: stated state, nothing navigates away."""
    b = m_head() + m_capture(50, "Submit assignment in IBE160 Friday", True, False)
    b += lab(14, 97, "saved at 09:12 · field cleared", 9, INK2, 0.6)
    b += lab(346, 97, "under 100 ms", 9, INK2, 0.5, "end")
    y = 106
    b += band(14, y, 332, "Just added", "pending", PURPLE)
    y += 22
    b += rect(14, y, 2.4, 56, fill=PURPLE)
    b += start_triangle(334, y + 16)
    b += t(26, y + 20, HERO, 11, INK, UI, 500)
    pill, pw = due_pill(26, y + 28, "Fri 20 Nov", "week")
    b += pill
    b += lab(26 + pw + 8, y + 38, "parsed · applied, not proposed", 9, INK2, 0.5)
    b += lab(26, y + 52, "the description is being written · saved and still editable",
             9, PURPLE, 0.5)
    b += hr(14, y + 56, 346, HAIR)
    y += 66
    for title, rows, cnt, ink, tint in (("Due this week", DUE_WEEK[1:], 3, INK, YPALE),
                                        ("Need Attention", ATTN, 2, OLIVE, OPALE),
                                        ("High priority", HIGH[2:], 5, INK, None)):
        g, y = list_block(14, y, 332, title, rows, cnt, ink, tint)
        b += g
        y += 10
    b += band(14, y, 332, "The pending mark", None, INK)
    y += 26
    b += start_triangle(26, y + 8)
    b += t(42, y + 12, "A start triangle is the only mark that appears offline.",
           10, INK, UI, 400)
    b += lab(26, y + 28, "No spinner, no error, no banner — it reports a description being",
             9, INK2, 0.5)
    b += lab(26, y + 39, "written, never a missing network.", 9, INK2, 0.5)
    b += m_tabs("today")
    return svg(MW, MH, b)


def review_m(states, choice=None, foot=None):
    b = m_head("Review", "Rule Engine")
    open_n = sum(1 for _, _, s in states if s in ("open", "editing"))
    rec, rh = record_line(14, 50, 332, open_n)
    b += rec
    y = 50 + rh + 12
    g, y = desc_sheet_m(14, y, 332, states, choice)
    b += g
    y += 12
    b += btn(14, y, 96, "Punch all", 22, "ghost", 9.5)
    b += btn(118, y, 96, "Strike all", 22, "ghost", 9.5)
    b += lab(222, y + 14, "shortcuts · they do nothing", 9, INK2, 0.4)
    b += lab(222, y + 24, "the three rows cannot", 9, INK2, 0.4)
    y += 40
    b += hr(14, y, 346, HAIR)
    for i, (_, _, st) in enumerate(states, 1):
        b += control(24 + (i - 1) * 24, y + 16, i,
                     "punched" if st == "punched" else
                     "struck" if st == "struck" else "open", 7.5)
    done = sum(1 for _, _, s in states if s == "punched")
    gone = sum(1 for _, _, s in states if s == "struck")
    b += lab(96, y + 19, f"{done} punched · {gone} struck · {3-done-gone} open",
             9.5, INK2, 0.5)
    if foot:
        b += lab(14, y + 38, foot, 9, INK2, 0.45)
    b += lab(14, 736, "one sheet · what it is now and what is proposed sit on one line",
             9, INK2, 0.45)
    b += m_tabs("today")
    return svg(MW, MH, b)


def m3():
    return review_m([("Tags", "school", "open"), ("Priority", "high", "open"),
                     ("Summary", "Submit assignment in IBE160", "open")],
                    foot="nothing is written until you act on a row")


def m4():
    return review_m([("Tags", "school", "punched"), ("Priority", "medium", "editing"),
                     ("Summary", "Submit assignment in IBE160", "punched")],
                    choice="high",
                    foot="one wrong field costs one correction, not a rejected sheet")


def m5():
    """Structure from 01 Date Due: three states legible at once, undo in the row."""
    return review_m([("Tags", "school", "punched"), ("Priority", "high", "struck"),
                     ("Summary", "Submit assignment in IBE160", "open")],
                    foot="nothing disappears · a struck row stays on the sheet")


def m6_detail():
    """Structure from 05 Tett, set as a sheet."""
    b = m_head("Task")
    y = 50
    b += band(14, y, 332, "The task", None, INK)
    y += 26
    b += field(14, y, 332, HERO, 28)
    y += 38
    b += sheet_head(14, y, 332, [("field", 6, "start"), ("value", 110, "start"),
                                 ("description", 346, "end")], HAIR)
    y += 8
    for k, v, note in (("Due date", "Fri 20 Nov 2026", "parsed from “Friday”"),
                       ("Project", "IBE160", "assigned, not derived"),
                       ("Tags", "school", "punched 16 nov 09:14"),
                       ("Priority", "high", "punched 16 nov 09:14"),
                       ("Summary", "Submit assignment in IBE160", "punched 16 nov"),
                       ("Notes", "Hand in the PDF, not the .docx", ""),
                       ("Completed", "No", ""),
                       ("Created", "Mon 16 Nov 09:12", "")):
        b += lab(20, y + 15, k, 9.5, INK2, 0.6)
        b += t(110, y + 16, v, 10, INK, UI, 400)
        if note:
            b += lab(340, y + 15, note, 8.5, INK2, 0.45, "end")
        b += hr(14, y + 22, 346, HAIR)
        y += 25
    y += 10
    b += band(14, y, 332, "The control description", "3 of 3 punched", INK)
    y += 22
    b += sheet_head(14, y + 10, 332, [("#", 8, "start"), ("control", 26, "start"),
                                      ("value applied", 110, "start"),
                                      ("what happened", 346, "end")], HAIR)
    y += 16
    for i, (k, v) in enumerate(PARTS, 1):
        b += control(26, y + 13, i, "punched", 7.5)
        b += lab(40, y + 16, k, 9.5, INK, 0.5)
        b += t(110, y + 17, v, 9.5, INK, UI, 400)
        b += lab(340, y + 16, "punched · rule engine", 8.5, INK2, 0.45, "end")
        b += hr(14, y + 24, 346, HAIR)
        y += 27
    y += 12
    b += band(14, y, 332, "Actions", None, INK)
    y += 32
    b += btn(14, y, 104, "Complete", 26, "solid", 9.5)
    b += btn(126, y, 110, "Suggest again", 26, "ghost", 9.5)
    b += btn(244, y, 102, "Delete", 26, "ghost", 9.5)
    b += lab(14, y + 44, "suggest again writes a fresh description · it is yours to ask",
             9, INK2, 0.45)
    b += lab(14, y + 55, "for, and never runs on its own", 9, INK2, 0.45)
    b += hr(14, 730, 346, HAIR)
    b += lab(14, 744, "in these lists · due this week · high priority · school",
             9, INK2, 0.45)
    b += m_tabs("lists")
    return svg(MW, MH, b)


def m7_smartlist():
    """Structure from 05 Tett: every derived list enumerated, sheet-dense."""
    b = m_head("Lists")
    y = 50
    b += band(14, y, 332, "View", None, INK)
    y += 26
    b += select(14, y, 190, "Due date — oldest first")
    b += cbox(218, y + 6)
    b += t(236, y + 17, "Show completed", 10, INK, UI, 400)
    y += 36
    g, y = list_block(14, y, 332, "Need Attention", ATTN, 2, OLIVE, OPALE)
    b += g
    b += lab(20, y + 14, "past due and not completed · recomputed on every render",
             9, INK2, 0.5)
    y += 26
    for title, items, note in (
            ("Smart lists", (("Due this week", "3", YELLOW), ("Need Attention", "2", OLIVE),
                             ("High priority", "5", None)), "derived"),
            ("Tag lists", (("school", "3", None), ("group", "1", None),
                           ("work", "1", None), ("personal", "4", None)),
             "one per tag in use"),
            ("Other views", (("All tasks", "10", None), ("Archive", "4", MARSH),
                             ("Untagged", "1", None)), None)):
        b += band(14, y, 332, title, note, INK)
        y += 24
        for n, c, tint in items:
            if tint:
                b += rect(20, y + 5, 8, 8, fill=tint)
            b += t(36 if tint else 20, y + 13, n, 10.5, INK, UI, 400)
            b += lab(340, y + 13, c, 10, INK2, 0.5, "end")
            b += hr(14, y + 20, 346, HAIR)
            y += 23
        y += 8
    b += lab(14, 742, "a tag with no task keeps no list · nothing here is stored",
             9, INK2, 0.45)
    b += m_tabs("lists")
    return svg(MW, MH, b)


def m8_settings():
    """Structure from 01 Date Due, set as a sheet."""
    b = m_head("Settings")
    y = 50
    b += band(14, y, 332, "Suggestion engine", None, INK)
    y += 26
    b += rect(14, y, 2.4, 70, fill=INK)
    b += engine_chip(26, y + 18, "Rule Engine", 11)
    b += rect(272, y + 6, 66, 16, fill=INK)
    b += lab(305, y + 17, "serving", 9, WHITE, 0.8, "middle")
    b += t(26, y + 40, NOKEY, 11.5, INK, UI, 500)
    b += lab(26, y + 55, "Produced on this device, offline. The normal state,", 9, INK2, 0.5)
    b += lab(26, y + 66, "not a limitation.", 9, INK2, 0.5)
    b += hr(14, y + 70, 346, HAIR)
    y += 82
    b += band(14, y, 332, "API key", "optional", INK)
    y += 28
    b += field(14, y, 248, "Paste an Anthropic API Key", 28, placeholder=True)
    b += btn(270, y, 76, "Save", 28, "ghost", 9.5)
    b += lab(14, y + 42, "Stored on this device only. Never written to the repository,",
             9, INK2, 0.5)
    b += lab(14, y + 53, "and never sent anywhere but Anthropic.", 9, INK2, 0.5)
    y += 66
    b += band(14, y, 332, "Cloud Suggestions", "off", INK)
    y += 26
    b += rect(14, y, 332, 44, fill=MPALE, op=0.5)
    b += rect(14, y, 332, 44, stroke=HAIR, sw=1, dash="4 3")
    b += lab(24, y + 18, "appears once a key is saved", 10, MINK, 0.7)
    b += lab(24, y + 34, "Off until you turn it on. Saving a key never turns it on.",
             9, INK2, 0.5)
    y += 58
    b += band(14, y, 332, "Measured accuracy", "published, not claimed", INK)
    y += 24
    for k, v in (("Fixture entries", "not scored yet"),
                 ("Tags · Priority · Due date · Placement", "reported apart"),
                 ("Summary", "scored separately")):
        b += lab(20, y + 13, k, 9, INK2, 0.5)
        b += lab(340, y + 13, v, 9, INK, 0.5, "end")
        b += hr(14, y + 20, 346, HAIR)
        y += 24
    b += lab(14, y + 14, "The app publishes its own score rather than claiming the",
             9, INK2, 0.5)
    b += lab(14, y + 25, "suggestions are right.", 9, INK2, 0.5)
    y += 40
    b += band(14, y, 332, "Settings", None, INK)
    y += 24
    for k, v in (("Archive retention", "30 days"),
                 ("Task text", "English only, by decision"),
                 ("Interface language", "English — not yet decided")):
        b += lab(20, y + 13, k, 9, INK2, 0.5)
        b += t(190, y + 14, v, 9.5, INK, UI, 400)
        b += hr(14, y + 20, 346, HAIR)
        y += 24
    b += hr(14, 726, 346, HAIR)
    b += lab(14, 740, "an engine problem, if there is ever one, is shown only here —",
             9, INK2, 0.45)
    b += lab(14, 750, "never a popup, banner, toast or badge anywhere else", 9, INK2, 0.45)
    b += m_tabs("settings")
    return svg(MW, MH, b)


def m9_first_run():
    """A mix of 01 Date Due's opening and 05 Tett's enumerated structure."""
    b = m_head() + m_capture(50)
    b += lab(14, 97, "nothing on file yet", 9.5, INK2, 0.7)
    b += lab(346, 97, "0 tasks", 9, INK2, 0.5, "end")
    b += t(14, 128, "Say it the way you", 19, INK, UI, 600)
    b += t(14, 152, "would say it out loud.", 19, INK, UI, 600)
    b += t(14, 180, "The app files it at once, then writes a control", 11, INK2, UI, 400)
    b += t(14, 197, "description for it: three rows you punch, edit or strike.",
           11, INK2, UI, 400)
    y = 214
    rec, rh = record_line(14, y, 332, 3)
    b += rec
    y += rh + 10
    b += band(14, y, 332, "Control description", "rule engine", PURPLE)
    y += 22
    b += sheet_head(14, y + 10, 332, [("#", 8, "start"), ("control", 26, "start"),
                                      ("in the record", 110, "start"),
                                      ("proposed", 206, "start")], PURPLE)
    y += 16
    for i, (k, v) in enumerate(PARTS, 1):
        b += rect(14, y, 2.4, 24, fill=PURPLE)
        b += control(28, y + 12, i, "open", 7.5)
        b += lab(42, y + 15, k, 9.5, INK, 0.5)
        b += lab(110, y + 15, "none" if k != "Priority" else "medium", 9, INK2, 0.5)
        b += t(206, y + 16, v, 9.5, PURPLE, UI, 500)
        b += hr(14, y + 24, 346, HAIR)
        y += 24
    y += 14
    b += band(14, y, 332, "The three controls", None, INK)
    y += 24
    for k, d in (("Tags", "which of your four contexts this belongs to"),
                 ("Priority", "high, medium or low"),
                 ("Summary", "a short restatement of your own sentence")):
        b += t(20, y + 13, k, 10.5, INK, UI, 600)
        b += lab(20, y + 25, d, 9, INK2, 0.45)
        b += hr(14, y + 31, 346, HAIR)
        y += 35
    y += 8
    b += band(14, y, 332, "The lists build themselves", None, INK)
    y += 24
    for n, tint in (("Due this week", YELLOW), ("Need Attention", OLIVE),
                    ("High priority", None)):
        if tint:
            b += rect(20, y + 5, 8, 8, fill=tint)
        b += t(36, y + 13, n, 10.5, INK, UI, 400)
        b += lab(340, y + 13, "0", 10, INK2, 0.5, "end")
        b += hr(14, y + 20, 346, HAIR)
        y += 23
    b += lab(14, 742, "works offline · no account, no key, nothing to set up", 9, INK2, 0.45)
    b += m_tabs("today")
    return svg(MW, MH, b)


# ─── desktop ────────────────────────────────────────────────────────────────
def d_list(x, y, w, title, rows, count, ink=INK, tint=None):
    g = band(x, y, w, title, count, ink, tint)
    yy = y + 22
    g += sheet_head(x, yy + 12, w, [("task", 20, "start"), ("tag", w - 212, "start"),
                                    ("priority", w - 130, "start"),
                                    ("due", w - 20, "end")], HAIR)
    yy += 18
    for tk in rows:
        g += task_row(x, yy, tk, w)
        g += hr(x, yy + 28, x + w, HAIR)
        yy += 28
    return g, yy


def d1_today():
    """Structure from 05 Tett: everything derived, co-visible — as one sheet."""
    b = d_rail("Today") + d_head("Today", note="every list here is computed on this render")
    x0, W = RAILW + 26, DW - RAILW - 52
    b += field(x0, 70, W - 124, "Type a task the way you say it out loud", 32,
               placeholder=True)
    b += btn(x0 + W - 116, 70, 116, "Add task", 32, "solid", 11)
    cw = (W - 24) / 2
    rx = x0 + cw + 24
    y = 120
    g, yl = d_list(x0, y, cw, "Need Attention", ATTN, 2, OLIVE, OPALE)
    b += g
    b += lab(x0 + 2, yl + 16, "past due and not completed", 9, INK2, 0.5)
    g, yl = d_list(x0, yl + 28, cw, "Due this week", DUE_WEEK, 3, INK, YPALE)
    b += g
    g, yl = d_list(x0, yl + 20, cw, "All tasks", TASKS, 10, INK)
    b += g
    g, yr = d_list(rx, y, cw, "High priority", HIGH, 5, INK)
    b += g
    b += band(rx, yr + 20, cw, "Tag lists", "one per tag in use", INK)
    yy = yr + 46
    for n, c in (("school", "3"), ("group", "1"), ("work", "1"), ("personal", "4")):
        pill, _ = tag_pill(rx + 8, yy - 10, n)
        b += pill
        b += lab(rx + cw - 8, yy, c, 10, INK2, 0.5, "end")
        b += hr(rx, yy + 7, rx + cw, HAIR)
        yy += 24
    b += legend(rx, yy + 14, cw, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def review_d(states, choice=None, note=None, show_rest=True):
    b = d_rail("Today") + d_head("Review", note=note)
    x0, W = RAILW + 26, DW - RAILW - 52
    open_n = sum(1 for _, _, s in states if s in ("open", "editing"))
    rec, rh = record_line(x0, 66, W, open_n)
    b += rec
    y = 66 + rh + 14
    g, y = desc_sheet_d(x0, y, W, states, choice)
    b += g
    y += 14
    cw = (W - 24) / 2
    b += band(x0, y, cw, "In the record now", None, INK)
    yy = y + 26
    rec_rows = [("Task text", HERO, INK), ("Due date", "Fri 20 Nov 2026", INK),
                ("Tags", "school" if states[0][2] == "punched" else "none",
                 INK if states[0][2] == "punched" else INK2),
                ("Priority", states[1][1] if states[1][2] == "punched" else
                 "medium (default)", INK if states[1][2] == "punched" else INK2),
                ("Summary", states[2][1] if states[2][2] == "punched" else "none",
                 INK if states[2][2] == "punched" else INK2)]
    for k, v, tint in rec_rows:
        b += lab(x0 + 6, yy + 11, k, 9, INK2, 0.6)
        b += t(x0 + 110, yy + 12, v, 10, tint, UI, 400)
        b += hr(x0, yy + 18, x0 + cw, HAIR)
        yy += 22
    rx = x0 + cw + 24
    b += band(rx, y, cw, "Why Accept is not the easy path", None, INK)
    for i, s in enumerate(("Every row carries its own Accept, Edit and Reject.",
                           "Acting on one row never touches the other two.",
                           "Punch all and Strike all sit below the sheet, as shortcuts.",
                           "Reaching Reject costs the same click as Accept.",
                           "A task with any row open keeps its start triangle.")):
        b += t(rx + 6, y + 40 + i * 16, "— " + s, 9.5, INK2, UI, 400)
    y = max(yy, y + 130) + 16
    if show_rest:
        g, y = d_list(x0, y, W, "The rest of today", DUE_WEEK[1:] + ATTN, 5, INK)
        b += g
        y += 14
    b += legend(x0, y, W, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def d2():
    return review_d([("Tags", "school", "open"), ("Priority", "high", "open"),
                     ("Summary", "Submit assignment in IBE160", "open")],
                    note="three controls on one task · none acted on yet")


def d3():
    return review_d([("Tags", "school", "punched"), ("Priority", "medium", "editing"),
                     ("Summary", "Submit assignment in IBE160", "punched")],
                    choice="high",
                    note="one control still open — you are editing Priority",
                    show_rest=False)


def d4():
    return review_d([("Tags", "school", "punched"), ("Priority", "high", "struck"),
                     ("Summary", "Submit assignment in IBE160", "open")],
                    note="three control-states on one task · 1 punched, 1 struck, 1 open")


def d5_detail():
    """Structure from 03 Kartet: all tasks left, the sheet right."""
    b = d_rail("Today") + d_head("Task")
    x0, W = RAILW + 26, DW - RAILW - 52
    lw = 300
    b += band(x0, 60, lw, "All tasks", 10, INK)
    yy = 88
    for i, tk in enumerate(TASKS):
        sel = i == 0
        if sel:
            b += rect(x0, yy - 6, lw, 32, fill=WHITE)
            b += rect(x0, yy - 6, 2.6, 32, fill=INK)
        b += t(x0 + 10, yy + 8, tk[0], 9.5, INK, UI, 600 if sel else 400)
        if tk[1]:
            pill, _ = due_pill(x0 + lw - 10 - (8 + len(tk[1]) * 4.6), yy, tk[1], tk[2])
            b += pill
        b += hr(x0, yy + 26, x0 + lw, HAIR)
        yy += 32
    rx = x0 + lw + 28
    rw = W - lw - 28
    b += band(rx, 60, rw, "The task, field by field", None, INK)
    yy = 92
    for k, v, note in (("Task text", HERO, "never rewritten"),
                       ("Due date", "Fri 20 Nov 2026", "parsed from “Friday”"),
                       ("Project", "IBE160", "assigned, not derived"),
                       ("Notes", "Hand in the PDF, not the .docx", "")):
        b += lab(rx, yy, k, 9.5, INK2, 0.6)
        b += field(rx + 100, yy - 16, rw - 240, v, 26)
        if note:
            b += lab(rx + rw, yy, note, 9, INK2, 0.45, "end")
        yy += 36
    yy += 8
    b += band(rx, yy, rw, "The control description", "all three punched", INK)
    yy += 24
    b += sheet_head(rx, yy + 10, rw, [("#", 10, "start"), ("control", 34, "start"),
                                      ("value applied", 150, "start"),
                                      ("description", rw - 10, "end")], HAIR)
    yy += 16
    for i, (k, v) in enumerate(PARTS, 1):
        b += control(rx + 16, yy + 13, i, "punched", 8)
        b += lab(rx + 34, yy + 17, k, 9.5, INK, 0.6)
        b += t(rx + 150, yy + 18, v, 10, INK, UI, 500)
        b += lab(rx + rw - 10, yy + 17, "punched mon 16 nov 09:14 · rule engine",
                 9, INK2, 0.45, "end")
        b += hr(rx, yy + 26, rx + rw, HAIR)
        yy += 29
    b += lab(rx, yy + 16, "the sheet is complete · no row is open on this task",
             9.5, INK2, 0.5)
    yy += 32
    b += cbox(rx, yy)
    b += t(rx + 20, yy + 11, "Not completed", 11, INK, UI, 400)
    yy += 32
    b += btn(rx, yy, 116, "Complete", 26, "solid", 10)
    b += btn(rx + 126, yy, 126, "Suggest again", 26, "ghost", 10)
    b += btn(rx + 262, yy, 110, "Delete", 26, "ghost", 10)
    b += lab(rx, yy + 44, "Suggest again writes a fresh description. It is yours to ask "
             "for and never runs on its own.", 9, INK2, 0.45)
    b += lab(rx, yy + 56, "Completing keeps every punched row; the task moves to the "
             "archive after thirty days.", 9, INK2, 0.45)
    b += legend(rx, yy + 76, rw, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def d6_archive():
    """Structure from 03 Kartet: the archive sheet in marsh ink."""
    b = d_rail("Archive") + d_head("Archive", note="completed, kept, not deleted")
    x0, W = RAILW + 26, DW - RAILW - 52
    b += band(x0, 68, W, "Archived", 4, MINK, MPALE)
    yy = 100
    b += sheet_head(x0, yy, W, [("task", 20, "start"), ("tag", 470, "start"),
                                ("priority", 580, "start"), ("completed", 720, "start"),
                                ("archived", 850, "start"), ("restore", W - 10, "end")],
                    HAIR)
    yy += 12
    arch = [("Clean the kitchen eventually", "personal", "low", "Sat 10 Oct", "Mon 09 Nov"),
            ("Call the doctor", "personal", "medium", "Fri 02 Oct", "Sun 01 Nov"),
            ("Figure out the thing", "", "medium", "Wed 30 Sep", "Fri 30 Oct"),
            ("Buy birthday present next week", "personal", "medium", "Mon 28 Sep",
             "Wed 28 Oct")]
    for n, tg, p, c, a in arch:
        b += cbox(x0 + 2, yy + 5, True, 11)
        b += t(x0 + 20, yy + 15, n, 10, INK2, UI, 400, deco="line-through")
        if tg:
            pill, _ = tag_pill(x0 + 470, yy + 4, tg)
            b += pill
        else:
            b += lab(x0 + 470, yy + 15, "no tag", 9, INK2, 0.5)
        b += prio(x0 + 580, yy + 5, p)
        b += lab(x0 + 600, yy + 15, p, 9, INK2, 0.5)
        b += t(x0 + 720, yy + 15, c, 9.5, INK2, UI, 400)
        b += t(x0 + 850, yy + 15, a, 9.5, MINK, UI, 500)
        b += btn(x0 + W - 88, yy + 2, 88, "Restore", 21, "ghost", 9.5)
        b += hr(x0, yy + 26, x0 + W, HAIR)
        yy += 29
    yy += 20
    cw = (W - 24) / 2
    b += band(x0, yy, cw, "Retention", None, INK)
    b += lab(x0 + 6, yy + 40, "archive completed tasks after", 9.5, INK2, 0.6)
    b += select(x0 + 6, yy + 50, 140, "30 days")
    b += lab(x0 + 6, yy + 92, "Changing this re-evaluates every completed task against "
             "the new value.", 9, INK2, 0.45)
    b += lab(x0 + 6, yy + 104, "The same control is in Settings; the number never lives "
             "in two places.", 9, INK2, 0.45)
    rx = x0 + cw + 24
    b += band(rx, yy, cw, "Not a wastebasket", None, MINK, MPALE)
    for i, s in enumerate(("An archived task keeps its whole control description.",
                           "Restore puts it back with every row, into the lists it "
                           "still qualifies for.",
                           "Nothing here has been deleted.",
                           "Deleting is a separate, explicit act on the task itself.")):
        b += t(rx + 6, yy + 44 + i * 16, "— " + s, 9.5, INK2, UI, 400)
    b += legend(x0, yy + 128, W, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def settings_d(failure=False):
    """Structure from 05 Tett, set as sheets."""
    b = d_rail("Settings") + d_head("Settings",
                                    note="one device · no account · nothing leaves "
                                    "without consent")
    x0, W = RAILW + 26, DW - RAILW - 52
    cw = (W - 24) / 2
    rx = x0 + cw + 24
    y = 66
    b += band(x0, y, cw, "API key", "saved on this device" if failure else "optional", INK)
    if failure:
        b += field(x0 + 6, y + 32, cw - 118, "sk-ant-api03-••••••••••••••••7Q4F", 28)
        b += btn(x0 + cw - 102, y + 32, 96, "Replace", 28, "ghost", 9.5)
    else:
        b += field(x0 + 6, y + 32, cw - 118, "Paste an Anthropic API Key", 28,
                   placeholder=True)
        b += btn(x0 + cw - 102, y + 32, 96, "Save", 28, "ghost", 9.5)
    b += lab(x0 + 6, y + 76, "Stored in this browser only. Never committed to the "
             "repository, and never", 9, INK2, 0.5)
    b += lab(x0 + 6, y + 88, "sent anywhere until Cloud Suggestions is on.", 9, INK2, 0.5)
    b += band(rx, y, cw, "Cloud Suggestions", "on" if failure else "off", INK)
    b += toggle(rx + 6, y + 34, failure)
    b += t(rx + 52, y + 47, "Use Cloud Suggestions", 11, INK, UI, 500)
    if failure:
        b += lab(rx + 52, y + 62, "Still on. It is the organization that refuses, "
                 "not the switch.", 9, INK2, 0.5)
        b += lab(rx + 6, y + 82, "Turning it off stops every outbound call immediately.",
                 9, INK2, 0.5)
    else:
        b += lab(rx + 52, y + 62, "Off on first run, even when a key is already saved.",
                 9, INK2, 0.5)
        for i, s in enumerate(DISCLOSE):
            b += t(rx + 6, y + 80 + i * 14, "— " + s, 9, INK2, UI, 400)
    y += 128
    b += band(x0, y, W, "Suggestion engine", None, INK)
    if failure:
        b += rect(x0, y + 22, 2.4, 96, fill=MINK)
        b += engine_chip(x0 + 12, y + 44, "Model Engine", 11, MINK)
        b += rect(x0 + W - 150, y + 30, 142, 18, fill=MPALE)
        b += lab(x0 + W - 79, y + 43, "not being used", 9, MINK, 0.7, "middle")
        b += t(x0 + 12, y + 68, ORG_FAIL, 12.5, INK, UI, 500)
        b += lab(x0 + 12, y + 84, ORG_SUB[:78], 9.5, INK2, 0.5)
        b += lab(x0 + 12, y + 96, ORG_SUB[78:], 9.5, INK2, 0.5)
        b += hr(x0 + 12, y + 104, x0 + W - 12, HAIR)
        b += engine_chip(x0 + 12, y + 122, "Rule Engine")
        b += t(x0 + 104, y + 122, "is serving suggestions normally.", 10.5, INK, UI, 400)
        y += 142
        b += band(x0, y, cw, "The other two reasons this line can give", "one at a time", INK)
        yy = y + 30
        for head, sub in OTHER_FAILS:
            b += t(x0 + 6, yy + 12, head, 10.5, INK2, UI, 500)
            b += lab(x0 + 6, yy + 25, sub, 9, INK2, 0.45)
            b += hr(x0, yy + 32, x0 + cw, HAIR)
            yy += 38
        b += band(rx, y, cw, "Where this is visible", None, INK)
        for i, s in enumerate(("This page is the only place an engine problem is shown.",
                               "No popup, banner, toast or badge in capture or review.",
                               "Every suggestion still arrives, served by the Rule Engine.",
                               "It clears on its own when the cause does.")):
            b += t(rx + 6, y + 42 + i * 16, "— " + s, 9.5, INK2, UI, 400)
        y += 120
    else:
        b += engine_chip(x0 + 12, y + 44, "Rule Engine", 11)
        b += rect(x0 + W - 88, y + 30, 80, 18, fill=INK)
        b += lab(x0 + W - 48, y + 43, "serving", 9, WHITE, 0.7, "middle")
        b += t(x0 + 12, y + 68, NOKEY, 12.5, INK, UI, 500)
        b += lab(x0 + 12, y + 86, NOKEY_SUB, 9.5, INK2, 0.5)
        y += 106
        b += band(x0, y, cw, "Measured accuracy", "published, not claimed", INK)
        yy = y + 38
        for k, v in (("Fixture entries", "not scored yet"),
                     ("Tags · Priority · Due date · Placement", "reported apart"),
                     ("Summary", "scored separately")):
            b += lab(x0 + 6, yy, k, 9.5, INK2, 0.5)
            b += lab(x0 + cw - 6, yy, v, 9.5, INK, 0.5, "end")
            b += hr(x0, yy + 6, x0 + cw, HAIR)
            yy += 22
        b += lab(x0 + 6, yy + 12, "The app publishes its own score rather than claiming "
                 "the suggestions are right.", 9, INK2, 0.45)
        b += band(rx, y, cw, "The two engines", None, INK)
        yy = y + 32
        b += sheet_head(rx, yy, cw, [("engine", 6, "start"), ("where it runs", 112, "start"),
                                     ("needs", 232, "start"),
                                     ("right now", cw - 6, "end")], HAIR)
        yy += 18
        for n, w_, nd, rn in (("Rule Engine", "this device", "nothing", "serving"),
                              ("Model Engine", "the Anthropic API", "your own key",
                               "not in use")):
            b += t(rx + 6, yy, n, 10, INK, UI, 500)
            b += t(rx + 112, yy, w_, 9.5, INK2, UI, 400)
            b += t(rx + 232, yy, nd, 9.5, INK2, UI, 400)
            b += lab(rx + cw - 6, yy, rn, 9.5, INK if rn == "serving" else MINK, 0.5, "end")
            b += hr(rx, yy + 6, rx + cw, HAIR)
            yy += 22
        y += 120
    b += band(x0, y, W, "Settings", None, INK)
    yy = y + 38
    for k, v, note in (("Archive retention", "30 days",
                        "how long a completed task stays in its lists"),
                       ("Task text", "English only, by decision",
                        "the keyword tables and date words are English"),
                       ("Interface language", "English — not yet decided",
                        "an open question, not a settled one")):
        b += lab(x0 + 6, yy, k, 9.5, INK2, 0.6)
        b += t(x0 + 190, yy, v, 10, INK, UI, 400)
        b += lab(x0 + W - 6, yy, note, 9, INK2, 0.45, "end")
        b += hr(x0, yy + 6, x0 + W, HAIR)
        yy += 24
    return svg(DW, DH, b, GROUND)


FRAMES = {
    "m1-today": m1_today, "m2-capture-pending": m2_capture,
    "m3-review-proposed": m3, "m4-review-editing": m4,
    "m5-review-partial-undo": m5, "m6-task-detail": m6_detail,
    "m7-smartlist": m7_smartlist, "m8-settings-no-key": m8_settings,
    "m9-first-run": m9_first_run,
    "d1-today": d1_today, "d2-review-proposed": d2, "d3-review-editing": d3,
    "d4-review-partial-undo": d4, "d5-task-detail": d5_detail, "d6-archive": d6_archive,
    "d7-settings-cloud-off": lambda: settings_d(False),
    "d8-settings-failure": lambda: settings_d(True),
}

if __name__ == "__main__":
    for name, fn in FRAMES.items():
        (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
    print(f"07-beskrivelse: {len(FRAMES)} frames")
