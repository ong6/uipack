import type { CSSProperties, ElementType, ReactNode } from "react";
import { FigureChromeContext, type FigureChrome } from "../context";
import type { UiStyleId } from "../style";

export interface WebSurfaceProps {
  children: ReactNode;
  /** Force a theme; omit to follow the nearest data-theme ancestor or the system. */
  theme?: "light" | "dark";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /**
   * The style the page is painted in: a registered style id, "technical" (the
   * default and only implemented style, diagram-led). Sets data-ui-style; omitted, the nearest
   * ancestor's. A swap changes tokens, ornaments and the layout defaults the style sets.
   */
  uiStyle?: UiStyleId;
  /** "style" applies the style's layout defaults (set by WebPage); "shared" or omitted, none. */
  layout?: "style" | "shared";
  /**
   * Tool chrome for figures inside: "quiet" (default) drops Open canvas and one-entry legends,
   * which belong to articles and docs, not a marketing page. "full" keeps them.
   */
  figureChrome?: FigureChrome;
}

/** Root of a web page or panel: carries the style's tokens, background and type. */
export function WebSurface({
  children,
  theme,
  as: Tag = "div",
  className = "",
  style,
  uiStyle,
  layout,
  figureChrome = "quiet",
}: WebSurfaceProps) {
  return (
    <Tag
      className={`uipack-web ${className}`.trim()}
      data-theme={theme}
      data-ui-style={uiStyle}
      data-ui-layout={layout}
      style={style}
    >
      <FigureChromeContext.Provider value={figureChrome}>{children}</FigureChromeContext.Provider>
    </Tag>
  );
}

export interface GridProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/** 12 / 8 / 4 column grid with 8-pt gutters, sized by its container. */
export function Grid({ children, className = "", as: Tag = "div" }: GridProps) {
  return <Tag className={`uipack-web-grid ${className}`.trim()}>{children}</Tag>;
}

export interface GridItemProps {
  children: ReactNode;
  /** Columns spanned at wide (of 12), medium (of 8) and narrow (of 4) widths. */
  span?: [wide: number, medium: number, narrow: number];
  className?: string;
  as?: ElementType;
}

export function GridItem({ children, span = [4, 4, 4], className = "", as: Tag = "div" }: GridItemProps) {
  const style = { "--span-w": span[0], "--span-m": span[1], "--span-n": span[2] } as CSSProperties;
  return (
    <Tag className={`uipack-web-grid__item ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
