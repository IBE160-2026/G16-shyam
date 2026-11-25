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
