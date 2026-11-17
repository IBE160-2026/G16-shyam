---
version: 1
slug: "product-md"
primary_target: "PRODUCT.md"
related_targets: []
---

## Direction contract

THESIS: The user's sentence and the engine's proposal stay two objects on screen, and the proposal
is laid *over* the record rather than mixed into it — orienteering's course layer over terrain, which
is the same rule as the app never rewriting what you typed. It refuses the category default where a
suggestion arrives as an inline chip row inside the task, because once the proposal sits inside the
record nothing on screen says it is not yours yet.

OWN-WORLD: ISOM orienteering inks, each doing one job. Chrome (rail, header, tab bar) map-margin
paper `#EDE4D3`; work area runnable ground `#FCFBF8`; fields `#FFFFFF`, because white means settled.
Terrain ink `#1B1915`, secondary `#5C5345`. Contour brown `#CBB08E` hairline / `#9B6B3F` emphasised,
as rules only — never a drawn map. Open yellow `#F2CB5A` = the due-this-week window. Thicket olive
`#4E7033` = Need Attention, nowhere else. Marsh `#6BA3D6` / `#1F5878` / `#E2EEF7` = the inert: the
archive, and an engine not in use. Course purple `#8E2E7E` with wash `#F8EAF4` is reserved absolutely
for a proposal not yet accepted. Barlow Condensed 700 for control numerals, band labels, nav and all
apparatus; Archivo 400–600 for task text and body; tabular figures on every date and count. 22px band
rows, 46px mobile records, hairlines instead of card edges, no nested boxes, standard web controls
throughout.

STORY: The visitor opens the app cold and trusts three lists they never built. They type one
sentence; it is filed before anything is proposed. A purple course appears over the record carrying
three numbered controls. They punch the ones that are right, edit the one that is not, strike what
they do not want — each on its own, each reversible — and the record fills in the terrain's own ink
while the purple leaves. They understand that structure was offered, not imposed, and that the free
on-device engine is the real product rather than a fallback.

FIRST VIEWPORT: Today. Map-margin header with the app name and the reference date; capture field and
a solid Add button directly under it; a small readout line stating the reference date and the count
on file. Then three band-headed lists in their own inks — Due this week (yellow band), Need Attention
(olive band, olive past-due pills), High priority — each a column of 46px records carrying checkbox,
sentence, tag patch, priority bar-ladder and due pill. The published ink legend closes the screen. At
1280 the same material becomes a left nav rail of derived lists plus a two-column mosaic, with the
legend as its own module. Primary action is the capture field, top left, above everything.

FORM: The course layer over the terrain — candidate 6 of my ordered grounded list, dealt as a catalog
challenger (`notation-diagram-systems-orienteering-map`) that won both axes, then pinned by the user
in `decisions.md` as the overall design. Round 2 resolved the remaining variable — how the borrowed
frame structures reconcile with the punch mechanic — in favour of keeping the course a separate
layer. seed: 936505b7939c1812

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance

## Scope

Surface: the whole To-Do-List application — one responsive web app, PWA-installable, 17 surfaces.
Visitor mode: Operate. Build path: code-led (an Operate surface builds in code whatever the project
records). No app code exists yet; the stack is undecided and belongs to `bmad-architecture`.

Audience: a student juggling four contexts on a phone between classes, and a course grader on a fresh
clone with no API key. Task: capture a sentence without categorising it, and review three separable
pieces of proposed structure. Proof: a committed Fixture and a harness that scores both engines.

## Chosen direction and memorable moment

Concept 06 "Kurs", locked 2026-11-17. The memorable moment is punching a control: the circle fills
with ink, pin-pricks appear, the value settles into the record above, and the purple leaves that part
of the task.

Per-frame structure is the user's, recorded in `.docs/planning-artifacts/ux-designs/decisions.md`:
`m1`/`m5`/`m8` from 01 Date Due, `m2`/`m6`/`m7` from 05 Tett, `m3`/`m4` from 03 Kartet, `m9` a mix;
desktop `d1`/`d2`/`d4`/`d7`/`d8` from 05 Tett, `d3`/`d5`/`d6` from 03 Kartet.

## Unresolved decisions

- Interface language. The PRD fixes task text as English and calls the interface language a separate,
  unanswered question. Frames render English; Settings states the question on screen.
- Accessibility conformance standard. Nothing is named beyond NFR-4's 360px and 1280px. Frames hold
  4.5:1 on body text; AA is not committed.
- Whether priority and engine provenance may ever be carried by colour alone. Frames assume not, and
  publish a legend saying so.
- `d5` may also be built from 01 Date Due; the user flagged it as an alternative and it is not drawn.
