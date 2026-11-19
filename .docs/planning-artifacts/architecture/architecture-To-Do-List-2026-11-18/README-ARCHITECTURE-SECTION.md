---
title: "Architecture — the section for the README"
status: draft
created: 2026-11-18
updated: 2026-11-18
purpose: >
  Prose for the hand-in. Serves PRD NFR-9 (the AI decision documented in the deliverable) and the
  10% "Code and architecture" line of the §11 rubric.
on_paste: >
  Three things to change when this goes into README.md. Drop this frontmatter block. Demote the H1
  to match the README's own heading depth, since a second H1 breaks the document outline. And fix
  the closing link: "./ARCHITECTURE-SPINE.md" resolves against the repo root from the README and
  will 404 — point it at
  .docs/planning-artifacts/architecture/architecture-To-Do-List-2026-11-18/ARCHITECTURE-SPINE.md
  instead.
spine: ./ARCHITECTURE-SPINE.md
---

# Architecture

## The constraint that shaped everything

This application has no server. That is not a simplification — it is the requirement the whole design
answers to. The deliverable has to run from a fresh clone with no API key, no account, no network,
and no backend, because that is how it gets graded. Every architectural choice below either serves
that or was rejected for failing it.

The obvious consequence is that tasks live in the browser. The less obvious one is that the
*intelligence* has to work without a network too, which is why there are two Suggestion Engines
instead of one.

What the app does, in one sentence: when you type a task, it proposes a set of tags, a priority, and
a one-line summary, and you accept, edit, or reject each of the three separately — nothing is filed
until you do.

The sections that follow cover the two engines and why both exist, the privacy trade-off and how
consent works, the shape of the code and how it is tested, where the keys live, and what is still
open.

## Two engines, one interface

Behind that accept-edit-reject step sit two implementations of the same interface:

- **The Rule Engine** is a keyword classifier. It is a pure function of the task text and the due
  date: no network, no key, no configuration, the same answer every time. It is the guaranteed path,
  and the only one a grader exercises by default.
- **The Model Engine** calls the Anthropic API with your own key, and only after you have explicitly
  turned Cloud Suggestions on.

They are not a primary and a fallback in the usual sense. The Rule Engine is not a degraded mode — it
is the path that always works, and the Model Engine is an opt-in upgrade on top of it.

## Why these two, and not the alternatives

**Why not rules only?** A keyword classifier handles the clear cases well and the ambiguous ones
badly, and the ambiguous ones are where a task manager earns trust. Shipping both lets the project
*measure* the difference instead of asserting it.

**Why not a model running locally in the browser?** We investigated this and rejected it on evidence,
not taste: we found a live, unfixed crash in ONNX Runtime Web on Safari's WebGPU backend. Shipping an
AI feature that breaks on iPhones was not an acceptable trade for avoiding an API call.

**Why a hosted model with the user's own key?** Because it keeps the project's cost at zero and the
grader's at zero, and because it makes the privacy question honest: the key is yours, in your
browser, pasted in by you.

### When the Model Engine fails

If the Model Engine fails for any reason, the Rule Engine serves the suggestion and **nothing in the
capture or review flow says so**: no error, no banner, no toast, no spinner. A failure you can do
something about — a rejected key, an exhausted quota, an organization that forbids browser calls —
shows up as a plain status in Settings, and nowhere else.

That last failure mode is worth naming, because it surprised us. An Anthropic account under zero data
retention, or one using the Compliance API, cannot call the API from a browser *at all*: a perfectly
valid key returns `401` with "CORS requests are not allowed for this Organization", and the
restriction is inherited from a parent enterprise organization, so a user can hit it without having
configured anything. Clearing it would require a backend. For those users the Rule Engine is the
permanent path, and the Settings copy says that the organization does not allow Cloud Suggestions,
instead of reporting a fault they could chase.

## The privacy trade-off, and how consent works

Task text is the only thing that can ever leave the device, and it does so only if you decide it may.

Cloud Suggestions are **off on first run even when a key is already saved**, and saving a key never
turns them on. The moment you save a key, the toggle appears beside it — still off — with a
disclosure stating that task text goes to the Anthropic API, that the key is your own, and that the
Rule Engine keeps serving suggestions. Turning it back off stops all outbound requests immediately,
under every code path.

The trade-off is real and worth stating plainly instead of minimizing it. Calling the API from a
browser requires an opt-in header whose name — `anthropic-dangerous-direct-browser-access` — is
honest about the cost: the key is visible to anyone who opens developer tools. For a
bring-your-own-key app running in your own browser, that is acceptable. For a key you share with
anyone, it would not be.

The application has no analytics, no telemetry, no crash reporting, and no third-party scripts
anywhere. The architecture enforces that instead of promising it: a Content-Security-Policy
`connect-src` limits outbound connections to the Anthropic host, so a stray `fetch` to anywhere else
fails at the browser, not at code review.

## The shape of the code

The system is **ports and adapters** with a pure domain core, and one requirement forced that choice.
The evaluation harness runs the Rule Engine, the date parser, and the list selectors as a **Node
command**, while the same logic serves the browser. Code that has to execute in two runtimes cannot
depend on either — so `src/core/` touches no DOM, no React, no `fetch`, and never reads the clock.

```
ui/        React, the surfaces            ─┐
app/       policy, store, routing         ─┤
adapters/  localStorage, Anthropic, clock ─┼──► core/   pure, shared, runtime-agnostic
ports/     the interfaces                 ─┤
harness/   the Node evaluation command    ─┘
```

Everything points inward. The payoff is that the accuracy figures the project publishes are measured
against **the same code the application runs** — not a copy written for the test, which would make
the headline number a statement about nothing.

Three decisions inside that shape are worth a grader's attention.

### Time is injected, never read

Every date is a plain `YYYY-MM-DD` local calendar date, and the one clock operation — "what is
today" — arrives through a port. The harness supplies a fixed reference date recorded in the fixture
file. The result is that every date-dependent test gives the same answer on any machine, in any time
zone, on any day of the week. A single stray `Date.now()` would quietly destroy that, so a lint rule
forbids it, instead of a convention merely discouraging it.

### Derived data is computed; user decisions are recorded

Smart Lists have no stored membership — they are recomputed from the task set on every render, so
they cannot drift. Archive is the same: instead of storing an "archived" flag and sweeping for
expiry, the app stores the completion date and derives everything from it, which is why changing the
retention window re-evaluates existing tasks for free. But the opposite applies to review state:
whether you accepted, edited, or rejected a suggestion is a *decision you made*, and it is recorded
explicitly — never inferred by comparing values, which would be wrong for an edit to the same value
and for accepting the default priority.

### One service owns the suggestion policy

Consent, engine selection, the timeout, failure classification, and the switch back to rules all live
in a single service. No part of the interface can reach an engine directly. This is what makes "every
failure produces a suggestion and no error" a property of one service instead of a convention several
files are trusted to honor.

## How this is tested

The whole suite runs with no API key and no network, in continuous integration (CI) and on a grader's
machine. The Anthropic API is deliberately mocked at two levels: at the HTTP boundary, where the real
shape of failure responses proves the adapter classifies them correctly, and at the interface, where
simple fakes drive the service's behavior. Every failure mode has a test asserting that a Rule Engine
suggestion is produced and no user-facing error appears.

CI runs typechecking, linting, unit tests, end-to-end tests at both 360 px and 1280 px with an
automated accessibility check, and the evaluation harness. The harness **exits non-zero** when
accuracy falls below the committed floor, so the quality bar is a gate, not a paragraph — see
[What is still open](#what-is-still-open) for how that floor is set.

## Keys and environment variables

There are two keys, in two runtimes, and only one of them is ever read by the application.

| Variable | Type | Where it lives | Notes |
| --- | --- | --- | --- |
| The app's Anthropic key | secret, optional | entered in Settings at runtime, stored on the device | Never a build-time variable, never in the bundle, never committed, and never the project's own key. The app works fully without it, with the Rule Engine serving suggestions. |
| `ANTHROPIC_API_KEY` | secret, optional | a Node environment variable, git-ignored | **Used only by the evaluation harness.** The application never reads it. |

`.env.example` documents the second row only. That is the whole of the project's build-time
configuration: there is no server, so there is no server-side place for a secret, and nothing else
needs configuring.

## What is still open

Two things are deliberately unresolved at hand-in, and pretending otherwise would be the wrong kind
of tidy.

**Model latency has not been measured.** Published sources disagree by an order of magnitude on how
long a call takes to return a parsed result, and the model's effort setting moves it further still.
A separate latency spike — distinct from the evaluation harness above — is written, and its pass bar
was fixed *before* we ran it: median at or under 2.5 s, 95th percentile at or under 6 s, precisely so
the result can falsify the plan instead of rationalizing it. The number decides the timeout value and
confirms the provider. It cannot decide whether the app ships, because capture is never gated on it.

**The accuracy comparison has not been run yet.** The fixture and the evaluation harness are
specified; the figures come from the first run, and we commit a written minimum per field alongside
them, each with a justification, so that a weak first measurement cannot approve itself.

## Where the detail lives

The full set of architectural decisions, each recording what it constrains and the divergence it
prevents, is in [`ARCHITECTURE-SPINE.md`](./ARCHITECTURE-SPINE.md).
