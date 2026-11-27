---
title: 'Story 1.5 — Edit any field of a Task'
type: 'feature'
created: '2026-11-27'
status: 'done'
review_loop_iteration: 0
baseline_revision: '00252acbf2f649625196a66f48f6fdf06edcdd11'
followup_review_recommended: true
context: ['{project-root}/.docs/implementation-artifacts/epic-1-context.md']
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Task detail reads but cannot write. Every field PRD §3 defines is visible as of
Story 1.4 and none of them can be changed, so a plan that shifts has to be re-captured as a new
Task — the list goes stale rather than staying true.

**Approach:** Make each of the six Tier 1 fields a native control in its existing row on Task
detail, committing through one new named store action that merges a single field by id. No new
surface, no new route, no engine.

## Decisions

**The fields are live native controls, not a click-to-edit mode with Apply.** EXPERIENCE.md's
`Edit` primitive ("open a standard control in place, `Apply` writes your value rather than the
proposal") belongs to the course panel: it exists to choose between a proposal and your own value,
and there is no proposal here. AC 2 settles it independently — "persists on blur or a debounce"
describes a field the user types in and leaves, which an `Apply` button would make meaningless. No
approved frame draws Task-detail editing, so the shape follows AC 2 and AD-17 rather than a frame.

**A blank task text is not committed.** `validateTask` rejects a Task whose `text` is
whitespace-only, so storing one would make the whole document unreadable on next load. The field
reverts to the stored value instead — the same rule `captureTask` already applies, where `trim`
decides *whether* to write and never *what* to write. The other five fields clear to `null` or `[]`
normally.

## Boundaries & Constraints

**Always:**
- One new action on the store, named for what it does, merging one field of one Task by id. The
  store stays the only writer (AD-6); no component writes storage.
- The stored value is the user's, byte for byte (AC 4, FR-23): no trim, no case change, no
  paraphrase. `trim` may decide whether to commit, never what is committed.
- Free-text fields commit on blur. Discrete controls (date, Priority) commit on change — that is
  one deliberate act, not a keystroke. Nothing commits per keystroke (AC 2).
- A pending edit also commits when the surface unmounts, so leaving by Back does not silently
  discard what was typed.
- `Priority` stays exactly `high`, `medium` or `low`, lowercase, and still renders through the
  existing `PriorityLadder` beside its word (AC 5, UX-DR20).
- The due date round-trips `LocalDate` (`YYYY-MM-DD`) with no reformatting between the control and
  the document.
- Every display string comes from `src/ui/labels.ts` (AD-9), including each field's accessible name.
- Each control is native and focusable with a visible `outline` focus ring from the ink token
  (AD-17), at a target no smaller than 24 px.
- `src/core/**` stays pure: no part of editing may read the DOM, a clock or storage (AD-1).

**Never:**
- No `Apply`, `Cancel` or per-field undo — Epic 2's control idiom, and undo is one step back from a
  *punch*, which does not exist here.
- No Suggestion Engine, no network, no re-proposal: not on a text edit, not on reload, not on
  navigation (AC 3, FR-3, AD-15). Nothing to switch off yet, and nothing may be added.
- No `Project` field (AC 6, Tier 3, Epic 8).
- No completion, un-completion or deletion — Stories 1.6 and 1.7.
- No validation message, no error state, no "saved" confirmation. The app has no error state here
  and does not claim it was right (UX-DR21, UX-DR22).
- No re-ordering of Today on edit; newest-first is a capture order, not a modified order.
- No new design token, no purple, no change to `formatHeaderDate`.
- No second route and no edit surface of its own: the rows that exist become editable in place.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Edit task text | type into the text field, blur | stored verbatim; record's sentence follows | N/A |
| Edit notes / Summary | type, blur | that field stored; the others unchanged | N/A |
| Typing, not yet blurred | keystrokes only | nothing written to storage yet | N/A |
| Leave mid-edit | type, then press Back | the typed value is committed, not lost | N/A |
| Blank task text | clear the text field, blur | not committed; field shows the stored text again | document stays readable |
| Blank notes / Summary | clear, blur | stored as `null`; row names the absence | N/A |
| Edit Tags | `school, group` | `['school', 'group']`; row renders them joined | N/A |
| Clear Tags | empty the Tags field | `[]`; row names the absence | N/A |
| Set Priority | choose `high` | stored lowercase; ladder and word both change | N/A |
| Set due date | pick 2026-11-20 | stored `2026-11-20`; record's pill follows | N/A |
| Clear due date | empty the date control | `null`; pill shows the em-dash treatment | N/A |
| Any edit, then reload | reload after each | every edited value survives | N/A |
| Any edit | any field | no network request of any kind | N/A |
| Whitespace-only text | `"   "` in the text field | not committed, exactly as a blank is | document stays readable |
| Task detail, both widths | 360 / 1280 px | `axe-core` clean, no horizontal scroll | N/A |

## Acceptance Criteria

The six acceptance criteria, from `epics.md`:

1. **Given** Task detail **When** I change task text, due date, notes, Tags, Priority or Summary
   **Then** that field changes alone, the others keep their values, and the change survives a
   reload (FR-3).
2. **Given** a free-text field **When** I type **Then** the change persists on blur or a debounce,
   never per keystroke (AD-6, conventions).
3. **Given** any edit **When** it is applied **Then** nothing re-runs any Suggestion Engine — not an
   edit to task text, not a reload, not navigation (FR-3, AD-15).
4. **Given** the user's own sentence **When** anything in the app displays it **Then** it is quoted
   unchanged, never rewritten or paraphrased (FR-23, UX-DR18).
5. **Given** Priority **When** it is set **Then** it is exactly one of `high`, `medium`, `low`,
   lowercase, with `medium` the default **And** it renders as the bar ladder beside its word, never
   as colour alone (conventions, UX-DR10, UX-DR20).
6. **Given** the Project field **When** this story is implemented **Then** it is absent — it is
   Tier 3 and arrives in Epic 8 as an optional property no Tier 1 selector reads (§6.3, AD-10).

</intent-contract>

## Code Map

**Reuse as-is — do not change:**
- `src/core/task.ts` — `Task`'s eight fields, `validateTask` (rejects whitespace-only `text`, admits
  any other string, so a blank `summary`/`notes` is admissible data), `isPriority`, `PRIORITIES`
  (the three in order, for rendering the choices without respelling them).
- `src/ui/components/PriorityLadder.tsx:49` — `{ priority }` in, ladder plus word out. AC 5 is
  satisfied by keeping this rendered, not by replacing it.
- `src/core/localdate.ts` — `isLocalDate` validates what a date control hands back; `formatFullDate`
  already renders the row. No new formatter.
- `src/ui/today/Capture.tsx:104-128` — the field precedent: `h-field-height-max`,
  `border-ink-secondary bg-surface`, `outline-offset-2 outline-ink focus-visible:outline-2`. Reuse
  these classes rather than inventing a second field style.

**Changed by this story:**
- `src/app/store.tsx` — `Action` is one member (`task/created`); its own comment reserves a separate
  action for editing. Add it, plus the hook that dispatches it. `reduce` (L72) maps over `tasks` and
  replaces the one with the matching id; `createPersistingReducer` (L100) already writes whenever
  `next.tasks !== state.tasks`, so persistence needs no change. **This file is on `CAPTURE_PATH`**
  (`tests/unit/store.test.ts:287`) — no `async`, no `Promise`, no timer may appear in it.
- `src/ui/task-detail/TaskDetail.tsx` — the seven rows exist and read `task.*` directly. Six `dd`s
  become native controls; `COMPLETED` stays read-only (Story 1.6 owns it). `presentText` and
  `presentTags` already treat a blank string as an absence and stay the display rule.
- `src/ui/labels.ts` — add each control's accessible name and the Priority choice words in the
  existing `taskDetail` block. `taskDetail.priority` already holds the three lowercase words for
  display; the editor reuses them.
- `tests/unit/store.test.ts` — `reduce` tests per action; add the edit action's, including that a
  merge touches one field and one Task. Extend `CAPTURE_PATH` only if a new file joins it.
- `tests/e2e/task-detail.spec.ts` — the matrix above, at both widths. `tests/e2e/helpers.ts` already
  has `seed`, `taskDocument`, `fixtureTask`, `storedItems` and `expectNoHorizontalScroll`.

**Gates that fail loudly if disturbed:** `tests/unit/store.test.ts` sweeps all of `src/` for a
second storage writer and for the `todo.tasks.v1` key — an edit that wrote storage from a component
fails there, not in review. `tests/e2e/capture.spec.ts:902` asserts the record carries exactly one
control; an editable field placed on the record would break it. `axe-core` runs un-tagged at both
widths, so every new control needs an accessible name — but **not** a 24 px
target: axe-core 4.14 ships `target-size` with `enabled: false`, so a green
accessibility run says nothing about size. Measure each control instead. Console silence is
asserted on the built artifact — a React controlled-input warning fails the gate.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/store.tsx` -- add the named edit action, its reducer case (merge one field of one Task
      by id) and the dispatching hook; keep the file free of `async`/`Promise`/timers -- AC 1, AD-6
- [ ] `src/ui/labels.ts` -- accessible names for the six controls, in the existing per-surface idiom
      -- AC 1, AD-9
- [ ] `src/ui/task-detail/TaskDetail.tsx` -- six rows become native controls committing on blur
      (free text) or change (date, Priority); blank text reverts; a pending edit commits on unmount;
      `PriorityLadder` stays rendered -- AC 1, AC 2, AC 4, AC 5, AD-17
- [ ] `tests/unit/store.test.ts` -- the edit action: one field changes, the others and the other
      Tasks do not; the write goes through the reducer -- AC 1, NFR-10
- [ ] `tests/e2e/task-detail.spec.ts` -- every matrix row at both widths, including no-write-per-
      keystroke, commit-on-unmount, blank-text revert, reload survival, no network, and `axe-core`
      clean -- AC 1, AC 2, AC 3, AC 6

**Acceptance Criteria:** the six above, verbatim from `epics.md`.

## Spec Change Log

## Review Triage Log

### 2026-11-27 - Review pass

- verdicts: 12 findings - high 2, medium 1, low 9, false 0, maybe-false 0
  (all 12 patched; none deferred, none rejected)
- layers: one focused reviewer (FAST MODE), verifying against the built artifact
- findings:
  - `[high]` `[patch]` F1 - the due-date control committed on `change`, which a native
    date input fires once per digit of the year: measured writes of `0002-12-24`,
    `0020-12-24`, `0202-12-24` before `2027-12-24` for one entry, each a real date
    `isLocalDate` accepts and the due pill then shows. Directly violates AC 2 ("never per
    keystroke") and the matrix's "typing, not yet blurred" row. Fixed: the date commits on
    blur through the same draft machinery as every other field.
  - `[high]` `[patch]` F2 - one Backspace destroyed a stored due date. Chromium empties the
    whole value when a segment is deleted, so the change handler committed `dueDate: null`
    on the spot, with no undo (the Never list forbids per-field undo). Fixed by the same
    move to blur: a half-cleared control is no longer a decision to clear.
  - `[medium]` `[patch]` F3 - draft/commit desync and an unbounded extra whole-document
    write per blur. `flush` compared the draft with `stored`, but a field whose stored form
    differs from what was typed (three spaces stored as `null`, `" a , b "` stored as two
    Tags) left the control displaying a value the document did not hold and re-committed it
    on every later blur. Fixed: `commit` returns the canonical stored form and the control
    settles on it.
  - `[low]` `[patch]` T1 - "keeps the drafts of two Tasks apart" could not fail for the
    defect it named: the per-route boundary key in `src/main.tsx` remounts the surface, so
    the adjust-state-during-render resync it claimed to guard was never exercised - the
    reviewer deleted that block and all 165 tests still passed. Fixed by removing the dead
    resync (the keyed boundary makes it unreachable) and re-pointing the test's comment at
    what it actually guards: the boundary key.
  - `[low]` `[patch]` T2 - the "document is still readable after a reload" assertion could
    not fail, because `seed` re-runs its init script on every navigation and restores the
    seeded bytes. Removed; reload survival is established by the captured-Task test.
  - `[low]` `[patch]` T3 - the `start-triangle[data-open="true"]` assertion was
    structurally unfailable (`Record.tsx` hard-codes `false`). Replaced with a whole-document
    equality check that one field moved and no engine wrote Tags, Priority or a Summary.
  - `[low]` `[patch]` T4 - no test drove the date control with a keyboard, which is why F1
    and F2 survived a green suite. Added one that types a date digit by digit and asserts
    nothing is written mid-entry, plus one for the Backspace case.
  - `[low]` `[patch]` B1 - the 24 px pointer-target floor was not met: measured 23 px on the
    date and Tags inputs and 21 px on the select, against AD-17's floor with no spacing
    exception. The spec's claim that axe-core would catch this was false - `target-size`
    ships `enabled: false` in axe-core 4.14, verified via `axe.getRules()`. Fixed with the
    capture field's height token, and a test now measures every control.
  - `[low]` `[patch]` B2 - `${CONTROL} w-auto` was inert because `w-full` sat inside
    `CONTROL`, so the select spanned the row and the ladder wrapped 31 px below it rather
    than sitting beside it as the Design Note says. Fixed by moving width out of the shared
    class, with a test asserting the two share a line.
  - `[low]` `[patch]` B3 - the `FieldEdit` doc comment claimed a two-key object satisfies no
    member of the union. It compiles: TypeScript checks excess properties against the union
    of all constituents' keys. Comment corrected to state that one field per action is a
    convention the call sites keep.
  - `[low]` `[patch]` B4 - `taskDetail.noDueDate` became an orphan: a native date control
    takes no placeholder, so the words had nowhere to be displayed. Removed, with the reason
    recorded where the other absence wordings live.
  - `[low]` `[patch]` The reviewer's own count of the gate was confirmed: `tsc`, `eslint`,
    287 unit tests and 165 e2e tests were all green while F1, F2, F3 and B1 were live. That
    is the finding behind the four new gates, and three of them were checked for teeth by
    reintroducing the defect they guard.


## Auto Run Result

Status: done
Branch: `story/1-5-edit-any-field-of-a-task`, from `00252ac` (merged `main`).

### What was implemented

All six acceptance criteria. Task detail's six Tier 1 fields became native
controls in place, writing through one new named store action that merges a
single field by id. No new surface, no new route, no engine, no dependency —
`package.json` is untouched.

### Files changed

- `src/app/store.tsx` — `task/field-edited`, carrying an id and a one-key patch;
  the reducer merges into the Task as it is now and returns identical state for
  an id no Task carries. Still free of `async`, `Promise` and timers.
- `src/ui/task-detail/TaskDetail.tsx` — six rows become controls; one draft
  hook commits on blur and on unmount, settling on the canonical stored form.
- `src/ui/labels.ts` — the six controls' accessible names; `noDueDate` removed
  as an orphan.
- `tests/unit/store.test.ts` — eight cases for the new action.
- `tests/e2e/task-detail.spec.ts` — seventeen editing cases, plus ten of
  Story 1.4's assertions re-pointed at the controls that now carry the values.
- `tests/e2e/helpers.ts` — `seed`'s init-script re-seeding trap documented.

### Review findings

One focused reviewer (FAST MODE). 12 findings, all patched, none deferred and
none rejected — every row is in the triage log above. Two were `high` and both
were in shipped code: the due-date control wrote the document once per digit of
the year, leaving real-but-wrong dates like `0002-12-24` behind, and a single
Backspace destroyed a stored date outright. One was `medium`: a field whose
stored form differed from what was typed went on displaying the typed value and
re-committed it on every later blur.

The rest were tests that could not fail and two unmet constraints — most
notably the 24 px pointer-target floor, which the spec wrongly expected
`axe-core` to enforce. `target-size` ships `enabled: false`, so the green
accessibility run was no evidence; the controls measured 21–23 px. The spec's
Code Map has been corrected on that point.

### Verification

- `npm run typecheck` — exit 0
- `npm run lint` — exit 0, eslint and the hex scanner
- `npm test` — **287** tests, 14 files
- `npm run build` — exit 0
- `npm run test:e2e` — **173** tests across `mobile-360`, `desktop-1280` and
  `dev-server`; `axe-core` clean, no console output on the built artifact
- `node scripts/check-bundle-key.mjs dist` — exit 0

All 15 I/O matrix rows have a covering test that ran. Four of the new gates were
checked for teeth by reintroducing the defect they guard — the per-keystroke
date write, the Backspace clear, the 24 px floor and the ladder's position —
and each failed before passing again.

### Residual risks

- **A date typed and abandoned still commits on blur.** Leaving a half-typed
  date blurs an empty control, which stores `null`. That is indistinguishable
  from a deliberate clear, and with no per-field undo the previous date is gone.
  The alternative — refusing an empty value — would make clearing a date
  impossible. Worth a human decision if it bites.
- **No `min`/`max` on the date control**, so a year like `0002` is still
  storable deliberately. The per-keystroke path that produced them by accident
  is closed; bounding the range is a product decision this story does not own.
- Task detail's typography remains asserted by no test, carried over from
  Story 1.4.

### Follow-up review recommendation

`true`. Two `high` entries were patched on a first pass, which is the threshold
on its own. The specific unverified risk is the first item above: the
blur-commits-empty behaviour is correct per AC 2 and is now tested, but whether
it is the *right* product behaviour for an abandoned date entry has not been
decided by anyone.


## Design Notes

**Why a native `input type="date"` for the due date.** `LocalDate` is `YYYY-MM-DD`, which is exactly
that control's value format, so the field round-trips the stored string with no parsing and no
formatter — and clearing it yields `''`, which maps to `null`. DESIGN.md sanctions this explicitly:
the world "never overrides a standard control's shape". It is also the only option that gives a date
picker without a dependency.

**Why Priority is a `select` and not the m4 segmented control.** `m4` draws LOW / MEDIUM / HIGH as
segmented choices, but that is the *course* editor — purple, with Apply, inside a control block that
Epic 2 owns. A native `select` is the standard control for one-of-three, and AC 5 is about what is
*rendered*: the ladder and the word stay, so no state rides on colour alone.

**The merge must read current state, not a captured Task.** The reducer receives the id and the one
changed field, never a whole `Task` assembled in the component — that is the AD-6 shape: a component
holding a `Task` across an edit would write back the fields as they were when the surface rendered,
undoing a concurrent change. One field, by id, merged in the reducer.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm run lint` -- expected: exit 0, eslint and the hex scanner
- `npm test` -- expected: the new store cases pass alongside the existing suites
- `npm run build && npm run test:e2e` -- expected: every matrix row passes at 360 px and 1280 px;
  `axe-core` clean on Task detail; no console output on the built artifact
- `node scripts/check-bundle-key.mjs dist` -- expected: exit 0

**Manual checks:**
- Type into notes, press Back without blurring: the note is there on return.
- Clear the task text and blur: the sentence comes back rather than vanishing.
- Set Priority to high: the ladder fills to three and the word reads `high`.
