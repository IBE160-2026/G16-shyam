# OQ-1 spike-harness og repo-opprydding

## 2026-11-14 kl. 20:39 — Shyam Chandra K C

### Oppgave
Brukeren kjørte først `/bmad-help` for å se hvor i BMad-løpet prosjektet står, og ba deretter
om at **OQ-1-spiken skrives** — måleskriptet som lukker den siste latensblokkeringen i PRD-en.
Eksplisitt krav: skriptet skal **ikke** ligge under `G16-shyam`, siden den mappa sto som
utracket, og «hvis det er mulig å merge, gjør det».

### Plan
- Orienteringssvar fra `_bmad/_config/bmad-help.csv` + `resolve_config.py`, med fullført-status
  lest av faktiske artefakter i `.docs/planning-artifacts/`, `.logs/` og `issues.md`.
- Undersøk hva `G16-shyam` faktisk er før noe slettes: tracking-status, egen historikk,
  ustagede endringer, innholdsdiff mot ytre repo.
- Les `claude-api`-skillen før kode skrives (API-formen for `output_config`, structured output
  og feilklasser skal ikke gjettes), og hent Suggestion-skjemaet fra FR-6/FR-7 og
  målereglene fra §12 OQ-1.
- Bygger på [oq1-oq4-leverandørverifisering](996-2026-11-14-17-36-41-oq1-oq4-leverandorverifisering.md)
  (bestå-grensen og spike-konfigurasjonen ble satt der) og
  [prd-to-do-list-v1](997-2026-11-01-13-37-39-prd-to-do-list-v1.md).

### Resultat

**BMad-status (ingen filendring).** Fullført: produktbrief, research, PRD. PRD-en står fortsatt
`draft` fordi OQ-1 ikke er målt. Ikke gjort: UX, arkitektur, epics/stories, sprintplanlegging,
build. Neste påkrevde port er `bmad-architecture` (den eier OQ-4 og OQ-8), men den reelle
blokkeringen er OQ-1-målingen, som ikke er en BMad-skill.

**`G16-shyam` var ikke utracket — den var en gitlink.** Verifisert:
- Mappa er en **andre klone av samme remote** (`IBE160-2026/G16-shyam.git`) som lå inni
  arbeidskopien, med egen `.git`.
- Indre HEAD `a8b1fad` er **allerede i ytre `main`s historikk** (`merge-base --is-ancestor`),
  ingen stash, ingen ekstra brancher, ingen ustagede endringer.
- `brief.md` og `.memlog.md` i den indre klonen er de **eldre** versjonene; ytre `main` har
  nyere (+39 linjer). `.gitignore` og `README.md` er identiske — diffen var kun CRLF mot LF.
- Ytre `main` == `origin/main`, ren.
- Commit `beec72b` hadde registrert mappa som gitlink (`160000 a8b1fad G16-shyam`) **uten
  `.gitmodules`** — altså en uhellsvis committet embedded repo, som gir alle som kloner
  repoet en tom `G16-shyam/`-mappe.

Det var derfor ingenting å merge innholdsmessig: alt den indre klonen hadde, finnes i ytre
`main` i lik eller nyere versjon, og på `origin/main`. Gitlinken er fjernet fra indeksen
(`git rm --cached G16-shyam`) og mappa slettet. Sikkerhetskopi av den indre klonen ligger i
scratchpad-mappa for økten. **Ukommittert** — står som `D G16-shyam` i staging.

**OQ-1-spiken — ny mappe `.docs/planning-artifacts/spikes/oq1-model-engine-latency/`:**
- `oq1-latency-spike.mjs` (~22 kB) — måler det §12 OQ-1 ber om: veggklokke fra request til
  **parset, skjemagyldig Suggestion-objekt**, ikke time-to-first-token. Låst kallform:
  `claude-haiku-5-5`, `output_config.effort: "low"`, `thinking: {"type":"disabled"}`,
  structured output via `output_config.format`, `max_tokens: 300`, ingen sampling-parametre.
- Bestå-grense fra 996 er kodet inn: p50 ≤ 2500 ms og p95 ≤ 6000 ms, pluss null feilede kall.
  Skriptet skriver ut dom + konsekvens (NFR-2 = 6 s ved pass, OpenAI-nano-måling ved miss) og
  returnerer exit-kode 0/1/2.
- `maxRetries: 0` med begrunnelse — SDK-ens to standard retries ville ellers skjult ventetid
  inne i ett målt kall. Første kall forkastes som oppkoblingsstøy, slik OQ-1 krever.
  Nearest-rank persentiler. Default `--n=20`, ikke 10: p95 over 9 målinger *er* maksimum, så
  p95-halvdelen av grensa ville vært meningsløs.
- To armer: `spike` (OQ-1-konfigurasjonen, den eneste grensa gjelder for) og `default`
  (server-defaults for effort/thinking) — den andre gjør 996-forklaringen på
  0,7–1,0 s vs. 9,6–13,4 s om til et målt forholdstall.
- `--connection="..."`-flagg, siden OQ-1 krever at forbindelsen navngis sammen med resultatet;
  skriptet advarer når det mangler og lagrer det i JSON-en.
- Skriver tidsstemplet JSON til `results/` (den siterbare dokumentasjonen) og printer en
  ferdig Markdown-blokk til liming inn i PRD §12 og loggen.
- Feilhåndtering med SDK-ens typede klasser, mest spesifikke først, og ZDR/CORS-401-en
  klassifisert for seg.
- `README.md` — hva som måles og ikke, grensa og konsekvensene, kjøring (PowerShell/bash,
  `ant auth login` som alternativ), bevisste valg, **antakelser** og **forbehold**, og en
  sjekkliste over PRD-endringene som må til etter kjøring.
- `package.json` + `package-lock.json`. Versjonene er sjekket mot npm, ikke gjettet:
  `@anthropic-ai/sdk@1.8.0`, `zod@4.6.7`. `node_modules/` dekkes av rot-`.gitignore`.

**Verifisert:** `node --check` på skriptet, `npm install` kjørte, og `--dry-run --arm=both`
kjørte gjennom alle importene og `zodOutputFormat` og printet riktig request-form
(`output_config.format` → `{type: "json_schema", schema: {...}}`).
**Ikke verifisert:** selve målingen. Skriptet har aldri gjort et reelt API-kall — det krever
brukerens nøkkel. Alt under `.docs/planning-artifacts/spikes/` er utracket/ukommittert.

### Åpne punkter
- OQ-1: spike-skriptet er skrevet men **ikke kjørt**. Målingen gjenstår og gjelder fortsatt
  NFR-2s timeout, §13 punkt 12 og PRD-ens `draft`-status. Krever en nøkkel med kreditt;
  kjør med `--connection="..."` og `--arm=both`.
- FR-6/FR-21: bekreft at Model Engine skal bruke **samme fire tagger som FR-7**
  (`school`, `group`, `work`, `personal`). Skjemaet i spiken antar det, utledet av FR-6s
  «identisk output-form» + FR-21s «direkte sammenlignbar», men PRD-en sier det ikke for
  Model Engine. Er svaret nei, må skjemaet og FR-21s sammenligning tenkes om.
- FR-9: ZDR/Compliance-feilmodusen (401 «CORS requests are not allowed for this Organization»)
  kan **ikke** etterprøves fra Node — den er nettleser-spesifikk. En nøkkel som virker i spiken
  kan fortsatt feile i appen. Trenger en nettleserbasert sjekk; NFR-8s mock-tester er det som
  faktisk dekker den.
- Følg med på om `spike`-armen gir gjentatte `schema_validation_failed` mens `default`-armen
  ikke gjør det: da er Anthropics advarsel mot avslått thinking (lekkasje av interne tagger)
  funnet, ikke latens, og appen bør kjøre lav effort med thinking på i stedet.

## 2026-11-15 kl. 15:58 — Shyam Chandra K C

### Oppgave
Sjekke om OQ-1-harnesset faktisk er klart til å kjøre, og kjøre målingen mot bestå-grensen
(p50 ≤ 2,5 s / p95 ≤ 6 s) hvis en Anthropic-nøkkel med kreditt er trygt tilgjengelig. Brukeren
stilte samtidig et prinsipielt spørsmål: hvorfor må han som student kjøpe kreditt for å gjøre
PRD-en ferdig og komme videre til UX-design?

### Plan
- Verifiser harnessets kjøreklarhet: Node, installerte avhengigheter, SDK-flatene det bruker, og
  `--dry-run` (gratis, ingen API-kall).
- Verifiser mot *levende* dokumentasjon de påstandene harnesset selv ikke kan sjekke: modell-ID,
  pris og at kallformen er lovlig.
- Let etter legitim legitimasjon (env-variabler, `ant`-profil, `.env`).
- Besvar kjøp-spørsmålet med faktisk kostnad og med hva OQ-1 faktisk blokkerer i PRD-en.

### Resultat
**Harnesset er klart.** Node v26.7.0, `@anthropic-ai/sdk` 1.8.0 og `zod` 4.6.7 installert;
`zodOutputFormat` og `client.messages.parse` finnes begge; `--dry-run --arm=both` produserer
nøyaktig kallformen §12 fastsetter.

**Fire påstander verifisert mot platform.claude.com 2026-11-15** (alle holdt):

- `claude-haiku-5-5` er en reell modell, sluppet 2026-10-07, og fortsatt den nyeste Haiku-en —
  ikke forbigått av 5.5/5.2-bølgen (Opus 5.5, Sonnet 5.5, Fable 5.2 finnes nå).
- Pris $0,10 inn / $0,50 ut per MTok for prompts opp til 100 000 tokens — eksakt match med
  skriptets konstanter ($0,50/$2,50 over 100k, irrelevant ved ~200 tokens).
- `thinking: {"type": "disabled"}` **aksepteres på Haiku 5.5 ved effort `high` eller lavere**,
  400 ved `xhigh`/`max`. Spike-armens effort `low` er dermed lovlig — dette var den største
  usikkerheten, siden Claude Sonnet 5.5 avviser `disabled` og krever `between_tools` i stedet.
- Haiku 5.5s standard-effort er `medium`, og tokenizeren teller ~30 % mer enn Haiku 4.5. Begge
  bekrefter PRD-ens og addendum §5s ordlyd.

**Ny forbehold som harnesset er eldre enn:** med thinking av kan Haiku 5.5 hoppe over et
verktøykall den trenger når man samtidig ber om JSON-output. Spiken erklærer ingen verktøy, så
den biter ikke her, men den bør med før appen baserer seg på thinking-av i produksjon.

**Målingen ble ikke kjørt — ingen legitimasjon finnes.** `ANTHROPIC_API_KEY` og
`ANTHROPIC_AUTH_TOKEN` er usatt, `ant` er ikke installert, det finnes ingen `~/.anthropic`- eller
`~/.config/anthropic`-profil, og ingen `.env`. Skriptet ville gått ut med kode 2. Claude Codes
egen legitimasjon ble bevisst *ikke* brukt: et Claude-abonnement er ikke API-kreditt, og å
omdirigere den innloggingen til direkte Messages API-kall er ingen støttet vei.

**Svaret på kjøp-spørsmålet.** Kostnaden er ikke hindringen: ved ~200 tokens inn og ~50 ut koster
spike-armen ~$0,000045 per kall, og hele `--arm=both`-kjøringen ~$0,005 — rundt 5 øre.
Prissiden sier dessuten rett ut at «New users receive free credits to test the API»; beløpet er
upublisert, som er nøyaktig OQ-3, og kan sjekkes gratis i konsollen. Viktigere: OQ-1 blokkerer
*ikke* UX-design. Det tallet avgjør NFR-2s timeout (6 s vs. 10 s — og NFR-2 sier selv at den
«governs only how long a pending Suggestion stays pending»), leverandørvalget bak ett grensesnitt,
og PRD-ens `draft`-status. FR-8s ventetilstand er allerede fullt spesifisert uten tallet (100 ms,
pending-indikator, fortsatt redigerbar), NFR-3 unntar indikatoren eksplisitt, og OQ-4 er av §12
rutet til arkitektur, ikke til UX. Appen leveres og vurderes nøkkelfritt (§8, UJ-3). Det eneste
som faktisk krever en fungerende nøkkel er NFR-9s README-skjermbilde — ett kall, ikke en
benchmark — og det står allerede i `issues.md`.

Ingen filer endret i denne økten; kun lesing og dokumentasjonsoppslag.

### Åpne punkter
- OQ-3: sjekk gratis-kreditt-beløpet i `platform.claude.com/settings/billing`. Bekreftet at
  gratis kreditt *finnes* for nye kontoer, men beløpet er upublisert og må leses i konsollen.
- Harnessets README/skript kan oppdateres med at pris, modell-ID og `thinking: disabled`-støtte
  er re-verifisert 2026-11-15, og med det nye JSON-output-forbeholdet. Ikke gjort — avventer at
  brukeren velger OQ-1-vei først.
- Beslutningen om å starte UX-design før OQ-1 er målt står åpen hos brukeren; underlaget er at
  OQ-1 bare binder en timeout-konstant, ikke designet.
