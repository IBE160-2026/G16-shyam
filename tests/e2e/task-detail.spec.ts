import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/adapters/local-storage';
import { DEFAULT_RETENTION_DAYS } from '../../src/core/constants';
import { labels } from '../../src/ui/labels';
import {
  completedDocument,
  expectNoHorizontalScroll,
  fixtureTask,
  isDesktop,
  localDaysAgo,
  seed,
  storedItems,
  taskDocument,
} from './helpers';

/**
 * Task detail, the hash router and the archive filter, in a real browser at
 * both bound widths.
 *
 * This is where the halves of Story 1.4 that only a browser can show are
 * proved: that a record opens a Task (AC 2), that Back leaves the surface
 * rather than the app (AC 3), that the destination state is in the hash and
 * survives a reload (AC 4), that the shell offers the one destination that
 * exists (AC 5), and that an archived Task is absent from Today while a
 * completed one inside the window is not (AC 1).
 *
 * Every date here is **seeded**, never captured. The browser runs against the
 * real clock, so a completion date has to be stored to be fixed — and nothing
 * in the app can complete a Task until Story 1.6 anyway, which makes a seeded
 * document the only way to reach the archive rule at all. The retention
 * boundary is proved arithmetically in `tests/unit/selectors.test.ts`; what is
 * proved here is that Today applies it.
 *
 * `axe-core` here is **evidence, not a conformance claim** — it covers a subset
 * of WCAG 2.2 AA, so a green run says the mechanical checks found nothing. It
 * does not say the app conforms, and nothing in this repository may say that
 * (AD-17).
 */

/**
 * The shipped retention window, read from the constant rather than spelled.
 *
 * The boundary rows below are `RETENTION_DAYS` and `RETENTION_DAYS + 1` so the
 * test follows the default if it ever changes, instead of passing against a
 * stale 30 — the value itself is pinned in `tests/unit/selectors.test.ts`.
 */
const RETENTION_DAYS = DEFAULT_RETENTION_DAYS;

/** The Task every field assertion is made against. */
const FULL_TASK = fixtureTask(0, {
  id: 'task-full',
  text: 'Submit assignment in IBE160 Friday',
  dueDate: '2026-11-20',
  notes: 'Hand in the PDF, not the .docx',
  tags: ['school', 'group'],
  priority: 'high',
  summary: 'Submit assignment in IBE160',
  completedAt: '2026-11-16',
});

/** The same Task as the app itself creates one: text, and nothing else. */
const BARE_TASK = fixtureTask(1, {
  id: 'task-bare',
  text: 'Pay rent',
});

/** Opens the first record by its row, the way a person does. */
async function openFirstRecord(page: Page): Promise<void> {
  await page.locator('[data-record] [data-slot="open"]').first().click();
}

/** A field row's rendered value. */
function fieldValue(page: Page, slot: string) {
  return page.locator(`[data-field="${slot}"] dd`);
}

/** The surface on screen, by the element only one of them renders. */
async function onTaskDetail(page: Page): Promise<boolean> {
  return (await page.locator('[data-surface="task-detail"]').count()) === 1;
}

test.describe('opening a Task', () => {
  test('opens Task detail from a record, and puts the Task in the hash', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto('/');

    // Today first, at the canonical hash — an absent hash normalises to the
    // destination that is on screen rather than being left blank. Asserted
    // after the records are up, because the normalising write is an effect.
    await expect(page.locator('[data-record]')).toHaveCount(2);
    expect(new URL(page.url()).hash).toBe('#/today');

    await openFirstRecord(page);

    // The surface, and the address: destination state is in the URL and
    // nowhere else (AC 4, AD-16).
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    expect(new URL(page.url()).hash).toBe(`#/task/${String(FULL_TASK.id)}`);

    // The Task that was tapped, not merely some Task.
    await expect(fieldValue(page, 'text')).toHaveText(String(FULL_TASK.text));
  });

  test('shows every field PRD §3 defines, and nothing it does not', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);

    // AC 2's seven rows, in the order m6 and d5 stack them.
    const rows = page.locator('[data-task-detail="fields"] [data-field]');
    await expect(rows).toHaveCount(7);
    expect(await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-field'))))
      .toEqual(['text', 'due-date', 'tags', 'priority', 'summary', 'notes', 'completed']);

    // Each label, from labels.ts and in the frame's wording (AD-9).
    const labelled = Object.entries(labels.taskDetail.fields);
    for (const [slot, word] of labelled) {
      const key = slot === 'dueDate' ? 'due-date' : slot;
      await expect(page.locator(`[data-field="${key}"] dt`), key).toHaveText(word);
    }

    // And each value.
    await expect(fieldValue(page, 'text')).toHaveText('Submit assignment in IBE160 Friday');
    // `Fri 20 Nov 2026` — sentence-cased and carrying the year, as m6 draws it.
    // The record's pill is `FRI 20 NOV` on the same date: a third form, and the
    // reason the year arrived as a second formatter rather than as a change to
    // the one the pill shares.
    await expect(fieldValue(page, 'due-date')).toHaveText('Fri 20 Nov 2026');
    await expect(fieldValue(page, 'tags')).toHaveText(
      `school${labels.taskDetail.tagSeparator}group`,
    );
    await expect(fieldValue(page, 'priority')).toHaveText(labels.taskDetail.priority.high);
    await expect(fieldValue(page, 'summary')).toHaveText('Submit assignment in IBE160');
    await expect(fieldValue(page, 'notes')).toHaveText('Hand in the PDF, not the .docx');
    // A date, never a boolean (AD-7): `completedAt` is all the domain stores
    // about completion, so the surface shows it rather than reducing it to yes.
    await expect(fieldValue(page, 'completed')).toHaveText('Mon 16 Nov 2026');

    // The date is data as well as words, so it is in a `time` element.
    await expect(page.locator('[data-field="due-date"] time')).toHaveAttribute(
      'datetime',
      '2026-11-20',
    );

    // What the frames draw and this story does not build. PROJECT is Tier 3 and
    // the Task has no such field; CREATED needs a creation instant, which AD-2
    // keeps out of the domain. Neither is a row waiting to be filled in.
    const text = await page.locator('[data-surface="task-detail"]').innerText();
    expect(text).not.toContain('PROJECT');
    expect(text).not.toContain('CREATED');
    // No course table, no controls, no engine chip — every purple element on
    // this surface belongs to Epic 2.
    await expect(page.locator('[data-surface="task-detail"] table')).toHaveCount(0);
    await expect(
      page.locator('[data-surface="task-detail"] button, [data-surface="task-detail"] input'),
    ).toHaveCount(0);
  });

  test('names every absence on a Task captured from one sentence', async ({ page }) => {
    // The common case, not the edge one: a Task created by this app has no
    // notes, Tags, Summary or completion date at all. Seven rows of nothing
    // would read as a broken surface, so each states what is true (UX-DR21).
    await seed(page, taskDocument([BARE_TASK]));
    await page.goto(`/#/task/${String(BARE_TASK.id)}`);

    await expect(page.locator('[data-task-detail="fields"] [data-field]')).toHaveCount(7);
    await expect(fieldValue(page, 'text')).toHaveText('Pay rent');
    await expect(fieldValue(page, 'due-date')).toHaveText(labels.taskDetail.noDueDate);
    await expect(fieldValue(page, 'tags')).toHaveText(labels.taskDetail.noTags);
    // Priority is never absent — FR-1 gives every Task `medium`.
    await expect(fieldValue(page, 'priority')).toHaveText(labels.taskDetail.priority.medium);
    await expect(fieldValue(page, 'summary')).toHaveText(labels.taskDetail.noSummary);
    await expect(fieldValue(page, 'notes')).toHaveText(labels.taskDetail.noNotes);
    await expect(fieldValue(page, 'completed')).toHaveText(labels.taskDetail.notCompleted);

    // Every row has a value, so no row is an unexplained gap.
    const values = await page
      .locator('[data-task-detail="fields"] dd')
      .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));
    expect(values.filter((value) => value === '')).toEqual([]);
  });

  test('names an absence stored as a blank string, not only as null', async ({ page }) => {
    // `validateTask` admits `summary: ""`, `notes: ""` and `tags: [""]` —
    // `readNullableText` and `readTags` accept any string — so a document
    // written by hand, by a later version, or by Story 1.5's editor can carry
    // one. `??` catches only `null`, so without a blank check these rows render
    // labelled and empty, which is the unexplained gap this surface must never
    // show (UX-DR21).
    await seed(
      page,
      taskDocument([
        fixtureTask(0, { id: 'task-blank', summary: '', notes: '   ', tags: ['', ' '] }),
      ]),
    );
    await page.goto('/#/task/task-blank');

    await expect(fieldValue(page, 'summary')).toHaveText(labels.taskDetail.noSummary);
    await expect(fieldValue(page, 'notes')).toHaveText(labels.taskDetail.noNotes);
    // Not a bare ", " separator.
    await expect(fieldValue(page, 'tags')).toHaveText(labels.taskDetail.noTags);

    const values = await page
      .locator('[data-task-detail="fields"] dd')
      .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));
    expect(values.filter((value) => value === '')).toEqual([]);
  });

  test('opens the Task when the sentence itself is tapped', async ({ page }) => {
    // AC 2's own wording — "when I tap its sentence". The row-sized overlay is
    // what carries the action, so a press on the sentence is a press on the
    // overlay; this asserts that from the user's side, at the sentence's own
    // coordinates, rather than trusting that the overlay covers it.
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(2);

    const sentence = page.locator('[data-record] [data-slot="sentence"]').first();
    await expect(sentence).toHaveText(String(FULL_TASK.text));
    const box = await sentence.boundingBox();
    await page.mouse.click((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);

    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    expect(new URL(page.url()).hash).toBe(`#/task/${String(FULL_TASK.id)}`);
  });

  test('renders the whole sentence, however long, without scrolling sideways', async ({ page }) => {
    // The record truncates at 46 px; this is the surface where the full
    // sentence is meant to be readable. At 360 px that means wrapping, not
    // overflowing.
    const long =
      'Submit the IBE160 group assignment with the appendix, the reference list and the signed cover sheet before Friday afternoon';
    await seed(page, taskDocument([fixtureTask(0, { id: 'task-long', text: long })]));
    await page.goto('/#/task/task-long');

    await expect(fieldValue(page, 'text')).toHaveText(long);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('Back', () => {
  test('returns to Today rather than exiting the app', async ({ page }) => {
    // AC 3, and the reason destination state is in the hash at all: Back is the
    // universal phone gesture, and it can only leave a surface the browser
    // knows the user arrived at (AD-16, UX-DR16).
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(2);

    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await page.goBack();

    // Today again — the same document, the same app, no reload.
    await expect(page.locator('[data-record]')).toHaveCount(2);
    expect(await onTaskDetail(page)).toBe(false);
    expect(new URL(page.url()).hash).toBe('#/today');
  });

  test('is not consumed by normalising the hash on a cold open', async ({ page }) => {
    // The defect this closes: normalising an absent hash with `location.hash =`
    // instead of `replaceState` pushes a history entry, so the first Back press
    // from a cold open lands on the same page with an empty hash — the user
    // presses Back, nothing appears to happen, and the app looks stuck.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/');
    // After the surface is up, not before: normalising happens in an effect, so
    // reading the address the instant navigation resolves would be racing the
    // app's first render rather than asserting anything about it.
    await expect(page.locator('[data-record]')).toHaveCount(1);
    expect(new URL(page.url()).hash).toBe('#/today');

    // One entry for the page and one for the Task, so going back twice leaves
    // the app rather than landing on a normalised duplicate of Today. The
    // depth is asserted behaviourally and not as `history.length`: the test
    // browser starts on `about:blank`, which is an entry nobody navigated to.
    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-record]')).toHaveCount(1);

    await page.goBack();
    await expect(
      page.locator('[data-record]'),
      'Back landed on a second Today instead of leaving the app',
    ).toHaveCount(0);
  });

  test('goes forward again, because the surface is addressed and not remembered', async ({
    page,
  }) => {
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/');
    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-record]')).toHaveCount(1);

    await page.goForward();
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldValue(page, 'text')).toHaveText(String(FULL_TASK.text));
  });
});

test.describe('a Task by its address', () => {
  test('opens from a cold load, from the hash alone', async ({ page }) => {
    // Deep-linkable, and reload-safe: the surface is reconstructed from the URL
    // with no state carried over from the session that produced the link.
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto(`/#/task/${String(BARE_TASK.id)}`);

    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldValue(page, 'text')).toHaveText('Pay rent');

    // And again after a reload, which is the same path with nothing in memory.
    await page.reload();
    await expect(fieldValue(page, 'text')).toHaveText('Pay rent');
  });

  test('falls back to Today for an id no Task carries', async ({ page }) => {
    // A link kept after the Task was deleted, a hand-typed id, a document
    // restored from another device. No empty detail surface, no error panel,
    // nothing thrown — a wrong address is not a failure to report (UX-DR21).
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/#/task/missing');

    await expect(page.locator('[data-record]')).toHaveCount(1);
    expect(await onTaskDetail(page)).toBe(false);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    await expect(page.getByText(labels.recovery.heading)).toHaveCount(0);
  });

  test('falls back to Today for a hash that names no route', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/#/nonsense');

    await expect(page.locator('[data-record]')).toHaveCount(1);
    expect(await onTaskDetail(page)).toBe(false);
    await expect(page.getByText(labels.recovery.heading)).toHaveCount(0);

    // An unknown hash is left exactly as the user asked for it. The app has
    // nothing truer to replace it with, and the chrome follows the surface on
    // screen rather than the address, so nothing claims to be somewhere it is
    // not.
    expect(new URL(page.url()).hash).toBe('#/nonsense');
    await expect(page.locator('[data-shell="title"]')).toHaveText(labels.shell.today.title);
  });

  test('canonicalises a hash that becomes route-less after load', async ({ page }) => {
    // The normalising write lives inside the router's `sync`, so it runs on
    // every `hashchange` and not only once on mount. Without that, an address
    // cleared after load renders Today under a blank hash — the state the
    // router reserves for an *unknown* hash it deliberately leaves alone.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(1);
    expect(new URL(page.url()).hash).toBe('#/today');

    // A bare `#`, as a skip-link style anchor or a hand-cleared address leaves.
    await page.evaluate(() => {
      window.location.hash = '#';
    });

    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect
      .poll(() => new URL(page.url()).hash, { message: 'a bare # was left un-canonicalised' })
      .toBe('#/today');
  });

  test('keeps the record link named when an id would split the token list', async ({ page }) => {
    // `validateTask` admits any non-empty string as an id, and `aria-labelledby`
    // is a space-separated token list: a raw id containing a space would split
    // into two tokens, neither resolving, and the link would lose its
    // accessible name entirely. The DOM id is percent-encoded for that reason.
    await seed(
      page,
      taskDocument([fixtureTask(0, { id: 'has a space', text: 'Submit the lab report' })]),
    );
    await page.goto('/');

    const open = page.locator('[data-record] [data-slot="open"]');
    await expect(open).toHaveCount(1);
    await expect(open).toHaveAccessibleName('Submit the lab report');

    // And the link still addresses the Task it names.
    await open.click();
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldValue(page, 'text')).toHaveText('Submit the lab report');
  });

  test('survives a hash it cannot even decode', async ({ page }) => {
    // `decodeURIComponent('%')` throws, and a hand-edited address bar is where
    // a lone `%` comes from. The route parse must not take the document down.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/#/task/%');

    await expect(page.locator('[data-record]')).toHaveCount(1);
    await expect(page.getByText(labels.recovery.heading)).toHaveCount(0);
  });
});

test.describe('the shell across routes', () => {
  test('offers only the destination that exists, and titles each surface', async ({ page }) => {
    // AC 5: Today and nothing else. Lists, Archive and Settings arrive in later
    // epics as entries in the same component — a tab for a surface that does
    // not exist is the control-that-does-nothing AD-17 rules out.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/');

    const desktop = await isDesktop(page);
    const destinations = page.locator(
      desktop ? '[data-shell="rail"] li' : '[data-shell="tabbar"] li',
    );
    await expect(destinations).toHaveCount(1);

    // The destination is a native link to its own route, marked as current.
    const todayLink = destinations.locator('a');
    await expect(todayLink).toHaveAttribute('href', '#/today');
    await expect(todayLink).toHaveAttribute('aria-current', 'page');

    // The tab bar at 360 px and the nav rail at 1280 px (AC 4, UX-DR15).
    if (desktop) {
      await expect(page.locator('[data-shell="rail"]')).toBeVisible();
      await expect(page.locator('[data-shell="tabbar"]')).toBeHidden();
      await expect(page.locator('[data-shell="title"]')).toHaveText(labels.shell.today.title);
    } else {
      await expect(page.locator('[data-shell="tabbar"]')).toBeVisible();
      await expect(page.locator('[data-shell="rail"]')).toBeHidden();
    }

    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    // Still one destination, and no longer the current one: Task detail is
    // entered from a record, so the chrome offers it nowhere (UX-DR16).
    await expect(destinations).toHaveCount(1);
    await expect(todayLink).toHaveAttribute('href', '#/today');
    await expect(todayLink).not.toHaveAttribute('aria-current', 'page');

    // The title follows the route at both widths, in the slot each frame draws
    // it in: the desktop title row (d5), and the mobile header band (m6).
    if (desktop) {
      await expect(page.locator('[data-shell="title"]')).toHaveText(labels.shell.task.title);
    } else {
      await expect(page.locator('[data-shell="header"] h1')).toHaveText(labels.shell.task.title);
      // m1 draws the wordmark in that slot on Today, and m6 draws TASK — so the
      // wordmark is gone from the header here rather than being drawn twice.
      await expect(page.locator('[data-shell="header"]')).not.toContainText(labels.wordmark);
    }
  });

  test('carries the year in the desktop title row and not in the mobile header', async ({
    page,
  }) => {
    // The open question Story 1.1 routed here, settled by the frames: m1 and m6
    // draw `MON 16 NOV`, d1 and d5 draw `MON 16 NOV 2026`. The year is a
    // desktop composition, which is why `formatHeaderDate` was left alone — the
    // record's due pill shares it and carries no year in any of its states.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto('/');

    // The shape, never the value: the clock here is the real clock.
    const header = (await page.locator('header time').innerText()).trim();
    expect(header).toMatch(
      (await isDesktop(page)) ? /^[A-Z]{3} \d{2} [A-Z]{3} \d{4}$/ : /^[A-Z]{3} \d{2} [A-Z]{3}$/,
    );

    // One `time` element in the header, whichever width — the other rendering
    // is `display: none`, so it is out of the accessibility tree too.
    await expect(page.locator('header time')).toHaveCount(1);

    // And the record's pill never carries a year — asserted on Today, where the
    // pill actually is, before navigating away from it.
    await expect(page.locator('[data-record] [data-slot="due-pill"]').first()).toHaveText(
      'FRI 20 NOV',
    );

    // The same date on Task detail is a third form again: sentence-cased, and
    // carrying the year.
    await openFirstRecord(page);
    await expect(page.locator('[data-field="due-date"] dd')).toHaveText('Fri 20 Nov 2026');
  });

  test('reaches Today again from the destination link', async ({ page }) => {
    // Not an in-app Back control — the destination link that AC 5 requires
    // anyway. It is what a reader has if their device presents no Back
    // affordance, which `deferred-work.md` records as this story's one known
    // gap against UX-DR16.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    const desktop = await isDesktop(page);
    await page
      .locator(desktop ? '[data-shell="rail"] li a' : '[data-shell="tabbar"] li a')
      .click();

    await expect(page.locator('[data-record]')).toHaveCount(1);
    expect(new URL(page.url()).hash).toBe('#/today');
  });
});

test.describe('the archive filter', () => {
  test('lists every non-archived Task, including completed ones', async ({ page }) => {
    // AC 1, and the row the whole predicate exists for. The reference date here
    // is the real clock, so the dates are computed from it rather than written
    // out: a literal would be right on the day it was written and wrong the
    // next. The arithmetic itself is proved in tests/unit/selectors.test.ts.
    //
    // `localDaysAgo` and not `toISOString()`: the offsets straddle the
    // retention boundary, and a UTC-vs-local disagreement of one day flips the
    // two rows this test exists to pin.
    await seed(
      page,
      completedDocument([
        null, // incomplete — always listed
        localDaysAgo(0), // completed today
        localDaysAgo(6), // completed inside the window
        localDaysAgo(RETENTION_DAYS), // exactly at the window — still listed
        localDaysAgo(RETENTION_DAYS + 1), // archived — the only one that disappears
      ]),
    );
    await page.goto('/');

    // Four of five, and the count states what is shown rather than what is
    // stored (AC 1, AD-9).
    await expect(page.locator('[data-record]')).toHaveCount(4);
    await expect(page.locator('[data-today="count"]')).toHaveText(`4 ${labels.today.onFile}`);

    // The archived one by name, so this cannot pass by removing the wrong Task.
    const texts = await page
      .locator('[data-record] [data-slot="sentence"]')
      .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));
    expect(texts).not.toContain('Fixture task number 4');
    expect(texts).toContain('Fixture task number 3');

    // And nothing was written: Archive is computed on every render and stored
    // nowhere, so reading the list does not rewrite the document (AD-7).
    const stored = (await storedItems(page))[STORAGE_KEYS.tasks] ?? '';
    expect(stored).toContain('Fixture task number 4');
  });

  test('is still addressable when archived, because Archive filters lists', async ({ page }) => {
    // An archived Task is absent from Today and is not unreachable: a link to
    // one that answered with Today would be a surface disappearing on a date
    // rather than on anything the user did. Epic 3 lists them again.
    await seed(
      page,
      taskDocument([
        fixtureTask(0, { id: 'task-archived', completedAt: localDaysAgo(400) }),
        BARE_TASK,
      ]),
    );
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(1);

    await page.goto('/#/task/task-archived');
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldValue(page, 'text')).toHaveText('Fixture task number 0');
  });

  test('shows first run when everything on file is archived', async ({ page }) => {
    // By the existing count rule: an empty *list* renders first run, whether
    // the document is empty or holds nothing but archived Tasks. A bare list
    // under a `2 ON FILE` meta line would be the worse of the two readings.
    const archived = localDaysAgo(90);
    await seed(page, completedDocument([archived, archived]));
    await page.goto('/');

    await expect(page.getByText(labels.firstRun.state)).toBeVisible();
    await expect(page.locator('[data-record]')).toHaveCount(0);
    await expect(page.locator('[data-today="count"]')).toHaveCount(0);

    // The document is untouched — first run is a reading of the list, not a
    // reset of the file.
    const stored = (await storedItems(page))[STORAGE_KEYS.tasks] ?? '';
    expect(stored).toContain(archived);
  });
});

test.describe('a surface that throws', () => {
  test('shows the recovery panel for that route, with the document untouched', async ({ page }) => {
    // AD-20's floor, and the first story with a route that can throw. The
    // failure is injected rather than simulated: `dl` is an element only Task
    // detail renders, so refusing to create one is a render error inside that
    // route and nowhere else.
    const document = taskDocument([FULL_TASK, BARE_TASK]);
    await seed(page, document);

    await page.addInitScript(() => {
      const create = Document.prototype.createElement;
      Document.prototype.createElement = function patched(
        this: Document,
        ...args: Parameters<Document['createElement']>
      ) {
        if (String(args[0]).toLowerCase() === 'dl') throw new Error('injected render failure');
        return create.apply(this, args);
      } as Document['createElement'];
    });

    await page.goto(`/#/task/${String(FULL_TASK.id)}`);

    // A plain recovery panel, not a blank page and not a stack trace.
    await expect(page.getByText(labels.recovery.heading)).toBeVisible();
    await expect(page.getByText(labels.recovery.body)).toBeVisible();

    // The task document is byte-identical to what was seeded: a render failure
    // is not a data failure, and nothing here writes on the way down. Compared
    // against the seeded string itself, so this cannot pass by agreeing with a
    // value the test built twice.
    expect((await storedItems(page))[STORAGE_KEYS.tasks]).toBe(document);

    // And the other route is still reachable — which is what one boundary per
    // surface buys. The panel says BACK TO TODAY, so it goes to Today.
    await page.getByText(labels.recovery.action).click();
    await expect(page.locator('[data-record]')).toHaveCount(2);
    expect(new URL(page.url()).hash).toBe('#/today');
  });

  test('leaves the failed surface behind when the chrome is used instead', async ({ page }) => {
    // The assertion the `key` on each boundary in `src/main.tsx` exists for,
    // and the one the test above cannot make: pressing BACK TO TODAY clears
    // `failed` on that same instance, so it passes whether the boundaries are
    // keyed or not. Reaching Today by the shell's destination link instead
    // never calls `recover()` — so if both routes shared one boundary
    // instance, React would keep it mounted across the navigation and the
    // recovery panel would be left standing over a Today that did nothing
    // wrong.
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));

    await page.addInitScript(() => {
      const create = Document.prototype.createElement;
      Document.prototype.createElement = function patched(
        this: Document,
        ...args: Parameters<Document['createElement']>
      ) {
        if (String(args[0]).toLowerCase() === 'dl') throw new Error('injected render failure');
        return create.apply(this, args);
      } as Document['createElement'];
    });

    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.getByText(labels.recovery.heading)).toBeVisible();

    // The chrome is outside the per-surface boundary, so it is still there.
    const desktop = await isDesktop(page);
    await page
      .locator(desktop ? '[data-shell="rail"] li a' : '[data-shell="tabbar"] li a')
      .click();

    await expect(page.locator('[data-record]')).toHaveCount(2);
    await expect(page.getByText(labels.recovery.heading)).toHaveCount(0);
  });
});

test.describe('the accessibility floor on Task detail', () => {
  test('reports no axe-core violations, at either bound width', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
      'axe-core is evidence, never a conformance claim',
    ).toEqual([]);
  });

  test('does not scroll horizontally', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('logs nothing to the console on either surface', async ({ page }) => {
    const noise: string[] = [];
    // Every type, not only errors and warnings. Nothing in the shipped app logs
    // at all (AD-11), so a React key warning, an `aria-current` React does not
    // recognise or an unhandled `hashchange` arrives here rather than as a
    // visible defect.
    page.on('console', (message) => {
      noise.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      noise.push(`pageerror: ${error.message}`);
    });

    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto('/');
    await expect(page.locator('[data-record]')).toHaveCount(2);

    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-record]')).toHaveCount(2);

    expect(noise).toEqual([]);
  });

  test('renders nothing purple', async ({ page }) => {
    // Purple means a proposal awaiting the user and nothing else, anywhere.
    // Task detail is where the frames draw the most of it — a course table,
    // three controls, an engine chip — and all of it is Epic 2's, so the
    // reservation has to be total on the surface that most wants to break it.
    await seed(page, taskDocument([FULL_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    const purple = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const asRgb = (token: string): string => {
        const hex = root.getPropertyValue(token).trim().replace('#', '');
        const digits =
          hex.length === 3 ? [...hex].map((digit) => `${digit}${digit}`).join('') : hex;
        if (digits.length !== 6) throw new Error(`${token} is not a hex colour: "${hex}"`);
        const channel = (at: number): number => Number.parseInt(digits.slice(at, at + 2), 16);
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
        'text-decoration-color',
        'caret-color',
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
