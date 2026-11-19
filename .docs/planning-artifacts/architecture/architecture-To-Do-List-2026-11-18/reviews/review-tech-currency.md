---
review: tech-currency
lens: "Verify every committed decision was web-researched or reality-checked rather than asserted from training data: current library/framework versions, that each named technology still exists and fits, and — greenfield — the live defaults of any starter it leans on. Flag anything that could be out of date and wasn't confirmed against the web, the existing project, or the current starter."
target: ../ARCHITECTURE-SPINE.md
also_read:
  - ../.memlog.md
  - ../../../prds/prd-To-Do-List-2026-10-31/addendum.md
reviewed: '2026-11-18'
method: live web verification (npm registry, GitHub API, nodejs.org/dist, platform.claude.com, MDN, vite.dev, tailwindcss.com, jsdelivr-served package typings). No claim below rests on training data.
verdict: PASS WITH FINDINGS
---

# Reviewer Gate — Tech Currency

## Verdict

**PASS WITH FINDINGS.**

Nothing the spine asserts turned out to be stale, invented, or wrong. Every version in the Stack
table is the live `latest` on the npm registry today; every Anthropic API fact the architecture
leans on is confirmed verbatim against `platform.claude.com` as of 2026-11-18; AD-13's TypeScript
reasoning is accurate down to the peer range and the closed issue. This is an unusually well
reality-checked artifact, and the memlog's `(version)` entry is a genuine verification trail rather
than a claim of one.

The findings are **omissions, not errors**: three dependencies the build cannot run without are
absent from the Stack table, one browser API the conventions commit to carries a secure-context
requirement nobody recorded, and the Node row understates its own floor. One forward-looking
correction to AD-13's revisit trigger.

---

## 1. Stack table — row-by-row verification

Each row checked against `https://registry.npmjs.org/-/package/<pkg>/dist-tags` on 2026-11-18.

| Spine row | Spine version | Live `latest` | Current? | Notes |
| --- | --- | --- | --- | --- |
| TypeScript | 6.0.3 | **7.0.2** | deliberate pin, correct | highest stable 6.x is 6.0.3 (published 2026-04-16); see §2 |
| Vite | 8.3.8 | 8.3.8 | ✅ exact | `beta` is 8.4.0-beta.1; 8.3.8 is the right stable |
| React / React DOM | 19.3.1 | 19.3.1 | ✅ exact | both packages agree |
| Tailwind CSS | 4.3.5 | 4.3.5 | ✅ exact | see finding F2 — the Vite integration package is missing |
| zod | 4.6.7 | 4.6.7 | ✅ exact | |
| @anthropic-ai/sdk | 1.10.0 | 1.10.0 | ✅ exact | published 2026-11-17, one day before the spine; see F6 |
| vite-plugin-pwa | 2.0.0 | 2.0.0 | ✅ exact | only 2.x release, published 2026-10-03; see F2 |
| Vitest | 5.1.1 | 5.1.1 | ✅ exact | `engines` tightens the Node floor; see F3 |
| @playwright/test | 1.65.1 | 1.65.1 | ✅ exact | `next` is 1.66.0-alpha-2026-11-18, i.e. unreleased |
| typescript-eslint | 8.73.0 | 8.73.0 | ✅ exact | |
| Node (harness, CI) | 22 LTS | — | ⚠ imprecise | see F3 |

Every technology named still exists under the name the spine uses. No row names a renamed,
merged, deprecated, or abandoned package.

### Mutual compatibility — peer dependencies resolved from each package's live manifest

```
vite@8.3.8            engines node ^20.19.0 || >=22.12.0
                      no non-optional peers (esbuild, @types/node, sass… all optional)

vite-plugin-pwa@2.0.0 engines node >=20.19.0
                      peer vite           ^3.1.0 || ^4 || ^5 || ^6 || ^7 || ^8   ✅ vite 8.3.8 satisfies
                      peer workbox-build  ^7.4.1   ← NOT optional
                      peer workbox-window ^7.4.1   ← NOT optional
                      peer @vite-pwa/assets-generator ^1 || ^2  (optional)

vitest@5.1.1          engines node ^22.12.0 || ^24.0.0 || >=26.0.0
                      peer vite ^6.4.0 || ^7.0.0 || ^8.0.0   ✅ vite 8.3.8 satisfies (non-optional)

@vitejs/plugin-react@6.3.0
                      engines node ^20.19.0 || >=22.12.0
                      peer vite ^8.0.0   ✅   (declares NO react peer, so 19.3.1 is unconstrained)

@tailwindcss/vite@4.3.5
                      peer vite ^5.2.0 || ^6 || ^7 || ^8   ✅

typescript-eslint@8.73.0
                      peer eslint      ^8.57.0 || ^9.0.0 || ^10.0.0   (eslint latest = 10.15.0 ✅)
                      peer typescript  >=4.8.4 <6.1.0                 ✅ 6.0.3 satisfies, 7.0.2 does not

@anthropic-ai/sdk@1.10.0
                      peer zod ^3.25.0 || ^4.0.0 (optional)   ✅ zod 4.6.7 satisfies

@playwright/test@1.65.1  engines node >=20   ✅
```

**The three specific conflicts the gate asked about do not exist:**

- **Vite 8 against vite-plugin-pwa 2.0.0** — no conflict. `^8.0.0` is in the plugin's peer range;
  widening it to Vite 8 is exactly what the 2.0.0 major was for.
- **Vite 8 against Vitest 5.1.1** — no conflict. `^8.0.0` is in Vitest's non-optional `vite` peer
  range.
- **React 19.3.1 against the React plugin** — no conflict, and for a reason worth knowing:
  `@vitejs/plugin-react@6.3.0` declares **no** `react` peer at all (its optional peers are
  `oxc-transform-react`, `@rolldown/plugin-babel`, `babel-plugin-react-compiler`). React version is
  unconstrained by the plugin.
- **Tailwind 4.3.5's Vite integration** — no version conflict; the problem is that the integration
  package is not in the table at all (F2).

---

## 2. AD-13 — the TypeScript 6 pin

AD-13 makes four factual claims. **All four are true today, and I could not find a way to break
any of them.**

| AD-13 claim | Verification | Verdict |
| --- | --- | --- |
| "TypeScript 7.0 GA'd 2026-07-08" | `registry.npmjs.org/typescript` `.time["7.0.2"] = 2026-07-08T15:55:18Z`. Note the GA artifact is **7.0.2** — there is no stable 7.0.0 or 7.0.1 on npm, only `7.0.1-rc`. | ✅ date exact |
| "ships no stable programmatic compiler API until 7.1, which is still only `7.1.0-beta`" | dist-tags today: `beta: 7.1.0-beta` (tagged 2026-10-20), `next: 7.1.0-dev.20261118.1`. Nightlies are still being cut today; no stable 7.1. | ✅ still true |
| "`typescript-eslint@8.73.0` declares `typescript: \">=4.8.4 <6.1.0\"`" | Manifest, verbatim: `"typescript": ">=4.8.4 <6.1.0"`. I also checked the **canary** `8.73.1-alpha.5` — same range. The cap has not moved even on unreleased code. | ✅ verbatim |
| "closed its TypeScript 7 support issue as not planned" | GitHub search API: issue **#13196 "Support TypeScript 7.0"** — `state: closed`, `state_reason: not_planned`, last updated **2026-11-14**. Also #12720, #12518, #12445, all `not_planned`. | ✅ and recently reaffirmed |

**6.0.3 is the right pin today.** It is the highest stable 6.x, it is the only way to stay inside
typescript-eslint's peer range, and the alternative loses linting — which the memlog correctly
weighs against the rubric's 5% repo tidiness and 10% code-and-architecture lines.

**One correction to AD-13's revisit trigger (F5).** "Closed as not planned" is true of *TypeScript
7.0 support*, not of all TypeScript 7 work. PR **#12803** — *"feat(typescript-estree): add
`projectService.EXPERIMENTAL_backend` for TypeScript 7.1 native parser support over IPC"* — was
**merged**, last updated 2026-11-10, and issue **#10940** *"Enhancement: Use TS 7 (tsgo /
typescript-go) for type information"* is still **open**. So the path exists and is being built; it
is experimental and the peer cap has not moved. AD-13's revisit condition should watch the peer
range in `typescript-eslint`'s manifest and the `EXPERIMENTAL_backend` option, not only a 7.1 GA
announcement. The decision to ship 6.0.3 is unaffected.

---

## 3. Anthropic API facts — all six confirmed, one addition

Verified against `platform.claude.com` on 2026-11-18, plus the pinned SDK's own typings served
from jsdelivr (`@anthropic-ai/sdk@1.10.0`). The addendum's §1 facts were checked on 2026-10-31 and
2026-11-14; **none has gone stale in the interval.**

| Fact the architecture leans on | Status | Settled by |
| --- | --- | --- |
| Header `anthropic-dangerous-direct-browser-access` | ✅ exact name, current | Authentication → Browser-based applications |
| SDK option `dangerouslyAllowBrowser` | ✅ present in 1.10.0's `ClientOptions` typings, documented | same page + `client.d.ts:156` |
| Structured outputs via `output_config.format`, **not** `output_format` | ✅ confirmed, and stronger than the addendum states | Structured outputs → Migrating from the beta |
| Model id `claude-haiku-5-5` | ✅ still a current model | Models overview |
| ZDR / Compliance API org → browser call refused with 401 | ✅ confirmed, including Enterprise-parent inheritance | Authentication → Browser-based applications |
| `stop_reason` values `refusal` and `max_tokens` | ✅ both exist | Handling stop reasons + SDK `StopReason` union |

**Browser access — quoted from the live page:**

> A request sent directly from a browser is a cross-origin (CORS) request. The API accepts these
> requests only when they include the `anthropic-dangerous-direct-browser-access: true` header,
> which the TypeScript SDK sends when you set `dangerouslyAllowBrowser` to `true`.

> Organizations that have zero data retention (ZDR) or the Compliance API enabled cannot call the
> API directly from a browser, even with that header. **Other organization settings can have the
> same effect, and no setting allows browser requests for these organizations.** The API returns a
> 401 `authentication_error` whose message begins `CORS requests are not allowed for this
> Organization`, even though the API key is valid. A Claude Console organization linked to a Claude
> Enterprise parent organization inherits the Compliance API setting from the parent.

> The restriction applies only to requests that include an `Origin` header, which browsers add and
> server-side HTTP clients normally do not.

The bolded sentence is **new relative to the addendum's wording** and it is architecturally
favourable: it means `org_forbids_browser` (AD-4) is correctly named as a *class* of refusal, and
the adapter must classify it from the **401 plus the message prefix**, never by trying to infer
whether the user's org has ZDR or Compliance API enabled — that inference would miss the "other
organization settings" cases. Worth one clause in the adapter's story. Note also that the `Origin`
sentence confirms the FR-21 harness (Node, no `Origin` header) is exempt from this failure mode
entirely — so the harness cannot reproduce it, which is precisely why NFR-8's HTTP-level mock of
the real 401 body matters.

**Structured outputs — the addendum is right, and the current position is firmer than it says.**
Quoted:

> The `output_format` parameter has moved to `output_config.format`, and beta headers are no longer
> required. The `output_format` parameter is deprecated. To use it anyway, add the
> `structured-outputs-2025-11-13` beta header. Without it, the API returns a 400 error.

So `output_format` is not merely deprecated: on the TypeScript SDK it is not even on
`MessageCreateParams` — the 1.10.0 typings carry `output_config?: OutputConfig` on both the
streaming and non-streaming param types, and the only `output_format`-shaped thing is the
`JSONOutputFormat` *type* and a `zodOutputFormat()` helper referenced in the JSDoc. Two consequences
for the build:

- `claude-haiku-5-5` is listed among supported models; structured outputs are `status: stable`, no
  beta header. The addendum's JSON body is directly usable.
- The SDK ships `zodOutputFormat()`, which is why `zod` is a (optional) peer of the SDK. The spine
  lists zod 4.6.7 in the Stack table without saying what it is for; given the SDK helper and
  `core/suggestion.ts`'s "Suggestion shape + zod schema", this is the natural seam and worth
  naming so the builder does not hand-write a schema twice.

**Refusal and truncation — verbatim from Structured outputs → Invalid outputs:**

> **Refusals** (`stop_reason: "refusal"`) … The response has `stop_reason: "refusal"`. You'll
> receive a 200 status code. You'll be billed for the tokens generated. The output might not match
> your schema because the refusal message takes precedence over schema constraints.

> **Token limit reached** (`stop_reason: "max_tokens"`) … The output might be incomplete and not
> match your schema.

AD-4's description of the refusal trap — "HTTP 200, billed, schema may not hold" — is verbatim
correct. The docs add that on a refusal, `stop_details` names the policy category; irrelevant to
FR-9 (everything non-`end_turn` falls to the Rule Engine) but available if FR-11's wording ever
wants it.

**Enum casing — verbatim:**

> Structured outputs don't guarantee the capitalization of string `enum` and `const` values: Claude
> might return a value that differs from your schema only in capitalization, typically in the first
> letter of a word following a space. … Compare enum values case-insensitively, and avoid enum
> values that differ only in capitalization.

The conventions' case-insensitive Priority comparison is correct. Note the stated mechanism is
*capitalization after a space* — the project's `high` / `medium` / `low` are single lowercase words,
so the practical risk is low, but the doc gives no guarantee and the defensive compare costs
nothing. Two schema constraints worth carrying into `core/suggestion.ts`: `additionalProperties`
**must** be `false` on objects (the addendum's schema already has it), and array `minItems` supports
only 0 and 1 — fine for the Tags array, which sets neither.

**Claude Haiku 5.5 — still current, and still the right model.** From Models overview, today:

| | Verified 2026-11-18 | Addendum (2026-10-31) |
| --- | --- | --- |
| Status | listed under **Latest models** | current |
| Claude API ID | `claude-haiku-5-5` | same ✅ |
| Price | From $0.10 / From $0.50 per MTok | same ✅ |
| Context / max output | 1M / 128K | same ✅ |
| Default effort | `medium` | same ✅ |
| Retirement | **Not sooner than October 7, 2027** | same ✅ |
| Positioning | "For high-volume, latency-sensitive tasks such as classification, extraction, and routing" | same ✅ |

Nothing has moved. The model has not been superseded within its own tier, and retirement is ~11
months past any plausible hand-in. Prompt cache reads at 10% of base input also hold. One datum the
addendum does not carry: the current API version header shown throughout the docs is
`anthropic-version: 2026-10-21` — the SDK sends it, so this is informational only.

**`stop_reason` — the full set, and a gap in AD-4 (F4).** The pinned SDK's own union, from
`@anthropic-ai/sdk@1.10.0/resources/messages/messages.d.ts:4146`:

```ts
export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
                       | 'pause_turn' | 'refusal' | 'model_context_window_exceeded';
```

Seven values. AD-4 enumerates two of them as traps. See F4.

---

## 4. `crypto.randomUUID()` — the one unexamined assumption

The conventions table commits to it:

> Data — ids | Task id is a `crypto.randomUUID()` string, generated in the adapter layer, never in
> `core`.

**The API is fine. Its context requirement is not recorded anywhere.** MDN:

> **Secure context:** This feature is available only in secure contexts (HTTPS), in some or all
> supporting browsers.

> **Baseline — Widely available.** … available across browsers since **March 2022**.

Browser support is a non-issue: Baseline widely available since March 2022, well inside any target
this project could have. The secure-context requirement is the issue, and the gate's instinct was
right. Per MDN's Secure Contexts, an origin is potentially trustworthy with:

> * A scheme of `https`, `wss`, or `file`.
> * A host value of `127.0.0.0/8` or `::1/128`
> * A host value of `localhost` or `localhost.`
> * A host value ending with `.localhost` or `.localhost.`

So:

- `http://localhost:5173` — **secure context.** `npm run dev` on the developer's or grader's own
  machine works. The spine's Environments diagram and SM-2's clone-and-run contract are safe.
- `http://192.168.x.x:5173` — **not a secure context.** `crypto.randomUUID` is `undefined` and
  *every* Task creation throws at the exact moment FR-8 promises "Task saved and visible — under
  100ms".

That second row is not hypothetical for this project. DESIGN.md binds 360px, the PWA is the product,
and the only practical way to see either on a real phone is `vite --host` and the laptop's LAN IP
from the phone's browser. The same origin also cannot register a service worker, so NFR-3's offline
behaviour and AD-11's PWA config are untestable there too — a builder meeting both failures at once,
on a Thursday, three weeks out, will spend the evening on it.

This is cheap to neutralise and the architecture already has the right seam: ids are generated **in
the adapter layer** (AD-1 keeps `crypto` out of `core` anyway), so a single `newId()` in
`src/adapters/` that falls back when `crypto.randomUUID` is absent closes it in four lines — or, if
a fallback is unwanted, one line in the README plus `server.https` or a `localhost`-only rule makes
the constraint explicit instead of latent. Either is fine; silence is not, because the failure mode
is a crash in the one path FR-8 measures.

---

## 5. Node 22 — in maintenance, and the floor is 22.12, not 22

From `nodejs.org/dist/index.json` and `github.com/nodejs/Release/schedule.json`, today:

| Line | Codename | Active LTS from | Maintenance from | End of life |
| --- | --- | --- | --- | --- |
| Node 20 | Iron | 2023-10-24 | 2024-10-22 | **2026-04-30 — already EOL** |
| **Node 22** | **Jod** | 2024-10-29 | **2025-10-21** | **2027-04-30** |
| Node 24 | Krypton | 2025-10-28 | 2026-10-20 | 2028-04-30 |
| Node 26 | Lithium | **2026-10-28 — current Active LTS** | 2027-10-20 | 2029-04-30 |

Newest 22.x is **v22.23.5** (2026-11-11), still receiving releases.

**Is Node 22 still in LTS?** Yes — maintenance LTS, security and critical fixes only, until
2027-04-30. For a deliverable with a deadline measured in weeks that is entirely defensible, and
choosing a line that is *not* the newest Active LTS is arguably the conservative call for a solo
builder. **Is it the right floor?** Yes, with one correction:

- Vite 8's own guide: *"Vite requires Node.js version 20.19+, 22.12+."* Its `engines` says
  `^20.19.0 || >=22.12.0`. Node 20 is EOL, so 22.12+ is the real floor.
- **Vitest 5.1.1's `engines` is the binding constraint: `^22.12.0 || ^24.0.0 || >=26.0.0`.** Two
  things follow. (a) The 22 floor is **22.12**, not 22.0 — a developer on 22.11 is outside the
  supported range of two of the three core tools. (b) The range *excludes odd majors*: 23 and 25
  are not satisfied, so "just use something newer than 22" is not automatically safe either. A
  teammate or future-you on Node 25 would be out of range.
- `vite-plugin-pwa@2.0.0` wants `>=20.19.0`, `@playwright/test@1.65.1` wants `>=20`,
  `typescript-eslint@8.73.0` wants `^18.18.0 || ^20.9.0 || >=21.1.0` — all satisfied by 22.12+.

In practice `actions/setup-node` with `node-version: 22` resolves to the newest 22.x and is fine;
the exposure is a local machine and an `.nvmrc`. Writing **`22.12+` (currently 22.23.5)** in the
Stack row and an `engines` field plus `.nvmrc` in the repo turns a latent mismatch into an install-
time error message, which is what NFR-7 wants.

---

## Findings

### F1 — `crypto.randomUUID()` requires a secure context; nothing records it — **high**

The conventions commit to `crypto.randomUUID()` for Task ids. It is Baseline-widely-available and
the right choice, but it is **secure-context-only**: fine on `http://localhost`, `undefined` over
`http://<LAN-IP>:5173`, which is the only way to open the app on a real phone — and 360px phone
behaviour is a bound requirement. Service-worker registration (NFR-3, AD-11) fails on the same
origin. Add a `newId()` adapter helper with a fallback, or state the localhost/HTTPS constraint in
the README and the Environments section. Settled by
`https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID` and
`https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts`.

### F2 — the Stack table cannot produce a working build as written — **high**

Eleven rows, carrying the note *"Verified against the npm registry, the GitHub releases API and
unpkg on 2026-11-18"* — which reads as a statement of completeness. Four things the build needs are
absent, and the builder will transcribe this table into `package.json`:

| Missing | Current version | Why it is load-bearing |
| --- | --- | --- |
| `@vitejs/plugin-react` | **6.3.0** (peer `vite ^8.0.0`) | no React Fast Refresh, no JSX transform; a Vite+React app does not build without it |
| `@tailwindcss/vite` | **4.3.5** (peer `vite ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8`) | in v4 the Vite integration **is** this package — `tailwindcss` alone compiles nothing, and `src/ui/theme.css`'s `@theme` block needs it |
| `eslint` | **10.15.0** (typescript-eslint 8.73.0 peers `^8.57.0 \|\| ^9 \|\| ^10`) | AD-2's `no-restricted-globals` enforcement and AD-1's boundary rules are *mechanical* claims that depend on it; the rule itself is current and not deprecated |
| `workbox-build` + `workbox-window` | **7.4.1** each | **non-optional peers** of `vite-plugin-pwa@2.0.0` — only `@vite-pwa/assets-generator` is marked optional. v1 carried workbox as a direct dependency; 2.0.0 moved it to a peer, so this is a breaking change the project inherits |

Also worth a row: `@types/node` (optional peer of Vite 8 at `^20.19.0 \|\| >=22.12.0` and of Vitest
5.1.1 at `^22.0.0 \|\| >=24.0.0`) — `harness/run.ts` will not typecheck without it, and AD-12 makes
the harness a graded deliverable. Settled by the live manifests at
`https://registry.npmjs.org/vite-plugin-pwa/latest`,
`https://registry.npmjs.org/@vitejs/plugin-react/latest`,
`https://registry.npmjs.org/@tailwindcss/vite/latest`, and
`https://tailwindcss.com/docs/installation/using-vite`.

### F3 — "Node 22 LTS" understates the floor (22.12) and overstates the status (maintenance, not Active) — **medium**

Node 22 Jod is in **maintenance** LTS since 2025-10-21, EOL 2027-04-30; Node 26 Lithium has been the
Active LTS since 2026-10-28. Defensible for this deadline. But the floor is wrong as written:
Vite 8 needs `>=22.12.0` and **Vitest 5.1.1's `engines` is `^22.12.0 || ^24.0.0 || >=26.0.0`** —
which both raises the 22 floor to 22.12 and excludes odd majors (23, 25), so "newer is safer" does
not hold. Write `22.12+` (currently v22.23.5), and put it in `engines` and `.nvmrc` so it fails at
install rather than mid-test. Settled by
`https://github.com/nodejs/Release/blob/main/schedule.json`,
`https://registry.npmjs.org/vitest/latest` and `https://vite.dev/guide/`.

### F4 — AD-4 enumerates 2 of 7 `stop_reason` values as traps — **medium**

The pinned SDK's own union is `'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' |
'pause_turn' | 'refusal' | 'model_context_window_exceeded'`. AD-4 names `refusal` and `max_tokens`.
Neither `pause_turn` (no server tools) nor `model_context_window_exceeded` (200–500 input tokens)
can realistically fire here — but AD-4 is written as an *invariant about everything the adapter
absorbs*, and an enumeration of two silently becomes a hole when the API adds an eighth value. The
robust form costs nothing and matches FR-9's catch-all: **treat any `stop_reason` other than
`end_turn` as `transient`**, then name `refusal` and `max_tokens` as the two worth commenting. Same
list, no enumeration to maintain. Settled by
`https://platform.claude.com/docs/en/api/handling-stop-reasons` and
`@anthropic-ai/sdk@1.10.0/resources/messages/messages.d.ts:4146`.

### F5 — AD-13's revisit trigger watches the wrong signal — **low**

AD-13 is factually correct on every point (§2). But "closed its TypeScript 7 support issue as not
planned" is true of **TS 7.0** support specifically; typescript-eslint has since **merged** PR
#12803 adding `projectService.EXPERIMENTAL_backend` for *TypeScript 7.1 native parser support over
IPC* (updated 2026-11-10), and issue #10940 on using tsgo for type information is still open. The
peer cap has not moved — canary `8.73.1-alpha.5` still says `>=4.8.4 <6.1.0` — so **the 6.0.3 pin
stands unchanged**. Only the revisit condition should be reworded: watch the `typescript` peer range
in typescript-eslint's manifest, not a 7.1 GA announcement, since the GA could land with the cap
still closed (or the cap could open before GA). Settled by
`https://api.github.com/search/issues?q=repo:typescript-eslint/typescript-eslint+TypeScript+7+in:title`
and `https://registry.npmjs.org/typescript-eslint/8.73.1-alpha.5`.

### F6 — the SDK pin is one day old and is not the version the spike exercised — **low**

The memlog's claim that *"the SDK line is reality-checked against working code, not only the
registry"* is true of **1.8.0** (installed 2026-11-14). The spine pins **1.10.0**, published
**2026-11-17** — one day before the spine. I read the 1.9.0 and 1.10.0 changelog entries: they are
billing parameters, new error codes, webhook events, and agent-tooling fixes (session tool runner,
grep/tar/unzip path hardening). **Nothing touches `output_config`, `dangerouslyAllowBrowser`,
`StopReason`, or the Messages surface this project uses**, and `dangerouslyAllowBrowser` plus
`output_config` are both present in 1.10.0's typings, verified directly. So the pin is safe — but
the honest statement is "registry-current, with the adjacent 1.8.0 exercised by the spike", and
re-running the spike against 1.10.0 is a five-minute confirmation worth having before the adapter
story starts. Settled by
`https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md`.

### F7 — `org_forbids_browser` must be classified from the 401, not from an org-settings inference — **low**

The live Authentication page adds a sentence the addendum predates: *"Other organization settings
can have the same effect, and no setting allows browser requests for these organizations."* So the
refusal class is broader than ZDR + Compliance API. AD-4's **name** is right (it says
`org_forbids_browser`, not `zdr_enabled`); the note is for the adapter story — classify on
`401 authentication_error` whose message begins `CORS requests are not allowed for this
Organization`, never by trying to detect the org's configuration. Related: the same page confirms
the restriction applies **only** to requests carrying an `Origin` header, so the FR-21 Node harness
is structurally exempt and cannot reproduce this failure — which is exactly why NFR-8's HTTP-level
mock of the real 401 body (already decided in the memlog) is the only test that covers it. Settled
by `https://platform.claude.com/docs/en/manage-claude/authentication`.

---

## What this lens found no fault with

Recorded explicitly, because a lens that only reports problems misrepresents the artifact:

- **Every one of the 10 pinned npm versions is the exact live `latest`.** Not one is behind, and
  not one is a version that never existed. For a 2026-11-18 artifact that is the whole ask of this
  lens.
- **No named technology has been renamed, deprecated, merged, or abandoned.** Vite, React, Tailwind,
  zod, Vitest, Playwright, typescript-eslint, vite-plugin-pwa and `@anthropic-ai/sdk` all exist
  under the names used, at the versions used.
- **No peer-dependency conflict exists among the listed rows.** The three the gate specifically
  suspected are all clean, with margin.
- **Every Anthropic API fact survives re-verification**, including the two that were checked on
  earlier dates (2026-10-31 and 2026-11-14) and could plausibly have drifted. The addendum's
  verification note — which explicitly caught and overrode a stale cached model table — is the
  behaviour this lens exists to require, already done.
- **AD-13 is the strongest thing in the document.** It is a decision to *not* take the registry's
  `latest`, justified by a peer range quoted verbatim, a release date confirmed to the day, and a
  closed upstream issue. It is the opposite of a training-data assertion.
- This is **not greenfield-from-a-starter** in the sense the lens worries about: there is no
  `create-vite` / `create-next-app` template whose live defaults were assumed. Dependencies are
  enumerated deliberately, which is why F2's omissions matter — the table *is* the starter here, so
  completeness is the only thing standing in for a scaffold.

## Verification index

| Checked | Source |
| --- | --- |
| all 10 package versions, dist-tags | `https://registry.npmjs.org/-/package/<pkg>/dist-tags` |
| peer deps, `engines` | `https://registry.npmjs.org/<pkg>/latest` |
| TS 6.x/7.x version list and publish dates | `https://registry.npmjs.org/typescript` |
| typescript-eslint TS7 issues | `https://api.github.com/search/issues?q=repo:typescript-eslint/typescript-eslint+TypeScript+7+in:title` |
| Node LTS schedule | `https://github.com/nodejs/Release/blob/main/schedule.json` |
| newest Node 22.x | `https://nodejs.org/dist/index.json` |
| Vite Node requirement | `https://vite.dev/guide/` |
| Tailwind v4 Vite install | `https://tailwindcss.com/docs/installation/using-vite` |
| browser access, header, ZDR/Compliance 401 | `https://platform.claude.com/docs/en/manage-claude/authentication` |
| `output_config.format`, refusal, truncation, enum casing | `https://platform.claude.com/docs/en/build-with-claude/structured-outputs` |
| `stop_reason` values | `https://platform.claude.com/docs/en/api/handling-stop-reasons` |
| `claude-haiku-5-5` id, price, retirement | `https://platform.claude.com/docs/en/models/overview` |
| SDK typings (`dangerouslyAllowBrowser`, `output_config`, `StopReason`) | `https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.10.0/` |
| SDK 1.9.0 / 1.10.0 changelog | `https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md` |
| `crypto.randomUUID` support + secure context | `https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID` |
| secure-context origin rules | `https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts` |
| vite-plugin-pwa 2.0.0 workbox peers | `https://www.npmjs.com/package/vite-plugin-pwa` |
