import { formatHeaderDate, type LocalDate } from '../../core/localdate';
import type { Task } from '../../core/task';
import { labels } from '../labels';
import { PriorityLadder } from './PriorityLadder';

/**
 * One Task, at the 46 px anatomy UX-DR6 draws: checkbox · sentence in Archivo ·
 * tag patch · priority ladder with its word · due pill, and the start triangle
 * slot at the right edge.
 *
 * **The checkbox and the sentence render but do not act.** Story 1.6 owns "tap
 * the checkbox completes in place" and Story 1.4 owns "tap the sentence opens
 * Task detail"; neither exists yet. AD-17 asks for native focusable controls,
 * and a native `input type="checkbox"` that does nothing is worse than a drawn
 * one — it is announced, tabbed to, and lies about being operable. So they are
 * marked as the visuals they are and become real controls in the stories that
 * give them something to do, which is the precedent Story 1.1 set with the
 * inert Today destination.
 *
 * The same reasoning keeps every pointer target honest: this record contains no
 * control at all, so there is nothing for SC 2.5.8's 24 px minimum to measure
 * and nothing for `axe-core` to find undersized. How the 46 px row divides into
 * two targets once it has two actions is Story 1.6's question — both actions
 * exist at once for the first time there.
 *
 * **The start triangle is always absent here.** It marks a Task with a course
 * being set or a control still open, and both of its sources arrive in Epic 2
 * (AD-7). The slot is rendered and reserved so the record's right edge does not
 * move when the triangle starts appearing — and it is empty, which is why
 * nothing on this surface is purple.
 */

/** The 12 px checkbox, as drawn: `surface` white, one hairline of apparatus ink. */
function CheckboxGlyph() {
  return (
    <span
      data-slot="checkbox"
      aria-hidden="true"
      className="mt-[1px] h-[12px] w-[12px] shrink-0 border border-ink-secondary bg-surface"
    />
  );
}

/**
 * Everything the pill and the dash share: apparatus type and the same slot.
 *
 * The ink is deliberately *not* here. `d1` draws a dated pill's text in `ink`
 * and the em-dash in `ink-secondary`: a date is something the user set, and the
 * dash is the absence of one, so they are not the same weight. Sharing a single
 * ink here once rendered every date at secondary strength.
 */
const DUE_SLOT =
  'shrink-0 px-[5px] py-[1px] font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min tabular-nums';

/**
 * The due pill — two of its four treatments (UX-DR12, corrected 2026-11-26).
 *
 * A date gets the **outlined** pill: `surface` fill, one `rule` hairline, the
 * date in apparatus type with tabular figures, formatted exactly as `d1` draws
 * every pill — `FRI 20 NOV`, weekday, zero-padded day, month, no year. No date
 * gets an **em-dash and no rect at all**, right where the pill would have been,
 * so a column of records keeps its rhythm whether the dates are there or not.
 *
 * **The two window inks are Epic 3's, deliberately.** UX-DR12 names four
 * treatments: `due-week` yellow inside the current week and `attention` olive
 * with `surface` text for past due, on top of these two. Both need the window
 * computation that `core/selectors.ts` grows in Epic 3, and `epics.md`
 * annotates the inks as completed there. The accepted consequence, recorded in
 * `deferred-work.md` rather than left to be rediscovered: until then a Task due
 * tomorrow and one due next month look the same, and a past-due Task carries no
 * mark. Nothing here needs undoing when they land — the fills are additive on
 * this component and on the same `data-due` hook.
 *
 * The date is formatted with `core/localdate.ts`'s `formatHeaderDate` rather
 * than a second formatter, because `MON 16 NOV` is already the pill's format;
 * the words come from `labels.dates` like every other string (AD-9).
 */
function DuePill({ dueDate }: { dueDate: LocalDate | null }) {
  if (dueDate === null) {
    // An absence is a fact, never an error and never a prompt (UX-DR21) — and
    // here it is drawn rather than worded, which is the one place this record
    // does that. The frame is explicit about it: an em-dash, no pill.
    return (
      <span data-slot="due-pill" data-due="none" className={`${DUE_SLOT} text-ink-secondary`}>
        {labels.record.noDueDate}
      </span>
    );
  }

  return (
    <span
      data-slot="due-pill"
      data-due="date"
      className={`${DUE_SLOT} border border-rule bg-surface text-ink`}
    >
      {formatHeaderDate(dueDate, labels.dates)}
    </span>
  );
}

export interface RecordProps {
  task: Task;
}

export function Record({ task }: RecordProps) {
  return (
    <li
      data-record={task.id}
      // 46 px on the phone, and 46 px on the desktop too in this story: the
      // dense 24 px table row and the two-column mosaic arrive with the bands
      // in Epic 3. One hairline `rule` separator beneath, never a card edge.
      className="flex h-record-height-mobile items-start gap-group-gap-min border-b border-rule pt-[2px]"
    >
      <CheckboxGlyph />

      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        {/*
          The sentence, in Archivo — the user's own words, so body type and
          terrain ink. Truncated rather than wrapped: the record is a fixed
          46 px pitch, and a second line would either break the pitch or
          overflow it. The full text stays in the document for Task detail,
          which is where a long sentence is meant to be read (Story 1.4).
        */}
        <p
          data-slot="sentence"
          className="truncate font-family-body font-body text-body leading-[13px] text-ink"
        >
          {task.text}
        </p>

        <div className="flex items-center gap-[8px]">
          {/*
            The tag patch area. With no Tags it names the absence in apparatus
            type rather than drawing an empty patch: a Task that earned no Tag
            is a valid outcome, never an empty state or a prompt (UX-DR21), and
            `attention-pale` is the patch ground for a Tag that exists. Tags
            are proposed in Epic 2 and added by hand in Story 1.5.
          */}
          <span
            data-slot="tag-patch"
            data-tags={task.tags.length}
            className="shrink-0 font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary"
          >
            {labels.record.noTag}
          </span>

          <PriorityLadder priority={task.priority} />

          <DuePill dueDate={task.dueDate} />
        </div>
      </div>

      {/*
        The start triangle slot, held open and false. It reserves the right
        edge's width so the record does not reflow when Epic 2 starts drawing
        the triangle, and it is the one place on a record that is ever allowed
        to be purple — which is why it being empty is what keeps the surface's
        purple reservation total.
      */}
      <span
        data-slot="start-triangle"
        data-open="false"
        aria-hidden="true"
        className="mt-[1px] h-[10px] w-[11px] shrink-0"
      />
    </li>
  );
}
