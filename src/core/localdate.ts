/**
 * Dates, as the domain knows them (AD-2).
 *
 * A `LocalDate` is the string `YYYY-MM-DD` in the device's local calendar.
 * There are no instants anywhere in the domain: `dueDate` and `completedAt` are
 * both `LocalDate`, which is what removes the time-zone ambiguity sitting
 * between a stored instant and NFR-10's promise of identical results on any
 * machine. The accepted consequence is that completion carries no time of day,
 * and nothing in DESIGN.md or EXPERIENCE.md displays one.
 *
 * This is the one shipped module in `src/core/` that does calendar arithmetic
 * (AD-1) — the lint fixtures beside it do so too, deliberately, and reach the
 * build no more than they reach `tsconfig.json`.
 * It still reads no clock: every function here takes the date it works on. The
 * arithmetic is integer arithmetic rather than `Date`, so the whole module is
 * reachable from both runtimes with nothing to configure and nothing to mock.
 */

/** `YYYY-MM-DD` in the local calendar. */
export type LocalDate = string;

/**
 * The number of days in a week.
 *
 * It lives here rather than in `core/selectors.ts` — which owns the week's
 * *boundaries* — because `dayOfWeek` below needs it and `selectors.ts` imports
 * this module, so the other direction would be a cycle. `selectors.ts`
 * re-exports it, so "declared once" is true of the value and not only of the
 * name.
 */
export const DAYS_PER_WEEK = 7;

/**
 * Calendar words, supplied by the caller.
 *
 * `core/` holds no user-visible string — those live only in `src/ui/labels.ts`
 * (AD-9), and a weekday name is a user-visible string. So the formatter takes
 * the names it is to use, which also makes it trivially testable.
 */
export interface DateNames {
  /** Seven names, Monday first. */
  readonly weekdays: readonly string[];
  /** Twelve names, January first. */
  readonly months: readonly string[];
}

const LOCAL_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The parts of a `LocalDate`: `month` is 1–12 and `day` is 1–31. */
export interface LocalDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in `month` (1–12) of `year`, accounting for leap years. */
export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

/**
 * Whether `value` is a well-formed `LocalDate` — the right shape *and* a date
 * that exists. `2026-02-30` has the shape and is not a date.
 */
export function isLocalDate(value: string): boolean {
  return parseParts(value) !== null;
}

function parseParts(value: string): LocalDateParts | null {
  const match = LOCAL_DATE_SHAPE.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/**
 * The parts of `date`, or `null` when it is not a `LocalDate`. Returning `null`
 * rather than raising keeps `core` total (conventions): a caller decides what an
 * unreadable date means, and no caller is ever handed an exception for it.
 */
export function localDateParts(date: LocalDate): LocalDateParts | null {
  return parseParts(date);
}

/**
 * Days from 1970-01-01, which is day 0. Howard Hinnant's `days_from_civil`:
 * exact for every proleptic Gregorian date, and pure integer arithmetic, so it
 * is identical in the browser and in the harness.
 */
function daysFromCivil(parts: LocalDateParts): number {
  const shiftedYear = parts.month <= 2 ? parts.year - 1 : parts.year;
  const era = Math.floor(shiftedYear / 400);
  const yearOfEra = shiftedYear - era * 400;
  const shiftedMonth = parts.month + (parts.month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + parts.day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/**
 * The inverse of `daysFromCivil`: the civil date `days` after 1970-01-01.
 *
 * Hinnant's `civil_from_days`, and the reason `addDays` can be written as
 * integer arithmetic rather than as a month-by-month carry loop — which is
 * where an off-by-one lives on 31 December and in February of a leap year.
 * Total for every integer, including negative ones.
 */
function civilFromDays(days: number): LocalDateParts {
  const shifted = days + 719468;
  const era = Math.floor(shifted / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth + (shiftedMonth < 10 ? 3 : -9);
  return { year: month <= 2 ? year + 1 : year, month, day };
}

/**
 * `date` shifted by `days`, which may be negative or zero.
 *
 * The one piece of `LocalDate → LocalDate` arithmetic in the product, and the
 * reason it is here: this is the module that owns the calendar (AD-1), so
 * FR-23's `tomorrow` and `next week` compose it rather than each counting days
 * of their own.
 *
 * Returns `null` on a date this module cannot read, like every other function
 * here — `core` is total and hands no caller an exception. It also returns
 * `null` when the *result* is not a `LocalDate`, which is the only honest
 * answer in three cases the type alone cannot exclude: a shift past
 * `9999-12-31`, a shift before `0000-01-01`, and a non-integer or `NaN`
 * `days`. All three would otherwise produce a string typed `LocalDate` that
 * `isLocalDate` rejects — and a value that fails its own validator would be
 * stored in `dueDate` and then make the whole document unreadable on the next
 * read (AD-6).
 */
export function addDays(date: LocalDate, days: number): LocalDate | null {
  const parts = parseParts(date);
  if (parts === null) return null;
  const moved = formatParts(civilFromDays(daysFromCivil(parts) + days));
  return isLocalDate(moved) ? moved : null;
}

/**
 * The weekday of `date` as an index into `DateNames.weekdays`: 0 is Monday and
 * 6 is Sunday, which is the week DESIGN.md and FR-23's `next week` both use.
 * Returns `null` when `date` is not a `LocalDate`.
 */
export function dayOfWeek(date: LocalDate): number | null {
  const parts = parseParts(date);
  if (parts === null) return null;
  // Day 0 — 1970-01-01 — was a Thursday, which is index 3 on a Monday-first
  // week. The modulo is taken twice so negative days (before 1970) still land
  // in 0..6.
  return (((daysFromCivil(parts) + 3) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}

function twoDigits(value: number): string {
  return value < 10 ? `0${String(value)}` : String(value);
}

/**
 * Parts back to the `YYYY-MM-DD` string.
 *
 * The year is padded to four digits so that a year between 1 and 999 comes out
 * in the shape `isLocalDate` accepts rather than as `999-…`. Padding is not a
 * guarantee of that shape, though: a five-digit year, a negative one or a `NaN`
 * part all pass through here unchanged. Producing the string and *checking* it
 * is `addDays`' job — this function only formats.
 */
function formatParts(parts: LocalDateParts): LocalDate {
  const year = String(parts.year).padStart(4, '0');
  return `${year}-${twoDigits(parts.month)}-${twoDigits(parts.day)}`;
}

/**
 * The header date, as `m9` draws it: `MON 16 NOV`.
 *
 * The day is zero-padded so a column of dates in tabular figures aligns — the
 * one typographic rule DESIGN.md states without exception. Casing comes from
 * `names`, because the words are the caller's (AD-9).
 *
 * An unreadable date is returned unchanged rather than raising or rendering
 * blank: `core` is total, and the surface's voice has no error state to fall
 * into (UX-DR18, UX-DR22).
 */
export function formatHeaderDate(date: LocalDate, names: DateNames): string {
  const parts = parseParts(date);
  if (parts === null) return date;
  const weekdayIndex = dayOfWeek(date);
  if (weekdayIndex === null) return date;
  const weekday = names.weekdays[weekdayIndex];
  const month = names.months[parts.month - 1];
  if (weekday === undefined || month === undefined) return date;
  return `${weekday} ${twoDigits(parts.day)} ${month}`;
}
