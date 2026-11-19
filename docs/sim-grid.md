# Simulation grid

`SimGrid` plays a simulation as a grid of identical cells (writers, jobs, agents), each starting and finishing at its own time, with live counters above it and the designs it compares on one control. The page supplies the simulation, seeded and deterministic; SimGrid owns the frame, the playback and the drawing. Import it from `uipack`; styles come with `uipack/theme.css`.

## Example

```uipack-demo sim-grid wide
A thousand writers under three commit designs: pick a design or an option, play, pause and reset, and read the counters.
```

## Use

```tsx
import { SimGrid, type SimChoice, type SimRun } from "uipack";

// Pure and seeded: the same choice always gives the same run. Module scope, so its identity is stable.
function simulate({ design, options }: SimChoice): SimRun {
  const start = new Float64Array(1000); // when each cell starts work
  const end = new Float64Array(1000); // when it is done
  // …run your model for `design`, with options.burst and options.slow…
  return { start, end };
}

<SimGrid
  number="Figure 02"
  title="Batching keeps up where one lock falls behind"
  alt="A grid of 1,000 squares, one per writer, that fill in as each writer's commit lands."
  designs={[
    { id: "lock", label: "One lock" },
    { id: "batched", label: "Batched" },
  ]}
  options={[{ id: "slow", label: "Slow disk" }]}
  simulate={simulate}
  labels={{ running: "Waiting on the lock", mean: "Mean latency", count: "Writers done" }}
/>;
```

## Props

| Prop | Meaning |
| --- | --- |
| `designs` | `{ id, label }[]`, at least one: the designs compared, as one row of radio buttons (none with a single design). The first is shown first. |
| `options` | `{ id, label, checked? }[]`: checkboxes that change the simulation's inputs; `checked` is the starting state. |
| `simulate` | `(choice: SimChoice) => SimRun`. `SimChoice` is `{ design, options }` (each option id to its checked state). Called during render for each choice shown, and once for the first design to set the speed, so it must be pure; pass a stable function. |
| `duration` | Real seconds the first design, with its starting options, takes to play. Every design plays at that same speed, so a slower design takes longer. Default 8. |
| `labels` | Any of `waiting`, `running`, `done` (the key), `time`, `mean`, `count` (the counters) and `designs` (the design control's name). Defaults: Waiting, Running, Done, Simulated time, Mean time to done, Done, Design. |
| `formatTime` | `(t) => string` for the clock and the mean. Default one decimal and " s". Counts use en-US grouping (1,000). |
| `number`, `eyebrow`, `title`, `headingLevel`, `caption`, `alt`, `theme`, `uiStyle`, `className`, `id` | As on `Figure`. `alt` names the grid for assistive technology. |
| `static` | Hold the finished run: no autoplay, no Play or Reset. The design and option controls stay. |

`SimRun` is `{ start?, end }`: two arrays (plain or typed) of one simulated time per cell, in the unit `formatTime` prints. `start` omitted means every cell starts at 0. A cell is waiting before `start`, running from `start` and done from `end` (an `end` before its `start` is read as `start`). Arrays of different lengths, or a time that is not a finite number, throw. The cell count may differ between designs.

Per-cell times rather than a step function: SimGrid reads any moment of a run directly (a binary search over the sorted times), so Reset, a design switch at the same moment, the finished frame and the server render are all one read, never a replay from zero. A model that steps (a queue, an event loop) runs to completion once and returns the times; the demo's `simulateWriters` (`playground/figures/simGrid.tsx`) is one.

## What it shows

- **Cells.** One square per cell in reading order, about 5:2 in a wide figure and 2:3 below 720px (1,000 cells are 50 by 20, or 25 by 40 on a phone). A cell's pitch never drops under 6px: with more cells than that fits, the grid grows taller rather than finer (5,000 cells are 112 columns of about 7px at a 790px figure, and 54 columns of 6px at 390px). Shape carries the state as well as colour: waiting is a hollow outline, running a small solid square in the request colour (the main flow), done the full square in the response colour. The key names each, and pointing at a key entry fades the other states to 0.35.
- **Counters.** A title block of ruled cells, each label first in tracked mono caps and its figure in the heading face with tabular digits: the simulated clock, the mean of (end − start) over the cells done so far, and cells done out of all. Each figure's widest text is reserved, so nothing shifts while the numbers change.
- **Controls.** The designs as radio buttons (arrow keys move between them), the options as checkboxes, Play/Pause, Reset and Open canvas as buttons: real form controls with 44px targets and the figure's focus ring. Open canvas shows the figure in the zoomable canvas dialog, as `Figure` does, always with the wide grid at least 800px across, so cells grow on a phone; playback carries on in it at the same moment. On a quiet `uipack/web` page (`WebSurface`) there is no Open canvas.

## Playback

- **At rest it is finished.** The server HTML and the first paint show the finished run, so a capture or a reader who never scrolls to it sees the outcome. As it nears the viewport it rewinds once and plays while a quarter of its grid is on screen; scrolled away it pauses and picks up where it was when it comes back.
- **Play, Pause, Reset.** Pause holds the moment; Play continues, or starts again from zero on a finished run; Reset goes back to zero and waits, every cell waiting. A press before it reaches the viewport cancels the autoplay.
- **Comparing designs.** Switching design or option keeps the simulated moment of a run in progress or paused (clamped to the new run's end), so the counters compare designs at the same time; a finished run switches to the other design's finished run.
- **Reduced motion and `static`.** The finished run, nothing moving, no Play or Reset; switching design or option shows that run finished.
- **Announcements.** A polite status line says when it is paused, finished, reset or switched, with the counters at that moment; it is silent while it plays.

## Performance

The drawing is three SVG paths, one per state, however many cells: no element per cell, no canvas, so the role colours and light and dark come from CSS and the server HTML holds the finished grid. While it plays, a frame advances a ref and writes the counters in place (a binary search over the sorted times, under a microsecond); the three paths are rebuilt only on a frame where a count changed, with no React render per frame.

Measured in headless Chromium on an Apple-silicon Mac (2026-11-19). The model and the repaint, timed alone on a 760px-wide grid repainted every frame for 180 frames:

| Cells | Prepare a run | Repaint (build and set the three paths) | Same, CPU throttled 4× | Frame interval |
| --- | --- | --- | --- | --- |
| 1,000 | 0.3 ms | 0.11 ms mean, 0.2 ms p95 | 0.5 ms mean, 0.9 ms p95 | 16.7 ms (60 fps) |
| 5,000 | 1.3 ms | 0.5 ms mean, 0.6 ms p95 | 2.2 ms mean, 2.7 ms p95 | 16.7 ms (60 fps; 17.2 ms mean throttled) |

Preparing a run (sorting the times) happens once per design and option set shown.

The mounted demo (this page's figure, with its cell count raised for the run), playing for 3 seconds: 1,000 and 5,000 cells both held a 16.7 ms mean frame interval (p95 16.7–16.8 ms), with and without 4× CPU throttling, and one long animation frame (over 50 ms) in each 3-second run.

## Limits

- No static export (`uipack/static`) and no per-cell hover or selection; the key's hover is the drawing's one pointer response.
- Three states. A failed or retried cell is not drawn; give it its final `end`.
