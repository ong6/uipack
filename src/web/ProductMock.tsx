import { isValidElement, type CSSProperties, type ReactNode } from "react";

/* The product-mock kit: show the product's real output on a marketing page (a rota, a forecast
   table, an inbox) from rows of data, not a screenshot and not an empty demo panel. One layout in
   every style; cells, rules, frames and the highlight are painted through roles (--ui-cell-*,
   --ui-window-*, the frame roles), so a style swap restyles the output and never moves it. */

export interface ProductWindowProps {
  /** The view's name, as the product would title it: "Rota · week of 9 Nov". */
  title?: ReactNode;
  /** One quiet line under the title: "Drafted from 12 weeks of sales". */
  subtitle?: ReactNode;
  /** A short state on the title's end edge: "Ready to publish". */
  status?: ReactNode;
  /**
   * Where the numbers come from, as a mono tag on the title row: "Sample rates", "Sample data",
   * "Live, 09:40". Use it rather than a `footer` that only says where the data is from.
   */
  source?: ReactNode;
  /** Shown in the window bar, e.g. "app.example.com/rota". Leave it out for a bare panel. */
  address?: string;
  /**
   * A fact about the output under it, start edge: "Fri 19:00 · 84 covers forecast". With a
   * `footerEnd` it is a ruled foot row; alone it is a caption under the output (no empty band).
   */
  footer?: ReactNode;
  /** The footer's end edge: "5 of 14 staff shown". */
  footerEnd?: ReactNode;
  /** Accessible name of the whole mock. */
  label: string;
  children: ReactNode;
  className?: string;
}

/** A framed product view: window bar, a title row with a status, the output, and a footer fact. */
export function ProductWindow({
  title,
  subtitle,
  status,
  source,
  address,
  footer,
  footerEnd,
  label,
  children,
  className = "",
}: ProductWindowProps) {
  return (
    <div className={`uipack-web-window ${className}`.trim()} role="group" aria-label={label}>
      {address && (
        <div className="uipack-web-window__bar" aria-hidden="true">
          <span className="uipack-web-window__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="uipack-web-window__address">{address}</span>
        </div>
      )}
      {(title || status || source) && (
        <div className="uipack-web-window__head">
          <div>
            {title && <p className="uipack-web-window__title">{title}</p>}
            {subtitle && <p className="uipack-web-window__subtitle">{subtitle}</p>}
          </div>
          {(status || source) && (
            <div className="uipack-web-window__tags">
              {status && <span className="uipack-web-window__status">{status}</span>}
              {source && <span className="uipack-web-window__source">{source}</span>}
            </div>
          )}
        </div>
      )}
      <div className="uipack-web-window__body">{children}</div>
      {footerEnd ? (
        <div className="uipack-web-window__foot">
          <span>{footer}</span>
          <span>{footerEnd}</span>
        </div>
      ) : (
        footer && <p className="uipack-web-window__caption">{footer}</p>
      )}
    </div>
  );
}

export interface DataColumn {
  /** The row field this column reads. */
  key: string;
  label: ReactNode;
  /** Numbers align to the end edge. Default "start". */
  align?: "start" | "end";
  /** Draw the (numeric) value as a bar out of this maximum, with the number beside it. */
  barMax?: number;
  /**
   * "low": a supporting column the table drops when it is narrower than 440px (a phone, a narrow
   * card), so the key columns are never cut or scrolled away. Default "high". The first column
   * (the row's name) is always kept.
   */
  priority?: "high" | "low";
}

export interface DataTableProps {
  columns: DataColumn[];
  /** Real rows from the product: one record per row, keyed by column. */
  rows: Record<string, ReactNode>[];
  /** Row index (or indexes) to mark: the row the page talks about. */
  highlight?: number | number[];
  /** Names the table for assistive tech and the scroll region. */
  label: string;
  /** One line under the table: how a highlighted row was worked out, or where the data is from. */
  note?: ReactNode;
  /**
   * Below 440px of table width: "fit" keeps the row layout (minus `priority: "low"` columns),
   * "stack" turns each row into a small record (name, then label and value per column), "scroll"
   * keeps every column and scrolls inside itself. Default "auto": "stack" when more than four
   * columns remain after the low-priority ones are dropped, otherwise "fit".
   */
  narrow?: "auto" | "fit" | "stack" | "scroll";
  className?: string;
}

/** A compact data table: mono headers, rules across every cell, optional inline bars, one marked row. */
export function DataTable({ columns, rows, highlight, label, note, narrow = "auto", className = "" }: DataTableProps) {
  const marked = new Set(highlight === undefined ? [] : Array.isArray(highlight) ? highlight : [highlight]);
  const kept = columns.filter((c, j) => j === 0 || c.priority !== "low").length;
  const mode = narrow === "auto" ? (kept > 4 ? "stack" : "fit") : narrow;
  return (
    <div className={`uipack-web-table ${className}`.trim()} data-narrow={mode}>
      <div className="uipack-web-table__scroll" role="region" aria-label={label} tabIndex={0}>
        <table>
          <caption className="uipack-web-demo__sr">{label}</caption>
          <thead>
            <tr>
              {columns.map((c, j) => (
                <th
                  key={c.key}
                  scope="col"
                  data-align={c.align ?? (c.barMax !== undefined ? "start" : undefined)}
                  data-priority={c.priority === "low" && j > 0 ? "low" : undefined}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} data-highlight={marked.has(i) || undefined}>
                {columns.map((c, j) => {
                  const v = row[c.key];
                  const Cell = j === 0 ? "th" : "td";
                  const bar =
                    c.barMax !== undefined && typeof v === "number" ? Math.max(0, Math.min(1, v / c.barMax)) : undefined;
                  return (
                    <Cell
                      key={c.key}
                      scope={j === 0 ? "row" : undefined}
                      data-align={c.align}
                      data-priority={c.priority === "low" && j > 0 ? "low" : undefined}
                    >
                      {mode === "stack" && j > 0 && (
                        <span className="uipack-web-table__label" aria-hidden="true">
                          {c.label}
                        </span>
                      )}
                      {bar === undefined ? (
                        v
                      ) : (
                        <span className="uipack-web-table__bar" style={{ "--v": bar } as CSSProperties}>
                          <i aria-hidden="true" />
                          <span>{v}</span>
                        </span>
                      )}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="uipack-web-table__note">{note}</p>}
    </div>
  );
}

export type ScheduleTone = "shift" | "peak" | "off";

export interface ScheduleCell {
  value: ReactNode;
  /** "peak" marks the cells the page talks about (name it in `legend`); "off" is a day off. */
  tone?: ScheduleTone;
}

export interface ScheduleRow {
  name: ReactNode;
  /** A role or a small fact under the name: "Server", "32 h". */
  detail?: ReactNode;
  /** One per column. Empty (null, undefined or "") is a day off. */
  cells: (ReactNode | ScheduleCell)[];
}

export interface ScheduleGridProps {
  /** Column heads: days, hours, rooms. */
  columns: ReactNode[];
  rows: ScheduleRow[];
  /** Names the grid for assistive tech and the scroll region. */
  label: string;
  /** Head of the name column. Default "Staff". */
  corner?: ReactNode;
  /** What an empty cell says. Default "Off". */
  offLabel?: ReactNode;
  /** A key for marked cells: [{ tone: "peak", label: "Busiest service" }]. Every marked tone needs one. */
  legend?: { tone: ScheduleTone; label: ReactNode }[];
  className?: string;
}

const isCell = (c: unknown): c is ScheduleCell =>
  typeof c === "object" && c !== null && !isValidElement(c) && !Array.isArray(c) && "value" in c;

/**
 * A schedule (people by days, rooms by hours): a filled grid from real rows, with day-off cells,
 * marked cells and a legend. Below 720px it keeps every column and scrolls inside itself, the
 * name column pinned, so the marked cell is never cropped away.
 */
export function ScheduleGrid({
  columns,
  rows,
  label,
  corner = "Staff",
  offLabel = "Off",
  legend,
  className = "",
}: ScheduleGridProps) {
  return (
    <div className={`uipack-web-schedule ${className}`.trim()}>
      <div className="uipack-web-table__scroll" role="region" aria-label={label} tabIndex={0}>
        <table>
          <caption className="uipack-web-demo__sr">{label}</caption>
          <thead>
            <tr>
              <th scope="col">{corner}</th>
              {columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">
                  <span>{r.name}</span>
                  {r.detail && <small>{r.detail}</small>}
                </th>
                {columns.map((_, j) => {
                  const raw = r.cells[j];
                  const cell: ScheduleCell = isCell(raw) ? raw : { value: raw };
                  const empty = cell.value === null || cell.value === undefined || cell.value === "";
                  const tone = cell.tone ?? (empty ? "off" : "shift");
                  return (
                    <td key={j} data-tone={tone}>
                      <span>{empty ? offLabel : cell.value}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legend && legend.length > 0 && (
        <ul className="uipack-web-schedule__legend">
          {legend.map((l, i) => (
            <li key={i}>
              <i data-tone={l.tone} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface ItemListRow {
  title: ReactNode;
  detail?: ReactNode;
  /** Mono value on the end edge: "22", "5 pm", "£79". */
  meta?: ReactNode;
  /** A state shown as a mark (with text for assistive tech): done, waiting or needs attention. */
  status?: "done" | "pending" | "attention";
}

export interface ItemListProps {
  items: ItemListRow[];
  label: string;
  className?: string;
}

const STATUS_TEXT = { done: "Done", pending: "Waiting", attention: "Needs you" } as const;

/** A list of real records (messages, tasks, swaps): title, detail, a mono value and a state. */
export function ItemList({ items, label, className = "" }: ItemListProps) {
  return (
    <ul className={`uipack-web-list ${className}`.trim()} aria-label={label}>
      {items.map((it, i) => (
        <li key={i} data-status={it.status}>
          {it.status && <span className="uipack-web-list__mark" role="img" aria-label={STATUS_TEXT[it.status]} />}
          <span className="uipack-web-list__text">
            <strong>{it.title}</strong>
            {it.detail && <span>{it.detail}</span>}
          </span>
          {it.meta !== undefined && <span className="uipack-web-list__meta">{it.meta}</span>}
        </li>
      ))}
    </ul>
  );
}

export interface RecordCardProps {
  title: ReactNode;
  /** A mono label above the title: "Staff", "Order #2041". */
  eyebrow?: ReactNode;
  /** A short state on the end edge. */
  status?: ReactNode;
  fields: { label: ReactNode; value: ReactNode }[];
  className?: string;
}

/** One record as a card: a title, a state and its fields as label/value pairs. */
export function RecordCard({ title, eyebrow, status, fields, className = "" }: RecordCardProps) {
  return (
    <div className={`uipack-web-record ${className}`.trim()}>
      <div className="uipack-web-record__head">
        <div>
          {eyebrow && <p className="uipack-web-record__eyebrow">{eyebrow}</p>}
          <p className="uipack-web-record__title">{title}</p>
        </div>
        {status && <span className="uipack-web-window__status">{status}</span>}
      </div>
      <dl>
        {fields.map((f, i) => (
          <div key={i}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface FileTableProps extends Omit<DataTableProps, "label"> {
  /** The file as the user would see it: "barclays-oct.csv". */
  fileName: string;
  /** A fact about the file: "42 lines · 3 accounts". */
  summary?: ReactNode;
  /** A short state: "Imported", "3 to check". */
  status?: ReactNode;
  footer?: ReactNode;
}

/** A file's rows as the product reads them (a CSV, an export): the file name, a state and the table. */
export function FileTable({ fileName, summary, status, footer, className = "", ...table }: FileTableProps) {
  return (
    <ProductWindow
      className={`uipack-web-file ${className}`.trim()}
      label={fileName}
      title={<span className="uipack-web-file__name">{fileName}</span>}
      subtitle={summary}
      status={status}
      footer={footer}
    >
      <DataTable label={fileName} {...table} />
    </ProductWindow>
  );
}
