import tseslint from 'typescript-eslint';

/**
 * AD-1's ban list, as ESLint rules.
 *
 * Nothing under `src/core/` may reach for the runtime it happens to be in: the
 * same modules serve the browser and the Node harness (FR-20, FR-21), and a
 * function NFR-5 requires to answer identically every time cannot read an
 * ambient clock. Four rules carry the whole list, because the list mixes bare
 * globals, member reads, an import and a syntax form.
 */
const BANNED_GLOBALS = [
  { name: 'window', message: 'core/ runs in Node too — AD-1. Reach the browser through a port.' },
  { name: 'document', message: 'core/ runs in Node too — AD-1. Reach the DOM from ui/ only.' },
  {
    name: 'localStorage',
    message: 'core/ may not persist anything — AD-1. Use the Storage port (AD-6).',
  },
  {
    name: 'fetch',
    message: 'core/ may not reach the network — AD-1. One adapter owns the one host (AD-11).',
  },
  { name: 'process', message: 'core/ runs in the browser too — AD-1.' },
  { name: 'navigator', message: 'core/ runs in Node too — AD-1.' },
  {
    name: 'performance',
    message: 'core/ may not read ambient time — AD-1. Measure in the caller.',
  },
  {
    name: 'crypto',
    message: 'core/ generates no identifiers — AD-1. Use the Id port (conventions).',
  },
  {
    name: 'Intl',
    message:
      'core/ may not read the system locale or zone — AD-1. Calendar names are injected from ui/labels.ts.',
  },
  // The two names that would otherwise reopen every ban above it:
  // `no-restricted-globals` matches a bare identifier, so `globalThis.fetch`
  // and `self.localStorage` name a banned capability without naming a banned
  // identifier. Banning the two roots outright closes the whole family, and
  // core/ has no legitimate use for either.
  {
    name: 'globalThis',
    message:
      'core/ may not reach the global object — AD-1. It is the back door to every other ban here.',
  },
  {
    name: 'self',
    message:
      'core/ may not reach the global object — AD-1. It is the back door to every other ban here.',
  },
  {
    name: 'sessionStorage',
    message: 'core/ may not persist anything — AD-1. Use the Storage port (AD-6).',
  },
  {
    name: 'indexedDB',
    message: 'core/ may not persist anything — AD-1. Use the Storage port (AD-6).',
  },
  {
    name: 'caches',
    message: 'core/ may not persist anything — AD-1. The service worker owns the cache (AD-11).',
  },
  { name: 'location', message: 'core/ knows nothing about the URL — AD-1, AD-16.' },
  { name: 'history', message: 'core/ knows nothing about navigation — AD-1, AD-16.' },
  {
    name: 'XMLHttpRequest',
    message: 'core/ may not reach the network — AD-1. One adapter owns the one host (AD-11).',
  },
  {
    name: 'WebSocket',
    message: 'core/ may not reach the network — AD-1. One adapter owns the one host (AD-11).',
  },
  {
    name: 'requestAnimationFrame',
    message: 'core/ may not read ambient time — AD-1. Frame timing belongs in ui/.',
  },
];

const BANNED_PROPERTIES = [
  {
    object: 'Math',
    property: 'random',
    message: 'core/ is deterministic — AD-1. Randomness belongs behind a port.',
  },
  {
    object: 'Date',
    property: 'now',
    message: 'core/ may not read ambient time — AD-1, AD-2. Take a LocalDate as an argument.',
  },
  {
    object: 'window',
    property: 'localStorage',
    message: 'core/ may not persist anything — AD-1. Use the Storage port (AD-6).',
  },
];

const BANNED_SYNTAX = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message:
      'A zero-argument `new Date()` reads the ambient clock — AD-1, AD-2. Only adapters/system-clock.ts may.',
  },
  {
    selector: 'MetaProperty',
    message:
      '`import.meta` is a Vite-injected value — AD-1. core/ must compile unchanged for the Node harness.',
  },
];

export default tseslint.config(
  {
    name: 'to-do-list/ignores',
    ignores: [
      'dist/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.docs/**',
      '.logs/**',
      '.impeccable/**',
      '_bmad/**',
      '.claude/**',
    ],
  },
  {
    // Lint-proof by design: these fixtures exist to be reported on, and
    // tests/unit/core-purity.test.ts is the only thing that may lint them.
    // Removing this entry by name is how that test re-enables them.
    name: 'to-do-list/core-purity-fixtures-ignored',
    ignores: ['src/core/__fixtures__/**'],
  },
  {
    name: 'to-do-list/typescript',
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommended],
  },
  {
    name: 'to-do-list/no-logging',
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    rules: {
      // Nothing in the shipped app logs: no analytics, no telemetry, no crash
      // reporting, no `console` in committed code outside harness/ (AD-11,
      // conventions). `scripts/` is deliberately outside this glob — a CI check
      // that cannot name what it found is useless.
      'no-console': 'error',
    },
  },
  {
    name: 'to-do-list/core-purity',
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...BANNED_GLOBALS],
      'no-restricted-properties': ['error', ...BANNED_PROPERTIES],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Every subpath, not three names: `react-dom/client` and
              // `react/jsx-dev-runtime` are the same dependency by another
              // spelling, and a list of names goes stale the moment React
              // publishes another entry point.
              group: ['react', 'react/**', 'react-dom', 'react-dom/**'],
              message: 'core/ is framework-free — AD-1. React belongs in ui/.',
            },
            {
              // Any depth, not one level: `src/core/sub/x.ts` reaches a port as
              // `../../ports/clock`, which a `../ports/*` group never sees.
              group: ['**/ports/**', '**/adapters/**', '**/app/**', '**/ui/**'],
              message: 'core/ depends on nothing — the dependency direction is strictly inward.',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...BANNED_SYNTAX],
    },
  },
);
