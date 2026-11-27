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
    /**
     * Task detail's title, and the one thing the chrome says about it.
     *
     * It has a `title` and no `tab` or `rail` because it is **not a
     * destination** (UX-DR16): it is entered from a record, so there is nothing
     * for the tab bar or the rail to offer. `m6` and `d5` both draw this word
     * in the title position, which is the whole of its presence in the chrome.
     */
    task: {
      title: 'TASK',
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
   * is also spelled out, and an absent Tag is named rather than left as a gap
   * the reader has to interpret. The missing due date is no exception: UX-DR12
   * draws it as an em-dash and names it “No due date” for a screen reader, so
   * the mark and the word are two renderings of one state, as everywhere else.
   */
  record: {
    /** No Tag is a valid outcome, not a failure (UX-DR21). `d1` says it this way. */
    noTag: 'NO TAG',
    /**
     * No due date, for the eye: an em-dash, and no pill drawn at all (UX-DR12,
     * corrected 2026-11-26).
     *
     * The approved Today frame draws the absence as a mark, and the
     * correct-course of 2026-11-26 made the four-state pill the authority. It
     * is still a string and still lives here, because the alternative is a
     * character literal in a component (AD-9). It is rendered `aria-hidden`:
     * the glyph is decorative, and `noDueDateSpoken` carries the meaning.
     */
    noDueDate: '—',
    /**
     * The same absence, for a screen reader (UX-DR12, UX-DR20).
     *
     * A second key rather than one, because the glyph and the word are
     * different strings and AD-9 forbids either as a literal in a component.
     * Sentence case, not the apparatus uppercase the pill is set in: this text
     * is never displayed, and some screen readers spell all-caps out letter by
     * letter. The same split `priority` already uses, where the data is
     * lowercase and the casing belongs to the type style.
     *
     * The wording is Story 1.2's own, restored. It is not a label on a control
     * — nothing in the record is focusable (UX-DR6, AD-17).
     */
    noDueDateSpoken: 'No due date',
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
   * Task detail — every field PRD §3 defines, read and not acted on
   * (UX-DR6, AC 2).
   *
   * **Seven rows, and the frames draw more than seven.** `m6` additionally
   * draws `PROJECT` (Tier 3, Epic 8), `CREATED` (the Task has no creation
   * field — AD-2 keeps instants out of the domain, so the row is not
   * buildable), a course table and three controls; `d5` draws the same course
   * table and an annotation under each value. Epic 2 and Epic 8 own all of it.
   * What is here is AC 2's list exactly.
   *
   * **The two frames disagree, and each supplies what the other lacks.** `m6`
   * is the only one that draws all seven as plain field rows, so **its order is
   * the order** — `d5`'s field block is four rows, with Tags, Priority and
   * Summary appearing only inside the Epic 2 course table, and it carries no
   * `COMPLETED` label at all. The wordings come from `d5` where it has one:
   * `TASK TEXT` rather than `m6`'s `THE TASK`, because it reads as a field name
   * instead of a sentence fragment, and `Not completed` rather than `m6`'s
   * `No`, because it says what `No` only implies once you have read the label.
   * `COMPLETED` itself is `m6`'s, there being no alternative.
   *
   * Every absence is **named**, never left as a gap for the reader to
   * interpret (UX-DR21) — the same rule the record's `NO TAG` already follows.
   */
  taskDetail: {
    /**
     * The section heading `d5` draws above the rows.
     *
     * Rendered at 1280 px only, because `m6` draws no such line: the mobile
     * header band already says `TASK` directly above the first row, and a
     * second heading in a 360 px column is chrome the frame does not have.
     */
    heading: 'THE TASK, FIELD BY FIELD',
    /** One label per field, in the order `m6` and `d5` both stack them. */
    fields: {
      text: 'TASK TEXT',
      dueDate: 'DUE DATE',
      tags: 'TAGS',
      priority: 'PRIORITY',
      summary: 'SUMMARY',
      notes: 'NOTES',
      completed: 'COMPLETED',
    },
    /**
     * The Priority words again, lowercase.
     *
     * Not a duplicate of `record.priority`: that one is uppercase because the
     * record sets Priority in apparatus type, and `m6` and `d5` both draw it
     * here in body type as `high`. The casing belongs to the type style, and
     * the style differs between the two surfaces, so the strings do too. The
     * `Priority` value itself is still exactly `high`, `medium` or `low`.
     */
    priority: {
      high: 'high',
      medium: 'medium',
      low: 'low',
    },
    /** Between Tags, when there is more than one. A separator is a string too. */
    tagSeparator: ', ',
    /**
     * The accessible name of each field's control (FR-3, AD-17).
     *
     * A control needs a name, and the row's `dt` is not one: a `dt` is not a
     * labelling element for a form control, so pairing them with `for`/`id`
     * would be invalid and a screen reader would announce an unnamed field.
     * These are the names, visually hidden beside each control, which is why
     * they read as instructions ("Task text") rather than as the row headings
     * they sit under.
     *
     * They are deliberately the same words as `fields` above, in sentence
     * case: the row says what the field is, and the control says the same
     * thing to someone who cannot see the row.
     */
    edit: {
      text: 'Task text',
      dueDate: 'Due date',
      tags: 'Tags, separated by commas',
      priority: 'Priority',
      summary: 'Summary',
      notes: 'Notes',
    },
    /**
     * The absences, each a fact rather than a prompt or an error.
     *
     * There is no `noDueDate` wording: a native date control takes no
     * placeholder and presents its own empty state, so the words would have
     * nowhere to be displayed — and AD-9 keeps displayed strings here, not
     * strings nothing displays. `record.noDueDate` still carries the em-dash
     * the record draws.
     */
    noTags: 'No tags',
    noSummary: 'No summary',
    noNotes: 'No notes',
    notCompleted: 'Not completed',
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

  /**
   * The same calendar words, sentence-cased, for the one place dates are set in
   * body type: Task detail's `Fri 20 Nov 2026` (`m6`, `d5`).
   *
   * A second set rather than a `toLowerCase()` at the call site, for the reason
   * `dates` exists at all — `core/localdate.ts` is handed its calendar words
   * and knows no casing rule for any language (AD-9, AD-1). A component that
   * recased a label would be deciding how English works in a file that is
   * supposed to only lay it out.
   */
  datesProse: {
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
  } satisfies DateNames,
} as const;
