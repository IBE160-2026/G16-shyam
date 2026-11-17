# Beskrivelse

## Thesis

One sheet, read across the row. Orienteering has a second artefact besides the map — the control
description sheet, a dense coded table that tells you what each control actually is — and this
concept makes that the spine instead of the map overlay. "What the field is now" and "what is
proposed" sit on the same line, separated by an arrow, so the comparison is a glance rather than a
look back and forth between two objects. The proposal is a *column in the record's own sheet*, marked
by a purple rule down the row, not a layer floating beside it.

It is built from your decisions, with the same frame assignments as its sibling: Date Due's sectioned
list and settings (`m1`, `m8`) and its three-states-at-once review (`m5`); Tett's structure for
capture, task detail and lists (`m2`, `m6`, `m7`) and its desktop mosaic and settings (`d1`, `d2`, `d4`,
`d7`, `d8`); Kartet's review, task detail and archive (`m3`, `m4`, `d3`, `d5`, `d6`). Because the sheet *is* Tett's
table rendered in Kartet's ink, `d2` and `d4` are the same structure here — your choice of Tett for
`d4` needed no change in this concept. The difference from `06 Kurs` is where the merge resolves: here Tett's density is **native** rather than imported,
and Date Due's dated marks survive **literally**, as dated entries in a description column
(`punched Mon 16 Nov 09:14 · rule engine`) rather than being translated into a stamp.

## World

Kartet's, unchanged — you pinned it for colours, text and sizing, so every value is lifted from
`03-kartet/palette.json`. Chrome `#EDE4D3`, runnable ground `#FCFBF8`, white for settled fields,
terrain ink `#1B1915`, secondary `#5C5345`, contour brown `#CBB08E` / `#9B6B3F` for rules only. Open
yellow `#F2CB5A` is the due-this-week window, thicket olive `#4E7033` is Need Attention and nothing
else, marsh `#6BA3D6` / `#1F5878` is the inert. Course purple `#8E2E7E` is reserved absolutely for a
proposal not yet accepted — but here it arrives as a **2.4px rule down the left edge of an open row**
rather than as a panel fill, so purple marks a line, not an area.

**Barlow Condensed** 700 for control numerals, column heads, band labels and apparatus; **Archivo**
400–600 for task text and values. Tabular figures throughout, because a sheet of columns only works
when the columns line up.

Density is the sheet's: 28px desktop rows against Kurs's 46px, ruled column heads on every block,
hairlines instead of boxes, and nothing nested. More fits on one screen here, by design.

## Signature move

**The proposal is a column, and the row is read across.** Every reviewable part is one row of the
control description sheet: `# · control · in the record now · proposed · description · act`. The
description column is the concept's own invention and does real work — it carries the dated history
(`punched Mon 16 Nov 09:14`), the reason a struck row will not return, and what applying an edit
will write. An open row wears a purple left rule and a purple proposed value; punching turns the
value to terrain ink and rewrites the description with its date; striking rules the proposal through
and leaves the row in place.

The same sheet grammar runs the whole app: task detail is a field sheet plus a control-description
sheet (`m6`, `d5`), the archive is a sheet (`d6`), the lists are sheets with ruled column heads
(`m1`, `d1`), and Settings is a stack of sheets (`m8`, `d7`, `d8`).

## Accept / edit / reject

Each row carries its own `Accept` `Edit` `Reject` in its own act column — per-row action is the
default and dominant arrangement, not a disclosure. `Punch all` / `Strike all` sit below the sheet as
plain outline buttons labelled as shortcuts that do nothing the three rows cannot do one at a time.
A dedicated panel, *Why Accept is not the easy path*, states this in the product's own words on
`d2`, `d3` and `d4`.

Punching puts a real `Undo` in the act column — one step, restoring the previous value. Editing opens
a standard segmented control in the row itself with `Apply` / `Cancel`. Striking rules the proposed
value through and the description says it will not be re-proposed. All three states are legible on
one sheet at once (`m5`, `d4`).

Priority is a bar ladder beside its word, provenance is a boxed initial plus the spelled-out engine
name, past due carries the words "past due". Never colour alone, and the legend is published on the
frame.

## 360 and 1280

At 1280 a row really is one line: six columns, read straight across. At 360 a four-column sheet
cannot hold a real task sentence, so the row takes **two lines and keeps its columns** — the sentence
on the first, the coded values on the second, with the `in the record → proposed` pair sharing one
line under the control's name. The rules, the column heads and the act column survive the move; only
the wrap changes. This is the concept's real responsive answer, and the place it is most exposed.

## Honest risk

Density is the whole argument, and it is also the liability. At 1280 this concept puts more on screen
than any other in either round; at 360 that advantage inverts into two-line rows that are taller than
Kurs's, so the phone pays for the desktop's win. The description column is powerful and also the
easiest thing in the app to let rot — it is prose in a table, and prose in a table is what nobody
updates. And the purple-as-a-rule decision is quieter than a purple panel: it respects the sheet, but
a hurried user scanning a dense screen may miss that a row is still open, which is exactly the
mistake this product cannot afford.
