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

Open canvas reuses the shared accessible dialog, with bounded zoom, Escape and focus return. Entering or leaving the dialog remounts the player and restarts its sequence. No orbit or live trading data. The tennis GLB is included in its own lazy asset module; there is no third-party model host. The orthographic camera fits the authored animation envelope to both viewport axes.

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

`src/objects/art-directions.ts` and `src/objects/expanded-directions.ts` are the editable sources for all thirty non-Studio scenes.
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
`assets/objects/tennis-return.glb` and `src/objects/tennis-asset.ts`; the latter embeds the same bytes
in a separately loaded JavaScript chunk so consumers need no asset-copy configuration. Generated
editable `.blend`, four pose previews and verification data go to `/tmp/uipack-tennis`. The script
is the durable, reproducible source; copy the editable file elsewhere before clearing temporary files.

The two-player GLB is 716,300 bytes. JavaScript encoding adds transfer
and decode overhead; measure the built chunk too. Only selecting Studio tennis loads the model. Its baked
object animation is sampled deterministically; a contact test checks the exported ball against the
two rackets at 1.9 and 4.9 seconds in a seamless six-second rally. Each instance owns its mixer and materials and disposes them on removal.
The existing SVG remains visible until model loading succeeds, including on an asset-load failure.

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
