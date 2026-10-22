# Charts: SpanChart and LayerStack

`uipack/charts`, with its stylesheet `uipack/charts.css`, provides two article figures built from HTML and CSS rather than SVG:

- **SpanChart** is a sideways bar chart that places items on the layers of a stack.
- **LayerStack** is a stacked-layer diagram that walks a stack from the bottom up.

Both are drawn in the same language as the site's diagrams: boxes with a raised fill, a 1.25px edge at 70% ink and the shared radius (`--uipack-radius`, 6px); tracked uppercase labels at 80% ink in `--uipack-label-font`; dashed boxes for groups; an accent edge and accent title for whatever is chosen. Neither has an outer frame: the figure sits on the page.

Neither imports Three.js or GSAP, and neither needs JavaScript in the browser. Every behaviour is native form state (`<details>`, radios, checkboxes and a reset button) plus CSS (`:has()`, `:checked` and container queries). The output of `renderToStaticMarkup` therefore works without hydration, and the same markup works when React renders it on the client.

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { LayerStack, SpanChart } from "uipack/charts";
// Ship this stylesheet once on the page (import it, or copy dist/charts.css).
import "uipack/charts.css";

const html = renderToStaticMarkup(
  <>
    <LayerStack {...stack} headingLevel="none" />
    <SpanChart {...chart} headingLevel="none" />
  </>,
);
```

Each SpanChart carries a small scoped `<style>` element with its own filter and layout rules, keyed by its `id`. Give every chart on a page a unique `id`.

The playground renders both on `/` inside a frame at a host's real figure width: 896px by default, or `?frame=720|390|320|full`. The data is the AI-stack example in [`examples/aiStack.ts`](../examples/aiStack.ts).

![SpanChart at 896px, light](span-chart-896-light.png)

## SpanChart

Rows are items, and columns are ordered layers, with the bottom of the stack on the left. Each item has one primary layer and zero or more other layers.

- **Bars.** A row draws one flat bar per contiguous run of covered layers, with a 1px end radius. The primary cell is solid accent, the other cells are a tint with a 1px accent edge and 1px dividers, and gaps stay empty.
- **Groups.** Rows are grouped by primary layer in column order, so the chart reads as a staircase. Each group heading is a tracked uppercase label ("CHIPS AND MEMORY 2 OF 6"). Beside a name column it carries a 3px accent underline on its line across the group's own column (inset 6px a side), so the staircase reads even when a group shows one row; the stacked layouts leave the mark out rather than give it a line of its own. Uppercase labels keep units and names as written: a word with a digit beside a letter, or a capital after its first letter ("32k", "TB/s", "GPUs"), is not uppercased.
- **Order.** Within a group, rows sort by `value` (largest first, rows without a value last), then by name.
- **Scale.** Add rows by adding data. The chart is tested with 160 rows, and each row costs about 0.9–1.2 KB of HTML.

```ts
interface SpanLayer {
  id: string; label: string;  // full label, e.g. "Gateways and observability"
  short?: string;             // one word for mid widths, e.g. "Gateway" (default: abbr)
  abbr: string;               // code for phones, e.g. "GWY"
  zone?: string;              // header band over consecutive columns
}
interface SpanZone { id: string; label: string }
interface SpanTier { id: string; label: string; range?: string } // e.g. { id: "mid", label: "Mid", range: "$5–50B" }
interface SpanStatus { kind: "acquired" | "pending" | "licensed" | "shutdown"; label?: string } // label: "Stripe, 2026"
interface SpanItem {
  id: string; name: string; primary: string; also?: string[];
  logo?: string;       // image URL; missing gives a two-letter monogram
  href?: string;       // website, linked as "Website" in the opened row
  note?: string;       // one sentence shown when the row is opened
  status?: SpanStatus; // badge under the name; any kind but shutdown is a "deal"
  tags?: string[];     // short tags under the name, explained by labels.tagLegend
  featured?: boolean;  // in the initial subset
  source?: string;     // URL backing the placement, linked as "Source"
  tier?: string;       // one of the chart's tiers
  value?: number;      // sort key, largest first (e.g. valuation in USD billions)
  valueLabel?: string; // short display text, e.g. "$17.5B" or "—"
}
interface SpanChartProps {
  id: string;                         // unique on the page, no spaces
  layers: SpanLayer[]; zones?: SpanZone[]; items: SpanItem[];
  tiers?: SpanTier[];                 // largest first, any number; adds the size filter
  title?: ReactNode; caption?: ReactNode; asOf?: string;
  initial?: "featured" | "all";       // default "featured" when any item is featured
  groupBy?: "primary" | "none";       // default "primary"
  labels?: Partial<SpanChartLabels>;  // every visible word; see SPAN_CHART_LABELS
  headingLevel?: 2 | 3 | 4 | 5 | "none" | false; // default 3
}
function SpanChart(props: SpanChartProps): JSX.Element;
function enhanceSpanChart(root: HTMLElement): () => void; // optional; returns cleanup
```

Every visible word is in `labels` (see `SPAN_CHART_LABELS`). The key's words are `keyBars`, `keyMain`, `keyAlso`, `keyDeals`, `legendAcquired`, `legendPending`, `legendLicensed`, `legendShutdown`, `keySize`, `valueLegend` and `keyType`, `tagLegend`; the search uses `find`, `noMatch` (`{q}` is the query) and `clearSearch`; the column hint is `layerHint` and `layerHintTouch`. A host that passes only `{ tagLegend: "model type" }` gets defaults for the rest.

The consumer computes `tier`, `value` and `valueLabel`, including any "Not sized" tier for rows without a figure. The chart only displays, sorts and filters.

### Layout and column labels

The chart root is a size container, and the chart picks its layout and its column labels from the width its own data needs. The model computes these breakpoints from the labels with `spanThresholds`. It uses a table of the system sans's measured glyph widths at 11 and 12px, and every mode keeps **at least 8px between neighbouring labels**. The example's twelve layers resolve as follows:

| Container | Layout | Column labels |
|---|---|---|
| under 334px | name above a full-width bar track | codes (`abbr`) on two alternating lines |
| 334–671px | stacked, as above | codes, one line |
| 672–887px | stacked | `short` words, 11px, −0.01em tracking |
| 888–1169px | a 216px name column beside the bars (240px from 1000px) | `short` words, each with its row count under it |
| 1170px and up | the name column | full labels, 11px then 12px, at most two lines |

The notes site's 56rem (896px) figure slot gets the name column, the short words and the counts. Its corner cell reads "Click a column to filter" over "Company" ("Tap…" on touch screens).

- **Short labels.** These are one word, and a hyphenated short breaks after its hyphen ("Post-/train"), with an explicit `<wbr>` because WebKit does not break there on its own. Single-line and two-line labels share a bottom edge. A short label that is too wide for its neighbours moves the layout breakpoint, rather than crowding them. The example uses "Gateway", not "Gateways", for that reason.
- **Phones.** Phones get codes, and the codes also appear in the filter chips.
- **Names and values.** The name and its value share one flexible line. At 896px a name has about 13 characters before it wraps ("Arista Networks" fits; "Dell Technologies" takes two lines). The name gives way first, wrapping to two lines but never narrower than 9ch (about 82px). Only then does the value shrink: it is capped at 72px and cut with an ellipsis, so a long value ("part of ByteDance") can never crush a name, and its full text is in the row's sentence and its opened detail. In the wide layout values sit at the cell's right edge. Names over 18 characters also carry a hover title.
- **Status badges and tags.** These sit on a line under the name as square tags (2px radius, 11px mono). Badges wrap inside the tag; they are never cut.
- **Row height.** Rows are 44px in the wide layout whether or not they have a badge line, unless a name wraps.
- **Readability.** Every label is at least 11px, and nothing overflows the page at 320px.

### Key

The key is an unframed row, like a chart legend (no box, no fill, so it does not read as one more control), of labelled sections divided by thin vertical rules: **BARS** (square swatches for "Main" and "Also in"), **DEALS** (a sample of each kind present: "→ acquired", a dashed "→ pending", "↝ licensed", "shut down"), **SIZE** (the largest value and `valueLegend`, e.g. "$5.5T market cap or valuation") and **TYPE** (a sample tag and `tagLegend`). The sections sit two a line in columns (BARS | DEALS, then SIZE | TYPE), so four groups never crowd one line, and a section never splits. On phones the same sections sit in the "Filters and key" drawer as a ruled two-column grid.

A chart with no size tiers and no deals has no toolbar of its own, so where the key shows, its search field sits on the key's row, at the right (260px), instead of on a row by itself.

### Filters

All filter state lives in one set of hidden inputs. Every visible control is a `<label>` for one of them, so the copies always agree. Chromium focuses a radio when its label is clicked, so each input sits beside the controls that label it and that focus never scrolls the page: the size radios and the Deals checkbox in the toolbar, the layer radios in the sticky header with the column headers. The Tab order is therefore the order the controls are drawn: size, Deals, the search field, Clear (with a filter on), then the columns.

- **Layer.** Each column header is a label for its layer's radio. Headers carry a dotted underline at rest so they read as controls. Choosing a layer tints its column down the chart (`--uipack-span-column-highlight`) and marks the header with a 3px bar. On a fine pointer, hovering a header shows that column's band at half strength. Where headers show names, there is no row of layer chips: the corner cell (or, in the stacked layout, the toolbar) says "Click a column to filter". Where headers show codes, layer chips ("PWR Power") wrap by box in the drawer, so none is ever cut off.
- **Size.** With `tiers`, a segmented control: a "SIZE" cell, then joined boxes for "All sizes 158" and each tier with its count ("Large 41", "Not sized 54"); the tier's range is its tooltip. The chosen box gets an accent edge, accent text and a tint, so the state is not shown by colour alone.
- **Deals.** When any item has a status other than `shutdown`, a boxed toggle shows the deal count, e.g. "Deals 6". Its text comes from `labels.deals`.
- **Combined.** The filters combine with AND, and any active filter shows every matching row, featured or not. Groups without a matching row hide; the chart's own rules include exactly the layer × size × deals combinations this needs. The sticky header shows the active state as square tags ("SHOWING Inference × Large × Deals ×") with a boxed "Clear" button.
- **Empty and clearing.** A combination that matches nothing shows "Nothing matches these filters." with "Clear filters". Clearing works without JavaScript: the chart is a `<form method="dialog">` (submission is a no-op) and both controls are reset buttons. The expand checkbox sits outside the form, so clearing does not collapse the list.
- **Targets.** Chips, headers and the active-filter chips are 36px tall with a fine pointer and 44px with a coarse pointer; the links in an opened row are 24px and 44px.
- **Contrast.** Chosen chips, headers and filter tags set their words and counts in the accent ink (75% accent, 25% ink), which reaches 4.5:1 on the accent tint in both themes.

Where headers show codes, the key and every filter fold into a closed "Filters and key" box. Its summary states the active filters ("Filters and key · All layers · All sizes"); each "· part" wraps as a unit. Outside the closed box, a one-line key shows the two swatches and the Deals toggle, so a phone reader can read the bars and reach Deals in one tap; opening the box hides that line, since the box holds the whole key.

### Subset, groups and rows

- **Featured subset.** With any featured item, only featured rows show at first. "13 of 45 shown" and a boxed "Show all 45 companies" sit above the list, and a matching button sits at its foot. Both are labels for one checkbox, and expanding reveals the other rows in place. Group headings read "2 of 6" in the featured view and the total when expanded. They are quieter and shorter than a row.
- **Row detail.** Each row is a `<details>`. Opening it shows a boxed card with the note, then the facts: main layer, other layers, size, status in words, "Website" and "Source". They are separated by gaps rather than dots, so a wrap never strands a separator. Links stay links. Each summary has one visually hidden sentence, such as "Fireworks AI. Main layer: Inference. Also in: Post-training. Size: $4B, Small.", and the drawn cells are `aria-hidden`.
- **Badges.** The pill carries only the counterparty, at 11px in the change colour:
  - `acquired`: "→ Stripe" in a solid pill.
  - `pending`: "→ Nvidia" in a dashed pill.
  - `licensed`: "↝ Nvidia", with a wave arrow.
  - `shutdown`: "shut", muted.

  The key shows each kind present ("→ acquired", "↝ licensed"). Screen readers hear "Acquired by Stripe, 2026", "Sale agreed to Nvidia, 2026", "Technology licensed to Nvidia, 2025" and "Shut down".
- **Logos.** Logos sit on a hairline tile. In dark mode the tile colour derives from the host's ink and is dimmed slightly, because favicons are often dark glyphs on a transparent ground. A missing logo gives two letters on a transparent tile that tell similar names apart: "Cerebras" → "Ce", "Cursor" → "Cu", "OpenRouter" → "OR".

### Optional enhancement

`enhanceSpanChart(root)` adds the design-direction behaviour. Everything else works without it.

- Activating the selected header or chip again (click, tap, Space or Enter) clears that filter. Escape clears every filter. Escape is heard on the document while focus is in the chart, or the chart was the last thing clicked, because Safari does not focus a radio when its label is clicked.
- After "Clear" or "Clear filters", focus moves to the "All layers" control in the sticky header, not past the chart. Where the column headers filter and the Layer chips are hidden, that control's focus ring outlines the column-header row.
- Group labels stick under the header while their rows scroll past. The enhancement measures the header (`--sp-head-h`); without it the labels simply scroll.
- Under a filter, group headings show live counts, the footer reads "14 of 45 shown", and a polite live region announces it. Without JavaScript, the headings show totals.
- Collapsing the list, or filtering while the chart top is above the viewport, scrolls the chart top back into view (offset by `--uipack-span-sticky-top`), in Chromium and WebKit.
- Where `hidden="until-found"` is supported (Chromium), rows hidden in the featured view stay findable with the browser's find-in-page, and a match expands the list. While hidden they also carry `aria-hidden`, so screen readers do not hear empty list items. Elsewhere the CSS subset applies.
- A URL hash naming a filter input (`#ai-stack-layer-control`, `#ai-stack-tier-small`, `#ai-stack-deals`) selects it, so an article can link to a filtered view.
- **Find a company.** A search field appears in the toolbar (it ships `hidden`; without script, find-in-page reaches every row). It matches what a row shows: the name, its tags and its deal ("nvidia" finds Nvidia and the companies with a deal with Nvidia), ignoring case and accents. Matches show whether featured or not, combine with the layer, size and deals filters, and update the live region ("4 of 158 shown"). Escape in the field, or its clear button, resets it; Escape elsewhere and "Clear filters" reset it with the filters. No match shows "No company matches “x”" with a Clear button.
- **Crosshair.** On a fine pointer, the column under the pointer in the rows shows the same faint band as a hovered header, and its header lights up; the row under the pointer is tinted. A chosen column keeps its stronger band.
- Showing all rows, or going back to the featured ones, is announced ("158 of 158 shown").

```js
import { enhanceSpanChart } from "uipack/charts";
document.querySelectorAll(".uipack-span").forEach((el) => enhanceSpanChart(el));
```

### Validation

Validation always runs, not only in development, so a static build fails loudly. It throws on:

- unknown layer ids in `primary` or `also`;
- duplicate item, layer or tier ids;
- unknown tiers;
- a deal status without a label;
- zones that do not cover consecutive layers;
- an `id` with spaces.

Each message names the chart and the item, for example `SpanChart "ai-stack": item "x" lists unknown layer "nope" in \`also\`. Known layers: …`.

`buildSpanModel(props)`, `spanChartCss(model)` and `spanThresholds(layers)` expose the computed groups, rules and breakpoints for tests or custom rendering.

## LayerStack

A hero diagram for an article that walks a stack from the bottom up. Every band is a link to its section.

- **Order.** Layers are given bottom to top and numbered that way, with 01 at the bottom. They are drawn, tabbed and read top-down, so the eye, the keyboard and a screen reader meet them in the same order.
- **Type.** The stack's smallest text (the band index, zone heads and their notes, rail and bracket labels, metric notes) is 12px.
- **Bands.** Each band is one diagram node and one `<a href>`: a muted mono index ("08"), the bold title, the constraint as a muted sub-label on the same line where it fits (under the title otherwise), and a right-aligned "↓", muted at rest. Hover and focus give it an accent edge and an accent title, and (from 640px) show the words "Go to section" (`labels.go`) in space kept for them, where a metric would be. A screen reader hears one sentence: "Layer 08 Inference. Every token re-reads the weights…. Go to section".
- **Phones.** Below a 480px container each band is one 44px line: index, name and arrow. The constraint and any metric leave the screen but stay in the link's name.
- **Zones.** Each zone is a dashed box around its bands, labelled inside at the top left in the tracked uppercase style: "SERVING AND PRODUCT · RUN ON EVERY REQUEST" (the note takes its own line on phones).
- **Rails.** From 640px each rail is a bracket connector beside the stack: a 1.25px line over exactly its bands, an 8px square at each end, and its label (`short` when given) horizontal beside the top square, with the link's "↓" under it. The whole rail is a link to its section, named for screen readers by its full label and range ("Gateways and observability, layers 8–10"). Below 640px the rails give way to an "Across the stack" list of boxed nodes, each a link with the full name and range on one line, the summary under them and a "↓".
- **Optional parts.** `metric` adds a figure at the band's right edge (under the words on phones); `detail` makes the band open instead, showing "Check yourself", the text and "Read the section ↓". Neither draws anything unless given.
- **Brackets.** From 1000px they sit in a left column, drawn like the rails but facing the stack; below that, each becomes a small label above the zone it starts in.
- **Validation.** Unknown zones, rails or brackets that name an unknown layer, a zone split by another zone, and duplicate ids all throw.

At 896px the example's ten bands are each one 44px line, in about 640px of height; at 390px the notes site's map is about 910px tall, list included.

```ts
interface StackZone { id: string; label: string; note?: string }
interface StackLayer {
  id: string; label: string; zone: string;
  summary: string;                          // one line: the constraint
  href?: string;                            // the article section: the band links there
  metric?: { value: string; label: string }; // optional
  detail?: string;                          // optional: the band opens to show it
}
interface StackRail { id: string; label: string; short?: string; from: string; to: string; summary?: string; href?: string } // short: the bracket's label, e.g. "Gateways"
interface StackBracket { label: string; from: string; to: string }
interface LayerStackProps {
  id: string; title?: ReactNode; caption?: ReactNode;
  zones: StackZone[];
  layers: StackLayer[];                     // bottom to top
  rails?: StackRail[];                      // cross-cutting topics
  brackets?: StackBracket[];                // optional annotations; zone notes usually replace them
  labels?: Partial<LayerStackLabels>;       // layer, layers, layerOne, go, rails, check, read
  headingLevel?: 2 | 3 | 4 | 5 | "none" | false;
}
function enhanceLayerStack(root: HTMLElement): () => void; // optional; returns cleanup
```

`enhanceLayerStack(root)` makes band and rail links scroll smoothly to their sections, record the hash and move focus there. Under `prefers-reduced-motion` it leaves the plain link alone.

![LayerStack at 896px, light](layer-stack-896-light.png)

## Headings

`headingLevel` sets the title's level (default 3); SpanChart group headings and LayerStack zone headings sit one level below it. A chart placed before the page's first section heading would make the outline jump, from h1 straight to h3. For that case, pass `headingLevel="none"` (or `false`): titles and labels render as text, and each SpanChart group and each LayerStack zone becomes a `role="group"` named by its label.

## Theming

Both components read the shared `--uipack-*` properties, with the Technical defaults and the theme switching of `theme.css`: `prefers-color-scheme` unless `data-theme="light"` is on `<html>`, and `data-theme="dark"` on an ancestor or the root. Each value falls back to the default for the current theme. A host remaps colours by setting the variables on any ancestor, and its own light/dark switching flows through.

| Property | Used for |
|---|---|
| `--uipack-fg`, `--uipack-muted` | text, secondary text; the dark logo tile derives from `fg` |
| `--uipack-bg`, `--uipack-surface`, `--uipack-surface-raised` | page (behind the sticky header and group labels), logo tiles, node fills and hovered rows |
| `--uipack-border` | header rules and key dividers |
| `--uipack-accent` | primary cells, "also" edges (72%) and fills (20%), selection, links, focus rings, hovered nodes |
| `--uipack-radius` | nodes, controls and zone boxes (6px) |
| `--uipack-label-font` | every tracked uppercase label (default: `--uipack-mono`; tabular numbers stay mono) |
| `--uipack-token-change` | status badges (text mixed 70% with `fg` for 4.5:1) |
| `--uipack-sans`, `--uipack-mono` | type (system fonts by default; no font requests) |
| `--uipack-span-column-highlight` | the chosen column's band (accent 10% in light, 20% in dark) |
| `--uipack-span-name-width` | SpanChart's name column (216px, 240px from 1000px; the breakpoints assume these) |
| `--uipack-span-sticky-top` | offset of the sticky header and of scroll restoration under a fixed site header (0px) |
| `--uipack-span-tint`, `--uipack-span-hairline` | the "also" fill and the row separators |
| `--uipack-span-logo-bg`, `--uipack-span-logo-filter` | the logo tile (surface; in dark, 82% `fg` with `brightness(0.88)`) |

```css
/* A site whose figure palette already switches with its theme. Map the
   figure accent, not the link accent: in a chart the accent marks data. */
.article-figure {
  --uipack-fg: var(--text);
  --uipack-muted: var(--muted);
  --uipack-bg: var(--bg);
  --uipack-surface: var(--bg);
  --uipack-surface-raised: var(--surface);
  --uipack-border: var(--faint);
  --uipack-accent: var(--fig-accent);
  --uipack-token-change: var(--fig-change);
  --uipack-sans: var(--sans);
  --uipack-mono: var(--mono);
  --uipack-label-font: var(--sans);
}
```

All rules are scoped under `.uipack-span` and `.uipack-stack`, and neither stylesheet has a global element rule. The components reset their own headings, paragraphs, lists, labels and buttons with a doubled root class (`.uipack-span.uipack-span :where(…)`). That reset outranks prose rules such as `.prose ul` and `.prose p` whichever stylesheet loads last; a browser test loads the host's prose CSS after `charts.css` to prove it. The roots also reset `overflow-wrap` and `word-break`, so a host's `overflow-wrap: anywhere` cannot split a code. Transitions are 120ms chevron turns, disabled under `prefers-reduced-motion`.

## Limits

- **Browser support.** Without `:has()` every row shows and the filters do nothing (Chrome 105, Safari 15.4 and Firefox 121 support it). Without container queries the stacked layout is used at every width. Tints and the selected states use `color-mix()`.
- **Safari keyboard.** Safari moves Tab focus only to links and text fields unless full keyboard access is on, so the radios and checkboxes are reachable there with Option-Tab. That is the platform default.
- **Label widths.** The breakpoints are estimated from a system-sans width table. A much wider host font can wrap a column label to another line, but it never clips it.
- **Find-in-page.** Find-in-page reaches hidden rows only where `hidden="until-found"` is supported, and only with the enhancement loaded.
