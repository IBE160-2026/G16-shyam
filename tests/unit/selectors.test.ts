import { describe, expect, it } from 'vitest';
import { dayOfWeek } from '../../src/core/localdate';
import { DAYS_PER_WEEK, WEEK_START_DAY, endOfWeek, startOfWeek } from '../../src/core/selectors';

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
