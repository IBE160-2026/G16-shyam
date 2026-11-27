---
title: 'Story 1.4 — Read the list and open a Task'
type: 'feature'
created: '2026-11-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_revision: '69c0858c8b4156fd778a957635c5dc39768061dc'
followup_review_recommended: true
deferred:
  - summary: >-
      sprint-status.yaml still records Story 1.4 as ready-for-dev while the story spec
      reaches done, so the file CLAUDE.md names as the status authority disagrees with it.
    evidence: |-
      CLAUDE.md names .docs/implementation-artifacts/sprint-status.yaml as the authority on
      "what to build next, and every story's status"; this run moved the spec's own
      frontmatter from ready-for-dev to done and left that file untouched. Not routed to a
      patch because sprint-status.yaml is the orchestration layer's tracking file -
      bmad-sprint-planning owns it, and this workflow is told not to read or write the
      caller's checkpoint fields. Settled by running bmad-sprint-planning, or by a
      one-field edit if the human prefers.
    location: >-
      .docs/implementation-artifacts/sprint-status.yaml
    severity: low
  - summary: >-
      Two deferred-work.md entries targeted at Story 1.4 are now settled by it and still
      read as open, and a third is now imprecise.
    evidence: |-
      The entry at line 68 routed the desktop-year question here and warned against adding
      a year inside the shared formatHeaderDate; this story settled it with a separate
      formatFullDate. The entry at line 72 routed the missing retention default here; this
      story added DEFAULT_RETENTION_DAYS. The entry at line 76 records the accepted
      consequence as a user reaching Task detail with "no drawn affordance to return",
      which is now imprecise at 360 px: AC 5's tab bar renders on Task detail with a live
      TODAY link, so there is a drawn way to Today - just not a Back control, which is
      what the CHECKPOINT decision actually prohibited. Not patched because
      deferred-work.md states "Append-only: entries are never edited or deduplicated" in
      its own header, while one existing entry was edited on 2026-11-26 to carry a
      RESOLVED prefix - the file contradicts itself on whether editing is allowed, and
      picking a side is a human call. Settled by deciding that convention once.
    location: >-
      .docs/implementation-artifacts/deferred-work.md:68,72,76
    severity: low
context: ['{project-root}/.docs/implementation-artifacts/epic-1-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Today renders every Task the store holds, unfiltered, and a record is inert — tapping
the sentence does nothing, there is no second surface to reach, and no destination state exists
anywhere. A Task's notes, Summary and completion date are stored and have never been visible. The app
is a capture box, not somewhere to look things up.

**Approach:** Add the hash router the architecture has always specified, make the shell and its one
destination route-aware, give the record its first real action, and build Task detail as the frames
draw it minus everything later epics own. Teach `core/selectors.ts` which Tasks belong in a list.

## Decisions

Approved at CHECKPOINT 1, 2026-11-26.

**Kept as one story, with a known cut.** The spec is large and the story is the heaviest in Epic 1
after 1.1, but every available split either ships something no user can see — nothing can create a
completed Task until Story 1.6, so AC 1's archive filter has no visible effect yet — or breaks AC 2's
dependency on the router. If it overruns one build session, the cut is AC 1 + AC 6, the pure-core
half, exactly as `epics.md` pre-decided cuts for Stories 1.1 and 2.1.

**Task detail does not annotate the due date's provenance.** `m6` draws `PARSED FROM "FRIDAY"` under
the due date; this story does not build it. FR-23 applies the parsed date directly rather than
proposing it, the Task stores no record of which word produced it, and `m2`'s comparable annotation
lines are already held as reviewer commentary pending Story 2.2. If 2.2 rules they are shipping copy,
this row arrives then. The accepted consequence: a reviewer comparing the surface to `m6` finds the
row missing.

**A user leaves Task detail by the platform's Back, and no in-app control is added.** AC 3's wording
is "when I press Back", UX-DR16 lists Task detail as entered from a record rather than navigated to,
and no approved frame draws a control — `m6`'s header band carries only the title and the date. Hash
history makes browser and Android Back work with no new UI. **The accepted consequence, stated
plainly:** an installed PWA at 360 px may present no visible back affordance, so a user can reach a
surface UX-DR16 says Back must leave and see no way out. That is recorded in `deferred-work.md`
against the story or correct-course that owns a Back affordance in `DESIGN.md`, rather than invented
here.

## Boundaries & Constraints

**Always:**
- Destination state lives in the URL hash and nowhere else — never component-local state, never the
  store, never storage. The router is hand-rolled; no routing library.
- The router lives in `src/app/`. `src/core/**` is lint-banned from `location` and `history` as well
  as the rest of the AD-1 list, so no part of routing may live there.
- Route literals are written `#/today` and `#/task/<id>`. A bare `#` followed by 3, 4, 6 or 8 hex
  digits fails `scripts/check-hex.mjs`.
- List membership is a predicate in `core/selectors.ts` named for its condition, pure, taking the
  reference date as an argument.
- Archive is `completedAt !== null && dayDiff(today, completedAt) > retentionDays`, computed and
  never stored. `retentionDays` is a parameter, so the settings-backed value replaces the Tier 1
  default without touching the predicate.
- Every display string comes from `src/ui/labels.ts`, in the existing per-surface idiom.
- Each routed surface is wrapped in its own error boundary.
- The shell is extended, not replaced: later epics add Lists, Archive and Settings to the same
  component.
- The record keeps its exact 46 px height and its truncating sentence, and nothing on it may use the
  reserved purple — including a focus ring.
- No new design token.

**Never:**
- No second destination in the shell. Today is the only one that exists at this point in the build.
- No `Project` field on Task detail — Tier 3, and explicitly outside FR-3 in this epic.
- No creation date on Task detail. `Task` has no such field and AD-2 forbids an instant in the
  domain, so the frame's `CREATED Mon 16 Nov 09:12` row cannot be built and is not built.
- No course table, no controls, no engine chip, no proposal of any kind on Task detail — Epic 2 owns
  every purple element the frames draw there.
- No completion, un-completion, editing or deletion. Task detail reads; Stories 1.5, 1.6 and 1.7 act.
- No change to `formatHeaderDate`. It is shared with the due pill, which carries no year in any of
  its four states.
- No archiving surface, Smart List, band or Archive route — Epic 3.
- No nesting of a future control inside the record's new action: Story 1.6 must still be able to
  split the row into two pointer targets.
- No provenance annotation under the due date, and no in-app Back control. Both are CHECKPOINT 1
  decisions above, not oversights.

## I/O & Edge-Case Matrix

Reference date is Monday 2026-11-16, retention 30 days, throughout.

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Open, no date word | hash absent or `#` | Today renders; hash normalises to `#/today` | N/A |
| Unknown route | `#/nonsense` | Today renders, no error surface | nothing thrown |
| Open a Task | tap a record's sentence | hash becomes `#/task/<id>`, Task detail renders | N/A |
| Back from detail | detail entered from Today, Back pressed | Today renders again, app not exited | N/A |
| Deep link to a Task | `#/task/<id>` on a cold load | that Task's detail renders | N/A |
| Deep link, unknown id | `#/task/missing` | Today renders; no empty detail, no error | nothing thrown |
| Incomplete Task listed | `completedAt` `null` | appears in Today | N/A |
| Completed, inside window | `completedAt` `2026-11-10` | still appears — completed is not archived | N/A |
| Completed, on the boundary | `completedAt` `2026-10-17` (30 days) | still appears; strictly greater than archives | N/A |
| Archived | `completedAt` `2026-10-16` (31 days) | absent from Today | N/A |
| Archived only | every Task archived | first-run surface, by the existing count rule | N/A |
| Detail of a bare Task | notes, tags, summary, `completedAt` all empty | every row renders, each absence named, no gaps | N/A |
| Detail of a full Task | every field populated | seven rows, due date as `Fri 20 Nov 2026` | N/A |
| Completed Task's detail | `completedAt` set | completion date shown as a date, not a boolean | N/A |
| Shell at 360 / 1280 | either width | tab bar / nav rail, one destination, title per route | N/A |
| Desktop title date | 1280 px | carries the year, as `d1` and `d5` draw it | N/A |
| Mobile header date | 360 px | no year, as `m1` and `m6` draw it | N/A |
| A surface throws | render error inside a route | that route's recovery panel, document untouched | boundary catches |

</frozen-after-approval>

## Code Map

**Reuse as-is — do not change:**
- `src/ports/clock.ts`, `src/adapters/system-clock.ts`, `src/ports/{id,storage}.ts`,
  `src/adapters/{id,local-storage}.ts` — untouched by this story.
- `src/app/use-today.ts` — the precedent for a browser-subscribing hook in `src/app/`: it uses
  `document` and `window.setInterval` freely, which `src/core/**` may not. The router follows its
  shape.
- `src/ui/theme.css` — 43 tokens. `tests/unit/theme-tokens.test.ts` asserts `tokens.size === 43`,
  47 declarations, 8 paired names, 16 colours, **and** equality with `DESIGN.md`'s frontmatter. A new
  token means changing a locked document and five counts. Task detail composes from what exists.
- `src/core/task.ts` — `Task`'s eight fields are the whole of what Task detail can show: `id`,
  `text`, `dueDate`, `notes`, `tags`, `priority`, `summary`, `completedAt`. There is no creation
  field, which is why the frame's `CREATED` row is not buildable.
- `src/core/localdate.ts:207` `formatHeaderDate` — shared with the due pill. Do not add a year to it.

**Changed by this story:**
- `src/core/localdate.ts` — add `dayDiff(from, to): number | null`, two lines on the existing private
  `daysFromCivil` + `parseParts`, built exactly as `dayOfWeek` is. It must live here, not in
  `selectors.ts`, for the cycle reason the module header already states. Add the desktop/detail date
  formatters here too, beside `formatHeaderDate`, so every date format in the product is in one file.
  Keep the file at zero imports.
- `src/core/constants.ts` — currently exports only `TASK_SCHEMA_VERSION`. Its own header says the
  retention window "belongs here too and arrives with the story that reads it"; this is that story.
  Add the 30-day default.
- `src/core/selectors.ts` — currently `WEEK_START_DAY`, `DAYS_PER_WEEK` (re-exported), `startOfWeek`,
  `endOfWeek`, and no predicate. Its header reserves `isCompleted` and `isArchived` for this story.
  Both pure, both taking the reference date as an argument. **This file is on `CAPTURE_PATH`** (see
  below), so no banned word may appear in it.
- `src/app/` — **new** router module. Reads `window.location.hash`, subscribes to `hashchange`,
  parses to a small discriminated union, and normalises an absent or unknown hash to Today. A pure
  parse/format pair is what the unit tests can reach; the subscription is e2e's.
- `src/main.tsx:58-68` — `App` already exists for `useToday`. It gains the route read and renders the
  current surface inside the shell, each surface in its own `ErrorBoundary`.
- `src/ui/shell/Shell.tsx` — the whole destination structure. The rail (L63-91) and tab bar (L128-146)
  each hard-code a single `<li aria-current="page">`; the desktop title at L113 is a literal
  `labels.shell.today.title`. All three become route-derived, and the `<li>` becomes a native `<a>`
  per AD-17. **Four geometry assertions depend on the current DOM shape** —
  `tests/e2e/first-run.spec.ts:198-212` reads `[data-shell="header"] > div` as a *direct* child, the
  tab bar's single `ul`, and the rail's width; `capture.spec.ts:426` reads `page.locator('header time')`
  and needs exactly one `<time>`; `first-run.spec.ts:120` asserts the visible body text contains
  `labels.shell.today.title`, so Today's title string must keep its value.
- `src/ui/today/Today.tsx` — `useTasks()` is unfiltered today (L53) and the first-run branch is purely
  `tasks.length === 0` (L66). The list becomes the filtered one, and the count at `[data-today="count"]`
  counts what is shown. **On `CAPTURE_PATH`** — no deferral here.
- `src/ui/components/Record.tsx` — the sentence `<p data-slot="sentence">` (L128-133) gains the
  story's first action. **On `CAPTURE_PATH`.** Three constraints: the row's height is asserted exactly
  `46px` (`capture.spec.ts:674`), so a focus ring must be `outline`/`outline-offset` and not change
  the box; the sentence relies on an ancestor's `min-w-0 flex-1` plus `truncate`, which a wrapper must
  preserve or the row overflows; and `[data-slot="start-triangle"]` is asserted to have empty
  `innerHTML` (`capture.spec.ts:711`), so no affordance may be parked there.
- `src/ui/` — **new** Task detail surface, from `m6` (mobile) and `d5` (desktop), carrying AC 2's seven
  field rows and nothing else. `m6` additionally draws `PROJECT`, `CREATED`, and a course table with
  the reserved purple; `d5` draws a full rail of destinations that do not exist yet. None of that is
  built here.
- `src/ui/labels.ts` — add a Task-detail key in the existing per-surface idiom, one label per field
  plus the absence wordings. `shell.<destination>.{tab,rail,title}` is already the destination shape,
  so a second destination later is a sibling key. Note the file is imported by `vite.config.ts:5` and
  must stay importable from Node.
- `src/ui/components/ErrorBoundary.tsx` — `ErrorBoundaryProps` is `{ children }` and is **not
  exported**; the boundary mounts once in `main.tsx:76-78`, outside `App`. Its own comment says this
  story wraps each routed surface. **It has no test of any kind**, which the deferred entry from
  Story 1.1 routes here: this is the first story with a route that can throw.

**Tests that must change, not just grow:**
- `tests/e2e/capture.spec.ts:830`, `:911-913`, `:914` — three assertions that the record contains no
  `input, button, a, [tabindex]` / no `[role]`. The whole test at `:902-915`, "renders no native
  control that does nothing", exists to assert inertness and names this story as the one that undoes
  it. Rewrite to assert the one control that now exists and that it is correctly sized.
- `tests/e2e/capture.spec.ts:817-819` — an `ariaSnapshot()` of a record. A link or button wrapper
  changes that snapshot.
- `tests/unit/store.test.ts:287-300` — `CAPTURE_PATH` is a literal 12-entry array, extended by hand.
  Any new file on the submit-to-render path belongs in it.
- `tests/e2e/` has **no shared helper module**: `seed`, `fixtureDocument`, `tokenColour`, `capture`
  and `storedItems` are all private to `capture.spec.ts`, and no builder produces a completed or
  archived Task. A Task-detail spec needs them extracted.

**Gates that fail loudly if disturbed:** `tests/e2e/first-run.spec.ts:43-56` compares the CSP to a
12-directive literal with `toEqual` — hash navigation needs no new directive, and an `<a href="#/…">`
is not a form and sets no `<base>`. `tests/unit/ci-checks.test.ts:112` pins the `lint` script string
exactly and `:107-108` requires every dependency to be an exact version. Console silence is asserted
on the built artifact (`capture.spec.ts:1027-1043`, `first-run.spec.ts:232-250`) — any React warning
from a key, an `aria-current` or an unhandled `hashchange` fails the gate. `axe-core` runs un-tagged
at both widths in four places, so WCAG 2.2's `target-size` rule applies to the record's new control;
`first-run.spec.ts:24` and `capture.spec.ts:917-970` sweep a dozen CSS properties for the reserved
purple, focus rings and `::before`/`::after` included.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/localdate.ts` -- `dayDiff`, plus the desktop-title and detail date formatters beside
      `formatHeaderDate`; zero imports preserved -- AC 1, AC 2, the shared-formatter trap
- [x] `src/core/constants.ts` -- the 30-day retention default -- AC 1, FR-16, AD-6
- [x] `src/core/selectors.ts` -- `isCompleted` and `isArchived`, pure, reference date and retention
      as arguments -- AC 1, AC 6, AD-7
- [x] `src/app/` router -- hash parse and format as pure functions, plus the `hashchange`
      subscription; absent and unknown hashes normalise to Today -- AC 3, AC 4, AD-16
- [x] `src/ui/labels.ts` -- the Task-detail strings and the destination title, in the per-surface
      idiom -- AC 2, AC 6, AD-9
- [x] `src/ui/shell/Shell.tsx` -- route-derived current destination, title and markers; the
      destination becomes a native `<a>`; header and tab-bar geometry unchanged -- AC 4, AC 5, AD-17
- [x] `src/ui/` Task detail -- AC 2's seven field rows from `m6`/`d5`, each absence named, nothing
      purple, no `PROJECT`, no `CREATED`, no course table -- AC 2, UX-DR6, UX-DR2
- [x] `src/ui/components/Record.tsx` -- the sentence opens Task detail, at a target the accessibility
      floor accepts, without foreclosing Story 1.6's second target -- AC 2, UX-DR6, UX-DR20
- [x] `src/ui/today/Today.tsx` -- the list and its count become the non-archived Tasks -- AC 1
- [x] `src/main.tsx` -- render the current route inside the shell, each surface in its own boundary
      -- AC 4, AD-20
- [x] `tests/unit/selectors.test.ts` -- `isCompleted` and `isArchived` against a literal reference
      date, including the retention boundary at exactly 30 and 31 days -- AC 1, NFR-10
- [x] `tests/unit/localdate.test.ts` -- `dayDiff` across month, year and leap boundaries, and the two
      new formatters -- NFR-10
- [x] `tests/unit/` router -- the pure hash parse and format, including absent, unknown and
      malformed hashes -- AC 4
- [x] `tests/unit/store.test.ts` -- extend `CAPTURE_PATH` with any new file on the capture path -- NFR-1
- [x] `tests/e2e/` shared helpers -- extract `seed`, the document builders, `tokenColour` and
      `capture` from `capture.spec.ts`, and add a builder for completed and archived Tasks -- AC 1
- [x] `tests/e2e/capture.spec.ts` -- rewrite the three inertness assertions and the record's aria
      snapshot for the control that now exists -- AC 2
- [x] `tests/e2e/` Task detail -- open from a record, every field row, Back returns to Today, deep
      link and unknown id, archived Tasks absent, `axe-core` clean and no horizontal scroll at both
      widths -- AC 1, AC 2, AC 3, AC 4

**Acceptance Criteria:**

The six acceptance criteria, from `epics.md`:

1. **Given** Tasks exist **When** Today renders **Then** every non-archived Task appears, including
   completed-but-unarchived ones **And** archived Tasks do not (FR-2).
2. **Given** a record **When** I tap its sentence **Then** Task detail opens showing every field in
   PRD §3's definition — task text, due date, notes, Tags, Priority, Summary and completion date
   (FR-2, UX-DR6).
3. **Given** Task detail or any surface entered from a record **When** I press Back **Then** I return
   to the surface I came from rather than exiting the app (AD-16, UX-DR16).
4. **Given** any destination **When** it is addressed **Then** its state lives in the URL hash and
   never in component-local state **And** the shell renders the tab bar at 360 px and the nav rail at
   1280 px (AD-16, UX-DR15).
5. **Given** the shell **When** it renders **Then** it offers only destinations that exist at this
   point in the build — Today — and later epics add Lists, Archive and Settings to the same component
   rather than replacing it (UX-DR16, slicing and reuse contract).
6. **Given** a list of Tasks **When** membership is decided **Then** it is decided by a predicate in
   `core/selectors.ts` named for its condition, and every display string comes from
   `src/ui/labels.ts` (AD-9).

## Implementation Notes

Implemented 2026-11-27 on `story/1-4-read-the-list-and-open-a-task`, from
`69c0858`. Every AC, every frozen decision and every Never-list item held; no
planning was reopened and the story was not split, so the pre-decided cut
(AC 1 + AC 6) was not taken.

**New files.** `src/app/router.ts` (the hash router, named by the spine's source
tree), `src/ui/task-detail/TaskDetail.tsx` (likewise), `tests/e2e/helpers.ts`,
`tests/e2e/task-detail.spec.ts`, `tests/unit/router.test.ts`. No dependency was
added; `package.json` is untouched.

**Three judgement calls the spec left open, and how they were settled.**

1. **The record's action is a row-sized overlay anchor, not a stretched
   pseudo-element.** The Design Note proposed "a link covering the row from
   inside it — a stretched pseudo-element". Built that way first, and it is
   wrong for a reason the note could not have known: `axe-core` measures an
   element's own client rects, and a pseudo-element does not extend them. The
   sentence link would have measured 13 px and passed `target-size` only by
   claiming the spacing exception — which AD-17 explicitly denies to rows
   stacked against each other. It would also have been clipped by `truncate`'s
   `overflow: hidden`. What ships instead is an empty `<a data-slot="open">` at
   `absolute inset-0`, named by the sentence through `aria-labelledby`. This
   satisfies the note's actual requirement in full: the target is the whole row,
   the checkbox is **not** inside the link, and Story 1.6 raises it above the
   overlay with a `z-index` and nothing else. The due pill stays outside the
   link too, so a date is still read as a date rather than as part of a link's
   name. The row measures 46 px and the overlay 45 px — `inset-0` spans the
   padding box, and the 1 px `border-b` is the rule between records.

2. **Label wording and row order, where `m6` and `d5` disagree.** Corrected
   during review, where the original wording of this note was found to
   misdescribe the frames. The accurate account: `m6` is the only frame that
   draws all seven fields as plain rows — `d5`'s field block is four rows
   (`TASK TEXT`, `DUE DATE`, `PROJECT`, `NOTES`), with Tags, Priority and
   Summary appearing only inside the Epic 2 course table, and it carries no
   `COMPLETED` label at all. So **`m6` supplies the order and the `COMPLETED`
   label**, and `d5` supplies the two wordings it has: `TASK TEXT` over `m6`'s
   `THE TASK`, and `Not completed` over `m6`'s `No`. `d5`'s section heading
   (`THE TASK, FIELD BY FIELD`) renders at 1280 px only, because `m6` draws no
   such line, and at the 10.5 px primary-ink class `d5` actually draws it in —
   the first build used the 9 px secondary class `d5` reserves for annotation
   captions, also corrected during review.

3. **The recovery panel now goes where it says.** `labels.recovery.action` is
   `BACK TO TODAY`, and before this story rebuilding the one surface *was*
   going back. With a per-surface boundary over Task detail, rebuilding would
   re-render the surface that just failed and the label would be a lie — so
   `recover()` sets the hash to Today as well as bumping the rebuild key. The
   key still carries the outer boundary, where the composition itself failed and
   no route change would be read by anything. No approved copy changed.

**Two existing assertions had to change, beyond the four the spec named.**
`tests/e2e/first-run.spec.ts`'s `HEADER_DATE` became two shapes, one per width:
the matrix requires the year at 1280 px, so the old single regex was asserting
that `d1` and `d5` had not been built. And `tests/unit/store.test.ts`'s
`CAPTURE_PATH` gained `core/constants.ts` as well as `app/router.ts` — Today
reads the retention window from it, and the record asks the router for an href,
so both are now on the submit-to-render path.

**Reuse.** `Today.tsx`'s private `referenceDate()` helper is gone: it composed
exactly what `formatFullDate` now does, so the meta line calls the shared
formatter instead of a local duplicate. `formatHeaderDate` is untouched, as the
spec requires. `tests/e2e/capture.spec.ts` lost its four private document
builders, `seed`, `storedItems`, `tokenColour`, `capture` and `isDesktop` to
`tests/e2e/helpers.ts`, and two hand-rolled horizontal-scroll checks to
`expectNoHorizontalScroll`; `fixtureTask` now takes an overrides object rather
than a bare `priority`, which collapsed three builders into one.

**Verification.** `npm run typecheck`, `npm run lint`, `npm test`
(278 unit tests, 14 files), `npm run build`, `npm run test:e2e` (129 tests
across `mobile-360`, `desktop-1280` and `dev-server`) and
`node scripts/check-bundle-key.mjs dist` all pass. All 18 I/O matrix rows have a
covering test that ran; the archive boundary is proved arithmetically in
`tests/unit/selectors.test.ts` at exactly 30 and 31 days, and applied in
`tests/e2e/task-detail.spec.ts`.

**One defect found and fixed in review of the diff:** a literal NUL byte had
been written into `tests/unit/router.test.ts`'s hostile-input list where a space
was intended, which made Git treat the file as binary and put it outside
`.gitattributes`' `eol=lf` normalisation. Replaced with the intended space.

## Spec Change Log

Nothing in the intent contract changed. The spec was followed as approved; the
one place the implementation departs from a **Design Note** rather than from the
contract is the record's overlay anchor, recorded as item 1 of the
Implementation Notes above with the measurement that forced it.

## Review Triage Log

### 2026-11-27 - Review pass

- verdicts: 38 findings - high 0, medium 3, low 28, false 7, maybe-false 0
  (of the 28 low: 14 patched, 12 rejected, 2 deferred)
- layers: blind-hunter (13), verification-gap (2 gap + 4 other), intent-alignment
  (8 divergences, D1-D8), edge-case-hunter (11)
- findings:
  - `[medium]` `[patch]` `days()` in the archive e2e test mixed local arithmetic with a UTC
    output string, so the 30/31-day boundary flips in any positive-offset zone early in the
    local day - verified: `setDate(getDate() - n)` is local, `toISOString()` is UTC, and
    `src/adapters/system-clock.ts` reads the local calendar. Fixed: added `localDaysAgo` to
    `tests/e2e/helpers.ts` and used it at all three seeded-date sites.
  - `[medium]` `[patch]` `DEFAULT_RETENTION_DAYS` was pinned nowhere - the unit test carried
    its own literal 30 and only the (flaky) e2e test touched the constant - verified by grep.
    Fixed: the unit suite imports it, asserts it is 30, and derives its boundary cases from
    it; the e2e boundary rows derive from it too.
  - `[medium]` `[patch]` The per-route ErrorBoundary keys had no covering test: the existing
    recovery test presses BACK TO TODAY, which clears `failed` on the same instance and so
    passes with or without keys - verified by deleting both keys. Fixed: added a case that
    leaves the failed surface by the shell destination link, and confirmed it fails at both
    widths without the keys and passes with them.
  - `[low]` `[patch]` `isCompleted`'s docstring claimed to be the rule's "only expression"
    while Task detail reads `completedAt` directly - verified. Fixed the docstring; the
    predicate is required by the spec's own task list and its first behavioural reader is
    Story 1.6.
  - `[low]` `[patch]` Record.tsx's li comment still described the rejected stretched
    pseudo-element - verified. Fixed to describe the overlay anchor that ships.
  - `[low]` `[patch]` `headerDateFor` hard-coded `width < 1280`, the third spelling of the
    breakpoint that `isDesktop` was extracted to remove - verified. Fixed to use `isDesktop`.
  - `[low]` `[patch]` Task detail used `??`, so a stored blank summary or notes rendered a
    labelled empty row and blank tags a bare separator - verified against `validateTask`,
    which admits `summary: ""`, `notes: ""` and `tags: [""]`. Fixed with `presentText` and
    `presentTags`, plus a covering e2e case.
  - `[low]` `[patch]` `aria-labelledby` interpolated a raw `task.id`; `validateTask` admits an
    id containing a space, which would split the token list and strip the link's accessible
    name - verified. Fixed by percent-encoding the DOM id.
  - `[low]` `[patch]` `useRoute` trusted its render-time seed and normalised only on mount, so
    a hashchange in the gap before the listener attached was missed and a later bare # was
    left un-canonicalised - verified against `use-today.ts`, which documents the same trap.
    Fixed: sync runs after the listener attaches, and normalises on every call.
  - `[low]` `[patch]` The recovery test's `expect(before).toContain(...)` compared a locally
    built string to its own input and could never fail - verified. Fixed to compare the stored
    document byte-for-byte against the seeded string.
  - `[low]` `[patch]` The "carries the year" test's comment claimed to check the record's pill
    but asserted a Task-detail row after navigating - verified. Fixed to assert the pill on
    Today before opening, then the detail row.
  - `[low]` `[patch]` Shell keyed its destination list items on translatable label text -
    verified. Fixed to key on the destination's own route hash.
  - `[low]` `[patch]` Task detail's section heading rendered at 9 px in ink-secondary, the
    class d5 reserves for annotation captions; d5 draws this heading at 10.5 px in primary
    ink, the same class as ALL TASKS - verified in the SVG. Fixed.
  - `[low]` `[patch]` The labels.ts docstring claimed the rows are "in the order m6 and d5
    both stack them" and that d5's wording won "in both places" - verified wrong: d5's field
    block is four rows and carries no COMPLETED label. Fixed to state that m6 supplies the
    order and the COMPLETED label while d5 supplies the two wordings it has.
  - `[low]` `[patch]` No test exercised AC 2's literal wording - every path clicked the
    overlay by its own hook - verified. Added a case that clicks at the sentence's own
    coordinates.
  - `[low]` `[reject]` Back from a cold-open deep link exits the app rather than returning to
    Today. Real, but correct: AC 3 scopes Back to a surface "entered from a record", the
    matrix's deep-link row sets no Back expectation, and the proposed fix fabricates a Today
    history entry the user never visited.
  - `[low]` `[reject]` `isArchived` does not reject a NaN, negative or non-integer
    retentionDays. No settings document exists until Epic 2, so this guards state never shown
    reachable; validating a settings value belongs to AD-6's defaults factory, not to a pure
    predicate.
  - `[low]` `[reject]` `isCurrent` compares only route.kind. With the current closed union,
    kind is identity; the fix guards a future sub-route shape that does not exist.
  - `[low]` `[reject]` Field's `slot` is an untyped string, so the specs carry a one-line
    camelCase-to-kebab ternary. Typing it would require renaming label keys or attributes -
    more than a direct correction, for a negligible gain.
  - `[low]` `[reject]` No focus management on route change: focus falls to body. No WCAG 2.2 AA
    success criterion requires route-change focus handling, axe-core is clean at both widths,
    and the fix adds refs, effects and a focus target the spec does not settle.
  - `[low]` `[reject]` ErrorBoundary.recover writes window.location.hash directly rather than
    through a router navigate(), pushes an entry even for the outer boundary where no route
    change is readable, and costs one extra caught throw because setState flushes before
    hashchange. All verified; all invisible to the user, inside an already-rare crash path.
    The fixes either add a prop to a deliberately unexported props type or redesign recovery.
  - `[false]` AC 2's expectation is at the sentence while the change and its tests are at the
    row. The spec's own Design Notes make "the record's full 46 px row" the pointer target, so
    row-as-target is the intent's elaboration of "tap its sentence", not a divergence from it.
  - `[false]` The overlay forecloses Story 1.6's split. It does not: the checkbox is not nested
    in the link, and 1.6 raises it with a z-index - the one thing the Boundaries item requires.
  - `[false]` RoutedSurface's effective route is navigation state living outside the URL. It is
    a pure per-render derivation of hash plus document, persisted nowhere, and the matrix's
    unknown-id row mandates the fallback.
  - `[false]` useRoute's useState hash mirror violates "never component-local state". It is a
    subscription cache of the URL, the same shape as use-today.ts; the URL remains the source.
  - `[false]` The record's aria-snapshot assertion was relaxed from a whole-shape comparison.
    The pre-existing assertion was already toContain/not.toContain; this change added one.
  - `[false]` The spec claims unknown hashes normalise to Today but the address is left alone.
    "Normalise to Today" refers to the resolved route; the only address rewrite the matrix
    requires is for the absent or bare hash, which is implemented.
  - `[false]` The Review Triage Log is empty. It is written by this step; it was empty because
    the review had not yet run.
  - `[low]` `[defer]` sprint-status.yaml still says ready-for-dev - recorded in frontmatter
    `deferred`.
  - `[low]` `[defer]` deferred-work.md entries 68 and 72 are settled by this story and entry 76
    is now imprecise - recorded in frontmatter `deferred`; the file's own append-only rule
    contradicts an existing edited entry, so the convention is a human call.
  - `[low]` `[reject]` Intent D7's structural reading (at 1280 px, "d5 minus Epic 2" is four
    rows). AC 2 enumerates seven fields and m6 draws all seven as field rows; shipping four at
    desktop would fail AC 2. The stated justification was wrong and was patched above.
  - `[low]` `[reject]` Intent D5: the tab bar's TODAY link means the recorded "no way off the
    surface" consequence is no longer strictly true. The CHECKPOINT decision prohibits a Back
    control; AC 5 independently requires the destination. The record's imprecision is deferred
    above rather than resolved by removing a control AC 5 mandates.
  - `[low]` `[reject]` Intent D6: recovery semantics changed for both mount points while only
    the Task-detail one is exercised. The outer boundary is now covered in substance by the
    keyed per-surface test added above; a composition-root crash cannot be injected without a
    test-only seam in shipped code.
  - `[low]` `[reject]` Intent D8: both date strings live in the DOM with one hidden, so the
    matrix holds for painted text and the accessibility tree but not for textContent. The
    alternative - branching on a media query in JS - puts the breakpoint in a second place.
  - `[false]` Intent D2: membership is spelled as a negation at the call site, so half the
    decision lives in Today.tsx. Composing a named predicate with ! is what AC 6 requires; the
    condition itself is nowhere but core/selectors.ts.
  - `[low]` `[reject]` Intent D3: the archive matrix rows are proved only at the core surface.
    They are proved at both - arithmetically in the unit suite and on the rendered surface in
    the e2e gate; the UTC defect that weakened the latter was patched above.
  - `[low]` `[reject]` Intent D4 restated at the shell: the chrome and the address deliberately
    disagree for an unknown id. Mandated by the matrix's unknown-id row and asserted on purpose.
  - `[low]` `[reject]` Edge: a hashchange between seed and listener attachment leaves a stale
    route. Patched above as part of the useRoute fix; the row is kept so the count is complete.


## Auto Run Result

Status: done
Branch: `story/1-4-read-the-list-and-open-a-task`, from `69c0858`.

### What was implemented

Story 1.4 in full: all six ACs, no planning reopened, no split, and the
pre-decided cut (AC 1 + AC 6) not taken. The app gains the hash router the
architecture has always specified, a second surface to reach, the record's first
action, and the archive filter — so Today is a list you can look things up in
rather than a capture box.

### Files changed

**New**
- `src/app/router.ts` — the hand-rolled hash router: `parseRoute`/`formatRoute`
  as total pure functions, plus the `hashchange` subscription and the
  `replaceState` normalisation.
- `src/ui/task-detail/TaskDetail.tsx` — AC 2's seven field rows, each absence
  named, nothing purple.
- `tests/e2e/helpers.ts` — the shared seed/capture/document builders extracted
  from `capture.spec.ts`, plus `localDaysAgo` and `expectNoHorizontalScroll`.
- `tests/e2e/task-detail.spec.ts` — Task detail, Back, deep links, the shell
  across routes, the archive filter, a thrown surface, the accessibility floor.
- `tests/unit/router.test.ts` — the router's pure half, including every hostile
  hash.

**Changed**
- `src/core/localdate.ts` — `dayDiff` and `formatFullDate`; `formatHeaderDate`
  untouched, as the spec requires.
- `src/core/constants.ts` — `DEFAULT_RETENTION_DAYS`.
- `src/core/selectors.ts` — `isCompleted` and `isArchived`, both pure, both
  taking the reference date and the window as arguments.
- `src/main.tsx` — reads the route, resolves it against the document, renders
  each surface in its own boundary keyed by route.
- `src/ui/shell/Shell.tsx` — route-derived title, current-destination mark and
  `aria-current`; the destination is now a native anchor; one `<time>` carrying
  a per-width rendering of the date.
- `src/ui/components/Record.tsx` — the row-sized overlay anchor that opens Task
  detail, named by the sentence.
- `src/ui/components/ErrorBoundary.tsx` — recovery now goes to Today, which is
  what its label promises once routes exist.
- `src/ui/today/Today.tsx` — the list and its count are the non-archived Tasks;
  the local date helper gave way to the shared formatter.
- `src/ui/labels.ts` — the Task-detail strings, the `TASK` title, and the
  sentence-cased calendar words.
- `tests/unit/{selectors,localdate,store}.test.ts`, `tests/e2e/{capture,first-run}.spec.ts`
  — extended, and in four places rewritten where an assertion existed to be
  undone by this story.

No dependency added; `package.json` is untouched.

### Review findings

Four layers ran in parallel: blind-hunter (13 findings), verification-gap
(2 gap + 4 other), intent-alignment (8 divergences), edge-case-hunter (11).
38 findings, every one logged in `## Review Triage Log` above.

- **15 patched** — 2 grouped entries at `medium` (the retention window's
  verification, and the untested per-route boundary keys) and 13 at `low`.
  Three were real behavioural defects in shipped code: a blank stored
  `summary`/`notes`/`tags` rendered an unexplained empty row; a `task.id`
  containing a space would have stripped the record link's accessible name; and
  `useRoute` trusted its render-time seed, so a `hashchange` racing the listener
  was dropped. The rest were test and comment defects, including one assertion
  that compared a string to its own input and could never fail.
- **2 deferred** — `sprint-status.yaml` still reads `ready-for-dev`, and three
  `deferred-work.md` entries are now settled or imprecise. Both are recorded in
  frontmatter `deferred`. Neither was patched because each belongs to a file
  this workflow does not own: the first is the orchestrator's tracking file, and
  the second states "Append-only: entries are never edited" in its own header
  while an existing entry was edited on 2026-11-26 to add a `RESOLVED` prefix —
  the file contradicts itself, so the convention is a human call.
- **7 rejected as false** — chiefly the reading that AC 2's "tap its sentence"
  is violated by a row-sized target (the spec's own Design Notes make the full
  46 px row the target), that the effective-route derivation is state outside
  the URL (it is a per-render derivation the matrix's unknown-id row mandates),
  and that the record's aria-snapshot assertion was relaxed (it was already
  containment-based before this story).
- **14 rejected as low** — each with its reason in the log. The substantive
  ones: no focus management on route change (no AA success criterion requires
  it, `axe-core` clean, and the fix adds structure the spec does not settle);
  `isArchived` not validating a NaN or negative window (no settings document
  exists until Epic 2, and validating one belongs to AD-6's factory); and three
  warts in `ErrorBoundary.recover` whose fixes would add a prop to a
  deliberately unexported props type.

### Verification

Run after patching, all passing:
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0, `eslint` and the hex scanner both
- `npm test` — 279 tests, 14 files
- `npm run build` — exit 0
- `npm run test:e2e` — 139 tests across `mobile-360`, `desktop-1280` and
  `dev-server`; `axe-core` clean on every surface at both widths, no console
  output on the built artifact
- `node scripts/check-bundle-key.mjs dist` — exit 0

All 18 I/O matrix rows have a covering test that ran; none is skipped, and
`forbidOnly` is on. Three of the new tests were checked for teeth by
reintroducing the defect they guard — the per-route boundary keys, the
late-hash canonicalisation, and the percent-encoded DOM id — and each failed at
both widths before passing again.

### Residual risks

- **Task detail's typography is asserted by no test.** The heading's 10.5 px
  primary ink was read off `d5`'s SVG by inspection; the gate proves only that
  nothing is purple, nothing overflows and `axe-core` is clean. This matches the
  codebase's existing level of coverage for type, but it means a fidelity
  regression here would be silent.
- **Two of this pass's three `medium` findings were weaknesses in the
  verification layer itself** — the gate was green while two of its own checks
  were unsound. The remaining clock-dependent e2e assertions are the place a
  further pass should look first.
- The record's overlay means every part of the row navigates, including the
  checkbox glyph. That is the approved target (EXPERIENCE.md) and Story 1.6
  raises the checkbox above it, but 1.6 must not forget to.

### Follow-up review recommendation

`true`. Two `medium` entries were patched on a first pass, which is the
threshold. The specific unverified risk is the first item above: the design
fidelity of the new surface rests on one reading of an SVG and no assertion.


## Design Notes

**The record's action must not swallow Story 1.6's.** EXPERIENCE.md makes "the record's full 46 px
row" the pointer target, which satisfies SC 2.5.8 and the `target-size` rule `axe-core` starts
applying the moment a control exists. But making the row itself an `<a>` would put Story 1.6's
checkbox *inside* a link, which is invalid and precisely the split the deferred entry warns 1.4 not to
foreclose. The shape that satisfies both is a link covering the row from inside it — a stretched
pseudo-element — leaving the checkbox free to be raised above it later. Whatever is built, the row's
height stays exactly 46 px and the focus ring is an outline, because both are asserted.

**Why the year is a desktop treatment and not a format change.** `m1` and `m6` draw the mobile header
date as `MON 16 NOV`; `d1` and `d5` draw the desktop title row as `MON 16 NOV 2026`. That settles the
open question routed here from Story 1.1 — the year belongs to the desktop composition, not to the
format. It must arrive as a second formatter rather than a change to `formatHeaderDate`, because the
due pill shares that function and carries no year in any of its four states. Task detail's
`Fri 20 Nov 2026` is a third form again, sentence-cased in the frame.

**`isArchived` takes retention as an argument, and that is the whole of its forward compatibility.**
The 30-day default is a Tier 1 constant here. Epic 3 makes the window configurable and Epic 8 exposes
it in Settings; both supply the same parameter from a settings document instead of a constant, and the
predicate never changes. This is also why the default is a constant rather than a field on the task
document — AD-6's defaults factory covers the *settings* document, which does not exist until Epic 2.

**The frames draw a superset of this story, deliberately.** `m6` and `d5` are Epic 2 and Epic 3
surfaces as much as Epic 1 ones: between them they carry a course table, three controls, an engine
chip, a `PROJECT` row, a `CREATED` timestamp and a rail of six destinations. Epic 1 builds the seven
rows AC 2 names, one destination, and nothing purple. A reviewer comparing the built surface to the
frame will find rows missing; they are missing on purpose, and the Never list is the record of which.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm run lint` -- expected: exit 0, both `eslint` and the hex scanner; no route literal may trip the
  hex scan
- `npm test` -- expected: the new router and selector suites pass alongside the existing thirteen files
- `npm run build && npm run test:e2e` -- expected: Task detail, Back, deep links, the archive filter
  and the record's new control all pass at 360 px and 1280 px; `axe-core` clean on every surface
  including the new one; no console output on the built artifact
- `node scripts/check-bundle-key.mjs dist` -- expected: exit 0

**Manual checks:**
- Tap a record's sentence, read every field, press Back: Today again, not an exited app.
- Reload while on Task detail: the same Task, from the hash alone.
- At 1280 px the rail shows one destination and the title row carries the year; at 360 px the tab bar
  shows one destination and the header does not.
- A seeded Task completed 31 days ago is absent from Today; one completed 30 days ago is present.
