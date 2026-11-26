---
title: "Sprint Change Proposal — the due pill's four states, as d1 already draws them"
date: 2026-11-26
status: approved and applied — 2026-11-26
approved_by: Shyam
applied: "4.1 – 4.2, both edits; 2 files, 2 lines; no approved visual changes"
trigger: "Story 1.2 review and walkthrough, 2026-11-25; blocking Story 1.3"
scope_classification: minor
mode: batch
author: Shyam
relates_to: deferred-work.md entry targeting Story 1.3
sources:
  - .docs/planning-artifacts/epics.md
  - .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/mockups/kurs/d1-today.svg
---

# Sprint Change Proposal — the due pill's four states, as `d1` already draws them

## 1. Issue Summary

**Story 1.3 cannot render a due pill without guessing.** It is the first story that puts a real
parsed date in the pill, and FR-23 makes an out-of-week date routine: `next week` resolves to the
Monday of the following week, which is outside the current week by definition.

`epics.md`'s UX-DR12 row describes the pill as *"in the ink of its window (yellow inside the week,
olive past due, outlined when there is none)"* — three states, where outlined means **no date**.
The approved `d1-today.svg` draws four, and uses outlined for something else entirely.

**Measured in the frame**, against its reference date of `MON 16 NOV 2026`:

| State | Example in `d1` | Treatment |
| --- | --- | --- |
| Past due | `SAT 14 NOV`, `TUE 10 NOV` | `attention` olive fill, `surface` text (5.7:1) |
| Inside this week | `MON 16 NOV`, `TUE 17 NOV`, `FRI 20 NOV` | `due-week` yellow fill |
| Later than this week | `MON 23 NOV` | outlined pill, `surface` fill |
| No due date | four occurrences of `—` | em-dash, no pill drawn |

**The conflict is narrower than it first appears, and that is what makes the fix small.**
`DESIGN.md` — the authority that wins over a frame by its own rule — says only
`due-pill: "due date in the ink of its window"`. It is **silent** on the out-of-week and no-date
cases, so it does not disagree with `d1` at all. The only text that contradicts the frame is
`epics.md`'s parenthetical. No approved visual is wrong; one description of it is.

## 2. Impact Analysis

**Epic impact.** None. No epic's scope or ordering changes.

**Story impact.**

- **Story 1.3** (next, currently `backlog`): unblocked. It renders a parsed date in the pill and
  needs to know all four states, because `next week` reaches the fourth routinely.
- **Story 1.2** (`done`, merged at `25081f5`): ships an outlined pill reading `NO DUE DATE`, because
  every Task it creates has no date and the row it followed said outlined means none. Under the
  corrected rule that becomes the em-dash. **This is left for Story 1.3**, which owns the due pill
  and will touch that component anyway; it is recorded in that story's deferred entry rather than
  reopening a merged story. No user has seen either rendering — the product is not released.
- **Epic 3** owns the `due-week` and `attention` window inks and inherits the corrected row.

**Artifact conflicts.**

| Artifact | Section | Nature |
| --- | --- | --- |
| `epics.md` | UX-DR12 row | one parenthetical corrected to the frame's four states |
| `DESIGN.md` | `due-pill` component line | one clause added, so the visual rule is complete where a developer looks for it |
| `d1-today.svg` and every other frame | none | **no pixel changes** — the frames were already right |

**Technical impact.** No source change in this proposal. Story 1.3 implements against the corrected
row.

## 3. Recommended Approach

**Direct Adjustment** — correct the description to match the approved drawing.

**Rationale.** The alternative readings are both worse. Following the row literally would make
outlined mean "no date" and leave an out-of-week date with **no defined treatment at all**, which is
the gap that blocks Story 1.3. Collapsing the two into one outlined treatment would render a Task
with a date and a Task without it identically, losing information the frame deliberately
distinguishes. Adopting what `d1` draws preserves the approved UX exactly, because it *is* the
approved UX.

**Effort:** two lines. **Risk:** none to approved visuals; zero pixels move.
**Timeline:** unblocks Story 1.3 immediately.

## 4. Detailed Change Proposals

### 4.1 — `epics.md`, the UX-DR12 row

**OLD**

> | UX-DR12 | **Due pill** in the ink of its window (yellow inside the week, olive past due, outlined when there is none) and **tag patch** as a terrain-patch rectangle in `attention-pale` naming its context. |

**NEW**

> | UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside the current week, `attention` olive past due, and an outlined pill for a date later than this week; **no pill at all when there is no due date**, which is drawn as an em-dash. Four states, exactly as `d1-today.svg` draws them. **Tag patch** as a terrain-patch rectangle in `attention-pale` naming its context. |

**Rationale.** The old parenthetical gave outlined to the no-date case, which the frame gives to an
out-of-week date, and left out-of-week undefined. FR-23's `next week` reaches that state routinely,
so Story 1.3 would have had to invent it.

### 4.2 — `DESIGN.md`, the `due-pill` component line

**OLD**

> ```
>   due-pill: "due date in the ink of its window"
> ```

**NEW**

> ```
>   due-pill: "due date in the ink of its window — yellow inside the week, olive past due, outlined beyond it; an em-dash, not a pill, when there is no date"
> ```

**Rationale.** `DESIGN.md` wins over a frame by its own rule, so it is where a developer checks a
visual. It was silent on two of the four states, which is why nothing contradicted `d1` and also why
nothing settled the question. Stating all four makes the authority self-sufficient.

## 5. Implementation Handoff

**Scope: Minor.** Two lines, two files, no source change, no re-verification — nothing executable
changed.

**Route to:** Story 1.3, which renders the first real date in the pill.

**Success criteria.**

1. UX-DR12 names four states and no longer says outlined means none.
2. `DESIGN.md`'s `due-pill` line names all four.
3. No frame is modified: `git diff` touches no `.svg`.
4. The `deferred-work.md` entry targeting Story 1.3 is closed, referencing this proposal.
5. Story 1.3's spec renders the em-dash for no date and converts Story 1.2's `NO DUE DATE` pill.

**Explicitly out of scope.** No change to any mockup, to Story 1.2's merged code, to the 43 tokens,
or to the `due-week` / `attention` window inks, which remain Epic 3's.
