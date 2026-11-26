import type { DateNames } from '../core/localdate';

/**
 * Every user-visible string in the application (AD-9, UX-DR18).
 *
 * Membership is a predicate and a label has no vote on it: nothing in here is
 * ever read to decide what a list contains. The reverse is also true — no
 * component spells a word of its own, so the product's voice is changed in one
 * file.
 *
 * The voice is plain, specific and never alarming. An absence is a fact
 * followed by what *is* happening, never an error, and the app never claims it
 * was right about anything. UI language is English (`epics.md` constraints
 * checklist, point 8), which is settled and no longer an open question.
 */
export const labels = {
  /** The product's name, as prose. Also the document title. */
  appName: 'To-Do-List',
  /** The wordmark, set in apparatus type. */
  wordmark: 'TO-DO-LIST',
  /**
   * The document description. Both this and `appName` reach `index.html`
   * through `vite.config.ts`, which substitutes them at serve time and at
   * build time alike — they are user-visible strings, and a user-visible
   * string lives here or nowhere.
   */
  appDescription:
    'One typed sentence becomes a task. Works offline, on this device, with no account and no key.',

  shell: {
    /** Names the nav region for assistive technology at each width. */
    tabBarLabel: 'Destinations',
    railLabel: 'Destinations, sidebar',
    /** The rail's group heading above the destinations. */
    railGroupHeading: 'LISTS',
    /** Today is the default destination, and in this story the only one. */
    today: {
      /** Bottom tab bar at 360 px — apparatus type. */
      tab: 'TODAY',
      /** Nav rail at 1280 px — a destination the user picks, so Archivo. */
      rail: 'Today',
      /** The destination title above the work area at 1280 px. */
      title: 'TODAY',
    },
  },

  /**
   * The capture field (FR-1, UX-DR22).
   *
   * Two wordings, one per bound width, exactly as `m1`, `m9` and `d1` draw
   * them: the phone has room for the short sentence and the three-letter
   * button, the desktop for the full one. Nothing here has an error wording,
   * because capture has no error state — not on an empty submit, not when
   * storage is full, not ever.
   */
  capture: {
    /**
     * The field's accessible name. The placeholder is not one: it disappears
     * the moment anything is typed, and a field whose only name is its
     * placeholder has no name while it is being used (AD-17).
     */
    fieldLabel: 'Task text',
    /** 360 px, as `m1` and `m9` draw it. */
    placeholderMobile: 'Type a task the way you say it',
    /** 1280 px, as `d1` draws it. */
    placeholderDesktop: 'Type a task the way you say it out loud',
    /** The submit button, apparatus type at both widths. */
    submitMobile: 'ADD',
    submitDesktop: 'ADD TASK',
  },

  /**
   * Today — the default destination, and the one surface that renders records
   * in this story (UX-DR15).
   *
   * `m1`'s meta line is two halves: what date everything on screen was computed
   * against, and how much is on file. The reference date is stated because
   * every derived list in this product is a function of it, and a list you
   * cannot date is a list you have to trust blindly.
   */
  today: {
    /** Precedes the reference date: `REFERENCE DATE MON 16 NOV 2026`. */
    referenceDate: 'REFERENCE DATE',
    /** Follows the count: `10 ON FILE`. Zero is a number, not an absence. */
    onFile: 'ON FILE',
    /** Names the list of records for assistive technology. */
    listLabel: 'Tasks on file',
  },

  /**
   * The record — 46 px of anatomy, five slots and a sixth held open
   * (UX-DR6, UX-DR10, UX-DR12).
   *
   * Every state here is carried by a word as well as by an ink, which is the
   * accessibility floor rather than a stylistic choice (UX-DR20): the ladder is
   * unreadable to anyone who cannot compare three bar heights, so the Priority
   * is also spelled out, and an absent Tag or due date is named rather than
   * left as a gap the reader has to interpret.
   */
  record: {
    /** No Tag is a valid outcome, not a failure (UX-DR21). `d1` says it this way. */
    noTag: 'NO TAG',
    /** The due pill, outlined, when the Task has no due date (UX-DR12). */
    noDueDate: 'NO DUE DATE',
    /**
     * The Priority words, beside the ladder. Lowercase in the data, uppercase
     * on screen because apparatus type is uppercase (UX-DR3) — the casing is
     * the type style's, and `Priority` itself is still exactly `high`,
     * `medium` or `low`.
     */
    priority: {
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
    },
  },

  /**
   * First run — the only empty state in the product (UX-DR22). Every other list
   * that would be empty reports a count of zero instead, which is why no other
   * surface needs copy like this.
   */
  firstRun: {
    /** The state of the file, stated as a fact. */
    state: 'NOTHING ON FILE YET',
    /** The count beside it. Zero is a number, not an absence. */
    count: '0 TASKS',
    /** The 19px display line — the one place the product speaks at size. */
    display: 'Say it the way you would say it out loud.',
    /** What happens after you type, in two lines of prose. */
    prose: [
      'The app files it at once, then sets a course over it:',
      'three controls for you to punch, change or strike.',
    ],
    /** What is true before anything is configured, which is everything. */
    offline: 'WORKS OFFLINE · NO ACCOUNT, NO KEY, NOTHING TO SET UP',
  },

  /**
   * The recovery panel (AD-20). The single exception to "no error state, ever":
   * it is not a failure *of* a flow, it is the floor under it. No stack trace,
   * no apology, no blank page — a fact, what is still true, and a way back.
   */
  recovery: {
    heading: 'THIS SCREEN STOPPED',
    body: 'Nothing was lost. Your tasks are still on this device, exactly as you left them.',
    action: 'BACK TO TODAY',
  },

  /**
   * Calendar words for the header date, handed to the pure formatter in
   * `core/localdate.ts` — Monday first, January first.
   */
  dates: {
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    months: [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ],
  } satisfies DateNames,
} as const;
