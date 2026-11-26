import type { Ids } from '../ports/id';

/**
 * The only file in the application that generates an identifier (AD-1, AD-11).
 *
 * `crypto.randomUUID()` where it exists, which is any secure context — HTTPS,
 * or `localhost`. It does **not** exist outside one, and AD-11 says so
 * explicitly: a plain-HTTP LAN address is not a secure context, so a phone
 * pointed at `http://192.168.x.x:5173` would otherwise create Tasks by throwing
 * a `TypeError` into a surface with no error state. The fallback is documented
 * rather than clever, and it is reached only there.
 *
 * The fallback's randomness is **not** a security property and nothing in this
 * product treats it as one. A Task id is an opaque handle inside one browser's
 * own storage: it is never a secret, never a capability, never sent anywhere.
 * What it has to be is unique within one document, which 122 bits of
 * `getRandomValues` entropy — or, failing even that, `Math.random` — gives with
 * room to spare for a list a person typed by hand.
 */

const HEX = '0123456789abcdef';

function hex(byte: number): string {
  // Two digits, always: `toString(16)` drops the leading zero and would make
  // the id the wrong length for a byte under 16.
  return `${HEX[(byte >> 4) & 0x0f] ?? '0'}${HEX[byte & 0x0f] ?? '0'}`;
}

/** 16 bytes, shaped as a version-4 UUID. */
function uuidFrom(bytes: Uint8Array): string {
  const octets = Array.from(bytes, (byte) => byte & 0xff);
  // Version 4 in the high nibble of byte 6, variant 10 in the top bits of
  // byte 8 — so the fallback's output is indistinguishable in shape from
  // `randomUUID`'s and no consumer can come to depend on telling them apart.
  octets[6] = ((octets[6] ?? 0) & 0x0f) | 0x40;
  octets[8] = ((octets[8] ?? 0) & 0x3f) | 0x80;

  const digits = octets.map((byte) => hex(byte));
  const group = (from: number, to: number): string => digits.slice(from, to).join('');
  return [group(0, 4), group(4, 6), group(6, 8), group(8, 10), group(10, 16)].join('-');
}

/**
 * The Web Crypto surface this adapter uses, as something that may not be there.
 *
 * Declared rather than taken from the DOM types on purpose: the ambient
 * declaration says `crypto.randomUUID` always exists, which is the claim AD-11
 * says is false outside a secure context, and a non-nullable type cannot be
 * tested against `undefined`.
 */
function webCrypto(): {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
} | undefined {
  return (
    globalThis as {
      crypto?: {
        randomUUID?: () => string;
        getRandomValues?: (array: Uint8Array) => Uint8Array;
      };
    }
  ).crypto;
}

function randomBytes(): Uint8Array {
  const bytes = new Uint8Array(16);
  const available = webCrypto();
  if (available?.getRandomValues !== undefined) {
    try {
      return available.getRandomValues(bytes);
    } catch {
      // Present and refusing. Fall through rather than propagate — see below.
    }
  }
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * The browser's Id adapter. Constructed only in `src/main.tsx`.
 *
 * Both crypto calls are guarded for a **throw** as well as for absence. A
 * hardened or instrumented context can expose `randomUUID` and then refuse it,
 * and the only caller on this path is capture — the one surface in the product
 * that is forbidden an error state (UX-DR22). An exception escaping here would
 * surface as the recovery panel on the user's first typed sentence. Falling
 * through to the local generator costs nothing that matters: a Task id is an
 * opaque handle inside one browser's own storage, never a secret.
 */
export const webIds: Ids = {
  newId(): string {
    const available = webCrypto();
    if (available?.randomUUID !== undefined) {
      try {
        return available.randomUUID();
      } catch {
        // Fall through to the documented non-crypto generator.
      }
    }
    return uuidFrom(randomBytes());
  },
};
