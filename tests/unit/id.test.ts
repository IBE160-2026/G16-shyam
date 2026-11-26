import { afterEach, describe, expect, it, vi } from 'vitest';
import { webIds } from '../../src/adapters/id';

/**
 * The one identifier-generating file in the shipped app, driven down every
 * path (AD-11).
 *
 * The reason this needs a test of its own is the same reason `system-clock.ts`
 * does: the production path is the one the gate exercises, and it is the one
 * that cannot be wrong. Playwright drives `localhost`, which **is** a secure
 * context, so `crypto.randomUUID()` always answers there and the hand-rolled
 * fallback below it is never executed by any other check in this repository.
 * That fallback is precisely AD-11's case — a phone pointed at a plain-HTTP
 * LAN address — so it would reach a user having never once run.
 *
 * The global is therefore stubbed rather than reached for, in three shapes: the
 * secure context, the non-secure one that still has `getRandomValues`, and the
 * bare one that has neither.
 */

/** 8-4-4-4-12 hexadecimal, version 4, variant 10xx. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * `getRandomValues`, as a counter — so "distinct" is a claim about the code
 * rather than about luck.
 *
 * The call number goes into byte 0, which the generator never rewrites: bytes
 * 6 and 8 carry the version and variant and would mask a counter hidden there.
 */
function countingRandomValues(): (array: Uint8Array) => Uint8Array {
  let call = 0;
  return (array: Uint8Array) => {
    call += 1;
    for (let index = 0; index < array.length; index += 1) {
      array[index] = (call + index * 7) & 0xff;
    }
    return array;
  };
}

describe('webIds.newId()', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses crypto.randomUUID when the context is a secure one', () => {
    const randomUUID = vi.fn(() => '11111111-2222-4333-8444-555555555555');
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: countingRandomValues() });

    expect(webIds.newId()).toBe('11111111-2222-4333-8444-555555555555');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  describe('outside a secure context, where randomUUID does not exist', () => {
    it('builds a well-shaped version-4 id from getRandomValues', () => {
      vi.stubGlobal('crypto', { getRandomValues: countingRandomValues() });

      const id = webIds.newId();
      expect(id).toMatch(UUID_V4);
      // Stated separately from the pattern, because these two are the bits the
      // generator sets by hand and the pattern would pass by accident if the
      // source bytes happened to carry them.
      expect(id[14], 'the version nibble').toBe('4');
      expect('89ab', `the variant nibble was ${String(id[19])}`).toContain(id[19]);
      expect(id).toHaveLength(36);
    });

    it('zero-pads a byte below sixteen rather than shortening the id', () => {
      // `toString(16)` drops the leading zero, which would make the id 35
      // characters and the groups misaligned — and would still look like a
      // UUID at a glance.
      vi.stubGlobal('crypto', {
        getRandomValues: (array: Uint8Array) => array.fill(0),
      });

      const id = webIds.newId();
      expect(id).toHaveLength(36);
      expect(id).toBe('00000000-0000-4000-8000-000000000000');
    });

    it('answers differently every call', () => {
      vi.stubGlobal('crypto', { getRandomValues: countingRandomValues() });

      const ids = new Set(Array.from({ length: 200 }, () => webIds.newId()));
      expect(ids.size).toBe(200);
    });
  });

  describe('with no Web Crypto at all', () => {
    it('still yields distinct, well-shaped ids from the local generator', () => {
      vi.stubGlobal('crypto', undefined);

      const ids = Array.from({ length: 500 }, () => webIds.newId());
      for (const id of ids) {
        expect(id, `${id} is not a version-4 id`).toMatch(UUID_V4);
      }
      // 122 bits of `Math.random`, against a list a person typed by hand. A
      // collision here is not a security failure — it is a Task that cannot be
      // addressed, which is why uniqueness is the property asserted and
      // unpredictability is not.
      expect(new Set(ids).size).toBe(500);
    });

    it('is reached when the object exists but carries neither function', () => {
      vi.stubGlobal('crypto', {});
      expect(webIds.newId()).toMatch(UUID_V4);
    });
  });

  describe('when a hardened context refuses', () => {
    it('falls through a throwing randomUUID instead of reaching capture', () => {
      // Capture is the one surface in the product forbidden an error state
      // (UX-DR22). An exception escaping here would show the recovery panel on
      // the user's first typed sentence.
      vi.stubGlobal('crypto', {
        randomUUID: () => {
          throw new Error('blocked by policy');
        },
        getRandomValues: countingRandomValues(),
      });

      expect(() => webIds.newId()).not.toThrow();
      expect(webIds.newId()).toMatch(UUID_V4);
    });

    it('falls through a throwing getRandomValues as well', () => {
      vi.stubGlobal('crypto', {
        getRandomValues: () => {
          throw new Error('blocked by policy');
        },
      });

      expect(() => webIds.newId()).not.toThrow();
      expect(webIds.newId()).toMatch(UUID_V4);
    });
  });
});
