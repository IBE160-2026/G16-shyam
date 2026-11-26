---
title: 'Story 1.3 — See the due date the date word named'
type: 'feature'
created: '2026-11-26'
status: 'done'
route: 'dispatch'
baseline_commit: '60126efd1dd5360ebc75f18ec2b4899c54e7815e'
review_loop_iteration: 1
context: ['{project-root}/.docs/implementation-artifacts/epic-1-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.2 made a sentence into a Task, but `dueDate` is always `null` and the record
draws one dead outlined pill reading `NO DUE DATE`. FR-23 — the due date comes from the date word
the user already typed — is unbuilt, and no date word is recognised anywhere in the repository.

**Approach:** Add the shared whole-word tokenizer and the date-word parser to the pure core, resolve
the parsed date against a reference date that stays correct past midnight, and give the due pill the
two treatments this story owns: the outlined pill for a date, an em-dash for none.

## Decisions

**The window inks stay Epic 3's; this story ships two pill treatments, not four.** Approved at
CHECKPOINT 1, 2026-11-26. A Task with any due date renders the outlined pill carrying that date; a
Task with none renders an em-dash and no pill. The `due-week` yellow and `attention` olive fills, and
the in-week and past-due distinction behind them, arrive with Epic 3's windows — which is how
`epics.md` annotates UX-DR12 ("window inks completed in Epic 3") and what the 2026-11-26 change
proposal puts out of scope. **The accepted consequence, stated plainly:** through Epics 1 and 2 a
Task due tomorrow and a Task due next month look identical, and a past-due Task is not marked. UX-DR12
is therefore knowingly incomplete until Epic 3, and that is recorded in `deferred-work.md` rather
than left for review to rediscover.

**The reference date is still threaded and still refreshed**, because parsing depends on it even
though the pill no longer does. `Record` needs only `task.dueDate`.

## Boundaries & Constraints

**Always:**
- The vocabulary is closed and English only: `today`, `tomorrow`, `Monday`–`Friday` written out in
  full, `next week`. Case-insensitive, whole words, first match wins, nothing else guessed.
- `task.text` is stored byte-identical. Parsing never rewrites, trims or strips the sentence.
- `core/date-words.ts` returns the matched span alongside the resolved date, so Epic 2's Summary
  truncation has a defined input.
- The current week is Monday through Sunday inclusive in the device's local calendar, defined once in
  `core/selectors.ts` and shared with `next week` — which resolves to the Monday of the following
  week.
- The parsed date is applied directly at capture, never as a reviewable Suggestion.
- Every new `core` module stays pure: no banned global, no `Intl`, no zero-argument `new Date()`, no
  import from `ports`, `adapters`, `app` or `ui`. Time enters only through the Clock port.
- Every date-dependent unit test passes a literal reference date as an argument and never reads the
  system clock.
- The capture path stays synchronous — no `async`, `await`, `Promise` or deferral in any file on it.

**Never:**
- No new design token. A raw hex outside `theme.css` fails lint, and the token count is asserted
  against DESIGN.md's frontmatter.
- No `due-week` or `attention` fill on the pill, and no in-week or past-due computation to drive one.
  Those are Epic 3's. `core/selectors.ts` carries the week definition only — no predicates yet.
- No `TASK_SCHEMA_VERSION` bump — `dueDate` already exists as `LocalDate | null`.
- No weekend day, month name, numeric date, abbreviation or relative arithmetic in the vocabulary.
- No Smart List, band, dense desktop table or Archive — those are Epic 3. This story touches only
  the 46 px record's pill.
- No editing of the due date here; FR-3 editing is Story 1.5.
- No mockup, no locked planning document, and no change to Story 1.2's merged behaviour beyond the
  pill treatment this story owns.

## I/O & Edge-Case Matrix

Reference date is Monday 2026-11-16 throughout.

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Weekday, later in week | `"Submit assignment in IBE160 Friday"` | `dueDate` `2026-11-20`, text unchanged | N/A |
| Weekday is the reference date | `"Email Monday"` | `2026-11-16`, not a week later | N/A |
| `today` / `tomorrow` | `"Call today"` / `"Call tomorrow"` | `2026-11-16` / `2026-11-17` | N/A |
| `next week` | `"Plan next week"` | `2026-11-23` (Monday of the following week) | N/A |
| Two expressions | `"today or Friday"` | first wins → `2026-11-16` | N/A |
| Case and position | `"FRIDAY report"`, `"report friday"` | both `2026-11-20` | N/A |
| Weekend, abbreviation, plural | `"Saturday"`, `"fri"`, `"Mondays"` | `dueDate` `null`, Task still created | no error raised |
| Unrecognised date-like | `"end of month"`, `"15 March"` | `dueDate` `null`, Task still created | nothing guessed |
| Norwegian | `"Pay RENT på fredag"` | `dueDate` `null`, text byte-identical | no error raised |
| Substring, not a word | `"Mondayish"`, `"nexti week"` | no match | N/A |
| Pill, any due date | `dueDate` `2026-11-20` | outlined pill reading `FRI 20 NOV`, `data-due="date"` | N/A |
| Pill, no due date | `dueDate` `null` | em-dash, no pill drawn, `data-due="none"` | N/A |
| Midnight crossing | tab open from Sun 23:59 into Mon | reference date re-reads; `"Monday"` resolves to the new day | N/A |
| Malformed stored date | `dueDate` fails `isLocalDate` | document rejected on read as it already is | existing backup-key path |

</frozen-after-approval>

## Code Map

**Reuse as-is — do not change:**
- `src/ports/clock.ts` (`Clock.today(): LocalDate`), `src/adapters/system-clock.ts` (`systemClock`,
  the only file touching `Date`). The port needs no change; only how often it is read changes.
- `src/core/task.ts` — `Task.dueDate` is already `LocalDate | null` (line 57); `createTask(id, text)`
  at 102 sets it `null` and stores text verbatim. `validateTask` already rejects a non-`LocalDate`.
- `src/core/constants.ts:29` — `TASK_SCHEMA_VERSION = 1`. Setting an existing field does not bump it.
- `src/ui/theme.css` — the 43 tokens. The pill needs only `--color-surface`, `--color-rule` and
  `--color-ink-secondary`, all already in use by the shipped pill. Add none:
  `tests/unit/theme-tokens.test.ts` asserts the count, the per-kind breakdown and equality with
  DESIGN.md's frontmatter.
- `src/ui/today/Today.tsx` — already takes and forwards `today` (30–33, 67). Unchanged by this
  story: `Record` needs only `task.dueDate`, so no reference date is threaded to it.
- `eslint.config.js` — the `to-do-list/core-purity` entry (150–179) covers `src/core/**/*.ts`, so new
  core modules inherit the ban with no config change. Note `Intl` and `globalThis` are banned, and
  `no-restricted-imports` forbids `react`, `ports`, `adapters`, `app` and `ui` from core.
- `src/core/__fixtures__/pure.ts`, `banned.ts` — keyed to the ban list, not the module list. No change
  unless a new ban is added.

**Changed by this story:**
- `src/core/localdate.ts` — zero imports today; keep it that way. Has `dayOfWeek` (0 = Monday),
  `localDateParts`, `daysInMonth`, `isLocalDate`, `formatHeaderDate` (`MON 16 NOV` — exactly the
  pill's format, reuse it) and a private `daysFromCivil`. **Missing and to be added:** the inverse
  (`civilFromDays`) and an exported `addDays`. The module's own doc claims it is the one core module
  doing calendar arithmetic, so arithmetic lands here, not in `date-words.ts`.
- `src/app/store.tsx` — `captureTask(ids, text)` at 138 is the only funnel from text to Task and has
  no reference date. It gains one, and sets `dueDate` from the parse. `StoreProviderProps` (151) and
  the `useCallback` dependency list at 169 change with it. Five call sites in
  `tests/unit/store.test.ts` (139, 155, 159, 163, 278) move with the signature.
- `src/main.tsx:37` — `const today = systemClock.today()` at module scope. This is the deferred
  defect routed here: `today` *is* the reference date AC 2 and AC 3 resolve against, so a tab open
  past midnight would parse `Friday` to a date a week off and persist it. The read moves into state.
- `src/ui/components/Record.tsx` — `DuePill()` at 52–62, called at 112 with no props. Today it draws
  one state: `border border-rule bg-surface px-[5px] py-[1px] … text-ink-secondary` with
  `data-due="none"` and `labels.record.noDueDate`. Keep that geometry and those apparatus classes for
  the date case; take `task.dueDate`, and render the em-dash with no rect when it is `null`.
- `src/ui/labels.ts:104` — `labels.record.noDueDate = 'NO DUE DATE'` becomes the em-dash. Every
  display string lives here (AD-9); the key name still reads true. Note `labels.ts` is imported by
  `vite.config.ts:5`, so it must stay importable from Node.

**New, with its documented home** (file names are the architecture spine's own, lines 570–572):
- `src/core/tokenize.ts` — the one exported whole-word, case-insensitive matcher, returning spans.
  Epic 2's Rule Engine imports it and Epic 4's Fixture documentation cites it; FR-7's and FR-23's
  whole-word rules are the same function.
- `src/core/date-words.ts` — the closed vocabulary and its resolution, returning the resolved date
  **and** the matched span. Takes the words and the reference date as arguments; it may not import
  the Clock port or `labels.ts`.
- `src/core/selectors.ts` — the week definition only (Monday–Sunday inclusive), because `next week`
  needs the week's start day and `epics.md` says that definition is declared once here and shared
  with FR-23. Story 1.4 adds `isCompleted`/`isArchived` to this file and Epic 3 the Smart List and
  window predicates. **Do not take this filename for anything else, and do not add predicates here.**
- `src/app/use-today.ts` — holds the reference date in state, seeds it from the Clock port, and
  re-reads on `visibilitychange` plus a timer firing at the next local midnight. **It must live
  outside the capture path**: `tests/unit/store.test.ts:219–247` bans `setTimeout` in `store.tsx`,
  `Today.tsx` and `Record.tsx` by name, and `main.tsx` is not on that list.

**Test infrastructure:** Vitest config is in `vite.config.ts:101–107` — `environment: 'node'`,
`include: ['tests/unit/**/*.test.ts']`. There is no DOM test environment, so no unit test can render
a component; pill behaviour is provable only in Playwright or through a pure helper. The fixed-date
idiom to follow is `tests/unit/localdate.test.ts:22–25`: declare the names, pass literal date strings
as arguments, read no clock. Fake ports are plain object literals (`store.test.ts:68–98`). E2E seeds
state with `page.addInitScript` and selects on `data-*` attributes;
`tests/e2e/capture.spec.ts:547–551` already asserts `data-due="none"` and the `NO DUE DATE` text and
must move to the em-dash. `capture.spec.ts:600–613` asserts the record contains no focusable control;
the pill must stay a `span`.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/localdate.ts` -- add the inverse of `daysFromCivil` and an exported `addDays`; keep
      zero imports -- FR-23's resolution needs `LocalDate → LocalDate` arithmetic, AD-1
- [x] `src/core/tokenize.ts` -- the one exported whole-word, case-insensitive matcher returning
      spans over the untouched text -- FR-23, FR-7, spine Data–tokenizing
- [x] `src/core/selectors.ts` -- the week definition, Monday–Sunday inclusive, and nothing else --
      FR-12's definition shared with FR-23's `next week`
- [x] `src/core/date-words.ts` -- the closed vocabulary and its resolution, returning the resolved
      date and the matched span -- FR-23, spine Data–Summary
- [x] `src/app/store.tsx` -- thread the reference date into `captureTask` and set `dueDate` from the
      parse, synchronously -- FR-23 applied at capture, NFR-1
- [x] `src/app/use-today.ts` -- the live reference date: Clock port on mount, re-read on
      `visibilitychange` and at the next local midnight -- deferred defect routed to this story, AD-2
- [x] `src/main.tsx` -- compose the reference date through the hook instead of the module-scope read
      at line 37 -- the composition root is the only place that constructs adapters
- [x] `src/ui/components/Record.tsx` -- the outlined pill carrying the date, the em-dash when there
      is none, `data-due` naming which -- UX-DR12 as far as this story takes it
- [x] `src/ui/labels.ts` -- the no-date em-dash replaces `NO DUE DATE` -- AD-9, UX-DR12
- [x] `tests/unit/tokenize.test.ts` -- whole-word and case rules, including `Mondays` not matching
      `monday` and spans over untouched text -- FR-23, NFR-10
- [x] `tests/unit/date-words.test.ts` -- every I/O matrix row that needs no browser, against a
      literal reference date -- FR-23, NFR-10
- [x] `tests/unit/selectors.test.ts` -- the week start at both ends of the week, including Sunday --
      FR-12, NFR-10
- [x] `tests/unit/localdate.test.ts` -- extend for `addDays` across month, year and leap boundaries
      -- NFR-10
- [x] `tests/unit/store.test.ts` -- move the five `captureTask` call sites, assert the parse happens
      at capture, and add the new core modules to `CAPTURE_PATH` -- NFR-1, FR-23
- [x] `tests/e2e/capture.spec.ts` -- the em-dash replaces `NO DUE DATE`, and a captured date word
      renders its outlined pill at both widths with the accessibility scan clean -- UX-DR12, NFR-4

**Acceptance Criteria:**

The seven acceptance criteria, from `epics.md`:

1. **Given** the reference date Monday 2026-11-16 **When** I capture "Submit assignment in IBE160
   Friday" **Then** the due date is 2026-11-20 **And** the task text is unchanged (FR-23).
2. **Given** any task text **When** it is parsed **Then** only `today`, `tomorrow`, `Monday`–`Friday`
   written in full, and `next week` are recognized **And** `today` resolves to the reference date,
   `tomorrow` to the next day, `next week` to the Monday of the following week (FR-23).
3. **Given** a weekday name **When** the reference date is itself that weekday **Then** it resolves
   to the reference date, not a week later (FR-23).
4. **Given** `Saturday`, `Sunday`, an abbreviation such as `fri`, a plural such as "Mondays", an
   unrecognized phrase such as "end of month" or "15 March", or Norwegian such as `fredag` **When**
   the text is parsed **Then** no due date is set, no error is raised, and the Task is still created
   (FR-23, §6.2).
5. **Given** text with more than one recognized date expression **When** it is parsed **Then** the
   first one wins (FR-23).
6. **Given** a parsed due date **When** it is shown **Then** it appears as a due pill and is editable
   through FR-3 **And** it is applied directly, never as part of a reviewable Suggestion (FR-23, §13
   item 2).
7. **Given** any date-dependent test **When** it runs **Then** it injects a fixed `LocalDate` through
   the Clock port and never reads the system clock, so the result is identical on any day, time zone
   and machine (NFR-10, AD-2).

## Implementation Notes

**The midnight timer is a coarse re-read, not an exact midnight schedule.** The Code Map asks
`src/app/use-today.ts` for "a timer firing at the next local midnight". Scheduling *at* midnight
requires the time of day, and AD-2 puts `Date` and `Date.now` inside `src/adapters/system-clock.ts`
and nowhere else, with the Clock port exposing exactly one operation — `today(): LocalDate`. The two
constraints cannot both hold, and the spec lists the port and the adapter under "do not change", so
the port is re-read instead: on `visibilitychange`, and on a 30 s interval for a tab that stays
visible. The accepted consequence is a sub-minute window just after midnight in which a visible,
untouched tab can still parse against yesterday; `visibilitychange` covers the case that actually
happens, a phone locked overnight. Closing the window entirely needs `bmad-correct-course` on AD-2,
not a change in this file. Both triggers are proved end-to-end in `tests/e2e/capture.spec.ts` under
"the reference date stays current", which fakes the *browser's* clock with `page.clock` at a fixed
Sunday 23:50 so the expected dates are literals: one test `fastForward`s past midnight (the visible
tab, where the interval fires) and one uses `setSystemTime`, which fires no timer at all, then
dispatches `visibilitychange` (the backgrounded or frozen tab, where intervals are suspended). The
second is the only one that fails if the listener is deleted, and that was verified by deleting it.
`systemClock` and `useToday` are exercised exactly as they ship, with no test-only seam.

**`main.tsx` grew an `App` component.** A hook needs a component, so the composition that was three
JSX elements at module scope is now a function. The adapters stay at module scope — `taskStorage`
identity is what the store memoises its reducer on — and `ErrorBoundary` moved *outside* `App` so it
also stands under the composition itself.

**`core/selectors.ts` exports `startOfWeek`, `endOfWeek`, `WEEK_START_DAY` and `DAYS_PER_WEEK`, and
no predicate.** `date-words.ts` composes `startOfWeek` + `addDays(DAYS_PER_WEEK)` for `next week`
rather than selectors owning a `startOfNextWeek`, which keeps the file to the week *definition* the
spec reserves it for.

**`tokenize.ts` matches word sequences, not substrings.** `words()` returns spans over the untouched
text and `findFirstPhrase()` compares lowercased word lists, which is what makes `Mondays` and
`Mondayish` fail for free and lets a multi-word entry match across any run of separators. Two
properties fell out of that shape and are asserted: the first match is the first in the *text* (AC 5)
rather than the first in the vocabulary, and the longer of two entries starting at the same word
wins — nothing in FR-23's vocabulary needs the second, but FR-7's keyword lists will.

**The no-date pill keeps the shipped padding and drops only the rect.** `px-[5px] py-[1px]` stays on
both treatments so the em-dash sits exactly where the pill's text would have been; `border` and
`bg-surface` are what the date case adds. No token was added, and `data-due` is now `date` or `none`.

**No `aria-label` on the em-dash.** It is a `span` with no role, where `aria-label` is a prohibited
attribute that `axe-core` flags — so the absence is reported as the mark UX-DR12 draws and nothing
more. That is a real loss against the `NO DUE DATE` wording Story 1.2 shipped, and it is UX-DR12's
call rather than this story's; it is noted here because review will see it.

**`CAPTURE_PATH` in `tests/unit/store.test.ts` gained five entries, not three.** `core/date-words.ts`,
`core/tokenize.ts` and `core/selectors.ts` are new on the path; `core/localdate.ts` and
`core/task.ts` were already reachable from `captureTask` and are now listed, because the synchronicity
claim is about the whole chain between submit and render rather than about its entry point.

## Spec Change Log

## Review Triage Log

**Iteration 1 — 2026-11-26. Eleven findings, all accepted and fixed.**

Correctness:
- `core/tokenize.ts` joined a multi-word phrase across sentence punctuation, so `Do it next. Week is
  busy` parsed to `2026-11-23` with a span covering `next. Week`. A new `separatedByWhitespace`
  guard requires the gap between consecutive matched words to be whitespace only. Tests pin period,
  comma, hyphen and parenthesis as non-matches, and `next  week` / `next\nweek` / `next \t week` as
  matches.
- `core/localdate.ts`'s `addDays` returned strings typed `LocalDate` that `isLocalDate` rejects —
  `10000-01-01` past the upper bound, `00-1-12-31` past the lower, `0NaN-NaN-NaN` for a non-integer
  `days`. It now validates its own result and returns `null` otherwise; `formatParts`' comment no
  longer claims to guarantee the shape. Tests cover both year bounds and `0.5`, `-1.5`, `NaN`,
  `Infinity`.
- `WORD_CHARACTERS` omitted `\p{M}`, so NFD-decomposed `på` tokenized as `pa` — contradicting the
  module's own Norwegian rationale and affecting the FR-7 keyword matching Epic 2 imports. FR-23 was
  unaffected either way. `\p{M}` added, with a test over `normalize('NFD')`.

Test gaps that let a regression through:
- `tests/unit/store.test.ts`'s capture-path guard banned `setTimeout` but not `setInterval` — the
  timer this story introduced. `setInterval` and `requestAnimationFrame` added to the pattern.
- Both em-dash e2e assertions compared the component against the label it imports, so reverting
  `labels.record.noDueDate` to `NO DUE DATE` kept the gate green. The literal is now pinned once.
- Nothing exercised `visibilitychange`: `fastForward('24:00:00')` fired the interval ~2880 times, so
  deleting the listener left the gate green — and that listener is the only trigger that fires in a
  frozen tab. Split into two tests at a fixed clock time with exact dates (see Implementation Notes).
- No test covered the `dueDate` round trip, now that a non-null one is written for the first time.
  Added: capture a date word at a fixed clock, reload, same pill and same stored date.

Documentation that had drifted:
- `use-today.ts` justified its eager `reread()` as covering a bfcache restore, which does not remount
  and so never re-runs the effect. Corrected to the real reason — the gap between the lazy state seed
  and the first interval tick — and the listener is named as what covers bfcache.
- `Today.tsx` still said `core/selectors.ts` is Story 1.4's; this story created it. Corrected to say
  it holds only the week definition, with 1.4 and Epic 3 adding the predicates. Comment only.
- `"Monday's meeting"` matched while `Mondays` did not, undocumented. Accepted as correct — a
  possessive names that Monday, a plural names no date — and now pinned by a test and one comment.
- `DAYS_PER_WEEK` was declared in `selectors.ts` while `dayOfWeek` spelled `% 7`, and could not
  import it back without a cycle. Moved to `core/localdate.ts`, used by `dayOfWeek`, and re-exported
  from `selectors.ts` so no importer changed.

Review pass 1, 2026-11-26. Three layers — blind hunter, edge-case hunter, verification gap — plus one
finding from the build's own diff read. Thirty findings, every one recorded.

### Patched

- **high — a multi-word date word joins across sentence punctuation.** `tokenize.ts`. Verified by
  running it: `'Do it next. Week is busy'` returned `2026-11-23` with the span covering `"next. Week"`,
  and `'Plan for next, week'` did the same. A silently wrong due date, which `date-words.ts`'s own doc
  calls worse than none, and the span handed to Epic 2's Summary included the period. The gap between
  consecutive matched words must now be whitespace only.
- **medium — the `visibilitychange` trigger was unexercised.** `capture.spec.ts`. Pre-verified by the
  verification-gap layer and confirmed: `fastForward('24:00:00')` fires the 30 s interval ~2880 times,
  so deleting the listener left the gate green. That listener is the only trigger that fires promptly
  in a frozen or bfcache-restored tab, where timers are suspended. Now isolated with `setSystemTime`,
  which moves the clock without firing timers.
- **medium — the midnight test pinned no date.** `capture.spec.ts`. The clock was installed at real
  time and only "the date changed" was asserted, so a re-read landing on any wrong day would pass.
  Clock now installed at a fixed time, exact dates asserted — which is also what AC 7 asks of a
  date-dependent test.
- **medium — the em-dash assertions were tautological.** `capture.spec.ts`. Both read
  `toHaveText(labels.record.noDueDate)`, comparing the component against the label it imports, so
  reverting the label to `'NO DUE DATE'` kept the suite green and would have silently undone the
  2026-11-26 correction. The literal is now pinned once.
- **medium — `setInterval` escaped the capture-path guard.** `store.test.ts`. The guard banned
  `setTimeout`, `requestIdleCallback` and `queueMicrotask` but not `setInterval` — the one timer this
  story introduced — while `use-today.ts`'s doc claimed timers were banned by name. Added, with
  `requestAnimationFrame`.
- **medium — the due pill rendered every date at secondary strength.** `Record.tsx`, found in the
  build's own diff read before the layers reported. `text-ink-secondary` sat in the `DUE_SLOT`
  constant shared by both branches, so a dated pill drew `#5C5345` where `d1` draws `--color-ink`
  `#1B1915` and reserves secondary ink for the dash. No assertion covered the text colour. Ink moved
  to each branch; both inks now asserted.
- **low — `addDays` broke its own totality contract.** `localdate.ts`. Reproduced directly:
  `addDays('9999-12-31', 1)` gave `'10000-01-01'`, `addDays('0000-01-01', -1)` gave `'00-1-12-31'`,
  and a non-integer `days` gave `'0NaN-NaN-NaN'` — each rejected by `isLocalDate` and each returned
  typed as `LocalDate`. Unreachable from the product (every call site passes a small integer and the
  reference date moves at most seven days), but a type lie in a function documented as total, and the
  existing test probed only ±100000 days, exactly where the claim holds. One `isLocalDate` check in
  `addDays` closes all three; grouped with the two reviewers who filed the bounds separately.
- **low — no round trip over a persisted due date.** `capture.spec.ts`. This is the first story to
  write a non-null `dueDate`, and only a hand-seeded document exercised the read side. Added.
- **low — `WORD_CHARACTERS` omitted `\p{M}`.** `tokenize.ts`. NFD-decomposed input splits mid-word,
  contradicting the module's own note about Norwegian. FR-23 behaviour is unchanged (NFD input
  returned `null` before and after, verified), but this is the shared matcher Epic 2's FR-7 imports.
  One character class.
- **low — the possessive/plural asymmetry was undocumented.** `tokenize.ts`. `"Monday's meeting"`
  resolves to `monday` while `Mondays` does not. Kept as correct — the possessive does name that
  Monday — and pinned with a test and a line of comment rather than left to be rediscovered.
- **low — the bfcache rationale described something the code cannot do.** `use-today.ts`. The eager
  `reread()` was justified as covering a bfcache restore, but such a restore does not remount, so the
  effect never re-runs there; the `visibilitychange` listener is what covers it. Comment corrected.
- **low — a stale comment contradicted a file this story created.** `Today.tsx` still read that
  `core/selectors.ts` is Story 1.4's. Corrected; comments only, as that file is on the capture path.
- **low — "declared once" did not hold for the week.** `selectors.ts` declared `DAYS_PER_WEEK` while
  `dayOfWeek` in `localdate.ts` spelled `% 7` and could not import it back without a cycle. Constant
  moved down to `localdate.ts` and re-exported, so importers are unaffected.

### Deferred

- **medium — the em-dash leaves the absent due date with no accessible name.** Filed independently by
  the edge-case and blind-hunter layers and self-reported by the implementation. Real: the record
  announced `NO DUE DATE` in Story 1.2 and now announces an em-dash or nothing, and `axe-core` cannot
  see it. Not patched because the fix adds a user-visible string and the question — whether this
  product speaks an absence or only draws it — is a UX-DR12 and UX-DR20 call in a locked document,
  which `bmad-correct-course` owns. Recorded in `deferred-work.md` and raised with the human.
- **low — the pill carries no year, so dates a year apart render identically.** `Record.tsx`.
  Unreachable from FR-23, whose vocabulary resolves at most seven days out, and `d1` draws no year.
  Becomes reachable when Story 1.5 allows an arbitrary due date to be typed, so recorded against that
  story rather than fixed against the frame.
- **low — the 30 s poll leaves the window it was written to close, and a cheaper closure exists.**
  `use-today.ts`. The blind hunter's point stands: re-reading the Clock port at submit — the one
  moment staleness becomes durable — needs no port change and would make the interval cosmetic. Not
  taken here because the spec's Code Map reasoned explicitly for handing the store a plain string so
  nothing on the capture path reads a runtime; changing that is a design decision, not a patch.
- **low — `use-today.ts` has no unit test.** Structural: Vitest runs `environment: 'node'` with no DOM
  and no React renderer, so no hook can be rendered. The unmount cleanup and the identical-string
  no-render claim are both unverified. Same limitation `deferred-work.md` already records for
  `ErrorBoundary`.
- **low — AC 6's second half is unmet with nothing recorded.** `epics.md`'s AC 6 reads "and is
  editable through FR-3", which Story 1.5 builds. The spec's Design Notes said so, but
  `deferred-work.md` did not, which is the file that exists to stop a retrospective rediscovering it.

### Rejected

- **false — a `DATE_WORDS` entry with no `resolve` arm would silently set no date.** Already guarded:
  `date-words.test.ts` iterates every vocabulary word against an expected-date map, so a word added
  without a resolver fails that test.
- **false — when the first match fails to resolve, later matches are never tried.** Two refutations:
  with `addDays` made total, `resolve` cannot return `null` for a matched vocabulary word, and
  retrying later matches would contradict FR-23 and AC 5, which make the first match in the text win.
- **false — the parsed date needs an `isLocalDate` re-check at the store's write boundary.** Redundant
  once `addDays` validates its own output; `parseDateWord` already rejects an unreadable reference
  date, so no malformed `dueDate` can reach the document.
- **low, rejected — `endOfWeek` is an export with no reader.** True that only `startOfWeek` and the
  week constant have callers in `src/`. But Story 3.1's AC 2 requires the week to be "Monday through
  Sunday inclusive, defined once", and the Sunday end is half of that definition; deleting it would
  make Epic 3 redefine the boundary the document says is declared here.
- **low, rejected — the 30 s interval deviates from the Code Map's "timer firing at the next local
  midnight".** A real deviation, documented in the Implementation Notes and in `issues.md`. Closing it
  needs the Clock port widened to expose an instant, which AD-2 forbids and the spec marked
  do-not-change — more than a direct correction, for a window a visible, untouched tab meets only at
  local midnight.
- **low, rejected — the dash and the pill text are not column-aligned.** The dated pill adds a 1 px
  border, so its text starts 1 px further in. Cosmetic at 1 px, and `d1` right-aligns the dash rather
  than aligning it to pill text, so the frame does not ask for what the comment claims.
- **low, rejected — the lowercasing rule is written twice in `tokenize.ts`.** `findFirstPhrase` derives
  its lowercased words from spans it already has; routing through `loweredWords` would call `words`
  a second time. The "fix" is slower than the duplication.
- **low, rejected — `needles()` re-splits the vocabulary on every call.** Eight entries per capture.
  Memoising it or letting callers pass a prepared vocabulary adds public surface for no measurable
  gain.
- **noted, not a finding — the diff handed to the reviewers covered only `src/` and `tests/`.** The
  blind hunter is right that `deferred-work.md` and the regenerated `epic-1-context.md` were therefore
  outside the staged patch. That was deliberate: they are workflow bookkeeping and planning context,
  not the implementation, and the reviewers read them off disk where it mattered.
- **noted, not a finding — `sprint-status.yaml` reads `in-progress` while the story is in review.**
  Correct for this point in the workflow; it moves to `done` at merge.

## Design Notes

**The reference date is a correctness input, not chrome.** Story 1.1 read it once at module scope and
that was cosmetic — only the header label went stale. Here the same value decides what `Friday`
means, and a wrong value is *persisted* into `dueDate`. That is why the clock-refresh fix travels
with this story rather than waiting: it is the same defect only once a date word exists.

**Why the week definition lands in `core/selectors.ts` and the arithmetic in `core/localdate.ts`.**
`epics.md`'s shared-ownership table puts the week definition in `core/selectors.ts` under Epic 1, and
Story 3.1's AC 2 says it is "defined once in `core/selectors.ts` and shared with FR-23's `next
week`". `localdate.ts`'s own module doc claims the calendar arithmetic. So `addDays` goes to
`localdate.ts`, the Monday-to-Sunday rule to `selectors.ts`, and `date-words.ts` composes them —
which also means Story 1.4 extends a file that already exists instead of creating it. Note
`dayOfWeek` already counts from Monday, so the week definition is a boundary helper, not a new
convention.

**What the pill looks like, and what Epic 3 inherits.** Measured from `d1-today.svg` against its
`MON 16 NOV 2026` reference date: every pill is 54×14 px, Barlow Condensed 700 at 9 px, tabular
numerals, text centred, and the em-dash is right-aligned where the pill would have been, carrying no
rect. This story builds the outlined treatment — `surface` fill, `rule` border — for every date, and
the em-dash for none. Epic 3 adds the two fills the frame also draws (`attention` olive with
`surface` text for past due, `due-week` yellow with `ink` text inside the current week) and the
window computation behind them. The shipped `px-[5px] py-[1px]` geometry in `Record.tsx` already
matches `m1`; this story changes the text, the ink and `data-due`, not the box.

**`formatHeaderDate` already renders the pill's format.** It produces `MON 16 NOV` — weekday, day,
month, no year, uppercase — which is exactly what `d1` draws in every pill. Reuse it rather than
writing a second date formatter, and pass `labels.dates` as it is passed today.

**AC 6's "editable through FR-3" is not this story's to meet.** The clause names FR-3, which Story
1.5 builds. What AC 6 requires here is that a parsed date *appears as a due pill* and is applied
directly rather than proposed. Review should read the editability clause as forward-looking, exactly
as AC 7 of Story 1.2 read its inert checkbox.

**DESIGN.md contradicts itself and the frontmatter wins.** Its `due-pill:` frontmatter line now names
all four states, but the prose at its Components section still reads "outlined when there is none" —
the 2026-11-26 correct-course edited only the frontmatter. Frontmatter is the authority for tokens
and geometry by this project's own convention. Neither line is this story's to fix, and under the
CHECKPOINT 1 decision the two treatments built here are consistent with both readings.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm run lint` -- expected: exit 0, both `eslint` and the hex scanner; the core-purity override must
  report nothing on the three new `core` modules
- `npm test` -- expected: the new tokenize, date-words and selectors suites pass alongside the
  existing nine unit files, `core-purity` and `theme-tokens` included
- `npm run build && npm run test:e2e` -- expected: the em-dash and outlined-pill assertions pass at
  360 px and 1280 px, `axe-core` clean, no horizontal scroll
- `node scripts/check-bundle-key.mjs dist` -- expected: exit 0

**Manual checks:**
- Capture "Submit assignment in IBE160 Friday" on a Monday: the pill reads that Friday's date in the
  outlined treatment, and the sentence is unchanged, `Friday` included.
- Capture "Pay RENT på fredag": no pill, an em-dash, and the text byte-identical.
- With the tab left open across local midnight, the header date moves and a newly captured `Friday`
  resolves against the new day.
- The record against `m1-today.svg`: still 46 px, still no focusable control inside it, nothing
  purple.
