# Deferred work

Findings that review verified as real but routed out of the story that found them.
Append-only: entries are never edited or deduplicated.

- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: ErrorBoundary has no test of any kind, because the pinned stack has no DOM test environment.
  evidence: Nothing imports it but src/main.tsx; Vitest runs environment: 'node' over tests/unit only, and no jsdom, happy-dom or @testing-library is installed. Returning { failed: false } from getDerivedStateFromError passes every committed check. Story 1.4 extends the boundary per route and is the first point at which a route that can throw exists to drive it from the e2e suite.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: Eleven arbitrary pixel values in the three components route around the token system.
  evidence: The 1.2px block bound and the hairline repeat in four places; check-hex.mjs sees only colours, so nothing catches a non-colour magic number. Tokenising them adds @theme entries, which collides with AC 3's exact 43-token assertion - so it needs bmad-correct-course on DESIGN.md's token set, not a patch.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: check-hex.mjs is blind to rgb(), hsl() and oklch() colour notations.
  evidence: A component could write the reserved purple as rgb(142, 46, 126) and pass lint. Adding those patterns would also flag tests/e2e/first-run.spec.ts:20, where the rgb() spelling is legitimate, so the fix needs a scope rule (src/ui only, excluding tests) rather than another pattern.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: The CSP constrains later stories in two ways that are recorded nowhere.
  evidence: connect-src is exactly https://api.anthropic.com with no 'self', so any same-origin fetch from the document is blocked, and tests/e2e/first-run.spec.ts:93 locks the directive with exact equality - so Story 1.8's service worker will fail both. style-src 'self' with no 'unsafe-inline' forbids React style={{...}} attributes anywhere in the UI.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: engines admits odd-numbered Node majors above 26.
  evidence: >=26.0.0 lets 27 and 29 through, which is the opposite of the stated reason for excluding 23 and 25. The string is required verbatim by the spine's Stack table, so narrowing it to ^26.0.0 is bmad-correct-course on AD-13/the Stack table rather than a code change.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  summary: README gives a grader no way to run the app, which is what AC 1 promises.
  evidence: README.md is 9 lines and never mentions Node, npm ci or npm run dev; the only thing that communicates the supported range is an EBADENGINE failure. Epic 5 owns the full README, so a five-line Prerequisites/Run block belongs there.
- source_spec: `.docs/implementation-artifacts/spec-1-1-run-the-app-from-a-clean-clone.md`
  target_story: 1.3 — See the due date the date word named
  summary: today is read once at module load, so a tab left open past local midnight resolves date words against yesterday.
  evidence: src/main.tsx calls systemClock.today() once at module scope and passes the string down (verified at  commit 2cdf292, carried unchanged through the 1.1 merge 454fc36). In Story 1.1 this is cosmetic - only the header  label goes stale. In Story 1.3 it becomes a correctness defect that persists a wrong value: today IS the reference  date that AC 2 resolves 'today'/'tomorrow'/'next week' against and that AC 3 compares a weekday name to, so after  midnight 'Friday' parses to a dueDate one week off and is stored. Routed to 1.3 rather than 1.2 because 1.3 already  owns reference-date semantics (AC 2, AC 3) and Clock-port discipline (AC 7), so the fix fits its existing criteria;  adding clock refresh to 1.2 would expand scope beyond all seven of its ACs. Fix shape: hold today in app state and  re-read the Clock port on visibilitychange plus a timer that fires at the next local midnight - the port and adapter  already exist and need no change. Review graded this low for 1.1 and rejected it there with this note; it is not a  new finding.
