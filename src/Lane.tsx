export interface LaneProps {
  /** Left edge and width of the column the header sits over. */
  x: number;
  w: number;
  y: number;
  title: string;
  /** Draw a faint vertical rule down to `h`. */
  h?: number;
  size?: number;
}

/** Mono uppercase column header, the way the OpenAI figures label CLIENTS / PLATFORM / STORAGE. */
export function Lane({ x, w, y, title, h, size = 11 }: LaneProps) {
  return (
    <g data-uipack="lane">
      <text x={x + w / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fontFamily="var(--uipack-mono)" letterSpacing=".08em" fill="currentColor">
        {title.toUpperCase()}
      </text>
      {h ? <line x1={x + w} y1={y + 12} x2={x + w} y2={y + h} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="2 6" /> : null}
    </g>
  );
}
