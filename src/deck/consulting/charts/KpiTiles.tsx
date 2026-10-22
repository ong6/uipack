import { Morph } from "../../parts";
import { linearScale } from "../scale";

/** A 2px trend line in the de-emphasis grey, with the latest point in the accent. */
export function Sparkline({ values, width = 132, height = 44 }: { values: readonly number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => 6 + (i / (values.length - 1)) * (width - 12);
  const y = linearScale(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - 6, 6]);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  return (
    <svg className="uipack-cx-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="uipack-cx-spark__line" d={d} />
      <circle className="uipack-cx-spark__dot" cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={5} />
    </svg>
  );
}

export interface KpiDelta {
  /** Signed text, as shown: "+22%", "−3.1 pts". */
  text: string;
  direction: "up" | "down" | "flat";
  /** Whether the move is good news. Sets the colour; the arrow and sign carry the direction. */
  sentiment?: "good" | "bad" | "neutral";
  /** Comparison period: "vs FY22". */
  period?: string;
}

export interface KpiItem {
  label: string;
  value: string;
  /** Small unit after the value: "pts", "M". */
  unit?: string;
  delta?: KpiDelta;
  /** A muted line under the value when there is no delta: "Fit-out and site exits". */
  note?: string;
  /** About 6–12 points, oldest first. */
  trend?: readonly number[];
  /** Wraps the value in `Morph as="span"`, so a morph can carry it into the next slide's title. */
  morphId?: string;
  highlight?: boolean;
}

const Arrow = ({ direction }: { direction: KpiDelta["direction"] }) => (
  <svg className="uipack-cx-delta__arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    {direction === "up" && <path d="M9 2 L16 14 H2 Z" />}
    {direction === "down" && <path d="M9 16 L16 4 H2 Z" />}
    {direction === "flat" && <path d="M2 7 H16 V11 H2 Z" />}
  </svg>
);

/** A row of stat tiles: label, value, a signed delta with an arrow, and a sparkline. */
export function KpiTiles({ items, columns }: { items: readonly KpiItem[]; /** Tiles per row. Default: all in one row. */ columns?: number }) {
  const per = Math.max(1, columns ?? items.length);
  return (
    <ul className="uipack-cx-kpis" style={{ gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }}>
      {items.map((k, i) => (
        <li
          key={k.label}
          className="uipack-cx-kpi"
          data-highlight={k.highlight ? "" : undefined}
          data-first-col={i % per === 0 ? "" : undefined}
          data-last-col={i % per === per - 1 ? "" : undefined}
          data-next-row={i >= per ? "" : undefined}
        >
          <p className="uipack-cx-kpi__label">{k.label}</p>
          <div className="uipack-cx-kpi__row">
            <p className="uipack-cx-kpi__value">
              {k.morphId ? (
                <Morph id={k.morphId} as="span">
                  {k.value}
                </Morph>
              ) : (
                <span>{k.value}</span>
              )}
              {k.unit && <small>{k.unit}</small>}
            </p>
            {k.trend && <Sparkline values={k.trend} />}
          </div>
          {k.delta && (
            <p className="uipack-cx-delta" data-sentiment={k.delta.sentiment ?? "neutral"}>
              <Arrow direction={k.delta.direction} />
              <b>{k.delta.text}</b>
              {k.delta.period && <span>{k.delta.period}</span>}
            </p>
          )}
          {k.note && <p className="uipack-cx-kpi__note">{k.note}</p>}
        </li>
      ))}
    </ul>
  );
}
