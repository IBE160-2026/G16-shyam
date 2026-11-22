# Beslutninger før epics og stories

## 2026-11-22 kl. 13:08 — Shyam Chandra K C

### Oppgave

Brukeren ba om at de gjenstående punktene skulle avgjøres **før** `bmad-create-epics-and-stories`
startes, slik at epics ikke bygges på en kjent uenighet mellom godkjente dokumenter. Fire
beslutninger ble gitt eksplisitt: (1) «Punch all» beholdes som Tier 1-funksjon og PRD §6.3, UJ-1, UX
og arkitektur samkjøres uten å endre gjennomgangsadferden; (2) FR-19-Fixturen får egen story og blir
forutsetning for FR-20 og SM-1; (3) OQ-1 holdes åpen — bruk den dokumenterte provisoriske timeouten
uten å påstå at den er verifisert; (4) oppsett, testing og dokumentasjon skal inn i epics/stories.
Dertil: bevar alle godkjente krav, ingen unødvendige omfangsendringer, verifiser konsistens på tvers
av PRD, UX og arkitektur, rapporter gjenstående motsetninger og **stopp** der brukerens beslutning
kreves. CE skulle ikke startes.

### Plan

- Lese alle berørte passasjer først (PRD i sin helhet, addendum, DESIGN.md, EXPERIENCE.md,
  ARCHITECTURE-SPINE.md, PRODUCT.md, README-ARCHITECTURE-SECTION.md, `issues.md`), så redigere, så
  verifisere med søk på tvers av repoet.
- Skrive beslutningene inn i dokumentet som *eier* dem, og la `reviews/` og `.memlog.md` stå urørt —
  de er tidspunktsreferater fra arkitekturkjøringen, ikke levende spesifikasjon.
- Samle CE-fasens bindende rammer i én inngangsfil, siden «FR-19 er forutsetningsstory» ikke kan
  verifiseres mot stories som ennå ikke finnes.
- Ikke starte CE.

Ingen lagret plan-fil; rammene for CE ligger i
`.docs/planning-artifacts/pre-ce-constraints-2026-11-22.md`.

### Resultat

**Ny fil:** `.docs/planning-artifacts/pre-ce-constraints-2026-11-22.md` — CE-fasens inngangskontrakt:
de fire beslutningene med begrunnelse, hvilke stories som *må* finnes, og en sjekkliste på sju punkter
som epics-fasen må bestå. Ingen krav lagt til, fjernet eller omformulert; FR-1–FR-23, NFR-1–NFR-10 og
SM-1–SM-5 står som godkjent.

**1. «Punch all» → Tier 1 (lukker åpent punkt fra 2026-11-18).** EXPERIENCE.md er låst og bygger
UJ-1s klimaks på snarveien; PRD §6.3 la den først i kuttkøen. Reisen vant. Endret: PRD §2.3 (UJ-1 med
etikettkobling), FR-10 (Tier 1 + etikettene «Punch all»/«Strike all» + presisering at Tier 1 *ikke*
betyr primær visuell vekt), §6.3 (Tier 1 utvidet, Tier 3-klausulen fjernet, eget avsnitt som
begrunner flyttingen), §13 rad 19. Spine: AD-10 lister dem ikke lenger som kuttbare, med en note om
at ingen AD flytter med; den åpne uenigheten i «Open questions this spine does not answer» er
strøket og merket avgjort. **Ingen adferdsendring:** de er fortsatt komposisjoner av per-del-handlingene
(FR-10, AD-15), og AD-7s angre-slot holdt allerede et *sett* av feltsnapshots. UX-dokumentene er
ikke rørt — de inneholdt ingen motsetning, bare etikettene, og er låst.

**2. FR-19 som forutsetning.** PRD FR-20 har nå en egen «Prerequisite: FR-19»-blokk, §7 sier at SM-1
og SM-3 ikke har noe instrument før Fixturen er committet, §6.3 Tier 1 fikser rekkefølgen FR-19 →
FR-20 som bindende, og §13 rad 20 bærer begrunnelsen. Spine AD-12 bandt dette strukturelt fra før.
Sjekkliste-punkt 3 gjør det etterprøvbart når stories finnes.

**3. OQ-1 fortsatt åpen, timeout provisorisk 10 s.** 10 s er tallet OQ-1s *miss*-gren selv navngir;
6 s er det en bestått måling ville gitt, og ingenting er målt — å bruke 6 s ville vært å påstå en
bestått måling. Skrevet inn i PRD NFR-2, §12 OQ-1 («Status 2026-11-22: still open»), §13 rad 21;
spine AD-5 (med konstantnavn og kommentar), «Deferred» og strukturtreet; PRODUCT.md; addendum §3.1
(som sa at «NFR-2 refuses to name a timeout» — nå korrigert uten å late som motsetningen er løst).
PRD-en står fortsatt `draft`. Bindende for alt nedstrøms: verdien og leverandøren kan *brukes*, men
ikke beskrives som målt eller verifisert.

**4. Oppsett, test og dokumentasjon er story-bærende.** PRD §6.3 Tier 1 sier nå at README ligger
inne i tieren, ikke etter den; §13 rad 22 begrunner det med rubrikkens 10 % + 5 % og at SM-2 er en
binær test som feiler stille. Inngangsfila lister hva som må bli stories: README-oppsett for begge
nøkkelveiene, Fixture-stien, NFR-9s prosa + skjermbilde, innliming av arkitekturseksjonen med de tre
mekaniske rettelsene, og testarbeidet NFR-8/NFR-10/FR-15/AD-19/AD-17 krever.

**Funnet og rettet under konsistenssjekken, ikke bestilt:**

- `README-ARCHITECTURE-SECTION.md` sa at spikens grense «was fixed *before* we ran it» — altså at
  spiken var kjørt. Rettet til «has not been run», med den provisoriske timeouten nevnt som
  plassholder. Dette er tekst som skal inn i innleveringens README, så påstanden var reell.
- `PRODUCT.md` førte fortsatt UI-språk som `[OPEN]` selv om brukeren avgjorde engelsk 2026-11-18 og
  EXPERIENCE.md har det nedfelt. Merket løst.
- PRD §13s innledning sa at «item 12 alone» var åpen; nå rad 12 og 21.

**Verifisert:** ingen levende spesifikasjon plasserer snarveiene i Tier 3 lenger (gjenstående treff
ligger bare i `reviews/` og `.memlog.md`, som er referater og skal stå); `§13`-tabellen har 22 rader
i rekkefølge med intakt cellestruktur; alle fire kryssreferanser (`item 19`–`item 22`) peker på rader
som finnes. Ingen tester kjørt — ingen kode i repoet ennå.

**CE er ikke startet**, etter instruks.

#### Andre runde — de tre punktene brukeren avgjorde samme dag

**5. README skrives på engelsk.** Lukker den siste delen av språkspørsmålet §6.1 holdt åpent (UI-språk
var avgjort 2026-11-18, men PRD-en hadde det ikke nedfelt — den sa fortsatt at grensesnittspråk «is a
separate question»). Nå: PRD §6.1 og §13 rad 23. Alt en sensor leser er ett språk; `.logs/` forblir
norsk som byggerens eget arkiv.

**6. WCAG 2.2 AA bekreftet som gulv** — AA, ikke AAA, billigste implementasjon som oppfyller kravet.
Dette lukket **begge** de gjenstående `[OPEN]`-punktene i PRODUCT.md på én gang: farge-alene er
standardens eget SC 1.4.1, altså et krav og ikke lenger en antakelse. Ført i PRD NFR-4 og §13 rad 24,
spine AD-17 (med de tre AA-kriteriene som treffer dette konseptet), PRODUCT.md to steder, EXPERIENCE.md
(tilgjengelighetsgulvet + Open Decisions) og `ux-designs/decisions.md`. **Én rammeendring ble tvunget
av standarden:** in-panel-mål fra 20px til 24px (SC 2.5.8) — `DESIGN.md`s `button-height` og
EXPERIENCE.md-gulvet. Formuleringen er bundet: «built to WCAG 2.2 AA, checked with axe-core», aldri
«conformant» — axe-core dekker bare en delmengde av AA.

**7. Fixturens referansedato: mandag 2026-11-16.** Samme dato FR-7s eksempel alt brukte, så eksempelet
*er* en Fixture-oppføring framfor et parallelt tilfelle, og §6.2s kryssreferanse holder bokstavelig.
Fastlåser inneværende uke til 2026-11-16–22, `today`/`tomorrow`/`next week` til 16./17./23., og avgjør
rollefordelingen: IBE160-oppføringen blir det *vanlige* tilfellet (2026-11-20), kant-tilfellet trenger
en egen `Monday`-oppføring. PRD FR-19 og §13 rad 25. Lukker punktet fra 2026-11-14.

**To nye funn som følger av beslutningene, og som er brukerens å avgjøre:** «Need Attention» kan ikke
dekkes av noen Fixture-oppføring (ingen datoord løser til fortid), og `row-height-desktop: 21px` ligger
under SC 2.5.8s 24px. Begge ført som åpne punkter.

PRD §13 har nå 25 rader; tabellstrukturen er verifisert maskinelt.

### Åpne punkter

- «Need Attention» kan ikke dekkes av en Fixture-oppføring: ingen datoord i FR-23 løser til fortid, så
  ingen parset forfallsdato kan være forfalt (samme for søndag). Billigste lesning er at Fixturen bare
  hevder det parsing kan produsere og at FR-12s forfalt-regel testes i enhetstester mot innsprøytet
  klokke; alternativet krever et eksplisitt ikke-parset dato-felt, altså en endring av FR-19s form.
  Brukerens beslutning.
- `DESIGN.md`s `row-height-desktop: 21px` er under SC 2.5.8s 24×24 px. Å heve den endrer tettheten
  konsept 05 «Tett» bevisst valgte. Brukerens beslutning: hev, eller dokumenter at desktop-radene
  hviler på avstands-unntaket.
- README-innholdet gjenstår (språket er valgt: engelsk). Det er nå story-bærende arbeid i Tier 1.
- `bmad-prd` Finalize steg 2/3/5 er ikke kjørt — nå verken på 2026-11-14-endringene eller
  2026-11-22-endringene. `bmad-review lenses=structure,prose` på de berørte passasjene gjenstår hvis
  PRD-en skal gjennomgås før epics.
- OQ-1-målingen gjenstår (krever nøkkel med kreditt, ~5 øre). Lukker PRD-ens `draft`-status, binder
  NFR-2 til 6 s eller 10 s og bekrefter leverandøren.
