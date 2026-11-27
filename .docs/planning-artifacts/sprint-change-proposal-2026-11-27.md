# Sprint Change Proposal — 2026-11-27

**Trigger:** the due pill carries no year, and Story 1.5 made that reachable.
**Mode:** Batch. **Scope classification:** Minor (see §5).
**Status:** **approved and applied, 2026-11-27.** Placement decision: folded
into Epic 3's pill work (Story 3.1), not a new Story 1.9 — see §8.

---

## 1. Issue Summary

**Problem.** The due pill on a record renders a date as `WEEKDAY DD MON` —
`FRI 20 NOV` — with no year, in all four of UX-DR12's states. Until Story 1.5
that was unambiguous, because a due date could only arrive through FR-23's
date-word vocabulary, whose furthest reach is `next week`. Every date the
product could hold was inside a two-week horizon, so the year was never in
question and leaving it out cost nothing.

Story 1.5 (FR-3) gave the user a date control that accepts **any** date. A Task
due `2030-11-20` now draws on the record as `WED 20 NOV`, carrying no cue that
it is four years out, and is indistinguishable from any other 20 November that
falls on a Wednesday.

**Issue type:** a requirement that was correct under one capability became
insufficient when another shipped. Not a misunderstanding of UX-DR12 and not a
defect in Story 1.5 — both were right about their own scope. The gap is at the
seam between them, and neither story's acceptance criteria could have caught it.

**How it was found.** Routed forward rather than discovered late. Story 1.3's
review recorded it in `deferred-work.md` against Story 1.5, in these words:
"due-pillen bærer ikke årstall … Utenfor rekkevidde i FR-23, men nåbart når
Story 1.5 lar brukeren skrive en vilkårlig dato." Story 1.5 shipped the date
control and did not take up the pill, so the entry came due.

## 2. Evidence

| Evidence | Where |
|---|---|
| UX-DR12 specifies four pill states and no year | `epics.md:122` |
| `due-pill` token description, likewise no year | `DESIGN.md:83` (frontmatter) |
| `d1-today.svg` draws six pills, none with a year — `FRI 20 NOV`, `TUE 17 NOV`, `MON 16 NOV`, `MON 23 NOV`, `SAT 14 NOV`, `TUE 10 NOV` | `mockups/kurs/d1-today.svg` |
| The pill renders through `formatHeaderDate`, which yields `WEEKDAY DD MON` | `src/ui/components/Record.tsx:119` |
| FR-23's vocabulary reaches no further than `next week` | `prd.md:170–189` |
| FR-3 permits editing the due date, with no bound stated | `prd.md:145` |
| The date control accepts any complete valid date | `src/ui/task-detail/TaskDetail.tsx`, `DueDateField` |
| Three tests pin the pill's exact text `FRI 20 NOV` | `capture.spec.ts:273, 283, 656` |

**Reachable today, on `main`.** Open any Task, set the due date to 2030, return
to Today: the record shows a date with no year. Two dates sharing weekday, day
and month are 6, 11 or 28 years apart — so collisions are uncommon, but the
absence of any year cue is total and affects every out-of-year date.

**Severity: low.** Nothing is lost or corrupted — `dueDate` is stored correctly
as a `LocalDate` and Task detail already shows it in full as `Fri 20 Nov 2026`.
The defect is legibility on the record, which is the surface a user scans.

## 3. Impact Analysis

### Epic impact

| Check | Finding |
|---|---|
| Epic 1 completable as planned? | **Yes.** Stories 1.6–1.8 do not touch the pill. |
| Epic-level change needed? | **One wording amendment** to UX-DR12. No epic added, removed or redefined. |
| Remaining epics affected? | **Epic 3 only, and compatibly.** It completes UX-DR12's two window inks (`due-week` yellow, `attention` olive). The year rule is additive text about *content*; the inks are about *fill*. They do not interact. |
| Any epic invalidated, or a new one needed? | **No.** |
| Resequencing or repriorititisation? | **No.** |

### Artifact conflicts

| Artifact | Conflict | Action |
|---|---|---|
| **PRD** | None. FR-2 and FR-3 say nothing about how a due date is formatted on a record; §3 defines the field, not its presentation. MVP unaffected. | **No change.** |
| **Architecture spine** | None. AD-2 (dates are `LocalDate`, no instants) stands unchanged, and the fix needs no new decision — `formatFullDate` already exists in `core/localdate.ts`, added by Story 1.4 for the desktop title row. | **No change.** |
| **DESIGN.md** | `due-pill` (line 83) describes the four states without a year. | **Amend** — one clause. |
| **epics.md** | UX-DR12 (line 122) is the authority on the pill and omits the year rule. | **Amend** — one clause. |
| **`d1-today.svg`** | Draws no year on any pill. Every date it draws is inside its own reference year, so the frame is not *wrong* — it is silent on a case it never shows. | **No redraw.** Record the frame as silent-not-superseded. |
| **Tests** | `capture.spec.ts:273, 283, 656` assert `FRI 20 NOV` exactly. All three seed dates inside the reference year, so they stay correct under the proposed rule. | No change expected; confirm during implementation. |
| **Deployment / CI / IaC / monitoring** | Not applicable — no backend, no pipeline beyond the local gate. | **N/A.** |

## 4. Path Forward

### Option 1 — Direct Adjustment ✅ selected

Amend UX-DR12 and `DESIGN.md` with a conditional-year rule, then implement it in
one small story.

- **Effort: Low.** `formatFullDate` already exists; the change is which formatter
  the pill calls and under what condition.
- **Risk: Low.** Additive; no token, no new decision, no change to
  `formatHeaderDate` (which the mobile header shares).

### Option 2 — Rollback ❌ not viable

Would mean reverting Story 1.5's date editing. That is an approved acceptance
criterion (FR-3), delivers real user value, and its removal would not fix the
pill — it would only make the defect unreachable again by taking a feature away.

### Option 3 — PRD MVP review ❌ not needed

The MVP is unaffected. No goal, requirement or success criterion is in question;
this is a presentation rule inside an already-approved feature.

### The rule proposed

**Show the year on a due date outside the current year; omit it otherwise.**

Chosen over the two alternatives:

- *Always show the year* would change every pill `d1` draws, widen the pill by
  five characters, and press on the 46 px record at 360 px — a visible cost on
  every row to disambiguate a minority of them.
- *Never show it, rely on Task detail* leaves the scanning surface ambiguous and
  is what we have now.

The conditional rule reproduces `d1` **exactly** for every date `d1` draws, and
adds the year only where ambiguity actually exists.

## 5. Detailed Change Proposals

### 5.1 `epics.md:122` — UX-DR12 (locked; amended by this proposal)

**OLD**

> | UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside
> the current week, `attention` olive past due, and an outlined pill for a date
> later than this week; **no pill at all when there is no due date**, which is
> drawn as an em-dash and **named "No due date" for assistive technology** — the
> glyph is decorative, the word is the accessible content, and neither is a
> focusable control. Four states, exactly as `d1-today.svg` draws them. **Tag
> patch** as a terrain-patch rectangle in `attention-pale` naming its context. |

**NEW** (addition underlined in intent; one sentence inserted before "Four
states")

> | UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside
> the current week, `attention` olive past due, and an outlined pill for a date
> later than this week; **no pill at all when there is no due date**, which is
> drawn as an em-dash and **named "No due date" for assistive technology** — the
> glyph is decorative, the word is the accessible content, and neither is a
> focusable control. **The pill carries the year when, and only when, the due
> date falls outside the current year** — `FRI 20 NOV` this year,
> `FRI 20 NOV 2027` beyond it — because FR-3 lets a user set any date while
> FR-23 never reached past `next week`; `d1-today.svg` draws only in-year dates
> and is silent on this case rather than superseded by it. Four states, exactly
> as `d1-today.svg` draws them. **Tag patch** as a terrain-patch rectangle in
> `attention-pale` naming its context. |

**Rationale.** UX-DR12 is the authority on the pill, so the rule belongs here.
The clause is scoped to content and leaves all four state inks untouched, so
Epic 3's window-ink work is unaffected. It also records why `d1` does not need
redrawing.

### 5.2 `DESIGN.md:83` — the `due-pill` token line (locked; amended)

**OLD**

> `due-pill: "due date in the ink of its window — yellow inside the week, olive past due, outlined beyond it; an em-dash, not a pill, when there is no date"`

**NEW**

> `due-pill: "due date in the ink of its window — yellow inside the week, olive past due, outlined beyond it; an em-dash, not a pill, when there is no date; carries the year only when the date falls outside the current year"`

**Rationale.** Keeps the frontmatter description in step with UX-DR12. One
clause, no token added or changed — the 43-token count and
`tests/unit/theme-tokens.test.ts` are untouched.

### 5.3 ~~New Story 1.9 in Epic 1~~ — superseded by the approver's placement decision

**Not applied.** The approver chose to fold the rule into Epic 3's pill work
instead. Story 3.1 gained AC 11; see §8.2. The proposal below is kept as the
alternative that was considered and declined, because the reasoning for it still
documents what was traded away.

#### The declined alternative

> **Story 1.9: Show the year on a due date that needs one**
>
> As someone planning further out than next week,
> I want a record's due date to tell me which year it is in,
> So that a date years away is not read as one this month.
>
> **Acceptance Criteria:**
>
> 1. **Given** a Task due inside the current year **When** its record renders
>    **Then** the pill reads `WEEKDAY DD MON` with no year, exactly as
>    `d1-today.svg` draws it (UX-DR12).
> 2. **Given** a Task due in any other year **When** its record renders **Then**
>    the pill reads `WEEKDAY DD MON YYYY` (UX-DR12, FR-3).
> 3. **Given** the current year is decided **When** the comparison is made
>    **Then** it is made against the reference date from the Clock port, never a
>    clock read in `core/` or in a component (AD-1, AD-2, NFR-10).
> 4. **Given** `formatHeaderDate` **When** this story is implemented **Then** it
>    is unchanged — the mobile header shares it and carries no year (UX-DR12,
>    Story 1.4's decision).
> 5. **Given** a pill carrying a year at 360 px **When** the record renders
>    **Then** the row is still 46 px and nothing scrolls horizontally (UX-DR6,
>    NFR-4).
> 6. **Given** the four pill states **When** the year rule applies **Then** it
>    applies to all of them identically and changes no state's ink (UX-DR12,
>    UX-DR2).
>
> **Requirements:** FR-3, UX-DR12 · **Prerequisites:** Story 1.5
> **Spine rows:** FR-1–FR-5 Task CRUD

**Rationale for a new story rather than an added AC.** Stories 1.6 (completion)
and 1.7 (deletion) do not touch the pill, so bolting this on would widen a story
past its own subject. It is small and self-contained.

**Rationale for Epic 1 rather than Epic 3.** Epic 3 completes UX-DR12's two
window inks and would be the tidy home — but it is several epics away, and the
defect is live on `main` now. Placing it in Epic 1 keeps the fix near the change
that exposed it. **Alternative, if you prefer:** fold it into Epic 3's pill work
and accept that out-of-year dates read ambiguously until then. Named so you can
choose; §6 asks.

### 5.4 No change proposed

- **PRD** — no conflict found.
- **ARCHITECTURE-SPINE.md** — no conflict found; no new AD required.
- **`d1-today.svg`** and the other mockups — silent on out-of-year dates, not
  contradicted by the rule.
- **`src/`** — no code change in this proposal; Story 1.9 carries it.

## 6. Implementation Handoff

**Scope: Minor.** One clause in each of two locked documents, plus one small
story. No backlog reorganisation, no replan, no PRD or architecture change.

| Recipient | Responsibility |
|---|---|
| **Developer agent** (`bmad-build-auto`) | Implement Story 1.9 against the amended UX-DR12, on a `story/1-9-…` branch, full gate, merge when green. |
| **This workflow** | Apply the two document amendments on approval, and add Story 1.9 to `epics.md` and `sprint-status.yaml` with status `backlog`. |

**Success criteria**

1. UX-DR12 and `DESIGN.md:83` both state the conditional-year rule.
2. `epics.md` carries Story 1.9; `sprint-status.yaml` lists it as `backlog` and
   validates.
3. On implementation: an in-year due date renders exactly as it does today
   (`capture.spec.ts:273, 283, 656` still pass unchanged), an out-of-year one
   carries the year, the 46 px row and horizontal-scroll gates hold at 360 px,
   and `formatHeaderDate` is untouched.

**Open decision for the approver**

- **Where Story 1.9 lands:** Epic 1 now (recommended — the defect is live), or
  folded into Epic 3's pill work (tidier, leaves the ambiguity in place until
  then).

## 7. Checklist Record

| § | Item | Status |
|---|---|---|
| 1.1 | Triggering story identified — Story 1.5, via a `deferred-work.md` entry routed from Story 1.3 | [x] |
| 1.2 | Core problem defined and categorised — a seam between FR-23's horizon and FR-3's freedom | [x] |
| 1.3 | Evidence gathered — eight sources, §2 | [x] |
| 2.1 | Current epic still completable — yes | [x] |
| 2.2 | Epic-level change — one UX-DR12 amendment | [x] |
| 2.3 | Remaining epics reviewed — Epic 3 compatible, inks untouched | [x] |
| 2.4 | No epic invalidated, none new needed | [x] |
| 2.5 | No resequencing | [N/A] |
| 3.1 | PRD checked — no conflict, MVP intact | [x] |
| 3.2 | Architecture checked — no conflict, no new AD | [x] |
| 3.3 | UX checked — DESIGN.md and UX-DR12 amended, mockups silent not superseded | [x] |
| 3.4 | Other artifacts — tests noted; no CI/IaC/monitoring in this product | [x] |
| 4.1 | Option 1 Direct Adjustment — viable, Low/Low | [x] Viable |
| 4.2 | Option 2 Rollback — not viable, would remove an approved AC | [x] Not viable |
| 4.3 | Option 3 MVP review — not needed | [x] Not viable |
| 4.4 | Path selected — Option 1, rationale in §4 | [x] |
| 5.1 | Issue summary written | [x] |
| 5.2 | Epic and artifact impact documented | [x] |
| 5.3 | Recommended path with rationale and alternatives | [x] |
| 5.4 | MVP impact stated (none) and action plan outlined | [x] |
| 5.5 | Handoff plan established | [x] |
| 6.1 | Checklist reviewed | [x] |
| 6.2 | Proposal reviewed for accuracy | [x] |
| 6.3 | User approval | [!] pending |
| 6.4 | `sprint-status.yaml` updated with Story 1.9 | [!] on approval |
| 6.5 | Next steps confirmed | [!] on approval |

---

## 8. Approval and Application Record

**Approved 2026-11-27 by Shyam.** Placement: **folded into Epic 3's pill work**,
declining the new Story 1.9 in Epic 1.

**The accepted consequence, stated plainly:** a record shows no year on an
out-of-year due date until Epic 3 is reached. A user can set a date in 2030
today and the record will read `WED 20 NOV`. Nothing is lost — the date is
stored correctly and Task detail shows it in full — but the scanning surface
stays ambiguous for the whole of Epic 2. This is recorded in UX-DR12 itself, so
it cannot be rediscovered as a defect.

### 8.1 Applied — `UX-DR12` (`epics.md:122`)

The conditional-year clause from §5.1, plus one sentence the placement decision
required: that the rule lands with the window inks in Epic 3 (Story 3.1) and a
record shows no year until then, naming this proposal as the record.

### 8.2 Applied — Story 3.1 gains AC 11 (`epics.md:636`)

> 11. **Given** a Task due outside the current year **When** its record renders
> **Then** the due pill carries the year — `FRI 20 NOV 2027` — and a Task due
> inside the current year renders without one, exactly as `d1-today.svg` draws
> it **And** the comparison is made against the reference date from the Clock
> port, never a clock read in `core/` or a component **And**
> `formatHeaderDate` is unchanged, because the mobile header shares it and
> carries no year **And** the rule applies identically to all four pill states
> and changes no state's ink (UX-DR12, FR-3, AD-1, AD-2, NFR-10).

Story 3.1's **Requirements** line gained `FR-3` and `UX-DR12`; its
**Prerequisites** gained Story 1.5, which is what makes the rule necessary.

Story 3.1 is the right home: it already computes `isDueThisWeek` and `isPastDue`,
the window predicates the pill's four inks derive from, so the year rule and the
inks land in one place against one set of tests.

### 8.3 Applied — `DESIGN.md:83`

The `due-pill` frontmatter description gained the conditional-year clause
verbatim from §5.2. No token was added or changed: `tests/unit/theme-tokens.test.ts`
still passes, which is the mechanical proof that the 43-token set and its
counts are untouched.

### 8.4 Applied — `deferred-work.md`

A `RE-ROUTED 2026-11-27` entry appended, moving the item from Story 1.5 to
Story 3.1 and citing this proposal. **Appended, not edited** — the file's header
says entries are never edited, and whether that rule survives an earlier
`RESOLVED` edit is an open question this correction deliberately does not settle.

### 8.5 Not applied, by analysis

| Artifact | Why not |
|---|---|
| `prd.md` | No conflict found. FR-2 and FR-3 do not govern pill formatting; the MVP is unaffected. |
| `ARCHITECTURE-SPINE.md` | No conflict found and no new AD required. `formatFullDate` already exists in `core/localdate.ts` from Story 1.4. |
| `sprint-status.yaml` | **No change needed.** No story was added or removed — Story 3.1 already exists and is `backlog`. Validated with `sprint_plan.py validate` → `valid: true`. Checklist item 6.4 is therefore N/A rather than done. |
| `d1-today.svg` and the other mockups | Silent on out-of-year dates rather than contradicted. No redraw. |
| `src/` | No code change. Story 3.1 carries the implementation. |

### 8.6 Checklist closure

| § | Item | Status |
|---|---|---|
| 6.3 | Explicit user approval obtained | [x] Approved 2026-11-27 |
| 6.4 | `sprint-status.yaml` updated | [N/A] no story added or removed; file validated |
| 6.5 | Next steps and handoff confirmed | [x] §8.7 |

### 8.7 Handoff

**Scope: Minor** — two locked-document clauses and one acceptance criterion. No
backlog reorganisation, no replan.

- **Now:** nothing to implement. Epic 1 continues with Story 1.6, unaffected by
  this correction.
- **At Epic 3:** `bmad-build-auto` implements Story 3.1 including AC 11. The
  implementation needs no new decision — `formatFullDate(date, labels.dates)`
  already produces `FRI 20 NOV 2027`, and the reference date reaches the record
  through the same prop Today already passes.
- **Watch for, at implementation:** the three tests asserting `FRI 20 NOV`
  exactly (`capture.spec.ts:273, 283, 656`) seed in-year dates and must still
  pass unchanged — if any of them starts failing, the condition has been
  implemented as "always show the year" rather than "only outside this year".
  And the 46 px row plus the horizontal-scroll gate at 360 px must hold with
  five more characters in the pill.
