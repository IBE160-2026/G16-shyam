---
title: "Sprint Change Proposal — six mechanism defects in approved documents"
date: 2026-11-25
status: approved and applied — 2026-11-25
approved_by: Shyam
applied: "4.1 – 4.13, all 13 edits; 3 files, 54 insertions, 18 deletions"
revision: "Rev 1, 2026-11-25: engine-strict verified empirically against the approved stack on Node 26.12.1; uncovered finding 1b (the declared 22.12 floor), §4.1 rewritten, §4.11–4.13 added"
trigger: "Independent review of the Story 1.1 spec, 2026-11-25"
scope_classification: minor
mode: batch
author: Shyam
sources:
  - ../../.logs/shyam-chandra-k-c/984-2026-11-25-10-56-06-story-1-1-spec-og-angret.md
  - prds/prd-To-Do-List-2026-10-31/prd.md
  - epics.md
  - architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  - ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
artifacts_modified:
  - architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  - ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md
  - epics.md
artifacts_unchanged:
  - prds/prd-To-Do-List-2026-10-31/prd.md
  - ux-designs/ux-To-Do-List-2026-11-16/EXPERIENCE.md
  - ../implementation-artifacts/sprint-status.yaml
---

# Sprint Change Proposal — six mechanism defects in approved documents

## 1. Issue Summary

### Problem statement

Six passages across three approved planning documents **name an outcome without naming the
mechanism that produces it**. Each is a correct decision. None of them is executable as written.

They were found on 2026-11-25 when `bmad-build` step 2 translated Story 1.1 into a spec, and an
independent review checked every named mechanism against the tool that would have to carry it — the
npm registry, ESLint 10's language support, Vite's dev-server behaviour, and the default layout
feature set of `woff2` subsetters.

### Why the planning gates did not catch them

Nothing regressed. The documents are unchanged since 2026-11-22; `main` stands at `8b58459` with no
code written and all 38 stories at `backlog`.

The readiness gate of 2026-11-24 asked one question — *can a developer implement these epics without
inventing decisions nothing documents?* — and returned **PASS** correctly: 23/23 FR, 10/10 NFR, 24/24
UX-DR covered, traceability in both directions, no orphans. Nothing is undocumented.

These six answer a different question: **is the documented decision executable as written?** That
question has no gate in the planning phase. It can only be asked by the first consumer who must
replace the word *mechanically* with a filename and a flag.

Finding 2 is the exception and is recorded as such: it was readable all along, and on 2026-11-22 the
defective value was **copied forward** into `epics.md` UX-DR1 as though it were a length. It passed
`bmad-review lenses=structure,prose`, the five architecture reviews, and the readiness gate, because
none of them asks whether a token's value is a length.

### Evidence

| # | Document passage | What it claims | Why it cannot execute |
|---|---|---|---|
| 1 | Spine, Stack note (line 505–507) | a grader on Node 23 "must get a clear message, not a mystery failure" | `package.json` `engines` + `.nvmrc` only make npm **warn** (`EBADENGINE`); install proceeds |
| 2 | `DESIGN.md` frontmatter (51, 67–69) | four of the 43 tokens carry values | they are **ranges**, and one carries a keyword: a range is not a valid custom-property value in a length context |
| 3 | Spine AD-11 (line 308) | CSP `connect-src` "enforced mechanically" | does not say **where**; a static meta tag also applies in dev, where the React plugin injects inline react-refresh, Tailwind injects `<style>`, and HMR opens `ws://` — breaking `npm run dev`, the command AC 1 is measured on |
| 4 | Spine AD-18 (line 429) | "a raw hex colour outside `theme.css` fails CI" | ESLint 10 does not parse `.css` without a language plugin, so the stated enforcer cannot read the file type the rule exists to guard |
| 5 | Spine AD-11 (line 312–314) | subsetting "must preserve the `tnum` OpenType feature" | does not name the flag; subsetters omit `tnum` from their default layout-feature set, and `font-variant-numeric: tabular-nums` computes as set **even when the font lacks the feature**, so CSS cannot be the proof |
| 6 | `epics.md` Story 1.1 AC 1 (line 322) | "a clean clone on Node 22.12 **or later**" | contradicts the spine's already-approved Stack row — "majors 23 and 25 unsupported" — and the story's own Notes line |

Finding 6 is derived: it was found while verifying finding 1, and it is an inconsistency between two
approved documents rather than a missing mechanism.

### Finding 1b — the declared Node floor is not reachable with the approved `eslint` pin

Discovered 2026-11-25 while verifying that `engine-strict=true` is safe for the approved stack
(Rev 1). It is a dependent defect of finding 1, not a seventh item of scope, and it changes **no
pinned version**.

`eslint@10.15.0` — an approved pin — declares `engines: ^20.19.0 || ^22.13.0 || >=24`. **Node 22.12.0
does not satisfy it.** The approved floor of 22.12 was therefore never achievable with the approved
lint chain, independently of anything in this proposal.

Computed intersection of the `engines` of all 18 pinned packages:

| Node | Verdict | Rejected by |
|---|---|---|
| 22.12.0 | **FAIL** | `eslint` |
| 22.13.0 | ok | — |
| 23.11.0 | **FAIL** | `vitest`, `eslint` |
| 24.5.0 | ok | — |
| 25.4.0 | **FAIL** | `vitest` |
| 26.12.1 | ok | — |

The spine's exclusion of majors 23 and 25 is **confirmed correct**. Only the 22-line floor is off, by
one minor version.

**Origin, traceable.** `architecture-To-Do-List-2026-11-18/.memlog.md` line 41 records
`eslint 10.15.0 (engines ^20.19.0 || ^22.13.0 || >=24)` — the tech-currency review had the datum on
2026-11-18. Line 42 then restates the floor as 22.12, derived from Vite and Vitest alone;
`reviews/review-tech-currency.md` §5 intersects `typescript-eslint` against the floor but never
`eslint` itself. The number was published from an incomplete intersection, not from a wrong reading.

**Why `engine-strict` makes it matter.** Today a grader on 22.12 gets a warning and a working install.
Under finding 1 they would get a hard refusal naming a range the documents call supported — the
mechanism contradicting the number it enforces.

## 2. Impact Analysis

### Epic impact

**None.** No epic changes scope, acceptance criteria, sequence or priority. No epic is added,
removed, deferred or redefined. All six findings land inside Epic 1 Story 1.1's existing substrate
work, which the epic already owns ("The substrate the other seven epics stand on is built inside
these slices, never as a story of its own").

### Story impact

| Story | Impact |
|---|---|
| 1.1 | AC 1 reworded (finding 6); AC 3's "43 tokens" and "`tnum` preserved" wording **unchanged** — the token count survives and the proof method belongs to AD-11 |
| 1.2 – 8.3 | none; no prerequisite, no AC, no requirement reference changes |

No story is added, removed, split or renumbered. `sprint-status.yaml` needs no edit — checklist item
6.4 is **N/A**.

### Artifact conflicts

| Artifact | Status |
|---|---|
| `ARCHITECTURE-SPINE.md` | 6 passages edited (AD-11 ×2, AD-18, AD-19, Stack note, Stack table row), Structural Seed gains 2 files, `updated` bumped |
| `DESIGN.md` | 4 frontmatter tokens re-expressed, 1 clarifying line, `updated` bumped |
| `epics.md` | UX-DR1 clause, pinned-stack line, Story 1.1 AC 1 |
| `review-tech-currency.md`, `.memlog.md` | **unchanged** — dated process records; editing them would falsify the trail that explains finding 1b |
| `prd.md` | **unchanged** — no FR, NFR, SM or §13 decision is affected |
| `EXPERIENCE.md` | **unchanged** |
| `sprint-status.yaml` | **unchanged** |

### Technical impact

Two new repository files, both already implied by the decisions they serve:

- `.npmrc` — `engine-strict=true`
- `scripts/check-hex.mjs` — plain Node, no new dependency

No dependency is added, removed or re-pinned. AD-13's `typescript@6.0.3`, AD-19's `npm ci` against an
exact-version lockfile, and all 18 pinned Stack versions stand untouched.

## 3. Recommended Approach

### Path forward: Option 1 — Direct Adjustment

| Option | Verdict |
|---|---|
| **1. Direct Adjustment** | **Viable — selected.** Effort **Low**, risk **Low** |
| 2. Potential Rollback | **Not viable.** Nothing to roll back: no code exists, no story has left `backlog` |
| 3. PRD MVP Review | **Not viable, and not needed.** No requirement, tier or success metric is affected; the MVP is unchanged |

### Rationale

All six are **clarifications of existing decisions**, not changes to them. Every edit names a
mechanism for an outcome the approved documents already committed to. Not one edit alters what the
product does, what it looks like, what it is built from, or what it must prove.

The timing is the cheapest available. Story 1.1 is the substrate the other 37 stories inherit; the
same defects found during Epic 3 would have cost rewriting what stood on them.

### Timeline impact

None. The corrections are a document pass with no implementation dependency, and they unblock Story
1.1 rather than delaying it.

## 4. Detailed Change Proposals

### Architecture — `ARCHITECTURE-SPINE.md`

---

#### 4.1 — Stack note: `.npmrc` names the enforcement (finding 1)

**Section:** Stack, closing paragraph (lines 505–507)

**OLD**

> Vitest's `engines` excludes odd Node majors, so the floor is pinned in `package.json` `engines`
> plus an `.nvmrc` — a grader arriving on Node 23 must get a clear message, not a mystery failure.

**NEW**

> Vitest's `engines` excludes odd Node majors and `eslint@10.15.0` raises the 22-line floor to
> `^22.13.0`, so the supported set is the intersection of all 18 pinned packages:
> **`^22.13.0 || ^24.0.0 || >=26.0.0`**, declared verbatim in `package.json` `engines`. `engines`
> alone does not enforce it — npm treats a mismatch as the warning `EBADENGINE` and installs anyway.
> The repository therefore commits an **`.npmrc` carrying `engine-strict=true`**, which turns that
> warning into a failed `npm ci` naming the required range. `.nvmrc` carries the **recommended**
> major, `26`, so a grader using `nvm` lands inside the range rather than on its edge. A grader
> arriving on Node 23 or 25 gets that message instead of a mystery failure.

**Rationale:** the stated outcome ("a clear message, not a mystery failure") is unreachable from the
stated mechanism. `engine-strict=true` is the only npm-native setting that produces it, and it needs
no dependency. The range is stated explicitly because `>=22.12` — the floor as previously worded —
would admit Node 23 and 25 and so make findings 1 and 6 contradict each other.

**Verified empirically, 2026-11-25** (Rev 1), on Node 26.12.1 / npm 11.20.0:

- **A real `npm install` of all 18 pinned packages with `engine-strict=true` succeeds** — 473 packages
  resolved, zero `EBADENGINE`. No pinned package and no transitive dependency declares an upper bound
  that excludes Node 26.
- **The mechanism is confirmed in both directions.** With `engine-strict=true` and an `engines` range
  excluding the running Node, npm prints `npm error code EBADENGINE … notsup Not compatible` and
  installs **nothing**. With the same `package.json` and `.npmrc` removed, it prints
  `npm warn EBADENGINE` and installs anyway. That is exactly the difference finding 1 asserts.

---

#### 4.2 — AD-11: where the CSP is applied (finding 3)

**Section:** AD-11 — Rule (line 308)

**OLD**

> This is **enforced mechanically by a Content-Security-Policy `connect-src`** limited to that host,
> not left to review.

**NEW**

> This is **enforced mechanically by a Content-Security-Policy `connect-src`** limited to that host,
> not left to review. The policy is **injected into the built `index.html` by the Vite config
> (`transformIndexHtml` with `apply: 'build'`)**, never authored as a static meta tag: a tag applies
> in development too, where the React plugin injects inline react-refresh, Tailwind injects a `<style>`
> element and HMR opens a `ws://` connection, so a dev-time policy breaks `npm run dev` — the command
> Story 1.1 AC 1 is measured on. The shipped artifact carries the policy; the dev server does not.

**Rationale:** the CSP decision is unchanged — one host, `connect-src`, mechanical. Only its
injection point is named, and naming it resolves a direct conflict with AC 1.

---

#### 4.3 — AD-11: the subsetting flag and the proof (finding 5)

**Section:** AD-11 — Rule (lines 312–314)

**OLD**

> Font subsetting **must preserve the `tnum` OpenType feature**, because DESIGN.md specifies tabular
> numerals and aggressive `woff2` subsetting strips it silently.

**NEW**

> Font subsetting **must preserve the `tnum` OpenType feature**, because DESIGN.md specifies tabular
> numerals and aggressive `woff2` subsetting strips it silently. Subsetters omit `tnum` from their
> default layout-feature set, so the feature must be **requested explicitly** — with `pyftsubset`,
> `--layout-features=+tnum`. The proof is the **GSUB table of the committed `woff2`**, not a computed
> style: `font-variant-numeric: tabular-nums` computes as set even when the font no longer carries
> the feature, so CSS cannot witness its own failure here.

**Rationale:** AD-11's warning was correct and is kept verbatim; the flag and the evidence standard
are added. `pyftsubset` appears as the worked example of a general rule, not as a newly pinned tool —
no approved document names a subsetter, and this proposal does not introduce one.

---

#### 4.4 — AD-18: what enforces the hex rule (finding 4)

**Section:** AD-18 — Rule (line 429)

**OLD**

> **A raw hex colour outside `theme.css` fails CI** — the mechanical guard on the purple reservation.

**NEW**

> **A raw hex colour outside `theme.css` fails CI** — the mechanical guard on the purple reservation.
> ESLint cannot be that guard: it does not parse `.css` without a language plugin, and adding one
> would widen the lint chain AD-13 and AD-19 pin. The enforcer is a repository scanner,
> **`scripts/check-hex.mjs`, run inside `npm run lint` as `eslint . && node scripts/check-hex.mjs`** —
> plain Node, no new dependency. Running it inside `lint` rather than as a separate job is deliberate:
> it keeps Story 1.1 AC 4's five named CI checks at five.

**Rationale:** the rule is unchanged; the named enforcer could not read the file type the rule exists
to guard. Keeping the scanner inside `lint` avoids editing AC 4, AD-19's check list, or the CI
workflow's shape.

---

#### 4.5 — Structural Seed: the two files the above require

**Section:** Structural Seed (lines 513–514)

**OLD**

```text
  index.html                 # CSP meta: connect-src limited to the Anthropic host (AD-11)
  package.json  package-lock.json  vite.config.ts  tsconfig.json  eslint.config.js  .nvmrc
```

**NEW**

```text
  index.html                 # no CSP tag — the policy is build-injected by vite.config.ts (AD-11)
  package.json  package-lock.json  vite.config.ts  tsconfig.json  eslint.config.js  .nvmrc
  .npmrc                     # engine-strict=true — makes the engines floor a failure, not a warning (AD-13)
  scripts/
    check-hex.mjs            # raw-hex scanner, run inside `npm run lint` (AD-18)
```

**Rationale:** the tree is the build's checklist. Without these two entries, findings 1 and 4 have no
home, and the `index.html` comment states the opposite of 4.2.

---

#### 4.6 — Spine frontmatter

**OLD:** `updated: '2026-11-22'`  **NEW:** `updated: '2026-11-25'`

---

### UX — `DESIGN.md`

---

#### 4.7 — Four tokens re-expressed as `-min` / `-max` pairs (finding 2)

**Section:** frontmatter — `typography` (line 51) and `spacing` (lines 67–69)

**OLD**

```yaml
  apparatus-tracking: "0.6–1.5px, uppercase"
...
  group-gap: "10–16px"
  field-height: "26–32px"
  button-height: "24–26px"
```

**NEW**

```yaml
  apparatus-tracking-min: "0.6px"
  apparatus-tracking-max: "1.5px"
...
  group-gap-min: "10px"
  group-gap-max: "16px"
  field-height-min: "26px"
  field-height-max: "32px"
  button-height-min: "24px"
  button-height-max: "26px"
```

Plus one clarifying line added below the `components` block:

> **Token count.** Four of the 43 are ranges rather than single lengths, and each is declared as a
> `-min` / `-max` pair of custom properties. **A pair counts as one token**, so the totals stand at
> 16 colour, 13 typography, 3 radius, 11 spacing — 43. The `uppercase` formerly carried inside
> `apparatus-tracking` is not a tracking value and is not a token: it is `text-transform: uppercase`
> on the apparatus type style, where the Typography section has always stated it.

**Rationale:** the numbers are preserved verbatim — nothing is rounded, widened or chosen. A range
cannot be the value of a custom property in a length context, so the four were literally
undeclarable, which made UX-DR1 and Story 1.1 AC 3 unsatisfiable.

The pair-counts-as-one convention is the minimum-change option: re-counting to 47 would force edits
to AD-18's "all **43**", its `(16 colour, 13 typography, 3 radius, 11 spacing)` breakdown, UX-DR1's
count and AC 3's count. This way four approved numbers stay untouched.

`uppercase` loses nothing: DESIGN.md's Typography section already reads *"Barlow Condensed 700,
uppercase and tracked `0.6–1.5px`"*. The body prose keeping the ranges as prose (Typography, and
Layout's "10–16px between a band's last record and the next band") is correct usage and is **not**
edited.

---

#### 4.8 — DESIGN.md frontmatter

**OLD:** `updated: 2026-11-22`  **NEW:** `updated: 2026-11-25`

---

### Epics — `epics.md`

---

#### 4.9 — UX-DR1: the quoted range (finding 2, downstream)

**Section:** UX Design Requirements, UX-DR1 (line 111)

**OLD**

> …with the exact values in `DESIGN.md`'s frontmatter — including `row-height-desktop: 24px` and
> `button-height: 24–26px` as raised on 2026-11-22.

**NEW**

> …with the exact values in `DESIGN.md`'s frontmatter — including `row-height-desktop: 24px` and the
> `button-height-min: 24px` / `button-height-max: 26px` pair as raised on 2026-11-22. Four of the 43
> are ranges declared as `-min` / `-max` pairs; each pair counts as one token, so the count and its
> 16/13/3/11 breakdown are unchanged.

**Rationale:** UX-DR1 is where the defective value was copied forward on 2026-11-22. The 2026-11-22
decision itself — 24 px minimum for WCAG 2.2 AA SC 2.5.8 — is preserved exactly, including its date.

---

#### 4.10 — Story 1.1 AC 1: the supported Node set (finding 6)

**Section:** Epic 1, Story 1.1, Acceptance Criterion 1 (line 322)

**OLD**

> 1. **Given** a clean clone on Node 22.12 or later **When** I run `npm ci` and `npm run dev`
> **Then** the app serves on localhost **And** no API key, account or network access was required
> (SM-2, NFR-7).

**NEW**

> 1. **Given** a clean clone on a supported Node — `^22.13.0 || ^24.0.0 || >=26.0.0`, 26 LTS
> recommended — **When** I run `npm ci` and `npm run dev` **Then** the app serves on localhost
> **And** no API key, account or network access was required **And** an unsupported version fails
> `npm ci` with a message naming the required range rather than installing (SM-2, NFR-7, AD-13).

**Rationale:** "or later" admits Node 23 and 25, which the spine's Stack row already excludes and
this story's own Notes line already contradicts. Naming the range rather than prose makes the AC
testable by the mechanism finding 1 installs. The Notes line under this story needs no edit — it
states no version number.

---

#### 4.11 — Stack table: the 22-line floor (finding 1b)

**Section:** Stack table, Node row (line 500)

**OLD**

> | Node | 26 LTS recommended; 22.12 minimum; majors 23 and 25 unsupported |

**NEW**

> | Node | 26 LTS recommended; `^22.13.0 \|\| ^24.0.0 \|\| >=26.0.0`; 22.13 is the floor because `eslint@10.15.0` requires `^22.13.0`; majors 23 and 25 unsupported (Vitest) |

**Rationale:** 22.12 fails `eslint@10.15.0`, an approved pin. **No version in the stack changes** —
`eslint` stays at 10.15.0 and all 18 pins stand. One minor-version digit in a floor that was derived
from an incomplete intersection is corrected, and the range is stated so it cannot be re-derived
wrongly.

---

#### 4.12 — Pinned-stack line: the same floor (finding 1b)

**Section:** `epics.md`, binding constraints, pinned stack (line 101)

**OLD**

> … · tsx 4.23.15 · Node 26 LTS recommended, 22.12 minimum, odd majors 23 and 25 unsupported
> (pinned in `package.json` `engines` plus `.nvmrc`).

**NEW**

> … · tsx 4.23.15 · Node `^22.13.0 || ^24.0.0 || >=26.0.0`, 26 LTS recommended, odd majors 23 and 25
> unsupported (declared in `package.json` `engines`, enforced by `.npmrc` `engine-strict=true`,
> recommended major in `.nvmrc`).

**Rationale:** the floor appears normatively in exactly three places — the Stack row, this line, and
Story 1.1 AC 1. All three move together or the documents disagree again.

---

#### 4.13 — `.nvmrc` and CI read one source of truth

**Section:** AD-19 — Rule (line 445, after the `npm ci` sentence)

**OLD** *(no such passage — this is an addition)*

**NEW**

> The workflow selects Node with `actions/setup-node` using **`node-version-file: .nvmrc`**, so CI and
> a grader following the README run the same major and the recommended version is stated once. CI
> needs no `engine-strict` setting of its own: `.npmrc` is committed, so `npm ci` inherits the gate.

**Rationale:** AD-19 enumerates what CI runs but never which Node it runs on, and `.nvmrc` already
exists in the Structural Seed without a stated value. `.nvmrc` carries `26` — the spine's own
recommendation, not a new choice. Without this, three places could name three different majors.

---

### Not proposed, deliberately

- **No PRD edit.** None of the six touches an FR, NFR, SM or tier decision. §13 is the PRD's own
  decisions index, and adding rows for architecture-internal mechanisms would edit an approved
  document for record-keeping alone. **This dated proposal is the record.** Flagged for the user to
  overrule if the §13 convention is wanted here.
- **No `EXPERIENCE.md` edit.** Unaffected.
- **No `sprint-status.yaml` edit.** No epic or story added, removed or renumbered.
- **No new dependency, no version change.** `scripts/check-hex.mjs` is plain Node; the CSP injection
  uses Vite's own hook; `engine-strict` is an npm setting.
- **The open `EXPERIENCE.md`/`DESIGN.md` British-vs-US spelling item** (from log 990) stays open. It
  is unrelated and out of scope.

## 5. Implementation Handoff

### Scope classification: **Minor**

Direct implementation. No backlog reorganization, no replan, no PM or Architect escalation.

### Deliverables on approval

1. Apply 4.1 – 4.13 to the three documents.
2. Validate consistency across all five planning artifacts:
   - the token count reads 43 with a 16/13/3/11 breakdown in `DESIGN.md`, AD-18 and UX-DR1
   - no approved document still says `index.html` carries a CSP tag
   - Story 1.1 AC 4's five named CI checks are still five
   - `^22.13.0 || ^24.0.0 || >=26.0.0` reads identically in the Stack row, the Stack note, the
     `epics.md` pinned-stack line and Story 1.1 AC 1, and no document still says 22.12
   - `.nvmrc` is named with the value `26` in exactly one normative place (AD-19), and Story 5.1
     AC 2 still resolves by reference rather than by a restated number
   - all 18 pinned versions are byte-identical to their 2026-11-22 state
   - no FR/NFR/SM/UX-DR reference is orphaned by a reworded passage
3. Close this workflow; hand off to **Project Context**, then **Story 1.1** via `bmad-build`.

### Risk, resolved in Rev 1

The Rev 0 watch point — that `engine-strict=true` also applies to **dependencies'** `engines`, so a
transitive upper bound could fail `npm ci` on the builder's own Node 26.12.1 — was tested rather than
carried: a real install of the full pinned set with `engine-strict=true` resolved 473 packages with
zero `EBADENGINE`. **Closed.**

### Residual risk

A future `npm install` of a *new* dependency could introduce a transitive `engines` upper bound, and
`engine-strict` would then fail the install rather than warn. This is the intended behaviour of the
gate, the lockfile is committed with exact versions (AD-19), and no new dependency is planned. Noted,
not mitigated.

### Success criteria

- Every one of the six findings has a named, executable mechanism in an approved document.
- Story 1.1 AC 1, AC 3 and AC 4 are satisfiable as written, with no invented decisions.
- No requirement, architecture decision, UX value, scope tier or pinned version differs from its
  2026-11-22 state except where listed in §4.

## 6. Checklist Record

| Section | Items | Status |
|---|---|---|
| 1 Trigger and context | 1.1 – 1.3 | **Done.** Trigger: Story 1.1 spec review, 2026-11-25. Type: *misunderstanding of original requirements* — outcome stated without mechanism. Evidence: §1 table, six passages cited by line, plus finding 1b verified by install on 2026-11-25 |
| 2 Epic impact | 2.1 – 2.5 | **N/A ×5.** No epic modified, added, removed, redefined or resequenced |
| 3 Artifact conflicts | 3.1 PRD | **N/A** — no requirement affected |
| | 3.2 Architecture | **Action-needed → addressed** in 4.1 – 4.6, 4.11, 4.13 |
| | 3.3 UI/UX | **Action-needed → addressed** in 4.7 – 4.9 |
| | 3.4 Other artifacts | **Action-needed → addressed** — CI chain (4.4), CI Node selection (4.13), repo tree (4.5); no deployment, IaC or monitoring exists |
| 4 Path forward | 4.1 Direct Adjustment | **Viable** — effort Low, risk Low. Selected |
| | 4.2 Rollback | **Not viable** — no code, no story out of `backlog` |
| | 4.3 MVP review | **Not viable** — MVP unaffected |
| | 4.4 Selection | **Done** — Option 1, rationale in §3 |
| 5 Proposal components | 5.1 – 5.5 | **Done** — §1, §2, §3, §4, §5 |
| 6 Review and handoff | 6.1 – 6.3 | **Done.** Approved by Shyam 2026-11-25, including the 22.13 floor as the one approved *number* changed |
| | 6.4 `sprint-status.yaml` | **N/A** — no epic or story structure change |
| | 6.5 Next steps | **Done** — §5 |

## 7. Validation Record — 2026-11-25

All 13 edits applied. `git diff --stat`: 3 files, **54 insertions, 18 deletions**. The seven checks
of §5 step 2:

| # | Check | Result |
|---|---|---|
| 1 | `16 colour, 13 typography, 3 radius, 11 spacing` identical in spine, `DESIGN.md`, `epics.md` | **pass** |
| 2 | no document claims `index.html` carries a CSP tag | **pass** — the only occurrence is the negation, *"no CSP tag"* |
| 3 | no residual `22.12` in any normative document | **pass** |
| 4 | the range verbatim where the floor is normative | **pass** — 3× spine, 2× `epics.md` |
| 5 | token inventory recomputed from the frontmatter | **pass** — colours 16/16, typography 14 props → **13** tokens, radius 3/3, spacing 14 props → **11** tokens = **43** |
| 6 | `.nvmrc` value named once normatively | **pass** — value `26` stated in the Stack note; AD-19 references the file, restating no number |
| 7 | all 18 pinned versions byte-identical to their 2026-11-22 state | **pass** — the only version string in a changed line is `eslint@10.15.0`, now cited as the *reason* for the floor, not re-pinned |

Story 5.1 AC 2 still resolves the floor by reference to `engines` and `.nvmrc` rather than restating a
number, so it needed no edit and remains correct.

**Line endings.** All four touched files are uniformly CRLF in the working tree, as they were before
these edits; `.gitattributes` `* text=auto eol=lf` normalises them to LF on commit. The working tree
not yet matching `eol=lf` is a pre-existing condition, unrelated to this proposal, recorded as an open
point rather than fixed here.
