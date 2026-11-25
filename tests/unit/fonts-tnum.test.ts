import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/**
 * `tnum` survives in the committed `woff2`, proven from the file (AC 3, AD-11).
 *
 * This cannot be checked from CSS. `font-variant-numeric: tabular-nums`
 * computes as set even when the font no longer carries the feature, so CSS
 * cannot witness its own failure here — a computed-style assertion would pass
 * on a font whose tabular figures had been stripped. Subsetters also leave
 * `tnum` out of their default layout-feature set, so this is a live risk every
 * time the subsets are regenerated, not a theoretical one.
 *
 * So the proof is the `GSUB` FeatureList of the shipped bytes: decompress the
 * `woff2`, walk its table directory to `GSUB`, and read the feature tags out.
 */

const FONTS = ['archivo-400.woff2', 'archivo-600.woff2', 'barlow-condensed-700.woff2'];

/**
 * WOFF2's known-table index (W3C WOFF2 §5.2, "Table Directory Format"). A flags
 * byte carries this index in its low six bits, so a tag is normally one byte
 * rather than four. Index 63 means an arbitrary 4-byte tag follows instead.
 */
const KNOWN_TABLE_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post',
  'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
  'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
  'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

/** Signature of a WOFF2 file: the ASCII bytes `wOF2`. */
const WOFF2_SIGNATURE = 0x774f4632;

/** Fixed WOFF2 header length, after which the table directory begins. */
const WOFF2_HEADER_LENGTH = 48;

class ByteReader {
  // Written out rather than declared as constructor parameters: the toolchain
  // runs with `erasableSyntaxOnly`, so TypeScript may only add types, never
  // emit runtime behaviour of its own.
  private readonly bytes: Uint8Array;
  private offset: number;

  constructor(bytes: Uint8Array, offset: number) {
    this.bytes = bytes;
    this.offset = offset;
  }

  get position(): number {
    return this.offset;
  }

  uint8(): number {
    const value = this.bytes[this.offset];
    if (value === undefined) throw new Error('woff2: read past end of file');
    this.offset += 1;
    return value;
  }

  /** WOFF2's variable-width integer: seven bits a byte, high bit continues. */
  uintBase128(): number {
    let value = 0;
    for (let index = 0; index < 5; index += 1) {
      const byte = this.uint8();
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error('woff2: UIntBase128 longer than five bytes');
  }
}

function uint16At(bytes: Uint8Array, offset: number): number {
  const high = bytes[offset];
  const low = bytes[offset + 1];
  if (high === undefined || low === undefined) throw new Error('font: read past end of table');
  return high * 256 + low;
}

function uint32At(bytes: Uint8Array, offset: number): number {
  return uint16At(bytes, offset) * 65536 + uint16At(bytes, offset + 2);
}

function tagAt(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

/**
 * Extracts one SFNT table from a WOFF2 file.
 *
 * The compressed block holds every table's data concatenated in directory
 * order, so reaching `GSUB` means reading the whole directory: each entry's
 * stored length is its transformed length when it was transformed and its
 * original length otherwise. Only `glyf`, `loca` and `hmtx` are ever
 * transformed, and `GSUB` never is, so its bytes come out intact.
 */
function readSfntTable(file: Uint8Array, wanted: string): Uint8Array | null {
  if (uint32At(file, 0) !== WOFF2_SIGNATURE) throw new Error('not a woff2 file');

  const numTables = uint16At(file, 12);
  const totalCompressedSize = uint32At(file, 20);

  const reader = new ByteReader(file, WOFF2_HEADER_LENGTH);
  const entries: { tag: string; length: number }[] = [];

  for (let index = 0; index < numTables; index += 1) {
    const flags = reader.uint8();
    const knownIndex = flags & 0x3f;
    const transformVersion = (flags >> 6) & 0x03;
    const tag = knownIndex === 63 ? tagAt(file, reader.position) : KNOWN_TABLE_TAGS[knownIndex]!;
    if (knownIndex === 63) for (let skip = 0; skip < 4; skip += 1) reader.uint8();

    const originalLength = reader.uintBase128();
    const transformed =
      tag === 'glyf' || tag === 'loca' ? transformVersion === 0 : transformVersion !== 0;
    const length = transformed ? reader.uintBase128() : originalLength;
    entries.push({ tag, length });
  }

  const compressedStart = reader.position;
  const decompressed = brotliDecompressSync(
    file.subarray(compressedStart, compressedStart + totalCompressedSize),
  );

  let cursor = 0;
  for (const entry of entries) {
    if (entry.tag === wanted) return decompressed.subarray(cursor, cursor + entry.length);
    cursor += entry.length;
  }
  return null;
}

/** The feature tags in a `GSUB` table's FeatureList (OpenType §5.2). */
function featureTagsOf(gsub: Uint8Array): string[] {
  const featureListOffset = uint16At(gsub, 6);
  const featureCount = uint16At(gsub, featureListOffset);
  const tags: string[] = [];
  for (let index = 0; index < featureCount; index += 1) {
    // Each FeatureRecord is a 4-byte tag plus a 2-byte offset.
    tags.push(tagAt(gsub, featureListOffset + 2 + index * 6));
  }
  return tags;
}

describe.each(FONTS)('src/fonts/%s', (name) => {
  const bytes = new Uint8Array(readFileSync(new URL(`../../src/fonts/${name}`, import.meta.url)));

  it('is a woff2 file', () => {
    expect(uint32At(bytes, 0)).toBe(WOFF2_SIGNATURE);
  });

  it('carries tnum in its GSUB FeatureList', () => {
    const gsub = readSfntTable(bytes, 'GSUB');
    expect(gsub, 'no GSUB table — every layout feature was dropped').not.toBeNull();
    expect(featureTagsOf(gsub!)).toContain('tnum');
  });
});
