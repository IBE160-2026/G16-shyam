import {
  defaultTaskDocument,
  validateTaskDocument,
  type Task,
  type TaskDocument,
} from '../core/task';
import { TASK_SCHEMA_VERSION } from '../core/constants';
import type { StorageFailure, StorageRead, StorageWrite, TaskStorage } from '../ports/storage';

/**
 * The only file in the application that names a storage key (AD-6).
 *
 * That is the whole point of the rule: three documents live under this origin —
 * the task document, the settings document and the API Key — and the reason
 * clearing the key cannot rewrite the task document is that no other module is
 * in a position to write either. A key spelled in a second file is a second
 * file that can get it wrong.
 *
 * This story writes one of the three. `todo.settings.v1` and `todo.apikey.v1`
 * arrive with Settings in Epic 5 and belong in this file when they do.
 *
 * It is also the only file that knows `schemaVersion` exists: it is stripped on
 * read and re-attached on write, so the store holds Tasks and nothing else
 * (AD-6).
 */

/** The task document. The only key this story writes. */
const TASKS_KEY = 'todo.tasks.v1';

/**
 * Where a document that failed validation is kept (AD-6).
 *
 * A stored document is **never discarded**. If the bytes under `TASKS_KEY` are
 * not a valid document, the raw string is copied here verbatim and the app
 * starts empty — so a shape mistake in a later version costs the user a visit to
 * Settings, not their tasks. Nothing reads this key; it exists to be recovered
 * from by hand.
 */
const BACKUP_KEY = 'todo.tasks.v1.backup';

/**
 * Written and removed by `browserStorage`'s probe, and never read.
 *
 * It is spelled here with the other two so the rule "only this file names a
 * key" is true of every key, including a transient one — a probe left under a
 * name nobody can find is still litter in the user's origin.
 */
const PROBE_KEY = '__todo.probe__';

/**
 * The slice of the Web Storage API this adapter uses.
 *
 * Narrow on purpose, and injected rather than reached for: it is what lets
 * `tests/unit/local-storage.test.ts` drive an absent store and a throwing
 * `setItem` without a DOM, which are the two conditions AC 5 is about and the
 * two that are hardest to arrange in a real browser.
 */
export interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * The browser's own `localStorage`, or `null` when there is no such object.
 *
 * Reading the property is itself what throws in a browser configured to block
 * site data — the access, not a later call — so the access is inside the `try`.
 * That, and only that, is what `null` means here.
 *
 * **A failed probe does not mean no storage.** An origin already at quota
 * refuses the probe write, and a store that refuses writes still *reads*
 * perfectly well. Returning `null` there would hide a document the user
 * already has: they would open the app, see first run, and find their tasks
 * still sitting in `localStorage` where nothing would ever look at them again.
 * So a refused probe downgrades the store to read-only rather than discarding
 * it — writes will fail and be reported as quota, which is exactly what they
 * are.
 *
 * Called once, from `src/main.tsx`. Nothing else constructs an adapter.
 */
export function browserStorage(): WebStorage | null {
  try {
    // Read through a widened `globalThis` rather than the DOM declaration: the
    // ambient type says `localStorage` is always a `Storage`, which is exactly
    // the thing being tested, and comparing a non-nullable type to `undefined`
    // does not typecheck.
    const ambient = globalThis as {
      localStorage?: WebStorage & { removeItem(key: string): void };
    };
    const candidate = ambient.localStorage;
    if (candidate === undefined) return null;

    try {
      candidate.setItem(PROBE_KEY, '1');
    } catch {
      // Present and readable, but it will not take a write. Still worth having.
    } finally {
      try {
        // In a `finally` so a probe that *did* land is cleaned up even when the
        // removal path is the one that throws: a key left behind is litter in
        // the user's own origin, and this one has no owner.
        candidate.removeItem(PROBE_KEY);
      } catch {
        // Nothing can be done about it, and nothing depends on it.
      }
    }
    return candidate;
  } catch {
    return null;
  }
}

/**
 * The ordered migration chain, applied on read (AD-6).
 *
 * Empty at version 1, and present anyway: the chain is the mechanism, and the
 * first story to bump the version should add `migrate1to2` to this array rather
 * than invent a place for it under pressure. A document whose version is higher
 * than this build understands is **unmigratable**, which means the backup key —
 * not a guess at its shape.
 */
export type Migration = (document: unknown) => unknown;

const MIGRATIONS: readonly Migration[] = [];

/**
 * Walks `parsed` up the chain to `target`.
 *
 * The chain and the target are parameters so the walk itself can be tested:
 * with `MIGRATIONS` empty the loop never runs, which would leave both the body
 * and the `chain[from - 1]` offset — the easiest thing here to get wrong by one
 * — unexecuted until the first story that bumps the version, and wrong for the
 * first time in a user's own document. `tests/unit/local-storage.test.ts`
 * injects a stub chain instead.
 */
export function migrateDocument(
  parsed: unknown,
  chain: readonly Migration[] = MIGRATIONS,
  target: number = TASK_SCHEMA_VERSION,
): unknown {
  if (typeof parsed !== 'object' || parsed === null) return parsed;
  const version = (parsed as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version)) return parsed;
  if (version > target || version < 1) return null;

  let document: unknown = parsed;
  // `chain[0]` is `migrate1to2`, so the step that takes version N upward is at
  // index N-1.
  for (let from = version; from < target; from += 1) {
    const step = chain[from - 1];
    if (step === undefined) return null;
    document = step(document);
  }
  return document;
}

function parse(raw: string): TaskDocument | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return validateTaskDocument(migrateDocument(parsed));
}

/**
 * Whether a thrown value is the browser saying "out of room".
 *
 * Worth telling apart from every other failure because the two lead different
 * places in Epic 5: a quota failure is about the size of the document and an
 * unavailable store is about the browser's configuration. Firefox uses its own
 * legacy name, and the numeric code is checked too because a `DOMException`
 * reaches `catch` as `unknown` under `useUnknownInCatchVariables`.
 */
function isQuotaFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  return (
    name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22
  );
}

/**
 * The adapter, over a `WebStorage` that may be `null`.
 *
 * `null` is not an error path with its own behaviour — it is the in-memory
 * session, and every operation already has to answer for a failure, so there is
 * nothing extra to write. That is what makes AC 5 structural: the app is fully
 * usable with no storage because the adapter's failure answer and its
 * no-storage answer are the same answer.
 */
export function createTaskStorage(backing: WebStorage | null): TaskStorage {
  /**
   * Set when a read **threw**, and never cleared.
   *
   * A read that throws says nothing about whether a document is there — only
   * that this session cannot see it. Writing over it would destroy a document
   * that is still present and was never backed up, which is the one outcome
   * AD-6 exists to prevent. So a session that could not read refuses to write
   * for its whole life, and the Tasks stay in memory. A reload is what tries
   * again.
   */
  let readThrew = false;

  function backup(raw: string): void {
    if (backing === null) return;
    try {
      // **Only when it is absent.** A second unreadable document must not
      // overwrite the preserved copy of the first: the first is the one that
      // held the user's Tasks, and the second is most likely whatever replaced
      // it. "Never discarded" has to mean the earliest surviving copy wins.
      if (backing.getItem(BACKUP_KEY) === null) {
        backing.setItem(BACKUP_KEY, raw);
      }
    } catch {
      // The backup is best effort by necessity: the most likely reason it
      // fails is the same quota that would have been hit saving the document
      // itself. There is nowhere to report it — capture has no error state —
      // and failing the read because the *backup* failed would turn one
      // problem into two.
    }
  }

  function failedRead(failure: StorageFailure): StorageRead<readonly Task[]> {
    return { value: defaultTaskDocument().tasks, failure };
  }

  return {
    readTasks(): StorageRead<readonly Task[]> {
      if (backing === null) return failedRead('unavailable');

      let raw: string | null;
      try {
        raw = backing.getItem(TASKS_KEY);
      } catch {
        readThrew = true;
        return failedRead('unavailable');
      }

      // Absent is not a failure. It is a clean clone, and the defaults factory
      // is the right answer with nothing to report (AD-6).
      if (raw === null) return { value: defaultTaskDocument().tasks, failure: null };

      const document = parse(raw);
      if (document === null) {
        backup(raw);
        return failedRead('unreadable');
      }

      return { value: document.tasks, failure: null };
    },

    writeTasks(tasks: readonly Task[]): StorageWrite {
      if (backing === null) return { failure: 'unavailable' };
      // A session that could not read must never write: the document it would
      // overwrite may be perfectly good and has not been backed up.
      if (readThrew) return { failure: 'unavailable' };

      // Serialized whole, with the version re-attached here and only here.
      const document: TaskDocument = { schemaVersion: TASK_SCHEMA_VERSION, tasks };
      try {
        backing.setItem(TASKS_KEY, JSON.stringify(document));
      } catch (error) {
        return { failure: isQuotaFailure(error) ? 'quota-exceeded' : 'unavailable' };
      }
      return { failure: null };
    },
  };
}

/** The keys this adapter owns, for the tests that have to name them. */
export const STORAGE_KEYS = { tasks: TASKS_KEY, backup: BACKUP_KEY, probe: PROBE_KEY } as const;
