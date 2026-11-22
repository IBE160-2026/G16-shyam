---
title: To-Do-List
status: draft
created: 2026-10-31
updated: 2026-11-22
---
# PRD: To-Do-List

## 0. Document Purpose

This PRD is the implementable specification for To-Do-List, the solo project for IBE160 (Programmering
med KI) at Høgskolen i Molde, due the second week of December 2026. It is written for the builder and for
the downstream BMad workflows that consume it. It builds on, and does not repeat,
`briefs/brief-To-Do-List-2026-09-08/brief.md` and
`research/technical-suggestion-engine-selection-2026-10-28/research.md` under
`.docs/planning-artifacts/`. Mechanism, pricing and rejected alternatives sit in `addendum.md`, and §13
indexes every decision with the rationale not repeated inline.

One item remains open: **OQ-1** (Model Engine latency, which also confirms the provider). **OQ-4**
(the API Key and `.env.example` with no backend) and **OQ-8** (the storage mechanism) were resolved in
architecture on 2026-11-18 and are recorded in §12. The status stays `draft` until OQ-1 is measured.

## 1. Vision

To-Do-List is a task manager that does the organizing for you and then asks permission. You type a task
the way you would say it out loud — "email the group about Thursday's meeting" — and the app proposes the
structure you would otherwise add by hand: a set of Tags, a Priority, and a one-line Summary. Nothing is
filed until you accept it. You can edit the proposal, or throw it away and keep the raw task.

The product exists because the overhead of keeping a list well-organized routinely exceeds the overhead
of just remembering things, which is when obligations get dropped. The answer is not more fields to fill
in; it is a list that arrives pre-sorted and stays trustworthy because the user approved every piece of
structure in it. It runs entirely on one device — tasks in browser storage, no account, no network — a
hard requirement of the deliverable that shapes §4.2 and §8.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** capture a task in one sentence without stopping to categorize it and still end up with
  a categorized list; see what matters today without having built or maintained any views.
- **Emotional:** trust the list. A half-organized list is worse than none, because you stop believing it.
- **Contextual:** work across school, a group project, a part-time job and personal life without those
  contexts bleeding into one pile. These four are what FR-7's tag set is built from.
- **Builder's own job:** demonstrate a practical, well-tested application of an AI model and show *why*
  each AI decision was made — weighted above feature count (30%, §11).

### 2.2 Non-Users (v1)

Anyone whose core need is a shared list, a reminder, or their data on a second device — all three are out
(§5, §9).

### 2.3 Key User Journeys

> The protagonist is modeled on the builder's own use. These are the journeys UX builds on.

- **UJ-1. Shyam dumps a task between classes and never opens a menu.** Phone browser, installed PWA, no
  login. He types "Submit assignment in IBE160 Friday"; the Task saves immediately; a Suggestion then
  proposes Tags `[school]`, Priority `high` and a Summary; he taps **Punch all**. The Task is filed under
  `school`, shows as high Priority and appears in "Due this week" — structure he never added.

  - **Edge case:** if only Priority is wrong, he accepts Tags and Summary and on Priority alone taps Edit,
    sets `high`, saves — one wrong field costs one correction, not a rejected Suggestion. Undo reverses
    an acceptance made by reflex.
- **UJ-2. Shyam opens the app cold and trusts what he sees.** Monday morning, offline on the tram. The
  default view shows "Due this week", "Need Attention" and "High priority" populated from existing Tasks;
  he opens one to read its notes. He knows what matters today without having filed anything or built a
  view. No sync indicator, no spinner, no empty state.
- **UJ-3. A grader runs the app with no API key and sees the AI feature work.** Fresh clone, no Anthropic
  account, no configuration. Following the README they create a Task and a Rule Engine Suggestion appears.
  They accept the proposed Tags, then edit the proposed Priority and save it, seeing each field land
  independently; Settings says plainly that no API Key is configured. "AI proposes, human disposes" is
  visible in the interaction, and the harness (§4.6) reports accuracy without a key.
- **UJ-4. Shyam brings his own key and the Model Engine takes over.** Desktop browser. He saves his own
  Anthropic API Key; the Cloud Suggestions control appears beside the key field, still off, with the
  disclosure (FR-17, FR-18). He turns it on and the next Suggestion is attributed to the Model Engine
  (FR-11), so he observes the comparison in use, not only in harness output. Capture feels the same,
  having never waited on the Suggestion (FR-8).

  - **Edge case:** weeks later his credit runs out. Suggestions keep arriving with no error and no
    interruption, served by the Rule Engine again (FR-9); Settings explains why when he next opens it.

## 3. Glossary

- **Task** — the core entity. Fields: task text, due date, Project, notes, Tags, Priority, Summary,
  completion date (all but task text optional). Zero or more Tags, one Priority, at most one Summary.
  **Completed state and archived state are derived from the completion date, not stored** — the
  architecture decision of 2026-11-18, recorded as §13 item 17, which is what makes FR-16's
  re-evaluation on a changed retention window free.
- **task text** — the user's own typed sentence. Never rewritten by the app (FR-23).
- **Tag** — a short label categorizing a Task; a Task may have several. The Rule Engine proposes only the
  four Tags fixed in FR-7; the user may add any Tag by hand (FR-3).
- **Priority** — exactly one of `high`, `medium`, `low` on every Task. `medium` is the default.
- **Summary** — a one-line restatement of a Task's task text, at most one per Task.
- **Suggestion** — a proposed set of Tags, Priority and Summary for one Task, not yet applied; its three
  parts are reviewed independently (FR-10).
- **Suggestion Engine** — the component producing a Suggestion. Two implementations, one interface, one
  output shape.
- **Rule Engine** — the keyword implementation. On device, no network, no API Key, always present (FR-7).
- **Model Engine** — the Anthropic API implementation, used only with an API Key configured and Cloud
  Suggestions enabled (§4.2).
- **API Key** — a user-supplied Anthropic API key, stored on device, never committed (§4.2).
- **Cloud Suggestions** — the setting governing whether task text may be sent to the Anthropic API. Off
  until explicitly turned on (FR-18).
- **Smart List** — a view of Tasks derived automatically from Task fields, never hand-maintained.
- **Need Attention** — the Smart List of Tasks whose due date is past and which are not completed
  (FR-12). Named so FR-15 can assert placement into it.
- **Project** — a user-named grouping a Task may belong to. Assigned, not derived.
- **Archive** — the state a completed Task enters after the retention window, removing it from default
  views without deleting it.
- **Fixture** — the committed 10–15 example Tasks with expected Tags, Priority, parsed due date and Smart
  List placement, plus the fixed reference date they are relative to (FR-19).

## 4. Features

FR IDs are globally unique and stable: FR-22 and FR-23 were appended rather than inserted, so earlier
numbers never shifted. Each section reads in ascending ID order, but the global sequence skips — FR-23
belongs to §4.1 and FR-22 to §4.2.

### 4.1 Task Management

Full CRUD, local to the device; a Task needs only task text. Realizes UJ-1, UJ-2.

#### FR-1: Create a Task from task text alone

The user can create a Task by entering task text and nothing else.

**Testable:**

- It persists with Priority `medium`, no Tags and no Summary, and is readable after a full page reload and
  after the browser is closed and reopened.
- Creation needs no network and does not block on the Suggestion Engine (FR-8).

#### FR-2: Read Tasks

The user can see all non-archived Tasks, and open one to see every field.

**Testable:**

- The default view excludes archived Tasks and includes completed-but-unarchived ones.
- Every field in §3's Task definition is visible on the detail view.

#### FR-3: Update a Task

The user can edit task text, due date, Project, notes, Tags, Priority and Summary.

**Testable:**

- Each field changes independently and persists across reload.
- Editing a field that came from an accepted Suggestion overwrites it without re-triggering the
  Suggestion Engine.

#### FR-4: Delete a Task

The user can permanently delete a Task.

**Testable:**

- A deleted Task is absent from all views and storage after reload.
- Deletion is distinct from completion and Archive.

#### FR-5: Complete a Task

The user can mark a Task complete and can un-complete it.

**Testable:**

- A completed Task leaves active Smart Lists at once and stays retrievable until archived.

#### FR-23: Parse simple date words from task text into the due date

At capture, the system recognizes a small fixed set of date words in the task text and sets the due date
from them, deterministically and offline. The parsed date is **not** part of a Suggestion and skips
FR-10's review: it is applied directly and editable at once (§13 item 2).

**Recognized vocabulary (the whole of it):** `today`, `tomorrow`, the five weekday names `Monday` to
`Friday` written out in full, and `next week`. Nothing else — no weekend day, no month names, no numeric
dates, no "in three days", no relative arithmetic.

**Testable:**

- Matching is case-insensitive, needs no network, and is deterministic: same text and reference date,
  same due date (NFR-10).
- `today` → the reference date; `tomorrow` → the next day; `next week` → the Monday of the following week,
  consistent with FR-12's week definition.
- **A weekday name resolves to the next occurrence of that day. If the reference date is itself that
  weekday, it resolves to the reference date, not a week later.**
- **Only `Monday` to `Friday` are recognized, and only written in full.** `Saturday`, `Sunday` and
  abbreviations (`mon`, `tue`, `fri`, …) are all outside the vocabulary: they set no due date and raise no
  error.
- **Date words match as whole words only:** "Mondays" does not match `monday`.
- With more than one recognized date expression, the **first** wins.
- No recognized date word, and an unrecognized date-like phrase ("end of month", "15 March"), both leave
  the due date empty: nothing guessed, no error, Task still created (FR-1).
- A parsed due date is displayed and editable through FR-3; the text is never rewritten.
- Parsing is independent of the Suggestion Engine and identical under either implementation.
- **The vocabulary is English only.** `fredag`, `i morgen` and `neste uke` set no due date (§6.2).

### 4.2 Suggestion Engine

This section resolves the brief's one open decision. v1 ships **both** implementations behind a single
interface: the Rule Engine always, the Model Engine as an opt-in upgrade when the user supplies an API
Key. The Rule Engine is not a degraded mode — it is the guaranteed path, and the only one a grader
exercises by default.

**Why this shape is sanctioned.** The instructor feedback of 2026-10-06 leaves the choice open, rates the
Rule Engine *"svært godt egnet for automatiske tester"*, and names this shape as the lift to take
*instead of* sync: *"velg heller én valgfri språkmodell for sammendrag og tagger, med regelmotoren som
automatisk reserve."* Sync was cut on that same advice, so the Model Engine replaces removed scope rather
than stacking on top. One correction: "may not clear that bar on its own" is the brief's verdict on a
rules-only classifier, not the instructor's, though `research.md` attributes it there — so rules-only
stays a legitimate v1 (§6.3) and the Model Engine is an uplift, not a necessity.

**Provider.** Claude Haiku 5.5 is planned, **confirmed only after the OQ-1 latency spike**. If measured
latency at lowest effort is unacceptable, **OpenAI's cheapest nano-tier model is the fallback** behind the
same interface; its model name churns and must be re-checked at implementation. A switch changes no
requirement and no NFR — only the provider *name* and the four places depending on it: §3's **Model
Engine** and **API Key** entries, FR-18's disclosure, §8's privacy basis, §9's browser-access mechanism.
That blast radius is why the interface is worth having.

Realizes UJ-1, UJ-3.

#### FR-6: Produce a Suggestion for a Task

The Suggestion Engine produces a Suggestion — Tags, Priority and Summary — from a Task's task text and due
date.

**Testable:**

- The output shape is identical whichever implementation ran: same fields, same types, Priority always one
  of `high`, `medium`, `low`.
- A Suggestion is never applied to a Task without passing through FR-10.

#### FR-7: Rule Engine is always available, with fixed rules

The Rule Engine produces a Suggestion with no API Key, no network and no configuration. Its rules are
fixed here rather than left to implementation, because FR-19 cannot otherwise state expected Tags.

**Tag set (the whole of it):** `school`, `group`, `work`, `personal`. The Rule Engine proposes no other
Tag, and these are the only values FR-19's expected Tags may use.

| Tag          | Keywords                                                           |
| ------------ | ------------------------------------------------------------------ |
| `school`   | assignment, exam, lecture, course, study, homework, submit, IBE160 |
| `group`    | group, meeting, team, presentation, classmate                      |
| `work`     | shift, work, boss, invoice, timesheet, customer                    |
| `personal` | buy, call, doctor, rent, gym, birthday, clean, pay                 |

| Priority | Keywords                                                              |
| -------- | --------------------------------------------------------------------- |
| `high` | urgent, asap, deadline, due, exam, submit, important, today, tomorrow |
| `low`  | someday, maybe, eventually, sometime, whenever, later, optional       |

**Matching rules:**

- Keywords match as whole words, case-insensitively, against the task text.
- **Tags:** every Tag with at least one keyword match is proposed, in table order — so a Task can be
  proposed more than one Tag.
- **Priority:** any `high` keyword → `high`; else any `low` keyword → `low`; else `medium`. `high` beats
  `low` when both fire.
- **No match at all → Tags `[]` and Priority `medium`.** A valid expected outcome, not a failure; the
  Fixture contains at least one such entry (FR-19).
- `today` and `tomorrow` sit in both this table and FR-23's vocabulary and do both jobs — due date parsed
  from them, Priority raised by them — since FR-23 never rewrites the task text.

**Worked example (runnable as a test):** reference date **Monday 2026-11-16**, task text *"Submit
assignment in IBE160 Friday"* → Tags `[school]` (`submit`, `assignment`, `IBE160`), Priority `high`
(`submit`), due date **2026-11-20** (the next Friday). This is the instructor's example translated
(§6.2) and the same text UJ-1 narrates. The reference date is deliberately **not** a Friday, so this
example exercises FR-23's ordinary next-occurrence rule; the resolve-to-the-reference-date edge case is
carried by its own Fixture entry (FR-19). Task text with no keyword and no date word — *"Figure out the
thing"* → Tags `[]`, Priority `medium`, no due date.

**Testable:**

- With no API Key configured, creating a Task still yields a Suggestion; with the device offline, the same.
- The Rule Engine is a pure function of task text and due date: same input, same Suggestion, every time.
- The Summary is a cleaned-up, truncated restatement of the task text, not true summarization (§13 item 3).
- **The keyword tables are English only.** Norwegian task text (`skole`, `viktig`, `innlevering`) does not
  match and falls through to Tags `[]` and Priority `medium` — a scope boundary, not a bug (§6.2).
- Accuracy against the Fixture is measured and reported by FR-20.

#### FR-8: Suggestion never blocks capture

A Task is saved and visible before its Suggestion exists; the Suggestion arrives afterward and attaches to
the saved Task.

**Testable:**

- **The Task appears in the list before the next user action, and no later than 100 ms after submit**
  (measured with the Suggestion Engine excluded), regardless of Suggestion Engine state.
- While a Suggestion is pending, the Task shows a pending indicator and remains fully editable.
- If the Suggestion never arrives, the Task is unaffected and keeps its defaults.

#### FR-9: Model Engine is used only when permitted, and falls back silently

When an API Key is configured **and** Cloud Suggestions is on, the Model Engine is attempted first; on any
failure the Rule Engine produces the Suggestion instead. The two kinds of failure differ only in whether
Settings explains them (§13 item 5).

**Testable:**

- *Not attempted at all:* no API Key → not attempted, no network request made. Cloud Suggestions off →
  not attempted even with a key present.
- *Transient failures — fully silent:* offline, timeout, rate limit, any other temporary API error. Each
  produces a Rule Engine Suggestion with no user-facing failure state anywhere, in the flow or in
  Settings; nothing is recorded that would make Settings call the Model Engine unavailable, and the next
  capture attempts it again.
- *Persistent failures — silent in the flow, surfaced in Settings:* invalid API Key, exhausted credit or
  quota, and **an organization that forbids browser calls outright**. The third is not a key fault: an
  account under zero data retention or using the Compliance API returns `401 authentication_error` with
  *"CORS requests are not allowed for this Organization"* on a **valid** key, and the restriction is
  inherited from a parent Claude Enterprise organization. No retry, and no second key from the same
  organization, will clear it — for such a user the Rule Engine is simply the permanent path
  (`addendum.md` §1.2). Each of the three produces a Rule Engine Suggestion with **no error, popup or
  interruption in the capture or review flow** — identical in-flow behavior to a transient failure — and
  Settings then shows a plain status explaining it (FR-11), the only place it is visible.
- *Both kinds:* fallback is automatic; the user can tell which implementation produced a Suggestion
  (FR-11); every failure mode has an automated test against a mocked API (NFR-8).

#### FR-10: Review each part of a Suggestion independently

The user accepts, edits or rejects the Suggestion's Tags, its Priority and its Summary **separately**, and
can undo an acceptance. The brief requires the three to be "each individually reviewable", and the
instructor puts it as *"hvert forslag til tagger, prioritet og sammendrag vises og kan godtas, endres
eller avvises"* — per part, not per Suggestion.

**Testable:**

- Each of Tags, Priority and Summary can be accepted, edited or rejected without affecting the other two,
  in any combination.
- Accepting a part writes only that part, the others keeping their prior values until acted on; editing
  applies the edited value rather than the proposed one; rejecting leaves the field as it was and does not
  reapply that part later.
- **Accepting is reversible: immediately after accepting a part, the user can undo it, restoring that
  field's prior value.** A single-step undo is sufficient for v1 — no history, no stack, none across
  sessions — and satisfies the brief's "visible, reversible choice."
- "Accept all" applies all three parts in one action and "Reject all" dismisses all three; both are
  shortcuts for the per-part actions and add no behavior those lack. Undo after "Accept all" restores all
  three fields. **Their interface labels are "Punch all" and "Strike all"** (`DESIGN.md`,
  `EXPERIENCE.md`); the UX documents own the words, this requirement owns the behavior — the same split
  AD-9 makes for Smart List labels. **Strike is exactly as reachable as Punch** (SM-C1, `EXPERIENCE.md`'s
  acceptance-rate guard). Both are Tier 1 (§6.3).
- No part is applied without an explicit accept or edit of it, and a Suggestion with any part unreviewed
  stays visibly pending on the Task.
- The flow meets NFR-4's width requirement.

#### FR-11: Disclose which engine ran

The user can see whether a Suggestion came from the Rule Engine or the Model Engine, and can see the
current Suggestion Engine state in Settings.

**Testable:**

- Each Suggestion is attributed to one implementation in the review UI.
- Settings states plainly whether an API Key is configured and which implementation is active; with no key
  it says so without framing it as an error.
- **After a persistent failure (FR-9), Settings shows a plain, non-alarming status saying three things:**
  that the Model Engine is not being used, the reason — the API Key was rejected, its credit or quota is
  exhausted, or the key's organization does not permit browser calls at all — and that the Rule Engine is
  serving Suggestions normally.
- **The organization-policy reason is worded distinctly from a rejected key**, because the key is valid
  and nothing the user does to it will help. Reporting it as "rejected" would send them hunting for a
  fault that is not theirs; the status says the organization does not allow it and stops there.
- That status appears **only** in Settings: no popup, banner, toast or badge anywhere else. It clears once
  the cause is resolved, without the user dismissing anything.

#### FR-22: Request a fresh Suggestion

The user can explicitly ask for a new Suggestion for an existing Task via a "Suggest again" action. A
fresh Suggestion is never produced automatically.

**Testable:**

- Available after a Suggestion has been rejected in whole or in part, and after the Task's task text has
  been edited; available whichever implementation is active, and obeys FR-9's fallback rules.
- It produces a new Suggestion replacing the previous pending one, reviewed through FR-10 like any other.
- Editing task text does **not** itself trigger a new Suggestion — nothing re-runs the Suggestion Engine
  without the user asking (consistent with FR-3).
- Accepted values are not overwritten until the user accepts the new Suggestion's matching part.

**Feature-specific NFRs:** the Model Engine requests schema-constrained output, so a malformed Suggestion
never has to be parsed around, and runs at the lowest available effort setting (OQ-1).

### 4.3 Smart Lists

Derived views computed from Task fields on every render. No stored membership. Realizes UJ-2.

#### FR-12: Due-window Smart Lists

The system presents two Smart Lists grouping Tasks by due date window: **"Due this week"** and
**"Need Attention"** (§3). **"Current week" means Monday through Sunday inclusive, in the device's local
time zone** — fixed here so FR-15's assertions and FR-23's `next week` share one definition. The window
stays Monday-to-Sunday even though FR-23 parses no weekend day: a Sunday due date arrives by editing
(FR-3).

**Testable:**

- A Task due inside the current week appears in "Due this week": one due that Sunday appears, one due the
  next Monday does not.
- **A Task with a due date in the past and not completed appears in "Need Attention".**
- A completed Task, and a Task with no due date, appear in neither.

#### FR-13: Priority Smart List

The system presents a Smart List of Tasks at Priority `high`.

**Testable:**

- Setting Priority to `high` — by accepting a Suggestion or by editing — adds the Task immediately;
  completing it removes it immediately.

#### FR-14: Tag Smart Lists

The system presents a Smart List per Tag in use.

**Testable:**

- A Tag that no non-archived Task carries produces no Smart List.
- Accepting a Suggestion that adds a new Tag makes its Smart List available without a reload.

#### FR-15: Smart List placement is testable against the Fixture

Each Fixture entry's expected Smart List placement is asserted by the test suite.

**Testable:**

- Expected placement is drawn from the named Smart Lists: **"Due this week"**, **"Need Attention"**, "High
  priority", and one per FR-7 Tag.
- The suite fails if a Fixture Task lands in a different Smart List than expected, asserted against the
  Fixture's fixed reference date rather than the machine's clock (NFR-10).
- **"Need Attention" is not asserted from the Fixture, and that is deliberate.** Expected placements are
  the vocabulary of expected values, not a coverage requirement; "Need Attention" and FR-16's window are
  asserted by selector unit tests against an injected reference date (NFR-10, §13 item 26).

### 4.4 Archiving

Completed Tasks leave the view on a schedule rather than accumulating, without being destroyed.

#### FR-16: Archive completed Tasks after a retention window

A completed Task is archived once complete for longer than the retention window — 30 days by default,
user-configurable.

**Testable:**

- With the default setting, a Task completed 31 days ago is archived and absent from default views.
- Changing the window re-evaluates existing completed Tasks against the new value.
- An archived Task is still retrievable through an archive view and is not deleted.

### 4.5 Settings, API Key, and Consent

The only place task text can leave the device, so it carries the privacy posture.

#### FR-17: Supply and clear an API Key

The user can enter an API Key, see that one is stored, and clear it.

**Testable:**

- The API Key is stored on device only and survives reload.
- It is never written to the repository and is not present in any committed file.
- Clearing it returns the app to Rule-Engine-only operation with no further network requests.

#### FR-18: Cloud Suggestions is off until explicitly enabled

Task text is never sent off the device until the user turns Cloud Suggestions on, having been told what
that means.

**Testable:**

- Default state on first run is off, including when an API Key is already present.
- The consent control states, before being enabled, that task text will be sent to the **Anthropic API**,
  that the key is the user's own, and that the Rule Engine remains the fallback. If OQ-1 changes the
  provider this wording follows it (§4.2); what must be disclosed does not change.
- Turning it off stops all outbound requests immediately, and with it off no network request containing
  task text is issued under any code path.
- **Saving an API Key never enables Cloud Suggestions.** The moment a key is saved, Settings shows the
  control and its disclosure beside the key field, still off, hinting that it must be turned on first
  (§13 item 6; realizes UJ-4).
- Clearing and re-saving a key does not re-enable Cloud Suggestions if the user had turned it off.

### 4.6 Evaluation Fixture and Harness

The Fixture is a committed data file, not one buried in test code, because it does triple duty: success
criteria (§7), test input, and evidence of judging AI output.

#### FR-19: Fixture exists and is committed

A Fixture of 10–15 Tasks, each with expected Tags, expected Priority, expected parsed due date and
expected Smart List placement, is committed at a documented path named in the README.

**Testable:**

- At least 10 and at most 15 entries, each with all four expectations populated; "none" is a valid
  expected due date, not a blank.
- **Expected Tags use only FR-7's tag set**, with `[]` a valid value; expected Priority uses only `high`,
  `medium`, `low`. Every expectation is derivable by hand from FR-7's tables and FR-23's vocabulary, so it
  states what the rules *should* do, not what the code does.
- **The file records the fixed reference date all date expectations are relative to** (NFR-10):
  **Monday 2026-11-16** (§13 item 25). The date fixes four things the entries must match: the current
  week is **2026-11-16 to 2026-11-22** (FR-12), `today` → 2026-11-16, `tomorrow` → 2026-11-17,
  `next week` → 2026-11-23.
- **"Submit assignment in IBE160 Friday" is the ordinary next-occurrence case**, due 2026-11-20; the
  resolve-to-the-reference-date edge case needs its own entry naming **`Monday`**, expecting
  2026-11-16.
- Ambiguous entries are required as well as easy ones: keyword classifiers misjudge Priority on such
  text, and without them the Fixture cannot separate the engines (`addendum.md`).
- **Date coverage includes** one entry per recognized form in FR-23 (`today`, `tomorrow`, a `Monday`-to-
  `Friday` name, `next week`), plus one with no date word, one with an unrecognized phrase ("end of
  month"), one with an abbreviated weekday (`fri`), and one naming `Saturday` — the last four expecting
  no due date.
- **At least one entry has no keyword match at all**, expecting Tags `[]` and Priority `medium`, so FR-7's
  no-match rule is asserted rather than assumed.
- **At least one entry carries two recognized date words**, where the first wins — the second ambiguous
  date case alongside the `Monday` entry above.

#### FR-20: Harness measures Rule Engine accuracy against the Fixture

A command runs the Rule Engine over every Fixture entry and reports per-field accuracy.

**Prerequisite: FR-19.** The committed Fixture is this command's only input; built and committed before
FR-20, and before SM-1 can hold a number (§6.3, §7, §13 item 20).

**Testable:**

- The command runs with no API Key and no network.
- Output reports Tags, Priority, parsed due date and Smart List placement accuracy separately, not as one
  number; Summary is reported separately too and folded into no other field (SM-1).
- **It runs against the Fixture's fixed reference date, not the system clock** (NFR-10), and names which
  entries failed, so a failure is diagnosable rather than just a score.

#### FR-21: Harness can measure the Model Engine on the same Fixture

The same harness can run against the Model Engine when an API Key is supplied, producing a directly
comparable result.

**Testable:**

- Both engines' results are reported in the same format over the same Fixture.
- The Model Engine run is skipped with a clear message, not an error, when no API Key is present.

`[NOTE FOR PM]` FR-21 is the highest-value artifact for the 30% weighting (§11): the difference between
asserting the Model Engine is better and demonstrating where it is and is not. It is therefore the last
thing in Tier 2 to be cut (§6.3).

## 5. Non-Goals (Explicit)

- **Not a multi-user or shared-list product.** No accounts, sync, sharing, merge UI or conflict
  resolution. Review flagged this as the largest risk for a solo build — two applications, not one.
- **Not a reminder or notification product.** No push, scheduled alerts or email.
- **Not a natively packaged application.** One responsive web app; no store or desktop installer beyond
  PWA install.
- **Not a commerce product.** No payments, subscriptions or billing.
- **Not a general AI assistant.** The Model Engine does one job — propose Tags, Priority and Summary for
  one Task. No chat, no open-ended prompting, no agentic behavior.
- **Not trying to out-feature Todoist or TickTick.** Both already ship AI tagging; this scope is narrow
  enough to implement well and evaluate honestly.

## 6. MVP Scope

### 6.1 In Scope

v1 is FR-1 – FR-23 and NFR-1 – NFR-10, built in the order §6.3 fixes. **English only** — task text (FR-7's
keywords, FR-23's vocabulary), the interface, and the README, so every artifact a grader reads is in one
language. The session logs under `.logs/` stay Norwegian; they are the builder's own record, not a
deliverable (§13 items 10, 23).

### 6.2 Out of Scope for MVP

Everything in §5, plus these, deferred rather than rejected:

- A local in-browser AI model. Research found a live, unfixed ONNX Runtime Web / Safari WebGPU crash and
  recommended against it for v1 (`addendum.md`).
- **Norwegian task text**, which is why the instructor's example "Lever innlevering i IBE160 fredag"
  appears in the Fixture as **"Submit assignment in IBE160 Friday"** (UJ-1, FR-7). Adding it later is a
  keyword-map and vocabulary change behind the same interfaces.
- Suggested due dates and suggested next actions.
- Multi-device storage, export or import. `[NOTE FOR PM]` A JSON export is cheap and would offset "your
  data is trapped in one browser." Revisit only if the schedule frees up.

### 6.3 If the Schedule Compresses

One builder, one deadline. Epics and stories must not treat all 23 FRs as equally important, so the cut
order is fixed here rather than decided under pressure. Build in tier order; cut from the bottom.

- **Tier 1 — the deliverable is not viable without these.** FR-1 – FR-5, FR-7, FR-10 **including its
  "Accept all" / "Reject all" shortcuts** (moved from Tier 3, §13 item 19), FR-12 – FR-15, FR-19, FR-20,
  FR-23, and the README — a complete, gradeable app on its own, and rules-only is a legitimate v1
  (§4.2). **Two orderings inside this tier are fixed, not preferences:** FR-19 before FR-20 (the Fixture
  is the harness's only input, FR-20), and the README late enough to describe what was built but still
  inside the tier, never after it (NFR-7, NFR-9, SM-2).
- **Tier 2 — the difficulty uplift, in this order.** FR-9 (Model Engine with fallback), FR-17 and FR-18
  (key and consent), NFR-8 (mocked fallback tests), then **FR-21 last**, as the highest-value artifact for
  the 30% weighting (§11).
- **Tier 3 — cut these first.** Configurable retention in FR-16 (keep the fixed 30-day window), Project as
  a Task field, and FR-22 "Suggest again".

FR-6 and FR-8 sit inside Tier 1 (FR-7's interface, FR-1's capture behavior); FR-11 ships with Tier 2's
Model Engine, having nothing to disclose without it.

## 7. Success Metrics

The Fixture (FR-19) is the measuring instrument. No accuracy target is quoted from research, whose only
numeric comparison is unverified and from another domain; targets are set locally, from a first run.
**SM-1 and SM-3 therefore have FR-19 as a hard prerequisite** — until the Fixture is committed, neither
has an instrument and neither can hold a number (FR-20, §13 item 20).

**Primary**

- **SM-1: Rule Engine correctness on the Fixture.** Per-field accuracy — Tags, Priority, parsed due date,
  Smart List placement — measured by FR-20. Target: baseline on the first run, then no regression. **That
  run also commits a written minimum per field, with one sentence of justification per number**, so a weak
  first measurement cannot approve itself; the minimum is a floor: the suite fails if a field drops below
  it, independent of the no-regression bar (the numbers are OQ-6). **Summary is scored separately and
  folded into no other field** — a truncation, not a summarization (FR-7), so it must not drag the others
  down.
- **SM-2: Grader runnability.** A fresh clone reaches a working app exercising every graded capability with
  no API Key, no account and no network. Binary pass, verified on a clean machine (UJ-3).
- **SM-3: Engine comparison exists.** A committed result showing where the Model Engine beats the Rule
  Engine and where it does not, with the ambiguous cases called out (FR-21).

**Secondary**

- **SM-4: Capture is never blocked.** Task creation meets FR-8's 100 ms limit with the Suggestion Engine
  offline, slow or absent.
- **SM-5: Builder's own usage.** The builder does not revert to another list. Not graded.

**Counter-metrics (do not optimize)**

- **SM-C1: Suggestion acceptance rate.** Must *not* be driven up: a high rate is equally consistent with
  good Suggestions and with a review UI that makes Accept the path of least resistance.
- **SM-C2: Fixture size and difficulty.** Must not shrink or drift toward easy cases to flatter SM-1. The
  ambiguous entries are the ones with diagnostic value.
- **SM-C3: Model Engine usage share.** Not a goal. The Rule Engine serving most Suggestions is a success —
  it is the path that always works.

## 8. Constraints and Guardrails

**Privacy**

- Task data is local by default; no task text leaves the device unless Cloud Suggestions is on (FR-18).
- The disclosure must be accurate: the request goes to the Anthropic API under the user's own key. Its
  basis is Anthropic's published API policy — inputs and outputs not used for training by default, deleted
  within 30 days (citation in `addendum.md`); a provider change means re-sourcing it (§4.2).
- No analytics, telemetry, crash reporting or third-party script in v1.

**Cost**

- Spend is bounded by design: one call per capture, small inputs, lowest effort setting, opt-in gate — at
  published Haiku 5.5 rates, **about half a cent to a cent per hundred Tasks** (`addendum.md`).
- The user supplies their own API Key, so the project incurs no API cost and the grader none at all.
- No batching, caching or spend-cap machinery in v1 — at this volume, unjustified complexity.

**Grader runnability (hard constraint)**

- No API Key, account, network or backend may be required to run any graded capability.
- Secrets never enter the repository: it ships an example environment file and a `.gitignore` excluding
  real ones, and documents the Fixture's location. Repo tidiness was the one outright gap in review.

**Solo-build constraint**

- One builder, a deadline in the second week of December 2026, and a required path of PRD → architecture →
  epics and stories → build → test → fix → README. Any scope addition must displace something — hence
  §5's firmness and **§6.3's cut order, fixed in advance**.

## 9. Platform

- One responsive web application, installable as a PWA, covering phone, tablet, desktop and browser — no
  separate codebase per surface. Offline-capable: FR-1 – FR-5, FR-7, FR-10, FR-12 – FR-16, FR-22 and
  FR-23 all work with no network.
- Storage is browser-local — decided. The API is **`localStorage`**, behind a synchronous port, chosen in
  `bmad-architecture` on 2026-11-18 (OQ-8 resolved; see §12).
- The Model Engine calls the Anthropic API directly from the browser, which the API permits only under an
  explicit opt-in header — and, for some organizations, not even then: an account under zero data
  retention or the Compliance API is refused browser calls outright, which FR-9 carries as a persistent
  failure mode. The header name, the key-exposure consequence and that restriction are in `addendum.md`
  §1.2, all three confirmed against official documentation.

## 10. Cross-Cutting NFRs

- **NFR-1 — Capture latency.** Creating a Task is never gated on the Suggestion Engine; the limit is
  FR-8's 100 ms.
- **NFR-2 — Model Engine timeout.** A hard timeout, after which the Rule Engine serves the Suggestion. Its
  value comes from the OQ-1 measurement. FR-8 keeps it off the critical path: the timeout governs only how
  long a pending Suggestion stays pending. Until OQ-1 is measured the value is **provisionally 10 s**,
  explicitly unverified, read from one named constant (AD-5, `core/constants.ts`) so the measurement lands
  in a single edit. See §13 item 21.
- **NFR-3 — Offline correctness.** With no network the app is fully functional; no view shows an error,
  spinner or empty state attributable to the missing network. **The pending indicator in FR-8 is exempt**
  — it reports a Suggestion in flight, not a missing network, and appears offline too.
- **NFR-4 — Responsive and operable.** Every flow, and specifically FR-10's accept/edit/reject
  interaction, **is usable at 360 px and at 1280 px viewport width without horizontal scrolling**, and is
  demonstrated at both. **The accessibility target is WCAG 2.2 AA as a floor** (§13 item 24) — AA and not
  AAA, with the cheapest conforming implementation preferred over a more thorough one; `DESIGN.md` and
  `EXPERIENCE.md` carry the marks the standard's contrast and no-color-alone criteria require. The
  deliverable promises the floor and a mechanical check, not certified conformance: `axe-core` runs in CI
  at both widths (AD-17, AD-19) and catches only a subset of AA, so the README says "built to WCAG 2.2 AA,
  checked with axe-core" and never "WCAG 2.2 AA conformant". No manual audit, screen-reader certification
  or VPAT is in v1's scope.
- **NFR-5 — Determinism of the Rule Engine.** Same input, same Suggestion, always (FR-7).
- **NFR-6 — No missing Suggestion.** Every Model Engine failure results in a Rule Engine Suggestion
  (FR-9), and no error, popup, banner or interrupted flow appears in capture or review. The one exception
  is outside that flow: after a *persistent* failure, Settings may show FR-11's status.
- **NFR-7 — Reproducible from a clean clone.** The README takes a fresh clone to a running app; the FR-20
  harness runs from the same clean state.
- **NFR-8 — Every fallback path is covered by automated tests against a mocked Anthropic API.** Every
  failure mode enumerated in FR-9 has a test asserting a Rule Engine Suggestion is produced and no
  user-facing error appears. With the Model Engine mocked the whole suite runs with **no API Key and no
  network**, in CI and on a grader's machine — the "testmodus eller mock-data" plan asked for in review.
- **NFR-9 — The AI decision is documented in the deliverable.** The README, or a document it links,
  explains in prose: the two implementations; why they beat rules-only and a local model; the privacy
  trade-off and how consent is handled; and the measured FR-21 results. It also carries screenshots or a
  recording of a Model Engine Suggestion attributed as such (FR-11), so the AI model is visible without a
  key.
- **NFR-10 — Date-dependent behavior is tested against a fixed date, never the system clock.** Every
  date-dependent test — FR-23's parsing, FR-12's placement, FR-15's assertions, FR-16's archive window —
  and the FR-20/FR-21 harness runs against an injected reference "today" recorded in the Fixture (FR-19),
  so results are identical on any day, time zone and machine.

## 11. Grading Alignment

The rubric's weights are not a normal product's priorities, which is why §6.3 turns them into a cut order.
The project is rated "Enkel", and a simple project compensates through execution — so adding features is
not the lever; depth on what is specified is.

| Weight | Dimension               | Where this PRD serves it                                                      |
| -----: | ----------------------- | ----------------------------------------------------------------------------- |
|    30% | Process and AI-steering | NFR-9's written record; FR-21's comparison; brief → PRD → code traceability |
|    20% | Functionality and scope | §4 FR-1 – FR-23, prioritized by §6.3                                       |
|    15% | QA and testing          | FR-15, FR-19 – FR-21, NFR-8, NFR-10, SM-1                                    |
|    10% | Design                  | NFR-4, UJ-1 – UJ-4                                                           |
|    10% | Code and architecture   | Deferred to `bmad-architecture`                                             |
|    10% | README and runnability  | SM-2, NFR-7, §8                                                              |
|     5% | Repo tidiness           | §8                                                                           |

## 12. Open Questions

1. **OQ-1 — What is the Model Engine's real latency?** Sources disagree by an order of magnitude (roughly
   0.7–1.0 s versus 9.6–13.4 s to first token); effort settings move latency by 10–100×, and Haiku 5.5's
   default effort is not the lowest. **Action:** time a real call with a real key — under an hour.
   **Blocks:** NFR-2's timeout, FR-8's pending-state UX, and the provider choice (§4.2). The reason this
   document is `draft`.

   **What is timed.** Wall-clock from request sent to a **parsed, schema-valid Suggestion object** — not
   time to first token. FR-10 cannot review a partial object, so first-token latency is the wrong meter,
   and it is the meter most of the disputed sources actually report. At least 10 consecutive calls on
   representative task text, the first discarded as connection setup, over an ordinary consumer
   connection named alongside the result.

   **Spike configuration**, fixed here so the number is reproducible rather than a property of how the
   call happened to be written: `model: claude-haiku-5-5`, `output_config.effort: "low"`,
   `thinking: {"type": "disabled"}` (OQ-2), structured output via `output_config.format`, a small
   `max_tokens`, and no `temperature`, `top_p` or `top_k`.

   **Pass bar — set before the measurement so the result can falsify it: p50 ≤ 2.5 s and p95 ≤ 6 s.**

   **Status 2026-11-22: still open, and deliberately so.** The spike harness exists at
   `.docs/planning-artifacts/spikes/oq1-model-engine-latency/` and has never issued a real call, so no
   figure in this document, in architecture, or in any story describes a measured latency. Confirmed on
   2026-11-22: epics and stories proceed with NFR-2 at its **provisional 10 s** (NFR-2, §13 item 21) and
   with Haiku 5.5 as the *planned*, unconfirmed provider. Nothing downstream may describe either as
   verified, and this document stays `draft` until the measurement exists.

   - **Pass** → Claude Haiku 5.5 is confirmed as the Model Engine provider, §13 item 12 closes, and
     NFR-2's timeout is set to **6 s**.
   - **Miss** → time the OpenAI nano fallback at the same call shape and take the faster of the two;
     NFR-2's timeout is set to **10 s**, and the Model Engine's place in §6.3's Tier 2 is re-examined
     rather than assumed. If both miss, Claude is kept — pricing and privacy already decided it, not
     speed (`addendum.md` §5).

   Either way FR-8 holds: capture is never gated on this number, so no outcome here can make the app
   unusable. What the number decides is the provider and the timeout, not whether v1 ships.
2. **OQ-2 — Can thinking be turned off, and does it matter for latency? RESOLVED 2026-11-14.** It can, on
   Haiku 5.5, via `thinking: {"type": "disabled"}` at effort `high` or below; `xhigh` and `max` reject the
   combination with a 400. Adaptive thinking is **on by default** and counts against `max_tokens`, so the
   naive call is both the slow one and the expensive one. Whether disabling it is *enough* is OQ-1's
   measurement — the setting is part of the spike configuration above.
3. **OQ-3 — Free credit and rate limits.** Research's figures are low-confidence aggregator values on no
   official page. **Action:** confirm in the Anthropic console before writing API Key setup instructions
   into the README.
4. **OQ-4 — Where does the API Key live, and what does `.env.example` mean here? RESOLVED 2026-11-18 —
   `bmad-architecture`.** There are two keys in two runtimes, and only one of them is the app's.

   - **The app's key** is runtime-only: entered in Settings (FR-17), held in browser storage on the
     device, never read from a build-time variable, never present in the bundle.
   - **The harness's key** (FR-21) belongs to Node, outside the browser, and arrives as an environment
     variable. `.env.example` therefore documents `ANTHROPIC_API_KEY` **for the harness only**, saying in
     as many words that the app never reads it.

   So §8's *"ships an example environment file and a `.gitignore` excluding real ones"* holds literally,
   while no build-time secret exists anywhere. Setup instructions for both paths are the README's job
   (NFR-7, NFR-9), not this document's.
5. **OQ-5 — Due-date parsing. RESOLVED 2026-11-01 — see FR-23.**
6. **OQ-6 — The SM-1 minimums are unknown until measured.** The first Fixture run sets the baseline and
   the written per-field minimum (SM-1). Until then "is the Rule Engine good enough?" is open — but the
   rules it is measured against are not: FR-7 fixes them.
7. **OQ-7 — Research red-team pass never ran.** The research recommends re-running itself at higher
   validation first. The verdict is committed anyway: the Rule Engine is independently sanctioned and the
   Model Engine is additive and reversible. Accepted risk.
8. **OQ-8 — Storage mechanism. RESOLVED 2026-11-18 — `bmad-architecture`: `localStorage`, behind a
   synchronous port.** §9 framed the trade-off as size limits against the cost of querying Smart Lists.
   The second half turns out not to exist: FR-12 – FR-15 recompute from every non-archived Task on every
   render and store no membership, so every Task is in memory whichever API is used, and IndexedDB's
   indexed queries would be bought and never issued. On the size half, a Task is roughly 200–400 bytes of
   JSON against `localStorage`'s ~5 MB per origin — more than 12 000 Tasks, well past this product's
   horizon. Being synchronous, it also satisfies FR-8's 100 ms with no `await` between submit and the Task
   appearing in the list. **Accepted cost:** the whole document is re-serialized on every mutation, on the
   main thread.

## 13. Decisions and Assumptions Index

Every judgment that was once an open inference, with its status. Items 12 and 21 are the only ones still
riding on an unmeasured number — the provider and the timeout, both the OQ-1 named in §0; everything else
is settled. This index, not the body, is where each decision's rationale lives; where that argument needs
paragraphs rather than a cell, the row points to §13.1.

| #  | Where              | Decision, and why it was taken | Status |
| -- | ------------------ | ------------------------------ | ------ |
| 1  | §2.3              | The four User Journeys are what UX builds on | **Confirmed 2026-11-01** |
| 2  | FR-23              | The fixed date-word vocabulary — `Monday` to `Friday` only, full spellings only — applied directly rather than reviewed because it is deterministic and editable at once. Resolves OQ-5 | **Confirmed 2026-11-01**; weekday scope 2026-11-13; FR-7 example reference date **Confirmed 2026-11-14** |
| 3  | FR-7               | Summary is truncation, not summarization: the research offers no rule-based summarization at all, hence SM-1 scoring it separately | **Confirmed 2026-11-01** |
| 4  | FR-8               | Capture is asynchronous, limit 100 ms, because Model Engine latency is unresolved (OQ-1) and could reach ~13 s | **Confirmed 2026-11-01**; limit 2026-11-13 |
| 5  | FR-9, FR-11, NFR-6 | The failure-mode list and the transient/persistent split: a dropped connection fixes itself, a dead key does not, and silence would leave the user believing the Model Engine still runs. Owned here — the research is silent on failures | **Confirmed 2026-11-01** |
| 6  | FR-18              | The consent mechanism; the brief establishes opt-in but not how | **Confirmed 2026-11-01** |
| 7  | NFR-10, FR-19      | A fixed reference date, not the system clock | **Confirmed 2026-11-01** |
| 8  | NFR-2              | The timeout value comes from the OQ-1 measurement | **Confirmed 2026-11-01** |
| 9  | §0, §8           | Deadline is the second week of December 2026; an older log said end of November, superseded | **Confirmed 2026-11-01** |
| 10 | FR-7, FR-23, §6   | **English task text only** | **Confirmed 2026-11-01** |
| 11 | §9, OQ-8          | Storage is browser-local; the API is **`localStorage` behind a synchronous port**, because Smart Lists are recomputed in memory on every render and never queried from storage | **Resolved 2026-11-18 — architecture** |
| 12 | §4.2, OQ-1        | Haiku 5.5 planned, OpenAI the fallback behind the same interface; the spike's pass bar (p50 ≤ 2.5 s, p95 ≤ 6 s) and call shape are fixed in OQ-1, so the measurement can fail rather than merely inform | **Open — OQ-1 spike**; bar set 2026-11-14 |
| 13 | OQ-4               | Where the API Key lives, and `.env.example` with no backend: **two keys in two runtimes** — the app's is runtime-only in Settings, the harness's is a Node environment variable, and `.env.example` documents only the latter | **Resolved 2026-11-18 — architecture** |
| 14 | FR-7               | **The tag set, both keyword tables, the multi-tag rule, `high`-beats-`low`, and the no-match outcome** — the builder's own choices from §2.1's four contexts, rejecting the research sketch's five categories, four priority levels and `other` catch-all | **Confirmed 2026-11-13** |
| 15 | §6.3              | The three-tier cut order within v1 | **Confirmed 2026-11-13** |
| 16 | FR-9, FR-11        | The zero-data-retention / Compliance-API `401` is named as its own persistent failure mode and worded apart from a rejected key, because the key is valid and the user can do nothing about it. Verified against official documentation 2026-11-14 | **Confirmed 2026-11-14** |
| 17 | §3, FR-5, FR-16    | **Completed and archived are derived, not stored** — the Task persists a completion date and both states are computed from it (→ §13.1) | **Confirmed 2026-11-18 — architecture** |
| 18 | FR-6, FR-7, FR-19  | **The Model Engine proposes only FR-7's four Tags** (`school`, `group`, `work`, `personal`), the same set as the Rule Engine. §3 constrained only the Rule Engine and was silent here, leaving FR-19's expected Tags and FR-21's scoring undefined for a fifth Tag. The user may still add any Tag by hand (FR-3) | **Confirmed 2026-11-18 — architecture** |
| 19 | §2.3, FR-10, §6.3 | **"Accept all" / "Reject all" are Tier 1, not Tier 3**; their interface labels are **Punch all / Strike all** (→ §13.1) | **Decided by the builder 2026-11-22** |
| 20 | FR-19, FR-20, §7, §6.3 | **FR-19's Fixture is a hard prerequisite of FR-20, SM-1 and SM-3**, with its own story (→ §13.1) | **Decided by the builder 2026-11-22** |
| 21 | NFR-2, OQ-1        | **NFR-2's timeout is provisionally 10 s, explicitly unverified.** 10 s is the figure OQ-1's *miss* branch names; 6 s is what a passing measurement would license, and nothing has been measured, so the conservative branch is the honest default. Epics and stories build against it through AD-5's single named constant. **No document, story, test or README passage may describe the value or the provider as measured or verified** until the spike runs | **Provisional — OQ-1 still open**, set 2026-11-22 |
| 22 | §6.3, NFR-7, NFR-9, SM-2 | **Setup, testing and documentation are story-bearing work, not a final tidy-up** (→ §13.1) | **Decided by the builder 2026-11-22** |
| 23 | §6.1, NFR-7, NFR-9 | **The README is written in English**, like every other document a grader reads; `.logs/` stays Norwegian (→ §13.1) | **Decided by the builder 2026-11-22** |
| 24 | NFR-4, `PRODUCT.md` | **WCAG 2.2 AA is the accessibility floor**, and two design tokens were raised to meet SC 2.5.8 (→ §13.1) | **Decided by the builder 2026-11-22** |
| 25 | FR-19, FR-7, NFR-10 | **The Fixture's fixed reference date is Monday 2026-11-16** (→ §13.1) | **Decided by the builder 2026-11-22** |
| 26 | FR-15, FR-19, FR-12 | **"Need Attention" is asserted by selector unit tests, not by a Fixture entry** (→ §13.1) | **Decided by the builder 2026-11-22** |

### 13.1 Decision notes

The arguments behind the index rows that need more than a cell. Each note is the authority for its row;
the body sections carry the decision and point here.

**17. Completed and archived are derived, not stored** (§3, FR-5, FR-16). The Task persists a completion
date; `completed` and `archived` are computed from it. Taken in architecture because a stored flag is a
second source of truth that can disagree with the date, and a time-triggered sweep would write to storage
as time passes, defeating NFR-10. Consequence accepted: restoring an archived Task clears the completion
date, so that date is lost.

**19. "Accept all" / "Reject all" are Tier 1, not Tier 3** (§2.3, FR-10, §6.3). `EXPERIENCE.md` — locked
— makes tapping them the climax of UJ-1, the primary journey, while §6.3 listed them first to be cut; the
architecture spine recorded that it could not settle the disagreement. The journey won: a cut that
silently removes the narrated climax of the one journey a grader is walked through costs more than the two
composite actions cost to build. **Nothing changes — not the behavior, not an AD, not the visual weight.**
They stay composites of the per-part actions (AD-15), the undo buffer already holds a snapshot *set*
rather than one (AD-7), and they stay plain outline controls below the divider, never primary, with
Strike as reachable as Punch (SM-C1) — the weight `DESIGN.md` and `EXPERIENCE.md` already fix, where that
divider is called a rule. AD-10 simply stops listing them among the cuttable capabilities, since they
are no longer one. The interface labels are **Punch all / Strike all**; this document's names and the UX
documents' names denote the same two actions.

**20. FR-19's Fixture is a hard prerequisite** (FR-19, FR-20, §7, §6.3) of FR-20, SM-1 and SM-3 — carried
into epics as an ordering dependency, and given its own story rather than folded into the harness story. A
harness built first would pin its expectations inside test code, which §4.6 exists to prevent, and SM-1's
floor would be set by whatever the code already does instead of by FR-7's tables read by hand.

**22. Setup, testing and documentation are story-bearing work** (§6.3, NFR-7, NFR-9, SM-2), not a final
tidy-up. The README (clean-clone setup for both key paths, the Fixture's path, NFR-9's prose on the two
engines and the privacy trade-off, and the Model Engine screenshot), the test suites NFR-8 and NFR-10
require, and `.env.example` each get explicit stories inside Tier 1 — they carry 10% of the rubric on
their own (§11), and SM-2 is a binary pass that fails silently if left to the last day.

**23. The README is written in English** (§6.1, NFR-7, NFR-9), like the PRD, `DESIGN.md`, `EXPERIENCE.md`
and the architecture spine. It was a seven-line Norwegian stub while every document around it was English,
leaving the one artifact a grader opens first as the only one out of step. This settles the last part of
the interface-language question §6.1 had left open (the UI itself was settled as English on 2026-11-18).
`.logs/` stays Norwegian — the builder's record, not a deliverable.

**24. WCAG 2.2 AA is the accessibility floor** (NFR-4, `PRODUCT.md`) — AA, not AAA, and the cheapest
conforming implementation wins. This closes both of `PRODUCT.md`'s remaining `[OPEN]` product facts at
once: the standard was never named, and the no-color-alone rule the UX documents already honor is
**SC 1.4.1 of the standard, now confirmed**, so it stopped being an assumption. Two consequences are not
optional, because the standard requires them: text contrast at 4.5:1 (3:1 for large text), and **no
information carried by color alone** — which is why Priority carries a bar ladder *and* its word, and
engine provenance carries a chip *and* its letter (`DESIGN.md`, `EXPERIENCE.md`). `axe-core` at both bound
widths (AD-17, AD-19) is a partial mechanical check, so the deliverable claims the floor and the check,
never certified conformance. **Two design tokens were raised to meet SC 2.5.8's 24 × 24 CSS px**, both in
`DESIGN.md`: in-panel `button-height` from 20 px to 24 px, and `row-height-desktop` from 21 px to 24 px —
rows stacked against each other cannot claim the criterion's spacing exception. Density remains the
concept's point; 24 px is the floor, not a license to loosen the rest.

**25. The Fixture's fixed reference date is Monday 2026-11-16** (FR-19, FR-7, NFR-10) — the date FR-7's
worked example already used, so the example becomes a Fixture entry instead of a parallel case and §6.2's
cross-reference holds literally. Consequences: the current week is 2026-11-16 to 2026-11-22; "Submit
assignment in IBE160 Friday" is the **ordinary** next-occurrence entry (due 2026-11-20); the
resolve-to-the-reference-date edge case needs an entry naming `Monday`. Closes the open question carried
since 2026-11-14.

**26. "Need Attention" is asserted by selector unit tests, not by a Fixture entry** (FR-15, FR-19, FR-12).
Fixing the reference date exposed that no FR-23 date word resolves to the past, so no parsed due date can
be past due — and a Sunday due date cannot be parsed at all. The Fixture therefore asserts what parsing
can produce, rather than gaining a non-parsed due-date field that would widen FR-19's shape; FR-12's
past-due rule and FR-16's window are asserted against an injected reference date. FR-15's list of Smart
Lists is the vocabulary of expected values, not a coverage requirement; no requirement text changed.
