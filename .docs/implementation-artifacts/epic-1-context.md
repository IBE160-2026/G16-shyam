# Epic 1 Context: Capture and keep a task

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user types one sentence and has a Task — visible immediately, still there after the browser is
closed and reopened, editable in every field, completable, deletable, and already carrying the due
date the date word in their sentence named. Epic 1 also builds the substrate the other seven epics
stand on — the directory tree, the pinned toolchain, the purity boundary around the pure domain
layer, the Clock / Storage / Id ports, the 43 design tokens, the hash router, the shell at both bound
widths, and the CI workflow — but never as a story of its own: the substrate rides inside the first
slices that reach a visible surface. There is no starter template. When the epic is done the product
is a working single-user task list with no intelligence in it, and that standalone state is
deliberate: it is what makes every later epic cuttable from the bottom.

## Stories

- Story 1.1: Run the app from a clean clone and see the first run surface
- Story 1.2: Create a Task from one sentence
- Story 1.3: See the due date the date word named
- Story 1.4: Read the list and open a Task
- Story 1.5: Edit any field of a Task
- Story 1.6: Complete and un-complete a Task
- Story 1.7: Delete a Task
- Story 1.8: Install the app and open it offline

## Requirements & Constraints

**Task lifecycle.** Create from task text alone, persisting with Priority `medium`, no Tags and no
Summary, surviving reload, needing no network. Read every non-archived Task — including
completed-but-unarchived ones — and open one to see all its fields. Update task text, due date,
notes, Tags, Priority and Summary independently; the Project field is explicitly out of scope (a
later tier). Delete permanently, distinct from both completion and Archive. Complete and un-complete
freely.

**Date words.** Only `today`, `tomorrow`, `Monday`–`Friday` written out in full, and `next week` are
recognized — English only, whole words, case-insensitive, first match wins, nothing else guessed. A
weekday resolves to its next occurrence, and to the reference date itself when that date is that
weekday. Unrecognized text sets no date and raises no error; the Task is still created. The parsed
date is applied directly, never through a reviewable proposal, and is editable at once.

**Latency and offline.** Capture is never gated on the Suggestion Engine; create-to-visible stays
under 100 ms against a Fixture-sized document, with no network request. With no network the app is
fully functional and nothing on screen admits the network is gone.

**Responsive and accessible.** Every flow works at 360 px and 1280 px with no horizontal scrolling.
WCAG 2.2 AA is a floor, never claimed as conformance: targets at least 24x24 CSS px, 4.5:1 body
contrast and 3:1 for large text, no state carried by colour alone, native focusable controls with a
visible focus ring. Checked mechanically with an accessibility scanner driven through the E2E runner
at both widths.

**Determinism of time.** Every date-dependent test injects a fixed reference date through the Clock
port and never reads the system clock, so results are identical on any day, timezone and machine.

**Clean-clone runnability.** Install and dev-run must work on a fresh clone with no key, account or
network; an unsupported Node version must fail install with a message naming the required range
rather than installing. This is the binary metric the project is graded on, so main must run at
every commit.

**Installability.** The app installs as a PWA from the single codebase with manifest and icons, and
opens cold from precache with Tasks rendering.

## Technical Decisions

- **Layers, dependency direction strictly inward.** The pure domain depends on nothing; ports on
  domain types; adapters and app state on ports plus domain; UI on those. Composition happens in
  exactly two places — the browser entry and the harness entry — and nothing else constructs an
  adapter. Modules organize by layer, not feature; stories are still vertical slices through them.
- **The domain layer is pure, and lint enforces it.** No browser, platform, framework, randomness,
  crypto or ambient-time access, and no id generation. Calendar arithmetic is allowed but confined to
  one module.
- **Time enters only through the Clock port**, returning a local calendar date (`YYYY-MM-DD`). No
  instants exist in the domain; due date and completion date are both local dates, and only the
  system-clock adapter touches the platform date type. Accepted consequence: completion carries a day
  and no time of day. Ids likewise come from an Id port, with a documented non-crypto fallback when
  no secure context exists and a counter fake in tests.
- **Persistence: one synchronous port, one writer.** Browser-local storage behind a single adapter,
  the only file naming a storage key. The task document carries a schema version with an ordered
  migration chain applied on read, and one named defaults factory that fails closed. The store's
  reducer is the only writer. Storage returns a result and never throws: when it is unavailable or
  over quota the app stays fully usable in memory for the session with no error shown, and a document
  failing validation on read is preserved under a backup key rather than discarded.
- **Derived values are computed; user acts are recorded.** Completion, archive status and list
  membership are all derived — the Task persists only a completion date, never a completed or
  archived boolean. Archive means completed more days ago than the retention window, whose default
  comes from the defaults factory. Restoring clears the completion date and loses it; accepted.
- **One store, named actions.** A single reducer-plus-context store; every mutation a named action;
  free-text edits persisted on blur or a debounce, never per keystroke.
- **Navigation lives in the URL hash**, never component-local state, via a small hand-rolled router.
  Back is a first-class control and must leave Task detail rather than exiting the app. The shell
  offers only destinations that exist at this point in the build, and later epics add to the same
  component rather than replacing it.
- **Predicates own membership, labels own words.** Membership is a predicate named for its condition
  in the shared selectors module; every display string lives in one labels module. One shared
  tokenizer implements whole-word, case-insensitive matching, and the date parser returns the matched
  span alongside the resolved date so later work has a defined input.
- **Error boundaries, not blank pages.** Each routed surface is wrapped so an uncaught render error
  shows a plain recovery panel offering a return to Today, task document untouched — the single
  exception to "no error state in capture".
- **One network host, everything else vendored.** Typefaces, icons and all assets come from the
  repository: no CDN, no font service, no analytics, no third-party script. A build-injected CSP
  limits outbound connections to the single permitted API host, and the service worker precaches the
  shell with auto-update while never intercepting or caching that host.
- **The design system is declared once and enforced in CI.** All 43 tokens in one theme file under
  Tailwind v4's `@theme`; a raw hex colour anywhere else fails CI. Component and animation libraries
  are declined; CSS transitions carry motion and reduced-motion is honoured. Radius zero except the
  control circle and the settings toggle; no shadow, glass, blur or gradient; depth by overlap and
  offset; hairline rules instead of card edges.
- **CI is the gate**, one workflow on every push: typecheck, lint, unit tests, E2E with the
  accessibility scan at both widths, and a grep of the built bundle for a key pattern — all with no
  key and no network, installing against a committed exact-version lockfile.
- **No secrets, no noise.** No logging in the shipped app, no console in committed code outside the
  harness, and no runtime configuration mechanism — constants live in one domain module.
- **Fixed vocabulary**: Task, Tag, Priority, Summary, Suggestion, Project, no synonyms. Kebab-case
  modules, PascalCase only for component files. Priority is exactly `high` / `medium` / `low`,
  lowercase, defaulting to `medium`.
- **Tier 1 may not depend on later tiers**, and there is no feature-flag machinery — later
  capabilities are additive, so cutting one means deleting a file.

## UX & Interaction Patterns

**Surfaces in scope:** first run, Today (capture field and records — the bands arrive in Epic 3), and
Task detail, each in its mobile and desktop variant.

**First run is the only empty state in the whole product**, because every other list reports a count
of zero instead. It states what the product is before it has content.

**Record component**, 46 px on mobile: checkbox, the user's sentence in the body face, tag patch,
priority ladder beside its word, due pill, and the start-triangle slot at the right edge. Tapping the
sentence opens Task detail; tapping the checkbox completes in place without navigating. Epic 1 builds
the component including the triangle slot, which renders false here and is driven later from two
sources; Epics 2 and 3 reuse it rather than rebuilding it.

**Due pill — four states, exactly as the approved Today frame draws them** (corrected 2026-11-26; an
earlier three-state description was the defect, not the drawing):

1. inside the current week — filled in the current-week yellow;
2. past due — filled in the attention olive with surface-coloured text;
3. later than this week — an outlined pill on the surface fill;
4. no due date — **no pill at all**, drawn as an em-dash.

The out-of-week state is routine, not an edge case, since `next week` resolves to the Monday of the
following week by definition. The window inks themselves are completed in Epic 3.

**Priority ladder:** three bars of rising height filled to the level, always beside the word — never
colour alone. **Tag patch:** a terrain-patch rectangle in the pale attention ground naming its
context.

**Typography split, enforced:** a condensed bold uppercase tracked face for all apparatus — numerals,
nav, labels, counts, captions, status lines — and the body face for everything the user wrote or will
accept. No second display face; apparatus is never set in the body face. Tabular numerals on every
date, count and control number, without exception.

**Shell:** at 360 px, 14 px gutters, 40 px header, 46 px bottom tab bar, one column; at 1280 px, a
196 px nav rail, 26 px gutters, a two-column mosaic and dense 24 px rows. Groups tight inside, more
space above a heading than below.

**Voice:** plain, specific, never alarming. An absence is a fact, never an error. The user's sentence
is quoted unchanged, never paraphrased. All user-facing language is English.

**The purple proposal ink is reserved** for a proposal not yet accepted and nothing else anywhere —
declared here, exercised in Epic 2. Each state ink does exactly one job.

## Cross-Story Dependencies

- Story 1.1 is the prerequisite for everything — tree, pins, tokens, purity lint, accessibility check
  and CI. Story 1.8 also depends only on 1.1.
- Story 1.2 depends on 1.1; Stories 1.3, 1.4 and 1.6 depend on 1.2; Stories 1.5 and 1.7 depend on 1.4.
- Story 1.3 owns the shared tokenizer, imported by Epic 2's Rule Engine and referenced by Epic 4's
  Fixture documentation.
- Story 1.4 owns the completed/archived predicates and the week definition in the selectors module;
  Epic 3 adds the Smart List predicates and Archive there, and Epic 4 asserts them.
- Story 1.2 owns the record component including the triangle slot; Epics 2 and 3 consume it.
- Story 1.1 owns the labels module, theme file and CI workflow; later stories extend rather than
  replace them — Epic 4 adds harness and accuracy-floor steps, Epic 5 verifies the workflow runs with
  no key and no network.
- The in-app install offer belongs to Settings, which arrives with Epic 2 — Story 1.8 delivers only
  the browser's own install affordance.
- Epic 1 declares the responsive, accessibility and voice floors every later UI story inherits.
