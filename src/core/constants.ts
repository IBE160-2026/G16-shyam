/**
 * Constants the domain is defined by, in one place (AD-11, conventions).
 *
 * Nothing in this product reads runtime configuration: there is no `.env` the
 * app consults, no settings file, no feature flag. A number the domain depends
 * on therefore has exactly one home, and this is it — so a change to one is a
 * change to one line rather than a hunt through call sites.
 *
 * Each story adds only what it needs: a constant with no reader is how a
 * default drifts away from the code that was supposed to honour it.
 */

/**
 * The version of the persisted task document (AD-6).
 *
 * Read and written **only** by `src/adapters/local-storage.ts`. Nothing else in
 * the application — not the store, not a surface — ever sees this field: the
 * adapter strips it on read and re-attaches it on write, which is what keeps
 * AD-6's "read and written only by the adapter" true by construction rather
 * than by review.
 *
 * It is bumped by one when a required field is added, renamed or changed, and
 * one `migrateNtoN+1` joins the adapter's ordered chain. Adding an *optional*
 * field whose absence is indistinguishable from its default does not bump it.
 */
export const TASK_SCHEMA_VERSION = 1;

/**
 * How many days a completed Task stays in the ordinary lists before it is
 * archived (FR-16, AD-7).
 *
 * **Archive is computed, never stored** — `completedAt !== null` and more than
 * this many days ago — so this number is read on every render and written
 * nowhere. `core/selectors.ts`'s `isArchived` takes it as an argument rather
 * than importing it, which is the whole of the forward compatibility that
 * design needs: Epic 3 makes the window configurable and Epic 8 exposes it in
 * Settings, and both supply the same parameter from the settings document
 * instead of from here. The predicate does not change.
 *
 * It is a constant and not a field on the task document because AD-6's defaults
 * factory covers the *settings* document, which does not exist until Epic 2 —
 * and a retention window stored per task document would be a second source of
 * truth for a value that is the same for every Task.
 */
export const DEFAULT_RETENTION_DAYS = 30;
