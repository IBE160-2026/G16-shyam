import { useEffect, useState } from 'react';
import type { LocalDate } from '../core/localdate';
import type { Clock } from '../ports/clock';

/**
 * The live reference date (AD-2).
 *
 * Story 1.1 read the Clock port once, at module scope, and passed the string
 * down. That was cosmetic while nothing depended on it: a tab left open across
 * local midnight showed yesterday's date in the header and was otherwise
 * correct. From Story 1.3 the same value decides what `Friday` means and is
 * **persisted** into `dueDate`, so a stale read is no longer a stale label — it
 * is a wrong date stored in the user's document, a week off, with nothing on
 * screen to suggest it. Hence this hook: one value, held in state, re-read.
 *
 * **It is deliberately off the capture path.** `tests/unit/store.test.ts` bans
 * timers by name — `setTimeout`, `setInterval`, `requestAnimationFrame`,
 * `requestIdleCallback`, `queueMicrotask` — in the store, the field, Today and
 * the record, because FR-8's budget is met by there being no deferral between
 * submit and render. The refresh lives here and reaches capture only as a prop
 * that is already a string by the time anything is typed.
 *
 * **Two triggers, and why there is no exact midnight timer.** AD-2 puts `Date`
 * and `Date.now` inside `src/adapters/system-clock.ts` and nowhere else, and
 * the Clock port has exactly one operation — `today(): LocalDate`. Nothing
 * outside that adapter can therefore know the time of day, which is precisely
 * what scheduling a timer *at* midnight would require. Widening the port to
 * expose an instant would undo AD-2 for a cosmetic gain, so the port is
 * re-read instead:
 *
 * 1. `visibilitychange`, which covers the case that actually happens — a phone
 *    locked overnight and picked up the next morning. The date is right before
 *    the first frame the user sees.
 * 2. A coarse interval, for the tab that stays visible across midnight. The
 *    reference date is then correct within `RECHECK_INTERVAL_MS` of the day
 *    changing, and a re-read costs one string comparison.
 *
 * The accepted consequence is a sub-minute window just after midnight in which
 * a *visible, untouched* tab can still parse against yesterday. That is the
 * cheapest honest reading of the architecture; closing it entirely needs a
 * change to AD-2 through `bmad-correct-course`, not a change here.
 */

/**
 * How often a visible tab re-reads the clock.
 *
 * Not in `core/constants.ts`: nothing in the domain depends on it. It is the
 * resolution of a UI refresh, like the 46 px record pitch, and the domain
 * constants module is for numbers the domain is *defined* by (AD-11).
 */
const RECHECK_INTERVAL_MS = 30_000;

/**
 * Today, from `clock`, kept current for as long as the component is mounted.
 *
 * The state is seeded lazily so the port is read once per mount rather than on
 * every render, and an unchanged date returns the identical string so a re-read
 * that found nothing new causes no render at all.
 */
export function useToday(clock: Clock): LocalDate {
  const [today, setToday] = useState<LocalDate>(() => clock.today());

  useEffect(() => {
    const reread = (): void => {
      setToday((current) => {
        const now = clock.today();
        return now === current ? current : now;
      });
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') reread();
    };

    // `reread` runs once here, not only on a later tick, because the state was
    // seeded when the component first rendered and this effect may run an
    // unknown time afterwards — React runs effects twice under `StrictMode`,
    // and the gap between a seed and the first 30 s tick is long enough to
    // cross midnight in it. A bfcache restore is *not* what this covers: that
    // does not remount, so the effect never re-runs — the `visibilitychange`
    // listener below is the trigger for it.
    reread();
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = window.setInterval(reread, RECHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [clock]);

  return today;
}
