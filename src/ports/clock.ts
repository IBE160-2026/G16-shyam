import type { LocalDate } from '../core/localdate';

/**
 * Time enters the application here and nowhere else (AD-2).
 *
 * One operation, returning the local calendar day. The browser gets
 * `adapters/system-clock.ts`; the Fixture harness supplies its own fixed
 * reference date through the same port, so the app and the harness agree by
 * construction rather than by discipline (NFR-10). Every date-dependent test
 * injects a `Clock`, which is why none of them pass on a Tuesday and fail on a
 * Sunday.
 */
export interface Clock {
  today(): LocalDate;
}
