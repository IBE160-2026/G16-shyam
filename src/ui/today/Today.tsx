import { DEFAULT_RETENTION_DAYS } from '../../core/constants';
import { formatFullDate, type LocalDate } from '../../core/localdate';
import { isArchived } from '../../core/selectors';
import type { Task } from '../../core/task';
import { useTasks } from '../../app/store';
import { Record } from '../components/Record';
import { FirstRun } from '../first-run/FirstRun';
import { labels } from '../labels';
import { Capture } from './Capture';

/**
 * Today — the default destination, and `m1`'s work area (UX-DR15).
 *
 * **One flat list, filtered by one predicate.** No bands, no Smart List
 * predicates, no counts per window: the three derived lists and their 22 px
 * band headers are Epic 3. What this story adds is the only membership rule
 * FR-2 names — everything not archived, which includes a completed Task for the
 * whole retention window. The decision lives in `core/selectors.ts` and is
 * merely *applied* here (AD-9): the list this surface renders is a predicate's
 * answer, never a condition spelled inline where a second surface could spell
 * it differently.
 *
 * **Nothing can reach the archived branch yet, and it is built anyway.**
 * Completion arrives in Story 1.6, so until then no Task this app creates has a
 * `completedAt` at all and the filter removes nothing. It is built now because
 * FR-2 is this story's AC and because a seeded document can already contain
 * one — which is exactly how the gate proves it.
 *
 * **First run is count-based, and counts what is listed.** An empty list
 * renders the first run surface whether the document is empty or holds nothing
 * but archived Tasks: the surface's own claim is about what is on file *here*,
 * and a bare list under a `15 ON FILE` meta line would be the worse of the two
 * readings. There is no persisted flag, so `schemaVersion` is not shaped around
 * one. The accepted consequence — deleting the last Task brings first run back,
 * which sits in tension with UX-DR22's claim that first run is the product's
 * only empty state — surfaces in Story 1.7, which owns deletion and is the
 * first story that can reach the condition.
 *
 * The two surfaces word the same idea differently: this one says
 * `REFERENCE DATE …` / `n ON FILE` where first run says `NOTHING ON FILE YET` /
 * `0 TASKS`. Both are followed as drawn. Unifying them is a `DESIGN.md`
 * question, not a code one.
 */

export interface TodayProps {
  /** Today, from the Clock port. The reference date every list is computed against (AD-2). */
  today: LocalDate;
}

export function Today({ today }: TodayProps) {
  // What the list contains, decided by the predicate that owns the question and
  // handed the reference date and the window as arguments — `core` reads no
  // clock and no settings (AD-1, AD-7). `DEFAULT_RETENTION_DAYS` is Tier 1's
  // answer; Epic 3 and Epic 8 pass a configured one to the same call.
  const listed = useTasks().filter((task) => !isArchived(task, today, DEFAULT_RETENTION_DAYS));

  // `Capture` is rendered **once**, above the branch, and never inside either
  // arm of it. Both frames draw the field in the same place on both surfaces,
  // and rendering it twice — once here and once inside `FirstRun` — would make
  // the first capture swap the subtree under it: React would unmount the input
  // that had just been focused, the caret would land on `body`, and on a phone
  // the keyboard would close between the first Task and the second. One
  // element in one stable position is what keeps focus where the user left it.
  return (
    <section className="flex flex-1 flex-col">
      <Capture />

      {listed.length === 0 ? (
        <FirstRun />
      ) : (
        <TodayWorkArea today={today} tasks={listed} />
      )}
    </section>
  );
}

interface TodayWorkAreaProps extends TodayProps {
  tasks: readonly Task[];
}

/** The populated half: the meta line, then one flat list of records. */
function TodayWorkArea({ today, tasks }: TodayWorkAreaProps) {
  return (
    <>
      {/*
        The meta line: what everything below was computed against, and how much
        of it there is. Apparatus type, both halves, because this is the app
        speaking about itself.
      */}
      <div className="mt-group-gap-max flex items-baseline justify-between gap-group-gap-min">
        <p
          data-today="reference-date"
          className="font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary tabular-nums"
        >
          {`${labels.today.referenceDate} ${formatFullDate(today, labels.dates)}`}
        </p>
        <p
          data-today="count"
          className="font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary tabular-nums"
        >
          {`${String(tasks.length)} ${labels.today.onFile}`}
        </p>
      </div>

      {/*
        A 1.2 px `rule-strong` opens the block, which is how this world bounds a
        block — no card, no box inside a box. In `m1` the same rule sits under
        the band head; with no bands yet it sits directly above the records.
      */}
      <ul
        data-today="list"
        aria-label={labels.today.listLabel}
        className="mt-group-gap-min border-t-[1.2px] border-rule-strong"
      >
        {tasks.map((task) => (
          <Record key={task.id} task={task} />
        ))}
      </ul>
    </>
  );
}
