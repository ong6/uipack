# Canvas, selection, and mobile

## SVG figures

`Figure` supports Open canvas by default. Pass `expandable={false}` to omit it. `controls={false}` disables motion controls only; reduced motion also hides only motion controls. Canvas and selection remain usable.

Node, Chip, and Group expose a keyboard-operable selection button inside a Figure. Selecting an item adds an accent outline and glow, sets `aria-pressed`, and shows its label/detail in a status row. Nodes with a flow also retain that flow's highlighting while selected. Nodes with `href` remain links. Bare parts outside Figure and static SVG exports are not interactive.

All supplied presets and Habitat have narrow drawings. Other dense drawings retain readable internal width and can scroll horizontally; the page itself must not overflow. Open canvas uses the wide drawing with Fit, zoom in/out, a zoom percentage, and native scrolling. Pinch over the drawing to zoom around the pointer; two-finger scrolling pans the drawing. Fit resets zoom and scroll to the original readable view. Zoom is bounded to 1–3×. SVG text has a minimum rendered size; the supplied narrow layouts avoid relying on enlarged text inside tiny boxes.

## 3D animations

Click or tap a 3D object to select it. Projected component labels are buttons. Inspect component provides another route to every currently visible component even when collision avoidance hides its label. Selection illuminates the selected model component, accents its label, and displays its details. Changing the camera stop clears selection.

The player provides Open canvas, bounded camera zoom from 0.75–2×, Fit, and Close canvas. Present remains a separate in-page presentation mode. Pinch zoom moves the real camera around its authored target and preserves the current story stop. Free orbit, camera panning, editing geometry, and file export are not included.

Canvas uses a native modal dialog. Escape closes it, focus stays inside, and close returns focus to the opener. Body scrolling is restored. Entering/exiting canvas may remount the visual and restart flow animation; the selected story and stop remain.

Include `uipack/theme.css` for SVG figures and `uipack/slides.css` for animations. The distributed stylesheets include the shared canvas styles.

## Gestures and keyboard

Expanded canvases handle Mac trackpad pinch through Ctrl+wheel events in Chromium and gesture events in Safari. Touchscreen two-finger pinch is handled separately. Ordinary wheel/trackpad scroll stays native, and gesture handling is scoped to the drawing or 3D scene; the surrounding page retains browser zoom. Command-plus/minus remain browser shortcuts. Inside the canvas, plain `+`/`-` change zoom and `0` resets it. Form fields keep their normal keyboard behaviour.

Zoom updates are batched once per animation frame, bounded, and direct rather than followed by a delayed animation. SVG zoom adjusts scroll to keep the point under the pointer stable, within scroll bounds. Pinching does not trigger item selection. Closing removes the listeners and pending frame.

### Implementation decision

Reviewed [Panzoom](https://github.com/timmywil/panzoom) and [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch), including its wheel handling. Both are useful for transformed DOM content. This library already has separate SVG sizing and Three.js camera controls, so `src/canvas-gestures.ts` adapts native gesture inputs to those controls without adding a transform wrapper or dependency. Reconsider a library if free pan/orbit, momentum, or an editor is added.

Regression tests dispatch Ctrl+wheel, Safari-style gesture, and two-touch events in Chromium and WebKit. They check pointer anchoring, limits, reset, event scoping, and real 3D label reprojection without remounting. Synthetic events verify the handlers; a physical Mac trackpad is still the final check for gesture feel.
