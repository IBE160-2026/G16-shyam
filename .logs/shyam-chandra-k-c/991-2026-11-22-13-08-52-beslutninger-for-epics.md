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

**CE er ikke startet**, etter instruks, fordi tre punkter krever brukerens beslutning (se under).

### Åpne punkter

- README-språk: `README.md` er en sju-linjers norsk stubbe, mens PRD, DESIGN, EXPERIENCE og spinen er
  engelske. Språket må velges før README-storyene skrives.
- `PRODUCT.md`s to gjenstående `[OPEN]`: WCAG 2.2 AA som forpliktet gulv, og om prioritet/motor-
  proveniens kan bæres av farge alene. EXPERIENCE.md har *allerede* forpliktet seg til begge i et
  låst dokument — beslutningen er å bekrefte det eller overstyre det.
- Fixturens egen referansedato avgjør om «Submit assignment in IBE160 Friday» blir det vanlige eller
  det tvetydige ukedagstilfellet. Hører til FR-19-storyen, men er brukerens valg, ikke
  story-forfatterens.
- `bmad-prd` Finalize steg 2/3/5 er ikke kjørt — nå verken på 2026-11-14-endringene eller
  2026-11-22-endringene. `bmad-review lenses=structure,prose` på de berørte passasjene gjenstår hvis
  PRD-en skal gjennomgås før epics.
- OQ-1-målingen gjenstår (krever nøkkel med kreditt, ~5 øre). Lukker PRD-ens `draft`-status, binder
  NFR-2 til 6 s eller 10 s og bekrefter leverandøren.
