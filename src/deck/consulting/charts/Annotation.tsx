import { CX_TYPE, textWidth, wrapToWidth } from "../scale";

export interface AnnotationGeometry {
  lines: string[];
  box: { x: number; y: number; w: number; h: number };
  /** Leader from the box edge (x1, y1) to the data point (x2, y2). */
  leader: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * Where a callout's text and leader go. The text block's top-left (or top-right with
 * `align: "end"`) sits at (tx, ty); the leader leaves the nearest edge of the block and ends on
 * the data point (x, y).
 */
export function annotationGeometry(
  point: { x: number; y: number },
  at: { x: number; y: number },
  text: string,
  maxWidth = 260,
  align: "start" | "end" = "start",
  size: number = CX_TYPE.callout,
): AnnotationGeometry {
  const lines = wrapToWidth(text, size, maxWidth, 4);
  const w = Math.max(...lines.map((l) => textWidth(l, size)));
  const h = lines.length * size * 1.25;
  const bx = align === "end" ? at.x - w : at.x;
  const box = { x: bx, y: at.y, w, h };
  const gap = 10;
  let x1: number;
  let y1: number;
  if (point.x < box.x - gap) {
    x1 = box.x - gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else if (point.x > box.x + w + gap) {
    x1 = box.x + w + gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else {
    x1 = Math.min(Math.max(point.x, box.x), box.x + w);
    y1 = point.y < box.y ? box.y - gap : box.y + h + gap;
  }
  return { lines, box, leader: { x1, y1, x2: point.x, y2: point.y } };
}

export interface AnnotationProps {
  /** The data point the leader ends on. */
  x: number;
  y: number;
  /** Top-left of the text (top-right with `align="end"`). */
  tx: number;
  ty: number;
  text: string;
  /** Wrap width in canvas pixels. */
  width?: number;
  align?: "start" | "end";
}

/** An annotation inside a chart's SVG: wrapped text, and a leader line that ends on the data point it explains. */
export function Annotation({ x, y, tx, ty, text, width = 260, align = "start" }: AnnotationProps) {
  const g = annotationGeometry({ x, y }, { x: tx, y: ty }, text, width, align);
  const size = CX_TYPE.callout;
  const textX = align === "end" ? g.box.x + g.box.w : g.box.x;
  return (
    <g className="uipack-cx-callout">
      <line className="uipack-cx-callout__leader" x1={g.leader.x1} y1={g.leader.y1} x2={x} y2={y} />
      <circle className="uipack-cx-callout__ring" cx={x} cy={y} r={9} />
      <circle className="uipack-cx-callout__dot" cx={x} cy={y} r={3.5} />
      <text
        x={textX}
        y={g.box.y + size * 0.85}
        fontSize={size}
        textAnchor={align}
        className="uipack-cx-t uipack-cx-callout__text uipack-cx-halo"
      >
        {g.lines.map((l, i) => (
          <tspan key={i} x={textX} dy={i === 0 ? 0 : size * 1.25}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Where to annotate a chart: offsets of the text block from the data point. */
export interface ChartCallout {
  text: string;
  /** Text block offset from the point, in canvas px. */
  dx: number;
  dy: number;
  width?: number;
  align?: "start" | "end";
}
