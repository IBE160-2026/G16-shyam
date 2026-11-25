import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { labels } from '../../src/ui/labels';

/**
 * The first run surface, in a real browser, at both bound widths.
 *
 * AC 2 (the surface renders and states what the product is), AC 7 (`axe-core`
 * reports no violations and nothing scrolls horizontally at 360 px or 1280 px),
 * and the half of AC 1 that only the built artifact can show: the CSP is in the
 * shipped `index.html` and admits exactly one host.
 *
 * `axe-core` here is **evidence, not a conformance claim**. It covers a subset
 * of WCAG 2.2 AA, so a green run says the mechanical checks found nothing — it
 * does not say the app conforms, and nothing in this repository may say that
 * (AD-17).
 */

/**
 * The two reserved purples, as a browser reports them: `proposed` and the
 * `proposed-wash` field it is drawn on. Purple means a proposal awaiting the
 * user, and the reservation covers the wash as well as the ink.
 */
const RESERVED_PURPLES = ['rgb(142, 46, 126)', 'rgb(248, 234, 244)'];

/** Every way a colour can reach the screen, pseudo-elements included. */
const COLOUR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'boxShadow',
  'fill',
  'stroke',
  'textDecorationColor',
  'caretColor',
];

/** The policy the built artifact must carry, directive by directive. */
const EXPECTED_CSP = {
  'default-src': ["'self'"],
  'connect-src': ['https://api.anthropic.com'],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};

/** `MON 16 NOV` — the shape, never the value: the clock is the real clock. */
const HEADER_DATE = /^[A-Z]{3} \d{2} [A-Z]{3}$/;

async function visibleText(page: Page): Promise<string> {
  // `innerText` reports only what is rendered, so the composition for the other
  // width — which is in the markup but `display: none` — is correctly absent.
  return page.locator('body').innerText();
}

test.describe('first run', () => {
  test('serves with no key, account or network access', async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/');
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();

    // Against this origin exactly, not "some localhost port": a request to
    // another port on this machine is as off-origin as one to the internet,
    // and is the shape a stray dev-server or mock would take.
    const origin = new URL(baseURL!).origin;
    const offOrigin = requests.filter((url) => new URL(url).origin !== origin);
    expect(offOrigin, 'the surface reached off-origin').toEqual([]);
  });

  test('titles the document from labels.ts', async ({ page }) => {
    await page.goto('/');
    // The placeholder is substituted, not shipped — and the string it is
    // substituted with is the one in labels.ts (AD-9).
    await expect(page).toHaveTitle(labels.appName);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      labels.appDescription,
    );
  });

  test('renders the m9 surface', async ({ page }) => {
    await page.goto('/');
    const text = await visibleText(page);

    // The wordmark and the date.
    expect(text).toContain(labels.wordmark);
    const date = page.locator('time');
    await expect(date).toBeVisible();
    expect((await date.innerText()).trim()).toMatch(HEADER_DATE);

    // The state of the file, and its count. Zero is a number, not an absence.
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();
    await expect(page.getByText(labels.firstRun.count)).toBeVisible();

    // The 19px display line, the two prose lines, and the offline line.
    const display = page.getByText(labels.firstRun.display);
    await expect(display).toBeVisible();
    await expect(display).toHaveCSS('font-size', '19px');
    for (const line of labels.firstRun.prose) {
      await expect(page.getByText(line)).toBeVisible();
    }
    await expect(page.getByText(labels.firstRun.offline)).toBeVisible();

    // Today, the one destination.
    expect(text).toContain(labels.shell.today.title);
  });

  test('sets every number in tabular figures', async ({ page }) => {
    await page.goto('/');
    // Columns of dates that do not align are the fastest way to make this world
    // look wrong (UX-DR4). The font's own `tnum` feature is proven separately,
    // in tests/unit/fonts-tnum.test.ts, because CSS cannot witness its absence.
    await expect(page.locator('time')).toHaveCSS('font-variant-numeric', 'tabular-nums');
    await expect(page.getByText(labels.firstRun.count)).toHaveCSS(
      'font-variant-numeric',
      'tabular-nums',
    );
  });

  test('carries the built CSP, admitting only the Anthropic host', async ({ page }) => {
    await page.goto('/');
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');

    expect(policy, 'no CSP in the built index.html').not.toBeNull();

    // The whole policy, directive by directive. Reading `connect-src` alone
    // would pass a policy that also said `default-src *` or granted
    // `script-src 'unsafe-inline'` — the one host would still be the only host
    // named, and everything else would be wide open.
    const directives = Object.fromEntries(
      policy!
        .split(';')
        .map((directive) => directive.trim())
        .filter((directive) => directive !== '')
        .map((directive) => {
          const [name, ...values] = directive.split(/\s+/);
          return [name!, values];
        }),
    );
    expect(directives).toEqual(EXPECTED_CSP);

    for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'", '*']) {
      expect(policy, `the policy admits ${unsafe}`).not.toContain(unsafe);
    }
  });

  test('renders nothing purple', async ({ page }) => {
    await page.goto('/');
    // Purple means a proposal awaiting the user and nothing else, anywhere.
    // Proposals arrive in Epic 2, so on this surface the reservation is total.
    const purple = await page.evaluate(
      ({ reserved, properties }) => {
        const hits: string[] = [];
        for (const element of document.querySelectorAll('*')) {
          // Pseudo-elements too: a `::before` rule is as visible as any other,
          // and is exactly where a decorative colour would hide from a sweep
          // that only read the elements themselves.
          for (const pseudo of [null, '::before', '::after']) {
            const style = getComputedStyle(element, pseudo);
            for (const property of properties) {
              const value = style.getPropertyValue(
                property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
              );
              for (const colour of reserved) {
                // `boxShadow` carries its colour inside a longer string, so
                // this is a containment test rather than an equality one.
                if (value.includes(colour)) {
                  hits.push(`${element.tagName}${pseudo ?? ''} ${property}: ${value}`);
                }
              }
            }
          }
        }
        return hits;
      },
      { reserved: RESERVED_PURPLES, properties: COLOUR_PROPERTIES },
    );
    expect(purple).toEqual([]);
  });

  test('holds the shell geometry for its width', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize()?.width ?? 0;

    if (width < 1280) {
      // 40px header, 46px bottom tab bar, one column (UX-DR15).
      await expect(page.locator('[data-shell="header"] > div')).toHaveCSS('height', '40px');
      await expect(page.locator('[data-shell="tabbar"] ul')).toHaveCSS('height', '46px');
      await expect(page.locator('[data-shell="rail"]')).toBeHidden();
    } else {
      // 196px nav rail in chrome, and the tab bar stands down (UX-DR15).
      await expect(page.locator('[data-shell="rail"]')).toHaveCSS('width', '196px');
      await expect(page.locator('[data-shell="tabbar"]')).toBeHidden();
    }
  });

  test('does not scroll horizontally', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('reports no axe-core violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
      'axe-core is evidence, never a conformance claim',
    ).toEqual([]);
  });

  test('logs nothing to the console', async ({ page }) => {
    const noise: string[] = [];
    // Every type, not only errors and warnings. Nothing in the shipped app
    // logs at all (AD-11), so a `console.log` left in committed code is the
    // defect this is looking for, and it would never arrive as an error.
    page.on('console', (message) => {
      noise.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      noise.push(`pageerror: ${error.message}`);
    });

    await page.goto('/');
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();

    // Nothing in the shipped app logs (AD-11), and a CSP the build got wrong
    // reports itself here rather than as a silent visual defect.
    expect(noise).toEqual([]);
  });
});
