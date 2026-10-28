# Suggestion-engine-research

## 2026-10-28 kl. 20:17 — Shyam Chandra K C

### Oppgave
Før PRD-en for To-Do-List skulle lages, ba brukeren først om forslag til research-/brainstorming-temaer, og deretter om å kjøre `bmad-deep-recon` for å avgjøre forslagsmotoren i v1 (regelbasert alene vs. regelbasert + valgfri sky-/lokal-AI med automatisk reserve ved manglende nøkkel) — det briefen selv kaller sitt "Open Decision Point". Separat ble det også startet (men ikke fullført) en konkurrentanalyse av Todoist/TickTick for å verifisere briefens egne påstander.

### Plan
- `bmad-help` først for å orientere om BMad-status (product brief ferdig, ingen PRD).
- Listet opp forsknings-/brainstorm-temaer; brukeren valgte forslagsmotor-spørsmålet.
- Kjørte `bmad-deep-recon` (technical, select-shape) med plan-gate: 4 kandidater — regelbasert alene, regelbasert+Claude API, regelbasert+OpenAI API, regelbasert+lokal nettleser-modell — breadth-first, standard preset, normal validation.
- Brukeren ba om å angre hele den første kjøringen (slettet alle filer, ingenting var committet).
- Startet konkurrentanalyse (Todoist/TickTick) — kun plan-gate presentert, ikke godkjent/kjørt.
- Brukeren ba i stedet om å kjøre forslagsmotor-researchen på nytt — samme godkjente plan ble gjenbrukt, ny kjøring fra bunnen (nye kilder siden webet søkes på nytt).
- Fullførte: 4 parallelle research-agenter → digests → research.md (executive summary, krav-rammeverk, kandidatscreen, bevis per kandidat, kryss-dimensjons-innsikt, beslutningsmatrise, verdict, åpne spørsmål, 33-kilde-appendiks, staleness-map) → sitatkontroll (ren) → research-briefing.html.

### Resultat
- Opprettet: `.docs/planning-artifacts/research/technical-suggestion-engine-selection-2026-10-28/` med `research.md`, `research-briefing.html`, `digests/` (4 filer) og `.memlog.md`.
- **Anbefaling i rapporten:** regelbasert klassifiserer som permanent reserve + valgfri Claude API (Haiku) som primærvei når nøkkel finnes; OpenAI API som nesten likeverdig alternativ; lokal nettleser-modell IKKE anbefalt for v1 (konkret, fortsatt åpen ONNX Runtime Web/Safari-WebGPU-krasjbug funnet, #26827/#33516); regelbasert alene IKKE anbefalt som hele svaret (dekker ikke karakterkravet om reell AI-bruk, jf. sensorens tilbakemelding).
- To reelle motsetninger i kildene ble rapportert som `disputed` (ikke gjennomsnittsberegnet): størrelsen på nøyaktighetsgapet regelbasert vs. ML, og Claude Haiku 5.5 sin responstid (0.7–1.0s vs. 9.6–13.4s hos ulike kilder).
- Konkurrentanalysen av Todoist/TickTick ble **ikke** fullført — kun plan-gate ble presentert før brukeren byttet fokus til forslagsmotor-researchen.
- Ingenting fra denne økten er committet ennå ved slutten av denne logg-seksjonen (committes og pushes som neste steg i samme økt).

### Åpne punkter
- Konkurrentanalysen av Todoist/TickTick (plan-gate presentert, ikke godkjent/kjørt) står fortsatt åpen hvis brukeren vil fortsette den.
- Forslagsmotor-rapportens egne "Open questions" bør følges opp før PRD-en låses: tidsmål en reell Claude Haiku 5.5-kall (responstiden er omstridt i kildene), bekreft gratis-kreditt-beløp og eksakt billigste OpenAI-modellnavn direkte hos leverandørene (modellnavn er i rask endring), og sjekk om Safari/iOS ONNX-buggen (#26827/#33516) er rettet hvis lokal-modell-sporet revurderes senere.
- PRD-en er ikke startet.
