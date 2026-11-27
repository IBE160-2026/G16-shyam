import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayDiff,
  dayOfWeek,
  daysInMonth,
  formatFullDate,
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

describe('addDays', () => {
  it('shifts a date forward and back within one month', () => {
    expect(addDays('2026-11-16', 0)).toBe('2026-11-16');
    expect(addDays('2026-11-16', 4)).toBe('2026-11-20');
    expect(addDays('2026-11-16', -1)).toBe('2026-11-15');
  });

  it('crosses a month boundary in both directions', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-01', -1)).toBe('2026-11-30');
    // 30-day month into 31-day month and back.
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDays('2026-05-01', -1)).toBe('2026-04-30');
  });

  it('crosses a year boundary in both directions', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });

  it('knows February in a leap year and in a common one', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    // Backwards over the leap day, which is where a month-by-month carry loop
    // written by hand gets it wrong.
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('knows the century leap exceptions', () => {
    // 1900 was not a leap year; 2000 was.
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01');
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29');
  });

  it('is exact over a long span, in both directions', () => {
    // 2024 is a leap year, so a year is 366 days from this date.
    expect(addDays('2024-01-01', 366)).toBe('2025-01-01');
    expect(addDays('2025-01-01', -366)).toBe('2024-01-01');
    expect(addDays('2026-11-16', 365 * 4 + 1)).toBe('2030-11-16');
  });

  it('round-trips: adding then subtracting returns the same date', () => {
    for (const date of ['2026-01-31', '2024-02-29', '2026-11-16', '2026-12-31']) {
      for (const days of [1, 7, 30, 365, -1, -7, -400]) {
        const moved = addDays(date, days);
        expect(moved, `${date} + ${String(days)}`).not.toBeNull();
        expect(addDays(moved ?? '', -days), `${date} + ${String(days)} back`).toBe(date);
      }
    }
  });

  it('always produces something isLocalDate accepts', () => {
    for (const days of [-100000, -1, 0, 1, 100000]) {
      const moved = addDays('2026-11-16', days);
      expect(isLocalDate(moved ?? ''), String(days)).toBe(true);
    }
  });

  it('agrees with dayOfWeek: seven days on is the same weekday', () => {
    const start = '2026-11-16';
    expect(dayOfWeek(addDays(start, 7) ?? '')).toBe(dayOfWeek(start));
    expect(dayOfWeek(addDays(start, 1) ?? '')).toBe(1);
  });

  it('returns null rather than raising on an unreadable date', () => {
    // core is total: a caller decides what an unreadable date means, and is
    // never handed an exception for one (conventions).
    expect(addDays('2026-02-30', 1)).toBeNull();
    expect(addDays('', 1)).toBeNull();
    expect(addDays('nope', 0)).toBeNull();
  });

  it('returns null rather than a date outside the four-digit year', () => {
    // A result `isLocalDate` would reject must not be returned typed as one:
    // it would be stored in `dueDate` and make the whole document unreadable
    // on the next read (AD-6).
    expect(addDays('9999-12-31', 0)).toBe('9999-12-31');
    expect(addDays('9999-12-31', 1)).toBeNull();
    expect(addDays('0000-01-01', 0)).toBe('0000-01-01');
    expect(addDays('0000-01-01', -1)).toBeNull();
  });

  it('returns null on a shift that is not a whole number of days', () => {
    for (const days of [0.5, -1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(addDays('2026-11-16', days), String(days)).toBeNull();
    }
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

describe('dayDiff', () => {
  it('is zero for the same day', () => {
    expect(dayDiff('2026-11-16', '2026-11-16')).toBe(0);
  });

  it('counts how long ago the second date was', () => {
    // The argument order the Archive rule is stated in: `dayDiff(today, then)`
    // is the age of `then`, so a positive number reads as "days ago".
    expect(dayDiff('2026-11-16', '2026-11-15')).toBe(1);
    expect(dayDiff('2026-11-16', '2026-11-09')).toBe(7);
    expect(dayDiff('2026-11-16', '2026-10-17')).toBe(30);
    expect(dayDiff('2026-11-16', '2026-10-16')).toBe(31);
  });

  it('is negative when the second date is later', () => {
    expect(dayDiff('2026-11-16', '2026-11-17')).toBe(-1);
    expect(dayDiff('2026-11-16', '2026-12-16')).toBe(-30);
  });

  it('crosses a month boundary', () => {
    expect(dayDiff('2026-12-01', '2026-11-30')).toBe(1);
    expect(dayDiff('2026-03-01', '2026-02-28')).toBe(1);
  });

  it('crosses a year boundary', () => {
    expect(dayDiff('2027-01-01', '2026-12-31')).toBe(1);
    expect(dayDiff('2027-01-01', '2026-01-01')).toBe(365);
  });

  it('counts the leap day in a leap year', () => {
    // 2028 is a leap year: 2028-03-01 is 366 days after 2027-03-01, and
    // February has a 29th to be counted. An implementation that assumed 365
    // would be a day out for every date after February for four years.
    expect(dayDiff('2028-03-01', '2027-03-01')).toBe(366);
    expect(dayDiff('2028-03-01', '2028-02-29')).toBe(1);
    expect(dayDiff('2028-03-01', '2028-02-28')).toBe(2);
    // And not in a common year, where the 28th is the last day.
    expect(dayDiff('2027-03-01', '2027-02-28')).toBe(1);
  });

  it('is right across a century that is not a leap year', () => {
    // 2100 is divisible by 4 and is *not* a leap year. The rule most
    // hand-rolled calendars get wrong.
    expect(dayDiff('2100-03-01', '2100-02-28')).toBe(1);
    expect(dayDiff('2000-03-01', '2000-02-28')).toBe(2);
  });

  it('is null rather than raising on a date it cannot read', () => {
    expect(dayDiff('2026-02-30', '2026-11-16')).toBeNull();
    expect(dayDiff('2026-11-16', 'not a date')).toBeNull();
    expect(dayDiff('', '')).toBeNull();
  });
});

describe('formatFullDate', () => {
  it('reads as d1 and d5 draw the desktop title row', () => {
    expect(formatFullDate('2026-11-16', labels.dates)).toBe('MON 16 NOV 2026');
  });

  it('reads as m6 draws a date on Task detail, from the prose names', () => {
    // The same formatter and a different name set: the casing belongs to the
    // words, not to the function (AD-9).
    expect(formatFullDate('2026-11-20', labels.datesProse)).toBe('Fri 20 Nov 2026');
  });

  it('is the header date plus the year, and changes nothing else', () => {
    // The relationship that matters: the due pill shares `formatHeaderDate`
    // and carries no year in any of its four states, so this must be additive
    // rather than a second spelling of the same format.
    for (const date of ['2026-01-05', '2026-11-16', '2027-12-31']) {
      expect(formatFullDate(date, NAMES), date).toBe(`${formatHeaderDate(date, NAMES)} ${date.slice(0, 4)}`);
    }
  });

  it('zero-pads the day, like the formatter it builds on', () => {
    expect(formatFullDate('2026-01-05', NAMES)).toBe('w0 05 m1 2026');
  });

  it('returns the input unchanged rather than appending a year to a raw date', () => {
    // `2026-02-30 2026` would be worse than the stored string itself.
    expect(formatFullDate('2026-02-30', NAMES)).toBe('2026-02-30');
    expect(formatFullDate('', NAMES)).toBe('');
    expect(formatFullDate('2026-11-16', { weekdays: [], months: [] })).toBe('2026-11-16');
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

  it('have a prose set that agrees with the apparatus set day for day', () => {
    // Two name sets are two chances to put Sunday in the wrong place. This is
    // the check that they are the same calendar in two casings, rather than
    // two calendars.
    expect(labels.datesProse.weekdays.map((day) => day.toUpperCase())).toEqual([
      ...labels.dates.weekdays,
    ]);
    expect(labels.datesProse.months.map((month) => month.toUpperCase())).toEqual([
      ...labels.dates.months,
    ]);
  });
});
