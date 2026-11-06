# The look system for 3D object scenes

`src/objects/look.ts` is the shared rendering layer under every art direction: a light rig per
theme, image-based lighting, physically based material presets, contact shadows, framing and
tone mapping. `mount.ts` applies it; a direction only declares what it wants.

## Opting in

A direction sets `userData.look` on the root it returns, and builds its meshes with `lookMaterial`:

```ts
import { lookMaterial, themed, shade, type ObjectLook } from "./look";

const kineticLook: ObjectLook = {
  rig: {
    both: { key: { color: 0xffe9c9, intensity: 2.5 }, rim: { color: 0x9cc3ff, intensity: 1.5 } },
    dark: { rim: { intensity: 3 }, hemisphere: { intensity: 0.1 } },
  },
  camera: { projection: "perspective", fov: 28, pitch: 8 },
  framing: { fill: 0.6 },
  contactShadow: true,
};
root.userData.look = kineticLook;

const brass = lookMaterial("metal", 0xb8893b, { roughness: 0.22 });
const base = themed(lookMaterial("plastic", 0x1e2a33, { roughness: 0.7 }), { dark: { color: shade(0x1e2a33, -0.3) } });
```

Each direction's look lives beside its builders: `studioLook` in `studio.ts` (Contact's original
editions fall back to the defaults in `scenes.ts#createObject`), `paperLook` in `paper-worlds.ts`,
`kineticLook` in `kinetic-sculptures.ts`, and `cartoonLook`, `realisticLook` and `abstractLook` in
`expanded-cartoon.ts`, `expanded-realistic.ts` and `expanded-abstract.ts`. Change those, not `mount.ts`.

Studio adds two scene-local devices in `studio.ts` on top of its rig. A rim term on every lit,
non-paper material (`addRim`) brightens surfaces that turn away from the lens towards the rim's
side; it rides in the emissive colour, so `themed` switches it (white and faint by day, store green
at night). A sweep (`sweep`) draws the seamless backdrop only as light: a falloff away from the
subject and, at night, a green pool behind it. Its geometry is stored small and scaled in the vertex
shader, so it never counts towards bounds or framing.

## Light rigs (`lightRigs`, `rig`)

| Part | Light default | Dark default | Notes |
|---|---|---|---|
| Tone mapping, exposure | ACES, 1.05 | ACES, 1.0 | `toneMapping: "agx" \| "neutral"` for gentler highlights |
| Environment | `room`, 0.35 | `room`, 0.2 | `softbox` for metal and glass; `rotation` (radians) moves highlights; `none` saves the PMREM pass |
| Hemisphere | warm sky / slate ground, 2.0 | cool sky / near-black ground, 1.15 | the ambient; lower it for drama |
| Key | warm, 2.5, top-left front | warm, 2.4 | `shadow: true` adds a shadow map (see budget) |
| Fill | off | off | set `intensity` to use it |
| Rim | cool, 1.4, behind right | cool, 3.0 | lifts silhouettes off a dark card |
| `reflections` | 1 | 0.75 | multiplies every preset's reflection strength |

`rig.both` applies to both themes, then `rig.light` / `rig.dark` on top. Dark mode should be a
different light, not a recoloured card: lower ambient, keep or raise the rim, and use `themed`
materials for anything that should go darker (plinths, slabs about 30%) or glow at night
(`emissive`, `emissiveIntensity`).

## Material presets (`lookMaterial(preset, color, overrides)`)

| Preset | Base | Use for | Key values |
|---|---|---|---|
| `metal` | Standard | polished brass, chrome, steel | metalness 1, roughness 0.24 |
| `brushedMetal` | Physical | aluminium, brushed steel | roughness 0.36, anisotropy 0.65 |
| `glass` | Physical | optical glass, crystals | transmission 1, thickness 0.6, ior 1.5, roughness 0.04 |
| `ceramic` | Physical | glazed ceramic, gloss enamel | roughness 0.38, clearcoat 1 / 0.06 |
| `paper` | Standard | card, paper, matte print | roughness 0.94, procedural fibre map and normal map |
| `plastic` | Standard | matte plastic, painted parts | roughness 0.48 |
| `rubber` | Standard | grips, feet, cables | roughness 0.9, faint reflections |
| `felt` | Physical | tennis felt, cloth | sheen 1, fibre normal map |

- Any `MeshPhysicalMaterial` option overrides the preset (`dispersion`, `attenuationColor`,
  `sheenColor`, `clearcoat`…). `envMapIntensity` scales the preset's own reflection strength.
- `grain` sets how many times the fibre texture tiles on paper and felt (default 4). The mesh needs UVs.
- Presets get the environment at their own strength; three otherwise gives every material the
  scene's single `environmentIntensity`. Unconverted materials keep the rig's environment value.
- **Glass needs something behind it.** Put the colour in the scene (bands, a backdrop): glass
  refracts only what three renders. Where nothing is behind, it refracts `transmissionBackdrop`
  (per theme, defaults close to the card), so the canvas stays transparent and glass does not go white.
- **Metal needs something to reflect.** Use `environment: { kind: "softbox" }` for crisp highlights.
- Thin wires: use tubes, never `Line`. `lineRadius(subjectHeight)` gives the world radius that
  draws 1.5px on a 360px card at the default fill.

## Shadows

- `contactShadow: true` (or `{ opacity, spread, y, color }`) adds a baked soft ellipse under the
  subject at its rest pose, in the root's own floor plane. Two triangles, no shadow map. It is a
  child of the root, so it follows the root's sway. Floating subjects: set `y` lower and `opacity` lower.
- `castShadows: true` makes every mesh cast and receive the key's shadow map (PCF, `shadowRadius`
  4, 1024 map). Use it when parts shadow each other (cut-paper layers, dioramas); prefer a contact
  shadow when one object only needs grounding.

## Framing (`framing`, `camera`)

By default the camera fits the subject: its projected bounds fill `fill` (0.62) of the frame's
height, never more than `maxWidth` (0.78) of its width, centred and lifted by `lift` (0.02 of the
height). Bounds are measured once per mount over the whole loop (`sample: "loop"`) or the rest
pose only (`sample: "rest"`), and re-fitted on every resize, so phones and slides frame alike.
`canvas[data-fill]` reports the result.

- Mark backdrops, floors that run off the frame and decoration with `mesh.userData.frameIgnore = true`.
- `framing: false` keeps the old fixed frame (not recommended).
- `camera: { projection: "perspective", fov, pitch, yaw }` replaces the authored straight-on
  orthographic view. Pitch is what makes plinths and floors read as surfaces; when you add it,
  remove the matching tilt from the root.
- Close-up crops (realistic macro): raise `fill` above 0.8 and `maxWidth` above 1.
- A set whose cards must match (cartoon's islands) can frame a fixed invisible proxy instead of its
  props: a `LineSegments` envelope with `colorWrite: false` that every prop stays inside, so it
  alone sets the fit (lines cast no shadow and never render). Check that `data-fill` matches across
  the set.

## Performance budget

These run as small cards, in slides, on phones and on CI's software WebGL (Mesa llvmpipe).
`e2e/art-directions.spec.ts` enforces: under 220 draw calls and 100k triangles per scene at rest,
and over 15 paints a second at 390px (13 on CI), capped at 30.

| Feature | Cost | Advice |
|---|---|---|
| Environment (PMREM) | one-off at mount, a few ms | free per frame; `none` only if you light everything directly |
| Preset materials | Standard: as before. Physical: heavier shader | Physical only where its feature shows |
| `glass` (transmission) | an extra render of the opaque scene per frame | one glass direction; few glass meshes; small `thickness` |
| `castShadows` / key `shadow` | an extra depth pass per frame | leave the map at 1024 |
| `contactShadow` | 1 draw call | default choice for grounding |
| Framing | one-off at mount: about 3k vertices per pose, 9 poses for a loop (about 4ms; 70ms for the skinned tennis model) | free per frame |
| Draw calls | each mesh × material is one | merge static parts (`mergeGeometries`), share materials, use `InstancedMesh` for repeats |

Pixel ratio is capped at 1.5 and phones paint at 30 fps; do not raise either.
