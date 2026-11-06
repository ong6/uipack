# Testing uipack

What the unit and browser suites check, how CI runs them and the known engine quirks. For changing
uipack only: the commands to run before a commit are in [AGENTS.md](../AGENTS.md#engineering-and-verification)
(`npm run test:affected`); grading a page you built is [Grading UI work](grading/README.md).

## Grading a page

To grade a page the same way every time (13 mechanical checks at 1440 and 390, light and dark, then blinded pairwise judging and a fixed brief set), see [Grading UI work](grading/README.md): `npm run grade -- check <url> --spec uipack` here, `npx uipack-grade check <url>` in a consumer, or `uipack/grade` from Node.

## Commands

`npm test` runs the Vitest suite in jsdom; it fails on any `console.error` a test did not expect (`test/setup.ts`), and server renders go through `test/on-server.ts` so they take the real server path. `npm run coverage` writes a coverage report to `coverage/` (no threshold). `npm run test:e2e` runs Playwright with one worker: every test in Chromium, and in WebKit the smoke subset tagged `@cross-browser` (keyboard focus and Tab, gestures, smooth scroll, SMIL, WebGL setup, fonts, the built package, each object's default look, three pages of the page audit; tag a test when the engines could differ on it). It serves on port 5179; set `E2E_PORT` when a second checkout, such as a git worktree, runs its own server, or Playwright reuses the other checkout's. What they pin down:

## What the browser suites check

### Figures and the asset browser

- Packets move, hold after Pause, resume on Play, return to the start on Replay, and sit still under reduced motion.
- Hovering a node dims the rest and lights its flow. Hovering a legend item filters by kind. An `href` node takes focus.
- No arrowhead ends inside a node, no packet reaches a head, every bus junction and lane header sits on the 8px grid, and no preset text renders under 11px at 1440, on every drawing in the playground.
- Two packets on one path spread by delay; a departing token clears its source border; a serviceMap with six platform cells wraps its narrow drawing into rows of three and truncates with an ellipsis and a hint.
- The asset browser filters, searches, copies to the clipboard (Chromium only; Playwright cannot grant that in WebKit), and fits 390px with 44px targets.
- Both themes render ten figures with no console errors.
### Charts

- Charts, in the playground's 896px host frame and at 720, 390 and 320:
  - SpanChart shows short layer names with counts at 896 and stacked rows at 720; its key strip is one row at 896 and 1088 with the notes site's longest words. It expands in place from the top or the foot, filters by column heading or chip (kept in sync), combines layer, size, deals and search, and shows a column band under the pointer.
  - It hides empty groups, clears from the empty state, opens rows with their links, honours repeat activation, Escape and hash links, and keeps collapsed rows findable in Chromium. The same flows work as static HTML with JavaScript off, including 160 rows.
  - A host article whose prose CSS loads after `charts.css` keeps every bar under its column.
  - After filtering from the stuck header deep in the list, or collapsing from the foot, the chart top and first result are on screen in Chromium and WebKit.
  - Stress rows (long names, long value labels, long buyer names) never crush a name or cut a badge, and column labels keep 8px apart in every label mode.
  - LayerStack reads top-down with one-line linked bands at 896, dashed zone boxes, bracket rails spanning exactly their layers, no rotated text and no outer frame. It never truncates a constraint, marks hover and focus with an accent edge, and turns rails into a list of nodes on phones.
  - Labels stay at 11px or more with 44px touch targets and no overflow.
  - Unit tests pin grouping, sorting, runs, the breakpoints, the scoped rules, screen-reader sentences, validation, and the 3:1 and 4.5:1 contrast of the cell and badge colours on four palettes.
### Article parts, the built package, 3D, web, mechanism and every page

- Article parts, in the playground's host article and as static HTML (JavaScript off) in a copy of the notes site's article layout and palette, at 390, 896 and 1440 in both themes: no page overflow; one, two or three cluster columns by the cluster's own width; equal card heights in every row; a wide cluster centred on the column; text at 12px or more; 4.5:1 text and 3:1 edges computed from the rendered colours; 44px link targets; the strip's one-line and phone layouts; only cards are filled boxes, the self-test's 3px accent rule against ChangeNote's thinner ink rule, the sentence-case metric label, and 0.9rem between consecutive parts. Cards, rows and the map link are real links that navigate (a planned card is not), keyboard focus draws an accent ring and accent title, hover an accent edge, reduced motion drops the transitions, and host prose CSS loaded after `article.css` does not reach in. Unit tests pin the markup, the accessibility attributes, validation, and that every emitted class is documented in `docs/article.md` and styled, with nothing else styled.
- The committed `dist/` loads in the browser: a page importing the built ESM entries and their CSS (`playground/dist-smoke/`) renders a preset figure and a deck that advances, with no console error.
- Live 3D stories retain one canvas across stops, support direct navigation and reduced motion, and provide a diagram fallback.
- `/web`: DemoPlayer advances when in view, holds after Pause, restarts on Replay, seeks from keyboard step tabs, and renders statically under reduced motion; the spotlight follows the mouse and lights on keyboard focus; both themes fit 390px with 44px targets and no console errors. Motion and backgrounds: the ticker counts only once seen, reveals play, the marquee moves and holds on Pause and hover, aurora and beams pause off screen, the dot grid lights under the mouse, and all of it holds still under reduced motion. Unit tests pin the type scale and compute the 4.5:1 contrast of the web tokens, including text over the aurora at its opacity cap.
- `/mechanism`: the verification gate renders in both themes with no console errors; changing the pose moves the token; reduced motion holds a still frame; the machine is reachable and operable from the keyboard; every drawn line ends on a stroke or a dot (Anatomy's line-end check); thumbnails start no loops. Unit tests pin the gate model, the continuity of every scripted route, unique SVG ids per instance and the vendored licence.
- Every playground page, read from the catalog, is loaded once per width (1440, 390, and 768 for the mobile routes) by `e2e/page-audit.spec.ts`, which runs every page-level check on that load: one h1 and the tab title, sentence-case h2s with no skipped levels, the heading scale, no control falling back to the browser's default face, card rows and side-by-side controls sharing a height, the compact 390px header with 44px buttons, unclipped focus rings, and no page overflow in either theme.
- Object art directions cover every object in each direction it offers (17 pairs from `objectLooks`), in two themes and two viewport widths: one test per object and direction steps through the themes and widths, with a screenshot of each and a render-cost attachment, and holds every combination under 220 draw calls and 100,000 triangles. Each non-Studio direction keeps its paint-rate budget on its heaviest object (Chromium), sampled inside the browser after playback starts.

## CI

CI runs both suites with job timeouts. Browser jobs split Chromium into three shards and run the WebKit subset on a fourth runner, one worker per runner, so software WebGL renderers do not compete for CPU and a retry repeats only the failed case. Linux Chromium runs ANGLE with Mesa llvmpipe under Xvfb: its default SwiftShader Subzero backend missed the existing frame-rate budget on the CI CPU. Renderer names are included in the performance samples. The 15-minute job limit and default 30-second test limit stay bounded. Reports, screenshots, budget measurements, and functional-test retry traces are uploaded for seven days. Timing tests disable trace/video recording to keep measurements independent of capture overhead. Reproduce an art-direction failure with `npx playwright test e2e/art-directions.spec.ts --project=chromium --workers=1 --retries=0`; add `--grep` with its object/direction name to isolate it. Playwright is locked at 1.61.1 because the 1.63 browser build would not download on my network. Bump it when that clears.

## WebKit on macOS

On macOS, this WebKit build can stop navigating on the 64th page one browser opens; the Linux CI runner does not show this limit. `e2e/fixtures.ts` relaunches each worker's WebKit before it gets there, so specs import `test` from `./fixtures`, not from `@playwright/test`.
