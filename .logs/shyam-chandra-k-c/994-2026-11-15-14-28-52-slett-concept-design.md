# Slett concept-design

## 2026-11-15 kl. 14:28 — Shyam Chandra K C

### Oppgave
Brukeren vil løse OQ-1 (Model Engine-latens) og OQ-4 (hvor API-nøkkelen bor / hva `.env.example`
betyr uten backend) *før* UX-design startes, og ba om at all concept-design og alt relatert til
den slettes. Formålet er å rulle repoet tilbake til tilstanden før impeccable-UX-kjøringen, slik
at UX-fasen begynner på nytt når de to åpne spørsmålene er lukket.

### Plan
- Kartlegg hva UX-kjøringen 2026-11-14 faktisk la igjen, og om noe av det er committet eller
  refereres fra PRD/brief.
- Avklar omfanget av «relatert til» med brukeren — særlig `PRODUCT.md`, som er destillert fra
  PRD-en og ikke er visuelt konseptarbeid.
- Slett det valgte omfanget og verifiser at arbeidstreet står likt med siste commit.

### Resultat
Kartleggingen viste tre grupper, alle utrackede (ingen git-historikk å gjenopprette fra) og uten
referanser fra committerte dokumenter:

- `.docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-14/` — 74 filer / 881 K: fem konsepter
  (01 OPPSLAG, 02 MARGINALIA, 03 SKILT, 04 SJOKART, 05 MORKETID) med tolv SVG-rammer hver,
  `_SHARED-BRIEF.md`, galleri-`index.html`, `DESIGN.md` og `EXPERIENCE.md` (begge kun frontmatter,
  `stage: concepts-open`) samt `.memlog.md`.
- `.impeccable/` — 4 filer: `hook.cache.json`, retningsrullingen `questions/roll.json`
  (seed `seed:43c903c2f5efff2f`, mode `operate`) og `questions/seeds/43c903c2f5efff2f.json`.
- `PRODUCT.md` i prosjektroten — 15 K produktdefinisjon destillert fra PRD + brief.

Omfanget ble lagt fram for brukeren med `PRODUCT.md` som eneste skjønnsspørsmål; brukeren valgte
«Delete everything». Alle tre gruppene er slettet. Arbeidstreet er verifisert rent og står
nå identisk med commit `10fe1cd` (OQ-1 spike-harness). En kopi av de 79 filene ligger i denne
sesjonens scratchpad (`…/scratchpad/deleted-concept-design/`) som sikkerhetsnett, men den
forsvinner når sesjonen avsluttes og skal ikke regnes som et arkiv.

Ikke berørt: PRD-en, brief-en, researchen og OQ-1-spike-harnesset
(`.docs/planning-artifacts/spikes/oq1-model-engine-latency/`, inkl. `node_modules/` og `results/`)
står som før.

### Åpne punkter
- UX-design må startes helt på nytt når OQ-1 og OQ-4 er lukket; fem konsepter, IA-en på ni flater
  og det delte innholdskorpuset finnes ikke lenger i noen form.
- `PRODUCT.md` må skrives på nytt før UX-fasen. De tre `[INFERRED]`-punktene den bar
  (UI-språk engelsk, WCAG 2.2 AA som gulv, «prioritet og motor-proveniens aldri bare ved farge»)
  var aldri bekreftet av brukeren og må avgjøres eksplisitt denne gangen.
