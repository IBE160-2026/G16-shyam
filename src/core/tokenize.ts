/**
 * The one whole-word, case-insensitive matcher (AD-1, conventions).
 *
 * Two features need the same rule and must not each own a copy of it: FR-23's
 * date words, and FR-7's Rule Engine keywords in Epic 2. "Whole word" is the
 * kind of rule that is re-implemented slightly differently every time it is
 * written again — one place uses a regular expression with `\b`, another a
 * `startsWith`, and `Mondays` matches in one and not in the other. So it is
 * written once, here, and imported.
 *
 * **Spans, not substrings.** Every match reports where it was found in the
 * *untouched* text. Nothing in this module lowercases, trims or normalises the
 * caller's string on the way out: the product's central claim is that it never
 * rewrites your sentence, and Epic 2's Summary truncation needs to know which
 * characters a match covered, not what they looked like after a comparison.
 *
 * Pure, like everything in `src/core/` (AD-1): no clock, no locale, no
 * `Intl`. `toLowerCase` is deliberately not `toLocaleLowerCase` — the latter
 * reads the ambient locale, which would make a match depend on the machine it
 * ran on and break NFR-10's promise of identical results everywhere.
 */

/** A half-open range of character indices into the text it came from. */
export interface Span {
  /** Index of the first character, inclusive. */
  readonly start: number;
  /** Index one past the last character, exclusive. */
  readonly end: number;
}

/** A phrase from a caller's vocabulary, and where it was found. */
export interface PhraseMatch {
  /** The vocabulary entry that matched, exactly as the caller spelled it. */
  readonly phrase: string;
  /** Where it sits in the text that was searched. */
  readonly span: Span;
}

/**
 * What counts as part of a word: a letter in any script, a digit, or an
 * underscore.
 *
 * Unicode properties rather than `[A-Za-z0-9_]`, because the texts this runs
 * over are Norwegian as often as English — `fredag` and `påske` are one word
 * each, and an ASCII-only class would split the second one and let a
 * vocabulary entry match inside it.
 *
 * `\p{M}` — combining marks — is in the class for the same reason one step
 * further down. A browser may hand over `på` either precomposed (one `å`) or
 * NFD-decomposed (`a` followed by a combining ring), and the two look identical
 * on screen. Without `\p{M}` the decomposed form tokenizes as `pa`, which would
 * make a keyword match depend on how the text happened to be normalised on its
 * way in.
 */
const WORD_CHARACTERS = /[\p{L}\p{M}\p{N}_]+/gu;

/**
 * Every whole word in `text`, in order, as spans.
 *
 * Exported because the whole-word rule is useful on its own — Epic 2's Rule
 * Engine scans for keywords rather than for one closed vocabulary — and
 * because it is what makes `findFirstPhrase` a few lines instead of a parser.
 */
export function words(text: string): readonly Span[] {
  const found: Span[] = [];
  // `matchAll` requires the global flag and does not share `lastIndex` with
  // the caller, so one module-level regular expression is safe here. `exec` in
  // a loop would not be.
  for (const match of text.matchAll(WORD_CHARACTERS)) {
    found.push({ start: match.index, end: match.index + match[0].length });
  }
  return found;
}

/** The lowercase words of `text`, for comparison only. */
function loweredWords(text: string): string[] {
  return words(text).map((span) => text.slice(span.start, span.end).toLowerCase());
}

interface Needle {
  readonly phrase: string;
  readonly parts: readonly string[];
}

/** A vocabulary entry split into the words it has to match, longest first. */
function needles(phrases: readonly string[]): Needle[] {
  return (
    phrases
      .map((phrase) => ({ phrase, parts: loweredWords(phrase) }))
      // A vocabulary entry with no word in it can only match everywhere or
      // nowhere; dropping it keeps `findFirstPhrase` total on a sloppy list.
      .filter((needle) => needle.parts.length > 0)
      // Longest first, so a two-word entry wins over a one-word entry that
      // starts at the same place. Nothing in FR-23's vocabulary overlaps that
      // way today; FR-7's keyword lists are written by a human and will.
      .sort((left, right) => right.parts.length - left.parts.length)
  );
}

function matchesAt(textWords: readonly string[], index: number, parts: readonly string[]): boolean {
  if (index + parts.length > textWords.length) return false;
  return parts.every((part, offset) => textWords[index + offset] === part);
}

/**
 * Whether the words of a multi-word match are separated by whitespace alone.
 *
 * Without this, `next week` would match across a sentence boundary: `Do it
 * next. Week is busy` has those two words adjacent in the word list, and the
 * result would be a silently wrong due date with a span covering the period.
 * A separator run that is only spaces, tabs or newlines is the same phrase
 * re-wrapped; anything else is two phrases that happen to touch.
 */
function separatedByWhitespace(
  text: string,
  spans: readonly Span[],
  index: number,
  length: number,
): boolean {
  for (let step = 1; step < length; step += 1) {
    const previous = spans[index + step - 1];
    const next = spans[index + step];
    if (previous === undefined || next === undefined) return false;
    if (!/^\s*$/.test(text.slice(previous.end, next.start))) return false;
  }
  return true;
}

/**
 * The first of `phrases` to occur in `text` as whole words, or `null`.
 *
 * **First means first in the text, not first in the vocabulary** — FR-23's
 * "first match wins" is about what the user typed, so `"today or Friday"`
 * resolves through `today` because `today` is where the sentence starts, and it
 * would still do so if `friday` came earlier in the list.
 *
 * Case-insensitive, and whole words at both ends: `Mondayish` and `Mondays` do
 * not match `monday`, because the match is between words and not between
 * substrings. `Monday's` *does* match, and correctly so — the apostrophe ends
 * the word, and a possessive still names that Monday, where a plural names the
 * weekday in general and no particular date.
 *
 * A multi-word entry matches only across **whitespace**, so `next week`,
 * `next  week` and `next\nweek` all match while `next. Week` and `next, week`
 * do not: those are two phrases that happen to be adjacent.
 */
export function findFirstPhrase(text: string, phrases: readonly string[]): PhraseMatch | null {
  const spans = words(text);
  const lowered = spans.map((span) => text.slice(span.start, span.end).toLowerCase());
  const vocabulary = needles(phrases);

  for (let index = 0; index < spans.length; index += 1) {
    for (const needle of vocabulary) {
      if (!matchesAt(lowered, index, needle.parts)) continue;
      if (!separatedByWhitespace(text, spans, index, needle.parts.length)) continue;
      const first = spans[index];
      const last = spans[index + needle.parts.length - 1];
      if (first === undefined || last === undefined) continue;
      return { phrase: needle.phrase, span: { start: first.start, end: last.end } };
    }
  }
  return null;
}
