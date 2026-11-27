import type { ReactNode } from 'react';
import { formatFullDate, type LocalDate } from '../../core/localdate';
import type { Task } from '../../core/task';
import { labels } from '../labels';

/**
 * Task detail — every field PRD §3 defines, read and not acted on
 * (AC 2, UX-DR6, `m6` and `d5`).
 *
 * **It reads; later stories act.** There is no completion control, no editor
 * and no delete here: Story 1.5 edits, Story 1.6 completes, Story 1.7 deletes,
 * and Epic 2 owns every purple element the frames draw on this surface — the
 * course table, the three controls, the engine chip. The accepted consequence
 * is that a reviewer comparing this to `m6` finds rows and controls missing;
 * the story's Never list is the record of which, and `deferred-work.md` carries
 * the ones a later story is on the hook for.
 *
 * **Two rows the frames draw are not buildable, not merely deferred.**
 * `PROJECT` is Tier 3 and `Task` has no such field; `CREATED Mon 16 Nov 09:12`
 * needs a creation *instant*, and AD-2 keeps instants out of the domain
 * entirely. Neither is a gap to be filled in later from this surface's side.
 *
 * **Every absence is named.** A Task captured from one sentence has no notes,
 * no Tags, no Summary and no completion date, so the bare Task is the common
 * case rather than the edge one — and seven rows of nothing would read as a
 * broken surface. Each one states what is true instead (UX-DR21).
 */

/** Apparatus type: Barlow Condensed 700, uppercase, tracked (UX-DR3). */
const APPARATUS = 'font-family-apparatus font-apparatus uppercase';

export interface TaskDetailProps {
  task: Task;
}

/**
 * One field: its name in apparatus type, its value in body type.
 *
 * A `dt`/`dd` pair inside a `div`, which is the one wrapper the HTML
 * definition-list grammar allows — and which `axe-core`'s `definition-list`
 * rule checks for, so the grouping that makes the rows legible as pairs to a
 * screen reader is also the shape the gate requires.
 *
 * `value` is pre-resolved by the caller rather than taking a nullable and
 * choosing an absence wording here: which words name an absent Summary is a
 * question about that field, not about the row it is drawn in.
 */
function Field({
  slot,
  label,
  children,
}: {
  slot: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-field={slot}
      className="flex flex-col gap-[3px] border-b border-rule py-group-gap-min xl:flex-row xl:items-baseline xl:gap-group-gap-max xl:py-[6px]"
    >
      <dt
        className={`${APPARATUS} shrink-0 text-apparatus tracking-apparatus-min text-ink-secondary tabular-nums xl:w-[120px]`}
      >
        {label}
      </dt>
      {/*
        `min-w-0` so a long sentence wraps inside the row rather than widening
        it — the surface must not scroll horizontally at either bound width, and
        the user's own sentence is the one string here with no length limit.
      */}
      <dd className="min-w-0 font-family-body font-body text-body leading-[15px] text-ink break-words">
        {children}
      </dd>
    </div>
  );
}

/**
 * The stored text, or `null` when there is nothing to show.
 *
 * **A blank string is an absence, not a value.** `validateTask` admits
 * `summary: ""` and `notes: ""` — `readNullableText` accepts any string — so a
 * document written by hand, by a later version, or by Story 1.5's editor can
 * carry one. Rendering it would leave a labelled row with nothing beside it,
 * which is the unexplained gap this surface exists to never show (UX-DR21).
 * `??` alone catches only `null`, which is why this is a function and not an
 * operator.
 */
function presentText(value: string | null): string | null {
  if (value === null) return null;
  return value.trim() === '' ? null : value;
}

/**
 * The Tags as one string, or `null` when there are none worth naming.
 *
 * Blank Tags are dropped for the same reason: `readTags` admits `[""]`, and a
 * list of blanks would otherwise render as a bare separator.
 */
function presentTags(tags: readonly string[], separator: string): string | null {
  const named = tags.filter((tag) => tag.trim() !== '');
  return named.length === 0 ? null : named.join(separator);
}

/**
 * A stored date, in the prose form `m6` and `d5` draw: `Fri 20 Nov 2026`.
 *
 * In a `<time>` with the machine-readable value, so the date is available as
 * data and not only as words. The year is carried here and not in the record's
 * due pill because this surface is where a date is *read* rather than scanned
 * (UX-DR12 keeps the pill year-free in all four of its states).
 */
function DateValue({ date }: { date: LocalDate }) {
  return <time dateTime={date}>{formatFullDate(date, labels.datesProse)}</time>;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const fields = labels.taskDetail.fields;

  return (
    <section data-surface="task-detail" className="flex flex-1 flex-col">
      {/*
        `d5`'s heading, at 1280 px only — `m6` draws no such line, because its
        header band already says `TASK` directly above the first row.
      */}
      {/*
        10.5 px in primary ink, which is the class `d5` draws this in — the same
        one it gives `ALL TASKS`. Not `text-apparatus` in `ink-secondary`: that
        is the 9 px annotation class `d5` reserves for captions like
        `NEVER REWRITTEN`, and this is a heading rather than a note.
      */}
      <h2
        className={`${APPARATUS} mt-group-gap-max hidden text-body tracking-apparatus-min text-ink xl:block`}
      >
        {labels.taskDetail.heading}
      </h2>

      {/*
        A 1.2 px `rule-strong` opens the block, the way this world bounds one —
        no card, no box inside a box, the same opening the record list uses.
      */}
      <dl
        data-task-detail="fields"
        className="mt-group-gap-min border-t-[1.2px] border-rule-strong"
      >
        {/* The user's own sentence, verbatim and in full. The record truncates
            it at 46 px; this is the surface where a long one is meant to be
            read, which is the reason this row carries no truncation at all. */}
        <Field slot="text" label={fields.text}>
          {task.text}
        </Field>

        <Field slot="due-date" label={fields.dueDate}>
          {task.dueDate === null ? labels.taskDetail.noDueDate : <DateValue date={task.dueDate} />}
        </Field>

        <Field slot="tags" label={fields.tags}>
          {presentTags(task.tags, labels.taskDetail.tagSeparator) ?? labels.taskDetail.noTags}
        </Field>

        {/* Lowercase, because this surface sets Priority in body type — the
            record's uppercase belongs to its apparatus type, not to the data. */}
        <Field slot="priority" label={fields.priority}>
          {labels.taskDetail.priority[task.priority]}
        </Field>

        <Field slot="summary" label={fields.summary}>
          {presentText(task.summary) ?? labels.taskDetail.noSummary}
        </Field>

        <Field slot="notes" label={fields.notes}>
          {presentText(task.notes) ?? labels.taskDetail.noNotes}
        </Field>

        {/* A date, never a boolean. `completedAt` is the only thing the domain
            stores about completion (AD-7), so the surface that reads it shows
            the date itself rather than re-deriving a yes/no from it and
            throwing away the half the user might actually want. */}
        <Field slot="completed" label={fields.completed}>
          {task.completedAt === null ? (
            labels.taskDetail.notCompleted
          ) : (
            <DateValue date={task.completedAt} />
          )}
        </Field>
      </dl>
    </section>
  );
}
