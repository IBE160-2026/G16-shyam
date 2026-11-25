// Fixture for tests/unit/core-purity.test.ts — the other direction of AC 5.
//
// A rule that errors on everything would pass a test that only looks for
// errors. This module is what `src/core/` is supposed to look like: total pure
// functions over values it was handed, calendar arithmetic on an explicitly
// supplied date, and no reference to the runtime it happens to be in. ESLint
// must report nothing restricted here.
//
// Nothing imports it; see banned.ts for why it is excluded from the build.

export interface Window {
  readonly first: string;
  readonly last: string;
}

/** Reads a supplied value, which AD-1 permits — the ban is on the clock. */
export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

/** `Date` on an explicitly supplied value is allowed and stays deterministic. */
export function isoOf(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** A local name may shadow a banned global; the ban is on reaching the global. */
export function widthOf(window: Window): number {
  return window.last.length - window.first.length;
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
