import { Children, isValidElement, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { useIsoLayoutEffect } from "../env";
import { useDeckSlide } from "./parts";

export interface BentoCellProps {
  /** Stable ID: the tour refers to it, and a `{ zoom: id }` transition can fly into it. */
  id: string;
  /** Columns and rows on the bento's grid. */
  col?: number;
  row?: number;
  tone?: "surface" | "accent" | "ink";
  /** Shown at overview scale. Keep it to a number, a label and one line. */
  children?: ReactNode;
  /**
   * Shown in place of `children` while the camera is on this cell. Write it small: the camera
   * scales the cell up, so dense detail becomes readable without leaving the slide.
   */
  detail?: ReactNode;
  className?: string;
}

/** One container in a `Bento`. Its layout box never changes, so the camera can measure it. */
export function BentoCell(_: BentoCellProps): ReactElement | null {
  return null; // Rendered by Bento, which owns focus.
}

export interface BentoProps {
  /** Grid columns and rows. Cells place themselves in order with `col` × `row` spans. */
  columns?: number;
  rows?: number;
  /**
   * Cell IDs to visit, one per press of Next. After the last stop the camera pulls back to the
   * whole grid, so going back into the slide lands on the overview.
   */
  tour?: string[];
  /** The largest the camera may scale a cell. */
  maxScale?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Where the camera rests for a focused cell: centred in the bento's own box (so the slide's
 * heading and footer stay put) and as large as fits with a small margin.
 */
export function bentoCamera(
  cell: { x: number; y: number; w: number; h: number },
  view: { w: number; h: number },
  maxScale = 3,
  fill = 0.94,
) {
  const s = Math.max(1, Math.min((view.w * fill) / cell.w, (view.h * fill) / cell.h, maxScale));
  return {
    s,
    tx: view.w / 2 - s * (cell.x + cell.w / 2),
    ty: view.h / 2 - s * (cell.y + cell.h / 2),
  };
}

/** The tour stop for a build step: 0 is the overview, 1…n focus cells, n + 1 pulls back. */
export const bentoFocusAt = (step: number, tour: readonly string[]) => (step >= 1 && step <= tour.length ? tour[step - 1] : null);

/**
 * Apple-style bento: a grid of containers, and a camera that moves between them on Next. Each
 * focused cell swaps its summary for denser detail that is readable at the camera's scale.
 * Steps count as builds, so the deck's Next and Back drive the tour.
 */
export function Bento({ columns = 6, rows = 4, tour = [], maxScale = 3, className, style, children }: BentoProps) {
  const { step, thumbnail } = useDeckSlide();
  // Thumbnails are fully built (step Infinity), so they show the overview; a still copy at a tour
  // stop (a printed or read detail page) shows that stop, without the camera's transition.
  const focus = bentoFocusAt(step, tour);
  // The cell the camera is leaving, so its detail can stay up while it is still mostly in view
  // (stored state, updated during render: the attribute must be there on the same commit as the move).
  const [trail, setTrail] = useState<{ focus: string | null; leaving: string | null }>({ focus, leaving: null });
  if (trail.focus !== focus) setTrail({ focus, leaving: trail.focus });
  const leaving = trail.focus === focus ? trail.leaving : trail.focus;
  const gridRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<{ s: number; tx: number; ty: number } | null>(null);

  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || !focus) return setCamera(null);
    const cell = grid.querySelector<HTMLElement>(`[data-bento-cell="${CSS.escape(focus)}"]`);
    if (!cell) return setCamera(null);
    setCamera(
      bentoCamera(
        { x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth, h: cell.offsetHeight },
        { w: grid.offsetWidth, h: grid.offsetHeight },
        maxScale,
      ),
    );
  }, [focus, maxScale]);

  const cells = Children.toArray(children).filter(
    (c): c is ReactElement<BentoCellProps> => isValidElement(c) && c.type === BentoCell,
  );
  // Tour stops whose cell has a detail: the read and print views add a page for each, so a
  // forwarded deck keeps what the camera showed.
  const detailStops = tour.map((id, i) => (cells.some((c) => c.props.id === id && c.props.detail) ? i + 1 : 0)).filter(Boolean);

  return (
    <div
      className={["uipack-deck-bento", className].filter(Boolean).join(" ")}
      data-steps={tour.length ? tour.length + 1 : undefined}
      data-tour={tour.length ? tour.join(" ") : undefined}
      data-detail-stops={detailStops.length ? detailStops.join(" ") : undefined}
      data-still={thumbnail ? "" : undefined}
      data-focus={focus ?? undefined}
      data-move={focus && leaving ? "cell" : focus ? "in" : leaving ? "out" : undefined}
      style={style}
    >
      <div
        ref={gridRef}
        className="uipack-deck-bento__grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          transform: camera ? `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` : undefined,
        }}
      >
        {cells.map(({ props: p }) => {
          const focused = focus === p.id;
          return (
            <div
              key={p.id}
              className={["uipack-deck-bento__cell", p.className].filter(Boolean).join(" ")}
              data-bento-cell={p.id}
              data-morph={p.id}
              data-tone={p.tone && p.tone !== "surface" ? p.tone : undefined}
              data-focused={focused ? "" : undefined}
              data-dimmed={focus && !focused ? "" : undefined}
              data-leaving={leaving === p.id && !focused ? "" : undefined}
              style={{ gridColumn: `span ${p.col ?? 2}`, gridRow: `span ${p.row ?? 1}` }}
            >
              <div className="uipack-deck-bento__face" aria-hidden={focused && p.detail ? true : undefined}>
                {p.children}
              </div>
              {p.detail && (
                <div className="uipack-deck-bento__detail" aria-hidden={focused ? undefined : true}>
                  {p.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
