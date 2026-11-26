---
title: 'Story 1.2 — Create a Task from one sentence'
type: 'feature'
created: '2026-11-25'
status: 'done'
route: 'dispatch'
baseline_commit: 'ee904194840f8e29c5bfa6375c73f6a5d4acf884'
review_loop_iteration: 0
context: ['{project-root}/.docs/implementation-artifacts/epic-1-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.1 delivered a running app with one inert surface. Nothing can be typed, nothing
is stored, and no Task exists anywhere in the codebase. FR-1 — one typed sentence becomes a Task — is
the product's entire claim, and none of it is built.

**Approach:** Build the capture-to-persistence spine in one slice: the `Task` shape in `core`, a
synchronous Storage port with its `localStorage` adapter, the Id port, and the single store that is
the only writer. The first run surface gains the capture field it was always drawn with, and once a
Task exists Today renders it as a record in the locked design system.

## Boundaries & Constraints

**Always:**
- AD-6's persistence rules, exactly. `src/adapters/local-storage.ts` is the only file that names a
  storage key; the task document lives under `todo.tasks.v1` and carries `schemaVersion`, which only
  the adapter reads or writes. The reducer in `src/app/store.tsx` is the single writer — no other
  module writes storage. Every mutation is a named action.
- Storage operations return a result and **never throw**. If `localStorage` is unavailable or over
  quota, the app stays fully usable in memory for the session and **capture says nothing about it** —
  Settings is the only place a failure is ever visible, and Settings is Epic 5.
- A stored document that fails validation is **never discarded**: the raw string is preserved under a
  backup key and the app starts empty. An absent, unreadable or unmigratable document resolves
  through one named defaults factory, never a call-site fallback.
- Task ids come from the Id port. `core/` generates no identifier (AD-1), and the store receives the
  port rather than reaching for it. Adapters are constructed only in `src/main.tsx`.
- The Task carries exactly PRD §3's fields: task text (the only required one), `dueDate`, notes,
  Tags, Priority, Summary, `completedAt`. Priority is lowercase `'high' | 'medium' | 'low'` and a new
  Task is `medium` with no Tags and no Summary. Dates are `LocalDate` only — there are no instants in
  the domain, and there is no `completed` or `archived` boolean, ever (AD-2, AD-7).
- FR-8's limit is mechanical: **no `await` between submit and the record appearing**, and
  create-to-visible stays under 100 ms, asserted with a port-level fake engine against a
  Fixture-sized document.
- Every user-visible string comes from `src/ui/labels.ts`. The placeholder and the button label
  differ by viewport, as drawn: `Type a task the way you say it` / `ADD` at 360 px, and
  `Type a task the way you say it out loud` / `ADD TASK` at 1280 px.
- The record is UX-DR6's anatomy at a 46 px pitch: 12 px checkbox, the sentence in Archivo, the tag
  patch area, the priority ladder **beside its word**, the due pill area, and the start triangle slot
  at the right edge. The ladder fills to its level — `medium` is bars one and two solid `ink` with
  bar three outlined in `rule`.
- `core/` purity (AD-1), no `console`, WCAG 2.2 AA as a floor, and both bound widths with no
  horizontal scroll.

**Never:**
- No band grouping and no Smart List predicates — Today renders one flat list of records this story.
  Bands and the three derived lists are Epic 3; `core/selectors.ts` is Story 1.4's.
- The checkbox and the sentence **render but do not act**. Story 1.6 wires completion, Story 1.4 the
  sentence and Task detail. Nothing renders as a native control that does nothing (AD-17), following
  Story 1.1's precedent for the inert Today destination.
- The start triangle slot renders and is always false — Epic 2 wires it.
- Out of scope, owned elsewhere: date-word parsing (1.3), hash routing and Task detail (1.4), editing
  (1.5), completion (1.6), deletion (1.7), the PWA (1.8), every Suggestion concern (Epic 2), the
  Settings surface (Epic 5).
- No error state in capture. Ever. No validation message, no red, nothing on an empty submit.
- No change to `engines`, `.npmrc`, `.nvmrc`, the five CI checks, or `src/ui/theme.css`'s 43 tokens.
- No edit to the five locked planning documents, and no renegotiation of Story 1.1's frozen text.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Capture a sentence | `Submit assignment in IBE160` | Task created with that text verbatim, `medium`, no Tags, no Summary, `dueDate` and `completedAt` null; field clears; record appears | N/A |
| Whitespace-only submit | `   ` | Nothing is created, the field keeps focus, nothing is said | Silent — capture has no error state |
| Text is never rewritten | any sentence | The stored text is byte-identical to what was typed | N/A |
| Reload the page | one Task stored | The Task is still there with every field intact | N/A |
| Close and reopen the browser | one Task stored | Same — the document survives a session boundary | N/A |
| Write fails on quota | `setItem` throws | The Task stays in memory and on screen for the session | A result, never a throw; capture stays silent |
| `localStorage` absent | the API is unavailable | The app is fully usable in memory for the session | Same |
| Stored document invalid | malformed JSON or wrong shape | Raw string preserved under the backup key, app starts empty, document not discarded | Never discarded, never thrown |
| Document absent | first run on a clean clone | The defaults factory supplies an empty document carrying `schemaVersion` | N/A |
| Zero Tasks | nothing captured yet | The first run surface renders, now carrying its capture field | N/A |
| Create-to-visible | Fixture-sized document, fake engine | Under 100 ms, with no `await` between submit and render | N/A |
| Both widths | 360 px and 1280 px | No horizontal scroll, `axe-core` reports no violations | N/A |

## Decisions

Taken at CHECKPOINT 1, 2026-11-25:

- **First run is count-based.** Zero Tasks renders the first run surface; one or more renders the
  populated Today. No persisted flag, so `schemaVersion` is not shaped around one. The accepted
  consequence is that deleting the last Task brings the first run surface back, which sits in tension
  with UX-DR22's claim that first run is the product's only empty state — **Story 1.7, which owns
  deletion, is where that surfaces**, and it should either accept it or raise it through
  `bmad-correct-course`. Recorded rather than resolved here because this story cannot delete a Task.
- **Each frame is followed as drawn.** This story renders `m1`'s meta line —
  `REFERENCE DATE <date>` on the left, `<n> ON FILE` on the right — and leaves the first run
  surface's shipped `NOTHING ON FILE YET` / `0 TASKS` untouched. Story 1.1's `labels.ts` and its
  passing end-to-end assertions are not disturbed. The accepted cost is two wordings for one idea;
  unifying them is a `DESIGN.md` question, not a code one.
- **Spec size.** Kept whole at roughly 3,600 tokens rather than split at the persistence seam. The
  two halves that seam would produce are not independently shippable — the spine renders nothing and
  the UI is inert without it — and the SCOPE STANDARD rules out splitting cross-layer detail inside
  one user goal. The Code Map is explicit so the implementation never re-investigates.
</frozen-after-approval>

## Code Map

Everything from Story 1.1 is on `main` at `454fc36` and is reused, not rebuilt.

**Reuse as-is — do not change:**
- `src/core/localdate.ts` — `LocalDate`, `isLocalDate`, `localDateParts`, `formatHeaderDate`. Pure,
  zero imports. The Task's date fields are this type.
- `src/ports/clock.ts`, `src/adapters/system-clock.ts` — `Clock.today()`. The only clock read in the
  repository; the new Storage and Id ports follow its exact shape.
- `src/ui/shell/Shell.tsx` — takes `today` and children, renders the 40 px header, the 46 px tab bar
  at 360 px and the 196 px rail at 1280 px. Today is the one destination and stays inert here.
- `src/ui/theme.css` — all 43 tokens. A raw hex anywhere else fails `npm run lint`. Add no token.
- `src/ui/labels.ts` — extend the existing `labels` object; invent no string elsewhere.
- `src/ui/components/ErrorBoundary.tsx` — reuse as-is.
- `src/main.tsx` — **changed by this story**, not reused unchanged: it is the one composition root, so
  the Storage and Id adapters are constructed here beside the Clock and the tree is wrapped in the
  store provider. (Corrected 2026-11-26: this line sat under "Reuse as-is — do not change" while an
  execution task required the change. Review found it; triage may not fix a finding by editing its own
  spec, so it is corrected here by hand for Story 1.3's continuity read.)
- `eslint.config.js` — the `src/core/**` override already bans the whole AD-1 list, `globalThis` and
  `self` included. New `core` modules inherit it with no config change.

**New, with its documented home:**
- `src/core/task.ts` — the `Task` type and the persisted document shape, plus the validator. Pure.
- `src/core/constants.ts` — the documented home for core constants. This story adds only `TASK_SCHEMA_VERSION`;
  the retention default belongs to the story that first reads it (Epic 3's Archive), not here. (Corrected
  2026-11-26: the original line called this "the retention default's documented home", which the file
  deliberately does not carry.)
- `src/ports/storage.ts`, `src/adapters/local-storage.ts` — the synchronous port and the only file
  naming a key.
- `src/ports/id.ts`, `src/adapters/id.ts` — `crypto.randomUUID()` with AD-11's non-secure-context
  fallback; tests inject a counter.
- `src/app/store.tsx` — `useReducer` plus context; the single writer.
- `src/ui/today/` — the capture field and the Today work area. **The capture field belongs here, not
  in the shell**: the frames carry it only on Today and the review surfaces that embed Today's work
  area, and EXPERIENCE.md's IA names it under Today. The Structural Seed's `shell/` entry listing a
  capture field is a duplicated, self-inconsistent line and is the weaker source.
- `src/ui/components/Record.tsx`, `PriorityLadder.tsx` — the record and its ladder, per DESIGN.md's
  named component list.

**Authority for values:** `DESIGN.md` frontmatter for every token and geometry — and where it and a
frame disagree, it wins and the frame is the defect. `m1-today.svg` and `m9-first-run.svg` for the
capture field and record measurements; `epics.md` for the seven acceptance criteria.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/task.ts` -- the `Task` type (text, `dueDate`, notes, tags, priority, summary,
      `completedAt`, id), the persisted document shape with `schemaVersion`, a total validator, and
      the named defaults factory -- PRD §3, AD-6, AD-7
- [x] `src/ports/storage.ts` -- the synchronous port returning a result that never throws -- AD-6
- [x] `src/adapters/local-storage.ts` -- the only file naming `todo.tasks.v1`; reads, validates and
      migrates on read, preserves an invalid document under the backup key, survives an absent or
      quota-exceeded `localStorage` -- AD-6
- [x] `src/ports/id.ts`, `src/adapters/id.ts` -- `newId()`, `crypto.randomUUID()` with the
      non-secure-context fallback -- AD-11, conventions
- [x] `src/app/store.tsx` -- `useReducer` and context, named actions, the single writer; persists the
      whole document per mutation with no `await` on the capture path -- AD-6, NFR-1
- [x] `src/ui/labels.ts` -- the capture placeholder and button per viewport, the meta line, and the
      priority words -- AD-9, UX-DR18
- [x] `src/ui/today/Capture.tsx` -- a native form so Enter submits; clears on submit; whitespace-only
      submit is silently ignored -- FR-1, AD-17, UX-DR22
- [x] `src/ui/today/Today.tsx` -- the work area: capture field, meta line, then one flat list of
      records; renders the first run surface when there are none -- FR-1, UX-DR15
- [x] `src/ui/components/Record.tsx`, `src/ui/components/PriorityLadder.tsx` -- the 46 px anatomy and
      the three-bar ladder beside its word -- UX-DR6, UX-DR10, UX-DR12
- [x] `src/ui/first-run/FirstRun.tsx` -- add the capture field the `m9` frame has always carried,
      leaving its existing copy untouched -- AC 2 of Story 1.1, `m9`
- [x] `src/main.tsx` -- construct the Storage and Id adapters beside the Clock and wrap the tree in
      the store provider -- AD-6, conventions
- [x] `tests/unit/task.test.ts` -- the validator and the defaults factory against every matrix row
      that does not need a browser -- AD-6
- [x] `tests/unit/store.test.ts` -- each named action, the single-writer rule, and the in-memory
      fallback when storage fails -- AD-6
- [x] `tests/unit/local-storage.test.ts` -- round-trip, the backup key on invalid input, absent and
      quota-exceeded storage, all against an injected fake -- AD-6
- [x] `tests/e2e/capture.spec.ts` -- capture, field clears, record appears, survives reload, the
      100 ms budget with a fake engine, and `axe-core` plus no horizontal scroll at both widths --
      FR-1, FR-8, NFR-1, NFR-4

**Acceptance Criteria:**

The seven acceptance criteria, from `epics.md`:

1. **Given** the capture field on Today **When** I type task text and submit **Then** a Task is
   created with that text, Priority `medium`, no Tags and no Summary **And** the field clears **And**
   the record appears in the list (FR-1).
2. **Given** a submitted Task **When** create-to-visible is measured by a Playwright check against a
   Fixture-sized document **Then** it stays under 100 ms **And** no network request is made (FR-8's
   limit, NFR-1).
3. **Given** a created Task **When** I reload the page, and when I close and reopen the browser
   **Then** the Task is still there with every field intact (FR-1).
4. **Given** any mutation **When** it is applied **Then** it is a named action on the single store in
   `src/app/store.tsx`, the reducer is the only writer to storage, and the only key written is
   `todo.tasks.v1` carrying its `schemaVersion` (AD-6).
5. **Given** `localStorage` is unavailable or over quota **When** a Task is created **Then** the app
   stays fully usable in memory for the session **And** nothing in capture shows an error (AD-6).
6. **Given** a stored document that fails validation on read **When** the app starts **Then** the raw
   string is preserved under a backup key, the app starts empty, and the document is not discarded
   (AD-6).
7. **Given** a record on screen **When** it renders **Then** it carries the checkbox, the sentence in
   Archivo, the tag patch area, the priority ladder beside its word, the due pill area and the start
   triangle slot, at 46 px on mobile (UX-DR6, UX-DR10, UX-DR12).

## Implementation Notes

Five judgement calls the Code Map did not pre-decide. None of them changes a frozen line.

**The capture row takes `field-height-max` at both widths, including its button.** `m1` draws the
field and the `ADD` button both 30 px; `d1` draws both 32 px. 30 px is inside DESIGN.md's
`field-height` range but is not a declared value, and DESIGN.md is the authority on geometry — so
32 px, the declared end of the range, is used at both widths. The button takes the same height
rather than `button-height-max` (26 px): both frames draw the pair as one row, and a submit button
4–6 px shorter than the field it submits reads as a defect. `button-height` governs standalone
buttons. Still ≥24 px, so SC 2.5.8 is unaffected.

**The capture field is rendered by `FirstRun`, not by `Today`, when there are no Tasks.** The two
execution lines ("Today: capture field, meta line, records … renders the first run surface when
there are none" and "FirstRun: add the capture field `m9` has always carried") would duplicate the
field if read as two independent renders. `Today` returns `<FirstRun />` whole at zero Tasks, and
`FirstRun` carries `<Capture />` itself — so `m9` stays a complete surface and the field appears
exactly once on every surface.

**The placeholder is switched in JavaScript, not CSS.** The button's two labels could be two spans
toggled at the `xl` breakpoint, as the shell does with its wordmark, but a placeholder is an
attribute and CSS cannot write one. A `matchMedia` hook in `Capture.tsx` answers once and both
strings read from it, rather than a class swap for one and a media query for the other.

**The blank-submit rule lives in `captureTask`, not in the field.** Exported from `src/app/store.tsx`
as a pure function of the Id port and the text, so the matrix's whitespace-only row is proved in
Vitest as well as in Playwright. `trim` decides *whether* to create and never *what* to store.

**Synchronicity is asserted mechanically, not only timed.** `tests/unit/store.test.ts` strips
comments from the seven files on the capture path and fails on `async`, `await`, `Promise`,
`setTimeout`, `requestIdleCallback` or `queueMicrotask`. The Playwright budget would start failing
on a slow machine rather than on the commit that introduced the deferral; this fails on the commit.
The same suite greps `src/` for `todo.tasks.v1` and for any storage API, so AD-6's single-writer and
single-key rules are checked over the tree rather than asserted about one module.

**AC 2's "port-level fake engine" is vacuous in this story and is read as the Fixture-sized
document.** There is no Suggestion Engine port until Epic 2, so there is nothing to fake. The
measurement seeds `todo.tasks.v1` with 15 Tasks — the top of PRD §3's 10–15 Fixture range — before
any application code runs, and times submit to the record's DOM insertion with a `MutationObserver`.

## Spec Change Log

## Review Triage Log

**Iteration 1 — 18 findings, all fixed.** Grouped by what they were actually about.

*Data safety (AD-6), four fixes in `local-storage.ts`.* A probe write refused for quota made
`browserStorage()` return `null`, so an origin already at quota showed first run while the user's
document sat untouched in `localStorage` — a refused probe now downgrades the store to read-only
instead of discarding it. A throwing `getItem` returned `unavailable` while leaving the store
writable, so the next capture would overwrite a live document that had never been backed up — a
read that throws now latches and the session refuses to write at all. `backup()` wrote
unconditionally, so a second unreadable document destroyed the preserved copy of the first — it now
writes only when the backup key is absent, because "never discarded" has to mean the earliest
surviving copy wins. And `__todo.probe__` moved into `STORAGE_KEYS` and is removed in a `finally`,
so the file really is the only place a key is spelled and none is left in the user's origin.

*Focus, one fix, the highest-severity finding.* `Today` early-returned `<FirstRun />` and `FirstRun`
rendered its own `<Capture />`, so the first submit swapped the subtree and unmounted the input that
had just been focused — `document.activeElement` was `body` afterwards and a phone keyboard would
close between the first Task and the second. `Capture` is now rendered once above the zero-task
branch; `FirstRun` draws the copy only.

*Correctness that no test would have caught.* The validator admitted two Tasks sharing an id
(duplicate React keys, an ambiguous `[data-record]`) and text that was only whitespace (a blank
46 px row); both are now rejected. `PriorityLadder` restated the priority order that `PRIORITIES`
exists to spell once, so an inverted ladder was one edit away and nothing rendered `high` or `low`
anywhere in the gate. `newId()` guarded both crypto calls for absence but not for a throw, which a
hardened context would have sent into capture — the one surface forbidden an error state. And
`matchMedia('(min-width: 1280px)')` disagreed with the CSS, which compiles `xl:` to `80rem`: at any
root font size but 16 px the wording and the layout crossed the breakpoint at different widths. The
query is now `80rem`, exported as the one source, and the end-to-end suite asks the page rather than
restating a width.

*State.* `storageFailure` was re-derived from the last write, so the first capture erased the
`unreadable` reason that carried the news of a preserved backup — the one thing Settings will most
need to say (AC 6). Split into a latched `readFailure` and a per-write `writeFailure`.

*Coverage the gate was missing.* `src/adapters/id.ts` had no test at all and its fallback is
unreachable under Playwright, since `localhost` is a secure context — `tests/unit/id.test.ts` stubs
the global in three shapes. `MIGRATIONS` is empty, so `migrateDocument`'s body and its
`chain[from - 1]` offset would first have executed in a user's own document; the walk now takes an
injected chain and is tested against one. Added besides: the reducer's idempotence (the design's
load-bearing claim under StrictMode), `high`/`low` ladder rendering, the breakpoint crossed inside
one page lifetime, the reference-date line's shape and its agreement with the shell's own date, and
`labels.today.listLabel`.

*Small.* `reduce` gained a `default`; the session-boundary test spread its viewport conditionally
rather than dropping `storageState` on a null; `store.test.ts`'s comment stripper now takes trailing
comments too; and the purple-reservation check reads `--color-proposed` and `--color-proposed-wash`
off `:root` instead of carrying a copy of the palette where `check-hex.mjs` cannot see it.

Three layers reported: blind-hunter (14), edge-case-hunter (15), verification-gap (4 gaps + 3 other).
36 findings, every one with a verdict. Gap-layer findings arrive pre-verified. Nothing routed to
intent_gap or bad_spec, so `review_loop_iteration` stays 0 and no loopback ran.

### Patched

- **high - the capture field loses focus after the very first Task.** Confirmed two ways: structurally,
  `Today` early-returns `<FirstRun />` at zero Tasks (`src/ui/today/Today.tsx:54`) while `FirstRun`
  renders its own `<Capture />` (`src/ui/first-run/FirstRun.tsx:24`), so the first successful submit
  swaps the whole subtree and unmounts the input `Capture` had just focused; and empirically, the
  blind layer drove a throwaway spec showing `document.activeElement` is `BODY` after the first
  capture and `INPUT` after the second. On a phone the keyboard closes between the first and second
  Task. The suite missed it because `toBeFocused()` is asserted only on the whitespace path, which
  never leaves first run. Found independently by two layers.
- **medium - at quota, existing readable Tasks are never read.** `browserStorage()` probes with
  `setItem('__todo.probe__', '1')` (`src/adapters/local-storage.ts:77-80`); an origin already at quota
  throws there, the function returns `null`, and `readTasks` answers `unavailable` with an empty list.
  The user's document is still in `localStorage`, perfectly readable, and the app shows first run -
  which they would reasonably read as data loss. The quota matrix row only covers a failing *write*.
- **medium - a throwing `getItem` lets the next capture overwrite a document that is still there.**
  `readTasks` catches and returns `unavailable` (`src/adapters/local-storage.ts:170-174`) but `backing`
  stays non-null, so the next `writeTasks` replaces the stored document with a one-Task document. The
  raw was never backed up, because it could not be read.
- **medium - a second failed read destroys the first backup.** `backup()` writes unconditionally
  (`src/adapters/local-storage.ts:149-153`), so a second unreadable document overwrites the preserved
  copy of the first - against AD-6's 'never discarded'.
- **medium - the Id adapter has no test at all, and its fallback is reachable in production.** Nothing
  in `tests/` imports `src/adapters/id.ts`; `store.test.ts` injects its own counter. Playwright runs on
  `localhost`, a secure context, so `crypto.randomUUID` is always defined and the hand-rolled v4 path
  (`src/adapters/id.ts:83-86`) never executes - yet it is exactly the path AD-11 names for a phone on
  `http://192.168.x.x`. Regress `randomBytes` to return an unfilled `Uint8Array` and every id becomes
  the same constant, colliding on the React key and on `data-record`, with a green gate. Separately,
  `newId()` guards `randomUUID`'s *existence* but not a throw, and a throw there escapes into the one
  surface forbidden an error state.
- **medium - two of the three priorities are never rendered or tested.** Capture only ever creates
  `medium` and the e2e fixture seeds all 15 Tasks `medium`, so no test renders `high` or `low`. Swap
  the `high`/`low` entries in `FILLED` (`src/ui/components/PriorityLadder.tsx:37`) or swap the two
  labels and everything stays green while a stored high-priority Task is drawn *and named* low - the
  one state the design carries twice precisely so it cannot be misread (UX-DR10, UX-DR20). `FILLED`
  also re-encodes the order that `core/task.ts`'s `PRIORITIES` exists to spell once.
- **medium - the breakpoint is spelled in two different units.** `Capture.tsx` reads
  `matchMedia('(min-width: 1280px)')` while every `xl:` utility compiles to `@media (width>=80rem)`.
  At any root font size but 16 px the wording and the layout disagree, so the field can show the
  desktop placeholder and `ADD TASK` inside the 360 px composition. 1280 is now spelled three times.
  No test crosses the breakpoint in one page lifetime, so deleting the resize effect entirely would
  look identical to the gate.
- **medium - the read failure reason is destroyed by the first successful write.**
  `createPersistingReducer` re-derives `storageFailure` from the last write (`src/app/store.tsx:85-88`),
  so the `unreadable` reason that carried the news of a preserved backup is cleared by the next
  capture. Nothing else records it, so Epic 5's Settings can never tell the user a recoverable copy
  exists - which is the whole point of writing it.
- **medium - the migration chain never runs and the validator does not normalise the version.**
  `MIGRATIONS` is empty, so `migrate()`'s body and its `MIGRATIONS[from - 1]` offset are untested
  claims; `validateTaskDocument` returns the input's `schemaVersion`, so a future `migrate1to2` that
  forgets to bump would validate clean and be rewritten at the current version.
- **medium - the `REFERENCE DATE` line is rendered by every populated test and asserted by none.**
  `[data-today="reference-date"]` appears in no test. Drop the year, swap the halves, or feed `Today`
  a different date than `Shell` and the suite still passes.
- **medium - the reducer's idempotence is the design's load-bearing claim and no test exercises it.**
  The write happens inside the reducer, which React may invoke during a render it discards; under
  StrictMode each capture serialises twice. Idempotence holds for `task/created`, but nothing asserts
  it, and the first action whose write is not a pure function of `(state, action)` would break it
  silently.
- **low - the validator admits duplicate ids and blank text.** `src/ports/id.ts` promises ids unique
  for the document's lifetime, but `validateTaskDocument` accepts two Tasks sharing one - producing
  duplicate React keys and an unaddressable `[data-record]`. It likewise admits empty or
  whitespace-only text, which renders a blank 46 px row with nothing identifying it, even though
  capture itself refuses to create one.
- **low - the probe writes a third key the module does not name.** `'__todo.probe__'` is an inline
  literal in the file that claims to be the only place a key is spelled, is absent from
  `STORAGE_KEYS`, and is left behind in the user's origin if `removeItem` throws after `setItem`
  succeeded.
- **low - the purple-reservation test duplicates the palette outside `theme.css`.** `capture.spec.ts`
  hardcodes `rgb(142, 46, 126)` and `rgb(248, 234, 244)`; the hex scanner only sees hex, so changing
  `--color-proposed` leaves the test hunting a colour the app no longer uses while reporting green.
- **low - `reduce` has no `default` case**, so an action outside the union returns `undefined` and the
  next render throws on `state.tasks`. Unreachable from typed code; the fix is one line.
- **low - `page.viewportSize()` can be `null`**, which silently drops `storageState` in the
  session-boundary test and would fail it spuriously rather than meaningfully.
- **low - `store.test.ts`'s `code()` helper strips only line-initial comments**, so a trailing
  `// localStorage` beside real code would fail the no-storage-reach assertion on prose. It fails
  closed, so it is a maintenance hazard rather than a hole, but the file's own rationale is half
  implemented.
- **low - `labels.today.listLabel` is asserted by nothing** and `axe-core` does not require an
  accessible name on a list, so a user-visible string has no reader in the gate.

### Deferred

- **medium - a screen-reader user gets no confirmation that a sentence became a Task.** The field
  simply empties, and the suite asserts `[role="alert"], [role="status"]` at count 0 even after
  *successful* captures, which locks out the polite announcement that would fix it. UX-DR22 forbids an
  error state, not a status; whether capture announces success is an EXPERIENCE.md decision, not a
  code one. Filed for the story that owns capture's voice.
- **low - first run now shows two near-identical sentences at 1280 px.** The placeholder reads 'Type a
  task the way you say it out loud' directly above the display line 'Say it the way you would say it
  out loud.' Adding the capture field to first run was correct and drawn that way in `m9`; the copy
  pair was simply never revisited. One of the two should change, and both are approved strings, so it
  is a `DESIGN.md` question rather than an edit to make here.
- **medium (documentation) - `epics.md`'s AC 4 and AC 6 cannot both be literally true.** AC 4 says
  'the only key written is `todo.tasks.v1`' while AC 6 requires preserving the raw document under a
  backup key. The code is right and satisfies both intents; the wording is over-strong. Fixing it
  edits a locked planning document, so it belongs in `bmad-correct-course`.

### Rejected

- **false - cross-tab writes are last-writer-wins.** Real behaviour, but AD-6 states it as an accepted
  cost in the same breath as the whole-document re-serialisation it follows from. Not a defect.
- **carried - `today` is read once at module load.** Already verified, routed to Story 1.3 and
  recorded in `deferred-work.md` with its fix shape. Not reopened.
- **low, rejected - the submit button uses `text-body` rather than `text-apparatus`.** The reviewer
  reads a 'body' size token on apparatus text as a deviation. It is not: `m1` draws the button label
  at Barlow Condensed 10.5 px, and `--text-body` *is* the 10.5 px token. Switching to
  `--text-apparatus` would render it at 9 px and contradict the frame. The face is already apparatus.
- **low, rejected - `matchMedia` may be absent, or lack `addEventListener` on Safari 13.** True of
  Safari 13, which is outside the supported set; `matchMedia` and its `change` event are universal in
  every browser this PWA targets. The guard would add a branch for a platform the project does not
  ship against.
- **low, rejected - the probe and the backup write mean 'the reducer is the only writer' is false.**
  AC 4 constrains *mutations*: every change to the task document goes through the reducer, and
  `writeTasks` has exactly one call site. The backup is written on a read, and AC 6 requires it; the
  probe writes no task data. The probe's own hygiene is patched above. The AC-wording tension is
  deferred for correct-course rather than treated as a code defect.
- **reject, fix would edit this build's spec - the 100 ms budget is not measured 'with a port-level
  fake engine'.** Correct: no engine exists until Epic 2, so there is nothing to fake, and the test
  times a seeded Fixture-sized document instead - which is what `epics.md` AC 2 actually asks for. The
  phrase was inherited from the spine's testing convention and is vacuous in this story.
- **reject, fix would edit this build's spec - four defects in the spec and tracker.** All real: the
  Code Map lists `src/main.tsx` under 'Reuse as-is - do not change' while an execution task requires
  changing it; it calls `src/core/constants.ts` 'the retention default's documented home' though the
  file deliberately carries no retention default; an Implementation Note says 'five judgement calls'
  and lists six; and the spec's `in-review` status is not one of `sprint-status.yaml`'s story statuses
  (they are separate vocabularies, so that last one is cosmetic). Triage may not fix a finding by
  editing its own spec. Worth correcting by hand before Story 1.3 reads this spec for continuity.

## Design Notes

**Why the record's controls render inert.** Story 1.6 owns "tap the checkbox completes in place" and
Story 1.4 owns "tap the sentence opens Task detail". This story renders the anatomy AC 7 asks for
without wiring either. Story 1.1 set the precedent with Today: a current-but-inert destination is
marked rather than dressed as a control that does nothing, because AD-17 asks for native focusable
controls and a dead checkbox is worse than a drawn one. Expect the checkbox to be a non-interactive
visual here and to become a real `input` in 1.6.

**The priority word is required even though no frame draws it.** No 46 px record in any mockup renders
the priority word — not `m1`, not `d1`'s mosaic records. `DESIGN.md`, UX-DR6, UX-DR10 and AC 7 all
require it, and `DESIGN.md` wins over a frame by its own rule. It is also the non-colour redundancy
UX-DR20 needs, so the ladder cannot ship without it. Budget horizontal room for it at 360 px.

**Dense desktop rows are not this story's problem.** `d1` draws a 21 px dense table row; `DESIGN.md`
raised `row-height-desktop` to 24 px and wins. Either way Today's records use the 46 px anatomy at
both widths in this story — the dense table and the two-column mosaic arrive with the bands in
Epic 3.

**Synchronicity is the latency mechanism.** FR-8's 100 ms is not met by optimising; it is met by
there being no `await` between submit and the record rendering. The store writes storage
synchronously after the reducer has already produced the new state, so the render never waits on
persistence — which is also why a storage failure cannot block capture.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm run lint` -- expected: exit 0, both `eslint` and the hex scanner
- `npm test` -- expected: the task, store and storage suites pass alongside Story 1.1's six files
- `npm run build && npm run test:e2e` -- expected: capture, persistence and the 100 ms budget pass,
  `axe-core` clean and no horizontal scroll at 360 px and 1280 px
- `node scripts/check-bundle-key.mjs dist` -- expected: exit 0

**Manual checks:**
- Type a sentence, submit, reload: the record is still there, its text byte-identical.
- With `localStorage` disabled in devtools, capture still works for the session and capture says
  nothing about it.
- The record against `m1-today.svg`: 46 px pitch, 12 px checkbox, ladder beside its word. Nothing
  purple except the start triangle slot's outline.
