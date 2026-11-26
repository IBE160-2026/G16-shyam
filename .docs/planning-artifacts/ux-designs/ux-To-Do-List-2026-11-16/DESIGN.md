---
title: "DESIGN: To-Do-List"
status: final
stage: locked
concept: "06 Kurs"
created: 2026-11-16
updated: 2026-11-25
sources:
  - ../../prds/prd-To-Do-List-2026-10-31/prd.md
  - ../../briefs/brief-To-Do-List-2026-09-08/brief.md
  - ../../briefs/brief-To-Do-List-2026-09-08/tilbakemelding-product-brief.md
  - ../decisions.md
  - ../../../../PRODUCT.md
direction_seed: "seed:936505b7939c1812"
direction_contract: "../../../../.impeccable/surfaces/product-md.md"
reference_frames: "mockups/kurs/"
surface_mode: operate
build_path: code

colors:
  chrome: "#EDE4D3"
  ground: "#FCFBF8"
  surface: "#FFFFFF"
  ink: "#1B1915"
  ink-secondary: "#5C5345"
  rule: "#CBB08E"
  rule-strong: "#9B6B3F"
  proposed: "#8E2E7E"
  proposed-wash: "#F8EAF4"
  due-week: "#F2CB5A"
  due-week-pale: "#FAEDC4"
  attention: "#4E7033"
  attention-pale: "#E4EBD8"
  inert: "#6BA3D6"
  inert-ink: "#1F5878"
  inert-pale: "#E2EEF7"

typography:
  apparatus: "'Barlow Condensed', 'Arial Narrow', sans-serif"
  body: "'Archivo', 'Helvetica Neue', Arial, sans-serif"
  apparatus-weight: 700
  body-weight: 400
  body-weight-strong: 600
  numerals: "tabular-nums"
  scale-display: "19px"
  scale-title: "15px"
  scale-body: "10.5px"
  scale-value: "11.5px"
  scale-apparatus: "9px"
  scale-micro: "8.5px"
  apparatus-tracking-min: "0.6px"
  apparatus-tracking-max: "1.5px"

rounded:
  default: "0"
  toggle: "9999px"
  control-circle: "9999px"

spacing:
  gutter-mobile: "14px"
  gutter-desktop: "26px"
  band-height: "22px"
  record-height-mobile: "46px"
  row-height-desktop: "24px"
  rail-width: "196px"
  tabbar-height: "46px"
  header-height-mobile: "40px"
  group-gap-min: "10px"
  group-gap-max: "16px"
  field-height-min: "26px"
  field-height-max: "32px"
  button-height-min: "24px"
  button-height-max: "26px"

components:
  band: "22px section header; colour names the list; 1.2px rule-strong beneath"
  record: "checkbox · sentence · tag patch · priority ladder · due pill"
  control: "numbered circle — open (purple outline) / punched (ink fill + pin-pricks) / struck (outlined, ruled through)"
  course-panel: "purple-ruled container holding the three controls"
  start-triangle: "outlined triangle marking a task with a control still open"
  priority-ladder: "three bars filled to level, beside the word"
  engine-chip: "boxed R or M plus the engine name spelled out"
  due-pill: "due date in the ink of its window — yellow inside the week, olive past due, outlined beyond it; an em-dash, not a pill, when there is no date"
  tag-patch: "terrain-patch rectangle naming a context"
  legend: "published key for every ink and every mark"
---

# DESIGN: To-Do-List

**Token count.** Four of the 43 are ranges rather than single lengths, and each is declared as a
`-min` / `-max` pair of custom properties. **A pair counts as one token**, so the totals stand at
16 colour, 13 typography, 3 radius, 11 spacing — 43. The `uppercase` formerly carried inside
`apparatus-tracking` is not a tracking value and is not a token: it is `text-transform: uppercase`
on the apparatus type style, where the Typography section has always stated it.

Written at finish, from the built world — concept **06 "Kurs"**, locked 2026-11-17 and drawn across
17 surfaces in `mockups/kurs/`. Those frames are the reference; where this document and a frame
disagree, this document wins and the frame is the defect.

The world was chosen in two rounds recorded in `.working/concepts/`. The user pinned it in
`../decisions.md`: *«Jeg ønsker å bruke nr. 3 Kartet design for det overordnede design, dvs farger,
tekst, størrelse»* — so every value below is lifted from that concept rather than reinterpreted.

## Brand & Style

Competitive orienteering notation: the ISOM colour standard, where **the ink is the information**,
and the control description sheet that reads beside it. White means runnable forest. Olive means
impassable thicket. Yellow means open land. Blue means marsh. Over that fixed terrain rides the
**course** — purple, numbered, printed on top, and never altering the map beneath.

That is not decoration. It is the product's central promise drawn: the app never rewrites your
sentence, exactly as a course layer never edits the terrain. A proposal is purple because purple
means *not yours yet*, and it stops being purple the moment you punch it in.

The register is an instrument, not a map. **Nothing in the interface imitates a map**: no contour
drawing, no compass, no terrain texture, no north arrow. The world lends four things only — type,
palette, density, and the punch — and never the layout, the navigation model, or the controls, which
stay the standard web components a visitor already knows.

Voice is plain and non-alarming. The absence of an API key is a fact, never an error. The product
never claims the AI was right: it names which engine spoke, lets you overrule each part, and
publishes its own accuracy.

## Colors

Each ink does one job and only that job. Using one for anything else breaks the system, because the
whole claim of this palette is that colour carries meaning rather than mood.

| Token | Value | Its one job |
| --- | --- | --- |
| `chrome` | `#EDE4D3` | Map-margin paper: nav rail, header, tab bar. Never the work area. |
| `ground` | `#FCFBF8` | Runnable ground: the work area itself. |
| `surface` | `#FFFFFF` | **Settled.** Records, fields and panels where nothing is proposed and nothing is wrong. Settings with no API key is drawn on white for this reason. |
| `ink` | `#1B1915` | Terrain ink: the user's own words, accepted values, primary text. |
| `ink-secondary` | `#5C5345` | Apparatus: labels, counts, captions, explanations. |
| `rule` | `#CBB08E` | Contour hairline. Rules only — row separators, column heads. |
| `rule-strong` | `#9B6B3F` | Emphasised contour: under a band, around a record, along the rail. |
| `proposed` | `#8E2E7E` | **Course purple. A proposal not yet accepted, and nothing else, anywhere.** |
| `proposed-wash` | `#F8EAF4` | The course panel's field, at 50–55% opacity. |
| `due-week` | `#F2CB5A` | Open land: a due date inside the current week. |
| `due-week-pale` | `#FAEDC4` | That window's band tint. |
| `attention` | `#4E7033` | Thicket: past due and not completed. **Need Attention, and nowhere else.** |
| `attention-pale` | `#E4EBD8` | Its band tint and tag-patch ground. |
| `inert` / `inert-ink` / `inert-pale` | `#6BA3D6` / `#1F5878` / `#E2EEF7` | Marsh: the archive, and an engine that is not in use. |

**Measured pairs**, all above the 4.5:1 body floor: `ink-secondary` on `ground` 7.3:1 · `ink` on
`due-week` 11.3:1 · `surface` on `attention` 5.7:1 · `proposed` on `surface` 7.4:1 · `inert-ink` on
`inert-pale` 6.5:1.

The strategy is **Committed**: the chrome owns a whole field in paper, the work area another in
runnable ground, and the state inks own whole bands. This is not a grey screen with one accent.

## Typography

Two faces, both doing a job the other cannot.

- **Barlow Condensed 700**, uppercase and tracked `0.6–1.5px`, sets every piece of apparatus: control
  numerals, band labels, nav items, column heads, counts, captions, button labels, status lines. It
  is the condensed grotesque of map control numbering, and condensed width is what lets a dense
  column of labels stay legible at 9px.
- **Archivo 400–600** sets everything the user wrote or will accept: task sentences, field values,
  proposed values, body prose.

The split is semantic, not decorative: **if the app is speaking about itself, it is Barlow Condensed;
if it is showing the user's content, it is Archivo.**

Scale: display `19px/600` (first run only) · title `15–16px/700 condensed` · value `11.5px/500` ·
body `10.5px/400` · apparatus `9px/700 condensed` · micro `8.5px`. Hierarchy comes from weight,
case and tracking far more than from size, because an Operate surface cannot spend vertical space on
large type.

**`font-variant-numeric: tabular-nums` on every date, count and control number**, without exception.
Columns of dates that do not align are the fastest way to make this world look wrong.

## Layout & Spacing

- **Mobile**, 360px floor: 14px gutters, 40px header, 46px bottom tab bar, 46px task records, 22px
  bands. One column throughout.
- **Desktop**, 1280px reference: 196px nav rail in chrome, 26px gutters, a two-column mosaic in the
  work area, **24px** table rows in dense tables — raised from 21px on 2026-11-22. A table row is a
  pointer target, so WCAG 2.2 AA's SC 2.5.8 applies at 24×24 CSS px, and the spacing exception does
  not rescue it: adjacent rows' 24px circles would intersect. Density is still the point — 24px is the
  floor, not a licence to loosen the rest.
- Groups are tight inside and generous between: 10–16px between a band's last record and the next
  band. More space above a heading than below it.
- **Hairlines instead of card edges.** Rows are separated by a 1px `rule`; blocks are bounded by a
  1.2px `rule-strong`. No box inside a box, ever.
- The published **legend** closes every long surface. It is content, not chrome: it is the proof that
  nothing here is encoded by colour alone.

## Elevation & Depth

There is none, and that is a decision. This world is printed: ink on paper, one layer over another.
Depth is expressed by **overlap and offset**, not by shadow — the course panel reads as a second pass
laid over the record because it is offset and purple-ruled, not because it floats.

No drop shadows, no glass, no blur, no gradient anywhere. A surface is distinguished from its ground
by its fill and its rule, nothing else.

## Shapes

**Radius is zero on everything** — fields, buttons, bands, panels, tag patches, due pills, records.
Two exceptions, both functional: the control circle, which is a circle because an orienteering
control is a circle, and the single settings toggle, which is a pill because that is the standard web
control for a binary switch and the world never overrides a standard control's shape.

The start triangle is an outlined equilateral triangle — orienteering's start marker — and it means
exactly one thing: this task still has a control open.

## Components

**Band.** 22px section header. The colour names the list: yellow tint for Due this week, olive for
Need Attention, none for the rest. Label left in condensed caps, count right, 1.2px `rule-strong`
beneath.

**Record.** 46px on mobile. Checkbox · sentence in Archivo · tag patch · priority ladder with its
word · due pill. A start triangle at the right edge when a control is open.

**Control.** The signature. A numbered circle in three states — *open*: white fill, 1.8px purple
stroke, purple numeral. *Punched*: solid ink fill, white numeral, four pin-prick dots at the
corners. *Struck*: white fill, secondary-ink stroke, ruled through corner to corner. Controls in a
course are joined by a vertical purple leg, with a dashed leg from the record to control 1.

**Course panel.** A `proposed-wash` field at 50–55% opacity, bounded by a 1.4px purple rule, holding
the three controls. Below the record on mobile; beside it on the dedicated desktop review; a
purple-ruled table module inside the desktop mosaic.

**Priority ladder.** Three bars of rising height, filled to the level, always beside the word.

**Engine chip.** A 10px box carrying `R` or `M`, followed by the engine name spelled out.

**Due pill / tag patch.** A due date in the ink of its window — yellow inside the week, olive past
due, outlined when there is none. A tag is a terrain patch in `attention-pale` naming its context.

**Standard controls.** Buttons (solid ink for primary, outlined for everything else, purple-outlined
for Accept), text fields, selects, checkboxes, segmented controls, one toggle. All square, all
standard, all recognisable before the world is noticed.

## Do's and Don'ts

**Do**

- Reserve `proposed` purple absolutely. If something on screen is purple, it is a proposal awaiting
  the user, and if it is not that, it is not purple.
- Carry every state in a mark *and* an ink — the ladder with the word, the chip with the name, the
  triangle with the count. Publish the legend.
- Use white to mean settled. A white field is a field with nothing proposed and nothing wrong.
- Keep tabular figures on every number.
- Let the overlap do the depth.

**Don't**

- Draw a map. No contours, no compass, no terrain texture, no north arrow, no map-shaped nav.
- Use olive for anything but Need Attention, or yellow for anything but the due-this-week window.
- Add a radius, a shadow, a gradient, or a card inside a card.
- Let the course panel cover text. It overlaps rules and empty ground; it never overlaps type. (This
  was a real defect in the round-1 draft and is the single easiest way to break the concept.)
- Make Accept the path of least resistance. `Punch all` and `Strike all` are plain outline buttons
  below a rule, and the per-control actions stay equal in size and weight.
- Introduce a second display face, or set apparatus in Archivo.
