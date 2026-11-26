import { describe, expect, it } from 'vitest';
import { DATE_WORDS, parseDateWord } from '../../src/core/date-words';

/**
 * FR-23's closed vocabulary, against an injected reference date (AC 1–AC 5,
 * AC 7, NFR-10).
 *
 * **Every date here is an argument.** `MONDAY` below is a literal, not
 * `clock.today()`, which is the whole point of AD-2: a test that parsed
 * `Friday` against the real today would pass on a Monday in November and fail
 * on a Saturday in March, and the failure would look like a parser bug. These
 * assertions are identical on any day, in any zone, on any machine.
 *
 * The matrix in the story's spec is reproduced row by row, because the rows
 * that matter most are the ones where the answer is *no date*: a parser that
 * guessed would be wrong occasionally and silently, and only the negative rows
 * notice that.
 */

/** Monday 2026-11-16 — the reference date the whole story is specified against. */
const MONDAY = '2026-11-16';

describe('the vocabulary', () => {
  it('is exactly what FR-23 names, and nothing else', () => {
    expect([...DATE_WORDS]).toEqual([
      'today',
      'tomorrow',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'next week',
    ]);
  });

  it('holds no weekend day', () => {
    // Saturday and Sunday are absent by definition rather than filtered out
    // later, so the exclusion cannot drift.
    expect(DATE_WORDS).not.toContain('saturday');
    expect(DATE_WORDS).not.toContain('sunday');
  });
});

describe('what it resolves to', () => {
  it('resolves today to the reference date and tomorrow to the next day (AC 2)', () => {
    expect(parseDateWord('Call today', MONDAY)?.date).toBe('2026-11-16');
    expect(parseDateWord('Call tomorrow', MONDAY)?.date).toBe('2026-11-17');
  });

  it('resolves a weekday later in the week to that day (AC 1)', () => {
    expect(parseDateWord('Submit assignment in IBE160 Friday', MONDAY)?.date).toBe('2026-11-20');
    expect(parseDateWord('Email Thursday', MONDAY)?.date).toBe('2026-11-19');
  });

  it('resolves a weekday to the reference date when that is the day (AC 3)', () => {
    // Not a week later. This is the line AC 3 exists for.
    expect(parseDateWord('Email Monday', MONDAY)?.date).toBe('2026-11-16');
    // And from the other end of the week: Friday 2026-11-20 is itself.
    expect(parseDateWord('Email Friday', '2026-11-20')?.date).toBe('2026-11-20');
  });

  it('wraps to next week when the weekday has already passed', () => {
    // Thursday 2026-11-19, asking for Monday: the next one, 2026-11-23.
    expect(parseDateWord('Email Monday', '2026-11-19')?.date).toBe('2026-11-23');
    // And from a Sunday, which belongs to the week that began: Monday is
    // tomorrow.
    expect(parseDateWord('Email Monday', '2026-11-22')?.date).toBe('2026-11-23');
  });

  it('resolves next week to the Monday of the following week (AC 2)', () => {
    expect(parseDateWord('Plan next week', MONDAY)?.date).toBe('2026-11-23');
    // From a Friday it is still that Monday — `next week` names a week, not
    // seven days.
    expect(parseDateWord('Plan next week', '2026-11-20')?.date).toBe('2026-11-23');
    // And from the Sunday that closes the week, the Monday two days on.
    expect(parseDateWord('Plan next week', '2026-11-22')?.date).toBe('2026-11-23');
  });

  it('resolves across a month and a year boundary', () => {
    // Friday from Monday 2026-11-30 lands in December.
    expect(parseDateWord('Ship Friday', '2026-11-30')?.date).toBe('2026-12-04');
    // Monday 2026-12-28: next week is the Monday of 2027.
    expect(parseDateWord('Plan next week', '2026-12-28')?.date).toBe('2027-01-04');
    expect(parseDateWord('Call tomorrow', '2026-12-31')?.date).toBe('2027-01-01');
  });

  it('names which word it matched', () => {
    expect(parseDateWord('FRIDAY report', MONDAY)?.word).toBe('friday');
    expect(parseDateWord('Plan next week', MONDAY)?.word).toBe('next week');
  });
});

describe('case, position and the span', () => {
  it('is case-insensitive and position-independent', () => {
    expect(parseDateWord('FRIDAY report', MONDAY)?.date).toBe('2026-11-20');
    expect(parseDateWord('report friday', MONDAY)?.date).toBe('2026-11-20');
    expect(parseDateWord('Report Friday please', MONDAY)?.date).toBe('2026-11-20');
  });

  it('returns the span over the untouched text', () => {
    const text = 'Submit assignment in IBE160 Friday';
    const match = parseDateWord(text, MONDAY);
    expect(match?.span).toEqual({ start: 28, end: 34 });
    // Epic 2's Summary truncation reads the user's own characters back out of
    // the sentence — not a lowercased or trimmed copy.
    expect(text.slice(match?.span.start, match?.span.end)).toBe('Friday');
  });

  it('spans both words of next week', () => {
    const text = 'Plan next week';
    const match = parseDateWord(text, MONDAY);
    expect(text.slice(match?.span.start, match?.span.end)).toBe('next week');
  });

  it('takes the first expression in the text when there are two (AC 5)', () => {
    expect(parseDateWord('today or Friday', MONDAY)?.date).toBe('2026-11-16');
    expect(parseDateWord('Friday or today', MONDAY)?.date).toBe('2026-11-20');
  });
});

describe('what it refuses to guess (AC 4)', () => {
  it('sets no date for a weekend day, an abbreviation or a plural', () => {
    for (const text of ['Saturday', 'Sunday', 'fri', 'mon', 'Mondays', 'tues']) {
      expect(parseDateWord(text, MONDAY), text).toBeNull();
    }
  });

  it('sets no date for date-like text outside the vocabulary', () => {
    for (const text of [
      'end of month',
      '15 March',
      'in two days',
      'next month',
      'this week',
      'on the 20th',
      '2026-11-20',
    ]) {
      expect(parseDateWord(text, MONDAY), text).toBeNull();
    }
  });

  it('sets no date for Norwegian', () => {
    // English only, by FR-23. `fredag` is not a near miss to be rescued.
    for (const text of ['Pay RENT på fredag', 'i morgen', 'neste uke', 'mandag']) {
      expect(parseDateWord(text, MONDAY), text).toBeNull();
    }
  });

  it('sets no date for a vocabulary word inside another word', () => {
    for (const text of ['Mondayish', 'nexti week', 'premonday', 'todays plan']) {
      expect(parseDateWord(text, MONDAY), text).toBeNull();
    }
  });

  it('sets no date for an empty or wordless sentence', () => {
    expect(parseDateWord('', MONDAY)).toBeNull();
    expect(parseDateWord('   ', MONDAY)).toBeNull();
  });

  it('returns null rather than raising on an unreadable reference date', () => {
    // core is total, and a thrown error on the capture path is not a state this
    // product has (UX-DR22).
    expect(parseDateWord('Call today', '2026-02-30')).toBeNull();
    expect(parseDateWord('Call today', '')).toBeNull();
  });
});

describe('determinism (AC 7)', () => {
  it('gives the same answer for the same arguments, every time', () => {
    const once = parseDateWord('Submit assignment in IBE160 Friday', MONDAY);
    const twice = parseDateWord('Submit assignment in IBE160 Friday', MONDAY);
    expect(once).toEqual(twice);
  });

  it('resolves every vocabulary word against a reference date it was handed', () => {
    // No clock is reachable from here at all — the lint rule under
    // src/core/** forbids it — so this is a statement about the signature as
    // much as about the answers.
    const expected = new Map([
      ['today', '2026-11-16'],
      ['tomorrow', '2026-11-17'],
      ['monday', '2026-11-16'],
      ['tuesday', '2026-11-17'],
      ['wednesday', '2026-11-18'],
      ['thursday', '2026-11-19'],
      ['friday', '2026-11-20'],
      ['next week', '2026-11-23'],
    ]);
    expect([...expected.keys()]).toEqual([...DATE_WORDS]);
    for (const [word, date] of expected) {
      expect(parseDateWord(`Do it ${word} please`, MONDAY)?.date, word).toBe(date);
    }
  });
});
