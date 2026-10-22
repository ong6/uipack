import type { LegendItem } from "../Legend";
import { DrillContext } from "./context";
import { cleanId, normalizePath, type DrillPath } from "./model";
import type { DrillFigureProps } from "./DrillFigure";

/** The shape `renderStatic` takes (mirrors `StaticFigure` in uipack/static). */
export interface DrillStaticFigure {
  children: React.ReactNode;
  viewBox: string;
  legend?: LegendItem[];
  number?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  alt?: string;
  background?: "dots" | "plain" | "ruled";
}

/**
 * One level of a DrillFigure as a static figure: the level at `path` (default
 * the figure's `path`, else `defaultPath`, else the root), its drillable nodes
 * drawn with their glow, preview and marker but no button. The eyebrow carries
 * the breadcrumb below the root. `renderStatic(<DrillFigure …/>)` calls this.
 */
export function drillStatic(props: DrillFigureProps, path?: DrillPath): DrillStaticFigure {
  const levels = new Map(props.levels.map((l) => [l.id, l]));
  const root = props.root ?? props.levels[0]?.id ?? "";
  const p = normalizePath(path ?? props.path ?? props.defaultPath, new Set(levels.keys()), root);
  const level = levels.get(p[p.length - 1])!;
  const trail = p.length > 1 ? p.map((id) => levels.get(id)?.label ?? id).join(" › ") : "";
  const lid = `static-${cleanId(level.id)}`;
  return {
    children: (
      <DrillContext.Provider
        value={{ levels, frame: { wide: props.viewBox, narrow: props.narrowViewBox }, idPrefix: lid, variant: "wide", interactive: false, ghost: false }}
      >
        {level.render({ id: lid, variant: "wide", ghost: false, level })}
      </DrillContext.Provider>
    ),
    viewBox: level.viewBox ?? props.viewBox,
    legend: level.legend,
    number: props.number,
    eyebrow: [props.eyebrow, trail].filter(Boolean).join(" · ") || undefined,
    title: level.title ?? level.label,
    caption: level.caption,
    alt: level.alt,
    background: props.background,
  };
}
