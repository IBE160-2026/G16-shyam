/**
 * The week, defined once (FR-12, FR-23).
 *
 * **This file holds the week definition and nothing else yet.** It is the home
 * `epics.md` names for membership — Story 1.4 adds `isCompleted` and
 * `isArchived`, and Epic 3 adds the Smart List and due-window predicates — but
 * a predicate written before there is a list to put it in is a predicate with
 * no reader, free to disagree with the surface it was meant to drive. What is
 * here is only what two separate stories already need to agree on: where a week
 * starts and where it ends.
 *
 * **The current week is Monday through Sunday inclusive, in the device's local
 * calendar.** Story 3.1's AC 2 requires that to be declared in exactly one
 * place and shared with FR-23's `next week`, which resolves to the Monday of
 * the following week — so `core/date-words.ts` composes these functions rather
 * than counting back to a Monday of its own. The two would otherwise be free to
 * disagree about Sunday, which is the day they disagree on in practice: every
 * other locale convention puts it at the other end of the week.
 *
 * Pure, like everything in `src/core/` (AD-1): the week is always the week
 * containing a date the caller supplies, never the week containing "now".
 */

import { DAYS_PER_WEEK, addDays, dayOfWeek, type LocalDate } from './localdate';

/**
 * The number of days in a week, re-exported from the module that owns the
 * calendar.
 *
 * It is declared in `core/localdate.ts` because `dayOfWeek` needs it and this
 * module imports that one — declaring it here would either be a second `7` or a
 * cycle. Re-exported so a caller reading the week definition finds it in the
 * file the week definition lives in.
 */
export { DAYS_PER_WEEK };

/**
 * The index the week starts on, in `dayOfWeek`'s Monday-first numbering.
 *
 * Exported so a later predicate states the rule by naming it rather than by
 * spelling `0` again — and so the one place the convention could change is a
 * declaration rather than a scattering of literals.
 */
export const WEEK_START_DAY = 0;

/**
 * The Monday of the week containing `date`, or `null` when `date` is not a
 * `LocalDate`.
 *
 * `date` itself when `date` is a Monday, and six days back when it is a Sunday
 * — Sunday belongs to the week that *began*, not to the one about to.
 */
export function startOfWeek(date: LocalDate): LocalDate | null {
  const weekday = dayOfWeek(date);
  if (weekday === null) return null;
  return addDays(date, WEEK_START_DAY - weekday);
}

/**
 * The Sunday of the week containing `date`, or `null` when `date` is not a
 * `LocalDate`. Inclusive: it is a day *in* the week, not the boundary after it.
 */
export function endOfWeek(date: LocalDate): LocalDate | null {
  const start = startOfWeek(date);
  if (start === null) return null;
  return addDays(start, DAYS_PER_WEEK - 1);
}
