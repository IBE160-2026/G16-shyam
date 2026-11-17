# UX-konsepter — fem retninger

## 2026-11-17 kl. 06:31 — Shyam Chandra K C

### Oppgave
Brukeren kjørte først `/bmad-help` for å se hvor i BMad-løpet prosjektet står, og startet
deretter `/bmad-ux` med en konkret bestilling: skisser **alle** sidene i applikasjonen, lag
**fem** forskjellige designkonsepter med bred kreativ variasjon, vis særlig **godta/endre/avvis
på mobil og PC** slik lærertilbakemeldingen på produktbriefen ber om, lever konseptene som
**SVG**, bruk `/impeccable`-skillen, kjør **fem subagenter parallelt**, og **ikke still spørsmål**
— de fem konseptene skal vurderes før detaljene tas.

Bygger på [slett-concept-design](994-2026-11-15-14-28-52-slett-concept-design.md), som slettet
hele den forrige UX-kjøringen, og på
[prd-to-do-list-v1](997-2026-11-01-13-37-39-prd-to-do-list-v1.md).

### Plan
- `/bmad-help`: les `_bmad/_config/bmad-help.csv` + `resolve_config.py`, og avgjør fullført-status
  fra faktiske artefakter framfor fra filnavn.
- `/bmad-ux` Create-modus: bind arbeidsmappe, memlog, DESIGN.md/EXPERIENCE.md som frontmatter.
- `impeccable`: kjør `context`, så `concept-seed --scope direction --mode operate` for å få rullen
  som hindrer at alle fem konseptene lander på kategoristandarden.
- Skriv ett delt underlag slik at alle fem konseptene viser identisk innhold og blir sammenlignbare.
- Fem subagenter parallelt, én per konsept, 17 rammer hver.
- Sett sammen til ett galleri.

### Resultat

**BMad-status (ingen filendring).** Fullført: produktbrief, research, PRD. PRD-en står fortsatt
`draft` fordi OQ-1 ikke er målt. Neste påkrevde port er `bmad-architecture`, men UX kommer før den
i katalogen, og OQ-1 binder bare NFR-2s timeout — ikke flatene. Anbefalingen var derfor: start UX nå.

**`PRODUCT.md` skrevet på nytt** (prosjektroten, 15 K). `impeccable concept-seed` nekter å kaste
terningen uten den. Siden brukeren sa «ikke spør nå», ble init-intervjuet hoppet over og fila
utledet fra PRD + brief + lærertilbakemelding, med kildene navngitt i et forord. **De tre punktene
den slettede kjøringen hadde gjettet på står nå eksplisitt som `[OPEN]`, ikke gjettet på nytt:**
UI-språk, tilgjengelighetsstandard, og om prioritet/motor-proveniens får bæres av farge alene.

**Rullen.** `concept-seed --scope direction --mode operate` → `SEED REFERENCE seed:936505b7939c1812`,
`ASSIGNED INDEX 4`, seks utdelte utfordrere. Flaten er **operate**, som er code-led av kontrakt —
derfor SVG-rammer og ingen comps. Operate-reglene binder alt: verdenen låner bare *type, palett,
tetthet og ett signaturgrep*; layout, navigasjon og kontroller forblir standard web-komponenter.

Syv egne retninger rangert etter resonans; rullen pekte på nr. 4. Utfordrerdommer:
orienteringskartet **vant** begge akser, centre-rail og japansk høytetthet **konkurransedyktige**,
type-specimen **avvist**, vertikal videofeed og jet-age billettmappe holdt i re-roll-poolen.
Tre disipliner ble donert inn i den utpekte retningen (live readout, «nothing disappears, it
cancels», «pending queue clears in place»).

**Fem konsepter, 17 rammer hver = 85 SVG-rammer**, alle med identisk innhold (ekte strenger fra
FR-7, referansedato mandag 2026-11-16) og godta/endre/avvis i tre tilstander på både 360 px og
1280 px:

| | Konsept | Verden | Signaturgrep |
| --- | --- | --- | --- |
| 01 | Date Due | Bibliotekets utlånslapp, stempel, kortlomme | Hver tilstand stemples, dateres og fjernes aldri |
| 02 | Margin | Korrekturmerker i margen | Hvert merke er klammet tilbake til ordene som utløste det |
| 03 | Kartet | ISOM orienteringskart | Forslaget rir som lilla lag over journalen og endrer den aldri |
| 04 | Centre Rail | Referanseutgave med margapparat | Hairline-skinne med firkantdetenter; tilstand er trykte merker, tre valører |
| 05 | Tett | Japansk høytetthets-web | Alt avledet synlig samtidig; gjennomgang som tabell, én rad per del |

**Agent-havari og gjenoppretting.** De fem opprinnelige subagentene ble alle drept av øktgrensa
midt i arbeidet, og to omkjøringer av ukesgrensa. Ingen av dem rakk verifiseringssteget.
Gjenoppretting skjedde fra disk framfor ved å kjøre alt om: 02, 03, 04 og 05 hadde alle 17 rammer
skrevet før de døde. `05-tett` manglet `CONCEPT.md` og `palette.json` — skrevet av hovedtråden fra
de faktiske rammene, med verdier hentet ut av SVG-ene, ikke oppfunnet. `01-date-due` mistet alt
fire ganger og ble til slutt tegnet i hovedtråden via en generator, `01-date-due/gen.py` —
framtidige endringer på det konseptet går gjennom den fila, ikke direkte i SVG-ene.

**Verifisering — gjort, og den fant reelle feil.** Ingen subagent overlevde til å se på eget
arbeid, så hovedtråden rendret alle rammene med headless Chrome (`verify.py`, kontaktark per
konsept) og så på dem. Funn:
- **03-kartet:** det lilla laget var malt oppå levende tekst i `m3/m4/m5/d2/d3/d4`, slik at to sett
  ord delte samme piksler, og per-del-kontrollene kolliderte med «Accept all» på `m5/d4`. Rettet av
  en agent som beholdt konseptet og signaturgrepet og bare fjernet kollisjonen; den fant i tillegg
  to feil utenfor lista: overlappende tekst i `d8` og et avkuttet «RULE ENGINE»-merke på fem
  mobilrammer. Bekreftet rettet ved ny render.
- **01-date-due:** fire feil i egen kode — `stamp()` tegnet heldekkende fyll ved `fill_op=0` (gjorde
  to stempler uleselige), bildetekst kolliderte med knapperad i `part_block`, «SET 16 NOV»-stempelet
  overlappet lange sammendragsverdier, og store tomrom nederst. Alle rettet og etterkontrollert.
- 02, 04 og 05 var rene.

**Filer skrevet** (alt under `.docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/`):
`DESIGN.md` og `EXPERIENCE.md` (begge kun frontmatter, `stage: concepts-open`), `.memlog.md`
(15 oppføringer), `.working/concepts/` med `_SHARED-BRIEF.md`, fem konseptmapper à 17 SVG +
`CONCEPT.md` + `palette.json` + `concept.html`, byggeskriptene `build-concept-page.py`,
`build-gallery.py` og `verify.py`, og galleriet `index.html` (5/5 konsepter).
Pluss `PRODUCT.md` i prosjektroten. Alt er **ukommittert**.

Galleriet bærer også kanon-kortet («den kjente veien» — kategoristandarden spilt rett) som den
stille døra, og de tre vurderte-men-ikke-videreførte retningene med dom og hva som ble beholdt
fra dem.

### Åpne punkter
- Velg ett av de fem konseptene. Ingenting i UX-fasen kan lukkes før det: `DESIGN.md` og
  `EXPERIENCE.md` står bevisst som frontmatter, og `impeccable`-retningskontrakten
  (surface brief, `seed:936505b7939c1812`) skrives først etter valget.
- Avgjør de tre `[OPEN]`-punktene i `PRODUCT.md`, som ingen av konseptene har lov til å avgjøre
  alene: **UI-språk** (PRD-en fikserer kun oppgavetekst til engelsk og kaller grensesnittspråket et
  eget, ubesvart spørsmål), **tilgjengelighetsstandard** (ingenting er navngitt utover NFR-4s to
  bredder; WCAG 2.2 AA er et rimelig gulv, men ubekreftet), og **om prioritet/motor-proveniens får
  bæres av farge alene** (alle fem konseptene antar nei og sier det).
- `03-kartet`: `d5` og `m6` tegner fortsatt én lilla start-trekant på en oppgave der alle kontroller
  er punchet, rett ved siden av tekst som sier «No purple is left on this task» — en semantisk
  selvmotsigelse, ikke en rendringsfeil. Avgjør om trekanten skal bort eller teksten endres.
- Når konseptvalget er tatt: send `impeccable concept-seed`-telemetripinget
  (`--from c1ed3b0002f6fa0bdb9bbc97348fdc99 --scope direction --mode operate --kind <kind>`,
  med `--chosen <SOURCE ID>` hvis en utfordrer vant). Ett ping per runde brukeren avgjorde.
- Konseptrunden ble kjørt **før** OQ-1 og OQ-4 er lukket, stikk i strid med det
  [slett-concept-design](994-2026-11-15-14-28-52-slett-concept-design.md) satte som forutsetning.
  Begrunnelsen står i [oq1-spike-harness](995-2026-11-14-20-39-00-oq1-spike-harness-og-repo-opprydding.md):
  OQ-1 binder bare NFR-2s timeout, leverandørvalget og PRD-statusen — ikke flatene. OQ-1-målingen
  og OQ-4 gjenstår fortsatt.

## 2026-11-17 kl. 22:45 — Shyam Chandra K C

### Oppgave
Brukeren pekte på `.docs/planning-artifacts/ux-designs/decisions.md` og ba om **to nye
designkonsepter, runde 2, bygget på beslutningene der**. Fila var tom ved første lesing (0 byte),
og en `mydecisions.md` ved siden av var en tom *mappe*, ikke en fil — begge ble meldt tilbake
framfor å finne på beslutninger. Brukeren fylte deretter `decisions.md`, og runde 2 ble kjørt på
det reelle innholdet.

### Plan
- Les beslutningene nøyaktig og skill mellom *hoveddesign* (verden) og *per-flate-valg* (struktur).
- Siden verdenen nå er brukerpinnet, hopp over en ny `concept-seed`-rull: en pinnet retning slår
  rullen i `impeccable`. Finn i stedet den variabelen beslutningene **ikke** avgjorde, og la de to
  konseptene skille seg på den.
- Bygg ett delt verdensmodul fra Kartets faktiske `palette.json`, så ingen farge eller skrift
  driver fra det brukeren valgte.
- Tegn, render, se på resultatet, rett, og sett sammen et eget runde-2-galleri.

### Resultat

**Beslutningene, slik de ble lest.** Hoveddesign: **nr. 3 Kartet** for farger, tekst og størrelse.
Per-flate-struktur: `m1`, `m5`, `m8` fra 01 Date Due; `m2`, `m6`, `m7` fra 05 Tett; `m3`, `m4` fra
03 Kartet; `m9` som en blanding av 01 og 05. Desktop: `d1`, `d2`, `d7`, `d8` fra Tett; `d3`, `d5`,
`d6` fra Kartet.

**Den variabelen beslutningene ikke avgjorde** — og som derfor ble aksen mellom de to konseptene —
er *hvordan de lånte flatene forenes med Kartets punch-mekanikk*. Den endrer hver eneste
gjennomgangsflate, så det er et reelt valg og ikke en detalj:

- **06 «Kurs»** — kurslaget forblir et eget objekt lagt *over* journalen. De lånte flatene beholder
  skjelettet, men mister sitt eget tilstandsvokabular: Date Dues daterte stempel og Tetts røde
  fane blir punchede kontroller. Én mekanikk eier hver flate.
- **07 «Beskrivelse»** — kontrollbeskrivelses-arket er ryggraden; raden leses på tvers, slik at
  «hva feltet er nå» og «hva som foreslås» står på samme linje med en pil mellom. Tetts tetthet er
  innfødt her framfor importert, og Date Dues daterte merker overlever *bokstavelig*, som daterte
  oppføringer i en beskrivelseskolonne.

**Ingen ny rull.** `impeccable` sier at en bruker- eller brief-pinnet retning alltid slår rullen,
så `concept-seed` ble bevisst ikke kjørt på nytt. Verdenen er låst; `seed:936505b7939c1812` fra
runde 1 står fortsatt som rullen bak Kartet.

**Filer** under `.working/concepts/round-2/`: `world.py` (Kartets palett og skrifter, hentet fra
`03-kartet/palette.json`, ikke gjenskapt), `06-kurs/` og `07-beskrivelse/` med hver sin `gen.py`,
17 SVG-rammer, `CONCEPT.md`, `palette.json` og `concept.html`, pluss `build-gallery.py` og
galleriet `index.html`. Galleriet viser flate-opphavet rad for rad, så det er etterprøvbart mot
`decisions.md`.

**Verifisert ved å se, ikke anta.** Begge konseptene ble rendret til kontaktark med headless
Chrome og gjennomgått. Funnet og rettet: i 06 fløt kontrollbildetekster inn i neste blokk,
`m1`-legenden ble kuttet av fanelinja, `d1`-radene overlappet på 26 px avstand, og `d2`s
snarveisrad kolliderte med modulen under. I 07 løp oppgaveteksten inn i tagg-kolonnen, og
ark-verdiene under handlingskolonnen på 360 px — løst strukturelt ved å la raden ta to linjer og
beholde kolonnene, som nå er konseptets uttalte responsive svar.

Alt er **ukommittert**.

### Åpne punkter
- **`d4` (desktop, gjennomgang med angre) står ikke i beslutningslista.** Desktop-lista nevner
  `d1`, `d2`, `d7`, `d8` fra Tett og `d3`, `d5`, `d6` fra Kartet. Hvert konsept følger sin egen
  gjennomgangsgrammatikk der framfor å gjette; velg hvilken du vil ha.
- **`d5` har et alternativ du selv flagget:** «kan også vurderes fra nr. 1 Due date». Begge
  konseptene bygger `d5` fra Kartet, som er førstevalget ditt. Date Due-varianten er ikke tegnet.
- Velg mellom 06 Kurs og 07 Beskrivelse — eller si at du vil ha det ene konseptets gjennomgang og
  det andres lister; de deler ett verdensmodul, så en blanding er noen få funksjoner, ikke en
  omtegning.
