# Style contract

The style contract is the role contract every style fills: what every site spec must define, what each role means and
which entry names read it. This is a core rule: it holds no site's values. Each website has one spec that fills it
([how to write a spec](../specs/README.md)); a value shown here as an example is labelled as
coming from the [Technical spec](../specs/technical.md), the package's default look.

A style is a **token set keyed to semantic roles**. Layouts and content ask for a role (`ink-2`,
`accent`, `font.label`). A style answers with values. A different style gives different answers and
leaves the questions alone. Light and dark are two value sets *inside* one style. They are not two
styles. See [the system overview](README.md) for how style fits with writing and layout.

UiPack renders a spec's look once its values are one value set in `src/styles`, registered in
`uiStyles` and tested ([building a style from a spec](../specs/README.md#building-a-style-from-a-spec)).
Today that is Technical alone. What a spec may choose, and what holds for every site, is in
[What a spec may set](spec-settings.md).

## The role contract

These are the roles every style must fill. They live in `src/styles/`: `roles.css` declares the
cascade layers and resets the optional roles, and each style is one value set keyed by
`data-ui-style` (today only `technical.css`, Technical, the default on `:root`). Every colour role is `light-dark(light, dark)`, so light and dark are two
halves of one value set, resolved from the element's `color-scheme`. `test/style-roles.test.tsx`
fails if a style leaves a core role out, and `scripts/check-spec.ts` fails a spec that gives one
neither a value nor a `TODO:`.

Every colour role below, live from this site's own value set in both halves: Technical's values in
light, the docs site's charcoal ground and neutral inks in dark ([its spec](../specs/docs-site.md#role-values)):

```uipack-demo role-swatches wide
The colour roles as swatches, light and dark side by side, each named by its custom property, with the fonts the style loads.
```

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
| `--ui-accent-stroke` | The accent as a stroke or mark in a drawing (numbered-step rings, the claim's path). A spec whose accent fill is too light for a line on white points this at a darker twin (example, Technical: the accent itself) | `--uipack-accent` |
| `--ui-accent-surface` / `-ink-2` / `-line` | The deck's accent-tone slide | `[data-tone="accent"]` |
| `--ui-flow-request` / `-response` / `-change` / `-error` | Flow tokens, always paired with a shape (`-error`: a failed or declined branch, `--uipack-token-error`). Each style keeps them in its own palette, so a figure on its page never carries another style's hue | `--uipack-token-*` |
| `--ui-data-pos` / `-neg` / `-context` | Signed values (with a sign or arrow) and the context grey | `--uipack-cx-good`, `-bad`, `-context` |
| `--ui-data-1` … `-4`, `--ui-on-data-1` … `-4` | Categorical slots and the label on each | `--uipack-cx-s1` … |
| `--ui-inv-paper` / `-surface` / `-ink` / `-ink-2` / `-line` / `-accent` | The invert variant inside the style (deck `invert`, `tone="ink"`) | `[data-tone="ink"]`, the web quote card |
| `--ui-band-fill` / `-ink` / `-ink-2` / `-cta`, `--ui-on-band-cta`, `--ui-band-pattern` | The web closing band (`ClosingCta`): its ground, text, button and pattern | `--web-band-*` |
| `--ui-spot`, `--ui-on-spot` | The accent as a large flat fill (a sticker, a marked row, a lens in a drawing) and type on it. A spec whose accent is too light for text sets `--ui-accent` to a darker text tone and keeps the bright one here (example, Technical: the accent) | treatments, product drawings |
| `--ui-media-ground` / `-cold` / `-mid` / `-warm` / `-hot` / `-ink`, `--ui-media-ramp` | Product imagery: a four-stop tonal ramp for drawn pictures (a thermal frame, a heat map, a scan), its ground and the ink of marks over it (example, Technical: a cyanotype ramp) | `ProductShot`, bespoke product drawings |
| `--ui-media-filter`, `--ui-media-tint`, `--ui-media-blend` | How a photo in a `ProductShot` is printed (example, Technical: a cyanotype print) | `ProductShot src` |

**Type, shape, motion and scalars**

| Role | Means |
| --- | --- |
| `--ui-font-display` / `-text` / `-label` | The three faces |
| `--ui-font-heading` | Small headings outside the display steps: a figure's title, a consulting slide's title. A spec with a loud display face points it at the text face (example, Technical: the display face, so page, slide and figure share one heading face) |
| `--ui-display-weight` / `-tracking` / `-case`, `--ui-display-scale` | How the display face is set: weight, tracking, case, and a scale on web steps 4–6 |
| `--ui-label-tracking` | Tracked caps for eyebrows and labels |
| `--ui-em-style`, `--ui-em-color`, `--ui-em-decoration` | The emphasised phrase in a display headline |
| `--ui-radius` / `-sm` / `-xs` / `-pill` | Container, inner box, mark, control |
| `--ui-stroke`, `--ui-rule-width` | SVG line weight, CSS rule weight |
| `--ui-density`, `--ui-type-ratio`, `--ui-measure` | Scalars a style may own: spacing scale, type ratio, line length |
| `--ui-ease-settle` / `-travel`, `--ui-dur-quick` / `-base` / `-slow` | Motion feel |

**Ornament slots.** A layout leaves named slots; a style paints them. They never take space or
move a box, so a style changes how a page looks and never where anything sits
(`src/web/web-styles.css`). Each spec gives a value for every slot; Technical's are in
[its spec](../specs/technical.md#ornaments).

```uipack-demo ornament-slots wide
The same markup with its ornament slots painted by Technical: the hero backdrop, the eyebrow marker, the card frame and the primary button.
```

| Slot role | Painted where |
| --- | --- |
| `--ui-backdrop`, `--ui-backdrop-mask` | Behind the hero |
| `--ui-backdrop-narrow` | Behind the hero below 720px |
| `--ui-canvas-pattern` | A figure's canvas (`Figure background="dots"`, the default) |
| `--ui-marker-size` / `-shape` / `-color` | Hung before each eyebrow |
| `--ui-section-index` | `inline` or `none`: each `Section` eyebrow's number in page order (`WebPage` numbers its sections after the hero; a section outside a `WebPage` has none) |
| `--ui-corner-marks` | Background layers on quiet cards, plans and the quote |
| `--ui-section-rule` | Top edge of each section |
| `--ui-frame-border`, `--ui-frame-shadow`, `--ui-card-shadow` | Cards and framed windows |
| `--ui-nav-fill`, `--ui-nav-blur` | The sticky nav |
| `--ui-grain`, `--ui-glow`, `--ui-star-fill` | Ambient depth switches (0 or 1) |
| `--ui-cta-shadow(-hover)` | The primary button |
| `--ui-cta-fill`, `--ui-on-cta` | The primary button's fill and label |
| `--ui-band-*` | The closing band |
| `--ui-stamp-*` (fill, ink, accent, border, inner, radius, rotate, face, case, size, shadow, fit, label-width) | `StarHero stamp`: the page's one measured number, on the proof's corner (split) or in the copy. `fit` is the width the figure may take and `label-width` the label's measure: a round stamp keeps its text to its inscribed square, so it sets both smaller |

**Treatment roles (web components).** Range comes from how a style draws the same parts, not from
moving them: the layout is one, the treatment is the style's. Every style fills these.

| Role | Painted where |
| --- | --- |
| `--ui-density` | Section padding (vertical only) |
| `--ui-perf` | Line style of internal divisions: table rows, card and window heads, feature lists, the step rail |
| `--ui-column-rule`, `-gap` | Top of each section's column |
| `--ui-card-fill`, `--ui-card-pad` | Step and feature cards |
| `--ui-num-*` (font, size, weight, prefix, pad, rule, color, fill, ring, box, display, bleed, gap) | `FeatureGrid numbered` |
| `--ui-stat-divider` | Between proof stats |
| `--ui-quote-*` (fill, ink, ink-2, line, mark, face, weight, case, size, rule, shadow) | The proof quote |
| `--ui-plan-featured-border`, `-ring`, `-fill` | The featured plan |
| `--ui-cell-*` (fill, ink, line, peak, on-peak, off-ink, radius) | Product surfaces: table highlights, schedule cells, status chips, worked rules |
| `--ui-window-dots`, `--ui-window-bar` | `ProductWindow` and `DemoPlayer` chrome |
| `--ui-web-flow-request` | The request token of a figure on a web page |

**Component treatments (per-style CSS on the same markup).** Roles change values; some parts also
change how they are drawn: pseudo content, which edges are ruled, inner padding, the face of a
column. Those live in `src/web/web-styles.css` keyed on the page's style and never move a box,
change a column count or reorder content. A nested `Section uiStyle` gets that style's roles but
the page's treatment. The parts a spec may treat: `DataTable`, `WorkedExample`, `ItemList`,
`Proof` stats, `StarHero facts`, `FAQ`, `ProductShot` and the bands (Technical's are in
[its spec](../specs/technical.md#ornaments)).

**Every style fills every role.** A few roles have Technical values tuned for one medium
(`--ui-node`, `--ui-line-solid`, `--ui-inv-node`, `--ui-accent-ink`, `--ui-data-neg-ink`,
`--ui-slide-font-*`, `--ui-web-font-*`, `--ui-alert`, `--ui-warn`); a new style fills them too,
mostly by pointing at a core role.

**Component tuning is not a role.** `--tune-*` values are Technical's hand-tuned colours for one
component: the docs entry's warm palette (`--tune-docs-warm-*`), the slide rule (`--tune-slide-line`), print
(`--tune-print-*`) and the full-screen letterbox. Mechanism tones (`--tune-mech-*`), the Studio
stage (`--tune-object-*`) and the docs surfaces are optional hooks that Technical now leaves to the
derivation. A component reads one as `var(--tune-x, <a mix of core roles>)`, so any
other style gets the derivation, and every style host resets them so they never leak.

A role keeps its meaning on every site. Whatever hue a spec gives `--ui-accent`, it marks the single
thing that matters. A spec may not add a second accent.

## Specs and component looks

Mechanism and the 3D directions are component looks: a spec picks them in `components:`, and each
is `fixed` or `flex` ([every look](../components/README.md)).

| What | For | Values | Guide |
| --- | --- | --- | --- |
| **Site specs** | One per website: its palette, faces, ornaments, voice | `src/styles/<id>.css` once implemented | [Site registry](../specs/registry.md), [Technical spec](../specs/technical.md) |
| **Mechanism** (`flex`) | One isometric machine whose working is the point | The site's roles mapped to four solid tones (derived; `--tune-mech-*` hooks), one lit part | [Mechanism look](../components/mechanism.md), [Mechanism](../mechanism.md) |
| **3D art directions** | Object scenes | Studio (`flex`, reads `--tune-object-*`); Paper worlds, Kinetic, Cartoon, Realistic, Abstract (`fixed`) | [3D looks](../components/3d.md), [3D object scenes](../objects.md) |

The `uiStyle` prop (`Figure`, `DeckPlayer`, `SlideStarter`, `WebSurface`, `Section`) and
`data-ui-style` on any element set the style; the nearest one wins, and with nothing set it is
Technical. `uiStyles` in `uipack` registers the implemented styles with their fonts and the face to
preload.

### Type roles

A spec names three faces (display, text, label) and how the display face is set. Fonts are
self-hosted, latin-only woff2 in `uipack/fonts/*` (`src/web/fonts.css`, carried by every entry
stylesheet), each with a metric-matched local fallback, and a browser fetches a face only when the
active style uses it. Preload only the active style's display face (`uiStyles[].preload`). Static
SVG export (`uipack/static`) cannot load web fonts and names the spec's faces before the system
stacks. Mono captions and secondary text stay at 12px or more and 4.5:1 in both themes. Use the
spec's own faces and never add a new one; a different face is a spec change, or a documented
override hook (`--web-font-display`). A Mechanism drawing has no words in it; its card corners use
mono caps of at least 11px. Technical's faces are in [its spec](../specs/technical.md#type).

### Shared finish rules (every style)

- **One accent**, on one thing per unit.
- **Glow means selection.** It is never ambient. The one exception is a drillable node's soft glow
  ([Design direction](../design-direction.md)).
- **Hierarchy by weight and opacity**, not by more hues. Text at 100 / 87 / 66% of one ink.
- **Navigation hues are a spec's choice.** A spec may give each section of a site's navigation a
  hue of its own ([what a spec may set](spec-settings.md), Navigation). It marks place, never text:
  only the section's icon, the current-place marker and the page's breadcrumb chip, always beside
  the section's label, at 3:1 or more as a mark on every ground. Text stays the ink ramp and the
  accent stays the one accent.
- **Contrast** of at least 4.5:1 for small text and 3:1 for large, in both themes.
- **Radius scale**: one container radius per site (example, Technical: 0, square).
- **Texture is optional and quiet**: grain 4–8%, grid lines 8% ink, dots 20% ink. One ambient
  effect per viewport.

## Diagrams

The diagram style card: the [Blueprint look](../components/diagrams.md), whose grammar below is the
same on every site; colours, faces and the canvas ground come from a
[diagram theme](../components/diagrams.md#diagram-themes) (the site's default, optionally one per
page). Every figure, preset, chart and article part follows it. Values are in SVG
user units for a `viewBox` drawn at about its rendered width.

| Element | Rule |
| --- | --- |
| Frame | `Figure` card: IBM Plex Mono eyebrow `FIGURE 01 · TOPIC`, title in the heading face (IBM Plex Sans 20 / 600), one-line caption, legend, Pause / Replay top-right; 1px border at 26% ink, square corners |
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

Slides take the spec's roles through the deck tokens and the deck's type scale (example, Technical:
the slide headline is IBM Plex Sans 600, the same face as the page and figure headings). Sizes are
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

A site's spec paints its web pages from the same parts, words and layout every site shares: its
ornament slots and treatment roles decide how the parts are drawn, never where they sit. The hero
shows the product's real output (a filled rota, table or record through the product-surface parts),
never a blank panel: a `DemoPlayer` in steps mode needs a `screen` on its last step. Example:
Technical draws a web page as an engineering drawing ([its ornaments](../specs/technical.md#ornaments)).

Every style keeps one accent, 4.5:1 small text in both themes and reduced motion. A figure on a web
page takes the page's text and label faces, frame and radius, and its flows stay in the style's
palette.

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
so the same story can be rendered in another direction. Each object scene offers only the two or three
directions that suit its subject (`objectLooks`; reasons in [objects.md](../objects.md#directions-per-subject)).

| Direction | Character |
| --- | --- |
| Studio (default) | Product photography: one object on a seamless sweep, soft key, low lens |
| Paper worlds | Cut-card toy theatres: layered flats in a proscenium, one warm key |
| Kinetic | Brass armatures and glazed ceramic on a turned slate base |
| Cartoon | Floating toy islands, toon shading, day and night |
| Realistic | Low macro close-ups on real surfaces, grazing window light |
| Abstract | Refractive glass against colour bands |
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
4. A new style is one value set in `src/styles/` plus a `uiStyles` entry, built from a site spec
   ([how](../specs/README.md#building-a-style-from-a-spec)). It adds a component only when it adds a part.

Known gaps:

- Hex literals remain in four files, each listed with its reason in `test/no-hex.test.tsx`: the
  vendored Mechanism kit, 3D subject materials, the five non-Studio art-direction stage gradients
  and two candle strokes in the object fallback.
- Component tuning (`--tune-*`) exists for Technical only. A new style gets derivations of its core
  roles for Mechanism tones, the Studio stage and docs.
- Only the web reads the ornament slots. Figures and slides have no backdrop or marker slot yet.
