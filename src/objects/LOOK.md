# Ink line art: the renderer and the role contract

Every 3D object scene is drawn one way, ink line art. This file is for whoever changes the renderer
or builds a subject: what the renderer does, the contract a model's parts follow, and how to add a
subject. The props and behaviour a consumer sees are in [docs/objects.md](../../docs/objects.md).

| File | Owns |
| --- | --- |
| `ink.ts` | The renderer: `inkify(root, colors)` redraws a built subject; `readInkColors(stage)` reads the page's roles |
| `look.ts` | The lens and framing a subject declares (`userData.look`), and `contactShadow` |
| `studio.ts` | The subjects: `contact`, `tennis`, `trading`, `server`, `travel` |
| `scenes.ts` | The registry (`createObject`), with the seam for `ai` and `reading` |
| `mount.ts` | The canvas: build queue, renderer, framing, playback, frame cap, recolour, teardown |

## What the renderer draws

`inkify` walks the built subject once, after its contact shadows are added and before the first
paint:

- **Faces:** every mesh's material is replaced by one small unlit shader per role (a flat colour,
  with an optional print, below). No lights, environment map, shadow maps, transmission, clearcoat
  or post-processing.
- **Silhouette:** an inverted hull (the part's back faces pushed out along its averaged normals) a
  constant 2 CSS px wide on screen, at every canvas size and pixel ratio. A part scaled to exactly
  zero draws nothing, which is how a builder hides an instance.
- **Creases:** fat lines (`LineSegments2`) where faces meet at 65° or more, 1.1 px (1 px, in the
  paper colour, on accent and dark parts). Parts under 0.05 units take none (screws, LEDs, holes),
  nor do spheres, tubes and tori, whose silhouette is their drawing.
- **Lines a builder draws** (`THREE.Line`, `LineLoop`, `LineSegments`: strings, seams, icons, rods)
  become fat ink lines at `userData.inkWidth` CSS px (default 1.1).
- **Contact shadows** (`contactShadow()`, named `contact-shadow`) become a faint hard-edged ink
  ellipse; a builder animates one through its `material.opacity`.
- **Merging:** a part that never moves relative to its nearest moving ancestor is merged with the
  other parts of its role there (one fill, one silhouette, one crease mesh per role per rigid
  group); a part that moves, carries several materials or a print, or has children is restyled in
  place. Which parts move is found by sampling `animate` over the loop.

Colours are uniforms shared by every material of a role, so `setColors` (a theme change) restyles a
running scene without compiling anything. A typical subject compiles 4 to 8 programs.

## The role contract

A mesh may carry `userData.inkRole`, one of four roles; when present it decides the face's tone.
Only otherwise is the role read from the mesh's original material colour.

| `inkRole` | Use it for | Light page | Dark page |
| --- | --- | --- | --- |
| `paper` | Most bodies: panels, frames, paper, felt, plates | The paper itself | Paper lifted 10% toward the ink |
| `shade` | Secondary bodies that should read as a different surface: housings, a desk, a lid, a falling bar's bead | Paper 13% toward the ink | The paper itself (darker than `paper` faces) |
| `dark` | Small dense parts drawn as solid ink: holes, wells, LEDs, a can's open mouth, a racket's collar | The ink | The ink (light on a dark page) |
| `accent` | The subject's one accent part | The accent | The accent |

- **Precedence:** the mesh's `userData.inkRole`, then its material's `userData.inkRole` (one tag for
  every mesh sharing the material), then the colour: exactly `INK_BUILD_PALETTE.accent` is `accent`,
  a near-black (linear luminance under 0.08) is `shade`, anything else `paper`; a `userData.glow`
  part is `dark`. New models tag every mesh and never rely on the colour.
- **One accent part per subject.** It is the thing the subject is about (the compute sled, the
  route, the newest bar); everything else is paper, shade or dark. `test/objects.test.tsx` checks a
  subject has an accent and keeps it a small share of its parts.
- **Silhouettes and creases are always ink** (the paper colour on accent and dark faces); a builder
  never picks line colours.
- **Optional extras:** `userData.inkCreases = false` drops a part's crease lines (fan blades, guard
  rings: many small faces that only add noise). `material.userData.inkPrint = texture` draws a print
  on a face: the texture's alpha is ink coverage, drawn in the ink colour over the role's tone
  (the atlas). Draw a print as line work, never a picture; free its texture in `root.userData.dispose`.
- **Never:** photographic textures, painted-on screens or labels, textured text (words are HTML
  beside the scene), transparency fades (a part is pushed in, pulled out, scaled or hidden instead),
  parts sunk into one another (a silhouette hidden inside another part disappears: stand parts
  clear, as Contact's stacked receipts are).

## Adding a subject

1. **A builder in its own file** (`studio-<kind>.ts`), exporting a function that takes no required
   arguments and returns a `THREE.Group`:
   - every mesh tagged with `userData.inkRole` (any material: it is replaced, so a shared
     `MeshBasicMaterial` per role is enough);
   - fine detail as `THREE.Line`/`LineSegments` with `userData.inkWidth`, not thin tubes;
   - the subject sitting on `y = -1` (the shared tabletop), roughly 3 to 4 units across;
   - `userData.animate(time)` setting the pose for a time in ms and `userData.phase` / `userData.pose`
     (0..1 through the motion); `userData.loopDuration` for a seamless loop (or `playDuration` for a
     play-once subject, which rests at 5400 ms); `userData.restTime`, the still pose for reduced
     motion;
   - `userData.look`: `{ camera: { projection: "perspective", fov, pitch }, framing: { fill, maxWidth, lift }, contactShadow }`
     (`studioLook(shot)` in `studio.ts` is the shared lens family).
2. **Register it** in `src/objects/scenes.ts`. The seam is marked there: for the two subjects being
   built now, import `ai` from `./studio-ai` and `reading` from `./studio-reading` and replace the two
   `null`s in `builders`. A kind whose builder is `null` shows its fallback drawing and opens no
   WebGL context.
3. **Check it:** `npx vitest run test/objects.test.tsx` (add the kind to `built`: finite bounds, every
   mesh tagged, a seamless loop, one accent), then `e2e/ink.spec.ts` (add it to `built`: both themes,
   both widths, the budgets). Look at stills in light and dark, at 573 × 558 and 390 wide, at rest
   and at two other points in the loop: no doubled outlines, no lines that shimmer between samples,
   no part that loses its shape, one accent.
4. **Docs:** its row in [docs/objects.md](../../docs/objects.md#subjects) and its description in
   `scene-list.ts`.

## Budget

Under 100 draw calls, 100,000 triangles and 10 shader programs per subject at rest
(`e2e/ink.spec.ts`). Pixel ratio is capped at 1.5; desktops paint at 60 frames a second at most and
phones at 30; do not raise either. Merge static parts by keeping them static (the renderer does the
rest), reuse geometries, and use `InstancedMesh` for repeats; hide an instance with a zero-scale
matrix.
