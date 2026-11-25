# Correct Course — seks mekanismefunn i godkjente dokumenter

## 2026-11-25 kl. 12:01 — Shyam Chandra K C

### Oppgave
`/bmad-help` for å stedfeste hvor prosjektet står, deretter rette de fem dokumentfunnene som
overlevde angringen av Story 1.1 (logg `984`) før bygget starter. Brukeren valgte batch-modus med
tre bindinger: **minimum nødvendige rettelser**, bevar alle godkjente krav / arkitekturvedtak / UX /
omfang / toolchain-versjoner, og ikke gjenåpne urelaterte beslutninger. Underveis krevde brukeren
**empirisk verifisering** av at `engine-strict=true` virker med prosjektets Node-versjon før
godkjenning.

### Plan
- `bmad-help`: lese `bmad-help.csv`, `resolve_config.py`, artefaktene og `.logs/` — konklusjon:
  planlegging ferdig (brief, PRD, UX, spine, epics, sprint planning), `ship` ikke startet.
- `bmad-correct-course` i batch: laste PRD, `epics.md`, spine, `DESIGN.md`; kjøre
  `checklist.md` seksjon 1–6; skrive Sprint Change Proposal.
- Rev 1 på brukerens forespørsel: måle `engine-strict` mot den pinnede stacken i stedet for å
  resonnere om den.
- Etter godkjenning: anvende, validere, lukke workflowen.

Proposal-dokument: `.docs/planning-artifacts/sprint-change-proposal-2026-11-25.md` (Rev 1, inneholder
alle 13 redigeringer med OLD/NEW, begrunnelse per endring, sjekklistejournal og valideringsjournal).

### Resultat

**Alle 13 redigeringer anvendt. 3 filer, 54 innsettinger, 18 slettinger. Ikke committet** — proposal,
loggen og `issues.md` er det eneste som committes her; de tre dokumentendringene står ukommittert slik
brukeren selv kan se dem over.

**Diagnosen, som er verdt å beholde:** fire av seks funn er samme defekt-klasse — **et AD navngir et
utfall uten å navngi mekanismen**. Beredskapsporten 24. nov stilte ett spørsmål («kan en utvikler
implementere dette uten å finne opp beslutninger som ingenting dokumenterer?») og svarte PASS
*korrekt*. Funnene svarer på et spørsmål ingen port i planleggingsfasen stiller: *er den dokumenterte
beslutningen utførbar som skrevet?* Det kan bare stilles av den første som må bytte ordet
«mechanically» mot et filnavn og et flagg. Ingenting råtnet mellom 24. og 25. november.

**De seks funnene og hva som ble nedfelt:**

| # | Funn | Rettet i |
|---|---|---|
| 1 | `engines` **advarer** bare (`EBADENGINE`) — utfallet «a clear message, not a mystery failure» var uoppnåelig | spine Stack-note + Seed: `.npmrc` med `engine-strict=true` |
| 2 | fire av `DESIGN.md`s 43 tokens er ranges/nøkkelord, ikke lengder → UX-DR1 og AC 3 uoppfyllelige | `DESIGN.md` frontmatter + `epics.md` UX-DR1 |
| 3 | AD-11 sa ikke *hvor* CSP-en håndheves; meta-tagg knekker `npm run dev` | AD-11: `transformIndexHtml` med `apply: 'build'` |
| 4 | AD-18s hex-regel: ESLint 10 leser ikke `.css` uten språkplugin | AD-18: `scripts/check-hex.mjs` inne i `npm run lint` |
| 5 | AD-11 navngav ikke `tnum`-flagget, og computed style kan ikke vitne om egen svikt | AD-11: `--layout-features=+tnum`, bevis = GSUB-tabellen |
| 6 | Story 1.1 AC 1 «Node 22.12 **or later**» mot spinens «23 og 25 unsupported» | `epics.md` AC 1 |

**Funn 1b — det viktigste resultatet av brukerens verifiseringskrav.** `eslint@10.15.0` (en godkjent
pin) erklærer `engines: ^20.19.0 || ^22.13.0 || >=24`. **Node 22.12.0 oppfyller den ikke.** Det
godkjente gulvet var altså aldri nåbart med den godkjente lint-kjeden, uavhengig av `engine-strict`.
Beregnet snitt over alle 18 pakker: 22.12 FAIL (`eslint`) · 22.13 ok · 23 FAIL (`vitest`, `eslint`) ·
24 ok · 25 FAIL (`vitest`) · 26.12.1 ok. Spinens utelukkelse av 23 og 25 er **bekreftet riktig**;
bare 22-gulvet var feil, med én minor-versjon.

Den eksakte rangen, nå nedfelt tre steder (spine Stack-rad, spine Stack-note, `epics.md` linje 101)
og i AC 1: **`^22.13.0 || ^24.0.0 || >=26.0.0`**. `.nvmrc` = `26` (spinens egen anbefaling), og AD-19
velger CI-ens Node med `node-version-file: .nvmrc` — CI trenger ingen egen `engine-strict`, siden
`.npmrc` er committet.

**Opprinnelsen er sporbar og ble bevisst ikke «rettet»:** `architecture-.../.memlog.md` linje 41
inneholder eslints `^22.13.0` fra 18. november; linje 42 utleder gulvet fra Vite og Vitest alene, og
`reviews/review-tech-currency.md` §5 snitter `typescript-eslint` mot gulvet men aldri `eslint` selv.
Tallet kom fra et ufullstendig snitt. `.memlog.md` og review-fila er **urørt** — de er daterte
prosess-spor, og å redigere dem ville falsifisert sporet som forklarer funn 1b.

**Empirisk verifisering, 2026-11-25, Node 26.12.1 / npm 11.20.0:**
- Reell `npm install` av alle 18 pinnede pakker med `engine-strict=true`: **473 pakker, null
  `EBADENGINE`**. Ingen pinnet eller transitiv avhengighet har en øvre grense som utelukker Node 26.
  Rev 0s vaktpunkt om transitive grenser er dermed **lukket, ikke båret videre**.
- Mekanismen bekreftet i begge retninger med identisk `package.json`: **med** `.npmrc` →
  `npm error code EBADENGINE … notsup Not compatible`, **0 pakker installert**. **Uten** →
  `npm warn EBADENGINE`, installerte likevel.

**Designvalget som holder tallet 43 i ro:** de fire range-tokenene deklareres som `-min`/`-max`-par,
og **et par teller som ett token**. `16 colour, 13 typography, 3 radius, 11 spacing = 43` står dermed
urørt i AD-18, UX-DR1 og AC 3. Alternativet — å telle om til 47 — ville tvunget redigering av fire
godkjente tall. Verifisert ved å regne inventaret ut av frontmatteren på nytt: typography 14
properties → 13 tokens, spacing 14 → 11. `uppercase` mistet ingenting: `DESIGN.md`s Typography-seksjon
sa allerede «Barlow Condensed 700, uppercase and tracked `0.6–1.5px`».

**Hex-skanneren ligger inne i `lint`,** ikke som egen CI-jobb. Det er bevisst: det holder Story 1.1
AC 4s fem navngitte sjekker på fem, så AC 4 og AD-19s sjekkliste slapp å røres.

**Sju konsistenssjekker — alle passerer.** (1) 16/13/3/11 identisk i spine, `DESIGN.md`, `epics.md`.
(2) ingen dokument hevder at `index.html` bærer en CSP-tagg — eneste forekomst er negasjonen.
(3) ingen rest av `22.12` i noe normativt dokument. (4) rangen ordrett 3× i spine, 2× i `epics.md`.
(5) token-inventaret regnet ut på nytt = 43. (6) `.nvmrc`-verdien `26` navngitt én gang normativt;
AD-19 refererer fila uten å gjenta tallet. (7) alle 18 pinnede versjoner byte-identiske — eneste
versjonsstreng i en endret linje er `eslint@10.15.0`, nå sitert som *årsaken* til gulvet, ikke
re-pinnet. Story 5.1 AC 2 løser fortsatt gulvet ved referanse og trengte ingen endring.

**Urørt:** `prd.md` (ingen FR/NFR/SM/tier berørt, ingen §13-rad lagt til — proposalet er sporet),
`EXPERIENCE.md`, `sprint-status.yaml` (ingen epic/story lagt til, fjernet eller omnummerert — altså
sjekklistepunkt 6.4 = N/A), tier-strukturen, alle 38 stories, `typescript@6.0.3`.

Klassifisering: **Minor** → direkte implementering, ingen backlog-omorganisering, ingen PM/Arkitekt-
eskalering. `workflow.on_complete` er tom.

### Åpne punkter
- `ARCHITECTURE-SPINE.md`, `DESIGN.md` og `epics.md` har ukommitterte endringer fra denne økten;
  arbeidstreet er ellers rent. (Faktum, ikke oppgave — brukeren committer og pusher selv.)
- Arbeidstreet er uniformt **CRLF**, mens `.gitattributes` erklærer `* text=auto eol=lf` for *både*
  repo og arbeidstre (commit `8b58459`). Git normaliserer til LF ved commit, så repoet blir riktig,
  men arbeidstreet matcher ikke erklæringen. `git add --renormalize .` retter det. Forhåndseksisterende,
  urelatert til denne økten.
- `.npmrc`s `engine-strict=true` gjelder også *avhengigheters* `engines`. Hvis en framtidig
  `npm install` av en **ny** avhengighet drar inn en transitiv øvre grense, feiler installasjonen i
  stedet for å advare. Det er portens hensikt, låsefila er committet med eksakte versjoner (AD-19), og
  ingen ny avhengighet er planlagt — men vit hvorfor det skjer hvis det skjer.
- De fem dokumentfunnene fra logg `984` er nå nedfelt og lukkes der. **Story 1.1 kan bygges på nytt**;
  de tre CHECKPOINT 1-beslutningene fra 25. nov står fortsatt (prosa-førstegangsflate, gren
  `story/1-1-clean-clone`, full spec framfor delt).
- Neste steg i rekkefølge: `bmad-project-context` (AGENTS.md finnes ikke i repoet; utsatt 24. nov),
  deretter `bmad-build` på Story 1.1.
- `ux-To-Do-List-2026-11-16/mydecisions.md` er fortsatt en tom **katalog** som ikke lar seg slette;
  låst av en annen prosess. Lukk mappa i VS Code og slett den. (Uendret fra logg `984`.)

## 2026-11-25 kl. 12:45 — Shyam Chandra K C

### Oppgave
Fortsettelse samme økt. Etter at Correct Course var committet og pushet: kjøre
`bmad-project-context`. Brukeren avviste `AGENTS.md` («læreren bruker den også») og valgte i stedet
at blokka legges i den eksisterende `CLAUDE.md`, med vilkåret «hvis det ikke ødelegger prosjekt».

### Plan
- Deteksjon: `adopt`, ikke `setup` — `CLAUDE.md` hadde reelt innhold (Sesjonslogg-regelen), så den
  er baseline og går i ledgeren. Brukerens oppgitte intent ble flagget, ikke stilltiende fulgt.
- Greenfield: kommandoer skrives som eksplisitte TODO-er som navngir den besluttede stacken, aldri
  som gjettede påkallinger.
- Sti-sjekke hver påstand i blokka før skriving.

### Resultat

**Correct Course committet og pushet** som `a276dc7` (4 filer, 634 innsettinger — 580 av dem er
proposalet). `8b58459..a276dc7`. Treet er rent og i sync med `origin/main`.

**18 linjer project context lagt i `CLAUDE.md`** mellom `bmad:context`-markørene (linje 5–60).
Sesjonslogg-regelen står urørt **utenfor** markørene — ledger-beslutning `retain`, fordi managed
block erstattes ved refresh og regelen da ville vært i skillens varetekt i stedet for brukerens.
Provenance: `Verified 2026-11-25 against 95ba588`. Alle åtte stier blokka nevner er sti-sjekket.
**Ikke committet** — `bmad-project-context` committer aldri.

Seksjoner: Orientation · Policy (frosne dokumenter, branch-regel `story/<epic>-<story>-<slug>` →
`main`, nøkkel-forbudet) · Where things are (fire pekere) · Running and verifying (`uv --python`-
påkallingen + npm-TODO) · Conventions (`.logs/` norsk vs. engelske leveranser, AD-1s renhetsregel) ·
Known pitfalls (CRLF mot `eol=lf`).

**Bevisst utelatt:** gjettede npm-kommandoer, repo-oversikt/katalogtre/stack-liste (utledes ferskere
direkte), gjentakelse av AD-10s tier-regler, og IBE160-emnekrav — brukeren svarte ikke på det
spørsmålet, så ingen ble skrevet. Én justering mot forslaget brukeren så: «implementation has not
started» strøket, fordi den råtner idet Story 1.1 lander.

To linjer bærer sin egen utløpsdato: AD-1-linja («this line goes once that check is live», Story 1.1
AC 5) og npm-TODO-en. Begge forsvinner ved første `refresh` etter Story 1.1.

**Funnet, ikke rettet:** `PRODUCT.md` linje 20–21 sier stacken er `[OPEN]` og at arkitekturfasen
«has not run». Den kjørte 18. november, og `DESIGN.md` lister `PRODUCT.md` som kilde. Brukeren
godkjente ingen rettelse, så fila er urørt — i stedet advarer blokka om den under *Where things are*.
Tilbudet om å rette seksjonen står.

### Åpne punkter
- `CLAUDE.md`s blokk er **ukommittert**; brukeren ser over og committer selv.
- `PRODUCT.md`s Stack-seksjon er foreldet (sier arkitekturfasen ikke har kjørt). Blokka advarer om
  den, men fila er ikke rettet — avgjør om seksjonen skal oppdateres.
- `CLAUDE.md`s Sesjonslogg-regel slutter med «Gruppens egne regler for commit og språk gjelder foran
  dette». Prosjektet er solo, så klausulen viker for noe som ikke finnes. Foreslått strøket; brukeren
  svarte ikke, så den står (sletting krever hans ord).
- Første `refresh` etter Story 1.1 må verifisere npm-kommandoene og fjerne AD-1-linja hvis
  lint-regelen fra AC 5 er på plass.
- Ingen `goal`-kommando finnes installert i repoet — søkt i `bmad-help.csv`, skill-katalogene og
  etter `.claude/commands/`. Brukeren har nevnt den to ganger; avklar hva den sikter til.
