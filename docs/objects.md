# Object scenes

```tsx
import { ObjectScene, objectScenes } from "uipack/objects";
import "uipack/objects.css";

<div style={{ height: 420 }}>
  <ObjectScene kind="tennis" label="Tennis practice" theme="light" active />
</div>;
```

Seven scenes: `ai`, `contact`, `tennis`, `trading`, `server`, `travel`, `reading`. `tennis` plays an original Blender-authored model; the other six are procedural. `contact` routes three generic communication signals into a shared inbox. `objectScenes` contains their titles and descriptions. Theme is `light` or `dark`; optional `palette` accepts numeric `paper`, `ink`, `muted`, and `accent` colours. Keep a custom palette reference stable.

`active={false}` shows the labelled SVG fallback with no WebGL renderer or Three.js load. Active scenes lazily import Three.js, play once for 5.4 seconds, then offer Replay. Pause/Resume preserve time. Hidden tabs suspend rendering; mobile painting is capped at 30fps. Reduced motion draws the final pose and hides motion controls. Context loss and renderer-load errors retain the fallback. Geometry, materials, textures, observers and animation frames are disposed on unmount.

Open canvas reuses the shared accessible dialog, with bounded zoom, Escape and focus return. Entering or leaving the dialog remounts the player and restarts its sequence. No orbit or live trading data. The tennis GLB is included in its own lazy asset module; there is no third-party model host. The orthographic camera fits the authored animation envelope to both viewport axes.

Review all seven examples in `/animations` (Objects filter). Consumers import the scene and player from `uipack/objects`; geometry and playback stay in the package.

The revised hobby sequences show an agent laptop typing and receiving tool results, a rear-view tennis player returning a ball, red/green market candles and order flow, and a thin sheet turning over layered book pages. The map and inference study retain their existing designs. Tennis contact is checked against the racket face at impact. See [the component-first workflow](component-first.md#complex-modeled-animation) for the Blender authoring path.


## Curated variations

Every scene has three named looks. `variant="random"` is the default: selection happens on the
client once per component mount. A fresh mount can repeat the same look by chance. Replay, theme
changes and Open canvas preserve it. **Another look** cycles through all three without a reload.
Use `variant={0}`, `{1}` or `{2}` to pin a reproducible look; pinned scenes hide the cycling button.
The playground accepts `?story=tennis&variant=1`. `objectVariants` exports the names.

Tennis offers grass, clay and blue hardcourt with matching kit. Trading varies the actual candle
sequence (breakout, pullback, range reversal), preserving red/green meaning. The other scenes vary
curated material accents. Geometry and timing are never randomized frame by frame. Custom `palette`
sets the base theme; looks 1/2 override the accent. Tennis uses its authored material sets.

## Blender source and export

Run `blender --background --factory-startup --python-exit-code 1 --python scripts/objects/tennis.py`
from the repository. The original model uses no external assets or textures. The script produces
`assets/objects/tennis-return.glb` and `src/objects/tennis-asset.ts`; the latter embeds the same bytes
in a separately loaded JavaScript chunk so consumers need no asset-copy configuration. Generated
editable `.blend`, four pose previews and verification data go to `/tmp/uipack-tennis`. The script
is the durable, reproducible source; copy the editable file elsewhere before clearing temporary files.

The GLB is 507,900 bytes (139,645 bytes gzip), with 16,488 triangles. JavaScript encoding adds transfer
and decode overhead; measure the built chunk too. Only selecting tennis loads the model. Its baked
object animation is sampled deterministically; a contact test checks the exported ball against the
racket at 1.9 seconds. Each instance owns its mixer and materials and disposes them on removal.
The existing SVG remains visible until model loading succeeds, including on an asset-load failure.
