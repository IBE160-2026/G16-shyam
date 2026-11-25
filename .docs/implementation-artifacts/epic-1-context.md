# Epic 1 Context: Capture and keep a task

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user types one sentence and has a Task: visible immediately, still there after the browser is
closed and reopened, editable in every field, completable, deletable, with the due date already
parsed from the date word they wrote. The epic also lays the substrate the other seven stand on —
directory tree, pinned toolchain, the purity boundary around `src/core/`, the Clock / Storage / Id
ports, the 43 design tokens, hash routing, the error boundary, the PWA shell and the CI gate — all
built *inside* these vertical slices, never as a setup story. There is no starter template. The
standalone outcome is a working single-user task list with no intelligence in it at all.

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

- **Nothing here needs a key, an account or a network.** A clean clone must install and serve; an
  unsupported Node major must fail the install naming the required range rather than installing.
- **Capture is sovereign.** A Task is created from task text alone, persisting with Priority
  `medium`, no Tags, no Summary. Create-to-visible stays under 100 ms, asserted by Playwright
  against a Fixture-sized document, with no network request.
- **Read model.** The default view shows every non-archived Task, completed-but-unarchived ones
  included. Task detail shows every field: task text, due date, notes, Tags, Priority, Summary,
  completion date. The Project field is deliberately absent here (Tier 3, Epic 8).
- **Edit model.** Each field changes independently and persists. Nothing re-runs a Suggestion Engine
  — not a text edit, not a reload, not navigation. The user's sentence is quoted unchanged, never
  paraphrased. Priority is exactly `high`/`medium`/`low`, lowercase, defaulting to `medium`.
- **Complete, un-complete and delete are distinct acts.** Completing keeps everything and stays
  retrievable until archived. Deleting is permanent, is the product's only destructive act, and must
  never be reachable by accident from the checkbox or the record body.
- **Date-word parsing.** Only `today`, `tomorrow`, `Monday`–`Friday` in full and `next week` are
  recognized — English, whole words, case-insensitive, first match wins. A weekday resolves to its
  next occurrence, which is the reference date itself when that date is that weekday; `next week` is
  the following Monday. Weekend names, abbreviations, plurals, Norwegian and anything else set no due
  date, raise no error, and still create the Task. The parsed date applies directly and is
  immediately editable — never part of a reviewable proposal.
- **WCAG 2.2 AA as a floor, checked with `axe-core`, never claimed as conformance.** 360 px and
  1280 px both binding with no horizontal scrolling; pointer targets ≥24×24 CSS px; body and
  placeholder text ≥4.5:1 against its actual background; no state carried by colour alone (ladder
  *and* word, pill *and* words). Never write that the app "conforms".
- **Offline is the normal case.** With no network the app is fully functional and no view shows an
  error, spinner or empty state attributable to the missing network.
- **Resilience.** Unavailable or over-quota storage leaves the app usable in memory for the session,
  with nothing in capture showing an error. A stored document failing validation on read is never
  discarded — the raw string is kept under a backup key and the app starts empty. An uncaught render
  error in a routed surface shows a plain recovery panel back to Today, never a blank page.

## Technical Decisions

- **Ports and adapters, dependencies strictly inward.** `core/` depends on nothing; `ports/` on core
  types only; `adapters/` and `app/` on ports and core; `ui/` on app, ports and core. Composition
  happens once per runtime and nothing else constructs an adapter. Modules are organized by layer,
  not feature, because one pure core serves both the browser and a Node harness — but stories stay
  vertical and end in observable behaviour.
- **`core/` purity is a lint failure.** No module under `src/core/` may reference `window`,
  `document`, `localStorage`, `fetch`, `process`, `navigator`, `performance`, `crypto`,
  `Math.random`, React, a Vite-injected value, `Date.now()` or a zero-argument `new Date()`. It
  exports pure functions and types only and generates no identifiers. `Date` on an *explicitly
  supplied* value is allowed, confined to one calendar-arithmetic module.
- **Time.** The Clock port exposes one operation returning a `LocalDate` — `YYYY-MM-DD` in the local
  calendar. No instants exist in the domain; `dueDate` and `completedAt` are both `LocalDate`. One
  system-clock adapter is the only file touching `Date`, and every date-dependent test injects a
  fixed reference date. Accepted consequence: completion carries no time of day.
- **Ids** come from an Id port — never `core`, never the store. `crypto.randomUUID()` with a
  documented non-crypto fallback outside a secure context; tests inject a counter.
- **Persistence: one synchronous port, one writer.** Only the storage adapter names a key; this epic
  writes only the task document, carrying a `schemaVersion` read and written solely by the adapter.
  Every mutation is a named action on a single `useReducer`-plus-context store, the reducer is the
  only writer to storage, and no component holds derived state. Storage operations return a result
  and never throw. Free-text edits persist on blur or a debounce, never per keystroke — the whole
  document is re-serialized per write. Missing or unmigratable documents resolve through one named
  defaults factory, never a call-site fallback.
- **Derived versus recorded.** Completion, archive status and list membership are computed, never
  stored: the Task persists `completedAt` as a `LocalDate` or null — never a `completed` boolean,
  never an `archived` flag. Archive is `completedAt !== null && dayDiff(today, completedAt) >
  retentionDays`.
- **Membership versus words.** Membership is a predicate in `core/selectors.ts` named for its
  condition (`isCompleted`, `isArchived`, `isPastDue`); user-visible strings live only in
  `src/ui/labels.ts`, and a label has no vote on membership. The canonical label is `Need
  Attention`, singular — the plural must not enter code, UI strings or test selectors.
- **Vocabulary.** Glossary words take no synonyms: `Task`, `Tag`, `Priority`, `Summary`,
  `Suggestion`, `Project` — no "todo", "item", "label", "category". Modules kebab-case; PascalCase
  for React component files only.
- **Navigation.** Every destination plus Task detail is a hash route; surface state lives in the URL
  hash, never in component-local state, and Back must leave Task detail rather than exit the app. A
  minimal hand-rolled router is replaceable seed; the invariant is URL-as-state.
- **Design system declared once, enforced in CI.** All 43 tokens live in `src/ui/theme.css` under
  Tailwind v4 `@theme` (four are `-min`/`-max` pairs counting as one token each). A raw hex outside
  that file fails CI via a plain-Node scanner run inside the lint script — deliberately inside
  `lint` so the CI check count stays at five. No headless or primitive component library and no
  animation library: CSS transitions carry motion, `prefers-reduced-motion` is honoured, and every
  control is a native focusable element with a visible ink-themed focus ring.
- **One network host, no third parties.** The only request the app may issue is to the Anthropic
  host, from one adapter, enforced by a CSP `connect-src` that must be **build-injected** into
  `index.html` by the Vite config — a static meta tag breaks `npm run dev`, which Story 1.1 is
  measured on. Fonts, icons and all assets are vendored: no CDN, no Google Fonts, no analytics, no
  telemetry, no third-party script. The service worker precaches the shell with auto-update and must
  never intercept or cache the Anthropic host.
- **Font subsetting must request `tnum` explicitly, with the right spelling.** With `pyftsubset` the
  flag is `--layout-features+=tnum`; the `+=` is load-bearing. `--layout-features=+tnum` *replaces*
  the feature set with the literal string `+tnum`, which matches no feature tag, so fontTools drops
  every layout feature and writes an empty `GSUB` FeatureList with no warning. The proof is the
  `GSUB` table of the committed `woff2`, never a computed style: `font-variant-numeric:
  tabular-nums` computes as set even when the font no longer carries the feature.
- **Toolchain pins.** Exact versions throughout, `npm ci` against a committed lockfile; TypeScript
  stays on 6.0.3 because the lint chain's peer range caps it. React 19 ships **no type
  declarations**, so `@types/react`, `@types/react-dom` and `@types/node` are required for
  typecheck to run at all — pinned exactly like everything else, but development types rather than
  stack choices, and **not** counted among the 18 pinned packages. Do not assert an installed
  package count anywhere: it is a property of the npm invocation, not of the project.
- **Node range.** `^22.13.0 || ^24.0.0 || >=26.0.0`, declared verbatim in `engines`, with 26
  recommended via `.nvmrc`. This is the faithful intersection of all 18 pinned packages and is
  **deliberately not narrowed** — tightening it to `^26.0.0` would make the project stricter than
  any dependency it has and, with the committed `engine-strict=true`, would fail `npm ci` on Node 28
  LTS for no supported reason. Odd majors below 26 are excluded because Vitest enumerates them that
  way; `>=26.0.0` is open by the same declaration. `engines` alone only warns, so the committed
  `.npmrc` is what turns a mismatch into a failed install naming the range.
- **No logging, no runtime configuration.** Nothing in the shipped app logs and no `console` appears
  in committed code outside the harness. Constants live in a core constants module.
- **CI is the gate and runs with no key and no network:** typecheck, lint, Vitest, Playwright with
  `axe-core` at both widths, and a grep of the built bundle for an API-key pattern. Node is selected
  from the committed version file so CI and a grader run the same major. Vitest covers core and
  adapters, port-level fakes cover service flow, Playwright covers end-to-end.

## UX & Interaction Patterns

- **Surfaces in scope:** first run, Today (capture field plus records — bands arrive in Epic 3), and
  Task detail. Today is the default destination.
- **First run is the only empty state in the product**; every other list that would be empty reports
  a count of zero instead.
- **Record**, 46 px on mobile: checkbox · sentence in Archivo · tag patch · priority ladder with its
  word · due pill · start-triangle slot at the right edge. Tapping the sentence opens Task detail;
  tapping the checkbox completes in place without navigating. The triangle renders false here.
- **Shell:** bottom tab bar at 360 px (one column, 14 px gutters, 40 px header, 46 px tab bar); left
  nav rail at 1280 px (196 px rail, 26 px gutters, two-column mosaic, 24 px dense rows). It offers
  only Today for now, and later epics add to the same component rather than replacing it.
- **Typography is a semantic split:** Barlow Condensed 700, uppercase and tracked, for everything
  the app says about itself; Archivo 400–600 for everything the user wrote or will accept. No second
  display face. `font-variant-numeric: tabular-nums` on every date, count and control number.
- **Ink reservation.** Purple means a proposal awaiting the user and nothing else anywhere; olive
  means past-due-and-not-completed; yellow means due inside the current week; white means settled.
  Radius zero except the control circle and the one settings toggle. No shadow, glass, blur or
  gradient — depth is overlap and offset. 1 px hairline row separators and 1.2 px block bounds
  instead of card edges; never a box inside a box.
- **Voice:** plain, specific, never alarming. An absence is a fact followed by what *is* happening,
  never an error; never a claim of correctness. All UI language is English.
- **"Current week"** is Monday–Sunday inclusive, defined once and reused by the parser's `next week`.

## Cross-Story Dependencies

- **Within the epic:** 1.1 is the substrate every other story inherits. 1.2 needs 1.1; 1.3, 1.4 and
  1.6 need 1.2; 1.5 and 1.7 need 1.4; 1.8 needs 1.1. No outside prerequisite, and no later epic is
  required for this one to function.
- **Owned here, imported and never re-implemented later:** the single whole-word case-insensitive
  tokenizer; `isCompleted` / `isArchived` and the week definition (Epic 3 adds the Smart List
  predicates and Archive to the same module, Epic 4 asserts them); the record component with its
  triangle slot; `ui/labels.ts` and `ui/theme.css`; the CI workflow (Epic 4 adds the harness step and
  the accuracy floor, Epic 5 verifies it runs keyless and offline).
- **Hooks left deliberately:** the date parser returns the matched span alongside the resolved date,
  so Epic 2's Summary truncation has a defined input. The in-app install offer belongs to Settings,
  which arrives in Epic 2 — this epic delivers only the browser's own install affordance. The
  Project field waits for Epic 8 as an optional property no Tier 1 selector reads. The README is
  written whole in Epic 5.
