---
title: 'Adversarial review — ARCHITECTURE-SPINE (To-Do-List)'
lens: adversarial
target: ../ARCHITECTURE-SPINE.md
altitude: feature
reviewed: '2026-11-18'
verdict: PASS WITH FINDINGS
---

# Adversarial review — ARCHITECTURE-SPINE, To-Do-List

## Method and threat model

The spine is strong where it is explicit: AD-1 through AD-13 close most of the obvious cross-story
holes (one storage adapter, one clock, one engine route, one result type, no flags). This review does
not re-check those. It attacks the spine the way the next phase will: **two stories, each handed only
the spine and its own story file, each obeying every AD to the letter, producing code that does not
fit together.**

Every finding below names two concrete stories from this product, the artefact they both touch, the
divergent-but-compliant reading each takes, the AD that should have forbidden one of them, and the
Rule text that closes it.

Severity: **critical** — the two units cannot both be merged without rewriting one; **high** — they
merge and produce wrong behaviour or silent data loss; **medium** — they merge and cost a later story
a refactor.

Verdict: **PASS WITH FINDINGS.** Every hole is closable with AD text; none requires changing the
paradigm, the stack or the layering. F1 and F2 should be closed **before** epics and stories are
generated, because both poison the shape of `core/task.ts`, which is the first file written.

---

## F1 — `completedAt` and the Clock port have two legal representations  `critical`

**Units:** story *"FR-5 — complete and un-complete a Task"* vs stories *"FR-16 — archive view"*,
*"FR-12 — Due this week / Need Attention"*, and *"FR-20 — harness run"*.

**Shared artefact:** the `completedAt` field in `core/task.ts`, and the return type of
`ports/clock.ts`.

**The clash.** The spine says both of these:

- AD-7: "the Task document persists `completedAt` as a **timestamp** or null", and archive is
  `completedAt !== null && daysSince(completedAt, now) > retentionDays`.
- Consistency Conventions, *Data — dates*: "due date and `completedAt` are stored as **ISO-8601 date
  strings in the device's local calendar day**".

A timestamp and a local calendar day are different values. The FR-5 author, reading AD-7 and holding
an instant from the Clock port, writes `new Date(instant).toISOString()` →
`"2026-11-18T23:30:00.000Z"`. The FR-16 author, reading the conventions row, writes
`daysBetween(completedAt, today)` over `"YYYY-MM-DD"` strings. For a user in UTC+1 who completes a
Task at 00:30 local, the first value's calendar day is *yesterday*: the Task archives a day early,
and the e2e assertion "completed 31 days ago is archived" passes or fails depending on what hour the
fixture was authored.

The same hole sits at the port. AD-2 says every module "receives the current **instant** as a
parameter". AD-12 says the harness "injects the Fixture's own **fixed reference date**" — and FR-19
records a *date*, not an instant. So `ports/clock.ts` is specified as returning an instant (app) and
a date (harness). Two stories then implement `startOfToday()`: one as UTC midnight from the instant,
one as local midnight. FR-12's "a Task due that Sunday appears, one due the next Monday does not"
now disagrees between app and harness — which is the one thing AD-12 exists to prevent.

AD-2 does not prevent this: it fixes the *route* time takes, not its *representation*. NFR-10 is
satisfied by both readings — both reproduce, they just reproduce different answers.

**AD that failed:** AD-2 (route fixed, type unfixed), compounded by an internal contradiction between
AD-7 and the *Data — dates* convention.

**Close it — tighten AD-2 and AD-7:**

> `ports/clock.ts` exports exactly one type, `type Now = { instant: number; today: IsoDate }`, where
> `IsoDate` is the branded `YYYY-MM-DD` string type declared in `core/task.ts` and `today` is the
> local calendar day of `instant` in the device's zone. `system-clock.ts` is the only producer;
> `harness/run.ts` builds a `Now` from the Fixture's reference date with `instant` at local noon of
> that date, so no arithmetic can cross a day boundary.
>
> `completedAt` and `dueDate` are `IsoDate | null` — **local calendar days, never instants, never
> UTC**. All day arithmetic goes through two named pure functions in `core/selectors.ts`:
> `daysBetween(a: IsoDate, b: IsoDate): number` and `startOfWeek(d: IsoDate): IsoDate` (Monday). No
> module parses a stored field with `Date`, and no module derives a day by slicing an ISO instant.

Then restate AD-7's archive predicate as `daysBetween(completedAt, now.today) > retentionDays` and
delete the word "timestamp" from AD-7.

---

## F2 — The persisted pending Suggestion has no fixed shape, and per-control review state has no owner  `critical`

**Units:** story *"FR-8 — capture a Task; the Suggestion arrives and attaches"* vs story *"FR-10 —
review a Suggestion per control"*.

**Shared artefact:** the Suggestion-shaped field on the persisted Task in `core/task.ts`.

**The clash.** AD-7 settles *whether* ("A Suggestion that has arrived and is unreviewed **is**
persisted with its Task"), and the ER diagram settles cardinality ("at most one pending"). Neither
settles the record's fields. Two compliant readings:

- The FR-8 author persists the engine's payload: `task.suggestion = { tags, priority, summary }`.
  That is the whole of FR-6's Suggestion, and AD-7 asked for nothing more.
- The FR-10 author needs three things FR-8 did not write: per-control state
  (`open` / `punched` / `struck`), so the course panel can honour EXPERIENCE's "a control never
  changes state on its own" across a reload; the engine, so the chip can honour "there is no surface
  where a user can see a suggestion without seeing which engine made it"; and a way to know the panel
  should still be on screen, since it "leaves when all three controls are resolved".

Worse, AD-7's own headline ("Derived state is never persisted") pushes the FR-10 author toward
*deriving* control state — `punched = task.priority === suggestion.priority` — which is wrong in a
way tests will not catch for weeks: a user who *edits* Priority to the value the engine happened to
propose, or whose Task already carried the FR-1 default `medium` when the engine proposed `medium`,
gets a control rendered as punched without having punched it. A third author instead persists an
explicit `review: { tags: 'open' | 'punched' | 'struck', ... }`. Both can cite AD-7. The two shapes
are not merge-compatible — they are different `localStorage` documents, and AD-6's `schemaVersion`
reads 1 in both.

Attribution is the same hole in miniature: AD-4 carries `engine` on `EngineResult`, but nothing says
it survives into storage, so a reload may legally drop FR-11's chip.

**AD that failed:** AD-7 (settles persistence of a Suggestion without fixing its record), with the
*Core entities* diagram naming the relation but not the fields.

**Close it — new AD-14, "The pending Suggestion record is fixed, and review state is stored not
derived":**

> `core/task.ts` declares the persisted Task document exhaustively, including:
>
> ```ts
> type ControlState = 'open' | 'punched' | 'struck';
> type PendingSuggestion = {
>   tags: Tag[]; priority: Priority; summary: string;
>   engine: 'rule' | 'model';
>   review: { tags: ControlState; priority: ControlState; summary: ControlState };
> };
> type Task = { /* ... */ suggestion: PendingSuggestion | null };
> ```
>
> `ControlState` is the **one named exception to AD-7**: it records a user act, not a derivation, and
> may never be inferred by comparing a Task's field to the proposal. A Suggestion whose three `review`
> values are all non-`open` is resolved: the reducer sets `suggestion` to `null` in the same action,
> after folding its struck controls into the suppression set of F3. `engine` is persisted so FR-11's
> chip survives a reload.

---

## F3 — "The engine never re-proposes a struck control" is in EXPERIENCE.md and nowhere in the spine  `high`

**Units:** story *"FR-10 — strike one control"* vs story *"FR-22 — Suggest again"* (and the reload
path of story *"FR-8 — capture"*).

**Shared artefact:** the per-Task suppression memory of struck controls, and the boundary between
`app/suggestion-service.ts` and the store's reducer.

**The clash.** EXPERIENCE.md states it twice as hard behaviour: "the engine never re-proposes a struck
control for the same task", and "Strike — the field is unchanged and the control is not proposed again
for this task". The spine never mentions it. AD-3 *enumerates* what `SuggestionService` owns — consent
gate, engine selection, timeout, failure classification, fallback, attribution — and suppression is
not in the list; FR-22's own text says the new Suggestion "replac[es] the previous pending one". So:

- The FR-22 author calls `SuggestionService.request(task)`, gets three controls, dispatches
  `suggestion/attach` with the full payload: the struck control is back on screen, open, with a new
  proposal. EXPERIENCE's rule is broken and the story is fully AD-compliant.
- The FR-10 author, having read EXPERIENCE, implements suppression — and has two plausible homes for
  it. Inside `SuggestionService`, which means the service reads the Task document, widens AD-3's
  remit, and gives the harness's deliberate AD-12 bypass a *different* behaviour from the app — the
  exact divergence AD-12 exists to prevent. Or in the reducer, filtering at attach. Two owners, one
  rule: whichever the second story picks, the filter ends up applied twice or not at all.

There is a persistence half too: if struck lives only in F2's in-memory `PendingSuggestion`, it dies
when the Suggestion resolves, and FR-22 next week legitimately re-proposes it.

**AD that failed:** AD-3 (an enumerated-ownership rule whose enumeration is missing this
responsibility), with AD-10 asserting FR-22 is "one further call into `SuggestionService`" and
therefore adds no new path — true only once suppression is owned elsewhere.

**Close it — tighten AD-3 and extend AD-14:**

> The Task document carries `struck: { tags: boolean; priority: boolean; summary: boolean }`,
> persisted, set when a control is struck and cleared only by the user editing that field through
> FR-3.
>
> `SuggestionService` stays unaware of it: it always returns a full three-part Suggestion, so the
> service the app calls and the engines the harness calls behave identically (AD-12). **The reducer's
> `suggestion/attach` action is the single place suppression is applied**: controls whose `struck`
> flag is set are written with `review: 'struck'` at attach time and never rendered open. "Suggest
> again" (FR-22) therefore replaces only the non-suppressed controls, and clears no `struck` flag.

---

## F4 — Nobody is named as the validator of engine output, and no field has a bound  `high`

**Units:** story *"FR-9 — Anthropic model engine adapter"* vs story *"FR-7 — Rule Engine"* vs story
*"the record and course panel render a proposal"*.

**Shared artefact:** `core/suggestion.ts` (the Suggestion shape *and its zod schema*) and the
`SuggestionEngine` port.

**The clash.** AD-4 is precise about the result union and about three provider traps, and it says of
the `refusal` trap, in as many words, "schema may not hold". It does not say **who runs the schema.**
`core/suggestion.ts` holds a zod schema; the adapter could run it, the service could run it (AD-3 owns
"failure classification", which is suggestive but not the same thing), or each could assume the other
does. With one story each, that last outcome is the likely one: the adapter author treats zod as the
service's job because the service classifies failures, while the service author treats it as the
adapter's job because AD-4 says the adapter absorbs the traps "**before any caller sees a
Suggestion**". Unvalidated provider output then reaches `suggestion/attach` and is persisted, and
AD-6 re-serializes the whole document around it.

Second half, independent of the first: **no field is bounded.** FR-7's Rule Engine Summary is "a
cleaned-up, **truncated** restatement" with no length stated anywhere in PRD or spine, while
DESIGN/EXPERIENCE require a one-line summary inside a 46px record row at 360px. So the Rule Engine
author picks 60 characters by taste; the Fixture author scores Summary (SM-1 scores it as its own
field) against a different normalization; and the model adapter imposes no bound at all, because its
contract is "schema-constrained output" and the schema has no `maxLength`. A 300-character,
schema-valid model Summary breaks a layout contract EXPERIENCE calls binding, with no AD violated.
Tags are the same: nothing requires *engine-proposed* Tags to be FR-7's four, so a model engine may
legally propose `errand`, which FR-19's expectations cannot express ("Expected Tags use only FR-7's
tag set").

**AD that failed:** AD-4 (fixes the envelope; leaves the payload unconstrained and unowned).

**Close it — tighten AD-4:**

> `core/suggestion.ts` exports `SuggestionSchema` (zod) as the **single** validator of engine output,
> applied **inside every `SuggestionEngine` implementation as the last step before returning** — the
> Rule Engine included, so the harness measures validated output too. A parse failure in the model
> adapter returns `{ ok: false, kind: 'transient' }`; the Rule Engine, being total (conventions,
> *Errors*), cannot fail it.
>
> The schema bounds every field: `priority` is the lowercase three-value enum; `tags` is a subset of
> FR-7's four, deduplicated and emitted in FR-7 table order; `summary` is non-empty, single-line (no
> `\n`), and at most `SUMMARY_MAX_CHARS` — one named constant in `core/constants.ts` shared by the
> Rule Engine's truncation, the model prompt's instruction, and the Fixture's expectations.

---

## F5 — The undo buffer's location and shape are unfixed, and "Punch all" cannot compose a single-slot undo  `high`

**Units:** story *"FR-10 — undo a punch"* vs story *"Punch all / Strike all shortcuts"* vs story
*"FR-3 — edit a Task field"*.

**Shared artefact:** the undo buffer — `app/store.tsx` state versus a control component's own state.

**The clash.** AD-7 says the buffer "lives in React state and dies with the tab". "React state"
covers both `useState` inside the control component and a slot in the `useReducer` store —
EXPERIENCE even pushes toward the former ("Undo … in the control's own block"). Three incompatible
outcomes, all compliant:

1. **Lost undo.** The buffer is component state. The punch is a reducer action, so the new value is
   persisted at once (conventions: "nothing writes storage except the reducer's persistence step"),
   while the prior value lives in a component that unmounts when the course panel "leaves when all
   three controls are resolved", or when the user moves from Review to Task detail. The punch is
   durable; its undo is gone. FR-10's "immediately after accepting a part, the user can undo it" then
   holds only under an interpretation of "immediately" nobody wrote down.
2. **Stale restore.** The buffer holds the pre-punch value. The user punches Priority, edits Priority
   by hand through FR-3, then hits Undo — and the buffer writes the pre-punch value over the newer
   hand edit. Nothing in AD-7 or the *State mutation* convention invalidates a buffer on an unrelated
   write to the same field.
3. **Shape clash.** FR-10 says single-step undo; AD-10 says Punch all "composes the per-control
   actions and add no path those lack"; FR-10 also says "Undo after Accept all restores **all three**
   fields". A single slot overwritten per punch cannot do that if Punch all literally dispatches three
   per-control actions — the first two entries are overwritten. So one author writes
   `{ taskId, field, priorValue }` and the other `{ taskId, entries: [...] }`, in the same store, in
   two stories.

**AD that failed:** AD-7 (names a lifetime, not an owner or a shape), with AD-10 asserting a
composition that the single-step constraint makes impossible without a composite action.

**Close it — tighten AD-7 and AD-10:**

> The undo buffer is exactly one optional slot in the reducer's state in `app/store.tsx` — never
> component state — shaped `{ taskId, entries: { field: 'tags'|'priority'|'summary', priorValue,
> priorReview: ControlState }[] }`. It is never persisted (AD-6 names no key for it).
>
> **Punch all dispatches one composite action** that fills the slot with three entries; that is how
> AD-10's "composes the per-control actions" is honoured without three sequential dispatches. **Any
> reducer action that mutates a Task other than the undo itself clears the slot** — an FR-3 field
> edit, a Suggest-again attach, complete, delete — so undo can never write a value that something
> newer already overwrote. Undo is itself a named action and the slot's only consumer.

---

## F6 — Actions may carry whole-Task payloads, and AD-6 says nothing about two writers  `high`

**Units:** story *"FR-8 — the Suggestion arrives and attaches to the saved Task"* vs story *"FR-3 —
edit task text"*. Second pair: the same two stories **in two tabs**.

**Shared artefact:** `todo.tasks.v1`, re-serialized whole on every mutation (AD-6's accepted cost).

**The clash, single tab.** AD-6 and the *State mutation* convention jointly guarantee one writer per
tab — but not that writes are *deltas*. The FR-8 path is asynchronous by construction (capture returns
under 100ms; the Suggestion lands seconds later, possibly after the NFR-2 timeout). The natural
implementation captures the Task it was called with, awaits the service, and dispatches
`suggestion/attach` with `{ ...task, suggestion }`. If the user edited the task text in the interval —
which FR-22 explicitly contemplates — the attach writes the pre-edit text back over the persisted
edit. Both stories obeyed every AD: one writer, named actions, reducer persists.

**The clash, two tabs.** AD-6 picks `localStorage` with whole-document re-serialization and never
mentions concurrency. Two copies open is ordinary here (the PWA is installed *and* the app opens in a
browser tab). Each holds the whole document in `useReducer` state and re-serializes all of it on every
mutation. Complete a Task in tab A, capture a Task in tab B, and tab B's write — built from a snapshot
taken at load — silently drops the completion. FR-1's "readable after a full page reload and after the
browser is closed and reopened" still passes; data was lost anyway. And the two compliant mitigations
are mutually incompatible: one story author adds a `storage`-event listener in `local-storage.ts` and
re-hydrates the store — which, with F5 and F9 unfixed, also detonates the in-memory undo buffer and
the in-memory pending set — while another adds nothing. AD-6's three-key split *does* protect the API
Key from this; that half of AD-6 works exactly as advertised.

**AD that failed:** AD-6 (adopts whole-document re-serialization with no concurrency statement), with
the *State mutation* convention naming one writer per **reducer**, not per **origin**.

**Close it — tighten AD-6:**

> Every store action carries **field-level deltas addressed by `taskId`** — never a whole `Task`
> captured before an `await`. The reducer always computes the next document from its own current
> state. Asynchronous producers (the Suggestion path) dispatch `{ taskId, suggestion }` and nothing
> else; if `taskId` is absent from current state the action is a no-op.
>
> **Concurrent tabs: last write wins, by decision.** No merge logic, no `storage` listener, no
> cross-tab coordination exists — one device, one user, one list — and the README says two open copies
> may overwrite each other. A story proposing a `storage` listener is proposing an architecture change
> and costs a PRD §13 row, because the in-memory undo buffer (AD-7) and pending set cannot survive a
> re-hydration without a design of their own.

---

## F7 — The Fixture author and the Rule Engine author can disagree about "whole word", and the harness about comparison  `high`

**Units:** story *"FR-19 — write and commit the Fixture"* vs story *"FR-7 — Rule Engine"* vs story
*"FR-20 — harness reports per-field accuracy"*. Fourth party: story *"FR-23 — date words"*.

**Shared artefact:** the tokenization of task text, and the per-field comparison the harness runs.

**The clash.** AD-12 guarantees the harness runs *the same code* against *the same reference date* —
provenance, not semantics. FR-7 says keywords "match as whole words, case-insensitively"; FR-19 says
every expectation "is derivable **by hand** from FR-7's tables". "By hand" is exactly where two
authors diverge:

- `"Study for exams"` — the Fixture author writes expected Tags `[school]`, because `exam` is plainly
  in the sentence. A `\bexam\b` implementation returns `[]`. Both are defensible readings of "whole
  word"; only FR-23 ever spells the rule out, and it spells it out for *date* words ("Mondays does not
  match monday") in a different file written by a different story.
- `"the exam's on Friday"` — `\bexam\b` matches (the apostrophe is a boundary); token equality does
  not. Opposite direction, same ambiguity.
- `IBE160` (digits, casing, boundary behaviour), `pay` inside `payment`, `e-mail` hyphenation — all
  unresolved.
- **Two tokenizers.** `rule-engine.ts` (FR-7) and `date-words.ts` (FR-23) are separate files in
  separate stories, each needing the same "whole word, case-insensitive" primitive. They will not be
  the same regex, and each Fixture entry asserts both at once.
- **Comparison.** AD-12 requires Tags accuracy "reported separately" but never says whether Tags
  compare as an **ordered array** or a **set**. FR-7 mandates table order on output; a Fixture author
  writing `["group","school"]` alphabetically against a table-order engine produces a red harness that
  is really a fixture bug — or, if the harness compares as a set, hides a real ordering regression the
  UI renders.

Each of these makes SM-1 a number whose meaning depends on which story shipped first.

**AD that failed:** AD-12 (same code, same date — but not the same matching semantics, and no
comparison contract), with the *Data — Tags* convention fixing the vocabulary and not the ordering.

**Close it — tighten AD-12:**

> `core/text.ts` exports one primitive, `tokens(text: string): string[]` — lowercased, split on every
> character that is not a Unicode letter or digit, empties dropped. **Both** `rule-engine.ts` and
> `date-words.ts` match by `tokens(text).includes(keyword)` and by no other means: no regex word
> boundaries anywhere in `core/`. The consequences are therefore fixed and documented in one place:
> `exams` does not match `exam`, `exam's` does match `exam`, `Mondays` does not match `monday`,
> `e-mail` yields `e` and `mail`, `IBE160` is one token.
>
> Per-field comparison lives in `core/` as named pure functions the harness imports — Tags compared as
> **ordered arrays in FR-7 table order**, due date as `IsoDate | null`, Priority as the enum, Smart
> List placement as a sorted list of list ids. `fixture/tasks.json` stores Tags in table order, and a
> Fixture entry that disagrees with these functions is a Fixture bug, not an engine score.

---

## F8 — Three keys, one gate: "save the key" and "toggle consent" can disagree about whether the engine may run  `medium`

**Units:** story *"FR-17 — supply and clear an API Key"* vs story *"FR-18 — Cloud Suggestions
toggle"* vs story *"FR-9 — the model engine runs"*.

**Shared artefact:** the consent gate's inputs — `todo.apikey.v1` and the `cloudSuggestions` field of
`todo.settings.v1` — and who may write the latter.

**The clash.** AD-3 names `SuggestionService` as the gate's owner; AD-6 splits the gate's two inputs
across two storage keys and names neither authoritative. Two unresolved questions, each answerable two
ways:

- **Does clearing the key write `cloudSuggestions`?** FR-17 says clearing "returns the app to
  Rule-Engine-only operation", which reads like hygiene: the FR-17 author sets
  `cloudSuggestions = false` on clear. The FR-18 author treats the flag as the user's standing choice,
  mutated only by the toggle. FR-18's last testable line — "clearing and re-saving a key does **not**
  re-enable Cloud Suggestions if the user had turned it off" — is satisfiable by both and *means*
  different things. The behaviours diverge the moment the user had it **on**, cleared the key, then
  re-saved: engine on, or engine off? No AD decides.
- **What does the gate read?** AD-6's port is synchronous, so the service may legally re-read
  `localStorage` per request, or read the store's in-memory settings, or a component may cache them.
  A toggle that does not take effect until reload is an FR-18 failure ("turning it off stops all
  outbound requests **immediately**") that no AD currently forbids.

**AD that failed:** AD-3 (names the gate's owner, not its inputs, their precedence, or their read
path) and AD-6 (splits the state without assigning authority).

**Close it — tighten AD-3:**

> The gate is one pure predicate in `core/`, `mayUseModelEngine({ hasKey, cloudSuggestions })`, and it
> is the only expression of FR-9's precondition in the codebase. `SuggestionService.request` evaluates
> it **per request** from the store's current state, which the reducer keeps as the single in-memory
> projection of both storage keys.
>
> `cloudSuggestions` is mutated by exactly one action, `settings/setCloudSuggestions`, dispatched only
> by the FR-18 toggle. **Clearing or saving the API Key never writes `todo.settings.v1`** — FR-18's
> "saving a key never enables Cloud Suggestions" and "clearing and re-saving does not re-enable it"
> then both hold for the same structural reason, and the flag means precisely "what the user last
> chose".

---

## F9 — "Pending" has no stated source of truth, and "nothing persists" permits two renderings  `medium`

**Units:** story *"FR-8 — capture; the Task is pending"* vs story *"the record component / Today
surface renders the start triangle"*.

**Shared artefact:** the in-flight pending set.

**The clash.** AD-7 says an in-flight request is not persisted, "so a reload leaves the Task at its
defaults". EXPERIENCE requires the start triangle whenever a course is being set, and NFR-3 exempts it
from the no-spinner rule. Where does the triangle read from? Two compliant answers:

- An in-memory `pendingTaskIds` set in `app/store.tsx`, added on capture, removed on attach or
  terminal failure. Correct — but it appears in no state inventory in the spine, so the second story
  does not know it exists.
- *Derived*, e.g. `suggestion === null && !allStruck`. This persists nothing, so it satisfies AD-7
  literally and its anti-derived-flag headline doubly — and it is wrong: every Task whose Suggestion
  was struck away, and every Task created before the model engine existed, shows the triangle forever.

A related requirement-level gap, worth recording even though it is not a pairwise clash: because
in-flight state is deliberately unpersisted, a reload during a model-engine request leaves a Task with
no Suggestion, no pending mark, and **no affordance to ask again** if FR-22 is cut as Tier 3 (§6.3).
That is a legitimate decision; it should be a written one.

**AD that failed:** AD-7 (fixes what is not persisted without naming what holds it instead).

**Close it — extend AD-7's state inventory:**

> In-flight Suggestion requests are held in one in-memory set in `app/store.tsx`,
> `pendingSuggestionTaskIds: Set<TaskId>`, added by the capture/Suggest-again action and removed by
> attach or terminal failure. It is the **only** source of FR-8's pending indicator, which is never
> derived from a Task's fields. Like the undo buffer it is unpersisted and dies with the tab: after a
> reload a Task whose request was in flight shows no indicator and carries no Suggestion, and FR-22 is
> the only way to ask again — recorded here so a Tier 3 cut of FR-22 is a known consequence rather
> than a surprise.

---

## F10 — `schemaVersion` has no bump protocol, and the settings document has no version at all  `medium`

**Units:** any two stories that add a persisted field — concretely story *"FR-10 — review state on the
Task"* (F2's `review`/`struck`) vs story *"Tier 3 — Project as a Task field"* vs story *"Tier 3 —
configurable retention window"*.

**Shared artefact:** `todo.tasks.v1`'s `schemaVersion` and read-time migration step; and
`todo.settings.v1`, which AD-6 gives no version.

**The clash.** AD-6 requires "a `schemaVersion` and a read-time migration step from version 1 onward"
but not *when* a field addition bumps it. AD-10 says Tier 2/3 capabilities are additive and "the
Project field is an optional property no Tier 1 selector reads" — which reads as licence to add
optional fields at version 1 with no migration. The FR-10 author, adding required `review`/`struck`,
bumps to 2 and writes `migrate1to2`. Both ship in the same week, and the chain now has version-2
documents from one story and version-1 documents from another that nonetheless carry Project. A reader
switching on `schemaVersion` cannot tell them apart, and the person debugging it is a solo builder a
fortnight from a deadline.

`todo.settings.v1` is the sharper half: AD-6 versions only the task document, so when Tier 3 adds
`retentionDays` there is no versioned read path at all, and the default-30 fallback becomes whatever
each reader writes — exactly the second source of truth AD-7 exists to prevent, one level down.

**AD that failed:** AD-6 (requires a version and a migration without a bump rule, and versions only
one of its three documents).

**Close it — tighten AD-6:**

> Both the task document and the settings document carry `schemaVersion`, and
> `adapters/local-storage.ts` is the only module that reads or writes it. **Adding an optional field
> whose absence is indistinguishable from its default does not bump the version; adding a required
> field, renaming one, or changing the meaning of an existing one bumps it by one and adds one
> `migrateNtoN+1` function** to the single ordered chain in the adapter, applied on read from the
> stored version to current. Missing-key reads yield the documented defaults — retention 30 days,
> Cloud Suggestions off — produced by one named factory, never by call-site fallbacks.

---

## What the spine already gets right against this lens

Recorded because an adversarial review that lists only holes misrepresents the document.

- **AD-6's three-key split** defeats the real pair "clear the API Key" vs "write a Task", and the
  future "JSON export" vs "the key", outright. That is precisely the kind of hole this lens hunts,
  already closed.
- **AD-4's named failure reasons** make FR-11's three distinct Settings wordings impossible to
  reconstruct by string-matching an error message in two different stories.
- **AD-9's predicate/label split**, with `Need Attention` fixed as the one spelling, kills the classic
  pair where a UI story widens a list by renaming it.
- **AD-10's refusal of feature flags** removes a whole category of divergence (one story gates behind
  a flag, another assumes the capability present).
- **AD-5's abort-and-discard** is written as an ownership rule rather than a hope, so the "late
  response" pair cannot resolve two ways.
- **AD-12's "imports from `src/core/` directly"** is what keeps F7 a *semantics* finding rather than a
  far worse provenance one.

## Suggested disposition

| # | Severity | Close before |
| --- | --- | --- |
| F1 `completedAt` / Clock type | critical | story generation — it shapes `core/task.ts` and `ports/clock.ts` |
| F2 pending-Suggestion record | critical | story generation — same file, first story written |
| F3 struck-control memory | high | the FR-10 story is written |
| F4 Suggestion validation owner + bounds | high | the FR-9 adapter story is written |
| F5 undo buffer | high | the FR-10 story is written |
| F6 delta writes + two-tab decision | high | the FR-8 story is written |
| F7 one tokenizer + comparison contract | high | the FR-7 or FR-19 story, whichever comes first |
| F8 consent gate predicate | medium | the FR-17 / FR-18 stories are written |
| F9 pending set | medium | the FR-8 story is written |
| F10 version bump protocol | medium | the second persisted-field story is written |

Ten findings: eight are closed by text inside existing ADs (AD-2, AD-3, AD-4, AD-6, AD-7, AD-10,
AD-12), two need one new AD-14 for the Suggestion/Task record. None needs a new layer, a new
dependency, or a change of paradigm.
