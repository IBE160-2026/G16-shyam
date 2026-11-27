/**
 * Membership, and the week it is measured in (FR-2, FR-12, FR-23, AD-9).
 *
 * **Every list in this product is a predicate here, named for its condition.**
 * A label has no vote on membership (AD-9): changing what a list contains means
 * changing a function in this file. Story 1.4 adds `isCompleted` and
 * `isArchived`, the two FR-2 needs to decide what Today shows; Epic 3 adds the
 * Smart List and due-window predicates to the same file.
 *
 * The other half is the week definition, which two separate stories have to
 * agree on: where a week starts and where it ends.
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

import { DAYS_PER_WEEK, addDays, dayDiff, dayOfWeek, type LocalDate } from './localdate';
import type { Task } from './task';

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

/**
 * Whether `task` is completed (FR-5, AD-7).
 *
 * **Derived, never stored.** The Task persists `completedAt` and nothing else:
 * there is no `completed` boolean anywhere in the document, because a stored
 * flag is a second source of truth free to disagree with the date it came from.
 * This is that rule written once, so "completed" cannot come to mean two
 * slightly different things on two surfaces.
 *
 * **Its first behavioural reader is Story 1.6**, which completes and
 * un-completes a Task; Epic 3's Archive is the second. It is here now because
 * `isArchived` below is defined in terms of it and AC 1 needs both. A surface
 * that renders the completion *date* — Task detail — reads `completedAt`
 * directly rather than calling this, because it needs the value and not the
 * boolean, and narrowing `LocalDate | null` is what makes the date safe to
 * pass on.
 */
export function isCompleted(task: Task): boolean {
  return task.completedAt !== null;
}

/**
 * Whether `task` has left the ordinary lists for the Archive (FR-2, FR-16,
 * AD-7).
 *
 * Completed, and completed **more than** `retentionDays` ago measured against
 * `today`. Strictly greater: a Task completed exactly `retentionDays` ago is
 * still listed, and archives the following day. That boundary is the one thing
 * about this predicate worth testing twice.
 *
 * Computed on every render and stored nowhere — there is no `archived` flag and
 * no sweep that writes one, which is what keeps Archive honest in a tab left
 * open across midnight: the reference date moves and the answer moves with it.
 *
 * `today` is an argument because `core` reads no clock (AD-1, AD-2), and
 * `retentionDays` is an argument because Epic 3 makes the window configurable
 * and Epic 8 puts it in Settings — both supply it from the settings document
 * where Epic 1 supplies `DEFAULT_RETENTION_DAYS`, and this function does not
 * change when they do.
 *
 * An unreadable date reads as **not archived**: a Task whose stored
 * `completedAt` cannot be parsed stays visible rather than vanishing from every
 * list at once, which is the failure a user could neither see nor explain.
 */
export function isArchived(task: Task, today: LocalDate, retentionDays: number): boolean {
  if (task.completedAt === null) return false;
  const age = dayDiff(today, task.completedAt);
  if (age === null) return false;
  return age > retentionDays;
}
