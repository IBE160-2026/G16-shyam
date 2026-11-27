import { expect, type Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/adapters/local-storage';
import { TASK_SCHEMA_VERSION } from '../../src/core/constants';
import type { Priority } from '../../src/core/task';
import { DESKTOP_QUERY } from '../../src/ui/today/Capture';

/**
 * What every end-to-end spec needs: a seeded document, a capture, and a way to
 * read back what the page stored.
 *
 * These lived inside `capture.spec.ts` while it was the only populated-surface
 * spec. Story 1.4 adds a second one, and a second private copy of `seed` is how
 * two specs come to disagree about which storage key the app uses — so the
 * shared half moved here. What stayed behind is what is genuinely about
 * capture: the field's per-width wording helpers.
 *
 * **No helper here asserts anything about a surface.** They set state up and
 * read it back; every expectation belongs in the spec that has a reason for it.
 * The one exception is `expectNoHorizontalScroll`, which is the same four lines
 * in four places and has exactly one correct form.
 */

/** A Task document's shape on the way in, before the app validates it. */
export type SeedTask = Record<string, unknown>;

/**
 * Which side of the breakpoint the page is on — **asked of the page**, using
 * the component's own query.
 *
 * Not `viewportSize().width >= 1280`. The breakpoint is `80rem` in the
 * stylesheet and in `Capture.tsx`, so a pixel comparison here would be a third
 * spelling of it, right only at a 16 px root font size, and would disagree with
 * the app exactly where the app is hardest to check by eye.
 */
export async function isDesktop(page: Page): Promise<boolean> {
  return page.evaluate((query) => window.matchMedia(query).matches, DESKTOP_QUERY);
}

/**
 * One Task at FR-1's defaults, with whatever this test needs overridden.
 *
 * Fields are spelled here rather than built with `createTask` on purpose: a
 * seeded document is **stored bytes**, and these specs exist partly to prove
 * the app reads bytes it did not write. Building the fixture with the
 * application's own factory would hide a change to the persisted shape from
 * every test that uses it.
 */
export function fixtureTask(index: number, overrides: Partial<SeedTask> = {}): SeedTask {
  return {
    id: `fixture-${String(index)}`,
    text: `Fixture task number ${String(index)}`,
    dueDate: null,
    notes: null,
    tags: [],
    priority: 'medium',
    summary: null,
    completedAt: null,
    ...overrides,
  };
}

/** A document of exactly these Tasks, in this order. */
export function taskDocument(tasks: readonly SeedTask[]): string {
  return JSON.stringify({ schemaVersion: TASK_SCHEMA_VERSION, tasks });
}

/**
 * A Fixture-sized document — the 10–15 example Tasks PRD §3 defines a Fixture
 * as, at the top of that range.
 *
 * The timing check measures against this rather than against an empty list
 * because AD-6's accepted cost is that the **whole** document is re-serialized
 * per mutation. Timing a one-Task write would measure nothing and would not
 * notice the day the cost became linear in something it should not be.
 */
export function fixtureDocument(count = 15): string {
  return taskDocument(Array.from({ length: count }, (_, index) => fixtureTask(index)));
}

/** A document of exactly these Priorities, newest first, for the ladder. */
export function priorityDocument(priorities: readonly Priority[]): string {
  return taskDocument(priorities.map((priority, index) => fixtureTask(index, { priority })));
}

/**
 * A document whose Tasks carry exactly these due dates, newest first.
 *
 * Seeding rather than capturing is the only way to assert a pill's *text*: the
 * browser runs against the real clock, so a captured `Friday` lands on whatever
 * Friday follows the day the gate happens to run. A stored date is a fixed one,
 * which is the same reason every unit test here passes a literal (NFR-10).
 */
export function dueDateDocument(dueDates: readonly (string | null)[]): string {
  return taskDocument(dueDates.map((dueDate, index) => fixtureTask(index, { dueDate })));
}

/**
 * A document whose Tasks carry exactly these completion dates.
 *
 * The one builder the clock makes impossible to do any other way: nothing in
 * the app can complete a Task until Story 1.6, so a completed — or archived —
 * Task can *only* arrive as stored bytes. Which is also the honest shape of the
 * case, since a document written weeks ago is exactly where an archived Task
 * comes from in life.
 */
export function completedDocument(completedDates: readonly (string | null)[]): string {
  return taskDocument(
    completedDates.map((completedAt, index) => fixtureTask(index, { completedAt })),
  );
}

/**
 * A colour token's value, as the browser serializes a colour.
 *
 * Read off `:root` rather than spelled here. A literal would put the palette in
 * a second place, outside `theme.css` where `scripts/check-hex.mjs` cannot see
 * it — and would keep passing after the token changed, which is the one thing
 * these assertions exist to notice.
 */
export async function tokenColour(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const digits = raw.replace('#', '');
    // The build's CSS minifier shortens a six-digit hex whose pairs repeat to
    // the three-digit form, so both lengths have to be read — three digits is
    // the same colour with each digit doubled. (Spelling either form out here
    // would be a raw colour outside theme.css, which lint forbids.)
    const hex = digits.length === 3 ? [...digits].map((digit) => `${digit}${digit}`).join('') : digits;
    if (hex.length !== 6) throw new Error(`${name} is not a hex colour: "${raw}"`);
    const channel = (at: number): number => Number.parseInt(hex.slice(at, at + 2), 16);
    // The serialization a browser reports a colour in.
    return `rgb(${String(channel(0))}, ${String(channel(2))}, ${String(channel(4))})`;
  }, token);
}

/**
 * Seeds a document under the real key before any application code runs.
 *
 * **It re-seeds on every navigation, reload included.** `addInitScript` is
 * registered on the page, not fired once, so a `page.reload()` after a seed
 * restores the seeded bytes and silently discards whatever the app wrote in
 * between. A test that means to prove something *survives* a reload must
 * therefore create its Task through capture rather than seeding it — otherwise
 * it asserts the init script, not the product.
 */
export async function seed(page: Page, raw: string): Promise<void> {
  await page.addInitScript(
    ([key, document]) => {
      window.localStorage.setItem(key as string, document as string);
    },
    [STORAGE_KEYS.tasks, raw],
  );
}

/** Everything the page has stored under this origin. */
export async function storedItems(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key !== null) items[key] = window.localStorage.getItem(key) ?? '';
    }
    return items;
  });
}

/**
 * Types a sentence and submits it the way a person does: the button, not a
 * synthetic form event.
 */
export async function capture(page: Page, text: string): Promise<void> {
  await page.locator('[data-capture="field"]').fill(text);
  await page.locator('[data-capture="submit"]').click();
}

/**
 * A date `offset` days before today, in the **local** calendar.
 *
 * `toISOString().slice(0, 10)` is the trap this exists to avoid: it reports the
 * **UTC** calendar date of a local instant, while the app's reference date comes
 * from `src/adapters/system-clock.ts`, which composes it from `getFullYear`,
 * `getMonth` and `getDate` — all local. At any positive UTC offset the two
 * disagree for the first hours of every local day, which shifts every seeded
 * age by one and lands squarely on the retention boundary: a Task seeded as
 * "completed 30 days ago" becomes 31 days old and archives, and the assertion
 * that it is still listed fails on a clock rather than on a defect.
 *
 * The fixed reference date the spec's matrix is written against cannot be used
 * here — the built artifact reads the real clock — so the next best thing is to
 * compute in the same calendar the app reads.
 */
export function localDaysAgo(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Nothing on the page pushes the document wider than the viewport.
 *
 * At 360 px this is the assertion that a long sentence, a date pill or a field
 * row has not broken the one-column composition (NFR-4, UX-DR15). The
 * measurement is on `documentElement` rather than on `body`, because an
 * overflowing child of a `min-h-screen` flex column shows up there first.
 */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
}
