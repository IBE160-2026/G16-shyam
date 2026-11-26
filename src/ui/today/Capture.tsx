import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCreateTask } from '../../app/store';
import { labels } from '../labels';

/**
 * The capture field — the product's entire claim, in one row (FR-1).
 *
 * It lives under `today/` and not in the shell. The frames carry it on Today
 * and on the review surfaces that embed Today's work area, and never on Lists,
 * Archive or Settings; EXPERIENCE.md's IA names it under Today. (The Structural
 * Seed's `shell/` entry listing a capture field contradicts its own Today entry
 * and is the weaker source.)
 *
 * Three things about it are load-bearing:
 *
 * - **It is a native `form`.** Enter submits because that is what a form does,
 *   not because of a key handler — and the button is a real `submit` button,
 *   focusable and announced, per AD-17.
 * - **There is no error state. Ever.** An empty or whitespace-only submit
 *   creates nothing, says nothing, and leaves the field focused. No message, no
 *   red, no `aria-invalid`, no shake (UX-DR22). The same is true when storage
 *   is unavailable or full: the Task is in memory and on screen, and only
 *   Settings will ever mention it (AD-6, Epic 5).
 * - **Nothing is awaited.** `createTaskFromText` returns the Task
 *   synchronously; the record is rendered from the same state update as the
 *   cleared field. That is FR-8's 100 ms met by construction rather than by
 *   measurement (NFR-1).
 */

/**
 * The `xl` breakpoint, in the unit the stylesheet actually uses.
 *
 * Tailwind compiles `xl:` to `80rem`, not to `1280px`. Spelling it as pixels
 * here would be right only at a 16 px root font size: a reader who has raised
 * their browser's default text size would cross the CSS breakpoint at a
 * different viewport width than this query does, and get the desktop layout
 * with the phone's wording, or the reverse. `rem` on both sides keeps them the
 * same breakpoint by construction.
 *
 * Exported because it is the one source for it — `tests/e2e/capture.spec.ts`
 * asks the page this exact query rather than restating a pixel width of its
 * own.
 */
export const DESKTOP_QUERY = '(min-width: 80rem)';

/**
 * Whether the viewport is the desktop one.
 *
 * The button's two labels could be two spans toggled by CSS, the way the shell
 * carries its wordmark twice. The placeholder cannot: it is an attribute, and
 * CSS has no way to write one. So the width is read once, in JavaScript, and
 * both strings come from the same answer — one source rather than a class-based
 * swap for one of them and a media query for the other.
 */
function useDesktopWidth(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = (): void => {
      setIsDesktop(query.matches);
    };
    // Read once on mount as well: the viewport can have changed between the
    // initial render and this effect, and the listener only reports changes
    // from here on.
    update();
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
    };
  }, []);

  return isDesktop;
}

export function Capture() {
  const createTask = useCreateTask();
  const isDesktop = useDesktopWidth();
  const [text, setText] = useState('');
  const field = useRef<HTMLInputElement>(null);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const created = createTask(text);
      // The field clears only when something was created, so a stray submit
      // does not quietly destroy a half-typed sentence. Focus is returned
      // either way: capture is where you are, and submitting does not navigate.
      if (created !== null) setText('');
      field.current?.focus();
    },
    [createTask, text],
  );

  return (
    <form
      data-capture="form"
      onSubmit={submit}
      // `noValidate` because there is nothing to validate: the field has no
      // constraint, and the browser's own bubble is an error state in capture.
      noValidate
      className="flex items-stretch gap-[6px] xl:gap-[8px]"
    >
      <input
        ref={field}
        data-capture="field"
        type="text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        aria-label={labels.capture.fieldLabel}
        placeholder={isDesktop ? labels.capture.placeholderDesktop : labels.capture.placeholderMobile}
        // `off` on all four: a Task is a sentence the user is writing now, and
        // a browser offering them last week's sentence is the app putting words
        // in their mouth.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // The field is `surface` white because nothing is proposed and nothing
        // is wrong — white means settled. `field-height-max` at both widths:
        // the frames draw 30 px on the phone and 32 px on the desktop, and 32 is
        // the declared end of DESIGN.md's field-height range, which is the
        // authority on geometry. The submit button takes the same height
        // because the frames draw the pair as one row; `button-height` governs
        // standalone buttons.
        className="min-w-0 flex-1 h-field-height-max border border-ink-secondary bg-surface px-group-gap-min font-family-body font-body text-body text-ink tabular-nums outline-offset-2 outline-ink placeholder:text-ink-secondary focus-visible:outline-2"
      />
      <button
        data-capture="submit"
        type="submit"
        className="h-field-height-max w-[68px] shrink-0 cursor-pointer border border-ink bg-ink font-family-apparatus font-apparatus text-body uppercase tracking-apparatus-min text-surface outline-offset-2 outline-ink focus-visible:outline-2 xl:w-[116px]"
      >
        {isDesktop ? labels.capture.submitDesktop : labels.capture.submitMobile}
      </button>
    </form>
  );
}
