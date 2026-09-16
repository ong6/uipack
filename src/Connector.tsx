import { pathFromPoints, type Point } from "./geometry";

export interface ConnectorProps {
  /** Polyline in user units; use `route()` to build an orthogonal one. */
  points: Point[];
  /** Marker prefix from `<Defs id>`; required for arrowheads. */
  defs?: string;
  arrow?: boolean | "both";
  dashed?: boolean;
  /** Colour the stroke and head by token kind. */
  kind?: "request" | "response" | "change" | "accent";
  /** Id for `<Packet along>` to follow. */
  id?: string;
  radius?: number;
  strokeWidth?: number;
}

export function connectorStroke(kind?: ConnectorProps["kind"]): string {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}

export function Connector({ points, defs, arrow = true, dashed, kind, id, radius = 6, strokeWidth = 1.25 }: ConnectorProps) {
  const d = pathFromPoints(points, radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : undefined;
  return (
    <path
      id={id}
      data-uipack="connector"
      d={d}
      fill="none"
      stroke={connectorStroke(kind)}
      strokeOpacity={kind ? 1 : 0.6}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={arrow ? head : undefined}
      markerStart={arrow === "both" ? head : undefined}
    />
  );
}
