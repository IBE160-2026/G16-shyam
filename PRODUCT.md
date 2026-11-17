# Product

<!-- impeccable:product-schema 1 -->

> Written without an init interview. The user directed "ikke spør nå" (do not ask now) when
> commissioning concept exploration, so every fact below is sourced from committed planning
> artifacts rather than elicited: `.docs/planning-artifacts/prds/prd-To-Do-List-2026-10-31/prd.md`
> (the PRD, 23 FRs and 10 NFRs), `.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/brief.md`,
> that brief's instructor feedback (`tilbakemelding-product-brief.md`, 2026-10-06), and
> `.docs/planning-artifacts/research/technical-suggestion-engine-selection-2026-10-28/research.md`.
> Facts carrying no source there are marked `[INFERRED]`; genuinely undecided ones are marked
> `[OPEN]` and must not be quietly resolved by design work.

## Platform

web

## Stack

`[OPEN]` Undecided, and deliberately not decided here: the PRD routes it to the `bmad-architecture`
phase, which has not run. Confirmed so far: one responsive web application installable as a PWA, no
separate codebase per surface, no backend, and browser-local storage. Which storage API —
`localStorage` or IndexedDB — is the architecture phase's call (PRD OQ-8), as is where the
user-supplied API key lives and what an `.env.example` means with no backend (OQ-4). Design work
must not assume a framework, a component library, or a storage mechanism.

## Users

**Primary — the multi-context juggler.** Modelled on the builder's own use: a student at Høgskolen i
Molde running four contexts at once — coursework, a group project, a part-time job, and personal
life — that must not bleed into one undifferentiated pile. Those four contexts are literally what
the Rule Engine's tag set is built from (`school`, `group`, `work`, `personal`).

Their job, in the PRD's own terms:

- **Functional** — capture a task in one sentence without stopping to categorize it, and still end
  up with a categorized list; see what matters today without having built or maintained any views.
- **Emotional** — trust the list. A half-organized list is worse than none, because you stop
  believing it.
- **Contextual** — work across four contexts without cross-contamination.

Two situations are confirmed and specified, not hypothetical: phone browser between classes
(installed PWA, no login, one-handed, seconds of attention) and offline on the tram on a Monday
morning, opening the app cold and needing to trust what it shows without having filed anything.

**Second real audience — the grader.** A course evaluator on a fresh clone with no Anthropic
account, no configuration, and no network, following the README. This is not a hypothetical persona:
the PRD makes it journey UJ-3 and success metric SM-2, and the app is graded on it. They must see
the AI feature actually work, see "AI proposes, human disposes" in the interaction, and see Settings
state plainly that no API key is configured — without that reading as an error or a degraded mode.

**Third — the builder with a key.** The same primary user on a desktop browser after saving their
own Anthropic API key, who turns Cloud Suggestions on and observes the two engines' difference in
use rather than only in harness output.

**Explicit non-users (v1).** Anyone whose core need is a shared list, a reminder, or their data on a
second device. All three are out of scope by decision, on instructor advice.

## Product Purpose

A task manager that does the organizing for you and then asks permission. The user types a task the
way they would say it out loud — "Submit assignment in IBE160 Friday" — and the app proposes the
structure they would otherwise add by hand: a set of Tags, a Priority, and a one-line Summary.
Nothing is filed until the user accepts it. They can edit the proposal, or throw it away and keep
the raw task.

It exists because the overhead of keeping a list well-organized routinely exceeds the overhead of
just remembering things, which is when obligations get dropped. The answer is not more fields to
fill in; it is a list that arrives pre-sorted and stays trustworthy because the user approved every
piece of structure in it.

Success is defined and measurable, not aspirational:

- **SM-1** — per-field Rule Engine accuracy against the committed Fixture (tags, priority, parsed
  due date, smart-list placement, with Summary scored separately and folded into nothing else).
- **SM-2** — a fresh clone reaches a working app exercising every graded capability with no API key,
  no account, and no network. Binary pass.
- **SM-3** — a committed result showing where the Model Engine beats the Rule Engine and where it
  does not, with the ambiguous cases called out.
- **SM-4** — capture is never blocked: a task appears within 100 ms of submit regardless of engine
  state.
- **SM-5** — the builder does not revert to another list. Not graded.

Counter-metrics the product must **not** optimize: suggestion acceptance rate (a high rate is
equally consistent with good suggestions and with a review UI that makes Accept the path of least
resistance — this one directly constrains the interface), Fixture size and difficulty, and Model
Engine usage share.

## Positioning

Suggestion-first, with review at the **part** level. The differentiator a neighboring product could
not truthfully copy is not AI tagging — Todoist and TickTick both ship that, and the PRD says so
outright. It is three things together:

1. **Three parts reviewed independently.** Tags, Priority, and Summary are each accepted, edited, or
   rejected separately, in any combination, and an acceptance is undoable in one step. One wrong
   field costs one correction, not a rejected suggestion.
2. **Two engines, one interface, and the free one is the guaranteed path.** The keyword Rule Engine
   runs on device with no key, no network, and no configuration, and is never framed as a degraded
   mode. The Anthropic Model Engine is an opt-in upgrade that falls back silently on any failure. The
   user can always see which engine produced a suggestion.
3. **The claim is measured, not asserted.** A committed Fixture of 10–15 example tasks with
   hand-derivable expectations, and a harness that scores both engines on it in the same format.

## Operating Context

- **Course and schedule.** Solo project for IBE160 (Programmering med KI) at Høgskolen i Molde, due
  the second week of December 2026. One builder, a fixed deadline, and a required path of PRD →
  architecture → epics and stories → build → test → fix → README. Any scope addition must displace
  something; the PRD fixes the cut order in advance (§6.3).
- **Graded against a published rubric**, whose weights are not a normal product's priorities:
  process and AI-steering 30%, functionality and scope 20%, QA and testing 15%, design 10%, code and
  architecture 10%, README and runnability 10%, repo tidiness 5%.
- **The instructor's standing design instruction.** The 2026-10-06 feedback on the product brief, in
  the design criterion: *"Vis i UX-steget hvordan godta/endre/avvis ser ut på mobil og PC"* — show,
  in the UX step, how accept/edit/reject looks on mobile and on PC. The same feedback rates the
  project difficulty "Enkel" and states that a simple project must compensate through execution,
  naming *et gjennomarbeidet design* (a thoroughly worked-through design) as one of the ways. Design
  carries 10% of the grade directly, and is one of the named routes to the other 90% reading as
  well-executed.
- **Physical scene.** Capture happens standing up, one-handed, on a phone, between classes, in
  seconds. Review happens in the same moment or later. Reading the list happens cold — Monday
  morning, offline, on a tram, before anything has been filed. Settings is visited rarely, usually
  once to paste a key, and once more to find out why the cloud engine stopped. The grader's session
  happens on a desktop, on a fresh clone, with a README open beside the app.
- **No network is the normal case, not the failure case.** Offline, every capability except the
  Model Engine works, and no view may show an error, spinner, or empty state attributable to a
  missing network.

## Capabilities and Constraints

**Confirmed capabilities (PRD FR-1 – FR-23).** Full local CRUD on tasks, where a task needs only its
text; complete and un-complete; a deterministic offline date-word parser over a small fixed English
vocabulary (`today`, `tomorrow`, `Monday`–`Friday` written in full, `next week` — and nothing else)
whose result is applied directly rather than proposed; a Suggestion Engine producing Tags, Priority
and Summary; per-part accept/edit/reject with single-step undo, plus "Accept all" / "Reject all"
shortcuts and an explicit "Suggest again"; engine attribution on every suggestion; derived Smart
Lists ("Due this week", "Need Attention", "High priority", and one per tag in use) computed on every
render with no stored membership; archiving of completed tasks after a retention window (30 days by
default); an API-key field, an opt-in Cloud Suggestions consent control with disclosure, and a plain
engine-status readout in Settings; and a committed Fixture plus a harness that scores both engines
on it.

**Hard constraints.**

- **Grader runnability.** No API key, account, network, or backend may be required to run any graded
  capability. Secrets never enter the repository.
- **Capture is never gated on the engine.** The task is saved and visible no later than 100 ms after
  submit, and stays fully editable while its suggestion is pending.
- **No part of a suggestion is applied without an explicit accept or edit of that part.** A
  suggestion with any part unreviewed stays visibly pending on the task.
- **Failure is silent in the flow.** Every Model Engine failure yields a Rule Engine suggestion with
  no error, popup, banner, toast, or badge anywhere in capture or review. After a *persistent*
  failure only, Settings shows a plain non-alarming status — and that is the only place it is ever
  visible. Three distinct persistent reasons must read distinctly, and the organization-policy one
  must not be worded as a rejected key, because the key is valid and nothing the user does to it
  will help.
- **Nothing leaves the device until consent.** Cloud Suggestions is off on first run even when a key
  is already present, and saving a key never enables it.
- **English task text only**, by decision — the parser vocabulary and keyword tables are English.
  Norwegian task text falling through to no tags and medium priority is a scope boundary, not a bug.
- **Responsive floor.** Every flow, and specifically the accept/edit/reject interaction, is usable at
  **360 px and 1280 px** viewport width with **no horizontal scrolling**, and is demonstrated at
  both (NFR-4). This is the one NFR that names the design directly.
- **No analytics, telemetry, crash reporting, or third-party script** in v1.
- **Determinism.** Date-dependent behavior is tested against a fixed injected reference date, never
  the system clock.

**Explicit non-goals.** Not multi-user or shared-list; no accounts, sync, sharing, merge UI, or
conflict resolution. Not a reminder or notification product: no push, scheduled alerts, or email. Not
natively packaged beyond PWA install. No payments. Not a general AI assistant — the Model Engine does
one job for one task, with no chat and no open-ended prompting. Not trying to out-feature Todoist or
TickTick.

**Terminology (binding; the interface should not invent synonyms).** Task · task text · Tag ·
Priority (`high` / `medium` / `low`, `medium` the default) · Summary · Suggestion · Suggestion
Engine · Rule Engine · Model Engine · API Key · Cloud Suggestions · Smart List · **Need Attention**
(the smart list of tasks past due and not completed) · Project · Archive · Fixture.

**`[OPEN]` product facts — undecided, and not design's to settle alone.**

- **OQ-1** — the Model Engine's real latency is unmeasured; the spike harness exists at
  `.docs/planning-artifacts/spikes/oq1-model-engine-latency/` but has never made a real call. It
  sets the pending-suggestion timeout (6 s vs. 10 s) and confirms the provider. It does **not**
  constrain the surfaces, the state vocabulary, or the pending state, which are already specified.
- **OQ-4 / OQ-8** — where the API key lives, and which storage API. Both belong to architecture.
- **UI language.** The PRD fixes *task text* as English only and explicitly calls the *interface*
  language "a separate question" that it does not answer. A previous concept run assumed English and
  the assumption was never confirmed. `[OPEN]` — concepts should render English strings as the
  working assumption and flag it, not treat it as settled.
- **Accessibility standard.** No standard is named anywhere in the brief or PRD beyond NFR-4's two
  widths. A previous run assumed WCAG 2.2 AA as a floor; also never confirmed. `[OPEN]`
- **Non-color encoding.** A previous run assumed that priority and engine provenance must never be
  carried by color alone. Sound practice and consistent with NFR-4's intent, but never confirmed by
  the user. `[OPEN]` — concepts should honor it and say they are doing so.

## Brand Commitments

- **Name:** To-Do-List. Working title from the course project; no logo, wordmark, or brand asset
  exists, and none has been commissioned.
- **Voice, where the PRD fixes it.** Plain and non-alarming. The absence of an API key is stated as
  a fact, never framed as an error. A persistent engine failure is explained in three plain
  statements — that the Model Engine is not being used, why, and that the Rule Engine is serving
  suggestions normally — and the organization-policy case is worded so the user does not go hunting
  for a fault that is not theirs. The user's own typed task text is never rewritten by the app.
- **One behavioral commitment that reads as brand:** the product never claims the AI was right. It
  shows which engine spoke, lets the user overrule each part of it, and publishes its own accuracy
  measurement.
- `[INFERRED]` No further voice, personality, or identity constraint has been stated. The visual
  world is genuinely open.

## Evidence on Hand

**Real, committed, usable as design material:**

- The PRD — 23 FRs, 10 NFRs, four user journeys, a glossary, and a decisions index.
  `.docs/planning-artifacts/prds/prd-To-Do-List-2026-10-31/prd.md`
- The product brief and the instructor's feedback on it, including the design instruction quoted
  above. `.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/`
- Suggestion-engine research with four option digests and an HTML briefing.
  `.docs/planning-artifacts/research/technical-suggestion-engine-selection-2026-10-28/`
- Formative PRD feedback. `…/prds/prd-To-Do-List-2026-10-31/tilbakemelding-prd.md`
- A runnable, never-run latency spike harness.
  `.docs/planning-artifacts/spikes/oq1-model-engine-latency/`
- **Real example task text with hand-derivable expected output**, specified in FR-7 against reference
  date Monday 2026-11-16: *"Submit assignment in IBE160 Friday"* → Tags `[school]`, Priority `high`,
  due 2026-11-20. And a deliberate no-match case: *"Figure out the thing"* → Tags `[]`, Priority
  `medium`, no due date. Design work should use these strings rather than inventing content.

**Absences future work must not fabricate:**

- **No application code exists.** Nothing has been built.
- **No Fixture file yet** — the 10–15 entries are specified but unwritten.
- **No measured latency number.** Any specific timeout figure in a design is a placeholder.
- **No screenshots or recording** of a Model Engine suggestion.
- **No DESIGN.md and no visual world.** A previous concept run's five concepts were deleted in full
  on 2026-11-15 and exist in no form; they are not available as reference and must not be
  reconstructed from memory.
- No users beyond the builder, no usage data, no testimonials, no accuracy numbers.

## Product Principles

1. **The task is saved before anything is proposed.** Capture never waits on intelligence, and
   intelligence never holds the user's sentence hostage.
2. **Structure is proposed, never imposed.** Three parts, reviewed independently, every acceptance
   reversible. No part lands without the user acting on that part.
3. **The free, offline path is the real product.** The Rule Engine is the guaranteed path and must
   never be presented as a fallback, a degraded mode, or a missing feature. The cloud engine is an
   upgrade that may silently vanish without the product changing character.
4. **Trust is the feature.** A half-organized list is worse than none. Views are derived, never
   hand-maintained, and the app shows its own provenance and its own measured accuracy rather than
   claiming correctness.
5. **Do not make Accept the path of least resistance.** The interface must not optimize the
   acceptance rate; editing and rejecting a single part must be as reachable as accepting all three.

## Accessibility & Inclusion

- **Confirmed (NFR-4):** every flow, specifically accept/edit/reject, usable at 360 px and 1280 px
  with no horizontal scrolling, demonstrated at both.
- **Confirmed by context:** one-handed phone use in seconds, and full operability offline.
- `[OPEN]` No conformance standard has been established. WCAG 2.2 AA is a reasonable floor and was
  assumed by a previous run, but the user has never confirmed it.
- `[OPEN]` Whether priority and engine provenance may be carried by color alone — previously assumed
  "never," never confirmed.
