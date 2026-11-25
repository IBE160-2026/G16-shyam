import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The install gate and the two repository scanners, as standing checks.
 *
 * Three of this story's rules were otherwise only ever confirmed by hand: the
 * pinned versions, the `.npmrc` that turns the engines range from a warning
 * into a failed install, and the two plain-Node scanners that AC 4 and AC 6
 * rest on. A scanner nobody tests is a scanner that silently stops reporting —
 * the exact failure mode AD-19 exists to prevent one level up.
 *
 * The unsupported-Node row of the spec's matrix cannot be run from inside a
 * single Node process, so what is asserted here is the *mechanism*: the range
 * is declared verbatim and `engine-strict` is committed beside it. The install
 * failing on Node 23 or 25 follows from npm's own behaviour.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), 'utf8');
}

interface PackageManifest {
  engines: { node: string };
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

const manifest = JSON.parse(read('package.json')) as PackageManifest;
const pinned = { ...manifest.dependencies, ...manifest.devDependencies };

/** The spine's Stack table, all 18 rows. */
const STACK = {
  typescript: '6.0.3',
  vite: '8.3.8',
  '@vitejs/plugin-react': '6.3.0',
  react: '19.3.1',
  'react-dom': '19.3.1',
  '@tailwindcss/vite': '4.3.5',
  tailwindcss: '4.3.5',
  zod: '4.6.7',
  '@anthropic-ai/sdk': '1.10.0',
  'vite-plugin-pwa': '2.0.0',
  'workbox-build': '7.4.1',
  'workbox-window': '7.4.1',
  vitest: '5.1.1',
  '@playwright/test': '1.65.1',
  '@axe-core/playwright': '4.14.0',
  eslint: '10.15.0',
  'typescript-eslint': '8.73.0',
  tsx: '4.23.15',
};

/** Runs a scanner and reports what a CI job would see. */
function runScanner(script: string, argument: string): { status: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [join(ROOT, 'scripts', script), argument], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? -1,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
    };
  }
}

describe('the install gate', () => {
  it('declares the supported Node range verbatim', () => {
    // 22.13 is the floor because eslint@10.15.0 requires ^22.13.0; majors 23
    // and 25 are out because Vitest excludes odd majors. The range is the
    // intersection of all 18 pins, and it is stated once.
    expect(manifest.engines.node).toBe('^22.13.0 || ^24.0.0 || >=26.0.0');
  });

  it('commits the npm config that makes the range a failure, not a warning', () => {
    // `engines` alone does not enforce anything: npm treats a mismatch as the
    // warning EBADENGINE and installs anyway. CI needs no setting of its own
    // because this file is committed.
    expect(read('.npmrc')).toMatch(/^engine-strict=true$/m);
  });

  it('recommends one Node major, stated once', () => {
    // So a grader using nvm lands inside the range rather than on its edge, and
    // actions/setup-node reads the same file (AD-19).
    expect(read('.nvmrc').trim()).toBe('26');
  });

  it('pins all 18 stack versions exactly, with no range', () => {
    for (const [name, version] of Object.entries(STACK)) {
      expect(pinned[name], `${name} is not in package.json`).toBe(version);
    }
    // A caret would float `typescript` past AD-13's pin and silently void the
    // lint chain, which is why `npm ci` runs against an exact lockfile. Every
    // dependency is an exact version, not only the eighteen named above.
    const ranged = Object.entries(pinned).filter(([, version]) => !/^\d+\.\d+\.\d+$/.test(version));
    expect(ranged).toEqual([]);
  });

  it('runs the hex scanner inside lint, which keeps AC 4 at five checks', () => {
    expect(manifest.scripts.lint).toBe('eslint . && node scripts/check-hex.mjs');
  });
});

describe('scripts/check-hex.mjs', () => {
  it('passes the repository as it stands', () => {
    const result = runScanner('check-hex.mjs', ROOT);
    expect(result.status, result.output).toBe(0);
  });

  it('fails on a raw hex outside theme.css, naming every hit with its line', () => {
    const directory = mkdtempSync(join(tmpdir(), 'check-hex-'));
    try {
      writeFileSync(
        join(directory, 'offender.tsx'),
        ['export const a = "#' + '8E2E7E";', 'export const b = "#' + 'fff";', ''].join('\n'),
      );
      const result = runScanner('check-hex.mjs', directory);

      expect(result.status).not.toBe(0);
      // Every hit, not the first: a scanner that stops early turns one
      // commit's cleanup into several.
      expect(result.output).toContain('offender.tsx:1:');
      expect(result.output).toContain('offender.tsx:2:');
      expect(result.output).toContain('2 raw hex colours');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('reads the file kinds a colour can actually hide in', () => {
    // The matrix names a `.css` file, and the scanner that only reads `.tsx`
    // would miss the one place a stylesheet colour would be written.
    const directory = mkdtempSync(join(tmpdir(), 'check-hex-kinds-'));
    const kinds = {
      'a.css': '.x { color: #' + '8E2E7E; }',
      'b.svg': '<rect fill="#' + 'FCFBF8" />',
      'c.mts': 'export const x = "#' + '1B1915";',
      'd.webmanifest': '{ "theme_color": "#' + 'EDE4D3" }',
      'e.yml': 'colour: "#' + '4E7033"',
      'f.scss': '$ink: #' + '5C5345;',
    };
    try {
      for (const [name, contents] of Object.entries(kinds)) {
        writeFileSync(join(directory, name), contents);
      }
      const result = runScanner('check-hex.mjs', directory);

      expect(result.status).not.toBe(0);
      for (const name of Object.keys(kinds)) {
        expect(result.output, `${name} was not scanned`).toContain(`${name}:1:`);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('exempts only the token file at the scan root, not any file so named', () => {
    const directory = mkdtempSync(join(tmpdir(), 'check-hex-exempt-'));
    try {
      // The real one, resolved against the root it was given.
      mkdirSync(join(directory, 'src', 'ui'), { recursive: true });
      writeFileSync(join(directory, 'src', 'ui', 'theme.css'), '.a { color: #' + '8E2E7E; }');
      // A second place colours live, wearing the same name. AD-18 forbids the
      // second place, not the name.
      mkdirSync(join(directory, 'src', 'ui', 'legacy'), { recursive: true });
      writeFileSync(
        join(directory, 'src', 'ui', 'legacy', 'theme.css'),
        '.b { color: #' + '8E2E7E; }',
      );

      const result = runScanner('check-hex.mjs', directory);

      expect(result.status).not.toBe(0);
      expect(result.output).toContain('legacy/theme.css:1:');
      expect(result.output).toContain('1 raw hex colour');
      // The exempt one is reported under its own path; the nested one is not
      // the exempt one, so exactly one hit is correct.
      expect(result.output).not.toContain('ui/theme.css:1:  #');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('scripts/check-bundle-key.mjs', () => {
  it('fails rather than passing when the directory does not exist', () => {
    const result = runScanner('check-bundle-key.mjs', join(tmpdir(), 'no-such-dist-directory'));
    // A check that scanned nothing has proved nothing.
    expect(result.status).not.toBe(0);
  });

  it('fails rather than passing when the directory exists and is empty', () => {
    // The same failure as a missing directory, and it arrives the same way: a
    // build that produced nothing. Scanning zero files is not a clean bundle.
    const directory = mkdtempSync(join(tmpdir(), 'check-key-empty-'));
    try {
      expect(runScanner('check-bundle-key.mjs', directory).status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('passes a directory with no key in it', () => {
    const directory = mkdtempSync(join(tmpdir(), 'check-key-clean-'));
    try {
      writeFileSync(join(directory, 'app.js'), 'export const engine = "anthropic";\n');
      expect(runScanner('check-bundle-key.mjs', directory).status).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails on an API key, without printing it', () => {
    const directory = mkdtempSync(join(tmpdir(), 'check-key-leak-'));
    const key = ['sk', 'ant', 'api03', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].join('-');
    try {
      writeFileSync(join(directory, 'app.js'), `const k = "${key}";\n`);
      const result = runScanner('check-bundle-key.mjs', directory);

      expect(result.status).not.toBe(0);
      expect(result.output).toContain('app.js:1');
      expect(result.output).toContain('1 possible API key in');
      expect(result.output, 'the scanner printed the key into the CI log').not.toContain(key);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails on a secret that carries no provider prefix', () => {
    // The generic pattern is the half of the scanner the Anthropic-shaped
    // fixture never exercises. A key from somewhere else is still a key in the
    // bundle, and it would otherwise be matched by nothing that is ever run.
    const directory = mkdtempSync(join(tmpdir(), 'check-key-generic-'));
    const generic = `sk-${'A1b2C3d4E5f6G7h8I9j0'.repeat(3)}`;
    try {
      expect(generic).not.toContain('sk-ant-');
      writeFileSync(join(directory, 'vendor.js'), `const k = "${generic}";\n`);
      const result = runScanner('check-bundle-key.mjs', directory);

      expect(result.status).not.toBe(0);
      expect(result.output).toContain('generic secret key');
      expect(result.output).not.toContain(generic);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('pluralises its own count', () => {
    const directory = mkdtempSync(join(tmpdir(), 'check-key-plural-'));
    const key = ['sk', 'ant', 'api03', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].join('-');
    try {
      writeFileSync(join(directory, 'one.js'), `const a = "${key}";\n`);
      writeFileSync(join(directory, 'two.js'), `const b = "${key}";\n`);
      expect(runScanner('check-bundle-key.mjs', directory).output).toContain(
        '2 possible API keys in',
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
