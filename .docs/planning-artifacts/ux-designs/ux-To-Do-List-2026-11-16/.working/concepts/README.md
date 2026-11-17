# Concept exploration — historical record

Kept on purpose. This directory is the full record of how the visual world was chosen, across two
rounds, and it is not generated output that can be rebuilt from scratch: the five round-1 worlds came
from a roll that will never deal the same hand twice.

**Outcome: concept 06 "Kurs" was locked on 2026-11-17.** The live reference lives at
`../../mockups/kurs/`; the direction contract is at `.impeccable/surfaces/product-md.md` in the
project root. Nothing here is the current design any more — read it as evidence of the process, which
is what the course rubric weights at 30%.

## Round 1 — five worlds, 2026-11-16

Five complete visual worlds, 17 surfaces each, same content throughout, so the comparison was between
worlds rather than copy. Dealt by `impeccable concept-seed --scope direction --mode operate`
(`seed:936505b7939c1812`, assigned index 4) so the hand could not converge on the category default.

| | Concept | World | Verdict |
| --- | --- | --- | --- |
| 01 | Date Due | Library circulation: date-due slip, stamp, card pocket | the roll's lead |
| 02 | Margin | Marked-up galley proof, marks bracketed to their span | my top-ranked candidate |
| 03 | Kartet | ISOM orienteering map and control description sheet | **beat the lead on both axes — chosen** |
| 04 | Centre Rail | Wide-margin reference edition, state as printed marks | competitive |
| 05 | Tett | Japanese high-density web, everything derived co-visible | competitive |

Also weighed and not carried forward, with what was taken from each: an interactive type specimen
(declined — its live-readout discipline went into Date Due), a vertical video feed and a jet-age
ticket wallet (held back). The category standard played straight was offered as a standing exit and
not taken.

Gallery: `index.html`. Per-concept pages: `0*/concept.html`.

## Round 2 — two ways to build the chosen design, 2026-11-17

The user pinned Kartet's world and a per-frame layout mix in
`../../decisions.md`. A pinned direction beats the roll, so no new roll was run. What the decisions
did **not** settle was how the borrowed frame structures reconcile with Kartet's punch mechanic, and
that became the axis between the two:

| | Concept | How the merge resolves |
| --- | --- | --- |
| 06 | **Kurs** | The course stays a separate purple layer laid over the record. Imports keep their skeletons and lose their own state vocabulary. **Chosen.** |
| 07 | Beskrivelse | The control description sheet is the spine; the row is read across, proposal as a column. |

Gallery: `round-2/index.html`. Both share `round-2/world.py`, which carries Kartet's palette and
faces lifted from `03-kartet/palette.json`.

## How to regenerate

Concepts 01, 06 and 07 are generated from `gen.py` in their own directories — edit the generator, not
the SVGs. Concepts 02, 03, 04 and 05 were hand-authored and have no generator.

```
uv run python <concept>/gen.py                       # redraw its 17 frames
uv run python build-concept-page.py <slug>           # rebuild that concept's page
uv run python verify.py <slug>                       # render contact sheets to .verify/ and look
uv run python build-gallery.py                       # round-1 gallery
uv run python round-2/build-gallery.py               # round-2 gallery
```

`.verify/` holds rendered contact sheets and is disposable.
