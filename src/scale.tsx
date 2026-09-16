import { createContext, useContext, type ReactNode } from "react";

/**
 * Text floor for one drawing. `floor` is in user units: the smallest font size
 * that still renders at `minFont` CSS pixels once the SVG is scaled from its
 * viewBox width to the width it is shown at.
 */
export interface FigureScale {
  floor: number;
}

export const FigureScaleContext = createContext<FigureScale>({ floor: 0 });

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
