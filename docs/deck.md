# Deck player

`uipack/deck` plays a deck in one consistent way: slides on a 1920×1080 canvas scaled to fit, one transition grammar, build steps, an overview with a storyline view, full screen, a synced speaker view, a read view and a print view that saves a PDF. No dependencies beyond React. Run `npm run dev` and open `/deck` for the example, a deck that explains its own transitions.

For what to put on the slides and in what order, read [deck storytelling](deck-storytelling.md) first. The player is the second half of the job.

For information-dense slides in the strategy-consulting style (panels of charts, a "so what", footnotes and sources), use the parts in [consulting slides](deck-consulting.md).

## Your first deck in five minutes

1. **Pick the storyline.** Project update, decision request, deep dive, launch, postmortem or review highlights ([deck storytelling](deck-storytelling.md) has all six, each with the one line leadership should remember).
2. **Get a playable draft.** `starterDeck(template)` returns one stub slide per beat, titled with the template's example claim and showing its title pattern and advice.
3. **Write the titles first.** Rewrite each `headline` with your facts and read them in order (G, then Storyline): that ghost deck is your argument. Slide one names the business outcome, not the system.
4. **Replace each stub's `render`** with the slide that proves its title, and add `notes` (what you'll say).
5. **Check it.** Pass `lint` while you write; the Storyline tab lists what's missing (talk tracks, sources for numbers, an ask without an owner or a date). Remove `lint`, present, then send the PDF.

```tsx
import { DeckPlayer, Slide, starterDeck, type DeckSlide } from "uipack/deck";
import "uipack/deck.css";

const footer = "Search platform · Q3 review";
const draft = starterDeck("project-update", { footer });

// Keep each stub's id and role; replace the rest as you write.
const written: Record<string, Partial<DeckSlide>> = {
  "project-update-1": {
    headline: "Search got twice as fast this quarter, and cheaper to run.",
    render: () => (
      <Slide eyebrow="Q3 review" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Search got twice as fast this quarter, and cheaper to run.</h2>
      </Slide>
    ),
    notes: { say: "Search is twice as fast as in Q2 and costs less to serve. Source: latency dashboard.", delivery: "Slowly." },
  },
};
const slides = draft.map((s) => ({ ...s, ...written[s.id] }));

<DeckPlayer id="q3-review" title="Q3 search review" slides={slides} lint={{ template: "project-update", minutes: 10 }} />;
```

[`examples/deckStarter.tsx`](../examples/deckStarter.tsx) is the same starter as a whole file (tested, so it keeps working): copy it and change its imports to `uipack/deck`.

## A deck by hand

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
| `morph` | The same thing appears on both slides and its change is the point (a number becoming a table row, a title becoming a running header) | `Morph` elements with the same `id` travel and resize; one copy is on screen at a time. Text scales by font-size ratio, so it never stretches, and swaps to the incoming copy in the first 61 ms. The outgoing slide clears in 160 ms (a box around a traveller, such as a KPI tile, loses its fill and border rather than staying as a bare frame). Incoming blocks arrive from 40%, except those the traveller still has to cross, and words on its line, which wait until it lands. |
| `{ zoom: id }` | The next slide is the inside of one part of this one | The camera scales about one fixed point into the `Morph id` element; that element opens, clipped, into the new slide. Everything around the target clears in the first 30% and the target's own words leave before the new slide appears inside it, so two slides never overlap. Scale grows evenly in log space. The incoming tone shows only inside the clip. |
| `fade` / `none` | Rarely | Crossfade / cut. |

Every move reads `deckMotion` (quick 160, base 320, slow 560, morph 760, zoom 1150 ms; settle, exit and travel curves), so a deck never mixes speeds. Reduced motion (`prefers-reduced-motion` or `motion="none"`) turns every move into a 160 ms fade with no movement.

Authoring notes:

- Wrap blocks in `Slide` so `advance` can stagger them. Keep each slide's blocks to a handful.
- `Morph` ids are per pair of slides. Put one on the zoom target. A morph with no shared ids falls back to a fade.
- Morph a number or a short phrase, not its container: wrap the value (`<Morph as="span">`), and the tile or panel around it fades its box.
- For a title that shrinks into a running header, give both copies the same weight, tracking and `max-width` in `ch`, so they break at the same words and the morph is a pure scale.
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

Every cell is also a `Morph` target with its ID, so the next slide can arrive with `transition: { zoom: "next" }` and open out of that box. Tour stops count as build steps; thumbnails and the read view show the overview. At a stop, the other cells keep their shape but hide their words (text cut off at the bento's edge would read as a bug), and a cell's face leaves before its detail arrives, so the two never overlap. Fill a detail to its box: a small chart or a short table reads better under the camera than a sentence floating in space. Classes for cell type: `uipack-deck-bento-label`, `-value`, `-title`, `-note`, and for details `-detail-title`, `-small`, `-list`. `/deck?deck=bento` is the example.

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

## PDF and print

The **PDF / Print** button prints every slide, fully built, one per 16:9 page (1280×720 CSS px, the 13.33×7.5 in slide size), appendix included; the browser's print dialog saves it as a PDF named after the deck's `title`. The player mounts a print copy at the end of `<body>`, and the print stylesheet hides the rest of the page while it prints, so the host page needs no print CSS of its own. Pass `printNotes` to put each slide's headline and talk track beside it (the slide prints at half size on the same page).

`view="print"` renders the same pages in place, for a print-only route: the playground's `/deck?view=print` (add `&notes=1` for notes). In Chromium, `page.pdf({ preferCSSPageSize: true, printBackground: true })` on that page gives one page per slide; `e2e/deck.spec.ts` checks the count. The pages use the deck's theme; print the light theme to save ink.

## Storyline and checks

Give slides a `role` (`cover`, `answer`, `context`, `problem`, `evidence`, `mechanism`, `option`, `recommendation`, `plan`, `risk`, `ask`, `demo`, `appendix`) and a `headline` (the one-sentence action title). The overview's Storyline tab lists the headlines in order: read alone, they should make the argument. Pass `lint` (or `lint={{ template: "decision-request", minutes: 10 }}`) to show `lintDeck` findings there: titles that are labels rather than claims, a missing early answer, no concrete closing ask, unsourced numbers, missing talk tracks, and length against the time budget. Leave `lint` off for the audience. The templates, roles and every rule are in [deck storytelling](deck-storytelling.md).

## URL and position

`initial={{ slide: "id" | index, step }}` opens a position; `onPositionChange({ index, step, id })` reports each change after mount. The playground keeps `?slide=` and `?step=` in the URL, and accepts `?theme=dark`, `?motion=none` and `?view=read|present|print` (`&notes=1` with print).

## Not included

No slide editor, no PowerPoint export, no autoplay. PDF comes from the browser's print dialog (above), so slides print as rendered: text stays selectable, but charts are not editable. Full screen uses the standard Fullscreen API.
