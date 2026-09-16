import { Token, type TokenKind, type TokenShape } from "./tokens";

export interface LegendItem {
  label: string;
  kind?: TokenKind;
  shape?: TokenShape;
}

export interface LegendProps {
  items: LegendItem[];
}

/** Shape-coded key rendered in the Figure header. */
export function Legend({ items }: LegendProps) {
  if (!items.length) return null;
  return (
    <ul className="uipack__legend" aria-label="Legend">
      {items.map((it) => (
        <li key={it.label}>
          <svg viewBox="-8 -8 16 16" aria-hidden="true">
            <Token kind={it.kind ?? "neutral"} shape={it.shape} r={5.5} />
          </svg>
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
