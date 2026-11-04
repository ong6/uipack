# Style: how it looks

A style is a **token set keyed to semantic roles**. Layouts and content ask for a role (`ink-2`,
`accent`, `font.label`). A style answers with values. Swapping the style swaps the answers and
leaves the questions alone. Light and dark are two value sets *inside* one style. They are not two
styles. See [the system overview](README.md) for how style fits with writing and layout.

## The role contract

These are the roles every style must fill. The names are the target contract (`--ui-*`); the
right-hand column shows what each existing entry calls the role today.

| Role | Means | Today |
| --- | --- | --- |
| `--ui-paper` | Page or canvas background | `--uipack-bg`, `--deck-bg`, `--web-bg` |
| `--ui-surface` | Card, node and panel fill | `--uipack-surface`, `--deck-surface`, `--deck-node`, `--web-surface` |
| `--ui-surface-2` | Secondary band or tint (Landing's 30%) | `--web-secondary` |
| `--ui-ink` | Primary text and strokes | `--uipack-fg`, `--deck-fg`, `--web-ink` |
| `--ui-ink-2` | Secondary text (sub-labels, ledes) | `--uipack-muted`, `--deck-muted`, `--web-ink-medium` |
| `--ui-ink-3` | Tertiary text (footers, metadata) | `--web-ink-low` |
| `--ui-line` | Borders, rules, grid | `--uipack-border`, `--uipack-grid`, `--deck-rule` |
| `--ui-accent` | The one highlighted thing: the claim's path, the CTA, the lit part | `--uipack-accent`, `--deck-accent`, `--web-accent` |
| `--ui-flow-request` / `-response` / `-change` | Flow tokens (always paired with a shape) | `--uipack-token-*` |
| `--ui-data-pos` / `-neg` | Signed data values (always paired with a sign or arrow) | `--uipack-cx-*` |
| `--ui-data-1` … `-4` | Categorical data slots | `--uipack-cx-*` |
| `--ui-font-display` | Big headlines and big numbers | `--web-font-display`; deck uses sans at 650 |
| `--ui-font-text` | Body, titles, labels in prose | `--uipack-sans`, `--deck-sans`, `--web-font-text` |
| `--ui-font-label` | Eyebrows, IDs, data, controls (tracked caps) | `--uipack-mono`, `--deck-mono`, `--web-font-mono` |
| `--ui-radius` / `-sm` / `-xs` | Container / inner box / mark | `--uipack-radius`, `--deck-radius(-sm)`, `--web-radius` |
| `--ui-stroke` | Default line weight in SVG units | `--uipack-stroke` |
| `--ui-ease-settle` / `-travel` | Curves for arriving and travelling things | `--deck-settle`, `--deck-travel` |
| `--ui-dur-quick` / `-base` / `-slow` | The timing scale (below) | `deckMotion` |
| 3D `paper` / `ink` / `muted` / `accent` | Numeric colours for materials | `ObjectScene palette` |

A role keeps its meaning across styles. Landing's accent is indigo and Technical's is forest, but
in both it marks the single thing that matters. A style may not add a second accent.

## The styles

| Style | For | Character | Tokens | Guide |
| --- | --- | --- | --- | --- |
| **Technical** | Diagrams, charts, article parts, decks, the shell | Warm paper, near-black ink, forest/mint accent, thin lines, 6px radius, system type | `src/theme.css`, `src/deck/deck.css` | Below |
| **Landing** | Marketing and product pages | Neutral page, lavender secondary, indigo CTA accent, editorial serif headlines, quiet depth | `src/web/web.css` | [web-principles.md](../web-principles.md) |
| **Mechanism** | One isometric machine whose working is the point | Technical palette mapped to four solid tones, one lit part | `src/mechanism/mechanism.css` | [mechanism.md](../mechanism.md) |
| **3D art directions** | Object scenes | Studio, Paper worlds, Kinetic, Cartoon, Realistic, Abstract | `src/objects/*` | [objects.md](../objects.md) |

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

### Type roles

| Style | Display | Text | Label |
| --- | --- | --- | --- |
| Technical (figures, charts, article, shell) | Text face at 650–700 | System sans | System mono, tracked caps 0.08em |
| Technical deck | IBM Plex Sans 650, −0.02em (when the host provides it) | IBM Plex Sans | IBM Plex Mono, tracked caps 0.14em |
| Landing | Instrument Serif 400, heading step 4 and up | IBM Plex Sans | IBM Plex Mono |
| Mechanism | n/a (no words in the drawing) | Host sans | Mono caps, at least 11px, card corners only |

Technical makes no font requests. Use a style's own faces and never add a new one. A different face
is a new style, or a documented override hook (Landing's `--web-font-display`).

### Shared finish rules (every style)

- **One accent**, on one thing per unit.
- **Glow means selection.** It is never ambient. The one exception is a drillable node's soft glow
  ([design-direction.md](../design-direction.md)).
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

Landing owns web pages: [web-principles.md](../web-principles.md) holds the 30 numbered rules. Its
style values in short: neutral 60% (`#f7f7f4` / `#0d0d13`), secondary 30% (`#ebe9f4` /
`#1e1c2e`), indigo accent 10% (`#4b3fd6`) for CTAs and the star only; type 16px × 1.25 with
Instrument Serif from step 4; text at 100/87/66% ink; 16px cards, 12px panels, round pills; grain
plus glass for depth. Technical web surfaces (docs, the shell) keep Technical.

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

The role contract is the target. Today each entry declares its own namespace and re-declares the
Technical values: `--uipack-*` (figures), `--deck-*`, `--web-*`, `--anatomy-*` and `--um-*`
(Mechanism), `--presentation-*`, `--sp-*` and `--ls-*` (charts), `--ua-*` (article),
`--uipack-cx-*` (consulting). So a style swap is a per-entry job, and the deck can't yet be shown in
Landing.

Migration, in order. Each step ships on its own:

1. Add `src/styles/roles.css`: the `--ui-*` roles with Technical as the default value set, and
   `[data-ui-style="landing"]` and `[data-ui-theme="dark"]` value sets.
2. Alias each entry's private tokens to roles (`--deck-fg: var(--ui-ink)`), deleting the duplicated
   hex. There should be no visual change, and the screenshot suites prove it.
3. Give `DeckPlayer`, `Figure` and `SlideStarter` a `style` prop that sets `data-ui-style`.
4. Prove the swap on the example decks: the same `DeckSlide[]` rendered in Technical and Landing,
   with identical regions and reading order (an e2e check on block boxes).
5. A new style is then one value set plus its doc, with no component changes unless it adds a part.
