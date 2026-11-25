import { labels } from '../labels';

/**
 * The `m9` first run surface — the only empty state in the product (UX-DR22).
 *
 * Every other list that would be empty reports a count of zero instead, which
 * is why this copy exists once and nowhere else. The voice is a fact followed by
 * what *is* happening: nothing is on file, nothing has to be set up, and here is
 * what will happen when you type (UX-DR18).
 *
 * What this surface does *not* carry is deliberate. The capture field and
 * records belong to Story 1.2; the course panel and its three controls belong
 * to Epic 2. Nothing here is purple, because purple means a proposal awaiting
 * the user and there is nothing yet to propose.
 */
export function FirstRun() {
  return (
    <section className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between gap-group-gap-min">
        <h2 className="font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary">
          {labels.firstRun.state}
        </h2>
        <p className="font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary tabular-nums">
          {labels.firstRun.count}
        </p>
      </div>

      {/* The 19px display line — set in Archivo 600, because it is the product
          speaking in the user's own register rather than as apparatus. It is
          the one place DESIGN.md spends size, and only on first run. */}
      <p className="mt-group-gap-max max-w-[220px] font-family-body font-body-strong text-display leading-[24px] text-ink">
        {labels.firstRun.display}
      </p>

      <div className="mt-group-gap-max">
        {labels.firstRun.prose.map((line) => (
          <p
            key={line}
            className="font-family-body font-body text-body leading-[17px] text-ink-secondary"
          >
            {line}
          </p>
        ))}
      </div>

      {/* Offline is the normal case, not the failure case — so it is stated at
          the foot of the surface as a plain fact about the product. */}
      <p className="mt-auto pt-group-gap-max font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink-secondary">
        {labels.firstRun.offline}
      </p>
    </section>
  );
}
