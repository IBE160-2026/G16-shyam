---
title: 'Reconciliation review — PRD vs ARCHITECTURE-SPINE'
reviewer: reconcile-prd
spine: ../ARCHITECTURE-SPINE.md
inputs:
  - ../../../prds/prd-To-Do-List-2026-10-31/prd.md
  - ../../../prds/prd-To-Do-List-2026-10-31/addendum.md
date: '2026-11-18'
verdict: PASS WITH FINDINGS
---

# Reconciliation review: PRD + addendum → ARCHITECTURE-SPINE

**Verdict: PASS WITH FINDINGS.** The spine is a real spine, not a restatement: AD-1 through AD-13 are
mechanically checkable rules with named prevention cases, the Capability map's claim that every FR and
NFR appears exactly once **holds** (I checked all 23 FRs and all 10 NFRs), OQ-4 and OQ-8 are resolved
and written back into the PRD, and OQ-1/OQ-6 are correctly left open with the blast radius pinned
(AD-5's single constant, the Deferred section). It is good enough to build from.

It is not finished. One finding is build-blocking as written (F1). Four more are load-bearing PRD
obligations the AD structure dropped rather than extended — most of them quiet ones: the Model Engine's
call configuration, the per-part review invariant, the engine-invocation trigger invariant, and the
entire §7 counter-metric / SM-1 floor apparatus. Several of these were never raised in `.memlog.md`
either, so they were not decided-and-omitted; they were missed.

Findings are ordered by severity, each with its PRD anchor, its spine anchor, and the cheapest fix.

---

## F1 — `critical` — AD-1 and AD-2 forbid `Date` in `core/`, but `core/` is where every FR-23, FR-12 and FR-16 date computation lives

**PRD anchor:** FR-23 (whole vocabulary, next-occurrence rule, `next week` → next Monday), FR-12
("current week" = Monday–Sunday inclusive, device local time zone), FR-16 (`daysSince(completedAt)`
against the retention window), NFR-10.
**Spine anchor:** AD-1 Rule ("no module under `src/core/` may reference `window`, `document`,
`localStorage`, `fetch`, `Date`, React, or any Vite-injected value"); AD-2 Rule ("`Date` and `Date.now`
are reachable only inside `src/adapters/system-clock.ts`… Enforced by an ESLint `no-restricted-globals`
rule"); Structural Seed `core/date-words.ts # FR-23`, `core/selectors.ts # FR-12..FR-16 predicates`;
Consistency Conventions → Data — dates ("'current week' is Monday through Sunday inclusive, local time
zone, **defined once in `core/selectors.ts`**").

AD-2's intent is right and is the NFR-10 mechanism: no module may read the *ambient* now. But AD-1 and
AD-2 are written against the `Date` **symbol**, not against ambient time, and `no-restricted-globals`
on `Date` will flag `new Date(isoString)` exactly as it flags `Date.now()`. Under the rule as written,
`core/date-words.ts` cannot resolve "the next Friday after the reference date", `core/selectors.ts`
cannot compute `startOfDay(now)` (the very expression AD-9 names as the `isPastDue` predicate) or
`daysSince(completedAt, now)`, and the Data — dates convention instructs core to define the
Monday–Sunday week it has no means to compute. The Stack table lists no date library either, so no
alternative is sanctioned.

This is an internal contradiction between AD-1/AD-2 and both the Structural Seed and the Data — dates
convention, and it lands on Tier 1 work (FR-23 and FR-12–FR-15 are all Tier 1 per PRD §6.3). It also
makes FR-23's testable bullets *harder than necessary* (category 5 of this review): hand-rolled calendar
arithmetic over ISO strings is where DST, month ends and year boundaries go wrong, and FR-23's "same
text and reference date, same due date" is cheap to satisfy with a parameterised `Date`, which is
deterministic by construction.

**Fix:** rewrite AD-1/AD-2's rule to ban *ambient* time rather than the `Date` constructor — forbid
`Date.now()` and zero-argument `new Date()` anywhere outside `adapters/system-clock.ts`, permit
`new Date(explicitValue)` inside one named pure module (`core/dates.ts`, added to the Structural Seed)
that `date-words.ts` and `selectors.ts` both use. The ESLint enforcement becomes a
`no-restricted-syntax` rule on the two ambient forms. Nothing about NFR-10 or AD-1's runtime-agnosticism
is weakened: a pure function of an injected instant is still pure.

## F2 — `high` — the Model Engine's call configuration is a PRD requirement and a §8 cost guardrail; the spine demotes it to "wording, a build-time concern"

**PRD anchor:** §4.2's closing line, which is a requirement sentence, not prose: *"the Model Engine
requests schema-constrained output… and runs at the lowest available effort setting (OQ-1)"*. Plus §8
**Cost**: "Spend is bounded by design: **one call per capture, small inputs, lowest effort setting,
opt-in gate**… **No batching, caching or spend-cap machinery in v1**." Plus addendum §1 (default effort
is `medium`, *not* the lowest — "the naive call is both the slow one and the expensive one"), addendum
§1.1 (`output_config.format`, not the deprecated `output_format`), addendum §3.1 (effort moves latency
10–100x), OQ-1's fixed spike configuration (`effort: "low"`, `thinking: {"type":"disabled"}`, small
`max_tokens`, no `temperature`/`top_p`/`top_k`).
**Spine anchor:** AD-11 (network envelope — host and call site only); AD-4 (absorbs `refusal`,
`max_tokens`, enum casing — good, that part landed); Deferred bullet 3: *"The Model Engine prompt and
its schema text. Shape is fixed by the addendum's structured-output contract; the wording is a
build-time concern, tuned against the Fixture."*

Effort level, thinking-disabled, `max_tokens` and the absence of sampling parameters are not wording and
not prompt-tuning. They are the *only* thing standing behind §8's cost claim ("about half a cent to a
cent per hundred Tasks") and behind OQ-1's pass bar being reproducible — a Model Engine built at Haiku
5.5's default `medium` effort with adaptive thinking on is a different product on both axes, and the
addendum says explicitly that this is the easy mistake to make. The spine has no AD, no convention row
and no `core/constants.ts` entry for any of it. Dropping "one call per capture" also leaves §8's
"no batching, caching" unstated anywhere except the service-worker clause in AD-11, which exists for a
different reason (FR-9 reproducibility).

**Fix:** add an AD — "the Model Engine call shape is fixed, not tuned" — binding §4.2, §8, NFR-2 and
OQ-1: exactly one request per Suggestion request, never a retry; `output_config.format` with the
addendum §1.1 schema; `effort: "low"`; `thinking: {"type":"disabled"}`; a small `max_tokens`; no
sampling parameters; model id `claude-haiku-5-5` dateless and read from `core/constants.ts` beside
NFR-2's timeout. Then the Deferred bullet is honestly about prompt wording alone.

## F3 — `high` — FR-10, the product's central requirement, has no governing rule; its Capability map row cites two ADs that are about something else

**PRD anchor:** FR-10 (each of Tags, Priority, Summary accepted/edited/rejected "without affecting the
other two, in any combination"; "accepting a part writes **only** that part"; "rejecting… does not
reapply that part later"; "**No part is applied without an explicit accept or edit of it**"; a
Suggestion with any part unreviewed "stays visibly pending"); FR-6 second bullet ("A Suggestion is never
applied to a Task without passing through FR-10"); FR-22 ("Accepted values are not overwritten until the
user accepts the new Suggestion's matching part"); §1's whole thesis — "Nothing is filed until you
accept it."
**Spine anchor:** Capability map row "FR-10 Per-control review and undo | `ui/review/`,
`app/store.tsx` | **AD-7, AD-10**".

AD-7 governs where the undo buffer lives and that derived state is not persisted. AD-10 governs that the
Accept-all/Reject-all shortcuts are additive for cut purposes. **Neither says anything about per-part
independence, about writing only the reviewed field, or about no-write-without-explicit-review.** The
only place that invariant appears in the whole spine is a node label in the Suggestion-path flowchart
("Writes only the reviewed field") and a convention row about named actions. This is precisely the
"served only nominally by a Capability map row with no governing rule behind it" pattern: FR-10 is the
requirement the PRD, the brief and the instructor all treat as the differentiator, and the one feature
whose violation ("Accept all wrote the Summary too") would be invisible in a passing test suite.

**Fix:** an AD stating that the store exposes exactly three per-part review actions plus their undo,
that each writes exactly one field of one Task, that Accept-all/Reject-all are defined as compositions
of those three (so AD-10's additivity claim becomes true by construction), and that no other reducer
action may read a pending Suggestion's values. Then FR-6's "never applied without passing through
FR-10" is enforceable by inspection of the action list, and FR-10's bullets become Vitest cases at the
store layer rather than Playwright archaeology.

## F4 — `high` — nothing re-runs the Suggestion Engine unasked: an invariant three FRs depend on, in no AD

**PRD anchor:** FR-3 ("Editing a field that came from an accepted Suggestion overwrites it **without
re-triggering the Suggestion Engine**"); FR-22 ("A fresh Suggestion is **never** produced
automatically"; "Editing task text does **not** itself trigger a new Suggestion — nothing re-runs the
Suggestion Engine without the user asking"); §8 Cost ("one call per capture"); FR-9's transient rule
("the next capture attempts it again" — i.e. attempts are per-capture events, not per-render).
**Spine anchor:** AD-3 (owns consent gate, selection, timeout, classification, fallback, attribution);
AD-10 ("'Suggest again' is one further call into `SuggestionService`"); Capability map FR-22 row.

AD-3 is about *policy* ownership — it stops capture and Suggest-again from each implementing FR-9
differently. It says nothing about *who may call* `SuggestionService.request`, or *when*. With a
`useReducer`/context store and derived values recomputed on every render (AD-7), an effect that fires a
request on task-text change is the natural accident, and it breaks FR-22's third bullet, FR-3's second
bullet and §8's cost guardrail at once — silently, because the user still sees a Suggestion.

**Fix:** extend AD-3's rule with the trigger invariant: `SuggestionService.request` has exactly two call
sites — the create-Task action and the explicit FR-22 action — and may never be called from a React
effect keyed on Task data. Pair it with a test asserting that editing task text issues no engine call.

## F5 — `high` — §7's counter-metrics, FR-19's Fixture composition and SM-1's committed floor are absent; the spine's only Fixture rule is path, count and reference date

**PRD anchor:** SM-C1 (acceptance rate must not be driven up — "equally consistent with good Suggestions
and with a review UI that makes Accept the path of least resistance"); **SM-C2** (Fixture "must not
shrink or drift toward easy cases to flatter SM-1. The ambiguous entries are the ones with diagnostic
value"); SM-C3 (Model Engine usage share is not a goal); SM-1 ("That run also commits a written minimum
per field… **the minimum is a floor the suite fails below**, independent of the no-regression bar");
FR-19's enumerated composition (one entry per FR-23 form; one with no date word; one unrecognized
phrase; one abbreviated weekday; one `Saturday`; at least one with **no keyword match at all**; at least
one deliberately ambiguous date case plus a two-date-word case; ambiguous Priority entries "required as
well as easy ones"); FR-20 ("**names which entries failed**, so a failure is diagnosable rather than
just a score").
**Spine anchor:** AD-12 — which fixes the Fixture's path, the 10–15 range, the injected reference date,
per-field reporting with Summary apart, and the no-key FR-20 / skip-with-a-message FR-21 split. All
correct, and all of it about *plumbing*. The Environments diagram has CI running the FR-20 harness.
Deferred records SM-1's minimums as unknown (correct, OQ-6).

The three counter-metrics appear nowhere in the spine, and SM-C2 is the one with a genuine architectural
lever: the Fixture is a committed data file, so "it must not drift toward easy cases" can be made
structural — a test asserting the entry count stays in range *and* that the named hard entries (no-match,
reference-date-weekday, two-date-words, `Saturday`, abbreviation, unrecognized phrase) are each present.
Without that, the cheapest way to make a red CI go green three days before the deadline is to edit
`fixture/tasks.json`, which is exactly the failure SM-C2 was written to forbid. Likewise, CI "runs the
FR-20 harness" with no stated exit condition: SM-1's floor is only a floor if the harness exits
non-zero below it. And FR-20's diagnosability bullet ("names which entries failed") is dropped from
AD-12's otherwise faithful restatement of FR-20.

**Fix:** extend AD-12 with (a) the Fixture-composition assertions as a committed test, (b) the harness
exiting non-zero below the committed per-field minimums once OQ-6 lands, and on regression, (c)
per-entry failure naming in the harness output. SM-C1's lever is AD-10's "shortcuts compose the
per-control actions and add no path those lack" — say that SM-C1 is *why*, so a later "one-tap accept
everything" proposal has something to argue with. SM-C3 needs one sentence: the app may not prompt,
nudge or badge the user toward enabling Cloud Suggestions.

## F6 — `medium-high` — NFR-3's offline correctness and §9's PWA install have no governing rule; the memlog's "shell precached" decision did not reach the spine

**PRD anchor:** NFR-3 ("With no network the app is fully functional; no view shows an error, spinner or
empty state attributable to the missing network", pending indicator exempt); §9 ("installable as a PWA…
Offline-capable: FR-1–FR-5, FR-7, FR-10, FR-12–FR-16, FR-22 and FR-23 all work with no network");
UJ-2 ("opens the app cold… offline on the tram… No sync indicator, no spinner, no empty state").
**Spine anchor:** Capability map "NFR-3 Offline correctness | `adapters/`, PWA config | **AD-11**";
`vite-plugin-pwa 2.0.0` in the Stack.

AD-11 is an *outbound* envelope rule: one host, one file, no CDN, no fonts fetched, and the service
worker must not cache `api.anthropic.com`. All of that is necessary and well-argued — but none of it
makes a cold offline open work. UJ-2's cold start requires the app shell precached and a registration
strategy; `.memlog.md` line 29 records exactly that decision ("vite-plugin-pwa for offline,
`registerType autoUpdate`, **shell precached**"), and the spine carries only the second half of that
bullet (the no-cache-for-Anthropic clause). Nothing in the spine mentions a manifest, install criteria
or precaching. So NFR-3 and §9's PWA line are currently served nominally, by an AD about the opposite
direction of traffic.

**Fix:** add the dropped half back to AD-11 (or a sibling AD): precache the built shell,
`registerType: 'autoUpdate'`, manifest and icons vendored, and an explicit statement that no view may
render a network-attributable error, spinner or empty state — with FR-8's pending indicator named as the
one exemption NFR-3 grants.

## F7 — `medium` — FR-11's persistent-failure reason has no home: AD-6 enumerates the settings key's contents and excludes it

**PRD anchor:** FR-9 (persistent failures are "surfaced in Settings"; transient ones record **nothing**
"that would make Settings call the Model Engine unavailable"); FR-11 ("After a persistent failure,
Settings shows a plain, non-alarming status saying three things…"; "It clears once the cause is
resolved, without the user dismissing anything"; "That status appears **only** in Settings").
**Spine anchor:** AD-4 (the three reason names — the right structural basis); AD-6 ("`todo.settings.v1`
(retention window, Cloud Suggestions state)" — an exhaustive-reading list); the Suggestion-path
flowchart ("persistent — reason recorded"; "Settings shows persistent reason only").

"Reason recorded" — recorded *where*, and living how long? If it is in-memory React/store state it dies
on reload, and a user who hits `org_forbids_browser`, reloads, and opens Settings sees "Model Engine
active" with no capture since — a quiet FR-11 violation. If it is persisted, it needs a key, and AD-6
says no module outside the adapter names a storage key while its own list does not include this. The
clearing rule ("clears once the cause is resolved, without the user dismissing anything") also needs a
stated mechanism: the natural one is that the reason is overwritten by the next engine result, which
means it must be written on *every* Model Engine attempt, including successes and transient failures —
but FR-9 forbids a transient failure recording anything that makes Settings call the engine unavailable,
so "clear on transient, set on persistent, clear on success" has to be stated to be got right.

**Fix:** name the home and the lifetime in AD-4 or AD-6 — I would put the last persistent reason in
`todo.settings.v1` as `lastPersistentReason: Reason | null`, written only by `SuggestionService`,
cleared on any `ok: true`, untouched by a `transient` result. Then FR-11's three statements are a pure
function of (key present, consent on, lastPersistentReason) and are unit-testable.

## F8 — `medium` — AD-6's read-time migration does not state its fail-safe direction, and FR-18's default-off is a privacy guardrail that depends on it

**PRD anchor:** FR-18 ("Default state on first run is off, **including when an API Key is already
present**"; "Clearing and re-saving a key does not re-enable Cloud Suggestions if the user had turned it
off"); §8 Privacy ("no task text leaves the device unless Cloud Suggestions is on").
**Spine anchor:** AD-6 (three keys — a genuinely good mechanism, and `.memlog.md` line 32 names FR-18's
re-save bullet as the reason; plus "a `schemaVersion` and a read-time migration step from version 1
onward").

The three-key split is the right structural answer and I want to credit it: clearing the API Key
physically cannot touch the consent flag. What is missing is one sentence about defaults. A read-time
migration, a missing `todo.settings.v1`, a corrupted JSON parse, or a settings shape that gained a field
in week three all need a default, and for Cloud Suggestions the fail-safe default is `false` while for
the retention window it is 30 days. Unstated, the natural implementation (`??` over a parsed object) is
usually right and occasionally — on a parse failure handled with a `try`/`catch` returning a partial
object — is not. Given §8 makes this the one privacy-bearing flag in the system, it is worth the
sentence.

**Fix:** AD-6 gains: unreadable, absent or unmigratable settings resolve to Cloud Suggestions `false`
and retention 30 days; the consent flag is written only by its own settings action and never as a side
effect of a key write.

## F9 — `medium` — NFR-7 clean-clone reproducibility: nothing names how `harness/run.ts` executes under Node 22

**PRD anchor:** NFR-7 ("The README takes a fresh clone to a running app; **the FR-20 harness runs from
the same clean state**"); FR-20 ("A command runs the Rule Engine over every Fixture entry"); SM-2; §8's
grader-runnability hard constraint; §11's 10% README-and-runnability line.
**Spine anchor:** Stack table ("Node (harness, CI) | 22 LTS"); Structural Seed `harness/run.ts`; AD-12;
Capability map NFR-7 row (`package.json`, `.env.example`, README | AD-8, AD-11).

`harness/run.ts` is TypeScript importing TypeScript from `src/core/`. Node 22 cannot run that as-is for
anything beyond trivial type-stripping, and the Stack table lists no runner (`tsx`, `vite-node`, a
`tsc` build step, or `node --experimental-strip-types` with the constraints that implies). This is the
one place where the two-runtime paradigm — the spine's stated *reason for existing* (Design Paradigm,
AD-1, AD-12) — touches tooling, and it is unspecified. It is also exactly what a grader types.

**Fix:** pin the runner in the Stack table and name the npm script (`npm run harness`) in AD-12, with
the note that it must work with no key and no network from a clean `npm install`.

## F10 — `medium` — AD-8 and AD-12 together imply the Anthropic adapter takes its key as a parameter; neither says so

**PRD anchor:** OQ-4 as resolved ("two keys in two runtimes, and only one of them is the app's"); FR-21
(the same harness runs the Model Engine from a Node env var); FR-17 (the app's key lives on device).
**Spine anchor:** AD-8 (two homes, neither the bundle); AD-12 (`harness/` imports from `src/core/` and
may depend on `adapters/` per the layer table); AD-11 (`adapters/anthropic-engine.ts` is the single call
site); AD-1 (core may not touch `localStorage` — but the adapter may).

If `anthropic-engine.ts` reads the key itself, it must read `todo.apikey.v1` (browser) *or*
`process.env.ANTHROPIC_API_KEY` (harness), and the one adapter the harness reuses becomes
runtime-dependent — reintroducing, one layer down, the exact problem AD-1 exists to prevent. The
addendum adds a second wrinkle: the browser path needs
`anthropic-dangerous-direct-browser-access: true` / `dangerouslyAllowBrowser: true` (addendum §1.2),
which the Node harness should not send. Neither the key injection nor the browser-only flag is stated.

**Fix:** state in AD-8 that the adapter is constructed with its key and its browser-access flag by the
composition root (`src/main.tsx` or `harness/run.ts`) and reads neither storage nor `process.env`
itself. That is already the spine's composition discipline — it just is not written where it binds.

## F11 — `medium` — FR-7's Summary is a truncation, not a summarization, and the spine never says it

**PRD anchor:** FR-7 testable bullet ("The Summary is a cleaned-up, truncated restatement of the task
text, **not true summarization** (§13 item 3)"); §13 item 3; SM-1 ("Summary is scored separately and
folded into no other field — a truncation, not a summarization"); addendum §2.1 (the mechanics: trim
whitespace, **strip a trailing date phrase if one was parsed into the due date**, cap on a word
boundary; and "the Fixture should assert the truncation is *sensible*, not that it is a good summary").
**Spine anchor:** `core/rule-engine.ts # FR-7` in the Structural Seed; AD-12 carries only the
*reporting* half ("Summary reported apart and folded into none of them").

The spine faithfully carries the measurement rule and drops the construction rule. Two consequences.
First, nothing in the spine stops a well-meaning implementation from reaching for a cloud call or a
cleverer heuristic for the Rule Engine's Summary, which would break NFR-5 determinism and FR-7's
"pure function of task text and due date". Second, the addendum's date-phrase strip makes
`rule-engine.ts` depend on what `date-words.ts` consumed — a real intra-`core` coupling (the Rule Engine
needs to know *which* span was parsed, not just the resulting date), and the Structural Seed draws the
two modules as siblings with no stated relationship.

**Fix:** one line in AD-1 or a convention row: the Rule Engine Summary is a deterministic truncation per
addendum §2.1, and `date-words.ts` returns the matched span alongside the resolved date so the strip has
a defined input.

## F12 — `medium` — FR-10's undo is placed in "React state", which both under-specifies it and sits awkwardly against the State-mutation convention

**PRD anchor:** FR-10 ("Accepting is reversible: immediately after accepting a part, the user can undo
it, restoring that field's prior value"; single-step, no history, none across sessions; "Undo after
'Accept all' restores all three fields").
**Spine anchor:** AD-7 ("The single-step undo buffer (FR-10) lives in React state and dies with the
tab"); Consistency Conventions → State mutation ("one store, `useReducer` plus context, in
`src/app/store.tsx`. Every mutation is a named action… **no component holds derived state**").

AD-7's *intent* is right — not persisted, dies with the tab, which is a faithful reading of FR-10. But
"React state" spans two very different places: the store's reducer state (app layer, Vitest-testable,
consistent with the State-mutation convention) and a component's `useState` in `ui/review/` (which makes
FR-10's undo bullets reachable only through Playwright, and makes "undo after Accept all restores all
three" a UI concern rather than a store invariant). Given F3, this is the second half of the same
problem: the most differentiating requirement in the PRD ends up with the least architectural support.

**Fix:** say reducer state explicitly — a single-slot `lastReview` in the store, cleared by any
subsequent action, never serialized by the persistence step. That satisfies "dies with the tab" and
keeps FR-10's four testable bullets at the store layer.

## F13 — `medium` — FR-8's 100 ms and SM-4 have no measurement rule, and AD-6's accepted cost pushes directly against them

**PRD anchor:** FR-8 ("The Task appears in the list before the next user action, and **no later than
100 ms after submit** (measured with the Suggestion Engine excluded)"); NFR-1; SM-4 ("Task creation
meets FR-8's 100 ms limit with the Suggestion Engine offline, slow or absent").
**Spine anchor:** Capability map "NFR-1, NFR-4 Latency, responsiveness | `app/store.tsx`, `ui/`,
`tests/e2e/` | AD-6, conventions"; AD-6's rationale ("Synchronous also gives FR-8's 100 ms with no
`await`"); AD-6's accepted cost ("the whole document is re-serialized per mutation, on the main
thread"); Conventions → Tests (Vitest + Playwright at 360/1280; no performance assertion named).

The architectural argument is sound and I agree with it — synchronous `localStorage` is the right call
and is genuinely why 100 ms is achievable. But FR-8 and SM-4 are stated as *measurements*, and the spine
names no place where the measurement happens. The map row points at `tests/e2e/`, and the Tests
convention's Playwright entry covers viewport widths only. Meanwhile AD-6's accepted cost is the one
thing in the system whose growth curve threatens the number (full re-serialize per mutation, main
thread, against a horizon AD-6 itself puts at 12 000 Tasks). The seam needed to measure it "with the
Suggestion Engine excluded" does exist, thanks to AD-3 plus port-level fakes — which is why this is
cheap to close.

**Fix:** add a Tests-convention line: a Playwright assertion that create-to-visible stays under 100 ms
with a port-level fake engine, run against a Fixture-sized task document; and note in AD-6 that the
re-serialization cost is bounded by that test.

## F14 — `medium` — NFR-9 carries the heaviest graded weight in the PRD and its Capability map row is the thinnest in the spine

**PRD anchor:** NFR-9 (the README, or a document it links, explains **in prose**: the two
implementations; why they beat rules-only and a local model; the privacy trade-off and how consent is
handled; the measured FR-21 results; **plus screenshots or a recording of a Model Engine Suggestion
attributed as such (FR-11), so the AI model is visible without a key**); §11 (30% Process and
AI-steering — "NFR-9's written record; FR-21's comparison; brief → PRD → code traceability"); SM-3.
**Spine anchor:** Capability map "NFR-9 AI decision documented | **README plus this spine** | AD-12".

AD-12 governs the harness. It does not govern the README, and the spine has no AD, convention or
Deferred entry that owns NFR-9's artifact list — not the prose sections, not the FR-21 result file that
SM-3 requires to be *committed*, not the screenshot/recording obligation, and not where any of it lives
in the repo. `.memlog.md` records "a prose section for the hand-in README (NFR-9, rubric 'Code and
architecture' 10%)" as a chosen deliverable, so the intent exists outside the spine; the spine's own
structure dropped it. Note also that §11's grading weights — the thing §6.3's cut order is derived from —
appear nowhere in the spine, so AD-10's tier rule is correct but severed from its justification.

**Fix:** AD-12 (or a sibling) names the committed artifacts: `fixture/tasks.json`, a committed FR-21
comparison result at a named path (SM-3), the README sections NFR-9 enumerates, and the screenshot
obligation — with the note that the attribution chip (FR-11) is what makes the screenshot possible
without a key in the grader's hands. One sentence citing §11's 30% weighting would also re-anchor
AD-10.

## F15 — `low` — the Structural Seed omits `.gitignore` and `README.md`, both of which carry explicit PRD obligations and 15% of the grade between them

**PRD anchor:** §8 grader runnability ("Secrets never enter the repository: it **ships an example
environment file and a `.gitignore` excluding real ones**, and documents the Fixture's location. **Repo
tidiness was the one outright gap in review.**"); FR-19 ("committed at a documented path **named in the
README**"); NFR-7; §6.3 Tier 1 ("…FR-23, **and the README**"); §11 (10% README and runnability, 5% repo
tidiness).
**Spine anchor:** Structural Seed (lists `index.html`, `package.json`, `vite.config.ts`,
`tsconfig.json`, `eslint.config.js`, `.env.example`, `src/`, `fixture/`, `harness/`, `tests/`,
`.github/workflows/ci.yml` — and neither `.gitignore` nor `README.md`); AD-8 (mentions `.env.example`
and the no-secret rule, but not the `.gitignore` that §8 names as the mechanism).

Small and cheap, but the seed is the file-level contract stories will be written against, and §8 names
the `.gitignore` as the *mechanism* for the secret guarantee AD-8 asserts. The README is a Tier 1 item
in the PRD's own cut order and the named home of FR-19's path and NFR-9's prose.

**Fix:** add both to the Structural Seed, with `.gitignore` annotated as excluding `.env` and real key
files (AD-8), and `README.md` annotated with FR-19's path, NFR-7's clean-clone steps and NFR-9's prose.

---

## The declared divergence (AD-7, archived state) — is the handling adequate?

**Mostly yes, with one gap and one invention.**

The divergence is correctly flagged and well argued. PRD §3 lists archived state among the Task's
fields; AD-7 makes it `completedAt !== null && daysSince(completedAt, now) > retentionDays`. The
reasoning is better than the PRD's own framing: it removes a second source of truth, it keeps a
time-triggered sweep from writing "now" into storage (which would defeat AD-2 and NFR-10), and it turns
FR-16's hardest testable bullet — "changing the window re-evaluates existing completed Tasks against the
new value" — from a migration into a different argument to the same pure function. That bullet is
*easier* to satisfy under the spine than under the PRD, which is the right direction for a divergence to
move testability.

Three notes:

1. **It is not propagated back.** AD-9 sets the spine's own standard: changing what a list contains
   "costs a PRD §13 row". This divergence changes the Task's persisted shape against §3 and has no §13
   row and no §3 edit — even though the PRD *was* edited on 2026-11-18 for OQ-4 and OQ-8, so the
   mechanism and the appetite both existed in the same session. Either §3's field list should say
   archived (and completed) are derived from `completedAt`, or §13 should carry item 17. Right now the
   two documents disagree in writing and only the spine knows.
2. **A second, unflagged half.** The divergence note mentions archived state only, but AD-7 also
   replaces §3's "completed state" with a `completedAt` timestamp. That one is representational rather
   than structural — a completed Task is still a persisted fact — and FR-2's "every field in §3's Task
   definition is visible on the detail view" still holds if the detail view renders both derived states.
   But a spine that records divergences should record both halves, and FR-2's bullet should be noted as
   satisfied by display of a computed value.
3. **"Restore is clearing `completedAt`" invents a capability the PRD never asked for, and it loses
   information.** FR-16 requires only that an archived Task be "still retrievable through an archive
   view and is not deleted". AD-7 (and `.memlog.md` line 31) go further and define un-archiving as
   clearing `completedAt` — which necessarily un-completes the Task and discards when it was completed.
   Under a stored flag, un-archive and un-complete are separable; under the derived model they are the
   same action, by construction. That is an acceptable v1 simplification, but it should be stated as a
   consequence ("archived Tasks can be returned to active lists only by un-completing them; the
   completion date is not retained") rather than presented as a neutral restore.

## Open questions the PRD defers to architecture

| OQ | PRD status | Spine | Verdict |
| --- | --- | --- | --- |
| OQ-1 latency / provider / NFR-2 value | deliberately open | Deferred bullets 1–2; AD-5's single named constant; AD-4 + AD-11 keep the blast radius to one adapter plus FR-18 wording | **Correctly open, and well-contained.** See F2: the spike's own call configuration still needs to become a rule, or the measured number will describe a call shape nothing requires. |
| OQ-4 API Key / `.env.example` | resolved 2026-11-18 | AD-8 `[ADOPTED]`, "Resolves PRD OQ-4" | **Resolved, and written back into PRD §12 / §13 item 13.** F10 is the one unstated implication. |
| OQ-6 SM-1 minimums | deliberately open | Deferred bullet 4 | **Correctly open.** F5: the spine should still fix *that* the minimums become a failing gate, which is independent of their value. |
| OQ-8 storage mechanism | resolved 2026-11-18 | AD-6 `[ADOPTED]`, "Resolves PRD OQ-8", with the accepted cost restated | **Resolved, and written back into PRD §9 / §12 / §13 item 11.** The three-key refinement beyond the PRD's "one key" framing is an improvement, not a divergence. |
| OQ-3 free credit / rate limits | PRD assigns to the README | absent | Out of architecture's scope; folds into F14's README ownership. |
| §11's "10% Code and architecture — deferred to `bmad-architecture`" | deferred | the spine itself, plus the CI gates | **Served** — though §11's weights are never cited in the spine. See F14. |

## Testability sweep (PRD-style "Testable:" bullets the architecture makes harder than necessary)

- **FR-23, FR-12, FR-16 — harder, and currently impossible as written.** F1. The fix restores them to
  easy.
- **FR-10 — harder than necessary.** F3 and F12 together push four testable bullets (per-part
  independence, writes-only-that-part, undo, undo-after-Accept-all) out of Vitest and into Playwright,
  for no architectural gain. Putting the three review actions and the undo slot in the store reverses
  that.
- **FR-20's "names which entries failed" — dropped.** F5. Without it a red harness is a score, not a
  diagnosis, which matters most in the last week.
- **FR-8 / SM-4's 100 ms — unmeasured.** F13. The seam exists; the assertion is not named.
- **FR-11's three Settings statuses — harder than necessary.** F7. AD-4's three named reasons are
  exactly right and keep this off string-matching; what is missing is the state's home and lifetime,
  without which the status is testable only as a transient in-session behaviour.
- **Made easier, worth crediting:** FR-16's retention-window bullet (AD-7, as above); FR-9's full
  failure matrix (AD-4's `EngineResult` plus the two-level mocking in the Tests convention makes every
  NFR-8 bullet a table test); FR-7 / NFR-5 determinism (AD-1 + AD-2, once F1 is fixed); FR-15 and NFR-10
  (AD-2 + AD-12's injected Fixture reference date); FR-18's re-save bullet (AD-6's three keys make it
  structural rather than remembered).

## What landed well

Recorded so the findings are read in proportion:

- **AD-1 + AD-12 as a pair.** The reason `core/` is pure is that SM-1 must be a number about the code
  the app actually runs. That is the single most important thing in the PRD's §7, and the spine makes it
  structural rather than hoped for.
- **AD-4's `EngineResult`.** Three named persistent reasons, `org_forbids_browser` among them, lifted
  straight from FR-9 / FR-11 and addendum §1.2, with the provider traps (`refusal`, `max_tokens`, enum
  casing) absorbed in the adapter. This is the finest-grained carry in the document.
- **AD-5.** The late-response discard is not in the PRD at all; it is a correct inference from FR-8 plus
  NFR-6, and it closes a race the PRD would otherwise have discovered during testing.
- **AD-6's three keys.** FR-18's "clearing and re-saving a key does not re-enable Cloud Suggestions"
  stops being a thing someone must remember.
- **AD-9.** Predicate-owns-membership resolves a logged `issues.md` risk and binds the `Need Attention`
  spelling, which is the kind of small thing that silently costs a day.
- **AD-10's refusal of feature flags.** It argues against `technology.md`'s own principle on the
  solo-build constraint (§8) and is right to. The solo-build constraint is, with AD-13, the best-served
  quiet requirement in the spine.
- **The "every FR and NFR appears exactly once" claim is true.** I verified all 33 ids. The map is a
  real coverage instrument — which is why the rows that cite the wrong ADs (F3, F6, F14) are worth
  fixing rather than tolerating.
