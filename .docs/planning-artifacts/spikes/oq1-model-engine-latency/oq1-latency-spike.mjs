#!/usr/bin/env node
/**
 * OQ-1 — Model Engine latency spike.
 *
 * Measures what PRD §12 OQ-1 says to measure: wall-clock from request sent to a
 * **parsed, schema-valid Suggestion object** — not time to first token. FR-10 cannot
 * review a partial object, so first-token latency is the wrong meter, and it is the
 * meter most of the disputed sources in research.md actually report.
 *
 * Call shape is fixed by OQ-1 so the number is reproducible rather than a property of
 * how the call happened to be written:
 *   model: claude-haiku-5-5 · output_config.effort: "low" · thinking: {type:"disabled"}
 *   structured output via output_config.format · small max_tokens
 *   no temperature, top_p or top_k
 *
 * Pass bar, set before the measurement (session log 996, 2026-11-14):
 *   p50 <= 2.5 s and p95 <= 6 s.
 *   Pass → Haiku 5.5 confirmed as provider, §13 item 12 closes, NFR-2 timeout := 6 s.
 *   Miss → time the OpenAI nano fallback at the same call shape and take the faster;
 *          if both miss, Claude is kept and NFR-2 timeout := 10 s.
 *
 * Usage:
 *   npm install
 *   node oq1-latency-spike.mjs --connection="Telenor fiber 500/500, Molde"
 *   node oq1-latency-spike.mjs --n=20 --arm=both --connection="..."
 *
 * Flags:
 *   --n=<int>          timed calls per arm (default 20, minimum 9; one extra warm-up
 *                      call is always made first and discarded, per OQ-1)
 *   --arm=spike|default|both   default: spike
 *   --connection="..." free-text label for the connection this was measured on.
 *                      OQ-1 requires it to be named alongside the result.
 *   --out=<dir>        where the JSON result lands (default ./results)
 *   --dry-run          print the request shape and exit without calling the API
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Fixed configuration (PRD §12 OQ-1)
// ---------------------------------------------------------------------------

const MODEL = "claude-haiku-5-5";
const MAX_TOKENS = 300; // a Suggestion is three small fields; thinking is off in the spike arm
const REQUEST_TIMEOUT_MS = 30_000; // generous on purpose: research reported calls up to ~13 s

const PASS_P50_MS = 2_500;
const PASS_P95_MS = 6_000;

// Verified against platform.claude.com/docs on 2026-11-14 (session log 996):
// $0.10 / MTok in and $0.50 / MTok out for prompts up to 100k tokens.
// Re-check before quoting these in the PRD again — pricing pages move.
const USD_PER_MTOK_IN = 0.1;
const USD_PER_MTOK_OUT = 0.5;
const NOK_PER_USD = 9.5; // rough, for the øre figure only

// ---------------------------------------------------------------------------
// The Suggestion schema (FR-6)
// ---------------------------------------------------------------------------

// Tag vocabulary is FR-7's complete set. FR-7 fixes it for the Rule Engine; the Model
// Engine is constrained to the same four here so FR-21 can compare the two engines on
// one Fixture. That constraint is an inference from FR-6 + FR-21, not something the PRD
// states for the Model Engine — see README "Assumptions".
const TAGS = ["school", "group", "work", "personal"];

const SuggestionSchema = z.object({
  tags: z.array(z.enum(TAGS)),
  priority: z.enum(["high", "medium", "low"]),
  summary: z.string(),
});

const SYSTEM_PROMPT = [
  "You propose structure for a single to-do task. You do not answer the task or talk to the user.",
  "",
  `Tags: zero or more of exactly these, and no others: ${TAGS.join(", ")}.`,
  "Priority: exactly one of high, medium, low.",
  "Summary: one line, at most 60 characters, restating the task cleanly. Never empty.",
  "",
  "If nothing fits, return tags [] and priority medium. That is a valid answer, not a failure.",
  "Do not include internal or system XML tags in your response.",
].join("\n");

// Representative task text. The first two are the PRD's own examples (FR-7's worked
// example and §1's vision sentence); the rest cover the tag and priority tables and the
// deliberate no-match case. English only — FR-7 scopes the vocabulary to English.
const TASKS = [
  "Submit assignment in IBE160 Friday",
  "email the group about Thursday's meeting",
  "Figure out the thing",
  "buy milk and bread after the lecture",
  "urgent: send the invoice to the customer before the deadline",
  "book a doctor appointment sometime next month",
  "prepare the group presentation slides for the team",
  "pay rent",
  "study for the exam on Monday",
  "maybe clean the apartment eventually",
];

// ---------------------------------------------------------------------------
// Arms
// ---------------------------------------------------------------------------

const FORMAT = zodOutputFormat(SuggestionSchema);

const ARMS = {
  // The OQ-1 configuration. This is the one the pass bar applies to.
  spike: {
    label: "spike (effort low, thinking disabled)",
    params: {
      output_config: { effort: "low", format: FORMAT },
      thinking: { type: "disabled" },
    },
  },
  // The naive call: server defaults for effort and thinking. Not measured against the
  // pass bar. It exists to test research.md's 0.7-1.0 s vs 9.6-13.4 s spread, which the
  // 2026-11-14 verification attributed to the effort/thinking axis rather than to model
  // variation. Running both arms turns that explanation into a measurement.
  default: {
    label: "default (server defaults for effort and thinking)",
    params: {
      output_config: { format: FORMAT },
    },
  },
};

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    n: 20,
    arm: "spike",
    connection: "",
    outDir: path.join(HERE, "results"),
    dryRun: false,
  };
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=([\s\S]*))?$/.exec(arg);
    if (!m) continue;
    const [, key, value] = m;
    switch (key) {
      case "n":
        out.n = Number.parseInt(value, 10);
        break;
      case "arm":
        out.arm = value;
        break;
      case "connection":
        out.connection = value ?? "";
        break;
      case "out":
        out.outDir = path.resolve(value);
        break;
      case "dry-run":
        out.dryRun = true;
        break;
      default:
        console.error(`Unknown flag: --${key}`);
        process.exit(64);
    }
  }
  if (!Number.isInteger(out.n) || out.n < 9) {
    console.error("--n must be an integer >= 9 (OQ-1 asks for at least 10 calls, the first discarded).");
    process.exit(64);
  }
  if (!["spike", "default", "both"].includes(out.arm)) {
    console.error("--arm must be spike, default or both.");
    process.exit(64);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** Nearest-rank percentile: the value at the p-th rank of the sorted sample. */
function percentile(sortedMs, p) {
  if (sortedMs.length === 0) return null;
  const rank = Math.ceil((p / 100) * sortedMs.length);
  return sortedMs[Math.min(Math.max(rank, 1), sortedMs.length) - 1];
}

function summarize(trials) {
  const ok = trials.filter((t) => t.ok);
  const ms = ok.map((t) => t.ms).sort((a, b) => a - b);
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const inTok = sum(ok.map((t) => t.inputTokens ?? 0));
  const outTok = sum(ok.map((t) => t.outputTokens ?? 0));
  return {
    counted: ok.length,
    failures: trials.length - ok.length,
    min: ms.length ? ms[0] : null,
    p50: percentile(ms, 50),
    p90: percentile(ms, 90),
    p95: percentile(ms, 95),
    max: ms.length ? ms[ms.length - 1] : null,
    mean: ms.length ? Math.round(sum(ms) / ms.length) : null,
    inputTokens: inTok,
    outputTokens: outTok,
    avgInputTokens: ok.length ? Math.round(inTok / ok.length) : null,
    avgOutputTokens: ok.length ? Math.round(outTok / ok.length) : null,
    usdPerCall: ok.length
      ? ((inTok / 1e6) * USD_PER_MTOK_IN + (outTok / 1e6) * USD_PER_MTOK_OUT) / ok.length
      : null,
  };
}

// ---------------------------------------------------------------------------
// One call
// ---------------------------------------------------------------------------

async function timedCall(client, armParams, taskText, referenceDate) {
  const userContent = [`Reference date: ${referenceDate}`, `Task: ${taskText}`].join("\n");

  const started = process.hrtime.bigint();
  try {
    const response = await client.messages.parse(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        ...armParams,
        // Deliberately absent: temperature, top_p, top_k — removed on current models
        // (400), and OQ-1 fixes the call shape without them.
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    // The clock stops only once there is a parsed, schema-valid Suggestion object.
    // parsed_output is null when the response did not validate.
    const parsed = response.parsed_output;
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

    if (!parsed) {
      return {
        ok: false,
        ms: Math.round(elapsedMs),
        task: taskText,
        error: "schema_validation_failed",
        detail: "parsed_output was null — the response did not validate against the Suggestion schema",
        stopReason: response.stop_reason ?? null,
        fatal: false,
      };
    }

    return {
      ok: true,
      ms: Math.round(elapsedMs),
      task: taskText,
      suggestion: parsed,
      stopReason: response.stop_reason ?? null,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    };
  } catch (err) {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    return {
      ok: false,
      ms: Math.round(elapsedMs),
      task: taskText,
      ...classifyError(err),
    };
  }
}

/** Most-specific-first, using the SDK's typed exception classes. */
function classifyError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    // FR-9's third persistent failure mode: a valid key whose organization forbids
    // browser calls returns 401 with "CORS requests are not allowed for this
    // Organization". That one is browser-only and should NOT appear from Node — if it
    // does show up here, that is itself worth recording in the PRD.
    const orgBlocked = /CORS requests are not allowed/i.test(err.message ?? "");
    return {
      error: orgBlocked ? "org_forbids_browser_calls" : "authentication_error",
      detail: err.message,
      type: err.type ?? null,
      status: err.status ?? 401,
      fatal: true,
    };
  }
  if (err instanceof Anthropic.NotFoundError) {
    return { error: "not_found", detail: err.message, type: err.type ?? null, status: 404, fatal: true };
  }
  if (err instanceof Anthropic.BadRequestError) {
    // e.g. thinking:{type:"disabled"} rejected above effort `high`, or an unsupported
    // parameter. Fatal: the call shape itself is wrong, so there is nothing to measure.
    return { error: "bad_request", detail: err.message, type: err.type ?? null, status: 400, fatal: true };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { error: "rate_limit", detail: err.message, type: err.type ?? null, status: 429, fatal: false };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    // Subclass of APIError in the TypeScript SDK — must be checked before it.
    return { error: "connection", detail: err.message, fatal: false };
  }
  if (err instanceof Anthropic.APIError) {
    return {
      error: "api_error",
      detail: err.message,
      type: err.type ?? null,
      status: err.status ?? null,
      fatal: false,
    };
  }
  return { error: "unknown", detail: String(err?.message ?? err), fatal: false };
}

// ---------------------------------------------------------------------------
// One arm
// ---------------------------------------------------------------------------

async function runArm(client, armName, n, referenceDate) {
  const arm = ARMS[armName];
  console.log(`\n--- arm: ${armName} — ${arm.label} ---`);

  // OQ-1: "the first discarded as connection setup".
  process.stdout.write("warm-up (discarded) ... ");
  const warmup = await timedCall(client, arm.params, TASKS[0], referenceDate);
  console.log(warmup.ok ? `${warmup.ms} ms` : `FAILED: ${warmup.error} — ${warmup.detail}`);
  if (!warmup.ok && warmup.fatal) {
    return { armName, label: arm.label, fatal: warmup, trials: [], summary: summarize([]) };
  }

  const trials = [];
  for (let i = 0; i < n; i++) {
    const task = TASKS[i % TASKS.length];
    const trial = await timedCall(client, arm.params, task, referenceDate);
    trials.push({ index: i + 1, ...trial });

    if (trial.ok) {
      const s = trial.suggestion;
      console.log(
        `  ${String(i + 1).padStart(2)}. ${String(trial.ms).padStart(6)} ms  ` +
          `[${s.tags.join(",") || "-"}] ${s.priority.padEnd(6)} "${s.summary}"`,
      );
    } else {
      console.log(
        `  ${String(i + 1).padStart(2)}. ${String(trial.ms).padStart(6)} ms  FAILED: ${trial.error} — ${trial.detail}`,
      );
      if (trial.fatal) break;
    }
  }

  return { armName, label: arm.label, warmupMs: warmup.ms, trials, summary: summarize(trials) };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function verdict(summary) {
  if (summary.counted === 0) return { pass: false, reason: "no successful calls" };
  if (summary.failures > 0) {
    return {
      pass: false,
      reason: `${summary.failures} call(s) failed — a provider that drops calls is not confirmed`,
    };
  }
  const p50ok = summary.p50 <= PASS_P50_MS;
  const p95ok = summary.p95 <= PASS_P95_MS;
  if (p50ok && p95ok) return { pass: true, reason: "p50 and p95 both within the bar" };
  return {
    pass: false,
    reason: [
      !p50ok ? `p50 ${summary.p50} ms > ${PASS_P50_MS} ms` : null,
      !p95ok ? `p95 ${summary.p95} ms > ${PASS_P95_MS} ms` : null,
    ]
      .filter(Boolean)
      .join("; "),
  };
}

function printSummary(result, isSpikeArm) {
  const s = result.summary;
  console.log(`\n  summary — ${result.label}`);
  console.log(`    counted        ${s.counted} call(s), ${s.failures} failed`);
  if (s.counted === 0) return null;
  console.log(`    min / p50      ${s.min} ms / ${s.p50} ms`);
  console.log(`    p90 / p95      ${s.p90} ms / ${s.p95} ms`);
  console.log(`    mean / max     ${s.mean} ms / ${s.max} ms`);
  console.log(`    tokens/call    ${s.avgInputTokens} in, ${s.avgOutputTokens} out`);
  console.log(
    `    cost/call      $${s.usdPerCall.toFixed(6)} (~${(s.usdPerCall * 100 * NOK_PER_USD).toFixed(3)} øre at ${NOK_PER_USD} NOK/USD)`,
  );
  if (s.counted < 20) {
    console.log(
      `    note           p95 over ${s.counted} samples sits at or near the maximum. Use --n=20 or more for a p95 worth citing.`,
    );
  }

  if (!isSpikeArm) return null;
  const v = verdict(s);
  console.log(`\n    OQ-1 bar       p50 <= ${PASS_P50_MS} ms and p95 <= ${PASS_P95_MS} ms`);
  console.log(`    VERDICT        ${v.pass ? "PASS" : "MISS"} — ${v.reason}`);
  console.log(
    v.pass
      ? "    consequence    Haiku 5.5 confirmed as Model Engine provider; §13 item 12 closes;\n" +
          "                   NFR-2 timeout := 6 s; the PRD's last latency blocker is gone."
      : "    consequence    Time the OpenAI nano fallback at this same call shape and take the faster of the two.\n" +
          "                   If both miss, Claude is kept (pricing and privacy decided it, not speed), NFR-2\n" +
          "                   timeout := 10 s, and the Model Engine's place in §6.3 Tier 2 is re-examined.",
  );
  return v;
}

function pasteBlock(run) {
  const spike = run.arms.find((a) => a.armName === "spike");
  if (!spike || spike.summary.counted === 0) return null;
  const s = spike.summary;
  const v = verdict(s);
  const other = run.arms.find((a) => a.armName === "default");
  const lines = [
    "",
    "--- paste into the PRD / session log ---",
    "",
    `**OQ-1 measured ${run.startedAt.slice(0, 10)}.** ${s.counted} consecutive calls, first discarded as connection setup.`,
    `Call shape as fixed in §12: \`${MODEL}\`, \`effort: "low"\`, \`thinking: {"type": "disabled"}\`, structured output, \`max_tokens: ${MAX_TOKENS}\`, no sampling parameters.`,
    `Measured to a parsed, schema-valid Suggestion object. Connection: ${run.connection || '(not named — rerun with --connection="...")'}.`,
    "",
    `p50 **${s.p50} ms**, p95 **${s.p95} ms** (min ${s.min}, mean ${s.mean}, max ${s.max}; ${s.failures} failures).`,
    `Against the bar set before the measurement — p50 <= ${PASS_P50_MS} ms and p95 <= ${PASS_P95_MS} ms — this is a **${v.pass ? "PASS" : "MISS"}** (${v.reason}).`,
    `Tokens per call: ~${s.avgInputTokens} in, ~${s.avgOutputTokens} out → $${s.usdPerCall.toFixed(6)} per Suggestion.`,
  ];
  if (other && other.summary.counted > 0) {
    lines.push(
      "",
      `Naive call for comparison (server defaults for effort and thinking): p50 ${other.summary.p50} ms, p95 ${other.summary.p95} ms` +
        ` — ${(other.summary.p50 / s.p50).toFixed(1)}× the spike arm's p50, consistent with research.md's spread being the effort/thinking axis rather than model variation.`,
    );
  }
  lines.push("", `Raw result: \`${path.relative(process.cwd(), run.resultPath).replace(/\\/g, "/")}\``, "");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const referenceDate = new Date().toISOString().slice(0, 10);
  const armNames = args.arm === "both" ? ["spike", "default"] : [args.arm];

  console.log("OQ-1 — Model Engine latency spike");
  console.log(`  model            ${MODEL}`);
  console.log(`  max_tokens       ${MAX_TOKENS}`);
  console.log(`  arms             ${armNames.join(", ")}`);
  console.log(`  timed calls      ${args.n} per arm (+1 warm-up, discarded)`);
  console.log("  measured to      parsed, schema-valid Suggestion object");
  console.log(`  reference date   ${referenceDate}`);
  console.log(
    `  connection       ${args.connection || '(NOT NAMED — OQ-1 wants this; rerun with --connection="...")'}`,
  );

  if (args.dryRun) {
    console.log("\n--dry-run — request shape per arm:\n");
    for (const name of armNames) {
      console.log(
        `  ${name}:`,
        JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, ...ARMS[name].params }, null, 2),
      );
    }
    return;
  }

  let client;
  try {
    client = new Anthropic({
      // Measurement honesty: the SDK retries 429/5xx/connection errors twice by
      // default, which would silently fold a retry's wait into one measured call.
      maxRetries: 0,
      timeout: REQUEST_TIMEOUT_MS, // milliseconds in the TypeScript SDK
    });
  } catch (err) {
    console.error("\nCould not construct the client — no credentials resolved.");
    console.error(`  ${err?.message ?? err}`);
    console.error("\nSet a key for this shell, then rerun:");
    console.error('  PowerShell:  $env:ANTHROPIC_API_KEY = "sk-ant-..."');
    console.error('  bash:        export ANTHROPIC_API_KEY="sk-ant-..."');
    console.error(
      "Or sign in once with the Anthropic CLI (`ant auth login`) — the SDK picks that profile up on its own.",
    );
    console.error(
      "Note: no VITE_ prefix. This is a Node-side key for the spike and the FR-20 harness; it never enters the app bundle (OQ-4).",
    );
    process.exit(2);
  }

  const run = {
    question: "OQ-1",
    startedAt: new Date().toISOString(),
    connection: args.connection,
    referenceDate,
    config: {
      model: MODEL,
      maxTokens: MAX_TOKENS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      maxRetries: 0,
      timedCallsPerArm: args.n,
      warmupDiscarded: true,
      measuredTo: "parsed, schema-valid Suggestion object",
      passBar: { p50Ms: PASS_P50_MS, p95Ms: PASS_P95_MS },
      pricing: { usdPerMTokIn: USD_PER_MTOK_IN, usdPerMTokOut: USD_PER_MTOK_OUT, verified: "2026-11-14" },
      tagSet: TAGS,
    },
    environment: {
      node: process.version,
      platform: `${os.platform()} ${os.release()}`,
      sdk: "@anthropic-ai/sdk",
    },
    arms: [],
  };

  for (const name of armNames) {
    run.arms.push(await runArm(client, name, args.n, referenceDate));
  }

  let spikeVerdict = null;
  for (const result of run.arms) {
    const v = printSummary(result, result.armName === "spike");
    if (v) spikeVerdict = v;
  }
  run.verdict = spikeVerdict;
  run.finishedAt = new Date().toISOString();

  fs.mkdirSync(args.outDir, { recursive: true });
  const stamp = run.startedAt.replace(/[:.]/g, "-");
  run.resultPath = path.join(args.outDir, `oq1-${stamp}.json`);
  fs.writeFileSync(run.resultPath, JSON.stringify(run, null, 2) + "\n", "utf8");
  console.log(`\nraw result written to ${path.relative(process.cwd(), run.resultPath).replace(/\\/g, "/")}`);

  const block = pasteBlock(run);
  if (block) console.log(block);

  // Exit code carries the verdict, so this can be scripted: 0 pass, 1 miss, 2 no credentials.
  process.exit(spikeVerdict ? (spikeVerdict.pass ? 0 : 1) : 1);
}

main().catch((err) => {
  console.error("\nUnexpected failure:", err);
  process.exit(70);
});
