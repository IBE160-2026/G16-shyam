/**
 * Identifiers enter the application here and nowhere else (AD-1, conventions).
 *
 * `core/` generates none — it is deterministic, and an identifier is the
 * clearest possible non-deterministic value — and neither does the store, which
 * receives this port rather than reaching for one. The browser gets
 * `adapters/id.ts`; a test injects a counter, which is what lets a test assert
 * on the Task it just created instead of hunting for the only row in the list.
 *
 * One operation, like the Clock port beside it. The shape is the same on
 * purpose: a port in this project is an interface with the single operation the
 * application actually needs, not a wrapper around an API.
 */
export interface Ids {
  /** A fresh identifier, unique for the lifetime of the stored document. */
  newId(): string;
}
