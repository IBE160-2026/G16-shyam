# Shared brief — To-Do-List concept exploration

Every concept subagent reads this file in full before drawing anything. It fixes what is identical
across all five concepts so the user can compare worlds rather than content. Your concept packet
fixes what is yours alone.

**Read first, in this order:** this file → `PRODUCT.md` at the project root → the craft floor at
`C:\Users\sabis\.claude\skills\impeccable\reference\craft-floor.md`. Do not read the PRD; everything
you need from it is here or in PRODUCT.md.

---

## 1. What this product is, in one sentence

You type a task the way you would say it out loud; the app proposes three separable pieces of
structure for it — **Tags**, **Priority**, **Summary** — and files none of them until you accept
each one, telling you which of two engines proposed it.

The task is saved **before** anything is proposed. Capture never waits.

## 2. The stage you are working at

Concept exploration only. The user will review five concepts side by side and pick one, then go into
detail. You are not building the app, not writing DESIGN.md, and not resolving open questions. You
are showing a committed visual world applied to every surface of a real product, convincingly enough
that choosing between the five is a real decision.

## 3. Operate-mode law (this governs everything you draw)

This is an **Operate** surface: the visitor completes a task. Someone who uses tools like this should
know where everything is before they notice the world.

**The world lends exactly four things and only these: type, palette, density, and one signature
move.** It never supplies the layout, the navigation model, or the controls.

- Every control is a **standard web control the user already knows**: buttons, tabs, text inputs,
  selects, checkboxes, segmented controls, a list, a nav rail, a nav that reads as nav. Never a
  costume of the world's own objects — no rubber-stamp-shaped buttons, no ticket-stub tab bars, no
  map-legend standing in for navigation. If an engineer could not build it from standard components,
  it is a picture of the world, not the product.
- **Colour does real jobs** and commits at screen scale: the shell (a coloured rail, header, or
  tinted ground), state colours, selection, the signature move. A grey screen with one accent colour
  is the category default without the category's polish — that is a fail, not restraint.
- Draw the product's **shell first**: the navigation, the work areas and what each is for, the data
  the user reads first and its states. Then place the signature move.
- Expression may never obscure the task, the state, or a familiar affordance.
- The finish bar is **the best product in this category**: aligned grid, consistent spacing, a real
  type scale, clear hierarchy. The signature move adds to a screen that is already that clean; it
  never stands in for it.

**Self-check every frame:** with the product name covered, does it read as a task manager, could the
user do the task from it, and is it at least as clean as the category standard and more distinctive
than it? If it reads as an artifact of your world first, redraw it with the shell and work areas
named region by region and the world held to its four contributions.

## 4. The surfaces — 17 frames, exact

Produce **17 SVG frames**. Mobile frames are `360 × 800`. Desktop frames are `1280 × 800`. These two
widths are not decorative: NFR-4 requires every flow, and specifically accept/edit/reject, to be
usable at 360 px and 1280 px **with no horizontal scrolling**, demonstrated at both. The course
instructor's feedback on the product brief names this explicitly as a graded expectation:
*"Vis i UX-steget hvordan godta/endre/avvis ser ut på mobil og PC."* Frames M3–M5 and D2–D4 are that
demonstration and are the most important things you will draw.

### Mobile, 360 × 800

| File | Surface | What it must show |
|---|---|---|
| `m1-today.svg` | Today (cold open) | The default view with no action taken: capture field, and the Smart Lists **Due this week**, **Need Attention**, **High priority** already populated from existing tasks. No sync indicator, no spinner, no empty state. This is the trust surface. |
| `m2-capture-pending.svg` | Capture, suggestion pending | The task the user just typed, already saved and in the list, with a pending indicator and still fully editable. The pending indicator is the one thing allowed to appear offline. |
| `m3-review-proposed.svg` | **Suggestion review — hero** | All three parts proposed and unreviewed. Per-part accept / edit / reject for each of Tags, Priority, Summary; "Accept all" and "Reject all"; engine attribution. See §6. |
| `m4-review-editing.svg` | **Review — editing one part** | Only Priority is wrong. Tags and Summary accepted; Priority in its edit state with `high` being chosen. One wrong field costs one correction. |
| `m5-review-partial-undo.svg` | **Review — partial + undo** | Tags accepted with its undo live, Priority rejected, Summary still pending. Three different part-states visible at once on one task. |
| `m6-task-detail.svg` | Task detail | Every field: task text, due date, Project, notes, Tags, Priority, Summary, completed state. Complete, delete, and "Suggest again". |
| `m7-smartlist.svg` | Smart List open | **Need Attention** open, with navigation to the other Smart Lists and the per-tag lists. |
| `m8-settings-no-key.svg` | Settings — no key | The grader's view. States plainly that no API Key is configured and the Rule Engine is active. **This must not read as an error, a warning, or a missing feature.** |
| `m9-first-run.svg` | First run | No tasks at all. What the product says for itself before it has any content. |

### Desktop, 1280 × 800

| File | Surface | What it must show |
|---|---|---|
| `d1-today.svg` | Today | The same cold-open surface at desktop width. The shell's real answer to a wide viewport — not the phone column centred in grey. |
| `d2-review-proposed.svg` | **Review — hero** | The same state as `m3` at 1280. Must be a genuinely different compositional answer, not the mobile layout stretched. |
| `d3-review-editing.svg` | **Review — editing one part** | The same state as `m4` at 1280. |
| `d4-review-partial-undo.svg` | **Review — partial + undo** | The same state as `m5` at 1280. |
| `d5-task-detail.svg` | Task detail in the shell | Detail alongside the list, as a desktop actually affords. |
| `d6-archive.svg` | Archive | Archived completed tasks, retrievable, clearly not deleted. |
| `d7-settings-cloud-off.svg` | Settings — key saved, cloud off | An API Key is stored. The Cloud Suggestions control sits beside the key field, **still off**, with its disclosure. Saving a key never enables it. |
| `d8-settings-failure.svg` | Settings — persistent failure | The plain status after a persistent failure. See §7 — the three reasons must read distinctly, and this status appears **only** here. |

## 5. The content — use these exact strings, invent none

All five concepts show the same corpus so the user compares worlds, not copy. Reference date is
**Monday 2026-11-16** (today). Every tag and priority below is what the Rule Engine's published
keyword tables actually produce — they are hand-derivable, so do not alter them.

| Task text | Tags | Priority | Due |
|---|---|---|---|
| `Submit assignment in IBE160 Friday` | `school` | `high` | Fri 20 Nov |
| `Group meeting about the presentation tomorrow` | `group` | `high` | Tue 17 Nov |
| `Pick up shift timesheet from boss today` | `work` | `high` | Mon 16 Nov |
| `Study for the exam` | `school` | `high` | — |
| `Buy birthday present next week` | `personal` | `medium` | Mon 23 Nov |
| `Call the doctor` | `personal` | `medium` | — |
| `Clean the kitchen eventually` | `personal` | `low` | — |
| `Figure out the thing` | *(none)* | `medium` | — |
| `Submit lab report in IBE160` | `school` | `high` | Sat 14 Nov — **past due** |
| `Pay rent` | `personal` | `medium` | Tue 10 Nov — **past due** |

- **Due this week** (Mon 16 – Sun 22 Nov): the IBE160 assignment, the group meeting, the timesheet.
- **Need Attention** (past due, not completed): `Submit lab report in IBE160`, `Pay rent`.
- **High priority**: the assignment, the group meeting, the timesheet, `Study for the exam`,
  `Submit lab report in IBE160`.
- **Tags in use**, so exactly these per-tag lists exist: `school`, `group`, `work`, `personal`.
- `Figure out the thing` is the deliberate no-match case: no tags, medium priority, no due date. It
  is a valid outcome, not a failure, and the interface must not render it as one.

**The hero suggestion**, used in M3–M5 and D2–D4:

- Task text: `Submit assignment in IBE160 Friday`
- Proposed Tags: `school`
- Proposed Priority: `high`
- Proposed Summary: `Submit assignment in IBE160`
- Attributed to: **Rule Engine**
- The parsed due date **Fri 20 Nov** is already applied and is *not* part of the suggestion — it
  skips review entirely and is editable at once. Do not draw it as something to accept.

Interface strings are English. (The PRD fixes *task text* as English only and calls the *interface*
language a separate, open question — so use English and do not treat it as settled.)

## 6. The accept / edit / reject flow — the specification

This is the product's whole idea and the most graded thing you will draw. Get it exactly right.

- **Three parts, reviewed independently.** Tags, Priority and Summary are each accepted, edited or
  rejected **separately, in any combination.** Acting on one must visibly not touch the other two.
- **Accepting a part is reversible** — immediately after accepting, a single-step undo restores that
  field's prior value. Show the undo as a real, reachable affordance in `m5` / `d4`.
- **Accepting writes only that part.** The others keep their prior values until acted on.
- **Editing applies the edited value**, not the proposed one. **Rejecting leaves the field as it was**
  and does not re-apply that part later.
- **"Accept all" and "Reject all"** exist as shortcuts and add no behaviour the per-part actions
  lack. They must **not** be the visually dominant path — see the counter-metric below.
- **A suggestion with any part unreviewed stays visibly pending** on the task.
- **Engine attribution is always visible** in the review: `Rule Engine` or `Model Engine`.
- **"Suggest again"** is an explicit action on a task, never automatic.

**A hard constraint, from the PRD's own counter-metrics:** the interface must **not** make Accept the
path of least resistance. A high acceptance rate is equally consistent with good suggestions and with
a review UI that nudges. **Editing or rejecting a single part must be as reachable as accepting all
three.** A design where "Accept all" is a big primary button and per-part actions hide behind a
disclosure has failed this brief, however handsome it looks.

**Do not encode priority or engine provenance by colour alone.** Carry them in a mark, a shape, a
letterform, a position, or a label as well. (This is an open question the user has never confirmed,
so honour it and say you did.)

## 7. Settings copy — the exact meanings

Settings is the **only** place any engine problem is ever visible. No popup, banner, toast or badge
anywhere else, ever. Write plain, non-alarming copy in your concept's own voice, carrying these
meanings exactly:

- **No key** (`m8`): no API Key is configured, and the Rule Engine is serving suggestions on this
  device. Stated as a fact. Not an error, not a prompt to fix something, not a greyed-out feature.
- **Key saved, cloud off** (`d7`): a key is stored. Beside it, the Cloud Suggestions control, still
  off, disclosing that turning it on sends task text to the **Anthropic API**, that the key is the
  user's own, and that the Rule Engine remains the fallback.
- **Persistent failure** (`d8`): three statements — that the Model Engine is not being used, the
  reason, and that the Rule Engine is serving suggestions normally. The reason is one of three, and
  they must read **distinctly**:
  1. the API Key was rejected;
  2. its credit or quota is used up;
  3. **the key's organization does not permit browser calls at all.** This one is not a key fault —
     the key is valid and nothing the user does to it will help. It must not be worded as
     "rejected", or the user goes hunting for a fault that is not theirs.

  Draw reason 3, and show the other two as the alternative states.

## 8. Technical form

- **One self-contained `.svg` file per frame**, in your concept's output directory. `viewBox` exactly
  `0 0 360 800` or `0 0 1280 800`, with matching `width` / `height`.
- **No external references of any kind** inside the SVG: no `<image href>` to a file, no fetches, no
  scripts. Everything is vector and text you draw.
- **Type:** name real faces in `font-family` with a sensible fallback stack, e.g.
  `font-family="'Archivo Narrow', 'Helvetica Neue', sans-serif"`. The gallery page loads your faces
  from Google Fonts, so they will render. Pick faces from the Google Fonts catalogue with a point of
  view. **Banned as display faces** (they are the training-data defaults): Fraunces, Playfair
  Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter as
  a display face, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans. Workhorse UI faces
  and system stacks are welcome for body and apparatus — this is an Operate surface.
- **Tabular numerals** wherever dates or counts sit in a column (`font-variant-numeric: tabular-nums`
  via a `style` attribute).
- **Draw icons**, in one consistent stroke weight. Never a Unicode glyph or emoji standing in for an
  icon.
- **Text must be real `<text>`**, never paths, so the frames are searchable and legible.
- Honour the craft floor: body and placeholder text at **≥4.5:1** contrast against its actual
  background, large text ≥3:1. Check your own palette against this rather than assuming; a concept
  whose small type fails contrast has failed a graded requirement. Refuse the floor's listed
  defaults — no kicker/eyebrow above a heading (a ban, not a preference), no same-size icon+heading+
  text cards as the page structure, no gradient text, no hard zero-blur offset shadows unless your
  world genuinely is neobrutalist, no monospace as a costume for "technical".
- Decide light or dark from the use scene — a phone between classes, and a cold Monday tram, and a
  desktop beside a README — not from category habit.

## 9. What to write, and where

Your concept packet names your directory, `.../concepts/<NN-slug>/`. Write into it:

1. The **17 `.svg` frames**, named exactly as the tables in §4 specify.
2. **`CONCEPT.md`** — at most 700 words, in English, with these headings and nothing else:
   - `## Thesis` — the one idea this concept owns, and the category-default arrangement it refuses.
   - `## World` — palette with hex values and the job each colour does; the faces and their roles;
     the density rule. Specific enough to be recognisable with all content removed.
   - `## Signature move` — named concretely, and where it lives on which frames.
   - `## Accept / edit / reject` — how the three-part review works here, how per-part actions stay as
     reachable as Accept all, how undo is surfaced, and how priority and provenance avoid
     colour-only encoding.
   - `## 360 and 1280` — what actually changes between the two widths, and why that is the right
     answer rather than a reflow.
   - `## Honest risk` — the real cost of choosing this concept. Not a disclaimer; the thing that
     would genuinely be hard or would wear badly. A concept with no honest risk has not been
     thought through.
3. **`palette.json`** — `{"name": "...", "fonts": ["Google Font Family", ...], "colors": {"role": "#hex", ...}}`.
   The gallery reads this to build the font links and the palette chips, so the font names must be
   exactly as Google Fonts spells them.

Then run, from the project root:

```
python .docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/.working/concepts/build-concept-page.py <NN-slug>
```

It inlines your frames into a reviewable `concept.html` beside them. Open the result and **look at
it** before you report: confirm every frame renders, no text overflows its box, no frame is blank,
and the small type is actually readable at 100%. Fix what one look shows, then look once more. Two
rounds is the ceiling.

## 10. What to report back

Six lines, no HTML and no SVG dumped into your report:

1. Your concept's name and its one-line personality.
2. The signature move, in one line.
3. Paths: the directory, and `concept.html`.
4. Frame count written, and any frame you could not complete and why.
5. The honest risk, in one line.
6. Anything in this brief you could not satisfy, named plainly. Do not quietly drop a requirement —
   an unmet requirement reported is useful; an unmet requirement hidden costs the whole round.
