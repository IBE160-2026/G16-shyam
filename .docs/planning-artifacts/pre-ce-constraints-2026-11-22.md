---
title: 'Constraints for epics and stories'
type: phase-input
status: final
created: '2026-11-22'
binds: bmad-create-epics-and-stories
sources:
  - prds/prd-To-Do-List-2026-10-31/prd.md
  - ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - ux-designs/ux-To-Do-List-2026-11-16/EXPERIENCE.md
  - architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  - ../../PRODUCT.md
---

# Constraints for epics and stories

Seven decisions were taken on 2026-11-22, before `bmad-create-epics-and-stories` ran, so that the epics
would not be built on a known disagreement between approved documents. Four came first — the shortcuts'
tier, the Fixture's prerequisite status, OQ-1's provisional timeout, and documentation as story-bearing
work. Three followed, closing the questions the first round surfaced: the README's language, the
accessibility standard, and the Fixture's reference date. Each is recorded in the document that owns it;
this file is the single input the epics phase reads, and the checklist it must satisfy.

No requirement was added, removed or reworded. FR-1 – FR-23, NFR-1 – NFR-10 and SM-1 – SM-5 stand exactly
as approved; what changed is build order, one prerequisite, one provisional constant, and one label
mapping.

## 1. "Accept all" / "Reject all" are Tier 1

**Decision.** The two shortcuts are essential, not convenience. They move from PRD §6.3's Tier 3 ("cut
these first") to Tier 1.

**Why.** `EXPERIENCE.md` is locked and builds UJ-1's climax on tapping them — "he taps Punch all and the
purple leaves the screen". The PRD listed them first to be cut. The architecture spine recorded that it
could not settle which approved document won. The builder settled it for the journey.

**What this does not change.** No review behaviour, anywhere:

- They stay composites of the per-control accept and reject, adding no path those lack — PRD FR-10,
  AD-15.
- AD-7's single-step undo slot already holds a **set** of field snapshots, so one undo reverses a
  three-field accept. This was always the design; it is now unconditionally required rather than
  required only if a Tier 3 feature survived.
- They stay **plain outline controls below a rule, never primary**, and Strike stays exactly as
  reachable as Punch — `DESIGN.md`, `EXPERIENCE.md`'s acceptance-rate guard, PRD SM-C1. Tier 1 is a
  statement about build order, not about visual weight. A story that promotes them to primary buttons is
  a regression against SM-C1.

**Labels.** The PRD says "Accept all" / "Reject all"; the UX documents say **Punch all** / **Strike
all**. Same two actions. The UX documents own the words, the PRD owns the behaviour — the same split
AD-9 makes for Smart List labels. Stories use the UX labels for UI strings and the PRD's FR numbers for
acceptance criteria.

**Recorded in.** PRD §2.3 (UJ-1), FR-10, §6.3, §13 item 19; `ARCHITECTURE-SPINE.md` AD-10 note and its
open-questions section.

## 2. FR-19's Fixture is a prerequisite story

**Decision.** The Fixture gets its **own story**, and that story is a prerequisite of every story
touching FR-20, FR-21, SM-1 and SM-3.

**Why.** The Fixture is the measuring instrument (PRD §7). A harness written before it would pin its
expectations inside test code — which is exactly what §4.6 exists to prevent — and SM-1's floor would be
set by what the code already does instead of by FR-7's tables read by hand.

**The story's scope is fixed by FR-19 and AD-12, not by the story author.** 10–15 entries; expected Tags,
Priority, parsed due date and Smart List placement on every entry; the fixed reference date recorded in
the file; committed at `fixture/tasks.json`, outside test code, named in the README. Its hard cases are
enumerated and may not be dropped: the no-keyword-match entry, the entry naming the reference date's own
weekday, the two-date-word entry, the abbreviated weekday, and the `Saturday` entry (FR-19, AD-12's
SM-C2 guard).

**The reference date is decided: Monday 2026-11-16** (2026-11-22, PRD FR-19 and §13 item 25) — the same
date FR-7's worked example uses, so that example is a Fixture entry rather than a parallel case. The
story does not choose it, and four expectations follow from it: the current week is 2026-11-16 to
2026-11-22 (FR-12); `today` → 2026-11-16; `tomorrow` → 2026-11-17; `next week` → 2026-11-23. It also
settles which entry is which: **"Submit assignment in IBE160 Friday" is the ordinary next-occurrence
case** (due 2026-11-20), so the resolve-to-the-reference-date edge case needs a separate entry naming
**`Monday`**, expecting 2026-11-16. This closes the question carried since 2026-11-14.

**One coverage gap this revealed, now decided** (2026-11-22, PRD FR-15 and §13 item 26). No date word
can resolve to the past: `today`, `tomorrow`, `next week` and the five weekday names all land on or
after the reference date. So **no entry whose due date comes from parsing can sit in "Need Attention"**
(FR-12: due date past and not completed), and the same holds for a Sunday due date, which FR-23 cannot
parse at all. FR-15 names Need Attention among the placements expected values are drawn from, but
nothing requires every named list to occur.

**The division of labour, and it is binding on the stories:** the Fixture asserts what parsing can
produce; **FR-12's past-due rule and FR-16's retention window are asserted by unit tests on
`core/selectors.ts` against an injected reference date** (AD-2, NFR-10). FR-19 keeps its shape — no
non-parsed due-date field is added — and no requirement text changed. A story that quietly widens the
Fixture to cover Need Attention is out of scope; a story that leaves FR-12's past-due rule untested
anywhere is a gap.

**Recorded in.** PRD FR-20 ("Prerequisite: FR-19"), §7, §6.3 Tier 1, §13 item 20.

## 3. OQ-1 stays open; the timeout is provisional

**Decision.** OQ-1 is not measured and is not closed. Epics and stories proceed with NFR-2's timeout at a
**provisional 10 s**, and with Haiku 5.5 as the *planned*, unconfirmed provider.

**Why 10 s.** It is the figure OQ-1's own miss branch names. 6 s is what a *passing* measurement would
license, and nothing has been measured — so using 6 s would amount to claiming a pass that never
happened.

**Binding constraint on every story, test, README passage and design note:** the value and the provider
may be used; neither may be described as measured, verified or confirmed. The number lives in exactly
one constant, `MODEL_ENGINE_TIMEOUT_MS` in `core/constants.ts` (AD-5), carrying a comment that says it is
provisional, so the measurement lands in a single edit. No test asserts the value was derived from a real
call. The PRD stays `draft` until the spike runs.

**The spike is not a story.** It is one unattended measurement needing an API key with credit, costing
roughly 5 øre, with the harness already written and the pass bar already set (p50 ≤ 2.5 s, p95 ≤ 6 s).
It belongs to the builder, not to an epic.

**Recorded in.** PRD NFR-2, §12 OQ-1 ("Status 2026-11-22"), §13 item 21; `ARCHITECTURE-SPINE.md` AD-5 and
Deferred; `PRODUCT.md`.

## 4. Setup, testing and documentation are story-bearing

**Decision.** These are not a final tidy-up. Each gets explicit stories inside Tier 1.

**Why.** They carry 10% of the rubric for README and runnability plus 5% for repo tidiness on their own
(PRD §11), and SM-2 is a binary pass that fails silently if left to the last day.

**What must exist as stories, each naming its requirement:**

- **README — clean-clone setup.** A fresh clone to a running app with no key, no account, no network
  (NFR-7, SM-2, UJ-3), plus the two key paths kept apart: the app's key entered in Settings at runtime,
  the harness's key as a Node environment variable, with `.env.example` documenting only the latter and
  saying in as many words that the app never reads it (OQ-4, PRD §13 item 13, AD-8).
- **README — the Fixture's path**, named, as FR-19 requires.
- **README — NFR-9's prose.** The two implementations; why they beat rules-only and a local model; the
  privacy trade-off and how consent is handled; the measured FR-21 results. Plus the screenshot or
  recording of a Model Engine Suggestion carrying FR-11's attribution — which needs a working key and at
  least one real call, so the story must say so (`issues.md`, 2026-11-02).
- **README — the architecture section.** `README-ARCHITECTURE-SECTION.md` exists, written for this, and
  needs three mechanical edits on paste: frontmatter removed, H1 down one level, and the
  `./ARCHITECTURE-SPINE.md` link repointed — it 404s from the repository root (`issues.md`, 2026-11-18).
- **Testing.** NFR-8's mocked-API coverage of every FR-9 failure mode; NFR-10's fixed-date discipline
  across FR-23, FR-12, FR-15, FR-16 and the FR-20/FR-21 harness; FR-15's Smart List placement assertions;
  AD-19's CI gate running with no key and no network, failing below the SM-1 floor; AD-17's `axe-core`
  pass at 360 px and 1280 px.

**Language: English**, decided 2026-11-22 (PRD §6.1, §13 item 23). Every artifact a grader reads is in
one language — PRD, `DESIGN.md`, `EXPERIENCE.md`, the spine, the README. `.logs/` stays Norwegian; it is
the builder's record, not a deliverable. Setup instructions, the Fixture path, NFR-9's prose and the
architecture section are all written in English.

**Accessibility, for the stories that touch UI:** WCAG 2.2 AA is the confirmed floor (2026-11-22, PRD
NFR-4, §13 item 24). Stories inherit three concrete things — in-panel targets ≥24×24 CSS px, the
panel-never-covers-type contract as an SC 2.4.11 assertion, and `axe-core` at both widths as evidence
rather than a conformance claim. The README says "built to WCAG 2.2 AA, checked with axe-core" and never
"conformant".

**Recorded in.** PRD §6.3 Tier 1, §13 item 22.

## 5. Three questions closed on the same day

- **README language: English** (PRD §6.1, §13 item 23). See §4.
- **Accessibility: WCAG 2.2 AA as a floor** (PRD NFR-4, §13 item 24; spine AD-17; `PRODUCT.md`;
  `EXPERIENCE.md`). It closed both of `PRODUCT.md`'s remaining `[OPEN]` facts at once, because
  no-colour-alone is the standard's own SC 1.4.1. Two tokens were raised to SC 2.5.8's **24×24 CSS px**:
  `button-height` from 20px and `row-height-desktop` from 21px (`DESIGN.md`, plus `EXPERIENCE.md`'s
  accessibility floor). Density is still the concept's point; 24px is the floor, not a loosening.
- **Fixture reference date: Monday 2026-11-16** (PRD FR-19, §13 item 25). See §2 — including the
  coverage split it forced between the Fixture and the selector unit tests (PRD FR-15, §13 item 26).
- **Desktop row density:** `row-height-desktop` 21px → 24px, the second of the two token changes AA
  forced. Decided rather than left to the build, because it touches the chosen concept's density.

## Checklist for the epics phase

A pass needs all ten:

1. The "Accept all" / "Reject all" shortcuts appear in Tier 1 stories, with FR-10's per-part behaviour
   unchanged and no promotion to primary visual weight.
2. UI strings use the UX labels (Punch all / Strike all); acceptance criteria cite FR numbers.
3. FR-19 has its own story, and every FR-20, FR-21, SM-1 and SM-3 story declares it as a prerequisite.
4. No story, test or acceptance criterion describes NFR-2's 10 s or the Haiku 5.5 choice as measured,
   verified or confirmed.
5. The timeout appears as one named constant, never inlined.
6. Setup, testing and documentation have their own stories inside Tier 1, each naming its requirement.
7. Every story can name its row in the spine's Capability → Architecture Map. A story that cannot is a
   story whose scope is not yet settled.
8. Every artifact a story produces for a grader is in **English**, the README included.
9. UI stories inherit the WCAG 2.2 AA floor: targets ≥24×24 CSS px, the panel-never-covers-type
   assertion, `axe-core` at 360 px and 1280 px — and no story, test name or README passage claims
   conformance.
10. The FR-19 story uses **Monday 2026-11-16** as the reference date, puts the IBE160 Friday entry in
    the ordinary case, and gives the resolve-to-reference-date case its own `Monday` entry. FR-12's
    past-due rule and FR-16's window are covered by selector unit tests against an injected reference
    date — not by a Fixture entry, and not left uncovered.
