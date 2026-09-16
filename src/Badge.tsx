export interface BadgeProps {
  cx: number;
  cy: number;
  text: string;
  accent?: boolean;
  r?: number;
}

/** A circled step number on a node corner or a connector. */
export function Badge({ cx, cy, text, accent, r = 9 }: BadgeProps) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return (
    <g data-uipack="badge">
      <circle cx={cx} cy={cy} r={r} fill="var(--uipack-bg)" stroke={stroke} strokeOpacity={accent ? 1 : 0.6} strokeWidth={1.25} />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={10} fontFamily="var(--uipack-mono)" fontWeight={700} fill={stroke}>
        {text}
      </text>
    </g>
  );
}
