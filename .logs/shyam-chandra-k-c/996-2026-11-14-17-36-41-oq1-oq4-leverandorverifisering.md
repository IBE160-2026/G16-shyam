# OQ-1/OQ-4 leverandørverifisering

## 2026-11-14 kl. 17:36 — Shyam Chandra K C

### Oppgave
Brukeren spurte hvilken modell/«model engine» som skal brukes for å lukke **OQ-1**, hva som
faktisk *bekrefter* leverandørvalget, og hva **OQ-4** (`.env.example` uten backend) betyr.
Ingen kodeendring — en avklaringsøkt som verifiserer PRD-ens antakelser mot primærkilden.

### Plan
- Les PRD §4.2, §8, §9, §12, §13 og `addendum.md` §1/§5 for å se hva som faktisk står åpent.
- Verifiser modellnavn, pris, effort og thinking mot offisiell Anthropic-dokumentasjon
  (ikke mot tredjepartskilder eller modellens egen hukommelse).
- Verifiser nettleser-headeren mot offisiell dokumentasjon — tidligere kun bekreftet via
  tredjeparts-repoer (åpent punkt fra [prd-to-do-list-v1](997-2026-11-01-13-37-39-prd-to-do-list-v1.md)).
- Forankrer seg i research-økten [suggestion-engine-research](999-2026-10-28-20-17-00-suggestion-engine-research.md).

### Resultat
Ingen filer endret i prosjektet. Følgende er verifisert mot `platform.claude.com/docs`:

**Modell og pris — PRD §4.2 og §8 står seg.**
- `claude-haiku-5-5` finnes, er «Latest», sluppet 2026-10-07, pensjonering tidligst 2026-10-07 + 1 år
  (2027-10-07) — godt forbi innleveringsfristen i desember 2026.
- Pris: **$0,10 / MTok inn og $0,50 / MTok ut for prompts opptil 100 000 tokens**; over det
  $0,50 / $2,50. «From»-prefikset i dokumentasjonen er en *kontekst*-terskel, ikke en effort-terskel.
  Appens prompts er små, så PRD §8s kostnadsanslag (~0,5–1 øre per 100 Tasks) holder.
- Posisjonert eksplisitt for «high-volume, latency-sensitive tasks such as classification,
  extraction, and routing» — nøyaktig Model Engine-bruken i FR-6.
- Merk: Haiku 5.5 bruker den nyere tokenizeren — samme tekst teller ca. **30 % flere tokens**
  enn på Haiku 4.5. Påvirker kostnadsanslaget marginalt, ikke konklusjonen.

**OQ-1 — latensmotsetningen har nå en forklaring, og en målbar oppskrift.**
- Haiku 5.5 støtter alle fem effort-nivåer; **default er `medium`, ikke laveste** (bekreftet —
  PRD/addendum hadde rett). `low` er dokumentert som «the cheapest and fastest level … for chat,
  short tool tasks, and simple, high-volume requests».
- Adaptiv thinking er **på som standard** og teller mot `max_tokens`.
- **OQ-2 er dermed besvart fra primærkilden:** thinking *kan* slås av på Haiku 5.5 med
  `thinking: {"type": "disabled"}` ved effort `high` eller lavere (400-feil ved `xhigh`/`max`).
- Spike-konfigurasjonen som skal tidsmåles: `model: "claude-haiku-5-5"`,
  `output_config: {effort: "low"}`, `thinking: {"type": "disabled"}`, lav `max_tokens`,
  structured output via `output_config.format`, og **ingen** `temperature`/`top_p`/`top_k`.
- Spriket 0,7–1,0 s vs. 9,6–13,4 s i research er konsistent med effort/thinking-aksen, ikke med
  modellvariasjon: de høye tallene svarer til default effort med thinking på.

**OQ-4 og nettlesertilgang — headeren er nå offisielt bekreftet.**
- Offisiell kilde: *Authentication → Browser-based applications*
  (`platform.claude.com/docs/en/manage-claude/authentication`). Headeren heter
  **`anthropic-dangerous-direct-browser-access: true`**, og TypeScript-SDK-en sender den når
  `dangerouslyAllowBrowser: true` settes. Dette lukker det åpne punktet fra 2026-11-01.
- **Ny risiko, ikke dekket i PRD-en:** organisasjoner med zero data retention (ZDR) eller
  Compliance API kan **ikke** kalle API-et fra nettleser i det hele tatt — gyldig nøkkel gir
  `401 authentication_error` med meldingen «CORS requests are not allowed for this Organization».
  Arves også fra en Claude Enterprise-moderorganisasjon. Dette er en *persistent* feil i
  FR-9-forstand og bør navngis i FR-11s statusmelding, ellers ser brukeren en vedvarende,
  uforklart fallback til Rule Engine.
- Dokumentasjonen bekrefter samtidig premisset bak OQ-4: anbefalingen er backend som holder
  nøkkelen; med BYO-nøkkel i nettleser finnes det ingen byggetidsvariabel å eksemplifisere.
  Anbefaling inn i arkitekturfasen: la `.env.example` dokumentere **kun** en Node-side
  `ANTHROPIC_API_KEY` for FR-20-harnessen / NFR-9-skjermbildet, uten `VITE_`-prefiks (et
  `VITE_`-prefiks ville bakt nøkkelen inn i bundelen), og la README dokumentere
  Settings-flyten (FR-17) som appens eneste nøkkelvei. Beslutningen tas i `bmad-architecture`.

**Ett reelt hull i OQ-1 som ikke er et faktaspørsmål:** PRD-en sier *at* latens skal måles, men
fastsetter ingen bestå-grense. Uten en terskel satt på forhånd er «leverandør bekreftet» ikke
falsifiserbart. Grensen bør settes før målingen kjøres.

### Åpne punkter
- OQ-1: sett en eksplisitt bestå-grense for Model Engine-latens (forslag: p50 under ~2,5 s ende-til-ende
  ved `effort: "low"` + thinking av) **før** spiken kjøres — ellers kan ikke OQ-1 lukkes etterprøvbart.
- FR-11/FR-9: legg til ZDR/Compliance-API-tilfellet (401 «CORS requests are not allowed for this
  Organization») som en navngitt persistent feilmodus i PRD-en.
- Oppdater `addendum.md` §1: headeren er nå bekreftet mot offisiell dokumentasjon, og konfidensnivået
  «medium-high / ikke bekreftet offisielt» kan heves.
- Vurder å notere i `addendum.md` §5 at Haiku 5.5s tokenizer teller ~30 % flere tokens enn Haiku 4.5
  for samme tekst, siden pris/latens-sammenligningen mot OpenAI-alternativet forutsetter tokenantall.
