import type { Task } from '../core/task';

/**
 * Persistence enters the application here and nowhere else (AD-6).
 *
 * **Synchronous, on purpose.** FR-8 gives capture 100 ms from submit to the
 * record being on screen, and the way that is met is structural rather than
 * optimised: the store writes storage *after* the reducer has already produced
 * the new state, so the render never waits on persistence. An asynchronous port
 * would put an `await` on the capture path and make the budget a matter of luck
 * — and it would let an in-flight write be clobbered by the next one.
 *
 * **Nothing here throws.** `localStorage` can be absent (a browser with site
 * data blocked, a private window in some browsers) and `setItem` can be refused
 * for quota. Both are ordinary conditions, and the product forbids an error
 * state in capture (UX-DR22), so they arrive as a value. A thrown exception
 * would have exactly one place to go: a surface that is not allowed to show it.
 */

/** Why a storage operation could not do what was asked. */
export type StorageFailure =
  /** `localStorage` is not reachable at all, so nothing persists this session. */
  | 'unavailable'
  /** The write was refused — the document is larger than the origin's quota. */
  | 'quota-exceeded'
  /**
   * Something was stored under the key and it is not a valid task document.
   * The raw string is kept under a backup key; it is never discarded (AD-6).
   */
  | 'unreadable';

/**
 * The outcome of a read: **always a usable value**, plus what went wrong.
 *
 * Not a success-or-failure union, and the asymmetry is deliberate. A caller
 * must never have to decide what an unreadable document means — AD-6 puts that
 * answer in one named defaults factory — so the port resolves it and hands back
 * the defaults with the reason attached. The reason exists for Settings, which
 * is the only surface allowed to mention it (Epic 5), and for tests.
 */
export interface StorageRead<T> {
  readonly value: T;
  readonly failure: StorageFailure | null;
}

/** The outcome of a write. There is nothing to return but what went wrong. */
export interface StorageWrite {
  readonly failure: StorageFailure | null;
}

/**
 * The task document, read and written whole.
 *
 * The whole document per mutation is AD-6's accepted cost: FR-12–FR-15
 * recompute from every non-archived Task on every render, so all Tasks are in
 * memory anyway and a per-Task write would buy nothing. The cost is bounded by
 * FR-8's performance test against a Fixture-sized document, so the trade is
 * audited rather than merely accepted.
 *
 * `schemaVersion` does not appear in either signature. It is in the bytes and
 * only the adapter ever sees it (AD-6), which is why this port speaks in Tasks.
 */
export interface TaskStorage {
  readTasks(): StorageRead<readonly Task[]>;
  writeTasks(tasks: readonly Task[]): StorageWrite;
}
