import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/adapters/local-storage';
import { TASK_SCHEMA_VERSION } from '../../src/core/constants';
import type { Priority } from '../../src/core/task';
import { DESKTOP_QUERY } from '../../src/ui/today/Capture';
import { labels } from '../../src/ui/labels';

/**
 * Capture, in a real browser, at both bound widths.
 *
 * This is where the halves of the story that only a browser can show are
 * proved: that a typed sentence becomes a record (AC 1), that it is still there
 * after a reload and after the session ends (AC 3), that create-to-visible
 * stays inside FR-8's budget with nothing on the wire (AC 2), that an
 * unavailable or full `localStorage` leaves the app working and silent (AC 5),
 * that an unreadable document is kept rather than destroyed (AC 6), and that
 * the record carries its anatomy at 46 px (AC 7).
 *
 * `axe-core` here is **evidence, not a conformance claim** — it covers a subset
 * of WCAG 2.2 AA, so a green run says the mechanical checks found nothing. It
 * does not say the app conforms, and nothing in this repository may say that
 * (AD-17).
 */

const SENTENCE = 'Submit assignment in IBE160';

/**
 * Which side of the breakpoint the page is on — **asked of the page**, using
 * the component's own query.
 *
 * Not `viewportSize().width >= 1280`. The breakpoint is `80rem` in both the
 * stylesheet and `Capture.tsx`, so a pixel comparison here would be a third
 * spelling of it, right only at a 16 px root font size, and would disagree with
 * the app exactly where the app is hardest to check by eye.
 */
async function isDesktop(page: Page): Promise<boolean> {
  return page.evaluate((query) => window.matchMedia(query).matches, DESKTOP_QUERY);
}

async function submitLabel(page: Page): Promise<string> {
  return (await isDesktop(page)) ? labels.capture.submitDesktop : labels.capture.submitMobile;
}

async function placeholder(page: Page): Promise<string> {
  return (await isDesktop(page))
    ? labels.capture.placeholderDesktop
    : labels.capture.placeholderMobile;
}

/** Asserts the field and the button are wearing this width's wording. */
async function expectWordingForWidth(page: Page): Promise<void> {
  await expect(page.locator('[data-capture="field"]')).toHaveAttribute(
    'placeholder',
    await placeholder(page),
  );
  await expect(page.locator('[data-capture="submit"]')).toHaveText(await submitLabel(page));
}

/**
 * A Fixture-sized document — the 10–15 example Tasks PRD §3 defines a Fixture
 * as, at the top of that range.
 *
 * AC 2 measures against this rather than against an empty list because AD-6's
 * accepted cost is that the **whole** document is re-serialized per mutation.
 * Timing a one-Task write would measure nothing and would not notice the day
 * the cost became linear in something it should not be.
 */
function fixtureTask(index: number, priority: Priority = 'medium'): Record<string, unknown> {
  return {
    id: `fixture-${String(index)}`,
    text: `Fixture task number ${String(index)}`,
    dueDate: null,
    notes: null,
    tags: [],
    priority,
    summary: null,
    completedAt: null,
  };
}

function fixtureDocument(count = 15): string {
  return JSON.stringify({
    schemaVersion: TASK_SCHEMA_VERSION,
    tasks: Array.from({ length: count }, (_, index) => fixtureTask(index)),
  });
}

/** A document of exactly these Priorities, newest first, for the ladder. */
function priorityDocument(priorities: readonly Priority[]): string {
  return JSON.stringify({
    schemaVersion: TASK_SCHEMA_VERSION,
    tasks: priorities.map((priority, index) => fixtureTask(index, priority)),
  });
}

/**
 * A document whose Tasks carry exactly these due dates, newest first.
 *
 * Seeding rather than capturing is the only way to assert a pill's *text*: the
 * browser runs against the real clock, so a captured `Friday` lands on whatever
 * Friday follows the day the gate happens to run. A stored date is a fixed one,
 * which is the same reason every unit test here passes a literal (NFR-10).
 */
function dueDateDocument(dueDates: readonly (string | null)[]): string {
  return JSON.stringify({
    schemaVersion: TASK_SCHEMA_VERSION,
    tasks: dueDates.map((dueDate, index) => ({ ...fixtureTask(index), dueDate })),
  });
}

/**
 * A colour token's value, as the browser serializes a colour.
 *
 * Read off `:root` rather than spelled here. A literal would put the palette in
 * a second place, outside `theme.css` where `scripts/check-hex.mjs` cannot see
 * it — and would keep passing after the token changed, which is the one thing
 * these assertions exist to notice.
 */
async function tokenColour(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const digits = raw.replace('#', '');
    // The build's CSS minifier shortens a six-digit hex whose pairs repeat to
    // the three-digit form, so both lengths have to be read — three digits is
    // the same colour with each digit doubled. (Spelling either form out here
    // would be a raw colour outside theme.css, which lint forbids.)
    const hex =
      digits.length === 3
        ? [...digits].map((digit) => `${digit}${digit}`).join('')
        : digits;
    if (hex.length !== 6) throw new Error(`${name} is not a hex colour: "${raw}"`);
    const channel = (at: number): number => Number.parseInt(hex.slice(at, at + 2), 16);
    // The serialization a browser reports a colour in.
    return `rgb(${String(channel(0))}, ${String(channel(2))}, ${String(channel(4))})`;
  }, token);
}

/** Seeds a document under the real key before any application code runs. */
async function seed(page: Page, raw: string): Promise<void> {
  await page.addInitScript(
    ([key, document]) => {
      window.localStorage.setItem(key as string, document as string);
    },
    [STORAGE_KEYS.tasks, raw],
  );
}

/** Everything the page has stored under this origin. */
async function storedItems(page: Page): Promise<Record<string, string>> {
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
async function capture(page: Page, text: string): Promise<void> {
  await page.locator('[data-capture="field"]').fill(text);
  await page.locator('[data-capture="submit"]').click();
}

test.describe('capture', () => {
  test('turns one typed sentence into a record', async ({ page }) => {
    await page.goto('/');

    // The field is the one the frames draw, with this width's wording.
    const field = page.locator('[data-capture="field"]');
    await expect(field).toBeVisible();
    await expectWordingForWidth(page);

    await capture(page, SENTENCE);

    const record = page.locator('[data-record]');
    await expect(record).toHaveCount(1);
    // The sentence, verbatim. Not trimmed, not recased, not paraphrased.
    await expect(record.locator('[data-slot="sentence"]')).toHaveText(SENTENCE);
    // And the field is empty again, ready for the next one.
    await expect(field).toHaveValue('');
  });

  test('keeps focus in the field across the very first capture', async ({ page }) => {
    await page.goto('/');

    // The first capture is the one that swaps first run for the populated
    // surface. If the field were rendered inside each arm of that branch, React
    // would unmount the input the user had just typed into: the caret would
    // land on `body` and a phone keyboard would close between Task one and
    // Task two. The field is rendered once, above the branch, for this reason.
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    const field = page.locator('[data-capture="field"]');
    await expect(field, 'focus left the field on the first capture').toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('INPUT');

    // And the second capture — where no branch is crossed — keeps it too, so
    // the assertion above is about the switch rather than about focus at all.
    await capture(page, 'Pay rent');
    await expect(page.locator('[data-record]')).toHaveCount(2);
    await expect(field).toBeFocused();
  });

  test('carries the wording across the breakpoint within one page', async ({ page }) => {
    await page.goto('/');
    await expectWordingForWidth(page);

    // Nothing else in the gate crosses the breakpoint inside one page
    // lifetime: each project fixes its viewport before navigation, so deleting
    // the resize listener would be invisible to every other check here.
    await page.setViewportSize({ width: 1440, height: 800 });
    await expect(page.locator('[data-capture="field"]')).toHaveAttribute(
      'placeholder',
      labels.capture.placeholderDesktop,
    );
    await expect(page.locator('[data-capture="submit"]')).toHaveText(labels.capture.submitDesktop);

    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('[data-capture="field"]')).toHaveAttribute(
      'placeholder',
      labels.capture.placeholderMobile,
    );
    await expect(page.locator('[data-capture="submit"]')).toHaveText(labels.capture.submitMobile);

    // Back again, so a listener that fired once is not mistaken for one that
    // tracks.
    await page.setViewportSize({ width: 1440, height: 800 });
    await expect(page.locator('[data-capture="submit"]')).toHaveText(labels.capture.submitDesktop);
  });

  test('creates the Task at FR-1 defaults, and stores exactly those fields', async ({ page }) => {
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    const items = await storedItems(page);
    // AC 4: one key, carrying its schemaVersion, and nothing else written.
    expect(Object.keys(items)).toEqual([STORAGE_KEYS.tasks]);

    const document = JSON.parse(items[STORAGE_KEYS.tasks] ?? '') as {
      schemaVersion: number;
      tasks: Record<string, unknown>[];
    };
    expect(document.schemaVersion).toBe(TASK_SCHEMA_VERSION);
    expect(document.tasks).toHaveLength(1);

    const [task] = document.tasks;
    expect(task?.text).toBe(SENTENCE);
    expect(task?.priority).toBe('medium');
    expect(task?.tags).toEqual([]);
    expect(task?.summary).toBeNull();
    expect(task?.dueDate).toBeNull();
    expect(task?.completedAt).toBeNull();
    expect(typeof task?.id).toBe('string');
    // Nothing derived is stored: no `completed`, no `archived` (AD-7).
    expect(Object.keys(task ?? {}).sort()).toEqual([
      'completedAt',
      'dueDate',
      'id',
      'notes',
      'priority',
      'summary',
      'tags',
      'text',
    ]);
  });

  test('stores the text byte-identically, whatever was typed', async ({ page }) => {
    const awkward = '  Pay   RENT på fredag  ';
    await page.goto('/');
    await capture(page, awkward);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    const items = await storedItems(page);
    const document = JSON.parse(items[STORAGE_KEYS.tasks] ?? '') as {
      tasks: { text: string }[];
    };
    expect(document.tasks[0]?.text).toBe(awkward);
  });

  test('says nothing at all on a whitespace-only submit', async ({ page }) => {
    await page.goto('/');
    await capture(page, '   ');

    // Nothing was created, and the first run surface is still the surface.
    await expect(page.locator('[data-record]')).toHaveCount(0);
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();

    // The field keeps focus and keeps what was typed — a stray submit does not
    // destroy a half-written sentence.
    const field = page.locator('[data-capture="field"]');
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('   ');

    // And there is no error state. Ever (UX-DR22). Not a message, not a role,
    // not an invalid attribute, not a description pointing at one.
    await expect(page.locator('[role="alert"], [role="status"]')).toHaveCount(0);
    await expect(page.locator('[aria-invalid="true"], [aria-describedby]')).toHaveCount(0);
    expect(await storedItems(page)).toEqual({});
  });

  test('leaves nothing on the wire', async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/');
    requests.length = 0;
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    // AC 2's second half: capture needs no network, so it makes no request at
    // all — not to the Anthropic host, and not back to this origin either.
    expect(requests, 'capture reached the network').toEqual([]);

    const origin = new URL(baseURL ?? '').origin;
    await page.reload();
    const offOrigin = requests.filter((url) => new URL(url).origin !== origin);
    expect(offOrigin, 'the surface reached off-origin').toEqual([]);
  });
});

test.describe('persistence', () => {
  test('survives a reload with every field intact', async ({ page }) => {
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);
    const before = await storedItems(page);

    await page.reload();

    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect(page.locator('[data-slot="sentence"]')).toHaveText(SENTENCE);
    expect(await storedItems(page)).toEqual(before);
  });

  test('survives the browser being closed and reopened', async ({ page, browser }) => {
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    // A session boundary, as a browser actually makes one: the origin's storage
    // is saved, the context is destroyed, and a brand-new browser context is
    // opened over the restored storage. A `reload` would not prove this — it
    // never leaves the session.
    const state = await page.context().storageState();
    const viewport = page.viewportSize();
    await page.context().close();

    // The viewport is spread in only when there is one: a `null` would
    // otherwise have taken the whole options object with it and silently
    // dropped `storageState`, leaving this test proving nothing at all.
    const reopened = await browser.newContext({
      storageState: state,
      ...(viewport === null ? {} : { viewport }),
    });
    try {
      const fresh = await reopened.newPage();
      await fresh.goto('/');
      await expect(fresh.locator('[data-record]')).toHaveCount(1);
      await expect(fresh.locator('[data-slot="sentence"]')).toHaveText(SENTENCE);
    } finally {
      await reopened.close();
    }
  });

  test('keeps a parsed due date across a reload, pill unchanged', async ({ page }) => {
    // The write side of `dueDate` is new in this story, so the round trip is
    // too: every other assertion about a non-null due date reads a document
    // this suite seeded by hand, which proves the read path and not the trip.
    // The clock is fixed at Monday 2026-11-16 so the pill's text can be
    // written out rather than matched by shape.
    await page.clock.install({ time: new Date(2026, 10, 16, 9, 0, 0) });
    await page.goto('/');
    await capture(page, `${SENTENCE} Friday`);

    const pill = page.locator('[data-record] [data-slot="due-pill"]');
    await expect(pill).toHaveText('FRI 20 NOV');
    expect(await storedItems(page)).toBeTruthy();

    await page.reload();

    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect(page.locator('[data-slot="sentence"]')).toHaveText(`${SENTENCE} Friday`);
    // Byte-identical through a validator that rejects a malformed date: the
    // same pill, not a re-parse and not an em-dash.
    await expect(pill).toHaveAttribute('data-due', 'date');
    await expect(pill).toHaveText('FRI 20 NOV');

    const document = JSON.parse(
      (await storedItems(page))[STORAGE_KEYS.tasks] ?? '',
    ) as { tasks: { dueDate: string | null }[] };
    expect(document.tasks[0]?.dueDate).toBe('2026-11-20');
  });

  test('reads a Fixture-sized document back whole', async ({ page }) => {
    await seed(page, fixtureDocument());
    await page.goto('/');

    await expect(page.locator('[data-record]')).toHaveCount(15);
    await expect(page.locator('[data-today="count"]')).toHaveText(`15 ${labels.today.onFile}`);
  });

  test('states the reference date everything on screen was computed against', async ({ page }) => {
    await seed(page, fixtureDocument(2));
    await page.goto('/');

    // The shape, never the value: the clock here is the real clock, which is
    // the same reason `first-run.spec.ts` matches the header date by pattern.
    // The year is part of the shape because this is the one line in the product
    // that has to be unambiguous — every derived list is a function of it.
    await expect(page.locator('[data-today="reference-date"]')).toHaveText(
      new RegExp(`^${labels.today.referenceDate} [A-Z]{3} \\d{2} [A-Z]{3} \\d{4}$`),
    );

    // And it is the same day the shell's header shows, from the one Clock read
    // — a surface given its own `today` would drift from the chrome above it.
    const header = (await page.locator('header time').innerText()).trim();
    await expect(page.locator('[data-today="reference-date"]')).toContainText(header);

    // The list names itself for assistive technology.
    await expect(page.locator('[data-today="list"]')).toHaveAttribute(
      'aria-label',
      labels.today.listLabel,
    );
  });
});

test.describe('the reference date stays current', () => {
  /**
   * The defect these close: Story 1.1 read the Clock port once at module
   * scope. While nothing depended on the value that was cosmetic — a stale
   * header label. From Story 1.3 the same value decides what `next week` means
   * and is *persisted* into `dueDate`, so a tab left open past local midnight
   * would store a date a week off with nothing on screen to suggest it.
   *
   * The **browser's** clock is faked rather than the app's, so `systemClock`
   * and `useToday` are exercised exactly as they ship with no test-only seam.
   * It is installed at a fixed local time so the expected dates can be written
   * out: Sunday 2026-11-22 at 23:50, ten minutes before the crossing.
   */
  const BEFORE_MIDNIGHT = new Date(2026, 10, 22, 23, 50, 0);

  /** The stored due date of the one Task with this text. */
  async function storedDueDate(page: Page, text: string): Promise<string | null | undefined> {
    const items = await storedItems(page);
    const document = JSON.parse(items[STORAGE_KEYS.tasks] ?? '') as {
      tasks: { text: string; dueDate: string | null }[];
    };
    return document.tasks.find((task) => task.text === text)?.dueDate;
  }

  test('the interval carries a visible tab across local midnight', async ({ page }) => {
    await page.clock.install({ time: BEFORE_MIDNIGHT });
    await seed(page, fixtureDocument(2));
    await page.goto('/');

    const headerDate = page.locator('header time');
    await expect(headerDate).toHaveAttribute('datetime', '2026-11-22');

    // Twenty minutes, which the 30 s interval crosses. `fastForward` fires
    // every timer it passes, which is what a tab that stayed visible does.
    await page.clock.fastForward('00:20:00');
    await expect(headerDate).toHaveAttribute('datetime', '2026-11-23');

    // The meta line moved with it: the chrome and the work area read one value.
    await expect(page.locator('[data-today="reference-date"]')).toContainText('MON 23 NOV 2026');

    // And a capture made after the crossing resolves against the new day —
    // the half that reaches the document. `next week` is the sharpest probe:
    // on Sunday it means the Monday two days on, and on Monday it means the
    // Monday seven days on, so a stale reference date gives a visibly
    // different answer rather than the same one.
    await capture(page, 'Plan next week');
    await expect(page.locator('[data-record]')).toHaveCount(3);
    expect(await storedDueDate(page, 'Plan next week')).toBe('2026-11-30');

    await capture(page, 'Call today');
    expect(await storedDueDate(page, 'Call today')).toBe('2026-11-23');
  });

  test('visibilitychange carries a tab whose timers were suspended', async ({ page }) => {
    await page.clock.install({ time: BEFORE_MIDNIGHT });
    await seed(page, fixtureDocument(2));
    await page.goto('/');

    const headerDate = page.locator('header time');
    await expect(headerDate).toHaveAttribute('datetime', '2026-11-22');

    // `setSystemTime` moves the clock **without firing a single timer** —
    // which is the backgrounded, frozen or bfcache-restored tab, where a
    // browser suspends intervals. Without the `visibilitychange` listener
    // nothing re-reads here, and the interval test above would still pass
    // because `fastForward` fires it thousands of times.
    await page.clock.setSystemTime(new Date(2026, 10, 23, 7, 30, 0));
    await expect(headerDate).toHaveAttribute('datetime', '2026-11-22');

    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(headerDate).toHaveAttribute('datetime', '2026-11-23');
    await expect(page.locator('[data-today="reference-date"]')).toContainText('MON 23 NOV 2026');

    await capture(page, 'Plan next week');
    expect(await storedDueDate(page, 'Plan next week')).toBe('2026-11-30');
  });
});

test.describe('create-to-visible', () => {
  test('stays under 100 ms against a Fixture-sized document', async ({ page }) => {
    await seed(page, fixtureDocument());
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(15);

    // Typing is not part of the measurement; submit-to-rendered is. The text is
    // in the field before the clock starts.
    await page.locator('[data-capture="field"]').fill(SENTENCE);

    const elapsed = await page.evaluate(
      () =>
        new Promise<number>((resolve, reject) => {
          const button = document.querySelector<HTMLButtonElement>('[data-capture="submit"]');
          if (button === null) {
            reject(new Error('no submit button on the page'));
            return;
          }
          const before = document.querySelectorAll('[data-record]').length;
          // A MutationObserver reports the DOM change itself, which is the
          // closest a page can get to "the record appeared" without guessing a
          // polling interval. The budget is met by there being no `await`
          // between the click and the commit, not by this being fast — the
          // synchronicity itself is asserted over the source in
          // tests/unit/store.test.ts.
          const observer = new MutationObserver(() => {
            if (document.querySelectorAll('[data-record]').length > before) {
              const measured = performance.now() - start;
              observer.disconnect();
              resolve(measured);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          const start = performance.now();
          button.click();
          setTimeout(() => {
            observer.disconnect();
            reject(new Error('no record appeared within 5s'));
          }, 5000);
        }),
    );

    expect(elapsed, `create-to-visible took ${String(elapsed)} ms`).toBeLessThan(100);
    await expect(page.locator('[data-record]')).toHaveCount(16);
  });
});

test.describe('resilience', () => {
  test('stays fully usable, and silent, when localStorage is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      // Reading the property is what throws in a browser configured to block
      // site data — the access, not a later call. This is that browser.
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('access to site data is denied');
        },
      });
    });
    await page.goto('/');

    await capture(page, SENTENCE);
    await capture(page, 'Pay rent');

    // Two Tasks, both on screen, newest first. The session works.
    await expect(page.locator('[data-record]')).toHaveCount(2);
    await expect(page.locator('[data-slot="sentence"]').first()).toHaveText('Pay rent');
    await expect(page.locator('[data-today="count"]')).toHaveText(`2 ${labels.today.onFile}`);

    // And capture said nothing about it. Settings is the only surface that may
    // ever mention this, and Settings is Epic 5 (AC 5, AD-6).
    await expect(page.locator('[role="alert"], [role="status"]')).toHaveCount(0);
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
  });

  test('keeps the Task in memory, and silent, when the write is refused', async ({ page }) => {
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string): void {
        if (key.startsWith('todo.')) {
          // What a browser over quota actually throws.
          const error = new Error('persistent storage maximum size reached');
          error.name = 'QuotaExceededError';
          throw error;
        }
        original.call(this, key, value);
      };
    });
    await page.goto('/');

    await capture(page, SENTENCE);

    // The Task happened: it is on screen and usable for the whole session.
    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect(page.locator('[data-slot="sentence"]')).toHaveText(SENTENCE);
    await expect(page.locator('[role="alert"], [role="status"]')).toHaveCount(0);

    await capture(page, 'Pay rent');
    await expect(page.locator('[data-record]')).toHaveCount(2);

    // Nothing was written, because nothing could be — and nothing was
    // half-written either. The document is absent, not corrupt.
    expect(await storedItems(page)).toEqual({});
  });

  test('preserves an unreadable document rather than discarding it', async ({ page }) => {
    const raw = '{"schemaVersion":1,"tasks":[{"id":"x","text":"kept","priority":"urgent"}]}';
    await seed(page, raw);
    await page.goto('/');

    // The app starts empty — which on this count-based surface is first run.
    await expect(page.locator('[data-record]')).toHaveCount(0);
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();
    await expect(page.locator('[role="alert"], [role="status"]')).toHaveCount(0);

    // The raw string is under the backup key, byte for byte, and the original
    // is still where it was. Never discarded (AC 6, AD-6).
    const afterRead = await storedItems(page);
    expect(afterRead[STORAGE_KEYS.backup]).toBe(raw);
    expect(afterRead[STORAGE_KEYS.tasks]).toBe(raw);

    // And the user is not stuck: capturing works, the new document replaces the
    // unreadable one, and the backup still holds what was there before.
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    const afterWrite = await storedItems(page);
    expect(afterWrite[STORAGE_KEYS.backup]).toBe(raw);
    expect(afterWrite[STORAGE_KEYS.tasks]).not.toBe(raw);
    const document = JSON.parse(afterWrite[STORAGE_KEYS.tasks] ?? '') as {
      tasks: { text: string }[];
    };
    expect(document.tasks.map((task) => task.text)).toEqual([SENTENCE]);
  });

  test('starts clean on a clean clone, with nothing stored and nothing said', async ({ page }) => {
    await page.goto('/');

    // The matrix's "document absent" row. The defaults factory answers, and
    // reading never writes: a clean clone leaves the origin untouched.
    await expect(page.getByText(labels.firstRun.state)).toBeVisible();
    await expect(page.getByText(labels.firstRun.count)).toBeVisible();
    await expect(page.locator('[data-capture="field"]')).toBeVisible();
    expect(await storedItems(page)).toEqual({});
  });
});

test.describe('the record', () => {
  test('carries the whole UX-DR6 anatomy at a 46 px pitch', async ({ page }) => {
    await page.goto('/');
    await capture(page, SENTENCE);

    const record = page.locator('[data-record]');
    await expect(record).toHaveCount(1);
    // 46 px at both widths in this story: the dense 24 px table row and the
    // two-column mosaic arrive with the bands in Epic 3.
    await expect(record).toHaveCSS('height', '46px');

    // The 12 px checkbox.
    const checkbox = record.locator('[data-slot="checkbox"]');
    await expect(checkbox).toHaveCSS('width', '12px');
    await expect(checkbox).toHaveCSS('height', '12px');

    // The sentence, in Archivo — the user's own words, so body type.
    const sentence = record.locator('[data-slot="sentence"]');
    await expect(sentence).toBeVisible();
    await expect(sentence).toHaveCSS('font-family', /Archivo/);

    // The tag patch area, naming the absence rather than drawing an empty
    // patch — a Task with no Tag is a valid outcome, never a failure.
    await expect(record.locator('[data-slot="tag-patch"]')).toHaveText(labels.record.noTag);

    // The priority ladder, beside its word, filled to `medium`: two solid rungs
    // and one outlined.
    const ladder = record.locator('[data-slot="priority-ladder"]');
    await expect(ladder).toHaveAttribute('data-level', 'medium');
    await expect(ladder.locator('> span')).toHaveCount(3);
    await expect(record.locator('[data-slot="priority"]')).toContainText(
      labels.record.priority.medium,
    );

    // The due pill area. `SENTENCE` carries no date word, so this is the
    // no-date treatment: an em-dash, and no pill drawn at all (UX-DR12).
    const pill = record.locator('[data-slot="due-pill"]');
    await expect(pill).toHaveAttribute('data-due', 'none');
    await expect(pill).toHaveText(labels.record.noDueDate);
    await expect(pill).toHaveCSS('border-top-width', '0px');

    // The start triangle slot: present, reserved, and false. Epic 2 wires it.
    const triangle = record.locator('[data-slot="start-triangle"]');
    await expect(triangle).toHaveAttribute('data-open', 'false');
    expect(await triangle.innerHTML()).toBe('');
  });

  test('fills the ladder to each level, and names it', async ({ page }) => {
    // Every other test here captures a Task, and a captured Task is always
    // `medium` — so without this, swapping `high` and `low` in the ladder or in
    // the labels passes the whole gate while a stored high-priority Task is
    // drawn and announced as low. The record is the only place Priority is ever
    // read, and the word is what carries it for anyone who cannot compare three
    // bar heights (UX-DR20).
    await seed(page, priorityDocument(['high', 'medium', 'low']));
    await page.goto('/');

    const records = page.locator('[data-record]');
    await expect(records).toHaveCount(3);

    const expected = [
      { priority: 'high', filled: 3, word: labels.record.priority.high },
      { priority: 'medium', filled: 2, word: labels.record.priority.medium },
      { priority: 'low', filled: 1, word: labels.record.priority.low },
    ];

    for (const [index, { priority, filled, word }] of expected.entries()) {
      const record = records.nth(index);
      const ladder = record.locator('[data-slot="priority-ladder"]');

      await expect(ladder, `record ${String(index)} level`).toHaveAttribute(
        'data-level',
        priority,
      );
      await expect(ladder.locator('> span')).toHaveCount(3);
      await expect(
        ladder.locator('[data-rung="filled"]'),
        `record ${String(index)} filled rungs`,
      ).toHaveCount(filled);
      await expect(ladder.locator('[data-rung="empty"]')).toHaveCount(3 - filled);
      await expect(record.locator('[data-slot="priority"]')).toContainText(word);
    }

    // And the three words are three different words, so a labels table that
    // collapsed two of them could not pass the loop above by accident.
    expect(new Set(expected.map((row) => row.word)).size).toBe(3);
  });

  test('draws the outlined pill for a date and an em-dash for none', async ({ page }) => {
    // Two stored dates, so the pill's own text can be asserted exactly: the
    // first Task is due Friday 2026-11-20, the second has no date at all.
    await seed(page, dueDateDocument(['2026-11-20', null]));
    await page.goto('/');

    const records = page.locator('[data-record]');
    await expect(records).toHaveCount(2);

    // The date case: the outlined treatment — `surface` fill, one `rule`
    // hairline — carrying the date in `d1`'s own format, weekday first, day
    // zero-padded, no year.
    const dated = records.nth(0).locator('[data-slot="due-pill"]');
    await expect(dated).toHaveAttribute('data-due', 'date');
    await expect(dated).toHaveText('FRI 20 NOV');
    await expect(dated).toHaveCSS('background-color', await tokenColour(page, '--color-surface'));
    await expect(dated).toHaveCSS('border-top-color', await tokenColour(page, '--color-rule'));
    await expect(dated).toHaveCSS('border-top-width', '1px');
    // The date is set by the user, so it carries full `ink` — the strength `d1`
    // draws every dated pill at. Secondary ink here would read as an absence.
    await expect(dated).toHaveCSS('color', await tokenColour(page, '--color-ink'));
    // Apparatus type with tabular figures, like every date in the product
    // (UX-DR3, UX-DR4).
    await expect(dated).toHaveCSS('font-family', /Barlow Condensed/);
    await expect(dated).toHaveCSS('font-variant-numeric', /tabular-nums/);

    // The no-date case: an em-dash where the pill would have been, and no rect
    // at all around it.
    //
    // The literal is pinned here rather than compared against the label the
    // component already imports — the way `tests/unit/theme-tokens.test.ts`
    // pins token values. Asserting `labels.record.noDueDate` alone would keep
    // passing if the label reverted to `NO DUE DATE`, silently undoing the
    // 2026-11-26 correction to UX-DR12 with the whole gate green.
    const EM_DASH = '—';
    expect(labels.record.noDueDate, 'the no-date pill must be an em-dash').toBe(EM_DASH);

    const undated = records.nth(1).locator('[data-slot="due-pill"]');
    await expect(undated).toHaveAttribute('data-due', 'none');
    await expect(undated).toHaveText(EM_DASH);
    await expect(undated).toHaveCSS('border-top-width', '0px');
    // And the dash is the absence, at secondary strength — the one ink that
    // separates it from a date (`d1` draws the dash in `ink-secondary`).
    await expect(undated).toHaveCSS('color', await tokenColour(page, '--color-ink-secondary'));

    // The two window inks are Epic 3's: nothing here is yellow or olive yet,
    // which is what `deferred-work.md` records as knowingly incomplete.
    for (const token of ['--color-due-week', '--color-attention']) {
      const ink = await tokenColour(page, token);
      await expect(dated, token).not.toHaveCSS('background-color', ink);
    }

    // The pill is a `span`, not a control: the record still contains nothing
    // focusable, and the scan is clean with a date on screen (NFR-4).
    await expect(records.locator('input, button, a, [tabindex]')).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
      'axe-core is evidence, never a conformance claim',
    ).toEqual([]);

    // And neither treatment pushes the row wide at either bound width.
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('puts the date word the user typed into the pill, and leaves the sentence alone', async ({
    page,
  }) => {
    await page.goto('/');
    await capture(page, `${SENTENCE} Friday`);

    const record = page.locator('[data-record]');
    await expect(record).toHaveCount(1);

    // The sentence is unchanged — `Friday` included. Parsing is a read, and
    // the app does not rewrite your sentence (AC 1, FR-23).
    await expect(record.locator('[data-slot="sentence"]')).toHaveText(`${SENTENCE} Friday`);

    // The clock here is the real clock, so the *shape* is asserted and not the
    // value: whichever Friday follows today, the pill reads a Friday. That is
    // the same reason the reference-date line is matched by pattern.
    const pill = record.locator('[data-slot="due-pill"]');
    await expect(pill).toHaveAttribute('data-due', 'date');
    await expect(pill).toHaveText(/^FRI \d{2} [A-Z]{3}$/);

    // And it reached the document, not only the screen: a parsed date is
    // applied directly and persisted with the Task (AC 6, PRD §13 item 2).
    const items = await storedItems(page);
    const document = JSON.parse(items[STORAGE_KEYS.tasks] ?? '') as {
      tasks: { text: string; dueDate: string | null }[];
    };
    expect(document.tasks[0]?.text).toBe(`${SENTENCE} Friday`);
    expect(document.tasks[0]?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('leaves the pill empty for a sentence it does not recognise', async ({ page }) => {
    // Norwegian, and the matrix's byte-identical row. No date, no error, and a
    // Task all the same (AC 4, §6.2).
    const norwegian = 'Pay RENT på fredag';
    await page.goto('/');
    await capture(page, norwegian);

    const record = page.locator('[data-record]');
    await expect(record).toHaveCount(1);
    await expect(record.locator('[data-slot="sentence"]')).toHaveText(norwegian);

    const pill = record.locator('[data-slot="due-pill"]');
    await expect(pill).toHaveAttribute('data-due', 'none');
    await expect(pill).toHaveText(labels.record.noDueDate);

    // Capture has no error state, ever (UX-DR22) — an unrecognised date word
    // is not a near miss to be reported.
    await expect(page.locator('[role="alert"], [role="status"]')).toHaveCount(0);

    const items = await storedItems(page);
    const document = JSON.parse(items[STORAGE_KEYS.tasks] ?? '') as {
      tasks: { text: string; dueDate: string | null }[];
    };
    expect(document.tasks[0]?.text).toBe(norwegian);
    expect(document.tasks[0]?.dueDate).toBeNull();
  });

  test('renders no native control that does nothing', async ({ page }) => {
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    // AD-17 asks for native focusable controls, and a dead checkbox is worse
    // than a drawn one — it is announced, tabbed to, and lies about being
    // operable. Completion is Story 1.6 and Task detail is Story 1.4.
    const record = page.locator('[data-record]');
    await expect(record.locator('input, button, a, [role="checkbox"], [role="button"]')).toHaveCount(
      0,
    );
    await expect(record.locator('[tabindex]')).toHaveCount(0);
  });

  test('renders nothing purple', async ({ page }) => {
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    // Purple means a proposal awaiting the user and nothing else, anywhere.
    // Proposals arrive in Epic 2, and the start triangle slot is empty, so the
    // reservation is still total on a populated Today.
    //
    // The two purples are read off `:root` rather than spelled here. Writing
    // them as literals would put the palette in a second place, outside
    // theme.css where `scripts/check-hex.mjs` cannot see it — and a test that
    // carried its own copy of `proposed` would keep passing after the token
    // changed, which is the one thing it exists to notice.
    const purple = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const asRgb = (token: string): string => {
        const hex = root.getPropertyValue(token).trim().replace('#', '');
        if (hex.length !== 6) throw new Error(`${token} is not a six-digit hex: "${hex}"`);
        const channel = (at: number): number => Number.parseInt(hex.slice(at, at + 2), 16);
        // The serialization a browser reports a colour in.
        return `rgb(${String(channel(0))}, ${String(channel(2))}, ${String(channel(4))})`;
      };
      const reserved = [asRgb('--color-proposed'), asRgb('--color-proposed-wash')];
      const properties = [
        'color',
        'background-color',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'outline-color',
        'box-shadow',
        'fill',
        'stroke',
      ];
      const hits: string[] = [];
      for (const element of document.querySelectorAll('*')) {
        for (const pseudo of [null, '::before', '::after']) {
          const style = getComputedStyle(element, pseudo);
          for (const property of properties) {
            const value = style.getPropertyValue(property);
            for (const colour of reserved) {
              if (value.includes(colour)) {
                hits.push(`${element.tagName}${pseudo ?? ''} ${property}: ${value}`);
              }
            }
          }
        }
      }
      return hits;
    });
    expect(purple).toEqual([]);
  });
});

test.describe('the accessibility floor', () => {
  test('does not scroll horizontally with records on screen', async ({ page }) => {
    await seed(page, fixtureDocument());
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(15);

    // A long sentence is the one that would push the row wide, so one is
    // captured before the measurement rather than after it.
    await capture(
      page,
      'Submit the IBE160 group assignment with the appendix and the reference list before Friday',
    );
    await expect(page.locator('[data-record]')).toHaveCount(16);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('reports no axe-core violations on a populated Today', async ({ page }) => {
    await seed(page, fixtureDocument());
    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(16);

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
      'axe-core is evidence, never a conformance claim',
    ).toEqual([]);
  });

  test('reports no axe-core violations on first run, now that it has a field', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-capture="field"]')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  test('submits on Enter, because the field is in a real form', async ({ page }) => {
    await page.goto('/');
    const field = page.locator('[data-capture="field"]');
    await field.fill(SENTENCE);
    await field.press('Enter');

    // No key handler: a form submits on Enter because that is what a form does
    // (AD-17). The button is a real submit button for the same reason.
    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect(page.locator('[data-capture="submit"]')).toHaveAttribute('type', 'submit');
  });

  test('logs nothing to the console', async ({ page }) => {
    const noise: string[] = [];
    page.on('console', (message) => {
      noise.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      noise.push(`pageerror: ${error.message}`);
    });

    await page.goto('/');
    await capture(page, SENTENCE);
    await expect(page.locator('[data-record]')).toHaveCount(1);

    // Nothing in the shipped app logs at all (AD-11), and a CSP the build got
    // wrong reports itself here rather than as a silent visual defect.
    expect(noise).toEqual([]);
  });
});
