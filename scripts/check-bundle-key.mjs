// The fifth CI check: no API key may be in the built artifact (AD-8, AD-19).
//
// The app's key is entered in Settings at runtime and lives in browser storage
// on the user's own device. It has two homes and neither is the bundle, so a
// build that carries one is a leak rather than a convenience — and the only way
// to know is to look at what was actually built.
//
// This runs after `npm run build` and reports every hit, never the matched text:
// printing a key to a CI log would be the same leak with extra steps.
//
// Usage: node scripts/check-bundle-key.mjs [dist]

import { readdirSync, readFileSync, statSync } from 'node:fs';

const PATTERNS = [
  {
    name: 'Anthropic API key',
    // The provider's own prefix, followed by enough key material to be a key
    // rather than the prefix appearing in prose.
    expression: /sk-ant-[A-Za-z0-9_-]{12,}/g,
  },
  {
    name: 'generic secret key',
    expression: /sk-[A-Za-z0-9]{40,}/g,
  },
];

function* walk(directory, prefix) {
  for (const entry of readdirSync(directory).sort()) {
    const absolute = `${directory}/${entry}`;
    const relative = prefix === '' ? entry : `${prefix}/${entry}`;
    if (statSync(absolute).isDirectory()) {
      yield* walk(absolute, relative);
    } else {
      yield { absolute, relative };
    }
  }
}

const target = (process.argv[2] ?? 'dist').replace(/[\\/]+$/, '');

// A missing directory is a failure, not a pass. The check exists to look at the
// artifact; finding nothing because nothing was built is the one way it could
// report success while proving nothing.
let stats;
try {
  stats = statSync(target);
} catch {
  console.error(
    `check-bundle-key: no such directory "${target}". Run \`npm run build\` first — a check that scanned nothing has proved nothing.`,
  );
  process.exit(1);
}
if (!stats.isDirectory()) {
  console.error(`check-bundle-key: "${target}" is not a directory.`);
  process.exit(1);
}

const findings = [];
let filesScanned = 0;
for (const file of walk(target, '')) {
  filesScanned += 1;
  // Read every file as text, binary assets included: a key hidden in a font or
  // an icon is still a key, and a byte sequence that is not valid UTF-8 simply
  // cannot match an ASCII pattern.
  const contents = readFileSync(file.absolute, 'latin1');
  for (const pattern of PATTERNS) {
    for (const match of contents.matchAll(pattern.expression)) {
      const before = contents.slice(0, match.index ?? 0);
      findings.push({
        file: file.relative,
        line: before.split('\n').length,
        pattern: pattern.name,
        length: match[0].length,
      });
    }
  }
}

// An empty directory is the same failure as a missing one, and arrives the
// same way: a build that produced nothing, or a path that points at the wrong
// place. Either way the check scanned no artifact and has proved nothing.
if (filesScanned === 0) {
  console.error(
    `check-bundle-key: "${target}" is empty. Run \`npm run build\` first — a check that scanned nothing has proved nothing.`,
  );
  process.exit(1);
}

if (findings.length > 0) {
  console.error(
    `check-bundle-key: ${findings.length} possible API key${findings.length === 1 ? '' : 's'} in "${target}". The matched text is deliberately not printed.`,
  );
  for (const finding of findings) {
    console.error(
      `  ${finding.file}:${finding.line}  ${finding.pattern}, ${finding.length} characters`,
    );
  }
  console.error(
    '\nThe key has two homes and neither is the bundle (AD-8): Settings at runtime, and .env for the harness alone.',
  );
  process.exit(1);
}

console.log(
  `check-bundle-key: no API key pattern in "${target}" (${filesScanned} file${filesScanned === 1 ? '' : 's'} scanned).`,
);
