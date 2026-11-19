---
review: rubric-walker
target: ARCHITECTURE-SPINE.md
altitude: feature (level below = epics and stories)
date: 2026-11-18
verdict: PASS WITH FINDINGS
blocking_before_epics: [F-1, F-2]
---

# Reviewer Gate — Rubric Walker

Judged against the good-spine checklist. The mechanical linter's ground (placeholders, AD id
uniqueness and monotonicity, Binds/Prevents/Rule presence, Stack versioning) is not re-checked.

**Verdict: PASS WITH FINDINGS.** Thirteen ADs, most of them unusually sharp — AD-9, AD-6, AD-4 and
AD-13 are model entries: a reviewer can grep for the violation. What the spine talked past is not a
wrong decision but three *omissions* at exactly the altitude it owns: navigation, the failure
contract of the one adapter everything depends on, and accessibility — the last of which the locked
UX explicitly handed to architecture in as many words. Plus one live self-contradiction in the date
representation. F-1 and F-2 should close before epics are cut; the rest can be amended alongside.

---

## Findings

| # | Sev | Where | Finding |
| --- | --- | --- | --- |
| F-1 | critical | AD-7 vs Consistency Conventions; AD-2 | Date/time representation is self-contradictory and the Clock port's shape is undecided |
| F-2 | high | *silent dimension* | Navigation/routing across six surfaces is decided nowhere |
| F-3 | high | AD-6 | No failure or validation contract for the storage adapter — data-integrity dimension half-silent |
| F-4 | high | *silent dimension*; map row NFR-1/NFR-4 | Accessibility is silent, though the locked UX delegated it here by name |
| F-5 | high | AD-12 (+ Deferred) | AD-12's Rule binds only the Rule Engine path; FR-21's model run is unbound, and the call shape sits in Deferred |
| F-6 | medium | AD-8; Structural Seed; AD-13 | PRD §8's `.gitignore` hard constraint is absent, and nothing pins dependency resolution |
| F-7 | medium | AD-11; Deferred (provider) | Build/release and PWA update policy only half-stated; provider blast radius understated; the mandatory browser-access header unnamed |
| F-8 | medium | AD-1 | Prevents claims AD-12's job; the banned-globals list omits what actually threatens NFR-5 |
| F-9 | low | AD-10 | "Additive" has no mechanical test and no file-to-tier mapping |
| F-10 | low | Conventions (ids, state mutation) | Id generation has no home; write granularity and the FR-8 budget guard unstated |
| F-11 | low | Capability map; Deferred | One decorative row, one unmapped scope constraint, two UX open decisions carried by nobody |

---

### F-1 — critical — the date dimension contradicts itself, and the Clock port has no shape

Three defects in the one seam the most stories touch (FR-12, FR-13 placement, FR-16, FR-23, FR-15,
FR-20, FR-21, NFR-5, NFR-10):

1. **AD-7 and the conventions table disagree on `completedAt`.** AD-7's Rule: "the Task document
   persists `completedAt` as a **timestamp** or null". The Consistency Conventions "Data — dates"
   row: "due date and `completedAt` are stored as **ISO-8601 date strings** in the device's local
   calendar day". These are different types with different arithmetic, and AD-7's own archive
   formula rides on it: `daysSince(completedAt, now) > retentionDays` yields day granularity under
   one reading and fractional days under the other. FR-16's testable boundary ("completed 31 days
   ago is archived") therefore has two different answers at the 30-day edge. The memlog (entry of
   2026-11-18 on derived archive) says "ISO timestamp", so the conventions row is the drift — but
   the spine is the artifact stories read, and it says both.
2. **The Clock port's return type is never fixed.** AD-2 says every module outside
   `system-clock.ts` "receives the current instant as a parameter", and the layer table lists
   `ports/clock.ts` as types only. Nothing says *what* that parameter is: epoch milliseconds, an
   ISO string, or a `Date` instance. It is not a detail. AD-1 forbids `core/` from referencing
   `Date` at all, so if the injected value is a number or a string, `core/selectors.ts` must derive
   `startOfDay`, "Monday through Sunday", `daysSince` and FR-23's next-weekday rule by hand; if it
   is a `Date` instance, `core` calls `Date` *methods* while never naming the global — which passes
   AD-2's ESLint `no-restricted-globals` rule and is arguably a violation of AD-1's spirit. Three
   different stories (FR-23 parsing, FR-12 windows, FR-16 archive) need this answer and will each
   invent one.
3. **Time zone is asserted on both sides of a contradiction.** The conventions row fixes "the
   device's local calendar day" and "local time zone"; NFR-10 requires results "identical on any
   day, **time zone** and machine", and AD-12 runs the same `core` under Node, where `TZ` is
   commonly unset or UTC while the browser is UTC+1. AD-2 pins the *instant* and prevents weekday
   drift; it does nothing about zone drift, which is the same class of bug NFR-10 exists to
   outlaw — `new Date('2026-11-16')` is UTC midnight and renders as 15 November west of Greenwich.
   Either the Fixture carries a zone/offset and the harness pins `TZ`, or all comparison is
   calendar-string arithmetic with no instant conversion anywhere. The spine picks neither.

This is the finding with the widest blast radius: it is a *stated* convention contradicting a
*stated* Rule, so a story author who reads carefully still cannot comply.

### F-2 — high — navigation and routing: a whole dimension left silent

EXPERIENCE.md fixes four top-level destinations (Today, Lists, Archive, Settings) plus two surfaces
"entered from a record, not navigated to" (Review, Task detail), across seventeen drawn frames and
two binding viewports where the chrome itself changes (bottom tab bar at 360, left nav rail at
1280). The spine contains no routing decision at all: no AD, no row in the conventions table, no
router in the Stack, no route table or router file in the Structural Seed (`ui/today/ lists/
archive/ settings/ review/ task-detail/` are directories with no stated means of reaching them).

Consequences the level below cannot settle consistently on its own:

- Router library versus hash routes versus plain React state — a Stack-table decision, and the
  Stack is otherwise complete to the patch version.
- Whether the browser Back button leaves Review/Task detail or exits the app. EXPERIENCE's
  "entered from a record" is silent on it, and on a PWA with no chrome this is the difference
  between a usable app and a dead end.
- Whether a surface is deep-linkable (`/task/:id`), which decides whether `main.tsx` is the one
  composition root for a single mounted tree or whether per-route entry points exist — AD-3 and
  AD-6 both assume the former without saying so.
- Static hosting (the optional host in the Environments diagram) needs a SPA rewrite or hash
  routes; the spine's "static files, no server" leaves history-API routing broken on any plain
  static host, which is precisely the kind of late surprise a spine is for.

Four or five separate UI stories will each pick an answer. This is a textbook feature-altitude
divergence point and it is not deferred, not an open question, just absent.

### F-3 — high — AD-6 has no failure or validation contract

AD-6 is otherwise the strongest AD here: three named keys, one adapter, a synchronous port, a
`schemaVersion` with a read-time migration step. What it never decides is what happens when
`localStorage` does not cooperate — and every single FR routes through this adapter:

- **Unparseable or shape-invalid document on read.** `zod` is in the Stack and the seed puts a zod
  schema on `core/suggestion.ts` — the *model output*. Nothing says whether the *persisted task
  document* is validated on read. Unvalidated JSON flowing into a pure `core` that trusts its types
  is a crash on the grader's machine; validated-and-discarded is silent data loss. Both are
  defensible; two different stories will pick differently, and the migration step makes this worse,
  not better, because a half-migrated document is the likeliest malformed input there is.
- **`QuotaExceededError` on write.** AD-6 accepts "the whole document is re-serialized per
  mutation" as the known cost but never says what a failed write does. Combined with EXPERIENCE's
  absolute "there is no error state in capture or review. Ever." and the conventions' "no `console`
  in committed code", the default reading of the spine is: the write fails, nothing is shown,
  nothing is logged, the user's task is gone and the in-memory store still shows it. That is a
  data-integrity decision being made by omission.
- **`localStorage` unavailable** (Safari private browsing, site data blocked): the synchronous port
  that AD-6 chose specifically to satisfy FR-8's 100 ms throws on *access*, not just on write.
- **The result type.** The conventions "Errors" row generalizes AD-4 to "adapters return results,
  never throw" — but AD-4 defines `EngineResult` only. There is no `StorageResult`, so "returns a
  result" has no shape for the adapter that matters most.

Data integrity and migration are therefore *half* decided: layout and versioning yes, failure and
validation no.

### F-4 — high — accessibility is silent, and it was handed to architecture by name

EXPERIENCE.md, status final and stage locked, says: "**No UI system is adopted** — the stack is
undecided and belongs to `bmad-architecture`, so every control here is specified as a standard web
control rather than as a library component," and leaves `[OPEN]` "**No conformance standard is
committed**… target size, reflow and focus-appearance have not been audited". Its Accessibility
Floor is binding (NFR-4, 10% of the rubric's Design weight), including "every control is a
standard, focusable web control with a visible focus ring" and "no state is carried by colour
alone".

The spine answers the styling half (Tailwind 4.3.5, DESIGN.md tokens in `@theme`) and leaves the
rest untouched: no AD, no conventions row, zero occurrences of focus, semantics, ARIA or
accessibility anywhere in the document. Specifically undecided:

- **Native semantic elements versus a headless primitive library** (Radix, React Aria). This is a
  Stack decision the UX explicitly deferred here, and it decides whether `Control`'s punch/strike
  is a `<button>` or a styled `<div>` — which is exactly the thing that diverges story by story and
  is near-impossible to retrofit across seventeen surfaces.
- **Focus management** for the two surfaces entered from a record (Review, Task detail), for
  in-place edit (`Apply` on the Control's "edit" primitive), and for undo — the one interaction the
  PRD requires to be reversible.
- **Any mechanical check.** CI runs typecheck, lint, Vitest, Playwright and the FR-20 harness.
  Nothing asserts the a11y floor, so "no state by colour alone" and the focus ring are enforced by
  hope. Compare AD-2, which deliberately says "enforced by an ESLint rule, not by discipline" — the
  spine knows the difference and applies it unevenly.
- **The open conformance standard now belongs to nobody.** UX said it is "not design's to settle
  alone"; the spine's Deferred section mentions only the stale interface-language microcopy and
  hands "interface copy and microcopy" back to DESIGN/EXPERIENCE. The a11y standard and the
  colour-only-encoding confirmation — two of EXPERIENCE's three Open Decisions — are carried by no
  artifact. The spine also has no Open Questions section of its own, only Deferred, so there is
  nowhere for them to sit.

Related mis-mapping: the Capability map governs "NFR-1, NFR-4 Latency, responsiveness" with
"**AD-6**, conventions". AD-6 is localStorage; it has nothing to do with operability at 360 px. No
AD governs NFR-4.

### F-5 — high — AD-12's Rule covers only half of what its Prevents claims

AD-12 Prevents "a measured accuracy figure that describes a second implementation". Its Rule:
"`harness/run.ts` imports the **Rule Engine and selectors** from `src/core/` directly — never a
copy, never a re-implementation". FR-21 — measuring the *Model* Engine — is in the Binds list but
the Rule says nothing about it. Nothing in the spine requires the harness's model run to go through
`src/adapters/anthropic-engine.ts`, and AD-3 actively licenses the harness to bypass
`SuggestionService` and "address engines by name".

That gap meets a Deferred item head-on: "**The Model Engine prompt and its schema text**" is
deferred as "a build-time concern". The deferred surface includes the call parameters that decide
what is being measured — effort setting (PRD §4.2: "lowest available effort"), `thinking:
{"type":"disabled"}` (OQ-2, resolved, and absent from the spine), `max_tokens`, and the structured
output format. If the harness constructs its own call, SM-3's comparison and OQ-1's latency bar
describe a call shape the app never issues, and the FR-21 artifact — named in the PRD as the
highest-value item for the 30% weighting — measures the wrong thing while looking correct. Fix is
one clause: the FR-21 run goes through the same adapter, and the call shape lives in one named
config `core/constants.ts` entry, the way AD-5 already handles NFR-2's pending value.

### F-6 — medium — the `.gitignore` constraint and dependency resolution

- PRD §8, under **Grader runnability (hard constraint)**: "it ships an example environment file
  **and a `.gitignore` excluding real ones**". AD-8's Rule covers `.env.example` in detail and never
  mentions the `.gitignore`; the Structural Seed lists `.env.example` and no `.gitignore` at all.
  AD-8 Binds NFR-7 and PRD §8, so this is a bound hard constraint dropped in distillation — and
  repo tidiness is 5% of the grade, called out in review as "the one outright gap".
- **Nothing pins resolution.** The Stack table is exact to the patch, and AD-13's whole argument is
  that `typescript` must be `6.0.3` because `typescript-eslint@8.73.0` declares
  `typescript: ">=4.8.4 <6.1.0"`. No rule says the lockfile is committed, that installs use exact
  versions rather than caret ranges, or that the grader runs `npm ci`. A caret range floats
  TypeScript into 6.1 and silently voids AD-13 and the lint chain with it; NFR-7's "reproducible
  from a clean clone" has no mechanical backing. One conventions row closes it.
- **AD-8's "never present in the bundle" has no check.** It is a good Rule and mechanically
  checkable (grep `dist/` for `sk-ant`), but CI does not do it, so the strongest secret claim in
  the spine rests on reading diffs.

### F-7 — medium — build/release and PWA policy stated only in the negative

The memlog's operational-envelope decision records: "vite-plugin-pwa for offline, **registerType
autoUpdate**, **shell precached** — and the service worker MUST NOT intercept or cache
api.anthropic.com". Only the prohibition survived into AD-11. The spine therefore never decides the
update strategy or what is precached, and both are load-bearing: `autoUpdate` versus `prompt`
decides whether a grader can be served a stale shell, and the precache manifest is what makes NFR-3
("with no network the app is fully functional") true rather than aspirational. The seed has no
`vite.config.ts` PWA stanza, no manifest file, and no icons — while EXPERIENCE requires install to
be offered in Settings. Build/release is otherwise present (Vite build, CI, optional host), so this
is a gap, not a silent dimension — but it is the half that NFR-3 depends on.

Two smaller things in the same envelope:

- **AD-11 never names the mechanism that makes a browser call legal.** PRD §9: the Anthropic API
  permits direct browser calls "only under an explicit opt-in header", with the header name, the
  key-exposure consequence and the organization restriction in `addendum.md` §1.2, all confirmed
  against official docs. AD-11 is the network-envelope AD and omits the header /
  `dangerouslyAllowBrowser` flag entirely, while AD-4 carefully enumerates three provider traps
  downstream of a call that the spine never establishes can be made. Also absent: any CSP /
  `connect-src` declaration, which is the one mechanical enforcement available for AD-11's
  single-host rule.
- **The deferred provider's blast radius is understated.** Deferred says a provider switch keeps
  "the blast radius to one adapter file plus the FR-18 disclosure wording". It also touches AD-11's
  Rule (which names `api.anthropic.com` as the only permitted host, twice), the Stack row
  (`@anthropic-ai/sdk 1.10.0`), the seed's `anthropic-engine.ts` filename, and PRD §8's privacy
  basis. Meanwhile FR-18's consent copy must name the provider *before* OQ-1 resolves, so the
  Settings story and the adapter story can ship disagreeing provider names while the question is
  open. Naming the disclosure string as a single constant in `ui/labels.ts` (AD-9's own device)
  would close it.

### F-8 — medium — AD-1's Prevents belongs to AD-12, and its ban list is incomplete

- **Mismatch.** AD-1 Prevents "the harness measuring a *copy* of the Rule Engine rather than the
  one the app runs". Its Rule — no browser globals in `core/` — *enables* single-sourcing but
  cannot prevent a copy; a developer can duplicate `rule-engine.ts` into `harness/` with every
  banned global absent and violate nothing in AD-1. That prevention is AD-12's, where it is
  correctly stated. AD-1's second clause ("a browser global crashing the Node command") is the one
  its Rule actually earns.
- **Under-inclusive ban list.** AD-1 bans `window`, `document`, `localStorage`, `fetch`, `Date`,
  React and Vite-injected values. It does not ban `Math.random`, `crypto`, `performance`,
  `process`, `navigator` or `Intl` — and `Math.random` in `core/rule-engine.ts` would break NFR-5's
  determinism, which is the point of the whole arrangement, while `Intl`/`navigator` reintroduces
  F-1's zone dependence and `process` breaks the browser the same way `window` breaks Node.
- **No enforcement anchor.** AD-2 names its ESLint rule and says "not by discipline". AD-1 — the
  broader and more important ban — names none, though it is the same lint mechanism
  (`no-restricted-globals` plus `no-restricted-imports` for React) applied to one directory.
- "It exports pure functions and types only" is the one genuinely unenforceable clause in the
  spine: purity is not checkable mechanically and only partially visible in a diff. Closing the ban
  list is what makes it operational.

### F-9 — low — AD-10's Rule is the closest thing here to an aspiration

"Every Tier 2 and Tier 3 capability is **additive**… Cutting is deleting a file, never unpicking a
dependency." The worked examples are checkable one by one (a reviewer can verify no Tier 1 selector
reads `project`). The general rule is not: nothing maps files to tiers, so a reviewer facing a diff
cannot mechanically tell whether a new import crossed a tier line. The decision itself is right and
well argued (declining `technology.md`'s `FEATURE_*` with reasons). It needs one artifact to become
enforceable: the tier-to-file mapping, which the epics will have to produce anyway and which would
then be checkable by an import-boundary lint rule, the same device AD-1/AD-3 rely on.

### F-10 — low — two conventions with no home

- **Id generation has no owner.** "Task id is a `crypto.randomUUID()` string, generated in the
  adapter layer, never in `core`." There is no id port in `ports/` (`storage.ts clock.ts
  suggestion-engine.ts`) and no id adapter in `adapters/` (`local-storage.ts system-clock.ts
  anthropic-engine.ts`). Mutations originate in `app/store.tsx`, which is not the adapter layer, so
  the convention names a layer that cannot execute it — the same reasoning that earned Clock its own
  port (AD-2) applies here and was not applied. Minor footnote: `crypto.randomUUID` requires a
  secure context; `npm run dev` on localhost qualifies, a LAN IP or `file://` does not, which is
  worth a line given SM-2 is verified on someone else's machine.
- **Write granularity is unstated.** "Nothing writes storage except the reducer's persistence step"
  plus AD-6's whole-document re-serialization per mutation leaves open whether FR-3's text edit
  dispatches per keystroke — one story writes on change, another on blur, and the main-thread cost
  AD-6 accepted is either trivial or quadratic depending on which. Likewise FR-8's 100 ms has no
  budget guard: the Capability map points NFR-1 at `tests/e2e/`, but no convention says a test
  asserts it, so SM-4 is measured by nothing.

### F-11 — low — Capability map and Deferred residue

The map is mostly load-bearing, not decorative: it names modules *and* governing ADs, every FR and
NFR appears exactly once (verified), and "a story that cannot name its row here is a story whose
scope is not yet settled" gives it teeth. Three blemishes:

- The **NFR-1/NFR-4 row** is the decorative one: two unrelated NFRs sharing a row, a target of
  `ui/` (the whole interface), and AD-6 cited as governing responsiveness (see F-4).
- §6.1's one non-FR scope rule — "**English task text only**" — has no row, though it binds
  `core/rule-engine.ts` and `core/date-words.ts` and is the boundary a future Norwegian-text story
  crosses. It survives only as half a sentence in the Tags conventions row.
- FR-12–FR-15's row omits `app/store.tsx`, which the store convention makes load-bearing for them.
- Deferred is otherwise clean and genuinely closed by seams (JSON export to one key; Norwegian to a
  keyword map; suggested due dates to one field; NFR-2's value to one constant; hosting to no AD).
  Its only real hole is the one in F-5, plus the orphaned UX open decisions in F-4.

---

## Checklist, item by item

**1. Does it fix the real divergence points for epics/stories, and miss none? — PARTIAL.** Fixed,
and fixed well: module boundaries and dependency direction (AD-1 + the layer table + the one
composition root), the persisted shape and key layout (AD-6, AD-7), the engine contract and failure
taxonomy (AD-3, AD-4, AD-5), vocabulary and label-versus-predicate (AD-9 + conventions), tier
independence (AD-10), the network envelope (AD-11), harness single-sourcing (AD-12), the toolchain
pin (AD-13), the store shape and test seams (conventions). **Missed:** routing and navigation
(F-2), the storage failure/validation contract (F-3), accessibility and component primitives (F-4),
the Clock port's shape and the zone policy (F-1), the model call shape shared between app and
harness (F-5).

**2. Is every Rule enforceable? — MOSTLY YES.** AD-2, AD-3, AD-6, AD-8, AD-9, AD-11, AD-12 and
AD-13 are all checkable by grep or by reading a diff, and AD-2 and AD-9 go further by naming the
mechanism and the forbidden string. Aspirational or unmeasurable: AD-1's "exports pure functions
and types only" (F-8); AD-10's "additive" / "cutting is deleting a file" in its general form (F-9);
AD-8's "never present in the bundle", enforceable in principle but checked by nothing (F-6).
AD-4's "throws nothing" and AD-5's "dropped unwritten, unattributed and unlogged" are not
statically checkable but are testable and diff-visible, which is enough.

**3. Does each AD prevent what it claims? — ONE REAL MISMATCH, ONE PARTIAL.** AD-1's first Prevents
clause is AD-12's job, not its Rule's (F-8). AD-12's Prevents is broader than its Rule, which
covers only the Rule Engine path (F-5). Everything else lines up, and several are exemplary: AD-6
makes "an API Key riding along in a future export" structurally impossible rather than filtered;
AD-7 makes FR-16's re-evaluation "a different argument rather than a migration"; AD-9 kills the
label-widens-membership risk by naming the forbidden string.

**4. Could anything Deferred let two units diverge first? — YES, TWO.** The Model Engine prompt and
schema text, because the deferred surface includes the call parameters the FR-21 comparison depends
on, with nothing binding the harness to the app's adapter (F-5). And the provider, because FR-18's
disclosure must name one before OQ-1 resolves, while AD-11, the Stack and the seed all already name
Anthropic — understated as "one adapter file plus the FR-18 disclosure wording" (F-7). The other
five deferrals are properly fenced.

**5. Is every dimension this altitude owns decided, deferred, or open? — NO.**

| Dimension | Status |
| --- | --- |
| Operational / environmental envelope | Mostly decided. Three environments + optional host diagrammed; CI content exists **only as a mermaid node label**, not as an AD or convention, so "CI runs with no key and no network" (memlog) is asserted nowhere binding. |
| Error handling | Decided for engines and the UI surface (AD-4, AD-5, conventions "Errors", "no error state ever"). **Silent for storage** (F-3) and silent on render-crash policy — no error boundary, and with no logging and no error UI an uncaught render error is a blank page on the grader's machine. |
| Data integrity & migration | Half decided. `schemaVersion` + read-time migration + derived-never-stored (AD-7) are strong; read validation, quota failure and unavailability are absent (F-3). |
| Security / secret handling | Decided and good (AD-8, AD-11). Gaps: no `.gitignore` (F-6), no CSP/`connect-src`, no bundle-scan check, and the browser-access header unnamed (F-7). |
| Accessibility | **SILENT** (F-4) — and explicitly delegated here by the locked UX. |
| Performance | Partially decided. AD-6 states and accepts its cost; FR-8's 100 ms and NFR-4 have no budget, guard or test convention (F-10). |
| Observability | **Decided, deliberately empty** — the Logging convention ("none in the shipped app… no `console` outside `harness/`") is a real decision with a real consequence, consistent with AD-5. No finding. |
| Build / release | Half decided (F-7): PWA update strategy, precache scope, manifest and icons absent; dependency resolution unpinned (F-6). |

**6. Right size for the altitude? — YES, with the balance slightly off.** Nothing in it is really
seed the code should own. The two closest calls both earn their place: AD-4's enumeration of the
three provider traps is adapter-internal but it is what turns FR-9's split into three named values
instead of string matching, and the Structural Seed is correctly a seed (directories and the
load-bearing files, not a file list). What is missing is the opposite of oversize: three decisions
the level below genuinely cannot make consistently — navigation (F-2), the storage failure contract
(F-3), accessibility and component primitives (F-4) — plus the Clock port's shape (F-1). The spine
is slightly under-sized, not over-sized, and the missing pieces are each one AD.

**7. Does the Capability map cover the spec without being decorative? — YES, mostly.** It maps every
FR-1–FR-23 and NFR-1–NFR-10 exactly once (verified), names modules *and* ADs, and is given teeth by
the sentence that follows it. Three blemishes in F-11, of which only the NFR-1/NFR-4 row is
genuinely decorative — and that row's emptiness is the same hole as F-4.

---

## What is good, for the record

Worth not losing in an amendment pass: AD-9's forbidden string (`Needs Attention` appears nowhere
and must not enter code, UI strings or test selectors) is the most enforceable rule in the document
and should be the template for the others; AD-7's derivation argument turns FR-16's hardest clause
into a no-op; AD-6's three-key split makes two future bugs structurally impossible rather than
remembered; AD-13 shows its evidence, including the peer-range string and the closed upstream
issue, and pre-commits the revisit condition so it cannot be re-opened under deadline pressure; and
AD-10 declines an inherited principle with a reason rather than silently dropping it. The Prevents
fields are, with the two exceptions above, written as failure stories rather than restatements of
the Rule — which is what makes this spine reviewable at all.
