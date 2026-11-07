import { createContext, useContext, type ReactNode } from "react";

/**
 * Text floor for one drawing. `floor` is in user units: the smallest font size
 * that still renders at `minFont` CSS pixels once the SVG is scaled from its
 * viewBox width to the width it is shown at.
 */
export interface FigureScale {
  floor: number;
  /** User units per CSS pixel at the width the drawing is shown at (0 or absent: not measured). */
  unitsPerPx?: number;
}

export const FigureScaleContext = /*#__PURE__*/ createContext<FigureScale>({ floor: 0 });

/** Width a figure is assumed to render at before it is measured (the prose breakout on junxiong.dev). */
export const DEFAULT_RENDER_WIDTH = 1088;

/** User-unit floor for a drawing `vbWidth` wide shown at `renderWidth` CSS px. */
export function fontFloor(vbWidth: number, renderWidth: number, minFont: number): number {
  if (!vbWidth || !renderWidth || !minFont) return 0;
  return (minFont * vbWidth) / renderWidth;
}

/** Wrap a drawing that is rendered outside a Figure (static export, tests). */
export function FigureScaleProvider({ floor, children }: { floor: number; children: ReactNode }) {
  return <FigureScaleContext.Provider value={{ floor }}>{children}</FigureScaleContext.Provider>;
}

/** Clamp a font size to the enclosing figure's floor. Outside a Figure the size is returned as is. */
export function useFontFloor(size: number): number {
  const { floor } = useContext(FigureScaleContext);
  return Math.max(size, floor);
}

/** The touch minimum (docs/system/layout, core rule 4) in CSS px, and the hit height used before a figure is measured, in user units. */
export const TOUCH_TARGET_PX = 44;
const UNMEASURED_TARGET = 54;

/**
 * Size in user units of an interactive box's invisible touch target, centred on the box: the box
 * itself, at least 54 units tall, and at least 44 CSS px each way once the drawing is scaled to its
 * rendered width (plus 1px for subpixel rounding). Only the hit area grows; the drawing does not.
 */
export function useTouchTarget(w: number, h: number): { w: number; h: number } {
  const { unitsPerPx } = useContext(FigureScaleContext);
  const min = unitsPerPx ? (TOUCH_TARGET_PX + 1) * unitsPerPx : 0;
  return { w: Math.max(w, min), h: Math.max(h, UNMEASURED_TARGET, min) };
}
