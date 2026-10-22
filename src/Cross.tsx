import { connectorStroke, type ConnectorKind } from "./Connector";

export interface CrossProps {
  /** Centre of the mark. */
  x: number;
  y: number;
  /** Half the mark's width in user units. Default 5. */
  r?: number;
  /** Colour by token kind; default the ink. */
  kind?: ConnectorKind;
}

/**
 * A ✕ where something stops: a lost message at the end of a dashed Connector
 * with `arrow={false}`, a dropped item, a refused call. End the connector
 * `r + 6` units short of where the line would have arrived.
 */
export function Cross({ x, y, r = 5, kind }: CrossProps) {
  return (
    <g data-uipack="cross" stroke={connectorStroke(kind)} strokeOpacity={kind ? 1 : 0.8} strokeWidth={1.75} strokeLinecap="round" aria-hidden="true">
      <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
      <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} />
    </g>
  );
}
