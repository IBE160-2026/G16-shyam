# Margin

## Thesis

A suggestion is not a chip row under a task. It is a set of marks in the margin, each one
bracketed back to the exact words that caused it, waiting to be set, amended or struck. The
mechanism is a proofreader's galley: two hands, two inks — the reader who marks, the author who
disposes. That gives the product the one thing a chip row cannot: **the user can see why each part
was proposed**, because the lead line points at the evidence. What it refuses is the category's
edge-to-edge list with suggestions stacked beneath it in the same measure. Here the task block is
held deliberately short and the review gets real margin beside it.

## World

**Palette.** Stock `#F4F0E6` — a worked, warm proof paper with a faint tooth, never `#fff` and
never grey. `#FBF8F1` for inputs (a fresh leaf), `#EFEADC` for shell (rail, tab bar). Iron
`#1A1917` is reserved for the user's own words: task text is set in iron and the app never rewrites
it. Vermilion `#B3261E` means one thing only — **proposed, awaiting your disposal**. Blue pencil
`#2B4C8C` means **the author's hand**: a value you accepted, and where you currently are
(selection, focus, active list). Graphite `#5C564B` is apparatus and struck marks. Hairlines
`#C4BCA7`. Contrast on stock: iron 15.4:1, graphite 6.4:1, vermilion 5.7:1, blue 7.3:1 — every
text/background pair verified over 4.5:1, including small apparatus on the washes.

**Type.** Spectral sets everything the user wrote or is being asked to approve — task text, mark
values, prose. Archivo, 8.5–11px, uppercase, letterspaced 0.10–0.16em, tabular numerals, carries
all apparatus: part names, engine attribution, dates, counts, states. Nothing the machine says is
set in the text face; nothing the user said is set in the apparatus face.

**Density.** The block is small, the margin is wide. On desktop: 232px rail, a 520px task measure,
a 380px margin, and the apparatus hangs in that margin, overlapping the block's edge with its
braces. Rows are tall and the measure never grows to fill the window.

## Signature move

**Marks bracketed to their span.** On `d2`–`d4`, hairline rules sit under *assignment* and *IBE160*
and lead out to the Tags mark; a rule under *Submit* leads to Priority; a bracket pair embracing the
whole line leads to Summary. The lead takes the mark's state colour, so a glance reads which parts
are live. The same brackets appear in miniature on `m9` as the first-run legend, on `m6`/`d5` as the
blue bracket on each set field, and as margin braces grouping Smart List rows on `d1`, `d6`, `d7`,
`d8`.

## Accept / edit / reject

Each mark is its own block carrying part name, engine, the bracketed span, the proposed value, and
three equal standard buttons: Accept, Edit, Reject — same size, same weight, always visible, never
behind a disclosure (`m3`, `d2`). Accept all / Reject all sit apart, in outline, at the foot of the
margin, labelled as shortcuts. Edit opens a standard segmented control in place (`m4`, `d3`) and
writes your pick, not the proposal. An accepted mark turns blue, is set into the line's field table,
and offers **Undo** with a drawn arrow (`m5`, `d4`). A struck mark stays in the margin in graphite
with a strike through it, and the field's note says the old value stands. The field table above the
marks shows the three current values at all times, so "accepting writes only that part" is legible
rather than promised. Priority carries a drawn chevron mark plus its word; engine provenance carries
a drawn table glyph (Rule) or star glyph (Model) plus its name — neither is colour-only. Past due
uses a diamond and the words "past due", not vermilion, which belongs to proposals alone.

## 360 and 1280

At 360 there is no margin, so the bracket rotates. A 28px stem gutter runs down the left of the
sheet; each span's rule drops into its own lane in that gutter and turns in to its mark below, and
each mark re-sets its span as a quoted fragment under the same hairline rule — so the connection
survives even if the eye loses the lead. Marks stack full width beneath the line in part order.
At 1280 the leads turn right into true margin and the marks sit beside the sentence. Same
apparatus, rotated 90°, not a reflow: the phone version is a column proof, the desktop version a
galley.

## Honest risk

This is the closest of the five to what any model ships for a document-ish tool: warm ground, text
serif, red accent, editorial register. That destination is well worn and a reviewer may read it as
tasteful default rather than a decision. What earns it is load-bearing: the red is not an accent, it
is a state with one meaning; the brackets are real geometry pointing at real spans, which is the
rubric's "show why" requirement drawn rather than described. The genuine cost is upkeep — every new
field needs a span to bracket to, and a suggestion whose cause is diffuse (`Figure out the thing`)
has nothing to point at, so the apparatus must degrade gracefully. And the wide margin spends
desktop space that a denser product would fill with tasks.
