import { formatHeaderDate, localDateParts, type LocalDate } from '../../core/localdate';
import type { Task } from '../../core/task';
import { useTasks } from '../../app/store';
import { Record } from '../components/Record';
import { FirstRun } from '../first-run/FirstRun';
import { labels } from '../labels';
import { Capture } from './Capture';

/**
 * Today — the default destination, and `m1`'s work area (UX-DR15).
 *
 * **One flat list this story.** No bands, no Smart List predicates, no counts
 * per window: the three derived lists and their 22 px band headers are Epic 3.
 * `core/selectors.ts` exists as of Story 1.3 but holds only the week
 * definition; Story 1.4 adds the completed and archived predicates to it and
 * Epic 3 the Smart List and due-window ones. What is here is the spine the
 * bands will group — capture, the meta line, and records.
 *
 * **First run is count-based.** Zero Tasks renders the first run surface; one or
 * more renders this one. There is no persisted flag, so `schemaVersion` is not
 * shaped around one. The accepted consequence — deleting the last Task brings
 * first run back, which sits in tension with UX-DR22's claim that first run is
 * the product's only empty state — surfaces in Story 1.7, which owns deletion
 * and is the first story that can reach the condition.
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

/**
 * `MON 16 NOV 2026` — the header's date with its year, as `m1` draws the meta
 * line.
 *
 * The year is in the meta line and not in the 360 px header because this line
 * is the one that has to be unambiguous: it is the date every derived list in
 * the product is computed against. Composed from the two pure formatters rather
 * than by adding a third, so `core/localdate.ts` is reused unchanged.
 */
function referenceDate(today: LocalDate): string {
  const parts = localDateParts(today);
  const day = formatHeaderDate(today, labels.dates);
  return parts === null ? day : `${day} ${String(parts.year)}`;
}

export function Today({ today }: TodayProps) {
  const tasks = useTasks();

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

      {tasks.length === 0 ? (
        <FirstRun />
      ) : (
        <TodayWorkArea today={today} tasks={tasks} />
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
          {`${labels.today.referenceDate} ${referenceDate(today)}`}
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
