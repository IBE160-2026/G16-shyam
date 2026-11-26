import { describe, expect, it } from 'vitest';
import {
  createTask,
  defaultTaskDocument,
  isPriority,
  PRIORITIES,
  validateTask,
  validateTaskDocument,
  type Task,
} from '../../src/core/task';
import { TASK_SCHEMA_VERSION } from '../../src/core/constants';

/**
 * The Task shape, the defaults factory and the validator (AC 1, AC 6, AD-6,
 * AD-7).
 *
 * Everything here is pure, which is the point: these are the rows of the
 * story's matrix that need no browser, and they are the rows that decide
 * whether a user's stored document is readable. The validator gets the most
 * attention because it is the only thing standing between bytes on a device and
 * the rest of the app — and because its failure mode is silent. A validator
 * that is too lax lets a wrong shape into the store; one that is too strict
 * sends a perfectly good document to the backup key and shows the user an empty
 * list.
 */

const VALID: Task = {
  id: 'task-1',
  text: 'Submit assignment in IBE160',
  dueDate: '2026-11-20',
  notes: 'Chapter four',
  tags: ['school'],
  priority: 'high',
  summary: 'Hand in the IBE160 assignment',
  completedAt: null,
};

/** A plain object of the same shape, for the mutations below. */
function stored(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...VALID, ...overrides };
}

describe('the Task shape', () => {
  it('carries exactly the eight fields PRD §3 names, and no derived flag', () => {
    const task = createTask('id-1', 'Pay rent');
    // `Project` is absent on purpose — Tier 3, Epic 8. A `completed` or
    // `archived` boolean is absent on principle: both are computed from
    // `completedAt`, and a stored flag would be a second source of truth
    // (AD-7).
    expect(Object.keys(task).sort()).toEqual([
      'completedAt',
      'dueDate',
      'id',
      'notes',
      'priority',
      'summary',
      'tags',
      'text',
    ]);
  });

  it('creates a Task at FR-1 defaults: medium, no Tags, no Summary', () => {
    expect(createTask('id-1', 'Pay rent')).toEqual({
      id: 'id-1',
      text: 'Pay rent',
      dueDate: null,
      notes: null,
      tags: [],
      priority: 'medium',
      summary: null,
      completedAt: null,
    });
  });

  it('stores the text byte-identically, never trimmed or recased', () => {
    // "The app never rewrites your sentence" is the product's central claim,
    // and a helpful trim is the first rewrite. Whether a blank sentence is
    // worth creating is the caller's call; what is stored is never touched.
    for (const text of ['  leading and trailing  ', 'MiXeD CaSe', 'two  spaces', 'tabs\there']) {
      expect(createTask('id', text).text).toBe(text);
    }
  });

  it('names the three Priorities, lowercase, once', () => {
    expect(PRIORITIES).toEqual(['high', 'medium', 'low']);
    for (const priority of PRIORITIES) {
      expect(isPriority(priority)).toBe(true);
    }
    for (const near of ['High', 'MEDIUM', 'urgent', '', null, 2]) {
      expect(isPriority(near)).toBe(false);
    }
  });
});

describe('the defaults factory', () => {
  it('supplies an empty document carrying the schema version', () => {
    // The matrix's "document absent" row: first run on a clean clone resolves
    // here and nowhere else (AD-6).
    expect(defaultTaskDocument()).toEqual({ schemaVersion: TASK_SCHEMA_VERSION, tasks: [] });
  });

  it('returns a fresh document each call, so no caller can poison the next', () => {
    const first = defaultTaskDocument();
    const second = defaultTaskDocument();
    expect(first).not.toBe(second);
    expect(first.tasks).not.toBe(second.tasks);
  });
});

describe('validateTask', () => {
  it('accepts a fully populated Task unchanged', () => {
    expect(validateTask(stored())).toEqual(VALID);
  });

  it('reads an absent optional field as its default', () => {
    // AD-6: adding an optional field whose absence is indistinguishable from
    // its default does not bump the schema version — which only holds if the
    // validator reads the absence that way.
    const sparse = { id: 'task-1', text: 'Pay rent', priority: 'medium' };
    expect(validateTask(sparse)).toEqual({
      id: 'task-1',
      text: 'Pay rent',
      dueDate: null,
      notes: null,
      tags: [],
      priority: 'medium',
      summary: null,
      completedAt: null,
    });
  });

  it('drops a field the shape does not have', () => {
    // A `completed` boolean from some future mistake must not survive the trip
    // through validation and become a second source of truth (AD-7).
    const task = validateTask(stored({ completed: true, archived: false }));
    expect(task).not.toBeNull();
    expect(task).not.toHaveProperty('completed');
    expect(task).not.toHaveProperty('archived');
  });

  it('rejects a present field of the wrong type', () => {
    const wrong: Record<string, unknown>[] = [
      stored({ id: 42 }),
      stored({ id: '' }),
      stored({ text: null }),
      stored({ text: 7 }),
      // Text is the one required field. Nothing is not a sentence, and neither
      // is whitespace — capture refuses to create either, so bytes carrying one
      // did not come from this application.
      stored({ text: '' }),
      stored({ text: '   ' }),
      stored({ text: '\t\n ' }),
      stored({ priority: 'urgent' }),
      stored({ priority: 'HIGH' }),
      stored({ tags: 'school' }),
      stored({ tags: ['school', 3] }),
      stored({ notes: 12 }),
      stored({ summary: false }),
      stored({ dueDate: '20-11-2026' }),
      stored({ dueDate: '2026-02-30' }),
      stored({ completedAt: 1_763_000_000_000 }),
    ];
    for (const value of wrong) {
      expect(validateTask(value), JSON.stringify(value)).toBeNull();
    }
  });

  it('rejects anything that is not an object', () => {
    for (const value of [null, undefined, 'task', 7, true, [], [VALID]]) {
      expect(validateTask(value)).toBeNull();
    }
  });
});

describe('validateTaskDocument', () => {
  it('accepts a document and returns its Tasks', () => {
    const document = validateTaskDocument({
      schemaVersion: TASK_SCHEMA_VERSION,
      tasks: [stored(), stored({ id: 'task-2' })],
    });
    expect(document?.schemaVersion).toBe(TASK_SCHEMA_VERSION);
    expect(document?.tasks).toHaveLength(2);
  });

  it('accepts an empty task list', () => {
    expect(validateTaskDocument({ schemaVersion: TASK_SCHEMA_VERSION, tasks: [] })).toEqual({
      schemaVersion: TASK_SCHEMA_VERSION,
      tasks: [],
    });
  });

  it('fails the whole document when one Task is unreadable', () => {
    // All or nothing, deliberately. The adapter's answer to an invalid document
    // is the backup key and an empty start (AD-6); silently keeping four Tasks
    // and dropping the fifth is the data loss that rule exists to prevent.
    expect(
      validateTaskDocument({
        schemaVersion: TASK_SCHEMA_VERSION,
        tasks: [stored(), stored({ priority: 'urgent' })],
      }),
    ).toBeNull();
  });

  it('keeps a Task whose text is only padded, because that text is real', () => {
    // The blank-text rule is `trim() === ''`, not "has no edge whitespace".
    // The app never rewrites your sentence, padding included.
    const document = validateTaskDocument({
      schemaVersion: TASK_SCHEMA_VERSION,
      tasks: [stored({ text: '  Pay rent  ' })],
    });
    expect(document?.tasks[0]?.text).toBe('  Pay rent  ');
  });

  it('fails the whole document when two Tasks share an id', () => {
    // An id identifies one Task. Two of them would give React duplicate keys
    // and leave `[data-record]` ambiguous for every surface downstream — so
    // this is the backup key, not a silent de-duplication.
    expect(
      validateTaskDocument({
        schemaVersion: TASK_SCHEMA_VERSION,
        tasks: [stored(), stored({ text: 'A different sentence' })],
      }),
    ).toBeNull();
  });

  it('rejects a document with no usable version or no task list', () => {
    for (const value of [
      {},
      { tasks: [] },
      { schemaVersion: '1', tasks: [] },
      { schemaVersion: 1.5, tasks: [] },
      { schemaVersion: TASK_SCHEMA_VERSION },
      { schemaVersion: TASK_SCHEMA_VERSION, tasks: {} },
      [],
      null,
      'nothing',
    ]) {
      expect(validateTaskDocument(value), JSON.stringify(value)).toBeNull();
    }
  });

  it('round-trips its own serialization', () => {
    const document = { schemaVersion: TASK_SCHEMA_VERSION, tasks: [VALID] };
    expect(validateTaskDocument(JSON.parse(JSON.stringify(document)))).toEqual(document);
  });
});
