# Object scenes

```tsx
import { ObjectScene, objectScenes } from "uipack/objects";
import "uipack/objects.css";

<div style={{ height: 420 }}>
  <ObjectScene kind="tennis" label="Tennis practice" theme="light" active />
</div>;
```

Seven scenes: `ai`, `contact`, `tennis`, `trading`, `server`, `travel`, `reading`. Studio `tennis` plays an original Blender-authored model; other scenes and directions are procedural. Studio `contact` routes three generic communication signals into a shared inbox. `objectScenes` contains their titles and descriptions. Theme is `light` or `dark`; optional `palette` accepts numeric `paper`, `ink`, `muted`, and `accent` colours. Keep a custom palette reference stable.

`active={false}` shows the labelled SVG fallback with no WebGL renderer or Three.js load. Active scenes lazily import Three.js. Every Studio subject loops as one product-film take (an action, a hold, a reset, over a few degrees of turntable); Studio `contact` plays once for 5.4 seconds, then offers Replay. All five non-Studio directions run seamless 12-second loops. Pause/Resume preserve time. Hidden tabs suspend rendering; mobile painting is capped at 30fps. Reduced motion draws an authored static pose and hides motion controls. Context loss and renderer-load errors retain the fallback. Geometry, materials, textures, observers and animation frames are disposed on unmount. An IntersectionObserver also suspends gallery playback when the canvas leaves the viewport, preserving elapsed time.

Use `controls="playback"` in compact consumer embeds. The scene still starts automatically,
stops off-screen, settles, and exposes Pause/Resume/Replay, but leaves **Another look** and
**Open canvas** to the full gallery. The default `controls="full"` preserves the complete player.

Open canvas reuses the shared accessible dialog, with bounded zoom, Escape and focus return. Entering or leaving the dialog remounts the player and restarts its sequence. No orbit or live trading data. The tennis GLB is included in its own lazy asset module; there is no third-party model host. The camera fits each subject's measured bounds (over its whole loop) to the same share of the frame at every width, and dark mode switches to a night light rig; lighting, environment, material presets, contact shadows and framing are the shared look layer in [`src/objects/LOOK.md`](../src/objects/LOOK.md). The SVG fallback keeps every mark inside its frame and puts words (the trading chart's "DEMO / USD · SIMULATED") in 12px HTML beneath the drawing. The player's chrome stays quiet: Open canvas and Pause are 44px ghost icon buttons in one top-right cluster (low contrast until hover or focus, names in visually hidden text), and the look's name is a muted caption. Studio's caption is the direction name from `objectVariants`, with a non-default edition appended.

Review all seven examples in `/animations` (Objects filter). Consumers import the scene and player from `uipack/objects`; geometry and playback stay in the package.

The Studio sequences show two opposing tennis players rallying across a net and a continuously advancing red/green candlestick chart with aligned volume. The map has connected folding panels, three original terrain prints and three paths. The inference rack has drive bays, seven-blade fans, patch ports and cables; its assembly and fan spin settle together. Both tennis contacts are checked against the exported racket faces at impact. See [the component-first workflow](component-first.md#complex-modeled-animation) for the Blender authoring path.


## Curated variations

There are six named directions, and each subject offers only the two or three that suit it
(below). `objectLooks` lists each kind's variant IDs, its default first; `objectVariants` names them.
`variant="random"` is the default: selection happens on the client once per component mount, among
the kind's looks. A fresh mount can repeat the same look by chance. Replay, theme changes and Open
canvas preserve it. **Another look** cycles through the kind's looks without a reload. Pin a look
with its variant ID (`variant={4}`); pinned scenes hide the cycling button. A variant the kind does
not offer shows the kind's default instead (`normalizeObjectVariant`), and `createObject` does the
same, so an old pin never breaks a page. The playground accepts `?story=tennis&variant=3` and says
when it falls back.

| Variant | Direction | Look | Subjects that offer it |
| --- | --- | --- | --- |
| 0 | Studio objects | Product photography: one object on a seamless sweep (a falloff and, at night, a pool of light behind the subject and a warm top-light pool under it), one lens family kept low (5° to 24° above the table, framed per subject); a shaped key with a real shadow, a weak fill and a strong rim; a room environment by day and a softbox at night; one material per surface (grained brushed aluminium, mirror chrome, clearcoat paint, stippled plastic and rubber, paper, felt); the night room's colours come from the page style's palette (ink for the room, accent for the rim); every subject loops as a take on a slow turntable; state shows through physical cues, never screen text | Racket resting on its butt and on the can's body with a bouncing ball and a ball rolled out of the can; market abacus; inference hardware hot-swapping its compute sled; a folded atlas that unfolds into a tent, takes a route and folds shut; Contact's three inbox editions |
| 1 | Paper worlds | Cut-card toy theatres: a slim proscenium with nested arches and extruded flats stepped back in depth, each standing on a folded glue tab (static flats also on triangular braces), fibrous card with a white cut core, one warm lantern pooling on the stage (the main light at night); frames alternate viridian and persimmon on a cream mat, and each stage is seen from its own seat | Alpine passage with a train running tunnel to tunnel, pop-up castle from an open book |
| 2 | Kinetic sculptures | Polished brass armatures with turning marks, glazed stoneware bodies (a soft body under a clear glaze, iron speckle, orange-peel ripple, pooling and raw foot rings) and porcelain column feet on honed slate bases cut per subject (turned plinth, bench, drum); a gallery spot pools on the sculpture at night; the base never moves, the mechanism does | Neural orrery with a ceramic chip clamped to its arm, market balance tipped by a ceramic rider over a domed porcelain dial, celadon globe in a brass meridian |
| 3 | Cartoon worlds | A floating toy island per subject, each with its own outline, cap and underside (a slate outcrop over glowing crystals, clay terraces, a meadow trailing oak roots), all inside one shared frame envelope so every card frames the same size in the same place; a toon ramp with toy finishes (gloss vinyl on the bean characters, soft-touch satin on props, flocked grass); day in light mode, night in dark (a deep-blue night card, a saturated night palette, a toon moon-rim on the silhouettes, lit windows and a warm practical at each scene's lamp pooling banded light on the island) | Night workshop, courtside club (chunky court lines, fat toy strings, a floodlight), reading nook; Contact's little post office |
| 4 | Realistic close-ups | Low, near macro still lifes on a real surface (hard court, powder-coated steel, quarter-sawn walnut) that runs back to a wall out of focus (plaster in window light, a court's windscreen, a rack aisle with LED bokeh); long lens with depth of field (every map softens with distance from the focal plane), grazing window light by day; at night a warm desk-lamp practical with falloff and a cool rim. Materials carry visible roughness variation and wear, hairline scratches on metal, felt nap, paper fibre and set type | Match point (a ball bounced on the baseline, a strung racket laid on the court behind it), hot swap (a rack server front: rack ear, hot-swap sleds, one pulled out over its SSD board), glasses on an open book (Pride and Prejudice, chapter one) |
| 5 | Abstract forms | Refractive glass sculptures (polished, thick, dispersive, reflections kept to strip highlights) in front of rounded, clear-coated lacquer bars that are lit, not self-lit, a different rhythm per subject; a tinted shadow with a spectral caustic beyond it; the glass refracts an unseen studio, bright-field crisp dark lines by day and dark-field light strips round a lavender pool on navy at night; a warm pool light by day, a cool pool and rim at night | Thought lattice (a prism splitting a white beam into the three hues), risk rhythm (a rising price line) |

### Directions per subject

The owner asked for "a few that make sense for that type" instead of all six per subject (2026-11-06).
The cut follows the six blind judges' round-3 remarks per subject in the 3D review
(`skills-private/.evals/uipack-review/review/3d/p2/reduced-matrix.md`; "n/6" is how many judges said
it). The first listed is the subject's default.

| Subject | Keeps (variant) | Why |
| --- | --- | --- |
| AI | Kinetic (2) | The orrery with a chip reads AI as a mechanism: "chip makes AI legible" (5/6). The default since 2026-11-06: Abstract's saturated bands were the loudest, most off-palette first frame on the site. |
| | Abstract (5) | A glass prism splitting a beam: "best concept in the set", praised by 6/6. |
| | Cartoon (3) | A robot at a desk reads at a glance and suits a friendly AI. Dropped: Studio (the laptop screen is "a stock AI cliché"), Paper ("stock" gear-in-head), Realistic (keyboard layout errors, 6/6). |
| Tennis | Realistic (4) | A ball on the court line in macro; the felt reads (5/6). |
| | Cartoon (3) | The clay court with bean players reads well at 1x once strung (4/6). |
| | Studio (0) | Racket, can and balls as one product still, legible at 1x (6/6). Dropped: Paper (tilted placard court, 4/6), Kinetic (racket clips the plinth, 6/6), Abstract ("blob with ears", 6/6). |
| Trading | Kinetic (2) | A balance with a gauge is a natural market metaphor (5/6). |
| | Abstract (5) | A rising line through glass bars reads at 1x (5/6). |
| | Studio (0) | The candlestick abacus is a real product idea and reads at 1x (5/6). Dropped: Paper ("weakest metaphor"), Cartoon (market stall is filler), Realistic (pixel-font ticker). |
| Server | Realistic (4) | The hot-swap sled is "the best-modelled asset", "a real server close-up". |
| | Studio (0) | The rack is the most product-like server; all six read it at 1x. Dropped: Paper (a skyline that "doesn't say server"), Abstract ("cryptic"), Kinetic (blades read as plastic), Cartoon (cloud factory is a stretch). |
| Travel | Studio (0) | The folded atlas "feels like a styled product still" (6/6 praised). |
| | Paper (1) | The layered alpine landscape is the paper promise and reads at 1x. |
| | Kinetic (2) | The armillary globe is a real instrument and the best kinetic motion (7.8/10). Dropped: Cartoon (island too small), Realistic (compass needle points south), Abstract (weaker than the rest). |
| Reading | Realistic (4) | Tortoiseshell glasses on an open book, the most tactile card (4/6). |
| | Cartoon (3) | The reading nook reads at 1x and suits the cosy toy world. |
| | Paper (1) | A pop-up world is the natural paper idea for reading. Dropped: Studio (book on a lip with no support), Kinetic (the book "hangs awkwardly"), Abstract ("ambiguous", 4/6). |
| Contact | Studio editions (0–2), Cartoon (3) | The original inboxes and the post office the website uses. Dropped: Kinetic correspondence mobile (variant 4), which no judge reviewed and no page used; it now shows Studio. |

The junxiong.dev site pins an older uipack. Its picks reading = 2 (Kinetic) and server = 3
(Cartoon) no longer exist; when it upgrades they show the kind's default (Realistic for both) until
it picks again.

Each direction has its own source file with one builder per subject it serves and its look (`src/objects/LOOK.md`):
`studio.ts` (`studioLook`), `paper-worlds.ts` (`paperWorld`, `paperLook`), `kinetic-sculptures.ts`
(`kineticWorld`, `kineticLook`), and `expanded-cartoon.ts`, `expanded-realistic.ts` and `expanded-abstract.ts`
(`cartoonLook`, `realisticLook`, `abstractLook`), with shared mesh and texture helpers in `expanded-kit.ts`.
Each keys its builders by `KindWithLook<variant>`, so TypeScript rejects a builder for a subject that does not list
the direction and a listed subject without one. `art-directions.ts` routes directions 1 and 2 and `expanded-directions.ts`
routes 3 to 5. `src/objects/procedural.ts` holds the 12 s loop clock (`playLoop`) they and `contact-directions.ts` share.
`directionTokens` and each direction's materials own its palette, and the scoped direction rules in `objects.css` own the
light/dark stage backgrounds. Custom palettes continue to control Studio; the other directions retain their authored
material palette. All geometry and textures are original and procedural, MIT licensed, with no downloaded models, textures
or font dependency. Only Studio tennis loads a packaged model file.

`objectDirections` exports stable IDs (`studio`, `paper-theatre`, `kinetic`, `cartoon`, `realistic`, `abstract`), names and descriptions.
Use `<ObjectDirectionPicker value={variant} onChange={setVariant} kind="travel" />` to choose among one subject's looks;
without `kind` it offers all six, for a set of scenes (each shows its default for a direction it lacks).
`objectStyleEntries` in the playground catalog registers the 17 subject examples (one per subject and direction it offers);
`/styles` links each direction's card to a subject that offers it. The selector changes geometry, composition and
choreography, not just colour.

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
The atlas uploads one 1536×1024 texture when created.
Trading keeps its existing 1056×620 canvas texture and forward timeline. Performance and captures
for the built consumer are recorded in the homepage's local animation review artifact.

## Browsing and original editions

`ObjectGallery` provides a scene library, one live preview and a style inspector.
Pass `kind`, `variant` (0 Studio, 1 Paper, 2 Kinetic, 3 Cartoon, 4 Realistic, 5 Abstract), `edition` (0–2), `theme`,
optional `palette`, and `onChange(kind, variant, edition)`. The consumer owns URL state.
`AnimationWorkspace` and `ObjectInspector` expose the same layout for mixed collections.
The playground renders these at `/animations`; the website uses `ObjectGallery` at `/uipack#objects`.

The original Studio finishes remain available through `objectEditions`, for the subjects that offer Studio. `ObjectScene` accepts
`edition` independently of `variant`; the other directions ignore it. Contact retains
its original `variant` behavior for 0–2; see the Contact section below for variant 3. For example, Studio clay tennis is
`<ObjectScene kind="tennis" label="Club rally" variant={0} edition={1} />`.
The corresponding playground URL is `/animations?story=tennis&variant=0&edition=1`.
Gallery selections are explicit and stable across reload, replay, theme and Open canvas.


### Material and motion polish

The player uses a generated room environment for stable reflections, with no HDR download.
Paper has eased physical edges and a paper airplane aligned to its flight tangent. Kinetic
plinths have level bases and machined rims. Studio gains more legible reflected material light.
Realistic studies use deterministic procedural roughness (wear) maps; the open book's type is drawn once on a 2D canvas (a procedural fallback where there is none). Abstract studies use
transmission and clearcoat; these are real-time art-directed illustrations, not photographic scans.
Each new scene is original code-authored geometry under the library license; no external assets.

### Contact art directions and personal picks

Contact preserves its original numeric finish IDs 0–2. Variant 3 is **Cartoon · Little post office**,
a miniature mailbox with a letter-delivery loop and moving flag: an original procedural model that loops every 12 seconds
and uses the shared controls and static fallback. The Contact inspector shows only Studio and Cartoon; its Studio edition
selector retains all three original finishes. The Kinetic correspondence mobile (variant 4) was removed on 2026-11-06;
a pinned 4 shows the signature inbox.
`objectDirectionIndex(kind, variant)` resolves these legacy IDs to the shared visual style.
`transferObjectVariant(from, to, variant)` keeps the direction when switching objects if the next one offers it, and uses
that object's default otherwise.

The website's default hobby selection is Cartoon AI, Studio Tennis, Studio Trading, Cartoon Inference,
Paper Travel and Kinetic Reading (see "Directions per subject" for the two that now fall back). Its My picks control
restores this set after a global style preview.

The website Contact page pins Cartoon (variant 3). Compare the other inbox styles in UI Pack; Contact no longer changes style from URL preview parameters.

### Page-integrated artwork

Use `<ObjectScene kind="travel" label="Travel" variant={1} surface="page" controls="playback" theme={theme} />` to reveal the host page behind the artwork. The canvas, stage and border remain transparent in both themes. The default `surface="styled"` retains each direction’s gallery backdrop.

Preview the embedded treatment at `/animations?story=travel&variant=1&surface=page&theme=light` (or `theme=dark`).
