# Story 1.2 — implementasjon, review, merge, og due-pillens fire tilstander

## 2026-11-26 kl. 01:20 — Shyam Chandra K C

### Oppgave
Implementer den godkjente Story 1.2-specen i en fersk `bmad-build`-sesjon, verifiser alt selv
framfor å stole på agentens rapport, merge til `main` når review passerte, og rydd deretter det ene
funnet som blokkerte en uovervåket kjøring av Story 1.3: due-pillens udefinerte behandling for en
dato senere enn denne uka.

### Plan
- `bmad-build` med specfila som eksplisitt argument → tidlig exit til steg 3, dispatch til
  kontekstfri subagent.
- Døm på diffen, ikke på rapporten. Kjør alle fem verifikasjonskommandoene selv.
- Tre review-lag parallelt, kjennelse på hvert funn, patch, re-verifiser, merge, push, sjekk CI.
- Løs due-pill-konflikten med `bmad-correct-course` — minste endring som bevarer godkjent UX.
- Specfil: `.docs/implementation-artifacts/spec-1-2-create-a-task-from-one-sentence.md`
  (`baseline_commit: ee904194840f8e29c5bfa6375c73f6a5d4acf884`)

### Resultat

**Story 1.2 er merget til `main` som `25081f5`, og GitHub-CI er grønn** — kjøring `45843787087`,
1 m 16 s, alle fem sjekker. Sprint-status: `1-2` → `done`, `epic-1` fortsatt `in-progress`.

Verifisert på det **mergede** treet fra slettet `node_modules`, før merge-commiten landet, fordi
`main` skal kjøre ved hver commit:

| Kommando | Resultat |
| --- | --- |
| `npm ci` | `added 472, audited 479`, ingen `EBADENGINE` |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | **165 tester / 10 filer** (var 142/9 før patchene) |
| `npm run build` | exit 0 |
| `npm run test:e2e` | **73 passerte** — 360 px, 1280 px og dev-serveren |
| `check-bundle-key dist` | exit 0 |

Alle sju AC verifisert mot `epics.md`, alle tolv matriserader dekket av tester som faktisk kjørte.

**Hva som ble bygget.** `core/task.ts` (Task, dokumentformen, total validator, den ene navngitte
defaults-fabrikken), `ports/storage.ts` + `adapters/local-storage.ts` (synkron port som aldri
kaster; eneste fil som navngir en nøkkel), `ports/id.ts` + `adapters/id.ts`, `app/store.tsx`
(`useReducer` + context, navngitte actions, eneste skriver), `ui/today/` med capture-feltet, og
`ui/components/Record` + `PriorityLadder`. Avkrysningsboks og setning tegnes inerte — 1.6 og 1.4
kobler dem.

**Review: 36 funn fra tre lag — 18 patchet, 3 utsatt, 13 avvist.** Ingenting rutet til `intent_gap`
eller `bad_spec`, så ingen loopback.

**Funnet som rettferdiggjorde hele review-runden:** capture-feltet mistet fokus etter den *aller
første* Tasken. `Today` returnerte `<FirstRun />` ved null Tasks, og `FirstRun` tegnet sitt eget
`<Capture />` — så første submit byttet hele subtreet og unmountet inputen brukeren nettopp hadde
skrevet i. `document.activeElement` ble `BODY`. På mobil lukkes tastaturet mellom Task én og to. To
lag fant det uavhengig, ett beviste det empirisk, og suiten var blind for det fordi fokus bare ble
assertet på whitespace-stien — som aldri krysser grenen. Dette var en direkte følge av den
antallsbaserte førstegangsflaten som ble godkjent ved CHECKPOINT 1, et sted ingen av oss så etter.

Fire andre med reell brodd: en origin som alt var på kvota fikk sitt lesbare dokument skjult bak
førstegangsflaten (probe-skrivingen feilet → adapteren returnerte `null`); Id-adapterens fallback er
nåbar på ren HTTP i LAN men unåbar under Playwright (localhost er secure context), så konstante
ider kunne shippet grønt; ingen test tegnet `high` eller `low`, så prioritetsstigen kunne shippet
invertert — tegnet *og* navngitt feil; og `unreadable`-grunnen ble slettet av første skriving, så
Settings kunne aldri fortalt brukeren at en backup fantes.

**Én avvisning verdt å nevne, fordi reviewerens fiks ville innført en bug:** submit-knappen bruker
`text-body`, som *ser* ut som en body-token på apparatus-tekst. `m1` tegner den etiketten på
10,5 px, og `--text-body` **er** 10,5 px-tokenet; `--text-apparatus` ville gitt 9 px og motsagt
rammen.

**Due-pill-konflikten er løst** — `sprint-change-proposal-2026-11-26.md`, commit `70b5e46`.
Konflikten var smalere enn den så ut: `DESIGN.md` sa bare «due date in the ink of its window» og var
*taus* om de to andre tilstandene, altså ikke uenig med `d1` i det hele tatt. Det eneste som motsa
rammen var parentesen i `epics.md`' UX-DR12, som ga «outlined» til ingen-dato-tilfellet. Målt i `d1`
mot `MON 16 NOV 2026`: oliven for forfalt, gult inne i uka, outlined for senere enn uka
(`MON 23 NOV`), em-dash når det ikke finnes dato. **To linjer endret, ingen piksler, ingen ramme
rørt.**

Samtidig rettet to Code Map-defekter i 1.2s spec som review fant men triage ikke fikk røre:
`main.tsx` sto under «Reuse as-is — do not change» mens en utførelsesoppgave krevde endringen, og
`constants.ts` ble kalt retention-defaultens hjem selv om fila bevisst ikke bærer den. Story 1.3
leser denne specen for kontinuitet, så de ville villedet.

**To avbrudd underveis, begge infrastruktur og ingen av dem kodefeil.** Implementasjonsagenten
stoppet først på en stream-watchdog-timeout (600 s uten framdrift) med alt kildekode på plass men
e2e-specen uskrevet, og patch-runden ble senere drept av sesjonsgrensen (HTTP 429) etter ett av 18
punkter. Begge ganger ble *samme* agent gjenopptatt med konteksten intakt framfor å starte en ny,
så ingenting ble bygget om. Andre gang ga jeg den en prioritetsrekkefølge, slik at det mest
verdifulle landet først hvis den ble kuttet igjen.

### Åpne punkter
- **Story 1.3 må konvertere Story 1.2s outlined `NO DUE DATE`-pill til em-dash.** 1.2 fulgte den
  gamle UX-DR12-raden, som ga outlined til ingen-dato-tilfellet. Ingen bruker har sett noen av
  variantene — produktet er ikke sluppet — så det rettes i 1.3, som eier due-pillen og rører
  komponenten uansett. Ført i `deferred-work.md`.
- Gjenstående beslutningspunkter per story, alle i `deferred-work.md` med `target_story`: **1.6**
  hvordan 46 px-radens to handlinger deles i to ≥24 px pekermål (1.4 bør ikke foregripe det);
  **1.7** at antallsbasert førstegangsflate bringer flaten tilbake når siste Task slettes, i spenn
  med UX-DR22; **1.8** at CSP-ens `connect-src` mangler `'self'` og at e2e-testen låser direktivet
  med eksakt likhet, som service workeren vil møte; **2.2** om `m2`s annotasjonslinjer er shippende
  copy eller rammekommentar.
- Tre nye fra 1.2s review, uten tildelt story: capture gir en skjermleserbruker ingen bekreftelse på
  at setningen ble en Task (EXPERIENCE.md-beslutning, og suiten asserterer i dag *ingen* live region
  selv etter suksess, som låser fiksen ute); førstegangsflaten viser to nesten identiske setninger
  ved 1280 px etter at capture-feltet kom inn; og `epics.md`' AC 4 og AC 6 kan ikke begge være
  bokstavelig sanne, siden AC 4 sier at den eneste nøkkelen som skrives er `todo.tasks.v1` mens AC 6
  krever en backup-nøkkel. Koden oppfyller begge intensjoner; ordlyden trenger
  `bmad-correct-course`.
- `npm audit`: fortsatt 4 moderate i `workbox-build`s transitive `glob`/`minimatch`; eneste tilbudte
  fiks nedgraderer en pinnet pakke.
- Vitest skriver nå en `ExperimentalWarning: localStorage is not available` fra Node under
  node-miljøet. Harmløs og fra Node, ikke fra koden, men ny støy i testutskriften.
