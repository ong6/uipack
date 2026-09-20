# Significant UI starts in UI Pack

Use this flow for a custom illustration, 3D object, animation player, interactive diagram, or substantial reusable layout. A second consumer is not required. Page copy, routing and simple layout glue stay in the consuming project.

1. Search the catalog and package exports. Extend the existing primitive before creating another implementation.
2. Build the reusable geometry, interaction and styles here. Accept content, theme and playback through props; do not depend on the homepage or its UI framework. Keep heavy rendering behind an optional, lazy entry.
3. Register a real rendered example in `playground/catalog.ts`, with a stable ID, type, style and tags. Add it to the relevant collection. Document the public import and fallback.
4. Check the built package, light/dark at desktop and 390px, reduced motion, no-WebGL fallback, keyboard controls, lifecycle cleanup and relevant animation transitions. Inspect screenshots and moving intermediate frames, not only the resting pose.
5. Integrate the package export into the project and expose the same example in its UI Pack gallery. Consumer wrappers may map theme or active state, but may not copy geometry, rendering or playback code.
6. Run the consumer's UI Pack ownership check and production build. For portable local review, pack the built library with `npm pack --ignore-scripts` and install its repository-relative archive in the consumer. Do not link a sibling checkout into a bundler with a restricted root. Publication is a separate step: publish the library commit first, then pin that exact reachable commit in the consumer lockfile and verify a clean install. Never commit a machine-specific dependency or deploy before the library revision is reachable.

The homepage checks `ui-inventory.json` in `npm run prebuild`. Every significant visual has a library export and a gallery location, or a specific, reviewed page-only reason. New custom canvases and direct Three.js imports are rejected. Add new significant UI to the inventory as part of the same change; do not hide reusable rendering in a page-specific exception.

## Complex modeled animation

For articulated characters or complex deformation, author and review the geometry, rig and motion in Blender before integrating it. Keep the editable `.blend` source (or reproducible generation script) and exported `.glb` asset in UI Pack. Review the silhouette, anticipation, contact, follow-through and recovery from the intended website camera before export. Bake unsupported constraints and procedural effects into exportable animation; inspect the exported file because Blender's rendered appearance is not the browser result.

Register the exported scene in the library catalog before adding it to a consumer. The library owns asset loading, animation clips, disposal and fallback, and connects the clip to the existing pause/replay/reduced-motion controls. Load only the selected model. Verify download size, mobile performance, load failure and light/dark framing using the built package. Homepage components continue to import UI Pack without copying loaders or model files.

Tennis now uses this path: its reproducible Blender source exports a GLB that the existing Three.js player loads lazily. The other six object scenes remain procedural. Keep asset authoring and browser playback as separate responsibilities.

For variants, author a small named set, choose once when the scene mounts, and preserve the selection during replay, theme changes and expanded-canvas inspection. Support a pinned variant for reproducible review. Validate every variant rather than assuming shared geometry guarantees shared bounds.
