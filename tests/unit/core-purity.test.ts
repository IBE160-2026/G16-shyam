import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * AC 5: a banned reference under `src/core/` is a lint failure (AD-1).
 *
 * AC 5 is a statement about the rule, not about a module. `core/localdate.ts`
 * passing proves only that it happens not to reach for anything — it cannot
 * show that the rule would catch it if it did. So the proof runs ESLint, with
 * the repository's real configuration, over two fixtures: one that reaches for
 * every entry on the ban list, and one that is exactly what a pure core module
 * looks like. Both directions, because a rule that errored on everything would
 * also pass a test that only looked for errors.
 *
 * Two mechanics matter. ESLint needs an **absolute path** for the fixture to
 * match the `src/core/**` override at all. And `ignore: false` lifts the one
 * config entry that keeps `eslint .` from reporting these files in the normal
 * lint run — the fixtures are meant to fail, so the everyday lint must not see
 * them while this test must.
 */

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const BANNED_FIXTURE = fileURLToPath(
  new URL('../../src/core/__fixtures__/banned.ts', import.meta.url),
);
const PURE_FIXTURE = fileURLToPath(new URL('../../src/core/__fixtures__/pure.ts', import.meta.url));

/** The four rules that carry AD-1's ban list between them. */
const BAN_RULES = new Set([
  'no-restricted-globals',
  'no-restricted-properties',
  'no-restricted-imports',
  'no-restricted-syntax',
]);

/**
 * Everything AD-1 names, plus what each of those bans is worthless without:
 * the global-object roots that reach the same capability under another name,
 * the rest of the browser's ambient surface, the deep relative import a
 * one-level pattern never sees, and React's other entry points.
 */
const BAN_LIST = [
  'window',
  'document',
  'localStorage',
  'window.localStorage',
  'fetch',
  'process',
  'navigator',
  'performance',
  'crypto',
  'Intl',
  'Math.random',
  'import.meta',
  'Date.now',
  'new Date',
  'react',
  'react-dom/client',
  'react/jsx-dev-runtime',
  'deep layer import',
  'globalThis',
  'self',
  'sessionStorage',
  'indexedDB',
  'caches',
  'location',
  'history',
  'XMLHttpRequest',
  'WebSocket',
  'requestAnimationFrame',
];

interface BanMessage {
  line: number;
  ruleId: string;
}

async function lintFixture(absolutePath: string): Promise<BanMessage[]> {
  const eslint = new ESLint({ cwd: REPOSITORY_ROOT, ignore: false, warnIgnored: false });
  const results = await eslint.lintFiles([absolutePath]);
  return results
    .flatMap((result) => result.messages)
    .filter((message) => message.ruleId !== null && BAN_RULES.has(message.ruleId))
    .map((message) => ({ line: message.line, ruleId: message.ruleId! }));
}

/** Maps each `// ban: <name>` marker in the fixture to its line number. */
function markersIn(absolutePath: string): Map<number, string> {
  const markers = new Map<number, string>();
  readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      const marker = /\/\/ ban: (.+)$/.exec(line);
      if (marker !== null) markers.set(index + 1, marker[1]!.trim());
    });
  return markers;
}

const markers = markersIn(BANNED_FIXTURE);
const bannedMessages = await lintFixture(BANNED_FIXTURE);
const pureMessages = await lintFixture(PURE_FIXTURE);
const flaggedLines = new Set(bannedMessages.map((message) => message.line));

describe('src/core/ purity, as a lint failure', () => {
  it('has a fixture line for every entry on the ban list', () => {
    // If this fails, the ban list grew and the fixture did not — which would
    // make every assertion below pass while covering less than it claims.
    expect([...markers.values()].sort()).toEqual([...BAN_LIST].sort());
  });

  it.each([...markers].map(([line, name]) => ({ line, name })))(
    'reports an error on the line that reads $name',
    ({ line, name }) => {
      const onThisLine = bannedMessages.filter((message) => message.line === line);
      expect(onThisLine, `nothing reported for ${name} on line ${String(line)}`).not.toHaveLength(
        0,
      );
    },
  );

  it('reports nothing on a line that was not meant to fail', () => {
    const unexpected = [...flaggedLines].filter((line) => !markers.has(line));
    expect(unexpected).toEqual([]);
  });

  it('passes a pure module', () => {
    // A local binding named `window`, calendar arithmetic on a supplied value
    // and `Math.min` are all fine: the ban is on reaching the runtime, not on
    // the words.
    expect(pureMessages).toEqual([]);
  });

  it('uses all four rules to cover the list', () => {
    expect(new Set(bannedMessages.map((message) => message.ruleId))).toEqual(BAN_RULES);
  });
});
