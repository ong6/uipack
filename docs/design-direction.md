# Design direction

## The product structure

UIPACK is a library of reusable visual explanations. The browser organizes two independent axes:

| Axis | Values |
| --- | --- |
| Content type | Diagrams (architecture diagrams, charts, article parts), Presentations, Motion & 3D, Web, Foundations (styles, icons and marks) |
| Visual style | Technical diagrams; Landing for web pages; Mechanism for crafted isometric machines; Studio, Paper, Kinetic, Cartoon, Realistic and Abstract for 3D objects |

The Styles collection is the index of visual languages. Light and dark are themes within a style. Do not use “slides” as the name for all 3D content. The existing `uipack/slides` API and `/slides` URL remain compatibility paths.

`playground/catalog.ts` owns gallery metadata. An animation entry has an ID, title, content type, style ID, and tags. Search and technique filters read metadata instead of relying on array indices. A new collection should reuse the shared shell. A future style should add its own registry entry, renderer or component mapping, scoped stylesheet, and examples. Register a style only when that implementation exists. The shell keeps its Technical navigation language. Object scenes additionally implement Studio, Paper, Kinetic, Cartoon, Realistic and Abstract art directions, each with separate geometry and scoped stage tokens.

## Landing style

Landing is the web style of `uipack/web`, shown at `/web`. Its tokens live in `src/web/web.css` under `.uipack-web`: a neutral page, a secondary tint for bands and panels, and one indigo accent reserved for calls to action and the hero's star. It sets type in three self-hosted roles (Instrument Serif display from heading step 4, IBM Plex Sans text, IBM Plex Mono labels and data) on a 16px × 1.25 scale, with opacity hierarchy (100/87/66), a 12/8/4 container grid and 8-pt spacing. It never recolours Technical, and the shared shell keeps its Technical navigation. The rules and their sources are in [web principles](web-principles.md).

## Mechanism style

Mechanism is `uipack/mechanism`, shown at `/mechanism`: one isometric machine whose working is the explanation, after Anatomy (MIT). It reuses the Technical palette under `.uipack-mechanism` (paper `#f6f5f1`/white, ink `#1a1c1a`, forest `#205f49`; dark `#0a100d`, `#0e1512`/`#14201b`, `#e8ece9`, mint `#71dcb2`) and maps Anatomy's tones onto it: base `lo`, structure `mid`, subject `hi`, and one `lit` part in the accent. Labels sit in the card corners in small uppercase mono, never in the drawing. Topology stays with Figures and camera tours with 3D animations. See [the Mechanism guide](mechanism.md).

## Technical style

- Light: warm off-white page (`#f6f5f1`), white figure surfaces, near-black ink (`#1a1c1a`), forest accent (`#205f49`).
- Dark: near-black green page (`#0a100d`), forest surfaces (`#0e1512`, `#14201b`), pale ink (`#e8ece9`), mint accent (`#71dcb2`).
- Blue squares mean requests, green circles mean responses, violet diamonds mean changes, and accent rings mark the figure's one highlighted path. Preserve shape as well as colour: a host may set its accent close to the request blue.
- Data colours are separate from the flow colours and appear only where data needs them. The consulting deck's charts carry a signed pair, positive green (`#1a7a52`; dark `#33a979`) and negative red (`#c0482f`; dark `#d4623f`), and a four-slot categorical set; `src/deck/consulting/consulting.css` owns them. The red is a deliberate data colour, used only on negative values (a falling bar, a down delta), and every one is also carried by a sign or an arrow. It is never an accent, a status or a decoration in Technical chrome.
- System sans for titles and explanation; system monospace for metadata, IDs, and controls where appropriate. No font network requests.
- One heading scale on every playground page: page title (`h1`) 40px / 700; section heading (the shell's `h2`) 24px / 650, 22px below 540px; card, figure and scene titles 18–20px / 600 (`.uipack__title` is 20 / 600). A title inside a card never outranks the section it sits in. Sample content keeps its own scale: slides, the Landing page and the docs prose. Every slide headline (deck, slide starters, the narrative example, the slide player) takes the deck's treatment: the deck sans (IBM Plex Sans when present) at 650 with -0.02em tracking. `e2e/typography.spec.ts` checks that section headings share one size on every page and that figure and card titles stay below it.
- One shared page width, header, navigation, theme control, and active-page indicator. Theme survives navigation and reload through URL parameters.
- Cards that share a row share a height, and their action row (links, buttons) sits on the card's bottom edge, so actions line up across the row however long each description is. Build cards as a flex column with the action row at `margin-top: auto`.
- One radius scale. Technical uses 6px (`--uipack-radius`, `--show-radius`) for every container and control: figure, chart, article and Mechanism frames, shell cards and frames (the docs and Landing demo frames' chrome, style cards, slide starters and the Speaker guide), buttons, selects, section-jump links and disclosures. 4px is for small boxes inside a container (a code block, a chip); 2px for marks and badges. Landing keeps its own scale inside `.uipack-web` (16px cards, 12px panels, 8–10px rows, round pills); the shell's chrome around a Landing sample stays at 6px.
- One control set in the playground (`playground/showcase.css`): `--show-control-font` (the shell mono at 500, 13px; `--show-control-font-sm` is 12px for controls inside a figure or stage frame) and `--show-control-radius` (6px). The shell uses `ui-monospace`, not IBM Plex Mono: Technical makes no font requests, and the shell's labels, nav and figure controls are already system mono. Mechanism, shown in the shell, gets the same face through its `--font-mono` hook. Option tiles (the 3D scene list and art directions) are deliberately the shell sans.
- Two eyebrows. The shell eyebrow, for small labels in the shell's chrome (a figure's "Figure 01 · …", a Mechanism plate's corners, a 3D stage's edition), is tracked mono caps from `--show-eyebrow-font` and `--show-eyebrow-tracking` (600, 12px, 0.08em); each library reads them with the same values as its fallback. A slide's eyebrow and footer take the deck's (`.uipack-deck-eyebrow`, `.uipack-deck-footer`): tracked mono caps, the eyebrow in the accent, the footer muted, wherever the slide is drawn (the deck, the slide starters' SVG, the narrative example). The Speaker guide's labels take the deck speaker view's tracked caps.
- Restrained borders and small radii. Glow is a selection signal, never ambient decoration, with one exception: a drillable node (`DrillNode`) carries a soft, translucent accent glow and a faint preview of the figure inside it, the affordance for "there is more in here". It is softer than the selection ring, never applied to anything else, and backed by a visible marker and an accessible name, so it never carries meaning alone. Text and selected state explain the same thing without relying on glow.

## Interaction and mobile

Click or tap a semantic component to select it. Enter/Space do the same. A drawing is one Tab stop; the arrow keys move between its parts. Selecting another item replaces the selection; repeat activation, Escape, or the empty canvas clears it. There is no separate clear button. A selection must reveal something: a short `hint` note beside the item, or a pinned flow highlight. Parts with neither are not buttons. Nodes with href retain normal navigation. Lines, lane headings, and motion tokens remain explanatory marks rather than artificial buttons.

Use authored stacked drawings below 720px where available. Dense drawings without a narrow alternative keep a readable internal width with horizontal scrolling. Opening a canvas offers a wide drawing with zoom and scroll. Expanded canvases support trackpad and touch pinch zoom, preserve native scrolling, and expose keyboard zoom/reset. Figure zoom stays anchored to the pointer; 3D zoom uses the authored camera target. Free 3D orbit is not implemented. Check page overflow, label sizes, clipping, control reachability, focus, and reduced motion at 390px.

Canvas is an inspection workspace, distinct from the presentation layout. It uses a native modal dialog, contains focus, closes with Escape, and returns focus to the opener. A figure or renderer may remount when entering/exiting it; it is not a second simultaneous copy of the SVG IDs or GPU scene. Presentation mode remains an in-page full-window view.

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
