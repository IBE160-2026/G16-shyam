## Sesjonslogg

Når en oppgave eller økt avsluttes, før sluttoppsummeringen, bruk `sesjonslogg`-skillen: dokumenter Oppgave + Plan + Resultat + åpne punkter i `.logs/<bruker>/`, og før åpne punkter i `.logs/<bruker>/issues.md`. Skillen committer loggfila lokalt; push gjør du selv. Gruppens egne regler for commit og språk gjelder foran dette.

<!-- bmad:context -->
<!-- Verified 2026-11-25 against 95ba588. Managed by bmad-project-context; edits inside this
     block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## To-Do-List

Solo student project for IBE160 at Høgskolen i Molde, autumn 2026: a responsive PWA that turns one
typed sentence into a Task, with a rule-based and a model-based Suggestion Engine behind one port.
No backend, browser-local storage. Planning is complete and lives in `.docs/planning-artifacts/`.

## Policy

- Never edit `prd.md`, `ARCHITECTURE-SPINE.md`, `epics.md`, `DESIGN.md` or `EXPERIENCE.md` —
  approved and locked. A defect in one goes through `bmad-correct-course`, which records the change;
  `.docs/planning-artifacts/sprint-change-proposal-2026-11-25.md` is the worked example.
- Code lands on a `story/<epic>-<story>-<slug>` branch and merges to `main` only when the story is
  done — `main` must run at every commit, which is what SM-2 is measured against.
- Never commit a real API key. The app's key is entered in Settings at runtime; `.env.example`
  documents `ANTHROPIC_API_KEY` for the harness alone and the app never reads it.

## Where things are

- What to build next, and every story's status: `.docs/implementation-artifacts/sprint-status.yaml`
- Requirements in `prds/prd-To-Do-List-2026-10-31/prd.md` (23 FR, 10 NFR); decisions AD-1..AD-20 in
  `architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md`; 8 epics and 38 stories
  with acceptance criteria in `epics.md` — all under `.docs/planning-artifacts/`
- What past sessions did and what is still open: `.logs/shyam-chandra-k-c/` and its `issues.md`.
  Read these before reconstructing intent from code or git history.
- `PRODUCT.md`'s Stack section is stale — it says the architecture phase has not run. It ran
  2026-11-18; the spine is authoritative on the stack.

## Running and verifying

- Run BMad scripts that have dependencies as `uv run --python
  "C:/Users/sabis/AppData/Roaming/uv/python/cpython-3.12.14-windows-x86_64-none/python.exe" <script>`
  — bare `uv run` fails with "Failed to spawn: python" because the WindowsApps `python` alias is
  blocked by an Application Control policy.
- TODO, verify after Story 1.1: the npm scripts do not exist yet. The decided stack is Vite 8 +
  React 19 + TypeScript 6.0.3 on Node `^22.13.0 || ^24.0.0 || >=26.0.0`, installed with `npm ci`
  against a committed exact-version lockfile.

## Conventions that differ from defaults

- `.logs/` is Norwegian and is not a deliverable. Every grader-facing artifact — README, UI strings,
  committed results, code comments — is English (`epics.md` constraints checklist, point 8).
- Nothing in `src/core/` may touch `window`, `document`, `localStorage`, `fetch`, `process`,
  `navigator`, `performance`, `crypto`, `Math.random`, React, a Vite-injected value, `Date.now()` or
  a zero-argument `new Date()` — it runs in both the browser and the Node harness (AD-1). Story 1.1
  AC 5 turns this into a lint failure; this line goes once that check is live.

## Known pitfalls

- The working tree is CRLF while `.gitattributes` declares `eol=lf`. Git normalises on commit, so
  never "fix" line endings inside a diff — `git add --renormalize .` is the only intended fix.

<!-- /bmad:context -->
