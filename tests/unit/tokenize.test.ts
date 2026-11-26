import { describe, expect, it } from 'vitest';
import { findFirstPhrase, words } from '../../src/core/tokenize';

/**
 * The shared whole-word rule (FR-23, FR-7, NFR-10).
 *
 * This module is imported by FR-23's date parser now and by Epic 2's Rule
 * Engine later, so the rule is tested here rather than through either of them:
 * a date-word test that happened to cover `Mondays` would say nothing about the
 * keyword matching that reuses the same function.
 *
 * Nothing here reads a clock or a locale. `toLowerCase` is locale-independent
 * by specification, which is why these assertions hold on a Turkish machine as
 * well — the one place a case-insensitive match usually stops being portable.
 */

/** The characters a match covered, read back out of the untouched text. */
function matched(text: string, phrases: readonly string[]): string | null {
  const found = findFirstPhrase(text, phrases);
  return found === null ? null : text.slice(found.span.start, found.span.end);
}

describe('words', () => {
  it('reports each whole word as a span over the untouched text', () => {
    const text = 'Submit assignment in IBE160 Friday';
    expect(words(text).map((span) => text.slice(span.start, span.end))).toEqual([
      'Submit',
      'assignment',
      'in',
      'IBE160',
      'Friday',
    ]);
  });

  it('keeps letters of any script together', () => {
    // The sentences this runs over are Norwegian as often as English. An
    // ASCII-only word class would split `på` and let a vocabulary entry match
    // inside the half it left behind.
    const text = 'Pay RENT på fredag';
    expect(words(text).map((span) => text.slice(span.start, span.end))).toEqual([
      'Pay',
      'RENT',
      'på',
      'fredag',
    ]);
  });

  it('keeps a combining mark with the letter it belongs to', () => {
    // The same two words, precomposed and NFD-decomposed. A browser may hand
    // over either, they are indistinguishable on screen, and without `\p{M}`
    // in the word class the decomposed form tokenizes as `pa`.
    const precomposed = 'på fredag';
    const decomposed = precomposed.normalize('NFD');
    expect(decomposed).not.toBe(precomposed);
    expect(words(decomposed).map((span) => decomposed.slice(span.start, span.end))).toEqual([
      decomposed.slice(0, 3),
      'fredag',
    ]);
    // Two words either way, and the first one is the whole word either way.
    expect(words(decomposed)).toHaveLength(2);
    expect(words(precomposed)).toHaveLength(2);
  });

  it('treats digits and underscores as word characters and punctuation as separators', () => {
    const text = 'due_by 15 March, 2026 — maybe?';
    expect(words(text).map((span) => text.slice(span.start, span.end))).toEqual([
      'due_by',
      '15',
      'March',
      '2026',
      'maybe',
    ]);
  });

  it('finds nothing in a string with no word in it', () => {
    expect(words('')).toEqual([]);
    expect(words('   — , ')).toEqual([]);
  });

  it('is not confused by being called twice', () => {
    // The module holds one regular expression with the global flag. `matchAll`
    // does not share `lastIndex`, but a refactor to `exec` in a loop would —
    // and the second call would start half way through the string.
    expect(words('one two')).toEqual(words('one two'));
  });
});

describe('findFirstPhrase', () => {
  const VOCABULARY = ['today', 'monday', 'friday', 'next week'];

  it('matches regardless of case and of position in the sentence', () => {
    expect(findFirstPhrase('FRIDAY report', VOCABULARY)?.phrase).toBe('friday');
    expect(findFirstPhrase('report friday', VOCABULARY)?.phrase).toBe('friday');
    expect(findFirstPhrase('Report Friday please', VOCABULARY)?.phrase).toBe('friday');
  });

  it('reports the span over the text exactly as it was typed', () => {
    const text = 'Submit assignment in IBE160 Friday';
    const found = findFirstPhrase(text, VOCABULARY);
    expect(found?.span).toEqual({ start: 28, end: 34 });
    // The span is over the original, not over a lowercased copy: reading it
    // back gives the user's own characters, which is what Epic 2's Summary
    // truncation needs.
    expect(text.slice(found?.span.start, found?.span.end)).toBe('Friday');
  });

  it('matches whole words only, never a substring', () => {
    for (const text of ['Mondayish', 'Mondays', 'premonday', 'nexti week', 'weeknext']) {
      expect(findFirstPhrase(text, VOCABULARY), text).toBeNull();
    }
  });

  it('matches a word at either edge of the string', () => {
    expect(findFirstPhrase('today', VOCABULARY)?.phrase).toBe('today');
    expect(matched('today!', VOCABULARY)).toBe('today');
    expect(matched('(today)', VOCABULARY)).toBe('today');
  });

  it('takes the first match in the text, not the first entry in the vocabulary', () => {
    // FR-23's "first match wins" is about what the user typed. `friday` comes
    // after `today` in the list above and before it here, and the sentence is
    // what decides.
    expect(findFirstPhrase('today or Friday', VOCABULARY)?.phrase).toBe('today');
    expect(findFirstPhrase('Friday or today', VOCABULARY)?.phrase).toBe('friday');
  });

  it('matches a multi-word entry across any run of whitespace', () => {
    expect(matched('Plan next week', VOCABULARY)).toBe('next week');
    expect(matched('Plan next  week', VOCABULARY)).toBe('next  week');
    expect(matched('Plan next\nweek', VOCABULARY)).toBe('next\nweek');
    expect(matched('Plan next \t week', VOCABULARY)).toBe('next \t week');
  });

  it('does not join a multi-word entry across punctuation', () => {
    // The two words are adjacent in the word list but belong to different
    // phrases. Matching here would set a silently wrong due date and hand
    // Epic 2's Summary a span with a period in it.
    expect(findFirstPhrase('Do it next. Week is busy', VOCABULARY)).toBeNull();
    expect(findFirstPhrase('Plan for next, week', VOCABULARY)).toBeNull();
    expect(findFirstPhrase('next-week', VOCABULARY)).toBeNull();
    expect(findFirstPhrase('next (week)', VOCABULARY)).toBeNull();
    // And a one-word entry is unaffected by punctuation around it.
    expect(matched('Call today.', VOCABULARY)).toBe('today');
  });

  it('matches a possessive but not a plural', () => {
    // The asymmetry is deliberate. The apostrophe ends the word, and
    // `Monday's meeting` names that Monday — while `Mondays` names the weekday
    // in general and no particular date, so there is nothing to resolve.
    expect(findFirstPhrase("Monday's meeting", VOCABULARY)?.phrase).toBe('monday');
    expect(matched("Monday's meeting", VOCABULARY)).toBe('Monday');
    expect(findFirstPhrase('Mondays', VOCABULARY)).toBeNull();
  });

  it('prefers the longer entry when two start at the same word', () => {
    // Nothing in FR-23's vocabulary overlaps this way; FR-7's keyword lists are
    // written by a human and will.
    expect(findFirstPhrase('Plan next week', ['next', 'next week'])?.phrase).toBe('next week');
    expect(findFirstPhrase('Plan next month', ['next', 'next week'])?.phrase).toBe('next');
  });

  it('returns null rather than raising on an empty text or an empty vocabulary', () => {
    expect(findFirstPhrase('', VOCABULARY)).toBeNull();
    expect(findFirstPhrase('Friday', [])).toBeNull();
    // An entry with no word in it can only match everywhere or nowhere.
    expect(findFirstPhrase('Friday', ['', '   '])).toBeNull();
  });

  it('does not reorder the vocabulary it was given', () => {
    const vocabulary = ['today', 'next week'];
    findFirstPhrase('Plan next week', vocabulary);
    expect(vocabulary).toEqual(['today', 'next week']);
  });
});
