# Project Context utsatt til etter Story 1.1

## 2026-11-24 kl. 18:07 — Shyam Chandra K C

### Oppgave
`/bmad-help`: orientering om hvor prosjektet står i BMad-arbeidsflyten, og deretter
avgjørelse om `bmad-project-context` (`[PC]`) skulle kjøres nå. Brukeren ba eksplisitt om
at PC bare skulle kjøres «hvis det er nødvendig» — ellers ingenting.

### Plan
- Les `_bmad/_config/bmad-help.csv`, `_bmad/config.toml` og `_bmad/custom/config.toml`
  (output_folder er pinnet til `.docs`), og kartlegg hvilke artefakter som finnes.
- Les `.logs/shyam-chandra-k-c/issues.md` for å se hva som alt står åpent.
- Avgjør PC-spørsmålet på grunnlag av hva repoet faktisk inneholder, ikke på CSV-ens
  `required`-flagg alene.

### Resultat
Ingen endring i prosjektet — ingen skill kjørt, ingen artefakter skrevet.

**Posisjon i arbeidsflyten (BMad Method / bmm), verifisert mot disk:** `[CB]` brief,
`[RS]` deep recon, `[PRD]` PRD (status `draft`, OQ-1 umålt), `[CU]` UX (DESIGN.md +
EXPERIENCE.md, låst), `[CA]` arkitekturspine og `[CE]` epics/stories er fullført —
`epics.md` har alle fire stegene i `stepsCompleted` og er godkjent 2026-11-22 med 8 epics
og 38 stories. Neste påkrevde steg er `[SP]` `bmad-sprint-planning`;
`.docs/implementation-artifacts/` finnes ikke ennå.

**PC-beslutningen: nei, ikke nødvendig nå.** Repo-rota inneholder bare `_bmad`,
`CLAUDE.md`, `PRODUCT.md`, `README.md` og `.docs`. Det finnes ingen `package.json`,
`tsconfig`, `src/`, lockfil eller CI-arbeidsflyt; det eneste kjørbare er spike-harnessen
og diagram-generatoren, begge under `.docs`. `bmad-project-context` sin verdi er
verifiserte kommandoer (installer/test/lint/bygg), konvensjoner som avviker fra standard
og kjente fallgruver — ingen av dem eksisterer før **Story 1.1** oppretter substratet,
tokens og CI-arbeidsflyten. Kjørt nå ville AGENTS.md-blokka hatt tomme kommandofelt og
ellers gjentatt `ARCHITECTURE-SPINE.md` og `PRODUCT.md`, som `bmad-build` leser uansett.
Riktig tidspunkt er rett etter Story 1.1.

Det nyanserer det åpne punktet fra 2026-11-22 («verdien er størst før første byggeøkt»):
presist er det før *andre* byggeøkt — etter at 1.1 har gitt noe å beskrive. Punktet er
beholdt åpent i `issues.md` med den presiseringen lagt inn, siden `AGENTS.md` fortsatt
ikke finnes.

### Åpne punkter
- `[PC]` `bmad-project-context` skal kjøres rett etter Story 1.1, ikke før: først da finnes
  det verifiserbare kommandoer (installer/test/lint/bygg) og en CI-arbeidsflyt å beskrive.
  Ført som presisering på det eksisterende AGENTS.md-punktet i `issues.md`.
