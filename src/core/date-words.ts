/**
 * FR-23: the due date comes from the date word the user already typed.
 *
 * **The vocabulary is closed, and that is the feature.** `today`, `tomorrow`,
 * the five weekdays `Monday`–`Friday` written out in full, and `next week`.
 * Nothing else is guessed — not `Saturday`, not `fri`, not `Mondays`, not
 * `15 March`, not `fredag`. A parser that guessed would be wrong occasionally
 * and silently, and a wrong due date is worse than no due date: no date is a
 * fact the user can see and fix, a wrong one looks like an answer. PRD §6.2
 * makes the small vocabulary the accepted trade.
 *
 * **The sentence is never touched.** This module reads `text` and returns a
 * date and a span; it does not rewrite, trim, strip or re-case anything, and no
 * caller is expected to. The span is returned alongside the date because Epic
 * 2's Summary needs to know which characters the date came from in order to
 * leave them out — so the input to that work is defined here rather than
 * reconstructed there by searching the sentence a second time.
 *
 * **These words are input, not output.** `core` holds no user-visible string
 * (AD-9) — `src/ui/labels.ts` owns every word the product *says*. The
 * vocabulary below is a parsing rule: it is what the product *understands*, it
 * is English only by FR-23, and it is never rendered. That is why it lives in
 * the domain and the weekday names on screen do not.
 *
 * Pure (AD-1): the reference date is an argument. Nothing here reads a clock,
 * so `Friday` resolves identically on any machine, in any zone, on any day —
 * which is the whole of NFR-10 for this feature.
 */

import { addDays, dayOfWeek, isLocalDate, type LocalDate } from './localdate';
import { DAYS_PER_WEEK, startOfWeek } from './selectors';
import { findFirstPhrase, type Span } from './tokenize';

/** `today`, as FR-23 spells it. */
const TODAY = 'today';
/** `tomorrow`, as FR-23 spells it. */
const TOMORROW = 'tomorrow';
/** `next week`, as FR-23 spells it. */
const NEXT_WEEK = 'next week';

/**
 * The five weekdays FR-23 recognises, in `dayOfWeek`'s Monday-first order, so
 * the index into this list *is* the weekday index.
 *
 * Saturday and Sunday are absent on purpose rather than by oversight: FR-23
 * names Monday through Friday, and a weekend day sets no date. Writing them
 * here and filtering them later would make the exclusion a behaviour instead of
 * a definition.
 */
const WEEKDAYS: readonly string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/**
 * Every phrase FR-23 recognises. Order is irrelevant to the result — the first
 * match in the *text* wins, not the first entry here (`findFirstPhrase`) — so
 * this is simply the vocabulary, readable as a list.
 */
export const DATE_WORDS: readonly string[] = [TODAY, TOMORROW, ...WEEKDAYS, NEXT_WEEK];

/** A recognised date word: what it resolved to, and where it was. */
export interface DateWordMatch {
  /** The resolved due date. */
  readonly date: LocalDate;
  /** Which vocabulary entry matched, lowercase as the vocabulary spells it. */
  readonly word: string;
  /** Where the words sit in the untouched text (FR-23, Epic 2's Summary). */
  readonly span: Span;
}

/**
 * The next occurrence of weekday `target`, counting from `reference` — and
 * `reference` itself when it already is that weekday.
 *
 * AC 3 is this line: `Monday` on a Monday means *today*, not a week away. The
 * modulo does it in one step, and the zero case is the point rather than an
 * edge of it.
 */
function nextWeekday(reference: LocalDate, target: number): LocalDate | null {
  const from = dayOfWeek(reference);
  if (from === null) return null;
  return addDays(reference, (((target - from) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK);
}

/** What a matched vocabulary entry resolves to against `reference`. */
function resolve(word: string, reference: LocalDate): LocalDate | null {
  if (word === TODAY) return reference;
  if (word === TOMORROW) return addDays(reference, 1);
  if (word === NEXT_WEEK) {
    // The Monday of the following week, from the one week definition there is
    // (`core/selectors.ts`). Not "seven days from now": `next week` names a
    // week, and a user who types it on a Friday means the Monday after the
    // weekend, not the following Friday.
    const start = startOfWeek(reference);
    return start === null ? null : addDays(start, DAYS_PER_WEEK);
  }
  const weekday = WEEKDAYS.indexOf(word);
  return weekday === -1 ? null : nextWeekday(reference, weekday);
}

/**
 * The due date `text` names, resolved against `reference`, or `null`.
 *
 * `null` is the ordinary answer, not a failure: PRD §6.2 and AC 4 require that
 * an unrecognised phrase set no date, raise nothing, and leave the Task to be
 * created exactly as it would have been. The caller distinguishes "no date
 * named" from "something went wrong" by never having to — there is no second
 * outcome.
 *
 * An unreadable `reference` also yields `null` rather than an exception, like
 * every other total function in `core`: a Task with no due date is a correct
 * Task, and a thrown error on the capture path is not a state this product has
 * (UX-DR22).
 */
export function parseDateWord(text: string, reference: LocalDate): DateWordMatch | null {
  if (!isLocalDate(reference)) return null;
  const match = findFirstPhrase(text, DATE_WORDS);
  if (match === null) return null;
  const date = resolve(match.phrase, reference);
  return date === null ? null : { date, word: match.phrase, span: match.span };
}
