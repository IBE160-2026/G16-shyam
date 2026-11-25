import type { ReactNode } from 'react';
import { formatHeaderDate, type LocalDate } from '../../core/localdate';
import { labels } from '../labels';

/**
 * The app chrome at both bound widths (UX-DR15).
 *
 * 360 px: one column, 14 px gutters, a 40 px header and a 46 px bottom tab bar.
 * 1280 px: a 196 px nav rail in `chrome`, 26 px gutters, and the destination
 * title above the work area. The `xl` breakpoint is 1280 px exactly, so the
 * desktop composition turns on at the width AC 7 measures.
 *
 * Today is the one destination here, and it is current and inert: there is
 * nowhere else to go yet, so it is marked `aria-current` rather than dressed as
 * a control that does nothing (AD-17). Story 1.4 adds hash routing and the
 * remaining destinations **to this component** rather than replacing it, which
 * is why the geometry is built now — the rail and the desktop gutters are the
 * only reason the surface has a desktop composition at all.
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

export interface ShellProps {
  /** Today, from the Clock port — the composition root reads it (AD-2). */
  today: LocalDate;
  children: ReactNode;
}

export function Shell({ today, children }: ShellProps) {
  const headerDate = formatHeaderDate(today, labels.dates);

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
          <li
            aria-current="page"
            className="flex h-row-height-desktop items-center gap-group-gap-min bg-ground"
          >
            {/* The current destination carries a mark as well as its ink and
                its word, so no state rides on colour alone (UX-DR20). */}
            <span className="h-full w-[2.6px] shrink-0 bg-ink" aria-hidden="true" />
            <span className="font-family-body font-body-strong text-body text-ink">
              {labels.shell.today.rail}
            </span>
          </li>
        </ul>
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        {/*
          One header, two roles. At 360 px it is the 40 px chrome bar carrying
          the wordmark and the date. At 1280 px the wordmark has moved to the
          rail, so it carries the destination title and the date instead, on
          ground rather than paper and inset to the 26 px gutters.
        */}
        <header
          data-shell="header"
          className="shrink-0 bg-chrome xl:bg-transparent xl:px-gutter-desktop xl:pt-gutter-desktop"
        >
          <div className="flex h-header-height-mobile items-center justify-between border-b-[1.2px] border-rule-strong px-gutter-mobile xl:h-auto xl:px-0 xl:pb-group-gap-min">
            <h1
              className={`${APPARATUS} text-title tracking-apparatus-max text-ink tabular-nums xl:hidden`}
            >
              {labels.wordmark}
            </h1>
            <p
              className={`${APPARATUS} hidden text-title tracking-apparatus-max text-ink xl:block`}
            >
              {labels.shell.today.title}
            </p>
            <time
              dateTime={today}
              className={`${APPARATUS} text-apparatus tracking-apparatus-min text-ink-secondary tabular-nums`}
            >
              {headerDate}
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
            <li
              aria-current="page"
              className="relative flex min-w-[76px] flex-col items-center justify-center gap-[3px] px-gutter-mobile text-ink"
            >
              <span className="absolute inset-x-0 top-0 h-[2.2px] bg-ink" aria-hidden="true" />
              <TodayGlyph />
              <span className={`${APPARATUS} text-apparatus tracking-apparatus-min`}>
                {labels.shell.today.tab}
              </span>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
