/**
 * Constants the domain is defined by, in one place (AD-11, conventions).
 *
 * Nothing in this product reads runtime configuration: there is no `.env` the
 * app consults, no settings file, no feature flag. A number the domain depends
 * on therefore has exactly one home, and this is it — so a change to one is a
 * change to one line rather than a hunt through call sites.
 *
 * This story adds only what it needs. The retention window AD-7 computes
 * Archive from belongs here too and arrives with the story that reads it
 * (Epic 3's Archive, Epic 5's settable window); putting a 30 beside the schema
 * version now would be a constant with no reader, which is how a default drifts
 * away from the code that was supposed to honour it.
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
