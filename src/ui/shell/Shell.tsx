import type { ReactNode } from 'react';
import { formatRoute, TODAY_ROUTE, type Route } from '../../app/router';
import { formatFullDate, formatHeaderDate, type LocalDate } from '../../core/localdate';
import { labels } from '../labels';

/**
 * The app chrome at both bound widths (UX-DR15, AD-16, AD-17).
 *
 * 360 px: one column, 14 px gutters, a 40 px header and a 46 px bottom tab bar.
 * 1280 px: a 196 px nav rail in `chrome`, 26 px gutters, and the destination
 * title above the work area. The `xl` breakpoint is 1280 px exactly, so the
 * desktop composition turns on at the width AC 4 measures.
 *
 * **Today is still the only destination, and now it is a real link.** Story 1.1
 * drew it as an inert `aria-current` marker because there was nowhere else to
 * go and AD-17 forbids a control that does nothing. There is somewhere else to
 * go now — Task detail — so the destination becomes a native anchor carrying
 * the route's own hash (AD-16, AD-17), and it is what returns a reader to
 * Today from a Task.
 *
 * **Extended, never replaced** (AC 5). `DESTINATIONS` is a list of one, so
 * Lists, Archive and Settings arrive in Epic 3 and Epic 8 as entries in it
 * rather than as a second shell. Nothing here is written for one destination:
 * the current-destination mark, the title and the `aria-current` all derive
 * from `route`.
 *
 * The wordmark appears twice in the markup, once per composition, because at
 * 360 px it sits in the header and at 1280 px it sits at the top of the rail.
 * Exactly one of the two is ever rendered: the other is `display: none`, so it
 * is absent from the accessibility tree as well as from the screen.
 */

/** Apparatus type: Barlow Condensed 700, uppercase, tracked (UX-DR3). */
const APPARATUS = 'font-family-apparatus font-apparatus uppercase';

/** The m9 tab glyph, reproduced as inline SVG — assets are vendored (AD-11). */
function TodayGlyph() {
  return (
    <svg
      viewBox="0 0 16 17"
      className="h-[15px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1.5" y="3.5" width="13" height="12" />
      <line x1="1.5" y1="7.5" x2="14.5" y2="7.5" />
      <line x1="5.5" y1="1.5" x2="5.5" y2="4.5" />
      <line x1="10.5" y1="1.5" x2="10.5" y2="4.5" />
    </svg>
  );
}

/**
 * A place the chrome offers to go, and the words it offers it in.
 *
 * Only destinations are listed. Task detail is deliberately absent: UX-DR16
 * enters it from a record rather than from the chrome, so there is nothing for
 * the tab bar or the rail to offer, and m6 and d5 draw neither a tab nor a rail
 * row for it. It has a title and nothing else.
 */
interface Destination {
  readonly route: Route;
  readonly tab: string;
  readonly rail: string;
  readonly glyph: () => ReactNode;
}

/**
 * Every destination that exists at this point in the build — one (AC 5).
 *
 * The epics file slices the other three to the stories that build what they
 * lead to: Lists and Archive in Epic 3, Settings in Epic 8. A tab for a surface
 * that does not exist is the control-that-does-nothing AD-17 rules out.
 */
const DESTINATIONS: readonly Destination[] = [
  {
    route: TODAY_ROUTE,
    tab: labels.shell.today.tab,
    rail: labels.shell.today.rail,
    glyph: TodayGlyph,
  },
];

/** Whether `route` is the destination this entry leads to. */
function isCurrent(route: Route, destination: Destination): boolean {
  return route.kind === destination.route.kind;
}

/**
 * The title for `route`, as the frames draw it.
 *
 * An exhaustive switch rather than a lookup with a fallback: a route added to
 * the union without a title is then a type error here, instead of a surface
 * that silently inherits Today's heading.
 */
function surfaceTitle(route: Route): string {
  switch (route.kind) {
    case 'today':
      return labels.shell.today.title;
    case 'task':
      return labels.shell.task.title;
  }
}

export interface ShellProps {
  /** Today, from the Clock port — the composition root reads it (AD-2). */
  today: LocalDate;
  /** Where the user is, from the URL hash and nowhere else (AD-16). */
  route: Route;
  children: ReactNode;
}

export function Shell({ today, route, children }: ShellProps) {
  const title = surfaceTitle(route);
  // At 360 px the header leads with the wordmark on a destination and with the
  // surface's own title on a surface entered from a record: m1 draws
  // TO-DO-LIST and m6 draws TASK, in the same slot. At 1280 px the wordmark has
  // moved to the rail, so the title is always what the header carries (d1, d5).
  const isDestination = DESTINATIONS.some((destination) => isCurrent(route, destination));

  return (
    <div className="flex min-h-screen flex-col bg-ground xl:flex-row">
      {/* Nav rail — 1280 px only. 196 px of map-margin paper down the side. */}
      <nav
        data-shell="rail"
        aria-label={labels.shell.railLabel}
        className="hidden shrink-0 flex-col border-r-[1.2px] border-rule-strong bg-chrome p-gutter-mobile xl:flex xl:w-rail-width"
      >
        <h1
          className={`${APPARATUS} border-b border-rule pb-group-gap-min text-title tracking-apparatus-max text-ink tabular-nums`}
        >
          {labels.wordmark}
        </h1>
        <h2
          className={`${APPARATUS} mt-group-gap-max text-apparatus tracking-apparatus-min text-ink-secondary`}
        >
          {labels.shell.railGroupHeading}
        </h2>
        <ul className="mt-group-gap-min">
          {DESTINATIONS.map((destination) => {
            const current = isCurrent(route, destination);
            return (
              <li key={formatRoute(destination.route)} className="flex">
                {/*
                  A 24 px row is the floor SC 2.5.8 sets for a pointer target,
                  and row-height-desktop is that token — the rail row is the
                  target, not the word inside it.
                */}
                <a
                  href={formatRoute(destination.route)}
                  aria-current={current ? 'page' : undefined}
                  className={`flex h-row-height-desktop flex-1 items-center gap-group-gap-min outline-offset-2 outline-ink focus-visible:outline-2 ${
                    current ? 'bg-ground' : ''
                  }`}
                >
                  {/* The current destination carries a mark as well as its ink
                      and its word, so no state rides on colour alone
                      (UX-DR20). An inactive row reserves the same width, so the
                      word does not shift when the mark appears. */}
                  <span
                    className={`h-full w-[2.6px] shrink-0 ${current ? 'bg-ink' : ''}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-family-body text-body ${
                      current ? 'font-body-strong text-ink' : 'font-body text-ink-secondary'
                    }`}
                  >
                    {destination.rail}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        {/*
          One header, two roles. At 360 px it is the 40 px chrome bar carrying
          the wordmark — or the surface title — and the date. At 1280 px the
          wordmark has moved to the rail, so it carries the title and the date
          instead, on ground rather than paper and inset to the 26 px gutters.
        */}
        <header
          data-shell="header"
          className="shrink-0 bg-chrome xl:bg-transparent xl:px-gutter-desktop xl:pt-gutter-desktop"
        >
          <div className="flex h-header-height-mobile items-center justify-between border-b-[1.2px] border-rule-strong px-gutter-mobile xl:h-auto xl:px-0 xl:pb-group-gap-min">
            <h1
              className={`${APPARATUS} text-title tracking-apparatus-max text-ink tabular-nums xl:hidden`}
            >
              {isDestination ? labels.wordmark : title}
            </h1>
            <p
              data-shell="title"
              className={`${APPARATUS} hidden text-title tracking-apparatus-max text-ink xl:block`}
            >
              {title}
            </p>
            {/*
              One `time` element, two renderings of the same day: m1 and m6 draw
              the mobile header date as MON 16 NOV, and d1 and d5 draw the
              desktop title row as MON 16 NOV 2026. The year is a desktop
              composition rather than a format change, which is why
              `formatHeaderDate` is untouched — the record's due pill shares it
              and carries no year in any of its four states.
            */}
            <time
              dateTime={today}
              className={`${APPARATUS} text-apparatus tracking-apparatus-min text-ink-secondary tabular-nums`}
            >
              <span className="xl:hidden">{formatHeaderDate(today, labels.dates)}</span>
              <span className="hidden xl:inline">{formatFullDate(today, labels.dates)}</span>
            </time>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-gutter-mobile pt-group-gap-max pb-group-gap-max xl:px-gutter-desktop xl:pt-group-gap-max xl:pb-gutter-desktop">
          {children}
        </main>

        {/* Bottom tab bar — 360 px only. 46 px, one destination. */}
        <nav
          data-shell="tabbar"
          aria-label={labels.shell.tabBarLabel}
          className="shrink-0 border-t-[1.2px] border-rule-strong bg-chrome xl:hidden"
        >
          <ul className="flex h-tabbar-height items-stretch">
            {DESTINATIONS.map((destination) => {
              const current = isCurrent(route, destination);
              const Glyph = destination.glyph;
              return (
                <li key={formatRoute(destination.route)} className="flex">
                  {/*
                    The whole 76 x 46 px cell is the target, which is well clear
                    of SC 2.5.8's 24 px floor (AD-17).
                  */}
                  <a
                    href={formatRoute(destination.route)}
                    aria-current={current ? 'page' : undefined}
                    className={`relative flex min-w-[76px] flex-col items-center justify-center gap-[3px] px-gutter-mobile outline-offset-[-2px] outline-ink focus-visible:outline-2 ${
                      current ? 'text-ink' : 'text-ink-secondary'
                    }`}
                  >
                    <span
                      className={`absolute inset-x-0 top-0 h-[2.2px] ${current ? 'bg-ink' : ''}`}
                      aria-hidden="true"
                    />
                    <Glyph />
                    <span className={`${APPARATUS} text-apparatus tracking-apparatus-min`}>
                      {destination.tab}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
