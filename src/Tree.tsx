import type { ReactNode } from "react";
import { useFontFloor } from "./scale";

// File-tree parts: a rail that branches to each row, folder and file marks,
// and a dog-eared Sheet that holds a file's contents. Drawn from the theme's
// variables, so they follow light and dark.

export interface TreeRailProps {
  /** The trunk's x. */
  x: number;
  /** Where the trunk starts (under the parent's mark). */
  y: number;
  /** One y per child row; the trunk runs to the last. */
  rows: number[];
  /** Where each branch ends: one x for every row, or one per row. */
  to: number | number[];
}

/** A trunk with a square elbow to every child row and a junction dot at each join, as on a Bus. */
export function TreeRail({ x, y, rows, to }: TreeRailProps) {
  if (!rows.length) return null;
  const end = Math.max(...rows);
  const d = [`M${x},${y} V${end}`, ...rows.map((r, i) => `M${x},${r} H${Array.isArray(to) ? to[i] : to}`)].join(" ");
  return (
    <g data-uipack="tree-rail">
      <path d={d} fill="none" stroke="currentColor" strokeOpacity={0.8} strokeWidth={1.25} />
      {rows.map((r) => (
        <circle key={r} data-uipack="junction" cx={x} cy={r} r={2.5} fill="currentColor" fillOpacity={0.7} />
      ))}
    </g>
  );
}

export interface TreeMarkProps {
  /** Left edge of the mark. */
  x: number;
  /** Vertical centre of the row. */
  y: number;
  /** Width; the height follows. Default 22 for a folder, 16 for a file. */
  size?: number;
  /** Fill with the accent wash instead of the surface. */
  tint?: boolean;
}

const wash = { fill: "var(--uipack-accent)", fillOpacity: 0.16 } as const;
const paper = { fill: "var(--uipack-surface)" } as const;

/** A folder outline with a tab. */
export function FolderMark({ x, y, size = 22, tint = true }: TreeMarkProps) {
  const w = size;
  const h = Math.round(size * 0.72);
  const t = y - h / 2;
  const tab = w * 0.38;
  const d = `M${x + 2},${t} H${x + tab} L${x + tab + 3},${t + 3} H${x + w - 2} Q${x + w},${t + 3} ${x + w},${t + 5} V${t + h - 2} Q${x + w},${t + h} ${x + w - 2},${t + h} H${x + 2} Q${x},${t + h} ${x},${t + h - 2} V${t + 2} Q${x},${t} ${x + 2},${t} Z`;
  return (
    <path
      data-uipack="folder-mark"
      d={d}
      {...(tint ? wash : paper)}
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinejoin="round"
    />
  );
}

/** A page with a folded corner. */
export function FileMark({ x, y, size = 16, tint = false }: TreeMarkProps) {
  const w = size;
  const h = Math.round(size * 1.25);
  const t = y - h / 2;
  const f = w * 0.34;
  const d = `M${x},${t} H${x + w - f} L${x + w},${t + f} V${t + h} H${x} Z M${x + w - f},${t} V${t + f} H${x + w}`;
  return (
    <path
      data-uipack="file-mark"
      d={d}
      {...(tint ? wash : paper)}
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinejoin="round"
    />
  );
}

export interface SheetProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The file's name: a path, an ID, a hash. Drawn as the sheet's tracked mono eyebrow. */
  name?: string;
  /** Sans title under the name. */
  title?: string;
  /** Muted note after the title. */
  note?: string;
  /** Where the title row starts, from the sheet's left edge. Default 20. */
  titleX?: number;
  /** Header height (eyebrow and title row); the rule under it is drawn when the sheet has children. Default 76 with a name, 52 without. */
  head?: number;
  /** Accent outline and eyebrow: the sheet the figure is about. */
  accent?: boolean;
  /** Drawn inside, under the header (rows, chips). */
  children?: ReactNode;
  size?: number;
}

/**
 * A file as a card in the Technical box language: 6px corners like a Node,
 * the file's name as a tracked mono eyebrow (as a dashed Group or a Figure
 * labels itself), a title and note under it, and its contents below a rule.
 */
export function Sheet({
  x,
  y,
  w,
  h,
  name,
  title,
  note,
  titleX = 20,
  head: head0,
  accent,
  children,
  size: size0 = 16,
}: SheetProps) {
  const size = useFontFloor(size0);
  const eyebrow = useFontFloor(12);
  const noteSize = useFontFloor(size0 - 2);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const head = head0 ?? (name ? 76 : 52);
  const pad = 20;
  const top = name ? 30 : 0;
  const rowY = (children ? y + top + (head - top) / 2 : y + top + (h - top) / 2) - (name ? 2 : 0);
  return (
    <g data-uipack="sheet">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="var(--uipack-surface)"
        stroke={stroke}
        strokeOpacity={accent ? 1 : 0.8}
        strokeWidth={1.25}
      />
      {name ? (
        <text
          x={x + pad}
          y={y + 24}
          fontSize={eyebrow}
          fontFamily="var(--uipack-mono)"
          letterSpacing=".08em"
          fontWeight={600}
          fill={stroke}
          fillOpacity={accent ? 1 : 0.75}
        >
          {name.toUpperCase()}
        </text>
      ) : null}
      {title || note ? (
        <text x={x + titleX} y={rowY + size * 0.36} fontSize={size} fontWeight={600} fill="currentColor">
          {title}
          {note ? (
            <tspan dx={title ? 12 : 0} fontSize={noteSize} fontWeight={400} fillOpacity={0.72}>
              {note}
            </tspan>
          ) : null}
        </text>
      ) : null}
      {children ? (
        <>
          <line
            x1={x + pad}
            x2={x + w - pad}
            y1={y + head}
            y2={y + head}
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={1.25}
            strokeDasharray="2 4"
          />
          {children}
        </>
      ) : null}
    </g>
  );
}
