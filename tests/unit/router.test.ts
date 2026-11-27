import { describe, expect, it } from 'vitest';
import { TODAY_ROUTE, formatRoute, parseRoute, type Route } from '../../src/app/router';

/**
 * The hash router's pure half (AC 4, AD-16).
 *
 * `parseRoute` and `formatRoute` are total functions over strings, so every
 * address the product can be handed is provable here with no DOM — the unit
 * suite runs on `environment: 'node'`. What is *not* here is the subscription:
 * `useRoute` reads `window.location` and listens for `hashchange`, and only a
 * real browser can show that Back returns a reader to Today. That half is
 * `tests/e2e/task-detail.spec.ts`.
 *
 * The property every assertion below circles is the one AD-16 actually fixes:
 * **nothing is ever a navigation error**. A hash the parser cannot read is
 * Today, because a wrong address is not a failure the user needs reporting
 * (UX-DR21) — and because a route parse that could throw would take the whole
 * document through the error boundary on a mistyped link.
 */

const TASK_ID = '0b9c1d2e-3f40-4a51-8b62-7c83d94e05f6';

describe('formatRoute', () => {
  it('writes the two route literals the product uses', () => {
    expect(formatRoute(TODAY_ROUTE)).toBe('#/today');
    expect(formatRoute({ kind: 'task', id: TASK_ID })).toBe(`#/task/${TASK_ID}`);
  });

  it('writes a hash no hex scanner can mistake for a colour', () => {
    // `scripts/check-hex.mjs` fails a bare `#` followed by 3, 4, 6 or 8 hex
    // digits anywhere outside theme.css. Both literals start `#/`, so the
    // product's own route spelling can never trip its own lint gate.
    for (const route of [TODAY_ROUTE, { kind: 'task', id: 'abc123' } as const]) {
      expect(formatRoute(route)).toMatch(/^#\//);
    }
  });

  it('percent-encodes an id, so an id cannot forge a route', () => {
    // An id is opaque data from a port. Today it is hex and dashes from
    // `crypto.randomUUID()`, but a `/` or a `#` in one would otherwise produce
    // a link that parsed back as a different route — or as no route at all.
    expect(formatRoute({ kind: 'task', id: 'a/b' })).toBe('#/task/a%2Fb');
    expect(formatRoute({ kind: 'task', id: 'a#b' })).toBe('#/task/a%23b');
    expect(formatRoute({ kind: 'task', id: 'a b' })).toBe('#/task/a%20b');
  });
});

describe('parseRoute', () => {
  it('reads the canonical Today hash', () => {
    expect(parseRoute('#/today')).toEqual(TODAY_ROUTE);
  });

  it('reads a task hash and its id', () => {
    expect(parseRoute(`#/task/${TASK_ID}`)).toEqual({ kind: 'task', id: TASK_ID });
  });

  it('reads an absent hash as Today', () => {
    // A cold open, with nothing in the address bar.
    expect(parseRoute('')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#/')).toEqual(TODAY_ROUTE);
  });

  it('reads an unknown hash as Today, without complaint', () => {
    // A link from a later version of the app, a truncated paste, a hand-typed
    // guess. There is no "route not found" surface in this product, and this is
    // where that decision lives.
    expect(parseRoute('#/nonsense')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#/archive')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#/settings/advanced')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#today')).toEqual(TODAY_ROUTE);
    expect(parseRoute('/today')).toEqual(TODAY_ROUTE);
  });

  it('reads a task hash with no id as Today', () => {
    // A task route carries an id by definition, so an empty one is not a task
    // route with a part missing — it is not a task route.
    expect(parseRoute('#/task/')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#/task')).toEqual(TODAY_ROUTE);
  });

  it('decodes an encoded id back to itself', () => {
    expect(parseRoute('#/task/a%2Fb')).toEqual({ kind: 'task', id: 'a/b' });
    expect(parseRoute('#/task/a%20b')).toEqual({ kind: 'task', id: 'a b' });
  });

  it('keeps a malformed escape as text rather than raising', () => {
    // `decodeURIComponent('%')` throws, and a hand-edited address bar is
    // exactly where a lone `%` comes from. No Task will carry this id, so the
    // surface lands on Today by the unknown-id path — but it lands there
    // instead of taking the document down.
    expect(() => parseRoute('#/task/%')).not.toThrow();
    expect(parseRoute('#/task/%')).toEqual({ kind: 'task', id: '%' });
    expect(parseRoute('#/task/%zz')).toEqual({ kind: 'task', id: '%zz' });
  });

  it('never throws, on anything', () => {
    const hostile = [
      '',
      '#',
      '#/',
      '#//',
      '#/task',
      '#/task/',
      '#/task//',
      '#/task/%E0%A4%A',
      '#/TASK/abc',
      '#/today/extra',
      '#'.repeat(500),
      `#/task/${'x'.repeat(5000)}`,
      '#/task/<script>',
      ' ',
    ];
    for (const hash of hostile) {
      expect(() => parseRoute(hash), hash).not.toThrow();
    }
  });

  it('is case-sensitive, so only the spelling the app writes is a route', () => {
    // `#/TASK/abc` is not a task route. The app never writes it, and guessing
    // that it meant one would mean guessing at every other casing too.
    expect(parseRoute('#/TASK/abc')).toEqual(TODAY_ROUTE);
    expect(parseRoute('#/Today')).toEqual(TODAY_ROUTE);
  });
});

describe('parse and format', () => {
  it('round-trip every route the product can be in', () => {
    const routes: readonly Route[] = [
      TODAY_ROUTE,
      { kind: 'task', id: TASK_ID },
      { kind: 'task', id: 'a/b' },
      { kind: 'task', id: 'a b' },
      { kind: 'task', id: 'æøå' },
    ];
    for (const route of routes) {
      expect(parseRoute(formatRoute(route)), formatRoute(route)).toEqual(route);
    }
  });
});
