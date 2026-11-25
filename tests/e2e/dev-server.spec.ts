import { expect, test } from '@playwright/test';
import { labels } from '../../src/ui/labels';

/**
 * `npm run dev`, which is the command AC 1 is actually measured on.
 *
 * Nothing else in the gate runs it. The built artifact carries the
 * Content-Security-Policy and the dev server must not: in development the React
 * plugin injects inline react-refresh, Tailwind injects a `<style>` element and
 * HMR opens a `ws://` connection, so a policy that reached development would
 * break the one command a grader is promised (AD-11).
 *
 * That makes `apply: 'build'` a load-bearing two words with no other witness.
 * Remove them and every other check in this repository stays green while the
 * dev server stops working — which is the failure this file exists to catch.
 */
test.describe('the dev server', () => {
  test('renders the surface', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(labels.firstRun.state)).toBeVisible();
    await expect(page.getByText(labels.firstRun.display)).toBeVisible();
    await expect(page.getByText(labels.firstRun.offline)).toBeVisible();
    await expect(page.locator('time')).toBeVisible();
  });

  test('carries no Content-Security-Policy', async ({ page }) => {
    await page.goto('/');
    // Not "a permissive policy" — none at all. The shipped artifact carries the
    // policy; the dev server does not.
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(0);
  });

  test('reports no error or warning', async ({ page }) => {
    const noise: string[] = [];
    page.on('console', (message) => {
      // Errors and warnings only here, unlike the built-artifact suite, which
      // records every type. The dev server's own toolchain talks on `debug`
      // and `info` — Vite announcing its HMR socket, React offering its
      // DevTools — and none of that is committed code. A policy that leaked
      // into development arrives as an `error`: a refused inline script.
      if (message.type() === 'error' || message.type() === 'warning') {
        noise.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => {
      noise.push(`pageerror: ${error.message}`);
    });

    await page.goto('/');
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();

    expect(noise).toEqual([]);
  });
});
