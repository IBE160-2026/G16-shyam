# Source extract: instructor feedback + brief memlog

Extraction pass to support the PRD. Two sources, both read in full:

- **FB** = `.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/tilbakemelding-product-brief.md` (instructor feedback, IBE160 faglærer, dated 2026-10-06, written with AI support; reviews brief at commit `ec0eed5`)
- **ML** = `.docs/planning-artifacts/briefs/brief-To-Do-List-2026-09-08/.memlog.md` (append-only decision log, last updated 2026-10-16T22:03)

Citations are `FB:<line>` / `ML:<line>`. Norwegian quotes translated; original kept where the exact wording matters.

---

## 1. Course / grading requirements stated as requirements

### 1.1 The portfolio ("mappen") and its Part 1 criteria with weights

FB section 2 (`FB:90–102`) maps the brief against the **sensorveiledning** (examiner guide) criteria for **Part 1 of the portfolio**, with explicit weights. These are the grading axes the PRD must serve:

| # | Criterion | Weight | FB line |
|---|---|---|---|
| 1 | Prosess og KI-styring (process and AI steering) | **30 %** | `FB:96` |
| 2 | Funksjonalitet og omfang (functionality and scope) | **20 %** | `FB:97` |
| 3 | Kvalitetssikring og testing | **15 %** | `FB:98` |
| 4 | Design og brukeropplevelse | **10 %** | `FB:99` |
| 5 | Kodekvalitet og arkitektur | **10 %** | `FB:100` |
| 6 | README og kjørbarhet (README and runnability) | **10 %** | `FB:101` |
| 7 | Ryddighet i repoet (repo tidiness) | **5 %** | `FB:102` |

Note the weighting: **process/AI-steering (30 %) is worth more than functionality (20 %)**, and testing (15 %) outweighs design, architecture and README individually. A PRD that optimizes only for features is optimizing the 20 %.

### 1.2 What the grader must be able to do / see

- **Traceability from plan to app is graded.** "Del 1 av mappen vurderes blant annet på om sensor kan følge en sporbar vei fra plan til ferdig app." — *Part 1 is assessed partly on whether the examiner can follow a traceable path from plan to finished app.* (`FB:75`) Also: brief must be "presis nok til at PRD og stories kan bygges direkte på den, slik at krav kan spores fra brief til kode" — requirements traceable brief → code (`FB:96`).
- **The app must do what the documents say it does, be tested, be well designed, and be runnable from the README** (`FB:75`).
- **Runnable without the group's own credentials.** Criterion 6: "Løsning som andre kan kjøre lokalt uten betalte kontoer, og uten tilgang til gruppens egne tjenester og nøkler." (`FB:101`) Restated in the feasibility table: "Kjørbar for sensor – kan appen kjøres lokalt etter README, uten gruppens nøkler, betalte kontoer eller egen infrastruktur?" (`FB:61`)
- **Keep the brief updated in the repo so history shows how the plan evolved** — explicitly "en del av prosessen sensor ser etter" (*part of the process the examiner looks for*) (`FB:110`). Implication for the PRD: revision history and recorded rationale are themselves deliverables, not hygiene.
- **Document the suggestion-engine decision with its rationale** — "Fortsett med å dokumentere beslutningen om forslagsmotor med begrunnelse – det er godt prosessmateriale." (`FB:96`, also `FB:107`)

### 1.3 Mandated planning method and toolchain (stated as given, not optional)

> "Dere skal planlegge med BMAD (product brief → PRD → arkitektur → epics og stories) og implementere med Claude Code." (`FB:52`)

The feasibility assessment is explicitly budgeted to leave time for **the whole flow plus testing, fixing and a README at the end** (`FB:52`). So the PRD must be sized for: PRD → architecture → epics/stories → implementation → test → fix → README, inside the semester.

### 1.4 Difficulty-level expectations (important and easy to miss)

- Assessed difficulty: **"Enkel"** (Simple) (`FB:29`). Benchmarked against the course's own assignment catalogue: "6) To-do-liste med smarte etiketter (enkel). Briefen er i praksis dette forslaget, med tillegg av PWA/offline og valgfri synk og deling." (`FB:31`)
- **Difficulty counts toward the grade**, so a simple project must compensate in execution:

> "_Enkel:_ Et enkelt prosjekt gir stor sjanse for å bli ferdig. Vanskelighetsgraden inngår likevel i vurderingen, så for å nå helt opp må dere vise mer i gjennomføringen. Det betyr særlig et gjennomarbeidet design, grundig testing av forslagsmotoren og de smarte listene, en tydelig dokumentert prosess og en README som virker." (`FB:48`)

*Translation: a simple project is likely to get finished, but difficulty still factors into the grade — to reach the top you must show more in the execution: a thoroughly worked design, thorough testing of the suggestion engine and smart lists, a clearly documented process, and a README that actually works.*

- The sanctioned way to raise difficulty: **one well-executed extension — an optional language model with rule-engine fallback — instead of sync.** "Vurder om én godt gjennomført utvidelse, for eksempel en valgfri språkmodell med reserve til regelmotoren, kan løfte prosjektet – i stedet for synk og deling." (`FB:48`, repeated as recommendation 2 at `FB:71`)

### 1.5 Documentation the course requires alongside the app

- A **working README** that another person can follow to run the app locally (`FB:48`, `FB:61`, `FB:101`).
- **Documented process / AI-steering artifacts** — the BMAD chain itself plus recorded decisions with rationale (`FB:48`, `FB:96`, `FB:110`).
- **A plan for where secrets, test data and documentation live**: "Planlegg `.env.example` og `.gitignore` hvis dere tar inn en sky-modell, og en fast fil med eksempeloppgaver til testing." (`FB:102`) — i.e. a committed **example-task fixture file** is expected as a repo artifact.

---

## 2. Criticism and corrections of the brief (highest value)

FB `FB:19–23` names "De viktigste endringene" (*the most important changes*). All three are corrections, not suggestions.

### 2.1 CRITICAL — Accounts, cloud sync and list sharing must leave v1

> "Flytt valgfri konto, skysynk og deling av lister ut av v1. Det står i dag under «In scope for v1», men det krever backend, innlogging og konflikthåndtering. **For et soloprosjekt er det den største risikoen i planen.**" (`FB:21`)

Reinforced in four more places:
- Scope section verdict is the only **"Endre"** (change — stronger than "Juster"/adjust) in the whole part-by-part review: "v1 inneholder både lokal app, konto, skysynk, deling og flerplattform. Flytt konto/synk/deling ut, slik at v1 blir én tydelig kjerneflyt." (`FB:87`)
- Time/scope risk: "Konto, skysynk og deling i samme v1 gjør at dere må bygge to apper: en lokal og en med backend." — *you'd have to build two apps* (`FB:56`)
- Architecture criterion: "En valgfri backend for synk øker kompleksiteten mye – avvent den." (`FB:100`)
- Prescribed v1 definition: "Definer v1 som én lokal webapp: CRUD, forslag med godta/endre/avvis, smarte lister og arkivering. Flytt valgfri konto, skysynk og listedeling til «Explicitly out of v1» eller et tydelig trinn 2." (`FB:70`)

**Status: already actioned in the brief** per `ML:30–32, 35–36`. The PRD must not reintroduce it.

### 2.2 CRITICAL — Resolve the suggestion engine early in the PRD, and guarantee grader-runnability either way

> "Avklar forslagsmotoren tidlig i PRD-en, og beskriv hvordan sensor kan kjøre appen uansett valg. Velger dere en sky-KI (OpenAI/Claude) i tillegg til regelmotoren, må appen fortsatt virke uten nøkkel, for eksempel ved at den regelbaserte motoren brukes når nøkkel mangler." (`FB:22`)

*Clarify the suggestion engine early in the PRD and describe how the examiner can run the app whatever you choose. If you pick a cloud AI in addition to the rule engine, the app must still work without a key — e.g. the rule-based engine is used when the key is missing.*

- Restated as next step 2: "Ta beslutningen om forslagsmotor i PRD-en: bare regelmotor, eller regelmotor pluss valgfri språkmodell med automatisk reserve. **Skriv ned begrunnelsen.**" (`FB:107`)
- Cost/dependency risk flagged: "Velger dere en sky-modell, trengs plan for nøkkel, kostnad og reserveløsning. Det er åpent i dag." (`FB:62`)
- Placement of the open decision in the PRD is endorsed as correct: "Den åpne beslutningen om forslagsmotor er riktig plassert i PRD-en." (`FB:57`)

So the PRD owes: a **decision**, a **written rationale**, a **key/cost plan**, and an **automatic fallback** specified as a requirement (missing key *and* failed call both fall back — `FB:71`).

### 2.3 CRITICAL — Success criteria are unmeasurable; replace with testable fixtures

> "Erstatt brukersignalene «The default smart lists are the ones users actually open» og «under ~10 seconds» med kriterier som kan testes i emnet, for eksempel «oppgaven 'Lever innlevering i IBE160 fredag' får forslag om taggen skole og høy prioritet»." (`FB:23`)

- Part-by-part verdict **"Juster"**: "Kursmålene er greie, men brukersignalene kan ikke måles i emnet. Legg til konkrete testbare kriterier for forslag, smarte lister og arkivering." (`FB:86`)
- Quantified as next step 3: "**Lag 10–15 eksempeloppgaver med forventede tagger, prioritet og smarte lister, og bruk dem som suksesskriterier og testtilfeller.**" (`FB:108`)
- Same fixture requested twice more, from the AI-control angle: "Lag et fast sett med eksempeloppgaver og forventede forslag." (`FB:59`) and as a repo artifact: "en fast fil med eksempeloppgaver til testing" (`FB:102`).

The fixture is therefore **triple-purposed**: success criteria, test cases, and evidence that the maker can judge whether the AI's output is correct.

### 2.4 Secondary user persona is unsupported by v1

> Who This Serves — **"Juster"**: "Primærbrukeren er tydelig. Sekundærbrukeren (klassekamerater som deler liste) forutsetter synk og deling – vurder å flytte den til Vision sammen med funksjonene." (`FB:85`, also next step 1 at `FB:106`)

**Status: actioned** (`ML:32`). PRD must not write user stories for shared/classmate scenarios in v1.

### 2.5 Gap: repo tidiness was simply not addressed

> Criterion 7 — **"Juster"**: "**Ikke beskrevet.**" (*Not described.*) (`FB:102`)

The only outright omission the feedback names. The PRD (or architecture) must cover secrets handling (`.env.example`, `.gitignore`) and a fixed location for test fixtures and docs.

### 2.6 Things explicitly validated as OK (do not "fix" these)

Executive Summary, The Problem, The Solution, What Makes This Different, and Vision are all **OK** (`FB:81–84`, `FB:88`). Praised specifically: the honesty about not competing with Todoist/TickTick, and the **"AI proposes, human disposes"** principle where every suggested tag, priority and summary is shown and can be accepted, edited or rejected (`FB:16`); and the primary persona **"the multi-context juggler"** with the goal of *opening the app and seeing what's urgent today without having sorted anything yourself*, made concrete by the example "email the group about Thursday's meeting" (`FB:17`).

Overall verdict: **"Godt utgangspunkt med justeringer"** — good starting point with adjustments; the group may proceed and fold in the points (`FB:12`). Feasibility verdict: **"Gjennomførbart med justert omfang"** (`FB:66`).

---

## 3. Scope changes

### Cut from scope (after the brief was first written)

| Cut | Source | Reason given |
|---|---|---|
| Optional account / login | `FB:21`, `FB:70`, `ML:30–31` | Requires backend, login, conflict handling; "largest risk in the plan" for a solo project |
| Cloud sync | same | same; would mean building "two apps" (`FB:56`) |
| List sharing with classmates | same | same |
| Classmate/secondary persona | `FB:85`, `ML:32` | Depends on sync/sharing, which is no longer v1 |
| Notifications / reminders | `ML:18` | Decided out of v1 during brief drafting (no instructor involvement) |
| Real-time multi-device sync, merge/conflict-resolution UI | `ML:8`, `ML:27` | Out of v1 from the start |
| Success metric "most AI suggestions accepted / lightly edited" | `ML:18`, `ML:23` | Needs usage logging — "not worth it for scope". Dropped twice: it reappeared after the first drop and had to be removed again |
| "under ~10 seconds" capture-speed signal; "default smart lists are the ones users actually open" | `FB:23`, `ML:33` | Not measurable within the course |

### Added to scope

| Added | Source | Note |
|---|---|---|
| Fixture of 10–15 example tasks with documented expected tags, priority and smart-list placement | `FB:108`, `ML:33` | Now serves as the success criteria |
| Hard requirement: app runs for a grader **with no API key of their own**; rule engine is automatic fallback when key is missing *or* the call fails | `FB:22`, `FB:71`, `ML:34`, `ML:37` | Added to the brief's Open Decision Point |
| Candidate uplift: one optional LLM for summary + tags, rules as automatic fallback | `FB:48`, `FB:71` | Offered as the *preferred* way to raise difficulty, replacing sync |
| `.env.example` + `.gitignore` plan, fixed test-fixture file | `FB:102` | Conditional on taking in a cloud model; fixture unconditional |

### Deferred to Vision (explicitly a "trinn 2", not deleted)

Accounts, cloud sync, list sharing, and the classmate persona move to Vision as a later phase (`FB:70`, `ML:31–32`). Vision itself is validated as coherent and correctly separated from v1 (`FB:88`).

---

## 4. Constraints the PRD must respect

**Grader-runnability (hard constraint, 10 % of Part 1)**
- Runs locally from the README, with no group keys, no paid accounts, no own infrastructure (`FB:61`, `FB:101`).
- "Lokal-først uten innlogging er et stort pluss. **Pass på at dette fortsatt gjelder hvis dere legger til sky-KI eller synk-backend.**" (`FB:61`) — the constraint survives any AI-engine choice.
- The app must still work without an API key, via rule-engine fallback (`FB:22`, `ML:34`).

**Technology**
- BMAD for planning, Claude Code for implementation (`FB:52`).
- Stack must be ordinary and well documented — judged **OK**: "En responsiv webapp med lokal lagring er godt egnet." (`FB:58`)
- PWA/offline and "one responsive app across web, desktop, mobile, and tablet" are flagged as **extra testing effort**, though ordinary technology (`FB:58`). Single responsive PWA, local browser storage — confirmed (`ML:13`, `ML:18`).
- Technology choices must be justified and "ikke mer komplekse enn appen trenger" (`FB:100`).

**Solo-project constraint**
- "For et soloprosjekt er det den største risikoen i planen" (`FB:21`); scope must be realistic "for gruppen og semesteret" (`FB:97`); the local core is "godt innenfor rekkevidde for en gruppe på én person" (`FB:56`).
- Confirmed solo: "the user is the sole maker; the G16-shyam group repo is course logistics, not a scope change" (`ML:22`).

**Privacy / data handling**
- Baseline: no task data leaves the device unless the user opts into sync/sharing (which required login) — and cloud AI, if used, is opt-in on the same basis (`ML:16`).
- Rated **Lav** risk and explicitly praised: "Data lagres lokalt som standard, og personvernvalgene er gjennomtenkt i «Privacy Posture»." (`FB:44`)
- Wording reworked for a v1 with no account/sync/sharing (`ML:35`). **Open question this creates:** with sync/sharing gone, the opt-in mechanism that cloud AI was supposed to ride on no longer exists — see §6.2.
- Secrets must not land in the repo: `.env.example` + `.gitignore` if a cloud model is used (`FB:102`).

**Deadline mechanics**
- v1 must be "ferdig og stabil i løpet av semesteret, med tid til flere iterasjoner" — finished and stable within the semester with room for **several iterations** (`FB:56`), plus time for the full BMAD flow, testing, fixing and README (`FB:52`).
- **Conflict on the date — see §6.1.** Feedback is dated 2026-10-06; memlog says "submission end Nov 2026" (`ML:6`).

**Cost**
- Rule engine: zero cost (`FB:62`). A cloud model requires a documented plan for key, cost and fallback — "Det er åpent i dag." (`FB:62`)

---

## 5. Decisions and rejected alternatives (memlog)

### Decisions with reasons

| Decision | Reason / note | Line |
|---|---|---|
| Product is an AI-assisted CRUD task manager, solo IBE160 project; **grading weighted on AI feature implementation** | course framing | `ML:6` |
| AI role: suggests tags, priority, short summary; user accepts/edits/rejects each suggestion | user stays in control | `ML:7` |
| Local-first, no login, tasks in local device storage; targets web/desktop/mobile/tablet | — | `ML:8` |
| Target users: students/classmates and individuals juggling many tasks across parts of life | — | `ML:9` |
| Assignment scope: difficulty **"Simple"**; login optional (only for sync/sharing); **no e-commerce**. Inputs: task text, due dates, project association, notes. Outputs: suggested tags, priority, summary, smart lists | assignment-level constraints | `ML:11` |
| Rule-based / keyword suggestions as the **cheap, offline, user-friendly baseline**; optional upgrade to cloud AI (OpenAI/Claude) or a small local model; app itself runs locally; **exact provider still open** | cost + offline + UX | `ML:15` |
| Privacy: no task data leaves the device unless user opts into sync/sharing (login-gated); cloud AI opt-in on the same basis | — | `ML:16` |
| Archiving: completed tasks archived after **30 days by default, user-configurable** | — | `ML:17` |
| Single responsive PWA with local browser storage; notifications/reminders out of v1 | — | `ML:18` |
| The suggestion-engine choice **carries grading weight**, and a **rules-only v1 may not meet it**; flagged as the first thing to resolve in the PRD | course leans on the AI feature | `ML:25` |
| Sync conflicts: last-write-wins, no merge UI in v1 | — | `ML:27` (now moot — sync is out) |

### Rejected / reinterpreted alternatives

| Rejected | Reason | Line |
|---|---|---|
| "AI does almost everything" / autonomous AI action | Reinterpreted: **AI removes manual metadata work, not autonomous action**. Q1 resolved in favour of suggest-and-confirm | `ML:10` |
| Separate native builds per platform | Assumed instead: one responsive PWA spanning web/desktop/mobile/tablet (tagged `[ASSUMPTION]` in the brief because Q4 went unanswered) | `ML:13` |
| Success metric "most AI suggestions accepted / lightly edited" | Needs usage logging — "not worth it for scope" | `ML:18`, `ML:23` |
| "Zero backend" claim | **Overclaim.** Reframed as "local-first by default", stating plainly that opt-in sync/sharing/cloud-AI add a minimal backend | `ML:24`, `ML:29` |
| "Competitors don't do AI tagging" framing | Corrected: competitors **do** ship AI tagging, usually paid; the free path still leaves sorting to the user. The "people skip organizing" premise was grounded in the maker's own experience | `ML:26` |
| Optional account + basic sync in v1 | **Overridden by instructor feedback** — see below | `ML:30` |

### The one recorded override

> "(override) Instructor feedback (tilbakemelding-product-brief.md, 2026-10-06) **reverses prior decision 'optional account + basic sync stays IN v1'**: moved optional account/cloud sync/list sharing OUT of v1 into Vision/out-of-scope, due to solo-project backend/login/conflict-handling risk. **User approved the reversal.**" (`ML:30`)

Note the before-state: `ML:24` had earlier insisted "Optional account + basic sync stays IN v1 per prior decision — **no scope reversal**." The override at `ML:30` is what flipped it. Anything in older notes asserting sync is in v1 is stale.

### Open decision points carried forward

> "(decision) Open decision points carried from assignment, left open in brief: **classification model vs rule-based; privacy choices (local vs cloud AI); archiving rules.**" (`ML:12`)

Archiving was later closed (`ML:17`, 30 days configurable). Classification-model-vs-rules and local-vs-cloud-AI privacy remain the PRD's job (`FB:22`, `FB:107`).

### Process events worth citing for the 30 % process criterion

- Brief was **revised once before** the instructor feedback (`FB:96`), then updated again per feedback; dates bumped 2026-09-10 → 2026-10-16 (`ML:28`, `ML:36`).
- A **validation run against the brief's own purpose** was performed by a coach, findings reviewed with the user and approved (`ML:21`).
- A **memlog audit** confirmed all 13 substantive entries were reflected in brief.md, so no addendum was needed (`ML:19`, repeated at `ML:37`).
- Committed to git at project root (branch main, `d88e22d`) and copied into the G16-shyam group repo (branch main, `73bb170`, **not pushed**) (`ML:20`).

---

## 6. Conflicts, ambiguities and unresolved items

### 6.1 CONFLICT — submission date

- Memlog: "submission **end Nov 2026**" (`ML:6`).
- The task framing given to me: **second week of December 2026**.
- Neither source file states a December date; the most recent repo commits (`Oppdater innleveringsdato til andre uke i desember 2026`) moved it to December, i.e. **the memlog line is stale**, not authoritative. Treat December as current, but note the memlog contradicts it and was never corrected.

### 6.2 AMBIGUOUS — the opt-in basis for cloud AI lost its carrier

The privacy decision made cloud AI "opt-in on the same basis" as sync/sharing, i.e. **login-gated** (`ML:16`). Sync, sharing and accounts are now out of v1 (`ML:30–31`), and the privacy text was reworded for a v1 with no account (`ML:35`). So *if* the PRD adopts the optional LLM, there is no longer a defined consent mechanism for sending task text to a third party. **The PRD must define a new local opt-in (a settings toggle, explicit consent copy, clear statement of what leaves the device).** Not addressed in either source.

### 6.3 UNRESOLVED — the suggestion engine itself (the central open decision)

Neither source closes it. The tension is explicit:
- The course "leans on the AI feature" and "**a rules-only v1 may not meet it**" (`ML:25`).
- Yet the instructor rates in-app AI functionality as difficulty **Lav** with "Regelbasert/nøkkelordbasert motor som standard" (`FB:40`) and declares the whole project **"Enkel"** anyway (`FB:29`) — while warning that to "reach the top" a simple project needs more in execution (`FB:48`).
- The instructor's own preference is legible: one optional LLM with rule fallback is the recommended uplift, "mer i tråd med kjerneideen enn synk" (`FB:71`).

**Tension worth naming in the PRD:** the student's reading (`ML:25` — rules-only may be insufficient for grading) is *stronger* than anything the instructor actually wrote. The feedback never says rules-only fails; it says rules-only is acceptable and legitimately testable, and that an LLM is an optional uplift. The PRD should decide on execution-quality grounds, not out of fear that rules-only is disqualifying.

### 6.4 AMBIGUOUS — "en gruppe på én person"

The feedback addresses the reader as plural "dere" throughout and heads the document "Gruppe G16 – G16-shyam" (`FB:5`), while simultaneously assessing "en gruppe på én person" (`FB:56`). Consistent with `ML:22` (solo; group repo is course logistics). No real conflict, but the PRD should state the solo constraint plainly since the feedback's phrasing can read as team-sized.

### 6.5 Possible mismatch — difficulty-raising extension vs. the brief as I understand it

The brief (as described to me) keeps the engine choice open. The feedback effectively offers a **trade**: drop sync (done), and *consider* spending the recovered capacity on one optional LLM (`FB:48`, `FB:71`). Whether that trade was accepted is **not recorded** in the memlog — `ML:34` only adds the no-API-key fallback requirement, it does not commit to adding an LLM. **Unresolved.**

### 6.6 Smaller unresolved threads

- **PWA/offline testing burden** is flagged (`FB:58`) but no test plan exists for it. Multi-form-factor responsive behaviour is called out as needing "litt ekstra testing".
- **UX deliverable named but not specified**: "Vis i UX-steget hvordan godta/endre/avvis ser ut på mobil og PC." (`FB:99`) — the accept/edit/reject interaction must be shown on both mobile and desktop in the UX step. The PRD should set that expectation for the downstream UX document.
- **Cost/key plan for a cloud model** is still "åpent" (`FB:62`).
- The `[ASSUMPTION]` tag on single-responsive-PWA (`ML:13`) was never converted into a confirmed requirement by an answer from the user — it was self-confirmed at `ML:18`.

---

## 7. Qualitative / philosophical material a requirements document would drop

- **"AI proposes, human disposes"** is named by the instructor as the brief's clear *principle*, with every suggestion for tags, priority and summary shown and acceptable/editable/rejectable (`FB:16`). This is the product's identity, not a feature row.
- The **core user moment**: open the app and *see what's urgent today without having sorted anything yourself* (`FB:17`). The primary persona is "**the multi-context juggler**".
- **Honesty as a virtue**, twice praised: "Briefen er ærlig og godt avgrenset" (`FB:16`) and "Ærlig om konkurrentene og med et forsvarbart standpunkt («suggestion-first»)" (`FB:84`). The brief's willingness to say it will *not* compete with Todoist/TickTick is treated as a strength. A PRD that inflates claims would lose this.
- **"Suggestion-first"** is the defensible market position (`FB:84`).
- The problem image worth preserving: the list degenerating into a **"flat pile"** (`FB:82`), and the concrete capture example "email the group about Thursday's meeting" (`FB:17`).
- **AI removes manual metadata work — it does not act autonomously** (`ML:10`). The reinterpretation of an earlier "AI does almost everything" ambition. This is the boundary for every AI requirement in the PRD.
- **Grounded authenticity**: the "people skip organizing" premise is deliberately grounded in the maker's own experience rather than invented research (`ML:26`), and competitors are credited with shipping AI tagging already (usually paid) (`ML:26`). The differentiator is the free, local, suggestion-first path — not novelty.
- **The maker must be able to judge the AI's output.** "Dere kan selv avgjøre om en oppgave fikk fornuftige tagger og riktig plass i en smart liste." (`FB:59`) Explainable, human-checkable suggestions are a design value, not just a test convenience.
- **The instructor's closing posture**: "Det er mye enklere å rette nå enn sent i semesteret." (`FB:75`) — fix it now; cheap early, expensive late.
- **Design must be "gjennomarbeidet"** (thoroughly worked) for a simple project to score at the top (`FB:48`). Craft is explicitly part of the grade, not polish.

---

## 8. Feasibility ratings worth carrying into the PRD's risk section

From `FB:54–62`, only two items were rated **Risiko** (everything else OK):

1. **Time and scope** — because accounts/sync/sharing in the same v1 means building two apps (`FB:56`). *Mitigated by the scope cut.*
2. **Dependencies and costs** — a cloud model needs a plan for key, cost and fallback; "Det er åpent i dag." (`FB:62`) **Still open.**

Difficulty-factor table (`FB:35–44`): every factor rated **Lav** except **Sanntid/samtidighet = Middels**, and that one is explicitly "Lav hvis dette flyttes ut" (`FB:42`) — which it now is. Also: "Valgfri konto øker nivået til middels hvis den blir med i v1" (`FB:39`). With the cut applied, the project is uniformly low-complexity, which is exactly why §1.4's execution-quality bar is the operative constraint.
