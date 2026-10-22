# Object scenes

```tsx
import { ObjectScene, objectScenes } from "uipack/objects";
import "uipack/objects.css";

<div style={{ height: 420 }}>
  <ObjectScene kind="tennis" label="Tennis practice" theme="light" active />
</div>;
```

Seven scenes: `ai`, `contact`, `tennis`, `trading`, `server`, `travel`, `reading`. Studio `tennis` plays an original Blender-authored model; other scenes and directions are procedural. Studio `contact` routes three generic communication signals into a shared inbox. `objectScenes` contains their titles and descriptions. Theme is `light` or `dark`; optional `palette` accepts numeric `paper`, `ink`, `muted`, and `accent` colours. Keep a custom palette reference stable.

`active={false}` shows the labelled SVG fallback with no WebGL renderer or Three.js load. Active scenes lazily import Three.js. Studio tennis and trading loop continuously; the other studio scenes play once for 5.4 seconds, then offer Replay. All five non-Studio directions run seamless 12-second loops. Pause/Resume preserve time. Hidden tabs suspend rendering; mobile painting is capped at 30fps. Reduced motion draws an authored static pose and hides motion controls. Context loss and renderer-load errors retain the fallback. Geometry, materials, textures, observers and animation frames are disposed on unmount. An IntersectionObserver also suspends gallery playback when the canvas leaves the viewport, preserving elapsed time.

Use `controls="playback"` in compact consumer embeds. The scene still starts automatically,
stops off-screen, settles, and exposes Pause/Resume/Replay, but leaves **Another look** and
**Open canvas** to the full gallery. The default `controls="full"` preserves the complete player.

Open canvas reuses the shared accessible dialog, with bounded zoom, Escape and focus return. Entering or leaving the dialog remounts the player and restarts its sequence. No orbit or live trading data. The tennis GLB is included in its own lazy asset module; there is no third-party model host. The orthographic camera fits the authored animation envelope to both viewport axes. On stages narrower than 480px an object may set `userData.narrowFrame` (`halfWidth`, `halfHeight`, optional centre `y`) to frame its own envelope tighter; the Cartoon contact mailbox does, so it fills a near-square phone stage. The SVG fallback keeps every mark inside its frame and puts words (the trading chart's "DEMO / USD · SIMULATED") in 12px HTML beneath the drawing. Open canvas over an object uses the same button style as a figure's, in both themes.

Review all seven examples in `/animations` (Objects filter). Consumers import the scene and player from `uipack/objects`; geometry and playback stay in the package.

The revised hobby sequences show an agent laptop typing and receiving tool results, two opposing tennis players rallying across a net, a continuously advancing red/green candlestick chart with aligned volume, and a thin sheet turning over layered book pages. The map has connected folding panels, three original terrain prints and three paths. The inference rack has drive bays, seven-blade fans, patch ports and cables; its assembly and fan spin settle together. The book uses a near-constant-length curl and separately oriented front/back print. Both tennis contacts are checked against the exported racket faces at impact. See [the component-first workflow](component-first.md#complex-modeled-animation) for the Blender authoring path.


## Curated variations

The six hobbies have six named directions; Contact has three original inbox editions plus Cartoon and Kinetic directions. `variant="random"` is the default: selection happens on the
client once per component mount. A fresh mount can repeat the same look by chance. Replay, theme
changes and Open canvas preserve it. **Another look** cycles through the available directions without a reload.
Use `variant={0}` through `{5}` to pin a reproducible look; pinned scenes hide the cycling button.
The playground accepts `?story=tennis&variant=1`. `objectVariants` exports the names.

The six hobby scenes have six distinct art directions. Contact retains its three inbox accents and adds Cartoon (3) and Kinetic (4).

| Variant | Direction | Geometry / perspective | Motion |
| --- | --- | --- | --- |
| 0 | Studio objects | Detailed physical objects, macro and three-quarter views | Typing, modeled tennis rally, live simulated chart, assembly, folding map, curling sheet |
| 1 | Paper worlds | Thick cut-paper theatre stages, angled depth layers, pop-up book architecture | Layer parallax, paper flight, folding chart accordion, floating instruction cards |
| 2 | Kinetic sculptures | Brass and ceramic mechanisms on plinths, open space and orbital perspective | Neural orrery, orbiting tennis ball, balanced market mobile, exploded compute, armillary globe, suspended folio |

| 3 | Cartoon worlds | Rounded miniature places, elevated three-quarter view | Keyboard workshop, court, market avenue, cloud factory, island train and reading nook |
| 4 | Realistic close-ups | Material-focused studies of keys, felt, steel, paper and circuitry | Key travel, ball study, ticker spool, cooling fans, compass needle and quiet book stack |
| 5 | Abstract forms | Transmissive glass, polished metal, arcs and ribbons | Thought lattice, elastic exchange, risk rhythm, signal stack, portals and curved leaves |

`src/objects/art-directions.ts` and `src/objects/expanded-directions.ts` are the editable sources for all thirty non-Studio scenes:
one builder per kind in each direction's table (`paperModels`, `kineticModels`, `cartoonModels`, `realisticModels`, `abstractModels`),
on a shared stage per direction. `src/objects/procedural.ts` holds the 12 s loop clock (`playLoop`) they and `contact-directions.ts` share.
`directionTokens` and the expanded direction material factories own their materials, and the scoped direction rules in `objects.css` own their
light/dark stage backgrounds. Custom palettes continue to control Studio; the other directions
retain their authored material palette. All geometry is original, MIT licensed, with no downloaded
models, textures or font dependency. The new directions require no model downloads.

`objectDirections` exports stable IDs (`studio`, `paper-theatre`, `kinetic`, `cartoon`, `realistic`, `abstract`), names and descriptions.
Use `<ObjectDirectionPicker value={variant} onChange={setVariant} />` to control a set of scenes.
`objectStyleEntries` in the playground catalog registers all 36 hobby examples plus two new Contact directions; `/styles` links
to the corresponding scene. The selector changes geometry, composition and choreography, not
just colour. The existing `builders` remain available internally for legacy modeling tests.

Review at 390 and 1440 in both themes. Budget for the new directions: under 220 draw calls with
shadows, under 100k triangles, no external asset request. The player still mounts only the active
hobby. The new loops use one elapsed-time clock, match positions and velocities at the wrap,
freeze on pause/reduced motion and reuse the existing fallback and context-loss handling.
Physical mobile performance must be measured separately from desktop browser viewport tests.

## Blender source and export

Run `blender --background --factory-startup --python-exit-code 1 --python scripts/objects/tennis.py`
from the repository. The original model uses no external assets or textures. The script produces
`assets/objects/tennis-return.glb`; compress it before committing (below). Generated
editable `.blend`, four pose previews and verification data go to `/tmp/uipack-tennis`. The script
is the durable, reproducible source; copy the editable file elsewhere before clearing temporary files.

The two-player GLB is 278,892 bytes, meshopt-compressed from Blender's 716,300-byte export (below).
Only selecting Studio tennis loads the model. Its baked
object animation is sampled deterministically; a contact test checks the exported ball against the
two rackets at 1.9 and 4.9 seconds in a seamless six-second rally. Each instance owns its mixer and materials and disposes them on removal.
The existing SVG remains visible until model loading succeeds, including on an asset-load failure.

### Loading the tennis model

Studio tennis fetches the GLB as a file, not as JavaScript: it was a 955 KB base64 chunk (and
1.08 MB inlined into `objects.cjs`), then 716 KB of binary, now 279 KB that the browser caches like an image.
The URL comes from `new URL("../assets/objects/tennis-return.glb", import.meta.url)` in
`src/package-assets.ts`, which Vite, Rollup (with an import-meta-assets plugin), webpack 5 and
Next recognise: they copy the file into the build and rewrite the URL. Checked from the packed
tarball: Next 16 with Turbopack and with webpack, in dev and build, and a Vite 6 build, each serve
the hashed `.glb` and play the model with no consumer configuration. Nothing is fetched until a
Studio tennis scene becomes active.

Serve the file yourself and pass `modelUrl` when the default cannot resolve:

```tsx
<ObjectScene kind="tennis" label="Tennis practice" modelUrl="/models/tennis-return.glb" />
<ObjectGallery kind="tennis" modelUrl="/models/tennis-return.glb" onChange={choose} />
```

- **CommonJS** (`require("uipack/objects")`) has no `import.meta`, so it always needs `modelUrl`.
- **esbuild** leaves `new URL(…)` untouched and copies nothing: copy the file and pass `modelUrl`.
- **Vite dev** pre-bundles dependencies into `node_modules/.vite`, which breaks the relative URL
  for an installed package; add `optimizeDeps: { exclude: ["uipack"] }` or pass `modelUrl`.
  Builds are unaffected.

Copy the file from `uipack/assets/objects/tennis-return.glb` (exported) into your public folder,
e.g. in a prebuild script with `require.resolve("uipack/package.json")`. A failed fetch keeps the
labelled SVG fallback.

### Model compression

The committed GLB is Blender's export after three [glTF Transform](https://gltf-transform.dev) steps:

```sh
npx @gltf-transform/cli@4 dedup    tennis-return.glb a.glb   # shared accessors once
npx @gltf-transform/cli@4 resample a.glb b.glb               # drop keyframes that linear interpolation reproduces
npx @gltf-transform/cli@4 meshopt  b.glb tennis-return.glb --level medium   # quantize + EXT_meshopt_compression
```

716,300 → 278,892 bytes (−61 %); in the npm tarball, which is gzipped, its share falls from about
260 KB to 119 KB. The model has no textures, so texture resizing has nothing to act on. Checked
against the original export: across 240 sampled times in the six-second loop, every mesh's world
bounding box and centroid moves at most 0.00019 units, and the rest pose's vertices at most 0.00023
units (Hausdorff distance), on a model about 4 units across; colours, shadow flags and the
ball-on-racket contact test are unchanged. Reduced-motion renders at 1280 × 900 (2× DPR) differ in
0.05 % of pixels by more than 16/255, all antialiasing on thin court lines and strings.

Options weighed:

| Option | Bytes | Decoder | Notes |
| --- | --- | --- | --- |
| Original export | 716,300 | none | Float32 positions, normals and 30 fps sampled keys. |
| `dedup` + `resample` | 543,500 | none | Lossless to 0.0002 units; no extension. |
| `resample` + `quantize` | 465,524 | none | `KHR_mesh_quantization`, which three's `GLTFLoader` reads natively. |
| **`resample` + `meshopt`** (shipped) | **278,892** | `MeshoptDecoder` | Same quantization error as above, about 40 % smaller again. |
| `resample` + Draco | 266,976 | `DRACOLoader` + hosted wasm | Needs `setDecoderPath` and the decoder files served by the consumer; rejected. |

The Studio scene sets the decoder itself (`GLTFLoader.setMeshoptDecoder` with
`three/addons/libs/meshopt_decoder.module.js`, loaded with the loader only when tennis is shown;
about 8 KB gzipped, WebAssembly inline), so `ObjectScene`, `ObjectGallery` and `modelUrl` need no
setup. Loading the file with your own `GLTFLoader` needs the same line:

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
```

Trading uses a beveled monitor with a flat chart display. Each candle has consistent open, high, low and close prices, and its matching volume below. The view advances toward later bars, bringing new candles in from the right. A 64-bar synthetic history repeats while time labels continue forward; it is explicitly labeled simulated.

## September 2026 polish review

The original models and terrain print are authored in this MIT-licensed repository. No external
models, textures, fonts or map tiles are used. The Blender source batches rigid pieces under their
animated parents to preserve the rally while reducing draw calls. The authored six-second timing,
camera, clip controls and non-WebGL fallback are unchanged. The court has subtle mowing bands and
baseline ticks; the ball seam follows the ball at the correct scale.

The shared light rig uses a warm key and cool edge light, with no post-processing or new dependency.
The atlas uploads one 1536×1024 texture when created; the book uploads two 256×512 printed faces.
Trading keeps its existing 1056×620 canvas texture and forward timeline. Performance and captures
for the built consumer are recorded in the homepage's local animation review artifact.

## Browsing and original editions

`ObjectGallery` provides a scene library, one live preview and a style inspector.
Pass `kind`, `variant` (0 Studio, 1 Paper, 2 Kinetic, 3 Cartoon, 4 Realistic, 5 Abstract), `edition` (0–2), `theme`,
optional `palette`, and `onChange(kind, variant, edition)`. The consumer owns URL state.
`AnimationWorkspace` and `ObjectInspector` expose the same layout for mixed collections.
The playground renders these at `/animations`; the website uses `ObjectGallery` at `/uipack#objects`.

All original looks remain available through `objectEditions`. `ObjectScene` accepts
`edition` independently of `variant`; Paper and Kinetic ignore it. Contact retains
its original `variant` behavior for 0–2; see the Contact section below for variants 3–4. For example, Studio clay tennis is
`<ObjectScene kind="tennis" label="Club rally" variant={0} edition={1} />`.
The corresponding playground URL is `/animations?story=tennis&variant=0&edition=1`.
Gallery selections are explicit and stable across reload, replay, theme and Open canvas.


### Material and motion polish

The player uses a generated room environment for stable reflections, with no HDR download.
Paper has eased physical edges and a paper airplane aligned to its flight tangent. Kinetic
plinths have level bases and machined rims. Studio gains more legible reflected material light.
Realistic studies use a deterministic procedural roughness texture. Abstract studies use
transmission and clearcoat; these are real-time art-directed illustrations, not photographic scans.
Each new scene is original code-authored geometry under the library license; no external assets.

### Contact art directions and personal picks

Contact preserves its original numeric finish IDs 0–2. Variant 3 is **Cartoon · Little post office**,
a miniature mailbox with a letter-delivery loop and moving flag. Variant 4 is **Kinetic · Correspondence mobile**,
a brass mobile with suspended envelopes, a ceramic receiving tray and orbiting signal. Both are original
procedural models, loop every 12 seconds, and use the shared controls and static fallback. The Contact inspector
shows only Studio, Cartoon and Kinetic; its Studio edition selector retains all three original finishes.
`objectDirectionIndex(kind, variant)` resolves these legacy IDs to the shared visual style.
`transferObjectVariant(from, to, variant)` preserves supported styles when switching objects and uses Studio otherwise.

Kinetic Open book now rotates a full 360 degrees every 12 seconds while its individual leaves flex.
The website's default hobby selection is Cartoon AI, Studio Tennis, Studio Trading, Cartoon Inference,
Paper Travel and Kinetic Reading. Its My picks control restores this set after a global style preview.

The website Contact page pins Cartoon (variant 3). Compare the other inbox styles in UI Pack; Contact no longer changes style from URL preview parameters.

### Page-integrated artwork

Use `<ObjectScene kind="travel" label="Travel" variant={1} surface="page" controls="playback" theme={theme} />` to reveal the host page behind the artwork. The canvas, stage and border remain transparent in both themes. The default `surface="styled"` retains each direction’s gallery backdrop.

Preview the embedded treatment at `/animations?story=travel&variant=1&surface=page&theme=light` (or `theme=dark`).
