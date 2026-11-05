# Style: how it looks

A style is a **token set keyed to semantic roles**. Layouts and content ask for a role (`ink-2`,
`accent`, `font.label`). A style answers with values. Swapping the style swaps the answers and
leaves the questions alone. Light and dark are two value sets *inside* one style. They are not two
styles. See [the system overview](README.md) for how style fits with writing and layout.

## The role contract

These are the roles every style must fill. They live in `src/styles/`: `roles.css` declares the
cascade layers and resets the optional roles, and each style is one value set
(`technical.css`, `landing.css`, `graphical.css`) keyed by `data-ui-style`. Technical is also the
default on `:root`. Every colour role is `light-dark(light, dark)`, so light and dark are two
halves of one value set, resolved from the element's `color-scheme`. `test/style-roles.test.tsx`
fails if a style leaves a core role out.

**Colour**

| Role | Means | Entry names that read it |
| --- | --- | --- |
| `--ui-paper` | Page or canvas background | `--deck-bg`, `--web-bg`, `--presentation-bg` |
| `--ui-surface` | Figure card and panel fill | `--uipack-bg`, `--web-surface` |
| `--ui-surface-raised` | A box raised off the surface (figure nodes, deck chrome) | `--uipack-surface`, `--deck-surface` |
| `--ui-surface-2` | Secondary band or tint, hover fill | `--uipack-surface-raised`, `--web-secondary` |
| `--ui-ink` / `-2` / `-3` | Text and strokes at three emphasis levels | `--uipack-fg`, `--uipack-muted`, `--deck-fg`, `--web-ink(-medium/-low)` |
| `--ui-line` / `-soft` | Borders and rules; grid and hairlines | `--uipack-border`, `--uipack-grid`, `--web-rule`, `--web-hairline` |
| `--ui-accent`, `--ui-on-accent` | The one highlighted thing, and text on it | `--deck-accent`, `--web-accent` |
| `--ui-accent-stroke` | The accent as a stroke or mark in a drawing (numbered-step rings, the claim's path). Technical: the accent itself, one tested amber per theme; a style whose accent fill is too light for a line on white points this at a darker twin | `--uipack-accent` |
| `--ui-accent-surface` / `-ink-2` / `-line` | The deck's accent-tone slide | `[data-tone="accent"]` |
| `--ui-flow-request` / `-response` / `-change` / `-error` | Flow tokens, always paired with a shape (`-error`: a failed or declined branch, `--uipack-token-error`). Each style keeps them in its own palette (Graphical: ink, warm grey, orange text tone; Landing: slate request), so a figure on its page never carries another style's blue | `--uipack-token-*` |
| `--ui-data-pos` / `-neg` / `-context` | Signed values (with a sign or arrow) and the context grey | `--uipack-cx-good`, `-bad`, `-context` |
| `--ui-data-1` … `-4`, `--ui-on-data-1` … `-4` | Categorical slots and the label on each | `--uipack-cx-s1` … |
| `--ui-inv-paper` / `-surface` / `-ink` / `-ink-2` / `-line` / `-accent` | The invert variant inside the style (deck `invert`, `tone="ink"`) | `[data-tone="ink"]`, the web quote card |
| `--ui-band-fill` / `-ink` / `-ink-2` / `-cta`, `--ui-on-band-cta`, `--ui-band-pattern` | The web closing band (`ClosingCta`): its ground, text, button and pattern | `--web-band-*` |
| `--ui-spot`, `--ui-on-spot` | The accent as a large flat fill (a sticker, a marked row, a lens in a drawing) and type on it. Technical and Graphical: the accent; Landing: the fluorescent pink, where `--ui-accent` is the pink printed dense enough for text | treatments, product drawings |
| `--ui-media-ground` / `-cold` / `-mid` / `-warm` / `-hot` / `-ink`, `--ui-media-ramp` | Product imagery: a four-stop tonal ramp for drawn pictures (a thermal frame, a heat map, a scan), its ground and the ink of marks over it. Technical a cyanotype (Prussian, cyan, white, amber), Graphical a poster duotone (ink, grey, orange, peach), Landing a riso duotone (plum, pink, paper) | `ProductShot`, bespoke product drawings |
| `--ui-media-filter`, `--ui-media-tint`, `--ui-media-blend` | How a photo in a `ProductShot` is printed: Technical a cyanotype (greyscale lightened over Prussian), Graphical hard greyscale, Landing a pink duotone | `ProductShot src` |

**Type, shape, motion and scalars**

| Role | Means |
| --- | --- |
| `--ui-font-display` / `-text` / `-label` | The three faces |
| `--ui-font-heading` | Small headings outside the display steps: a figure's title, a consulting slide's title. Technical: the display face, so page, slide and figure share one heading face; Landing and Graphical: the text face |
| `--ui-display-weight` / `-tracking` / `-case`, `--ui-display-scale` | How the display face is set; Graphical sets caps at 1.3× |
| `--ui-label-tracking` | Tracked caps for eyebrows and labels |
| `--ui-em-style`, `--ui-em-color`, `--ui-em-decoration`, `--ui-em-fill` | The emphasised phrase in a display headline (Landing upright on a pink highlighter pass; Graphical the accent; Technical ink over an amber underline in light, gold in dark) |
| `--ui-display-shadow` | A ghost under display type, numerals and the quote: Landing's pink drum printed a hair off register; none elsewhere |
| `--ui-radius` / `-sm` / `-xs` / `-pill` | Container, inner box, mark, control |
| `--ui-stroke`, `--ui-rule-width` | SVG line weight, CSS rule weight |
| `--ui-density`, `--ui-type-ratio`, `--ui-measure` | Scalars a style may own: spacing scale, type ratio, line length |
| `--ui-ease-settle` / `-travel`, `--ui-dur-quick` / `-base` / `-slow` | Motion feel |

**Ornament slots.** A layout leaves named slots; a style paints them. They never take space or
move a box, which is why a swap keeps every region in place (`src/web/web-styles.css`).

| Slot role | Painted where | Technical | Landing | Graphical |
| --- | --- | --- | --- | --- |
| `--ui-backdrop`, `--ui-backdrop-mask` | Behind the hero | Drafting film (12px minor, 60px major hairlines), faded downward | A halftone sun: a 9px pink dot screen fading out from the top-end corner | None (the disc is the stamp now) |
| `--ui-backdrop-narrow` | Behind the hero below 720px | The same grid |
| `--ui-canvas-pattern` | A figure's canvas (`Figure background="dots"`, the default) | The same drafting film, at 12% / 5% ink | 12px dot grid | 12px dot grid | None | A 48px disc in the corner, no ring, so it clears the copy |
| `--ui-marker-size` / `-shape` / `-color` | Hung before each eyebrow | 7px amber dot | 9px pink square | 12px accent disc |
| `--ui-section-index` | `inline` or `none`: each `Section` eyebrow's number in page order (`WebPage` numbers its sections after the hero; a section outside a `WebPage` has none) | `01 / HOW IT WORKS` in mono | None | None |
| `--ui-corner-marks` | Background layers on quiet cards, plans and the quote | 8px ink crop marks at all four corners | None | None |
| `--ui-section-rule` | Top edge of each section | 1px soft line | None (a dotted plum rule, drawn by the treatment) | 2px ink |
| `--ui-frame-border`, `--ui-frame-shadow`, `--ui-card-shadow` | Cards and framed windows | 1px line, flat | A plum keyline over a pink screen printed 6px off register, 2px corners | 2px ink, hard 6px offset |
| `--ui-nav-fill`, `--ui-nav-blur` | The sticky nav | Paper at 94% | Solid paper (a masthead) | Solid paper |
| `--ui-grain`, `--ui-glow`, `--ui-star-fill` | Ambient depth switches (0 or 1) | 0 | 0 (star fill 1) | 0 |
| `--ui-cta-shadow(-hover)` | The primary button | None (a 3px amber halo on hover) | A plum keyline that slips 3px off register on hover | Hard ink offset |
| `--ui-cta-fill`, `--ui-on-cta` | The primary button's fill and label | Prussian ink in light, gold in dark | Fluorescent pink, plum label | The accent |
| `--ui-band-*` | The closing band | Plain Prussian band (no grid: the grid is the hero's and the figure's), gold button | Solid fluorescent pink, plum type and button, a row of halftone dots along the top | Signal-orange band, black button, ink tick rule along the top |
| `--ui-stamp-*` (fill, ink, accent, border, inner, radius, rotate, face, case, size, shadow, fit, label-width) | `StarHero stamp`: the page's one measured number, on the proof's corner (split) or in the copy. `fit` is the width the figure may take and `label-width` the label's measure: a round stamp keeps its text to the inscribed square (Graphical 3.4rem and 6.5em; the square stamps 4.6rem and 9em) | A revision tag: square, ruled, amber top bar, the figure in Archivo Expanded | A riso sticker: pink, rounded, plum serif figure, its keyline printed off register, tilted 5° | A postmark: orange disc, double ink ring, Anton caps, tilted 8°, hard shadow |

**Treatment roles (web components).** Range comes from how each style draws the same parts, not
from moving them: the layout is one, the treatment is the style's. Every style fills these.

| Role | Painted where | Technical (engineering drawing) | Landing (riso print) | Graphical (poster) |
| --- | --- | --- | --- | --- |
| `--ui-density` | Section padding (vertical only) | 0.8, compact | 1.12, airy | 1 |
| `--ui-perf` | Line style of internal divisions: table rows, card and window heads, feature lists, the step rail | `solid` | `dotted` (the halftone's edge) | `solid` |
| `--ui-column-rule`, `-gap` | Top of each section's column | A dimension line: a hairline across the column with an end tick at both ends | None | None (2px full-bleed section rule instead) |
| `--ui-card-fill`, `--ui-card-pad` | Step and feature cards | Surface, 1.5rem | Surface, 1.75rem, plum keyline over an offset pink screen | Surface, 1.75rem, hard ink shadow |
| `--ui-num-*` (font, size, weight, prefix, pad, rule, color, fill, ring, box, display, bleed, gap) | `FeatureGrid numbered` | A detail bubble: the number in mono inside a 36px ink-ringed circle | A riso dot: the serif numeral on a 44px pink disc, a plum keyline printed off register | Giant Anton numeral in the accent |
| `--ui-stat-divider` | Between proof stats | 1px rule | 1px dotted rule | 2px ink |
| `--ui-quote-*` (fill, ink, ink-2, line, mark, face, weight, case, size, rule, shadow) | The proof quote | Annotation: surface, a 1px hairline frame, text face, amber quote mark | A pull quote: no card, the upright serif at 36px with the pink ghost, a pink mark | Orange poster block, Anton caps, hard ink shadow |
| `--ui-plan-featured-border`, `-ring`, `-fill` | The featured plan | Ink border, 4px amber rule along the top | Printed on the pink screen, a solid pink offset | Orange offset shadow |
| `--ui-cell-*` (fill, ink, line, peak, on-peak, off-ink, radius) | Product surfaces: table highlights, schedule cells, status chips, worked rules | Square cells on surface-2, Prussian-ink peaks | Pink screens, 2px corners, solid pink peaks | Ink-ruled boxes, orange peaks |
| `--ui-window-dots`, `--ui-window-bar` | `ProductWindow` and `DemoPlayer` chrome | No traffic lights, clear bar | No traffic lights, a pink head screen | Square dots on a tinted bar |
| `--ui-web-flow-request` | The request token of a figure on a web page | The style's flow request (cyan, the main flow) | Plum grey, so the pink stays the only loud hue | The style's flow request |

**Component treatments (per-style CSS on the same markup).** Roles change values; some parts also
change how they are drawn: pseudo content, which edges are ruled, inner padding, the face of a
column. Those live in `src/web/web-styles.css` keyed on the page's style and never move a box, change
a column count or reorder content (`e2e/style-swap.spec.ts`). A nested `Section uiStyle` gets that
style's roles but the page's treatment.

| Part | Technical: an engineering drawing | Landing: a two-ink riso print | Graphical: a poster and its tickets |
| --- | --- | --- | --- |
| `DataTable` | A drawing schedule: every cell ruled, ink frame, tinted head, item numbers `01`… | Pink head screen, names in the serif, dotted rows, the marked row printed solid pink | A stamped receipt: 4px rules top and bottom, dashed tear rows, `#1` in orange, the marked row in reverse with an orange tab |
| `WorkedExample` | A dimensioned detail on drafting film: rules as ruled callouts with numbered balloons, arrows as dimension lines, results boxed, a `NOTE` title-block cell | Rules as plum keylines with the pink screen printed 4px off register, dotted leaders ending in a pink dot, results in the serif | A receipt sum: the given as an orange ticket, ink slips with hard shadows, heavy arrows, results over a total rule |
| `ItemList` | Drawing notes: numbered `1.` in mono, values in a ruled cell | Names in the serif, pink riso dots for states | A ticket stub: heavy rules, dashed rows, values in reverse tags, stamped squares |
| `Proof` stats | A title block: ruled cells in an ink frame, label first in mono caps | Big upright serif figures with the pink ghost over a dotted rule | Anton figures under a 4px rule, labels in bold mono caps |
| `FAQ` | Each question numbered `01` | A pink square with an off-register keyline | `Q1` stamped in orange, a 3px top rule |
| `ProductShot` | A drawing sheet: an inner keyline, numbered balloon pins, Prussian tag notes, a title-block caption | A riso duotone: pink pins with a paper keyline, paper notes with a pink offset, dotted leaders | A poster plate: 3px frame, orange numbered discs, 3px leaders, reverse tags |
| Bands | Plain | The secondary band a pink halftone screen; dotted rules between plain sections | Plain, 2px ink section rules |

**Every style fills every role.** A few roles have Technical values tuned for one medium
(`--ui-node`, `--ui-line-solid`, `--ui-inv-node`, `--ui-accent-ink`, `--ui-data-neg-ink`,
`--ui-slide-font-*`, `--ui-web-font-*`, `--ui-alert`, `--ui-warn`); Landing and Graphical fill them
too, mostly by pointing at a core role.

**Component tuning is not a role.** `--tune-*` values are Technical's hand-tuned colours for one
component: the docs entry's warm palette (`--tune-docs-warm-*`), the slide rule (`--tune-slide-line`), print
(`--tune-print-*`) and the full-screen letterbox. Mechanism tones (`--tune-mech-*`), the Studio
stage (`--tune-object-*`) and the docs surfaces are optional hooks that Technical now leaves to the
derivation. A component reads one as `var(--tune-x, <a mix of core roles>)`, so any
other style gets the derivation, and every style host resets them so they never leak.

A role keeps its meaning across styles. Landing's accent is ledger green, Technical's amber and
Graphical's signal orange, but in each it marks the single thing that matters. A style may not add
a second accent.

## The styles

| Style | For | Character | Values | Guide |
| --- | --- | --- | --- | --- |
| **Technical** (default) | Diagrams, charts, article parts, decks, the shell, and web pages | Cyanotype: Prussian-blue ink on a cool white sheet, a deep-blue dark half, one amber mark, square corners and hairlines, a drafting grid on the hero and figure canvas only; Archivo Expanded headings on page, slide and figure, Archivo text, Martian Mono labels; on the web a page shows the product's real output first | `src/styles/technical.css` | Below |
| **Landing** (product marketing) | A product-marketing page that should read as considered print: neither stock SaaS, nor warm editorial, nor Technical | A two-ink risograph print: plum ink and one fluorescent-pink spot on cool off-white stock, the pink printed a hair off register (display ghosts, offset screens behind keylines), halftone dot screens for tints, upright Instrument Serif headlines with the key phrase on a pink highlighter pass, Plex Sans text, Plex Mono labels in tracked caps, 2px corners, a solid masthead | `src/styles/landing.css` | Below, and [Web principles](../web-principles.md) |
| **Graphical** | Posters, launches, a page that should be loud | Bone paper, black ink, one signal-orange accent, Anton display caps, hard edges, 2px rules, hard offset frames, one disc motif (the hero stamp) | `src/styles/graphical.css` | [Web principles](../web-principles.md) |
| **Mechanism** | One isometric machine whose working is the point | Technical's roles mapped to four solid tones (derived; `--tune-mech-*` hooks), one lit part | `src/mechanism/mechanism.css` | [Mechanism](../mechanism.md) |
| **3D art directions** | Object scenes | Studio (reads `--tune-object-*`), Paper worlds, Kinetic, Cartoon, Realistic, Abstract | `src/objects/*` | [Object scenes](../objects.md) |

Set a style with the `uiStyle` prop (`Figure`, `DeckPlayer`, `SlideStarter`, `WebSurface`, `Section`)
or `data-ui-style` on any element; the nearest one wins. `uiStyles` in `uipack` lists the three
swappable styles with their fonts, the face to preload and their own web section order (used only when a page opts in with `WebPage layout="style"`).

### Technical values

Cyanotype, chosen blind over four alternatives in the 2026-11-05 review (the earlier warm paper,
forest green and IBM Plex matched generic AI defaults). Every page is a blueprint: Prussian-blue ink,
a dark half that is the cyanotype itself, and one amber mark for the thing that matters.

| Role | Light | Dark |
| --- | --- | --- |
| paper (page) | `#f3f6f9` | `#0a2342` |
| surface (figure, card) / raised / surface-2 | `#fcfdfe` / `#ffffff` / `#e2e9f1` | `#0d2a4f` / `#12345f` / `#11315a` |
| ink / ink-2 / ink-3 | Prussian `#0b2748` / `#3d5878` / `#4b6485` | `#edf3fb` / `#acc2dc` / `#9db4cf` |
| line | ink at 26% (`--uipack-border`), grid and hairlines at 13% | the same ratios on pale ink |
| accent (fill, stroke and text: one value) | amber `#9c5700` (5.1:1 on paper, white on it 5.6:1) | gold `#f0c45a` |
| on-accent | `#ffffff` | `#0a2342` |
| on an inverted ground (the closing band, `tone="ink"`) | gold `#f0c45a` on Prussian | amber `#9c5700` on the pale invert |
| primary button | Prussian ink, white label | gold, Prussian label |
| flow request (square): the main flow | cyan `#0b77a3` | `#8fd6ff` |
| flow response (circle): the return path | green `#2b7a4b` | `#8be6ae` |
| flow change (diamond) | violet `#7048c0` | `#d2b4ff` |
| flow error: a failed or declined branch | `#c2392b` | `#ff8c7a` |
| highlighted path, numbered steps | accent **ring** (hollow, so it never reads as a request square) | |
| data positive / negative | `#2b7a4b` / `#c2392b` | `#8be6ae` / `#ff8c7a` |
| data categorical | Prussian `#0b2748`, amber `#9c5700`, cyan `#0b77a3`, slate `#5a708b` | `#edf3fb #f0c45a #8fd6ff #86a0c0` |

**One amber per theme.** The light amber leans orange (hue 33°) so it never reads olive or
mustard-brown at text size; it is the same value on the headline underline, the slide bar, step
rings and the eyebrow dot. Dark uses gold everywhere. Light pages put gold only on a dark inverted
ground, where it is the dark half's value.

**Diagram colour jobs** (fixed in every Technical figure, slide and page): the accent marks numbered
steps and the one thing that matters; request cyan is the main flow; response green is the return
path; violet is an async change; red is an error branch, always dashed or labelled. Nothing else
gets a hue.

The red is a data colour only: a falling bar, a down delta, always with a sign or an arrow. It is
never a status colour, an accent or decoration.

### Landing and Graphical values

| Role | Landing light / dark | Graphical light / dark |
| --- | --- | --- |
| paper | `#efeeea` / `#17111b` | `#f1eee6` / `#121212` |
| surface | `#fbfaf8` / `#20182a` | `#fbfaf6` / `#1b1b1b` |
| surface-2 (Landing: the pink screen) | `#f6dfe8` / `#2c1829` | `#e6e1d3` / `#262420` |
| ink | plum `#2a1736` / `#f5eef4` | `#111111` / `#f1eee6` |
| ink-2 / ink-3 | ink at 87% / 70% | `#363532`, `#57554f` / `#cfcbc0`, `#a29e93` |
| line / line-soft | ink at 34% / 15% | solid ink / ink at 22% |
| accent (text, strokes) | `#b0115b` / `#ff6aa8` | `#f24a00` / `#ff6a26` (as small text `#b23700` / `#ff7f45`) |
| spot (fills) | fluorescent pink `#ff4f9a`, plum type on it | the accent |
| on-accent | `#ffffff` / `#17111b` | `#111111` |
| radius | 2px | 0 everywhere |

**Landing's concept.** One idea: the page is a two-ink risograph print. Two drums only: plum for
type and keylines, fluorescent pink for every fill. The pink is laid down as flat screens and
halftone dots and printed slightly off register, so display type carries a pink ghost, cards and
worked rules are plum keylines with their pink screen shifted 4–6px, the step numbers are pink dots
with a keyline that misses, and the stamp is a pink sticker. Tints are dot screens (the hero's
halftone sun, the secondary band, the closing band's edge). Type is Instrument Serif set upright
(no italic: emphasis is a highlighter pass), Plex Sans text and Plex Mono labels in tracked caps.
It avoids stock SaaS (no gradients, glass, soft shadows or blue), warm editorial (no cream, forest
green or italics) and Technical (no grid, no blue, no hairline drafting). Product imagery prints as
a plum-to-pink duotone.

Both keep Technical's flow hues (Graphical darkens two for its bone paper) and its data colours.

### Type roles

| Style | Display | Text | Label |
| --- | --- | --- | --- |
| Technical (page, slide, figure, chart, article, shell) | Archivo Expanded 600 (Archivo at 112.5% width), −0.01em; also every figure and consulting-slide title (`--ui-font-heading`) | Archivo 400 / 500 / 600 | Martian Mono 400 / 600 at its narrowest width (75: a 0.6em advance, the width diagrams and controls are authored for), tracked 0.02em |
| Landing | Instrument Serif 400, heading step 4 and up | IBM Plex Sans | IBM Plex Mono |
| Graphical | Anton 400 in caps, 1.3× from heading step 4 | IBM Plex Sans | IBM Plex Mono, tracked 0.12em |
| Mechanism | n/a (no words in the drawing) | Host sans | Mono caps, at least 11px, card corners only |

Fonts are self-hosted, latin-only woff2 in `uipack/fonts/*` (`src/web/fonts.css`, carried by every
entry stylesheet), each with a metric-matched local fallback (Archivo Expanded over Arial Bold,
Archivo over Arial, Martian Mono over Courier New), and a browser fetches a face only when the
active style uses it: Technical 6 files (77 KB), Graphical 6 (119 KB), Landing 7 (143 KB). Preload
only the active style's display face (`uiStyles[].preload`): Archivo Expanded for Technical,
Instrument Serif for Landing, Anton for Graphical. Static SVG export (`uipack/static`) cannot load
web fonts and names Archivo and Martian Mono before the system stacks. Mono captions and secondary
text stay at 12px or more and 4.5:1 in both themes. Use a style's own faces and never add a new one.
A different face is a new style, or a documented override hook (`--web-font-display`).

### Shared finish rules (every style)

- **One accent**, on one thing per unit.
- **Glow means selection.** It is never ambient. The one exception is a drillable node's soft glow
  ([Design direction](../design-direction.md)).
- **Hierarchy by weight and opacity**, not by more hues. Text at 100 / 87 / 66% of one ink.
- **Contrast** of at least 4.5:1 for small text and 3:1 for large, in both themes.
- **Radius scale**: one container radius per style (Technical 0, square; Landing 4px; Graphical 0).
- **Texture is optional and quiet**: grain 4–8%, grid lines 8% ink, dots 20% ink. One ambient
  effect per viewport.

## Diagrams

The diagram style card. Every figure, preset, chart and article part follows it. Values are in SVG
user units for a `viewBox` drawn at about its rendered width.

| Element | Rule |
| --- | --- |
| Frame | `Figure` card: Martian Mono eyebrow `FIGURE 01 · TOPIC`, title in the heading face (Archivo Expanded 20 / 600), one-line caption, legend, Pause / Replay top-right; 1px border at 26% ink, square corners |
| Canvas | Surface fill with the style's canvas pattern (`--ui-canvas-pattern`: Technical's drafting film, 12px minor and 60px major hairlines); no inner frame. The grid lives here and behind the hero only, never as page wallpaper |
| Node | 6px radius inside the drawing (only the frame is square), surface fill, 1 stroke at 70% ink (accent at 100%); label 13 / 600, optional mono sub-label at 75%; optional icon slot |
| Colour jobs | Accent: numbered steps and the one thing. Request cyan: the main flow. Response green: the return path. Violet: async change. Red (`--uipack-token-error`): an error or declined branch |
| Group | Solid: 6px radius, 60% fill, 80% stroke. **Dashed** (an environment, a boundary, an async region): 10px radius, `4 4` dash at 40%; tracked-caps title inside, top-left |
| Lane | Mono uppercase header (11), `2 6` dotted divider at 15% |
| Chip | 24 tall, pill (or 4px "tag"), 10px label; filled chips are a 28% (dark) wash |
| Connector | 1.25 stroke, orthogonal (straight or one bend), **one arrowhead at the end, in the request direction**; `5 4` dash means async; stops 2 short of a border, 4 at the head end |
| Response | The same path ridden backwards by a reversed packet, never a second arrowhead. Two relations between the same boxes are two connectors 16 apart. Fan-in uses `Bus` with a junction dot |
| Packet | The flow's shape (square request, circle response, diamond change) in its colour, 1.5 page-colour outline; only on the claim's flows, one kind per direction |
| Accent | The claim's path only: nodes, connectors and packets share one `flow` id so hover traces it |
| Type floor | 11 CSS px rendered (`Figure minFont`); below that, author a narrow drawing |
| Legend | Shape-coded tokens; prefer writing `async · queue` on the line over a legend entry |

Data charts (`uipack/charts`, consulting charts) use the same node spec: surface fill, 1px edges at
70% ink, square corners, tracked caps labels, dashed groups, square legend swatches, flat bars, no outer
frame.

## Slides

Slides take the style's roles through the deck tokens and the deck's type scale. In Technical the
slide headline is Archivo Expanded, the same face as the page and figure headings. Sizes are
canvas px on the 1920×1080 canvas, so they scale with the slide.

| Text | Size / weight | Face |
| --- | --- | --- |
| Eyebrow | 24 / 600, 0.14em, caps, **accent** | label |
| Cover title | 120 / 650, −0.02em | display |
| Slide headline | 76 / 650, −0.016em | display |
| Lede | 42 | text |
| Body | 32 | text |
| Node label in a slide | 26 | text |
| Label / footer | 22, 0.1em caps, ink-2 | label |
| Hero number | 360, −0.06em | display |
| Consulting floor | Nothing under 20 (about 14px when shown at 1366 wide) | |

- A slide with an embedded figure uses the figure's diagram style unchanged. Don't restyle a
  figure to fit a slide.
- Consulting slides add the data colours above. Emphasis is the default (accent on the one bar
  that matters, a context grey on the rest). Categorical is for stacked bars and unhighlighted lines.
- Dark slides and `ink`-tone cells take the dark value set. A deck never mixes styles between slides.

## Web

Three styles paint web pages, from the same parts, the same words and the same layout:

- **Technical** is the default and the house look, and should read as the most deliberate of the
  three: an engineering drawing (Cyanotype). Prussian ink on a cool white sheet (deep Prussian blue
  in dark), one amber mark, Archivo Expanded headlines whose key phrase sits over an amber revision
  underline (gold in dark), a Prussian primary button, a drafting-film grid behind the hero only,
  a 7px amber dot and a mono section index before each eyebrow (`01 / HOW IT WORKS`), a dimension
  line over each section's column, steps in ringed detail bubbles, ink crop marks on cards, stats
  between vertical rules, the quote as a hairline annotation, a 4px amber rule on the featured plan,
  square table cells with Prussian peaks, windows without traffic lights, figures on the same grid
  with the full flow code, and a plain Prussian closing band with a gold button. The hero shows the
  product's real output (a filled rota, table or record through the product-surface parts), never
  a blank panel: a `DemoPlayer` in steps mode needs a `screen` on its last step.
- **Landing** is product marketing as a two-ink riso print (concept above), owned so it reads as
  neither Technical, nor stock SaaS, nor warm editorial: cool off-white stock 60% (`#efeeea` /
  `#17111b`), the pink screen 30% (`#f6dfe8`), fluorescent pink 10% (`#ff4f9a`) for the CTA, the
  marked row, the stamp, the step dots and the closing band; plum ink for type and keylines;
  upright Instrument Serif from step 4 with a pink off-register ghost and the key phrase on a pink
  highlighter; keylines over offset pink screens; dotted internal rules (`--ui-perf: dotted`);
  halftone screens for tints; product imagery as a plum-to-pink duotone. No glow, no glass, no
  gradient, no blue, no italics.
- **Graphical** is a poster: Anton caps at 1.3×, one orange disc that carries content (the hero
  stamp, a postmark with the page's number) and returns as every eyebrow marker, 2px ink rules and hard offset frames, an orange closing band, no glow, no blur.

All three keep one accent, 4.5:1 small text in both themes and reduced motion. A figure on a web
page takes the page's text and label faces, frame and radius, and its flows stay in the style's
palette. `/web?style=` shows the same page in each, in the same order. `?layout=style` is the
opt-in view of each style's own order ([Layout, web](layout.md#web)).

## Motion

Motion feel is part of the style, so it lives in tokens:

| Token | Value | Use |
| --- | --- | --- |
| hover | 120–160ms `ease` | colour, border, fill, opacity |
| quick | 160ms | outgoing slide, reduced-motion fade |
| base | 320ms | blocks settling |
| slow | 560ms | large moves |
| morph | 760ms | shared elements travelling |
| zoom | 1150ms | camera into a part |
| pan | 860ms | bento camera |
| entrance | about 600ms, ease-out-quint, 6px rise from 2px blur, staggered 0–240ms by position | figures scrolling in |
| settle curve | `cubic-bezier(0.2, 0.7, 0.2, 1)` | anything that arrives |
| travel curve | `cubic-bezier(0.55, 0, 0.15, 1)` | anything that crosses the screen |
| nudge | 2–3px | arrows on hover |

Hover changes stroke, fill and opacity only, never layout. A 3D style may add physical motion
(springs, exponential follow), but its UI controls still use these timings.

## 3D

A 3D art direction is a style. The scene's subject and its camera stops are writing and layout,
so the same story can be rendered in another direction.

| Direction | Character |
| --- | --- |
| Studio (default) | Product photography: one object on a seamless sweep, soft key, low lens |
| Paper worlds | Cut-card toy theatres: layered flats in a proscenium, one warm key |
| Kinetic | Brass armatures and glazed ceramic on a turned slate base |
| Cartoon | Floating toy islands, toon shading, day and night |
| Realistic | Low macro close-ups on real surfaces, grazing window light |
| Abstract | Refractive glass against colour bands, obsidian accents |
| Mechanism (SVG) | Isometric solids in four tones by facing, one lit part in the accent |

Shared 3D rules: the scene's palette maps to the four roles (`paper`, `ink`, `muted`, `accent`);
flows keep their shapes and colours; labels are crisp HTML in label type, never textured text; small
corner radii; mobile paints at 30fps at most; reduced motion shows an authored still pose.

## Where the code stands

The contract is in place:

1. `src/styles/roles.css` declares `@layer uipack.tokens, uipack.base, uipack.layout,
   uipack.ornaments` and the `--tune-*` reset; each style is one value set. Every entry's
   stylesheet in `dist/` starts with the role layer; `uipack/styles.css` is the layer alone.
2. Every entry aliases its private tokens to roles (`--deck-fg: var(--ui-ink)`). The aliases leave
   Technical's look unchanged in both themes at 1440 and 390, checked per route against screenshots.
3. `Figure`, `DeckPlayer`, `SlideStarter`, `WebSurface` and `Section` take `uiStyle`.
4. `e2e/style-swap.spec.ts` renders the same `DeckSlide[]` and the same web page in every style and
   checks the regions, columns and reading order match, with no console errors.
5. A new style is one value set in `src/styles/` plus its doc and a `uiStyles` entry. It adds a
   component only when it adds a part.

Known gaps:

- Hex literals remain in four files, each listed with its reason in `test/no-hex.test.tsx`: the
  vendored Mechanism kit, 3D subject materials, the five non-Studio art-direction stage gradients
  and two candle strokes in the object fallback.
- Component tuning (`--tune-*`) exists for Technical only. Landing and Graphical get derivations
  of their core roles for Mechanism tones, the Studio stage and docs.
- Consulting charts and bento decks in Landing and Graphical pass the swap test but have had no
  visual review; dense chart labels in Anton have not been checked.
- Only the web reads the ornament slots. Figures and slides have no backdrop or marker slot yet.
- Figures keep their own node radius in Graphical (rounded boxes inside a square frame); the
  frame, faces and flow colours follow the page.
