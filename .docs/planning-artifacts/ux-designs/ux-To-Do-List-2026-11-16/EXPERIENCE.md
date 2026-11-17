---
title: "EXPERIENCE: To-Do-List"
status: final
stage: locked
concept: "06 Kurs"
created: 2026-11-16
updated: 2026-11-17
form_factor: responsive-web-pwa
viewport_floor: 360
viewport_reference: 1280
design: ./DESIGN.md
reference_frames: "mockups/kurs/"
sources:
  - ../../prds/prd-To-Do-List-2026-10-31/prd.md
  - ../../briefs/brief-To-Do-List-2026-09-08/brief.md
  - ../../briefs/brief-To-Do-List-2026-09-08/tilbakemelding-product-brief.md
  - ../decisions.md
  - ../../../../PRODUCT.md
journeys:
  - UJ-1 capture between classes, punch all, correct one control
  - UJ-2 cold open, trust the derived views, offline
  - UJ-3 grader runs it with no API key and sees the AI feature work
  - UJ-4 own key, Model Engine takes over, credit later runs out
---

# EXPERIENCE: To-Do-List

How the product behaves. `DESIGN.md` owns how it looks; this file references its tokens by name as
`{colors.proposed}`. Where the two disagree, each wins in its own domain, and both win over any
frame in `mockups/kurs/`.

## Foundation

One responsive web application, installable as a PWA, covering phone, tablet and desktop from a
single codebase. **No UI system is adopted** — the stack is undecided and belongs to
`bmad-architecture`, so every control here is specified as a standard web control rather than as a
library component. Storage is browser-local; which API is an architecture decision.

Two viewports are binding, not advisory: **360px and 1280px**, every flow usable at both with no
horizontal scrolling, and the accept/edit/reject flow demonstrated at both. The course instructor
named this in writing as a graded expectation.

Offline is the normal case, not the failure case. Everything except the Model Engine works with no
network, and no view may show an error, spinner or empty state attributable to a missing one.

## Information Architecture

Four top-level destinations, as a bottom tab bar at 360 and a left nav rail at 1280.

- **Today** — the default. Capture field, then the three derived lists populated.
- **Lists** — every derived list enumerated: the three Smart Lists, one list per tag in use, All
  tasks, Untagged. Opening one shows its records.
- **Archive** — completed tasks past the retention window. Retrievable, never deleted.
- **Settings** — the only place any engine state is ever visible.

Two surfaces sit outside the tab bar because they are entered from a record, not navigated to:
**Review** (a task with an open course) and **Task detail**.

Seventeen surfaces are drawn. Every one delivers a stated need, and every need has a surface:

| | Surface | Delivers |
| --- | --- | --- |
| `m1` `d1` | Today | Trust what you see without having filed anything |
| `m2` | Capture, course pending | Capture never waits on intelligence |
| `m3` `d2` | Review, three controls open | Structure is proposed, not imposed |
| `m4` `d3` | Review, editing one control | One wrong field costs one correction |
| `m5` `d4` | Review, partial with undo | Acceptance is reversible |
| `m6` `d5` | Task detail | Every field in one place; ask for a fresh course |
| `m7` | A list, and all the lists | Views you never built |
| `d6` | Archive | Completed work leaves without being destroyed |
| `m8` `d7` `d8` | Settings | The key, the consent, the engine's truth |
| `m9` | First run | What the product is, before it has content |

## Voice and Tone

Plain, specific, never alarming. The app describes what is true and stops.

- **Never an error for an absence.** "No API Key is configured." is a sentence, not a warning. It is
  followed by what *is* happening: the Rule Engine is serving, on this device, offline.
- **Never a claim of correctness.** The app says which engine proposed something and publishes its
  own measured accuracy. It never says a suggestion is right.
- **The user's sentence is quoted, never paraphrased.** Microcopy refers to "your sentence,
  unchanged".
- **Shortcuts are labelled as shortcuts**: "shortcuts · they do nothing the three controls cannot".
- **The three persistent engine failures are worded apart.** A rejected key is something you can fix.
  An exhausted quota is something you can pay for. An organization that forbids browser calls is
  **neither** — the key is valid and nothing you do to it will help, so the copy says the
  organization does not allow it and stops, rather than sending the user hunting for a fault that is
  not theirs.
- Open questions are stated on screen, not hidden: Settings shows interface language as "English —
  not yet decided".

## Component Patterns

Visual specs are in `DESIGN.md.Components`; this is what they *do*.

**Record.** Tapping the sentence opens Task detail. Tapping the checkbox completes in place without
navigating. A record with an open course carries the start triangle and stays fully editable.

**Control.** The unit of review. Three states — open, punched, struck — each reachable from the
others only by the user's action. A control never changes state on its own, and the engine never
re-proposes a struck control for the same task.

**Course panel.** Appears when a Suggestion arrives and leaves when all three controls are resolved.
It is laid over the record and **must never overlap type** — it overlaps rules and empty ground only.

**Band.** Names a list and carries its live count. The count is computed on render; it is never
stored.

**Engine chip.** Present on every proposal, everywhere a proposal appears. There is no surface where
a user can see a suggestion without seeing which engine made it.

**Legend.** Published on long surfaces. It is the contract that no state is carried by colour alone.

## State Patterns

- **Pending.** The task is saved and in its lists; the start triangle marks it; it is fully editable.
  This is the one indicator allowed to appear offline, because it reports a course being set, not a
  missing network.
- **Open / punched / struck**, per control, in any combination. All three can be visible on one task
  at once (`m5`, `d4`).
- **Undo.** Available immediately after punching, in the control's own block, restoring that field's
  prior value. One step. No stack, no history, none across sessions.
- **Completed.** Leaves the active lists at once, keeps every punched control, stays retrievable
  until archived.
- **Archived.** Out of default views, into Archive, restorable with its marks. Not deleted.
- **No-match.** A task that earns no tag and medium priority is a **valid outcome**, rendered as an
  ordinary record with "no tag". It is never styled as a failure, an empty state, or a prompt.
- **Empty.** First run only. No other surface has an empty state, because every list that would be
  empty simply reports a count of zero.
- **There is no error state in capture or review.** Ever.

## Interaction Primitives

- **Punch** — accept one control. Writes only that field.
- **Edit** — open a standard control in place, `Apply` writes your value rather than the proposal.
- **Strike** — reject one control. The field is unchanged and the control is not proposed again for
  this task.
- **Undo** — one step back from a punch.
- **Punch all / Strike all** — shortcuts that add no behaviour the per-control actions lack, placed
  below a rule, in plain outline, never primary.
- **Suggest again** — explicit, on the task. Nothing re-runs the engine without being asked. Editing
  the task text does not trigger it.
- **Complete / Delete** — distinct acts. Completing keeps everything; deleting is the only
  destructive act and is never implied by anything else.

**The acceptance-rate guard.** The PRD lists suggestion acceptance rate as a counter-metric: a high
rate is equally consistent with good suggestions and with a UI that nudges. Therefore **Strike must
be exactly as reachable as Punch** — same size, same weight, same row, no confirmation on Strike and
none on Punch. Any future change that makes accepting cheaper than rejecting is a regression against
this line, whatever it does to the numbers.

## Accessibility Floor

- **360px and 1280px**, every flow, no horizontal scrolling, demonstrated at both. Binding (NFR-4).
- **Body and placeholder text ≥4.5:1** against its actual background; large text ≥3:1. Measured pairs
  are listed in `DESIGN.md.Colors`.
- **No state is carried by colour alone.** Priority carries a bar ladder *and* its word; provenance
  carries a chip *and* the engine's name; past due carries olive *and* the words; an open control
  carries a purple outline *and* a numeral *and* the start triangle on its task.
- Every control is a standard, focusable web control with a visible focus ring themed from
  `{colors.ink}`.
- Touch targets on the phone are the record's full 46px row and ≥20px for in-panel buttons.
- Text is real text at every size; nothing legible is drawn as an image.
- `[OPEN]` **No conformance standard is committed.** WCAG 2.2 AA is a reasonable floor and the frames
  were held to its contrast requirement, but the user has not confirmed AA, and target size,
  reflow and focus-appearance have not been audited against it.

## Responsive & Platform

The concept's spatial idea — two objects, one laid over the other — survives both widths; what
changes is the axis.

- **360.** One column. Header, capture, bands, records, bottom tab bar. The course panel sits
  **below** the record, full width, controls stacked and joined by a vertical purple leg.
- **1280.** Left nav rail in `{colors.chrome}`, two-column mosaic in the work area, legend as its own
  module. On the dedicated review surface the panel sits **beside** the record with a dashed leg
  across the gap. Inside the mosaic (`d2`, `d4`) the course becomes a purple-ruled table module, one
  row per control — the structure the user picked from concept 05.
- **PWA.** Installable; no store packaging. Install is offered in Settings, never interrupted into
  the flow.

## Engine Disclosure and Failure

This is the product's privacy posture expressed as behaviour, and it is more constrained than
anything else here.

- **Nothing leaves the device until consent.** Cloud Suggestions is off on first run even when a key
  is already present, and **saving a key never enables it**. The disclosure sits beside the control
  before it can be turned on, stating that task text goes to the Anthropic API, that the key is the
  user's own, and that the Rule Engine remains the fallback.
- **Every failure is silent in the flow.** Offline, timeout, rate limit, rejected key, exhausted
  quota, organization policy — all of them produce a Rule Engine suggestion with **no error, popup,
  banner, toast or badge anywhere in capture or review**.
- **Only persistent failures surface, and only in Settings**, as a plain status saying three things:
  the Model Engine is not being used, the reason, and that the Rule Engine is serving normally. It
  clears itself when the cause does; there is nothing to dismiss.
- The Rule Engine is **never** presented as a fallback, a degraded mode, or a missing feature. It is
  the guaranteed path, and the only one a grader exercises.

## Key Flows

**UJ-1 — Shyam dumps a task between classes and never opens a menu.** Phone, installed PWA, no
login, standing up between buildings.

1. He types "Submit assignment in IBE160 Friday" and taps Add.
2. The task appears in the list before his thumb leaves the screen — under 100ms, with the field
   cleared and a start triangle on the new record.
3. The due date, parsed from "Friday", is already applied and shown as a yellow pill. It is not part
   of the review.
4. A course appears: three purple controls — `school`, `high`, a one-line summary.
5. **Climax: he taps Punch all and the purple leaves the screen.** Three circles fill with ink, the
   values settle into the record in terrain ink, and the task is filed under `school`, shows high
   priority, and has appeared in Due this week — structure he never added.
6. *Edge case:* only Priority is wrong. He punches Tags and Summary, taps Edit on Priority alone,
   picks `high`, applies. One wrong field, one correction, no rejected course. Undo puts a reflex
   punch back.

**UJ-2 — Shyam opens the app cold and trusts what he sees.** Monday morning, offline, on the tram.

1. Today opens on existing tasks. No login, no sync indicator, no spinner.
2. Due this week, Need Attention and High priority are already populated.
3. **Climax: he knows what matters today without having filed anything or built a view** — and
   nothing on screen admits the network is gone.
4. He opens one record to read its notes, and closes it.

**UJ-3 — a grader runs the app with no API key and sees the AI feature work.** Fresh clone, no
account, README open beside the window, desktop.

1. They create a task following the README. A Rule Engine course appears.
2. They punch the proposed Tags, then Edit the proposed Priority and apply it.
3. **Climax: each control lands independently, and the record fills in one field at a time** — "AI
   proposes, human disposes" visible in the interaction rather than asserted in prose.
4. They open Settings and read, as a plain fact, that no API Key is configured and the Rule Engine is
   serving on this device.

**UJ-4 — Shyam brings his own key and the Model Engine takes over.** Desktop browser.

1. He saves his Anthropic API Key. The Cloud Suggestions control appears beside it with its
   disclosure — **still off**.
2. He turns it on, having read what it means.
3. **Climax: the next course is attributed to the Model Engine**, chip and name, so he observes the
   comparison in use rather than only in harness output. Capture felt identical; it never waited.
4. *Edge case:* weeks later his credit runs out. Courses keep arriving with no error and no
   interruption, served by the Rule Engine. Settings explains why the next time he opens it.

## Open Decisions

Three product facts remain undecided and are **not** design's to settle alone. The frames take a
working position on each and say so on screen rather than hiding it.

- **Interface language.** The PRD fixes task text as English only and calls the interface language a
  separate, unanswered question. Frames render English; Settings shows the question.
- **Accessibility conformance standard.** See the Accessibility Floor. Contrast is held; AA is not
  committed.
- **Colour-only encoding.** Frames assume it is never acceptable and publish a legend proving it.
  Confirm it, because it constrains the palette.

One design alternative is also unbuilt: **`d5` may also be built from concept 01 "Date Due"** — the
user flagged it and it has not been drawn.
