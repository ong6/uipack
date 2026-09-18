# Canvas, selection, and mobile

## SVG figures

`Figure` supports Open canvas by default. Pass `expandable={false}` to omit it. `controls={false}` disables motion controls only; reduced motion also hides only motion controls. Canvas and selection remain usable.

Node, Chip, and Group expose a keyboard-operable selection button inside a Figure. Selecting an item adds an accent outline and glow, sets `aria-pressed`, and shows its label/detail in a status row. Nodes with a flow also retain that flow's highlighting while selected. Nodes with `href` remain links. Bare parts outside Figure and static SVG exports are not interactive.

All supplied presets and Habitat have narrow drawings. Other dense drawings retain readable internal width and can scroll horizontally; the page itself must not overflow. Open canvas uses the wide drawing with Fit, zoom in/out, and native scrolling. Zoom is bounded to 1–3×. SVG text has a minimum rendered size; the supplied narrow layouts avoid relying on enlarged text inside tiny boxes.

## 3D animations

Click or tap a 3D object to select it. Projected component labels are buttons. Inspect component provides another route to every currently visible component even when collision avoidance hides its label. Selection illuminates the selected model component, accents its label, and displays its details. Changing the camera stop clears selection.

The player provides Open canvas, bounded camera zoom from 0.75–2×, Fit, and Close canvas. Present remains a separate in-page presentation mode. Free orbit, pinch gestures, editing geometry, and file export are not included.

Canvas uses a native modal dialog. Escape closes it, focus stays inside, and close returns focus to the opener. Body scrolling is restored. Entering/exiting canvas may remount the visual and restart flow animation; the selected story and stop remain.

Include `uipack/theme.css` for SVG figures and `uipack/slides.css` for animations. The distributed stylesheets include the shared canvas styles.
