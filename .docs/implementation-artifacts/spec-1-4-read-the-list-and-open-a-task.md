---
title: 'Story 1.4 — Read the list and open a Task'
type: 'feature'
created: '2026-11-26'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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
- [ ] `src/core/localdate.ts` -- `dayDiff`, plus the desktop-title and detail date formatters beside
      `formatHeaderDate`; zero imports preserved -- AC 1, AC 2, the shared-formatter trap
- [ ] `src/core/constants.ts` -- the 30-day retention default -- AC 1, FR-16, AD-6
- [ ] `src/core/selectors.ts` -- `isCompleted` and `isArchived`, pure, reference date and retention
      as arguments -- AC 1, AC 6, AD-7
- [ ] `src/app/` router -- hash parse and format as pure functions, plus the `hashchange`
      subscription; absent and unknown hashes normalise to Today -- AC 3, AC 4, AD-16
- [ ] `src/ui/labels.ts` -- the Task-detail strings and the destination title, in the per-surface
      idiom -- AC 2, AC 6, AD-9
- [ ] `src/ui/shell/Shell.tsx` -- route-derived current destination, title and markers; the
      destination becomes a native `<a>`; header and tab-bar geometry unchanged -- AC 4, AC 5, AD-17
- [ ] `src/ui/` Task detail -- AC 2's seven field rows from `m6`/`d5`, each absence named, nothing
      purple, no `PROJECT`, no `CREATED`, no course table -- AC 2, UX-DR6, UX-DR2
- [ ] `src/ui/components/Record.tsx` -- the sentence opens Task detail, at a target the accessibility
      floor accepts, without foreclosing Story 1.6's second target -- AC 2, UX-DR6, UX-DR20
- [ ] `src/ui/today/Today.tsx` -- the list and its count become the non-archived Tasks -- AC 1
- [ ] `src/main.tsx` -- render the current route inside the shell, each surface in its own boundary
      -- AC 4, AD-20
- [ ] `tests/unit/selectors.test.ts` -- `isCompleted` and `isArchived` against a literal reference
      date, including the retention boundary at exactly 30 and 31 days -- AC 1, NFR-10
- [ ] `tests/unit/localdate.test.ts` -- `dayDiff` across month, year and leap boundaries, and the two
      new formatters -- NFR-10
- [ ] `tests/unit/` router -- the pure hash parse and format, including absent, unknown and
      malformed hashes -- AC 4
- [ ] `tests/unit/store.test.ts` -- extend `CAPTURE_PATH` with any new file on the capture path -- NFR-1
- [ ] `tests/e2e/` shared helpers -- extract `seed`, the document builders, `tokenColour` and
      `capture` from `capture.spec.ts`, and add a builder for completed and archived Tasks -- AC 1
- [ ] `tests/e2e/capture.spec.ts` -- rewrite the three inertness assertions and the record's aria
      snapshot for the control that now exists -- AC 2
- [ ] `tests/e2e/` Task detail -- open from a record, every field row, Back returns to Today, deep
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

## Spec Change Log

## Review Triage Log

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
