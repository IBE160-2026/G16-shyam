---
title: To-Do-List PRD Addendum
status: draft
created: 2026-10-31
updated: 2026-10-31
---

# PRD Addendum: To-Do-List

Technical mechanism, verified figures, rejected alternatives, and design detail that `prd.md`
deliberately keeps out of its main narrative. The audience is the architecture stage.

Nothing here overrides `prd.md`. Where this file gives a number and the PRD does not, the PRD's
silence is intentional — see the PRD's §12 Open Questions.

---

## 1. Verified API facts

**Verification note.** These were checked against `platform.claude.com` on **2026-10-31**, during
the PRD run, because two sources disagreed. The `claude-api` reference skill's cached model table
(cached 2026-06-24) listed Claude Haiku 4.5 at $1.00 / $5.00 per MTok and contained no Haiku 5.5;
the suggestion-engine research claimed Haiku 5.5 at $0.10 / $0.50. **The research was correct and
the cached table was stale.** Use the figures below, not the cached ones.

| Fact | Verified value | Source |
|---|---|---|
| Model | Claude Haiku 5.5 | platform.claude.com models overview, 2026-10-31 |
| Model ID | `claude-haiku-5-5` (dateless IDs are their own pinned snapshot — do not append a date) | same |
| Price in | From **$0.10** / MTok | same |
| Price out | From **$0.50** / MTok | same |
| Context window | 1M tokens | same |
| Max output | 128K tokens (synchronous Messages API) | same |
| Thinking | Adaptive | same |
| **Default effort** | **`medium`** — *not* the lowest. Relevant to PRD OQ-1 | same |
| Prompt cache read | 10% of base input price | same |
| Positioning | "high-volume, latency-sensitive tasks such as classification, extraction, and routing" — i.e. exactly this use case | same |
| Retirement | Not sooner than 2027-10-07 — well past the deadline | same |

Claude Haiku 4.5 is now listed as a **legacy** model. Effort levels available across current
models are `low` / `medium` / `high` / `xhigh` / `max`; there is no level named "minimal", so the
research's "pin effort to minimal" means **`low`** in this API's vocabulary.

**Per-call cost.** At this product's call shape — roughly 200–500 input tokens and 50–150 output
tokens — research.md computes **$0.00005–0.0001 per Suggestion** from the rates above, i.e. **about
half a cent to a cent per hundred Tasks** (source: Anthropic's own live pricing page, research.md
[11][12], accessed 2026-10-28; rates re-verified 2026-10-31 per the table above).

Worth stating precisely because it is easy to be an order of magnitude out in either direction:
a thousand Tasks is still only 5–10 cents. Cost is not a design constraint at this volume, which
is why the PRD specifies no caching, batching, or spend caps — all of which would be complexity
bought for nothing.

### 1.1 Structured output — resolves a research gap

The research flagged "no retry-on-unparseable policy" as an unspecified gap. It is not needed.
Structured outputs are **stable** (no beta header) and supported on `claude-haiku-5-5`:

```json
{
  "model": "claude-haiku-5-5",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": "..." }],
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "tags":     { "type": "array", "items": { "type": "string" } },
          "priority": { "type": "string", "enum": ["high", "medium", "low"] },
          "summary":  { "type": "string" }
        },
        "required": ["tags", "priority", "summary"],
        "additionalProperties": false
      }
    }
  }
}
```

Guarantees: always syntactically valid JSON, always schema-compliant structure. No schema-violation
retry logic required. Three things still need handling:

- **`stop_reason: "refusal"`** — HTTP 200, billed, and the output may *not* match the schema
  because the refusal takes precedence. Check `stop_reason` before parsing. Falls into PRD FR-9's
  catch-all → Rule Engine.
- **`stop_reason: "max_tokens"`** — truncated, unparseable. Raise `max_tokens`; at this output size
  it should not occur.
- **Enum casing** is not guaranteed stable (e.g. `"High"` vs `"high"`). **Compare Priority
  case-insensitively.** This is a real trap for PRD FR-6's "Priority is always one of high/medium/low".

Also note: the deprecated parameter is `output_format`; the current one is `output_config.format`.

### 1.2 Calling the API from a browser with no backend

The research was silent on this and its `ANTHROPIC_API_KEY` environment-variable assumption is
Node-shaped — wrong for a no-backend PWA. Resolved:

- The Messages API **rejects browser-originated requests** (any request carrying an `Origin`
  header) unless they include **`anthropic-dangerous-direct-browser-access: true`**.
- With that header present the API returns CORS headers, so a direct browser call works.
- The official TypeScript SDK sends it via the **`dangerouslyAllowBrowser: true`** client option.
- It is named "dangerous" because the key is visible to anyone who opens devtools. For this
  product that is acceptable and is the whole point of the BYO-key model: **it is the user's own
  key, in their own browser, which they pasted in themselves.** It is never the project's key and
  never ships in the bundle.

**Confidence: medium-high.** The header name and behavior are corroborated across many independent
third-party repositories, but this was *not* confirmed on an official Anthropic documentation page
during this run. **Verify against the official docs or the SDK source before implementing** — it is
a single header name and cheap to check.

Architectural consequence: there is no server, so there is no server-side place to put a key. The
key is entered at runtime (PRD FR-17) and stored on device. This is what makes PRD OQ-4
(`.env.example` with no backend) a real question rather than a formality.

---

## 2. Rule Engine design

From the research's worked design — **specification only, medium confidence, not a measured
result.** Treat as a starting point for the architecture stage, not a mandate.

- Lowercase and tokenize the Task text.
- Score candidate categories: **two-word phrases weight 3, single tokens weight 1.**
- Keyword maps for urgency and deferral drive Priority → `high` / `low`, with **`medium` as the
  default** when nothing fires.
- **Confidence floor 0.35**; ties and zero-match cases fall through to a catch-all category
  (`other`).
- Implement as **one pure synchronous function** — this is what delivers PRD NFR-5 determinism and
  makes FR-20 a real test.
- Precedent implementation used 5 categories and 4 priority levels, keyed on "urgency words and
  deadlines". Note the PRD fixes Priority at **three** levels, so do not copy the 4-level scheme.

**Date parsing had no evidence base at all.** That precedent's "deadlines" is the *only* mention
of date handling in the entire research corpus — no library, no grammar, no examples. The PRD's
response (FR-23, resolving OQ-5 on 2026-11-01) was to shrink the surface rather than defer it: a
fixed vocabulary of `today`, `tomorrow`, weekday names and `next week`, parsed deterministically,
with everything else explicitly out of v1. No evidence base is a reason to keep a feature small,
not a reason to leave it undecided.

### 2.1 How the Rule Engine produces a Summary

The research describes rule-based *classification* in detail and says nothing at all about
rule-based *summarization* — it is not a gap in the reading, the approach simply does not appear.
Even the local-model candidate's analysis concluded that generative summary "is a worse fit than
classification" and would likely fall back to "rules, truncation, or deferred to a cloud call".

So the Rule Engine's Summary is specified as a **cleaned-up, truncated restatement of the Task
text**, not true summarization: trim whitespace, strip a trailing date phrase if one was parsed
into the due date, cap at a sensible length on a word boundary, and stop. A design choice rather
than a sourced finding — confirmed by the builder 2026-11-01, PRD §13 item 3. Note the date-phrase
strip now has a defined input: FR-23's fixed vocabulary is exactly what may have been consumed
into the due date.

Two consequences worth carrying into architecture:

- Do not measure Rule Engine Summary quality as though it were summarization — the Fixture should
  assert the truncation is *sensible*, not that it is a good summary.
- This is the field where the Model Engine has the clearest advantage, and therefore the most
  informative column in the FR-21 comparison. Tags and Priority are where the Rule Engine can
  genuinely compete; Summary is where it structurally cannot.

**No JavaScript library is a drop-in classifier for this.** Research checked:

| Library | Why it doesn't fit |
|---|---|
| `compromise` | Does NLP annotation, not classification |
| `natural` | Has classifiers, but they need training data this project doesn't have |
| `wink-nlp` | Rules and entity extraction only |

So the Rule Engine is hand-written. That is fine — it is small, and hand-written is what makes it
deterministic and testable.

**Best-sourced accuracy evidence (High confidence, qualitative):** two shipped projects report that
a keyword classifier **"can misjudge priority on ambiguous text"**, and both list LLM classification
as future work. This is the single most actionable accuracy finding in the research, and it is why
PRD FR-19 requires the Fixture to contain ambiguous entries — without them, the Fixture cannot
distinguish the two engines.

---

## 3. Disputed findings — recorded with both values, never averaged

The research reports these as genuinely disputed. They are reproduced here in that form because
collapsing them to a midpoint would manufacture false precision.

### 3.1 Latency — the one that matters

| Source | Claim | Confidence |
|---|---|---|
| respan.ai tracker | **0.7–1.0 s** for short Haiku-tier completions | low-medium |
| artificialanalysis.ai, Haiku 5.5 pages | **9.6–13.4 s** time-to-first-answer-token, on `low` and `medium` reasoning-effort variants | low-medium |
| Research's own synthesis estimate for this call shape | ~1–2 s | **low** |

**Confirmed mechanism, and the useful part:** an effort/reasoning setting moves latency by
**10–100×**. Proven cleanly on a competing vendor's small model (0.8 s at minimal effort versus
37–118 s at medium/high); the evidence on Claude specifically is contradictory.

Two things make this sharper than the research framed it:

1. **Haiku 5.5's default effort is `medium`** (§1) — so the naive call lands on the slow setting.
   Pin it to `low`.
2. The 9.6–13.4 s figures were measured on `low` **and** `medium` variants. If `low` is genuinely
   that slow, pinning effort does not rescue it.

Which is exactly why PRD NFR-2 refuses to name a timeout and PRD OQ-1 makes measurement an
acceptance gate. A single guessed number cannot satisfy both sides: below 9.6 s the slow case
becomes 100% fallback; above 13.4 s the app would block on capture for 13 seconds — and the PRD's
FR-8 asynchronous capture exists precisely so that the second outcome is survivable either way.

### 3.2 Accuracy, rule-based versus ML

| Source | Claim | Confidence |
|---|---|---|
| ResearchGate, "Comparative Analysis of Rule-Based and Machine Learning Decision Systems" — **unverified secondary source; the full paper could not be accessed**, so only its headline figure is available | 69.4% rule-based versus 87.5% ML | low |
| Peer-reviewed arXiv microtext study | The two "perform well on different parts" of the input space; combining beats either alone | medium |

**Neither measured to-do tagging.** The arXiv finding is the better-sourced of the two and it
undercuts the simple "ML wins" framing — which, incidentally, supports the PRD's choice to ship
both engines and compare them (FR-21) rather than assume one dominates.

No numeric accuracy target is sourceable from this. Generate it locally with the Fixture.

---

## 4. Privacy — strongest-sourced claim in the research

From `privacy.claude.com`, dated **2026-08-18**, **High confidence**: API inputs and outputs are
**not used for training by default** and are **auto-deleted within 30 days**. This is explicitly
unlike the consumer claude.ai product.

This is the factual basis for PRD FR-18's disclosure text. Keep the disclosure to what this
supports — do not upgrade it into a broader promise.

---

## 5. Rejected alternatives

Recorded with reasons so the decision does not get silently relitigated later.

**OpenAI instead of Claude — not rejected, deferred.** This is the one "alternative" that is still
live. The research calls it a **named runner-up, "essentially tied on cost and privacy"**, and the
brief itself never chose between them ("a cloud option (OpenAI / Claude)"). PRD §4.2 plans Claude
Haiku 5.5 but confirms it only after the OQ-1 latency spike; if that measurement is bad, OpenAI is
the fallback provider.

| Dimension | Claude Haiku 5.5 | OpenAI cheapest nano tier |
|---|---|---|
| Price in / out per MTok | $0.10 / $0.50 (verified §1) | $0.05 / $0.40 (`gpt-5-nano`, research [19][20]) |
| Per call | $0.00005–0.0001 | $0.00003–0.00006 — slightly cheaper per token |
| Latency evidence | **Contradictory** — 0.7–1.0s vs 9.6–13.4s across sources | **Clean and internally consistent** — 0.8s at minimal effort, 37–118s at medium/high [21] |
| Structured output | `output_config.format`, `json_schema` (verified §1.1) | Responses API `text.format`, `strict: true` [24] |
| Privacy | Not used for training by default; 30-day deletion; policy dated 2026-08-18 [17] | Not used for training by default since 2023-03-01; abuse logs ≤30 days; ZDR available [22] |
| Model-name stability | `claude-haiku-5-5` pinned, retirement ≥2027-10-07 | **Churning** — `gpt-6-astra` and `gpt-6.1-sol` already appear in OpenAI's own example docs [19] |

The honest reading: OpenAI is marginally cheaper and has the *better-evidenced* latency story —
the research notes Claude "should be empirically timed" while OpenAI's "shouldn't need the same
empirical check, since its sources already agree." Claude was picked on primary-source pricing and
privacy strength plus the user's confirmation, not on measured superiority.

Two implementation notes if the switch is ever made:

- **Do not hard-code a model name from the research.** Re-check OpenAI's live model list
  immediately before implementing; `gpt-5-nano` may already be superseded.
- The swap touches **one** implementation behind the Suggestion Engine interface. The research
  calls this the "cheapest reversibility hedge" and notes it costs nothing extra because the
  mandatory-fallback architecture already requires the interface.

**A local in-browser model (ONNX Runtime Web / WebGPU)** — rejected for v1. The research found a
**live, still-open crash bug** affecting Safari/iOS WebGPU: tracked issues **#26827** and
**#33516**. For a product that must run for a grader on an unknown device, a crash-on-Safari
dependency is disqualifying. Re-check those two issues if this track is ever revisited; the research
noted no fix at the time of writing.

**Rules-only, no Model Engine** — rejected, but *not* because it would fail the course. An earlier
planning log asserted that a rules-only v1 "may not meet" the AI grading weight; the course
feedback says no such thing and in fact rates the rule engine acceptable and highly testable. The
Model Engine is in scope as the one sanctioned difficulty uplift, taken explicitly in place of
cloud sync. **Rules-only remains a legitimate fallback plan if the schedule compresses** — and
because PRD FR-7 makes the Rule Engine the always-available path, dropping the Model Engine late
would subtract a feature rather than break the product. That is a deliberate property of the
architecture, worth preserving.

**Cloud sync and sharing** — cut before this PRD, on course-review advice that it was the largest
risk in the plan for a solo build and would amount to building two applications. The Model Engine
is what replaced it.

---

## 6. Staleness map

Research re-check dates for the chosen design all fall around **2027-01 / 2027-02** — i.e. *after*
the second-week-of-December-2026 deadline. The pricing, latency-mechanism, and privacy claims stay
fresh for the entire build. No mid-build re-verification is needed.

Two exceptions worth re-checking before they are written into anything user-facing:

- **Free credit and rate limits** (PRD OQ-3) — low-confidence aggregator figures (~$5,
  SMS-verified, ~14-day expiry, low initial RPM) that appear on no official Anthropic page. Confirm
  in the console before the README tells anyone what they will get.
- **The browser-access header** (§1.2) — corroborated widely but not confirmed on an official page
  during this run.

---

## 7. Process note: the research's own unrun step

The suggestion-engine research recommends re-running itself at `high` validation with a red-team
pass before its verdict is committed. That pass never ran, and the verdict is committed in `prd.md`
anyway. The grounds: the Rule Engine is independently sanctioned by course feedback, and the Model
Engine is additive, opt-in, and reversible behind an interface. Recorded as accepted risk (PRD
OQ-7) rather than dropped quietly — and if the engine choice ever starts looking wrong, this is the
cheap thing to run first.
