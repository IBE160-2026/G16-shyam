import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The design system is declared once, completely, and with DESIGN.md's own
 * values (AC 3, AD-18, UX-DR1).
 *
 * Counting is not enough. A file with all 43 names and `--color-ink` set to
 * black would satisfy every count here and still be a different product, so
 * each value is compared against the frontmatter it was supposed to be lifted
 * from. The count still matters for its own reason: four of the 43 are ranges
 * declared as `-min` / `-max` pairs, where **a pair counts as one token**, so a
 * naive count reads 47 and calls the system complete while a token is missing.
 */

const THEME_PATH = new URL('../../src/ui/theme.css', import.meta.url);

/** The token source of truth. Where it and this file disagree, it wins. */
const DESIGN_PATH = new URL(
  '../../.docs/planning-artifacts/ux-designs/ux-To-Do-List-2026-11-16/DESIGN.md',
  import.meta.url,
);

/** Every `@theme` block, with its modifiers — not just the first one. */
const THEME_BLOCK = /@theme\b([^{]*)\{([^}]*)\}/g;

const DECLARATION = /^[ \t]*(--[a-zA-Z0-9-]+)[ \t]*:[ \t]*([^;]+);/gm;

/** The four ranges. A pair is one token. */
const EXPECTED_PAIRS = [
  '--tracking-apparatus',
  '--spacing-group-gap',
  '--spacing-field-height',
  '--spacing-button-height',
];

type Category = 'colour' | 'typography' | 'radius' | 'spacing';

/**
 * Closed, in both directions: a name that matches no prefix has no category,
 * and the suite says so rather than filing it under typography by default.
 */
const CATEGORY_PREFIXES: [string, Category][] = [
  ['--color-', 'colour'],
  ['--radius-', 'radius'],
  ['--spacing-', 'spacing'],
  ['--font-family-', 'typography'],
  ['--font-weight-', 'typography'],
  ['--text-', 'typography'],
  ['--tracking-', 'typography'],
  ['--numerals', 'typography'],
];

function categoryOf(name: string): Category | null {
  return CATEGORY_PREFIXES.find(([prefix]) => name.startsWith(prefix))?.[1] ?? null;
}

/** Strips a trailing `-min` / `-max`, which is what collapses a pair to one. */
function tokenNameOf(declaration: string): string {
  return declaration.replace(/-(?:min|max)$/, '');
}

/**
 * DESIGN.md's frontmatter keys, mapped to the token names they are declared
 * under. Colours, radii and spacings take their key straight; typography does
 * not, because Tailwind resolves a bare `font-apparatus` candidate against
 * `--font-weight-*` before `--font-*`, so the family and the weight would
 * otherwise collide on one class name.
 */
const TYPOGRAPHY_NAMES: Record<string, string> = {
  apparatus: '--font-family-apparatus',
  body: '--font-family-body',
  'apparatus-weight': '--font-weight-apparatus',
  'body-weight': '--font-weight-body',
  'body-weight-strong': '--font-weight-body-strong',
  numerals: '--numerals',
  'scale-display': '--text-display',
  'scale-title': '--text-title',
  'scale-body': '--text-body',
  'scale-value': '--text-value',
  'scale-apparatus': '--text-apparatus',
  'scale-micro': '--text-micro',
  'apparatus-tracking-min': '--tracking-apparatus-min',
  'apparatus-tracking-max': '--tracking-apparatus-max',
};

/** Reads the `key: value` pairs under one top-level frontmatter section. */
function frontmatterSection(markdown: string, section: string): Record<string, string> {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1] ?? '';
  const pairs: Record<string, string> = {};
  let inside = false;
  for (const line of frontmatter.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inside = line.trimEnd() === `${section}:`;
      continue;
    }
    if (!inside) continue;
    const pair = /^ {2}([A-Za-z0-9-]+):\s*(.*)$/.exec(line);
    if (pair === null) continue;
    pairs[pair[1]!] = pair[2]!.trim().replace(/^"(.*)"$/, '$1');
  }
  return pairs;
}

const design = readFileSync(DESIGN_PATH, 'utf8');

/** Every declaration the theme must carry, with the value it must carry. */
const EXPECTED_VALUES: Record<string, string> = {};
for (const [key, value] of Object.entries(frontmatterSection(design, 'colors'))) {
  EXPECTED_VALUES[`--color-${key}`] = value;
}
for (const [key, value] of Object.entries(frontmatterSection(design, 'rounded'))) {
  EXPECTED_VALUES[`--radius-${key}`] = value;
}
for (const [key, value] of Object.entries(frontmatterSection(design, 'spacing'))) {
  EXPECTED_VALUES[`--spacing-${key}`] = value;
}
for (const [key, value] of Object.entries(frontmatterSection(design, 'typography'))) {
  const name = TYPOGRAPHY_NAMES[key];
  if (name !== undefined) EXPECTED_VALUES[name] = value;
}

const css = readFileSync(THEME_PATH, 'utf8');
const blocks = [...css.matchAll(THEME_BLOCK)];

const declared: Record<string, string> = {};
const declarations: string[] = [];
for (const block of blocks) {
  for (const match of block[2]!.matchAll(DECLARATION)) {
    declarations.push(match[1]!);
    declared[match[1]!] = match[2]!.trim();
  }
}

const tokens = new Set(declarations.map(tokenNameOf));

function tokensIn(category: Category): string[] {
  return [...tokens].filter((name) => categoryOf(name) === category);
}

describe('src/ui/theme.css', () => {
  it('declares its tokens inside Tailwind v4 @theme blocks', () => {
    expect(blocks.length, 'no @theme block found').toBeGreaterThan(0);
    for (const block of blocks) {
      // `static` keeps every variable in the built stylesheet even where no
      // utility consumes it yet, so AC 3 holds of the artifact as well.
      expect(block[1]!.trim()).toBe('static');
    }
  });

  it('declares exactly 43 tokens', () => {
    expect(tokens.size).toBe(43);
  });

  it('breaks down 16 colour, 13 typography, 3 radius, 11 spacing', () => {
    expect({
      colour: tokensIn('colour').length,
      typography: tokensIn('typography').length,
      radius: tokensIn('radius').length,
      spacing: tokensIn('spacing').length,
    }).toEqual({ colour: 16, typography: 13, radius: 3, spacing: 11 });
  });

  it('files every token under a known category', () => {
    // Without this, a misspelled or invented prefix lands in whichever
    // category the classifier falls back to and the breakdown above still
    // adds up.
    const unknown = [...tokens].filter((name) => categoryOf(name) === null);
    expect(unknown).toEqual([]);
  });

  it('counts each of the four -min / -max pairs once', () => {
    const paired = declarations.filter((name) => /-(?:min|max)$/.test(name));
    // 47 declarations, 43 tokens: the difference is exactly the four pairs.
    expect(declarations).toHaveLength(47);
    expect(paired).toHaveLength(8);

    for (const pair of EXPECTED_PAIRS) {
      expect(declarations, `${pair}-min is missing`).toContain(`${pair}-min`);
      expect(declarations, `${pair}-max is missing`).toContain(`${pair}-max`);
      expect(tokens, `${pair} should collapse to one token`).toContain(pair);
    }
    // And only those four: the `-min` / `-max` strip is applied to every name,
    // so an unrelated token ending that way would silently merge into another.
    expect([...new Set(paired.map(tokenNameOf))].sort()).toEqual([...EXPECTED_PAIRS].sort());
  });

  it('declares every token exactly once, with a value', () => {
    expect(new Set(declarations).size).toBe(declarations.length);
    expect(Object.entries(declared).filter(([, value]) => value === '')).toEqual([]);
  });

  it("carries DESIGN.md's values verbatim, every one of them", () => {
    // The assertion the counts cannot make. DESIGN.md's frontmatter is the
    // token source of truth; this file is supposed to be a transcription of it
    // into Tailwind's namespaces, and nothing else.
    expect(Object.keys(EXPECTED_VALUES)).toHaveLength(47);
    expect(declared).toEqual(EXPECTED_VALUES);
  });

  it('is the only file in the design system that spells a colour out', () => {
    // The hex scanner is the enforcer (scripts/check-hex.mjs, inside
    // `npm run lint`); this asserts the premise it rests on — that the colours
    // really are all here.
    const colours = tokensIn('colour');
    expect(colours).toHaveLength(16);
    expect(colours).toContain('--color-proposed');
  });
});
