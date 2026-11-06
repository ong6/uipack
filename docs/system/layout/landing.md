# Layout: landing page

The layout of a product, launch or announcement page built with `uipack/web`: the grid, the
section archetypes, the order sections render in, and how product surfaces behave at a phone's
width. It adds to the [rules for every layout](README.md#rules-for-every-layout). The words are
[web and landing copy](../writing/web.md); the build steps are the
[landing recipe](../../recipes/landing.md).

## Grid and spacing

From `GRID_COLUMNS`, `SPACE` and the type tokens in `uipack/web`:

<!-- generated:web-grid -->
- **Columns:** 12 at a container of 1024px and up, 8 from 640px, 4 below.
- **Spacing:** 8, 16, 24, 32, 48, 64, 96, 128 px; nothing between the steps.
- **Type:** a 16px base on a 1.25 ratio.
<!-- /generated -->

`Grid` and `GridItem span={[wide, medium, narrow]}` respond to their container. The hero, every
section and the closing band share one 1120px column, so every left edge on the page lines up.

## Section archetypes

Each archetype is a component:

| Archetype | Component | Holds |
| --- | --- | --- |
| Nav | `GlassNav` | Brand (on the sections' start edge), links, the CTA. Below 720px: brand on the start edge, Menu on the end edge. The CTA stays in the bar beside Menu, with its `short` label (`cta={{ label, short, href }}`); below 340px it moves into the menu |
| Hero | `StarHero` | Eyebrow, headline, subhead, actions, then the proof: a `DemoPlayer` or a `Figure`, with `media` (a `ProductShot`) above it when the product is physical or visual. `layout="split"` (use it with a product proof) sets copy on 5 columns and the proof on 7 from 1024px, top-aligned, so a wide screen has no empty half; stacked below. `stamp={{ value, label }}` carries the page's one measured number in the spec's device (example, Technical: a revision tag): in a split hero it is stuck on the proof's top-end corner (the media's), in a stacked hero beside the headline, below 1024px a strip above the proof. Value up to 4 characters, label up to about 30 (it is clamped at three lines) |
| Demo | `DemoPlayer` steps mode | The product's screens. `rail="compact"` (default): one row of step labels over the screen, the step tabs while it plays, under the screen below 720px; `"side"` the full checklist in a start column (under the screen below 720px); `"none"`. At rest (and under reduced motion) no step caption shows |
| Steps | `Section` + `FeatureGrid numbered` | Three numbered cards |
| Mechanism | `Section` + `Figure` | A working figure, with quiet chrome on a web page |
| Proof | `Section` + `Proof` | The headline number (or a before/after `compare`), ruled stats (one stat sets as a single compact line), a `caveat` line under the numbers, a named quote. Three or four `stats` without a `lead` are the headline row (two by two below 720px): use that when the brief gives several measured facts of equal weight, rather than one big number and a thin line |
| FAQ | `FAQ` | Head beside the questions at 1024px and up, sticky as they scroll: give it an `intro` and an `aside` (the CTA or a contact line) so that column is not a lone title |
| Pricing | `Section` + `PricingPlans` | One to three plan cards, each with features and its own button label (what that plan's click does); one plan `featured` carries the page's goal |
| Closing | `ClosingCta` | A full-bleed band: the claim, the CTA a third time, a reassurance line |
| Footer | `SiteFooter` | Brand, links, fine print |

## Order

- **The author's order.** `WebPage` renders `sections` in the order the page lists them, and the
  hero keeps whatever proof the page put there. A style changes tokens and ornaments only, so a
  style built later from another site's [spec](../../specs/README.md) keeps the same order.
  Alignment is the start edge by default.
- **A style's own sequence is opt-in.** `WebPage layout="style"` uses `uiStyles[].prefers` and
  `.layout` (what fills the hero, alignment, cards or rows). Ids a style doesn't name are kept,
  after the ones it does. A site spec records any order it prefers
  ([What a spec may set](../spec-settings.md)). Under the default layout, section render functions
  receive `defaults` of `{ hero: "demo", align: "start", steps: "cards" }`.

  <!-- generated:web-style-order -->
- **Technical:** hero → how → demo → proof → faq → pricing
<!-- /generated -->

- The order the example page renders is in the [landing recipe](../../recipes/landing.md#section-order).

## Rules on the page

- One goal, so the primary CTA appears three times (hero, nav, closing band) and nothing else competes.
- One ambient background per viewport, behind the star, never behind body copy. A hero with a
  proof draws no extra chart: the proof is the star.
- Cards that share a row share a height, with the action row at `margin-top: auto`; a product
  window stretched by a taller neighbour gives the height to its body, and a lone `ItemList`
  inside spreads its rows over it (equal rows), so no window ends in an empty box. Balance the
  pair's content rather than leaving one card half full.
- **Product surfaces at 390.** A `DataTable` drops `priority: "low"` columns below 440px of its own
  width, and with more than three remaining columns stacks each row as a small record (text
  columns wrap and numbers stay on one line, so a long row name never pushes the key column out) (`narrow` overrides: `fit`, `stack`, `scroll`). Mark
  the column the page is about (payback, price, the result) `priority: "key"`: stacked, it sits
  large on the row's name line; in `fit` or `scroll` it is pinned to the end edge, never scrolled
  off. `WorkedExample` results take a `unit` set small beside the
  value, and the result column fits the value. A `ProductWindow`'s data source goes in `source`
  (a tag on its title row), not a lone `footer`; a lone footer renders as a caption.
- **Product visuals.** When the product is a thing (a device, a kit, packaging) or makes a picture
  (a scan, a print, a map), the hero shows it beside its output: `StarHero media={<ProductShot>}`
  above the `DemoPlayer`. A table alone undersells a physical product. `ProductShot` frames a photo
  (`src`, which takes the style's media treatment) or a role-painted drawing (`children`), with a
  `tag`, up to three `readouts`, up to three `callouts` (`{ x, y }` in % of the plate, a label and
  a reading), a small `inset` detail view (the hardware; a row under the plate below 520px), a
  `caption` and a ramp `scale`. Keep the plate's top-end corner (the stamp) and end quarter (the
  inset) free of callouts. Recipe for a bespoke drawing with no photo:
  1. Draw the product's own picture as an inline SVG at the plate's aspect (default `5 / 2`,
     `viewBox="0 0 500 200"`, `preserveAspectRatio="xMidYMid slice"`).
  2. Paint it only from roles: false-colour or tonal fields from the media ramp
     (`stop-color: var(--ui-media-cold | -mid | -warm | -hot)` in gradients, soft shapes through an
     `feGaussianBlur`), marks and text in `var(--ui-media-ink)`; hardware line drawings in
     `var(--ui-ink)` on `var(--ui-surface)`, one detail (a lens, a button) in `var(--ui-spot)`.
     No hex: each style repaints it (example, Technical: a cyanotype).
  3. Match the page's numbers: the callout's reading is a row of the table beside it.
  4. Put the device in `inset`, with one dimension if size matters ("40 mm").
  A worked example ships with the starter: `examples/web-starter/device.tsx` (`DeviceShot`).
