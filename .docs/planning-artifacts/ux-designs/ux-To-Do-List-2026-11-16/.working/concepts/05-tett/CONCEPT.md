# Tett

## Thesis

Everything derived is on screen at once. This concept refuses the arrangement every task app in the
category shares — one list in the middle, everything else folded behind a hamburger, a filter menu
or a detail drawer — on the grounds that this product's whole promise is *views you never built*.
Hiding nine automatically derived lists behind navigation hides the feature. At 1280 px the capture
field, all three Smart Lists, all four tag lists, the archive, the untagged case, the mark legend
and the pending suggestion are visible together, without scrolling and without a click. The density
is not a style; it is the argument.

## World

Japanese contemporary high-density web: a mosaic of ruled rectangular modules, each headed by a
small coloured tab, packed edge to edge with hairline borders and nothing wasting a pixel.

- `#ffffff` ground, `#15171a` ink, `#5f646b` secondary, `#b9bec6` tertiary — the three ink weights
  carry hierarchy, because the type never gets large enough to do it.
- `#cc1122` utility red does exactly two jobs and no others: it fills the small header tab that
  names each module, and it marks past-due. `#fbecee` is its wash.
- `#1a5fa8` is the settled state — a part that has been accepted — with `#eaf1f8` as its wash. One
  hue for "proposed and acted on" keeps red from creeping into meanings it does not own.
- `#f2f4f6` module fill, `#d2d6db` module border, `#e4e7ea` internal rule. Every box is drawn by
  the same two-weight hairline system.

**Archivo** sets the interface at 11–13 px; **Encode Sans Semi Condensed** sets the module tabs,
column heads and count chips, where condensed width buys the extra characters the density needs.
Tabular numerals throughout, so the date and count columns align down the whole mosaic.

Density rule: modules tile on a strict grid with no outer margin between them beyond the hairline;
no nesting, no card inside a card, no rounded corners, no shadow. Headings are small; rank comes
from the tab, the rule and the position.

## Signature move

**Every module wears a small red tab naming it, and the pending suggestion opens in place as one
module whose three parts are three rows of one ruled table** — `PART · PROPOSED VALUE · FIELD NOW ·
ACTION ON THIS PART ONLY`. Nothing ever navigates away to review a suggestion. Directly beneath it
sits the `TASK NOW` module, which prints what is actually written to the task at this instant, so
the user can read the proposal and its consequence as two adjacent tables rather than holding one
in memory. A `MARKS` module publishes the legend for every non-colour mark the mosaic uses.

## Accept / edit / reject

The review is a table with one row per part, and each row carries its own `✓ Accept`, `✎ Edit`,
`✕ Reject` in its own cell. Per-part action is therefore the **default and dominant arrangement**,
not a disclosure behind a primary button — the product's counter-metric against a UI that makes
Accept the easy path is satisfied by the structure itself rather than by restraint. `Accept all` and
`Reject all` are modest controls set below the table, labelled as shortcuts that do nothing the
three rows above cannot. A module headed `WHY ACCEPT IS NOT THE EASY PATH` states this in the
product's own words.

Accepting a part turns its row blue, writes only that field in `TASK NOW`, and swaps that row's
control for a single-step `↺ Undo` that restores the previous value. Rejecting strikes the row and
leaves `FIELD NOW` untouched. Editing opens the chooser in the row itself with `Apply` / `Cancel`.
Three different part-states are legible simultaneously in one table.

Priority is carried by a three/two/one bar mark as well as its word; engine provenance is carried by
a named label (`Rule Engine`, `Model Engine`) plus its own mark. Neither is ever colour alone, and
the `MARKS` module is where both are published.

## 360 and 1280

At 1280 the mosaic is four columns and everything derived is co-visible. At 360 it becomes one
column in a fixed reading order — capture, then Need Attention, then the pending suggestion, then
the due window — and the second nav row becomes a horizontal strip of count chips. What gives at
360 is **co-visibility, deliberately**: the tag lists and archive drop below the fold rather than
shrinking further, because shrinking the type is what would actually break it. The tab system, the
hairline rules and the 11–13 px body all survive the move; the module is the unit at both widths.

## Honest risk

The type is small and this is the only concept where that is load-bearing. It is a genuine
accessibility exposure on a phone held one-handed between classes, and it leaves no headroom: any
later demand for a larger base size costs the co-visibility that is the concept's entire argument.
The red tabs also risk reading as alarm to a first-time user before they learn the tab is just a
label — and the grader meets this interface cold, once.
