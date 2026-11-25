import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLocalDate } from '../../src/core/localdate';
import { systemClock } from '../../src/adapters/system-clock';

/**
 * The one `Date`-reading file in the shipped app, pinned to an exact day.
 *
 * Every other date in this product is injected, so this adapter is the single
 * place a calendar mistake can hide: swap `getMonth() + 1` for `getMonth()`,
 * or `getDate()` for `getUTCDate()`, and nothing else in the suite notices —
 * `core/` never calls it and the end-to-end check asserts the *format* of the
 * header date rather than its value, deliberately, because the real clock is
 * the real clock.
 *
 * So the clock is frozen instead. Each moment below is built with the local
 * `Date(year, month, day, …)` constructor, which makes the expected string a
 * property of the input rather than of the machine's time zone.
 */
describe('systemClock.today()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function atLocal(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
  ): string {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(year, month - 1, day, hour, minute, 0, 0));
    return systemClock.today();
  }

  it('reads the local calendar day', () => {
    expect(atLocal(2026, 11, 16, 12, 0)).toBe('2026-11-16');
  });

  it('still reads today late in the evening', () => {
    // 23:45 local is already "tomorrow" in several zones east of here. The day
    // the user is living in is the day the domain records (AD-2).
    expect(atLocal(2026, 11, 16, 23, 45)).toBe('2026-11-16');
  });

  it('still reads today in the first minutes after midnight', () => {
    expect(atLocal(2026, 11, 17, 0, 5)).toBe('2026-11-17');
  });

  it('numbers months from one, not from zero', () => {
    // `getMonth()` is zero-based and `01` would look plausible in January.
    expect(atLocal(2026, 1, 15, 9, 0)).toBe('2026-01-15');
    expect(atLocal(2026, 12, 15, 9, 0)).toBe('2026-12-15');
  });

  it('zero-pads a single-digit month and day', () => {
    expect(atLocal(2026, 2, 3, 9, 0)).toBe('2026-02-03');
  });

  it('reads a leap day', () => {
    expect(atLocal(2024, 2, 29, 23, 59)).toBe('2024-02-29');
  });

  it('crosses a year boundary without drifting', () => {
    expect(atLocal(2026, 12, 31, 23, 59)).toBe('2026-12-31');
    expect(atLocal(2027, 1, 1, 0, 1)).toBe('2027-01-01');
  });

  it('produces something the domain recognises as a LocalDate', () => {
    expect(isLocalDate(atLocal(2026, 11, 16, 12, 0))).toBe(true);
  });
});
