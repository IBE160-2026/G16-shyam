---
title: 'Story 1.1 — Run the app from a clean clone and see the first run surface'
type: 'feature'
created: '2026-11-25'
status: 'done'
route: 'dispatch'
baseline_commit: '63c7d9414959410111e7d7f0f1cbd008940d8bb7'
review_loop_iteration: 0
context: ['{project-root}/.docs/implementation-artifacts/epic-1-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository holds eight epics of approved planning and no code. A grader with a fresh
clone and no API key cannot run anything, and the 37 stories that follow have no substrate to stand
on: no pinned toolchain, no purity boundary around `core/`, no design tokens, no CI gate.

**Approach:** Build the first vertical slice. `npm ci` and `npm run dev` take a clean clone to a
running app that renders the `m9` first run surface — the product's only empty state — in the locked
design system, with the five CI checks that every later story inherits. Only the files this slice
needs are created; the rest of the Structural Seed arrives with the stories that own it.

## Boundaries & Constraints

**Always:**
- The 18 pinned versions in the spine's Stack table, exact, no carets. `engines` is
  `^22.13.0 || ^24.0.0 || >=26.0.0` verbatim; committed `.npmrc` carries `engine-strict=true` so a
  mismatch fails `npm ci` instead of warning; `.nvmrc` carries `26`.
- All 43 `DESIGN.md` tokens in `src/ui/theme.css` under Tailwind v4 `@theme`, values verbatim from
  the frontmatter. Four are `-min`/`-max` pairs and each pair is one token: 16 colour, 13 typography,
  3 radius, 11 spacing. Every colour on screen resolves from them.
- `npm run lint` is `eslint . && node scripts/check-hex.mjs`, keeping AC 4's five CI checks at five.
- The CSP is injected into the built `index.html` by `vite.config.ts` (`transformIndexHtml` with
  `apply: 'build'`). Never a static meta tag — that breaks `npm run dev`, the command AC 1 is
  measured on.
- Typefaces vendored as subset `woff2` with `--layout-features=+tnum`. The proof is the `tnum` tag in
  the committed file's GSUB table, never a computed style.
- Apparatus is Barlow Condensed 700, uppercase, tracked; everything the user wrote or will accept is
  Archivo. `font-variant-numeric: tabular-nums` on every number. Radius zero. No shadow, blur,
  gradient or glass. Hairlines, not card edges.
- Every user-visible string comes from `src/ui/labels.ts`. UI language is English.
- WCAG 2.2 AA as a floor: pointer targets ≥24×24 CSS px, no state carried by colour alone, native
  focusable controls with an `ink`-themed focus ring. `axe-core` is evidence, never a conformance
  claim — no file or commit message may say the app conforms.
- No network request, no API key, no account at any point in this story. No `console` in committed
  code. No logging, no analytics, no telemetry, no CDN, no third-party script.

**Never:**
- No starter template, and no placeholder modules: directories from the Structural Seed that this
  slice does not use are not created empty.
- Out of scope, owned by later stories: the capture field and records (1.2), date-word parsing (1.3),
  hash routing and every destination beyond Today, Task detail and the store (1.2, 1.4), the PWA
  manifest, icons and service worker (1.8). The three PWA packages are installed so the lockfile is
  complete, and stay unwired.
- Nothing purple renders anywhere in this story — purple means a proposal awaiting the user, and
  proposals arrive in Epic 2.
- No headless or primitive component library, no animation library, no date library.
- No measured latency and no confirmed provider is stated anywhere: NFR-2's 10 s is provisional and
  OQ-1 is unmeasured.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Supported Node | Node 22.13+/24/26+, clean clone | `npm ci` installs 473 packages; `npm run dev` serves on localhost | N/A |
| Unsupported Node | Node 23 or 25 | `npm ci` fails naming the required range | `engine-strict=true`, not a warning |
| No tasks | App opens | `m9` first run renders: wordmark, date, `NOTHING ON FILE YET` / `0 TASKS`, the 19px line, the two prose lines, the offline line, Today | N/A |
| Header date | Clock port reads the system calendar | header reads `MON 16 NOV` in tabular numerals | formatter is pure; the e2e asserts the format, never a value |
| Raw hex outside theme | `#8E2E7E` in a `.tsx` or `.css` file | `npm run lint` exits non-zero naming file and line | scanner reports every hit, not the first |
| Banned global in core | `src/core/x.ts` reads `Date.now()` | `eslint` reports an error on that line | one rule covers the whole ban list |
| Narrow viewport | 360 px | no horizontal scroll; `axe-core` reports no violations | N/A |
| Wide viewport | 1280 px | no horizontal scroll; `axe-core` reports no violations | N/A |

## Decisions

Taken at CHECKPOINT 1, 2026-11-25:

- **Shell.** This story builds `src/ui/shell/` with one inert destination, Today: the tab bar at
  360 px and the 196 px nav rail at 1280 px, per UX-DR15's geometry. Story 1.4 adds hash routing and
  the remaining destinations to the same component rather than replacing it, so its AC 4 and AC 5
  verify what exists rather than create it. No router here — the single destination is current and
  inert.
- **Header date.** This story introduces the Clock port, its one `Date`-touching adapter, and the
  pure `LocalDate` display formatter, so the header carries a real date as `m9` draws it. Story 1.3
  imports them rather than creating them, which is what `epics.md` already maps to Epic 1 (NFR-10).
- **Spec size.** Kept whole at roughly 3,200 tokens rather than split at the CI seam `epics.md`
  names, so all seven acceptance criteria land in one story and `main` is never merged without its
  gate.

</frozen-after-approval>

## Code Map

The repository has no source code. Everything below is new. Authority for each value:

- `.docs/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` — Stack table (18 pins, engines
  range, `.npmrc` rationale), Structural Seed, AD-1 (`core/` ban list), AD-2 (Clock port, the
  `LocalDate` shape, the single `Date`-touching adapter), AD-11 (CSP injection point,
  `tnum`/GSUB, vendored assets, secure context), AD-13 (TypeScript 6.0.3 pin), AD-17 (native controls,
  AA floor), AD-18 (43 tokens, `check-hex.mjs` inside lint), AD-19 (CI gate, `node-version-file`),
  AD-20 (error boundary).
- `.docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md` — frontmatter is the token
  source of truth; Typography (`display 19px/600, first run only`), Layout, Shapes.
- `.../EXPERIENCE.md` — voice, state vocabulary, `m9`'s place in the surface table.
- `.../mockups/kurs/m9-first-run.svg` — the reference frame. Where it and `DESIGN.md` disagree,
  `DESIGN.md` wins and the frame is the defect.
- `.docs/planning-artifacts/epics.md` — Story 1.1's seven AC; UX-DR1/3/4/14/15/20/22; the slicing and
  reuse contract (`theme.css`, `labels.ts` and the CI workflow are owned here and extended later).
- `.gitattributes` — already declares `* text=auto eol=lf` and `*.woff2 binary`. Do not touch it, and
  never "fix" line endings inside a diff.

Not to change: every file under `.docs/planning-artifacts/` and `.logs/`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- the 18 exact pins, `engines` verbatim, and the scripts `dev`, `build`,
      `preview`, `typecheck`, `lint`, `test`, `test:e2e` -- AC 1, AD-13
- [x] `package-lock.json` -- generated once, committed, then verified by a clean `npm ci` -- AC 1
- [x] `.npmrc`, `.nvmrc` -- `engine-strict=true`; `26` -- AC 1
- [x] `tsconfig.json`, `vite.config.ts` -- strict TS; React and `@tailwindcss/vite` plugins; the
      build-only CSP injection -- AC 1, AD-11
- [x] `eslint.config.js` -- typescript-eslint flat config, plus the `src/core/` override carrying the
      whole AD-1 ban list (`no-restricted-globals` for bare globals, `no-restricted-properties` for
      `Math.random`, `window.localStorage` and `Date.now`, `no-restricted-imports` for React) -- AC 5
- [x] `scripts/check-hex.mjs` -- plain-Node scanner: any raw hex outside `src/ui/theme.css` exits
      non-zero naming file and line -- AC 6, AD-18
- [x] `scripts/check-bundle-key.mjs` -- CI's fifth check: scans `dist/` for an API-key pattern -- AC 4
- [x] `src/fonts/` -- Archivo 400 and 600, Barlow Condensed 700 as subset `woff2`; `OFL.txt`; and
      `SUBSET.md` recording the exact `pyftsubset` invocation and source revision -- AC 3
- [x] `src/core/localdate.ts` -- the `LocalDate` type and the pure display formatter (`MON 16 NOV`);
      the only core module doing calendar arithmetic -- AD-1, AD-2
- [x] `src/ports/clock.ts`, `src/adapters/system-clock.ts` -- `today(): LocalDate`, and the only file
      in the repository that touches `Date` -- AD-2, NFR-10
- [x] `src/ui/theme.css` -- all 43 tokens under `@theme`, plus the `@font-face` rules -- AC 3, UX-DR1
- [x] `src/ui/labels.ts` -- every string on the surface, English -- UX-DR18, AD-9
- [x] `src/ui/shell/Shell.tsx` -- 40 px header with the date, 14 px gutters and the 46 px tab bar at
      360 px; 196 px nav rail and 26 px gutters at 1280 px; Today the one inert destination --
      UX-DR15, slicing contract
- [x] `src/ui/first-run/FirstRun.tsx` -- the `m9` surface inside the shell -- AC 2, AC 7
- [x] `src/ui/components/ErrorBoundary.tsx` -- minimal recovery panel, never a blank page; 1.4
      extends it per route -- AD-20
- [x] `index.html`, `src/main.tsx`, `src/vite-env.d.ts` -- the one composition root; no CSP tag in the
      HTML -- AC 1, AD-11
- [x] `tests/unit/theme-tokens.test.ts` -- parses `theme.css`: exactly 43 tokens, the 16/13/3/11
      breakdown, the four pairs counted once -- AC 3
- [x] `tests/unit/fonts-tnum.test.ts` -- reads each committed `woff2` and asserts `tnum` in its GSUB
      FeatureList -- AC 3, AD-11
- [x] `tests/unit/localdate.test.ts` -- the formatter against injected `LocalDate`s, including month
      and weekday boundaries, never reading the system clock -- NFR-10, AD-2
- [x] `tests/unit/core-purity.test.ts` -- runs ESLint programmatically on fixture sources under
      `src/core/`, asserting each banned reference errors and a pure module passes -- AC 5
- [x] `tests/e2e/first-run.spec.ts`, `playwright.config.ts` -- Chromium against `vite preview` at
      360 px and 1280 px: `axe-core` clean, `scrollWidth <= clientWidth`, the surface's text present
      -- AC 2, AC 7
- [x] `.github/workflows/ci.yml` -- `node-version-file: .nvmrc`, `npm ci`, then the five checks:
      typecheck, lint, Vitest, Playwright + `axe-core`, bundle key scan. No key, no network, and the
      build fails if any check fails -- AC 4, AD-19

**Acceptance Criteria:**
- Given a clean clone on Node 26, when `npm ci && npm run dev` runs, then the app serves on localhost
  with no key, account or network access.
- Given Node 23 or 25, when `npm ci` runs, then it fails naming `^22.13.0 || ^24.0.0 || >=26.0.0`.
- Given the built artifact, when it is served, then its `index.html` carries a CSP whose `connect-src`
  admits only the Anthropic host, and `npm run dev` is unaffected.
- Given `main` at this story's merge, then every committed check passes — which is what SM-2 is
  measured against.

## Implementation Notes

Implemented 2026-11-25 on `story/1-1-clean-clone`. Everything in the task list exists; the six
Verification commands and both manual checks pass. What follows is only what a reader of the spec
would not predict from it.

**Three type-only packages beyond the Stack table's eighteen.** React 19 ships no type
declarations, so `npm run typecheck` — AC 1's first check and AC 4's first CI check — cannot pass on
the eighteen pins alone. `@types/react@19.3.2`, `@types/react-dom@19.3.0` and `@types/node@26.6.10`
are added as exact devDependencies. All eighteen spine pins are present at their stated versions and
every dependency in the manifest is an exact version; `tests/unit/ci-checks.test.ts` now asserts
both, so the pin discipline is mechanical rather than remembered.

**The package count moved, and the figure is not an assertion.** The matrix says `npm ci` installs
473 packages. With the three type packages, a clean `npm ci` on Node 26.12.1 reports *added 472,
audited 479*. The count is lower, not higher, because `npm install` (which produced the spine's 473)
and `npm ci` do not resolve optional platform packages identically — the figure is a property of the
npm invocation, not of the dependency set, and should not be read as something a grader can check.
Changing the matrix needs `bmad-correct-course`; it is frozen here.

**`--layout-features+=tnum`, with the `+=`.** AD-11 and the task list both spell this
`--layout-features=+tnum`. fontTools 4.62.0 reads that as a one-element list holding the literal
string `+tnum`, which matches no feature tag, so it drops **every** layout feature — `tnum`
included — and writes a font with an empty `GSUB` FeatureList, silently. The first subset run here
did exactly that. `src/fonts/SUBSET.md` records the working command and why; the spine's spelling is
a defect for `bmad-correct-course`. This is also the clearest vindication of AD-11's insistence that
the proof be the committed file: nothing else would have caught it.

**`frame-ancestors` is not in the CSP.** A browser ignores it when the policy arrives in a `<meta>`
element and logs that it is ignoring it. It belongs on a response header, and this product has no
server by decision. The end-to-end console check is what found it.

**The header date reads `MON 16 NOV` at 1280 px too.** The `d1` frame draws `MON 16 NOV 2026` in the
desktop title row. The matrix states the format without a year, so one formatter serves both widths;
Story 1.4, which owns the desktop destinations, is where the year should be settled if it is wanted.

**Today is marked current, not made clickable.** The destination is a list item carrying
`aria-current="page"`, not a link or a button. There is nowhere to navigate until Story 1.4 adds
hash routing, and AD-17 asks for native focusable controls — not for a control that does nothing.
1.4 turns the item into a link in the same component.

**Token names carry a Tailwind namespace; the values do not change.** DESIGN.md's `apparatus` is
`--font-family-apparatus` and its `apparatus-weight` is `--font-weight-apparatus`, because Tailwind
resolves a bare `font-apparatus` candidate against `--font-weight-*` before `--font-*` and the two
would collide on one class name. The block is `@theme static`, so all 47 declarations reach the
built stylesheet even where no utility consumes them yet — AC 3 then holds of the artifact and not
only of the source.

**`Intl` is on the lint ban list.** AC 5 does not name it; AD-1 does ("no `Intl` call that defaults
to the system zone"). Banning it outright in `core/` is stricter than AD-1 and costs nothing: the
calendar words are injected from `ui/labels.ts`, which is what AD-9 wanted anyway.

**The formatter takes its calendar words as an argument.** `formatHeaderDate(date, names)` rather
than `formatHeaderDate(date)`, because `MON` and `NOV` are user-visible strings and those live only
in `ui/labels.ts` (AD-9). It also removes the last reason for a date test to depend on the product's
copy.

**One test file beyond the task list.** `tests/unit/ci-checks.test.ts` guards the engines range, the
committed `.npmrc` and `.nvmrc`, the exact pins, the `lint` script's two-command shape, and both
scanners in each direction. Those were the only rules in this story confirmed once by hand and never
again; the unsupported-Node row of the matrix cannot be run from one Node process, so what is
asserted is the mechanism the failure follows from.

**Two known environment facts, neither a defect of this story.** `npm audit` reports 4 moderate
advisories in `workbox-build`'s transitive `glob`/`minimatch`; the only offered fix downgrades a
pinned package, and nothing in the three PWA packages is wired yet. And npm 11.20 declines to run
`esbuild`'s postinstall under its new `allowScripts` gate, printing a warning — esbuild resolves its
binary through the platform optional dependency regardless, and the build, unit suite and
end-to-end suite all pass.

## Spec Change Log

- 2026-11-25 — Execution checkboxes ticked; Implementation Notes written. No change to any frozen
  section. Two items in frozen text are contradicted by what the build showed and are recorded above
  for `bmad-correct-course` rather than edited here: the 473-package figure in the I/O matrix, and
  the `--layout-features=+tnum` spelling carried from AD-11.
- 2026-11-25 — Matrix test audit, run against the staged diff and a re-run of all six Verification
  commands. Rows 3-8 are each covered by a test that ran and passed. Two rows were put to the human,
  who ruled on both:
  - **Row 1, the 473-package figure.** Measured on a deleted `node_modules`: `added 472 packages,
    and audited 479`. The three `@types` packages are the cause and cannot be removed — React 19
    ships no type declarations, so `npm run typecheck` (AC 1's first check, AC 4's first CI check)
    cannot pass without them. Recorded as a defect in frozen text for `bmad-correct-course`; the
    matrix row is left exactly as approved, and no test asserts either figure, because the count is
    a property of the npm invocation rather than of the dependency set.
  - **Row 2, unsupported Node.** Not executable on a single Node version, so it carries mechanism
    coverage only: `tests/unit/ci-checks.test.ts` asserts the `engines` range verbatim and the
    committed `engine-strict=true`, and the behaviour was confirmed once by hand by narrowing the
    range until Node 26 fell outside, which made `npm ci` exit 1 naming the required range. The
    human accepted this coverage; a test that shells out to a real install was declined. The gap is
    that no automated check proves the failure itself — CI runs one Node major by design (AD-19).

## Review Triage Log

Three layers reported: blind-hunter (17), edge-case-hunter (28), verification-gap (7 gaps + 3 other).
52 findings, one row each. Gap-layer findings arrive pre-verified. No entry routed to intent_gap or
bad_spec, so `review_loop_iteration` stays 0 and no loopback was triggered.

### Patched

- **medium - the ban list is incomplete in four ways** (`eslint.config.js`). Verified: `no-restricted-globals`
  matches bare identifiers only, so `globalThis.localStorage`, `self.fetch` and `globalThis.performance.now()`
  lint clean under `src/core/`; `sessionStorage`, `indexedDB`, `caches`, `location`, `history`,
  `XMLHttpRequest`, `WebSocket` and `requestAnimationFrame` are absent from the list; `no-restricted-imports`
  `patterns` use `../ports/*`, which a nested `src/core/sub/x.ts` evades with `../../ports/clock`; and
  `react-dom/client` and `react/jsx-dev-runtime` are unlisted. `banned.ts` carries no `ban:` line for the
  inward-dependency patterns while `core-purity.test.ts` asserts the fixture covers the whole list - so AC 5
  reads as mechanical while four spellings of the same violation pass. Reported by blind-hunter and
  edge-case-hunter independently; grouped on one root cause.
- **medium - `systemClock.today()` is untested** (`src/adapters/system-clock.ts:13-18`). Verified: no test
  imports it. Changing `getMonth() + 1` to `getMonth()`, or `getDate()` to `getUTCDate()`, still satisfies the
  e2e shape regex, and `localdate.test.ts` injects every date by hand. The repository's one real clock read can
  be off by a month or a day near midnight with every committed check green.
- **medium - `npm run dev` has no automated check** (`vite.config.ts:47`, `playwright.config.ts:44-49`).
  Verified: the e2e runs against `vite preview` only and CI has no `dev` step. Deleting `apply: 'build'` makes
  the CSP apply in development, where `script-src 'self'` blocks react-refresh and `connect-src` blocks the HMR
  socket - `npm run dev` then shows nothing while the built artifact stays byte-identical and all five checks
  pass. AC 1's headline claim can regress on `main` undetected.
- **medium - the CSP is asserted at `connect-src` only** (`tests/e2e/first-run.spec.ts:84-96`). Verified: the
  test extracts one directive. `default-src *` or `script-src 'self' 'unsafe-inline'` leaves it green, the page
  renders, and the console and axe tests pass. AD-11's mechanical half can be loosened to near-nothing.
- **medium - `check-hex.mjs` is exercised against `.tsx` only, and is blind to several file kinds**
  (`tests/unit/ci-checks.test.ts:122-139`, `scripts/check-hex.mjs:22-32`). Verified: the matrix row names
  `.tsx` or `.css`, and no test writes a `.css`, `.html` or `.svg` offender; `.mts`, `.cts`, `.json`,
  `.webmanifest`, `.scss` and `.yml` are unscanned, which Story 1.8's manifest colours would walk straight
  through. Also `TOKEN_FILE` is compared as a root-relative string, so any invocation root but the repository
  root reports `theme.css` itself as 16 violations.
- **medium - `check-bundle-key.mjs`'s second pattern is unreachable by its tests, and an empty directory
  passes** (`scripts/check-bundle-key.mjs:16-26,59-96`). Verified: the fixture key is hyphen-separated, so it
  matches pattern 1 only; pattern 2 needs 40+ unbroken alphanumerics after `sk-` and no test input reaches it.
  A missing directory fails, but an existing empty one scans 0 files and exits 0, proving nothing. The plural
  branch is also missing on the findings line.
- **medium - the 43 token values are counted, never compared to `DESIGN.md`**
  (`tests/unit/theme-tokens.test.ts`). Verified: no assertion reads a value. Changing `--color-ink` to
  `#000000`, or `--text-body` to `11px`, keeps the count at 43 and the 16/13/3/11 breakdown intact;
  `check-hex` exempts the file by design and the e2e pins none of those values. AC 3's values-verbatim is a
  head-count. The parser also matches only the first `@theme` block, and `categoryOf` silently files an
  unrecognised prefix as typography while `-min`/`-max` is stripped from any name, not only the four pairs.
- **medium - the recovery button cannot recover** (`src/ui/components/ErrorBoundary.tsx:41-43`). Verified:
  `recover()` sets `failed: false` and re-renders the same subtree, so a deterministic render error - the
  common case - re-throws at once and the button is inert. Reported by all three layers.
- **medium - `forbidOnly: false` lets a committed `test.only` shrink the gate** (`playwright.config.ts:23`).
  Verified: a stray `.only` reduces 18 tests to 1 and still exits 0, so AC 7 goes silently unverified.
- **medium - three e2e assertions are narrower than their claims**
  (`tests/e2e/first-run.spec.ts:36-42,99-112,147-165`). Verified by reading each: the off-origin filter is a
  `http://localhost:` prefix test, so a request to any other localhost port counts as on-origin; the purple
  sweep checks `color`, `backgroundColor`, `borderTopColor`, `fill` and `stroke` only - missing `outline`,
  `boxShadow`, the other three border sides, pseudo-elements and the proposed-wash colour entirely; the
  console check records only `error` and `warning`.
- **low - CI hygiene** (`.github/workflows/ci.yml`). Verified: `on: push:` is unqualified alongside
  `pull_request:`, so install, Chromium download and 18 e2e tests run twice per push on a branch with an open
  PR; there is no `concurrency`, no `timeout-minutes`, and the Playwright trace is retained on failure but
  never uploaded, so a CI-only failure leaves nothing to inspect.
- **low - user-visible copy outside `labels.ts`** (`index.html:8-11,13`). Verified: the `<title>` duplicates
  `labels.appName`, which is otherwise unread, and the meta description is a full sentence. The spec's Always
  clause puts every user-visible string in one file, and a tab title is user-visible.
- **low - two code comments overstate their invariant** (`src/adapters/system-clock.ts:5`,
  `src/core/localdate.ts:11`). Verified: `pure.ts:23` calls `new Date(Date.UTC(...))` and `banned.ts:27-28`
  call `Date.now()` and `new Date()`, both committed under `src/core/`, so a grep for the single time boundary
  returns three files; `isoOf()` in `pure.ts` also does calendar arithmetic. The claims hold of shipped code
  only, and should say so.

### Deferred

- **medium - `ErrorBoundary` has no test of any kind.** Verified: nothing imports it but `main.tsx`, Vitest is
  `environment: 'node'` with a `tests/unit` include, and no `jsdom`, `happy-dom` or `@testing-library/*` is
  installed. Returning `{ failed: false }` from `getDerivedStateFromError` passes every committed check.
  Closing it needs a DOM environment the pinned stack deliberately excludes; filed for Story 1.4, which
  extends the boundary per route and first has a route that can throw.
- **low - pixel literals route around the token system.** Verified: eleven arbitrary-value utilities across
  the three components, with the 1.2px block bound and the hairline repeated in four places. `check-hex.mjs`
  sees only colours. Tokenising them adds `@theme` entries, which collides with AC 3's exact 43 - so it needs
  `bmad-correct-course` on DESIGN.md, not a patch here.
- **low - `check-hex.mjs` is blind to `rgb()`, `hsl()` and `oklch()` notations.** Verified: a component could
  write the purple as `rgb(142, 46, 126)` and pass. Scanning those forms would also flag the e2e's own
  legitimate rgb() constant, so the fix needs a scope rule rather than another pattern.
- **medium (latent) - the CSP constrains later stories in two unrecorded ways.** Verified:
  `connect-src https://api.anthropic.com` omits `'self'`, so any same-origin fetch from the document is
  blocked - and the e2e locks the directive with exact equality. `style-src 'self'` with no `'unsafe-inline'`
  forbids React inline style attributes. Story 1.8's service worker and any later inline style will meet these.
- **low - `engines` admits odd Node majors above 26.** Verified: `>=26.0.0` lets 27 and 29 through, which is
  the opposite of the reason 23 and 25 are excluded. The string is required verbatim by the spine's Stack
  table, so changing it is `bmad-correct-course`, not a patch.
- **low - no run instructions for AC 1's grader.** Verified: `README.md` is 9 lines and never mentions Node,
  `npm ci` or `npm run dev`; the only thing that tells a grader the Node range is an `EBADENGINE` failure.
  Epic 5 owns the README.

### Rejected

- **reject, fix would edit this build's spec - the Acceptance Criteria section writes four bullets while the
  document references AC 1-AC 7 throughout.** Real and confirmed, but the only fix is editing this spec, which
  triage may not do. Raised with the human separately: the four written bullets cover AC 1, the Node range,
  the CSP and the merge gate, while AC 2, 5, 6 and 7 are referenced by number and never written out.
- **false - `sprint-status.yaml` and the spec disagree about status.** Transient workflow bookkeeping, not a
  defect in the change: step-03 set `in-progress`, step-04 set the spec to `in-review`, and step-05 syncs the
  tracking file. The diff captured the midpoint.
- **low, rejected - CI proves one Node major, not the range.** Real: `node-version-file: .nvmrc` pins 26 while
  `engines` claims 22.13 and 24. A grader follows `.nvmrc`, a `strategy.matrix` triples runner time for a
  range this project does not ship against, and the spec and AD-19 both specify the single version file.
- **low, rejected - the header date is frozen for the life of the tab** (`src/main.tsx:30`). Real:
  `systemClock.today()` is read once at module load, so a tab open past local midnight shows yesterday. On a
  first-run surface with no tasks this is cosmetic, and the fix adds state plus a `visibilitychange` listener
  and a midnight timer. Carry into Story 1.2/1.3, where due dates make it material.
- **low, rejected - `LocalDate` is a bare `string` alias.** Real that the type system has no say, but the
  shape is AD-2's, so branding it is a planning change rather than a patch.
- **low, rejected - the `xl` breakpoint is `80rem`, not `1280px`.** Real: at a non-default root font size the
  desktop composition engages at a width other than the 1280 px AC 7 measures. Browser zoom scales rem and px
  together, so only an explicit larger-text setting reaches it, and declaring `--breakpoint-xl` adds a 44th
  `@theme` entry that breaks AC 3's exact count.
- **low, rejected - `daysInMonth` returns 0 for `NaN` or a non-integer month**
  (`src/core/localdate.ts:50-54`). Real that 0 is indistinguishable from invalid, but every current caller
  arrives through `parseParts`, whose regex admits only two digits. Note for Story 1.3, which parses date
  words from user text.
- **low, rejected - the `scripts/` directory is neither linted with rules nor typechecked.** Real: no
  flat-config entry matches `.mjs`, so ESLint parses the scanners with no rules, and `tsconfig.json`'s
  `include` omits `scripts`. Both scanners are covered in both directions by `ci-checks.test.ts`, and closing
  it needs either `@eslint/js` (a 19th package) or `allowJs`/`checkJs`.
- **low, rejected - the directory walkers follow symlinks** (`scripts/check-hex.mjs:67-77`,
  `scripts/check-bundle-key.mjs:28-38`). Real that `statSync` follows links, so a loop would recurse and a
  dangling link would throw an uncaught `ENOENT`. Neither the repository nor `dist/` contains a symlink, and
  guarding adds `lstatSync` plus try/catch to both walkers.
- **low, rejected - `--strictPort` on 4173 fails opaquely when the port is taken**
  (`playwright.config.ts:44-50`). Real locally; a CI runner is fresh, and the alternatives read `process.env`,
  which the config deliberately avoids.
- **low, rejected - the no-horizontal-scroll check measures `documentElement` only**
  (`tests/e2e/first-run.spec.ts:129-136`). AC 7 is about horizontal scroll, and `documentElement` is the
  correct measure for it. An inner element clipping without scrolling the page is a different concern, not
  this assertion's claim.
- **false - `main.tsx` can still reach a blank page.** The `#root` throw sits outside the boundary, but
  `index.html` and `main.tsx` ship together in one build artifact: no input or state reaches that branch, so
  failing loudly there is correct behaviour rather than a defect. The `recover()` half of the same finding is
  patched above.
- **carried - matrix row 2 has no executing check.** Already traced and ruled on by the human earlier in this
  step and recorded in the Spec Change Log. Not reopened.

## Design Notes

**Why core purity is proven against fixtures.** AC 5 is a statement about the lint rule, not about a
module: fixture sources under `src/core/` prove the rule errors on each banned reference *and* passes
a pure module — both directions, which `core/localdate.ts` alone cannot demonstrate. The ESLint API
needs an absolute path and type-aware checking off for that to work.

**Why the shell exists before its router.** The shell is a layout component with one current,
non-interactive destination. Story 1.4 turns Today into a hash route and adds the other three to the
same file. Building the geometry now is what makes AC 7's 1280 px assertion meaningful: the nav rail
and the desktop gutters are the only reason the surface has a desktop composition at all.

**Why the e2e runs against `vite preview`, not the dev server.** The CSP exists only in the built
`index.html`, and the vendored subset fonts are only exercised by the build. Running Playwright
against the built artifact tests both; AC 1's `npm run dev` is confirmed separately.

**Font subsetting.** `pyftsubset` with `--layout-features=+tnum` and the Latin range the UI and a
Norwegian user's own sentences need — a subset missing `æøå` would render the user's text in a
fallback face, which the semantic type split cannot survive. The command is recorded rather than
scripted: it needs Python tooling that `npm ci` must not depend on.

## Verification

**Commands:**
- `npm ci` -- expected: installs with no `EBADENGINE`, no audit failure
- `npm run typecheck` -- expected: exit 0
- `npm run lint` -- expected: exit 0, both `eslint` and the hex scanner
- `npm test` -- expected: token count, `tnum` GSUB and core-purity suites pass
- `npm run build && npm run test:e2e` -- expected: `axe-core` clean and no horizontal scroll at both
  widths
- `node scripts/check-bundle-key.mjs dist` -- expected: exit 0, no key pattern in the bundle

**Manual checks:**
- `npm run dev` serves and renders the surface — the dev server is not CSP-constrained.
- The rendered surface against `m9-first-run.svg`: wordmark, counts, the 19px line, the two prose
  lines, the offline line. Nothing purple.
