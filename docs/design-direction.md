# Design direction

The design system (philosophy, the style/writing/layout layers and their per-medium rules) is in [system/](system/README.md). This page covers the playground shell, catalog taxonomy, interaction polish and acceptance.

## The product structure

UIPACK is a library of reusable visual explanations. The browser organizes two independent axes:

| Axis | Values |
| --- | --- |
| Content type | Diagrams (architecture diagrams, charts, article parts), Presentations, Motion & 3D, Web, Foundations (styles, icons and marks) |
| Visual style | Technical (default: diagrams, decks, and the default web style); Landing (the generic landing page); Graphical (poster web pages and decks); Mechanism for crafted isometric machines; Studio, Paper, Kinetic, Cartoon, Realistic and Abstract for 3D objects. Technical, Landing and Graphical are value sets of one role layer (`src/styles`), swapped with `uiStyle` / `data-ui-style` |

The Styles collection is the index of visual languages. Light and dark are themes within a style. Do not use “slides” as the name for all 3D content. The existing `uipack/slides` API and `/slides` URL remain compatibility paths.

`playground/catalog.ts` owns gallery metadata. An animation entry has an ID, title, content type, style ID, and tags. Search and technique filters read metadata instead of relying on array indices. A new collection should reuse the shared shell. A future style should add its own registry entry, renderer or component mapping, scoped stylesheet, and examples. Register a style only when that implementation exists. The shell keeps its Technical navigation language. Object scenes additionally implement Studio, Paper, Kinetic, Cartoon, Realistic and Abstract art directions, each with separate geometry and scoped stage tokens.

## Landing style

Landing is the generic landing option of `uipack/web`, shown at `/web?style=landing`; the default web style is Technical. Its values live in `src/styles/landing.css`: a cool neutral page, a pale grey tint for bands and panels, and one cobalt accent reserved for calls to action and the hero's star. It sets type in three self-hosted roles (Instrument Serif display from heading step 4, IBM Plex Sans text, IBM Plex Mono labels and data) on a 16px × 1.25 scale, 12px cards with layered soft shadows, with opacity hierarchy (100/87/66), a 12/8/4 container grid and 8-pt spacing. It never recolours Technical, and the shared shell keeps its Technical navigation. The rules and their sources are in [web principles](web-principles.md).

## Mechanism style

Mechanism is `uipack/mechanism`, shown at `/mechanism`: one isometric machine whose working is the explanation, after Anatomy (MIT). It reads the active style's roles under `.uipack-mechanism` (in Technical: paper `#f3f6f9`/`#fcfdfe`, Prussian ink `#0b2748`, amber `#9c5700`; dark `#0a2342`, `#0d2a4f`/`#12345f`, `#edf3fb`, gold `#f0c45a`), derives its four solid tones from them and maps Anatomy's tones onto it: base `lo`, structure `mid`, subject `hi`, and one `lit` part in the accent. Labels sit in the card corners in small uppercase mono, never in the drawing. Topology stays with Figures and camera tours with 3D animations. See [the Mechanism guide](mechanism.md).

## Technical style

Technical is "Cyanotype" (chosen blind on 2026-11-05 over four alternatives, including the earlier warm-paper, forest-green, IBM Plex set, which read as a generic AI default): every page is a blueprint.

- Light: cool white sheet (`#f3f6f9`), near-white figure surfaces (`#fcfdfe`), Prussian-blue ink (`#0b2748`, not near-black), one amber accent (`#9c5700`, the same value for fills, strokes and text; it leans orange so it never reads olive).
- Dark: the cyanotype itself, deep Prussian blue (`#0a2342`, surfaces `#0d2a4f`, `#12345f`), pale ink (`#edf3fb`), gold accent (`#f0c45a`). Never a near-black dark half.
- Square corners and 1px hairlines; the drafting-film grid (12px minor, 60px major) behind the hero and on the figure canvas only, never as page wallpaper; dimension-line section heads, ink crop marks on cards, ringed step numbers, a 7px amber eyebrow dot; the headline's key phrase in ink over an amber underline in light, gold in dark; a Prussian primary button in light, gold in dark.
- Diagram colour jobs are fixed: accent rings mark numbered steps and the one highlighted path; cyan squares (request) are the main flow; green circles (response) are the return path; violet diamonds mean changes; red (`--ui-flow-error`) marks an error or declined branch. Preserve shape as well as colour.
- Data colours are separate from the flow colours and appear only where data needs them. The consulting deck's charts carry a signed pair, positive green (`#2b7a4b`; dark `#8be6ae`) and negative red (`#c2392b`; dark `#ff8c7a`), and a four-slot categorical set; `src/deck/consulting/consulting.css` owns them. The red is a deliberate data colour, used only on negative values (a falling bar, a down delta), and every one is also carried by a sign or an arrow. It is never an accent, a status or a decoration in Technical chrome.
- One type system on page, slide and figure: Archivo Expanded 600 (Archivo at 112.5% width, like drafting lettering) for every heading, Archivo for text, Martian Mono for metadata, IDs, labels and controls. Self-hosted in `uipack/fonts`, metric-matched fallbacks, only the display face preloaded. Mono captions and secondary text stay at 12px or more and 4.5:1 in both themes.
- One heading scale on every playground page: page title (`h1`) 40px / 700; section heading (the shell's `h2`) 24px / 650, 22px below 540px; card, figure and scene titles 18–20px / 600 (`.uipack__title` is 20 / 600). A title inside a card never outranks the section it sits in. Sample content keeps its own scale: slides, the Landing page and the docs prose. Every slide headline (deck, slide starters, the narrative example, the slide player) takes the deck's treatment: the style's display face (Archivo Expanded in Technical) at its display weight. `e2e/page-audit.spec.ts` checks that section headings share one size on every page and that figure and card titles stay below it.
- One shared page width, header, navigation, theme control, and active-page indicator. Theme survives navigation and reload through URL parameters.
- Cards that share a row share a height, and their action row (links, buttons) sits on the card's bottom edge, so actions line up across the row however long each description is. Build cards as a flex column with the action row at `margin-top: auto`.
- One radius scale. Technical's roles are square (`--ui-radius: 0`): figure, chart, article and Mechanism frames, web cards and buttons. The playground shell keeps 6px (`--show-radius`) for its own cards, frames and controls (style cards, slide starters, the Speaker guide, selects, section-jump links); nodes inside a drawing keep a 6px corner. Landing keeps its own scale inside `.uipack-web` (16px cards, 12px panels, 8–10px rows, round pills); the shell's chrome around a Landing sample stays at 6px.
- One control set in the playground (`playground/showcase.css`): `--show-control-font` (the shell mono at 500, 13px; `--show-control-font-sm` is 12px for controls inside a figure or stage frame) and `--show-control-radius` (6px). The shell reads Technical's faces on `<body>` (`--show-font-sans`, `--show-font-mono`, `--show-font-display`): Archivo, Martian Mono and Archivo Expanded for its titles. Mechanism, shown in the shell, gets the same face through its `--font-mono` hook. Option tiles (the 3D scene list and art directions) are deliberately the shell sans.
- Two eyebrows. The shell eyebrow, for small labels in the shell's chrome (a figure's "Figure 01 · …", a Mechanism plate's corners, a 3D stage's edition), is tracked mono caps from `--show-eyebrow-font` and `--show-eyebrow-tracking` (600, 12px, 0.08em); each library reads them with the same values as its fallback. A slide's footer, and its eyebrow on the rare slide that has one (slides have none by default), take the deck's (`.uipack-deck-eyebrow`, `.uipack-deck-footer`): tracked mono caps, the eyebrow in the accent, the footer muted, wherever the slide is drawn (the deck, the slide starters' SVG, the narrative example). The Speaker guide's labels take the deck speaker view's tracked caps.
- Restrained borders and small radii. Glow is a selection signal, never ambient decoration, with one exception: a drillable node (`DrillNode`) carries a soft, translucent accent glow and a faint preview of the figure inside it, the affordance for "there is more in here". It is softer than the selection ring, never applied to anything else, and backed by a visible marker and an accessible name, so it never carries meaning alone. Text and selected state explain the same thing without relying on glow.

## Interaction and mobile

Click or tap a semantic component to select it. Enter/Space do the same. A drawing is one Tab stop; the arrow keys move between its parts. Selecting another item replaces the selection; repeat activation, Escape, or the empty canvas clears it. There is no separate clear button. A selection must reveal something: a short `hint` note beside the item, or a pinned flow highlight. Parts with neither are not buttons. Nodes with href retain normal navigation. Lines, lane headings, and motion tokens remain explanatory marks rather than artificial buttons.

Use authored stacked drawings below 720px where available. Dense drawings without a narrow alternative keep a readable internal width with horizontal scrolling. Opening a canvas offers a wide drawing with zoom and scroll. Expanded canvases support trackpad and touch pinch zoom, preserve native scrolling, and expose keyboard zoom/reset. Figure zoom stays anchored to the pointer; 3D zoom uses the authored camera target. Free 3D orbit is not implemented. Check page overflow, label sizes, clipping, control reachability, focus, and reduced motion at 390px.

Canvas is an inspection workspace, distinct from the presentation layout. It uses a native modal dialog, contains focus, closes with Escape, and returns focus to the opener. A figure or renderer may remount when entering/exiting it; it is not a second simultaneous copy of the SVG IDs or GPU scene. Presentation mode remains an in-page full-window view.

## Interaction polish (the standard for every new part, figure and page)

Small touches are part of the finish, not extras (owner, 2026-11-04). Every new visual ships with them, and a review asks for them:

- **Hover on what a reader points at.** Anything that names a flow, a file, a band or a callout answers the pointer: a Node-style accent stroke and raised fill, or the flow highlight (its flow stays, the rest fade to 0.35). Bands and bars start a hover like a Node; lines, lane headings and moving tokens fade with their flow but never start one. Hover changes stroke, fill and opacity only, never a glow (glow means selection) and never layout.
- **One timing.** 120–160ms `ease` for colour, border, fill and opacity; 2–3px nudges for arrows; `cubic-bezier(0.2, 0.7, 0.2, 1)` (the deck's `--deck-settle`) for anything that travels. Gate hover in `@media (hover: hover)` and every transition in `@media (prefers-reduced-motion: no-preference)`.
- **Entrance once, on scroll, over a drawing that is already there.** A figure is painted finished from the first frame. One that starts below the fold washes in from the top down when its first pixel reaches view, in about 0.6s: each top-level part fades up 6px from a 2px blur, delayed 0–240ms by where its top edge sits (`src/entrance.ts`, a keyframe at the end of `theme.css`), ease-out-quint, so nothing arrives one by one. Nothing ever waits hidden for an observer, so a full-page capture, a jump to the bottom or a fast scroll still shows every drawing. HTML charts and article parts use the CSS-only `animation-timeline: view()` version. No JavaScript, reduced motion, static export, print and above-the-fold figures never animate; `static` on a `Figure` (or a preset's `figure`) holds the resting frame. A host turns it off with `<html data-uipack-entrance="off">`.
- **Motion tokens arrive and leave.** A `Packet` pops out slightly as it leaves a box and shrinks away as it arrives, on the motion's own clock.
- **Keep it quiet.** One small response per interaction; no hover on slide content, bento cells or a canvas being presented; nothing that suggests a click where none exists. Touch gets the selection, not the hover.

## Presentation composition

Use a sequence with a point, not a succession of spinning objects:

1. Opening: one thesis and generous whitespace.
2. Argument: the problem, constraints, or three supporting points.
3. Explanation: a labelled figure or 3D scene with short narration.
4. Comparison: explicit before/after statements and their consequences.
5. Closing: a takeaway and a concrete next decision.

The Presentations collection demonstrates this sequence. It is an editable code example, not a deck editor, export engine, or template marketplace. Keep one scene mounted across chapter transitions when possible. Never put every paragraph into the scene's labels.

## Acceptance

Inspect both light/dark and desktop/mobile in a browser. Verify touch/keyboard selection, modal focus return, zoom bounds, internal scrolling, live 3D fallback, and reduced motion. Report tested behaviour separately from visual judgement. A passing screenshot or test is not permission to deploy.
