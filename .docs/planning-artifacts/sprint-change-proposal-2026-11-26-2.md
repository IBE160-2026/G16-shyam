---
title: "Sprint Change Proposal — the em-dash gets a spoken name, and DESIGN.md stops contradicting itself"
date: 2026-11-26
status: approved and applied — 2026-11-26
approved_by: Shyam
applied: "4.1 – 4.3; 2 locked-document lines, 3 source files; no approved visual changes"
trigger: "Story 1.3 review, 2026-11-26; two findings routed to locked documents"
scope_classification: minor
mode: batch
author: Shyam
relates_to: >
  deferred-work.md entry on the em-dash's accessible name;
  sprint-change-proposal-2026-11-26.md, whose 4.2 edit this completes
sources:
  - .docs/planning-artifacts/epics.md
  - .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/EXPERIENCE.md
  - .docs/implementation-artifacts/spec-1-3-see-the-due-date-the-date-word-named.md
---

# Sprint Change Proposal — the em-dash gets a spoken name, and `DESIGN.md` stops contradicting itself

## 1. Issue Summary

Story 1.3's review raised two findings whose fix lands in locked planning documents. Neither is a
defect in shipped behaviour; both are documents saying less, or more, than they mean.

### Issue A — the em-dash leaves the absence unnamed for assistive technology

Story 1.2's record announced `NO DUE DATE`. Story 1.3 replaced that with an em-dash, as UX-DR12
requires, and in doing so removed the only thing a screen reader had to read. A screen reader now
announces "em dash" or nothing where a word stood.

Filed independently by two review layers and self-reported by the implementation.

**Why no document settles it.** UX-DR12 says the no-date case is "drawn as an em-dash" — a statement
about what is *drawn*, silent on what is *spoken*. UX-DR20's accessibility floor forbids state
carried by colour alone and requires real text at every size; an em-dash is neither a colour nor an
image, so the floor is not literally breached. The result is a gap rather than a conflict: the
documents permit the regression without intending it.

**The product already has the pattern, twice.** `PriorityLadder.tsx` renders its bars `aria-hidden`
with the word as the accessible content, and `Record.tsx` does the same for the checkbox glyph. One
state, two renderings — a mark for the eye and a word for the reader — is this product's existing
answer, applied everywhere except here.

### Issue B — `DESIGN.md` contradicts itself on the due pill

The correct-course of 2026-11-26 corrected the `due-pill:` line in `DESIGN.md`'s frontmatter to name
all four states. The prose in its Components section was not touched and still carries the superseded
three-state wording, in which outlined means "no date" — the exact reading that proposal was written
to retire.

That proposal's own success criterion 2 ("`DESIGN.md`'s `due-pill` line names all four") was read as
the frontmatter line alone. This completes it.

**Consequence today:** `DESIGN.md` is the authority a developer checks for a visual, and it now gives
two different answers depending on which half is read. Story 1.3 was built from the frontmatter and
`d1`, so no code is wrong; the next story to touch the pill could reasonably read the other half.

## 2. Impact Analysis

**Epic impact.** None. No epic's scope, ordering or story list changes.

**Story impact.**

- **Story 1.3** (`review`, committed at `1ea02ba`): gains the spoken name. This is an addition inside
  the story's own component and labels module, not a re-derivation — the story is **not** restarted,
  its seven acceptance criteria are untouched, and its frozen Decisions still hold.
- **Story 1.2** (`done`, merged): unaffected. It no longer renders a pill of its own.
- **Epic 3**: unaffected, and still owns the `due-week` and `attention` window inks and the window
  computation behind them. Nothing here brings a coloured state forward.
- **Every later UI story**: inherits a UX-DR12 that now says what assistive technology hears, so the
  question is answered once rather than re-litigated per surface.

**Artifact conflicts.**

| Artifact | Section | Nature |
| --- | --- | --- |
| `epics.md` | UX-DR12 row | one clause added — the spoken name alongside the drawn em-dash |
| `DESIGN.md` | `due-pill` prose, Components | superseded three-state wording replaced; **no frontmatter change** |
| `EXPERIENCE.md` | accessibility floor | **no change** — "no state by colour alone" is unaffected |
| `DESIGN.md` frontmatter | `due-pill:` | **no change** — already names four states correctly |
| Every frame, `d1` included | none | **no pixel changes** — what is drawn does not move |

**Technical impact.** Three small source edits in Story 1.3's own files, plus test coverage. No new
design token, so `theme-tokens.test.ts`'s 43-token assertion and its equality check against
`DESIGN.md`'s frontmatter are untouched. `sr-only` is a Tailwind v4 core utility, not a `@theme`
entry. No focusable control is added, so the record's "contains no focusable control" assertion and
the `axe-core` scans at both widths stay valid.

## 3. Recommended Approach

**Direct Adjustment** on both issues — make the documents say what the product means, and add the
spoken name.

**Rationale for Issue A.** The alternatives are worse. Leaving it names the absence for sighted users
only, in a product whose own accessibility floor is a stated requirement and whose every other
two-rendering state already pairs a mark with a word. Replacing the em-dash with a visible word would
overturn an approved frame and the correction that established it. Keeping the glyph and adding a
visually-hidden word costs one label and two spans, changes nothing a sighted user sees, and reuses a
pattern already in the codebase.

**Rationale for Issue B.** One half of a document contradicting the other is a defect with no
defensible reading. The frontmatter and `d1` agree; the prose is simply stale.

**Effort:** two document lines, three small source edits, two test assertions.
**Risk:** none to approved visuals; zero pixels move, and no coloured state arrives early.
**Timeline:** does not block Story 1.4, and Story 1.3 stays `review` rather than reopening.

## 4. Detailed Change Proposals

### 4.1 — `epics.md`, the UX-DR12 row

**OLD**

> | UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside the current week, `attention` olive past due, and an outlined pill for a date later than this week; **no pill at all when there is no due date**, which is drawn as an em-dash. Four states, exactly as `d1-today.svg` draws them. **Tag patch** as a terrain-patch rectangle in `attention-pale` naming its context. |

**NEW**

> | UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside the current week, `attention` olive past due, and an outlined pill for a date later than this week; **no pill at all when there is no due date**, which is drawn as an em-dash and **named "No due date" for assistive technology** — the glyph is decorative, the word is the accessible content, and neither is a focusable control. Four states, exactly as `d1-today.svg` draws them. **Tag patch** as a terrain-patch rectangle in `attention-pale` naming its context. |

**Rationale.** The row described what is drawn and was silent on what is spoken, which let Story 1.3
remove the only text the no-date case had without contradicting anything. The added clause closes the
gap in the row that governs the pill, states the mark/word split the rest of the record already uses,
and forecloses the reading that an accessible name implies a control. UX-DR20 needs no edit: its
floor was never the thing in tension, and this makes the pill meet it the way the ladder already
does.

### 4.2 — `DESIGN.md`, the `due-pill` prose in Components

**OLD**

> **Due pill / tag patch.** A due date in the ink of its window — yellow inside the week, olive past
> due, outlined when there is none. A tag is a terrain patch in `attention-pale` naming its context.

**NEW**

> **Due pill / tag patch.** A due date in the ink of its window — yellow inside the week, olive past
> due, outlined beyond it. No date draws no pill: an em-dash, decorative, with "No due date" as its
> accessible name. A tag is a terrain patch in `attention-pale` naming its context.

**Rationale.** This is the half of the 2026-11-26 correction that was missed. The prose gave outlined
to the no-date case, which the frame gives to an out-of-week date, and left out-of-week undefined —
the same three-state error, in the same document whose frontmatter now states four. Bringing the
accessible name along keeps a developer from having to read two sections to learn what the component
renders.

### 4.3 — Source changes (Story 1.3's own files; no story boundary crossed)

Not part of the locked-document change, listed so the handoff is complete.

- `src/ui/labels.ts` — add `record.noDueDateSpoken: 'No due date'` beside the existing
  `record.noDueDate: '—'`. A second key is unavoidable: the glyph and the word are two different
  strings, and AD-9 forbids either as a literal in a component. The wording is Story 1.2's own,
  in sentence case because it is never displayed and all-caps is read out letter by letter by some
  screen readers — the same split `Priority` already uses, where the data is lowercase and the
  casing is the type style's. The docstring calling the due date "the one exception" to naming an
  absence is corrected: it is no longer an exception.
- `src/ui/components/Record.tsx` — in the no-date branch only, mark the em-dash `aria-hidden` and add
  a `sr-only` span carrying the spoken word. `data-slot="due-pill"` and `data-due="none"` stay where
  they are. The dated branch is untouched.
- `tests/e2e/capture.spec.ts` — assert the accessible text on the undated pill and that the glyph is
  hidden from it; keep the em-dash literal pinned; confirm no focusable control was added. The
  existing `toHaveText` assertions move to the glyph span, since a visually-hidden sibling changes
  the pill's text content.

**Explicitly out of scope.** No change to `DESIGN.md`'s frontmatter or its 43 tokens, to
`EXPERIENCE.md`, to any mockup, to the `due-week` / `attention` window inks or the window computation
— all still Epic 3's — to Story 1.3's seven acceptance criteria or its frozen Decisions, or to
Story 1.2's merged code.

## 5. Implementation Handoff

**Scope: Minor.** Two document lines and three small source edits, routed to the Developer agent for
direct implementation.

**Success criteria.**

1. UX-DR12 names the spoken accessible name and states that it is not a focusable control.
2. `DESIGN.md`'s Components prose names four states and agrees with its own frontmatter.
3. A screen reader reads "No due date" where the em-dash is drawn; nothing a sighted user sees
   changes.
4. No frame is modified: `git diff` touches no `.svg`.
5. No new design token; the 43-token assertion and its `DESIGN.md` equality check still pass.
6. The record still contains no focusable control, and `axe-core` is clean at 360 px and 1280 px.
7. The full gate passes: typecheck, lint, unit, build, end-to-end, bundle-key scan.
8. The `deferred-work.md` entry on the em-dash's accessible name is closed, referencing this
   proposal; the entry on the window inks stays open and untouched.
9. Story 1.3 is not restarted and its status stays `review`; nothing is pushed or merged, and
   Story 1.4 is not begun.
