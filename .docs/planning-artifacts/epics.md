---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - prds/prd-To-Do-List-2026-10-31/prd.md
  - prds/prd-To-Do-List-2026-10-31/addendum.md
  - architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  - ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - ux-designs/ux-To-Do-List-2026-11-16/EXPERIENCE.md
  - ux-designs/ux-To-Do-List-2026-11-16/mockups/kurs/
  - pre-ce-constraints-2026-11-22.md
  - ../../PRODUCT.md
---

# To-Do-List - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for To-Do-List, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

**Binding phase input:** `pre-ce-constraints-2026-11-22.md` (`binds: bmad-create-epics-and-stories`) carries seven decisions taken before this phase ran and a ten-point checklist this breakdown must satisfy. Its constraints are not restated in full below; they govern every epic and story in this document.

**ID convention.** The PRD's own identifiers are used verbatim — `FR-1` … `FR-23`, `NFR-1` … `NFR-10`, `SM-1` … `SM-5`, `SM-C1` … `SM-C3`, `AD-1` … `AD-20` — so acceptance criteria cite the requirement they implement (constraints checklist 2, 7). FR numbering skips by section: FR-23 belongs to §4.1 and FR-22 to §4.2.

**Tier** in the lists below is PRD §6.3's fixed cut order: build in tier order, cut from the bottom, never from the middle.

## Requirements Inventory

### Functional Requirements

| ID | Requirement | Tier |
| --- | --- | --- |
| FR-1 | Create a Task from task text alone; it persists with Priority `medium`, no Tags, no Summary, survives reload, needs no network, never blocks on the Suggestion Engine. | 1 |
| FR-2 | Read Tasks: see all non-archived Tasks and open one to see every field in §3's definition; the default view excludes archived and includes completed-but-unarchived. | 1 |
| FR-3 | Update a Task: task text, due date, Project, notes, Tags, Priority and Summary each change independently and persist; editing a field from an accepted Suggestion overwrites it without re-triggering the engine. | 1 |
| FR-4 | Delete a Task permanently; absent from all views and storage after reload; distinct from completion and Archive. | 1 |
| FR-5 | Complete a Task and un-complete it; a completed Task leaves active Smart Lists at once and stays retrievable until archived. | 1 |
| FR-6 | Produce a Suggestion (Tags, Priority, Summary) from a Task's task text and due date; identical output shape whichever implementation ran; never applied without FR-10. | 1 |
| FR-7 | Rule Engine always available with the fixed rules: tag set `school`/`group`/`work`/`personal`, the two keyword tables, whole-word case-insensitive matching, multi-tag proposal in table order, `high` beats `low`, no match → `[]` + `medium`; a pure function; Summary is truncation, not summarization. | 1 |
| FR-8 | Suggestion never blocks capture: the Task appears in the list no later than 100 ms after submit (engine excluded), shows a pending indicator while a Suggestion is in flight, stays fully editable, and is unaffected if the Suggestion never arrives. | 1 |
| FR-9 | Model Engine is used only when an API Key is configured **and** Cloud Suggestions is on; on any failure the Rule Engine serves instead. Transient failures are fully silent; the three persistent failures (invalid key, exhausted quota, organization forbids browser calls) are silent in the flow and surfaced only in Settings. | 2 |
| FR-10 | Review each part of a Suggestion independently — accept, edit or reject Tags, Priority and Summary separately, in any combination, with single-step undo of an acceptance. "Accept all" / "Reject all" are composites adding no behaviour the per-part actions lack; no part is applied without an explicit accept or edit. | 1 |
| FR-11 | Disclose which engine ran: every Suggestion is attributed in the review UI, and Settings states plainly whether a key is configured, which implementation is active, and — after a persistent failure — the reason, with the organization-policy case worded apart from a rejected key. Settings only: no popup, banner, toast or badge. | 2 |
| FR-12 | Due-window Smart Lists "Due this week" and "Need Attention". Current week is Monday–Sunday inclusive in device local time. A Task due in the past and not completed appears in Need Attention; a completed Task and a Task with no due date appear in neither. | 1 |
| FR-13 | Priority Smart List of Tasks at Priority `high`; membership updates immediately on accept, edit or completion. | 1 |
| FR-14 | Tag Smart List per Tag in use; a Tag no non-archived Task carries produces no list; a newly accepted Tag's list appears without a reload. | 1 |
| FR-15 | Smart List placement is asserted against the Fixture from the named lists (Due this week, Need Attention, High priority, one per FR-7 Tag), against the Fixture's fixed reference date. Need Attention is deliberately **not** asserted from the Fixture — it is covered by selector unit tests. | 1 |
| FR-16 | Archive completed Tasks after a retention window (30 days default, user-configurable); changing the window re-evaluates existing completed Tasks; an archived Task is retrievable, not deleted. | 1 (window configurability: 3) |
| FR-17 | Supply and clear an API Key: stored on device only, survives reload, never in the repository or any committed file; clearing returns the app to Rule-Engine-only with no further network requests. | 2 |
| FR-18 | Cloud Suggestions is off until explicitly enabled — off on first run even with a key present, saving a key never enables it, clearing and re-saving does not re-enable it, the disclosure precedes enabling, and turning it off stops all outbound requests immediately. | 2 |
| FR-19 | Fixture exists and is committed: 10–15 entries, each with expected Tags, Priority, parsed due date and Smart List placement, the fixed reference date **Monday 2026-11-16** recorded in the file, at a documented path named in the README, with the enumerated hard cases present. | 1 |
| FR-20 | Harness measures Rule Engine accuracy against the Fixture, per field (Tags, Priority, due date, placement; Summary apart), with no key and no network, against the Fixture's fixed reference date, naming the entries that failed. **Prerequisite: FR-19.** | 1 |
| FR-21 | Harness can measure the Model Engine on the same Fixture in the same format; skipped with a clear message, not an error, when no key is present. **Prerequisite: FR-19.** | 2 (last) |
| FR-22 | Request a fresh Suggestion via an explicit "Suggest again"; never produced automatically; replaces the pending Suggestion and is reviewed through FR-10; accepted values are not overwritten until the matching part is accepted. | 3 |
| FR-23 | Parse simple date words from task text into the due date — `today`, `tomorrow`, `Monday`–`Friday` in full, `next week`, English only, whole words, case-insensitive, first match wins, weekday resolves to the next occurrence (the reference date itself if it is that weekday), nothing else recognized and nothing guessed. Applied directly, outside FR-10's review, and editable at once. | 1 |

### NonFunctional Requirements

| ID | Requirement | Tier |
| --- | --- | --- |
| NFR-1 | Capture latency: creating a Task is never gated on the Suggestion Engine; the limit is FR-8's 100 ms. | 1 |
| NFR-2 | Model Engine timeout, after which the Rule Engine serves. **Provisionally 10 s, explicitly unverified** (OQ-1 unmeasured), read from one named constant `MODEL_ENGINE_TIMEOUT_MS` in `core/constants.ts`. | 2 |
| NFR-3 | Offline correctness: with no network the app is fully functional and no view shows an error, spinner or empty state attributable to the missing network. FR-8's pending indicator is the one exemption. | 1 |
| NFR-4 | Responsive and operable: every flow, FR-10's accept/edit/reject specifically, usable at 360 px and 1280 px with no horizontal scrolling, demonstrated at both. **WCAG 2.2 AA as a floor** (AA, not AAA), checked mechanically with `axe-core`; never claimed as conformance. | 1 |
| NFR-5 | Determinism of the Rule Engine: same input, same Suggestion, always. | 1 |
| NFR-6 | No missing Suggestion: every Model Engine failure results in a Rule Engine Suggestion, with no error, popup, banner or interrupted flow in capture or review; the sole exception is FR-11's Settings status after a persistent failure. | 2 |
| NFR-7 | Reproducible from a clean clone: the README takes a fresh clone to a running app, and the FR-20 harness runs from the same clean state. | 1 |
| NFR-8 | Every fallback path covered by automated tests against a mocked Anthropic API; the whole suite runs with no API Key and no network, in CI and on a grader's machine. | 2 |
| NFR-9 | The AI decision is documented in the deliverable: README prose on the two implementations, why they beat rules-only and a local model, the privacy trade-off and consent, the measured FR-21 results, plus a screenshot or recording of a Model Engine Suggestion attributed as such. | 1 (FR-21 results: 2) |
| NFR-10 | Date-dependent behaviour is tested against a fixed injected reference date, never the system clock — FR-23 parsing, FR-12 placement, FR-15 assertions, FR-16 window, and the FR-20/FR-21 harness. | 1 |

**Success metrics these requirements are measured by** (PRD §7, carried here because stories must not invent their own targets): SM-1 Rule Engine per-field correctness on the Fixture with a committed written floor per field (numbers unknown until the first run, OQ-6); SM-2 grader runnability as a binary pass; SM-3 a committed engine comparison; SM-4 capture never blocked; SM-5 builder's own usage (not graded). Counter-metrics that no story may optimize: SM-C1 Suggestion acceptance rate, SM-C2 Fixture size and difficulty, SM-C3 Model Engine usage share.

### Additional Requirements

From `ARCHITECTURE-SPINE.md` (AD-1 – AD-20, Consistency Conventions, Stack, Structural Seed). Every story must be able to name its row in the spine's **Capability → Architecture Map** (constraints checklist 7).

**Starter template:** none. The architecture specifies no starter kit or scaffold; it fixes a **Structural Seed** — an exact directory tree (`src/core`, `src/ports`, `src/adapters`, `src/app`, `src/ui`, `fixture/`, `harness/`, `tests/e2e/`, `.github/workflows/ci.yml`) plus a pinned dependency table. Epic 1 Story 1 is therefore project initialization against that seed and those pins, not a template clone.

- **Layering, dependency direction strictly inward** (paradigm, AD-1): `core` depends on nothing; `ports` on core types; `adapters` and `app` on ports + core; `ui` on app + ports + core; `harness` on core + adapters + ports. Composition happens exactly twice — `src/main.tsx` and `harness/run.ts`; nothing else constructs an adapter. Layered, not vertical slices.
- **`core/` is pure** (AD-1): no `window`, `document`, `localStorage`, `fetch`, `process`, `navigator`, `performance`, `crypto`, `Math.random`, React or Vite-injected value; no ambient time (`Date.now()`, zero-argument `new Date()`, system-zone `Intl`); no identifier generation. Enforced by ESLint `no-restricted-globals` / `no-restricted-imports` scoped to the directory. Calendar arithmetic is permitted and confined to `core/localdate.ts`.
- **Time enters only through the Clock port** (AD-2): one operation `today(): LocalDate`; a `LocalDate` is `YYYY-MM-DD` in local calendar; **no instants exist in the domain**; `dueDate` and `completedAt` are both `LocalDate`; `Date`/`Date.now` reachable only in `adapters/system-clock.ts`; the harness injects the Fixture's reference date through the same port. Accepted consequence: completion carries no time of day.
- **`SuggestionService` is the only route from app to engine** (AD-3): it owns the consent gate, engine selection, the NFR-2 timeout, failure classification, fallback and FR-11 attribution; no `src/ui/` module imports an engine; at most one request in flight per Task and "Suggest again" disabled while one is; fresh Suggestions are filtered against that Task's struck set. FR-9's precondition is one pure predicate `mayUseModelEngine(hasKey, cloudSuggestions)` in `core`, evaluated **per request**. Only `harness/` addresses engines by name.
- **Engines never throw** (AD-4): every implementation returns `EngineResult` — `{ok:true, suggestion, engine}` | `{ok:false, kind:'transient'}` | `{ok:false, kind:'persistent', reason:'invalid_key'|'quota_exhausted'|'org_forbids_browser'}`. Any `stop_reason` other than `end_turn` is a failure. The adapter validates against the zod schema in `core/suggestion.ts` and **bounds** the response: Summary truncated to one named maximum, Tag count and length bounded, Tags lowercased, any Tag outside FR-7's four dropped, Priority compared case-insensitively. A validation failure is `transient`, never an exception.
- **The timeout cancels** (AD-5): the request carries an `AbortSignal`; on timeout the Rule Engine's Suggestion resolves the call and a late response is dropped unwritten, unattributed, unlogged. The constant carries a comment marking the value provisional.
- **Persistence: three keys, one synchronous port, one writer** (AD-6): `localStorage` via `adapters/local-storage.ts` only; keys `todo.tasks.v1`, `todo.settings.v1`, `todo.apikey.v1`; `schemaVersion` on the task and settings documents with an ordered `migrateNtoN+1` chain applied on read; one named defaults factory failing closed (Cloud Suggestions `false`, retention 30 days); **the reducer is the single writer**; storage returns a `StorageResult` and never throws; a document failing validation is preserved under a backup key rather than discarded, and reported in Settings only. Cross-tab writes are last-writer-wins.
- **Derived values are computed; user acts are recorded** (AD-7): completion, archive status, Smart List membership and Band counts are computed — the Task persists `completedAt` only, never a `completed` or `archived` flag. The arrived Suggestion is persisted with its Task as a review record carrying the three proposed values, the engine, and `open`/`punched`/`struck` per control. The single-step undo slot lives in the store's reducer state, holds a **set** of field snapshots, is cleared by any subsequent action and is never persisted. In-flight requests live in one in-memory `pendingSuggestionTaskIds` set — the only source of FR-8's pending indicator. **The start triangle renders when the Task is in the in-flight set *or* carries an unresolved control** (two sources; implementing one is a reload bug). Archive is `completedAt !== null && dayDiff(today, completedAt) > retentionDays`; restore clears `completedAt` and the completion date is lost (accepted).
- **The API Key has two homes, neither the bundle** (AD-8): the app's key is runtime-only under `todo.apikey.v1`, never from a build-time variable, never logged; the harness's key is a Node environment variable, and `.env.example` documents `ANTHROPIC_API_KEY` for the harness alone, saying the app never reads it; `.gitignore` excludes `.env` and any real key file; **CI greps the built bundle for an API-key pattern**; the adapter is constructed with its key and browser-access flag by the composition root and reads neither `localStorage` nor `process.env`.
- **Predicates own membership, labels own words** (AD-9): membership is a predicate in `core/selectors.ts` named for its condition (`isPastDue`); display strings live only in `src/ui/labels.ts`; the canonical label is `Need Attention`, singular — "Needs Attention" must not enter code, UI strings or test selectors.
- **Tier 1 may not depend on Tier 2 or Tier 3** (AD-10): every Tier 2/3 capability is additive — the Project field is an optional property no Tier 1 selector reads; the configurable retention window is a settings value defaulting to 30. FR-22 is the stated exception (it adds a `SuggestionService` path and depends on the struck-set filter). **No feature-flag machinery.** Cutting is deleting a file; the epics produce the tier-to-file mapping that becomes an import-boundary lint rule.
- **One network host, one calling file, an offline shell** (AD-11): the only permitted request is to the Anthropic API from `adapters/anthropic-engine.ts`, legal only with `anthropic-dangerous-direct-browser-access: true`, set by the browser composition root and not by the harness; the provider name appears in exactly one string constant in `ui/labels.ts`; enforced mechanically by a CSP `connect-src`; the service worker precaches the shell with `autoUpdate` and must not intercept or cache `api.anthropic.com`; typefaces, icons and all assets are vendored (no CDN, no analytics, no third-party script); font subsetting must preserve `tnum`; secure-context requirements mean a documented non-crypto id fallback and device testing over `localhost`/HTTPS/port forwarding, never plain-HTTP LAN.
- **The harness runs the same code and the same call the app runs** (AD-12): `harness/run.ts` imports the Rule Engine and selectors from `src/core/` directly — never a copy — and invokes the Model Engine through the same adapter with the same call shape; it injects the Fixture's reference date through the Clock port; the Fixture lives at `fixture/tasks.json`, committed, outside test code, named in the README; per-field reporting naming failed entries; **the command exits non-zero below the committed SM-1 floor**; SM-C2 guard — the Fixture may not drop below 10 entries or lose its enumerated hard cases; runs as `npm run harness` under `tsx` from a clean `npm install` with no key and no network.
- **Toolchain stays on TypeScript 6** (AD-13): `typescript` pinned to `6.0.3` (not `latest`); revisit only when `typescript-eslint`'s peer range widens, and only before the build starts.
- **The Model Engine call shape is fixed** (AD-14): lowest effort (`low`), thinking explicitly disabled, structured output via `output_config.format`, small `max_tokens`, no `temperature`/`top_p`/`top_k`; **exactly one call per capture** and one per explicit "Suggest again"; no batching, no response caching, no spend-cap machinery; the shape lives in one named constant read by both the adapter and the harness.
- **A Suggestion is applied only by review, one part at a time** (AD-15): no code path writes a Task field from a Suggestion except a per-control accept or edit; nothing re-runs the engine without an explicit user request — not editing task text, not reload, not navigation.
- **The URL hash is the single source of navigation state** (AD-16): Today, Lists, Archive, Settings plus Review and Task detail are hash routes, never component-local state; Back is a first-class control and must leave Review and Task detail rather than exiting the app; a minimal hand-rolled hash router is the seed.
- **Native controls, owned focus, mechanical accessibility check** (AD-17): every control is a native focusable element with a visible focus ring themed from the ink token; focus moves to the course panel when a Suggestion arrives and returns to the record when all three controls resolve; the undo control takes focus immediately after a punch; **Punch and Strike identical in size, weight, row position and confirmation cost, in markup and in tab order**; `axe-core` in CI through Playwright at both bound viewports; the panel-never-covers-type rule is a Playwright-verified layout contract and an SC 2.4.11 assertion.
- **The design system is declared once and enforced in CI** (AD-18): all 43 DESIGN.md tokens in `src/ui/theme.css` under Tailwind v4 `@theme`; **a raw hex colour outside `theme.css` fails CI**; `shadcn/ui`, Radix and an animation library are declined; CSS transitions carry the motion and `prefers-reduced-motion` is honoured.
- **CI is the gate** (AD-19): one GitHub Actions workflow on every push — typecheck, lint, Vitest, Playwright with `axe-core` at 360 px and 1280 px, the FR-20 harness, and the bundle grep — running **with no API Key and no network**, failing the build below the SM-1 floor; installs use `npm ci` against a committed lockfile with exact versions.
- **The app never shows the grader a blank page** (AD-20): a React error boundary wraps each routed surface and renders a plain recovery panel offering a return to Today, with the task document untouched — the single exception to "no error state in capture or review".
- **Consistency conventions** (binding on every story): PRD §3's glossary is the vocabulary — `Task`, `Tag`, `Priority`, `Summary`, `Suggestion`, `Project`, no synonyms (no "todo", "item", "label", "category"); kebab-case modules, PascalCase only for React component files; ids come from an **Id port** (`adapters/id.ts`, tests inject a counter); Priority is exactly `high`/`medium`/`low` lowercase with `medium` default; the Model Engine is bound to FR-7's same four Tags; the Rule Engine's Summary is a deterministic truncation and `date-words.ts` returns the matched span so the trailing date phrase can be stripped; one exported tokenizer in `core/` shared by the Rule Engine, the date parser and the Fixture's documentation; adapters return results and never throw, `core` functions are total; one store (`useReducer` + context) in `src/app/store.tsx`, every mutation a named action, free-text edits persisted on blur or debounce, never per keystroke; **no logging in the shipped app** and no `console` in committed code outside `harness/`; no runtime configuration mechanism — constants live in `src/core/constants.ts`; Vitest for core/adapters/service, HTTP-level mocks for the adapter's failure classification, port-level fakes for service flow, Playwright + `axe-core` at both widths, every date-dependent test injecting a fixed `LocalDate`, and **FR-8's 100 ms asserted by a Playwright check against a Fixture-sized document**.
- **Stack, pinned** (exact versions, verified 2026-11-18): TypeScript 6.0.3 · Vite 8.3.8 · @vitejs/plugin-react 6.3.0 · React / React DOM 19.3.1 · @tailwindcss/vite 4.3.5 · tailwindcss 4.3.5 · zod 4.6.7 · @anthropic-ai/sdk 1.10.0 · vite-plugin-pwa 2.0.0 · workbox-build 7.4.1 · workbox-window 7.4.1 · Vitest 5.1.1 · @playwright/test 1.65.1 · @axe-core/playwright 4.14.0 · eslint 10.15.0 · typescript-eslint 8.73.0 · tsx 4.23.15 · Node `^22.13.0 || ^24.0.0 || >=26.0.0`, 26 LTS recommended, odd majors 23 and 25 unsupported (declared in `package.json` `engines`, enforced by `.npmrc` `engine-strict=true`, recommended major in `.nvmrc`).
- **Named deliverable artifacts** that nothing else owns (AD-12): the committed FR-21 comparison at `.docs/results/engine-comparison.md`; the README prose NFR-9 enumerates; the screenshot or recording of a Model Engine Suggestion carrying FR-11's attribution.
- **Deferred by architecture, and not story scope:** NFR-2's final value (OQ-1), the provider confirmation, the prompt wording (tuned against the Fixture at build time), SM-1's per-field minimums (OQ-6), hosting, Norwegian task text, JSON export, suggested due dates, cross-tab merge, and scale past a few hundred Tasks.

### UX Design Requirements

From the locked `DESIGN.md` + `EXPERIENCE.md` pair (concept **06 "Kurs"**) and the 17 reference frames in `mockups/kurs/`. Where the documents and a frame disagree, the documents win and the frame is the defect.

| ID | Requirement |
| --- | --- |
| UX-DR1 | Declare all **43 design tokens** (16 colour, 13 typography, 3 radius, 11 spacing) in `src/ui/theme.css` under Tailwind v4 `@theme`, with the exact values in `DESIGN.md`'s frontmatter — including `row-height-desktop: 24px` and the `button-height-min: 24px` / `button-height-max: 26px` pair as raised on 2026-11-22. Four of the 43 are ranges declared as `-min` / `-max` pairs; each pair counts as one token, so the count and its 16/13/3/11 breakdown are unchanged. A raw hex outside `theme.css` fails CI (AD-18). |
| UX-DR2 | Enforce the **purple reservation**: `proposed` `#8E2E7E` marks a proposal not yet accepted and nothing else, anywhere. Each state ink does one job only — `due-week` yellow for the current-week window, `attention` olive for Need Attention only, `inert` blue for the archive and an engine not in use, `surface` white for settled. |
| UX-DR3 | Vendor both typefaces as subset `woff2` with the `tnum` feature preserved, and enforce the semantic split: **Barlow Condensed 700** uppercase tracked `0.6–1.5px` for all apparatus (control numerals, band labels, nav, column heads, counts, captions, button labels, status lines); **Archivo 400–600** for everything the user wrote or will accept. No second display face; apparatus is never set in Archivo. |
| UX-DR4 | `font-variant-numeric: tabular-nums` on every date, count and control number, without exception. |
| UX-DR5 | **Band** component: 22 px section header, colour naming the list (yellow tint Due this week, olive Need Attention, none for the rest), label left in condensed caps, live count right computed on render and never stored, 1.2 px `rule-strong` beneath. |
| UX-DR6 | **Record** component: 46 px on mobile — checkbox · sentence in Archivo · tag patch · priority ladder with its word · due pill, with the start triangle at the right edge when a control is open. Tapping the sentence opens Task detail; tapping the checkbox completes in place without navigating; a record with an open course stays fully editable. |
| UX-DR7 | **Control** component: a numbered circle in three states — *open* (white fill, 1.8 px purple stroke, purple numeral), *punched* (solid ink fill, white numeral, four corner pin-pricks), *struck* (white fill, secondary-ink stroke, ruled through corner to corner). Controls are joined by a vertical purple leg, with a dashed leg from the record to control 1. A control never changes state on its own. |
| UX-DR8 | **Course panel**: `proposed-wash` field at 50–55 % opacity bounded by a 1.4 px purple rule, holding the three controls; appears when a Suggestion arrives and leaves when all three resolve. Below the record at 360, beside it on the dedicated desktop review with a dashed leg across the gap, and a purple-ruled table module (one row per control) inside the desktop mosaic. **It must never overlap type** — rules and empty ground only (also SC 2.4.11, verified by Playwright). |
| UX-DR9 | **Start triangle**: an outlined equilateral triangle meaning exactly one thing — this Task still has a control open. It renders when the Task is in the in-flight set **or** carries an unresolved control (AD-7's two sources). |
| UX-DR10 | **Priority ladder**: three bars of rising height filled to the level, always beside the word. |
| UX-DR11 | **Engine chip**: a 10 px box carrying `R` or `M` followed by the engine name spelled out, present on every proposal everywhere one appears — there is no surface where a Suggestion is visible without its engine. |
| UX-DR12 | **Due pill** in the ink of its window — `due-week` yellow inside the current week, `attention` olive past due, and an outlined pill for a date later than this week; **no pill at all when there is no due date**, which is drawn as an em-dash and **named “No due date” for assistive technology** — the glyph is decorative, the word is the accessible content, and neither is a focusable control. Four states, exactly as `d1-today.svg` draws them. **Tag patch** as a terrain-patch rectangle in `attention-pale` naming its context. |
| UX-DR13 | **Legend**: the published key for every ink and every mark, closing every long surface. It is content, not chrome — the standing proof that nothing is encoded by colour alone. |
| UX-DR14 | **Geometry**: radius zero on everything except the control circle and the single settings toggle; no shadow, glass, blur or gradient anywhere; depth by overlap and offset only; 1 px `rule` row separators and 1.2 px `rule-strong` block bounds instead of card edges; no box inside a box. |
| UX-DR15 | **Shell and layout**: at 360 — 14 px gutters, 40 px header, 46 px bottom tab bar, one column; at 1280 — 196 px nav rail in `chrome`, 26 px gutters, two-column mosaic, 24 px dense table rows, legend as its own module. Groups tight inside, 10–16 px between a band's last record and the next band, more space above a heading than below. No horizontal scrolling at either width. |
| UX-DR16 | **Information architecture**: four top-level destinations — Today (default: capture field then the three derived lists), Lists (the three Smart Lists, one per Tag in use, All tasks, Untagged), Archive, Settings (the only place any engine state is ever visible) — plus Review and Task detail entered from a record, not navigated to. All six are hash routes with Back leaving Review and Task detail (AD-16). |
| UX-DR17 | **The 17 drawn surfaces** are the implementation target, each delivering its stated need: `m1`/`d1` Today · `m2` capture with course pending · `m3`/`d2` review with three controls open · `m4`/`d3` review editing one control · `m5`/`d4` review partial with undo · `m6`/`d5` task detail · `m7` a list and all the lists · `d6` archive · `m8`/`d7`/`d8` settings · `m9` first run. |
| UX-DR18 | **Voice and microcopy**: plain, specific, never alarming. An absence is a fact, never an error ("No API Key is configured.", followed by what *is* happening). Never a claim of correctness. The user's sentence is quoted, never paraphrased. Shortcuts are labelled as shortcuts — "shortcuts · they do nothing the three controls cannot". The three persistent failures are worded apart, with the organization-policy case stating the organization does not allow it and stopping there. UI language is **English**. |
| UX-DR19 | **The acceptance-rate guard** (SM-C1): Strike is exactly as reachable as Punch — same size, same weight, same row, no confirmation on either — and **Punch all / Strike all** are plain outline controls below a rule, never primary. Any change making accepting cheaper than rejecting is a regression. UI strings use the UX labels **Punch all** / **Strike all** for FR-10's "Accept all" / "Reject all". |
| UX-DR20 | **Accessibility floor — WCAG 2.2 AA**: pointer targets ≥24×24 CSS px everywhere; body and placeholder text ≥4.5:1 against its actual background, large text ≥3:1; no state carried by colour alone (ladder *and* word, chip *and* name, olive *and* the words, purple outline *and* numeral *and* triangle); every control a standard focusable web control with a visible focus ring themed from `ink`; focus moves into the course panel on arrival, returns to the record when all three resolve, and the undo control takes focus after a punch; real text at every size; `axe-core` at 360 px and 1280 px as evidence, never a conformance claim. |
| UX-DR21 | **No-match is a valid outcome**: a Task earning no Tag and `medium` Priority renders as an ordinary record reading "no tag", and the panel always carries **three** controls — never a two-control panel, never styled as a failure, an empty state or a prompt. |
| UX-DR22 | **State patterns**: pending (saved, in its lists, triangle, fully editable — the one indicator allowed offline); open/punched/struck per control in any combination on one Task at once; undo available immediately after a punch in the control's own block, one step, no stack, none across sessions; completed leaves the active lists at once keeping its punched controls; archived leaves default views restorable with its marks. **There is no error state in capture or review, ever**; the only empty state in the product is first run, because every other list reports a count of zero. |
| UX-DR23 | **Offline is the normal case**: everything except the Model Engine works with no network and nothing on screen admits the network is gone (NFR-3), the pending indicator exempted. |
| UX-DR24 | **PWA**: installable from a single codebase, install offered in Settings and never interrupted into the flow; CSS transitions carry the motion (UJ-1's climax included) and `prefers-reduced-motion` is honoured. |

### FR Coverage Map

Every FR reaches code through exactly one epic, except the three the tier order deliberately splits — FR-3, FR-11 and FR-16 — where the split is named rather than implied.

| FR | Epic | Covered as |
| --- | --- | --- |
| FR-1 | Epic 1 | Create a Task from task text alone, persisted and visible |
| FR-2 | Epic 1 | Task list and Task detail; archived excluded, completed-but-unarchived included |
| FR-3 | Epic 1 | Edit every field independently — **except Project, deferred to Epic 8** (§6.3 Tier 3) |
| FR-4 | Epic 1 | Delete, distinct from complete and archive |
| FR-5 | Epic 1 | Complete and un-complete, via `completedAt` only (AD-7) |
| FR-6 | Epic 2 | One Suggestion shape behind the `SuggestionEngine` port |
| FR-7 | Epic 2 | Rule Engine with FR-7's fixed tables, pure and offline |
| FR-8 | Epic 2 | Capture never blocked; pending indicator from the in-flight set; the 100 ms Playwright assertion |
| FR-9 | Epic 6 | Model Engine attempted only when permitted; transient and the three persistent failures |
| FR-10 | Epic 2 | Per-control punch / edit / strike, single-step undo, Punch all / Strike all |
| FR-11 | **Epic 2 + Epic 6** | Engine chip on every proposal (Epic 2, reading `R · Rule Engine`); Settings status for the three persistent failures (Epic 6) |
| FR-12 | Epic 3 | Due this week and Need Attention predicates in `core/selectors.ts` |
| FR-13 | Epic 3 | High priority Smart List |
| FR-14 | Epic 3 | One Smart List per Tag in use |
| FR-15 | Epic 4 | Placement asserted against the Fixture — **prerequisite FR-19** |
| FR-16 | **Epic 3 + Epic 8** | Archive at the fixed 30-day window (Epic 3); user-configurable window (Epic 8, §6.3 Tier 3) |
| FR-17 | Epic 6 | Supply, show and clear the API Key |
| FR-18 | Epic 6 | Cloud Suggestions off until explicitly enabled, with its disclosure |
| FR-19 | Epic 4 | The Fixture, in **its own story**, prerequisite of FR-20, FR-21, SM-1 and SM-3 |
| FR-20 | Epic 4 | Harness measures Rule Engine accuracy — **prerequisite FR-19** |
| FR-21 | Epic 7 | Harness measures the Model Engine on the same Fixture — **prerequisite FR-19** |
| FR-22 | Epic 8 | "Suggest again" (§6.3 Tier 3) |
| FR-23 | Epic 1 | Date-word parsing applied at capture, outside FR-10's review |

### NFR and Success-Metric Coverage

| Requirement | Epic | Covered as |
| --- | --- | --- |
| NFR-1 | Epic 1, asserted in Epic 2 | Capture never gated on the engine; the 100 ms limit is FR-8's test |
| NFR-2 | Epic 6 | The provisional 10 s timeout, one named constant, never called measured |
| NFR-3 | Epic 1, re-asserted Epic 3 | Offline shell and no network-attributable error, spinner or empty state |
| NFR-4 | Epic 1, inherited by every UI story | Both bound widths, no horizontal scroll, WCAG 2.2 AA floor |
| NFR-5 | Epic 2 | Rule Engine determinism |
| NFR-6 | Epic 6 | No missing Suggestion on any failure path |
| NFR-7 | Epic 5 | Clean clone to a running app; harness runs from the same state |
| NFR-8 | Epic 6 | Mocked-API tests for every FR-9 failure mode |
| NFR-9 | **Epic 5 + Epic 7** | README prose (Epic 5); measured FR-21 results and the attributed Model Engine screenshot (Epic 7, needs a real key and one real call) |
| NFR-10 | Epic 1, Epic 3, Epic 4 | Clock port (1); selector unit tests against an injected date (3); the Fixture's reference date in the harness (4) |
| SM-1 | Epic 4 | Per-field baseline and the committed written floor; CI exits non-zero below it |
| SM-2 | Epic 5 | Clean-clone binary pass verified with no key, no account, no network |
| SM-3 | Epic 7 | The committed engine comparison |
| SM-4 | Epic 2 | Capture never blocked, with the engine offline, slow or absent |
| SM-C1 | Epic 2 | The acceptance-rate guard: Strike exactly as reachable as Punch |
| SM-C2 | Epic 4 | The Fixture may not shrink below 10 entries or lose its hard cases |
| SM-C3 | — | Not a goal; no story optimizes Model Engine usage share |

### UX Design Requirement Coverage

| UX-DR | Epic |
| --- | --- |
| UX-DR1 tokens · UX-DR3 typefaces · UX-DR4 tabular numerals · UX-DR14 geometry · UX-DR15 shell and layout · UX-DR16 IA and hash routes · UX-DR23 offline · UX-DR24 PWA | Epic 1 |
| UX-DR6 record · UX-DR10 priority ladder · UX-DR12 due pill and tag patch (window inks completed in Epic 3) · UX-DR18 voice, declared in `ui/labels.ts` and applied by every epic | Epic 1 |
| UX-DR2 purple reservation (declared in Epic 1, exercised here) · UX-DR7 control · UX-DR8 course panel · UX-DR9 start triangle · UX-DR11 engine chip · UX-DR19 acceptance-rate guard · UX-DR21 no-match as a valid outcome · UX-DR22 review state patterns | Epic 2 |
| UX-DR5 band · UX-DR13 legend · UX-DR22 completed and archived states | Epic 3 |
| UX-DR20 accessibility floor | Declared Epic 1, inherited by every UI story, mechanically checked in CI from Epic 1 and verified on a clean machine in Epic 5 |
| UX-DR17 the 17 surfaces | `m1`/`d1` Epic 1 + Epic 3 · `m9` first run Epic 1 · `m2`, `m3`/`d2`, `m4`/`d3`, `m5`/`d4` Epic 2 · `m6`/`d5` Epic 1, extended in Epic 8 · `m7` Epic 3 · `d6` Epic 3 · `m8`/`d7`/`d8` Epic 6 |

## Epic List

Eight epics, built in this order. The order is PRD §6.3's cut order made operational: **cut whole epics from the bottom, never stories from the middle** — which is what AD-10 means by "cutting is deleting a file, never unpicking a dependency". No epic requires a later epic to function.

Approved by the builder on 2026-11-22, with four structural decisions confirmed at the same time: the engine chip ships in Tier 1 while FR-11's Settings status waits for Tier 2; the Project field is split out of FR-3; Tier 3 is one trailing epic rather than three scattered stories; and NFR-9's screenshot belongs to Epic 7, so a missing API Key never blocks Tier 1.

### Slicing and reuse contract

Verified with the builder on 2026-11-22, before story creation. It adds no requirement and changes no architecture decision; it fixes ownership so two stories cannot write the same code.

**Stories are vertical; the codebase stays layered.** The spine's "Layered, not vertical slices" governs **module organization** — directories by layer, because one pure core serves two runtimes and feature-folders would duplicate it. It does not govern story shape. **Every story cuts through the layers it needs and ends in behaviour someone can observe and test**: no story builds a layer, a port or a component library for its own sake, and there is no "set up the project" story — Epic 1's substrate rides inside the first slice that reaches a visible surface (`m9` first run, then capture).

**Shared ownership, to keep the build DRY.** Each of these has exactly one owning story; every later story imports it and none re-implements it:

| Shared thing | Owned by | Consumed by |
| --- | --- | --- |
| `core/tokenize.ts` — the one whole-word, case-insensitive matcher | Epic 1 (FR-23's parsing) | Epic 2's Rule Engine (FR-7), Epic 4's Fixture documentation |
| `core/selectors.ts` — `isCompleted`, `isArchived` and the week definition | Epic 1 (FR-2 needs them to exclude archived Tasks) | Epic 3 adds the Smart List predicates and the Archive surface; Epic 4 asserts them |
| The **record** component, including the start-triangle slot | Epic 1 (UX-DR6) | Epic 2 drives the triangle from the in-flight set and the review record (AD-7's two sources); Epic 3 reuses the record in every list |
| `app/suggestion-service.ts` and the pure `mayUseModelEngine` predicate | Epic 2, built against the port with the Rule Engine as its only implementation and the predicate false with no key and no consent | Epic 6 plugs in the Anthropic adapter, the NFR-2 timeout and failure classification — it does not rebuild the service |
| `ui/labels.ts` and `ui/theme.css` | Epic 1 | Every UI story; a raw hex outside `theme.css` fails CI (AD-18) |
| The CI workflow | Epic 1 (typecheck, lint, Vitest, Playwright + `axe-core` at both widths, the bundle grep) | Epic 4 adds the FR-20 harness step and the SM-1 floor gate; Epic 5 verifies it runs with no key and no network |
| The README | Epic 5 writes it whole, bar two sections | Epic 7 fills the measured FR-21 results and the attributed Model Engine screenshot |

### Epic 1: Capture and keep a task

A user types one sentence and has a task — visible before their thumb leaves the screen, still there after the browser is closed and reopened, editable in every field, completable and deletable, with the due date already parsed from the date word they wrote. This epic also lays the substrate the other seven stand on: the Structural Seed tree, the pinned toolchain, the purity boundary around `core/`, the Clock and Storage ports, the 43 design tokens, and the shell at both bound widths. There is no starter template — the seed and the pinned versions are the starting point.

**FRs covered:** FR-1, FR-2, FR-3 (Project excluded), FR-4, FR-5, FR-23
**Also delivers:** NFR-1, NFR-3, NFR-4 (declared), NFR-10 (Clock port), UX-DR1, UX-DR3, UX-DR4, UX-DR6, UX-DR10, UX-DR12, UX-DR14, UX-DR15, UX-DR16, UX-DR18, UX-DR20, UX-DR23, UX-DR24; surfaces `m1`/`d1`, `m6`/`d5`, `m9`
**Architecture rows:** FR-1–FR-5 Task CRUD · FR-23 date-word parsing · NFR-1 capture latency · NFR-3 offline · NFR-4 responsive and operable · navigation across all surfaces
**Prerequisites:** none
**Standalone:** a working single-user task list with no intelligence in it at all.

### Epic 2: Structure proposed, never imposed

A task arrives carrying a proposal — tags, priority and a one-line summary — and the user punches, edits or strikes each part on its own, with one step of undo. Capture never waits for it. This is the product's central claim made operable: AI proposes, human disposes, one control at a time.

**FRs covered:** FR-6, FR-7, FR-8, FR-10, and FR-11's engine chip
**Also delivers:** NFR-5, SM-4, SM-C1, UX-DR2, UX-DR7, UX-DR8, UX-DR9, UX-DR11, UX-DR19, UX-DR21, UX-DR22; surfaces `m2`, `m3`/`d2`, `m4`/`d3`, `m5`/`d4`
**Architecture rows:** FR-6 Suggestion shape · FR-7 Rule Engine · FR-8 capture never blocks · FR-10 per-control review and undo · FR-11 engine disclosure (chip half) · NFR-5 determinism
**Prerequisites:** Epic 1
**Standalone:** rules-only is a legitimate v1 (PRD §4.2). Nothing here needs a key, a network or a Smart List.

### Epic 3: Views you never built

The user opens the app cold, offline, and the three derived lists are already populated — Due this week, Need Attention, High priority — plus one list per tag in use. Completed work leaves the active lists at once and, after the retention window, moves into Archive without being deleted.

**FRs covered:** FR-12, FR-13, FR-14, FR-16 (fixed 30-day window)
**Also delivers:** NFR-3 (re-asserted), NFR-10 (selector unit tests against an injected reference date, covering FR-12's past-due rule and FR-16's window), UX-DR5, UX-DR13, UX-DR22; surfaces `m7`, `d6`, and `m1`/`d1`'s populated bands
**Architecture rows:** FR-12–FR-15 Smart Lists · FR-16 archiving · NFR-10 fixed-date testing
**Prerequisites:** Epic 1
**Standalone:** membership is a predicate, a label has no vote (AD-9); no Fixture and no engine required.

### Epic 4: Prove the engine

One command runs the Rule Engine over a committed Fixture and reports per-field accuracy — tags, priority, parsed due date, Smart List placement, Summary apart — naming the entries that failed, with no key and no network. The first run sets the baseline and the written per-field floor, and CI fails below it.

**FRs covered:** FR-19, FR-20, FR-15
**Also delivers:** SM-1, SM-C2, NFR-10 (the harness's injected reference date)
**Architecture rows:** FR-19–FR-21 Fixture and harness · SM-1 floor and SM-C2 anti-drift
**Prerequisites:** Epic 2 (the Rule Engine it measures), Epic 3 (the selectors whose placement it asserts). **FR-19 is a story in its own right and a prerequisite of every FR-20, FR-21, SM-1 and SM-3 story** (constraints §2).
**Fixed by decision, not by the story author:** 10–15 entries, the reference date **Monday 2026-11-16**, "Submit assignment in IBE160 Friday" as the ordinary next-occurrence case due 2026-11-20, a separate `Monday` entry for the resolve-to-the-reference-date case, and the enumerated hard cases that may not be dropped. Need Attention is **not** asserted from the Fixture — Epic 3's selector unit tests own it.

### Epic 5: The grader's clean clone

Someone who has never seen the project clones it, follows the README, and reaches a running app with no API key, no account and no network — and understands why the AI decision was made and how consent is handled. The two key paths are kept apart: the app's key is entered in Settings at runtime, the harness's is a Node environment variable, and `.env.example` documents only the latter.

**FRs covered:** none directly — this epic carries NFR-7, NFR-9's prose and SM-2
**Also delivers:** the README (setup, the Fixture's path, the architecture section pasted from `README-ARCHITECTURE-SECTION.md` with its three mechanical edits), `.env.example`, `.gitignore`, and the clean-machine verification of SM-2 and the `axe-core` pass at 360 px and 1280 px
**Architecture rows:** NFR-7 clean-clone reproducibility · NFR-9 AI decision documented · SM-2 grader runnability
**Prerequisites:** Epic 4 (the README names the Fixture's path and the harness command)
**Language:** English, like every artifact a grader reads. The README says "built to WCAG 2.2 AA, checked with axe-core" and never "conformant".
**Standalone:** the deliverable is gradeable here, with Tiers 2 and 3 unbuilt.

### Epic 6: Bring your own key

The user saves their own Anthropic API Key, reads what Cloud Suggestions means, turns it on deliberately, and the next proposal is attributed to the Model Engine. Every failure — offline, timeout, rate limit, rejected key, exhausted quota, an organization that forbids browser calls — produces a Rule Engine suggestion with no error anywhere in capture or review; only persistent failures surface, and only in Settings.

**FRs covered:** FR-9, FR-11 (Settings status), FR-17, FR-18
**Also delivers:** NFR-2 (provisional 10 s, one named constant, never described as measured), NFR-6, NFR-8; surfaces `m8`, `d7`, `d8`
**Architecture rows:** FR-9 Model Engine and fallback · FR-11 engine disclosure · FR-17/FR-18 key and consent · NFR-2 timeout · NFR-6 no missing Suggestion · NFR-8 mocked fallback tests
**Prerequisites:** Epic 2 (the service and the port it plugs into)
**Standalone:** cutting this epic leaves Epics 1–5 whole; the Rule Engine was never a fallback for it.

### Epic 7: Show where the model wins

The same harness runs both engines over the same Fixture and produces a committed comparison showing where the Model Engine beats the Rule Engine and where it does not, with the ambiguous cases called out. The README's measured results and the screenshot of an attributed Model Engine Suggestion land here, because both need a working key and at least one real call.

**FRs covered:** FR-21
**Also delivers:** SM-3, NFR-9's measured half, `.docs/results/engine-comparison.md`
**Architecture rows:** FR-19–FR-21 Fixture and harness · NFR-9/SM-3 AI decision documented
**Prerequisites:** Epic 4 (the harness and the Fixture), Epic 6 (the adapter it measures). **FR-19 is a declared prerequisite.** Needs an API Key with credit — stated in the story, not assumed.
**Last to be built and last to be cut** inside Tier 2: the highest-value artifact for the 30 % process weighting (PRD §11).

### Epic 8: Refinements that may be cut

Three Tier 3 additions, grouped so that cutting them is one deletion rather than surgery across the other seven epics: an explicit "Suggest again" on a task, a user-configurable retention window, and Project as an optional grouping on a Task.

**FRs covered:** FR-22, FR-16 (configurability), FR-3's Project field
**Architecture rows:** FR-22 Suggest again · FR-16 archiving · FR-1–FR-5 Task CRUD
**Prerequisites:** Epic 2 (FR-22 adds a `SuggestionService` path and depends on the struck-set filter — AD-10's one stated exception), Epic 3 (the retention window it makes configurable)
**Cut first.** Every item here is additive by construction: the Project field is an optional property no Tier 1 selector reads, and the retention window is a settings value defaulting to 30 days.

---

## Epic 1: Capture and keep a task

A user types one sentence and has a Task — visible immediately, still there after the browser is closed and reopened, editable in every field, completable and deletable, with the due date already parsed from the date word they wrote. The substrate the other seven epics stand on is built inside these slices, never as a story of its own.

**FRs:** FR-1, FR-2, FR-3 (Project excluded, §6.3 Tier 3), FR-4, FR-5, FR-23
**NFRs:** NFR-1, NFR-3, NFR-4, NFR-10 (Clock port)
**UX-DRs:** UX-DR1, UX-DR3, UX-DR4, UX-DR6, UX-DR10, UX-DR12, UX-DR14, UX-DR15, UX-DR16, UX-DR18, UX-DR20, UX-DR23, UX-DR24
**Surfaces:** `m9` first run · `m1`/`d1` Today (capture and records; Epic 3 adds the bands) · `m6`/`d5` Task detail

### Story 1.1: Run the app from a clean clone and see the first run surface

As a grader with a fresh clone and no API key,
I want `npm ci` and `npm run dev` to give me a running app,
So that I can see the product exists before I know anything about it.

**Acceptance Criteria:**

1. **Given** a clean clone on a supported Node — `^22.13.0 || ^24.0.0 || >=26.0.0`, 26 LTS recommended — **When** I run `npm ci` and `npm run dev` **Then** the app serves on localhost **And** no API key, account or network access was required **And** an unsupported version fails `npm ci` with a message naming the required range rather than installing (SM-2, NFR-7, AD-13).
2. **Given** the app has no Tasks **When** it opens **Then** the first run surface `m9` renders, stating what the product is **And** it is the only empty state in the product (UX-DR22).
3. **Given** the first run surface **When** it renders **Then** all 43 `DESIGN.md` tokens are declared in `src/ui/theme.css` under Tailwind v4 `@theme` and every colour on screen resolves from them **And** both typefaces are vendored subset `woff2` with the `tnum` feature preserved **And** every number uses `font-variant-numeric: tabular-nums` (UX-DR1, UX-DR3, UX-DR4, AD-18).
4. **Given** the repository **When** CI runs on push **Then** typecheck, lint, Vitest, Playwright with `axe-core` at 360 px and 1280 px, and a grep of the built bundle for an API-key pattern all run **And** they run with no API key and no network **And** the build fails if any of them fails (AD-19, AD-8).
5. **Given** a module under `src/core/` **When** it references `window`, `document`, `localStorage`, `fetch`, `process`, `navigator`, `performance`, `crypto`, `Math.random`, React, a Vite-injected value, `Date.now()` or a zero-argument `new Date()` **Then** lint fails (AD-1).
6. **Given** a raw hex colour outside `src/ui/theme.css` **When** CI runs **Then** it fails (AD-18).
7. **Given** the first run surface at 360 px and at 1280 px **When** `axe-core` runs **Then** it reports no violations **And** there is no horizontal scrolling at either width (NFR-4, UX-DR20).

**Requirements:** NFR-4, NFR-7 (partial), SM-2 (partial), UX-DR1, UX-DR3, UX-DR4, UX-DR14, UX-DR15, UX-DR20
**Prerequisites:** none
**Spine rows:** NFR-4 Responsive and operable · SM-2 grader runnability
**Notes:** no starter template exists. The story builds the Structural Seed tree and the pinned stack exactly as listed, `typescript` at `6.0.3` (AD-13), `npm ci` against a committed lockfile with exact versions, `engines` plus `.nvmrc` so Node 23 or 25 gives a clear message rather than a mystery failure.

### Story 1.2: Create a Task from one sentence

As someone capturing a task between classes,
I want to type one sentence and have it saved,
So that nothing is lost while I decide nothing.

**Acceptance Criteria:**

1. **Given** the capture field on Today **When** I type task text and submit **Then** a Task is created with that text, Priority `medium`, no Tags and no Summary **And** the field clears **And** the record appears in the list (FR-1).
2. **Given** a submitted Task **When** create-to-visible is measured by a Playwright check against a Fixture-sized document **Then** it stays under 100 ms **And** no network request is made (FR-8's limit, NFR-1).
3. **Given** a created Task **When** I reload the page, and when I close and reopen the browser **Then** the Task is still there with every field intact (FR-1).
4. **Given** any mutation **When** it is applied **Then** it is a named action on the single store in `src/app/store.tsx`, the reducer is the only writer to storage, and the only key written is `todo.tasks.v1` carrying its `schemaVersion` (AD-6).
5. **Given** `localStorage` is unavailable or over quota **When** a Task is created **Then** the app stays fully usable in memory for the session **And** nothing in capture shows an error (AD-6).
6. **Given** a stored document that fails validation on read **When** the app starts **Then** the raw string is preserved under a backup key, the app starts empty, and the document is not discarded (AD-6).
7. **Given** a record on screen **When** it renders **Then** it carries the checkbox, the sentence in Archivo, the tag patch area, the priority ladder beside its word, the due pill area and the start triangle slot, at 46 px on mobile (UX-DR6, UX-DR10, UX-DR12).

**Requirements:** FR-1, NFR-1, UX-DR6, UX-DR10, UX-DR12
**Prerequisites:** Story 1.1
**Spine rows:** FR-1–FR-5 Task CRUD · NFR-1 capture latency
**Notes:** Task ids come from the Id port (`adapters/id.ts`), never from `core` (AD-1, conventions). The start triangle renders false here and is wired in Epic 2 from AD-7's two sources.

### Story 1.3: See the due date the date word named

As someone who writes "Friday" in a sentence,
I want the due date set from that word,
So that I never open a date picker to say what I already wrote.

**Acceptance Criteria:**

1. **Given** the reference date Monday 2026-11-16 **When** I capture "Submit assignment in IBE160 Friday" **Then** the due date is 2026-11-20 **And** the task text is unchanged (FR-23).
2. **Given** any task text **When** it is parsed **Then** only `today`, `tomorrow`, `Monday`–`Friday` written in full, and `next week` are recognized **And** `today` resolves to the reference date, `tomorrow` to the next day, `next week` to the Monday of the following week (FR-23).
3. **Given** a weekday name **When** the reference date is itself that weekday **Then** it resolves to the reference date, not a week later (FR-23).
4. **Given** `Saturday`, `Sunday`, an abbreviation such as `fri`, a plural such as "Mondays", an unrecognized phrase such as "end of month" or "15 March", or Norwegian such as `fredag` **When** the text is parsed **Then** no due date is set, no error is raised, and the Task is still created (FR-23, §6.2).
5. **Given** text with more than one recognized date expression **When** it is parsed **Then** the first one wins (FR-23).
6. **Given** a parsed due date **When** it is shown **Then** it appears as a due pill and is editable through FR-3 **And** it is applied directly, never as part of a reviewable Suggestion (FR-23, §13 item 2).
7. **Given** any date-dependent test **When** it runs **Then** it injects a fixed `LocalDate` through the Clock port and never reads the system clock, so the result is identical on any day, time zone and machine (NFR-10, AD-2).

**Requirements:** FR-23, NFR-10, UX-DR12
**Prerequisites:** Story 1.2
**Spine rows:** FR-23 Date-word parsing · NFR-10 Fixed-date testing
**Notes:** matching uses the one exported tokenizer in `core/tokenize.ts`, which this story owns and Epic 2's Rule Engine imports. `date-words.ts` returns the matched span alongside the resolved date, so Epic 2's Summary truncation has a defined input. Time enters only through the Clock port; `adapters/system-clock.ts` is the only file touching `Date` (AD-2).

### Story 1.4: Read the list and open a Task

As someone opening the app,
I want to see my Tasks and open one to read everything about it,
So that the list is somewhere I can actually look things up.

**Acceptance Criteria:**

1. **Given** Tasks exist **When** Today renders **Then** every non-archived Task appears, including completed-but-unarchived ones **And** archived Tasks do not (FR-2).
2. **Given** a record **When** I tap its sentence **Then** Task detail opens showing every field in PRD §3's definition — task text, due date, notes, Tags, Priority, Summary and completion date (FR-2, UX-DR6).
3. **Given** Task detail or any surface entered from a record **When** I press Back **Then** I return to the surface I came from rather than exiting the app (AD-16, UX-DR16).
4. **Given** any destination **When** it is addressed **Then** its state lives in the URL hash and never in component-local state **And** the shell renders the tab bar at 360 px and the nav rail at 1280 px (AD-16, UX-DR15).
5. **Given** the shell **When** it renders **Then** it offers only destinations that exist at this point in the build — Today — and later epics add Lists, Archive and Settings to the same component rather than replacing it (UX-DR16, slicing and reuse contract).
6. **Given** a list of Tasks **When** membership is decided **Then** it is decided by a predicate in `core/selectors.ts` named for its condition, and every display string comes from `src/ui/labels.ts` (AD-9).

**Requirements:** FR-2, UX-DR15, UX-DR16
**Prerequisites:** Story 1.2
**Spine rows:** FR-1–FR-5 Task CRUD · Navigation across all surfaces
**Notes:** this story owns `isCompleted` and `isArchived` in `core/selectors.ts`, because FR-2 needs them to exclude archived Tasks; Epic 3 adds the Smart List predicates and the Archive surface to the same module. Archive is `completedAt !== null && dayDiff(today, completedAt) > retentionDays`, with the retention default from the one named defaults factory (AD-6, AD-7).

### Story 1.5: Edit any field of a Task

As someone whose plans change,
I want to change any field on a Task,
So that the list stays true without being rebuilt.

**Acceptance Criteria:**

1. **Given** Task detail **When** I change task text, due date, notes, Tags, Priority or Summary **Then** that field changes alone, the others keep their values, and the change survives a reload (FR-3).
2. **Given** a free-text field **When** I type **Then** the change persists on blur or a debounce, never per keystroke (AD-6, conventions).
3. **Given** any edit **When** it is applied **Then** nothing re-runs any Suggestion Engine — not an edit to task text, not a reload, not navigation (FR-3, AD-15).
4. **Given** the user's own sentence **When** anything in the app displays it **Then** it is quoted unchanged, never rewritten or paraphrased (FR-23, UX-DR18).
5. **Given** Priority **When** it is set **Then** it is exactly one of `high`, `medium`, `low`, lowercase, with `medium` the default **And** it renders as the bar ladder beside its word, never as colour alone (conventions, UX-DR10, UX-DR20).
6. **Given** the Project field **When** this story is implemented **Then** it is absent — it is Tier 3 and arrives in Epic 8 as an optional property no Tier 1 selector reads (§6.3, AD-10).

**Requirements:** FR-3, UX-DR10, UX-DR18, UX-DR20
**Prerequisites:** Story 1.4
**Spine rows:** FR-1–FR-5 Task CRUD

### Story 1.6: Complete and un-complete a Task

As someone finishing things,
I want to tick a Task off and untick it if I was wrong,
So that completion is a fact I control, not a trapdoor.

**Acceptance Criteria:**

1. **Given** a record **When** I tap its checkbox **Then** the Task completes in place without navigating (FR-5, UX-DR6).
2. **Given** a completed Task **When** it is stored **Then** only `completedAt` is persisted, as a `LocalDate` — never a `completed` boolean and never an `archived` flag (AD-7).
3. **Given** a completed Task **When** I un-complete it **Then** `completedAt` clears and the Task returns to its ordinary state (FR-5).
4. **Given** a completed Task **When** the default view renders **Then** it is still retrievable and present until it is archived (FR-2, FR-5).
5. **Given** `isCompleted` and `isArchived` **When** they are tested **Then** the tests inject a fixed reference date through the Clock port rather than reading the system clock (NFR-10, AD-2).
6. **Given** completion **When** it is recorded **Then** it carries a day and no time of day (AD-2, accepted consequence).

**Requirements:** FR-5, NFR-10
**Prerequisites:** Story 1.2
**Spine rows:** FR-1–FR-5 Task CRUD · NFR-10 Fixed-date testing

### Story 1.7: Delete a Task

As someone who made a Task by mistake,
I want to delete it permanently,
So that the list contains only what I meant to put there.

**Acceptance Criteria:**

1. **Given** a Task **When** I delete it **Then** it is absent from every view and from storage after a reload (FR-4).
2. **Given** deletion **When** it is offered **Then** it is distinct from completion and from Archive, and no other action implies it (FR-4, UX-DR18).
3. **Given** the delete control **When** it is used **Then** it is the only destructive act in the product and is never reachable by accident from the checkbox or the record body (UX-DR18).

**Requirements:** FR-4
**Prerequisites:** Story 1.4
**Spine rows:** FR-1–FR-5 Task CRUD

### Story 1.8: Install the app and open it offline

As someone on a tram with no signal,
I want the app to open and work,
So that my list is not a thing that needs the internet.

**Acceptance Criteria:**

1. **Given** the app served over a secure context **When** I install it **Then** it installs as a PWA from the same single codebase, with its manifest and icons (UX-DR24, AD-11).
2. **Given** the installed app and no network **When** I open it cold **Then** the real app shell is served from the precache and my Tasks render **And** no view shows an error, spinner or empty state attributable to the missing network (NFR-3, UX-DR23).
3. **Given** the service worker **When** it is configured **Then** it precaches the app shell with `registerType: 'autoUpdate'` **And** it must not intercept or cache `api.anthropic.com` under any route (AD-11).
4. **Given** `index.html` **When** it is served **Then** a Content-Security-Policy `connect-src` limits outbound connections to the Anthropic host, enforcing the single-host rule mechanically (AD-11).
5. **Given** any asset — typeface, icon, script **When** the app loads **Then** it comes from the repository, with no CDN, no Google Fonts, no analytics, no telemetry and no third-party script (AD-11).
6. **Given** a secure context is absent **When** an id is generated **Then** a documented non-crypto fallback is used rather than a crash (AD-11).
7. **Given** an uncaught render error inside a routed surface **When** it happens **Then** a plain recovery panel offers a return to Today, the task document is untouched, and no stack trace or blank page is shown (AD-20).

**Requirements:** NFR-3, UX-DR23, UX-DR24
**Prerequisites:** Story 1.1
**Spine rows:** NFR-3 Offline correctness
**Notes:** the browser's own install affordance is what this story delivers. UX-DR24's in-app install offer lives in Settings, which arrives with Epic 2's minimal Settings surface — the same surface UJ-3 step 4 requires in Tier 1.

---

## Epic 2: Structure proposed, never imposed

A Task arrives carrying a proposal — Tags, Priority and a one-line Summary — and the user punches, edits or strikes each part on its own, with one step of undo. Capture never waits for it. This is the product's central claim made operable: the app proposes, the user disposes, one control at a time.

**FRs:** FR-6, FR-7, FR-8, FR-10, and FR-11's engine chip and no-key Settings statement
**NFRs:** NFR-5, and FR-8's 100 ms with an engine attached
**UX-DRs:** UX-DR2, UX-DR7, UX-DR8, UX-DR9, UX-DR11, UX-DR19, UX-DR21, UX-DR22
**Surfaces:** `m2` capture with course pending · `m3`/`d2` review, three controls open · `m4`/`d3` review, editing one control · `m5`/`d4` review, partial with undo · a minimal `m8`/`d7` Settings

### Story 2.1: The Rule Engine proposes Tags, Priority and a Summary

As someone who captured a sentence,
I want the app to propose how it should be filed,
So that I end up with a categorized list without having categorized anything.

**Acceptance Criteria:**

1. **Given** the task text "Submit assignment in IBE160 Friday" and the reference date Monday 2026-11-16 **When** the Rule Engine runs **Then** it proposes Tags `[school]`, Priority `high` and a Summary **And** the proposal appears in a course panel on that Task (FR-7's worked example, FR-6).
2. **Given** any task text **When** Tags are proposed **Then** every Tag whose keyword matches is proposed, in table order, from the four and only four — `school`, `group`, `work`, `personal` — matching whole words, case-insensitively, through the shared tokenizer (FR-7, conventions).
3. **Given** any task text **When** Priority is proposed **Then** any `high` keyword yields `high`, else any `low` keyword yields `low`, else `medium` — `high` beating `low` when both fire (FR-7).
4. **Given** the task text "Figure out the thing" **When** the Rule Engine runs **Then** it proposes Tags `[]` and Priority `medium` **And** the panel still carries three controls, rendered as an ordinary open proposal, never as a failure, an empty state or a prompt (FR-7, UX-DR21).
5. **Given** Norwegian task text such as "Lever innlevering i IBE160" **When** the Rule Engine runs **Then** nothing matches and it proposes `[]` and `medium` — a scope boundary, not a bug (FR-7, §6.2).
6. **Given** the same task text and due date **When** the Rule Engine runs any number of times **Then** the Suggestion is identical every time, and the engine is a pure function in `core/rule-engine.ts` with no ambient time and no I/O (NFR-5, AD-1).
7. **Given** a proposed Summary **When** it is produced **Then** it is a deterministic truncation of the task text — trimmed, with a trailing date phrase stripped when one was parsed into the due date, capped on a word boundary — and never a summarization (FR-7, §13 item 3, conventions).
8. **Given** a proposal on screen **When** it renders **Then** the course panel is a `proposed-wash` field bounded by a 1.4 px purple rule holding three numbered controls in the open state, below the record at 360 px and beside it at 1280 px **And** it overlaps rules and empty ground but never type (UX-DR8, AD-17).
9. **Given** any proposal anywhere in the product **When** it is visible **Then** the engine chip is visible with it, reading `R` plus the engine name spelled out (FR-11, UX-DR11).
10. **Given** a proposal arrives **When** the panel appears **Then** focus moves into it (AD-17).
11. **Given** no API Key is configured, no configuration has been done, and the device is offline **When** I create a Task **Then** a Rule Engine Suggestion is still produced and reviewable — the Rule Engine is the guaranteed path, never a fallback or a degraded mode (FR-7, NFR-3, UX-DR18).

**Requirements:** FR-6, FR-7, FR-11 (chip), NFR-3, NFR-5, UX-DR2, UX-DR7, UX-DR8, UX-DR11, UX-DR21
**Prerequisites:** Story 1.2, Story 1.3 (the tokenizer and the matched date span)
**Spine rows:** FR-6 Suggestion shape · FR-7 Rule Engine · FR-11 engine disclosure · NFR-5 determinism
**Notes:** the Suggestion is produced through the `SuggestionEngine` port and reaches the UI only via `app/suggestion-service.ts`; no module under `src/ui/` imports an engine (AD-3). The arrived Suggestion is persisted with its Task as a review record carrying the three proposed values, the engine, and a state per control (AD-7).

### Story 2.2: Capture never waits for the proposal

As someone capturing a task on the move,
I want the Task saved and visible before any proposal exists,
So that the app never costs me the thing I came to do.

**Acceptance Criteria:**

1. **Given** a submitted Task **When** the Suggestion Engine is slow, offline or absent **Then** the Task is saved and in the list no later than 100 ms after submit, measured with the engine excluded, and asserted by a Playwright check against a Fixture-sized document (FR-8, NFR-1, SM-4).
2. **Given** a Suggestion is in flight for a Task **When** the list renders **Then** that Task carries the start triangle and stays fully editable (FR-8, UX-DR9, UX-DR22).
3. **Given** the pending indicator **When** it is decided **Then** it is driven by the in-memory `pendingSuggestionTaskIds` set in the store and never derived from a Task's fields (AD-7).
4. **Given** a Task that is not in flight but carries an unresolved control **When** the list renders **Then** it also shows the start triangle — the mark has two sources, and a reload must not clear it (AD-7, UX-DR9).
5. **Given** a Suggestion that never arrives **When** the Task is read **Then** it is unaffected and keeps its defaults, with no error anywhere (FR-8, NFR-6).
6. **Given** the app is offline **When** a Suggestion is pending **Then** the pending indicator still appears, because it reports a course being set rather than a missing network (NFR-3's exemption, UX-DR22).
7. **Given** at most one request per Task **When** a second is requested while one is in flight **Then** it is not issued (AD-3).

**Requirements:** FR-8, NFR-1, NFR-3, SM-4, UX-DR9, UX-DR22
**Prerequisites:** Story 2.1
**Spine rows:** FR-8 Capture never blocks · NFR-1 capture latency

### Story 2.3: Punch, edit or strike one control

As someone reviewing a proposal,
I want to act on Tags, Priority and Summary separately,
So that one wrong field costs one correction rather than the whole proposal.

**Acceptance Criteria:**

1. **Given** three open controls **When** I punch one **Then** only that field is written and the other two keep their prior values until acted on (FR-10, AD-15).
2. **Given** an open control **When** I edit it and apply **Then** my value is written rather than the proposed one (FR-10, AD-15).
3. **Given** an open control **When** I strike it **Then** the field is left exactly as it was, the strike is recorded, and that control is never proposed again for this Task (FR-10, AD-3, AD-15).
4. **Given** any combination of open, punched and struck across the three controls **When** the Task renders **Then** all three states can be visible at once and each is reachable from the others only by my action (FR-10, UX-DR7, UX-DR22).
5. **Given** a Suggestion with any part unreviewed **When** the Task renders **Then** it stays visibly pending (FR-10).
6. **Given** all three controls resolve **When** the last one resolves **Then** the panel leaves and focus returns to the record (UX-DR8, AD-17).
7. **Given** Punch and Strike **When** they are rendered and when the page is tabbed through **Then** they are identical in size, weight, row position and confirmation cost — neither has a confirmation — in markup and in tab order (SM-C1, UX-DR19, AD-17).
8. **Given** any control **When** it is focused **Then** it is a native focusable element with a visible focus ring themed from the ink token, and its pointer target is at least 24 × 24 CSS px (AD-17, UX-DR20).
9. **Given** no Suggestion has been reviewed **When** any code path other than a per-control punch or edit runs **Then** no Task field is written from a Suggestion (AD-15).

**Requirements:** FR-10, SM-C1, UX-DR7, UX-DR19, UX-DR20, UX-DR22
**Prerequisites:** Story 2.1
**Spine rows:** FR-10 Per-control review and undo

### Story 2.4: Undo the punch I just made

As someone who punched by reflex,
I want one step back,
So that accepting is never a trap.

**Acceptance Criteria:**

1. **Given** I have just punched a control **When** I undo **Then** that field returns to its prior value and the control returns to open (FR-10).
2. **Given** an undo is available **When** it is offered **Then** it appears in that control's own block and takes focus immediately after the punch (UX-DR22, AD-17).
3. **Given** I take any subsequent action **When** it is applied **Then** the undo slot is cleared — one step only, no stack, no history (FR-10, AD-7).
4. **Given** the app reloads **When** it starts **Then** no undo is available, because the slot is reducer state and is never persisted (AD-7).
5. **Given** the undo slot **When** it is written **Then** it holds the **set** of field snapshots from the last accept action, whether that action accepted one control or three (AD-7).

**Requirements:** FR-10, UX-DR22
**Prerequisites:** Story 2.3
**Spine rows:** FR-10 Per-control review and undo

### Story 2.5: Punch all and Strike all

As someone whose proposal is simply right,
I want one action that takes all three,
So that the common case costs one tap.

**Acceptance Criteria:**

1. **Given** three open controls **When** I tap **Punch all** **Then** all three parts are applied in one action, and the result is identical to punching each in turn (FR-10, AD-15).
2. **Given** three open controls **When** I tap **Strike all** **Then** all three are dismissed, no field changes, and all three are recorded as struck (FR-10).
3. **Given** I have tapped **Punch all** **When** I undo **Then** all three fields return to their prior values in one step (FR-10, AD-7).
4. **Given** the two shortcuts **When** they are rendered **Then** they are plain outline controls below the rule, never primary, and Strike all is exactly as reachable as Punch all (§13 item 19, SM-C1, UX-DR19).
5. **Given** the shortcuts **When** they are labelled **Then** the UI strings are **Punch all** and **Strike all**, with microcopy naming them as shortcuts that do nothing the three controls cannot (UX-DR18, UX-DR19).
6. **Given** the shortcuts **When** they are implemented **Then** they are composites of the per-control actions and add no code path those lack (AD-15, constraints checklist 1).

**Requirements:** FR-10, SM-C1, UX-DR18, UX-DR19
**Prerequisites:** Story 2.3, Story 2.4
**Spine rows:** FR-10 Per-control review and undo

### Story 2.6: Settings tells the truth with no key

As a grader with no Anthropic account,
I want Settings to tell me plainly what is running,
So that the absence of a key reads as a fact rather than a fault.

**Acceptance Criteria:**

1. **Given** no API Key is configured **When** I open Settings **Then** it states that no API Key is configured and that the Rule Engine is serving Suggestions on this device **And** nothing frames either as an error (FR-11, UJ-3 step 4, UX-DR18).
2. **Given** Settings **When** it renders **Then** it is the only place any engine state is visible anywhere in the product (UX-DR16, FR-11).
3. **Given** the app is installable **When** I open Settings **Then** an install option is offered there, never interrupted into the flow (UX-DR24).
4. **Given** `localStorage` was unavailable, over quota, or held a document that failed validation **When** I open Settings **Then** it says so plainly, and that is the only place it is said (AD-6).
5. **Given** Settings **When** it is reached **Then** it is a hash route added to the existing shell rather than a new shell (AD-16, slicing and reuse contract).
6. **Given** Settings at 360 px and 1280 px **When** `axe-core` runs **Then** it reports no violations and there is no horizontal scrolling (NFR-4, UX-DR20).

**Requirements:** FR-11 (no-key half), UX-DR16, UX-DR18, UX-DR24, NFR-4
**Prerequisites:** Story 2.1
**Spine rows:** FR-11 Engine disclosure · Navigation across all surfaces
**Notes:** this story exists in Tier 1 because UJ-3 step 4 and SM-2 require it with no key. Epic 6 extends the same surface with the key field, the consent control and the persistent-failure status; it does not rebuild it.

---

## Epic 3: Views you never built

The user opens the app cold, offline, and the derived lists are already populated — Due this week, Need Attention, High priority, and one per Tag in use. Completed work leaves the active lists at once and, after the retention window, moves into Archive without being deleted. Nothing here is hand-maintained and no membership is stored.

**FRs:** FR-12, FR-13, FR-14, FR-16 (fixed 30-day window)
**NFRs:** NFR-3 re-asserted, NFR-10 through selector unit tests
**UX-DRs:** UX-DR5, UX-DR13, UX-DR22
**Surfaces:** `m7` a list and all the lists · `d6` Archive · `m1`/`d1` Today's populated bands

### Story 3.1: Today shows the three derived lists

As someone opening the app on a Monday morning, offline,
I want Due this week, Need Attention and High priority already populated,
So that I know what matters without having built a view.

**Acceptance Criteria:**

1. **Given** Tasks with due dates **When** Today renders **Then** a Task due inside the current week appears in "Due this week" — one due that Sunday appears, one due the next Monday does not (FR-12).
2. **Given** the current week **When** it is computed **Then** it is Monday through Sunday inclusive in the device's local calendar, defined once in `core/selectors.ts` and shared with FR-23's `next week` (FR-12, conventions).
3. **Given** a Task with a due date in the past that is not completed **When** Today renders **Then** it appears in "Need Attention" (FR-12).
4. **Given** a completed Task, and a Task with no due date **When** Today renders **Then** neither appears in either due-window list (FR-12).
5. **Given** Tasks at Priority `high` **When** Today renders **Then** they appear in the High priority list; setting `high` adds a Task immediately and completing it removes it immediately (FR-13).
6. **Given** each list **When** it renders **Then** it carries a 22 px band whose colour names it — yellow tint for Due this week, olive for Need Attention, none for High priority — with the label left in condensed caps, the live count right, computed on render and never stored, and a 1.2 px `rule-strong` beneath (UX-DR5).
7. **Given** a list with no members **When** it renders **Then** it reports a count of zero rather than showing an empty state (UX-DR22).
8. **Given** `isPastDue`, `isDueThisWeek` and `isHighPriority` **When** they are tested **Then** they are unit-tested on `core/selectors.ts` against an injected reference date through the Clock port — this is where FR-12's past-due rule is proven, not in the Fixture (NFR-10, AD-2, §13 item 26).
9. **Given** the label "Need Attention" **When** it is used **Then** membership is owned by the `isPastDue` predicate and the label has no vote; the canonical string is `Need Attention`, singular, and "Needs Attention" appears nowhere in code, UI strings or test selectors (AD-9).
10. **Given** the app is offline **When** Today opens cold **Then** every list renders from storage with no error, spinner or empty state attributable to the missing network (NFR-3, UX-DR23).

**Requirements:** FR-12, FR-13, NFR-3, NFR-10, UX-DR5, UX-DR22
**Prerequisites:** Story 1.4 (the selectors module and the shell), Story 1.6 (completion)
**Spine rows:** FR-12–FR-15 Smart Lists · NFR-10 Fixed-date testing · NFR-3 Offline correctness

### Story 3.2: A list per Tag, and every list in one place

As someone working across four contexts,
I want one list per Tag I actually use, and one place that shows them all,
So that contexts stay apart without my maintaining anything.

**Acceptance Criteria:**

1. **Given** a Tag carried by at least one non-archived Task **When** Lists renders **Then** that Tag has a Smart List (FR-14).
2. **Given** a Tag no non-archived Task carries **When** Lists renders **Then** no list exists for it (FR-14).
3. **Given** I punch a proposal that adds a new Tag **When** the action completes **Then** that Tag's list is available without a reload (FR-14).
4. **Given** the Lists destination **When** it renders **Then** it enumerates the three Smart Lists, one list per Tag in use, All tasks and Untagged, and opening one shows its records (UX-DR16).
5. **Given** the Lists destination **When** it is added **Then** it is a hash route added to the existing shell, reusing the record and band components rather than new ones (AD-16, slicing and reuse contract).
6. **Given** a Tag **When** it is displayed on a record **Then** it renders as a terrain tag patch naming its context, and never as colour alone (UX-DR12, UX-DR20).

**Requirements:** FR-14, UX-DR12, UX-DR16
**Prerequisites:** Story 3.1
**Spine rows:** FR-12–FR-15 Smart Lists · Navigation across all surfaces

### Story 3.3: The legend publishes what every mark means

As anyone reading a screen full of marks,
I want a published key to the inks and the marks,
So that nothing on screen depends on my having learnt a colour.

**Acceptance Criteria:**

1. **Given** a long surface **When** it ends **Then** the legend closes it, as content rather than chrome (UX-DR13).
2. **Given** the legend **When** it renders **Then** it names every ink and every mark in use — the course purple, the due-window yellow, the Need Attention olive, the archive blue, the control states, the start triangle, the priority ladder and the engine chip (UX-DR13, UX-DR2).
3. **Given** any state in the product **When** it is conveyed **Then** it is carried by a mark *and* an ink, never by colour alone — the ladder with its word, the chip with the engine name, past due with olive and the words (UX-DR20, SC 1.4.1).
4. **Given** the legend at 1280 px **When** the mosaic renders **Then** it is its own module (UX-DR15).

**Requirements:** UX-DR2, UX-DR13, UX-DR20
**Prerequisites:** Story 3.1
**Spine rows:** NFR-4 Responsive and operable

### Story 3.4: Completed work leaves the list and lands in Archive

As someone who finishes things,
I want completed Tasks to stop crowding the view without being destroyed,
So that the list stays about what is left.

**Acceptance Criteria:**

1. **Given** a Task completed longer ago than the retention window **When** any view renders **Then** it is archived and absent from default views (FR-16).
2. **Given** the default retention window **When** it is read **Then** it is 30 days, from the one named defaults factory (FR-16, AD-6).
3. **Given** an archived Task **When** I open Archive **Then** it is there, retrievable, and not deleted (FR-16).
4. **Given** an archived Task **When** I restore it **Then** it returns to the active lists keeping its punched controls — and its completion date is cleared, which is the accepted loss (AD-7).
5. **Given** archive status **When** it is decided **Then** it is computed as `completedAt !== null && dayDiff(today, completedAt) > retentionDays`, never stored and never written by a time-triggered sweep (AD-7).
6. **Given** the archive window **When** it is tested **Then** the test injects a fixed reference date through the Clock port (NFR-10, AD-2, §13 item 26).
7. **Given** the Archive destination **When** it renders **Then** it uses the archive blue ink and reuses the record component (UX-DR2, slicing and reuse contract).

**Requirements:** FR-16 (fixed window), NFR-10, UX-DR2, UX-DR22
**Prerequisites:** Story 1.6, Story 3.1
**Spine rows:** FR-16 Archiving · NFR-10 Fixed-date testing
**Notes:** because archive status is derived, FR-16's "changing the window re-evaluates existing completed Tasks" is free; the control that changes the window is Tier 3 and arrives in Story 8.2.

---

## Epic 4: Prove the engine

One command runs the Rule Engine over a committed Fixture and reports per-field accuracy, naming the entries that failed, with no key and no network. The first run sets the baseline and the written per-field floor, and CI fails below it. This epic is where the product stops asserting that its AI works and starts measuring it.

**FRs:** FR-19, FR-20, FR-15
**Metrics:** SM-1, SM-C2
**NFRs:** NFR-10 through the harness's injected reference date

### Story 4.1: The Fixture is committed

As the builder and the grader both,
I want a committed file of example Tasks with their expected outcomes,
So that accuracy is measured against expectations written by hand, not against whatever the code already does.

**Acceptance Criteria:**

1. **Given** the Fixture **When** it is committed **Then** it holds at least 10 and at most 15 entries at `fixture/tasks.json`, outside test code, at a path the README names (FR-19, AD-12).
2. **Given** each entry **When** it is read **Then** it carries expected Tags, expected Priority, expected parsed due date and expected Smart List placement, all four populated, with "none" a valid expected due date rather than a blank (FR-19).
3. **Given** the file **When** it is read **Then** it records the fixed reference date **Monday 2026-11-16**, from which the current week is 2026-11-16 to 2026-11-22, `today` is 2026-11-16, `tomorrow` is 2026-11-17 and `next week` is 2026-11-23 (FR-19, §13 item 25, NFR-10).
4. **Given** expected values **When** they are written **Then** Tags use only FR-7's four with `[]` valid, Priority uses only `high`, `medium`, `low`, and every expectation is derivable by hand from FR-7's tables and FR-23's vocabulary (FR-19).
5. **Given** date coverage **When** the entries are counted **Then** there is one per recognized form — `today`, `tomorrow`, a `Monday`-to-`Friday` name, `next week` — plus one with no date word, one with an unrecognized phrase such as "end of month", one with an abbreviated weekday such as `fri`, and one naming `Saturday`, the last four expecting no due date (FR-19).
6. **Given** the entry "Submit assignment in IBE160 Friday" **When** its expectations are written **Then** it is the **ordinary** next-occurrence case, due 2026-11-20 **And** a separate entry naming `Monday` carries the resolve-to-the-reference-date case, expecting 2026-11-16 (FR-19, §13 item 25).
7. **Given** the entries **When** they are chosen **Then** at least one has no keyword match at all, expecting `[]` and `medium`, at least one carries two recognized date words where the first wins, and ambiguous entries are present alongside easy ones (FR-19, SM-C2).
8. **Given** "Need Attention" **When** placements are written **Then** no entry expects it, because no date word resolves to the past — FR-12's past-due rule is proven by Story 3.1's selector unit tests instead, and the Fixture's shape is unchanged (FR-15, §13 item 26, constraints §2).

**Requirements:** FR-19, NFR-10, SM-C2
**Prerequisites:** Story 2.1 (FR-7's rules are what the expectations are read from), Story 3.1 (the placements they name)
**Spine rows:** FR-19–FR-21 Fixture and harness
**Notes:** **this story is a prerequisite of Stories 4.2, 4.3, 4.4, 7.1 and 7.2** (constraints checklist 3). Its scope is fixed by FR-19 and AD-12, not by the implementer.

### Story 4.2: One command reports Rule Engine accuracy

As the builder,
I want `npm run harness` to tell me how accurate the Rule Engine is, per field,
So that the claim in the README is a measurement rather than an opinion.

**Acceptance Criteria:**

1. **Given** a clean `npm install` **When** I run `npm run harness` **Then** it runs the Rule Engine over every Fixture entry under `tsx`, with no API Key and no network (FR-20, AD-12, NFR-7).
2. **Given** the run **When** it reports **Then** Tags, Priority, parsed due date and Smart List placement accuracy are reported separately, and Summary is reported apart and folded into none of them (FR-20, SM-1).
3. **Given** a failing entry **When** the report is printed **Then** it names which entries failed, so a failure is diagnosable rather than only a score (FR-20).
4. **Given** the harness **When** it computes dates and placement **Then** it injects the Fixture's fixed reference date through the Clock port, never the system clock (FR-20, NFR-10, AD-2).
5. **Given** the harness **When** it runs the engine **Then** it imports the Rule Engine and the selectors from `src/core/` directly — never a copy (AD-12).
6. **Given** `harness/run.ts` **When** it is built **Then** it is the only place engines are addressed by name, bypassing `SuggestionService` deliberately so each can be measured (AD-3, AD-12).

**Requirements:** FR-20, NFR-7, NFR-10, SM-1
**Prerequisites:** **Story 4.1 (FR-19 — declared prerequisite)**, Story 2.1
**Spine rows:** FR-19–FR-21 Fixture and harness

### Story 4.3: Smart List placement is asserted against the Fixture

As the builder,
I want every Fixture entry's expected list membership asserted by the suite,
So that a change to a predicate cannot quietly move Tasks between lists.

**Acceptance Criteria:**

1. **Given** each Fixture entry **When** the suite runs **Then** it asserts the entry lands in the Smart List its row names, drawn from Due this week, High priority and one per FR-7 Tag (FR-15).
2. **Given** an entry that lands in a different list than expected **When** the suite runs **Then** it fails and names the entry (FR-15).
3. **Given** every placement assertion **When** it runs **Then** it runs against the Fixture's fixed reference date rather than the machine's clock (FR-15, NFR-10).
4. **Given** "Need Attention" and FR-16's window **When** coverage is reviewed **Then** they are covered by Story 3.1's and Story 3.4's selector unit tests against an injected reference date, and neither is left uncovered (FR-15, §13 item 26).

**Requirements:** FR-15, NFR-10
**Prerequisites:** **Story 4.1 (FR-19 — declared prerequisite)**, Story 3.1
**Spine rows:** FR-12–FR-15 Smart Lists · FR-19–FR-21 Fixture and harness

### Story 4.4: CI fails below the committed floor

As the builder weeks from a deadline,
I want the accuracy floor to be a gate rather than a note,
So that a regression stops the build instead of being noticed later.

**Acceptance Criteria:**

1. **Given** the first harness run **When** it completes **Then** its per-field numbers are committed as the baseline, together with a written minimum per field and one sentence of justification per number (SM-1, OQ-6).
2. **Given** a later run **When** any field drops below its committed minimum **Then** the harness command exits non-zero (AD-12, SM-1).
3. **Given** CI **When** it runs on push **Then** it runs the FR-20 harness as a step and fails the build on that non-zero exit (AD-19).
4. **Given** CI **When** it runs the harness **Then** it does so with no API Key and no network (AD-19, SM-2).
5. **Given** the Fixture **When** it is changed **Then** it may not drop below 10 entries and may not lose the no-keyword-match entry, the entry naming the reference date's own weekday, the two-date-word entry, the abbreviated weekday or the `Saturday` entry (SM-C2, AD-12).
6. **Given** the floor **When** it is recorded **Then** no number in it is described as a target drawn from research, and Summary's score is kept separate from the other fields (SM-1, §7).

**Requirements:** SM-1, SM-C2
**Prerequisites:** **Story 4.1 (FR-19 — declared prerequisite)**, Story 4.2
**Spine rows:** SM-1 floor, SM-C2 anti-drift

---

## Epic 5: The grader's clean clone

Someone who has never seen the project clones it, follows the README, and reaches a running app with no API key, no account and no network — and understands why the AI decision was made and how consent is handled. Everything a grader reads is in English.

**NFRs:** NFR-7, NFR-9's prose, NFR-4's mechanical evidence
**Metrics:** SM-2
**No FRs are introduced here**; the epic delivers the artifacts the requirements above name.

### Story 5.1: The README takes a fresh clone to a running app

As a grader with a fresh clone,
I want the README to get me to a running app,
So that nothing between me and the product depends on asking the builder.

**Acceptance Criteria:**

1. **Given** a fresh clone and the README **When** I follow it **Then** I reach a running app with no API Key, no account and no network (NFR-7, SM-2, UJ-3).
2. **Given** the README **When** it names prerequisites **Then** it names the Node floor and the recommended version, matching `engines` and `.nvmrc`, so arriving on an unsupported major gives a clear message (AD-13, stack).
3. **Given** the README **When** it describes keys **Then** it keeps the two paths apart: the **app's** key is entered in Settings at runtime and is never read from a build-time variable, and the **harness's** key is a Node environment variable (OQ-4, §13 item 13, AD-8).
4. **Given** `.env.example` **When** it is read **Then** it documents `ANTHROPIC_API_KEY` for the harness alone and says in as many words that the app never reads it (AD-8).
5. **Given** `.gitignore` **When** it is read **Then** it excludes `.env` and any real key file, and no secret is present in any committed file (PRD §8, AD-8, FR-17).
6. **Given** the README **When** it describes the measuring instrument **Then** it names the Fixture's committed path and the harness command (FR-19, FR-20).
7. **Given** every artifact in this story **When** it is written **Then** it is in English (§6.1, §13 item 23).

**Requirements:** NFR-7, SM-2, FR-17 (the no-secret half), FR-19 (the named path)
**Prerequisites:** Story 4.2
**Spine rows:** NFR-7 Clean-clone reproducibility · SM-2 grader runnability

### Story 5.2: The README explains the AI decision

As a grader weighing process and AI steering at 30 %,
I want the reasoning written down,
So that I can see why these two engines exist and what the trade-off was.

**Acceptance Criteria:**

1. **Given** the README **When** it explains the product **Then** it describes both implementations, the Rule Engine as the guaranteed path and the Model Engine as the opt-in upgrade — never the Rule Engine as a fallback, a degraded mode or a missing feature (NFR-9, UX-DR18).
2. **Given** the README **When** it justifies the choice **Then** it says why the two beat rules-only and why a local in-browser model was rejected (NFR-9, §6.2).
3. **Given** the README **When** it covers privacy **Then** it states the trade-off and how consent is handled: nothing leaves the device until Cloud Suggestions is on, the key is the user's own, and the disclosure precedes the switch (NFR-9, FR-18, PRD §8).
4. **Given** the README **When** it discusses accessibility **Then** it says "built to WCAG 2.2 AA, checked with axe-core" and never claims conformance (NFR-4, §13 item 24, constraints checklist 9).
5. **Given** the README **When** it discusses the Model Engine's timeout or provider **Then** it describes neither as measured, verified or confirmed (NFR-2, §13 item 21, constraints checklist 4).
6. **Given** the measured FR-21 results and the Model Engine screenshot **When** this story is done **Then** their places are prepared but empty, because both need a real key and land in Epic 7 (NFR-9).

**Requirements:** NFR-9 (prose half), NFR-4 (wording), NFR-2 (wording discipline)
**Prerequisites:** Story 5.1
**Spine rows:** NFR-9, SM-3 AI decision documented

### Story 5.3: The README carries the architecture section

As a grader weighing code and architecture,
I want the architecture summarized where I am already reading,
So that the shape of the code is visible without opening the planning folder.

**Acceptance Criteria:**

1. **Given** `README-ARCHITECTURE-SECTION.md` **When** it is pasted into the README **Then** its frontmatter is removed, its H1 is demoted one level, and the `./ARCHITECTURE-SPINE.md` link is repointed so it resolves from the repository root (`issues.md` 2026-11-18).
2. **Given** the pasted section **When** it is read **Then** it describes the ports-and-adapters shape with the pure core, and names where the Rule Engine, the selectors and the harness live (paradigm, AD-1, AD-12).
3. **Given** the README as a whole **When** it is read end to end **Then** setup, the AI decision, the architecture section and the Fixture path read as one document in one language, with no duplicated section (§6.1).

**Requirements:** NFR-9 (architecture half)
**Prerequisites:** Story 5.2
**Spine rows:** NFR-9, SM-3 AI decision documented

### Story 5.4: SM-2 is verified on a clean machine

As the builder,
I want the grader's path actually walked, not assumed,
So that a binary pass is not discovered to be a fail on the last day.

**Acceptance Criteria:**

1. **Given** a clean machine or a clean checkout **When** I follow the README exactly **Then** I reach a running app and exercise every graded capability with no API Key, no account and no network (SM-2, NFR-7).
2. **Given** the same clean state **When** I run the test suite and the harness **Then** both run with no key and no network and pass (NFR-8's standing requirement, AD-19).
3. **Given** CI **When** it runs **Then** Playwright plus `axe-core` run at 360 px and 1280 px across the surfaces built so far, and the run is treated as evidence rather than as a conformance claim (NFR-4, AD-17, AD-19).
4. **Given** the FR-10 review flow **When** it is demonstrated **Then** it is demonstrated at both 360 px and 1280 px with no horizontal scrolling (NFR-4).
5. **Given** the built bundle **When** CI greps it **Then** no API-key pattern is found (AD-8, AD-19).

**Requirements:** SM-2, NFR-4, NFR-7
**Prerequisites:** Story 5.1, Story 5.3
**Spine rows:** SM-2 grader runnability · NFR-4 Responsive and operable

---

## Epic 6: Bring your own key

The user saves their own Anthropic API Key, reads what Cloud Suggestions means, turns it on deliberately, and the next proposal is attributed to the Model Engine. Every failure produces a Rule Engine Suggestion with no error anywhere in capture or review; only persistent failures surface, and only in Settings.

**FRs:** FR-9, FR-11 (Settings status), FR-17, FR-18
**NFRs:** NFR-2, NFR-6, NFR-8
**Surfaces:** `m8`/`d7`/`d8` Settings, extending Story 2.6's surface

### Story 6.1: Save and clear my own API Key

As someone with an Anthropic account,
I want to give the app my key and take it back,
So that the cost and the exposure stay mine to control.

**Acceptance Criteria:**

1. **Given** Settings **When** I enter an API Key and save **Then** it is stored on the device under `todo.apikey.v1` and survives a reload (FR-17, AD-6, AD-8).
2. **Given** a stored key **When** Settings renders **Then** it shows that a key is stored without revealing it, and offers to clear it (FR-17).
3. **Given** I clear the key **When** the action completes **Then** the app returns to Rule-Engine-only operation and issues no further network requests (FR-17).
4. **Given** the key **When** it is handled anywhere **Then** it is never read from a build-time variable, never present in the bundle, and never logged (AD-8).
5. **Given** the key is saved or cleared **When** the reducer writes **Then** it writes only `todo.apikey.v1` and never `todo.settings.v1` — which is what makes FR-18's "saving a key never enables consent" true structurally (AD-3, AD-6).
6. **Given** the built bundle **When** CI greps it for an API-key pattern **Then** nothing is found (AD-8, AD-19).

**Requirements:** FR-17
**Prerequisites:** Story 2.6
**Spine rows:** FR-17, FR-18 Key and consent

### Story 6.2: Turn on Cloud Suggestions, having been told what it means

As someone deciding whether to send my sentences to an API,
I want the consequence stated before I can agree to it,
So that consent is informed rather than assumed.

**Acceptance Criteria:**

1. **Given** first run, with or without a key present **When** Settings renders **Then** Cloud Suggestions is off (FR-18).
2. **Given** I save an API Key **When** the save completes **Then** the Cloud Suggestions control appears beside the key field, still off, with its disclosure, hinting that it must be turned on first (FR-18, §13 item 6, UJ-4).
3. **Given** the disclosure **When** it is read before enabling **Then** it states that task text will be sent to the Anthropic API, that the key is the user's own, and that the Rule Engine remains the fallback (FR-18).
4. **Given** I turn Cloud Suggestions off **When** the action completes **Then** all outbound requests stop immediately, and with it off no network request containing task text is issued under any code path (FR-18).
5. **Given** I had turned it off **When** I clear and re-save a key **Then** it is not re-enabled (FR-18).
6. **Given** the gate **When** it is evaluated **Then** it is the single pure predicate `mayUseModelEngine(hasKey, cloudSuggestions)` in `core`, evaluated **per request** against current state rather than at start-up (AD-3).
7. **Given** the provider's name **When** it appears in the disclosure **Then** it comes from the single string constant in `src/ui/labels.ts` (AD-11).

**Requirements:** FR-18
**Prerequisites:** Story 6.1
**Spine rows:** FR-17, FR-18 Key and consent

### Story 6.3: The Model Engine proposes, and the chip says so

As someone who turned Cloud Suggestions on,
I want the next proposal to come from the model and to say so,
So that I can see the comparison in use rather than only in a report.

**Acceptance Criteria:**

1. **Given** a key is stored and Cloud Suggestions is on **When** I capture a Task **Then** the Model Engine is attempted first and, on success, its Suggestion is what I review (FR-9).
2. **Given** a Model Engine Suggestion **When** it is displayed **Then** the engine chip reads `M` plus the engine name spelled out, everywhere the proposal appears (FR-11, UX-DR11).
3. **Given** a request **When** it is issued **Then** it uses the lowest available effort, thinking explicitly disabled, structured output via `output_config.format`, a small `max_tokens`, and no `temperature`, `top_p` or `top_k` — from the one named constant the adapter and the harness both read (AD-14).
4. **Given** a response **When** it returns **Then** the adapter validates it against the zod schema in `core/suggestion.ts` and bounds it: Summary truncated to one named maximum, Tag count and length bounded, Tags lowercased, any Tag outside FR-7's four dropped, and Priority compared case-insensitively (AD-4).
5. **Given** the Model Engine **When** it proposes Tags **Then** it is bound to the same four Tags as the Rule Engine (§13 item 18, conventions).
6. **Given** exactly one capture **When** it completes **Then** exactly one API call was made — no batching, no response caching, no retry loop (AD-14, PRD §8).
7. **Given** the call **When** it is issued from the browser **Then** it carries the direct-browser-access header set by the browser composition root, goes only to the single permitted host, and is permitted by the CSP `connect-src` (AD-11).
8. **Given** any engine **When** it returns **Then** it returns an `EngineResult` and throws nothing (AD-4).

**Requirements:** FR-9 (success path), FR-11 (chip), FR-6
**Prerequisites:** Story 6.2
**Spine rows:** FR-9 Model Engine and fallback · FR-11 Engine disclosure

### Story 6.4: Every failure is silent, and the Rule Engine serves

As someone whose connection drops or whose credit runs out,
I want Suggestions to keep arriving,
So that a failure of the upgrade is never a failure of the product.

**Acceptance Criteria:**

1. **Given** no API Key, or Cloud Suggestions off **When** I capture a Task **Then** the Model Engine is not attempted and no network request is made (FR-9).
2. **Given** a transient failure — offline, timeout, rate limit, any other temporary API error, or a response that fails validation **When** it occurs **Then** a Rule Engine Suggestion is produced, nothing is recorded, no user-facing failure state appears anywhere including Settings, and the next capture attempts the Model Engine again (FR-9, AD-4, NFR-6).
3. **Given** a persistent failure — an invalid key, exhausted credit or quota, or an organization that forbids browser calls **When** it occurs **Then** a Rule Engine Suggestion is produced with no error, popup, banner, toast or badge in capture or review, and the reason is persisted for Settings alone (FR-9, NFR-6).
4. **Given** a request that exceeds the timeout **When** it is aborted **Then** the Rule Engine's Suggestion resolves the call and a response arriving after the abort is dropped unwritten, unattributed and unlogged (AD-5, NFR-2).
5. **Given** the timeout **When** it is read **Then** it comes from the single named constant `MODEL_ENGINE_TIMEOUT_MS` in `core/constants.ts`, never inlined, carrying the comment that its value is provisional because OQ-1 is unmeasured (AD-5, §13 item 21, constraints checklist 5).
6. **Given** this story, its tests and its comments **When** they describe the timeout value or the provider **Then** neither is described as measured, verified or confirmed, and no test asserts the value came from a real call (§13 item 21, constraints checklist 4).
7. **Given** any `stop_reason` other than `end_turn` **When** it is returned **Then** it is treated as a failure (AD-4).

**Requirements:** FR-9 (failure paths), NFR-2, NFR-6
**Prerequisites:** Story 6.3
**Spine rows:** FR-9 Model Engine and fallback · NFR-2 timeout · NFR-6 No missing Suggestion

### Story 6.5: Settings explains a persistent failure, and only Settings

As someone whose key stopped working,
I want one plain explanation in one place,
So that I learn why without being interrupted while capturing.

**Acceptance Criteria:**

1. **Given** a persistent failure has occurred **When** I open Settings **Then** it states three things: that the Model Engine is not being used, the reason, and that the Rule Engine is serving Suggestions normally (FR-11).
2. **Given** the reason is an organization that forbids browser calls **When** it is worded **Then** it is worded distinctly from a rejected key — the key is valid, nothing the user does to it will help, so the copy says the organization does not allow it and stops there (FR-11, §13 item 16, UX-DR18).
3. **Given** the reason is a rejected key, and separately an exhausted quota **When** each is worded **Then** the three reasons are worded apart from one another (FR-11, UX-DR18).
4. **Given** any persistent failure **When** it is surfaced **Then** it appears only in Settings — no popup, banner, toast or badge anywhere else (FR-11, NFR-6).
5. **Given** the cause is resolved **When** the next Suggestion succeeds **Then** the status clears itself, with nothing for the user to dismiss (FR-11).
6. **Given** the status **When** it is worded **Then** it is plain and non-alarming and never frames the Rule Engine as degraded (UX-DR18).

**Requirements:** FR-11 (Settings half), NFR-6
**Prerequisites:** Story 6.4
**Spine rows:** FR-11 Engine disclosure

### Story 6.6: Every fallback path is covered by mocked tests

As the builder,
I want each failure mode proven against a mocked API,
So that the silence is a tested property rather than a hope.

**Acceptance Criteria:**

1. **Given** every failure mode enumerated in FR-9 **When** the suite runs **Then** each has a test asserting a Rule Engine Suggestion is produced and no user-facing error appears (NFR-8).
2. **Given** the adapter's own failure classification **When** it is tested **Then** it is tested at the HTTP level, including the `401` with the organization-policy message on a valid key (NFR-8, conventions, §13 item 16).
3. **Given** `SuggestionService`'s flow **When** it is tested **Then** it is tested with port-level fakes rather than HTTP mocks (conventions).
4. **Given** the whole suite **When** it runs in CI and on a grader's machine **Then** it runs with no API Key and no network (NFR-8, AD-19, SM-2).
5. **Given** the consent gate **When** it is tested **Then** a test asserts that with Cloud Suggestions off no request containing task text is issued under any code path (FR-18, NFR-8).

**Requirements:** NFR-8
**Prerequisites:** Story 6.4, Story 6.5
**Spine rows:** NFR-8 Mocked fallback tests

---

## Epic 7: Show where the model wins

The same harness runs both engines over the same Fixture and produces a committed comparison showing where the Model Engine beats the Rule Engine and where it does not, with the ambiguous cases called out. This is the last thing built and the last thing cut inside Tier 2.

**FRs:** FR-21
**Metrics:** SM-3
**NFRs:** NFR-9's measured half

### Story 7.1: The harness measures the Model Engine on the same Fixture

As the builder,
I want both engines measured by one command over one Fixture,
So that the comparison is between two implementations and not between two methods of measuring.

**Acceptance Criteria:**

1. **Given** an API Key in the environment **When** I run the harness against the Model Engine **Then** it reports the same per-field format over the same Fixture entries as the Rule Engine run (FR-21).
2. **Given** no API Key **When** the Model Engine run is requested **Then** it is skipped with a clear message, not an error (FR-21).
3. **Given** the Model Engine run **When** it issues calls **Then** it goes through the same adapter the app uses, with the same call shape, so the measured thing is the call the app actually makes (AD-12, AD-14).
4. **Given** the run **When** it resolves dates and placement **Then** it injects the Fixture's fixed reference date through the Clock port (NFR-10, AD-2).
5. **Given** the harness's key **When** it is supplied **Then** it comes from a Node environment variable documented in `.env.example`, never from browser storage (AD-8).

**Requirements:** FR-21, NFR-10
**Prerequisites:** **Story 4.1 (FR-19 — declared prerequisite)**, Story 4.2, Story 6.3
**Spine rows:** FR-19–FR-21 Fixture and harness
**Notes:** requires an API Key with credit. The story states that dependency rather than assuming it.

### Story 7.2: The comparison is committed

As a grader weighing process and AI steering at 30 %,
I want a written comparison of the two engines,
So that the project demonstrates where its AI helps instead of asserting that it does.

**Acceptance Criteria:**

1. **Given** both engine runs **When** the comparison is written **Then** it is committed at `.docs/results/engine-comparison.md` (SM-3, AD-12).
2. **Given** the comparison **When** it is read **Then** it shows per field where the Model Engine beats the Rule Engine and where it does not (SM-3).
3. **Given** the ambiguous Fixture entries **When** the comparison is written **Then** they are called out by name, because they are the entries with diagnostic value (SM-3, SM-C2).
4. **Given** the comparison **When** it draws conclusions **Then** it does not present the Model Engine serving more Suggestions as a success, and does not treat a high acceptance rate as evidence of quality (SM-C1, SM-C3).
5. **Given** the comparison **When** it is written **Then** it is in English (§6.1).

**Requirements:** SM-3, SM-C1, SM-C3, NFR-9 (measured half)
**Prerequisites:** **Story 4.1 (FR-19 — declared prerequisite)**, Story 7.1
**Spine rows:** NFR-9, SM-3 AI decision documented

### Story 7.3: The README carries the measured results and the attributed screenshot

As a grader with no API key,
I want to see what a Model Engine Suggestion looks like and what it measured,
So that the AI feature is visible to me even though I cannot run it.

**Acceptance Criteria:**

1. **Given** the comparison exists **When** the README is updated **Then** it carries the measured FR-21 results, or links the committed comparison (NFR-9).
2. **Given** a real Model Engine Suggestion **When** it is captured **Then** the README carries a screenshot or short recording of it, showing FR-11's attribution chip (NFR-9).
3. **Given** the screenshot **When** it is produced **Then** it required a working API Key and at least one real call — a prerequisite this story states rather than discovers (NFR-9, `issues.md` 2026-11-02).
4. **Given** the README after this story **When** it is read **Then** the places Story 5.2 left open are filled and nothing in it still reads as pending (NFR-9).
5. **Given** the updated README **When** it describes the timeout or the provider **Then** it still describes neither as measured or verified unless OQ-1 has actually been run (§13 item 21, constraints checklist 4).

**Requirements:** NFR-9
**Prerequisites:** Story 5.2, Story 7.2
**Spine rows:** NFR-9, SM-3 AI decision documented

---

## Epic 8: Refinements that may be cut

Three Tier 3 additions, grouped so that cutting them is one deletion rather than surgery across the other seven epics. Each is additive by construction.

**FRs:** FR-22, FR-16's configurability, FR-3's Project field

### Story 8.1: Ask for a fresh proposal

As someone whose task has changed,
I want to ask for a new proposal explicitly,
So that the engine runs when I want it to and never otherwise.

**Acceptance Criteria:**

1. **Given** a Task **When** I use "Suggest again" **Then** a new Suggestion is produced and reviewed through FR-10 like any other (FR-22).
2. **Given** a Suggestion was rejected in whole or in part, or the task text was edited **When** I open the Task **Then** "Suggest again" is available (FR-22).
3. **Given** I edit the task text **When** the edit is applied **Then** no new Suggestion is produced — nothing re-runs the engine without my asking (FR-22, FR-3, AD-15).
4. **Given** a fresh Suggestion **When** it becomes reviewable **Then** the service has filtered it against that Task's struck set, so a struck control is never re-proposed for that Task (AD-3).
5. **Given** a request is in flight for a Task **When** I look at "Suggest again" **Then** it is disabled (AD-3).
6. **Given** accepted values **When** a new Suggestion arrives **Then** they are not overwritten until I accept the new Suggestion's matching part (FR-22, AD-15).
7. **Given** whichever implementation is active **When** "Suggest again" runs **Then** it obeys FR-9's gate and fallback rules unchanged (FR-22).

**Requirements:** FR-22
**Prerequisites:** Story 2.3 (the struck set), Story 2.1
**Spine rows:** FR-22 Suggest again
**Notes:** AD-10's one stated exception — this adds a path into `SuggestionService`, so cutting it removes a path rather than an unread value.

### Story 8.2: Choose how long completed Tasks stay

As someone with my own rhythm,
I want to change the retention window,
So that Archive matches how I work rather than a default.

**Acceptance Criteria:**

1. **Given** Settings **When** I change the retention window **Then** the new value is stored in `todo.settings.v1` (FR-16, AD-6).
2. **Given** a changed window **When** any view renders **Then** existing completed Tasks are re-evaluated against the new value, with no migration and no sweep, because archive status is derived (FR-16, AD-7).
3. **Given** no value has been set **When** the window is read **Then** it is 30 days from the one named defaults factory (FR-16, AD-6).
4. **Given** this story is cut **When** the product ships without it **Then** the fixed 30-day window from Epic 3 still works and nothing else changes (AD-10).

**Requirements:** FR-16 (configurability)
**Prerequisites:** Story 3.4, Story 2.6
**Spine rows:** FR-16 Archiving

### Story 8.3: Group Tasks under a Project

As someone running a group project alongside coursework,
I want to name a Project and put Tasks in it,
So that a body of work has a name that is mine rather than derived.

**Acceptance Criteria:**

1. **Given** a Task **When** I assign a Project **Then** it is stored on the Task and shown on Task detail (FR-3, PRD §3).
2. **Given** a Project **When** it is set **Then** it is assigned by me and never derived or proposed by any engine (PRD §3, FR-6).
3. **Given** the Project field **When** it is added **Then** it is an optional property that no Tier 1 selector reads, so no Smart List, harness assertion or Fixture expectation changes (AD-10).
4. **Given** this story is cut **When** the product ships without it **Then** nothing else in the product changes (AD-10).

**Requirements:** FR-3 (Project field)
**Prerequisites:** Story 1.5
**Spine rows:** FR-1–FR-5 Task CRUD

---

## Coverage Verification

Run after all 38 stories were written, on 2026-11-22. **8 epics · 38 stories.** Every story carries a Requirements line, a Prerequisites line and the spine row it implements.

**Functional requirements — 23 of 23 covered.** FR-1 – FR-5 and FR-23 in Epic 1; FR-6 – FR-8 and FR-10 in Epic 2; FR-12 – FR-14 and FR-16 in Epic 3; FR-15 and FR-19 – FR-20 in Epic 4; FR-9, FR-11, FR-17 – FR-18 in Epic 6; FR-21 in Epic 7; FR-22 in Epic 8. The three deliberately split requirements land where the Epic List says: FR-3 in Story 1.5 with its Project field in Story 8.3, FR-11's chip in Story 2.1 and its no-key statement in Story 2.6 with the persistent-failure status in Story 6.5, and FR-16's fixed window in Story 3.4 with its configurability in Story 8.2.

**Non-functional requirements — 10 of 10 covered.** NFR-1 (1.2, 2.2) · NFR-2 (6.4) · NFR-3 (1.8, 3.1) · NFR-4 (1.1, 2.6, 5.2, 5.4) · NFR-5 (2.1) · NFR-6 (6.4, 6.5) · NFR-7 (4.2, 5.1, 5.4) · NFR-8 (6.6) · NFR-9 (5.2, 5.3, 7.2, 7.3) · NFR-10 (1.3, 1.6, 3.1, 3.4, 4.2, 4.3, 7.1).

**Success metrics.** SM-1 (4.2, 4.4) · SM-2 (1.1, 5.1, 5.4) · SM-3 (7.2, 7.3) · SM-4 (2.2) · SM-C1 (2.3, 2.5, 7.2) · SM-C2 (4.1, 4.4) · SM-C3 (7.2). **SM-5 has no story by design** — "the builder does not revert to another list" is an observation after shipping, not graded and not buildable.

**UX design requirements — 24 of 24 covered.** UX-DR1, 3, 4, 14, 15, 20 (1.1) · UX-DR6, 10, 12 (1.2, 3.2) · UX-DR16 (1.4, 2.6, 3.2) · UX-DR18 (1.5, 1.7, 2.5, 2.6, 6.5) · UX-DR23, 24 (1.8, 2.6) · UX-DR2, 7, 8, 11, 21 (2.1) · UX-DR9, 22 (2.2, 2.3, 2.4, 3.4) · UX-DR19 (2.3, 2.5) · UX-DR5 (3.1) · UX-DR13 (3.3).

**UX-DR17 — the 17 drawn surfaces, each owned by a story:**

| Surface | Story |
| --- | --- |
| `m9` first run | 1.1 |
| `m1`/`d1` Today | 1.2 and 1.4 build capture and records; 3.1 adds the bands and the three lists |
| `m6`/`d5` Task detail | 1.4 and 1.5; 8.1 adds "Suggest again" |
| `m2` capture, course pending | 2.2 |
| `m3`/`d2` review, three controls open | 2.1 |
| `m4`/`d3` review, editing one control | 2.3 |
| `m5`/`d4` review, partial with undo | 2.4, with the shortcuts in 2.5 |
| `m7` a list, and all the lists | 3.2 |
| `d6` Archive | 3.4 |
| `m8`/`d7`/`d8` Settings | 2.6 builds it with no key; 6.1, 6.2 and 6.5 add the key field, the consent control and the failure status; 8.2 adds the retention control |

**Constraints checklist — all ten pass.**

1. **Shortcuts in Tier 1, behaviour unchanged, no promotion** — Story 2.5, AC 4 and AC 6: composites of the per-control actions, plain outline below the rule, never primary.
2. **UX labels for UI strings, FR numbers in acceptance criteria** — Story 2.5 AC 5 fixes Punch all / Strike all as the strings; every AC in the document cites its FR, NFR, AD or SM.
3. **FR-19 has its own story, declared as a prerequisite** — Story 4.1, declared in 4.2, 4.3, 4.4, 7.1 and 7.2.
4. **Nothing calls the timeout or the provider measured** — Story 6.4 AC 6, Story 5.2 AC 5, Story 7.3 AC 5. No other passage in this document names a measured latency or a confirmed provider.
5. **The timeout is one named constant** — Story 6.4 AC 5: `MODEL_ENGINE_TIMEOUT_MS` in `core/constants.ts`, never inlined, carrying its provisional comment.
6. **Setup, testing and documentation are story-bearing inside Tier 1** — setup in Story 1.1; documentation in Stories 5.1 – 5.3; verification in Story 5.4; testing distributed where it belongs rather than deferred: NFR-10's fixed-date discipline in 1.3, 1.6, 3.1, 3.4 and 4.2, FR-15's placement assertions in 4.3, the SM-1 floor as a CI gate in 4.4, FR-8's 100 ms assertion in 1.2 and 2.2, `axe-core` at both widths in 1.1 and 5.4, and NFR-8's mocked-API coverage in 6.6.
7. **Every story names its spine row** — 38 of 38.
8. **Every grader-facing artifact is English** — Story 5.1 AC 7 and Story 7.2 AC 5; `.logs/` stays Norwegian and is not a deliverable.
9. **UI stories inherit the WCAG 2.2 AA floor** — targets ≥24 × 24 CSS px (2.3 AC 8), the panel-never-covers-type contract as an SC 2.4.11 assertion (2.1 AC 8), `axe-core` at 360 px and 1280 px (1.1 AC 7, 2.6 AC 6, 5.4 AC 3), and no conformance claim anywhere (5.2 AC 4).
10. **The Fixture story is fixed as decided** — Story 4.1: reference date Monday 2026-11-16 (AC 3), "Submit assignment in IBE160 Friday" as the ordinary case and a separate `Monday` entry for the edge case (AC 6), with FR-12's past-due rule and FR-16's window covered by selector unit tests in 3.1 AC 8 and 3.4 AC 6 rather than by a Fixture entry (AC 8).

**Dependency check.** No story depends on a later story, inside its epic or outside it. Cross-epic prerequisites run in one direction only: 2.1 → 1.2, 1.3 · 3.1 → 1.4, 1.6 · 4.1 → 2.1, 3.1 · 5.1 → 4.2 · 6.1 → 2.6 · 7.1 → 4.1, 4.2, 6.3 · 8.1 → 2.1, 2.3 · 8.2 → 2.6, 3.4 · 8.3 → 1.5. Cutting Epic 8, then 7, then 6 removes no prerequisite of anything left standing.

**Step 4 validation, 2026-11-22.** Every FR's testable bullets were traced individually to an acceptance criterion. **One gap was found and closed:** FR-7's availability bullet — a Suggestion with no API Key, no configuration and no network — had no criterion, and is now Story 2.1 AC 11. Storage keys are created only by the story that needs them: `todo.tasks.v1` in 1.2, `todo.apikey.v1` in 6.1, `todo.settings.v1` when FR-18's toggle exists in 6.2 and extended in 8.2 — nothing upfront. Prerequisites were scanned mechanically across all 38 stories: every one points backwards. Four file overlaps were assessed and deliberately kept — the README (Epics 5 and 7), the CI workflow (1 and 4), `SuggestionService` (2 and 6) and `core/selectors.ts` (1 and 3) — each with one owning story and a named extension, and three of them are the tier cut lines the epic boundaries exist to carry. Two stories are heavier than the rest and may be split if they overrun a single session: **1.1** (substrate, tokens, CI) at the CI workflow, and **2.1** (FR-6, FR-7, panel, chip) at `core/rule-engine.ts` with its unit tests.

**Coupling check.** The seven shared artifacts in the slicing and reuse contract each have exactly one owning story, and every later story that needs one imports it: `core/tokenize.ts` (1.3) · `core/selectors.ts` (1.4, extended by 3.1 and 3.4) · the record component (1.2) · `SuggestionService` and `mayUseModelEngine` (2.1, extended by 6.2 – 6.4) · `ui/labels.ts` and `ui/theme.css` (1.1) · the CI workflow (1.1, extended by 4.4) · the README (5.1 – 5.3, completed by 7.3). The shell is extended with a route per destination rather than rebuilt — Today in 1.4, Settings in 2.6, Lists in 3.2, Archive in 3.4.
