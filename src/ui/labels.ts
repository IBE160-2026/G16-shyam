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
