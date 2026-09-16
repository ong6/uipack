import { useFigureHover, hoverAttrs, type Flow } from "./hover";
import { pathFromPoints, trim, type Point } from "./geometry";

export type ConnectorKind = "request" | "response" | "change" | "accent";

export interface ConnectorProps {
  /** Polyline in user units; use `route()` to build an orthogonal one. */
  points: Point[];
  /** Marker prefix from `<Defs id>`; required for an arrowhead. */
  defs?: string;
  /**
   * One arrowhead at the last point. A request/response pair is one connector
   * drawn in the request direction; the response packet rides it `reverse`.
   */
  arrow?: boolean;
  dashed?: boolean;
  /** Colour the stroke and head by token kind. */
  kind?: ConnectorKind;
  /** Flow names for hover highlighting. */
  flow?: Flow;
  /** Id for tests or `<use>`. */
  id?: string;
  radius?: number;
  strokeWidth?: number;
  /**
   * Units the path stops short of its first and last point, so the line and
   * its head never touch a node border. Default 2 at both ends; the head end
   * gets 2 more so the tip sits clear.
   */
  inset?: number | [number, number];
}

export function connectorStroke(kind?: ConnectorKind): string {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}

export function Connector({ points, defs, arrow = true, dashed, kind, flow, id, radius = 6, strokeWidth = 1.25, inset = 2 }: ConnectorProps) {
  const hover = useFigureHover();
  const [s, e] = Array.isArray(inset) ? inset : [inset, inset];
  const d = pathFromPoints(trim(points, s, arrow ? e + 2 : e), radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : undefined;
  return (
    <path
      id={id}
      data-uipack="connector"
      {...hoverAttrs(flow, kind, hover)}
      d={d}
      fill="none"
      stroke={connectorStroke(kind)}
      strokeOpacity={kind ? 1 : 0.6}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={arrow ? head : undefined}
    />
  );
}
