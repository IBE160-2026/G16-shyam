---
title: To-Do-List
status: draft
created: 2026-10-31
updated: 2026-11-01
---

# PRD: To-Do-List

## 0. Document Purpose

This PRD is the implementable specification for To-Do-List, the solo project for IBE160
(Programmering med KI) at Høgskolen i Molde, due the second week of December 2026. It is
written for one reader who is also the builder, and for the downstream BMad workflows
(architecture, epics and stories, build) that consume it. It builds on two existing
documents and does not repeat them: the product brief at
`.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/brief.md` and the suggestion-engine
research at `.docs/planning-artifacts/research/technical-suggestion-engine-selection-2026-10-28/research.md`.
Technical mechanism, pricing, rejected alternatives, and the rule-engine design sit in
`addendum.md` alongside this file. Vocabulary is fixed by §3 Glossary; features are grouped
in §4 with globally numbered FRs. §13 is the Decisions and Assumptions Index: every judgment that
was once an open inference is listed there with its status — confirmed by the builder on
2026-11-01, or deliberately deferred to a named later stage. Nothing in this document is left as
an unresolved assumption.

The brief left exactly one decision to this PRD — which Suggestion Engine ships in v1.
§4.2 resolves it.

## 1. Vision

To-Do-List is a task manager that does the organizing for you and then asks permission. You
type a task the way you would say it out loud — "email the group about Thursday's meeting" —
and the app proposes the structure you would otherwise have to add by hand: a set of Tags, a
Priority, and a one-line Summary. Nothing is filed until you accept it. You can edit the
proposal, or throw it away and keep the raw task.

The product exists because the overhead of keeping a task list well-organized routinely
exceeds the overhead of just remembering things, which is when obligations get dropped. The
answer is not more fields to fill in; it is a list that arrives pre-sorted and stays
trustworthy because the user approved every piece of structure in it.

It runs entirely on one device. Tasks live in browser storage, there is no account, and the
app works with no network. A grader who clones the repository and opens it — with no API key,
no signup, and no backend — gets a fully working application. That constraint is not a
nicety; it is a hard requirement of the course deliverable, and it shapes §4.2.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** capture a task in one sentence without stopping to categorize it, and still
  end up with a categorized list.
- **Functional:** see what deserves attention today without having built or maintained any views.
- **Emotional:** trust the list. A list that is half-organized is worse than no list, because
  you stop believing what it shows you.
- **Contextual:** work across school, a group project, a part-time job, and personal life
  without those contexts bleeding into one undifferentiated pile.
- **Builder's own job:** demonstrate a practical, honest, well-tested application of an AI
  model, and be able to show *why* each AI decision was made. The course weights this more
  heavily than feature count (§11).

### 2.2 Non-Users (v1)

- **Groups sharing a list.** Classmates co-owning a group assignment need accounts and sync;
  both are out of v1 (§5). This was the single largest scope risk identified in review, and
  it stays closed.
- **Users wanting reminders.** Anyone whose core need is being notified at a time is not served
  by v1; there are no notifications.
- **Users on a different device expecting their data.** Storage is per-device and per-browser.

### 2.3 Key User Journeys

> **Confirmed by builder, 2026-11-01.** The protagonist is modelled on the builder's own use.
> These are the journeys the UX work builds on.

- **UJ-1. Shyam dumps a task between classes and never opens a menu.**
  - **Persona + context:** a student with a dozen small obligations a week across school, a
    group project, and personal life, who in practice never tags anything by hand.
  - **Entry state:** no login (there is none); app already open in a phone browser as an
    installed PWA.
  - **Path:** taps the capture field; types "Submit assignment in IBE160 Friday"; the Task is
    saved immediately; a Suggestion appears attached to it proposing Tags `school`,
    Priority `high`, and a Summary; he taps Accept all.
  - **Climax:** the Task is now filed under `school`, shows as high Priority, and has appeared
    in the "Due this week" Smart List — and he added no structure himself.
  - **Resolution:** back to the list, one tap spent. Nothing is pending his attention.
  - **Edge case:** if one part of the Suggestion is wrong — Priority `low` on something urgent,
    but the Tags and Summary are right — he accepts the Tags and the Summary, and on the Priority
    alone taps Edit, sets `high`, and saves. One wrong field costs him one correction, not a
    rejected Suggestion. And if he accepts something by reflex and immediately regrets it, undo
    puts that field back.

- **UJ-2. Shyam opens the app cold and trusts what he sees.**
  - **Persona + context:** same person, Monday morning, deciding what to do.
  - **Entry state:** app opened from the home screen, offline on the tram.
  - **Path:** lands on the default view; sees "Due this week" and "High priority" as Smart
    Lists populated from existing Tasks; scans them; opens one Task to read its notes.
  - **Climax:** he knows what matters today without having filed anything or built a view, and
    without a network connection.
  - **Resolution:** closes the app. No sync indicator, no spinner, no empty state.

- **UJ-3. A grader runs the app with no API key and sees the AI feature work.**
  - **Persona + context:** the course examiner, cloning the repository for the first time, with
    no Anthropic account and no intention of creating one.
  - **Entry state:** fresh clone, no configuration, no `.env` file filled in.
  - **Path:** follows the README; starts the app; creates a Task; a Suggestion appears, produced
    by the Rule Engine; exercises the per-field review deliberately — accepts the proposed Tags,
    then edits the proposed Priority to a different value and saves that — and sees each field
    land independently; opens Settings and sees plainly that no API Key is configured and that
    the Rule Engine is in use.
  - **Climax:** every graded capability — CRUD, per-field accept/edit/reject, Smart Lists — is
    reachable without credentials, and the "AI proposes, human disposes" stance is visible in the
    interaction rather than only asserted in the documentation.
  - **Resolution:** the grader can also run the Fixture harness (§4.6) and see measured
    Rule Engine accuracy without an API Key.

- **UJ-4. Shyam brings his own key and the Model Engine takes over.**
  - **Persona + context:** same student, now curious whether the model does better than the rules
    on the messy tasks he types in a hurry.
  - **Entry state:** app in a desktop browser; no API Key configured; Cloud Suggestions off.
  - **Path:** opens Settings; pastes his own Anthropic API Key and saves it; the Cloud Suggestions
    control appears beside the key field, still off, with the disclosure explaining that Task text
    will be sent to Anthropic's API under his own key and that the Rule Engine remains the
    fallback (FR-17, FR-18); reads it and turns Cloud Suggestions on; creates a Task; the
    Suggestion that arrives is attributed to the Model Engine (FR-11).
  - **Climax:** he can see which engine produced which Suggestion, so the comparison is something
    he observes in use rather than only reads in the harness output.
  - **Resolution:** Cloud Suggestions stays on; capture feels the same as before because it never
    waited on the Suggestion anyway (FR-8).
  - **Edge case:** weeks later his free credit runs out. Suggestions keep arriving with no error
    and no interruption in the capture or review flow — they are simply served by the Rule Engine
    again (FR-9). Nothing pops up. When he next opens Settings, a plain status line tells him the
    Model Engine is not being used because the key's credit is exhausted, and that the Rule Engine
    is serving Suggestions (FR-11). He decides whether to top up or leave it; either way the app
    keeps working.

## 3. Glossary

- **Task** — the core entity. Fields: task text, due date (optional), Project (optional),
  notes (optional), Tags, Priority, Summary, completed state, archived state. One Task has
  zero or more Tags, exactly one Priority, and at most one Summary.
- **Tag** — a short label categorizing a Task (e.g. `school`). A Task may have several.
- **Priority** — exactly one of `high`, `medium`, `low` on every Task. `medium` is the default
  when nothing determines otherwise.
- **Summary** — a one-line restatement of a Task's text, at most one per Task.
- **Suggestion** — a proposed set of Tags, Priority, and Summary for one Task, produced by the
  Suggestion Engine and not yet applied. A Suggestion has three independently reviewable parts —
  its Tags, its Priority, and its Summary — and each is accepted, edited, or rejected on its own
  (FR-10). A Suggestion is always reviewable before any part of it takes effect.
- **Suggestion Engine** — the component that produces a Suggestion for a Task. It has exactly
  two implementations, below, behind one interface with one output shape.
- **Rule Engine** — the keyword/heuristic implementation of the Suggestion Engine. Runs on
  device, needs no network and no API Key, and is always present.
- **Model Engine** — the Claude API implementation of the Suggestion Engine. Used only when an
  API Key is configured and Cloud Suggestions are enabled.
- **API Key** — a user-supplied Anthropic API key, stored on device, never committed to the
  repository, never bundled with the app.
- **Cloud Suggestions** — the user-facing setting that governs whether Task text may be sent
  to the Claude API. Off until explicitly turned on.
- **Smart List** — a view of Tasks derived automatically from Task fields (e.g. "Due this
  week", "High priority", or one per Tag). Smart Lists are computed, never hand-maintained.
- **Project** — a user-named grouping a Task may belong to. Unlike a Smart List, it is assigned,
  not derived.
- **Archive** — the state a completed Task enters after the retention window, removing it from
  default views without deleting it.
- **Fixture** — the committed set of 10–15 example Tasks, each with an expected Tags, Priority,
  parsed due date, and Smart List placement, plus the fixed reference date those date
  expectations are relative to. Used as success criteria, as the test suite's input, and as the
  evidence that the builder can judge AI output.

## 4. Features

### 4.1 Task Management

**Description:** Full CRUD over the Task entity, local to the device. Capture is optimized for
speed: a Task is created from text alone, and every other field is optional and editable later.
Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Create a Task from text alone

The user can create a Task by entering task text and nothing else.

**Consequences (testable):**
- A Task created with only task text persists with Priority `medium`, no Tags, and no Summary.
- The Task is readable after a full page reload and after the browser is closed and reopened.
- Creation does not require a network connection.
- Creation does not block on the Suggestion Engine (see FR-8).

#### FR-2: Read Tasks

The user can see all non-archived Tasks, and open one to see every field.

**Consequences (testable):**
- Default view excludes archived Tasks and includes completed-but-not-yet-archived Tasks.
- Every field in the Glossary definition of Task is visible on the detail view.

#### FR-3: Update a Task

The user can edit task text, due date, Project, notes, Tags, Priority, and Summary.

**Consequences (testable):**
- Each field can be changed independently and persists across reload.
- Editing a field that came from an accepted Suggestion overwrites it with the user's value and
  does not re-trigger the Suggestion Engine.

#### FR-4: Delete a Task

The user can permanently delete a Task.

**Consequences (testable):**
- A deleted Task is absent from all views and from storage after reload.
- Deletion is distinct from completion and from Archive.

#### FR-5: Complete a Task

The user can mark a Task complete and can un-complete it.

**Consequences (testable):**
- A completed Task leaves active Smart Lists immediately.
- A completed Task remains retrievable until archived.

#### FR-23: Parse simple date words from task text into the due date

At capture, the system recognizes a small, fixed set of date words in the Task text and sets the
Task's due date from them, deterministically and offline.

> Numbered FR-23 rather than inserted in sequence so existing FR numbers stay stable for
> downstream artifacts. It belongs to Task Management, not to the Suggestion Engine: the parsed
> date is **not** a part of a Suggestion and does not go through FR-10's review. It is applied
> directly because it is deterministic rather than inferred, and because it is visible and
> editable the moment it lands — the user can see it was wrong and fix it in one action.
>
> This is what makes UJ-1 work end to end: without it, "Submit assignment in IBE160 Friday" could
> never reach the "Due this week" Smart List, because nothing else in v1 produces a due date from
> typed text.

**Recognized vocabulary (the whole of it):** `today`, `tomorrow`, the seven weekday names, and
`next week`. Nothing else. No month names, no numeric dates, no "in three days", no "end of
month", no relative arithmetic.

**Consequences (testable):**
- Matching is case-insensitive and runs with no network.
- Parsing is deterministic: the same task text and the same reference date always yield the same
  due date (see NFR-10 — tests inject a fixed reference date).
- `today` resolves to the reference date; `tomorrow` to the following day.
- **A weekday name resolves to the next occurrence of that day. If the reference date is itself
  that weekday, it resolves to the reference date (today), not to a week later.**
- `next week` resolves to the Monday of the following week, consistent with FR-12's week
  definition.
- If the text contains more than one recognized date expression, the **first** one wins.
- Text containing no recognized date word leaves the due date empty — the Task is still created
  (FR-1), it simply has no due date.
- An unrecognized date-like phrase ("end of month", "15 March", "in three days") is treated as no
  date word at all: no due date is set, nothing is guessed, and no error is shown.
- A parsed due date is displayed on the Task and is editable through FR-3 like any other field.
- The task text itself is never rewritten by parsing; the original wording is preserved.
- Parsing does not depend on the Suggestion Engine and runs identically whichever implementation
  is active.

### 4.2 Suggestion Engine

**Description:** This section resolves the brief's one open decision. v1 ships **both**
implementations behind a single interface: the Rule Engine always, and the Model Engine as an
opt-in upgrade when the user supplies an API Key. The Rule Engine is not a degraded mode — it
is the permanent, guaranteed path, and the only path a grader will exercise by default.

The reason for shipping the Model Engine at all is execution quality, not necessity. Shipping
both also makes the comparison between them a first-class, measurable artifact (§4.6), which is
worth more to this project than either engine alone.

**Why this is the sanctioned shape.** The instructor feedback of 2026-10-06 leaves the choice
open and accepts either outcome, asking only that it be decided here and justified: *"Ta
beslutningen om forslagsmotor i PRD-en: bare regelmotor, eller regelmotor pluss valgfri
språkmodell med automatisk reserve. Skriv ned begrunnelsen."* It rates the Rule Engine
*"svært godt egnet for automatiske tester"*, and where it does express a preference, it points at
exactly this shape as the difficulty lift to take *instead of* sync: *"velg heller én valgfri
språkmodell for sammendrag og tagger, med regelmotoren som automatisk reserve når nøkkel mangler
eller kallet feiler. Det er mer i tråd med kjerneideen enn synk."* Cloud sync was cut on the same
advice, so the Model Engine is a replacement for scope already removed, not an addition on top.

One correction worth recording, because it changes the standard this section is held to. The brief
says a rules-only classifier "may not clear that bar on its own," and `research.md` repeats that
concern as though it came from the instructor feedback. It did not — the feedback never says a
rules-only engine is insufficient, and in fact treats it as acceptable and highly testable. The
Model Engine is therefore justified as an execution-quality uplift, and rules-only remains a
legitimate fallback plan if the schedule compresses (see `addendum.md`).

**Provider.** Claude Haiku 5.5 is the planned provider, **confirmed only after the OQ-1 latency
spike** (§12). The brief frames the cloud option as "OpenAI / Claude" without choosing, and
`research.md` rates OpenAI's cheapest nano tier an essentially tied runner-up whose latency
evidence is in fact cleaner than Claude's. So: if Haiku's measured latency at lowest effort turns
out to be unacceptable, **OpenAI is the fallback provider choice**, slotted behind the same
Suggestion Engine interface with no other part of this PRD changing. OpenAI's model names are
churning fast enough that the specific model must be re-checked at implementation rather than
taken from the research. Comparison detail is in `addendum.md`.

Realizes UJ-1, UJ-3.

**Functional Requirements:**

#### FR-6: Produce a Suggestion for a Task

The Suggestion Engine produces a Suggestion — Tags, Priority, and Summary — from a Task's text
and due date.

**Consequences (testable):**
- The output shape is identical whichever implementation ran: same fields, same types, same
  Priority vocabulary from §3.
- Priority is always one of `high`, `medium`, `low`.
- A Suggestion is never applied to a Task without passing through FR-10.

#### FR-7: Rule Engine is always available

The Rule Engine produces a Suggestion with no API Key, no network, and no configuration.

**Consequences (testable):**
- With no API Key configured, creating a Task still yields a Suggestion.
- With the device offline, creating a Task still yields a Suggestion.
- The Rule Engine is a pure function of Task text and due date: the same input yields the same
  Suggestion every time.
- The Rule Engine's Summary is a cleaned-up, truncated restatement of the Task text — it does not
  attempt true summarization, and it is not expected to. **Confirmed by builder, 2026-11-01.** The
  research found no rule-based summarization approach at all; truncation is the only honest option
  on device, and the Summary is where the Model Engine should visibly outperform the Rule Engine in
  FR-21's comparison.
- Rule Engine accuracy against the Fixture is measured and reported by FR-20.

#### FR-8: Suggestion never blocks capture

A Task is saved and visible before its Suggestion exists; the Suggestion arrives afterward and
attaches to the saved Task.

**Consequences (testable):**
- The Task appears in the list within one interaction, regardless of Suggestion Engine state.
- While a Suggestion is pending, the Task shows a pending indicator and remains fully editable.
- If the Suggestion never arrives, the Task is unaffected and keeps its defaults.

> **Decision (confirmed by builder, 2026-11-01).** Not something the brief states. It exists
> because Model Engine latency is unresolved (§12 OQ-1) and could reach ~13s; making capture
> synchronous on the Suggestion would put that delay in the user's way. Making it asynchronous
> dissolves the risk.

#### FR-9: Model Engine is used only when permitted, and falls back silently

When an API Key is configured **and** Cloud Suggestions is on, the Model Engine is attempted
first; on any failure the Rule Engine produces the Suggestion instead.

Failures divide into two kinds, and they are treated differently — not in the capture and review
flow, which stays identical, but in whether Settings explains what happened. A dropped connection
will fix itself and is not worth telling the user about; a dead key will not, and silence there
would leave someone believing the Model Engine is running when it never will be again.

**Consequences (testable):**

*Not attempted at all:*
- No API Key → the Model Engine is not attempted and no network request is made.
- Cloud Suggestions off → the Model Engine is not attempted even if an API Key is present.

*Transient failures — fully silent:* device offline, request timeout, rate limit, and any other
temporary API error.
- Each produces a Rule Engine Suggestion instead, with no user-facing failure state anywhere —
  not in the flow and not in Settings.
- Nothing is recorded that would make Settings claim the Model Engine is unavailable; the next
  capture attempts the Model Engine again.

*Persistent failures — silent in the flow, surfaced in Settings:* invalid API Key, and exhausted
credit or quota.
- Each produces a Rule Engine Suggestion instead, with **no error, popup, or interruption in the
  capture or review flow** — identical in-flow behavior to a transient failure.
- Settings then shows a plain status explaining it (FR-11). This is the only place a persistent
  failure is ever visible.

*Both kinds:*
- The user can tell which implementation produced a given Suggestion (FR-11).
- Fallback is automatic and requires no user action.
- Every failure mode above is covered by an automated test against a mocked API (NFR-8).

> **Decision (confirmed by builder, 2026-11-01).** The failure-mode list, the transient/persistent
> split, and the decision to fall back without interrupting the flow are this PRD's own product
> decision. The research does not address failure modes at all, and the brief requires only that
> the Rule Engine be the automatic fallback when a key is missing or a call fails — enumerating
> *which* failures count, and deciding which deserve an explanation, is owned here.

#### FR-10: Review each part of a Suggestion independently

The user accepts, edits, or rejects the Suggestion's Tags, its Priority, and its Summary
**separately**, and can undo an acceptance. "Accept all" and "Reject all" shortcuts apply the
chosen action to all three parts at once.

The brief requires the three suggestion types to be "each individually reviewable", and the
instructor feedback describes the principle as *"hvert forslag til tagger, prioritet og
sammendrag vises og kan godtas, endres eller avvises"* — per part, not per Suggestion. A single
all-or-nothing decision would force the user to throw away two correct fields to fix one wrong
one, which is the opposite of the product's stance.

**Consequences (testable):**
- Each of Tags, Priority, and Summary can be accepted, edited, or rejected without affecting the
  other two, in any combination — including accepting some parts and rejecting others on the same
  Suggestion.
- Accepting a part writes only that part onto the Task; the other parts keep their prior values
  until acted on.
- Editing a part lets the user change the proposed value before it is applied, and applies the
  edited value rather than the proposed one.
- Rejecting a part leaves the Task's corresponding field at its prior value and does not reapply
  that part later.
- **Accepting is reversible: immediately after accepting a part, the user can undo it, restoring
  that field's prior value.** A single-step undo available right after the acceptance is
  sufficient for v1 — no undo history, no undo stack, and no undo of an acceptance from an earlier
  session. This satisfies the brief's requirement that nothing is filed "without a visible,
  reversible choice."
- "Accept all" applies all three parts in one action; "Reject all" dismisses all three. Both are
  shortcuts for the per-part actions above and introduce no behavior the per-part actions lack.
- Undo after "Accept all" restores all three fields to their prior values.
- No part of a Suggestion is ever applied without an explicit accept or edit of that part.
- A Suggestion with any part still unreviewed remains visibly pending on the Task.
- The flow is operable on both a phone-sized viewport and a desktop viewport (NFR-4).

#### FR-11: Disclose which engine ran

The user can see whether a Suggestion came from the Rule Engine or the Model Engine, and can see
the current Suggestion Engine state in Settings.

**Consequences (testable):**
- Each Suggestion is attributed to one implementation in the review UI.
- Settings states plainly whether an API Key is configured and which implementation is active.
- With no API Key, Settings says so without framing it as an error or a missing requirement.
- **After a persistent failure (FR-9), Settings shows a plain, non-alarming status saying three
  things: that the Model Engine is not being used, the reason — the API Key was rejected, or its
  credit or quota is exhausted — and that the Rule Engine is serving Suggestions normally.** The
  tone is informational, not an error: nothing is broken, one optional path is unavailable.
- That status appears **only** in Settings. No popup, banner, toast, badge, or error appears in
  the capture or review flow, or anywhere else in the app.
- The status clears once the underlying cause is resolved — for example when a working API Key is
  saved — without the user having to dismiss anything.

#### FR-22: Request a fresh Suggestion

The user can explicitly ask for a new Suggestion for an existing Task via a "Suggest again"
action. A fresh Suggestion is never produced automatically.

> Numbered FR-22 rather than inserted in sequence so that the existing FR numbers stay stable for
> downstream artifacts. It belongs to this feature, not to §4.6.

**Consequences (testable):**
- "Suggest again" is available after a Suggestion has been rejected, in whole or in part, and
  after the Task's text has been edited.
- Invoking it produces a new Suggestion that replaces the previous pending one and is reviewed
  through FR-10 like any other.
- Editing Task text does **not** itself trigger a new Suggestion — nothing re-runs the Suggestion
  Engine without the user asking (consistent with FR-3).
- Accepted field values are not overwritten by a fresh Suggestion until the user accepts the
  corresponding part of it.
- The action is available whichever implementation is active, and obeys FR-9's fallback rules.

**Feature-specific NFRs:**
- The Model Engine requests schema-constrained output so a malformed Suggestion is not a case
  the app has to parse around; see `addendum.md`.
- The Model Engine runs at the lowest available effort setting, because latency is the binding
  constraint, not answer depth (§12 OQ-1).

### 4.3 Smart Lists

**Description:** Derived views that give the user structure without maintaining it. Smart Lists
are computed from Task fields on every render; there is no stored membership. Realizes UJ-2.

**Functional Requirements:**

#### FR-12: Due-window Smart Lists

The system presents Smart Lists grouping Tasks by due date window.

**"Current week" means Monday through Sunday inclusive, in the device's local time zone.** Fixed
here so that FR-15's assertions and FR-23's `next week` have one unambiguous definition to share.

**Consequences (testable):**
- A Task with a due date inside the current week — Monday to Sunday, local time — appears in
  "Due this week".
- A Task due the Sunday of the current week appears in it; a Task due the following Monday does
  not.
- A Task with a due date in the past and not completed appears in an overdue grouping.
- A Task with no due date appears in neither.

#### FR-13: Priority Smart List

The system presents a Smart List of Tasks at Priority `high`.

**Consequences (testable):**
- Setting a Task's Priority to `high` — by accepting a Suggestion or by editing — adds it
  immediately.
- Completing the Task removes it immediately.

#### FR-14: Tag Smart Lists

The system presents a Smart List per Tag in use.

**Consequences (testable):**
- A Tag that no non-archived Task carries produces no Smart List.
- Accepting a Suggestion that adds a new Tag makes that Tag's Smart List available without a
  reload.

#### FR-15: Smart List placement is testable against the Fixture

Each Fixture entry's expected Smart List placement is asserted by the test suite.

**Consequences (testable):**
- The suite fails if a Fixture Task lands in a different Smart List than its expected placement.
- Placement is asserted against the Fixture's fixed reference date, not the machine's clock, so
  the same assertions pass on any day and in any time zone (NFR-10).

### 4.4 Archiving

**Description:** Completed Tasks leave the user's view on a schedule rather than accumulating,
without being destroyed.

**Functional Requirements:**

#### FR-16: Archive completed Tasks after a retention window

A completed Task is archived once it has been complete for longer than the retention window,
which defaults to 30 days and is user-configurable.

**Consequences (testable):**
- With the default setting, a Task completed 31 days ago is archived and absent from default views.
- Changing the retention window re-evaluates existing completed Tasks against the new value.
- An archived Task is still retrievable through an archive view and is not deleted.

### 4.5 Settings, API Key, and Consent

**Description:** The surface where the user supplies an API Key, turns Cloud Suggestions on, and
sets the retention window. This feature carries the product's entire privacy posture, because it
is the only place Task text can be routed off the device.

**Functional Requirements:**

#### FR-17: Supply and clear an API Key

The user can enter an API Key, see that one is stored, and clear it.

**Consequences (testable):**
- The API Key is stored on device only and survives reload.
- The API Key is never written to the repository and is not present in any committed file.
- Clearing the API Key returns the app to Rule-Engine-only operation with no further network
  requests.

#### FR-18: Cloud Suggestions is off until explicitly enabled

Task text is never sent off the device until the user turns Cloud Suggestions on, having been
told what that means.

**Consequences (testable):**
- Default state on first run is off, including when an API Key is already present.
- The consent control states, before being enabled, that Task text will be sent to Anthropic's
  API, that the key is the user's own, and that the Rule Engine remains the fallback.
- Turning it off stops all outbound requests immediately.
- With it off, no network request containing Task text is issued under any code path.
- **Saving an API Key never enables Cloud Suggestions.** The moment a key is saved, Settings shows
  the Cloud Suggestions control and its disclosure immediately beside the key field, still off,
  with a hint that it must be turned on before the Model Engine will be used. Supplying a key and
  consenting to send data are two separate, deliberate acts (realizes UJ-4).
- Clearing and re-saving a key does not re-enable Cloud Suggestions if the user had turned it off.

> **Decision (confirmed by builder, 2026-11-01).** The brief states that sending task text to a
> cloud model is opt-in and that the default local engine never sends data anywhere, but it does
> not say what the opt-in looks like. The specific mechanism — a dedicated Cloud Suggestions
> setting, off by default even when a key is present, disclosure shown before it can be turned
> on, and key-entry kept separate from consent — is this PRD's own design.

### 4.6 Evaluation Fixture and Harness

**Description:** The Fixture is a committed data file, not a test fixture buried in test code,
because it does triple duty: it is this PRD's success criteria (§7), the test suite's input, and
the evidence that the builder can judge AI output rather than accept it. Course review called for
it specifically, replacing the brief's unmeasurable criteria.

**Functional Requirements:**

#### FR-19: Fixture exists and is committed

A Fixture of 10–15 Tasks, each with expected Tags, expected Priority, expected parsed due date,
and expected Smart List placement, is committed at a documented path.

**Consequences (testable):**
- The file contains at least 10 and at most 15 entries.
- Every entry has all four expectations populated — an expected due date of "none" is a valid and
  meaningful expectation, not a blank.
- **The file records the fixed reference date that all date expectations are relative to**
  (NFR-10). Without it the due-date and Smart-List expectations would be unreadable.
- Entries cover both easy cases and genuinely ambiguous ones — the research's best-sourced
  finding is that keyword classifiers misjudge Priority on ambiguous text, so the Fixture must
  contain such text or it cannot show the difference between the engines.
- **Date coverage specifically includes:** at least one entry per recognized form in FR-23
  (`today`, `tomorrow`, a weekday name, `next week`); at least one entry with no date word, whose
  expected due date is none; and at least one entry with an unrecognized date-like phrase such as
  "end of month", whose expected due date is also none.
- **At least one entry is a deliberately ambiguous date case**, with the expected outcome written
  down so the rule is pinned rather than assumed. The canonical one: a Task whose text names the
  same weekday as the reference date, which FR-23 resolves to the reference date itself rather
  than a week later. A second worthwhile case is text containing two recognized date words, where
  the first wins.
- The path is named in the README.

#### FR-20: Harness measures Rule Engine accuracy against the Fixture

A command runs the Rule Engine over every Fixture entry and reports per-field accuracy.

**Consequences (testable):**
- The command runs with no API Key and no network.
- Output reports Tags, Priority, parsed due date, and Smart List placement accuracy separately,
  not as one number.
- **The harness runs against the Fixture's fixed reference date rather than the system clock, so
  the same input produces the same score on any day and any machine** (NFR-10).
- It names which entries failed, so a failure is diagnosable rather than just a score.

#### FR-21: Harness can measure the Model Engine on the same Fixture

The same harness can run against the Model Engine when an API Key is supplied, producing a
directly comparable result.

**Consequences (testable):**
- Both engines' results are reported in the same format over the same Fixture.
- The Model Engine run is skipped with a clear message, not an error, when no API Key is present.

**Notes:** `[NOTE FOR PM]` FR-21 is the single highest-value artifact for the 30%
process-and-AI-steering weighting (§11): it is the difference between asserting the Model Engine
is better and demonstrating where it is and is not. Protect it if the schedule compresses.

## 5. Non-Goals (Explicit)

- **Not a multi-user or shared-list product.** No accounts, no sync, no sharing, and therefore
  no merge UI, no conflict resolution, and no realtime collaboration. Review flagged this as the
  largest risk in the plan for a solo build — it would mean building two applications. Closed.
- **Not a reminder or notification product.** No push, no scheduled alerts, no email.
- **Not a natively packaged application.** One responsive web app; no App Store, Play Store, or
  desktop installer beyond PWA install.
- **Not a commerce product.** No payments, purchases, subscriptions, or billing of any kind.
- **Not a general AI assistant.** The Model Engine does one job — propose Tags, Priority, and
  Summary for one Task. No chat, no open-ended prompting, no task generation, no agentic behavior.
- **Not trying to out-feature Todoist or TickTick.** Both already ship AI tagging. The scope
  here is deliberately narrow enough to implement well and evaluate honestly.

## 6. MVP Scope

### 6.1 In Scope

- CRUD over Task with text, due date, Project, notes (FR-1 – FR-5).
- Deterministic offline parsing of simple date words — `today`, `tomorrow`, weekday names,
  `next week` — from task text into the due date, shown on the Task and editable (FR-23).
- Rule Engine producing Tags, Priority, Summary, always available (FR-7).
- Model Engine via Claude API, opt-in, with automatic fallback on every failure (FR-9).
- Per-part accept / edit / reject review, with "Accept all", "Reject all", and undo, on phone and
  desktop (FR-10).
- An explicit "Suggest again" action for a fresh Suggestion (FR-22).
- Engine attribution and Settings disclosure (FR-11).
- Smart Lists by due window, Priority, and Tag (FR-12 – FR-14).
- Archiving with a configurable retention window, default 30 days (FR-16).
- API Key entry and standalone Cloud Suggestions consent (FR-17, FR-18).
- Committed Fixture plus an accuracy harness covering both engines (FR-19 – FR-21).
- **Automated tests for every Model Engine fallback path, against a mocked Claude API, runnable
  with no API Key and no network (NFR-8).**
- **A written record of the suggestion-engine decision — rationale, privacy trade-offs, and the
  FR-21 engine comparison results — in the README or a document it links (NFR-9).**
- Responsive single app across phone, tablet, desktop, and web; installable PWA; offline-capable.
- A README that takes a fresh clone to a running app with no API Key.

### 6.2 Out of Scope for MVP

- Accounts, cloud sync, list sharing — deferred to a later phase; see the brief's *Vision*.
- Notifications and reminders.
- Native mobile or desktop packaging.
- Payments.
- A local in-browser AI model. Research found a live, unfixed ONNX Runtime Web / Safari WebGPU
  crash and recommended against it for v1; the tracked issues are in `addendum.md`.
- Suggested due dates and suggested next actions — the review model extends there later, not now.
- Multi-device storage, export, or import. `[NOTE FOR PM]` A JSON export is cheap and would
  partially offset "your data is trapped in one browser." Revisit only if the schedule frees up.

## 7. Success Metrics

The Fixture (FR-19) is the measuring instrument for everything below. No accuracy target is
quoted from research: its only numeric accuracy comparison comes from an unverified secondary
source whose full paper could not be accessed, and measured a different domain, while its
better-sourced peer-reviewed study found rule-based and ML approaches win on *different* inputs
rather than one dominating. Targets are therefore set locally, from a first measured run, rather
than borrowed.

**Primary**

- **SM-1: Rule Engine correctness on the Fixture.** Per-field accuracy — Tags, Priority, Smart
  List placement — measured by FR-20. Target: baseline on first run, then no regression; the
  committed number becomes the bar. Validates FR-7, FR-15, FR-20.
- **SM-2: Grader runnability.** A fresh clone reaches a working app exercising every graded
  capability with no API Key, no account, and no network. Target: binary pass, verified by
  following the README on a clean machine. Validates FR-7, FR-9, FR-17, UJ-3.
- **SM-3: Engine comparison exists.** A committed result showing where the Model Engine beats
  the Rule Engine on the Fixture and where it does not. Target: both engines measured, findings
  written down with the ambiguous cases called out. Validates FR-21.

**Secondary**

- **SM-4: Capture is never blocked.** Task creation completes within one interaction with the
  Suggestion Engine offline, slow, or absent. Validates FR-1, FR-8.
- **SM-5: Builder's own usage.** The builder uses the app for real tasks through the build period
  and does not revert to another list. The honest signal for a personal tool; not graded.

**Counter-metrics (do not optimize)**

- **SM-C1: Suggestion acceptance rate.** Must *not* be driven up. A high acceptance rate is
  equally consistent with good Suggestions and with a review UI that makes Accept the path of
  least resistance. Counterbalances SM-1 and SM-3.
- **SM-C2: Fixture size and difficulty.** Must not shrink, and must not drift toward easy cases
  to make SM-1 look better. The Fixture's ambiguous entries are the ones with diagnostic value.
  Counterbalances SM-1.
- **SM-C3: Model Engine usage share.** Not a goal. The Rule Engine serving most Suggestions is a
  success, not a shortfall — it is the path that always works. Counterbalances SM-3.

## 8. Constraints and Guardrails

**Privacy**

- Task data is local by default and no Task text leaves the device unless Cloud Suggestions is
  explicitly on (FR-18).
- When the Model Engine is used, what is disclosed to the user must be accurate: the request goes
  to Anthropic's API under the user's own key. Anthropic's published policy for API traffic —
  inputs and outputs not used for training by default, deleted within 30 days — is the
  strongest-sourced claim in the research and is the basis of the disclosure. Exact wording and
  citation in `addendum.md`.
- There is no analytics, telemetry, crash reporting, or third-party script in v1.

**Cost**

- Model Engine spend is bounded by design: one call per Task capture, small inputs, lowest effort
  setting, and an opt-in gate. At published Haiku 5.5 rates a Suggestion costs roughly
  $0.00005–0.0001, i.e. **about half a cent to a cent per hundred Tasks**; the figures and their
  source are in `addendum.md`.
- The user supplies their own API Key, so the project itself incurs no API cost, and the grader
  incurs none at all.
- No batching, caching, or spend-cap machinery in v1 — at this volume it would be unjustified
  complexity.

**Grader runnability (hard constraint)**

- No API Key, no account, no network, and no backend may be required to run any graded capability.
- Secrets never enter the repository. The repo ships an example environment file and a
  `.gitignore` that excludes real ones; the Fixture's location is documented. Repo tidiness was
  the one outright gap in course review and is graded.

**Solo-build constraint**

- One builder, with a deadline in the second week of December 2026, and a required path of
  PRD → architecture → epics and stories → build → test → fix → README with room for several
  iterations. Any scope addition must displace something, not stack on top. This is why §5 is
  as firm as it is.

## 9. Platform

- One responsive web application, installable as a PWA, covering phone, tablet, desktop, and
  browser. No separate codebase per surface.
- Storage is browser-local. **Deferred to architecture (confirmed 2026-11-01).** That storage is
  browser-local is decided and not open. Which API — `localStorage` or IndexedDB — is chosen in
  `bmad-architecture`, weighing size limits against the cost of querying Smart Lists. This is a
  deliberate deferral to the stage that owns the decision, not an unresolved question.
- Offline-capable: all of FR-1 – FR-5, FR-7, FR-10, FR-12 – FR-16, FR-22 and FR-23 work with no
  network.
- The Model Engine calls the Claude API directly from the browser, which the API permits only
  under an explicit opt-in header. Mechanism, header name, and the key-exposure consequence are
  in `addendum.md`; the user-facing consequence is FR-18's disclosure.

## 10. Cross-Cutting NFRs

- **NFR-1 — Capture latency.** Creating a Task is never gated on the Suggestion Engine (FR-8).
  The Task is visible in the list in one interaction.
- **NFR-2 — Model Engine timeout.** The Model Engine has a hard timeout, after which the Rule
  Engine serves the Suggestion. The number is deliberately not fixed in this PRD: the research's
  two latency sources disagree by an order of magnitude (§12 OQ-1), and no single value is
  defensible before measurement. **Confirmed 2026-11-01: the value is set from the OQ-1 latency
  measurement before the Model Engine is implemented.** Note that FR-8 keeps this off the critical
  path — because capture never waits on a Suggestion, the timeout governs only how long a pending
  Suggestion stays pending, and never delays the user's capture.
- **NFR-3 — Offline correctness.** With no network, the app is fully functional; no view shows an
  error, spinner, or empty state attributable to the missing network.
- **NFR-4 — Responsive and operable.** Every flow, and specifically the accept/edit/reject
  interaction of FR-10, is usable on a phone-sized viewport and on a desktop viewport. Course
  review calls for this to be demonstrated on both, so it is a requirement and not a nicety.
- **NFR-5 — Determinism of the Rule Engine.** Same input, same Suggestion, always (FR-7). This is
  what makes FR-20 a test rather than an observation.
- **NFR-6 — No missing Suggestion.** Every Model Engine failure results in a Rule Engine
  Suggestion (FR-9). A Suggestion is never missing, and no error, popup, banner, or interrupted
  flow ever appears in capture or review. The one permitted exception is informational and lives
  outside that flow: after a *persistent* failure, Settings may show the plain status described in
  FR-11. Explaining a dead key in Settings is not a failure surfacing in the product — it is the
  product being honest in the one place the user went looking.
- **NFR-7 — Reproducible from a clean clone.** The README takes a fresh clone to a running app;
  the harness of FR-20 runs from the same clean state.
- **NFR-8 — Every fallback path is covered by automated tests against a mocked Claude API.** Each
  failure mode enumerated in FR-9 — no API Key, invalid API Key, offline, timeout, rate limit,
  exhausted credit or quota, and other API error — has a test asserting that a Rule Engine
  Suggestion is produced and no user-facing error appears. The Model Engine is mocked, so the
  entire suite runs with **no API Key and no network**, including in CI and on a grader's machine.
  The instructor feedback rated dependency cost and test mode a risk and asked specifically for a
  plan for "testmodus eller mock-data"; this is it. Contributes to the 15% QA weighting (§11).
- **NFR-9 — The AI decision is documented in the deliverable.** The README, or a document it
  links, explains in prose: that the Suggestion Engine has a rule-based and a model-based
  implementation, why that choice was made over rules-only and over a local in-browser model, the
  privacy trade-off of sending Task text to a third party and how consent is handled, and the
  measured FR-21 comparison results. This is a required deliverable, not a courtesy: the brief
  lists "documentation of the AI approach" among its success criteria, and the feedback asks twice
  for the reasoning to be written down ("Skriv ned begrunnelsen"), calling it "godt
  prosessmateriale" for the 30% process weighting (§11).
- **NFR-10 — Date-dependent behavior is tested against a fixed date, never the system clock.**
  Every date-dependent test — FR-23's parsing, FR-12's due-window placement, FR-15's Fixture
  placement assertions, FR-16's archive window — and the FR-20/FR-21 harness runs against an
  injected reference "today" rather than reading the clock. The Fixture file records that
  reference date (FR-19). Consequence: the suite produces identical results on any day, in any
  time zone, on any machine, including a grader's. Without this, a Fixture entry expecting "Due
  this week" would pass or fail depending on what day it was run, which would make SM-1's
  no-regression bar meaningless and would eventually waste someone's afternoon.

## 11. Grading Alignment

Unusually for a PRD, the deliverable is graded on a published weighted rubric, and the weights do
not match a normal product's priorities. Recorded here because it governs trade-offs everywhere
above: when something has to give, this is the order to protect.

| Weight | Dimension | Where this PRD serves it |
|---:|---|---|
| 30% | Process and AI-steering | NFR-9 written AI-decision record; FR-21 engine comparison; this PRD and its memlog; brief → PRD → code traceability |
| 20% | Functionality and scope | §4 FR-1 – FR-23 |
| 15% | QA and testing | FR-15, FR-19 – FR-21, NFR-8 mocked-API fallback tests, NFR-10 fixed test date, SM-1 |
| 10% | Design | NFR-4, UJ-1 – UJ-4 |
| 10% | Code and architecture | Deferred to `bmad-architecture` |
| 10% | README and runnability | SM-2, NFR-7, §8 grader constraint |
| 5% | Repo tidiness | §8 grader constraint |

The project is rated "Enkel" difficulty, and difficulty counts. The instructor's guidance is that
a simple project compensates through execution — worked-through design, thorough testing of the
Suggestion Engine and Smart Lists, documented process, and a README that works. The Model Engine
is the one sanctioned difficulty uplift, taken in place of sync. Note what follows: adding
features is *not* the lever here. Depth on what is already specified is.

## 12. Open Questions

1. **OQ-1 — What is the Model Engine's real latency?** Research sources disagree by an order of
   magnitude (roughly 0.7–1.0s versus 9.6–13.4s to first token) and it reports this as genuinely
   disputed rather than averaging it. The confirmed mechanism is that effort/reasoning settings
   can move latency by 10–100×, and Haiku 5.5's default effort is not the lowest available.
   **Action:** time a real call at lowest effort with a real key — research estimates under an
   hour. **Blocks:** NFR-2's timeout value, the pending-state UX in FR-8, and **the provider
   choice itself.** Claude Haiku 5.5 is planned, but only confirmed by this measurement; if its
   real latency at lowest effort is unacceptable, OpenAI's cheapest nano-tier model is the
   fallback provider behind the same Suggestion Engine interface (§4.2) — research rates it
   essentially tied on cost and privacy, with cleaner latency evidence. Its exact model name is
   churning and must be re-checked at implementation, not taken from the research. This is the
   single highest-value open question.
2. **OQ-2 — Can thinking be turned off on this model, and does it matter for latency?** Bears
   directly on OQ-1. Resolvable from the Models API capability flags during the same spike.
3. **OQ-3 — Free credit and rate limits.** Research's figures (~$5, SMS-verified, ~14-day expiry,
   low initial requests-per-minute) are low-confidence aggregator values that appear on no
   official page. **Action:** confirm in the Anthropic console before writing any API Key setup
   instructions into the README. Published per-token pricing is separately verified and is not in
   question.
4. **OQ-4 — Where does the API Key live, and what does `.env.example` mean here?** Course review
   asks for a `.env.example`, but with no backend the API Key is entered at runtime and stored on
   device, so there may be no build-time environment variable to exemplify. Resolve in
   architecture: either the example file documents a dev-only path, or the README documents the
   runtime Settings flow instead and the example file covers whatever configuration does exist.
5. **OQ-5 — Due-date parsing. RESOLVED 2026-11-01 — see FR-23.** The question was how much
   natural-language date parsing v1 should attempt. Answer: **simple date words only** — `today`,
   `tomorrow`, the seven weekday names, and `next week` — parsed deterministically and offline,
   with the result shown on the Task and editable. Anything beyond that vocabulary is **out of
   v1**: no month names, no numeric dates, no relative arithmetic, no natural-language date
   library. The research found no library recommendation and no grammar, which is a reason to keep
   the surface small rather than to defer the decision. Remaining work is implementation, not
   decision-making.
6. **OQ-6 — Baseline accuracy is unknown until measured.** SM-1 has no number yet by design.
   First Fixture run sets it. Until then, "is the Rule Engine good enough?" is formally open.
7. **OQ-7 — Research red-team pass never ran.** The suggestion-engine research recommends
   re-running itself at higher validation before its verdict is committed. The verdict is
   committed here anyway, on the grounds that the Rule Engine is independently sanctioned and the
   Model Engine is additive and reversible. Recorded as accepted risk rather than silently dropped.
8. **OQ-8 — Storage mechanism.** See §9. Deferred to architecture.

## 13. Decisions and Assumptions Index

Every judgment that was once an open inference, with its status. Nothing below is still waiting on
an answer: each item is either **confirmed** by the builder on 2026-11-01, or **deferred** to a
named stage that owns it.

| # | Where | Decision | Status |
|---|---|---|---|
| 1 | §2.3 | The four User Journeys, with a protagonist modelled on the builder's own use, are the journeys UX builds on | **Confirmed 2026-11-01** |
| 2 | §4.1 FR-23 | v1 parses a fixed, small vocabulary of date words (`today`, `tomorrow`, weekday names, `next week`) from task text into the due date, deterministically and offline; anything beyond it is out of v1. Resolves OQ-5 and makes UJ-1 work end to end | **Confirmed 2026-11-01** |
| 3 | §4.2 FR-7 | The Rule Engine's Summary is a cleaned-up truncation of the Task text, not real summarization. No rule-based summarization approach appears anywhere in the research; this is the honest on-device option, and it makes Summary the field where the Model Engine should most visibly win in FR-21 | **Confirmed 2026-11-01** |
| 4 | §4.2 FR-8 | Task capture is asynchronous with respect to the Suggestion — capture never waits, because Model Engine latency is unresolved (OQ-1) and could reach ~13s | **Confirmed 2026-11-01** |
| 5 | §4.2 FR-9, FR-11; §10 NFR-6 | The failure-mode list, and the split between transient failures (fully silent) and persistent ones (silent in the flow, explained in Settings). This PRD's own decision — the research does not address failure modes, and the brief requires only that the Rule Engine be the automatic fallback | **Confirmed 2026-11-01** |
| 6 | §4.5 FR-18 | The consent mechanism: a dedicated Cloud Suggestions setting, off by default even when a key is present, disclosure shown before it can be enabled, and key-entry separate from consent. The brief establishes that cloud use is opt-in but not how | **Confirmed 2026-11-01** |
| 7 | §10 NFR-10; FR-19 | All date-dependent behavior and the Fixture harness are tested against a fixed injected reference date recorded in the Fixture, never the system clock, so results are identical on any day and machine | **Confirmed 2026-11-01** |
| 8 | §10 NFR-2 | The Model Engine timeout value is set from the OQ-1 latency measurement before the Model Engine is implemented. FR-8 keeps it off the capture path either way | **Confirmed 2026-11-01** |
| 9 | §0, §8 | Deadline is the second week of December 2026, matching the brief. An older planning log said end of November; stale and superseded | **Confirmed 2026-11-01** |
| 10 | §9, OQ-8 | Storage is browser-local — decided. The specific API (`localStorage` vs IndexedDB) is chosen in `bmad-architecture`, weighing size limits against Smart List querying | **Deferred to architecture, confirmed 2026-11-01** |
| 11 | §4.2, OQ-1 | Claude Haiku 5.5 is the planned provider; confirmed only after the OQ-1 latency spike, with OpenAI as the fallback provider behind the same interface | **Deferred to the OQ-1 spike** |
| 12 | OQ-4 | Where the API Key lives and what `.env.example` means with no backend | **Deferred to architecture** |

Items 11 and 12 remain genuinely open and are tracked as open questions in §12 rather than as
assumptions; they are listed here so the index is a complete picture of what is settled and what
is not.
