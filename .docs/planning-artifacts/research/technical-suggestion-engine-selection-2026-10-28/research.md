---
title: 'technical research: suggestion engine selection for To-Do-List v1'
type: 'technical'
topic: 'suggestion engine selection for To-Do-List v1'
decision: 'rule-based only vs rule-based + optional cloud/local AI with no-key fallback'
source: 'native run'
status: complete
preset: 'standard'
validation: 'normal'
claims_verified: 4
claims_unverified: 1
claims_disputed: 2
created: '2026-10-28'
updated: '2026-10-28'
---

# technical research: suggestion engine selection for To-Do-List v1

**Decision this research serves:** rule-based only vs rule-based + optional cloud/local AI with no-key fallback

## Executive summary

**Recommendation: rule-based classifier as the permanent fallback, with an optional Claude API call (Haiku tier) layered on top as the primary path when a key is configured.** OpenAI's API is an equally-capable, slightly better-evidenced-on-latency runner-up — pick whichever key the student already has. The in-browser local-model option is not recommended for v1: this round of research turned up a concrete, currently-open, dated bug (ONNX Runtime Web's WebGPU execution mode crashing tabs on Safari/iOS, still unresolved as of the most recent follow-up found) that makes it the riskiest of the three AI options for a solo, fixed-deadline build, not just the most complex in the abstract.

The real choice is still not "pick one of four" — the rule-based engine ships either way as the mandatory no-key fallback. A concrete, reusable version of that fallback surfaced in this round's evidence: a real open-source task-triage project (`fazal305/nightbeacon`) documents in its own README that its keyword-based classifier "can misjudge priority on ambiguous text," and its own issue tracker proposes escalating only low-confidence/ambiguous cases to a small LLM rather than replacing the rule engine outright [3]. That's close to the exact architecture this report recommends.

Two genuine disputes surfaced in this round's sources and are reported honestly rather than averaged: (1) the size of the rule-based-vs-ML accuracy gap — one unverifiable secondary source claims 69.4% vs. 87.5%, while a peer-reviewed microtext-classification paper found rule-based and ML approaches "perform well on different parts" of a dataset, i.e. a narrower gap than the first figure implies [1][7]; and (2) Claude Haiku 5.5's short-call latency, where one benchmark tracker shows sub-second responses and another (artificialanalysis.ai, Anthropic's own reasoning-effort variants) shows 9.6–13.4 seconds for the same model [13]. Both cloud APIs share one confirmed, actionable mechanism behind latency swings like this: a "reasoning effort" setting that must be explicitly pinned to its lowest value for a short classification call, or response time can balloon by 10–100x [13][21].

**Biggest caveat:** several exact numbers (free-trial credit amounts for both providers, OpenAI's exact current cheapest model name, whether the Safari/WebKit ONNX bug has since been patched) are reported only by secondary sources or are actively churning as of this research date — see Open Questions. None of this changes the recommendation; it changes what to re-verify at implementation time.

## Requirements frame

Sourced from the product brief and instructor feedback, not from web research (per the select-shape method, web research doesn't set requirements).

**Hard gates:**
- Must run end-to-end for a grader with no API key or paid account of their own → a rule-based fallback is mandatory, not optional, regardless of which AI layer (if any) is added
- Stays local-first: no backend, no login requirement introduced by the suggestion engine itself
- Buildable solo, alongside the rest of the CRUD/smart-lists app, by the second week of December 2026
- Default path never sends task data anywhere without explicit opt-in

**Weighted preferences used in the verdict below:**

| Criterion | Weight |
|---|---|
| Suggestion quality (tags/priority/summary) | High |
| Implementation complexity / time for a solo student | High |
| Cost (ideally near-$0 to run and to test) | Medium-high |
| Latency (feels instant on task capture) | Medium |
| Privacy exposure (data leaving the device) | Medium |

## Candidate screen

Four candidates were researched in parallel (breadth-first); all are compatible with "rule-based fallback always present" — they differ in what (if anything) sits in front of it:

1. **Rule-based / keyword classifier only** — no AI layer at all.
2. **Rule-based + optional Claude API call**, auto-fallback on missing key/failure.
3. **Rule-based + optional OpenAI API call**, auto-fallback on missing key/failure.
4. **Rule-based + in-browser local model** (transformers.js/ONNX Runtime Web), no network call, no key ever needed.

## Evidence per criterion

### Candidate 1 — Rule-based / keyword classifier only

- **Real, working precedent exists.** A Flask-based task-triage system (`bassam-111/ops-task-triage`) classifies tasks into 5 categories and 4 priority levels using urgency words and deadlines, runs fully offline with no API key — and its own README lists "LLM-based classification" as its top future-improvement item, which is itself evidence of a known accuracy ceiling from someone who built and lived with the rule-based version [2]. A second project (`fazal305/nightbeacon`) documents the same ceiling directly: its README's "Limitations" section says the keyword classifier "can misjudge priority on ambiguous text" [3].
- **A concrete, reusable rule design was found**, not just a general pattern: tokenize and lowercase task text, weight two-word phrases at 3 and single tokens at 1, apply urgency/deferral keyword maps to set high/low priority (medium default), enforce a 0.35 confidence floor, and resolve ties/zero-matches to an "other" category — implemented as one pure synchronous function [4]. This is directly adaptable to this project's tags/priority/summary suggestion engine.
- **Accuracy gap vs. ML is real but its exact size is disputed.** One unverified secondary source cites 69.4% (rule-based) vs. 87.5% (ML) on an unspecified task [1] — low confidence, could not access the full paper. A peer-reviewed microtext-classification study instead found rule-based and ML methods "perform well on different parts" of the same dataset and that combining them beats either alone [7] — suggesting the gap is real but narrower and more task-dependent than a single headline number implies. Neither source measured todo-task tagging specifically. The general trade-off is consistent with text-classification survey literature: rule-based methods need no labeled training data but demand strong upfront domain/keyword knowledge and have documented generalization limits versus ML [8].
- **JS/TS library landscape:** `compromise` (rule-based parsing/entities, not built for classification), `natural` (ships actual trainable classifiers — Bayes/logistic regression — not rule-based by default), `wink-nlp` (fast, small-footprint, supports custom rule-based entities via `learnCustomEntities`, benchmarks itself at 525,000+ tokens/sec) [5][9]. None is a drop-in "classify this task" library — the classification logic itself is still hand-written keyword/regex rules on top.
- **Cost, latency, privacy:** zero marginal cost and near-instant latency are architectural certainties (synchronous, in-process, no network call) rather than something separately benchmarked [10], corroborated by `ops-task-triage`'s own "no API key required... runs offline" description [2]. No task text ever leaves the device, by construction.

### Candidate 2 — Rule-based + optional Claude API (fallback on no key/failure)

- **Pricing, confirmed directly on Anthropic's own live pricing page:** Claude Haiku 5.5 (released 2026-10-07, ~90% price cut from Haiku 4.5) costs $0.10/MTok input, $0.50/MTok output for prompts ≤100K tokens [11][12]. A short classify-and-summarize call (≈200–500 input tokens, ≈50–150 output tokens) costs roughly **$0.00005–0.0001** — negligible at course-project scale.
- **Latency is genuinely disputed across sources, not just uncertain.** One benchmark tracker reports sub-second responses (~0.7–1.0s) for short Haiku-tier completions; artificialanalysis.ai's own Haiku 5.5 pages report 9.6–13.4 seconds "time to first answer token" for the low/medium reasoning-effort variants [13]. Both can't be describing the same call shape — the most likely explanation, consistent with what's confirmed for OpenAI's equivalent model (below), is that the slow numbers reflect reasoning/extended-thinking overhead that a short, non-reasoning classification call should be able to avoid by explicitly setting effort to minimal. This should be empirically timed with a real key before committing to a UX assumption, rather than trusted from either source alone.
- **Integration, confirmed directly on Anthropic's own API docs:** the Messages API's `output_config: {format: {type: "json_schema", schema: {...}}}` constrains output to valid JSON (GA feature); auth via `x-api-key` header; official SDKs (`@anthropic-ai/sdk` for JS/TS) wrap the same endpoint, with the Python SDK offering a `.parse()` convenience helper [16].
- **Privacy, confirmed directly on Anthropic's own privacy center** (fetched live, policy dated 2026-08-18): API inputs/outputs are not used for model training by default, and data is auto-deleted within 30 days unless the customer opts in to longer retention — explicitly different from consumer claude.ai's defaults [17][18]. This is the strongest-sourced privacy claim in this report (primary source, directly fetched, dated).
- **Free tier / rate limits are the weakest-evidenced part of this candidate.** A ~$5 free credit (SMS-verified, ~14-day expiry) and low-tier rate limits (~5 RPM at evaluation tier, ~50 RPM after $5 spend) are reported only by third-party "how to get free API credits" aggregator sites of uncertain reliability — not confirmed on any Anthropic-owned page [14][15]. Course-project-scale usage is trivially within any of these limits regardless of the exact numbers.

### Candidate 3 — Rule-based + optional OpenAI API (fallback on no key/failure)

- **Pricing, confirmed directly on OpenAI's own live pricing page and cross-checked against an independent calculator:** gpt-5-nano is OpenAI's cheapest current model at $0.05/MTok input, $0.40/MTok output [19][20] — a single call costs roughly **$0.00003–0.00006**, slightly cheaper than Claude Haiku at the token level.
- **Latency mechanism is confirmed cleanly, more so than Claude's:** "minimal" reasoning effort gives ~0.8s time-to-first-token; "medium"/"high" effort on the same model balloons to 37–118 seconds [21]. Same underlying mechanism as Claude (a reasoning-effort knob defaulting to something much slower than the headline number), but with a less contradictory evidence trail in this round's sources.
- **Integration, confirmed directly on OpenAI's own docs:** the Responses API's `text.format` JSON-schema parameter (`strict: true`, "Structured Outputs") constrains output; auth via `Authorization: Bearer` header; SDK convenience methods (`client.responses.parse`) available in Python/JS [24].
- **Privacy, confirmed directly on OpenAI's own data-usage guide** (fetched live, policy effective since 2023-03-01): API input/output is not used for training by default; abuse-monitoring logs retained up to 30 days unless Zero Data Retention is arranged [22]. Functionally equivalent to Claude's privacy profile, and similarly primary-sourced. OpenAI has also announced an expansion of Zero Data Retention and a phased "Private Safety Processing" rollout, though the full content of that announcement was not independently verified [23].
- **Free tier, rate limits, and current model-name churn are the open risks.** Secondary sources disagree on whether OpenAI currently offers a $15 one-time trial credit, an opt-in data-sharing-for-tokens program, or neither [25]; reported paid-tier rate limits (500 RPM at the lowest tier, scaling with cumulative spend) likewise rest only on third-party aggregators, not OpenAI's own rate-limits page [26]. The researcher's own search also surfaced newer model names ("gpt-6-astra," "gpt-6.1-sol") already appearing in OpenAI's example docs, suggesting the "cheapest nano" model is actively churning and should be re-confirmed at implementation time, not hard-coded from this report [19].

### Candidate 4 — Rule-based + in-browser local model

- **Realistic model sizes are small and well-documented:** Transformers.js v4 (Feb 2026) ships a leaner build (bundle ~10% smaller, tokenizer 8.8kB gzipped); quantized classification models are genuinely tiny — all-MiniLM-L6-v2 ≈23MB, a quantized DistilBERT dropped from 256MB to 64MB with only 0.12-point accuracy loss [27][28].
- **A real measured performance number exists and it's good:** that same DistilBERT build measured ~58ms WASM inference latency per call in Chrome — easily fast enough for "suggest on capture" [28]. But the same source explicitly notes "Safari currently fails to load it," and documents concrete implementation pitfalls along the way — a `token_type_ids` signature mismatch, a browser-specific quantization dtype requirement (QUInt8, not QInt8), and quantization that actually *increased* latency on Apple Silicon in this author's testing [29].
- **The decisive new finding this round: a concrete, dated, still-open browser bug.** ONNX Runtime Web's WebGPU/JSEP execution mode on Safari/WebKit 26 causes severe CPU (400%+) and memory (1GB→14GB+) blowups leading to tab crashes on iOS — reported ~January 2026 (issue #26827) and confirmed still present in ONNX Runtime 1.30.0 via a follow-up issue (#33516) as of this research date. Multiple independent app repos worked around it only by forcing WASM-only execution (avoiding WebGPU entirely on Safari) and/or pinning an older ONNX Runtime version [32]. This is materially different from last pass's more abstract "cross-browser complexity" finding — it's a specific, named, currently-unresolved defect that would hit this project directly if targeting iPhone/iPad, which the brief's "one responsive app across web, desktop, mobile, and tablet" scope requires.
- **Generative use (the "summary" feature specifically) is a worse fit than classification.** WebLLM-class generative models are impractical at this scale — a 3.8–8B model is 4.2GB+ and takes minutes to download on first load [30]. The realistic path for this candidate is classification/tagging only, with summary generation likely still handled some other way (rules, truncation, or deferred to a cloud call).
- **Cost and privacy remain architecturally strong:** zero per-call monetary cost, and no task text ever leaves the device once the model is cached [27]. The real costs are non-monetary — download weight, bundle size, CPU/battery draw, mobile memory ceilings (iOS Safari tabs cap around 500MB, constraining but not blocking a 20–65MB classification model) [33], production pitfalls like lazy-loading the model and bundler handling of binary ONNX/WASM assets [34], and now, concretely, an open Safari stability bug.

## Cross-dimension insights

- **The local-model candidate's risk profile sharpened this round from "abstractly complex" to "concretely broken on one major platform, right now."** A still-open, dated GitHub issue thread (not a stale complaint against an old version) is stronger evidence against recommending it for a fixed-deadline solo build than general cross-browser-complexity concerns alone.
- **Both cloud APIs share the exact same latency trap, and the evidence for it is asymmetric.** OpenAI's reasoning-effort latency mechanism is confirmed with a clean, internally-consistent number set; Claude's own evidence trail is contradictory across sources in this round. This doesn't change the recommendation (Claude is still picked on pricing/privacy/primary-source strength), but it does mean Claude's actual latency behavior should be empirically timed before committing to a "no spinner needed" UX assumption — OpenAI's shouldn't need the same empirical check, since its sources already agree.
- **Rule-based-alone still isn't competing on the same axis as the other three.** It wins cleanly on cost/latency/privacy/simplicity — and this round surfaced real precedent (`ops-task-triage`, `nightbeacon`) that confirms rule-based engines are shipped and used standalone in similar small apps. But whether a rules-only engine satisfies the course's "practical AI use" grading weight is a product/grading judgment this research can't resolve with web evidence.

## Contrary evidence

The red-team pass did not run (off by default at `normal` validation). No adversarial search was performed against the recommendation. Two genuine disputes did surface organically during normal research (rule-based accuracy gap magnitude; Claude latency) and are reported above rather than resolved by averaging — the closest thing to contrary evidence this pass produced. Re-run at `high` validation for a dedicated adversarial pass if a harder pressure-test is wanted.

## Decision matrix

Weights: High=3, Medium-high=2.5, Medium=2. Scores 1–5, this report's judgment grounded in the evidence above — re-weight freely.

| Criterion (weight) | Rule-based only | Claude API | OpenAI API | Local model |
|---|---|---|---|---|
| Suggestion quality (3) | 2 | 5 | 5 | 3 |
| Implementation complexity — ease (3) | 5 | 3 | 3 | 2 |
| Cost (2.5) | 5 | 4 | 4 | 5 |
| Latency (2) | 5 | 3 | 3 | 3 |
| Privacy (2) | 5 | 2 | 2 | 5 |
| **Weighted total /5** | **4.28** | **3.52** | **3.52** | **3.48** |

Rule-based-only numerically "wins" this matrix — an artifact of the matrix only scoring the five criteria the brief asked it to score, none of which is "does this satisfy the course's AI-practical-use grading weight." See Verdict.

## Verdict

**Pick: rule-based classifier (always present, as fallback) + Claude API as the optional primary path when a key is configured.**

**Named runner-up: OpenAI API** — essentially tied on cost and privacy, and this round's evidence for its latency behavior is actually cleaner/more internally consistent than Claude's. It wins instead if the student already holds an OpenAI key, or weighs "latency evidence I can trust without testing it myself" highly.

**Local in-browser model: not recommended for v1**, more firmly than before — this round surfaced a specific, dated, currently-unresolved Safari/iOS stability bug in the exact runtime layer (ONNX Runtime Web's WebGPU execution) this candidate would depend on for cross-platform coverage. Reconsider in the *Vision* phase, and re-check whether the bug has been patched first.

**Rule-based alone: not recommended as the whole v1 answer**, on the judgment this research can't source from the web: the brief's own instructor feedback already flagged that a rules-only engine risks not clearing the "practical use of AI" grading weight by itself. It remains mandatory either way as the fallback — and this round found real precedent (`nightbeacon`'s own planned fix) for exactly the hybrid shape recommended below.

**Strongest argument against the pick:** the Claude latency dispute itself. If Haiku 5.5's slower, reasoning-effort-engaged numbers (9.6–13.4s) turn out to be what a real implementation actually gets by default rather than an artifact of the benchmark's own settings, Claude would feel meaningfully slower than OpenAI's more consistently-sub-second nano tier for the same task. This is testable in under an hour with a real API key and should be done before finalizing the provider choice in the PRD.

**Cheapest reversibility hedge:** build the suggestion engine behind one interface — a function returning `{tags, priority, summary}` — with the rule-based classifier and the chosen API call as interchangeable implementations. This is already required by the mandatory-fallback architecture, so it costs nothing extra to also make the AI provider swappable later, and it directly matches the hybrid pattern (`nightbeacon`'s "escalate only ambiguous cases to an LLM") found as real precedent this round.

**Feeds:** this recommendation is an input to the PRD's resolution of its own "Open Decision Point," and should also become an explicit architecture constraint (the swappable-provider interface) once architecture work starts.

## Open questions

- **Empirically time a real Claude Haiku 5.5 call with reasoning effort pinned to minimal**, before trusting either the sub-second or the 9–13-second number from this report — the two sources disagree and this directly affects whether a loading-state UX is needed.
- **Exact current free-trial credit amounts** for both providers are only reported by secondary sources (Anthropic ~$5, OpenAI ~$15 or a data-sharing program, neither confirmed on the provider's own page). Check both providers' billing/dashboard pages directly before writing grader/setup instructions.
- **OpenAI's exact current cheapest model name is actively churning** — newer names (gpt-6-astra, gpt-6.1-sol) already appear in OpenAI's own example docs. Re-check `developers.openai.com`'s model list immediately before implementation; do not hard-code `gpt-5-nano` from this report without checking first.
- **Whether the Safari/WebKit 26 ONNX Runtime Web memory bug (#26827/#33516) has been patched** should be re-checked at implementation time if the local-model path is ever revisited — it was open as of this research date.
- **No direct benchmark exists for rule-based vs. AI accuracy on todo-task tagging specifically** — every figure here is from an adjacent domain, and the two sources on this point actively disagree on the gap's size. The brief's own planned 10–15 example-task test fixture is the right way to generate this evidence locally.
- **Red-team pass did not run** (off by default at normal validation). Re-run at `high` validation for a dedicated adversarial pass before committing this verdict to the PRD.

## Source appendix

| # | Claim/finding it supports | Publisher | Pub. date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | Rule-based 69.4% vs. ML 87.5% accuracy (unverified, full paper inaccessible) | ResearchGate — "Comparative Analysis of Rule-Based and Machine Learning Decision Systems" | n.d. | 2026-10-28 | Low (disputed) |
| [2] | Real rule-based task-triage system, offline, no API key; flags LLM option as future work | [GitHub — bassam-111/ops-task-triage](https://github.com/bassam-111/ops-task-triage) | n.d. | 2026-10-28 | High |
| [3] | Keyword classifier "can misjudge priority on ambiguous text"; proposes LLM escalation for ambiguous cases only | [GitHub — fazal305/nightbeacon, Issue #13](https://github.com) | n.d. | 2026-10-28 | High |
| [4] | Concrete rule-weighting design (2-word phrase=3, token=1, 0.35 confidence floor) | GitHub — frankda94/homework-management-app, Issue #3 | n.d. | 2026-10-28 | Medium (spec only) |
| [5] | compromise/natural/wink-nlp JS library landscape and capabilities | npm-compare.com + PkgPulse NLP library guide | 2026 | 2026-10-28 | Medium |
| [7] | Rule-based and ML "perform well on different parts" of a dataset; combining beats either alone | [arXiv — "Extracting actionable information from microtexts"](https://arxiv.org/pdf/2008.00343) | n.d. | 2026-10-28 | Medium |
| [8] | Rule-based needs no training data but has generalization limits vs. ML | arXiv — "A Survey on Text Classification" (2008.00364) | n.d. | 2026-10-28 | Medium |
| [9] | wink-nlp: rule/pattern-capable, 525,000+ tokens/sec | winkjs.org / npm — wink-nlp docs | n.d. | 2026-10-28 | Medium |
| [10] | Architectural certainty: no network call → near-zero cost/latency, no data transfer | Reasoned from [2]'s "no API key required... runs offline" | n.d. | 2026-10-28 | High (architectural) |
| [11] | Claude Haiku 5.5 pricing $0.10/$0.50 per MTok (≤100K tokens) | [Anthropic — Pricing](https://claude.com/pricing) | n.d. (live) | 2026-10-28 | High |
| [12] | Haiku 5.5 (2026-10-07) ~90% price cut vs. Haiku 4.5 | cellcog.ai / developersdigest.tech release coverage | ~2026-10-07 | 2026-10-28 | Medium |
| [13] | Claude Haiku 5.5 latency: 0.7-1.0s (one tracker) vs. 9.6-13.4s TTFT (artificialanalysis.ai, low/medium effort) — disputed | artificialanalysis.ai + respan.ai | n.d./2026 | 2026-10-28 | Low-medium (disputed) |
| [14] | ~$5 free credit, SMS-verified, ~14-day expiry (unconfirmed primary) | ssdnodes.com / grabaicredits.com | n.d./2026 | 2026-10-28 | Low-medium |
| [15] | Evaluation-tier rate limits ~5 RPM rising to ~50 RPM after $5 spend (unconfirmed primary) | aifreeapi.com | n.d./2026 | 2026-10-28 | Low |
| [16] | Messages API structured output (`output_config.json_schema`), `x-api-key` auth, SDK `.parse()` helper | [Anthropic — Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) | n.d. (live) | 2026-10-28 | High |
| [17] | API input/output not used for training by default; 30-day auto-deletion unless opted in | [Anthropic — Privacy Center](https://privacy.claude.com) | 2026-08-18 | 2026-10-28 | High |
| [18] | Corroborating API-vs-consumer privacy distinction | strac.io / humla.team summaries | n.d. | 2026-10-28 | Medium |
| [19] | GPT-5-nano pricing $0.05/$0.40 per MTok; newer model names (gpt-6-astra etc.) already appearing in docs | [developers.openai.com — Pricing](https://developers.openai.com/api/docs/pricing) | n.d. (live) | 2026-10-28 | High |
| [20] | Cross-check of gpt-5-nano pricing | getmaxim.ai Bifrost LLM Cost Calculator | n.d. | 2026-10-28 | Medium |
| [21] | GPT-5-nano TTFT 0.8s (minimal) vs. 37-118s (medium/high reasoning effort) | artificialanalysis.ai — GPT-5-nano benchmark | n.d. | 2026-10-28 | Medium |
| [22] | API input/output not used for training by default since 2023-03-01; 30-day log retention; ZDR available | [developers.openai.com — API data usage guide](https://developers.openai.com/api/docs/guides/your-data) | effective 2023-03-01 | 2026-10-28 | High |
| [23] | Expanded Zero Data Retention / Private Safety Processing rollout (title/claim only, not fully verified) | openai.com/index/offering-zero-data-retention-for-frontier-models | n.d. | 2026-10-28 | Low |
| [24] | Responses API Structured Outputs (`text.format`, `strict:true`), Bearer auth, SDK `.parse()` | [developers.openai.com — Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs) | n.d. (live) | 2026-10-28 | High |
| [25] | Free-tier/trial-credit figures inconsistent ($15 one-time vs. data-sharing program) | perkstack.co and similar aggregators | n.d./2026 | 2026-10-28 | Low-medium |
| [26] | Paid-tier rate-limit structure (unconfirmed primary) | requesty.ai | n.d./2026 | 2026-10-28 | Low-medium |
| [27] | Transformers.js v4 (leaner build, smaller bundle); zero per-call cost, no data leaves device once cached | Hugging Face — Transformers.js v4 blog | 2026-02-09 | 2026-10-28 | High |
| [28] | Classification model sizes (MiniLM ~23MB, DistilBERT 64MB quantized); 58ms Chrome WASM latency; "Safari currently fails to load it" | Hugging Face model hub + dev.to (fuxionixt) DistilBERT quantization build | ~2025-09 | 2026-10-28 | Medium |
| [29] | Implementation pitfalls: token_type_ids mismatch, QUInt8 required for browser, quantization increased latency on Apple Silicon | dev.to (fuxionixt) | ~2025-09 | 2026-10-28 | Medium |
| [30] | WebLLM generative models impractical at this scale (4.2GB+, minutes to download) | [arXiv — WebLLM paper (2412.15803)](https://arxiv.org/abs/2412.15803) + dev.to (mattbusel) | ~2025 | 2026-10-28 | Medium |
| [31] | Safari/WebKit WebGPU support only from Safari 26 (Sept 2025) | web.dev WebGPU support post + AppDeveloperMagazine | 2025-09 | 2026-10-28 | High |
| [32] | ONNX Runtime Web WebGPU/JSEP causes CPU/memory blowups, tab crashes on Safari/iOS; still open as of v1.30.0 | [microsoft/onnxruntime — Issues #26827, #33516](https://github.com/microsoft/onnxruntime) | ~2026-01 (still open) | 2026-10-28 | High |
| [33] | iOS Safari memory ceiling (<500MB tabs); WebGPU buffer-size limits | note.com + tianpan.co | n.d./2025-2026 | 2026-10-28 | Medium |
| [34] | Production pitfalls: lazy-load models, bundler/WASM asset handling (not independently fetched, 403) | SitePoint — "Optimizing Transformers.js for Production Web Apps" | n.d./2025 | 2026-10-28 | Low-medium |

## Staleness map

Computed against the pack's freshness bars (pricing/latency ≤3mo, privacy policy ≤6mo, browser-compat ≤6mo, implementation/landscape ≤12mo, accuracy/pattern claims ≤24mo):

| Claim | Class | Pub. date | Re-check by | Status |
|---|---|---|---|---|
| Rule-based vs. ML accuracy gap (disputed) [1][7] | accuracy | n.d./2025 | — | fresh-ish, but disputed — re-check magnitude, not just date |
| Claude Haiku 5.5 pricing [11] | pricing | 2026-10 | 2027-01 | fresh |
| GPT-5-nano pricing [19] | pricing | n.d. (2026-live) | 2027-01 | fresh, but model name is churning — re-check at implementation |
| Reasoning-effort latency mechanism [13][21] | latency | 2026 | 2027-01 | fresh, but Claude's own numbers are internally disputed |
| API-not-used-for-training default [17][22] | privacy-policy | 2026-08 / 2023-03 | 2027-02 / ongoing | fresh (both primary-sourced) |
| Safari/WebKit WebGPU support (Safari 26) [31] | browser-compat | 2025-09 | 2026-03 | **stale — re-verify** |
| ONNX Runtime Web Safari/iOS memory bug [32] | browser-compat | 2026-01 (open) | 2026-07 | **stale window passed — re-check if still open** |
| Transformers.js model sizes/build [27][28] | implementation | 2026-02 / 2025-09 | 2027-02 / 2026-09 | mixed — [28] already past window |

**Earliest re-check date: ~2026-03 (Safari WebGPU support claim), with the ONNX bug status [32] the single most important one to re-check before any implementation decision on the local-model candidate** — bugs get fixed, and this verdict's strongest argument against that candidate depends on it still being open.
