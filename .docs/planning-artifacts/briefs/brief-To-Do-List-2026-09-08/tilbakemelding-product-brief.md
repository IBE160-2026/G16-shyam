# Tilbakemelding på product brief

| | |
|---|---|
| **Gruppe** | G16 – G16-shyam |
| **Product brief** | `.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/brief.md` (commit `ec0eed5`) |
| **Tilbakemelding fra** | Faglærer i IBE160 (utarbeidet med KI-støtte) |
| **Dato** | 2026-10-06 |

## Samlet vurdering

- **Godt utgangspunkt med justeringer.** Gruppen kan gå videre og innarbeide punktene under.

**Det som er bra:**

1. Briefen er ærlig og godt avgrenset. Dere sier rett ut at appen ikke skal konkurrere med Todoist eller TickTick, og dere har et tydelig prinsipp: «AI proposes, human disposes» – hvert forslag til tagger, prioritet og sammendrag vises og kan godtas, endres eller avvises.
2. Primærbrukeren «the multi-context juggler» er konkret beskrevet, med et tydelig mål: å åpne appen og se hva som haster i dag uten å ha sortert noe selv. Eksempelet «email the group about Thursday's meeting» gjør problemet lett å forstå.

**De viktigste endringene:**

1. Flytt valgfri konto, skysynk og deling av lister ut av v1. Det står i dag under «In scope for v1», men det krever backend, innlogging og konflikthåndtering. For et soloprosjekt er det den største risikoen i planen.
2. Avklar forslagsmotoren tidlig i PRD-en, og beskriv hvordan sensor kan kjøre appen uansett valg. Velger dere en sky-KI (OpenAI/Claude) i tillegg til regelmotoren, må appen fortsatt virke uten nøkkel, for eksempel ved at den regelbaserte motoren brukes når nøkkel mangler.
3. Erstatt brukersignalene «The default smart lists are the ones users actually open» og «under ~10 seconds» med kriterier som kan testes i emnet, for eksempel «oppgaven ‘Lever innlevering i IBE160 fredag’ får forslag om taggen skole og høy prioritet».

## Vanskelighetsgrad og gjennomførbarhet

### Vurdert vanskelighetsgrad

- **Enkel**

**Sammenlignbart med:** 6) To-do-liste med smarte etiketter (enkel). Briefen er i praksis dette forslaget, med tillegg av PWA/offline og valgfri synk og deling.

**Begrunnelse:**

| Faktor | Nivå (lav / middels / høy) | Kommentar |
|---|---|---|
| Domenelogikk – hvor mange og hvor kompliserte regler og beregninger må stemme? | Lav | Smarte lister (forfaller denne uken, høy prioritet, per tagg), arkivering etter 30 dager og regler for forslag. Oversiktlig og kontrollerbart. |
| Datamodell – antall entiteter og relasjoner mellom dem | Lav | Oppgave, prosjekt og tagg, med KI-metadata. Med deling kommer bruker og liste-tilgang i tillegg. |
| Brukere, roller og innlogging | Lav | Ingen innlogging i kjernen. Valgfri konto øker nivået til middels hvis den blir med i v1. |
| KI-funksjonalitet i appen, f.eks. kall til språkmodell, prompts i koden og håndtering av usikre svar | Lav | Regelbasert/nøkkelordbasert motor som standard. En eventuell språkmodell er åpen og blir ett avgrenset kall per oppgave. |
| Integrasjoner og eksterne tjenester, f.eks. API-er, betaling og e-post | Lav | Ingen i kjernen. En valgfri sky-KI og en synk-backend vil være integrasjoner. |
| Sanntid, samtidighet eller flere brukere som påvirker hverandre | Middels | Synk med «last-write-wins» og deling mellom klassekamerater gir samtidighet, selv uten sanntid. Lav hvis dette flyttes ut. |
| Filhåndtering, f.eks. opplasting, PDF-lesing og eksport | Lav | Ingen filhåndtering beskrevet. |
| Sikkerhet og personvern | Lav | Data lagres lokalt som standard, og personvernvalgene er gjennomtenkt i «Privacy Posture». |

**Hva vanskelighetsgraden betyr for dere:**

- _Enkel:_ Et enkelt prosjekt gir stor sjanse for å bli ferdig. Vanskelighetsgraden inngår likevel i vurderingen, så for å nå helt opp må dere vise mer i gjennomføringen. Det betyr særlig et gjennomarbeidet design, grundig testing av forslagsmotoren og de smarte listene, en tydelig dokumentert prosess og en README som virker. Vurder om én godt gjennomført utvidelse, for eksempel en valgfri språkmodell med reserve til regelmotoren, kan løfte prosjektet – i stedet for synk og deling.

### Gjennomførbarhet med BMAD og Claude Code

Dere skal planlegge med BMAD (product brief → PRD → arkitektur → epics og stories) og implementere med Claude Code. Vurderingen under tar hensyn til at det må være tid til hele denne flyten, og til testing, retting og README til slutt.

| Spørsmål | Vurdering (OK / risiko / stor risiko) | Kommentar |
|---|---|---|
| **Tid og omfang** – kan v1 realistisk bli ferdig og stabil i løpet av semesteret, med tid til flere iterasjoner? | Risiko | Den lokale kjernen (CRUD, forslag, smarte lister, arkivering) er godt innenfor rekkevidde for en gruppe på én person. Konto, skysynk og deling i samme v1 gjør at dere må bygge to apper: en lokal og en med backend. |
| **BMAD-flyten** – er briefen konkret nok til at PRD, arkitektur og stories kan lages uten store hull, og blir det overkommelig mange stories? | OK | Funksjoner og avgrensninger er tydelige. Den åpne beslutningen om forslagsmotor er riktig plassert i PRD-en. |
| **Egnet for Claude Code** – bruker løsningen en vanlig, godt dokumentert teknologistakk som Claude Code håndterer godt, eller krever den nisjeteknologi, spesialmaskinvare eller mye manuell konfigurasjon? | OK | En responsiv webapp med lokal lagring er godt egnet. PWA/offline og «one responsive app across web, desktop, mobile, and tablet» krever litt ekstra testing, men er vanlig teknologi. |
| **Kontroll på KI-ens arbeid** – kan gruppen selv avgjøre om koden gjør det riktige? Krever domenet kunnskap gruppen ikke har, f.eks. avanserte beregninger eller fagregler, så er det vanskelig å kvalitetssikre. | OK | Dere kan selv avgjøre om en oppgave fikk fornuftige tagger og riktig plass i en smart liste. Lag et fast sett med eksempeloppgaver og forventede forslag. |
| **Testbarhet** – finnes det tydelige regler og forventede resultater som tester kan skrives mot? | OK | Regelmotoren, filtrene for smarte lister og 30-dagers arkivering er svært godt egnet for automatiske tester. |
| **Kjørbar for sensor** – kan appen kjøres lokalt etter README, uten gruppens nøkler, betalte kontoer eller egen infrastruktur? | OK | Lokal-først uten innlogging er et stort pluss. Pass på at dette fortsatt gjelder hvis dere legger til sky-KI eller synk-backend. |
| **Avhengigheter og kostnader** – krever løsningen betalte API-er, f.eks. språkmodeller, og finnes det en plan for kostnad, testmodus eller mock-data? | Risiko | Ingen kostnad med regelmotoren. Velger dere en sky-modell, trengs plan for nøkkel, kostnad og reserveløsning. Det er åpent i dag. |

**Konklusjon om gjennomførbarhet:**

- **Gjennomførbart med justert omfang.** Se forslagene under.

**Forslag til justering av omfang eller vanskelighetsgrad:**

1. Definer v1 som én lokal webapp: CRUD, forslag med godta/endre/avvis, smarte lister og arkivering. Flytt valgfri konto, skysynk og listedeling til «Explicitly out of v1» eller et tydelig trinn 2.
2. Hvis dere vil løfte vanskelighetsgraden, velg heller én valgfri språkmodell for sammendrag og tagger, med regelmotoren som automatisk reserve når nøkkel mangler eller kallet feiler. Det er mer i tråd med kjerneideen enn synk.

## Hvorfor product brief er viktig for mappen

Product brief er utgangspunktet for PRD, arkitektur, stories og til slutt koden. Del 1 av mappen vurderes blant annet på om sensor kan følge en sporbar vei fra plan til ferdig app. Den vurderes også på om appen gjør det dere har beskrevet, om den er testet, om den er godt designet, og om den kan kjøres etter README. Et uklart, for stort eller for lite brief gjør alt dette vanskeligere senere. Det er mye enklere å rette nå enn sent i semesteret.

## 1. Gjennomgang av briefens deler

| Del av brief | Status | Kommentar |
|---|---|---|
| Executive Summary – er det klart hva appen er, og hvilket problem den løser? | OK | Klart og presist: oppgavehåndtering der KI foreslår tagger, prioritet og sammendrag, og der brukeren alltid bestemmer. |
| The Problem – er problemet konkret, med reelle situasjoner og brukere? | OK | Godt eksempel og en troverdig beskrivelse av hvorfor listen blir en «flat pile». |
| The Solution – beskriver løsningen brukeropplevelsen, ikke bare teknologi? | OK | Beskriver hva brukeren gjør og ser. Valget mellom regelmotor og modell er tydelig markert som åpent. |
| What Makes This Different – er vurderingen ærlig og realistisk? | OK | Ærlig om konkurrentene og med et forsvarbart standpunkt («suggestion-first»). |
| Who This Serves – er primærbrukerne tydelige, og vet vi hva de trenger? | Juster | Primærbrukeren er tydelig. Sekundærbrukeren (klassekamerater som deler liste) forutsetter synk og deling – vurder å flytte den til Vision sammen med funksjonene. |
| Success Criteria – kan kriteriene faktisk sjekkes eller testes? | Juster | Kursmålene er greie, men brukersignalene kan ikke måles i emnet. Legg til konkrete testbare kriterier for forslag, smarte lister og arkivering. |
| Scope – er det klart hva som er med i første versjon, og hva som ikke er det? | Endre | Tydelig inndeling, men v1 inneholder både lokal app, konto, skysynk, deling og flerplattform. Flytt konto/synk/deling ut, slik at v1 blir én tydelig kjerneflyt. |
| Vision – henger visjonen sammen med resten uten å blåse opp omfanget? | OK | Visjonen bygger videre på samme prinsipp og er tydelig skilt fra v1. |

## 2. Utgangspunkt for del 1 av mappen

Punktene følger kriteriene i sensorveiledningen for del 1. Vektene i parentes viser hvor mye hvert kriterium teller i del 1.

| Kriterium i del 1 | Hva briefen bør legge til rette for | Status | Kommentar |
|---|---|---|---|
| **1. Prosess og KI-styring** (30 %) | Brief som er presis nok til at PRD og stories kan bygges direkte på den, slik at krav kan spores fra brief til kode. | OK | Briefen er revidert én gang allerede. Fortsett med å dokumentere beslutningen om forslagsmotor med begrunnelse – det er godt prosessmateriale. |
| **2. Funksjonalitet og omfang** (20 %) | Realistisk omfang for gruppen og semesteret: en tydelig kjerneflyt som kan bli ferdig og stabil, og nok innhold til å vise reell funksjonalitet. | Juster | Kjerneflyten er tydelig. Omfanget blir realistisk når synk og deling flyttes ut. |
| **3. Kvalitetssikring og testing** (15 %) | Suksesskriterier og funksjoner som er konkrete nok til å bli testtilfeller. | Juster | Regelmotoren og smarte lister er svært testbare. Skriv kriteriene om slik at de peker direkte på testtilfeller. |
| **4. Design og brukeropplevelse** (10 %) | Tydelige brukere og brukssituasjoner som designet kan bygges rundt, gjerne med de viktigste skjermbildene eller flytene skissert. | OK | Rask registrering og gjennomgang av forslag er en tydelig flyt å designe rundt. Vis i UX-steget hvordan godta/endre/avvis ser ut på mobil og PC. |
| **5. Kodekvalitet og arkitektur** (10 %) | Teknologivalg som er begrunnet og ikke mer komplekse enn appen trenger. | Juster | Lokal-først er godt begrunnet. En valgfri backend for synk øker kompleksiteten mye – avvent den. |
| **6. README og kjørbarhet** (10 %) | Løsning som andre kan kjøre lokalt uten betalte kontoer, og uten tilgang til gruppens egne tjenester og nøkler. | OK | Ingen konto og ingen nettverk i kjernen gjør appen lett å kjøre for sensor. |
| **7. Ryddighet i repoet** (5 %) | En plan for hvor hemmeligheter, testdata og dokumentasjon skal ligge. | Juster | Ikke beskrevet. Planlegg `.env.example` og `.gitignore` hvis dere tar inn en sky-modell, og en fast fil med eksempeloppgaver til testing. |

## 3. Neste steg for gruppen

1. Flytt konto, skysynk og listedeling ut av v1 i Scope, og oppdater sekundærbrukeren tilsvarende.
2. Ta beslutningen om forslagsmotor i PRD-en: bare regelmotor, eller regelmotor pluss valgfri språkmodell med automatisk reserve. Skriv ned begrunnelsen.
3. Lag 10–15 eksempeloppgaver med forventede tagger, prioritet og smarte lister, og bruk dem som suksesskriterier og testtilfeller.

Oppdater product brief i repoet når dere har gjort endringene, slik at historikken viser hvordan planen utviklet seg. Det er en del av prosessen sensor ser etter.
