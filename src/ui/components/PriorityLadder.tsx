import { PRIORITIES, type Priority } from '../../core/task';
import { labels } from '../labels';

/**
 * Three bars of rising height, filled to the level, **always beside the word**
 * (UX-DR10, DESIGN.md Components).
 *
 * The word is not optional decoration and it is not a tooltip. Priority is
 * state, and no state in this product may be carried by colour — or by shape
 * alone — because SC 1.4.1 says so and because three bar heights are not
 * readable by anyone who cannot compare them (UX-DR20). The ladder is the fast
 * read for people who can; the word is the whole meaning for everyone.
 *
 * So the bars are `aria-hidden` and the word is the accessible content: one
 * announcement, not "3 bars, HIGH". No mockup draws the word on a 46 px
 * record — not `m1`, not `d1`'s mosaic — but `DESIGN.md`, UX-DR6, UX-DR10 and
 * AC 7 all require it, and `DESIGN.md` wins over a frame by its own rule.
 * `d1`'s dense table rows do draw it, which is where the type style comes from:
 * apparatus at 9 px in `ink-secondary`.
 */

/**
 * The three rungs, bottom-aligned and rising — `m1`'s own geometry: 2.8 px
 * wide, 3.2 / 6.4 / 9.6 px tall, 1.4 px apart.
 *
 * Written as literal class strings rather than computed from the numbers,
 * because Tailwind generates a utility only for a class name it can find in the
 * source text.
 */
const RUNGS = [
  { level: 1, height: 'h-[3.2px]' },
  { level: 2, height: 'h-[6.4px]' },
  { level: 3, height: 'h-[9.6px]' },
] as const;

/**
 * How many rungs are solid, derived from `PRIORITIES` rather than restated.
 *
 * `core/task.ts` declares the three in descending order precisely so the order
 * is spelled once; a second table here would be free to disagree with it, and a
 * ladder that disagrees about which end is `high` is drawn confidently wrong.
 * `high` is first, so it fills all three; `medium` two; `low` one — which is
 * what `m1` and `d1` draw.
 */
function filledRungs(priority: Priority): number {
  return PRIORITIES.length - PRIORITIES.indexOf(priority);
}

export interface PriorityLadderProps {
  priority: Priority;
}

export function PriorityLadder({ priority }: PriorityLadderProps) {
  const filled = filledRungs(priority);

  return (
    <span data-slot="priority" className="flex shrink-0 items-center gap-[6px]">
      <span
        data-slot="priority-ladder"
        data-level={priority}
        aria-hidden="true"
        className="flex items-end gap-[1.4px]"
      >
        {RUNGS.map((rung) => (
          <span
            key={rung.level}
            data-rung={rung.level <= filled ? 'filled' : 'empty'}
            // Filled is terrain ink — an accepted value, the user's own. Unfilled
            // is a contour hairline and nothing more: an empty rung is the
            // absence of a level, not a second state with an ink of its own.
            className={`w-[2.8px] ${rung.height} ${
              rung.level <= filled ? 'bg-ink' : 'border border-rule'
            }`}
          />
        ))}
      </span>
      <span className="font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary">
        {labels.record.priority[priority]}
      </span>
    </span>
  );
}
