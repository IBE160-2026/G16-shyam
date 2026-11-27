import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { formatFullDate, isLocalDate, type LocalDate } from '../../core/localdate';
import { PRIORITIES, isPriority, type Priority, type Task } from '../../core/task';
import { useEditTaskField } from '../../app/store';
import { PriorityLadder } from '../components/PriorityLadder';
import { labels } from '../labels';

/**
 * Task detail — every field PRD §3 defines, now editable in place
 * (AC 1, FR-3, UX-DR6, `m6` and `d5`).
 *
 * **It reads and writes six fields; later stories act on the Task itself.**
 * There is no completion control and no delete here: Story 1.6 completes,
 * Story 1.7 deletes, and Epic 2 owns every purple element the frames draw on
 * this surface — the course table, the three controls, the engine chip. The
 * accepted consequence is that a reviewer comparing this to `m6` finds those
 * missing; the story's Never list is the record of which.
 *
 * **The fields are live native controls, not a click-to-edit mode.**
 * EXPERIENCE.md's `Edit` primitive — "open a standard control in place, `Apply`
 * writes your value rather than the proposal" — belongs to the course panel: it
 * exists to choose between a proposal and your own value, and there is no
 * proposal here. AC 2 settles it independently, since "persists on blur or a
 * debounce" describes a field you type in and leave, which an `Apply` button
 * would make meaningless. No approved frame draws Task-detail editing, so the
 * shape follows AC 2 and AD-17 instead.
 *
 * **An absence is still named, as the control's placeholder.** Story 1.4 drew
 * "No notes" as the row's value; an always-editable row would otherwise replace
 * that with an empty box and lose the naming UX-DR21 asks for. The wording
 * moves to the placeholder and the control takes a visually hidden label of its
 * own — a placeholder is not an accessible name, because it disappears the
 * moment anything is typed (AD-17, the same split `Capture.tsx` already makes).
 *
 * **Two rows the frames draw are not buildable, not merely deferred.**
 * `PROJECT` is Tier 3 and `Task` has no such field; `CREATED Mon 16 Nov 09:12`
 * needs a creation *instant*, and AD-2 keeps instants out of the domain
 * entirely. Neither is a gap to be filled in from this surface's side.
 */

/** Apparatus type: Barlow Condensed 700, uppercase, tracked (UX-DR3). */
const APPARATUS = 'font-family-apparatus font-apparatus uppercase';

/**
 * Every control on this surface wears the capture field's clothes.
 *
 * Reused rather than restyled so the product has one field, not two that drift
 * apart: `Capture.tsx` already established the border, the ground and the
 * `outline` focus ring, and AD-17 requires that ring to be visible and themed
 * from the ink token.
 */
const CONTROL =
  'min-w-0 border border-ink-secondary bg-surface px-[6px] font-family-body font-body text-body text-ink outline-offset-2 outline-ink placeholder:text-ink-secondary focus-visible:outline-2';

/**
 * A single-line control's height: the capture field's token, 32 px.
 *
 * **Not a padding.** SC 2.5.8 sets a 24 px floor for a pointer target and
 * AD-17 restates it with no spacing exception for rows stacked against each
 * other, so the height is a token rather than something that falls out of
 * `py-[3px]` and the line box. Measured, `py-[3px]` gave 23 px on the inputs
 * and 21 px on the select — under the floor, and `axe-core` cannot say so: its
 * `target-size` rule ships `enabled: false` (axe-core 4.14), so the green
 * accessibility run is no evidence here. `tests/e2e/task-detail.spec.ts`
 * measures each control instead.
 */
const SINGLE_LINE = 'h-field-height-max';

export interface TaskDetailProps {
  task: Task;
}

/**
 * One field: its name in apparatus type, its control in body type.
 *
 * A `dt`/`dd` pair inside a `div`, which is the one wrapper the HTML
 * definition-list grammar allows — and which `axe-core`'s `definition-list`
 * rule checks for, so the grouping that makes the rows legible as pairs to a
 * screen reader is also the shape the gate requires.
 *
 * The `dt` is **not** the control's label: a `dt` is not a labelling element
 * for a form control, so pairing them would be invalid markup and leave the
 * field unnamed. Each control carries its own hidden label instead.
 */
function Field({ slot, label, children }: { slot: string; label: string; children: ReactNode }) {
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
      <dd className="min-w-0 flex-1 font-family-body font-body text-body leading-[15px] text-ink break-words">
        {children}
      </dd>
    </div>
  );
}

/**
 * A free-text field that commits on blur, and on the way out (AC 2).
 *
 * **Why a draft at all.** Dispatching per keystroke would re-serialize the
 * whole document on every letter, which is exactly what AC 2 forbids and what
 * AD-6's whole-document write makes expensive. The draft is local; the Task is
 * the source of truth the moment the field is left.
 *
 * **Why it also commits on unmount.** Pressing Back unmounts this surface, and
 * a browser fires no `blur` on the way. Without the cleanup, the most natural
 * edit a user makes — type a note, press Back — would be silently discarded,
 * which is the one failure a product whose claim is "your tasks are still
 * there" cannot have. Running under React's StrictMode double-mount is
 * harmless: the draft equals the stored value then, so nothing is committed.
 *
 * **Why `commit` reports back the value it stored.** A field's stored form is
 * not always what was typed: three spaces in Notes are stored as `null`, and
 * `" a , b "` in Tags is stored as two trimmed Tags. Taking the canonical form
 * back and showing *that* is what keeps the control and the document in step —
 * without it the field goes on displaying whitespace the document does not
 * hold, every later blur re-commits it, and `flush`'s own "unchanged in,
 * nothing out" rule is false for exactly the values most likely to be typed.
 *
 * It does not resync from the `stored` prop. With one error boundary per route
 * keyed by Task id (`src/main.tsx`), a move from one Task to another unmounts
 * this surface, so a draft cannot survive into another Task's row — and every
 * change to `stored` while mounted is one this hook just made.
 */
function useCommittedDraft(
  stored: string,
  commit: (value: string) => string | null,
): {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
} {
  const [draft, setDraft] = useState(stored);

  // Refs, so the unmount cleanup below needs no dependencies and can never run
  // against a stale closure: a cleanup that fired with last render's `stored`
  // would either lose an edit or write one that was already written.
  const draftRef = useRef(stored);
  const storedRef = useRef(stored);
  const commitRef = useRef(commit);

  storedRef.current = stored;
  commitRef.current = commit;

  // **The ref is written here, in the event, and not during render.** A blur
  // can be delivered before React has re-rendered with the keystroke that
  // preceded it, and a ref synced only on render would then hand `flush` the
  // previous value — which compares equal to the stored one and drops the edit
  // on the floor. The ref is the committed-value source of truth; the state is
  // only what the control displays.
  const change = useCallback((value: string): void => {
    draftRef.current = value;
    setDraft(value);
  }, []);

  const flush = useCallback((): void => {
    const value = draftRef.current;
    // Unchanged in, nothing out. The reducer would otherwise rebuild the task
    // list and rewrite the document for a field the user only tabbed through.
    if (value === storedRef.current) return;
    // `null` is a refusal — a blank task text is the only one — and the stored
    // value stands. Anything else is the canonical form now in the document.
    const settled = commitRef.current(value) ?? storedRef.current;
    draftRef.current = settled;
    setDraft(settled);
  }, []);

  useEffect(() => () => { flush(); }, [flush]);

  return {
    value: draft,
    onChange: change,
    onBlur: flush,
  };
}

/** A visually hidden name for a control whose row heading cannot label it. */
function ControlLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <label htmlFor={id} className="sr-only">
      {children}
    </label>
  );
}

interface TextFieldProps {
  id: string;
  name: string;
  placeholder: string;
  stored: string;
  rows: number;
  commit: (value: string) => string | null;
}

/** A `textarea`, so the user's own prose wraps and is readable in full. */
function TextField({ id, name, placeholder, stored, rows, commit }: TextFieldProps) {
  const draft = useCommittedDraft(stored, commit);
  return (
    <>
      <ControlLabel id={id}>{name}</ControlLabel>
      <textarea
        id={id}
        data-edit={id}
        rows={rows}
        value={draft.value}
        placeholder={placeholder}
        onChange={(event) => {
          draft.onChange(event.target.value);
        }}
        onBlur={draft.onBlur}
        className={`${CONTROL} w-full resize-none py-[3px]`}
      />
    </>
  );
}

export function TaskDetail({ task }: TaskDetailProps) {
  const fields = labels.taskDetail.fields;
  const names = labels.taskDetail.edit;
  const editField = useEditTaskField();

  // One commit per field, each naming its own key. The patch is one key wide,
  // so the reducer merges exactly that field into the Task as it is now — a
  // whole `Task` sent from here would carry the other five fields as they were
  // when this surface rendered (AD-6, AC 1).
  const commitText = useCallback(
    (value: string): string | null => {
      // A Task with no text is not a Task: `validateTask` rejects it, so
      // storing one would make the whole document unreadable on the next load.
      // Refusing here is the same rule `captureTask` applies — `trim` decides
      // *whether* to write, never *what* is written (FR-23). The field reverts
      // to the stored sentence.
      if (value.trim() === '') return null;
      editField(task.id, { text: value });
      return value;
    },
    [editField, task.id],
  );

  const commitNotes = useCallback(
    (value: string): string => {
      // A blank is stored as `null`, so the canonical form is the empty
      // string — which is what puts the placeholder back and stops a field
      // full of whitespace re-committing on every later blur.
      if (value.trim() === '') {
        editField(task.id, { notes: null });
        return '';
      }
      editField(task.id, { notes: value });
      return value;
    },
    [editField, task.id],
  );

  const commitSummary = useCallback(
    (value: string): string => {
      // A blank is stored as `null`, so the canonical form is the empty
      // string — which is what puts the placeholder back and stops a field
      // full of whitespace re-committing on every later blur.
      if (value.trim() === '') {
        editField(task.id, { summary: null });
        return '';
      }
      editField(task.id, { summary: value });
      return value;
    },
    [editField, task.id],
  );

  const commitTags = useCallback(
    (value: string): string => {
      // Splitting on the separator the row already renders with. Trimming each
      // tag is reading the list, not rewriting a sentence: a Tag is a token the
      // user separated with a comma, and the space after the comma is the
      // separator rather than part of the word.
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');
      editField(task.id, { tags });
      // The canonical list, re-joined: `" a , b "` is two Tags, and the field
      // should show the two Tags rather than the punctuation that produced
      // them.
      return tags.join(labels.taskDetail.tagSeparator);
    },
    [editField, task.id],
  );

  return (
    <section data-surface="task-detail" className="flex flex-1 flex-col">
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
        {/* The user's own sentence. A textarea rather than an input so a long
            one wraps and stays readable in full — the record truncates it at
            46 px, and this is the surface where it is meant to be read. */}
        <Field slot="text" label={fields.text}>
          <TextField
            id="edit-text"
            name={names.text}
            placeholder=""
            stored={task.text}
            rows={3}
            commit={commitText}
          />
        </Field>

        <Field slot="due-date" label={fields.dueDate}>
          <DueDateField task={task} />
        </Field>

        <Field slot="tags" label={fields.tags}>
          <TagsField task={task} commit={commitTags} />
        </Field>

        {/* Lowercase in the choices, because this surface sets Priority in body
            type — the record's uppercase belongs to its apparatus type, not to
            the data. The ladder stays rendered beside the control, so no state
            rides on colour alone (AC 5, UX-DR20). */}
        <Field slot="priority" label={fields.priority}>
          <PriorityField task={task} />
        </Field>

        <Field slot="summary" label={fields.summary}>
          <TextField
            id="edit-summary"
            name={names.summary}
            placeholder={labels.taskDetail.noSummary}
            stored={task.summary ?? ''}
            rows={2}
            commit={commitSummary}
          />
        </Field>

        <Field slot="notes" label={fields.notes}>
          <TextField
            id="edit-notes"
            name={names.notes}
            placeholder={labels.taskDetail.noNotes}
            stored={task.notes ?? ''}
            rows={2}
            commit={commitNotes}
          />
        </Field>

        {/* Read-only, and the one row that stays so: completion is an act with
            its own meaning, and Story 1.6 owns it. A date, never a boolean —
            `completedAt` is all the domain stores about completion (AD-7). */}
        <Field slot="completed" label={fields.completed}>
          {task.completedAt === null ? (
            labels.taskDetail.notCompleted
          ) : (
            <CompletedDate date={task.completedAt} />
          )}
        </Field>
      </dl>
    </section>
  );
}

/**
 * The due date, as a native date control.
 *
 * `LocalDate` is `YYYY-MM-DD`, which is exactly this control's value format, so
 * the stored string round-trips with no parsing and no formatter — and clearing
 * it yields `''`, which is the `null` the domain already uses for "no due
 * date". DESIGN.md sanctions the shape outright: the world "never overrides a
 * standard control's shape".
 *
 * **It commits on blur, like every other field here, and deliberately not on
 * change.** A date input looks like one deliberate act and is not: typing a
 * year fires `change` once per digit, so committing there wrote the document
 * four times for one date and left `0002-12-24`, `0020-12-24` and `0202-12-24`
 * in it on the way to `2027-12-24` — every one of them a real date
 * `isLocalDate` accepts and the due pill then shows. A keyboard entry
 * abandoned half-way stored a due date in year 2. Worse, Chromium empties the
 * whole value when one segment is deleted, so a single Backspace committed
 * `null` and destroyed a stored date with no undo. Blur is what AC 2 asks for
 * and what makes both of those one act again.
 *
 * `isLocalDate` still guards the value: a refusal leaves the stored date
 * standing.
 */
function DueDateField({ task }: { task: Task }) {
  const editField = useEditTaskField();
  const commit = useCallback(
    (value: string): string | null => {
      if (value === '') {
        editField(task.id, { dueDate: null });
        return '';
      }
      if (!isLocalDate(value)) return null;
      editField(task.id, { dueDate: value });
      return value;
    },
    [editField, task.id],
  );
  const draft = useCommittedDraft(task.dueDate ?? '', commit);
  return (
    <>
      <ControlLabel id="edit-due-date">{labels.taskDetail.edit.dueDate}</ControlLabel>
      <input
        id="edit-due-date"
        data-edit="edit-due-date"
        type="date"
        value={draft.value}
        onChange={(event) => {
          draft.onChange(event.target.value);
        }}
        onBlur={draft.onBlur}
        className={`${CONTROL} ${SINGLE_LINE} w-full tabular-nums`}
      />
    </>
  );
}

/**
 * The Tags, as the comma-separated list the row already renders.
 *
 * Blank Tags are dropped on the way **in** as well as on the way out.
 * `readTags` admits `[""]` from stored bytes, and joining those raw would put
 * `",  "` in the field — presenting junk as a value, where the surface's rule
 * is that an absence is named (UX-DR21). Filtering here means the editor shows
 * an empty field with its placeholder, and the next commit writes the list
 * clean.
 */
function TagsField({ task, commit }: { task: Task; commit: (value: string) => string }) {
  const stored = task.tags
    .filter((tag) => tag.trim() !== '')
    .join(labels.taskDetail.tagSeparator);
  const draft = useCommittedDraft(stored, commit);
  return (
    <>
      <ControlLabel id="edit-tags">{labels.taskDetail.edit.tags}</ControlLabel>
      <input
        id="edit-tags"
        data-edit="edit-tags"
        type="text"
        value={draft.value}
        placeholder={labels.taskDetail.noTags}
        onChange={(event) => {
          draft.onChange(event.target.value);
        }}
        onBlur={draft.onBlur}
        className={`${CONTROL} ${SINGLE_LINE} w-full`}
      />
    </>
  );
}

/**
 * Priority, as a native select beside the ladder it already renders.
 *
 * `m4` draws LOW / MEDIUM / HIGH as segmented choices, but that is the *course*
 * editor — purple, with `Apply`, inside a control block Epic 2 owns. A select is
 * the standard control for one of three, and AC 5 is about what is *rendered*:
 * the ladder and the word stay, so no state rides on colour alone.
 */
function PriorityField({ task }: { task: Task }) {
  const editField = useEditTaskField();
  return (
    <div className="flex flex-wrap items-center gap-group-gap-min">
      <ControlLabel id="edit-priority">{labels.taskDetail.edit.priority}</ControlLabel>
      <select
        id="edit-priority"
        data-edit="edit-priority"
        value={task.priority}
        onChange={(event) => {
          const chosen: string = event.target.value;
          if (isPriority(chosen)) editField(task.id, { priority: chosen });
        }}
        className={`${CONTROL} ${SINGLE_LINE} w-auto`}
      >
        {PRIORITIES.map((priority: Priority) => (
          <option key={priority} value={priority}>
            {labels.taskDetail.priority[priority]}
          </option>
        ))}
      </select>
      {/*
        The ladder and its word, beside the control (AC 5, UX-DR10).
        `PriorityLadder` is reused rather than re-drawn: it is the component
        DESIGN.md names, and the word beside the bars is the accessibility floor
        rather than a stylistic choice — three bar heights are unreadable to
        anyone who cannot compare them (UX-DR20).
      */}
      <PriorityLadder priority={task.priority} />
    </div>
  );
}

/**
 * The completion date, in the prose form `m6` and `d5` draw: `Mon 16 Nov 2026`.
 *
 * In a `time` element with the machine-readable value, so the date is available
 * as data and not only as words. Sentence-cased from `datesProse`, because the
 * casing belongs to the words and not to the formatter (AD-9).
 */
function CompletedDate({ date }: { date: LocalDate }) {
  return <time dateTime={date}>{formatFullDate(date, labels.datesProse)}</time>;
}
