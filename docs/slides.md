# 3D animations

`uipack/slides` adds an opt-in presentation player built with Three.js and GSAP. The existing SVG entries do not import either dependency. Three.js loads when a scene mounts; server rendering produces a readable diagram fallback.

## Install

UIPACK is installed from GitHub. These changes must be available in the commit or branch you install before the `slides` entry exists:

```sh
npm install github:ong6/uipack three@^0.186.0 gsap@^3.15.0
```

Three.js and GSAP are optional peers: existing figure consumers do not need them. React 18+ and React DOM remain the package's shared peers. No Blender installation, external fonts, model download, or asset server is required for these examples.

## A complete presentation

```tsx
import { SlidePlayer, harnessDive } from "uipack/slides";
import "uipack/slides.css";

export function HarnessPresentation() {
  return <SlidePlayer story={harnessDive} theme="dark" />;
}
```

Run `npm run dev` in this repository and visit `/animations` (or the compatible `/slides` URL) for the showcase. Figures, Assets, 3D animations, Presentations, and Styles share a header, page layout, and theme control. Navigation carries the selected theme in the URL; explicit light is the default. The page supports `?story=harness-dive&stop=context`, `?theme=light`, `?motion=none`, and `?mode=diagram` for direct previews.

### Included stories

| Story | Stops | Presentation technique |
| --- | --- | --- |
| `harnessDive` | 5 | Wide overview → open the boundary → context → tools → verification |
| `retrievalLayers` | 4 | Stacked information → exploded layers → query trace → evidence returning |
| `parallelAgents` | 4 | One goal → fan-out → turn across the lanes → convergence |
| `quarterTurn` | 4 | Four cardinal camera views around a fixed architecture |
| `stagedAssembly` | 3 | Sequential layer arrivals → exploded inspection |
| `architectureShift` | 3 | Linear handoffs → shared state → focused dolly |

These are illustrative systems, not audited diagrams of a deployed product.

## Let your deck drive the camera

Keep **one** scene mounted outside the individual slide DOM. Give it a different named stop when the deck changes:

```tsx
import { SlideScene, harnessDive } from "uipack/slides";
import "uipack/slides.css";

export function SceneBesideYourSlides({ sceneStop }: { sceneStop: string }) {
  return (
    <div style={{ height: 600 }}>
      <SlideScene story={harnessDive} stopId={sceneStop} />
    </div>
  );
}
```

For the supplied controls with externally owned navigation:

```tsx
const [stop, setStop] = useState("outside");
<SlidePlayer story={harnessDive} stopId={stop} onStopChange={setStop} />;
```

An unrecognized `stopId` falls back to the first stop. Keep the story object stable (define it outside render or memoize it), because changing the story data rebuilds the renderer. Changing the theme also rebuilds the renderer; changing stops retains the canvas.

## Describe your own scene

A `SlideStory` is plain serializable data:

- `nodes`: IDs, label/detail text, 3D positions, dimensions, color roles, and shape (`block`, `sphere`, `layer`, or `boundary`).
- `connections`: directed relationships between node IDs. Request packets are squares, response packets circles, and change packets diamonds.
- `stops`: camera position/target, title, caption, optional presenter notes, node position/scale/opacity overrides, label IDs, and active connection IDs.

Every stop resolves against the base scene, never the last stop. This makes direct jumps and reverse navigation deterministic. A new action interrupts the old timeline and moves from the current pose to the new target. Camera turns follow the shortest spherical arc around the target with sine easing. Labels fade out before movement and return after the scene settles, avoiding collision-placement jumps. Flow packets travel the full curved route and fade at the endpoints.

Each stop accepts `transition: { camera: "orbit" | "dolly", duration: 1.6, stagger: 0 }`. Orbit is the default; dolly interpolates camera position directly for a deliberate push-in. Duration is 0.2–5 seconds, with optional 0–0.15 seconds of stagger between nodes. Annotation fades add 0.34 seconds; stagger adds time according to node order. Reduced motion bypasses the entire sequence. These settings are serializable and exported as `SlideTransition`.

```tsx
import type { SlideStory } from "uipack/slides";

const story: SlideStory = {
  id: "request-path",
  title: "One request",
  description: "Follow a request into a service.",
  nodes: [
    { id: "client", label: "Client", position: [-3, 0, 0], tone: "request" },
    { id: "service", label: "Service", position: [3, 0, 0], tone: "accent" },
  ],
  connections: [{ id: "call", from: "client", to: "service", tone: "request" }],
  stops: [
    {
      id: "overview", title: "One client, one service.", caption: "The request crosses an explicit boundary.",
      camera: { position: [10, 8, 16], target: [0, 0, 0] },
    },
    {
      id: "trace", title: "Follow the call.", caption: "Highlight the route while keeping its context visible.",
      camera: { position: [6, 6, 10], target: [1, 0, 0] },
      activeConnections: ["call"],
    },
  ],
};
```

`validateSlideStory(story)` returns contract issues. Both components render an explanatory error for invalid graphs or poses. Node size and scale must be positive, opacity must be within 0–1, and camera position must differ from its target. All connection, label, and pose IDs must exist.

## Presentation behavior

- Previous/Next and numbered stops work without autoplay. Arrow keys, Page Up/Down, Home, and End work only while focus is inside the player. Editable form controls retain their own keys.
- Present expands the player to the viewport. Escape returns to the page and restores scrolling. This is an in-page presentation mode, not an operating-system fullscreen request.
- Pause flow stops the moving packets; navigation still moves the camera.
- The OS reduced-motion preference and `motion="none"` remove camera transitions and freeze flow packets. Labels and all stops remain available.
- Labels are HTML at projected 3D positions, so text stays crisp. They are screen annotations, not depth-occluded geometry. The renderer avoids label collisions and hides annotations that cannot fit; the accessible text remains available. Choose a small set of label IDs per stop.
- Without WebGL, on context loss, or when optional renderer imports fail, the player uses the readable diagram view. `renderMode="diagram"` selects it explicitly. The diagram view lists visible components and active connections; it is not a spatial screenshot.
- Idle views with no active flows render on demand. Active flow stops render while visible; leaving the viewport or hiding the document suspends the frame loop. GPU objects and observers are disposed on unmount.

## Style

The player uses UIPACK's forest/mint palette, shape-coded blue/green/violet flows, small corner radii, and sans/mono type roles. It supports explicit `theme="dark"` and `theme="light"`. CSS fonts use the same system sans and monospace stacks as the SVG figures. No font request is made by the package.

## Scope and limits

This module supplies browser animation components. Complete presentation composition examples live in the playground, separately from reusable animation data. It does not export PPTX, PNG, MP4, or GLB, load Blender assets, or offer free orbit. Open canvas adds modal inspection and bounded camera zoom; component labels and the inspection selector support selection. See [interaction details](interaction.md). The Blender workbench remains a separate render/export path. A native PowerPoint or Keynote file does not execute this React player; use the browser presentation or a separate recording/export workflow.

The main website has not been integrated. A future integration can lazy-load `SlideScene` on selected pages using the same story data, while keeping the existing SVG diagrams as the lightweight default.
