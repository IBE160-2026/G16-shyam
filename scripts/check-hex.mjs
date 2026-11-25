// A raw hex colour outside src/ui/theme.css fails the build (AD-18, UX-DR1).
//
// This is the mechanical guard on the palette's central promise: `proposed`
// purple means a proposal awaiting the user and nothing else, anywhere. A
// promise like that cannot rest on memory, and the locked world erodes one
// hard-coded colour at a time.
//
// ESLint cannot be the enforcer here — it does not parse `.css` without a
// language plugin, and adding one would widen the lint chain AD-13 and AD-19
// pin. So this is plain Node with no dependency at all, and it runs *inside*
// `npm run lint` (`eslint . && node scripts/check-hex.mjs`), which keeps Story
// 1.1 AC 4's five named CI checks at five.
//
// Usage: node scripts/check-hex.mjs [root]   (root defaults to the repository)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The one file allowed to spell a colour out, named relative to the scan root.
 *
 * It is resolved against that root rather than string-compared, because the
 * exemption is for *this* file and not for the name: a `theme.css` anywhere
 * else is a second place colours live, which is the thing AD-18 forbids. A
 * root-relative string compare also made the exemption silently stop applying
 * whenever the scanner was pointed anywhere but the repository root, which
 * reported the token file itself as sixteen violations.
 */
const TOKEN_FILE = 'src/ui/theme.css';

/** Source kinds a colour could hide in. Binary assets are never read. */
const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.html',
  '.svg',
  '.json',
  '.webmanifest',
  '.yml',
  '.yaml',
]);

/**
 * Directories that are not this repository's source. `.docs/` is the planning
 * artifacts — DESIGN.md is *supposed* to carry every value, and the mockups are
 * drawn in literal ink. `.logs/` is the session journal. Neither ships.
 */
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.claude',
  '.docs',
  '.impeccable',
  '.logs',
  '.vscode',
  '_bmad',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

/**
 * `#` plus 3, 4, 6 or 8 hex digits and no further hex digit. The lengths are
 * exactly CSS's four hex notations, which keeps an id selector or a URL
 * fragment from reading as a colour.
 */
const HEX_COLOUR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;

function extensionOf(name) {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

function* walk(directory, prefix) {
  for (const entry of readdirSync(directory).sort()) {
    const absolute = `${directory}/${entry}`;
    const relative = prefix === '' ? entry : `${prefix}/${entry}`;
    if (statSync(absolute).isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry)) continue;
      yield* walk(absolute, relative);
    } else if (SCANNED_EXTENSIONS.has(extensionOf(entry))) {
      yield { absolute, relative };
    }
  }
}

function findingsIn(file) {
  const findings = [];
  const lines = readFileSync(file.absolute, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    // Every hit is reported, not just the first one in the file or the line:
    // a scanner that stops early turns one commit's cleanup into several.
    for (const match of line.matchAll(HEX_COLOUR)) {
      findings.push({
        file: file.relative,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        value: match[0],
      });
    }
  });
  return findings;
}

const root = (process.argv[2] ?? '.').replace(/[\\/]+$/, '');
const exemptFile = resolve(root, TOKEN_FILE);
const findings = [];
for (const file of walk(root, '')) {
  if (resolve(file.absolute) === exemptFile) continue;
  findings.push(...findingsIn(file));
}

if (findings.length > 0) {
  console.error(
    `check-hex: ${findings.length} raw hex colour${findings.length === 1 ? '' : 's'} outside ${TOKEN_FILE}.`,
  );
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}:${finding.column}  ${finding.value}`);
  }
  console.error(
    `\nDeclare the colour as a token in ${TOKEN_FILE} and use it from there (AD-18, UX-DR1).`,
  );
  process.exit(1);
}

console.log(`check-hex: no raw hex colour outside ${TOKEN_FILE}.`);
