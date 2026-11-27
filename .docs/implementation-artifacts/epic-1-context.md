# Epic 1 Context: Capture and keep a task

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user types one sentence and has a Task — visible at once, surviving a browser restart, editable in
every field, completable, deletable, and already carrying the due date the date word named. The
substrate the later epics stand on (tree, pinned toolchain, purity boundary, ports, tokens, hash
router, shell, CI) is built inside these slices rather than as a story of its own; there is no
starter template. The finished epic is a working task list with no intelligence in it.

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

- Fields update independently and survive reload; deletion is permanent and distinct from both
  completion and Archive; the Project field is out of scope — a later tier.
- Date words are a closed English whole-word case-insensitive vocabulary, first match wins;
  unrecognized text sets no date, raises no error, and still creates the Task. A parsed date is
  applied directly, never as a reviewable proposal, and stays editable.
- Capture is never gated on a Suggestion Engine: create-to-visible under 100 ms, no network request.
  Offline the app is fully functional and nothing on screen admits the network is gone.
- Every date-dependent test injects a fixed reference date through the Clock port, never the system
  clock.
- Accessibility floor, WCAG 2.2 AA as evidence and never a conformance claim: 360 px and 1280 px
  with no horizontal scrolling, targets at least 24x24 CSS px, 4.5:1 body and 3:1 large-text
  contrast, no state by colour alone, native focusable controls with a visible focus ring, real text
  at every size, scanned at both widths in CI.
- Install and dev-run must work on a fresh clone with no key, account or network; an unsupported
  Node version fails install naming the required range. `main` must run at every commit — the
  graded metric.

## Technical Decisions

- Dependency direction inward: domain → ports → adapters and app state → UI; adapters constructed
  only in the browser entry and the harness entry; modules organize by layer.
- Domain purity is lint-enforced: no platform, framework, randomness, crypto, ambient time or id
  generation; calendar arithmetic in one module; domain functions total, adapters never throw.
- Time only through the Clock port, as a local date `YYYY-MM-DD`; no instants in the domain; only
  the system-clock adapter touches the platform date type; ids only through the Id port.
- Persistence: one port, one adapter, one storage key, one writer — the reducer. Versioned document
  with an ordered migration chain applied on read; one named defaults factory, failing closed.
- Storage never throws: unavailable or over quota stays fully usable in memory for the session with
  no error shown; a document failing validation on read is kept under a backup key, not discarded.
- Only a completion date persists; completed, archived and list membership are all derived — Archive
  is the retention window from the defaults factory.
- One reducer-plus-context store, every mutation a named action, free-text edits persisted on blur
  or a debounce, never per keystroke.
- Navigation state in the URL hash only, via a hand-rolled router; Back leaves Task detail without
  exiting; the shell lists only destinations that exist yet and is extended later, not replaced.
- Membership is a predicate named for its condition in the shared selectors module; every display
  string lives in one labels module; one shared tokenizer does the whole-word matching; the date
  parser returns the matched span with the resolved date.
- An error boundary on every routed surface: a plain recovery panel back to Today, task document
  untouched.
- All assets vendored — no CDN, font service, analytics or third-party script; a build-injected CSP
  limits connections to the single permitted API host; the service worker precaches the shell with
  auto-update and never caches that host.
- All 43 design tokens in one theme file under Tailwind v4's `@theme` at the design document's
  values; a raw hex colour elsewhere fails CI; no component or animation library, CSS transitions
  only, reduced motion honoured.
- CI gate on every push: typecheck, lint, unit tests, E2E with the accessibility scan at both
  widths, bundle key-pattern grep — no key, no network, committed exact-version lockfile.
- Fixed vocabulary (Task, Tag, Priority, Summary, Suggestion, Project, no synonyms); kebab-case
  modules, PascalCase only for component files; Priority exactly `high` / `medium` / `low`,
  lowercase, default `medium`.
- No logging in the shipped app, no console outside the harness, no runtime configuration —
  constants in one domain module. Tier 1 never depends on later tiers; no feature flags.

## UX & Interaction Patterns

**Surfaces:** first run, Today (capture field and records — bands arrive in Epic 3), Task detail,
each mobile and desktop. First run is the only empty state in the product; every other list reports
a count of zero.

**Record**, 46 px on mobile: checkbox, sentence in the body face, tag patch, priority ladder beside
its word, due pill, start-triangle slot at the right edge (renders false in Epic 1). The sentence
opens Task detail; the checkbox completes in place.

**Due pill — four states, exactly as the approved Today frame draws them** (the window inks
themselves are completed in Epic 3):

1. inside the current week — filled in the current-week yellow;
2. past due — filled in the attention olive with surface-coloured text;
3. later than this week — an outlined pill on the surface fill (routine, not an edge case: `next
   week` is the Monday of the following week);
4. no due date — no pill at all, drawn as an em-dash: the glyph decorative and hidden from the
   accessibility tree, "No due date" the accessible content, neither a focusable control.

**Every mark pairs with a word**, never colour alone: the priority ladder is three bars of rising
height filled to the level, always beside its word; the tag patch a terrain-patch rectangle in the
pale attention ground naming its context; a decorative glyph always carries a spoken word.

**Typography split, enforced:** a condensed bold uppercase tracked face for all apparatus (numerals,
nav, labels, counts, captions, status lines) and the body face for anything the user wrote or will
accept; no second display face; tabular numerals on every date, count and control number.

**Geometry and shell:** radius zero except the control circle and the settings toggle; no shadow,
glass, blur or gradient; hairline rules instead of card edges. At 360 px: 14 px gutters, 40 px
header, 46 px bottom tab bar, one column. At 1280 px: 196 px nav rail, 26 px gutters, two-column
mosaic, 24 px rows.

**Voice:** plain, specific, never alarming; an absence is a fact, not an error; the user's sentence
quoted unchanged; all user-facing language English. The purple proposal ink is reserved for an
unaccepted proposal and nothing else anywhere; each state ink does one job.

## Cross-Story Dependencies

- Story 1.1 precedes everything and 1.8 depends only on it; 1.2 follows 1.1; 1.3, 1.4 and 1.6 follow
  1.2; 1.5 and 1.7 follow 1.4.
- Story 1.3 owns the shared tokenizer, imported by Epic 2's Rule Engine and referenced by Epic 4.
- Story 1.4 owns the completed/archived predicates and the week definition; Epic 3 adds the Smart
  List predicates and Archive to the same module.
- Story 1.2 owns the record component including the triangle slot; Epics 2 and 3 consume it. Later
  work extends Story 1.1's labels module, theme file and CI workflow rather than replacing it.
- The in-app install offer belongs to Settings (Epic 2); Story 1.8 ships only the browser's own
  install affordance. Epic 1 declares the responsive, accessibility and voice floors every later UI
  story inherits.
