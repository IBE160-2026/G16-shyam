/**
 * The Task, the document it is persisted in, and the total validator that
 * stands between stored bytes and the rest of the application (PRD §3, AD-6,
 * AD-7).
 *
 * Pure, like everything under `src/core/` (AD-1): no clock, no identifier
 * generation, no storage, no React. A Task is handed its id and its dates; this
 * module only says what a Task *is* and whether a given value is one.
 *
 * Two shapes of the domain are load-bearing and easy to get wrong later:
 *
 * - **There are no instants.** `dueDate` and `completedAt` are both `LocalDate`
 *   (AD-2), so nothing here has to reconcile a time zone and completion carries
 *   no time of day.
 * - **Nothing derived is stored** (AD-7). There is no `completed` boolean and no
 *   `archived` flag, ever: completion is `completedAt !== null`, and Archive is
 *   a function of `completedAt`, today and the retention window. A stored flag
 *   would be a second source of truth, free to disagree with the date it came
 *   from.
 */

import { isLocalDate, type LocalDate } from './localdate';
import { TASK_SCHEMA_VERSION } from './constants';

/** Exactly one of three, lowercase, on every Task (PRD §3). */
export type Priority = 'high' | 'medium' | 'low';

/**
 * The three Priorities, in descending order.
 *
 * Declared once so a surface that has to render all three — the ladder, and
 * Story 1.5's editor — does not spell the list again and risk spelling it
 * differently.
 */
export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];

/** Every new Task starts here (PRD §3, FR-1). */
export const DEFAULT_PRIORITY: Priority = 'medium';

/**
 * One Task. Exactly PRD §3's fields, minus `Project`.
 *
 * `Project` is Tier 3 and arrives in Epic 8 as an optional property no Tier 1
 * selector reads; adding it now would be a field with no writer and no reader.
 * Everything else §3 lists is here, and `text` is the only one that is not
 * optional.
 *
 * `readonly` throughout because the store replaces Tasks rather than mutating
 * them: the reducer is the single writer (AD-6), and a mutable Task is an
 * invitation for a component to become a second one.
 */
export interface Task {
  /** From the Id port, never from here — `core/` generates no ids (AD-1). */
  readonly id: string;
  /** The user's own sentence. Never rewritten by the app (FR-23). */
  readonly text: string;
  readonly dueDate: LocalDate | null;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly priority: Priority;
  readonly summary: string | null;
  /** The completion *date*. Completed and archived are derived from it (AD-7). */
  readonly completedAt: LocalDate | null;
}

/**
 * The persisted document: every Task, plus the version that says how to read
 * them (AD-6).
 *
 * `schemaVersion` is in the type because it is in the bytes, not because the
 * application looks at it. Only `src/adapters/local-storage.ts` reads or writes
 * it; the store holds `Task[]` alone.
 */
export interface TaskDocument {
  readonly schemaVersion: number;
  readonly tasks: readonly Task[];
}

/**
 * The one named defaults factory (AD-6).
 *
 * Absent, unreadable and unmigratable documents all resolve through this, never
 * through a fallback written at the call site — so "what the app starts with
 * when there is nothing to start from" is one function with one answer, and a
 * new reason to fall back cannot quietly acquire a different empty state.
 */
export function defaultTaskDocument(): TaskDocument {
  return { schemaVersion: TASK_SCHEMA_VERSION, tasks: [] };
}

/**
 * A new Task from the two things only a caller can supply: the id from the Id
 * port and the text the user typed (FR-1).
 *
 * Everything else is the default FR-1 promises — Priority `medium`, no Tags, no
 * Summary — and the text is stored **verbatim**. It is not trimmed, cased or
 * normalised: "the app never rewrites your sentence" is the product's central
 * claim, and a helpful trim is the first rewrite. Deciding that a blank
 * sentence is not worth creating belongs to the caller that has the field in
 * front of it, not here.
 */
export function createTask(id: string, text: string): Task {
  return {
    id,
    text,
    dueDate: null,
    notes: null,
    tags: [],
    priority: DEFAULT_PRIORITY,
    summary: null,
    completedAt: null,
  };
}

/** Whether `value` is one of the three Priorities. */
export function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The marker for "this field was not readable". `null` cannot carry it, because
 * `null` is a legal value for five of the Task's eight fields.
 */
const UNREADABLE = Symbol('unreadable');

function readNullableDate(value: unknown): LocalDate | null | typeof UNREADABLE {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && isLocalDate(value)) return value;
  return UNREADABLE;
}

function readNullableText(value: unknown): string | null | typeof UNREADABLE {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return UNREADABLE;
}

function readTags(value: unknown): readonly string[] | typeof UNREADABLE {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return UNREADABLE;
  const tags: string[] = [];
  for (const tag of value as readonly unknown[]) {
    if (typeof tag !== 'string') return UNREADABLE;
    tags.push(tag);
  }
  return tags;
}

/**
 * One Task from an unknown value, or `null` when it is not one.
 *
 * Total, like everything in `core/`: a caller is never handed an exception for
 * bad data, because the one caller — the storage adapter — has to do something
 * careful with the bytes rather than crash on them (AD-6).
 *
 * An **absent optional field reads as its default**, so a document written
 * before an optional field existed stays readable without a migration, which is
 * exactly the case AD-6 says must not bump the schema version. A *present* field
 * of the wrong type is a different thing entirely and fails: it means the bytes
 * were written by something that did not understand this shape.
 */
export function validateTask(value: unknown): Task | null {
  if (!isPlainObject(value)) return null;

  const { id, text, priority } = value;
  if (typeof id !== 'string' || id === '') return null;
  // Text is the one required field, and a Task whose text is nothing but
  // whitespace is not one: capture refuses to create it (`captureTask`), so
  // bytes carrying it did not come from this application. Admitting it would
  // draw a blank 46 px row the user cannot read, name or explain.
  if (typeof text !== 'string' || text.trim() === '') return null;
  if (!isPriority(priority)) return null;

  const dueDate = readNullableDate(value.dueDate);
  const completedAt = readNullableDate(value.completedAt);
  const notes = readNullableText(value.notes);
  const summary = readNullableText(value.summary);
  const tags = readTags(value.tags);
  if (
    dueDate === UNREADABLE ||
    completedAt === UNREADABLE ||
    notes === UNREADABLE ||
    summary === UNREADABLE ||
    tags === UNREADABLE
  ) {
    return null;
  }

  // Rebuilt field by field rather than spread: a document carrying a
  // `completed` boolean from some future mistake must not survive the trip
  // through validation and become a second source of truth (AD-7).
  return { id, text, dueDate, notes, tags, priority, summary, completedAt };
}

/**
 * The whole document from an unknown value, or `null` when it is not one.
 *
 * **All or nothing.** One unreadable Task fails the document rather than being
 * dropped from it, because the adapter's answer to an invalid document is to
 * keep the raw string under a backup key and start empty (AD-6) — and silently
 * discarding the four Tasks it could read while keeping the fifth is the data
 * loss that rule exists to prevent.
 */
export function validateTaskDocument(value: unknown): TaskDocument | null {
  if (!isPlainObject(value)) return null;
  if (typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion)) {
    return null;
  }
  if (!Array.isArray(value.tasks)) return null;

  const tasks: Task[] = [];
  const seen = new Set<string>();
  for (const candidate of value.tasks as readonly unknown[]) {
    const task = validateTask(candidate);
    if (task === null) return null;
    // An id identifies one Task, which is what the Id port promises and what
    // every surface relies on: two Tasks sharing one would give React duplicate
    // keys and leave `[data-record]` ambiguous for the rest of the product.
    if (seen.has(task.id)) return null;
    seen.add(task.id);
    tasks.push(task);
  }

  return { schemaVersion: value.schemaVersion, tasks };
}
