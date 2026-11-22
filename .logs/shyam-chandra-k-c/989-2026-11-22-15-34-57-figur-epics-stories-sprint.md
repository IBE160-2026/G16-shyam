# Figur: epics, stories og sprint planning

## 2026-11-22 kl. 15:35 — Shyam Chandra K C

### Oppgave
Etter den redaksjonelle gjennomgangen av PRD-en (se
[990-redaksjonell-gjennomgang-prd](990-2026-11-22-15-17-09-redaksjonell-gjennomgang-prd.md)) ba
brukeren om `/bmad-help`-status, og deretter om en SVG-figur som viser hvordan epics og stories henger
sammen — med sprint planning inkludert, og med vår egen app som eksempel — pluss en forklaring på
hvorfor CE-steget gjøres i det hele tatt.

### Plan
- `/bmad-help`: lese `_bmad/_config/bmad-help.csv`, resolve config, kartlegge artefakter mot påkrevde
  steg (samme kartlegging som i 990, bekreftet på nytt).
- Hente det reelle underlaget til figuren framfor å finne på et eksempel: PRD §4s featuregrupper
  (FR-1 – FR-23 fordelt på 4.1–4.6) og §6.3s tier-/kuttrekkefølge.
- Tegne figuren for hånd som selvstendig SVG (ingen bibliotek, ingen `<script>`/`<style>`), rendre den
  med headless Chrome og se på PNG-en for å fange tekstoverlapp før levering.

### Resultat

**BMad-status (uendret siden 990).** Brief, research, PRD (`draft`), UX (låst) og arkitekturspine er
på plass. Neste påkrevde steg er fortsatt **CE** (`bmad-create-epics-and-stories`) — ikke startet.
`.docs/implementation-artifacts/` finnes ikke, og det finnes ingen epics-, story- eller
sprint-status-fil noe sted i repoet.

**Ny fil:** `.docs/diagrams/epics-stories-sprint.svg` (ny mappe `.docs/diagrams/`). 1140 × 966,
`role="img"` med `aria-label` og `<title>`/`<desc>`, lys bakgrunn tegnet eksplisitt så den er lesbar
uansett tema den bygges inn i. Fem bånd ovenfra og ned:

1. De fire godkjente inngangene (PRD, DESIGN+EXPERIENCE, ARCHITECTURE-SPINE, `pre-ce-constraints`).
2. Seks **kandidat**-epics lest av PRD §4 med FR-spenn og tier-merke: E1 Task Management
   (FR-1 – FR-5, FR-23), E2 Rule Engine (FR-6 – FR-8, FR-10), E3 Smart Lists (FR-12 – FR-15),
   E4 Fixture (FR-19 – FR-21), E5 Cloud Engine (FR-9, FR-11, FR-17, FR-18), E6 Archive (FR-16, FR-22).
3. E3 forstørret til tre stories med akseptansekriterier, inkludert `blocked by S-4.1` for at
   Fixturen (FR-19) kommer før harness/plassering — §6.3s låste rekkefølge.
4. `sprint-status.md` som én tier-ordnet kø med status- og avhengighetskolonne.
5. `bmad-build` som konsumerer én story og skriver status tilbake — løkka tegnet med to piler.

Figuren er eksplisitt merket som illustrativ i bunnteksten: CE har ikke kjørt, så epic- og story-ID-ene
er kandidater lest av PRD §4 og §6.3, ikke den reelle inndelingen. Ingen krav, tier eller beslutning er
endret av dette arbeidet — ingen andre filer er rørt.

**Verifisert.** Rendret med headless Chrome til PNG og inspisert: ingen tekstoverlapp, alle bånd
innenfor `viewBox`. Én rettelse etter inspeksjonen: `⋮` i køens siste linje rendret som et løst
kolon og ble byttet til `…`.

### Åpne punkter
- Når `bmad-create-epics-and-stories` faktisk har kjørt: oppdater
  `.docs/diagrams/epics-stories-sprint.svg` til den reelle epic-/story-inndelingen, eller merk figuren
  tydelig som en metodeillustrasjon. Slik den står nå er inndelingen lest av PRD §4 og §6.3, ikke
  besluttet.
