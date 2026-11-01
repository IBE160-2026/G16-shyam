# Research extract for PRD — suggestion engine requirements

**Purpose:** source-extraction pass for the To-Do-List PRD (IBE160, due second week of December 2026). Pulls out every number and behavior from the suggestion-engine research that can be written as a requirement or acceptance criterion.

**Sources extracted:**
- `.docs/planning-artifacts/research/technical-suggestion-engine-selection-2026-10-28/research.md` (main synthesis, 33 cited sources, 5 verified / 2 disputed claims, red-team pass NOT run)
- `...\.memlog.md`
- `...\digests\claude-api-r1-1.md`
- `...\digests\rule-based-r1-1.md`
- `...\digests\openai-api-r1-1.md` (consulted only where it constrains the chosen design — the reasoning-effort latency mechanism)

**Decision already made and not reopened here:** rule-based/keyword classifier as the permanent automatic fallback, plus an optional Claude API (Haiku) path as the primary engine whenever a key is present. The research's own verdict matches this: *"Pick: rule-based classifier (always present, as fallback) + Claude API as the optional primary path when a key is configured"* (research.md § Verdict). Model named: **Claude Haiku 5.5, model id `claude-haiku-5-5`, released 2026-10-07** [11][12], digest claude-api-r1-1 finding 1.

Citation numbers in square brackets are the research's own source-appendix numbers, preserved so they resolve back to research.md § Source appendix.

---

## 1. Latency

### 1.1 The dispute (DISPUTED — report both, do not average)

The research explicitly labels Claude Haiku 5.5 short-call latency as a **disputed** claim (`claims_disputed: 2` in frontmatter; memlog `ref=[4] status=disputed class=latency pub=2026`).

| Side | Figure | Who claimed it | Exact wording |
|---|---|---|---|
| **Fast** | **~0.7–1.0 s** | respan.ai (secondary benchmark tracker), via [13] | "one benchmark tracker reports sub-second responses (~0.7–1.0s) for short Haiku-tier completions" (research.md § Candidate 2). Digest detail: "Haiku 4.5: 0.96s short-answer; Haiku 5.5: 0.7s response latency per one tracker" — i.e. the 0.96 s figure is for the *predecessor* model on short-answer Q&A, and the 0.7 s figure is for Haiku 5.5 |
| **Slow** | **9.6–13.4 s** time-to-first-answer-token | **artificialanalysis.ai**, on its own Haiku 5.5 model pages, for the **"low" and "medium" reasoning-effort variants** | "artificialanalysis.ai's own Haiku 5.5 pages report 9.6–13.4 seconds 'time to first answer token' for the low/medium reasoning-effort variants" [13] |

Confidence the research assigns this claim: **Low-medium (disputed)** [13].

The research refuses to reconcile them: *"Both can't be describing the same call shape"* (§ Candidate 2).

### 1.2 What drives the difference — the one CONFIRMED mechanism

This is the actionable part and the research treats it as confirmed, not disputed:

> "Both cloud APIs share one confirmed, actionable mechanism behind latency swings like this: a **'reasoning effort' setting that must be explicitly pinned to its lowest value** for a short classification call, or response time can balloon by **10–100x**." (§ Executive summary) [13][21]

Evidence for the mechanism is **asymmetric** — it is clean on OpenAI and contradictory on Claude:

- **OpenAI gpt-5-nano (cross-reference, confirms the mechanism):** "minimal" reasoning effort → **~0.8 s** time-to-first-token; "medium"/"high" effort on the *same model* → **37–118 seconds** [21]. Research confidence: Medium. Source: artificialanalysis.ai GPT-5-nano provider benchmarks.
- The research's reading of the Claude dispute: *"the most likely explanation, consistent with what's confirmed for OpenAI's equivalent model, is that the slow numbers reflect reasoning/extended-thinking overhead that a short, non-reasoning classification call should be able to avoid by explicitly setting effort to minimal"* (§ Candidate 2).
- Cross-dimension insight: *"OpenAI's reasoning-effort latency mechanism is confirmed with a clean, internally-consistent number set; Claude's own evidence trail is contradictory across sources in this round."*

### 1.3 The research's own best estimate for *this app's* call shape

> "Best current estimate for this app's non-reasoning, short structured-output call: **sub-second to low single-digit seconds (order of magnitude ~1–2 s)**, but this is not pinned to an authoritative, dated Anthropic benchmark" — digest claude-api-r1-1, finding 5. **Confidence: low.** Class: latency. Source: synthesis, not a citation.

### 1.4 What the research tells the PRD to do about it

- Open question #1, verbatim: *"**Empirically time a real Claude Haiku 5.5 call with reasoning effort pinned to minimal**, before trusting either the sub-second or the 9–13-second number from this report — the two sources disagree and this directly affects whether a loading-state UX is needed."*
- § Verdict, strongest argument against the pick: *"If Haiku 5.5's slower, reasoning-effort-engaged numbers (9.6–13.4s) turn out to be what a real implementation actually gets by default rather than an artifact of the benchmark's own settings, Claude would feel meaningfully slower than OpenAI's more consistently-sub-second nano tier for the same task. This is **testable in under an hour with a real API key and should be done before finalizing the provider choice in the PRD**."*
- Digest lead: the dispute is *"worth re-checking directly against Anthropic's own docs/performance notes, or running a quick empirical timing test with a real API key before committing to a UX assumption (e.g., whether a loading spinner is needed per task)."*
- Latency weight in the decision matrix: **Medium (weight 2)**, criterion phrased as "feels instant on task capture". Claude API scored 3/5 on latency vs. rule-based 5/5.

### 1.5 Timeout-setting implications (derived, flagged as derived)

The research does **not** state a numeric timeout value anywhere. What it does give:

- It requires "a short timeout" (digest finding 14) and "set explicit short timeouts" (digest lead) — but see §4.4: that whole cluster of advice is explicitly flagged as unsourced.
- Any timeout chosen must be reconciled against the dispute: a timeout below ~9.6 s would convert the slow-side scenario into a 100% fallback rate; a timeout above ~13.4 s would make the slow-side scenario a 13-second blocking wait on task capture. **A single timeout number cannot satisfy both sides of the dispute** — so the PRD should either (a) pin reasoning effort to minimal AND set the timeout from the measured value in the pre-implementation timing test the research mandates, or (b) state the timeout as a configurable value with a provisional default and the timing test as an acceptance gate.
- The research gives no measured rule-based latency for this app either, only an architectural certainty: *"near-zero marginal cost and sub-millisecond latency is a logical/architectural certainty rather than an empirically benchmarked claim for this exact use case"* — confidence high (architectural reasoning, not a citation) [10], digest rule-based finding 13. Proxy throughput figure: wink-nlp benchmarks itself at **525,000+ tokens/second** [9] — explicitly labelled "indirect evidence; not this exact app's rule engine".

---

## 2. Cost

### 2.1 Claude Haiku 5.5 token pricing — VERIFIED (primary source, directly fetched)

memlog: `ref=[2] status=verified class=pricing pub=2026-10`. Source: `claude.com/pricing`, Anthropic's own live pricing page [11]. Confidence: **High**.

| Item | Price | Note |
|---|---|---|
| Input, prompts ≤100K tokens | **$0.10 / MTok** | [11] |
| Output, prompts ≤100K tokens | **$0.50 / MTok** | [11] |
| Input, prompts >100K tokens | **$0.50 / MTok** | digest claude-api-r1-1, finding 1 |
| Output, prompts >100K tokens | **$2.50 / MTok** | digest finding 1 |
| Prompt-cache read | **$0.01 / MTok** | digest finding 1 |
| Prompt-cache write | **$0.125 / MTok** | digest finding 1 |

Context: this is a **~90% price cut vs. Claude Haiku 4.5** ($1.00 / $5.00 per MTok) [12]. Confidence: Medium (secondary release coverage — cellcog.ai, developersdigest.tech, ~2026-10-07).

### 2.2 Per-call cost for this exact feature — DERIVED

- Assumed call shape: **~200–500 input tokens, ~50–150 output tokens** (short task text in, short `{tags, priority, summary}` JSON out).
- Resulting cost: **≈ $0.00005–$0.0001 per call**; digest states "well under $0.0005 per call". Confidence: High, but labelled "(derived, not a direct quote)" — digest claude-api-r1-1, finding 3; research.md § Candidate 2.
- Research's characterisation: *"negligible at course-project scale."*
- Cross-reference for scale (OpenAI gpt-5-nano, § Candidate 3): "even 1,000 classification calls would cost only a few cents" — useful as the order of magnitude for a 10–15-task test fixture plus manual testing.
- Runner-up comparison: gpt-5-nano at **$0.05 / $0.40 per MTok** [19][20] → **≈ $0.00003–$0.00006 per call**, "slightly cheaper than Claude Haiku at the token level."

### 2.3 Free credits — WEAKEST-EVIDENCED PART, needs direct confirmation

Research verdict on this cluster: *"**Free tier / rate limits are the weakest-evidenced part of this candidate.**"* (§ Candidate 2)

| Figure | Value | Source quality |
|---|---|---|
| Anthropic new-account free credit | **~$5, one-time** | **Low-medium** — ssdnodes.com, grabaicredits.com; *"not confirmed on any Anthropic-owned page"* [14] |
| Claiming requirement | SMS verification, **no credit card required** | same, [14] / digest finding 6 |
| Expiry | **~14 days** after claiming | same, [14] |
| Lowest "Evaluation" tier rate limits | **~5 RPM**, 20K input-tokens/min, 4K output-tokens/min | **Low** — aifreeapi.com only [15] |
| After first $5 added (Tier 1) | **~50 RPM** | **Low** [15] |

The digest's own warning: these came *"only from third-party 'how to get free API credits' aggregator sites, several of which look like SEO content farms (not Anthropic-owned). Verify directly at console.anthropic.com (Billing / Limits pages) before the project depends on them."* And: re-verify at `console.anthropic.com/limits` before shipping.

Mitigating finding: *"Course-project-scale usage is trivially within any of these limits regardless of the exact numbers"* [15] — and *"These limits are far above what a solo student's to-do-list app would need (classifying individual tasks one at a time, interactively)"* (digest finding 8, confidence medium, reasoning not independently sourced).

Cost weight in the decision matrix: **Medium-high (weight 2.5)**, phrased "ideally near-$0 to run and to test". Claude API scored 4/5; rule-based 5/5.

### 2.4 Cost of the rule-based path

**Zero marginal cost**, by construction — "architectural certainties (synchronous, in-process, no network call) rather than something separately benchmarked" [10], corroborated by `ops-task-triage`'s own "no API key required... runs offline" description [2].

---

## 3. Accuracy

### 3.1 The gap (DISPUTED — report both, do not average)

memlog: `ref=[1] status=disputed class=accuracy pub=n.d.` The research reports this honestly *"rather than averaged"*.

| Side | Figures | Source | Research confidence |
|---|---|---|---|
| **Wide gap** | **rule-based 69.4% vs. ML 87.5%** accuracy, same task, **task unspecified** | ResearchGate, *"A Comparative Analysis of Rule-Based and Machine Learning Decision Systems Under Normal and Edge-Case Conditions"* — **full text inaccessible (HTTP 403); figures taken from a search snippet only** [1] | **Low (disputed)**; digest: "treat as a directional data point only, not a precise number to cite confidently" |
| **Narrow / task-dependent gap** | No single number. Rule-based and ML approaches **"perform well on different parts"** of the same text collection, and **combining them outperforms either alone** | arXiv, *"Extracting actionable information from microtexts"* (arxiv.org/pdf/2008.00343) — peer-reviewed [7] | **Medium** |

Research's own reading: the second source *"suggest[s] the gap is real but **narrower and more task-dependent** than a single headline number implies"*, and *"rule-based engines are competitive on a subset of clear-cut cases even if weaker in aggregate"* (digest rule-based, finding 7).

**Critical scoping caveat:** *"Neither source measured todo-task tagging specifically."* And open question #5: *"**No direct benchmark exists for rule-based vs. AI accuracy on todo-task tagging specifically** — every figure here is from an adjacent domain, and the two sources on this point actively disagree on the gap's size."*

### 3.2 Documented ceiling of the rule-based path, from people who shipped one

This is the strongest-sourced accuracy evidence in the whole research (two High-confidence sources) and it is *qualitative*:

- **`fazal305/nightbeacon`** — its own README "Limitations" section states the keyword classifier **"can misjudge priority on ambiguous text."** [3] Confidence: **High** (documented production experience).
- **`bassam-111/ops-task-triage`** (Flask) — classifies tasks into **5 categories and 4 priority levels** using "urgency words and deadlines", runs fully offline with no API key; **its own README lists "LLM-based classification" as its top future-improvement item** — *"which is itself evidence of a known accuracy ceiling from someone who built and lived with the rule-based version"* [2]. Confidence: **High**.
- General trade-off, from survey literature: rule-based *"need[s] no labeled training data but demand[s] strong upfront domain/keyword knowledge and ha[s] documented generalization limits versus ML"* [8] (arXiv 2008.00364, *A Survey on Text Classification*). Confidence: Medium.

**Shape of the realistic ceiling for the PRD:** the rule-based fallback can be expected to perform acceptably on *clear-cut, keyword-bearing* task text and to degrade specifically on **ambiguous text** and **priority** (not tags) — that is the failure mode both shipped projects name. No numeric accuracy target is sourceable from this research.

### 3.3 How to generate the missing number

Open question #5, verbatim: *"The brief's own planned **10–15 example-task test fixture** is the right way to generate this evidence locally."* This is the research's recommended acceptance-criteria mechanism — a fixed fixture of 10–15 example tasks with expected `{tags, priority, summary}`, run against both engines.

Suggestion-quality weight in the decision matrix: **High (weight 3)**. Scores: rule-based only **2/5**, Claude API **5/5**, local model 3/5. (Research's own judgment, "re-weight freely".)

### 3.4 The hybrid-escalation precedent (relevant to a future rule, not a v1 requirement)

`nightbeacon`'s own issue tracker *"proposes escalating only low-confidence/ambiguous cases to a small LLM rather than replacing the rule engine outright"* [3] — *"close to the exact architecture this report recommends."* Digest lead flags it as *"Worth considering as a **v2 upgrade path rather than a v1 requirement**."* Note this is a *different* routing policy from the chosen design (chosen design: API-primary-when-key-present; nightbeacon: rules-primary, escalate only on low confidence). The 0.35 confidence floor in §5.1 is what would make the nightbeacon policy implementable later.

---

## 4. Fallback and failure behavior

### 4.1 The hard gate this all serves

From § Requirements frame (sourced from the product brief and instructor feedback, **not** from web research):

- *"Must run end-to-end for a grader with no API key or paid account of their own → **a rule-based fallback is mandatory, not optional**, regardless of which AI layer (if any) is added"*
- *"Stays local-first: no backend, no login requirement introduced by the suggestion engine itself"*
- *"Buildable solo, alongside the rest of the CRUD/smart-lists app, by the second week of December 2026"*
- *"Default path never sends task data anywhere without explicit opt-in"*

### 4.2 The architecture the research prescribes

§ Verdict, "Cheapest reversibility hedge":

> "build the suggestion engine behind **one interface — a function returning `{tags, priority, summary}`** — with the rule-based classifier and the chosen API call as **interchangeable implementations**. This is already required by the mandatory-fallback architecture, so it costs nothing extra to also make the AI provider swappable later."

And: *"should also become an explicit **architecture constraint** (the swappable-provider interface) once architecture work starts."*

### 4.3 Named failure modes and the research's recommended behavior

What the research **actually names**, with the strength of each:

| Failure mode | Named in research? | Recommended behavior as stated | Source / strength |
|---|---|---|---|
| **Missing API key** | **Yes, explicitly** | Do not call; fall back to rule-based. Specifically: *"falling back to the local rule-based classifier on any error or on **absence of an `ANTHROPIC_API_KEY` env var**"*; and *"**check for key presence before calling**"* | digest claude-api finding 14 (confidence: medium, "synthesized recommendation, not a direct citation"); digest lead (explicitly unsourced — see §4.4) |
| **Any API error (catch-all)** | **Yes** | *"guarded by a **try/catch** with a short timeout, falling back to the local rule-based classifier on **any error**"* — a single catch-all path, not per-error handling | digest claude-api finding 14, confidence medium (synthesized) |
| **Timeout** | **Yes, by name** | *"set **explicit short timeouts**"* and *"guarded by a try/catch with a **short timeout**"* → fall back. **No numeric value given anywhere in the research.** | digest finding 14 + digest lead (unsourced) |
| **Retry behavior** | **Yes, by name** | *"**avoid infinite retry loops**"* — the only retry guidance in the research; no retry count, no backoff policy specified | digest lead (unsourced) |
| **Output-shape parity** | **Yes, by name** | *"**keep the local classifier's output shape identical to the API's**"* — the fallback must be transparent to callers | digest lead (unsourced) |
| **Invalid / revoked key** | **Not named separately** | Covered only by the catch-all "any error" path. The research never distinguishes a 401 from a network error. | — |
| **Network offline** | **Not named separately** | Covered only by the catch-all. Note the brief's own requirement that the app "works offline" is a product requirement, not something the research addresses for the API path. | — |
| **Rate limit (429)** | **Not named as a handled failure mode** | The research discusses rate limits only as *capacity* (~5 RPM evaluation tier → ~50 RPM Tier 1 [15]) and argues they will never be hit: *"far above what a solo student's to-do-list app would need."* No 429 handling behavior is recommended. | [15], digest finding 8 |
| **Quota / credit exhausted** | **Not named as a handled failure mode** | Only the ~$5 credit with ~14-day expiry [14] is noted — the expiry is itself a quota-exhaustion trigger a grader could hit — but no behavior is prescribed. | [14] |
| **Malformed / unparseable model output** | **Not named as a handled failure mode** | The research's answer to this is *prevention*, not recovery: schema-constrained output via `output_config.format.json_schema`, which *"constrains the response to valid JSON matching a provided schema"* (§5 below). **No retry-on-unparseable behavior is specified anywhere.** | [16] |

### 4.4 Explicit honesty flag on §4.3 — most of it is UNSOURCED

The research says so itself, verbatim (digest claude-api-r1-1 § Leads):

> "A search for developer write-ups on 'graceful fallback when no API key' gotchas returned **low-provenance results not treated as evidence**; the underlying engineering gotchas (check for key presence before calling, set explicit short timeouts, avoid infinite retry loops, keep the local classifier's output shape identical to the API's) are **standard practice but not substantiated by a credible source here**."

And in § Could not find: *"No credible, dated developer blog/post specifically documenting pitfalls of the 'Claude API with local-rule-based fallback' pattern described in this brief."* The OpenAI digest reports the identical gap: *"No well-sourced, clearly-dated developer writeup specifically about the complexity/gotchas of implementing 'graceful fallback when no API key is present'."*

**Consequence for the PRD:** the fallback/failure requirements are the part of the design with the *least* external evidence behind them. They are engineering judgment, and the PRD should own them as such rather than cite them. The five gaps in the table above (invalid key, offline, 429, quota, malformed output) are **gaps in the research, not settled behaviors** — the PRD must decide them, and the honest framing is "no source consulted; standard practice."

### 4.5 Implementation-complexity context for the fallback

Implementation complexity weight: **High (weight 3)**, scored as *ease*: rule-based only **5/5**, Claude API **3/5**. The 2-point gap is the cost of the API layer plus its fallback machinery, in the research's own judgment.

---

## 5. Prompt / structured-output shape

### 5.1 The confirmed mechanism — Anthropic Structured Outputs

VERIFIED, primary source, fetched directly: `platform.claude.com/docs/en/build-with-claude/structured-outputs` [16]. Confidence: **High**.

- Parameter: **`output_config: { format: { type: "json_schema", schema: { ... } } }`** on the Messages API (`POST /v1/messages`).
- Effect: *"constrains the response to **valid JSON matching a provided schema**"*.
- Status: **GA feature**. **The older `output_format` parameter is deprecated** — digest claude-api finding 9. (Important: do not write the deprecated parameter into the PRD or architecture.)
- Auth: **`x-api-key` header**, plus an **`anthropic-version` header**.
- No SDK required: *"can be made with no SDK at all (`curl`/`fetch`)"*. Official SDKs — **`@anthropic-ai/sdk` for JS/TS**, `anthropic` for Python — wrap the same endpoint.
- Convenience helper: `client.messages.parse()` for schema/Pydantic-typed output — **Python SDK only**, per the digest. The research does **not** claim a JS/TS equivalent of `.parse()`.

### 5.2 The call shape the research recommends for this app

> "the simplest viable pattern is: **one `fetch`/SDK call per task** with `output_config.format.json_schema` requesting **`{tags, priority, summary}`**, guarded by a try/catch with a short timeout, falling back to the local rule-based classifier on any error or on absence of an `ANTHROPIC_API_KEY` env var" — digest claude-api finding 14. Confidence: **medium (synthesized recommendation, not a direct citation)**.

Note the granularity: **one call per task**, synchronous with capture — not batched. This is what makes latency (§1) a UX-blocking concern.

### 5.3 Retry on unparseable output

**Nothing in the research.** No retry-on-unparseable policy, no repair prompt, no fallback-to-rules-on-parse-failure rule is stated. The research's entire answer to malformed output is schema enforcement at the API level (§5.1). Treat the post-parse validation layer (does the returned `priority` match the app's allowed enum? are tags within length/count limits?) as an undecided PRD question.

### 5.4 The one prompt-level setting the research does insist on

Pin **reasoning effort to its lowest/minimal value** on the classification call. This is not presented as optional tuning — it is the confirmed mechanism behind the 10–100x latency swing (§1.2) [13][21]. The research states it for both providers. It gives no parameter name for Anthropic's version of the knob.

### 5.5 Runner-up equivalent (for the swappable-provider interface only)

OpenAI: Responses API `/v1/responses` with **`text.format`** JSON-schema parameter, **`strict: true`** ("Structured Outputs"); older Chat Completions `response_format` + `json_schema` also works; auth `Authorization: Bearer`; `client.responses.parse` in Python and JS SDKs [24]. Confidence: High, primary source. Relevant only because the interface must stay swappable.

---

## 6. Rule-based engine design

### 6.1 The concrete, reusable rule design — the single most directly usable finding

Source: `frankda94/homework-management-app`, **Issue #3** [4]. Confidence: **Medium — spec only**; *"no confirmation it was actually implemented or that its accuracy was measured."*

Full worked design, as stated:

1. **Lowercase and tokenize** the task text.
2. **Weight two-word phrases at 3** and **single tokens at 1**.
3. Apply **urgency / deferral keyword maps** to set priority: **high / low, with medium as the default**.
4. Enforce a **0.35 confidence floor**.
5. **Resolve ties and zero-matches to an "other" category.**
6. Implement as **one pure synchronous function**.

Research's own note: *"This is directly adaptable to this project's tags/priority/summary suggestion engine"* (§ Candidate 1) and *"a concrete, directly reusable pattern"* (digest lead). The 0.35 floor is also what would enable the nightbeacon-style low-confidence escalation later (§3.4).

### 6.2 Second worked precedent — category and priority cardinality

`bassam-111/ops-task-triage` (Flask) [2], confidence **High**:
- **5 categories**, **4 priority levels**
- Keyed on **"urgency words and deadlines"** — note this is the only place the research names **date/deadline parsing** as a classifier input, and it names it only at this level of detail. No date-parsing library, grammar, or format list is given anywhere in the research.
- Runs **fully offline, no API key**.

### 6.3 Known weak spot to design around

`fazal305/nightbeacon` [3], confidence **High**: the keyword classifier **"can misjudge priority on ambiguous text."** Priority on ambiguous text is the named weakness — not tags, not categorisation of clear text.

### 6.4 JS/TS library landscape — and the conclusion that none of them does the job

Sources [5][9], confidence Medium.

| Library | What it is | Fit |
|---|---|---|
| **`compromise`** | Lightweight rule-based NLP; **no model files, no training data**; good for parsing grammar/entities | *"not built for classification"* |
| **`natural`** | Ships **actual trainable classifiers** — Naive Bayes, logistic regression | **Requires training data** — "not rule-based by default"; conflicts with the no-training-data premise |
| **`wink-nlp`** | Fast, small-footprint (**under ~1,500 lines**), supports custom rule-based entities via **`learnCustomEntities`**; self-benchmarked at **525,000+ tokens/sec** | Closest fit for rule/pattern work, but still not a classifier |
| `talkify-classifier-keywords` | Keyword-based topic classification, instantiated directly from rule lists, **explicitly requires no training data** | digest rule-based finding 1, confidence medium. Not carried into research.md's synthesis. |

**The research's conclusion, verbatim:** *"**None is a drop-in 'classify this task' library** — the classification logic itself is still hand-written keyword/regex rules on top."* (§ Candidate 1)

### 6.5 What was NOT findable about the rule-based engine

From digest rule-based § Could not find:
- No head-to-head accuracy benchmark (≤12 months) for tag/priority inference in task-management apps specifically.
- **No solo-developer build-time estimate** (hours/days) and **no maintenance-burden evidence** (e.g. "we had to add N new keywords per month") for a rule-based tagging/priority classifier in a small app. → The PRD cannot source an effort estimate for the fallback from this research.
- No primary source with measured millisecond latency for an on-device keyword/regex classifier in a to-do app — only the wink-nlp throughput proxy.

---

## 7. Privacy

### 7.1 The product-level gate (from the brief, not from web research)

> "**Default path never sends task data anywhere without explicit opt-in**" — § Requirements frame.

This is the binding requirement. Combined with the hard gate that the app must run end-to-end with no key, it means: **rule-based is the default path; the API path is opt-in.** Privacy weight in the matrix: **Medium (weight 2)**, phrased "data leaving the device". Scores: rule-based **5/5**, Claude API **2/5** — the research's own judgment that the API path is a real privacy cost, not a neutral one.

### 7.2 What can be truthfully disclosed to the user about the Claude API path

VERIFIED, **the strongest-sourced privacy claim in the report** — *"primary source, directly fetched, dated"* (§ Candidate 2). Source: `privacy.claude.com`, Anthropic's own privacy center, fetched live, page references a policy **dated 2026-08-18** [17]. Confidence: **High**. memlog: `ref=[5] status=verified class=privacy pub=2026-08`.

- Direct quote captured in the digest: *"**By default, we will not use your inputs or outputs from our commercial products (e.g. Claude for Work, Anthropic API, Claude Gov, etc.) to train our models**"*.
- **API data is auto-deleted on the backend within 30 days** unless the customer explicitly opts in to longer retention.
- Caveats in the same source: if the customer opts in, retention can extend; and *"some newer 'Covered Models' require 30-day retention and are excluded from Zero Data Retention"*.
- **Explicitly different from consumer claude.ai Free/Pro/Max**, where conversations may be used to improve models unless the user opts out [17][18]. Research's framing: this *"confirms the API path (this candidate's path) is the privacy-safer one for sending student task text."*

### 7.3 Privacy of the fallback path

By construction, **no task text can leave the device** on the rule-based path — no network call exists in the architecture [10]; corroborated by `ops-task-triage`'s "no API key required... runs offline" [2]. Confidence: High (architectural).

### 7.4 What the research does NOT say about privacy — gaps the PRD must close itself

- **Nothing about where the API key lives** in a local-first, no-backend browser app. The digest's fallback pattern refers to an **`ANTHROPIC_API_KEY` env var** — a Node-shaped assumption that does not map cleanly onto a browser PWA with local storage and no backend. Key storage, key exposure, and browser-side CORS are not addressed anywhere in the research.
- **No opt-in UX mechanics** — no consent-copy wording, no per-task vs. per-session consent model, no revocation flow.
- **No disclosure-text requirements** beyond what §7.2 makes factually assertable.
- No data-residency, GDPR, or institutional-policy analysis (relevant given a Norwegian university context) — out of scope of what was researched.

---

## 8. Open questions, unverified claims, and staleness

### 8.1 The research's own open questions (verbatim list, § Open questions)

1. **Empirically time a real Claude Haiku 5.5 call with reasoning effort pinned to minimal**, before trusting either the sub-second or the 9–13-second number. *"This directly affects whether a loading-state UX is needed."* → Also called out in § Verdict as *"testable in under an hour with a real API key and should be done before finalizing the provider choice in the PRD."*
2. **Exact current free-trial credit amounts** for both providers are secondary-sourced only (Anthropic ~$5, OpenAI ~$15 or a data-sharing program; neither confirmed on the provider's own page). *"Check both providers' billing/dashboard pages directly **before writing grader/setup instructions**."*
3. **OpenAI's exact current cheapest model name is actively churning** — newer names (`gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`) already appear in OpenAI's own example docs. *"Do not hard-code `gpt-5-nano` from this report without checking first."* (Relevant to the chosen design only via the swappable-provider interface.)
4. **Whether the Safari/WebKit 26 ONNX Runtime Web memory bug (#26827 / #33516) has been patched** — re-check only if the local-model path is ever revisited; it was open as of 2026-10-28.
5. **No direct benchmark exists for rule-based vs. AI accuracy on todo-task tagging specifically** — every figure is from an adjacent domain and the two sources disagree. *"The brief's own planned 10–15 example-task test fixture is the right way to generate this evidence locally."*
6. **Red-team pass did not run** (off by default at `normal` validation). *"Re-run at `high` validation for a dedicated adversarial pass **before committing this verdict to the PRD**."* § Contrary evidence confirms: *"No adversarial search was performed against the recommendation."*

### 8.2 Claims the research itself labels unverified or low-confidence

| Claim | Status | Why |
|---|---|---|
| Rule-based 69.4% vs. ML 87.5% | **Disputed, Low confidence** | Full paper 403; figures from a search snippet only [1] |
| Claude Haiku 5.5 short-call latency | **Disputed, Low-medium** | 0.7–1.0 s vs. 9.6–13.4 s across sources [13] |
| ~$5 Anthropic free credit, SMS, ~14-day expiry | **Low-medium** | SEO-aggregator sources, no Anthropic-owned page [14] |
| Evaluation-tier ~5 RPM → ~50 RPM after $5 | **Low** | Single third-party summary; re-verify at `console.anthropic.com/limits` [15] |
| Haiku 5.5 is a ~90% cut vs. Haiku 4.5 | Medium | Secondary release coverage [12] |
| "~1–2 s" best estimate for this app's call | **Low** | Synthesis of the disputed sources, not a benchmark |
| Fallback/failure engineering practices (§4.4) | **Not evidence** | *"standard practice but not substantiated by a credible source here"* |
| Rate limits are "far above what this app needs" | Medium | Reasoning from low-confidence limits, not independently sourced |

### 8.3 Staleness map (research's own freshness bars: pricing/latency ≤3 mo, privacy ≤6 mo, browser-compat ≤6 mo, implementation ≤12 mo, accuracy ≤24 mo)

| Claim | Class | Pub. | Re-check by | Status |
|---|---|---|---|---|
| Rule-based vs. ML accuracy gap [1][7] | accuracy | n.d./2025 | — | *"fresh-ish, but disputed — re-check magnitude, not just date"* |
| Claude Haiku 5.5 pricing [11] | pricing | 2026-10 | **2027-01** | fresh |
| Reasoning-effort latency mechanism [13][21] | latency | 2026 | **2027-01** | *"fresh, but Claude's own numbers are internally disputed"* |
| API-not-used-for-training default [17] | privacy-policy | 2026-08 | **2027-02** | fresh (primary-sourced) |
| GPT-5-nano pricing [19] | pricing | 2026-live | 2027-01 | fresh, **model name churning** |
| Safari/WebKit WebGPU support [31] | browser-compat | 2025-09 | 2026-03 | **stale — re-verify** (local-model path only) |
| ONNX Safari/iOS memory bug [32] | browser-compat | 2026-01 open | 2026-07 | **stale window passed** (local-model path only) |
| Transformers.js sizes/build [27][28] | implementation | 2026-02 / 2025-09 | 2027-02 / 2026-09 | mixed; [28] past window (local-model path only) |

**All three re-check dates that matter for the chosen design land in ~2027-01 to 2027-02 — i.e. after the December 2026 deadline.** The pricing, latency-mechanism and privacy claims this PRD will rest on are inside their freshness windows for the entire build.

### 8.4 Things the research explicitly could not find at all

- No Anthropic-authored, clearly-dated page giving an authoritative current latency benchmark for a short structured-output Haiku call.
- No Anthropic-owned page confirming the free-credit amount, expiry, or exact new-account rate limits.
- No credible dated writeup of the "Claude API with local rule-based fallback" pattern's pitfalls (both provider digests report this gap independently).
- No todo-task-specific accuracy benchmark.
- No solo-dev build-time or maintenance-burden figures for a rule-based classifier.

### 8.5 One judgment the research says it cannot make

> "whether a rules-only engine satisfies the course's 'practical AI use' grading weight is a **product/grading judgment this research can't resolve with web evidence**." (§ Cross-dimension insights)

And in § Verdict: rule-based alone is not recommended as the whole v1 answer *"on the judgment this research can't source from the web: the brief's own instructor feedback already flagged that a rules-only engine risks not clearing the 'practical use of AI' grading weight by itself."* This is why the decision matrix's numerical winner (rule-based only, 4.28/5 vs. Claude API 3.52/5) is overridden — *"an artifact of the matrix only scoring the five criteria the brief asked it to score, none of which is 'does this satisfy the course's AI-practical-use grading weight.'"*
