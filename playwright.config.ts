import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end against the **built** artifact, not the dev server (AC 2, AC 7).
 *
 * Two things only exist after a build: the Content-Security-Policy, which
 * `vite.config.ts` injects with `apply: 'build'`, and the vendored subset fonts,
 * which the dev server serves straight from source. Running against
 * `vite preview` tests both. AC 1's `npm run dev` is confirmed separately,
 * because a dev-time policy is exactly what AD-11 forbids.
 *
 * 360 px and 1280 px are both binding (UX-DR15, UX-DR20), so they are projects
 * rather than a loop inside one test: a failure names the width it happened at.
 *
 * A third project drives `npm run dev`. AC 1 is measured on that command, and
 * nothing else in the gate runs it — delete `apply: 'build'` from the CSP
 * plugin and every other check here stays green while the dev server breaks on
 * the inline react-refresh the policy would forbid. Two servers therefore come
 * up: the built artifact on 4173 and the dev server on 5174.
 *
 * Nothing here reads `process.env`. The configuration is identical locally and
 * in CI, which is the point — there is no CI-only behaviour to drift.
 */
const PREVIEW_PORT = 4173;
const DEV_PORT = 5174;

/** The dev-server spec, which must not run against the built artifact. */
const DEV_SPEC = /dev-server\.spec\.ts/;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Unconditionally, not `!!process.env.CI`: a committed `test.only` would cut
  // the gate to one test and still exit 0, and the gate is what SM-2 is
  // measured against. Locally it costs one `.only` left in by accident.
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${String(PREVIEW_PORT)}`,
    // No key, no account, no network — and nothing that would quietly grant
    // one. A trace is kept only for a failure, so a green run writes nothing.
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'mobile-360',
      testIgnore: DEV_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } },
    },
    {
      name: 'desktop-1280',
      testIgnore: DEV_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'dev-server',
      testMatch: DEV_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 800 },
        baseURL: `http://localhost:${String(DEV_PORT)}`,
      },
    },
  ],

  webServer: [
    {
      command: `npm run preview -- --port ${String(PREVIEW_PORT)} --strictPort`,
      url: `http://localhost:${String(PREVIEW_PORT)}/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${String(DEV_PORT)} --strictPort`,
      url: `http://localhost:${String(DEV_PORT)}/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
