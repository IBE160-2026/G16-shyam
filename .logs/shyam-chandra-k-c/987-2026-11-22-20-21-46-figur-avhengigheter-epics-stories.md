# Figur: avhengigheter mellom alle epics og stories

## 2026-11-22 kl. 20:21 — Shyam Chandra K C

### Oppgave
Lage én komplett SVG-figur av alle åtte epics og alle 38 stories med avhengighetene mellom dem —
hvilke stories som må gjøres etter hvilke. Figuren skal leses av mennesker som planlegger bygget,
ikke bare illustrere arbeidsflyten slik
[989-figur-epics-stories-sprint](989-2026-11-22-15-34-57-figur-epics-stories-sprint.md) gjør.

### Plan
- Hente grunnlaget maskinelt ut av `.docs/planning-artifacts/epics.md`: alle `### Story`-overskrifter,
  alle `**Prerequisites:**`-linjer og alle `**Requirements:**`-linjer, så figuren ikke bygger på
  hukommelse.
- Legge grafen ut som en lagdelt DAG: én *bane* per epic (vannrett), én *kolonne* per
  avhengighetsdybde, slik at hver eneste pil peker mot høyre.
- Skrive en generator i Node framfor å tegne SVG-en for hånd, så geometrien blir eksakt og figuren
  kan regenereres hvis `epics.md` endres.
- Verifisere visuelt med headless Chrome, ikke bare i kildekoden.

### Resultat

**Ny fil: `.docs/diagrams/epics-stories-dependencies.svg`** — 1976 × 1852 px, 48 kB, håndskrevet
SVG uten `<script>` og `<style>`, med `role="img"`, `<title>`, `<desc>` og en `aria-label` som
beskriver grafen i prosa for skjermleser.

Innhold: 8 baner (epics) gruppert i tre tier-bånd, 38 story-bokser og **53 forutsetningspiler**.
Hver boks bærer story-id, hva den leverer, sitt ledende krav (FR/NFR/SM) og en `after …`-linje med
forutsetningene i tekst — så avhengigheten kan leses selv der en pil er vanskelig å følge.

Layout-grep som gjør grafen lesbar:
- **Kolonne = tidligste byggebølge.** Wave 0 … Wave 10. To stories i samme kolonne har ingen
  avhengighet seg imellom. Alle 53 pilene peker mot høyre — det er figurens egen kontroll av at
  `epics.md` ikke har en sirkulær eller bakovervendt forutsetning.
- **Kurve = inne i samme epic, skinne = på tvers av epics**, farget etter epicen pilen forlater.
- Loddrette strekk går bare i kolonne-mellomrommene og vannrette fellesstrekk bare i
  bane-mellomrommene, så ingen pil forsvinner bak en boks.
- Story 4.1 (Fixturen, FR-19) er uthevet som port: 4.2, 4.3, 4.4, 7.1 og 7.2 venter alle på den.

Det figuren gjør synlig, som tabellen i `epics.md` ikke gjør: Epic 6 henger bare i Story 2.6 og
starter allerede i wave 5, parallelt med Tier 1s slutt; Epic 7 er den eneste epicen som trenger to
røtter (harnessen *og* adapteren); Epic 8 har ingen utgående piler i det hele tatt — derfor er den
trygg å kutte først.

**Generator:** `gen-dag.mjs` (Node, ~420 linjer) med data, ruting og egne konsistenssjekker
(ingen boks-overlapp, ingen bakovervendt pil, hver skinne tildelt et spor). Den ligger foreløpig i
scratchpad, ikke i repoet — se åpne punkter.

**Verifisering:** rendret med headless Chrome i to bredder og inspisert; sjekkene i generatoren
rapporterer `checks: ok` for 38 noder og 53 kanter. Avhengighetene er lest direkte ut av
`epics.md`s 38 `**Prerequisites:**`-linjer, ikke gjenskapt.

**Ikke committet.** `epics-stories-dependencies.svg` står utracket i arbeidstreet.

### Åpne punkter
- Generatoren `gen-dag.mjs` ligger bare i scratchpad. Endres `epics.md`, må figuren enten
  regenereres fra et skript som ikke finnes i repoet lenger, eller tegnes på nytt. Vurder å legge
  den ved siden av SVG-en i `.docs/diagrams/`.
- Figuren er et øyeblikksbilde av `epics.md` slik den sto 2026-11-22. Den har ingen automatisk
  kobling til dokumentet, og ingen CI-sjekk oppdager at de kommer ut av takt.
