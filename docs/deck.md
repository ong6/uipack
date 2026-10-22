# Deck player

`uipack/deck` plays a deck in one consistent way: slides on a 1920×1080 canvas scaled to fit, one transition grammar, build steps, an overview with a storyline view, full screen, a synced speaker view and a read view. No dependencies beyond React. Run `npm run dev` and open `/deck` for the example, a deck that explains its own transitions.

For what to put on the slides and in what order, read [deck storytelling](deck-storytelling.md) first. The player is the second half of the job.

For information-dense slides in the strategy-consulting style (panels of charts, a "so what", footnotes and sources), use the parts in [consulting slides](deck-consulting.md).

```tsx
import { DeckPlayer, Slide, Morph, Build, type DeckSlide } from "uipack/deck";
import "uipack/deck.css";

const slides: DeckSlide[] = [
  {
    id: "answer",
    title: "Latency",
    headline: "Caching cut p95 latency by half.",
    role: "answer",
    render: () => (
      <Slide eyebrow="Search latency" footer="Platform review">
        <Morph id="headline" as="h1" className="uipack-deck-title">Caching cut p95 latency by half.</Morph>
      </Slide>
    ),
    notes: { say: "…", delivery: "Pause after the number.", next: "Here is where the time went." },
  },
  {
    id: "where",
    title: "Where the time went",
    transition: "morph",
    render: () => (
      <Slide footer="Platform review">
        <Morph id="headline" as="p">Caching cut p95 latency by half.</Morph>
        <Build step={1}>…</Build>
      </Slide>
    ),
  },
];

<DeckPlayer id="platform-review" title="Platform review" slides={slides} theme="light" />;
```

Slide type comes from classes on the canvas scale, so every deck sets text the same way: `uipack-deck-eyebrow`, `-label`, `-title` (120px), `-heading` (76px), `-lede`, `-body` (32px) and `-number` (a 360px figure). Slide colours come from the tone (`paper`, `ink`, `accent`) and the deck tokens (`--deck-fg`, `--deck-muted`, `--deck-accent`, `--deck-rule`, `--deck-radius`). A new part or chart follows [contributing](contributing.md#a-new-slide-part-or-chart).

## Transitions

A slide's `transition` says how it arrives; going back plays it in reverse. Jumps (overview, Home/End) crossfade.

| Value | Use it when | What happens |
| --- | --- | --- |
| `advance` (default) | Almost always | The outgoing slide steps aside; the incoming slide's top-level blocks settle in, in reading order. The footer stays put. |
| `morph` | The same thing appears on both slides and its change is the point (a number becoming a table row, a title becoming a running header) | `Morph` elements with the same `id` travel and resize. Text scales by font-size ratio, so it never stretches; it may rewrap, so its two copies swap early in the flight. Everything else fades. |
| `{ zoom: id }` | The next slide is the inside of one part of this one | The camera scales about one fixed point into the `Morph id` element; that element opens, clipped, into the new slide. Scale grows evenly in log space. |
| `fade` / `none` | Rarely | Crossfade / cut. |

Every move reads `deckMotion` (quick 160, base 320, slow 560, morph 760, zoom 1150 ms; settle, exit and travel curves), so a deck never mixes speeds. Reduced motion (`prefers-reduced-motion` or `motion="none"`) turns every move into a 160 ms fade with no movement.

Authoring notes:

- Wrap blocks in `Slide` so `advance` can stagger them. Keep each slide's blocks to a handful.
- `Morph` ids are per pair of slides. Put one on the zoom target. A morph with no shared ids falls back to a fade.
- Tables inside morph slides need `border-collapse: separate`, or their collapsed borders ignore row fades.
- `render` receives `{ step, active, thumbnail, theme, reducedMotion }`. Render something still and cheap when `thumbnail` is true: the overview, read view and speaker view render every slide. Never start a WebGL scene in a thumbnail.

## Builds

`<Build step={n}>` reveals at step `n` (1-based). Next reveals the remaining builds before it changes slide; going back into a slide lands fully built.

## Bento slides

`Bento` lays out containers on a grid (`columns` × `rows`; each `BentoCell` spans `col` × `row`), Apple-keynote style. Give it a `tour` of cell IDs and Next moves a camera from cell to cell inside the bento's own box (the heading and footer stay put), dimming the rest; after the last stop it pulls back to the whole grid. A cell's `detail` replaces its face while the camera is on it: write it small, because the camera scales the cell up (up to `maxScale`, default 3), so a dense slide stays readable one box at a time.

```tsx
<Slide footer="Q3 review">
  <h2 className="uipack-deck-heading">Four numbers and two lists tell the whole quarter.</h2>
  <Bento columns={6} rows={4} tour={["latency", "shipped"]}>
    <BentoCell id="latency" col={3} row={2} detail={<LatencyBreakdown />}>
      <p className="uipack-deck-bento-label">p95 latency</p>
      <p className="uipack-deck-bento-value">198<small>ms</small></p>
    </BentoCell>
    <BentoCell id="next" col={2} row={2} tone="ink">…</BentoCell>
  </Bento>
</Slide>
```

Every cell is also a `Morph` target with its ID, so the next slide can arrive with `transition: { zoom: "next" }` and open out of that box. Tour stops count as build steps; thumbnails and the read view show the overview. Classes for cell type: `uipack-deck-bento-label`, `-value`, `-title`, `-note`, and for details `-detail-title`, `-small`, `-list`. `/deck?deck=bento` is the example.

## Controls

| Key | Action |
| --- | --- |
| → ↓ Space PageDown | Next build, then next slide |
| ← ↑ Shift+Space PageUp | Back |
| Home / End | First / last slide |
| G | All slides: thumbnails, or the Storyline tab |
| S | Speaker view in a second window |
| F | Full screen |
| Swipe | Next or back on touch screens |

Keys work while the deck has focus (`keyboard="focus"`, the default) or anywhere on the page (`keyboard="global"`). Keys typed into inputs, and Space/Enter on buttons and links inside slides, are left alone. Mark a region `data-deck-keys="own"` to keep its keys.

## Speaker view

The Speaker view button opens the same page with `presenter=1` (override with `presenterHref`) and the host renders `mode="presenter"`. Windows showing the same deck `id` stay in step over `BroadcastChannel`, both ways; opening a speaker window never moves the audience. It shows the current slide, the next slide, the talk track (`notes`: say, delivery, bridge), the slide's role and the question it answers, and a clock.

## Read view

`view="read"` (or the Read button) stacks every slide, fully built, with its talk track. Use it on phones and for decks people read on their own after you have presented. The playground opens it by default below 600px.

## Storyline and checks

Give slides a `role` (`cover`, `answer`, `context`, `problem`, `evidence`, `mechanism`, `option`, `recommendation`, `plan`, `risk`, `ask`, `demo`, `appendix`) and a `headline` (the one-sentence action title). The overview's Storyline tab lists the headlines in order: read alone, they should make the argument. Pass `lint` (or `lint={{ template: "decision-request", minutes: 10 }}`) to show `lintDeck` findings there: titles that are labels rather than claims, a missing early answer, no concrete closing ask, unsourced numbers, missing talk tracks, and length against the time budget. Leave `lint` off for the audience. The templates, roles and every rule are in [deck storytelling](deck-storytelling.md).

## URL and position

`initial={{ slide: "id" | index, step }}` opens a position; `onPositionChange({ index, step, id })` reports each change after mount. The playground keeps `?slide=` and `?step=` in the URL, and accepts `?theme=dark`, `?motion=none` and `?view=read|present`.

## Not included

No slide editor, no PDF or PowerPoint export yet, no autoplay. Full screen uses the standard Fullscreen API.
