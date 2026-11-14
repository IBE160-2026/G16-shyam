# OQ-1 — Model Engine latency spike

Throwaway measurement harness for the last open blocker in
`../../prds/prd-To-Do-List-2026-10-31/prd.md`. It is a **planning artifact, not application
code** — nothing here ships in the app, which is why it lives under `.docs/planning-artifacts/`
rather than in the eventual source tree (the app's layout is still an architecture-phase
decision).

## Why this exists

PRD §12 OQ-1 is the reason the PRD's status is `draft`. Research sources disagree about Haiku
5.5's latency by an order of magnitude — roughly 0.7–1.0 s versus 9.6–13.4 s — and the
2026-11-14 verification (session log `996`) traced that spread to the **effort/thinking axis**
rather than to model variation: adaptive thinking is on by default and default effort is not
the lowest. That is an explanation, not a measurement. This script makes it a measurement.

What the number decides: the provider (§4.2), NFR-2's timeout, and FR-8's pending-state UX.
What it does not decide: whether v1 ships. FR-8 holds either way — capture is never gated on it.

## What is measured

Wall-clock from request sent to a **parsed, schema-valid Suggestion object** — not time to
first token. FR-10 cannot review a partial object, so first-token latency is the wrong meter,
and it is the meter most of the disputed sources actually report. The clock stops only after
`parsed_output` comes back non-null, i.e. after the response has validated against the
Suggestion schema.

The call shape is fixed by OQ-1 so the number is a property of the configuration rather than
of how the call happened to be written:

| | |
|---|---|
| model | `claude-haiku-5-5` |
| effort | `output_config.effort: "low"` |
| thinking | `{"type": "disabled"}` (valid at effort `high` or below — OQ-2) |
| output | structured, via `output_config.format` |
| `max_tokens` | 300 |
| sampling | no `temperature`, `top_p` or `top_k` |

## Pass bar

Set **before** the measurement, on 2026-11-14, so the result can falsify it:
**p50 ≤ 2500 ms and p95 ≤ 6000 ms**, with no failed calls.

- **Pass** → Haiku 5.5 is confirmed as the Model Engine provider, §13 item 12 closes, NFR-2's
  timeout is set to **6 s**, and OQ-1 stops blocking the PRD's status.
- **Miss** → time the OpenAI nano fallback at this same call shape and take the faster of the
  two. If both miss, Claude is kept — pricing and privacy decided it, not speed
  (`addendum.md` §5) — NFR-2's timeout is set to **10 s**, and the Model Engine's place in
  §6.3's Tier 2 is re-examined rather than assumed.

The script prints the verdict and the consequence, and returns exit code `0` on pass, `1` on
miss, `2` when no credentials resolved.

## Running it

Needs Node 20+ and an API key with credit. One real key and about a minute of wall time.

```bash
npm install
```

Give the shell a key — **no `VITE_` prefix**: this is a Node-side key for the spike and the
FR-20 harness, and it never enters the app bundle (that distinction is OQ-4's, and the
architecture phase decides what `.env.example` ends up documenting).

```powershell
# PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

```bash
# bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

`ant auth login` works instead — the SDK resolves that profile on its own, with no env var set.

```bash
# the OQ-1 measurement
node oq1-latency-spike.mjs --connection="Telenor fiber 500/500, Molde"

# also time the naive call, to confirm the effort/thinking explanation
node oq1-latency-spike.mjs --arm=both --connection="..."

# print the request shape and exit, no API call, no cost
node oq1-latency-spike.mjs --dry-run
```

OQ-1 requires the connection to be **named alongside the result**, so `--connection` is not
decoration — the script warns when it is missing and records it in the JSON.

| Flag | |
|---|---|
| `--n=<int>` | timed calls per arm (default 20, minimum 9) |
| `--arm=spike\|default\|both` | default `spike` |
| `--connection="..."` | free-text label for the connection measured on |
| `--out=<dir>` | where the JSON lands (default `./results`) |
| `--dry-run` | print the request shape and exit |

## What you get

Three things: a per-call console table (latency, tags, priority, summary — so you can see the
Suggestions are sane, not just fast), a summary with min/p50/p90/p95/mean/max plus tokens and
cost per call, and a timestamped JSON file under `results/` holding the full run — config,
environment, every trial, the verdict. The JSON is the citable evidence; commit it.

It also prints a ready-to-paste Markdown block for the PRD and the session log, so the number
reaches §12 in the form OQ-1 asks for rather than being retyped from scrollback.

## Deliberate choices

- **`maxRetries: 0`.** The SDK retries 429/5xx/connection errors twice by default, which would
  silently fold a retry's wait into a single measured call. Failures are counted instead, and
  any failure fails the verdict — a provider that drops calls is not a confirmed provider.
- **First call discarded.** OQ-1 says so explicitly: it carries TLS and connection setup.
- **Default `--n=20`, not 10.** OQ-1's minimum is 10 calls with the first discarded, i.e. 9
  counted — but a p95 over 9 samples *is* the maximum, so the p95 half of the bar would be
  meaningless. 20 makes the figure worth citing. The cost difference is a fraction of an øre.
- **Nearest-rank percentiles**, no interpolation. Stated so the numbers can be reproduced.
- **Two arms.** `spike` is the OQ-1 configuration and the only one the bar applies to.
  `default` sends no `effort` and no `thinking` at all — the naive call — and exists to turn
  the 2026-11-14 effort/thinking explanation into a measured ratio. It is not held to the bar.
- **Varied task text.** Ten realistic tasks, cycled, rather than one repeated prompt — covers
  FR-7's tag and priority tables and the deliberate no-match case, and keeps the measurement
  away from any accidental identical-prompt effects.
- **English only.** FR-7 scopes the keyword vocabulary to English; Norwegian task text falling
  through is a documented scope boundary (§6.2), not something to measure here.

## Assumptions

Things this script decided that the PRD does not state. Each is cheap to change, and worth a
glance before the number is quoted as authoritative.

- **The Model Engine is constrained to FR-7's four tags** (`school`, `group`, `work`,
  `personal`). FR-7 fixes that set for the *Rule* Engine. FR-6 requires an identical output
  shape and FR-21 requires the two engines to be *directly comparable* on one Fixture, which
  together imply a shared vocabulary — but it is an inference, not a line in the PRD. If the
  Model Engine is meant to propose free-form tags, the schema here is wrong and FR-21's
  comparison needs rethinking.
- **`max_tokens: 300`** reads OQ-1's "a small `max_tokens`" as the smallest value that cannot
  truncate three short fields. Thinking is off in the spike arm, so nothing else draws on it.
- **The prompt wording** is this script's, not the PRD's. The app's real prompt will differ,
  and prompt length moves input tokens (and therefore cost, slightly) but not materially the
  latency this measures.
- **9.5 NOK/USD** for the øre figure only; the dollar figures are exact.

## Caveats

- **This cannot exercise FR-9's third persistent failure mode.** The ZDR / Compliance-API
  block — `401 authentication_error`, *"CORS requests are not allowed for this Organization"* —
  is a browser-origin restriction. A Node process is not a browser, so a key that fails in the
  app may well pass here. Verifying that failure mode needs a browser-based check, and NFR-8's
  mocked-API tests are what actually cover it. The script does classify it distinctly if it
  ever appears.
- **Disabled thinking is the configuration OQ-1 fixed, and it carries a known advisory.**
  Anthropic's guidance prefers low effort over disabling thinking outright, because a
  thinking-off model can leak internal tags into its visible output. Two things contain that
  here: the output is schema-constrained, so leakage shows up as a validation failure rather
  than as a plausible-looking Suggestion, and the system prompt says not to emit internal tags.
  If the spike arm produces `schema_validation_failed` repeatedly while the `default` arm does
  not, that advisory — not latency — is the finding, and the app should run at low effort with
  thinking left on instead.
- **Haiku 5.5's tokenizer counts ~30% more tokens than Haiku 4.5** for the same text
  (`addendum.md` §5). Affects the cost comparison against the OpenAI alternative, not this
  latency figure.
- **Pricing constants were verified 2026-11-14** and are in the script as named constants.
  Re-check before quoting them again.

## After it runs

The measurement is only half of closing OQ-1. The other half is these edits:

- [ ] PRD §12 OQ-1 → **RESOLVED**, with p50/p95, the call shape, the date, and the connection.
- [ ] PRD §13 item 12 → closed (provider confirmed), or the reason it stays open.
- [ ] NFR-2's timeout → 6 s on a pass, 10 s if both providers miss.
- [ ] PRD front matter `status: draft` → `final`, once OQ-1 is the last blocker standing
      (OQ-4 is explicitly deferred to architecture, so check §0's wording still holds).
- [ ] `results/*.json` committed as the evidence behind the number.
- [ ] Session log updated, and the OQ-1 line in `.logs/<user>/issues.md` ticked off.
