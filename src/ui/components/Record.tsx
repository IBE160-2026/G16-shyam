import { formatRoute } from '../../app/router';
import { formatHeaderDate, type LocalDate } from '../../core/localdate';
import type { Task } from '../../core/task';
import { labels } from '../labels';
import { PriorityLadder } from './PriorityLadder';

/**
 * One Task, at the 46 px anatomy UX-DR6 draws: checkbox · sentence in Archivo ·
 * tag patch · priority ladder with its word · due pill, and the start triangle
 * slot at the right edge.
 *
 * **The sentence acts; the checkbox still does not.** Tapping the sentence
 * opens Task detail — the record's first action, and the whole of it. Story 1.6
 * owns "tap the checkbox completes in place", so the checkbox stays the drawn
 * glyph it was: AD-17 asks for native focusable controls, and a native
 * `input type="checkbox"` that does nothing is worse than a drawn one — it is
 * announced, tabbed to, and lies about being operable.
 *
 * **The link covers the row from inside it, rather than being the row.**
 * EXPERIENCE.md makes the full 46 px row the pointer target, which is what
 * satisfies SC 2.5.8 and the `target-size` rule `axe-core` begins applying the
 * moment a control exists. Three shapes could deliver that, and two of them are
 * wrong here:
 *
 * - Wrapping the whole record in an anchor would put Story 1.6's checkbox
 *   *inside* a link — invalid HTML, and exactly the split this story must not
 *   foreclose.
 * - Putting the anchor around the sentence and stretching a pseudo-element over
 *   the row would be clickable everywhere but would still *measure* 13 px:
 *   `axe-core` reads an element's own client rects, and a pseudo-element does
 *   not extend them. AD-17 asks for targets that are 24 px, not for targets
 *   that pass by claiming the spacing exception — which it explicitly denies to
 *   rows stacked against each other.
 *
 * So the anchor is an empty overlay the size of the row, named by the sentence
 * through `aria-labelledby`. The target is the full 46 px, the name is exactly
 * the user's own words, the checkbox is not inside it, and neither is the due
 * pill — so a date is still read as a date and not as part of a link's name.
 * Story 1.6 raises the checkbox above this overlay; nothing here has to move.
 *
 * The row's height is unchanged at 46 px: the overlay is out of flow, and the
 * focus ring is an `outline`, which paints outside the box without resizing it.
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
    // An absence is a fact, never an error and never a prompt (UX-DR21). The
    // frame is explicit about how it is drawn — an em-dash, no pill — and
    // UX-DR12 is equally explicit that it is still named: the glyph is
    // decorative and the word is the accessible content, the same mark-plus-word
    // split `PriorityLadder` and the checkbox glyph already use. Neither span
    // is a control: the sentence link is the record's one focusable element,
    // and the pill is not nested inside it (AD-17).
    return (
      <span data-slot="due-pill" data-due="none" className={`${DUE_SLOT} text-ink-secondary`}>
        <span aria-hidden="true">{labels.record.noDueDate}</span>
        <span className="sr-only">{labels.record.noDueDateSpoken}</span>
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
  // The sentence's id, so the overlay can borrow it as its accessible name.
  // Derived from the Task's own id, which is unique per document by
  // construction — no counter, and no second render producing a different one.
  //
  // Percent-encoded, because `aria-labelledby` is a **space-separated token
  // list**: `validateTask` admits any non-empty string as an id, so a stored id
  // containing a space would split into two tokens, neither of which resolves,
  // and the link would lose its accessible name entirely. Encoding also leaves
  // the attribute free of the characters a CSS id selector would have to escape.
  const sentenceId = `sentence-${encodeURIComponent(task.id)}`;

  return (
    <li
      data-record={task.id}
      // 46 px on the phone, and 46 px on the desktop too in this story: the
      // dense 24 px table row and the two-column mosaic arrive with the bands
      // in Epic 3. One hairline `rule` separator beneath, never a card edge.
      //
      // `relative` is what the overlay anchor below is positioned against: it
      // makes the whole row the pointer target without the row itself becoming
      // the link. Absolute positioning takes the overlay out of flow, so the
      // 46 px is unchanged by it.
      className="relative flex h-record-height-mobile items-start gap-group-gap-min border-b border-rule pt-[2px]"
    >
      {/*
        The row-sized target that opens Task detail, named by the sentence.
        First in source order so it is also first in tab order: a reader reaches
        the Task before its parts, which is the order the row is read in.
      */}
      <a
        data-slot="open"
        href={formatRoute({ kind: 'task', id: task.id })}
        aria-labelledby={sentenceId}
        className="absolute inset-0 outline-offset-[-2px] outline-ink focus-visible:outline-2"
      />

      <CheckboxGlyph />

      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        {/*
          The sentence, in Archivo — the user's own words, so body type and
          terrain ink. Truncated rather than wrapped: the record is a fixed
          46 px pitch, and a second line would either break the pitch or
          overflow it. Truncating costs the reader nothing now that the whole
          sentence is one tap away: the overlay above is what opens Task detail,
          which renders the text in full and is where a long one is meant to be
          read.
        */}
        <p
          id={sentenceId}
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
