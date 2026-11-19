# Arkitekturspine To-Do-List

## 2026-11-19 kl. 05:42 — Shyam Chandra K C

> Økten gikk over midnatt. Alle artefakter er datert **2026-11-18**, da beslutningene ble tatt, og
> kjøremappa heter `architecture-To-Do-List-2026-11-18`. Bare denne loggen bærer 19.

### Oppgave

Kjøre `bmad-architecture` for To-Do-List v1. Brukeren pekte på
`.docs/planning-artifacts/architecture/technology.md` (oversikt over `pytagoras-website-v2`) som sin
**preferanse**, tilpasset dette prosjektet for MVP. Underveis: lukke PRD-ens OQ-4 og OQ-8, holde OQ-1
åpen til reell latensmåling, skrive en prosaseksjon til innleveringens README, og sikre at
arkitekturen bærer klare, testbare epics og stories. Ingen implementasjon.

### Plan

- Coaching-sporet (brukerens valg), tre runder med åpne spørsmål framfor ferdig utkast.
- Verifisere alle versjoner på nett før noe bindes — ikke fra treningsdata.
- Reviewer-gate: `lint_spine.py` + fem linser som parallelle subagenter.
- Skrive spinen til sist, destillert fra memloggen.

Spine: `.docs/planning-artifacts/architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md`
Memlogg (78 oppføringer, all begrunnelse): samme mappe, `.memlog.md`
Gate-rapporter: samme mappe, `reviews/` (fem filer)

### Resultat

**Preferansefila ble vurdert, ikke kopiert.** To tredjedeler av `technology.md` (FastAPI, Postgres,
Supabase, Redis, Caddy, Railway, betaling, auth, capability-tokens) er utelukket av PRD §8s harde krav
om at alt gradert skal kjøre uten backend — ikke av smak. Det som bar over: zero-config/mock-fallback,
nøkkellegenden fra §6, og frontend-kolonnen. Hvert punkt er argumentert **i spinen**, ikke bare i
memloggen, etter at en linse påpekte at fila bare var nevnt én gang.

**Arkitektur:** ports and adapters med ren kjerne. Driveren er at FR-20/FR-21 kjører regelmotoren,
datoparseren og Smart List-selektorene som en **Node-kommando** mens samme logikk tjener nettleseren —
kode som må kjøre i to runtimes kan ikke avhenge av noen av dem. `status: final`; AD-tallet og
lint-kjøringene står nederst, etter at gjennomgangen la til to AD-er.

**Lukket i PRD:**
- **OQ-8 → `localStorage`, synkron port.** §9s avveining «størrelsesgrense mot kostnaden ved å spørre
  Smart Lists» viste seg halvt oppkonstruert: FR-12–FR-15 regner fra alle ikke-arkiverte Tasks ved hver
  render og lagrer ingen medlemskap, så alt ligger i minnet uansett API, og IndexedDBs indekserte spørringer
  ville bli kjøpt og aldri brukt.
- **OQ-4 → to nøkler i to runtimes.** Appens nøkkel er kun runtime (Settings, på enheten, aldri i
  bundelen); harnessens nøkkel er en Node-miljøvariabel, og `.env.example` dokumenterer bare den.
- Skrevet tilbake til §0, §9, §12 og §13 rad 11/13. PRD-en står fortsatt `draft` — OQ-1 er ikke målt.

**Nye beslutninger brukeren tok 2026-11-18:** grensesnittspråk **engelsk**; Model Engine bruker
**FR-7s fire tagger**; fullført/arkivert **utledes** fra fullføringsdato. De to siste er ført som PRD
§13 rad 17 og 18, §3 er oppdatert, og `EXPERIENCE.md` + `decisions.md` er rettet (språkpunktet strøket,
Settings-microcopy «English — not yet decided» fjernet).

**Verifisert på nett 2026-11-18**, ikke fra hukommelse: vite 8.3.8, react 19.3.1, tailwindcss +
@tailwindcss/vite 4.3.5, @vitejs/plugin-react 6.3.0, zod 4.6.7, @anthropic-ai/sdk 1.10.0,
vite-plugin-pwa 2.0.0 (+ workbox-build/window 7.4.1 som **ikke-valgfrie** peers), vitest 5.1.1,
@playwright/test 1.65.1, @axe-core/playwright 4.14.0, eslint 10.15.0, typescript-eslint 8.73.0.

**TypeScript pinnet til 6.0.3, ikke registerets `latest` 7.0.2.** TS 7.0 ble GA 2026-07-08 (native
Go-kompilator) men har ingen stabil kompilator-API før 7.1, som fortsatt bare er `7.1.0-beta`.
`typescript-eslint@8.73.0` erklærer `typescript: ">=4.8.4 <6.1.0"` og lukket TS7-saken som «not
planned». Å ta `latest` ville kostet linting eller en dobbel verktøykjede tre uker før frist.

**Reviewer-gate — fem linser, verdikt 4× PASS WITH FINDINGS + 1× FAIL.** Den fant reelle feil:

- **Tre uavhengige linser fant samme selvmotsigelse**: AD-7 kalte `completedAt` et tidsstempel mens min
  egen konvensjonstabell kalte det en lokal kalenderdato — FR-16s 30-dagersgrense ville løst seg ulikt i
  to ulike stories. Løst strengere enn foreslått: **ingen tidspunkter i domenet**, alt er `LocalDate`,
  Clock-porten har én operasjon, `today(): LocalDate`.
- **To linser fant at «struck» ikke fantes i spinen i det hele tatt**, selv om både PRD FR-10 og låst UX
  krever at en avvist kontroll aldri foreslås på nytt for samme Task.
- AD-1 forbød `Date`-symbolet mens kjernen må parse datoer — regelen traff feil mål; nå forbys *ambient*
  tid (`Date.now()`, null-argument `new Date()`), ikke konstruktøren.
- AD-6 hadde ingen feilkontrakt: med «ingen feiltilstand i capture eller review, aldri» + ingen logging
  var standardlesningen **stille datatap**. Nå `StorageResult`, og et dokument som feiler validering
  kastes aldri — råstrengen bevares under en backup-nøkkel.
- Navigasjon, tilgjengelighet og Model Engine-kallformen var tre helt tause dimensjoner. PRD §4.2/§8
  krever laveste effort og thinking av — uten AD ville det naive kallet brutt både kostnadsgarantien og
  OQ-1s egen bestå-grense, siden Haiku 5.5 defaulter til `medium`.
- `crypto.randomUUID()` er secure-context-only, så den er `undefined` over `http://<LAN-IP>:5173` — den
  vanlige måten å åpne appen på en ekte telefon for NFR-4s 360px-krav — og samme origin nekter også
  service-worker-registrering.

**To egne feil korrigert:** jeg sa DESIGN.md har 36 fargetokens; den har **43 tokens, 16 av dem farger**.
Og første Stack-tabell var en versjonsliste, ikke et byggbart avhengighetssett.

**Arkitekturgjennomgangen fullført (etter brukerens instruks).** De fem linsene returnerte bare sine
2–5 viktigste funn i sammendraget; filene inneholder **55** til sammen (adversarial 10, reconcile-prd
15, reconcile-ux 19, rubric-walker 11). Toppfunnene var allerede lukket, halene ikke lest. Alle fem
rapporter er nå lest i sin helhet og hvert gjenstående funn er vurdert og lukket. Det viktigste
halen avdekket:

- **`.gitignore` manglet.** PRD §8 navngir den som *mekanismen* for hemmelighetsgarantien AD-8
  påstår — et bundet hardt krav som falt ut i destillasjonen. Nå i AD-8 og i skjelettet, sammen med
  en CI-grep etter nøkkelmønster i bygget.
- **AD-11 navnga aldri `anthropic-dangerous-direct-browser-access`.** Nettverks-AD-en utelot
  mekanismen som i det hele tatt gjør et nettleserkall lovlig, mens AD-4 nøye listet feller
  *nedstrøms* for et kall spinen aldri hadde slått fast kunne gjøres.
- **CI fantes bare som en etikett inne i et mermaid-diagram** — «suiten kjører uten nøkkel og uten
  nett» var ikke bindende noe sted. Nå AD-19, som også feiler bygget under SM-1-gulvet og låser
  `npm ci` mot committet lockfil med eksakte versjoner (en caret-range ville flytt `typescript`
  forbi AD-13 og stilltiende opphevet lintekjeden).
- **AD-20:** «ingen feiltilstand, aldri» + ingen logging gjør en ukontrollert render-feil til en
  hvit skjerm på sensors maskin. En error boundary per flate er gulvet under flyten, ikke en
  feiltilstand i den.
- AD-1 forbød `Math.random`/`crypto`/`process`/`navigator` — `Math.random` i regelmotoren ville brutt
  NFR-5, som er hele poenget med ordningen. AD-1s *Prevents* tilhørte dessuten AD-12.
- Angreknappen lå i vag «React state»; nå eksplisitt i reducer-state, slik at FR-10s fire testbare
  punkter forblir enhetstestbare i stedet for bare Playwright-synlige.
- Startrekanten betyr **to** ting i de to låste dokumentene (DESIGN: en kontroll står åpen;
  EXPERIENCE: et kurs settes). Spinen avstemmer dem nå eksplisitt.

Spinen har **20 AD-er**, `lint_spine.py` rein fire ganger. `tsx` verifisert til 4.23.15 før binding —
jeg var i ferd med å skrive 4.21.1 fra hukommelsen, andre nestenbom i økten på nøyaktig det
tech-currency-linsen finnes for.

**README-prosa:** `README-ARCHITECTURE-SECTION.md` i samme mappe, gjennom konfigurert `doc_standards`
(struktur- og prosalinse). Prosalinsens skarpeste funn: teksten brukte de interne UI-verbene «punched»
og «struck» til en sensor som aldri har møtt dem, når dokumentet selv hadde innført accept/edit/reject
i åpningssetningen. Rettet også en bøyd ASCII-figur og en relativ lenke som ville gitt 404 i README.

### Åpne punkter

- PRD §6.3 legger «Punch all»-snarveiene i Tier 3 («kutt disse først»), men UJ-1s klimaks er nettopp
  «he taps Punch all» og EXPERIENCE.md bygger reisens topp på det. To godkjente dokumenter er uenige;
  brukeren må velge — spurt to ganger, fortsatt ubesvart.
- WCAG 2.2 AA som forpliktet gulv, og om prioritet/motor-proveniens kan bæres av farge alene — de to
  gjenstående `[OPEN]`-punktene i PRODUCT.md.
- `README-ARCHITECTURE-SECTION.md` må limes inn i `README.md` med tre endringer: frontmatter bort, H1
  ned ett nivå, og lenka rettet — `./ARCHITECTURE-SPINE.md` gir 404 fra repo-rota.
- `README.md` er en sju-linjers norsk stubbe uten oppsett- eller kjøreinstruksjoner, mens PRD, DESIGN,
  EXPERIENCE og spinen er engelske. Språkvalg for README gjenstår, og NFR-7/SM-2 krever innholdet.
- TypeScript 6.0.3-pinningen skal revurderes hvis `typescript-eslint`s peer-range utvides før bygget
  starter — peer-rangen er signalet, ikke en release-note.
- OQ-1 er fortsatt åpen og PRD-en fortsatt `draft`; NFR-2s timeout leses fra én navngitt konstant, så
  tallet lander i én endring når målingen er gjort.
