---
title: "Sprint Change Proposal — four documentation defects found by implementing Story 1.1"
date: 2026-11-25
status: approved and applied — 2026-11-25
approved_by: Shyam
trigger: "Implementation and review of Story 1.1, 2026-11-25 (commit 2cdf292)"
scope_classification: minor
mode: batch
author: Shyam
supersedes: none
applied: "4.1 – 4.6, all 6 edits; 2 files, 28 insertions in the spine, 39 in the spec; commit 428bbc6"
relates_to: sprint-change-proposal-2026-11-25.md (approved and applied earlier the same day)
sources:
  - .docs/planning-artifacts/architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  - .docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md
  - .docs/planning-artifacts/epics.md
---

# Sprint Change Proposal — four documentation defects found by implementing Story 1.1

## 1. Issue Summary

Story 1.1 was the repository's first build. Implementing it executed, for the first time, several
instructions that until then had only been written down. Four of them turned out to be wrong, and one
of those four would have produced a silently broken artifact. None of them is a design error: the
architecture's decisions all held. They are defects of *transcription and arithmetic* in approved
documents, which is exactly the class of defect only an implementation can find.

**How they were found.** Three independent review layers ran over the 36-file diff and returned 52
findings. Thirteen were patched in code, six deferred, thirteen rejected. The four below could not be
patched in code because their root cause is text in a locked document — `ARCHITECTURE-SPINE.md` — or
in the frozen section of the Story 1.1 spec. They are recorded in that spec's Spec Change Log and
Review Triage Log, and in `.logs/shyam-chandra-k-c/issues.md`.

**Evidence, per defect.**

1. **The font-subsetting flag is spelled wrong.** AD-11 instructs `pyftsubset` with
   `--layout-features=+tnum`. fontTools 4.62.0 parses that as a one-element list holding the literal
   string `+tnum`, which matches no OpenType feature tag — so the subsetter drops **every** layout
   feature, `tnum` included, and writes a font with an empty `GSUB` FeatureList without warning. The
   first subset run during Story 1.1 produced exactly that font. The correct spelling is
   `--layout-features+=tnum`, where `+=` appends to the default feature set. This is also the
   strongest possible vindication of AD-11's own insistence that the proof be the GSUB table of the
   committed `woff2` rather than a computed style: `font-variant-numeric: tabular-nums` computed as
   set on the broken font, and only reading the committed file caught it.

2. **The Stack table names no type packages, but `npm run typecheck` cannot run without three.**
   React 19 ships no type declarations. `@types/react`, `@types/react-dom` and `@types/node` are
   therefore required for AC 1's first check and AC 4's first CI check to run at all. They are
   installed at exact versions, but the Stack table — which the spec reads as the authoritative list
   — does not mention that they are needed.

3. **The 473-package figure is not a reproducible number.** The Stack note records "the full pinned
   set resolves 473 packages", and the Story 1.1 spec's I/O matrix repeats it as an expected output. A
   clean `npm ci` on Node 26.12.1 reports **added 472 packages, and audited 479**. The three type
   packages above are part of the difference, but not all of it: `npm install` and `npm ci` do not
   resolve optional platform packages identically, so the figure is a property of the npm invocation
   rather than of the dependency set. Measured twice during Story 1.1, from a deleted `node_modules`,
   with the same result both times.

4. **"Vitest's `engines` excludes odd Node majors" is imprecise, and the range it justifies is
   upper-open.** Vitest 5.1.1 actually declares `^22.12.0 || ^24.0.0 || >=26.0.0`. That excludes odd
   majors *below* 26 and admits every major above it, 27 and 29 included. The spine's
   `^22.13.0 || ^24.0.0 || >=26.0.0` is therefore a faithful intersection of what the dependencies
   declare — `eslint@10.15.0` correctly supplies the `^22.13.0` floor — but the stated reason for the
   shape ("excludes odd Node majors") does not hold at the top of the range. **No range change is
   proposed**: narrowing to `^26.0.0` would make the project stricter than every one of its
   dependencies and, with `engine-strict=true` committed, would hard-fail `npm ci` on Node 28 LTS for
   no reason the stack supports.

## 2. Impact Analysis

**Epic impact.** None. No epic's scope, ordering or dependencies change.

**Story impact.**

- **Story 1.1** (pending merge, commit `2cdf292`): no code change. The implementation already uses the
  correct `+=` spelling, already installs the three type packages, and already declares the `engines`
  range verbatim as approved. Its spec gains the corrected matrix row and the full acceptance-criteria
  list. All seven acceptance criteria were verified against `epics.md` during the walkthrough and all
  seven hold.
- **Any later story that re-subsets a typeface** — none is currently planned, but Epic 5 touches
  assets — would have reproduced defect 1 verbatim from AD-11. This is the only defect of the four
  with the power to ship a broken artifact.
- **Story 1.8** (PWA manifest, icons, service worker): unaffected by these four, but note the two CSP
  constraints already recorded in `deferred-work.md` apply to it.

**Artifact conflicts.**

| Artifact | Sections affected | Nature |
| --- | --- | --- |
| `ARCHITECTURE-SPINE.md` | AD-11 rule text; Stack verification note | 4 edits — one factual correction, three precision/completeness |
| `spec-1-1-run-the-app-from-a-clean-clone.md` | I/O & Edge-Case Matrix (frozen); Acceptance Criteria | 2 edits — requires the human renegotiation the frozen banner names |
| `epics.md` | none | Story 1.1's seven AC are correct as written and are the source for edit 4.6 |
| `DESIGN.md`, `EXPERIENCE.md`, `prd.md` | none | untouched |

**Technical impact.** No source file changes. No re-verification required: the implementation already
matches every corrected instruction, and the one measured figure being corrected (472/479) is the
measurement itself. The six edits are documentation-only.

## 3. Recommended Approach

**Direct Adjustment.** Correct the four defects in place and complete the spec's acceptance-criteria
list. No rollback, no MVP review, no replan.

**Rationale.** Every defect is text that disagrees with a verified measurement or with upstream
metadata. The code is already correct in all four cases — which is the signal that the documents, not
the implementation, are what need to move. Rolling anything back would discard work that passes all
seven acceptance criteria and all five CI checks.

**Effort:** documentation only; six edits across two files.
**Risk:** low. The only edit that changes an instruction's meaning is 4.1, and it changes it to what
the implementation already does and what fontTools actually accepts.
**Timeline impact:** none. This unblocks the Story 1.1 merge rather than delaying it.

## 4. Detailed Change Proposals

### 4.1 — `ARCHITECTURE-SPINE.md`, AD-11 rule text (line 320)

**OLD**

> Subsetters omit `tnum` from their default layout-feature set,
> so the feature must be **requested explicitly** — with `pyftsubset`, `--layout-features=+tnum`.

**NEW**

> Subsetters omit `tnum` from their default layout-feature set,
> so the feature must be **requested explicitly** — with `pyftsubset`, `--layout-features+=tnum`.
> The `+=` is load-bearing: `--layout-features=+tnum` *replaces* the feature set with a one-element
> list holding the literal string `+tnum`, which matches no feature tag, so fontTools drops every
> layout feature — `tnum` included — and writes an empty `GSUB` FeatureList without warning. Verified
> against fontTools 4.62.0 during Story 1.1, where the first subset run produced exactly that font.

**Rationale.** The documented command produces the precise failure the surrounding paragraph exists to
prevent. Recording why the spelling matters keeps a future reader from "simplifying" it back.

### 4.2 — `ARCHITECTURE-SPINE.md`, Stack verification note

**OLD**

> `workbox-build` and `workbox-window` are **non-optional** peers of `vite-plugin-pwa@2.0.0`.

**NEW**

> `workbox-build` and `workbox-window` are **non-optional** peers of `vite-plugin-pwa@2.0.0`. React 19
> ships **no type declarations**, so three type-only packages are required for `npm run typecheck` —
> Story 1.1 AC 1's first check and AC 4's first CI check — to run at all: `@types/react`,
> `@types/react-dom` and `@types/node`, pinned exactly like everything else. They are development
> types rather than stack choices and are **not** counted among the 18 pinned packages, so every
> "18 pins" reference elsewhere stands as written.

**Rationale.** The spec reads the Stack table as the authoritative list and had to add three packages
that were not on it. Saying so, while explicitly preserving the "18" count, closes the gap without
rippling into the frozen text of this or any other story.

### 4.3 — `ARCHITECTURE-SPINE.md`, Stack verification note

**OLD**

> Vitest's `engines` excludes odd Node majors and `eslint@10.15.0` raises the
> 22-line floor to `^22.13.0`, so the supported set is the intersection of all 18 pinned packages:
> **`^22.13.0 || ^24.0.0 || >=26.0.0`**, declared verbatim in `package.json` `engines`.

**NEW**

> `vitest@5.1.1` declares `^22.12.0 || ^24.0.0 || >=26.0.0` and `eslint@10.15.0` raises the 22-line
> floor to `^22.13.0`, so the supported set is the intersection of all 18 pinned packages:
> **`^22.13.0 || ^24.0.0 || >=26.0.0`**, declared verbatim in `package.json` `engines`. Note what the
> upper bound does and does not say: odd majors are excluded *below* 26 because Vitest enumerates
> `^22`/`^24`, but `>=26.0.0` is open, so 27 and 29 are admitted — by Vitest's own declaration, not by
> a choice made here. The range is deliberately left as the faithful intersection: narrowing it to
> `^26.0.0` would make this project stricter than every dependency it has and, with
> `engine-strict=true` committed, would fail `npm ci` on Node 28 LTS for no reason the stack supports.
> Revisit if Vitest tightens its own range.

**Rationale.** The old sentence states a rule the range does not actually implement at its top end, so
a reader checking the arithmetic finds a contradiction. The correction records the real upstream
declarations and the reason the open bound is kept.

### 4.4 — `ARCHITECTURE-SPINE.md`, Stack verification note (final sentence)

**OLD**

> Verified by install on 2026-11-25: the full pinned
> set resolves 473 packages under `engine-strict=true` on Node 26.12.1 with no `EBADENGINE`.

**NEW**

> Verified by install on 2026-11-25: the full pinned set installs under `engine-strict=true` on Node
> 26.12.1 with no `EBADENGINE`. A clean `npm ci` reports *added 472 packages, and audited 479*
> (measured twice from a deleted `node_modules` during Story 1.1, including the three type packages
> above). The earlier figure of 473 came from `npm install`; the two commands do not resolve optional
> platform packages identically, so **the package count is a property of the npm invocation and is not
> a figure anything should assert.**

**Rationale.** A number recorded as verification invites a test, and a test on this number would be
testing npm's behaviour rather than the project's. Replacing it with the measured range and the reason
it varies removes the trap.

### 4.5 — `spec-1-1-run-the-app-from-a-clean-clone.md`, I/O & Edge-Case Matrix, row 1 (frozen section)

**OLD**

> | Supported Node | Node 22.13+/24/26+, clean clone | `npm ci` installs 473 packages; `npm run dev` serves on localhost | N/A |

**NEW**

> | Supported Node | Node 22.13+/24/26+, clean clone | `npm ci` installs with no `EBADENGINE`; `npm run dev` serves on localhost | N/A |

**Rationale.** This edit requires the human renegotiation the frozen banner calls for. The count was
unachievable as written (472/479 measured), and per 4.4 it should not be asserted at all; what the row
is really testing is that a supported Node installs cleanly and the dev server comes up. Both are now
covered by executing checks — `npm ci` in CI, and the three dev-server end-to-end tests added during
review.

### 4.6 — `spec-1-1-run-the-app-from-a-clean-clone.md`, Acceptance Criteria

**OLD** — four bullets, while the task list and Decisions reference AC 1 through AC 7 throughout:

> - Given a clean clone on Node 26, when `npm ci && npm run dev` runs, then the app serves on localhost
>   with no key, account or network access.
> - Given Node 23 or 25, when `npm ci` runs, then it fails naming `^22.13.0 || ^24.0.0 || >=26.0.0`.
> - Given the built artifact, when it is served, then its `index.html` carries a CSP whose `connect-src`
>   admits only the Anthropic host, and `npm run dev` is unaffected.
> - Given `main` at this story's merge, then every committed check passes — which is what SM-2 is
>   measured against.

**NEW** — Story 1.1's seven acceptance criteria, copied from `epics.md`, with the four bullets above
retained beneath them as the story's own additional checks:

> **The seven acceptance criteria, from `epics.md`:**
>
> 1. **Given** a clean clone on a supported Node — `^22.13.0 || ^24.0.0 || >=26.0.0`, 26 LTS
>    recommended — **When** I run `npm ci` and `npm run dev` **Then** the app serves on localhost
>    **And** no API key, account or network access was required **And** an unsupported version fails
>    `npm ci` with a message naming the required range rather than installing (SM-2, NFR-7, AD-13).
> 2. **Given** the app has no Tasks **When** it opens **Then** the first run surface `m9` renders,
>    stating what the product is **And** it is the only empty state in the product (UX-DR22).
> 3. **Given** the first run surface **When** it renders **Then** all 43 `DESIGN.md` tokens are
>    declared in `src/ui/theme.css` under Tailwind v4 `@theme` and every colour on screen resolves
>    from them **And** both typefaces are vendored subset `woff2` with the `tnum` feature preserved
>    **And** every number uses `font-variant-numeric: tabular-nums` (UX-DR1, UX-DR3, UX-DR4, AD-18).
> 4. **Given** the repository **When** CI runs on push **Then** typecheck, lint, Vitest, Playwright
>    with `axe-core` at 360 px and 1280 px, and a grep of the built bundle for an API-key pattern all
>    run **And** they run with no API key and no network **And** the build fails if any of them fails
>    (AD-19, AD-8).
> 5. **Given** a module under `src/core/` **When** it references `window`, `document`,
>    `localStorage`, `fetch`, `process`, `navigator`, `performance`, `crypto`, `Math.random`, React, a
>    Vite-injected value, `Date.now()` or a zero-argument `new Date()` **Then** lint fails (AD-1).
> 6. **Given** a raw hex colour outside `src/ui/theme.css` **When** CI runs **Then** it fails (AD-18).
> 7. **Given** the first run surface at 360 px and at 1280 px **When** `axe-core` runs **Then** it
>    reports no violations **And** there is no horizontal scrolling at either width (NFR-4, UX-DR20).
>
> **Additional checks this story is held to:**
>
> - Given a clean clone on Node 26, when `npm ci && npm run dev` runs, then the app serves on
>   localhost with no key, account or network access.
> - Given Node 23 or 25, when `npm ci` runs, then it fails naming
>   `^22.13.0 || ^24.0.0 || >=26.0.0`.
> - Given the built artifact, when it is served, then its `index.html` carries a CSP whose
>   `connect-src` admits only the Anthropic host, and `npm run dev` is unaffected.
> - Given `main` at this story's merge, then every committed check passes — which is what SM-2 is
>   measured against.

**Rationale.** The spec declares itself the sole source of truth for implementers, and four of the
seven criteria it refers to by number were never written into it. An implementation agent reading only
the spec could satisfy every written bullet and still miss AC 2, 5, 6 and 7. Story 1.1 happened not to
— all seven were verified against `epics.md` — but the next story that inherits this pattern might.

## 5. Implementation Handoff

**Scope classification: Minor.** Six documentation edits across two files, no source changes, no
re-verification.

**Route to:** Developer agent for direct implementation, with one caveat below.

**Deliverables:** the six edits in §4, applied verbatim.

**Caveat on the frozen section.** Edits 4.5 and 4.6 touch
`spec-1-1-run-the-app-from-a-clean-clone.md`. Edit 4.5 falls inside the
`<frozen-after-approval>` block, whose banner reads *"human-owned intent — do not modify unless human
renegotiates"*. Approving this proposal **is** that renegotiation and must be recorded as such in the
spec's Spec Change Log. Edit 4.6 is outside the frozen block.

**Success criteria.**

1. `grep -n 'layout-features' ARCHITECTURE-SPINE.md` shows `+=` and no `=+`.
2. The Stack note names the three type packages and preserves every "18 pins" reference.
3. No `473` remains in either document.
4. The spec's Acceptance Criteria section contains seven numbered criteria.
5. `npm run lint && npm test` still pass — documentation-only edits must not move code.
6. The spec's Spec Change Log records the frozen-section renegotiation with this proposal's date.

**Explicitly out of scope.** No change to `package.json`'s `engines`, `.nvmrc`, `.npmrc`,
`ci-checks.test.ts`, `CLAUDE.md` or `epics.md`. Per §1 defect 4 and the ruling on 2026-11-25, the
range stays as the faithful upstream intersection.
