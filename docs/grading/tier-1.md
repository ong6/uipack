# Tier 1: mechanical checks

Deterministic, no judgement. Each check runs in every view: each viewport of the spec (default 1440
and 390, the 390 view with touch and a coarse pointer), in light and dark, with reduced motion on.
The page is loaded, its ready condition awaited, scrolled to the bottom and back so lazy sections
mount, and given its fonts before anything is measured.

## Checks and thresholds

| Check id | Fails when | Default | Source of the number |
| --- | --- | --- | --- |
| `overflow-x` | The page is wider than the viewport; names the element that starts it | 0px | AGENTS.md, e2e/page-audit.ts `checkNoOverflow` |
| `text-clip` | A box that hides overflow cuts part of a text (not an intended ellipsis or line clamp) | 1.5px | e2e/page-audit.ts |
| `text-overlap` | Line boxes of two texts cover 40% of the smaller, and hiding either changes the pixels there | 0.4 | Tight leading overlaps about a fifth of a line |
| `row-heights` | Cards sharing a row differ in height, or their last actions sit on different lines; paired boxes (a do and a don't) differ; controls side by side differ | 1px cards and controls, 2px paired | e2e/page-audit.ts `checkAlignment`, `checkPairedBoxes` |
| `tap-targets` | A control is smaller than the minimum; inline text links are exempt | 44px touch, 24px pointer | docs/web-principles.md, docs/charts.md, WCAG 2.5.8 |
| `contrast` | Rendered text is below the WCAG ratio, against its composited background, or against the pixels behind it when an image or gradient is there | 4.5:1, 3:1 large | docs/system/style.md |
| `font-faces` | A text asks for a family outside the site's faces, or Chromium drew letters in another font (a fallback rendered) | The spec's faces | The site's style spec |
| `text-size` | Rendered text is below the floor (SVG text scaled by its drawing) | 12px; 11px in figures and charts | docs/system/style.md, e2e/geometry.spec.ts |
| `img-alt` | An image has no `alt`, or a `role="img"` has no name | | WCAG 1.1.1 |
| `heading-order` | A heading skips a level | | e2e/page-audit.ts `checkHeadingOutline` |
| `one-h1` | Not exactly one visible h1 | 1 | e2e/page-audit.ts |
| `focus-visible` | A control reached by Tab looks the same focused and unfocused, or its ring is clipped | 40 Tab presses | e2e/page-audit.ts `checkFocusRingsNotClipped` |
| `reduced-motion` | An animation still loops or runs over 1s, a looping SVG animation is unpaused, or two frames 1s apart differ | | docs/design-direction.md |

Symbols drawn in a fallback font (an arrow the site face lacks) are warnings, not failures. Text
in SVG is left to the figure checks for contrast (its background is a sibling, not an ancestor).

## Run it

```sh
npm run grade -- check <url> [--spec uipack|default|STYLE.md|config.json] [--out dir] [--views 1440,390] [--themes light,dark] [--no-shots]
```

Exit code 0: every check passed in every view. 1: a check failed, or a view could not be graded. 2: usage.

## Output

`<out>/report.json` (shape `GradeReport` in `src/grade/report.ts`), `<out>/summary.md` (a check by
view table, then the top findings of each failing check), `<out>/shots/<view>.png` (full page) and
`<out>/crops/<view>-<check>-<n>.png` (the first findings of each check). Each finding has the check
id, a selector, the text, a detail with the measured number and the threshold, the box in page
coordinates and its crop.

Each view also records `themeApplied`: whether the dark view's page ground differs from the light
view's. The ground is read where a reader sees it, at the top centre and the centre of the
viewport (the topmost element there with a background, so a page painted on a wrapper such as
`.uipack-web` counts), with the `data-theme` and `color-scheme` the root, body and that element
declare. When nothing differs, `summary.md` notes that the dark theme did not apply.

## Site values

The faces come from the site's style spec, read with the same parser as `scripts/check-spec.ts`:
the first family of each `--ui-font-*` row in its Role values table, or the faces in its Type
table. `--spec docs/specs/technical.md` or `--spec STYLE.md` (a site's own repo) is enough. The
minimums are core rules every spec extends, so they are the defaults.

`--spec uipack` adds the playground's harness: the `?theme=` switch, the ready condition, the 11px
floors in figures and charts, and Technical's faces from `docs/specs/technical.md`.

The docs site's own config is [`playground/grade.json`](../../playground/grade.json): the uipack
harness, the faces from [its spec](../specs/docs-site.md), and a 1920 view beside 1440 and 390
(`npm run grade -- check <url> --spec playground/grade.json`).

A grade config (JSON) sets the harness for another site and may point at its style spec:

```json
{
  "name": "junxiong.dev",
  "styleSpec": "STYLE.md",
  "themes": { "light": { "colorScheme": "light" }, "dark": { "colorScheme": "dark", "localStorage": { "theme": "dark" } } },
  "ready": { "selector": "main h1", "settleMs": 400 },
  "ignore": [".giscus"],
  "ignoreByCheck": { "contrast": [".hero-video *"] },
  "skip": { "reduced-motion": "no motion on this site; frame check is flaky with the video" }
}
```

| Field | Default | What it sets |
| --- | --- | --- |
| `extends` | `default` | `uipack` starts from the playground's harness |
| `styleSpec` | none | A style spec (path relative to the config) whose faces are used unless the config sets `faces` |
| `faces` | `null` (not checked) | Allowed families; `null` turns the face check off |
| `faceVars` | `[]` | CSS variables on body whose first family is also allowed |
| `symbolFaces` | system symbol fonts | Fonts allowed to draw symbols, as warnings |
| `minTextPx`, `textFloors` | 12, `[]` | The text floor, and smaller floors by selector (`{"selector": "svg", "px": 11}`) |
| `tapTargetPx` | `{"coarse": 44, "fine": 24}` | Touch and pointer minimums |
| `contrast` | `{"normal": 4.5, "large": 3}` | WCAG ratios |
| `rowTolerancePx`, `cardMinHeightPx` | `{"cards": 1, "paired": 2}`, 80 | Row checks |
| `viewports` | 1440×900, 390×844 touch | `{name, width, height, touch}` |
| `themes` | colour scheme only | Per theme: `colorScheme`, `query`, `htmlAttributes`, `localStorage` |
| `ready` | `{"settleMs": 400}` | `selector` to wait for, `gone` to wait out, extra settle time |
| `scope`, `ignore`, `ignoreByCheck`, `skip` | `body`, `[]`, `{}`, `{}` | What is graded; a skip records its reason in the report |
| `maxFindings`, `maxCrops`, `maxTabs` | 25, 6, 40 | Report size and focus walk length |

`npm run grade -- spec <file>` prints the resolved spec and rejects unknown fields, bad numbers and
unknown check ids.

## Limits

- Chromium only (the rendered-font check uses its DevTools protocol).
- Contrast against a background that is not an ancestor (text over a positioned image) is read
  from pixels only when the ancestor chain has an image or gradient; otherwise from the ancestors.
- `row-heights` sees rows by layout (grid, wrapping flex); cards built from absolute positioning are not read.
- A passing tier 1 is a floor, not a quality score: the anchor pages below fail it in places.
