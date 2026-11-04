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
| `--ui-accent`, `--ui-on-accent` | The one highlighted thing, and text on it | `--uipack-accent`, `--deck-accent`, `--web-accent` |
| `--ui-accent-surface` / `-ink-2` / `-line` | The deck's accent-tone slide | `[data-tone="accent"]` |
| `--ui-flow-request` / `-response` / `-change` | Flow tokens, always paired with a shape. Each style keeps them in its own palette (Graphical: ink, warm grey, orange text tone; Landing: slate request), so a figure on its page never carries another style's blue | `--uipack-token-*` |
| `--ui-data-pos` / `-neg` / `-context` | Signed values (with a sign or arrow) and the context grey | `--uipack-cx-good`, `-bad`, `-context` |
| `--ui-data-1` … `-4`, `--ui-on-data-1` … `-4` | Categorical slots and the label on each | `--uipack-cx-s1` … |
| `--ui-inv-paper` / `-surface` / `-ink` / `-ink-2` / `-line` / `-accent` | The invert variant inside the style (deck `invert`, `tone="ink"`) | `[data-tone="ink"]`, the web quote card |
| `--ui-band-fill` / `-ink` / `-ink-2` / `-cta`, `--ui-on-band-cta`, `--ui-band-pattern` | The web closing band (`ClosingCta`): its ground, text, button and pattern | `--web-band-*` |

**Type, shape, motion and scalars**

| Role | Means |
| --- | --- |
| `--ui-font-display` / `-text` / `-label` | The three faces |
| `--ui-display-weight` / `-tracking` / `-case`, `--ui-display-scale` | How the display face is set; Graphical sets caps at 1.3× |
| `--ui-label-tracking` | Tracked caps for eyebrows and labels |
| `--ui-em-style`, `--ui-em-color` | The emphasised phrase in a display headline (Landing italic, others the accent) |
| `--ui-radius` / `-sm` / `-xs` / `-pill` | Container, inner box, mark, control |
| `--ui-stroke`, `--ui-rule-width` | SVG line weight, CSS rule weight |
| `--ui-density`, `--ui-type-ratio`, `--ui-measure` | Scalars a style may own: spacing scale, type ratio, line length |
| `--ui-ease-settle` / `-travel`, `--ui-dur-quick` / `-base` / `-slow` | Motion feel |

**Ornament slots.** A layout leaves named slots; a style paints them. They never take space or
move a box, which is why a swap keeps every region in place (`src/web/web-styles.css`).

| Slot role | Painted where | Technical | Landing | Graphical |
| --- | --- | --- | --- | --- |
| `--ui-backdrop`, `--ui-backdrop-mask` | Behind the hero | Dotted grid, faded | None (grain and aurora are components) | Accent disc, ring, ink tick band |
| `--ui-backdrop-narrow` | Behind the hero below 720px | The same grid | None | A 48px disc in the corner, no ring, so it clears the copy |
| `--ui-marker-size` / `-shape` / `-color` | Hung before each eyebrow | 8px square, 2px radius | None | 12px accent disc |
| `--ui-section-index` | `inline` or `none`: each `Section` eyebrow's number, counted down the page | `01 / HOW IT WORKS` in mono | None | None |
| `--ui-corner-marks` | Background layers on quiet cards, plans and the quote | 10px accent registration marks at two corners | None | None |
| `--ui-section-rule` | Top edge of each section | 1px soft line | None | 2px ink |
| `--ui-frame-border`, `--ui-frame-shadow`, `--ui-card-shadow` | Cards and framed windows | 1px line, flat | Hairline, soft shadow | 2px ink, hard 6px offset |
| `--ui-nav-fill`, `--ui-nav-blur` | The sticky nav | Paper at 94% | Glass, 14px blur | Solid paper |
| `--ui-grain`, `--ui-glow`, `--ui-star-fill` | Ambient depth switches (0 or 1) | 0 | 1 | 0 |
| `--ui-cta-shadow(-hover)` | The primary button | None | Accent glow | Hard ink offset |
| `--ui-band-*` | The closing band | Ink band, mint button, faint dotted grid | Indigo-black band, lavender button, one soft glow | Signal-orange band, black button, ink tick rule along the top |

**Every style fills every role.** A few roles have Technical values tuned for one medium
(`--ui-node`, `--ui-line-solid`, `--ui-inv-node`, `--ui-accent-ink`, `--ui-data-neg-ink`,
`--ui-slide-font-*`, `--ui-web-font-*`, `--ui-alert`, `--ui-warn`); Landing and Graphical fill them
too, mostly by pointing at a core role.

**Component tuning is not a role.** `--tune-*` values are Technical's hand-tuned colours for one
component: Mechanism tones (`--tune-mech-*`), the Studio stage (`--tune-object-*`), the docs entry's
palettes (`--tune-docs-*`), slide ink and rules (`--tune-slide-*`), print (`--tune-print-*`) and
the full-screen letterbox. A component reads one as `var(--tune-x, <a mix of core roles>)`, so any
other style gets the derivation, and every style host resets them so they never leak.

A role keeps its meaning across styles. Landing's accent is indigo, Technical's forest and
Graphical's signal orange, but in each it marks the single thing that matters. A style may not add
a second accent.

## The styles

| Style | For | Character | Values | Guide |
| --- | --- | --- | --- | --- |
| **Technical** (default) | Diagrams, charts, article parts, decks, the shell, and web pages | Warm paper, near-black ink, forest/mint accent, thin lines, 6px radius, system type in figures and IBM Plex on slides and the web; on the web a page leads with a working diagram | `src/styles/technical.css` | Below |
| **Landing** (generic landing) | A conventional SaaS landing page, for a conventional marketing page | Neutral page, lavender band, indigo CTA accent, Instrument Serif headlines, 16px cards, glass and grain | `src/styles/landing.css` | [Web principles](../web-principles.md) |
| **Graphical** | Posters, launches, a page that should be loud | Bone paper, black ink, one signal-orange accent, Anton display caps, hard edges, 2px rules, hard offset frames, one disc motif | `src/styles/graphical.css` | [Web principles](../web-principles.md) |
| **Mechanism** | One isometric machine whose working is the point | Technical palette mapped to four solid tones (`--tune-mech-*`), one lit part | `src/mechanism/mechanism.css` | [Mechanism](../mechanism.md) |
| **3D art directions** | Object scenes | Studio (reads `--tune-object-*`), Paper worlds, Kinetic, Cartoon, Realistic, Abstract | `src/objects/*` | [Object scenes](../objects.md) |

Set a style with the `uiStyle` prop (`Figure`, `DeckPlayer`, `SlideStarter`, `WebSurface`, `Section`)
or `data-ui-style` on any element; the nearest one wins. `uiStyles` in `uipack` lists the three
swappable styles with their fonts, the face to preload and their own web section order (used only when a page opts in with `WebPage layout="style"`).

### Technical values

| Role | Light | Dark |
| --- | --- | --- |
| paper (page) | `#f6f5f1` | `#0a100d` |
| surface (figure, card) | `#ffffff` (deck nodes `#fbfaf6`) | `#0e1512` / raised `#14201b` |
| ink | `#1a1c1a` | `#e8ece9` |
| ink-2 | `#5c625e` | `#9aa39e` (deck `#aeb8b2`) |
| line | ink at 22% (`--uipack-border`), grid at 16% | the same ratios on pale ink |
| accent | forest `#205f49` | mint `#71dcb2` |
| flow request (square) | `#4f6fe6` | `#8ea4ff` |
| flow response (circle) | `#3fb27f` | `#5fd39b` |
| flow change (diamond) | `#9a63e0` | `#c39aff` |
| highlighted path | accent **ring** (hollow, so it never reads as a request square) | |
| data positive / negative | `#1a7a52` / `#c0482f` | `#33a979` / `#d4623f` |
| data categorical | `#1a7a52 #4f6fe6 #c27a1f #9a63e0` | `#33a979 #5f7fef #c0832b #9f72e6` |

The red is a data colour only: a falling bar, a down delta, always with a sign or an arrow. It is
never a status colour, an accent or decoration.

### Landing and Graphical values

| Role | Landing light / dark | Graphical light / dark |
| --- | --- | --- |
| paper | `#f7f7f4` / `#0d0d13` | `#f1eee6` / `#121212` |
| surface | `#ffffff` / `#16161f` | `#fbfaf6` / `#1b1b1b` |
| surface-2 | `#ebe9f4` / `#1e1c2e` | `#e6e1d3` / `#262420` |
| ink | `rgb(18 18 23)` / `rgb(242 242 247)` | `#111111` / `#f1eee6` |
| ink-2 / ink-3 | ink at 87% / 66% | `#363532`, `#57554f` / `#cfcbc0`, `#a29e93` |
| line / line-soft | ink at 24% / 12% | solid ink / ink at 22% |
| accent | `#4b3fd6` / `#a99dff` | `#f24a00` / `#ff6a26` (as small text `#b23700` / `#ff7f45`) |
| on-accent | `#ffffff` / `#0d0d13` | `#111111` |
| radius | 16px cards, 12px panels, round pills | 0 everywhere |

Both keep Technical's flow hues (Graphical darkens two for its bone paper) and its data colours.

### Type roles

| Style | Display | Text | Label |
| --- | --- | --- | --- |
| Technical (figures, charts, article, shell) | Text face at 650–700 | System sans | System mono, tracked caps 0.08em |
| Technical deck | IBM Plex Sans 650, −0.02em (when the host provides it) | IBM Plex Sans | IBM Plex Mono, tracked caps 0.14em |
| Technical web | IBM Plex Sans 600 (`--ui-web-font-*`) | IBM Plex Sans | IBM Plex Mono |
| Landing | Instrument Serif 400, heading step 4 and up | IBM Plex Sans | IBM Plex Mono |
| Graphical | Anton 400 in caps, 1.3× from heading step 4 | IBM Plex Sans | IBM Plex Mono, tracked 0.12em |
| Mechanism | n/a (no words in the drawing) | Host sans | Mono caps, at least 11px, card corners only |

Figures make no font requests. Fonts are self-hosted, latin-only woff2 in `uipack/fonts/*`
(`src/web/fonts.css`), each with a metric-matched local fallback, and a browser fetches a face only
when the active style uses it: Technical web 5 files (101 KB), Graphical 6 (119 KB), Landing 7
(143 KB). Preload only the active style's display face (`uiStyles[].preload`): none for
Technical, Instrument Serif for Landing, Anton for Graphical. Use a style's own faces and never
add a new one. A different face is a new style, or a documented override hook (`--web-font-display`).

### Shared finish rules (every style)

- **One accent**, on one thing per unit.
- **Glow means selection.** It is never ambient. The one exception is a drillable node's soft glow
  ([Design direction](../design-direction.md)).
- **Hierarchy by weight and opacity**, not by more hues. Text at 100 / 87 / 66% of one ink.
- **Contrast** of at least 4.5:1 for small text and 3:1 for large, in both themes.
- **Radius scale**: one container radius per style (Technical 6px, Landing 16px cards), 4px for
  inner boxes, 2px for marks.
- **Texture is optional and quiet**: grain 4–8%, grid lines 8% ink, dots 20% ink. One ambient
  effect per viewport.

## Diagrams

The diagram style card. Every figure, preset, chart and article part follows it. Values are in SVG
user units for a `viewBox` drawn at about its rendered width.

| Element | Rule |
| --- | --- |
| Frame | `Figure` card: mono eyebrow `FIGURE 01 · TOPIC`, title (20 / 600), one-line caption, legend, Pause / Replay top-right; 1px border at 22% ink, 6px radius |
| Canvas | Surface fill, optional dotted grid at 16% ink; no inner frame |
| Node | 6px radius, surface fill, 1.25 stroke at 70% ink (accent at 100%); label 13 / 600, optional mono sub-label at 75%; optional icon slot |
| Group | Solid: 6px radius, 60% fill, 80% stroke. **Dashed** (an environment, a boundary, an async region): 10px radius, `4 4` dash at 40%; tracked-caps title inside, top-left |
| Lane | Mono uppercase header (11), `2 6` dotted divider at 15% |
| Chip | 24 tall, pill (or 4px "tag"), 10px label; filled chips are a 28% (dark) wash |
| Connector | 1.25 stroke, orthogonal (straight or one bend), **one arrowhead at the end, in the request direction**; `5 4` dash means async; stops 2 short of a border, 4 at the head end |
| Response | The same path ridden backwards by a reversed packet, never a second arrowhead. Two relations between the same boxes are two connectors 16 apart. Fan-in uses `Bus` with a junction dot |
| Packet | The flow's shape (square request, circle response, diamond change) in its colour, 1.5 page-colour outline; only on the claim's flows, one kind per direction |
| Accent | The claim's path only: nodes, connectors and packets share one `flow` id so hover traces it |
| Type floor | 11 CSS px rendered (`Figure minFont`); below that, author a narrow drawing |
| Legend | Shape-coded tokens; prefer writing `async · queue` on the line over a legend entry |

Data charts (`uipack/charts`, consulting charts) use the same node spec: warm fill, 1.25px edges at
70% ink, 6px radius, tracked caps labels, dashed groups, square legend swatches, flat bars, no outer
frame.

## Slides

Slides take the Technical palette through the deck tokens and the deck's type scale. Sizes are
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
  three: paper, ink, the forest accent, IBM Plex with display type at 1.1×, thin rules, a
  dotted-grid backdrop, a square marker and a mono section index before each eyebrow
  (`01 / HOW IT WORKS`), accent registration marks on cards, and an ink closing band with a mint button.
- **Landing** is the generic landing page: neutral 60% (`#f7f7f4` / `#0d0d13`), lavender 30%
  (`#ebe9f4` / `#1e1c2e`), indigo 10% (`#4b3fd6`) for CTAs and the star only; Instrument Serif from
  step 4; text at 100/87/66% ink; 16px cards; grain and glass. Its 30 rules are in
  [Web principles](../web-principles.md).
- **Graphical** is a poster: Anton caps at 1.3×, one orange disc in the hero backdrop that returns
  as every eyebrow marker, 2px ink rules and hard offset frames, an orange closing band, no glow, no blur.

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
| Studio (default) | Physical details, soft light, close-up choreography |
| Paper worlds | Cut-paper stages, layered landscapes, pop-up architecture |
| Kinetic | Brass mechanisms, ceramic forms, suspended motion |
| Cartoon | Rounded little places, toy-like details, playful motion |
| Realistic | Tactile materials, precision details, intimate camera angles |
| Abstract | Optical glass, sculptural rhythms, unexpected silhouettes |
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
