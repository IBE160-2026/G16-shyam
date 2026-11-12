# Tilbakemelding på PRD

| | |
|---|---|
| **Gruppe** | G16 – G16-shyam |
| **PRD vurdert** | `.docs/planning-artifacts/prds/prd-To-Do-List-2026-10-31/prd.md` (status `final` i frontmatter, sist endret 2026-11-02, commit 0adfe77) |
| **Dato** | 2026-11-12 |
| **Type** | Formativ tilbakemelding, ikke karakter |

## 1. Samlet inntrykk

Dette er en uvanlig sterk PRD for et soloprosjekt: den har en tydelig tese («KI foreslår, brukeren bestemmer»), ærlig scope og en gjennomtenkt behandling av KI-kontroll, kostnad og testmodus. Risikoen ligger ikke i manglende substans, men i omfang og lengde (ca. 9 700 ord, 23 FR) og i at regelmotoren, som er den delen sensor faktisk kjører, ikke er konkret nok spesifisert til at Fixture og tester kan skrives uten gjetting.

## 2. Dette fungerer godt

- **KI-kontrollen er et krav, ikke en kommentar.** FR-9 lister hver feiltype (ingen nøkkel, offline, tidsavbrudd, ugyldig nøkkel, brukt opp kreditt), skiller mellom forbigående og vedvarende feil, og NFR-8 krever en automatisk test mot mocket API for hver av dem. Det besvarer direkte spørsmålet om usikre svar, kostnad og testmodus fra briefen.
- **FR-ene har testbare konsekvenser, og de vanskelige kantene er pinnet fast.** FR-23 sier at «A weekday name resolves to the next occurrence of that day. If the reference date is itself that weekday, it resolves to the reference date», og NFR-10 krever fast referansedato i stedet for systemklokka. Dette er presist nok til å bli testtilfeller direkte.
- **Scope er ærlig og begrunnet.** §5 og §6.2 sier hva som er utelatt og hvorfor (synk, påminnelser, norsk tekst, lokal modell med kjent Safari-feil), og §11 viser hvilke deler som beskyttes først hvis tiden knapper seg.

## 3. Oversikt per dimensjon

| Dimensjon | Vurdering | Kort begrunnelse |
|---|---|---|
| Beslutningsklarhet – er valg og avveininger synlige? | sterk | Motorvalget i §4.2 er begrunnet mot alternativene, og hver beslutning har status i §13. |
| Substans – er innholdet fortjent, eller «pynt»? | sterk | Ingen pynte-personas eller boilerplate-NFR-er; prisene er verifisert mot kilde i addendumet. |
| Strategisk sammenheng – har PRD-en en tese som funksjonene tjener? | sterk | Alle funksjoner støtter «pre-sortert liste brukeren stoler på»; motmålene (SM-C1–C3) er gode. |
| Testbarhet – vet man når hvert FR er ferdig? | god | De fleste FR-er er svært gode, men regelmotorens regler og noen tidsord/terskler er ikke målbare (se 4.1 og 4.3). |
| Scope og avgrensning – er utelatelser eksplisitte? | god | Utelatelsene er tydelige, men det mangler en prioritert kuttlinje inne i v1 (se 4.2). |
| Brukbarhet for neste fase – kan UX, arkitektur og stories hente fra den? | god | Glossar, ID-er og UJ-er er gode; lengde og gjentakelse gjør uttrekk tyngre enn nødvendig (se 4.4). |
| Formtilpasning – passer PRD-formen produktet? | god | UJ-ene passer UX-arbeidet, men formen er tyngre enn et soloprosjekt trenger. |

## 4. Viktigste forbedringer

### 4.1 Regelmotorens regler er ikke spesifisert på PRD-nivå
- **Alvorlighet:** høy
- **Hvor:** §4.2 FR-7 («The Rule Engine is a pure function of Task text and due date») og FR-19
- **Problem og hvorfor det betyr noe:** Det står at motoren er deterministisk, men ikke hvilke Tags som finnes, hvilke ord som gir `high`/`low`, eller hva som skjer uten treff. Uten det kan ikke Fixture (FR-19) ha «forventede Tags», og SM-1 måler da bare det motoren tilfeldigvis gjør. Reglene ligger kun som skisse i addendumet, merket «not a mandate».
- **Forslag:** Legg til et lite, navngitt tagg-sett og en nøkkelordtabell i FR-7, og et eksempel som kan kjøres rett i en test: «Gitt referansedato onsdag 2026-11-04 og tekst *Submit assignment in IBE160 Friday* gir Rule Engine Tags `[school]`, Priority `high`, due date 2026-11-06. Tekst uten treff gir Tags `[]` og Priority `medium`.»

### 4.2 Ingen kuttrekkefølge innenfor v1
- **Alvorlighet:** høy
- **Hvor:** §8 «Solo-build constraint» og §11 («Protect it if the schedule compresses» står bare ved FR-21)
- **Problem og hvorfor det betyr noe:** 23 FR-er, PWA/offline, to motorer, harness, mocket testsuite og dokumentasjon skal bygges av én person før andre uke i desember. Epics og stories vil behandle alle FR-er som like viktige hvis PRD-en ikke sier annet.
- **Forslag:** Legg inn en kort «Hvis tiden knapper seg»-liste i §6, for eksempel: 1) kjernen FR-1–5, 7, 10, 12–15, 19–20 + README; 2) FR-9, FR-17/18 og NFR-8 (Model Engine med fallback); 3) kan kuttes først: konfigurerbar retention i FR-16, Project, FR-22, Accept all/Reject all.

### 4.3 Noen krav bruker ord i stedet for grenser
- **Alvorlighet:** medium
- **Hvor:** FR-8 «within one interaction», NFR-4 «phone-sized viewport», FR-12 «an overdue grouping», NFR-3 «no ... spinner» (mens FR-8 krever «pending indicator»)
- **Problem og hvorfor det betyr noe:** En tester kan ikke avgjøre når disse er oppfylt. «Overdue grouping» har heller ikke navn som Smart List, så FR-15 kan ikke peke på den.
- **Forslag:** «Task vises i listen før neste brukerhandling, og senest 100 ms etter at brukeren sender inn teksten (målt uten Suggestion Engine).» «Review-flyten er brukbar ved 360 px og 1280 px bredde uten horisontal scrolling.» Gi gruppen et navn, f.eks. «Overdue», og presiser i NFR-3 at pending-indikatoren i FR-8 er unntatt.

### 4.4 Lang og gjentatt dokumentasjon av samme beslutning
- **Alvorlighet:** medium
- **Hvor:** §0 («Nothing in this document is left as an unresolved assumption»), `status: final`, §13 punkt 12–13 og §12 OQ-1/3/4
- **Problem og hvorfor det betyr noe:** Samme beslutning står inline, i §13 og i addendumet, og leverandørforbeholdet gjentas i Glossary, §4.2, FR-18, §8 og §9. Åpningssetningen i §0 motsies av de åpne spørsmålene, og `final` stemmer dårlig med at leverandørvalget venter på OQ-1. Det gjør det vanskelig å se hva som faktisk gjelder.
- **Forslag:** Kutt §0 til det som er sant («to punkter gjenstår: OQ-1 og OQ-4»), sett status til `draft` til OQ-1 er målt, og la Glossary og FR-18 si «Anthropic» som vedtatt valg med én henvisning til §4.2 for reserveløsningen. Fjern gjentakelser av begrunnelser som allerede står i §13.

### 4.5 SM-1 har ikke noe gulv
- **Alvorlighet:** lav
- **Hvor:** §7 SM-1 («baseline on first run, then no regression»)
- **Problem og hvorfor det betyr noe:** Å sette målet fra første måling er ærlig, men et lavt første resultat blir da «godkjent» automatisk.
- **Forslag:** Legg til at dere etter første kjøring skriver ned et minimumsnivå per felt og begrunner det, og at Summary vurderes separat (som addendumet allerede sier) slik at den ikke trekker ned Tags og Priority.

## 5. Mekaniske funn

- FR-22 og FR-23 står ute av rekkefølge (FR-23 ligger i §4.1, FR-22 i §4.2). Det er forklart i teksten, og ID-ene er unike og løser seg, så dette er ikke noe problem.
- Glossar-avvik: «Claude API» (Cloud Suggestions) mot «Anthropic's API» (FR-18); «task text» og «Task text» veksler.
- FR-23 sier hele ukedagsnavn, mens eksempelet «Satisfaction» ikke matcher `sat`. Si eksplisitt at forkortelser (`fri`, `mon`) ikke gjenkjennes.
- Ingen `[ASSUMPTION]`-merker; §13 fyller rollen, og det fungerer. Ingen ID-brudd funnet. Ingen sensitive opplysninger funnet.

## 6. Før dere går videre

**Må avklares før UX, arkitektur og epics:**
- Regelmotorens tagg-sett og nøkkelord (4.1), ellers kan ikke Fixture skrives.
- Kuttrekkefølgen (4.2), slik at epics får riktig prioritet.
- OQ-1 (latensmåling og leverandør) og OQ-4 (hva `.env.example` betyr uten backend). Begge avgjør arkitekturen.

**Kan vente:** OQ-3 (gratis kreditt, før README skrives), OQ-6 (grunnlinje for nøyaktighet, kommer ved første kjøring), OQ-7 (akseptert risiko, ført fram).

**Oppfølging av briefen: ja.** Synk og deling er flyttet ut (§5), motorvalget er tatt og begrunnet (§4.2), de 10–15 eksemplene er blitt Fixture med forventede resultater (FR-19), og eksempelet fra briefen-tilbakemeldingen brukes i UJ-1. Planen for `.env.example` er delvis fulgt opp (§8 og OQ-4).

## 7. Refleksjonsspørsmål

1. Mange punkter er merket «Decision (confirmed by builder)». Hvilke av dem tok dere selv etter å ha vurdert alternativene, og hvilke foreslo KI-en og dere godtok? Hvordan ville dere forklart valget uten å se på PRD-en?
2. Dere fant at kilden til «cached modelltabell» var utdatert og kontrollerte prisene på nytt. Hvordan vil dere kontrollere at regelmotorens tagger og nøkkelord faktisk er deres egne vurderinger og ikke bare det første KI-en foreslo?

_Vurdert mot kvalitetsrubrikken i bmad-prd. Dette er veiledning, ikke sensur._
