import { describe, expect, it } from 'vitest';
import { dayOfWeek } from '../../src/core/localdate';
import {
  DAYS_PER_WEEK,
  WEEK_START_DAY,
  endOfWeek,
  isArchived,
  isCompleted,
  startOfWeek,
} from '../../src/core/selectors';
import { DEFAULT_RETENTION_DAYS } from '../../src/core/constants';
import { createTask, type Task } from '../../src/core/task';

/**
 * The week, Monday through Sunday inclusive (FR-12, FR-23, NFR-10).
 *
 * Every date here is supplied. Nothing reads the system clock, so the week this
 * computes is always the week containing a date the test named — which is the
 * only way an assertion about Sunday can mean anything on a Sunday.
 *
 * Sunday is the day this definition exists for. Every other locale convention
 * puts it at the *start* of the week, so a second implementation written from
 * habit elsewhere in the product would disagree with this one on exactly one
 * day in seven — and would disagree about which Monday `next week` means.
 */

/** Monday 2026-11-16 through Sunday 2026-11-22, in order. */
const WEEK = [
  '2026-11-16',
  '2026-11-17',
  '2026-11-18',
  '2026-11-19',
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
] as const;

describe('the week definition', () => {
  it('starts on Monday in dayOfWeek’s own numbering', () => {
    expect(WEEK_START_DAY).toBe(0);
    expect(dayOfWeek('2026-11-16')).toBe(WEEK_START_DAY);
    expect(DAYS_PER_WEEK).toBe(7);
  });
});

describe('startOfWeek', () => {
  it('is the same Monday for every day of the week, Sunday included', () => {
    for (const date of WEEK) {
      expect(startOfWeek(date), date).toBe('2026-11-16');
    }
  });

  it('is the date itself on a Monday', () => {
    expect(startOfWeek('2026-11-16')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-23')).toBe('2026-11-23');
  });

  it('puts Sunday in the week that began, not the one about to', () => {
    // The one assertion the whole definition exists for.
    expect(startOfWeek('2026-11-22')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-23')).not.toBe('2026-11-16');
  });

  it('crosses a month boundary', () => {
    // Sunday 2026-11-01 belongs to the week that started in October.
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26');
    expect(startOfWeek('2026-12-01')).toBe('2026-11-30');
  });

  it('crosses a year boundary', () => {
    // Friday 2027-01-01 belongs to the week that started in 2026.
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28');
  });

  it('returns null rather than raising on an unreadable date', () => {
    expect(startOfWeek('2026-02-30')).toBeNull();
    expect(startOfWeek('')).toBeNull();
  });
});

describe('endOfWeek', () => {
  it('is the same Sunday for every day of the week', () => {
    for (const date of WEEK) {
      expect(endOfWeek(date), date).toBe('2026-11-22');
    }
  });

  it('is inclusive — a day in the week, not the boundary after it', () => {
    expect(dayOfWeek(endOfWeek('2026-11-18') ?? '')).toBe(6);
    expect(endOfWeek('2026-11-22')).toBe('2026-11-22');
  });

  it('crosses a month and a year boundary', () => {
    expect(endOfWeek('2026-11-30')).toBe('2026-12-06');
    expect(endOfWeek('2026-12-28')).toBe('2027-01-03');
  });

  it('returns null rather than raising on an unreadable date', () => {
    expect(endOfWeek('nope')).toBeNull();
  });
});

/**
 * Membership: completed, and archived (FR-2, FR-16, AD-7, NFR-10).
 *
 * Every date is supplied and every window is passed in. Nothing here reads a
 * clock or a settings document, which is the only way an assertion about "31
 * days ago" can mean the same thing on every machine and on every day the gate
 * happens to run.
 */

/** Monday 2026-11-16 — the reference date the whole story is specified against. */
const TODAY = '2026-11-16';

/**
 * The Tier 1 window — the shipped constant, not a literal beside it.
 *
 * Spelling `30` here would leave the boundary cases below passing against a
 * number the product no longer uses: nothing else in the suite reads
 * `DEFAULT_RETENTION_DAYS`, so a change to it would reach only the end-to-end
 * gate, where the dates come from the real clock. The value is asserted
 * outright first, so a change to it fails here and says so plainly.
 */
const RETENTION = DEFAULT_RETENTION_DAYS;

/** A Task completed on `completedAt`, and otherwise exactly as captured. */
function completedOn(completedAt: string | null): Task {
  return { ...createTask('id-1', 'Submit assignment in IBE160'), completedAt };
}

describe('the retention default', () => {
  it('is thirty days, which is what FR-16 and AD-7 specify', () => {
    // The one place the shipped number is pinned. `Today` is the only reader
    // (`src/ui/today/Today.tsx`), and it passes the constant straight through
    // to `isArchived`, so without this a wrong default reaches only the
    // end-to-end gate — and there the dates come from the real clock.
    expect(DEFAULT_RETENTION_DAYS).toBe(30);
    expect(Number.isInteger(DEFAULT_RETENTION_DAYS)).toBe(true);
  });
});

describe('isCompleted', () => {
  it('is the presence of a completion date, and nothing else', () => {
    expect(isCompleted(completedOn('2026-11-10'))).toBe(true);
    expect(isCompleted(completedOn(null))).toBe(false);
  });

  it('is false for a freshly captured Task', () => {
    // FR-1's defaults, straight from the factory: a new Task is never completed.
    expect(isCompleted(createTask('id-2', 'Pay rent'))).toBe(false);
  });

  it('reads a date it cannot parse as completed all the same', () => {
    // The field is set, so the user completed this Task; only *when* is
    // unreadable. Calling it incomplete would un-complete a Task on the
    // strength of a storage defect, which is a worse answer than a completion
    // whose date cannot be shown.
    expect(isCompleted(completedOn('2026-02-30'))).toBe(true);
  });
});

describe('isArchived', () => {
  it('is false for an incomplete Task, however old', () => {
    // Archive is a function of completion. A Task captured a year ago and never
    // completed is still work to do, and FR-2 keeps it in the list.
    expect(isArchived(completedOn(null), TODAY, RETENTION)).toBe(false);
  });

  it('is false for a Task completed today', () => {
    expect(isArchived(completedOn(TODAY), TODAY, RETENTION)).toBe(false);
  });

  it('is false inside the window', () => {
    // Six days ago — completed, visible, and the state Story 1.6 leaves a Task
    // in for the next month.
    expect(isArchived(completedOn('2026-11-10'), TODAY, RETENTION)).toBe(false);
  });

  it('is false at exactly the window, and true the day beyond it', () => {
    // The one assertion this predicate exists for. `> retentionDays`, strictly:
    // 2026-10-17 is 30 days before 2026-11-16 and is still listed; 2026-10-16
    // is 31 and is gone. An off-by-one here would archive every Task a day
    // early for the life of the product, and no surface would ever say so.
    expect(isArchived(completedOn('2026-10-17'), TODAY, RETENTION)).toBe(false);
    expect(isArchived(completedOn('2026-10-16'), TODAY, RETENTION)).toBe(true);
  });

  it('is true well beyond the window', () => {
    expect(isArchived(completedOn('2026-01-01'), TODAY, RETENTION)).toBe(true);
  });

  it('is false for a completion date in the future', () => {
    // Not reachable through the UI, but reachable in a stored document — a
    // device whose clock was wrong, or a file edited by hand. A negative age is
    // not "more than thirty days", so the Task stays visible rather than being
    // archived by arithmetic nobody intended.
    expect(isArchived(completedOn('2026-12-01'), TODAY, RETENTION)).toBe(false);
  });

  it('takes the window as an argument, so a configured one needs no new code', () => {
    // Epic 3 makes the window configurable and Epic 8 exposes it in Settings.
    // Both pass a different number to this same call; the predicate does not
    // change, which is the whole of its forward compatibility.
    const completed = completedOn('2026-11-09');
    expect(isArchived(completed, TODAY, 7)).toBe(false);
    expect(isArchived(completed, TODAY, 6)).toBe(true);
    // Zero is a legitimate setting: archive a Task the day after it is done.
    expect(isArchived(completedOn('2026-11-15'), TODAY, 0)).toBe(true);
    expect(isArchived(completedOn(TODAY), TODAY, 0)).toBe(false);
  });

  it('reads an unreadable date as not archived rather than raising', () => {
    // `core` is total and hands no caller an exception (AD-1). The chosen
    // reading is the visible one: a Task whose stored date cannot be parsed
    // stays in the list, because vanishing from every list at once is the
    // failure a user could neither see nor explain.
    expect(isArchived(completedOn('2026-02-30'), TODAY, RETENTION)).toBe(false);
    expect(isArchived(completedOn('not a date'), TODAY, RETENTION)).toBe(false);
    expect(isArchived(completedOn(''), TODAY, RETENTION)).toBe(false);
    // An unreadable *reference* date, too — the same answer, for the same
    // reason.
    expect(isArchived(completedOn('2026-01-01'), 'nope', RETENTION)).toBe(false);
  });

  it('crosses a month and a year boundary by days, not by calendar arithmetic', () => {
    // 2026-01-15 is 31 days before 2026-02-15, and 2025-12-16 is 31 days before
    // 2026-01-16. A month-subtracting implementation agrees with this one in
    // November and disagrees in February.
    expect(isArchived(completedOn('2026-01-15'), '2026-02-15', RETENTION)).toBe(true);
    expect(isArchived(completedOn('2026-01-16'), '2026-02-15', RETENTION)).toBe(false);
    expect(isArchived(completedOn('2025-12-16'), '2026-01-16', RETENTION)).toBe(true);
    expect(isArchived(completedOn('2025-12-17'), '2026-01-16', RETENTION)).toBe(false);
  });
});
