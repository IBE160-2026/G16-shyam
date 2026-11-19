---
title: "Reconciliation review — locked UX and the named stack preference"
reviewer: reconcile-ux-preference
target: ../ARCHITECTURE-SPINE.md
inputs:
  - ../../../ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - ../../../ux-designs/ux-To-Do-List-2026-11-16/EXPERIENCE.md
  - ../../technology.md
date: 2026-11-18
verdict: FAIL
---

# Reconciliation review

**Verdict: FAIL.** Not because any decision in the spine is wrong — the thirteen ADs are mostly
excellent, argued rather than asserted, and several (AD-1, AD-2, AD-6, AD-7, AD-12) are better than
the artifacts they serve. It fails because the spine's purpose is `build-substrate` and at least
four behaviours that `EXPERIENCE.md` makes binding **cannot be built from it**: they require state,
a surface or a layer the spine does not provide, and in two cases an existing AD reads as forbidding
the thing the UX requires. The remedy is additive — roughly four new ADs, three edits and two rows —
not a rewrite.

## Root cause, stated once

The spine's organizing index is the **requirement list**. Its Capability Map is FR-1..FR-23 plus
NFR-1..NFR-10, and it says so proudly: *"Every FR and NFR appears exactly once."* It is complete
against that index.

But the PRD has no FR for navigation, no FR for first run, no FR for design tokens, no FR for focus
or contrast, and no FR for "the engine never re-proposes a struck control". Those live only in
`DESIGN.md` and `EXPERIENCE.md`. Because the spine indexes requirements and not **surfaces or
behaviours**, everything the locked UX requires that no FR happens to name had no slot to fall into,
and fell out silently. That one structural choice explains F-1 through F-9 below. The fix is a second
index: a Surface → Component → Module map alongside the Capability Map.

---

## 1. UX behaviour with an architectural precondition the spine does not provide

Walked one at a time through Component Patterns, State Patterns, Interaction Primitives and Key Flows.

### F-1 `[CRITICAL]` Strike has no memory, and AD-7 appears to forbid giving it one

`EXPERIENCE.md`, Component Patterns → Control: *"the engine never re-proposes a struck control for
the same task."* Interaction Primitives → Strike: *"the control is not proposed again for this
task."* PRD FR-10 says the same: *"rejecting leaves the field as it was and does not reapply that
part later."*

What the architecture must guarantee: a **per-task, per-part record of what was struck**, persisted,
surviving (a) the course panel leaving — which `EXPERIENCE.md` says happens *"when all three controls
are resolved"*, so the Suggestion that held the strike is gone, (b) a reload, and (c) FR-22
"Suggest again".

What the spine provides: nothing. The word "struck" appears zero times. AD-7 enumerates exactly what
persists — `completedAt`, and an arrived-but-unreviewed Suggestion — and its rule is *"Derived state
is never persisted."* A struck set is not derivable from anything; it is user intent. So a builder
reading AD-7 literally will not store it, and the locked rule breaks on the first reload.

Worse, this collides with AD-10. AD-10 asserts FR-22 *"is one further call into `SuggestionService`"*
that *"adds no path"*. To honour the strike rule, "Suggest again" must pass the struck set and the
service must filter the result — a genuine extra parameter and an extra filtering step. AD-10's
"adds no path" claim is false as written.

**Needed:** a new AD placing a `struck: { tags?: true; priority?: true; summary?: true }` (or
equivalent) on the persisted Task, an explicit carve-out in AD-7 distinguishing *derived* state from
*recorded user intent*, and a correction to AD-10.

### F-2 `[CRITICAL]` Four destinations, seventeen surfaces, no navigation layer

`EXPERIENCE.md`, Information Architecture: *"Four top-level destinations, as a bottom tab bar at 360
and a left nav rail at 1280"*, plus two surfaces *"outside the tab bar because they are entered from
a record, not navigated to"*.

The spine contains: `nav` — 0 occurrences. `tab bar` — 0. `rail` — 0. `router` — 0. `route` — twice,
neither about navigation. The Stack table lists no routing library and the spine never says one is
being declined. The Structural Seed's `ui/` has six directories but no app shell. The Capability Map
has no row for navigation because no FR demands it.

Unanswered, and every one of them is a decision a builder cannot make locally:

- Is a destination a **URL route** or a field in the store? Deep links, the browser Back button and
  Playwright's ability to address a surface all hang off this.
- Are **Review** and **Task detail** routes, or in-place expansions? `EXPERIENCE.md` says they are
  entered from a record, which pulls toward modal/in-place, and `DESIGN.md` says the desktop review
  is a *dedicated* surface with the panel beside the record, which pulls toward a route. Both are
  locked; the architecture has to reconcile them and does not.
- Back-button behaviour inside an installed PWA, where there may be no browser chrome at all.

`technology.md` even offers the relevant pattern — the frontend's single `registry.ts` for
routes/nav — and it is not mentioned (see F-17).

### F-3 `[HIGH]` `m9` First run has no home, and no other surface may have an empty state

`EXPERIENCE.md`'s surface table lists `m9` First run, *"What the product is, before it has content"*.
State Patterns: *"**Empty.** First run only. No other surface has an empty state."* `DESIGN.md` scales
`display: 19px` and marks it *"first run only"* — the largest type in the system exists for this one
surface.

The spine's `ui/` is `today/ lists/ archive/ settings/ review/ task-detail/`. Sixteen of the
seventeen surfaces map cleanly onto those six directories. `m9` maps to nothing, "first run" appears
nowhere in the spine, and nothing says how first run is *detected* — which matters, because the
honest signal is "the task document key is absent", and AD-6 makes `adapters/local-storage.ts` the
only module allowed to know that key exists.

### F-4 `[HIGH]` Engine provenance is not a field of the thing that gets persisted

`EXPERIENCE.md`, Engine chip: *"Present on every proposal, everywhere a proposal appears. There is no
surface where a user can see a suggestion without seeing which engine made it."* That is an
absolute, and the only way to guarantee an absolute like it is to put provenance **on the Suggestion
data itself**, so no render site can omit what it never had to be handed.

AD-4's type puts it next to the Suggestion, not in it:

```ts
{ ok: true; suggestion: Suggestion; engine: 'rule' | 'model' }
```

And the addendum's structured-output schema fixes `Suggestion` as `{ tags, priority, summary }` — no
provenance. AD-7 then persists *"a Suggestion that has arrived and is unreviewed"*. Persist that
shape and the `engine` discriminator, a sibling of the payload, is dropped on the floor: after a
reload the user sees a purple proposal with no chip, which is the one thing `EXPERIENCE.md` says no
surface may do.

**Needed:** one line stating that the persisted Suggestion carries its engine, or that `engine` is a
field of `Suggestion` rather than of `EngineResult`.

### F-5 `[HIGH]` The persistent failure reason is not persisted, so UJ-4's last beat cannot happen

`UJ-4`, edge case: *"weeks later his credit runs out. Courses keep arriving with no error ... Settings
explains why **the next time he opens it**."* Engine Disclosure: the status *"clears itself when the
cause does"*.

AD-6 enumerates `todo.settings.v1` as holding exactly *"retention window, Cloud Suggestions state"*.
The Suggestion-path diagram says *"persistent — reason recorded"* and never says where. If the
reason lives in React state it dies with the tab, and because the engine is only invoked on capture
or an explicit "Suggest again", a user who opens the app and goes straight to Settings sees nothing
at all. FR-11's three carefully-worded statuses become unreachable in the exact scenario the locked
journey describes.

**Needed:** either a fourth field in `todo.settings.v1` (last persistent reason + when), or an
explicit statement that the status is in-memory and the journey's "next time he opens it" is amended.
Silence is the one option that cannot be built.

### F-6 `[HIGH]` The acceptance-rate guard has no enforcement home

`EXPERIENCE.md` states it more forcefully than anything else in the document: *"**Strike must be
exactly as reachable as Punch** — same size, same weight, same row, no confirmation on Strike and
none on Punch. Any future change that makes accepting cheaper than rejecting is a regression against
this line, whatever it does to the numbers."* It descends from PRD SM-C1, a counter-metric.

A rule phrased as "any future change is a regression" is a request for a **guard**, not a note. The
spine has no AD, no convention row, and no test row for it. Its Tests row lists Vitest/Playwright
scope and never mentions symmetry. Compare how the spine treats rules it takes seriously: AD-1 and
AD-2 are *"Enforced by an ESLint `no-restricted-globals` rule, not by discipline."* The product's
central integrity claim gets less protection than the Clock port.

Cheap fixes the spine could have named: punch and strike as the *same* named store action with a
differing payload, so no asymmetric path exists to hang a confirmation on; plus one Playwright
assertion that the two controls' rendered box and font-weight match.

Secondary, and worth one line somewhere: the shipped app cannot measure SM-C1 at all, because the
Logging convention forbids all analytics. That is almost certainly the right trade, but the spine
should say that the counter-metric is observable only through the harness and the builder's own use,
rather than leave the reader to infer it.

### F-7 `[HIGH]` "Must never overlap type" is a layout invariant with no owner

`EXPERIENCE.md`: the course panel *"is laid over the record and **must never overlap type** — it
overlaps rules and empty ground only."* `DESIGN.md` repeats it in Don'ts and adds the history:
*"This was a real defect in the round-1 draft and is the single easiest way to break the concept."*

Two locked documents flag the same defect twice, and the spine carries it nowhere. `course-panel` is
a word in a comment on one line of the Structural Seed.

The architectural precondition is specific and is exactly the kind of thing a spine exists to fix:
`DESIGN.md` bans shadows and says depth comes from *"overlap and offset"*, which makes an absolutely
positioned overlay the tempting implementation — and that is precisely the implementation that
overlaps type. The invariant that makes the rule structural is "the course panel participates in
normal layout flow and displaces content; it is never absolutely positioned over a text run." Also
unaddressed: the same panel has **three** specified renderings — below the record at 360, beside it
with a dashed leg on the dedicated desktop review, and a purple-ruled table module inside the
`d2`/`d4` mosaic. One component, three layouts, and no statement of whether that is CSS variants,
container queries or three components.

### F-8 `[MEDIUM-HIGH]` Undo after "Punch all" has nowhere to live

`EXPERIENCE.md`: undo is *"in the control's own block"*. The course panel *"leaves when all three
controls are resolved"*. PRD FR-10: *"Undo after 'Accept all' restores all three fields."* UJ-1 step
6: *"Undo puts a reflex punch back."*

Compose those: Punch all resolves all three, the panel leaves, and the affordance that was supposed
to hold undo has gone with it. Either the panel lingers in an undo state, or undo lives somewhere
else after a bulk punch. The spine says only that *"the single-step undo buffer (FR-10) lives in
React state"* — singular — which also leaves open whether punching Tags and then Summary keeps two
independent per-control undos (`m5`/`d4` show all three control states coexisting) or silently
discards the first. Both questions are reachable from the locked docs and neither is answered.

### F-9 `[MEDIUM-HIGH]` Nothing forbids an effect from re-running the engine

`EXPERIENCE.md`, Suggest again: *"Nothing re-runs the engine without being asked. **Editing the task
text does not trigger it.**"*

In a React codebase this is one `useEffect` with `[task.text]` in the dependency array away from
being violated, by a builder who thinks they are being helpful. AD-3 fixes the *route* to the engine
and says nothing about the *trigger*. AD-5 shows the author read this section — it cites State
Patterns on controls not changing state on their own — so this is a near-miss rather than a blind
spot, but the invariant is absent: the engine is invoked from exactly two explicit user actions,
capture-save and Suggest again, and never from a reactive effect.

### F-10 `[MEDIUM]` The start triangle has two meanings and the spine provides state for neither

`DESIGN.md`: the start triangle *"means exactly one thing: this task still has a control open."*
`EXPERIENCE.md`, Pending: the triangle marks a task whose course is *being set*, and it is *"the one
indicator allowed to appear offline, because it reports a course being set, not a missing network."*
`UJ-1` step 2 puts the triangle on the record at under 100ms — **before** the course of step 4
exists.

So the triangle covers `request in flight` OR `at least one control open`. The second is derivable
from the persisted Suggestion; the first requires per-task in-flight request state in the store, and
AD-7 is explicit that *"a request still in flight is not"* persisted — correct for reload, but the
in-memory set still has to exist and be reachable from any list that renders a record. The spine
never names it. The two locked documents also do not quite say the same thing, which is a
reconciliation the spine should have surfaced and did not.

### F-11 `[MEDIUM]` A no-match Suggestion's shape is unspecified

`EXPERIENCE.md`, No-match: *"A task that earns no tag and medium priority is a **valid outcome**,
rendered as an ordinary record with 'no tag'. It is never styled as a failure, an empty state, or a
prompt."* `DESIGN.md`'s course panel holds *"the three controls"*.

Does a Tags control appear, open, proposing nothing? Is a no-tag proposal a control at all? The
Conventions table's answer — *"`core` functions are total and return defaults rather than raising"* —
covers the engine's return but not the panel's arity. Three controls always, with one of them
possibly proposing an empty set, is almost certainly the intent; it needs to be written down, because
the alternative reading produces a two-control panel that no frame shows.

### F-12 `[LOW]` No stated scale bound for the accepted AD-6 cost

AD-6 accepts *"the whole document is re-serialized per mutation, on the main thread"* and AD-7 notes
Smart Lists *"recompute from every non-archived Task on every render"*. Both are right for this
project. But NFR-1's sub-100ms capture is then asserted against an unbounded task count with no
memoization convention. One clause — "correct and within NFR-1 up to roughly N hundred tasks; beyond
that, revisit" — would make the trade auditable instead of merely accepted.

---

## 2. DESIGN.md's tokens, typefaces, numerals and density

### What the spine actually says

One sentence, under the Stack table: *"Tailwind v4 is CSS-first: DESIGN.md's colour and type tokens
are declared in an `@theme` block in `src/ui/theme.css`, not in a JavaScript config file."* Plus one
Structural Seed line, `theme.css # DESIGN.md tokens as Tailwind @theme`, and AD-11's font clause.

That is better than a hand-wave. It names the mechanism, the file, the single location, and it is
technically correct for Tailwind v4. AD-11's typeface treatment is genuinely strong: Barlow Condensed
and Archivo vendored as subset `woff2`, no Google Fonts, with the reason given — *"a grader seeing
fallback fonts"*. Three real findings remain.

### F-13 `[HIGH]` Three token groups, not two — spacing and radius have no home, and nothing enforces any of them

First, a correction to the count in circulation. The figure "36 colour tokens" (it appears in the
architecture memlog) does not match the artifact. `DESIGN.md` defines **16 colour tokens**, 13
typography tokens, 11 spacing tokens and 3 radius tokens — **43 design tokens, of which 16 are
colours**. Whoever carries "36 colours" forward will be reconciling against a number that is not in
the locked file.

The spine's sentence covers *"colour and type tokens"*. That silently drops the 14 spacing and radius
values — `gutter-mobile: 14px`, `gutter-desktop: 26px`, `band-height: 22px`,
`record-height-mobile: 46px`, `row-height-desktop: 21px`, `rail-width: 196px`, `tabbar-height: 46px`,
`header-height-mobile: 40px`, `group-gap`, `field-height`, `button-height`, and `rounded.default: 0`
with its two deliberate pill exceptions. The word "spacing" does not appear in the spine; "radius"
appears once, in the phrase "blast radius". `rail-width` and `tabbar-height` are doubly orphaned,
since the chrome they measure has no component either (F-2).

Second and more important: **nothing enforces any of it.** Tailwind ships `rounded-*`, `shadow-*`,
`blur-*` and arbitrary-value colour utilities, and `DESIGN.md` bans all four categories outright —
*"Radius is zero on everything"*, *"No drop shadows, no glass, no blur, no gradient anywhere"*, and
the absolute one: *"Reserve `proposed` purple absolutely. If something on screen is purple, it is a
proposal awaiting the user, and if it is not that, it is not purple."* That last rule **is** the
product's central promise drawn — `DESIGN.md` says so in as many words — and it is protected by
nothing. The spine is willing to spend an ESLint rule on `Date` (AD-2) and on browser globals in
`core` (AD-1). It spends none on the design system. A lint rule banning raw hex/`rgb()` outside
`theme.css` plus the `rounded-`/`shadow-`/`blur-`/`gradient-` utility prefixes is the same shape of
enforcement at roughly the same cost.

### F-14 `[MEDIUM-HIGH]` "Subset woff2" and "tabular-nums without exception" are set against each other

`DESIGN.md`: *"**`font-variant-numeric: tabular-nums` on every date, count and control number**,
without exception. Columns of dates that do not align are the fastest way to make this world look
wrong."*

The string `tabular` appears **zero times** in the spine. That alone is a gap, since the rule applies
to the due pill, every band count, every control numeral and the dense 21px desktop table rows — the
exact places where the design's density claim lives.

The collision is sharper than an omission, though. AD-11 mandates *"subset `woff2`"*. A naive subset
(`pyftsubset` without `--layout-features+=tnum`) **drops the `tnum` OpenType feature**, after which
`font-variant-numeric: tabular-nums` is a no-op and the misalignment `DESIGN.md` warns about appears
silently in the grader's screenshot. The spine mandates both halves and connects them nowhere. One
clause in AD-11 — the subset retains `tnum`, and the subset step is verified against a numeral
column — closes it.

Also unaddressed under the same AD: `font-display`, and preloading the two faces so first paint is
not the `Arial Narrow` / `Helvetica Neue` fallback that AD-11's own "prevents" clause names as the
thing to avoid.

### F-15 `[MEDIUM]` Four named components are missing, and the chrome is not among them either

`DESIGN.md`'s Components section specifies ten: band, record, control, course-panel, start-triangle,
priority-ladder, engine-chip, due-pill, tag-patch, legend.

The spine's Structural Seed lists six: *"record · control · course-panel · band · engine-chip ·
legend"*. Dropped: **start-triangle** (the Pending indicator, F-10), **priority-ladder**,
**due-pill**, **tag-patch**. Three of those four are load-bearing for the accessibility contract —
`EXPERIENCE.md`: *"Priority carries a bar ladder **and** its word; past due carries olive **and** the
words"* — so they are not decoration that can be inlined wherever convenient; they are the mechanism
by which no state is carried by colour alone. Also absent: the app shell, the capture field, and any
standard-control layer.

### F-16 `[MEDIUM]` Accessibility is absent from the spine entirely

Grep the spine: `accessib` 0, `focus` 0, `contrast` 0, `WCAG` 0, and every `aria` hit is a substring
of "variable"/"variant".

`EXPERIENCE.md` has a whole Accessibility Floor, and it hands the architecture concrete work: *"Every
control is a standard, focusable web control with a visible focus ring themed from `{colors.ink}`"* —
which means the control circle, the punch and the strike are real `<button>`s, not styled divs, and
the focus ring is a token-driven style in `theme.css`. *"Text is real text at every size; nothing
legible is drawn as an image."* *"Touch targets ... ≥20px for in-panel buttons"* — against
`button-height: 20–26px`, i.e. at the floor, which is worth knowing before the panel is built.

And it carries an explicit open item: *"`[OPEN]` **No conformance standard is committed.** WCAG 2.2
AA is a reasonable floor ... but the user has not confirmed AA, and target size, reflow and
focus-appearance have not been audited against it."* The spine's Deferred section — which is
otherwise careful, and correctly carries NFR-2's value, the provider, the prompt, SM-1's minimums,
hosting and PRD §6.2 — does not carry this. Nor does it carry `EXPERIENCE.md`'s third Open Decision,
*"Colour-only encoding ... Confirm it, because it constrains the palette."* Two of the three open
decisions a locked document explicitly escalated are dropped without a word.

---

## 3. The 17 surfaces and 4 destinations versus `ui/`

Mapping every surface in `EXPERIENCE.md`'s table onto the spine's `ui/` layout:

| Surface | Delivers | Home in the spine |
| --- | --- | --- |
| `m1` `d1` Today | trust what you see | `ui/today/` — yes |
| `m2` Capture, course pending | capture never waits | `ui/today/` implicitly; no capture component named |
| `m3` `d2` Review, three open | structure proposed | `ui/review/` — yes, but `d2` is the mosaic table variant (F-7) |
| `m4` `d3` Review, editing one | one field, one correction | `ui/review/` — yes |
| `m5` `d4` Review, partial + undo | acceptance reversible | `ui/review/` — yes; undo scope unresolved (F-8) |
| `m6` `d5` Task detail | every field; ask again | `ui/task-detail/` — yes |
| `m7` A list, and all the lists | views you never built | `ui/lists/` — yes |
| `d6` Archive | leaves without being destroyed | `ui/archive/` — yes |
| `m8` `d7` `d8` Settings | key, consent, engine truth | `ui/settings/` — yes |
| `m9` First run | what the product is | **nothing** (F-3) |

So: 16 of 17 housed, one homeless, and the four destinations' **chrome** — bottom tab bar at 360,
left nav rail at 1280, 40px mobile header — housed nowhere at all (F-2, F-15). Navigation is not
"partly addressed"; it is addressed in exactly zero words. The spine's only responsive artifact is
the Conventions line *"Playwright end-to-end at 360px and 1280px"* — a test of a responsive strategy
that is never stated. `DESIGN.md`'s 1280 layout is a *"two-column mosaic"*; `mosaic` appears 0 times
in the spine, `breakpoint` 0 times.

One further small omission: `EXPERIENCE.md` closes with an unbuilt design alternative — *"`d5` may
also be built from concept 01 'Date Due'"*. It is a live loose end on a locked artifact and the
Deferred section does not carry it.

---

## 4. `technology.md`: adopted, declined, silently ignored

Context accepted: the user named this file as their stack preference "customized to this project for
MVP", and PRD §8/§9 genuinely rule out its entire backend and infrastructure half. Declining most of
it is the right call. The question asked here is whether the **treatment** is honest and complete.
It is not, for one blunt reason:

> **`technology.md` is named exactly once in the whole spine** — in AD-10, declining `FEATURE_*`
> flags. One sentence, about one principle, out of roughly forty.

The architecture memlog (`.memlog.md`, line 9) contains a good, specific assessment: the backend half
is *"ruled out by PRD §8 hard constraint ... not by preference"*, and what carries is *"the
zero-config/mock-fallback principle, the key-classification legend from its §6, `FEATURE_*` flags,
vertical-slice modules, and its frontend column ..., plus the 'never a secret behind a public
build-time prefix' rule."* That argument never reached the spine. A reader of the spine alone sees a
Stack table that happens not to contain FastAPI, with no evidence the preference was read. And three
of the five things the memlog says "carry" did not land either.

### Adopted, and visible in the spine

| From `technology.md` | Where it landed |
| --- | --- |
| TypeScript (5 → pinned 6.0.3 here, with a better argument than the source) | Stack, AD-13 |
| Tailwind CSS v4 | Stack; no AD, but the `@theme` mechanism is named |
| React 19 | Stack |
| `zod` | Stack, `core/suggestion.ts` |
| Vitest (unit) + Playwright (e2e) | Conventions → Tests |
| Node 22 | Stack (harness, CI) |
| "Never a secret behind a public build-time prefix" (`NEXT_PUBLIC_*` → Vite) | AD-8, strengthened — *"No Vite-exposed variable may ever hold a secret"* |
| Single-origin / no-CORS discipline | AD-11's single-host envelope is the honest analogue |
| CI from the repo, branch discipline | Environments diagram (hosting deliberately optional) |

### Declined with an argument in the spine

| Declined | Argument |
| --- | --- |
| `FEATURE_*` flags, both layers | AD-10, two sentences, and a good pair: flags earn their place where features ship dark and toggle per tenant; this is one builder shipping once. Replaced with a real substitute — Tier 1 may not depend on Tier 2/3, so cutting is deleting a file. **This is the only properly reconciled item in the file.** |

### Declined by constraint, but not argued anywhere in the spine

Every one of these is correctly out of scope under PRD §8 (no backend/account/network for any graded
capability) and §9 (storage browser-local). None is *named* in the spine, so none is visibly
declined — the reader cannot distinguish "ruled out by a hard constraint" from "never read":

FastAPI + Python/uv · SQLAlchemy 2 async + asyncpg · Alembic migrations · PostgreSQL 16 · Supabase
Postgres and Storage (private buckets) · Redis cache with outbox refresh · Caddy proxy · Railway
services, healthchecks, zero-downtime drain · Docker Compose local runtime · Stripe · Vipps
MobilePay · Resend + Jinja2 · WeasyPrint · pydantic-ai → OpenRouter · Fiken accounting ·
bcrypt/HS256 auth and the "refuse to start without `JWT_SECRET`" guard · Ed25519 capability tokens,
JWKS, `ResourceEntitlement`, pseudonymous `actor_ref` · backup cron → Cloudflare R2 + restore drill ·
watchdog/heartbeat · Cloudflare Worker maintenance page · DNS/subdomain topology · the whole §6.8
service split (which `technology.md` itself marks optional).

A single paragraph — "`technology.md` describes a full-stack control plane; PRD §8 forbids a backend,
so its §§2–5 and §§6.1–6.12 are out by constraint, not by preference; what transfers is listed
below" — would convert twenty silent absences into one honest decline. Its absence is the
completeness failure in this section.

### F-17 `[HIGH]` Silently ignored — relevant, transferable, and nowhere in the spine

These are not ruled out by PRD §8. They are frontend or cross-cutting patterns that apply to a
browser-only app, and the spine neither adopts nor declines them. This is the list the review was
asked for, worst first.

1. **`shadcn/ui` + Radix UI — the UI-system decision the locked UX explicitly delegated to
   architecture.** `EXPERIENCE.md`, Foundation: *"**No UI system is adopted** — the stack is
   undecided and belongs to `bmad-architecture`, so every control here is specified as a standard web
   control rather than as a library component."* That is a formal hand-off with the receiving skill
   named. The spine never picks it up: no component library is adopted, none is declined, and the
   words "standard web control" do not appear anywhere. `technology.md` offers the obvious candidate,
   and Radix is the one library with a real argument here (it would do most of F-16's focus and
   keyboard work). Whatever the answer, "no library; the ten `DESIGN.md` components plus bare HTML
   elements" is a decision that must be written down, because `DESIGN.md`'s Standard controls
   paragraph commits to *"Buttons ... text fields, selects, checkboxes, segmented controls, one
   toggle"* and a segmented control is not an HTML element.
2. **CSP (`connect-src`) and DOMPurify.** `technology.md` enforces its network trust boundary in
   `next.config.ts`. AD-11 declares a stricter boundary — one host, one file, no CDN, no analytics,
   no third-party script — and enforces it with prose only. A
   `<meta http-equiv="Content-Security-Policy">` with `connect-src 'self' https://api.anthropic.com`,
   `script-src 'self'` and `font-src 'self'` would make AD-11 *structural* and would catch the
   accidental CDN font link at load time instead of at review time. The mechanism was in the
   preference document and is not mentioned. For an app whose entire privacy posture is "nothing
   leaves the device until consent", declaring the envelope and not enforcing it is the weakest point
   in an otherwise strong AD.
3. **`motion` (animation).** `UJ-1`'s climax is motion: *"he taps Punch all and the purple leaves the
   screen. Three circles fill with ink, the values settle into the record."* Neither `DESIGN.md` nor
   the spine has a motion section; `animation`, `transition` and `motion` are each 0 occurrences in
   the spine. No library, no CSS-only policy, no `prefers-reduced-motion` stance. The single most
   important moment in the primary journey has no implementation guidance at all.
4. **Per-IP rate limiting on AI routes, plus `AI_USD_NOK` / `AI_PROVIDER_FEE_FACTOR` cost
   budgeting.** `technology.md` throttles and budgets its AI calls. FR-22 "Suggest again" is an
   unthrottled, user-triggered, paid API call on the user's own key, and `UJ-4`'s edge case is
   literally *"his credit runs out"*. No debounce, no in-flight guard against a double tap, no
   mention. Cheap to fix (one in-flight flag per task), and the absence is visible precisely because
   the locked journey models the failure it causes.
5. **The §6 key-classification legend** (🔴 secret / 🟡 config / ⚪ optional-with-mock / 🟢
   required-in-production). The memlog says this *carries*. The spine's `.env.example` holds one
   variable and no legend. Claimed, not landed — low cost today (there is one key), but the memlog
   and the spine disagree, and the spine is the artifact that will be read.
6. **Vertical-slice modules** (`modules/<slice>/` with `types.ts`, `api.ts`, `components/`,
   `pages/`, mirroring the backend). The memlog also says this carries. The spine chose layered
   hexagonal with `ui/` foldered by surface — defensible, and probably a better fit for a two-runtime
   codebase, but it is a *reversal* of a stated carry-over and is not argued. Same category as #5:
   memlog and spine out of sync.
7. **The zero-config / mock-fallback principle**, which `technology.md` calls out as its single
   *"Viktig prinsipp (verdt å kopiere)"*: every integration falls back to deterministic mock
   responses with no keys, and the app *"feiler aldri hardt på manglende nøkkel"*. This is the
   deepest match in the whole document — it is the Rule Engine, it is SM-2, it is `UJ-3`. The spine
   embodies it perfectly (AD-3, AD-4, AD-11, the Environments diagram) and never names or credits it.
   A missed opportunity rather than a defect, but it is the one place the user's preference and the
   locked UX agree completely, and the spine passes over it in silence.
8. **`sonner` toasts and `next-themes`.** Both must be declined — toasts are forbidden outright
   (*"no error, popup, banner, toast or badge anywhere in capture or review"*) and the palette is
   single-mode by design. The spine's prose effectively excludes them. Listing them as explicit
   declines would cost one line each and would show the frontend column was read to the end.
9. **`lucide-react` icons.** Half-handled: AD-11 vendors "icons ... local files", with no decision on
   whether the custom marks (control circle with pin-pricks, start triangle, priority ladder) are
   inline SVG components, where they live, or whether any icon set is used at all. Related to F-15.
10. **`TanStack Query`.** Genuinely not applicable with no server. Listed for completeness; a
    half-line decline.
11. **Startup seeding (`seed_if_empty`, demo data in local/dev/ci).** A real missed transfer:
    `fixture/tasks.json` exists, committed and visible, and `UJ-3`'s grader types a task by hand from
    the README. Offering the Fixture as demo data on first run (`m9`) would serve SM-2 directly. Not
    considered — in the memlog or the spine.

### Was declining argued, or merely asserted?

For `FEATURE_*`: argued, well, with a substitute rule and a recorded user conversation behind it.
For everything else: neither argued *nor* asserted — simply absent. Twenty-odd technologies ruled out
by a hard constraint that is never cited at the point of decline, plus eleven items in F-17 that no
constraint rules out and no sentence addresses. The treatment is honest in intent and in the memlog,
and incomplete in the artifact.

---

## 5. Contradictions with a locked UX decision

### F-18 `[HIGH]` AD-10 leaves UJ-1's climax in the first-to-cut tier without noticing

PRD §6.3, Tier 3 — *"cut these first"* — includes *"the 'Accept all' / 'Reject all' shortcuts —
FR-10's per-part actions are the requirement; the shortcuts are convenience."*

`EXPERIENCE.md`, `UJ-1`, step 5: *"**Climax: he taps Punch all and the purple leaves the screen.**"*

The locked experience document makes Punch all the climax of the primary journey; the PRD lists it
among the first things to delete. AD-10 restates the PRD tiering verbatim — *"the Accept-all and
Reject-all shortcuts compose the per-control actions and add no path those lack"* — and never
registers that the cut it is protecting would decapitate `UJ-1`. Reconciling exactly this kind of
cross-artifact collision is the spine's job. It does not have to resolve it in UX's favour; PRD §6.3
may well win. But it has to be *named*, with a consequence recorded ("cutting Punch all requires an
amendment to `UJ-1`", or "Punch all is promoted to Tier 1 on `EXPERIENCE.md`'s authority").

### F-19 `[MEDIUM]` AD-10's "adds no path" is false for strike memory

Covered in F-1, repeated here because it is a direct contradiction rather than an omission: FR-22
cannot be *"one further call"* that *"adds no path"* while also honouring *"the control is not
proposed again for this task"*. It must pass and apply the struck set.

### Handled correctly — worth recording

- **The stale Settings line.** The spine's last Deferred bullet notes that `EXPERIENCE.md`'s
  *"English — not yet decided"* is now stale and that a correction is *pending there*. That is the
  right handling of a locked artifact: flagged for amendment at the source, not silently overridden.
  The memlog (line 20) also records the revisit condition. Good.
- **The PRD §3 archived-field divergence.** AD-7 computes archive status instead of storing it, and
  says so: *"a deliberate divergence recorded rather than silent."* Exactly right.
- **`Need Attention`, singular.** AD-9 matches `DESIGN.md` and `EXPERIENCE.md`, verified repo-wide,
  and even pre-empts the plural entering Playwright selectors.
- **The derived-count rule.** `EXPERIENCE.md`'s *"The count is computed on render; it is never
  stored"* lands precisely in AD-7. This is what a carried requirement looks like, and it shows the
  Component Patterns section was read — which makes the misses in F-1, F-4 and F-7 omissions rather
  than ignorance.
- **Offline as the normal case.** AD-6's *synchronous* storage port is the right call specifically
  because `UJ-2` forbids a spinner on cold open, and AD-11 vendors the fonts so first paint is
  correct offline. Both are better reasoned than the UX documents required.
- **The due date is not a control.** `UJ-1` step 3 — the parsed due date *"is not part of the
  review"* — is honoured structurally: the ER diagram gives SUGGESTION exactly three `CONTROL_*`
  relations, matching the addendum's three-property schema. **But note the trap in Deferred:**
  "suggested due dates" is listed as sitting behind an existing seam, *"a new field on
  `Suggestion`"*. Adding one would create a fourth control and break both `UJ-1` step 3 and
  `DESIGN.md`'s three-control course panel. The deferred item needs the caveat.

---

## What would turn this into a PASS

Additive, in rough priority order:

1. **AD-14 — review outcomes are recorded intent, not derived state.** Persist the struck set per
   task; carve it out of AD-7 explicitly; correct AD-10's "adds no path" (F-1, F-19).
2. **AD-15 — navigation and the app shell.** Four destinations, two entered surfaces, routing or
   store-field, Back-button behaviour in the installed PWA, the 360 tab bar and 1280 nav rail as
   components, `m9` First run and its detection (F-2, F-3).
3. **AD-16 — the design system is enforced, not merely declared.** All 43 tokens in `theme.css`
   including spacing and radius; lint against raw colour values and the `rounded-`/`shadow-`/`blur-`/
   `gradient-` utilities; `tnum` retained through subsetting, with tabular numerals stated as a rule;
   `font-display` and preload; the ten `DESIGN.md` components enumerated (F-13, F-14, F-15).
4. **AD-17 — the course panel is in layout flow**, with its three responsive renderings named, and a
   stated responsive strategy (F-7).
5. **Three one-line fixes:** `engine` as a field of the persisted `Suggestion` (F-4); the last
   persistent failure reason as a fourth field in `todo.settings.v1` (F-5); the engine is invoked
   only from capture-save and Suggest again, never from a reactive effect (F-9).
6. **A guard for the acceptance-rate rule** — one shared action shape plus one Playwright symmetry
   assertion — and a note that SM-C1 is observable only via the harness (F-6).
7. **A `technology.md` reconciliation section**: adopted / declined-by-constraint /
   declined-by-choice / not-applicable, with the §8 citation at the point of decline and the eleven
   F-17 items each given a line. Decide the UI-system question `EXPERIENCE.md` handed over, and add a
   CSP to AD-11 (F-17).
8. **Carry the two dropped Open Decisions into Deferred** — the accessibility conformance standard
   and colour-only encoding — plus `d5`'s unbuilt alternative, and the due-date caveat from §5
   (F-16).
9. **Smaller:** no-match Suggestion arity (F-11), undo scope after Punch all and across multiple
   punches (F-8), the in-flight request set behind the start triangle (F-10), an AD-6 scale bound
   (F-12), and a one-line animation policy (F-17 #3).

Items 1, 2, 3 and 5 are the ones without which the review surface and the navigation layer cannot be
built as the locked documents specify.
