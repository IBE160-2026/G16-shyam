---
title: 'Story 1.2 — Create a Task from one sentence'
type: 'feature'
created: '2026-11-25'
status: 'ready-for-dev'
route: 'dispatch'
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
- `src/ui/components/ErrorBoundary.tsx`, `src/main.tsx` — the one composition root, where every
  adapter is constructed.
- `eslint.config.js` — the `src/core/**` override already bans the whole AD-1 list, `globalThis` and
  `self` included. New `core` modules inherit it with no config change.

**New, with its documented home:**
- `src/core/task.ts` — the `Task` type and the persisted document shape, plus the validator. Pure.
- `src/core/constants.ts` — the retention default's documented home; this story adds only what it needs.
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
- [ ] `src/core/task.ts` -- the `Task` type (text, `dueDate`, notes, tags, priority, summary,
      `completedAt`, id), the persisted document shape with `schemaVersion`, a total validator, and
      the named defaults factory -- PRD §3, AD-6, AD-7
- [ ] `src/ports/storage.ts` -- the synchronous port returning a result that never throws -- AD-6
- [ ] `src/adapters/local-storage.ts` -- the only file naming `todo.tasks.v1`; reads, validates and
      migrates on read, preserves an invalid document under the backup key, survives an absent or
      quota-exceeded `localStorage` -- AD-6
- [ ] `src/ports/id.ts`, `src/adapters/id.ts` -- `newId()`, `crypto.randomUUID()` with the
      non-secure-context fallback -- AD-11, conventions
- [ ] `src/app/store.tsx` -- `useReducer` and context, named actions, the single writer; persists the
      whole document per mutation with no `await` on the capture path -- AD-6, NFR-1
- [ ] `src/ui/labels.ts` -- the capture placeholder and button per viewport, the meta line, and the
      priority words -- AD-9, UX-DR18
- [ ] `src/ui/today/Capture.tsx` -- a native form so Enter submits; clears on submit; whitespace-only
      submit is silently ignored -- FR-1, AD-17, UX-DR22
- [ ] `src/ui/today/Today.tsx` -- the work area: capture field, meta line, then one flat list of
      records; renders the first run surface when there are none -- FR-1, UX-DR15
- [ ] `src/ui/components/Record.tsx`, `src/ui/components/PriorityLadder.tsx` -- the 46 px anatomy and
      the three-bar ladder beside its word -- UX-DR6, UX-DR10, UX-DR12
- [ ] `src/ui/first-run/FirstRun.tsx` -- add the capture field the `m9` frame has always carried,
      leaving its existing copy untouched -- AC 2 of Story 1.1, `m9`
- [ ] `src/main.tsx` -- construct the Storage and Id adapters beside the Clock and wrap the tree in
      the store provider -- AD-6, conventions
- [ ] `tests/unit/task.test.ts` -- the validator and the defaults factory against every matrix row
      that does not need a browser -- AD-6
- [ ] `tests/unit/store.test.ts` -- each named action, the single-writer rule, and the in-memory
      fallback when storage fails -- AD-6
- [ ] `tests/unit/local-storage.test.ts` -- round-trip, the backup key on invalid input, absent and
      quota-exceeded storage, all against an injected fake -- AD-6
- [ ] `tests/e2e/capture.spec.ts` -- capture, field clears, record appears, survives reload, the
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

## Spec Change Log

## Review Triage Log

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
