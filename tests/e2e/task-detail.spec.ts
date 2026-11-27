import { expect, test, type Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/adapters/local-storage';
import { DEFAULT_RETENTION_DAYS, TASK_SCHEMA_VERSION } from '../../src/core/constants';
import { labels } from '../../src/ui/labels';
import {
  accessibilityViolations,
  capture,
  expectTargetFloor,
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

/** A field row's rendered value — for the rows that are still read-only. */
function fieldValue(page: Page, slot: string) {
  return page.locator(`[data-field="${slot}"] dd`);
}

/**
 * A field row's control.
 *
 * Six of the seven rows carry a native control as of Story 1.5, so their value
 * is read with `toHaveValue` rather than `toHaveText`. `completed` is the
 * exception and stays prose — Story 1.6 owns completion.
 */
function fieldControl(page: Page, slot: string) {
  return page.locator(`[data-field="${slot}"] [data-edit]`);
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
    await expect(fieldControl(page, 'text')).toHaveValue(String(FULL_TASK.text));
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

    // And each value, read off the control that now carries it (Story 1.5).
    await expect(fieldControl(page, 'text')).toHaveValue('Submit assignment in IBE160 Friday');
    // The stored `LocalDate` itself: a native date control's value format is
    // `YYYY-MM-DD`, which is exactly what the document holds, so the field
    // round-trips with no formatter between it and storage.
    await expect(fieldControl(page, 'due-date')).toHaveValue('2026-11-20');
    await expect(fieldControl(page, 'tags')).toHaveValue(
      `school${labels.taskDetail.tagSeparator}group`,
    );
    await expect(fieldControl(page, 'priority')).toHaveValue('high');
    await expect(fieldControl(page, 'summary')).toHaveValue('Submit assignment in IBE160');
    await expect(fieldControl(page, 'notes')).toHaveValue('Hand in the PDF, not the .docx');
    // A date, never a boolean (AD-7): `completedAt` is all the domain stores
    // about completion, so the surface shows it rather than reducing it to yes.
    // Still prose, and still the only read-only row — Story 1.6 owns it.
    await expect(fieldValue(page, 'completed')).toHaveText('Mon 16 Nov 2026');
    await expect(page.locator('[data-field="completed"] time')).toHaveAttribute(
      'datetime',
      '2026-11-16',
    );

    // Priority still renders as the ladder beside its word, so no state rides
    // on colour alone — the control is additional, not a replacement (AC 5).
    await expect(page.locator('[data-field="priority"] [data-slot="priority-ladder"]')).toHaveAttribute(
      'data-level',
      'high',
    );

    // What the frames draw and this story does not build. PROJECT is Tier 3 and
    // the Task has no such field; CREATED needs a creation instant, which AD-2
    // keeps out of the domain. Neither is a row waiting to be filled in.
    const text = await page.locator('[data-surface="task-detail"]').innerText();
    expect(text).not.toContain('PROJECT');
    expect(text).not.toContain('CREATED');
    // No course table, no engine chip, and no *buttons* — every purple element
    // on this surface belongs to Epic 2, and the editable fields Story 1.5 adds
    // are native controls rather than an Apply/Cancel pair. A button here would
    // be the review idiom leaking in, or a Complete/Delete arriving before
    // Stories 1.6 and 1.7 own them.
    await expect(page.locator('[data-surface="task-detail"] table')).toHaveCount(0);
    // One button, and exactly one: the due date's clear control. No Apply, no
    // Cancel, no Complete and no Delete — the review idiom belongs to Epic 2
    // and completion and deletion to Stories 1.6 and 1.7.
    const buttons = page.locator('[data-surface="task-detail"] button');
    await expect(buttons).toHaveCount(1);
    await expect(buttons).toHaveAttribute('data-action', 'clear-due-date');

    // Exactly the six editable fields, no more: `completed` stays read-only.
    const controls = page.locator('[data-surface="task-detail"] [data-edit]');
    await expect(controls).toHaveCount(6);
    expect(await controls.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-edit'))))
      .toEqual([
        'edit-text',
        'edit-due-date',
        'edit-tags',
        'edit-priority',
        'edit-summary',
        'edit-notes',
      ]);
    await expect(page.locator('[data-field="completed"] [data-edit]')).toHaveCount(0);
  });

  test('names every absence on a Task captured from one sentence', async ({ page }) => {
    // The common case, not the edge one: a Task created by this app has no
    // notes, Tags, Summary or completion date at all. Seven rows of nothing
    // would read as a broken surface, so each states what is true (UX-DR21).
    await seed(page, taskDocument([BARE_TASK]));
    await page.goto(`/#/task/${String(BARE_TASK.id)}`);

    await expect(page.locator('[data-task-detail="fields"] [data-field]')).toHaveCount(7);
    await expect(fieldControl(page, 'text')).toHaveValue('Pay rent');

    // The absence is still named — as the control's placeholder, now that the
    // row is editable (Story 1.5). An empty box with no wording would lose the
    // naming UX-DR21 asks for.
    await expect(fieldControl(page, 'tags')).toHaveValue('');
    await expect(fieldControl(page, 'tags')).toHaveAttribute(
      'placeholder',
      labels.taskDetail.noTags,
    );
    await expect(fieldControl(page, 'summary')).toHaveValue('');
    await expect(fieldControl(page, 'summary')).toHaveAttribute(
      'placeholder',
      labels.taskDetail.noSummary,
    );
    await expect(fieldControl(page, 'notes')).toHaveValue('');
    await expect(fieldControl(page, 'notes')).toHaveAttribute(
      'placeholder',
      labels.taskDetail.noNotes,
    );
    // A native date control carries its own empty presentation and ignores a
    // placeholder, so the absence is the empty value itself.
    await expect(fieldControl(page, 'due-date')).toHaveValue('');
    // Priority is never absent — FR-1 gives every Task `medium`.
    await expect(fieldControl(page, 'priority')).toHaveValue('medium');
    // The one read-only row still names its absence in words.
    await expect(fieldValue(page, 'completed')).toHaveText(labels.taskDetail.notCompleted);

    // Every control is named for a screen reader, which is what a placeholder
    // cannot do: it disappears the moment anything is typed (AD-17).
    for (const slot of ['text', 'due-date', 'tags', 'priority', 'summary', 'notes']) {
      await expect(fieldControl(page, slot), slot).not.toHaveAccessibleName('');
    }
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

    // The control shows the blank as empty and names the absence in its
    // placeholder, rather than presenting whitespace as a value.
    await expect(fieldControl(page, 'summary')).toHaveValue('');
    // Notes keep the stored whitespace in the field — it is the user's text to
    // see and fix — while the commit path turns it into `null`.
    await expect(fieldControl(page, 'notes')).toHaveValue('   ');
    // Not a bare ", " separator: the blank Tags are dropped on the way in.
    await expect(fieldControl(page, 'tags')).toHaveValue('');
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

    await expect(fieldControl(page, 'text')).toHaveValue(long);
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
    await expect(fieldControl(page, 'text')).toHaveValue(String(FULL_TASK.text));
  });
});

test.describe('a Task by its address', () => {
  test('opens from a cold load, from the hash alone', async ({ page }) => {
    // Deep-linkable, and reload-safe: the surface is reconstructed from the URL
    // with no state carried over from the session that produced the link.
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto(`/#/task/${String(BARE_TASK.id)}`);

    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldControl(page, 'text')).toHaveValue('Pay rent');

    // And again after a reload, which is the same path with nothing in memory.
    await page.reload();
    await expect(fieldControl(page, 'text')).toHaveValue('Pay rent');
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
    await expect(fieldControl(page, 'text')).toHaveValue('Submit the lab report');
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

    // On Task detail the due date is now a native control holding the stored
    // `LocalDate`, so the prose-with-year form is asserted on the row that is
    // still prose — the completion date, `Mon 16 Nov 2026`.
    await openFirstRecord(page);
    await expect(fieldControl(page, 'due-date')).toHaveValue('2026-11-20');
    await expect(fieldValue(page, 'completed')).toHaveText('Mon 16 Nov 2026');
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
    await expect(fieldControl(page, 'text')).toHaveValue('Fixture task number 0');
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

test.describe('editing a field', () => {
  /** The stored Task, read back from the document. */
  async function storedTask(page: Page, id: string): Promise<Record<string, unknown>> {
    const raw = (await storedItems(page))[STORAGE_KEYS.tasks] ?? '';
    const parsed = JSON.parse(raw) as { tasks: Record<string, unknown>[] };
    const found = parsed.tasks.find((task) => task.id === id);
    if (found === undefined) throw new Error(`no stored Task ${id}`);
    return found;
  }

  /** Opens FULL_TASK's detail with a second Task on file beside it. */
  async function openFull(page: Page): Promise<void> {
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
  }

  test('writes a free-text field on blur, and nothing before it', async ({ page }) => {
    await openFull(page);
    const notes = fieldControl(page, 'notes');

    await notes.fill('Bring the signed cover sheet');
    // AC 2: typing is not writing. The document still holds the old note, so
    // nothing is being re-serialized per keystroke.
    expect((await storedTask(page, 'task-full')).notes).toBe('Hand in the PDF, not the .docx');

    await notes.blur();
    expect((await storedTask(page, 'task-full')).notes).toBe('Bring the signed cover sheet');
  });

  test('changes one field alone and leaves the rest of the Task intact', async ({ page }) => {
    // AC 1's core claim. The reducer merges one key into the Task as it is now,
    // so the other seven fields are byte-identical afterwards.
    await openFull(page);
    const before = await storedTask(page, 'task-full');

    await fieldControl(page, 'summary').fill('Submit the IBE160 assignment');
    await fieldControl(page, 'summary').blur();

    const after = await storedTask(page, 'task-full');
    expect(after.summary).toBe('Submit the IBE160 assignment');
    expect({ ...after, summary: null }).toEqual({ ...before, summary: null });

    // And the other Task on file did not move either.
    expect(await storedTask(page, 'task-bare')).toEqual(fixtureTask(1, { id: 'task-bare', text: 'Pay rent' }));
  });

  test('stores the sentence byte-identically, never trimmed or recased', async ({ page }) => {
    // AC 4, FR-23: the app does not rewrite your sentence, and an edit is no
    // more licence to rewrite it than a capture was.
    await openFull(page);
    const typed = '  Submit  the   IBE160 assignment on FRIDAY  ';
    await fieldControl(page, 'text').fill(typed);
    await fieldControl(page, 'text').blur();

    expect((await storedTask(page, 'task-full')).text).toBe(typed);
    // And the record quotes it back unchanged.
    await page.goto('/#/today');
    await expect(page.locator('[data-record] [data-slot="sentence"]').first()).toHaveText(typed.trim());
  });

  test('refuses to store a blank task text, and shows the stored one again', async ({ page }) => {
    // `validateTask` rejects a whitespace-only `text`, so committing one would
    // make the whole document unreadable on the next load. `trim` decides
    // whether to write, never what is written.
    await openFull(page);
    const text = fieldControl(page, 'text');

    await text.fill('   ');
    await text.blur();

    expect((await storedTask(page, 'task-full')).text).toBe('Submit assignment in IBE160 Friday');
    // The field recovers the stored value rather than sitting empty.
    await expect(text).toHaveValue('Submit assignment in IBE160 Friday');

    // Not asserted with a reload here: `seed` re-runs its init script on every
    // navigation, so a reload would restore the seeded bytes and prove nothing.
    // The captured-Task test below is where reload survival is established.
  });

  test('clears a nullable field to null and names the absence again', async ({ page }) => {
    await openFull(page);

    for (const slot of ['notes', 'summary']) {
      await fieldControl(page, slot).fill('');
      await fieldControl(page, slot).blur();
    }

    const stored = await storedTask(page, 'task-full');
    expect(stored.notes).toBeNull();
    expect(stored.summary).toBeNull();
    await expect(fieldControl(page, 'notes')).toHaveAttribute(
      'placeholder',
      labels.taskDetail.noNotes,
    );
  });

  test('writes Tags as a list, and clears them to an empty list', async ({ page }) => {
    await openFull(page);
    const tags = fieldControl(page, 'tags');

    await tags.fill('school, group work ,  exam');
    await tags.blur();
    // Split on the separator the row renders with; each tag trimmed, because
    // the space after a comma is the separator and not part of the word.
    expect((await storedTask(page, 'task-full')).tags).toEqual(['school', 'group work', 'exam']);

    await tags.fill('');
    await tags.blur();
    expect((await storedTask(page, 'task-full')).tags).toEqual([]);
    await expect(tags).toHaveAttribute('placeholder', labels.taskDetail.noTags);
  });

  test('sets Priority lowercase, and the ladder follows it', async ({ page }) => {
    // AC 5: exactly one of three, lowercase in the document, and rendered as
    // the ladder beside its word so no state rides on colour alone.
    await openFull(page);
    const priority = fieldControl(page, 'priority');
    const ladder = page.locator('[data-field="priority"] [data-slot="priority-ladder"]');

    await priority.selectOption('low');
    expect((await storedTask(page, 'task-full')).priority).toBe('low');
    await expect(ladder).toHaveAttribute('data-level', 'low');
    await expect(page.locator('[data-field="priority"] [data-slot="priority"]')).toContainText(
      labels.record.priority.low,
    );

    await priority.selectOption('medium');
    expect((await storedTask(page, 'task-full')).priority).toBe('medium');
    await expect(ladder).toHaveAttribute('data-level', 'medium');

    // The choices are exactly the three, in DESCENDING order, lowercase.
    expect(await priority.locator('option').evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value)))
      .toEqual(['high', 'medium', 'low']);
  });

  test('sets and clears the due date, and the record pill follows', async ({ page }) => {
    await openFull(page);
    const due = fieldControl(page, 'due-date');

    await due.fill('2026-12-24');
    await due.blur();
    // On blur, like every other field: a date control fires `change` per digit
    // of the year, so change is not one deliberate act (AC 2).
    expect((await storedTask(page, 'task-full')).dueDate).toBe('2026-12-24');

    await page.goto('/#/today');
    await expect(page.locator('[data-record] [data-slot="due-pill"]').first()).toHaveText('THU 24 DEC');

    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    // Clearing is its own act now: emptying the control is an incomplete edit,
    // not an instruction to delete the date.
    await page.locator('[data-action="clear-due-date"]').click();
    expect((await storedTask(page, 'task-full')).dueDate).toBeNull();

    await page.goto('/#/today');
    const pill = page.locator('[data-record] [data-slot="due-pill"]').first();
    await expect(pill).toHaveAttribute('data-due', 'none');
    await expect(pill.locator('[aria-hidden="true"]')).toHaveText(labels.record.noDueDate);
  });

  test('commits a pending edit when the surface is left by Back', async ({ page }) => {
    // The most natural edit anyone makes — type a note, press Back — and the
    // one a browser fires no `blur` for. Without the unmount commit it would be
    // silently discarded.
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto('/');
    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await fieldControl(page, 'notes').fill('Ask about the appendix');
    await page.goBack();
    await expect(page.locator('[data-record]')).toHaveCount(2);

    expect((await storedTask(page, 'task-full')).notes).toBe('Ask about the appendix');
  });

  test('survives a reload with every edit intact', async ({ page }) => {
    // AC 1's last clause, across all six fields at once.
    //
    // The Task is **captured, not seeded**: `seed` registers an init script
    // that re-runs on every navigation, so reloading after a seed restores the
    // seeded bytes and would assert the harness rather than the product. Going
    // through capture also makes this the honest end-to-end path — a Task the
    // app created, edited and read back.
    await page.goto('/');
    await capture(page, 'Draft task');
    await expect(page.locator('[data-record]')).toHaveCount(1);
    await openFirstRecord(page);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await fieldControl(page, 'text').fill('Submit the lab report');
    await fieldControl(page, 'text').blur();
    await fieldControl(page, 'notes').fill('Two copies');
    await fieldControl(page, 'notes').blur();
    await fieldControl(page, 'summary').fill('Lab report');
    await fieldControl(page, 'summary').blur();
    await fieldControl(page, 'tags').fill('lab, exam');
    await fieldControl(page, 'tags').blur();
    await fieldControl(page, 'priority').selectOption('high');
    await fieldControl(page, 'due-date').fill('2027-01-04');
    await fieldControl(page, 'due-date').blur();

    await page.reload();
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();
    await expect(fieldControl(page, 'text')).toHaveValue('Submit the lab report');
    await expect(fieldControl(page, 'notes')).toHaveValue('Two copies');
    await expect(fieldControl(page, 'summary')).toHaveValue('Lab report');
    await expect(fieldControl(page, 'tags')).toHaveValue(
      `lab${labels.taskDetail.tagSeparator}exam`,
    );
    await expect(fieldControl(page, 'priority')).toHaveValue('high');
    await expect(fieldControl(page, 'due-date')).toHaveValue('2027-01-04');
  });

  test('reaches no network, and proposes nothing', async ({ page, baseURL }) => {
    // AC 3: nothing re-runs a Suggestion Engine on an edit — not on the task
    // text, not on reload, not on navigation. There is no engine yet, so this
    // is the assertion that none was added, and that no purple appeared.
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await openFull(page);
    await fieldControl(page, 'text').fill('Submit the assignment on Friday');
    await fieldControl(page, 'text').blur();

    // The document carries no trace of a proposal: the one field the user
    // touched changed, every other field of both Tasks is untouched, and no
    // engine wrote Tags, Priority or a Summary of its own. Read **before**
    // navigating, because `seed`'s init script re-runs on every navigation.
    // (A `data-open="true"` start triangle is not asserted — `Record.tsx`
    // hard-codes `false`, so the check could not fail and would be theatre.)
    const stored = (await storedItems(page))[STORAGE_KEYS.tasks] ?? '';
    expect(JSON.parse(stored)).toEqual({
      schemaVersion: TASK_SCHEMA_VERSION,
      tasks: [{ ...FULL_TASK, text: 'Submit the assignment on Friday' }, BARE_TASK],
    });

    // Then a reload and a navigation, which AC 3 names explicitly as things
    // that must not re-run an engine.
    await page.reload();
    await page.goto('/#/today');

    const origin = new URL(baseURL!).origin;
    expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
  });

  test('keeps the drafts of two Tasks apart', async ({ page }) => {
    // What this guards is the per-route boundary key in `src/main.tsx`: it is
    // what unmounts this surface on a move from one Task to another, so a draft
    // cannot survive into the next Task's row. Remove that key and the same
    // component instance serves both routes and this fails.
    await openFull(page);
    await fieldControl(page, 'notes').fill('a draft for the first Task');

    await page.goto(`/#/task/${String(BARE_TASK.id)}`);
    await expect(fieldControl(page, 'text')).toHaveValue('Pay rent');
    await expect(fieldControl(page, 'notes')).toHaveValue('');
  });

  test('writes nothing while a date is typed, and once when it is left', async ({ page }) => {
    // The defect this closes: a native date control fires `change` once per
    // digit of the year, so committing on change wrote the document four times
    // for one entry and left `0002-12-24`, `0020-12-24` and `0202-12-24` in it
    // on the way — each a real date `isLocalDate` accepts and the due pill
    // shows. `locator.fill()` cannot see this; it sets the value in one event,
    // which is why every other date assertion here passed throughout.
    await seed(page, taskDocument([fixtureTask(0, { id: 'task-full', text: 'Draft' })]));
    await page.goto('/#/task/task-full');
    const due = fieldControl(page, 'due-date');

    await due.focus();
    await due.pressSequentially('12242027', { delay: 20 });

    // Nothing committed yet, and in particular no year-2 date (AC 2).
    const midway = (await storedItems(page))[STORAGE_KEYS.tasks] ?? '';
    expect(midway).not.toContain('0002-');
    expect(midway).not.toContain('0202-');
    expect((JSON.parse(midway) as { tasks: { dueDate: string | null }[] }).tasks[0]?.dueDate).toBeNull();

    await due.blur();
    expect((await storedTask(page, 'task-full')).dueDate).toBe('2027-12-24');
  });

  test('does not destroy a stored date on a single Backspace', async ({ page }) => {
    // Chromium empties the whole value when one segment is deleted, so
    // committing on change turned one Backspace into `dueDate: null` — a stored
    // date destroyed with no undo, since the Never list forbids per-field undo.
    await openFull(page);
    const due = fieldControl(page, 'due-date');
    await expect(due).toHaveValue('2026-11-20');

    await due.focus();
    await page.keyboard.press('Backspace');

    // Still stored while the field is open: a half-cleared control is not a
    // decision to clear the date.
    expect((await storedTask(page, 'task-full')).dueDate).toBe('2026-11-20');

    // And still stored after leaving the field, which is the case that used to
    // destroy it. The control recovers the stored date rather than sitting
    // empty over a document that still holds one.
    await due.blur();
    expect((await storedTask(page, 'task-full')).dueDate).toBe('2026-11-20');
    await expect(due).toHaveValue('2026-11-20');
  });

  test('keeps the stored date when an edit is abandoned by leaving the surface', async ({
    page,
  }) => {
    // The blur case is covered by the Backspace test above; this is the other
    // way an entry is abandoned — walking away from it. Leaving commits the
    // pending draft of every *other* field, so the date needs its own answer:
    // an incomplete value is refused and the stored date stands.
    await openFull(page);
    const due = fieldControl(page, 'due-date');
    await expect(due).toHaveValue('2026-11-20');

    await due.focus();
    // One segment deleted empties the whole composed value in Chromium, which
    // is exactly what a half-finished entry looks like.
    await page.keyboard.press('Backspace');
    await expect(due).toHaveValue('');

    await page.goto('/#/today');
    await expect(page.locator('[data-record]')).toHaveCount(2);
    expect((await storedTask(page, 'task-full')).dueDate).toBe('2026-11-20');

    // And the record still shows it, so nothing was lost on the way out.
    await expect(page.locator('[data-record] [data-slot="due-pill"]').first()).toHaveText(
      'FRI 20 NOV',
    );
  });

  test('saves a complete date typed from the keyboard', async ({ page }) => {
    // The rule is "only complete and valid", not "never from the keyboard":
    // the digits that make a whole date are still saved, once, on blur.
    await openFull(page);
    const due = fieldControl(page, 'due-date');

    await due.focus();
    await due.pressSequentially('12242027', { delay: 20 });
    await due.blur();

    expect((await storedTask(page, 'task-full')).dueDate).toBe('2027-12-24');
    await expect(due).toHaveValue('2027-12-24');
  });

  test('clears the date only through the clear control', async ({ page }) => {
    await openFull(page);
    const clear = page.locator('[data-action="clear-due-date"]');

    // Accessible, named, and a real target (AD-17, SC 2.5.8).
    await expect(clear).toBeVisible();
    // The visible text is the accessible name — no `aria-label` that could
    // drift from it, which is what `label-content-name-mismatch` catches.
    await expect(clear).toHaveAccessibleName(labels.taskDetail.edit.clearDueDate);
    await expect(clear).toHaveText(labels.taskDetail.edit.clearDueDate);
    const box = await clear.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
    // Keyboard-reachable, like every control here.
    await clear.focus();
    await expect(clear).toBeFocused();

    await clear.click();
    expect((await storedTask(page, 'task-full')).dueDate).toBeNull();
    await expect(fieldControl(page, 'due-date')).toHaveValue('');

    // It is gone once there is nothing to clear: a control that does nothing is
    // what AD-17 rules out.
    await expect(clear).toHaveCount(0);

    // The record follows, back to the em-dash treatment.
    await page.goto('/#/today');
    const pill = page.locator('[data-record] [data-slot="due-pill"]').first();
    await expect(pill).toHaveAttribute('data-due', 'none');
  });

  test('offers no clear control on a Task that has no due date', async ({ page }) => {
    await seed(page, taskDocument([BARE_TASK]));
    await page.goto(`/#/task/${String(BARE_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    await expect(page.locator('[data-action="clear-due-date"]')).toHaveCount(0);
    await expect(page.locator('[data-surface="task-detail"] button')).toHaveCount(0);

    // And a date set from empty brings the control with it.
    await fieldControl(page, 'due-date').fill('2027-03-01');
    await fieldControl(page, 'due-date').blur();
    expect((await storedTask(page, 'task-bare')).dueDate).toBe('2027-03-01');
    await expect(page.locator('[data-action="clear-due-date"]')).toBeVisible();
  });

  test('holds the AD-17 pointer-target floor across the whole surface', async ({ page }) => {
    // Every interactive element, not only the six fields: the chrome's links
    // and the clear control are on this surface too, and the next epic's
    // controls will be. `axe-core` passes a 21 px control that has clearance,
    // so this is measured.
    await openFull(page);
    await expectTargetFloor(page);
  });

  test('gives every control a pointer target of at least 24 px', async ({ page }) => {
    // SC 2.5.8 and AD-17, which states the floor with no spacing exception for
    // rows stacked against each other. `axe-core` cannot stand in for this:
    // its `target-size` rule ships `enabled: false` (axe-core 4.14), so the
    // green accessibility run above says nothing about size. Measured, the
    // inputs were 23 px and the select 21 px before this was asserted.
    await openFull(page);
    for (const slot of ['text', 'due-date', 'tags', 'priority', 'summary', 'notes']) {
      const box = await fieldControl(page, slot).boundingBox();
      expect(box?.height ?? 0, `${slot} is under the 24 px floor`).toBeGreaterThanOrEqual(24);
      expect(box?.width ?? 0, `${slot} is under the 24 px floor`).toBeGreaterThanOrEqual(24);
    }
  });

  test('keeps the Priority ladder beside its control, not below it', async ({ page }) => {
    // The Design Note says "beside", and `w-full` inside the shared class had
    // the select spanning the row with the ladder wrapped underneath.
    await openFull(page);
    const select = await fieldControl(page, 'priority').boundingBox();
    const ladder = await page
      .locator('[data-field="priority"] [data-slot="priority-ladder"]')
      .boundingBox();
    // Vertically overlapping — the two share a line rather than stacking.
    const selectBottom = (select?.y ?? 0) + (select?.height ?? 0);
    expect(ladder?.y ?? 0).toBeLessThan(selectBottom);
    expect(ladder?.x ?? 0).toBeGreaterThan(select?.x ?? 0);
  });

  test('reports no axe-core violations with every field editable', async ({ page }) => {
    await openFull(page);
    expect(
      await accessibilityViolations(page),
      'axe-core is evidence, never a conformance claim',
    ).toEqual([]);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('the accessibility floor on Task detail', () => {
  test('reports no axe-core violations, at either bound width', async ({ page }) => {
    await seed(page, taskDocument([FULL_TASK, BARE_TASK]));
    await page.goto(`/#/task/${String(FULL_TASK.id)}`);
    await expect(page.locator('[data-surface="task-detail"]')).toBeVisible();

    expect(
      await accessibilityViolations(page),
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
