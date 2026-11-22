# Redaksjonell gjennomgang av PRD-en

## 2026-11-22 kl. 15:17 — Shyam Chandra K C

### Oppgave
Etter at beslutningsrunden for epics og stories var pushet (se
[991-beslutninger-for-epics](991-2026-11-22-13-08-52-beslutninger-for-epics.md)) ba brukeren om en
statusoversikt over BMad-løpet, og deretter at `bmad-review` skulle kjøres på PRD-en før CE — altså å
innfri det åpne punktet fra 2026-11-14 om at `bmad-prd` Finalize steg 2/3/5 aldri ble kjørt på de
endrede passasjene. Funnene skulle så anvendes i det omfanget brukeren valgte.

### Plan
- `/bmad-help`: lese `_bmad/_config/bmad-help.csv`, resolve config, og kartlegge hvilke artefakter som
  finnes mot hvilke steg som er påkrevd.
- `bmad-review lenses=structure,prose` på `prds/prd-To-Do-List-2026-10-31/prd.md`, avgrenset til
  passasjene endret 2026-11-14 og 2026-11-22 (§2.3, FR-10, FR-19, FR-20, §6.1, §6.3, §7, NFR-2, NFR-4,
  §12 OQ-1, §13 rad 19–26). Structure først, prose oppå dens funn, begge som subagenter.
- Legge fram funnene og la brukeren velge omfang før noe ble endret.
- Anvende valgt omfang i ett pass, med etterkontroll på at ingen krav eller fakta forsvant.
- Rammefila CE skal lese er uendret: `.docs/planning-artifacts/pre-ce-constraints-2026-11-22.md`.

### Resultat

**BMad-status (fra `/bmad-help`).** Brief, research, PRD, UX og arkitekturspine er på plass. Neste
påkrevde steg er **CE** (`bmad-create-epics-and-stories`) — ikke startet. `SP` (sprint planning) og
hele `ship`-fasen venter på CE; `.docs/implementation-artifacts/` finnes ikke ennå. At PRD-en står
`draft` blokkerer ikke CE: NFR-2 står provisorisk på 10 s, og rammefilas sjekklistepunkt 4 forbyr
nedstrøms arbeid å kalle verdien eller leverandøren verifisert.

**Gjennomgangen.** 13 structure-funn og 23 prose-funn (+3 små holdt igjen). Structure-linsen fant én
rot-årsak som bærer åtte av sine tretten funn: redigeringene 14. og 22. november skrev hver nye
beslutning **to ganger** — én §13-rad og ett avsnitt i kravet den berører — mens dokumentets egen
kontrakt (§0 og §13s ingress) sier at indeksen eier rasjonalet. Høyest verdi i prose-passet: §12 OQ-1s
Miss-kule hadde 10 s-leddet inne i «If both miss»-setningen, så det leste som betinget av at *begge*
leverandørene stryker — i strid med NFR-2 og §13 rad 21.

**Anvendt (brukerens valg: «rot-regelen + OQ-1» og US-stavemåte gjennomgående).** 18 endringer i
`prd.md`, 9 847 → 9 698 ord, 146 innsettinger / 105 slettinger:

- **§13 delt** i en indekstabell (26 rader, uendret nummerering) pluss `### 13.1 Decision notes` med
  åtte notater (rad 17, 19, 20, 22–26). Rad 19 og 24 var ~190-ords miniessays inne i én tabellcelle.
- **De åtte dupliseringene løst** etter rot-regelen — brødteksten beholder beslutningen og en peker,
  §13 beholder argumentet: §6.3s sluttavsnitt kuttet (AD-10-faktumet flyttet inn i notat 19), NFR-4
  trimmet til bredde + AA-gulv + `axe-core` + påstandsordlyd, NFR-2 komprimert, FR-15s tredje
  *Testable*-kule kuttet til én linje, FR-19s referansedato-blokker slått sammen, FR-10 fratatt tier og
  visuell vekt, FR-20s Prerequisite-avsnitt komprimert, §6.1 komprimert til omfangsgrensen.
- **§2.3** UJ-1s beslutningslogg-glose kuttet («he taps **Punch all**»), tempus rettet, undo-setningen
  omskrevet.
- **OQ-1s Miss-gren** omskrevet så 10 s gjelder hele grenen og «If both miss» står sist.
- **US-stavemåte**: `modelled`, `colour`×2, `honour`, `licence` → US; `labelled` og `labour` forsvant
  med de kuttede passasjene. Null britiske forekomster igjen i PRD-en.
- Prose-rettelser som landet i tekst jeg likevel rørte er med (SM-1s «floor»-setning og komma-splice,
  NFR-4s «only a subset», rad 24s komma og enhetsmellomrom, rad 19/20/23s grammatikk, FR-19s pronomen,
  FR-20s ordlyd samkjørt med SM-1).

**Etterkontroll.** Alle 23 FR, 10 NFR, 5 SM og 3 SM-C står igjen; 26 indeksrader; §13.1 har åtte
notater. Hvert faktum som ble flyttet er verifisert til stede på ny plass (4.5:1, bar ladder, AD-7,
AD-10, AD-15, SC 1.4.1, SC 2.5.8, `button-height`, `row-height-desktop`, «measured or verified»,
Sunday-tilfellet, 10 %-rubrikken). Alt NFR-4 mistet er bekreftet dekket i `EXPERIENCE.md` (linje
164–165, 180) og `DESIGN.md` (linje 218–220) — ingen UX-dokumenter er endret. Eksterne referanser til
«§13 item N» i spinen, `addendum.md`, rammefila og `PRODUCT.md` holder, siden radnumrene er uendret.

**Ikke committet.** `prd.md` står endret i arbeidstreet.

Lukker det åpne punktet fra 2026-11-14 om `bmad-review lenses=structure,prose` på PRD-endringene.

### Åpne punkter
- Structure-funn 5: §12 OQ-1 bør løftes til `### 12.1` og *What is timed* + *Spike configuration* +
  bestå-grensen (~165 ord) flyttes til `spikes/oq1-model-engine-latency/`, som §12 alt navngir. Bevisst
  utsatt — utenfor valgt omfang.
- Structure-funn 12: SM-1s rekkefølge (tallet først, så minimumsregelen, så Summary-unntaket). Bevisst
  utsatt.
- Tre små prose-funn holdt igjen: FR-10s «the others keeping their prior values until acted on»,
  §2.3 UJ-4s dinglende «having never waited on the Suggestion», og rad 26s subjektsbrudd (sistnevnte
  ble omskrevet i notat 26, så den er reelt sett løst).
- `EXPERIENCE.md` og `DESIGN.md` er britiske (`colour`) og kaller skillen under korrektur-kontrollene
  «a rule», mens PRD-en nå er US og sier «divider» (med kildehenvisning i notat 19 så referenten er
  utvetydig). Dokumentene er låst — avgjør om de skal normaliseres, eller om PRD-ens henvisning er nok.
