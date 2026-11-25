import type { LocalDate } from '../core/localdate';
import type { Clock } from '../ports/clock';

/**
 * The only file in the shipped application that touches `Date` (AD-2).
 *
 * The lint fixtures under `src/core/__fixtures__/` touch it too, on purpose —
 * they exist to be reported on, are excluded from the build and from
 * `tsconfig.json`, and nothing imports them.
 *
 * `getFullYear`, `getMonth` and `getDate` read the *local* calendar, which is
 * exactly the granularity the domain works in — no instant is produced, so no
 * time zone has to be reconciled later. Everything downstream receives a
 * `LocalDate` string and can be tested against a fixed one.
 */
export const systemClock: Clock = {
  today(): LocalDate {
    const now = new Date();
    const year = String(now.getFullYear()).padStart(4, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};
