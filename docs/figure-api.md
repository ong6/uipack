# Figure parts API

The reference for drawing a figure by hand with `uipack`: every part and its props, the connector
rule, hover, motion and the text floor, theming, the seven presets in `uipack/presets` and static
SVG export with `uipack/static`. Read the [diagram rules](system/style.md) and the
[diagram catalogue](diagrams.md) first to pick a pattern; come here for the exact props.

| You need | Section |
| --- | --- |
| A part's props (`Figure`, `Node`, `Connector`, `Packet`…) | [Parts](#parts) |
| Where arrowheads and packets go | [The connector rule](#the-connector-rule) |
| Hover and flow highlighting | [Interaction](#interaction) |
| Packet motion, Pause and Replay, reduced motion, the 11px floor | [Motion](#motion) |
| Colours in a figure | [Theming](#theming) |
| A ready figure from a typed spec | [Presets](#presets) |
| One SVG file for a README, slide or `<img>` | [Static export](#static-export) |

## Parts

- `Figure`: the frame. Eyebrow, title (`headingLevel` picks the element), caption, legend, Pause and Replay, a canvas with a `background` of `dots`, `plain` or `ruled`, and a `narrow` drawing swapped in below 720px. Owns the SVG timeline, hover and selection state, and optional expanded canvas.
- `Lane`: mono uppercase column header, centred over `x..x+w`.
- `Group`: a boxed service (solid, centred title) or a dashed boundary (mono title).
- `Node`: a box with a label, a mono `sub`, an `icon`, an optional `hint` (one short sentence shown in a note beside the box when it is selected inside a Figure; a native tooltip elsewhere) and `href` (renders as a link with a focus ring). `Chip` and `Group` take the same `hint`.
- `Chip`: a pill for a connection slot, a queued item, a status flag. `shape="tag"` makes it a small-radius box for a symbol or a section (`INTRO`, `PARSE()`); `soft` gives `kind` a lighter wash for the already-stored one beside a full-tint chip.
- `Connector`: a rounded orthogonal path with one arrowhead.
- `Bus`: a trunk with stubs and a junction dot at each join. `busStub` and `busStubs` give the same points to packets.
- `Packet`: a token that rides a connector's points, looping. It pops out slightly as it leaves (0 to 1.2 to 1 over 0.28 s) and shrinks away as it arrives (0.32 s, accelerating), on the motion's own clock, so Pause and Replay hold it too; `emerge={false}` keeps a constant size.
- `TreeRail`, `FolderMark`, `FileMark`, `Sheet`: a file tree. A trunk with square elbows and a junction dot at each child row; folder and page marks; a file as a card with its name as a tracked mono eyebrow, a title and note, and its contents under a dotted rule.
- Figures wash in once, top down, when they scroll into view (about 0.6s, blur to sharp); reduced motion, static export and above-the-fold figures show at once, and `<html data-uipack-entrance="off">` turns it off. `Sheet` takes `flow` and `hint` like a Node; `Lane` takes `flow` so it fades with its column; Sankey bands and bars start a hover.
- `CurvePlot`: one annotated curve: arrowed axes with tracked mono titles and end labels instead of ticks, a monotone smooth curve (it never overshoots a plateau), pinned mono callouts, an accent ring for the highlighted point and a bracket measuring what remains. `curveAt` reads the drawn curve's y at any x.
- `Badge`, `Label`, `Legend`, `Token`, `Defs`: step numbers, text with an underlay, the key, the shape itself, the arrowhead markers.
- `Wall`: solid slabs with a gap at each of its `holes`, standing (`axis="v"`) or lying (`"h"`); one layer of a layered-checks figure. `wallSegments` gives the runs.
- `Cross`: a ✕ where something stops, such as a lost message at the end of a dashed `Connector` with `arrow={false}`.
- `icons`: 25 line glyphs in a 16px box (db, cache, queue, service, client, blob, agent, doc, model, tool, gateway, lock, key, clock, cron, browser, terminal, git, cloud, region, user, robot, chart, warning, more). `marks`: my own marks for the tool family, plus `Wordmark`.
- Geometry: `anchor`, `route`, `pathFromPoints`, `pointAlong`, `trim`, `polylineLength`, `grid`.

## The connector rule

One connector, one arrowhead, at the end, in the request direction. The response is the same points ridden backwards by a `Packet` with `reverse`. Two different relations between the same boxes (pull and push, say) are two connectors 16 units apart. A stub that joins a bus carries no arrowhead; the junction dot marks the join, and only a stub that enters a node gets a head.

Connectors stop 2 units short of their first and last point, and 4 short at the arrow end, so a head never touches a border. Packets start `r + 2` units after the source end and stop 12 before the arrowhead end, measured in the connector's own direction whichever way the packet rides, so a token never overlaps a border or a head. The browser suite checks both on every drawing in the playground.

## Interaction

Hover is opt-in and CSS-driven. Give parts a `flow` name (a string or a list): hovering a `Node` with a flow sets `data-hover-flow` on the figure, every element sharing that flow gets `data-state="hit"` (accent stroke, full opacity) and everything else `data-state="dim"` (opacity 0.35), with a 160ms transition. Hovering a legend item does the same by `kind`, so "Response" lights every response line and packet. A node on its own lifts its surface and turns its border accent on hover. Touch devices get none of it (`@media (hover: hover)`), and reduced motion drops the transition.

## Motion

Packets animate with SMIL `animateMotion` (and an `animateTransform` scale for the pop and the shrink). I picked SMIL over CSS `offset-path` because `Figure` can then drive the whole SVG timeline with `pauseAnimations()` and `setCurrentTime(0)`, which is what Pause and Replay do; every packet keeps its offset after a replay and nothing needs JavaScript per frame. Chromium and WebKit both pass the browser suite on it.

Under `prefers-reduced-motion: reduce` a packet renders once at `at` and never moves, and the controls disappear. `at` defaults to `(0.5 + delay / dur) mod 1`, so packets that share a path spread out instead of stacking on the midpoint. Server rendering also produces the static token; motion starts after mount.

### Text floor

`Figure` takes `minFont` (default 11 CSS px). It measures the width each drawing renders at with a ResizeObserver (1088 assumed before that, and on the server) and turns the floor into user units from the viewBox width, so Node, Lane, Label, Chip, Badge and Group never draw text under 11px however wide the viewBox is. Pass `measuredWidth` when you know the width up front, or `minFont={0}` to turn the floor off. A host that draws figures scaled down with a transform (a thumbnail, a gallery card) wraps them in `FigureLayoutWidthContext.Provider value={designWidth}`, so the floor reads the width they lay out at rather than the scaled one; a Figure's own `measuredWidth` wins.

## Theming

The figure root (`.uipack`) reads every colour, face and radius from the role layer: each
private `--uipack-*` name in `src/theme.css` is an alias for a `--ui-*` role (`--uipack-fg` is
`var(--ui-ink)`, `--uipack-token-request` is `var(--ui-flow-request)`). So a figure takes the
active style's values with no work: Technical by default, another registered style through
`uiStyle` or `data-ui-style` ([style roles](system/style.md)).

Light and dark: dark follows `prefers-color-scheme` and can be forced with `data-theme="dark"`
on `<html>` or on the figure. Strokes are `currentColor`, so one accent per figure does the
highlighting.

A host that is not a registered style may set the `--uipack-*` aliases on `.uipack` itself, in a
rule that loads after uipack's CSS or is more specific (junxiong.dev's Chakra theme does, see the
[site registry](specs/registry.md)); on an ancestor they have no effect, because `.uipack` declares
them. What they no longer reach (the title face, the canvas grid) is in the
[changelog](../CHANGELOG.md#upgrading-from-a-commit-pin). That is a bridge
for an existing site, not the way to restyle: a new look is a spec and a value set in `src/styles`
([how](specs/README.md)), never hex literals in consumer CSS.

## Presets

Seven figures from a small typed spec, each with wide and narrow drawings, packets on the flows that matter, and hover flows wired. Import from `uipack/presets`; every preset ships a `default…` spec and a `…Parts()` function if you want the drawing without the frame.

| Preset | Spec | Shape |
|---|---|---|
| `serviceMap` | `clients`, `platform { title, cells, footer? }`, `resources`, `sinks?` | Three lanes, a bus each side, a change stream below. The Habitat shape. |
| `agentLoop` | `user`, `agent`, `tools`, `boundary`, `output` | Request in, tool calls out and results back, a deterministic check before the output. |
| `ragPipeline` | `sources`, `ingest`, `index`, `query`, `stages`, `answer` | Ingest lane on top writing to an index, query lane below reading from it. |
| `skillLifecycle` | `author`, `evaluate { baseline }`, `version`, `consumers`, `feedback` | Author, evaluate against a baseline, version, install everywhere, feedback back. |
| `syncLoop` | `upstream { items }`, `consumers [{ hooks?, plugin? }]` | One upstream, pull and push per consumer, a one-way plugin read. |
| `beforeAfter` | `before { stages }`, `after { stages, changed }` | Two stacked panels; the changed stage and its inbound edge in accent. |
| `pipeline` | `stages`, `queue? { after, depth }` | A line of stages with a queue between two of them. |

![Service map](presets/serviceMap-light.png)
![RAG pipeline](presets/ragPipeline-light.png)
![Skill lifecycle](presets/skillLifecycle-light.png)
![Sync loop](presets/syncLoop-light.png)
![Before and after](presets/beforeAfter-light.png)
![Pipeline](presets/pipeline-light.png)

`examples/Habitat.tsx` stays as the reference drawing, built from the parts by hand; the diagrams page shows it as the service-map pattern. The page shows the pipeline, before-and-after, sync-loop and agent-loop presets as their patterns; the service-map, RAG-pipeline and skill-lifecycle presets draw shapes the page already covers (the Habitat drawing; a pipeline with a bus fan-in; a loop with a return path), so they are documented here only.

## Static export

`uipack/static` turns a figure into one SVG file with no dependency on the page: every CSS variable
becomes a literal, fonts are declared inline, and the SMIL packets stay in when you want them. Made
for a README, a Markdown site or a slide, where the file goes through `<img>` and `currentColor`
never reaches the drawing.

```ts
import { writeFileSync } from "node:fs";
import { agentLoop } from "uipack/presets";
import { renderStatic } from "uipack/static";

writeFileSync("figure.svg", renderStatic(agentLoop(spec), { theme: "dark", motion: true }));
```

| Option | Default | Does |
|---|---|---|
| `theme` | `"light"` | `"light"`, `"dark"`, or `{ base, ...overrides }` with any `--uipack-*` key as a literal |
| `motion` | `true` | keep `animateMotion` (it runs inside `<img>` in every current browser) or render each packet once at its `at` |
| `frame` | `true` | draw eyebrow, title, caption, legend and the border in SVG; `false` gives the bare drawing |
| `background` | `true` | paint the canvas and its grid; `false` lets the page surface show through |
| `width` | viewBox width | the file's `width` attribute; height follows |
| `minFont` | `11` | text floor in CSS px at the width the file is shown at (1088 when `width` is not given) |

The input is what a preset returns, a `<Figure>` element, or a bare `{ children, viewBox }`. The
asset previews under `docs/assets/` come from the same call, so a preview in the browser and a file
in a README are the same pixels. Tested through `<img>` in Chromium and WebKit: the packets move
when `motion` is on and hold still when it is off.
