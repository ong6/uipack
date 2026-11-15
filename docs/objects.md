# 3D object scenes

The reference for `uipack/objects`: the lazy 3D scenes, their props, playback and fallbacks, the one
style they are drawn in (ink line art), the render budgets, and how to add a subject. How the
renderer works and the role contract a model follows are in [`src/objects/LOOK.md`](../src/objects/LOOK.md);
the look as a site picks it is [3D looks](components/3d.md).

```tsx
import { ObjectScene, objectScenes } from "uipack/objects";
import "uipack/objects.css";

<div style={{ height: 420 }}>
  <ObjectScene kind="travel" label="Travel" theme="light" active />
</div>;
```

```uipack-demo object-subjects wide
Every 3D subject in the one style, ink line art, on the page: each held on its first frame, the chosen one playing.
```

## The one style

Every scene is one clean physical object per subject, floating on the page, drawn as a line
drawing: unlit faces in the page's paper tone, a constant 2px ink silhouette round every part, 1px
crease lines on hard edges, and one accent part per subject. In dark mode the lines are light and
the faces sit on a slightly lifted ground. There are no lights, environment maps, shadow maps,
transmission, clearcoat or post-processing; a faint ink ellipse grounds a part where it meets the
table. The owner chose it on 2026-11-15 from five prototype treatments of the Studio subjects ("lets
do the ink line art… lock in one for our main design"), and it is the 3D style for anything 3D.

**Colours come from the page.** A scene reads three roles on its stage, at mount and again whenever
the theme changes: `--object-paper` (the faces; `--ui-surface` on the styled stage, `--ui-paper` on
`surface="page"`), `--object-ink` (the lines; `--ui-ink`) and `--object-accent` (the accent part;
`--ui-accent`). A site that sets its roles gets its own paper, ink and accent with no prop; a site
that keeps its colours elsewhere points the three stage variables at them:

```css
.uipack-object,
:root .uipack-object[data-theme] {
  --object-paper: var(--site-page-bg);
  --object-ink: var(--site-page-text);
  --object-accent: var(--site-brand-solid);
}
```

Whether the scene is dark is read from the colours (paper darker than ink), so a theme change never
rebuilds the scene: its uniforms change and it repaints the same frame.

## Subjects

Seven kinds: `ai`, `contact`, `tennis`, `trading`, `server`, `travel`, `reading`. `objectScenes`
lists their titles and descriptions as plain data (no Three.js).

| Kind | Subject | Motion | Accent |
| --- | --- | --- | --- |
| `contact` | Three source cards (an envelope, a speech bubble, a globe) route signals into one inbox tray | Plays once for 5.4 s, then offers Replay | The signals in flight and the inbox's status ring |
| `tennis` | A racket resting on its butt and on a ball can, a ball bouncing on its strings, a second ball rolled out of the can | 6 s loop | The can's sleeve |
| `trading` | A market abacus: per bar a wick sleeve and a bead slide on a rod; rising beads hollow (paper), falling ones toned (shade) | 30.7 s loop, the bars tick forward | The newest bar's bead |
| `server` | An inference rack hot-swapping its compute sled, fans spinning down and up, drive and link lights blinking | 8 s loop | The compute sled's face plate |
| `travel` | A folded atlas that opens into a tent, takes a route and folds shut; its print redrawn as ink line work | 10 s loop | The route and the travelling pin |
| `ai`, `reading` | Being built ([LOOK.md, the seam](../src/objects/LOOK.md#adding-a-subject)) | — | — |

Until `ai` and `reading` have their subjects, they show their labelled 2D drawing and open no WebGL
context. Every looping subject turns a few degrees on a hidden turntable over its loop. Every part is
built in code; there is no model file, texture download or font dependency.

## Props and playback

| Prop | Default | Does |
| --- | --- | --- |
| `kind` | — | The subject. |
| `label` | — | The accessible name; the fallback drawing is "`label` illustration". |
| `active` | `true` | Plays. `false` shows the labelled SVG drawing, with no WebGL renderer or Three.js load. |
| `preload` | `false` | Builds the scene and paints its first frame while not `active`, and keeps it when `active` goes false. |
| `theme` | `"light"` | The colour theme the stage resolves its roles in; a change recolours in place. |
| `controls` | `"full"` | `"playback"` keeps Pause/Resume/Replay and drops Open canvas, for compact embeds. |
| `surface` | `"styled"` | `"page"` makes the stage transparent: the page shows behind the drawing and the faces take `--ui-paper`. |

A page with several scenes sets `preload` on the ones near the viewport, so each is ready before the
reader reaches it and plays at once. Hold at most the scenes before and after the playing one: each
holds a WebGL context, and under software WebGL a fourth live context cost the two oldest theirs.
Scenes build one at a time, the playing one first, with an idle moment between builds; shaders
compile before the first paint and off the main thread where the browser allows (`compileAsync`),
so mounting a scene does not stall scrolling.

Pause/Resume preserve time. Hidden tabs and scenes scrolled off screen stop painting and resume
where they were. Painting is capped at 60 frames a second on a desktop (a 120 Hz display paints
every other frame) and 30 on a phone-width stage. Reduced motion draws each subject's authored rest
pose and hides the motion control. Context loss and renderer-load errors keep the fallback drawing.
Geometry, materials, textures, observers and animation frames are disposed on unmount.

Open canvas reuses the shared accessible dialog, with bounded zoom, Escape and focus return;
entering or leaving it remounts the player. The camera fits each subject's measured bounds (over its
whole loop) to the same share of the frame at every width. The SVG fallback keeps every mark inside
its frame and puts words (the trading chart's "DEMO / USD · SIMULATED") in 12px HTML beneath the
drawing. The chrome stays quiet: Open canvas and Pause are 44px ghost icon buttons in one top-right
cluster, names in visually hidden text.

The canvas reports what it drew for tests and reviews: `data-renderer` (`webgl` or `fallback`),
`data-art-direction="ink"`, `data-colors` (the paper, ink and accent it resolved), `data-phase`,
`data-pose`, `data-frames`, `data-draw-calls`, `data-triangles`, `data-programs` and
`data-first-paint-ms`.

## Browsing

`ObjectGallery` is the object library beside one live preview: pass `kind`, `theme` and
`onChange(kind)`; the consumer owns the chosen kind and its URL. `AnimationWorkspace` is the same
two-column layout for mixed collections. The docs site shows every subject in the demo above and
one at a time in [3D animations](slides.md) (`/animations?story=travel`, Objects filter;
`&surface=page` for the page surface, `&play=held` for a preloaded scene).

## Budgets

These run as small cards, in slides, on phones and on CI's software WebGL (Mesa llvmpipe).
`e2e/ink.spec.ts` holds every subject, in both themes at 390 and 1440, under 100 draw calls,
100,000 triangles and 10 shader programs at rest, and the heaviest subject (server) over 15 paints a
second at 390 (13 on CI) under its 30 cap.

Measured on an M3 Pro (Chrome, ANGLE Metal) at 573 × 558 with a cold shader cache, against the
photographic Studio the style replaced:

| Subject | Cold first paint | Programs | Draw calls | Triangles | Photographic Studio (paint, programs, draws) |
| --- | --- | --- | --- | --- | --- |
| `contact` | 76 ms | 5 | 27 | 6,280 | 229 ms, 3, 24 |
| `tennis` | 88 ms | 4 | 30 | 15,826 | 570 ms, 18, 48 |
| `trading` | 85 ms | 8 | 18 | 7,850 | 457 ms, 16, 29 |
| `server` | 95 ms | 8 | 29 | 35,930 | 537 ms, 19, 121 |
| `travel` | 126 ms | 7 | 40 | 14,616 | 448 ms, 13, 61 |

Cold is the median of three loads with every shader made unique (so no cache serves it), from
building the subject to the first frame read back; the Studio column was measured the same way
(2026-11-15), without its environment and shadow-map programs, so it is under-counted. Triangles
include the silhouette pass, which draws each part's geometry a second time.

## Adding a subject

The recipe, the role contract and the seam for the next two subjects are in
[`src/objects/LOOK.md`](../src/objects/LOOK.md#adding-a-subject). In short: a builder in its own
file returns a `THREE.Group` whose meshes carry `userData.inkRole`, with its motion in
`userData.animate`, and one line in the registry (`src/objects/scenes.ts`) plugs it in.
