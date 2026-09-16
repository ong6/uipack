import { useFigureHover, isPointer } from "./hover";
import { Token, type TokenKind, type TokenShape } from "./tokens";

export interface LegendItem {
  label: string;
  kind?: TokenKind;
  shape?: TokenShape;
}

export interface LegendProps {
  items: LegendItem[];
}

/** Shape-coded key rendered in the Figure header. Hovering an item highlights every element of that kind. */
export function Legend({ items }: LegendProps) {
  const hover = useFigureHover();
  if (!items.length) return null;
  return (
    <ul className="uipack__legend" aria-label="Legend">
      {items.map((it) => {
        const kind = it.kind ?? "neutral";
        const hoverable = kind !== "neutral";
        return (
          <li
            key={it.label}
            data-kind={kind}
            data-state={hover.kind ? (hover.kind === kind ? "hit" : "dim") : undefined}
            onPointerEnter={hoverable ? (e) => isPointer(e) && hover.setKind(kind) : undefined}
            onPointerLeave={hoverable ? (e) => isPointer(e) && hover.setKind(null) : undefined}>
            <svg viewBox="-8 -8 16 16" aria-hidden="true">
              <Token kind={kind} shape={it.shape} r={5.5} />
            </svg>
            <span>{it.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
