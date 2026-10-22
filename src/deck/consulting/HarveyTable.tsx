import type { ReactNode } from "react";
import { harveyQuarters, harveyWedge } from "./scale";

const LEVEL_WORDS = ["None", "Low", "Medium", "High", "Full"] as const;

/** A Harvey ball: 0 (empty) to 4 (full) quarters. Its level is also in the accessible name. */
export function HarveyBall({ level, size = 36, label }: { level: number; size?: number; label?: string }) {
  const q = harveyQuarters(level);
  const r = size / 2 - 1.5;
  const c = size / 2;
  return (
    <svg
      className="uipack-cx-harvey"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${LEVEL_WORDS[q]} (${q} of 4)`}
      data-level={q}
    >
      <circle className="uipack-cx-harvey__ring" cx={c} cy={c} r={r} />
      {q > 0 && <path className="uipack-cx-harvey__fill" d={harveyWedge(q, c, c, r)} />}
    </svg>
  );
}

export interface HarveyColumn {
  key: string;
  label: ReactNode;
  /** `harvey` cells take 0–4; `text` cells take any node. Default `harvey`. */
  kind?: "harvey" | "text";
  /** CSS width, e.g. "14%". */
  width?: string;
}

export interface HarveyRow {
  label: ReactNode;
  /** A short line under the row label. */
  detail?: ReactNode;
  cells: Record<string, number | ReactNode>;
  /** The recommended row: marked with a tag and an accent bar, not colour alone. */
  highlight?: boolean;
  /** Tag text on a highlighted row. Default "Recommended". */
  tag?: ReactNode;
}

export interface HarveyTableProps {
  columns: readonly HarveyColumn[];
  rows: readonly HarveyRow[];
  /** Header of the row-label column. */
  corner?: ReactNode;
  /** Show the 0–4 key under the table. Default true. */
  showKey?: boolean;
  /** What a full ball means: "Full ball = best". */
  keyNote?: ReactNode;
}

/** Options × criteria: Harvey balls (0–4) and text cells, with one row marked as the recommendation. */
export function HarveyTable({ columns, rows, corner = "Option", showKey = true, keyNote = "Full ball = most favourable" }: HarveyTableProps) {
  return (
    <div className="uipack-cx-harvey-table">
      <table>
        <colgroup>
          <col />
          {columns.map((c) => (
            <col key={c.key} style={c.width ? { width: c.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{corner}</th>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-kind={c.kind ?? "harvey"}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} data-highlight={r.highlight ? "" : undefined}>
              <th scope="row">
                <span className="uipack-cx-harvey-table__name">
                  {r.label}
                  {r.highlight && <em>{r.tag ?? "Recommended"}</em>}
                </span>
                {r.detail && <span className="uipack-cx-harvey-table__detail">{r.detail}</span>}
              </th>
              {columns.map((c) => {
                const v = r.cells[c.key];
                return (
                  <td key={c.key} data-kind={c.kind ?? "harvey"}>
                    {(c.kind ?? "harvey") === "harvey" && typeof v === "number" ? <HarveyBall level={v} /> : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showKey && (
        <p className="uipack-cx-harvey-key">
          {LEVEL_WORDS.map((w, q) => (
            <span key={w}>
              <HarveyBall level={q} size={24} label="" />
              {w}
            </span>
          ))}
          {keyNote && <span className="uipack-cx-harvey-key__note">{keyNote}</span>}
        </p>
      )}
    </div>
  );
}
