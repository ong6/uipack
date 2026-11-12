# Web performance

The load and paint numbers measured on the `/web` demo, the method behind them, and what changed
each one. The checklist they serve is in [Web discoverability](../web-discoverability.md).

Two methods, which disagree on mobile LCP by more than a factor of two. Use Lighthouse for the
absolute number and the trace for comparing changes.

These measurements (2026-10-23) were taken when `/web` rendered in the former Landing style, since
removed (git history keeps its spec), with its Instrument Serif display faces. `/web` now renders
in Technical, which fetches five IBM Plex files (about 101 KB) and preloads only Plex Sans 600; the
method and the lessons below still apply, the absolute numbers have not been re-measured.

## Lighthouse

**Lighthouse** 13.5 (CLI, headless Chrome, default mobile and `--preset=desktop`, simulated
throttling), median of 3 runs, built playground (`vite build`, `vite preview`), 2026-10-23, after
the playground's lazy-route change (below):

| Route | Profile | Performance | FCP | LCP | CLS | TBT | JS transferred |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/web` | Mobile | 99 | 1.44 s | **1.67 s** ¹ | 0 | 0 ms | 81 KB |
| `/web` | Desktop | 100 | 0.35 s | 0.45 s ¹ | 0 | 0 ms | 81 KB |
| `/` | Mobile | 99 | 1.59 s | 1.96 s | 0 | 6 ms | 128 KB |
| `/` | Desktop | 100 | 0.39 s | 0.45 s | 0 | 0 ms | 128 KB |

Before it, `/web` on mobile scored 92 with LCP **3.16 s** (FCP 1.81 s, CLS 0.019, 151 KB of JS),
over the 2.5 s "good" threshold. Lighthouse's simulation charges the whole dependency chain to the
throttled link, and every request that finished before the observed LCP: the HTML, then the
128 KB playground entry chunk (57 % of it unused on `/web`), then the `/web` route chunk, plus
the nine Landing font files the example's layout requested in the same frame as the intro
paragraph (the LCP element, below). The fix was in the playground shell, not in `uipack/web`:

- The entry holds React, the shell and the catalog only (56 KB compressed); every page is a lazy
  chunk with its own CSS, and the entry's render-blocking CSS is the shell's alone (3 KB, was 12 KB).
- `index.html` preloads the current page's chunk and CSS, so they load beside the entry, not after it.
- `/web` paints its intro and page index first and renders the example in the next task, so its
  font requests start after the LCP paint. Without that step mobile LCP was 2.59 s.
- `/web` no longer loads `presentations.css` (8 KB compressed), which styles only `/styles`.

The specimen's two comparison faces (IBM Plex Serif, Space Grotesk; playground only) now load
when their toggle nears the viewport, not with the page. Same method, 2026-10-23: `/web` mobile
fetches 7 font files (143 KB) instead of 9 (176 KB), and 240 KB in total instead of 273 KB.
Score, FCP and LCP are unchanged (99, 1.43 s, 1.67 s): those files were never on the LCP path.

`/` trades some mobile LCP (1.56 s before, when its sections were in the entry chunk) for an
entry chunk less than half the size; its score is unchanged.

## Playwright trace

**Playwright trace**, the table below: Chromium via Playwright with `PerformanceObserver` (LCP,
layout shift, long tasks), DevTools throttling applied to the real load, cache disabled, median of
7 runs per profile on the same machine. It reports what one throttled load observed, so its mobile
LCP (about 1.4 s) is far below Lighthouse's estimate; it isolates the effect of each change:

- **Mobile**: 390 × 844, 4× CPU throttling, 150 ms RTT, 1.6 Mbps down.
- **Desktop**: 1440 × 900, no CPU throttling, 40 ms RTT, 10 Mbps down.

CLS on load counts shifts in the first 4 s; CLS on scroll counts shifts while the page is scrolled
to the bottom in 80 % viewport steps. TBT sums long-task time over 50 ms after FCP.

| Profile | Metric | Before | Kit only (no preload) | After |
| --- | --- | --- | --- | --- |
| Mobile | FCP | 920 ms | 928 ms | 900 ms |
| Mobile | LCP | 1408 ms | 1440 ms | 1376 ms |
| Mobile | CLS on load | 0.019 | 0.019 | 0.019 |
| Mobile | CLS on scroll | 0.0001 | 0.0001 | 0.0001 |
| Mobile | TBT | 67 ms | 61 ms | 25 ms |
| Desktop | FCP | 208 ms | 204 ms | 236 ms |
| Desktop | LCP | 340 ms | 348 ms | 372 ms |
| Desktop | CLS on load | **0.054** | 0.047 | **0.011** |
| Desktop | CLS on scroll | 0 | 0 | 0 |
| Desktop | TBT | 0 ms | 0 ms | 0 ms |

"Kit only" is the final code with the font preload removed from the HTML, to separate the two
changes. Run-to-run spread on this shared machine was about ±50 ms for mobile LCP and ±40 ms for
TBT, so the mobile differences are noise; the desktop CLS drop is not. In this trace all three are
inside the "good" thresholds (LCP ≤ 2.5 s, CLS ≤ 0.1); Lighthouse's mobile LCP, above, is not.

¹ **Re-measured at the final review** (same method, 2026-10-23): `/web` mobile scores 98 with FCP
1.36 s and LCP **2.44 s** (desktop 100, FCP 0.35 s, LCP 0.54 s; CLS 0 and TBT 0 ms on both), 242 KB
in 16 requests, 143 KB of it the seven Landing font files. The LCP element is now the Landing
hero's headline (`h1#web-hero-title`, Instrument Serif with an italic `<em>`, 26,000 px² at
390 px), larger than the playground intro paragraph (15,200 px²) that was the LCP before.

The 2.44 s is a property of Lighthouse's simulation, not of what a phone sees. Lantern charges LCP
with every request that finished before the LCP in the unthrottled load it observes; served from
localhost, all seven fonts finish (about 113 ms) before the headline's first paint (about 136 ms),
so their 143 KB are simulated on the throttled link ahead of it. On a real first visit the faces
are `font-display: swap`, the headline paints in the metric-matched fallback, and Chrome does not
report a new LCP when the face swaps in: with every woff2 delayed by 1.5 s, the headline's LCP
entry stays at the fallback paint (92 ms in a local Chromium load), with no later entry.

Tried for the review, median of 3 each, mobile LCP against 2.44 s:

| Change | Mobile LCP | Why |
| --- | --- | --- |
| Preload the two display faces on phones too | 2.57 s (worse) | They start with the scripts and share the throttled link with them; the hero's five Plex faces still load after the render. |
| Preload all six faces the hero uses | 2.43 s (same) | The bytes before the paint are unchanged; FCP rose to 1.44 s. |
| `font-display: optional` on the display faces | 2.42 s (same) | The requests and their timing are unchanged, and a slow first visit would keep the fallback for the whole page view. |

So the playground keeps its preload at 720 px and wider only (below), and the faces keep
`swap`. Six of the seven font files are used inside the hero on a phone (Plex Sans 400 and 500,
Plex Mono 400 and 600, Instrument Serif and its italic; Plex Sans 600 sets text above it),
so deferring the others would not shrink the hero's path either. The lever left is bytes: fewer
or smaller faces on the first screen, which is a design decision, not a loading one.

Before the final review, LCP on this page was the playground's own intro paragraph
(`p.collection-intro`, system font), not the Landing hero, because the shell renders above the example. The trace table predates the
lazy-route change; the CLS it shows (0.011 on desktop, 0.019 on mobile) was the playground's
Suspense fallback being replaced by the whole page. The shell now stays and the page fills in
below it, and Lighthouse measures CLS 0 on both profiles.

## What changed the hero LCP

**What changed it.** Before, the hero headline was laid out in the metric-matched fallback and then
re-wrapped when Instrument Serif (normal and italic) arrived: the first text run widened by 19 px at
1440 px and the headline gained a line, moving the subhead 62 px (CLS 0.042). The fallback
metrics match the average character width, not every string, so a centred display headline can
still re-wrap. Preloading the two display faces lets them arrive before the hero renders. The cost
is bandwidth at the start: about 30 ms of desktop FCP and LCP for 43 KB of fonts, against 0.042 of CLS removed. A first
version preloaded on every viewport and cost mobile about 200 ms of FCP and 280 ms of LCP on the
throttled link (1124 / 1636 ms), for no CLS gain there: at 390 px the swap moved nothing. So the
playground preloads at 720 px and wider only (`fontPreloads({ media: "(min-width: 720px)" })`;
its `index.html` turns the links on for `/web` in a build). `fetchpriority="low"` on the preload
did not recover the mobile cost (1136 / 1688 ms).

The other changes (single-copy server text, the transcript, the marquee copy after mount) do not
move these numbers; they change what crawlers read.

## Verified, unchanged

**Verified, unchanged:** `font-display: swap` on every face; motion does no work before it is in view
(`DemoPlayer`, `TextScramble`, `NumberTicker` start from IntersectionObserver; `Marquee`, `Aurora`
and `BeamLines` start paused and pause again off screen); `useScrollProgress` reads layout once per
animation frame and only while in view; no long tasks while scrolling on desktop.
