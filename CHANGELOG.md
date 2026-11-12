# Changelog

Every uipack release and what changed in it, newest first, for the sites that pin uipack and the
agents that build them. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
version numbers follow the rules in [docs/releases.md](docs/releases.md), which also says how a
release is cut and how a site moves to it.

## [Unreleased]

### Fixed

- **`DocsLayout` collapsible sidebar:** a section's label starts on its page links' text edge (it
  sat 2px to their left).
- **`DocsLayout` "On this page" disclosure:** its label stays on one line on a phone when the
  current heading beside it wraps.

## [0.6.0] - 2026-11-12

The docs shell (`uipack/docs`) gains collapsible sections with navigation hues, a travelling
location marker, a drawer and search, all opt-in; the docs site uses them, gets its own spec and a
landing page at `/`, and in dark shows its demos on its own charcoal ground.
One default changes what a page draws (below), so this is a minor release
([version numbers](docs/releases.md#version-numbers)).

### Added

- **`DocsLayout` sections:** `collapsible` (each section's heading a button with its icon, page
  count and chevron; the current section open; sub-pages on a tree line), `DocsSection.id`, `.icon`
  and `.hue` (a navigation hue that marks only the heading's icon, the current-page marker and search
  results), and `DocsNavItem.group` (a caption above a group of pages inside a section).
- **`DocsLayout` marker:** `marker="plane"` or `"mark"` (the uipack square mark) instead of the bar:
  in "On this page" it travels a dotted path to the heading being read (a picked heading scrolls
  into view and stays current); in the sidebar it docks beside the current page, and with
  `markerMemory` (a sessionStorage key) it travels there from the page the reader left, crossing
  sections and opening the new one as it arrives. The plane flies, with a short dotted trail; the
  mark hops like a game piece (arcs with a squash on landing, one hop for a neighbouring link, five
  at most, in the plane's time, no trail). `markerLive` and `markerColor` put the mark's dot on any
  of its four cells in any colour, so the marker can show a state per page (`DocsMarkerCell`), and
  `onMarkerTrip` tells the host how long a trip takes. Reduced motion: it jumps.
- **`DocsLayout` drawer:** `mobileNavigation="drawer"` with `navigationOpen` and
  `onNavigationOpenChange`: below 900px the sidebar is a modal drawer from the left, opened by the
  host's header button.
- **`DocsLayout` search:** `search={{ load, resolveHref }}` puts a box at the top of the sidebar and
  opens a ⌘K / Ctrl-K dialog with results grouped by section. Hand-rolled, no library or WebAssembly:
  `docsSearchEntries`, `packDocsSearchIndex`, `unpackDocsSearchIndex`, `searchDocs`,
  `groupDocsResults` and their types build and rank a static index ([docs layout](docs/docs-layout.md)).
- **`Wordmark` section states:** `live` (a `MarkCell`, 0 to 3 in reading order) moves the uipack
  mark's dot to that cell and `liveColor` colours it; without `live` the wordmark's markup is
  unchanged. The docs site's header puts the dot on the page's section in its hue (Start top left,
  Rules top right, Build bottom left, Check bottom right; neutral elsewhere), hops it across when
  the section changes (560ms, landing with the sidebar's marker, the cell it left redrawing as a
  square), and on the landing page visits the four in turn, hopping (still under reduced motion).
  The site's location marker is that mark in the same state, in the sidebar and "On this page".
  There the brand is the ink on docs pages too (it took the docs link colour, the accent), and
  below 360px the whole mark shows on docs pages (its right column was clipped).
- **The docs site's own spec**, [docs/specs/docs-site.md](docs/specs/docs-site.md) (extends
  Technical): a darker, neutral charcoal dark palette, the five sidebar sections' hues, the location
  marker (`?marker=plane` to compare), the shell's widths, and search. A registry row for
  ui.junxiong.dev; Technical's row is now the package defaults.
- `playground/grade.json`: the docs site's tier-1 config, with a 1920 view beside 1440 and 390
  (`e2e/tier1.spec.ts` uses it, on the landing page too).
- **The docs site's landing page** at `/`, built to the landing recipe: the agent read order as a
  live figure, the install line with a copy button (the same release line `docs:sync` writes), six
  "Start from your job" cards tinted by section, the layers as a `LayerStack`, live parts in a bento
  (the agent-loop preset, the Deck player, the span chart, article parts, a 3D scene that mounts only
  on screen with WebGL), a For-agents band and a site map from the manifest; the docs search and
  ⌘K / Ctrl-K work there too. "What UiPack is" (`docs/README.md`), which `/` showed, moves to
  `/what-uipack-is`, still the first page; `/start` and old `/#heading` links still reach it.

### Changed

- **`DocsLayout` below 900px** (and under `width="wide"` below 1280px) shows "On this page" as a
  disclosure above the page, naming the current heading, where it showed nothing before. A site that
  does not want it hides `.uipack-docs__contents`.
- **Core rules:** a spec may set navigation hues and the location marker
  ([what a spec may set](docs/system/spec-settings.md), Navigation; [style](docs/system/style.md)):
  a hue marks place only, beside the section's label, 3:1 as a mark. And in dark a spec may set the
  ground a fixed look sits on (its card, canvas, surfaces and solid lines), never its hues, shapes
  or faces ([what a spec may set](docs/system/spec-settings.md), Component looks;
  [component looks](docs/components/README.md#modes)).
- **The docs site in dark:** every demo, Assets preview, figure canvas dialog and 3D scene card sits
  on the site's charcoal ground instead of Technical's navy, keeping Technical's hues; diagrams use
  the site's `docs-night` theme ([its spec](docs/specs/docs-site.md#demos-and-fixed-looks)).
  junxiong.dev, notes.junxiong.dev and the package's own defaults are unchanged.
- **The docs site** groups its pages in five sidebar sections (Start, Rules, Build, Check,
  Reference); every URL is unchanged. Design direction and Web principles moved to Rules, Web parts
  API to Build, lintDeck rules and Article verification (renamed from "Verification") to Check,
  Registry to Reference, the For-agents pages under How agents use UiPack; "Component looks" is
  "Looks overview" in the sidebar. `llms.txt` and the site map in `docs/README.md` name each group
  by its section ("Build · Components").

### Upgrading

- Nothing to change. A site that renders `DocsLayout` gets the "On this page" disclosure on a phone;
  hide it with `.uipack-docs__contents { display: none }` if the site has its own.

## [0.5.0] - 2026-11-11

three.js 0.187 for the 3D entries (`uipack/objects`, `uipack/slides`). No component, prop or style
changed, but some 3D scenes look slightly different, so this is a minor release
([version numbers](docs/releases.md#version-numbers)).

### Changed

- **Breaking: three `^0.187.0`.** The optional peer range moves from `^0.186.0` to `^0.187.0` (dev
  copies three and `@types/three` 0.187.0). A site must move its own three in the same change.
- **3D reflections look slightly different.** Of the r187 migration notes, the one uipack's scenes
  touch is the PMREM rewrite (cube render targets instead of the CubeUV atlas, three #34585), which
  `uipack/objects` uses for its studio environment: metal and glossy reflections in the Studio,
  Realistic and Kinetic looks render slightly differently (largest on the Inference study rack and
  the Hot swap tray in light theme). Toon looks and `uipack/slides` are pixel-identical. Accepted
  by the owner, 2026-11-11.
- Dependabot keeps peer ranges (`versioning-strategy: increase-if-necessary`) and no longer skips
  three minors.

### Added

- The figure check is a package bin: `npx uipack-figure-check <url> [--views 1440,390]`, the
  same script as `node node_modules/uipack/bin/uipack-figure-check.mjs`, which still works.
- The docs site is live at [ui.junxiong.dev](https://ui.junxiong.dev), deployed from `main`
  (`vercel.json`, `npm run build:site`). It serves every docs file as Markdown at its repo path
  and an `llms.txt` with absolute links, so an agent without a checkout can read the docs.
  `package.json` `homepage` points there.

### Fixed

- The Assets gallery's and the Icons & marks page's previews load in a built site (they loaded
  only from the dev server's `/@fs` path).

### Upgrading

- Move the site's `three` to the same minor in the same change:
  `npm install https://github.com/ong6/uipack/releases/download/v0.5.0/uipack-0.5.0.tgz three@^0.187.0`.
  A site still on three 0.186 gets a peer-range warning from npm.
- Compare the site's 3D scenes before and after: expect the reflection shift above on metal and
  glossy faces and nothing else.

## [0.4.0] - 2026-11-10

How uipack ships changes; its components, props and styles do not. The package is ES modules
only, and a release is a tarball attached to its GitHub release instead of a commit carrying a
built `dist/`.

### Changed

- **Breaking: ES modules only.** The CommonJS build (`dist/*.cjs`, `dist/*.d.cts`), the `require`
  export conditions and `main` are gone. Each entry exports `{ types, default }`; every subpath,
  stylesheet, font and asset export is unchanged. `require("uipack/…")` from CommonJS now gets the
  ES module (Node 22.12+ loads it; older Node throws `ERR_REQUIRE_ESM`).
- **Breaking: install from the release tarball.** `dist/` is no longer committed; the release
  workflow builds and packs each `v*` tag and attaches `uipack-<version>.tgz` to its GitHub release
  ([releases](docs/releases.md)). A git pin to a commit after 0.3.0 installs without `dist/`.
- `uipack/objects`: the tennis model URL no longer has a CommonJS fallback; pass `modelUrl` only when
  your bundler does not copy `new URL(…, import.meta.url)` assets.
- Build and tooling (no effect on a site): esbuild 0.28, vitest 5, minimatch 11 overrides,
  `npm run verify`, `npm run shoot`, SHA-pinned CI actions with a read-only token, split GL and
  non-GL e2e shards; unused `@fontsource` packages dropped.

### Upgrading

- Replace the git pin with the tarball:
  `npm install https://github.com/ong6/uipack/releases/download/v0.4.0/uipack-0.4.0.tgz`.
  Pins up to `v0.3.0` keep working if you cannot move yet.
- Import uipack, don't `require` it: Next.js, Vite and Node `.mjs` scripts already do. A
  `require()` of uipack (or a `.ts` script tsx compiles as CommonJS in a package without
  `"type": "module"`) needs Node 22.12 or later.
- If you upgrade from a pin before 0.3.0, read 0.3.0's Upgrading first.

## [0.3.0] - 2026-11-08

Diagrams follow a theme. The owner decided (2026-11-07) that figures take the
site's diagram theme, with optional per-page themes, so the Blueprint look moves from `fixed` to
`flex`: the grammar stays core, only colours, faces and the canvas ground vary.

### Added

- **Diagram themes** (`uipack`): `defineDiagramTheme({ name, light, dark, fonts?, canvas? })`, the
  built-in `blueprint` theme (today's default rendering), `diagramThemeCss(theme, { scope,
  darkSelector, lightSelector })`, `DiagramThemeScope` (`theme`, `mode?`), `diagramThemeVars`,
  `diagramColors`. One object feeds live React (both modes, SSR, no flash), `uipack/static`
  (`renderStatic(fig, { theme, mode })`) and the open-canvas dialog; a page scope nested inside the
  site's wins. Colour keys are the `--ui-*` role names (`ink`, `ink-2`, `surface`,
  `surface-raised`, `surface-2`, `line`, `line-soft`, `accent`, `accent-ink`, `flow-*`).
  [Docs](docs/components/diagrams.md#diagram-themes).
- **User-flow parts** promoted from junxiong.dev: `Actor`, `Screen`, `Action`, `Decision`,
  `Outcome`, `LaneRule`. **Sequence parts:** `Lifeline`, `Activation`, `Message`, `Lost`,
  `SelfLoop`, `Note` (participants are `Node`s). Typed, themed, hover by `flow`, static-safe. The
  catalogue gains a **User flow** pattern, and its Sequence figure is now built from these parts.
- **`Node strip`**: an optional 16-unit header strip (`window`, `terminal`, `file`, `store`) that
  says what kind of box it is. Off unless asked.
- `icons.check`; `--uipack-accent-ink` (accent as text; default the accent), read by `Node`,
  `Label`, `Badge` and the new parts.
- Specs declare `diagram-themes: { default: <theme>, <page>: <theme> }`; `scripts/check-spec.ts`
  checks it. Docs demos: one figure in three themes and both modes; the flow parts.

### Changed

- The Blueprint look is `flex` (`scripts/site-model.ts`, `docs/components/diagrams.md`).
- `uipack/static`: `Palette` gains `token-error` (error-kind lines were `currentColor` in static
  files) and `accent-ink`; `StaticOptions` gains `mode`. The older `theme` forms render as before.
- `src/theme.css` reads a theme carrier (`--uipack-diagram-*`) before each role. With no theme the
  value is identical; the playground's diagram pages compare pixel for pixel.

### Upgrading the sites

**junxiong.dev.** Delete the `.uipack, .uipack-object-frame, .uipack-canvas-dialog` and
`:root[data-theme="dark"] .uipack…` blocks in `styles/globals.css` that set `--uipack-*` (keep the
`.uipack-browser` block, which is not a figure). Define the site theme once with the same values,
literal so static exports match:

```ts
// components/diagrams/theme.js
import { defineDiagramTheme } from "uipack";
export const siteDiagrams = defineDiagramTheme({
  name: "site",
  light: { ink: "<page-text>", "ink-2": "<text-muted>", surface: "<page-bg>", "surface-raised": "<surface-raised>",
    "surface-2": "<surface-quiet>", "line-soft": "rgba(26, 36, 32, 0.14)", line: "<border-subtle>", accent: "<brand-solid>",
    "flow-request": "#3d63d9", "flow-response": "#2fa778", "flow-change": "#8a55d6", "flow-error": "<a red>" },
  dark: { /* the dark halves; flows #8ea4ff, #5fd39b, #c39aff; line-soft rgba(230, 235, 232, 0.14) */ },
  fonts: { text: "var(--font-sans)", label: "var(--font-mono)" },
});
```

Inject `diagramThemeCss(siteDiagrams, { scope: ":root" })` in a `<style>` in `pages/_document`
(or the app layout). The site already flips with `data-theme` on `<html>`, which uipack follows.
For Compoze and Trading Engine, define `compoze` and `trading` themes the same way, add
`diagramThemeCss(compoze)` to the same style tag, and wrap each page's figures in
`<div data-diagram-theme="compoze">` (or `<DiagramThemeScope theme={compoze}>`). Then replace
`components/diagrams/userflow.js` and `sequence.js` with imports from `uipack`: the names and props
match (`Participant` becomes `Node`); `Message` gains `labelX` and `packet`. Declare
`diagram-themes: { default: site, compoze: compoze, trading: trading }` in `STYLE.md` and describe
each theme under `## Component looks`.

**notes.junxiong.dev.** Replace `THEMES` in `content/figures/_shared.tsx` with one theme built from
the same values (`fg` → `ink`, `muted` → `ink-2`, `bg` → `surface`, `surface` → `surface-raised`,
`surface-raised` → `surface-2`, `grid` → `line-soft`, `border` → `line`, `token-*` → `flow-*`, `sans`
and `mono` → `fonts.text` and `fonts.label`, plus a `flow-error`), with `canvas: "dots"` to keep
today's ground, and render each file with `renderStatic(fig, { theme: notesDiagrams, mode })`. The
old palette objects still work, so this can land after the pin moves. Declare
`diagram-themes: { default: notes }` in `STYLE.md`.

## [0.2.0] - 2026-11-07

The first tagged release. It covers everything since commit `683d44b` (2026-11-06); the sites
pinned before that (junxiong.dev at `e6b6ed7`, notes.junxiong.dev at `3886f0d`) should read
[Upgrading from a commit pin](#upgrading-from-a-commit-pin) first.

### Added

- **Docs hub.** The playground is one docs site: a manifest (`playground/docs-manifest.ts`) maps
  each sidebar group to its pages, routes and Markdown files, and every page renders its Markdown
  with live `uipack-demo` blocks. Pages carry View as Markdown and Edit on GitHub links.
  `npm run docs:sync` regenerates every number and sequence a page states from code, plus
  `llms.txt`; CI runs it with `--check`.
- **`uipack/docs`:** `DocsMarkdown` host blocks (`DocsMarkdownBlock`) and a `resolveUrl` hook;
  `DocsLayout` gains `width="wide"`, a host header, mobile navigation, a navigation label, a main
  landmark, source links and nested navigation items.
- **Site model.** Each site has one spec (`docs/specs/`, or a site repo's `STYLE.md`, from
  `docs/specs/TEMPLATE.md`) that owns its look, its layout per page type (layout archetypes in
  `docs/system/layout/`), its writing style and the component looks it picks (`docs/components/`,
  each `fixed` or `flex`). `scripts/check-spec.ts` validates a spec; every site is in the
  [site registry](docs/specs/registry.md), which now shows each site's pin against the latest
  release.
- **Core rules** in `docs/system/`: the role contract, layout floors (reading order, a real narrow
  layout, no overflow, tap targets, visible focus, the 8px unit), writing by kind
  (`docs/system/writing/`) and layout by page type, plus four recipes (`docs/recipes/`).
- **Grader** (`uipack/grade`, `npx uipack-grade`, `npm run grade`): tier 1 runs 13 deterministic
  checks at 1440 and 390, light and dark, under reduced motion, and exits non-zero on a failure;
  tier 2 builds blinded pairwise judge packets against frozen rubrics and tallies them; tier 3 is a
  frozen set of 15 regression briefs and a fix ledger. Docs in `docs/grading/`.
- **Agent skills and guide:** `skills/` (page, diagram, copy, site spec, review) and
  `docs/agents/` (read order, multi-agent build, subagent brief, new website) ship in the package;
  `AGENTS.md` and the README point agents there first.
- **Figure check** (`node node_modules/uipack/bin/uipack-figure-check.mjs <url> [--views 1440,390]`):
  a site's own check of every figure drawing on a page at 1440 and 390, failing a connector drawn
  through a label or a label over a node, chip or label, and listing connectors with no label.
  The diagram skill's check step runs it; `e2e/geometry.spec.ts` runs it on the diagrams page.
- **Assets tab** (`/gallery`): a live grid of every registered asset, built from the same
  registries the docs render, each card linked to its docs page. `FigureLayoutWidthContext` lets a
  host that scales figures down keep their designed text size.
- **Web parts:** `ProductShot` (with `ProductShotCallout` and `ProductShotReadout`) for
  role-painted product pictures, `StarHero` media and facts, the proof-corner stamp, `Proof`
  headline stats and caveat, an aside for `FAQ` and `Section`, `DataTable` priority `"key"`, and a
  device recipe in `examples/web-starter`.
- **Style boot:** `styleBootPlugin()` for Vite, `readStyle()` and the `StyleBootOptions` type;
  `persist` (off by default) decides whether a remembered style is read.
- `FIGURE_GRID` export (the figure grid values the docs generate from).
- **3D round-3 craft** on the kept subjects: Studio product-film framing, lighting and per-subject
  shots; Kinetic glazes and bases; Cartoon, Realistic and Abstract materials and frames; Paper
  tabs and lantern light.
- `CHANGELOG.md` and [docs/releases.md](docs/releases.md).

### Changed

- **One style.** Technical (Cyanotype) is the only implemented style; pages and Foundations show it
  alone with no style switcher.
- Technical's values live in its spec (`docs/specs/technical.md`, generated from
  `src/styles/technical.css`); the product-imagery ramp uses Cyanotype values only.
- Docs layout: the home page (`/`) is "What UiPack is"; the diagram catalogue moved to
  `/components/diagrams` (old links redirect); diagram families became component looks
  (`/families` redirects); reference split into `docs/figure-api.md`, `docs/web-api.md`,
  `docs/testing.md` and topic files; screenshots moved to `docs/screenshots/`.
- Writing rules: a missing fact is left out rather than announced, sources sit in one place per
  piece, the before/after sentence appears once in the evidence notes, and title forms vary.
- Guidance: label every connector that carries something, in the brief's words, and check a
  caption's counts against the drawing; every docs task has a copyable example, with names the
  brief lacks marked as placeholders; the deck recipe adds a what-each-slide-adds pass, a lintDeck
  rerun after the last edit, a fill check per slide, an archetype per role and one tone per deck;
  the page skill says when to skip the spec step.
- Figures inside the docs shell draw at 1:1 at 1440 again.
- Decks read their site's spec.

### Removed

- The Landing and Graphical styles: their value sets, `uiStyles` entries and treatment blocks, the
  Landing-only `--ui-display-shadow` and `--ui-em-fill` hooks, and their written specs
  (`docs/system/styles/landing.md`, `graphical.md`, `README.md`).
- `docs/system/layout.md` and `docs/system/writing.md`, replaced by the `docs/system/layout/` and
  `docs/system/writing/` folders.

### Fixed

- Tier-1 findings on the docs site: View as Markdown, Edit on GitHub and the docs breadcrumb are
  44px tap targets on touch; a figure node's invisible touch target reaches 44 CSS px at the scale
  it is drawn (the drawing and its 8px grid are unchanged); the docs sidebar keeps room for a
  focus ring when Tab scrolls it; a linked web wordmark (`Brand` with `href`) and the nav brand link
  are 44px targets;
  the 3D look caption holds 4.5:1.
- `uipack/web` parts draw no text below the 12px floor (they are HTML, so the 11px figure floor
  does not apply): `ScheduleGrid` heads, names and cells (10px on a phone before), the hero stamp
  label (10px), `ProductWindow` source tags, stacked `DataTable` labels and row marks,
  `RecordCard` eyebrow and labels, `BeforeAfter` tags, `ProductShot` tags, notes, readouts and
  pins, hero facts, worked-example notes and Technical proof-stat labels. A `ScheduleGrid` too wide
  for a phone column now scrolls inside its frame instead of pushing past the section. The web
  starter went from 102 text-size findings (and 6 tap-target findings) across four views to none.
- Grader: symbols past a text's first 60 characters count as symbols (a code line's late arrows
  were reported as a fallback font), and a link in a line with a label's words
  ("**Rules:** Overview, Layout") counts as an inline text link.
- `grade tally` exits 1 and starts its output with "NOT A RESULT" when any verdict names no
  packet in the key, or none does (it used to print a result from what was left and exit 0).
- Tier 1 reads the dark theme from the page's effective ground (the topmost painted element at
  the top centre and centre of the viewport, plus the declared `data-theme` and `color-scheme`),
  so a page painted on a wrapper (`.uipack-web`, an app root) is no longer reported as "dark not
  applied".
- `DataTable` text columns wrap while numbers stay on one line; proof stats on a phone keep their
  values in one column; `WorkedExample` under 420px puts each result under its rule; `StarHero`
  facts on a phone take one column each.
- Realistic 3D renders without multisampling at phone width and uses a lighter server set;
  Pause hides when the loop settles under reduced motion; the realistic tennis stays inside its
  envelope; caption and controls are light over the dark tennis and server sets.
- Assets gallery previews always mount (empty cards on CI and on deep links).
- Label underlays cover whole-pixel glyph advances.
- The docs' numbered-steps and nested-groups example diagrams no longer draw a connector through their ORDER
  and JOB labels.

### Upgrading from a commit pin

1. Pin the release: `"uipack": "github:ong6/uipack#v0.2.0"` in `package.json`, then
   `npm install`.
2. **Landing and Graphical are gone.** `uiStyle` and `data-ui-style` accept only `"technical"`
   (another value falls back to Technical), and `docs/system/styles/*.md` no longer exist. This
   breaks only pins from 2026-11-04 to 2026-11-06, when those styles existed; `e6b6ed7` and
   `3886f0d` predate the `uiStyle` prop. A site that wants its own look writes a spec from
   `docs/specs/TEMPLATE.md` and asks for a value set ([how](docs/specs/README.md)).
3. **Host colour variables.** The legacy `--uipack-fg`, `--uipack-bg`, `--uipack-accent`,
   `--uipack-mono` and `--uipack-sans` (and `--uipack-muted`, `--uipack-surface`,
   `--uipack-border`, `--uipack-grid`, `--uipack-token-*`) still exist: each is now an alias on
   `.uipack` for a `--ui-*` role (`--uipack-fg: var(--ui-ink)`). A host rule on `.uipack` that
   loads after uipack's CSS, or is more specific, still sets figure text, background, node fill,
   border, accent and the body faces, in both themes (checked in Chromium on 2026-11-07).
   junxiong.dev's rule (`.uipack, .uipack-object-frame, .uipack-canvas-dialog { --uipack-*: … }`)
   is of that kind. Setting them only on an ancestor has no effect, as before, because `.uipack`
   declares them itself; the `--ui-*` roles, by contrast, do inherit from an ancestor. Three
   things no longer follow the aliases:
   - The figure title uses `--ui-font-heading` (IBM Plex Sans), not `--uipack-sans`. To keep the
     site's face, also set `--ui-font-heading: var(--uipack-sans)` on `.uipack`.
   - The canvas ground is Technical's drafting grid (`--ui-canvas-pattern`, drawn from
     `--ui-ink`), so `--uipack-grid` is ignored. To get the dot grid in `--uipack-grid` back, set
     `--ui-canvas-pattern: initial` on `.uipack`.
   - The old `prefers-color-scheme: dark` defaults on `.uipack` are gone; dark comes from the
     roles' `light-dark()` values. A host that already sets its own dark values keeps them, and a
     `:root[data-theme="dark"] .uipack` workaround for the old defaults is no longer needed.
   These aliases are a bridge for an existing site; the supported way to restyle is a spec and a
   value set, not host CSS.
4. Docs paths moved (see Changed and Removed); a link into `node_modules/uipack/docs/` needs the
   new path.
5. Take before and after screenshots of every page that renders uipack (1440 and 390, light and
   dark) and run tier 1 on them (`npx uipack-grade check <url>`), as
   [docs/releases.md](docs/releases.md#moving-a-site-to-a-release) describes.

[Unreleased]: https://github.com/ong6/uipack/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/ong6/uipack/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ong6/uipack/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ong6/uipack/compare/683d44b...v0.2.0
