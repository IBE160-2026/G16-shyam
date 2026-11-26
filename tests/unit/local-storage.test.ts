import { describe, expect, it, vi } from 'vitest';
import {
  browserStorage,
  createTaskStorage,
  migrateDocument,
  STORAGE_KEYS,
  type Migration,
  type WebStorage,
} from '../../src/adapters/local-storage';
import { TASK_SCHEMA_VERSION } from '../../src/core/constants';
import { createTask, validateTaskDocument, type Task } from '../../src/core/task';

/**
 * The storage adapter: the only file that names a key, against a fake store
 * (AC 4, AC 5, AC 6, AD-6).
 *
 * The fake is the point. The two conditions AC 5 is about — storage that is not
 * there, and storage that refuses a write — are the hardest things to arrange in
 * a real browser and the easiest to get wrong, so they are driven directly here
 * rather than hoped for in the end-to-end pass.
 */

interface Fake extends WebStorage {
  readonly items: Map<string, string>;
  failNextWrite: 'quota' | 'other' | null;
  failReads: boolean;
}

function fakeStorage(seed: Record<string, string> = {}): Fake {
  const items = new Map(Object.entries(seed));
  return {
    items,
    failNextWrite: null,
    failReads: false,
    getItem(key) {
      if (this.failReads) throw new Error('reading site data is denied');
      return items.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.failNextWrite === 'quota') {
        // What a browser actually throws: a DOMException, which reaches a
        // `catch` as `unknown`. The name is what identifies it.
        const error = new Error('persistent storage maximum size reached');
        error.name = 'QuotaExceededError';
        throw error;
      }
      if (this.failNextWrite === 'other') {
        throw new Error('storage is gone');
      }
      items.set(key, value);
    },
  };
}

const TASKS: readonly Task[] = [
  createTask('task-1', 'Submit assignment in IBE160'),
  createTask('task-2', 'Pay rent'),
];

describe('the keys', () => {
  it('names todo.tasks.v1, its backup and its probe, here and nowhere else', () => {
    // AD-6's rule is that no other module is even in a position to spell these.
    // The mechanical half of that is checked in store.test.ts, which greps the
    // tree; this half pins the spelling itself. The probe is listed because a
    // transient key left behind is still litter in the user's own origin.
    expect(STORAGE_KEYS.tasks).toBe('todo.tasks.v1');
    expect(STORAGE_KEYS.backup).toBe('todo.tasks.v1.backup');
    expect(STORAGE_KEYS.probe).toBe('__todo.probe__');
  });
});

describe('a read that throws', () => {
  it('refuses to write for the rest of the session', () => {
    // A read that throws says nothing about whether a document is there — only
    // that this session cannot see it. Writing over it would destroy a
    // document that is still present and was never backed up, which is the one
    // outcome AD-6 exists to prevent.
    const backing = fakeStorage({ [STORAGE_KEYS.tasks]: JSON.stringify({
      schemaVersion: TASK_SCHEMA_VERSION,
      tasks: TASKS,
    }) });
    const before = backing.items.get(STORAGE_KEYS.tasks);
    const storage = createTaskStorage(backing);

    backing.failReads = true;
    expect(storage.readTasks().failure).toBe('unavailable');

    // Even once reading works again: the latch is for the session, and a
    // reload is what tries again.
    backing.failReads = false;
    expect(storage.writeTasks([createTask('task-9', 'New')]).failure).toBe('unavailable');
    expect(backing.items.get(STORAGE_KEYS.tasks), 'a live document was overwritten').toBe(before);
  });

  it('still writes normally in a session whose read merely found nothing', () => {
    // The latch must be about a *throw*, not about an empty start: a clean
    // clone writes its first Task like any other.
    const backing = fakeStorage();
    const storage = createTaskStorage(backing);

    expect(storage.readTasks().failure).toBeNull();
    expect(storage.writeTasks(TASKS).failure).toBeNull();
    expect(backing.items.has(STORAGE_KEYS.tasks)).toBe(true);
  });
});

describe('writing', () => {
  it('writes the whole document under one key, carrying its schemaVersion', () => {
    const backing = fakeStorage();
    const storage = createTaskStorage(backing);

    expect(storage.writeTasks(TASKS).failure).toBeNull();

    expect([...backing.items.keys()]).toEqual([STORAGE_KEYS.tasks]);
    const written = JSON.parse(backing.items.get(STORAGE_KEYS.tasks) ?? '') as {
      schemaVersion: number;
      tasks: Task[];
    };
    expect(written.schemaVersion).toBe(TASK_SCHEMA_VERSION);
    expect(written.tasks).toEqual(TASKS);
  });

  it('round-trips every field intact', () => {
    const backing = fakeStorage();
    const storage = createTaskStorage(backing);
    const rich: Task = {
      id: 'task-3',
      text: '  Keep   my spacing  ',
      dueDate: '2026-11-20',
      notes: 'two\nlines',
      tags: ['school', 'group'],
      priority: 'low',
      summary: 'A summary',
      completedAt: '2026-11-18',
    };

    storage.writeTasks([rich]);
    const read = storage.readTasks();

    expect(read.failure).toBeNull();
    expect(read.value).toEqual([rich]);
  });

  it('reports a refused write as quota, and keeps nothing half-written', () => {
    const backing = fakeStorage();
    const storage = createTaskStorage(backing);
    backing.failNextWrite = 'quota';

    expect(storage.writeTasks(TASKS).failure).toBe('quota-exceeded');
    expect(backing.items.size).toBe(0);
  });

  it('reports any other throw as unavailable rather than guessing quota', () => {
    const backing = fakeStorage();
    const storage = createTaskStorage(backing);
    backing.failNextWrite = 'other';

    expect(storage.writeTasks(TASKS).failure).toBe('unavailable');
  });

  it('never throws, whatever the backing store does', () => {
    const storage = createTaskStorage({
      getItem() {
        throw new Error('no');
      },
      setItem() {
        throw new Error('no');
      },
    });
    // The product forbids an error state in capture (UX-DR22), so a throw here
    // would have exactly one place to go: a surface that may not show it.
    expect(() => storage.writeTasks(TASKS)).not.toThrow();
    expect(() => storage.readTasks()).not.toThrow();
    expect(storage.readTasks().value).toEqual([]);
  });
});

describe('reading', () => {
  it('treats an absent document as a clean start, not a failure', () => {
    // First run on a clean clone. The defaults factory answers, and there is
    // nothing for Settings to report.
    const read = createTaskStorage(fakeStorage()).readTasks();
    expect(read.value).toEqual([]);
    expect(read.failure).toBeNull();
  });

  it('starts empty in memory when localStorage is absent', () => {
    const read = createTaskStorage(null).readTasks();
    expect(read.value).toEqual([]);
    expect(read.failure).toBe('unavailable');
  });

  it('reports a write as unavailable when localStorage is absent', () => {
    expect(createTaskStorage(null).writeTasks(TASKS).failure).toBe('unavailable');
  });
});

describe('a stored document that fails validation', () => {
  const invalid = {
    'malformed JSON': '{"schemaVersion":1,"tasks":[',
    'JSON that is not a document': '"just a string"',
    'the wrong shape': JSON.stringify({ schemaVersion: 1, tasks: [{ id: 'x' }] }),
    'no version': JSON.stringify({ tasks: [] }),
    'a version from the future': JSON.stringify({ schemaVersion: 99, tasks: [] }),
    'a version below one': JSON.stringify({ schemaVersion: 0, tasks: [] }),
  };

  for (const [description, raw] of Object.entries(invalid)) {
    it(`preserves ${description} under the backup key and starts empty`, () => {
      const backing = fakeStorage({ [STORAGE_KEYS.tasks]: raw });
      const read = createTaskStorage(backing).readTasks();

      expect(read.value).toEqual([]);
      expect(read.failure).toBe('unreadable');
      // Never discarded, and never rewritten: byte-for-byte what was there.
      expect(backing.items.get(STORAGE_KEYS.backup)).toBe(raw);
      expect(backing.items.get(STORAGE_KEYS.tasks)).toBe(raw);
    });
  }

  it('does not let a second bad document destroy the first preserved copy', () => {
    // "Never discarded" has to mean the earliest surviving copy wins. The
    // first backup is the one that held the user's Tasks; whatever replaced it
    // is most likely the thing that broke them.
    const original = JSON.stringify({ schemaVersion: 1, tasks: [{ id: 'kept', text: 'real' }] });
    const backing = fakeStorage({ [STORAGE_KEYS.tasks]: original });

    createTaskStorage(backing).readTasks();
    expect(backing.items.get(STORAGE_KEYS.backup)).toBe(original);

    // A later session finds different rubbish under the same key.
    backing.items.set(STORAGE_KEYS.tasks, 'later rubbish');
    createTaskStorage(backing).readTasks();

    expect(backing.items.get(STORAGE_KEYS.backup), 'the first copy was overwritten').toBe(original);
  });

  it('still starts empty when even the backup cannot be written', () => {
    // The likeliest reason the backup fails is the same quota that would have
    // failed the document. Failing the read because the *backup* failed would
    // turn one problem into two.
    const backing = fakeStorage({ [STORAGE_KEYS.tasks]: 'not json' });
    backing.failNextWrite = 'quota';

    const read = createTaskStorage(backing).readTasks();
    expect(read.value).toEqual([]);
    expect(read.failure).toBe('unreadable');
  });
});

describe('the migration chain', () => {
  /** Bumps a version-1 document to version 2, giving every Task its new field. */
  const migrate1to2: Migration = (document) => {
    const { tasks } = document as { tasks: Record<string, unknown>[] };
    return {
      schemaVersion: 2,
      tasks: tasks.map((task) => ({ ...task, notes: task.notes ?? 'migrated' })),
    };
  };

  /** 2 to 3, so the `chain[from - 1]` offset is walked more than once. */
  const migrate2to3: Migration = (document) => ({
    ...(document as object),
    schemaVersion: 3,
  });

  const v1 = {
    schemaVersion: 1,
    tasks: [{ id: 'task-1', text: 'Pay rent', priority: 'medium' }],
  };

  it('walks a version-1 document up to a bumped constant', () => {
    // With MIGRATIONS empty the loop never runs, so the body and the
    // `chain[from - 1]` offset — the easiest thing here to get wrong by one —
    // would otherwise first execute in a user's own document.
    const migrated = migrateDocument(v1, [migrate1to2, migrate2to3], 3);
    const document = validateTaskDocument(migrated);

    expect(document?.schemaVersion).toBe(3);
    expect(document?.tasks).toEqual([
      {
        id: 'task-1',
        text: 'Pay rent',
        dueDate: null,
        notes: 'migrated',
        tags: [],
        priority: 'medium',
        summary: null,
        completedAt: null,
      },
    ]);
  });

  it('starts at the document version rather than at the bottom of the chain', () => {
    // A version-2 document must run `migrate2to3` only. Running `migrate1to2`
    // over it is the off-by-one this offset invites.
    const v2 = { schemaVersion: 2, tasks: [{ ...v1.tasks[0], notes: 'mine' }] };
    const document = validateTaskDocument(migrateDocument(v2, [migrate1to2, migrate2to3], 3));

    expect(document?.schemaVersion).toBe(3);
    expect(document?.tasks[0]?.notes).toBe('mine');
  });

  it('leaves a document already at the target untouched', () => {
    const current = { schemaVersion: 3, tasks: [] };
    expect(migrateDocument(current, [migrate1to2, migrate2to3], 3)).toBe(current);
  });

  it('refuses a version with no step to climb from', () => {
    // Unmigratable, which means the backup key — not a guess at its shape.
    expect(migrateDocument(v1, [], 3)).toBeNull();
    expect(migrateDocument({ schemaVersion: 9, tasks: [] }, [], 3)).toBeNull();
    expect(migrateDocument({ schemaVersion: 0, tasks: [] }, [], 3)).toBeNull();
  });

  it('is what the adapter applies on read', () => {
    // The default chain is empty at version 1, so a version-1 document reads
    // straight through — the wiring, not the walk.
    const raw = JSON.stringify({ schemaVersion: TASK_SCHEMA_VERSION, tasks: TASKS });
    const read = createTaskStorage(fakeStorage({ [STORAGE_KEYS.tasks]: raw })).readTasks();
    expect(read.failure).toBeNull();
    expect(read.value).toEqual(TASKS);
  });
});

describe('browserStorage', () => {
  it('returns null when there is no localStorage object at all', () => {
    // Vitest runs in the Node environment, where there is none.
    expect(browserStorage()).toBeNull();
  });

  it('keeps a store that refuses the probe, so readable Tasks are not hidden', () => {
    // An origin already at quota refuses the probe write — and still reads
    // perfectly well. Returning null there would show the user first run with
    // their document sitting in localStorage where nothing would look at it.
    const removed: string[] = [];
    const atQuota = {
      getItem: () => null,
      setItem: () => {
        const error = new Error('persistent storage maximum size reached');
        error.name = 'QuotaExceededError';
        throw error;
      },
      removeItem: (key: string) => removed.push(key),
    };
    vi.stubGlobal('localStorage', atQuota);
    try {
      expect(browserStorage()).toBe(atQuota);
      // And the probe is cleaned up even though it never landed.
      expect(removed).toEqual([STORAGE_KEYS.probe]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('survives a removeItem that throws, rather than losing the store', () => {
    const awkward = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('no');
      },
    };
    vi.stubGlobal('localStorage', awkward);
    try {
      expect(browserStorage()).toBe(awkward);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('returns null when reading the property itself throws', () => {
    // A browser configured to block site data throws on the access, not on a
    // later call.
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('access to site data is denied');
      },
    });
    try {
      expect(browserStorage()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
