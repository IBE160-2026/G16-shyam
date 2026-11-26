import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  captureTask,
  createPersistingReducer,
  initialStoreState,
  reduce,
  type Action,
  type StoreState,
} from '../../src/app/store';
import { STORAGE_KEYS } from '../../src/adapters/local-storage';
import { createTask, type Task } from '../../src/core/task';
import type { Ids } from '../../src/ports/id';
import type { StorageFailure, StorageRead, StorageWrite, TaskStorage } from '../../src/ports/storage';

/**
 * The single store: its named actions, the single-writer rule, and what happens
 * when storage will not take the write (AC 1, AC 4, AC 5, AD-6).
 *
 * The state transitions are tested as the pure function they are, and the one
 * place that writes is tested through a recording fake. The two rules that
 * cannot be shown by exercising a function — "no other module writes storage"
 * and "nothing on the capture path is awaited" — are checked mechanically over
 * the source tree, because both are properties of the whole codebase and both
 * fail silently when they are broken.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/** Every `.ts`/`.tsx` file under `src/`, excluding the lint fixtures. */
function sourceFiles(directory = SRC): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__fixtures__') continue;
      found.push(...sourceFiles(path));
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

/**
 * A file's code with its comments removed.
 *
 * Every mechanical check below looks for a word, and the project's own
 * documentation uses those words constantly — `src/ports/storage.ts` explains
 * what happens when `localStorage` is absent, and `src/app/store.tsx` explains
 * why nothing on the capture path is `async`. Prose about a rule must not fail
 * the rule.
 */
function code(path: string): string {
  return (
    readFileSync(path, 'utf8')
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      // Trailing comments too, not only line-initial ones: a note written
      // beside real code — `backing.getItem(key); // localStorage can throw` —
      // is still prose, and stripping only whole comment lines would fail the
      // assertion on it.
      .replaceAll(/\/\/.*$/gm, '')
  );
}

/** A counter, injected where the browser would use `crypto.randomUUID()`. */
function countingIds(): Ids {
  let next = 0;
  return {
    newId(): string {
      next += 1;
      return `id-${String(next)}`;
    },
  };
}

interface RecordingStorage extends TaskStorage {
  readonly writes: readonly Task[][];
  failWrite: StorageFailure | null;
}

function recordingStorage(initial: readonly Task[] = []): RecordingStorage {
  const writes: Task[][] = [];
  return {
    writes,
    failWrite: null,
    readTasks(): StorageRead<readonly Task[]> {
      return { value: initial, failure: null };
    },
    writeTasks(tasks): StorageWrite {
      if (this.failWrite !== null) return { failure: this.failWrite };
      writes.push([...tasks]);
      return { failure: null };
    },
  };
}

const EMPTY: StoreState = { tasks: [], readFailure: null, writeFailure: null };

describe('the named actions', () => {
  it('has exactly the mutations this story can perform', () => {
    // One action, because this story can do one thing. Completion (1.6),
    // editing (1.5) and deletion (1.7) each add their own rather than widening
    // this one into a generic `task/changed`.
    const created: Action = { type: 'task/created', task: createTask('id-1', 'Pay rent') };
    expect(created.type).toBe('task/created');
  });

  it('task/created puts the new Task at the head of the list', () => {
    const first = createTask('id-1', 'Pay rent');
    const second = createTask('id-2', 'Submit assignment in IBE160');

    const afterFirst = reduce(EMPTY, { type: 'task/created', task: first });
    const afterSecond = reduce(afterFirst, { type: 'task/created', task: second });

    // Newest first: the record you just captured is the one you are looking
    // for, and at 360 px that is the difference between seeing it and
    // scrolling for it.
    expect(afterSecond.tasks).toEqual([second, first]);
  });

  it('does not mutate the state it was given', () => {
    const before: StoreState = {
      tasks: [createTask('id-1', 'Pay rent')],
      readFailure: null,
      writeFailure: null,
    };
    const after = reduce(before, { type: 'task/created', task: createTask('id-2', 'Study') });

    expect(before.tasks).toHaveLength(1);
    expect(after.tasks).not.toBe(before.tasks);
  });
});

describe('capture', () => {
  it('creates a Task at FR-1 defaults with an id from the port', () => {
    const task = captureTask(countingIds(), 'Submit assignment in IBE160');
    expect(task).toEqual({
      id: 'id-1',
      text: 'Submit assignment in IBE160',
      dueDate: null,
      notes: null,
      tags: [],
      priority: 'medium',
      summary: null,
      completedAt: null,
    });
  });

  it('creates nothing from a whitespace-only sentence, and says nothing', () => {
    const ids = countingIds();
    for (const blank of ['', ' ', '   ', '\t', '\n', ' \t\n ']) {
      expect(captureTask(ids, blank)).toBeNull();
    }
    // The id port was never asked either: nothing was created, so nothing was
    // allocated.
    expect(captureTask(ids, 'real')?.id).toBe('id-1');
  });

  it('stores the text verbatim even when it has edge whitespace', () => {
    expect(captureTask(countingIds(), '  Pay rent  ')?.text).toBe('  Pay rent  ');
  });
});

describe('the single writer', () => {
  it('writes the whole document, synchronously, on every mutation', () => {
    const storage = recordingStorage();
    const reducer = createPersistingReducer(storage);

    const first = createTask('id-1', 'Pay rent');
    const second = createTask('id-2', 'Study');
    const afterFirst = reducer(EMPTY, { type: 'task/created', task: first });
    reducer(afterFirst, { type: 'task/created', task: second });

    // Two mutations, two writes, each of the whole document — AD-6's accepted
    // cost, and the thing FR-8's budget is measured against.
    expect(storage.writes).toEqual([[first], [second, first]]);
  });

  it('writes the same bytes however many times it is invoked for one action', () => {
    // Idempotence is the design's load-bearing claim, not an incidental
    // property. React invokes reducers more than once per action under
    // StrictMode in development, and may replay a queued action when a render
    // is interrupted — so a write that accumulated, appended or stamped
    // anything per call would corrupt the document in development only, where
    // no gate runs.
    const storage = recordingStorage();
    const reducer = createPersistingReducer(storage);
    const action: Action = { type: 'task/created', task: createTask('id-1', 'Pay rent') };

    const once = reducer(EMPTY, action);
    const twice = reducer(EMPTY, action);

    expect(storage.writes).toHaveLength(2);
    expect(storage.writes[0]).toEqual(storage.writes[1]);
    expect(JSON.stringify(once)).toBe(JSON.stringify(twice));
  });

  it('is the only thing in src/ that names the storage key', () => {
    const offenders = sourceFiles()
      .filter((path) => relative(SRC, path) !== join('adapters', 'local-storage.ts'))
      .filter((path) => code(path).includes(STORAGE_KEYS.tasks));
    // AD-6: a key spelled in a second file is a second file that can get it
    // wrong — and the reason clearing the API Key in Epic 5 cannot rewrite the
    // task document is that no other module is in a position to.
    expect(offenders.map((path) => relative(SRC, path))).toEqual([]);
  });

  it('is the only thing in src/ that reaches a storage API', () => {
    const offenders = sourceFiles()
      .filter((path) => relative(SRC, path) !== join('adapters', 'local-storage.ts'))
      .filter((path) => /\b(localStorage|sessionStorage|indexedDB)\b/.test(code(path)));
    expect(offenders.map((path) => relative(SRC, path))).toEqual([]);
  });
});

describe('the capture path is synchronous', () => {
  /** Submit to render: the store, the field, the surface and the adapter. */
  const CAPTURE_PATH = [
    join('app', 'store.tsx'),
    join('adapters', 'local-storage.ts'),
    join('adapters', 'id.ts'),
    join('ui', 'today', 'Capture.tsx'),
    join('ui', 'today', 'Today.tsx'),
    join('ui', 'components', 'Record.tsx'),
    join('ui', 'components', 'PriorityLadder.tsx'),
  ];

  for (const file of CAPTURE_PATH) {
    it(`${file} contains no async boundary`, () => {
      // FR-8's 100 ms is not met by optimising; it is met by there being no
      // `await` between submit and the record rendering. This is the mechanical
      // form of that claim: an `await`, a Promise or a deferral introduced here
      // would make the budget a matter of luck, and the end-to-end timing test
      // would start failing on a slow machine rather than on the commit that
      // broke it. Comments are stripped first so prose about `async` does not
      // fail its own file.
      const source = code(join(SRC, file));
      expect(source).not.toMatch(/\basync\b/);
      expect(source).not.toMatch(/\bawait\b/);
      expect(source).not.toMatch(/\bPromise\b/);
      expect(source).not.toMatch(/\b(setTimeout|requestIdleCallback|queueMicrotask)\b/);
    });
  }
});

describe('when storage will not take the write', () => {
  it('keeps the Task in state and records why, so the session continues', () => {
    const storage = recordingStorage();
    const reducer = createPersistingReducer(storage);
    storage.failWrite = 'quota-exceeded';

    const task = createTask('id-1', 'Pay rent');
    const next = reducer(EMPTY, { type: 'task/created', task });

    // The Task happened. A failed write means it lives in memory for the
    // session — it does not mean capture failed, and capture will say nothing
    // about it (AC 5, UX-DR22). Only Settings may ever read this (Epic 5).
    expect(next.tasks).toEqual([task]);
    expect(next.writeFailure).toBe('quota-exceeded');
    expect(storage.writes).toEqual([]);
  });

  it('is fully usable with no storage at all', () => {
    const unavailable: TaskStorage = {
      readTasks: () => ({ value: [], failure: 'unavailable' }),
      writeTasks: () => ({ failure: 'unavailable' }),
    };
    const reducer = createPersistingReducer(unavailable);

    let state = initialStoreState(unavailable);
    expect(state).toEqual({ tasks: [], readFailure: 'unavailable', writeFailure: null });

    const ids = countingIds();
    for (const text of ['one', 'two', 'three']) {
      const task = captureTask(ids, text);
      if (task === null) throw new Error(`capture refused ${text}`);
      state = reducer(state, { type: 'task/created', task });
    }
    // Three captures, no storage, and all three Tasks on screen: the app is
    // fully usable in memory for the session (AC 5).
    expect(state.tasks.map((task) => task.text)).toEqual(['three', 'two', 'one']);
    expect(state.writeFailure).toBe('unavailable');
    expect(state.readFailure, 'the read failure was overwritten').toBe('unavailable');
  });

  it('clears the reason once a write succeeds again', () => {
    const storage = recordingStorage();
    const reducer = createPersistingReducer(storage);
    storage.failWrite = 'quota-exceeded';
    const failed = reducer(EMPTY, { type: 'task/created', task: createTask('id-1', 'a') });

    storage.failWrite = null;
    const recovered = reducer(failed, { type: 'task/created', task: createTask('id-2', 'b') });

    // Settings' status "clears itself when the cause does" (AD-6), which only
    // holds if the reason is re-derived from the last write rather than latched.
    expect(recovered.writeFailure).toBeNull();
  });
});

describe('the initial state', () => {
  it('comes from the port, with no fallback written at the call site', () => {
    const stored = [createTask('id-1', 'Pay rent')];
    expect(initialStoreState(recordingStorage(stored))).toEqual({
      tasks: stored,
      readFailure: null,
      writeFailure: null,
    });
  });

  it('carries the reason an unreadable document could not be used', () => {
    const unreadable: TaskStorage = {
      readTasks: () => ({ value: [], failure: 'unreadable' }),
      writeTasks: () => ({ failure: null }),
    };
    // AC 6: the app starts empty, and the backup key already holds the raw
    // string — the adapter did that before this point.
    expect(initialStoreState(unreadable)).toEqual({
      tasks: [],
      readFailure: 'unreadable',
      writeFailure: null,
    });
  });
});
