#!/usr/bin/env python3
"""Round 2, concept 06 — "Kurs".

Kartet's world (pinned by the user in decisions.md) governs every borrowed frame.
The imports keep their skeleton but lose their own state vocabulary: Date Due's dated
stamp becomes a punched control carrying its date, Tett's module rows carry control
numerals. One mechanic owns the page — you punch controls, everywhere, at both widths.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from world import *  # noqa: F403,F401

OUT = Path(__file__).resolve().parent


# ─── the record and the course panel ────────────────────────────────────────
def record(x, y, w, rows, h=None, note="your sentence, unchanged"):
    """The terrain: the user's own sentence and what is in the record right now."""
    h = h or (34 + len(rows) * 15)
    g = rect(x, y, w, h, fill=WHITE) + rect(x, y, w, h, stroke=HAIR2, sw=1.2)
    g += t(x + 11, y + 21, HERO, 12, INK, UI, 500)
    g += lab(x + w - 11, y + 21, note, 9, INK2, 0.5, "end")
    g += hr(x + 11, y + 28, x + w - 11, HAIR)
    for i, (k, v, tint) in enumerate(rows):
        yy = y + 42 + i * 15
        g += lab(x + 11, yy, k, 9, INK2, 0.7)
        g += t(x + 78, yy, v, 10, tint, UI, 500 if tint == INK else 400)
    return g, h


def panel_m(x, y, w, states, choice=None):
    """The course layer, mobile: three numbered controls stacked, purple-ruled."""
    heights = {"open": 78, "punched": 50, "struck": 44, "editing": 90}
    h = 30 + sum(heights[s] for _, _, s in states) + 10
    g = rect(x, y, w, h, fill=PWASH, op=0.55)
    g += rect(x, y, w, h, stroke=PURPLE, sw=1.4)
    g += lab(x + 10, y + 19, "the course", 10, PURPLE, 1.0)
    open_n = sum(1 for _, _, s in states if s in ("open", "editing"))
    g += lab(x + w - 10, y + 19,
             f"{open_n} of 3 still open" if open_n else "all three punched",
             9, PURPLE, 0.6, "end")
    g += hr(x + 10, y + 25, x + w - 10, PURPLE, 0.8)
    yy = y + 30
    prev = None
    for i, (name, value, st) in enumerate(states, 1):
        bh = heights[st]
        cx, cy = x + 26, yy + 17
        if prev is not None:
            g += vr(cx, prev, cy - 11, PURPLE, 1.2)
        prev = cy + 11
        g += control(cx, cy, i, "punched" if st == "punched" else
                     "struck" if st == "struck" else "open")
        tx = x + 46
        g += lab(tx, yy + 13, name, 9.5, INK, 0.8)
        g += engine_chip(x + w - 92, yy + 13, "Rule Engine")
        if st == "struck":
            g += t(tx, yy + 29, value, 11, INK2, UI, 400, deco="line-through")
            g += lab(tx, yy + 38, "struck · the record is unchanged", 9, INK2, 0.4)
        elif st == "punched":
            g += t(tx, yy + 29, value, 11, INK, UI, 600)
            g += lab(tx + 8 + len(value) * 5.4, yy + 29, "punched 16 nov", 9, INK2, 0.5)
            g += btn(x + w - 62, yy + 20, 52, "Undo", 18, "ghost", 9)
            g += lab(tx, yy + 39, "one step back · restores the previous value",
                     9, INK2, 0.4)
        elif st == "editing":
            g += lab(tx, yy + 28, "your value, not the proposal", 9, INK2, 0.5)
            bw = (w - 56 - 8) / 3
            for j, opt in enumerate(("low", "medium", "high")):
                sel = opt == choice
                bx = tx + j * (bw + 4)
                g += rect(bx, yy + 33, bw, 20, fill=INK if sel else WHITE)
                g += rect(bx, yy + 33, bw, 20, stroke=INK if sel else INK2, sw=1)
                g += lab(bx + bw / 2, yy + 47, opt, 9.5, WHITE if sel else INK, 0.6, "middle")
            g += btn(tx, yy + 58, 54, "Apply", 19, "solid", 9)
            g += btn(tx + 60, yy + 58, 54, "Cancel", 19, "ghost", 9)
            g += lab(tx + 122, yy + 71, "punches your value", 9, INK2, 0.4)
        else:
            g += t(tx, yy + 29, value, 11, PURPLE, UI, 500)
            bw = (w - 56 - 12) / 3
            for j, s in enumerate(("Accept", "Edit", "Reject")):
                g += btn(tx + j * (bw + 6), yy + 36, bw, s, 20,
                         "purple" if j == 0 else "ghost", 9)
            g += lab(tx, yy + 70, "this control only · the other two stay as they are",
                     9, INK2, 0.4)
        yy += bh
    return g, h


def shortcuts(x, y, w=332, size=22):
    g = btn(x, y, 96, "Punch all", size, "ghost", 9.5)
    g += btn(x + 104, y, 96, "Strike all", size, "ghost", 9.5)
    g += lab(x + 208, y + 14, "shortcuts · they do nothing", 9, INK2, 0.4)
    g += lab(x + 208, y + 24, "the three controls cannot", 9, INK2, 0.4)
    return g


def status_row(x, y, w, states):
    g = ""
    for i, (_, _, st) in enumerate(states, 1):
        g += control(x + 10 + (i - 1) * 24, y, i,
                     "punched" if st == "punched" else
                     "struck" if st == "struck" else "open", 7.5)
    done = sum(1 for _, _, s in states if s == "punched")
    gone = sum(1 for _, _, s in states if s == "struck")
    txt = f"{done} punched · {gone} struck · {3 - done - gone} open"
    g += lab(x + 10 + 3 * 24 + 6, y + 3.5, txt, 9.5, INK2, 0.5)
    return g


# ─── mobile ─────────────────────────────────────────────────────────────────
def m1_today():
    """Structure from 01 Date Due; Kartet's inks and punch legend."""
    b = m_head() + m_capture(50)
    b += lab(14, 97, "reference date mon 16 nov 2026", 9, INK2, 0.6)
    b += lab(346, 97, "10 on file", 9, INK2, 0.5, "end")
    y = 106
    for title, rows, tint, ink in (("Due this week", DUE_WEEK, YPALE, INK),
                                   ("Need Attention", ATTN, OPALE, OLIVE),
                                   ("High priority", HIGH[:3], None, INK)):
        b += band(14, y, 332, title, len(rows) if title != "High priority" else 5,
                  ink, tint)
        y += 22
        for tk in rows:
            b += m_row(14, y, tk)
            b += hr(14, y + 46, 346, HAIR)
            y += 46
        y += 10
    b += lab(14, y, "Submit lab report in IBE160 — 1 more", 9, INK2, 0.5)
    b += legend(14, y + 14, 332, cols=1, which="inks", title="What the inks mean")
    b += hr(14, 742, 346, HAIR)
    b += m_tabs("today")
    return svg(MW, MH, b)


def m2_capture():
    """Structure from 05 Tett: modules, stated state, nothing navigates away."""
    b = m_head() + m_capture(50, "Submit assignment in IBE160 Friday", True, False)
    b += lab(14, 97, "saved at 09:12 · field cleared", 9, INK2, 0.6)
    b += lab(346, 97, "under 100 ms", 9, INK2, 0.5, "end")
    y = 106
    b += band(14, y, 332, "Just added", None, INK)
    y += 22
    b += rect(14, y, 332, 76, fill=WHITE) + rect(14, y, 332, 76, stroke=HAIR2, sw=1.2)
    b += start_triangle(330, y + 16)
    b += t(26, y + 22, HERO, 11, INK, UI, 500)
    pill, pw = due_pill(26, y + 32, "Fri 20 Nov", "week")
    b += pill
    b += lab(26 + pw + 8, y + 42, "parsed from “Friday” · applied, not proposed", 9, INK2, 0.5)
    b += hr(26, y + 52, 334, HAIR)
    b += lab(26, y + 66, "a course is being set · the task is saved and still editable",
             9.5, PURPLE, 0.5)
    y += 90
    for title, rows, tint, ink, cnt in (("Due this week", DUE_WEEK[1:], YPALE, INK, 3),
                                        ("Need Attention", ATTN, OPALE, OLIVE, 2),
                                        ("High priority", HIGH[3:4], None, INK, 5)):
        b += band(14, y, 332, title, cnt, ink, tint)
        y += 22
        for tk in rows:
            b += m_row(14, y, tk)
            b += hr(14, y + 46, 346, HAIR)
            y += 46
        y += 8
    b += band(14, y, 332, "The pending mark", None, PURPLE)
    y += 22
    b += start_triangle(26, y + 10)
    b += t(42, y + 14, "A start triangle is the only mark that appears offline.",
           10, INK, UI, 400)
    b += lab(26, y + 30, "No spinner, no error, no banner. It reports a course being set,",
             9, INK2, 0.5)
    b += lab(26, y + 41, "never a missing network.", 9, INK2, 0.5)
    b += m_tabs("today")
    return svg(MW, MH, b)


def review_m(states, choice=None, note=None):
    """Structure from 03 Kartet — the user picked this for m3 and m4."""
    b = m_head("Review", "Rule Engine")
    rows = [("Due", "Fri 20 Nov", INK),
            ("Tags", "none yet" if states[0][2] != "punched" else "school",
             INK2 if states[0][2] != "punched" else INK),
            ("Priority", "medium" if states[1][2] != "punched" else states[1][1],
             INK2 if states[1][2] != "punched" else INK),
            ("Summary", "none yet" if states[2][2] != "punched" else states[2][1],
             INK2 if states[2][2] != "punched" else INK)]
    rec, rh = record(14, 52, 332, rows)
    b += rec
    y = 52 + rh + 12
    pan, ph = panel_m(14, y, 332, states, choice)
    b += pan
    y += ph + 12
    b += shortcuts(14, y)
    y += 34
    b += hr(14, y, 346, HAIR)
    b += status_row(14, y + 16, 332, states)
    if note:
        b += lab(14, y + 36, note, 9, INK2, 0.5)
    b += lab(14, 736, "the course layer never edits the terrain · your sentence is untouched",
             9, INK2, 0.45)
    b += m_tabs("today")
    return svg(MW, MH, b)


def m3():
    return review_m([("Tags", "school", "open"), ("Priority", "high", "open"),
                     ("Summary", "Submit assignment in IBE160", "open")],
                    note="nothing is written until you punch a control")


def m4():
    return review_m([("Tags", "school", "punched"), ("Priority", "medium", "editing"),
                     ("Summary", "Submit assignment in IBE160", "punched")],
                    choice="high",
                    note="one wrong field costs one correction, not a rejected course")


def m5():
    """Structure from 01 Date Due: three part blocks, each with its own state + undo."""
    b = m_head("Review", "Rule Engine")
    states = [("Tags", "school", "punched"), ("Priority", "high", "struck"),
              ("Summary", "Submit assignment in IBE160", "open")]
    rows = [("Due", "Fri 20 Nov", INK), ("Tags", "school", INK),
            ("Priority", "medium", INK2), ("Summary", "none yet", INK2)]
    rec, rh = record(14, 52, 332, rows)
    b += rec
    y = 52 + rh + 12
    b += lab(14, y + 10, "three control-states on one task", 10, PURPLE, 0.9)
    b += lab(346, y + 10, "1 punched · 1 struck · 1 open", 9, INK2, 0.5, "end")
    y += 18
    heights = {"punched": 68, "struck": 58, "open": 84}
    for i, (name, value, st) in enumerate(states, 1):
        h = heights[st]
        b += rect(14, y, 332, h, fill=WHITE)
        b += rect(14, y, 332, h, stroke=PURPLE if st == "open" else HAIR2,
                  sw=1.4 if st == "open" else 1)
        b += control(36, y + 22, i, st if st != "open" else "open")
        b += lab(58, y + 18, name, 9.5, INK, 0.8)
        b += engine_chip(254, y + 18, "Rule Engine")
        if st == "punched":
            b += t(58, y + 38, value, 11.5, INK, UI, 600)
            b += lab(58 + len(value) * 6 + 8, y + 38, "punched 16 nov", 9, INK2, 0.5)
            b += btn(58, y + 46, 58, "Undo", 18, "ghost", 9)
            b += lab(124, y + 59, "one step back · restores the previous value",
                     9, INK2, 0.4)
        elif st == "struck":
            b += t(58, y + 38, value, 11.5, INK2, UI, 400, deco="line-through")
            b += lab(58, y + 50, "struck · the field is unchanged and this control",
                     9, INK2, 0.4)
            b += lab(58, y + 60, "is not proposed again for this task", 9, INK2, 0.4)
        else:
            b += t(58, y + 38, value, 11.5, PURPLE, UI, 500)
            bw = (332 - 44 - 12 - 12) / 3
            for j, s in enumerate(("Accept", "Edit", "Reject")):
                b += btn(58 + j * (bw + 6), y + 46, bw, s, 20,
                         "purple" if j == 0 else "ghost", 9)
            b += lab(58, y + 78, "this control only · the other two stay as they are",
                     9, INK2, 0.4)
        y += h + 8
    b += shortcuts(14, y + 4)
    b += hr(14, 714, 346, HAIR)
    b += lab(14, 728, "nothing disappears · a struck control stays legible on the task",
             9, INK2, 0.45)
    b += m_tabs("today")
    return svg(MW, MH, b)


def m6_detail():
    """Structure from 05 Tett: label/value rows, then the control history table."""
    b = m_head("Task")
    y = 52
    b += band(14, y, 332, "The task", None, INK)
    y += 22
    b += rect(14, y, 332, 32, fill=WHITE) + rect(14, y, 332, 32, stroke=HAIR, sw=1)
    b += t(24, y + 20, HERO, 11, INK, UI, 500)
    y += 36
    fields = [("Due date", "Fri 20 Nov 2026", "parsed from “Friday”"),
              ("Project", "IBE160", ""), ("Tags", "school", "punched 16 nov"),
              ("Priority", "high", "punched 16 nov"),
              ("Summary", "Submit assignment in IBE160", "punched 16 nov"),
              ("Notes", "Hand in the PDF, not the .docx", ""),
              ("Completed", "No", ""), ("Created", "Mon 16 Nov 09:12", "")]
    for k, v, note in fields:
        b += lab(20, y + 11, k, 9.5, INK2, 0.7)
        b += t(110, y + 12, v, 10, INK, UI, 400)
        if note:
            b += lab(340, y + 11, note, 9, INK2, 0.45, "end")
        b += hr(14, y + 18, 346, HAIR)
        y += 24
    y += 8
    b += band(14, y, 332, "The course on this task", "3 of 3", PURPLE)
    y += 22
    b += lab(22, y + 10, "control", 9, INK2, 0.7)
    b += lab(110, y + 10, "value applied", 9, INK2, 0.7)
    b += lab(340, y + 10, "what happened", 9, INK2, 0.7, "end")
    b += hr(14, y + 15, 346, HAIR)
    y += 19
    for i, (k, v) in enumerate(PARTS, 1):
        b += control(26, y + 11, i, "punched", 7.5)
        b += lab(42, y + 14, k, 9.5, INK, 0.5)
        b += t(110, y + 15, v, 10, INK, UI, 400)
        b += lab(340, y + 14, "punched · rule engine", 9, INK2, 0.45, "end")
        b += hr(14, y + 21, 346, HAIR)
        y += 25
    y += 10
    b += band(14, y, 332, "Actions", None, INK)
    y += 30
    b += btn(14, y, 104, "Complete", 26, "solid", 9.5)
    b += btn(126, y, 108, "Suggest again", 26, "ghost", 9.5)
    b += btn(242, y, 104, "Delete", 26, "ghost", 9.5)
    b += lab(14, y + 42, "suggest again sets a fresh course · it is yours to ask for,",
             9, INK2, 0.45)
    b += lab(14, y + 53, "and never runs on its own", 9, INK2, 0.45)
    b += hr(14, 728, 346, HAIR)
    b += lab(14, 742, "in these lists · due this week · high priority · school",
             9, INK2, 0.45)
    b += m_tabs("lists")
    return svg(MW, MH, b)


def m7_smartlist():
    """Structure from 05 Tett: view controls, the list, then every derived list."""
    b = m_head("Lists")
    y = 52
    b += band(14, y, 332, "View", None, INK)
    y += 26
    b += select(14, y, 196, "Due date — oldest first")
    b += cbox(224, y + 6)
    b += t(242, y + 17, "Show completed", 10, INK, UI, 400)
    y += 36
    b += band(14, y, 332, "Need Attention", 2, OLIVE, OPALE)
    y += 22
    for tk in ATTN:
        b += m_row(14, y, tk)
        b += hr(14, y + 46, 346, HAIR)
        y += 46
    b += lab(22, y + 14, "past due and not completed · recomputed on every render",
             9, INK2, 0.5)
    y += 28
    b += band(14, y, 332, "Smart lists", "derived", INK)
    y += 22
    for n, c, tint in (("Due this week", "3", YELLOW), ("Need Attention", "2", OLIVE),
                       ("High priority", "5", None)):
        if tint:
            b += rect(20, y + 7, 8, 8, fill=tint)
        b += t(36, y + 15, n, 10.5, INK, UI, 400)
        b += lab(340, y + 15, c, 10, INK2, 0.5, "end")
        b += hr(14, y + 22, 346, HAIR)
        y += 26
    y += 8
    b += band(14, y, 332, "Tag lists", "one per tag in use", INK)
    y += 22
    for n, c in (("school", "3"), ("group", "1"), ("work", "1"), ("personal", "4")):
        pill, _ = tag_pill(20, y + 4, n)
        b += pill
        b += lab(340, y + 15, c, 10, INK2, 0.5, "end")
        b += hr(14, y + 22, 346, HAIR)
        y += 26
    y += 8
    b += band(14, y, 332, "Other views", None, INK)
    y += 22
    for n, c, tint in (("All tasks", "10", None), ("Archive", "4", MARSH),
                       ("Untagged", "1", None)):
        if tint:
            b += rect(20, y + 7, 8, 8, fill=tint)
        b += t(36 if tint else 20, y + 15, n, 10.5, INK, UI, 400)
        b += lab(340, y + 15, c, 10, INK2, 0.5, "end")
        b += hr(14, y + 22, 346, HAIR)
        y += 26
    b += lab(14, 742, "a tag with no task keeps no list · nothing here is stored",
             9, INK2, 0.45)
    b += m_tabs("lists")
    return svg(MW, MH, b)


def m8_settings():
    """Structure from 01 Date Due: engine panel, key, consent slot, accuracy, archive."""
    b = m_head("Settings")
    y = 52
    b += band(14, y, 332, "Suggestion engine", None, INK)
    y += 22
    b += rect(14, y, 332, 82, fill=WHITE) + rect(14, y, 332, 82, stroke=HAIR2, sw=1.2)
    b += engine_chip(26, y + 22, "Rule Engine", 11)
    b += rect(268, y + 10, 66, 16, fill=INK)
    b += lab(301, y + 21, "serving", 9, WHITE, 0.8, "middle")
    b += t(26, y + 44, NOKEY, 11.5, INK, UI, 500)
    b += lab(26, y + 59, "Every suggestion is produced by the Rule Engine, on this device,",
             9, INK2, 0.5)
    b += lab(26, y + 70, "offline. This is the normal state, not a limitation.", 9, INK2, 0.5)
    y += 94
    b += band(14, y, 332, "API key", "optional", INK)
    y += 28
    b += field(14, y, 250, "Paste an Anthropic API Key", 28, placeholder=True)
    b += btn(272, y, 74, "Save", 28, "ghost", 9.5)
    b += lab(14, y + 42, "Stored on this device only. Never written to the repository,",
             9, INK2, 0.5)
    b += lab(14, y + 53, "and never sent anywhere but Anthropic.", 9, INK2, 0.5)
    y += 68
    b += band(14, y, 332, "Cloud Suggestions", "off", INK)
    y += 26
    b += rect(14, y, 332, 48, fill=MPALE, op=0.5)
    b += rect(14, y, 332, 48, stroke=HAIR, sw=1, dash="4 3")
    b += lab(26, y + 20, "appears once a key is saved", 10, MINK, 0.7)
    b += lab(26, y + 36, "Off until you turn it on. Saving a key never turns it on.",
             9, INK2, 0.5)
    y += 62
    b += band(14, y, 332, "Measured accuracy", None, INK)
    y += 22
    for k, v in (("Fixture entries", "not scored yet"),
                 ("Tags · Priority · Due date · Placement", "reported apart"),
                 ("Summary", "scored separately")):
        b += lab(20, y + 12, k, 9, INK2, 0.5)
        b += lab(340, y + 12, v, 9, INK, 0.5, "end")
        b += hr(14, y + 18, 346, HAIR)
        y += 23
    b += lab(14, y + 14, "The app publishes its own score. It does not claim the",
             9, INK2, 0.5)
    b += lab(14, y + 25, "suggestions are right.", 9, INK2, 0.5)
    y += 40
    b += band(14, y, 332, "Archive", None, INK)
    y += 30
    b += lab(14, y + 16, "archive completed tasks after", 9.5, INK2, 0.6)
    b += select(214, y, 132, "30 days")
    b += hr(14, 726, 346, HAIR)
    b += lab(14, 740, "an engine problem, if there is ever one, is shown only here —",
             9, INK2, 0.45)
    b += lab(14, 750, "never a popup, banner, toast or badge anywhere else", 9, INK2, 0.45)
    b += m_tabs("settings")
    return svg(MW, MH, b)


def m9_first_run():
    """A mix of 01 Date Due's opening statement and 05 Tett's stated structure."""
    b = m_head() + m_capture(50)
    b += lab(14, 97, "nothing on file yet", 9.5, INK2, 0.7)
    b += lab(346, 97, "0 tasks", 9, INK2, 0.5, "end")
    b += t(14, 128, "Say it the way you", 19, INK, UI, 600)
    b += t(14, 152, "would say it out loud.", 19, INK, UI, 600)
    b += t(14, 180, "The app files it at once, then sets a course over it:", 11, INK2, UI, 400)
    b += t(14, 197, "three controls for you to punch, change or strike.", 11, INK2, UI, 400)
    y = 216
    rec, rh = record(14, y, 332,
                     [("Due", "Fri 20 Nov", INK), ("Tags", "none yet", INK2),
                      ("Priority", "medium", INK2), ("Summary", "none yet", INK2)])
    b += rec
    y += rh + 10
    b += rect(14, y, 332, 88, fill=PWASH, op=0.55)
    b += rect(14, y, 332, 88, stroke=PURPLE, sw=1.4)
    b += lab(24, y + 18, "the course", 10, PURPLE, 1.0)
    b += lab(336, y + 18, "3 open", 9, PURPLE, 0.6, "end")
    for i, (k, v) in enumerate(PARTS, 1):
        yy = y + 32 + (i - 1) * 18
        b += control(36, yy + 4, i, "open", 7.5)
        b += lab(52, yy + 7, k, 9.5, INK, 0.6)
        b += t(116, yy + 8, v, 10, PURPLE, UI, 400)
    y += 100
    b += band(14, y, 332, "The three controls", None, INK)
    y += 22
    for k, d in (("Tags", "which of your four contexts this belongs to"),
                 ("Priority", "high, medium or low"),
                 ("Summary", "a short restatement of your own sentence")):
        b += t(20, y + 13, k, 10.5, INK, UI, 600)
        b += lab(20, y + 26, d, 9, INK2, 0.45)
        b += hr(14, y + 33, 346, HAIR)
        y += 38
    y += 6
    b += band(14, y, 332, "The lists build themselves", None, INK)
    y += 22
    for n, tint in (("Due this week", YELLOW), ("Need Attention", OLIVE),
                    ("High priority", None)):
        if tint:
            b += rect(20, y + 7, 8, 8, fill=tint)
        b += t(36, y + 15, n, 10.5, INK, UI, 400)
        b += lab(340, y + 15, "0", 10, INK2, 0.5, "end")
        b += hr(14, y + 22, 346, HAIR)
        y += 26
    b += lab(14, 742, "works offline · no account, no key, nothing to set up", 9, INK2, 0.45)
    b += m_tabs("today")
    return svg(MW, MH, b)


# ─── desktop ────────────────────────────────────────────────────────────────
def module(x, y, w, h, title, count=None, ink=INK, tint=None):
    g = rect(x, y, w, h, fill=WHITE) + rect(x, y, w, h, stroke=HAIR, sw=1)
    g += band(x, y, w, title, count, ink, tint or CHROME, 20)
    return g


def d_table_rows(x, y, w, rows, cols):
    g = ""
    for i, c in enumerate(cols):
        g += lab(x + c[1], y, c[0], 9, INK2, 0.7, c[2] if len(c) > 2 else "start")
    g += hr(x, y + 6, x + w, HAIR)
    yy = y + 10
    for r in rows:
        g += r(yy)
        g += hr(x, yy + 22, x + w, HAIR)
        yy += 26
    return g, yy


def d1_today():
    """Structure from 05 Tett: the mosaic — everything derived, co-visible."""
    b = d_rail("Today") + d_head("Today", note="every list here is computed on this render")
    x0, W = RAILW + 26, DW - RAILW - 52
    b += field(x0, 72, W - 124, "Type a task the way you say it out loud", 32,
               placeholder=True)
    b += btn(x0 + W - 116, 72, 116, "Add task", 32, "solid", 11)
    y = 122
    cw = (W - 24) / 2
    rx = x0 + cw + 24

    # left column — the two windows that need acting on, then everything on file
    b += module(x0, y, cw, 136, "Need Attention", 2, OLIVE, OPALE)
    yy = y + 26
    for tk in ATTN:
        b += m_row(x0, yy, tk, cw)
        b += hr(x0, yy + 46, x0 + cw, HAIR)
        yy += 46
    b += lab(x0 + 10, yy + 16, "past due and not completed", 9, INK2, 0.5)
    y2 = y + 148
    b += module(x0, y2, cw, 170, "Due this week", 3, INK, YPALE)
    yy = y2 + 26
    for tk in DUE_WEEK:
        b += m_row(x0, yy, tk, cw)
        b += hr(x0, yy + 46, x0 + cw, HAIR)
        yy += 46
    y3 = y2 + 182
    b += module(x0, y3, cw, 248, "All tasks", 10, INK)
    yy = y3 + 32
    b += lab(x0 + 10, yy, "task", 9, INK2, 0.7)
    b += lab(x0 + cw - 160, yy, "tag", 9, INK2, 0.7)
    b += lab(x0 + cw - 96, yy, "priority", 9, INK2, 0.7)
    b += lab(x0 + cw - 10, yy, "due", 9, INK2, 0.7, "end")
    b += hr(x0, yy + 7, x0 + cw, HAIR)
    yy += 13
    for text, due, kind, tag, pr, past in TASKS:
        b += t(x0 + 10, yy + 13, text, 9.5, INK, UI, 400)
        if tag:
            pill, _ = tag_pill(x0 + cw - 160, yy + 4, tag)
            b += pill
        else:
            b += lab(x0 + cw - 160, yy + 14, "no tag", 9, INK2, 0.5)
        b += prio(x0 + cw - 96, yy + 5, pr)
        b += lab(x0 + cw - 76, yy + 14, pr, 9, INK2, 0.5)
        if due:
            pill, pw = due_pill(x0 + cw - 10 - (8 + len(due) * 4.6), yy + 4, due, kind)
            b += pill
        else:
            b += lab(x0 + cw - 10, yy + 14, "—", 9, INK2, 0.5, "end")
        b += hr(x0, yy + 20, x0 + cw, HAIR)
        yy += 21

    # right column
    b += module(rx, y, cw, 262, "High priority", 5, INK)
    yy = y + 26
    for tk in HIGH:
        b += m_row(rx, yy, tk, cw)
        b += hr(rx, yy + 46, rx + cw, HAIR)
        yy += 46
    yt = y + 274
    b += module(rx, yt, cw, 132, "Tag lists", "one per tag in use", INK)
    yy = yt + 34
    for n, c in (("school", "3"), ("group", "1"), ("work", "1"), ("personal", "4")):
        pill, _ = tag_pill(rx + 10, yy - 10, n)
        b += pill
        b += lab(rx + cw - 10, yy, c, 10, INK2, 0.5, "end")
        b += hr(rx, yy + 7, rx + cw, HAIR)
        yy += 24
    yl = yt + 144
    b += module(rx, yl, cw, 156, "What the inks mean", None, INK)
    b += legend(rx, yl, cw, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def tett_review_d(states, head_note, choice=None):
    """Structure from 05 Tett: the review as a table module inside the mosaic.

    In Kurs the table carries control numerals and punch glyphs, so the borrowed
    structure keeps its shape and loses only its own state vocabulary.
    """
    b = d_rail("Today") + d_head("Today", note=head_note)
    x0, W = RAILW + 26, DW - RAILW - 52
    b += field(x0, 72, W - 120, "Type a task the way you say it out loud", 32,
               placeholder=True)
    b += btn(x0 + W - 112, 72, 112, "Add task", 32, "solid", 11)
    y = 120
    cw = (W - 20) / 2
    open_n = sum(1 for _, _, st in states if st in ("open", "editing"))
    done = sum(1 for _, _, st in states if st == "punched")
    gone = sum(1 for _, _, st in states if st == "struck")
    tally = (f"{open_n} of 3 open" if open_n == 3 else
             f"{done} punched · {gone} struck · {open_n} open")
    b += rect(x0, y, W, 224, fill=PWASH, op=0.5)
    b += rect(x0, y, W, 224, stroke=PURPLE, sw=1.4)
    b += band(x0, y, W, "The course · Rule Engine", tally, PURPLE, PWASH, 22)
    b += t(x0 + 10, y + 42, HERO, 12.5, INK, UI, 500)
    pill, pw = due_pill(x0 + 10, y + 50, "Fri 20 Nov", "week")
    b += pill
    b += lab(x0 + pw + 22, y + 60, "parsed from “Friday” · applied, never proposed",
             9, INK2, 0.5)
    b += lab(x0 + W - 10, y + 42, "your sentence, unchanged", 9, INK2, 0.5, "end")
    yy = y + 74
    for c, cxx in (("control", 34), ("proposed value", 150),
                   ("in the record now", 420), ("act on this control only", 640)):
        b += lab(x0 + cxx, yy, c, 9, INK2, 0.7)
    b += hr(x0 + 10, yy + 6, x0 + W - 10, PURPLE, 0.8)
    yy += 12
    default_now = {"Tags": "none", "Priority": "medium (default)", "Summary": "none"}
    record = {}
    for i, (name, value, st) in enumerate(states, 1):
        b += control(x0 + 22, yy + 11, i,
                     "punched" if st == "punched" else
                     "struck" if st == "struck" else "open", 8)
        b += lab(x0 + 40, yy + 15, name, 10, INK, 0.6)
        if st == "struck":
            b += t(x0 + 150, yy + 15, value, 10.5, INK2, UI, 400, deco="line-through")
        else:
            b += t(x0 + 150, yy + 15, value, 10.5,
                   INK if st == "punched" else PURPLE, UI, 500)
        now = value if st == "punched" else default_now[name]
        record[name] = (now, INK if st == "punched" else INK2)
        b += t(x0 + 420, yy + 15, now, 10,
               INK if st == "punched" else INK2, UI,
               600 if st == "punched" else 400)
        if st == "punched":
            b += btn(x0 + 640, yy + 3, 74, "Undo", 22, "ghost", 9.5)
            b += lab(x0 + 722, yy + 15, "punched 16 nov · one step back", 9, INK2, 0.45)
        elif st == "struck":
            b += lab(x0 + 640, yy + 15, "struck · the field is unchanged and this "
                     "control is not proposed again", 9, INK2, 0.45)
        else:
            b += btn(x0 + 640, yy + 3, 74, "Accept", 22, "purple", 9.5)
            b += btn(x0 + 720, yy + 3, 60, "Edit", 22, "ghost", 9.5)
            b += btn(x0 + 786, yy + 3, 70, "Reject", 22, "ghost", 9.5)
        b += hr(x0 + 10, yy + 28, x0 + W - 10, HAIR)
        yy += 32
    b += btn(x0 + 10, yy + 6, 96, "Punch all", 22, "ghost", 9.5)
    b += btn(x0 + 114, yy + 6, 96, "Strike all", 22, "ghost", 9.5)
    b += lab(x0 + 222, yy + 20, "shortcuts · they do nothing the three rows above "
             "cannot do one control at a time", 9, INK2, 0.45)
    y += 240
    b += module(x0, y, cw, 150, "In the record now", None, INK)
    yy = y + 28
    rows = [("Task text", HERO, INK), ("Due date", "Fri 20 Nov", INK)]
    for name in ("Tags", "Priority", "Summary"):
        rows.append((name,) + record[name])
    for k, v, tint in rows:
        b += lab(x0 + 8, yy + 11, k, 9, INK2, 0.6)
        b += t(x0 + 110, yy + 12, v, 10, tint, UI, 600 if tint == INK and
               k in ("Tags", "Priority", "Summary") else 400)
        b += hr(x0, yy + 18, x0 + cw, HAIR)
        yy += 23
    rx = x0 + cw + 20
    b += module(rx, y, cw, 150, "Why Accept is not the easy path", None, INK)
    yy = y + 32
    for s in ("Each row carries its own Accept, Edit and Reject.",
              "Acting on one control never touches the other two.",
              "Punch all and Strike all sit below the table, as shortcuts.",
              "Reaching Reject on a control costs the same click as Accept.",
              "A task with any control open stays visibly pending."):
        b += t(rx + 8, yy, "— " + s, 9.5, INK2, UI, 400)
        yy += 16
    y += 162
    b += module(x0, y, W, 150, "What the inks mean", None, INK)
    b += legend(x0, y, W, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def d2_review():
    return tett_review_d([("Tags", "school", "open"), ("Priority", "high", "open"),
                          ("Summary", "Submit assignment in IBE160", "open")],
                         "a course is open on one task")


def review_d(states, choice=None, note=None, title="Review"):
    """Structure from 03 Kartet: the course panel beside the terrain column."""
    b = d_rail("Today") + d_head(title, note=note)
    x0, W = RAILW + 26, DW - RAILW - 52
    tw = 360
    rows = [("Due", "Fri 20 Nov", INK),
            ("Tags", "school" if states[0][2] == "punched" else "none yet",
             INK if states[0][2] == "punched" else INK2),
            ("Priority", states[1][1] if states[1][2] == "punched" else "medium",
             INK if states[1][2] == "punched" else INK2),
            ("Summary", states[2][1] if states[2][2] == "punched" else "none yet",
             INK if states[2][2] == "punched" else INK2)]
    rec, rh = record(x0, 72, tw, rows, note="the terrain")
    b += rec
    px = x0 + tw + 28
    pw = W - tw - 28
    heights = {"open": 86, "punched": 58, "struck": 52, "editing": 96}
    ph = 34 + sum(heights[s] for _, _, s in states) + 12
    b += rect(px, 72, pw, ph, fill=PWASH, op=0.5)
    b += rect(px, 72, pw, ph, stroke=PURPLE, sw=1.4)
    b += lab(px + 12, 92, "the course", 11, PURPLE, 1.0)
    open_n = sum(1 for _, _, s in states if s in ("open", "editing"))
    b += lab(px + pw - 12, 92,
             f"{open_n} control still open" if open_n == 1 else
             (f"{open_n} controls still open" if open_n else "all three punched"),
             9.5, PURPLE, 0.6, "end")
    b += hr(px + 12, 99, px + pw - 12, PURPLE, 0.8)
    b += (f'<path d="M{x0+tw} {120} H{px}" stroke="{PURPLE}" stroke-width="1.2" '
          f'stroke-dasharray="4 3" fill="none"/>')
    yy = 106
    prev = None
    for i, (name, value, st) in enumerate(states, 1):
        h = heights[st]
        cx, cy = px + 28, yy + 20
        if prev is not None:
            b += vr(cx, prev, cy - 11, PURPLE, 1.2)
        prev = cy + 11
        b += control(cx, cy, i, st if st != "editing" else "open")
        tx = px + 50
        b += lab(tx, yy + 16, name, 10, INK, 0.8)
        b += engine_chip(px + pw - 100, yy + 16, "Rule Engine")
        if st == "punched":
            b += t(tx, yy + 34, value, 11.5, INK, UI, 600)
            b += lab(tx + len(value) * 6.2 + 10, yy + 34, "punched 16 nov", 9, INK2, 0.5)
            b += btn(px + pw - 76, yy + 24, 64, "Undo", 20, "ghost", 9)
            b += lab(tx, yy + 48, "one step back · restores the previous value",
                     9, INK2, 0.45)
        elif st == "struck":
            b += t(tx, yy + 34, value, 11.5, INK2, UI, 400, deco="line-through")
            b += lab(tx, yy + 46, "struck · the field is unchanged and not proposed again",
                     9, INK2, 0.45)
        elif st == "editing":
            b += lab(tx, yy + 32, "your value, not the proposal", 9, INK2, 0.5)
            bw = 88
            for j, opt in enumerate(("low", "medium", "high")):
                sel = opt == choice
                bx = tx + j * (bw + 6)
                b += rect(bx, yy + 38, bw, 22, fill=INK if sel else WHITE)
                b += rect(bx, yy + 38, bw, 22, stroke=INK if sel else INK2, sw=1)
                b += lab(bx + bw / 2, yy + 53, opt, 9.5, WHITE if sel else INK, 0.6, "middle")
            b += btn(tx, yy + 66, 70, "Apply", 20, "solid", 9)
            b += btn(tx + 78, yy + 66, 70, "Cancel", 20, "ghost", 9)
            b += lab(tx + 158, yy + 80, "applying punches your value, not the proposal",
                     9, INK2, 0.45)
        else:
            b += t(tx, yy + 34, value, 11.5, PURPLE, UI, 500)
            for j, s in enumerate(("Accept", "Edit", "Reject")):
                b += btn(tx + j * 84, yy + 42, 78, s, 22,
                         "purple" if j == 0 else "ghost", 9.5)
            b += lab(tx, yy + 78, "this control only · the other two stay as they are",
                     9, INK2, 0.45)
        yy += h
    b += btn(px + 12, yy + 10, 96, "Punch all", 22, "ghost", 9.5)
    b += btn(px + 116, yy + 10, 96, "Strike all", 22, "ghost", 9.5)
    b += lab(px + 224, yy + 24, "shortcuts · they do nothing the controls cannot",
             9, INK2, 0.45)
    ty = max(72 + rh, 72 + ph + 46) + 24
    b += band(x0, ty, W, "The rest of today", None, INK)
    yy = ty + 24
    for tk in DUE_WEEK[1:] + ATTN:
        b += m_row(x0, yy, tk, W)
        b += hr(x0, yy + 42, x0 + W, HAIR)
        yy += 42
    b += module(x0, yy + 16, W, 134, "What the inks mean", None, INK)
    b += legend(x0, yy + 16, W, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def d3():
    return review_d([("Tags", "school", "punched"), ("Priority", "medium", "editing"),
                     ("Summary", "Submit assignment in IBE160", "punched")],
                    choice="high",
                    note="one control still open — you are editing Priority")


def d4():
    """Structure from 05 Tett — the user's choice: d4 follows d2's table, not d3's panel."""
    return tett_review_d([("Tags", "school", "punched"), ("Priority", "high", "struck"),
                          ("Summary", "Submit assignment in IBE160", "open")],
                         "three control-states on one task · 1 punched, 1 struck, 1 open")


def d5_detail():
    """Structure from 03 Kartet: all tasks left, the task field by field right."""
    b = d_rail("Today") + d_head("Task")
    x0, W = RAILW + 26, DW - RAILW - 52
    lw = 300
    b += band(x0, 60, lw, "All tasks", 10, INK)
    yy = 86
    for i, tk in enumerate(TASKS):
        sel = i == 0
        if sel:
            b += rect(x0, yy - 4, lw, 36, fill=WHITE)
            b += rect(x0, yy - 4, 2.6, 36, fill=INK)
        b += t(x0 + 10, yy + 12, tk[0], 10, INK, UI, 600 if sel else 400)
        if tk[1]:
            pill, _ = due_pill(x0 + 10, yy + 18, tk[1], tk[2])
            b += pill
        b += hr(x0, yy + 32, x0 + lw, HAIR)
        yy += 36
    rx = x0 + lw + 28
    rw = W - lw - 28
    b += band(rx, 60, rw, "The task, field by field", None, INK)
    yy = 92
    for k, v, note in (("Task text", HERO, "never rewritten"),
                       ("Due date", "Fri 20 Nov 2026", "parsed from “Friday”"),
                       ("Project", "IBE160", ""),
                       ("Notes", "Hand in the PDF, not the .docx", "")):
        b += lab(rx, yy, k, 9.5, INK2, 0.7)
        b += field(rx + 110, yy - 16, rw - 230, v, 26)
        if note:
            b += lab(rx + rw, yy, note, 9, INK2, 0.45, "end")
        yy += 38
    yy += 6
    b += band(rx, yy, rw, "The course on this task", "all three punched", PURPLE)
    yy += 30
    for i, (k, v) in enumerate(PARTS, 1):
        b += control(rx + 14, yy + 6, i, "punched", 8)
        b += lab(rx + 32, yy + 10, k, 9.5, INK, 0.6)
        b += t(rx + 110, yy + 11, v, 10.5, INK, UI, 500)
        b += lab(rx + rw, yy + 10, "punched mon 16 nov · rule engine", 9, INK2, 0.45, "end")
        b += hr(rx, yy + 18, rx + rw, HAIR)
        yy += 26
    b += lab(rx, yy + 14, "no purple is left on this task", 9.5, INK2, 0.5)
    yy += 30
    b += cbox(rx, yy)
    b += t(rx + 20, yy + 11, "Not completed", 11, INK, UI, 400)
    yy += 32
    b += btn(rx, yy, 116, "Complete", 26, "solid", 10)
    b += btn(rx + 126, yy, 126, "Suggest again", 26, "ghost", 10)
    b += btn(rx + 262, yy, 110, "Delete", 26, "ghost", 10)
    b += lab(rx, yy + 44, "Suggest again sets a fresh course. It is yours to ask for and "
             "never runs on its own.", 9, INK2, 0.45)
    b += lab(rx, yy + 56, "Completing keeps every punched control; the task moves to the "
             "archive after thirty days.", 9, INK2, 0.45)
    b += module(rx, yy + 76, rw, 134, "What the inks mean", None, INK)
    b += legend(rx, yy + 76, rw, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def d6_archive():
    """Structure from 03 Kartet: the archive table in marsh ink."""
    b = d_rail("Archive") + d_head("Archive", note="completed, kept, not deleted")
    x0, W = RAILW + 26, DW - RAILW - 52
    b += band(x0, 70, W, "Archived", 4, MINK, MPALE)
    yy = 102
    for c, cxx, anc in (("task", 10, "start"), ("tag", 470, "start"),
                        ("priority", 580, "start"), ("completed", 720, "start"),
                        ("archived", 850, "start"), ("restore", W - 10, "end")):
        b += lab(x0 + cxx, yy, c, 9, INK2, 0.7, anc)
    b += hr(x0, yy + 7, x0 + W, HAIR)
    yy += 14
    arch = [("Clean the kitchen eventually", "personal", "low", "Sat 10 Oct", "Mon 09 Nov"),
            ("Call the doctor", "personal", "medium", "Fri 02 Oct", "Sun 01 Nov"),
            ("Figure out the thing", "", "medium", "Wed 30 Sep", "Fri 30 Oct"),
            ("Buy birthday present next week", "personal", "medium", "Mon 28 Sep",
             "Wed 28 Oct")]
    for n, tg, p, c, a in arch:
        b += cbox(x0 + 10, yy + 5, True)
        b += t(x0 + 32, yy + 16, n, 10.5, INK2, UI, 400, deco="line-through")
        if tg:
            pill, _ = tag_pill(x0 + 470, yy + 5, tg)
            b += pill
        else:
            b += lab(x0 + 470, yy + 16, "no tag", 9, INK2, 0.5)
        b += prio(x0 + 580, yy + 6, p)
        b += lab(x0 + 600, yy + 16, p, 9, INK2, 0.5)
        b += t(x0 + 720, yy + 16, c, 10, INK2, UI, 400)
        b += t(x0 + 850, yy + 16, a, 10, MINK, UI, 500)
        b += btn(x0 + W - 90, yy + 2, 90, "Restore", 22, "ghost", 9.5)
        b += hr(x0, yy + 26, x0 + W, HAIR)
        yy += 30
    yy += 20
    cw = (W - 24) / 2
    b += module(x0, yy, cw, 118, "Retention", None, INK)
    b += lab(x0 + 10, yy + 44, "archive completed tasks after", 9.5, INK2, 0.6)
    b += select(x0 + 10, yy + 54, 140, "30 days")
    b += lab(x0 + 10, yy + 96, "Changing this re-evaluates every completed task against "
             "the new value.", 9, INK2, 0.45)
    b += lab(x0 + 10, yy + 108, "The same control is in Settings; the number never lives "
             "in two places.", 9, INK2, 0.45)
    rx = x0 + cw + 24
    b += module(rx, yy, cw, 118, "Not a wastebasket", None, MINK, MPALE)
    for i, s in enumerate(("An archived task keeps every punched control.",
                           "Restore puts it back with its marks, into the lists it "
                           "still qualifies for.",
                           "Nothing here has been deleted.",
                           "Deleting is a separate, explicit act on the task itself.")):
        b += t(rx + 10, yy + 42 + i * 17, "— " + s, 9.5, INK2, UI, 400)
    yy += 134
    b += module(x0, yy, W, 134, "What the inks mean", None, INK)
    b += legend(x0, yy, W, cols=2, title="What the inks mean")
    return svg(DW, DH, b, GROUND)


def settings_d(failure=False):
    """Structure from 05 Tett: the settings mosaic, stated in full."""
    b = d_rail("Settings") + d_head("Settings",
                                    note="one device · no account · nothing leaves "
                                    "without consent")
    x0, W = RAILW + 26, DW - RAILW - 52
    cw = (W - 24) / 2
    y = 70
    # API key
    b += module(x0, y, cw, 118, "API key", "saved on this device" if failure else
                "optional", INK)
    if failure:
        b += field(x0 + 10, y + 34, cw - 120, "sk-ant-api03-••••••••••••••••7Q4F", 28)
        b += btn(x0 + cw - 102, y + 34, 92, "Replace", 28, "ghost", 9.5)
    else:
        b += field(x0 + 10, y + 34, cw - 120, "Paste an Anthropic API Key", 28,
                   placeholder=True)
        b += btn(x0 + cw - 102, y + 34, 92, "Save", 28, "ghost", 9.5)
    b += lab(x0 + 10, y + 80, "Stored in this browser only. Never committed to the "
             "repository,", 9, INK2, 0.5)
    b += lab(x0 + 10, y + 92, "and never sent anywhere until Cloud Suggestions is on.",
             9, INK2, 0.5)
    # cloud suggestions
    rx = x0 + cw + 24
    b += module(rx, y, cw, 118, "Cloud Suggestions", "on" if failure else "off", INK)
    b += toggle(rx + 10, y + 36, failure)
    b += t(rx + 56, y + 49, "Use Cloud Suggestions", 11, INK, UI, 500)
    if failure:
        b += lab(rx + 56, y + 64, "Still on. It is the organization that refuses, "
                 "not the switch.", 9, INK2, 0.5)
    else:
        b += lab(rx + 56, y + 64, "Off on first run, even when a key is already saved.",
                 9, INK2, 0.5)
    yy = y + 78
    for s in DISCLOSE[:2] if not failure else ["Turning it off stops every outbound call "
                                               "immediately."]:
        b += t(rx + 10, yy + 10, "— " + s, 9.5, INK2, UI, 400)
        yy += 14
    y += 130
    # engine status
    h = 150 if failure else 110
    b += module(x0, y, W, h, "Suggestion engine", None, INK)
    if failure:
        b += engine_chip(x0 + 12, y + 46, "Model Engine", 11, MINK)
        b += rect(x0 + W - 150, y + 32, 138, 18, fill=MPALE)
        b += lab(x0 + W - 81, y + 45, "not being used", 9, MINK, 0.7, "middle")
        b += t(x0 + 12, y + 72, ORG_FAIL, 12.5, INK, UI, 500)
        b += lab(x0 + 12, y + 88, ORG_SUB[:78], 9.5, INK2, 0.5)
        b += lab(x0 + 12, y + 100, ORG_SUB[78:], 9.5, INK2, 0.5)
        b += hr(x0 + 12, y + 108, x0 + W - 12, HAIR)
        b += engine_chip(x0 + 12, y + 128, "Rule Engine")
        b += t(x0 + 106, y + 128, "is serving suggestions normally.", 10.5, INK, UI, 400)
    else:
        b += engine_chip(x0 + 12, y + 46, "Rule Engine", 11)
        b += rect(x0 + W - 90, y + 32, 78, 18, fill=INK)
        b += lab(x0 + W - 51, y + 45, "serving", 9, WHITE, 0.7, "middle")
        b += t(x0 + 12, y + 72, NOKEY, 12.5, INK, UI, 500)
        b += lab(x0 + 12, y + 90, NOKEY_SUB, 9.5, INK2, 0.5)
    y += h + 12
    if failure:
        b += module(x0, y, cw, 118, "The other two reasons this line can give",
                    "one at a time", INK)
        yy = y + 34
        for head, sub in OTHER_FAILS:
            b += t(x0 + 10, yy + 12, head, 10.5, INK2, UI, 500)
            b += lab(x0 + 10, yy + 26, sub, 9, INK2, 0.45)
            b += hr(x0, yy + 34, x0 + cw, HAIR)
            yy += 40
        b += module(rx, y, cw, 118, "Where this is visible", None, INK)
        for i, s in enumerate(("This page is the only place an engine problem is shown.",
                               "No popup, banner, toast or badge appears in capture "
                               "or review.",
                               "Every suggestion still arrives, served by the Rule Engine.",
                               "It clears on its own when the cause does. "
                               "Nothing to dismiss.")):
            b += t(rx + 10, y + 46 + i * 17, "— " + s, 9.5, INK2, UI, 400)
    else:
        b += module(x0, y, cw, 118, "Measured accuracy", "published, not claimed", INK)
        yy = y + 40
        for k, v in (("Fixture entries", "not scored yet"),
                     ("Tags · Priority · Due date · Placement", "reported apart"),
                     ("Summary", "scored separately")):
            b += lab(x0 + 10, yy, k, 9.5, INK2, 0.5)
            b += lab(x0 + cw - 10, yy, v, 9.5, INK, 0.5, "end")
            b += hr(x0, yy + 6, x0 + cw, HAIR)
            yy += 22
        b += lab(x0 + 10, yy + 12, "The app publishes its own score rather than claiming "
                 "the suggestions are right.", 9, INK2, 0.45)
        b += module(rx, y, cw, 118, "The two engines", None, INK)
        yy = y + 38
        for c, cxx in (("engine", 10), ("where it runs", 120), ("needs", 240),
                       ("right now", cw - 10)):
            b += lab(rx + cxx, yy, c, 9, INK2, 0.7, "end" if cxx == cw - 10 else "start")
        b += hr(rx, yy + 6, rx + cw, HAIR)
        yy += 20
        for n, w_, nd, rn in (("Rule Engine", "this device", "nothing", "serving"),
                              ("Model Engine", "the Anthropic API", "your own key",
                               "not in use")):
            b += t(rx + 10, yy, n, 10, INK, UI, 500)
            b += t(rx + 120, yy, w_, 9.5, INK2, UI, 400)
            b += t(rx + 240, yy, nd, 9.5, INK2, UI, 400)
            b += lab(rx + cw - 10, yy, rn, 9.5, INK if rn == "serving" else MINK,
                     0.5, "end")
            b += hr(rx, yy + 6, rx + cw, HAIR)
            yy += 22
    y += 130
    b += module(x0, y, W, 118, "Settings", None, INK)
    yy = y + 40
    for k, v, note in (("Archive retention", "30 days",
                        "how long a completed task stays in its lists"),
                       ("Task text", "English only, by decision",
                        "the keyword tables and date words are English"),
                       ("Interface language", "English — not yet decided",
                        "an open question, not a settled one")):
        b += lab(x0 + 10, yy, k, 9.5, INK2, 0.6)
        b += t(x0 + 190, yy, v, 10, INK, UI, 400)
        b += lab(x0 + W - 10, yy, note, 9, INK2, 0.45, "end")
        b += hr(x0, yy + 6, x0 + W, HAIR)
        yy += 24
    return svg(DW, DH, b, GROUND)


FRAMES = {
    "m1-today": m1_today, "m2-capture-pending": m2_capture,
    "m3-review-proposed": m3, "m4-review-editing": m4,
    "m5-review-partial-undo": m5, "m6-task-detail": m6_detail,
    "m7-smartlist": m7_smartlist, "m8-settings-no-key": m8_settings,
    "m9-first-run": m9_first_run,
    "d1-today": d1_today, "d2-review-proposed": d2_review, "d3-review-editing": d3,
    "d4-review-partial-undo": d4, "d5-task-detail": d5_detail, "d6-archive": d6_archive,
    "d7-settings-cloud-off": lambda: settings_d(False),
    "d8-settings-failure": lambda: settings_d(True),
}

if __name__ == "__main__":
    for name, fn in FRAMES.items():
        (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
    print(f"06-kurs: {len(FRAMES)} frames")
