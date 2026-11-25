import { describe, expect, it } from 'vitest';
import {
  dayOfWeek,
  daysInMonth,
  formatHeaderDate,
  isLocalDate,
  localDateParts,
  type DateNames,
} from '../../src/core/localdate';
import { labels } from '../../src/ui/labels';

/**
 * The header date, against injected dates only (NFR-10, AD-2).
 *
 * Not one assertion here reads the system clock. Every date is supplied, which
 * is the whole reason the Clock port exists: a test that formatted "today"
 * would pass on a Monday in November and fail on a Sunday in March, and the
 * failure would look like a formatter bug rather than a test bug.
 */

/** Synthetic names, so the boundary tests do not depend on the product's copy. */
const NAMES: DateNames = {
  weekdays: ['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'],
  months: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'],
};

describe('isLocalDate', () => {
  it('accepts a well-formed date', () => {
    expect(isLocalDate('2026-11-16')).toBe(true);
    expect(isLocalDate('2024-02-29')).toBe(true);
  });

  it('rejects the wrong shape', () => {
    for (const value of ['2026-11-6', '26-11-16', '2026/11/16', '2026-11-16T00:00:00Z', '', 'today']) {
      expect(isLocalDate(value), value).toBe(false);
    }
  });

  it('rejects a date that has the shape but does not exist', () => {
    for (const value of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-11-00', '2026-11-31']) {
      expect(isLocalDate(value), value).toBe(false);
    }
    // 2026 is not a leap year; 2024 is.
    expect(isLocalDate('2026-02-29')).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('knows the months', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('knows the leap rule, including the century exceptions', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });
});

describe('localDateParts', () => {
  it('splits a date into its parts', () => {
    expect(localDateParts('2026-11-16')).toEqual({ year: 2026, month: 11, day: 16 });
  });

  it('returns null rather than raising on an unreadable date', () => {
    expect(localDateParts('nope')).toBeNull();
  });
});

describe('dayOfWeek', () => {
  it('indexes a Monday-first week', () => {
    // 0 is Monday and 6 is Sunday — the week DESIGN.md uses and the one FR-23's
    // `next week` will reuse.
    expect(dayOfWeek('2026-11-16')).toBe(0); // Monday
    expect(dayOfWeek('2026-11-22')).toBe(6); // Sunday
    expect(dayOfWeek('2026-11-23')).toBe(0); // the next Monday
  });

  it('is right across a month boundary', () => {
    expect(dayOfWeek('2026-02-28')).toBe(5); // Saturday
    expect(dayOfWeek('2026-03-01')).toBe(6); // Sunday
  });

  it('is right across a year boundary', () => {
    expect(dayOfWeek('2026-12-31')).toBe(3); // Thursday
    expect(dayOfWeek('2026-01-01')).toBe(3); // Thursday
    expect(dayOfWeek('1999-12-31')).toBe(4); // Friday
    expect(dayOfWeek('2000-01-01')).toBe(5); // Saturday
  });

  it('is right on a leap day', () => {
    expect(dayOfWeek('2024-02-29')).toBe(3); // Thursday
  });

  it('returns null rather than raising on an unreadable date', () => {
    expect(dayOfWeek('2026-02-30')).toBeNull();
  });
});

describe('formatHeaderDate', () => {
  it('reads as m9 draws it', () => {
    // The surface, with the product's own calendar words.
    expect(formatHeaderDate('2026-11-16', labels.dates)).toBe('MON 16 NOV');
  });

  it('zero-pads the day so a column of dates aligns', () => {
    // Tabular figures are useless if the glyph count varies (UX-DR4).
    expect(formatHeaderDate('2026-01-05', NAMES)).toBe('w0 05 m1');
    expect(formatHeaderDate('2026-09-09', NAMES)).toBe('w2 09 m9');
  });

  it('uses the names it is given, and holds no words of its own', () => {
    expect(formatHeaderDate('2026-11-16', NAMES)).toBe('w0 16 m11');
  });

  it('is right at every month boundary of a year', () => {
    const firsts = [
      ['2026-01-01', 'w3 01 m1'],
      ['2026-02-01', 'w6 01 m2'],
      ['2026-03-01', 'w6 01 m3'],
      ['2026-04-01', 'w2 01 m4'],
      ['2026-05-01', 'w4 01 m5'],
      ['2026-06-01', 'w0 01 m6'],
      ['2026-07-01', 'w2 01 m7'],
      ['2026-08-01', 'w5 01 m8'],
      ['2026-09-01', 'w1 01 m9'],
      ['2026-10-01', 'w3 01 m10'],
      ['2026-11-01', 'w6 01 m11'],
      ['2026-12-01', 'w1 01 m12'],
    ] as const;
    for (const [date, expected] of firsts) {
      expect(formatHeaderDate(date, NAMES), date).toBe(expected);
    }
  });

  it('crosses a year boundary without drifting', () => {
    expect(formatHeaderDate('2026-12-31', NAMES)).toBe('w3 31 m12');
    expect(formatHeaderDate('2027-01-01', NAMES)).toBe('w4 01 m1');
  });

  it('returns the input unchanged rather than raising or rendering blank', () => {
    // core is total (conventions) and the surface has no error state to fall
    // into (UX-DR18, UX-DR22).
    expect(formatHeaderDate('2026-02-30', NAMES)).toBe('2026-02-30');
    expect(formatHeaderDate('', NAMES)).toBe('');
  });

  it('survives names that are too short, without raising', () => {
    expect(formatHeaderDate('2026-11-16', { weekdays: [], months: [] })).toBe('2026-11-16');
  });
});

describe("the product's calendar words", () => {
  it('are seven weekdays Monday first and twelve months January first', () => {
    expect(labels.dates.weekdays).toHaveLength(7);
    expect(labels.dates.weekdays[0]).toBe('MON');
    expect(labels.dates.weekdays[6]).toBe('SUN');
    expect(labels.dates.months).toHaveLength(12);
    expect(labels.dates.months[0]).toBe('JAN');
    expect(labels.dates.months[11]).toBe('DEC');
  });
});
