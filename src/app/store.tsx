import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { parseDateWord } from '../core/date-words';
import type { LocalDate } from '../core/localdate';
import { createTask, type Task } from '../core/task';
import type { Ids } from '../ports/id';
import type { StorageFailure, TaskStorage } from '../ports/storage';

/**
 * The single store, and the only writer to storage (AD-6).
 *
 * One `useReducer` plus context, every mutation a named action, and no component
 * holding derived state. The rule it exists to enforce is narrow and worth
 * stating plainly: **no module writes storage except this one.** An async
 * Suggestion arriving in Epic 2 is a dispatched action that merges into current
 * state, not a module that re-serializes a snapshot it took before an `await` —
 * which is the shape of the bug AD-6 was written against.
 *
 * **Nothing in this file is `async`.** The write happens synchronously inside
 * the reducer, after the next state has already been computed, so the render
 * that shows the new record never waits on persistence. That is how FR-8's
 * 100 ms is met — structurally, with no `await` between submit and render —
 * and it is also why a storage failure cannot block capture: the state is
 * already the new state when the write is attempted, and its failure only adds
 * a reason for Settings to read later.
 */

export interface StoreState {
  /** Every Task, newest first. Nothing derived is kept here (AD-7). */
  readonly tasks: readonly Task[];
  /**
   * Why the stored document could not be read, latched for the session.
   *
   * Kept apart from `writeFailure` because the two say different things and
   * only one of them is news. `unreadable` means a document was preserved
   * under the backup key and the user's Tasks are recoverable — the single
   * most important thing Settings will ever have to tell them (AC 6). Folding
   * it into a field that is re-derived on every write would erase it on the
   * first capture, and nothing else records it.
   */
  readonly readFailure: StorageFailure | null;
  /**
   * Why the last write did not land, if it did not.
   *
   * Re-derived per mutation, so it clears itself when the cause does — AD-6
   * requires Settings' status to do exactly that.
   *
   * **Settings is the only surface that may ever render either of these**
   * (AD-6, Epic 5). Capture says nothing about them: the app stays fully usable
   * in memory for the session, and the product forbids an error state in
   * capture (UX-DR22).
   */
  readonly writeFailure: StorageFailure | null;
}

/**
 * The fields a user may edit by hand (FR-3).
 *
 * Exactly the six Tier 1 fields of PRD §3, so `id` cannot be edited and
 * `completedAt` cannot be set this way — completion is an act with its own
 * meaning and Story 1.6 gives it its own action. Derived from `Task` rather
 * than listed again, so a field added to the domain is either editable by name
 * here or deliberately absent, never silently both.
 */
export type EditableField = Exclude<keyof Task, 'id' | 'completedAt'>;

/**
 * One field's new value, carried as a one-key patch.
 *
 * `Pick` keeps the field and its type together, so `{ priority: '2026-11-20' }`
 * does not compile. It does **not** make one key a type guarantee: TypeScript
 * checks excess properties against the union of every constituent's keys, so
 * `{ text: 'a', notes: 'b' }` compiles and the reducer would merge both. One
 * field per action is therefore a convention the call sites keep, and the
 * reducer is written to merge whatever it is given rather than to assume.
 */
export type FieldEdit = { [K in EditableField]: Pick<Task, K> }[EditableField];

/**
 * Every mutation, named.
 *
 * Two actions now. Completion (1.6) and deletion (1.7) each add their own
 * rather than widening either of these into a generic `task/changed` that would
 * make the reducer's history unreadable.
 */
export type Action =
  | { readonly type: 'task/created'; readonly task: Task }
  | { readonly type: 'task/field-edited'; readonly id: string; readonly edit: FieldEdit };

/**
 * The pure reducer: state in, state out, no storage.
 *
 * Separated from the writing wrapper below so the state transitions can be
 * tested as what they are — a function — with no fake storage in the way, and
 * so the one place that writes is a single, visible line.
 */
export function reduce(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'task/created':
      // Newest first. The record you just captured is the one you are looking
      // for, and at 360 px it is the difference between seeing it and scrolling
      // for it. Band ordering arrives with the bands in Epic 3.
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'task/field-edited': {
      // The patch is merged into the Task **as it is now**, not into a copy the
      // surface captured when it rendered. That is the whole of AC 1's "that
      // field changes alone": a component that sent back a whole `Task` would
      // also send back the five fields as they were before, undoing anything
      // that changed in between (AD-6).
      let changed = false;
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id) return task;
        changed = true;
        return { ...task, ...action.edit };
      });
      // An edit naming no Task — a surface outliving its Task — changes
      // nothing, and returning the identical array is what keeps the persisting
      // wrapper from writing a document that did not move. The same holds for
      // an edit whose value is already the stored one: the array is new but the
      // bytes are not, which costs one `JSON.stringify` and is the honest price
      // of not comparing field values here.
      if (!changed) return state;
      // Order is untouched: newest-first is a capture order, not a modified
      // order, so editing a Task does not move its record.
      return { ...state, tasks };
    }
    default:
      // Unreachable while the union has one member, and the thing that keeps it
      // unreachable when it has five: an action this reducer does not know is a
      // no-op, never a dropped-through `undefined`.
      return state;
  }
}

/**
 * The reducer the provider actually runs: `reduce`, then the write.
 *
 * The write is here rather than in an effect for one reason — an effect runs
 * *after* the commit, which would put the persistence of a mutation one render
 * behind the state it came from and make "the reducer is the only writer" a
 * convention instead of a fact.
 *
 * It is idempotent, which matters because React invokes reducers more than once
 * per action in development under `StrictMode`, and may replay a queued action
 * when a render is interrupted. Every invocation for a given action writes the
 * same bytes, so the extra calls cost a `JSON.stringify` and change nothing.
 */
export function createPersistingReducer(
  storage: TaskStorage,
): (state: StoreState, action: Action) => StoreState {
  return (state, action) => {
    const next = reduce(state, action);
    if (next.tasks === state.tasks) return next;

    const { failure } = storage.writeTasks(next.tasks);
    // The new state stands either way. A failed write means the Task lives in
    // memory for the session — it does not mean the Task did not happen. Only
    // `writeFailure` moves: `readFailure` is this session's news about a
    // preserved document and is never overwritten by a later success.
    return failure === next.writeFailure ? next : { ...next, writeFailure: failure };
  };
}

/**
 * The initial state, read through the port.
 *
 * The defaults factory lives behind the adapter (AD-6), so there is no fallback
 * written here: an absent, unreadable or unmigratable document has already
 * resolved to an empty list by the time it arrives, with the reason attached.
 */
export function initialStoreState(storage: TaskStorage): StoreState {
  const { value, failure } = storage.readTasks();
  return { tasks: value, readFailure: failure, writeFailure: null };
}

/**
 * The capture rule, as a function: text in, a Task or nothing.
 *
 * A sentence with nothing in it is not a Task. Nothing is created, nothing is
 * stored, and **nothing is said** — capture has no error state, ever (UX-DR22).
 * The rule lives here rather than in the field so it holds for every caller and
 * can be proved without a browser.
 *
 * `trim` decides *whether* to create, and never *what* to store: the text is
 * passed through untouched, because the app does not rewrite your sentence
 * (FR-23).
 *
 * **The date word is parsed here, at capture, and applied directly** (FR-23,
 * PRD §13 item 2). It is not a Suggestion: there is nothing to review, nothing
 * to accept, and no purple anywhere near it — the user typed the date, so the
 * app is not proposing it. It is parsed synchronously, in the same call that
 * creates the Task, which is why a parsed date cannot arrive one render after
 * the record it belongs to.
 *
 * `today` is the reference date FR-23 resolves against and the only reason this
 * function takes a third argument. It comes from the Clock port through
 * `src/app/use-today.ts` (AD-2) — never from a clock read here, so this stays a
 * function whose answer is identical on any machine.
 */
export function captureTask(ids: Ids, text: string, today: LocalDate): Task | null {
  if (text.trim() === '') return null;
  const task = createTask(ids.newId(), text);
  const parsed = parseDateWord(text, today);
  // No date word is the ordinary case, not a failure: the Task is created
  // exactly as it would have been (AC 4). `createTask` already set `dueDate`
  // to `null`, so there is nothing to undo and no second default to keep in
  // step with `core/task.ts`.
  return parsed === null ? task : { ...task, dueDate: parsed.date };
}

interface StoreValue {
  readonly state: StoreState;
  /** Creates a Task from text, or returns `null` when there is nothing to create. */
  readonly createTaskFromText: (text: string) => Task | null;
  /** Writes one field of one Task, by id (FR-3). */
  readonly editTaskField: (id: string, edit: FieldEdit) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export interface StoreProviderProps {
  storage: TaskStorage;
  /** The Id port. The store receives it; it never reaches for one (AD-1). */
  ids: Ids;
  /**
   * The reference date FR-23's date words resolve against, from the Clock port
   * (AD-2). A prop rather than a clock the store holds: the value is already a
   * string by the time anything is captured, so nothing on the capture path
   * reads a runtime, and the composition root stays the only place an adapter
   * is constructed.
   */
  today: LocalDate;
  children: ReactNode;
}

export function StoreProvider({ storage, ids, today, children }: StoreProviderProps) {
  const reducer = useMemo(() => createPersistingReducer(storage), [storage]);
  const [state, dispatch] = useReducer(reducer, storage, initialStoreState);

  const createTaskFromText = useCallback(
    (text: string): Task | null => {
      const task = captureTask(ids, text, today);
      if (task === null) return null;
      dispatch({ type: 'task/created', task });
      return task;
    },
    [ids, today],
  );

  // No `today` and no `ids` in the dependencies: an edit needs neither. The
  // user supplies the value, so nothing is parsed, nothing is generated, and
  // no date word is re-read — which is also why editing the task text cannot
  // re-resolve a date the way capture does (FR-3, AD-15).
  const editTaskField = useCallback((id: string, edit: FieldEdit): void => {
    dispatch({ type: 'task/field-edited', id, edit });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ state, createTaskFromText, editTaskField }),
    [state, createTaskFromText, editTaskField],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore(): StoreValue {
  const store = useContext(StoreContext);
  if (store === null) {
    // A surface outside the provider is a composition mistake in
    // `src/main.tsx`, not a user-facing condition. It is unreachable in a built
    // app and would otherwise show up as a surface that silently renders zero
    // Tasks — the one failure mode worse than a crash in a product whose claim
    // is that your tasks are still there.
    throw new Error('A surface read the store from outside StoreProvider.');
  }
  return store;
}

/** Every Task, newest first. */
export function useTasks(): readonly Task[] {
  return useStore().state.tasks;
}

/** The capture path: text in, a Task created and persisted, or `null`. */
export function useCreateTask(): (text: string) => Task | null {
  return useStore().createTaskFromText;
}

/**
 * Writes one field of one Task (FR-3).
 *
 * The id and a one-key patch, never a whole Task: the surface says what
 * changed, and the reducer decides what the Task becomes.
 */
export function useEditTaskField(): (id: string, edit: FieldEdit) => void {
  return useStore().editTaskField;
}
