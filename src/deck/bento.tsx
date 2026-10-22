import { Children, isValidElement, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { useIsoLayoutEffect, usePrefersReducedMotion } from "../env";
import { useDeckSlide } from "./parts";
import { cubicBezier, deckMotion } from "./transitions";

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

type Camera = { s: number; tx: number; ty: number };
type Box = { x: number; y: number; w: number; h: number };

/** The camera a grid's computed transform shows: `none` is the overview. */
function cameraOf(transform: string): Camera {
  if (!transform || transform === "none" || typeof DOMMatrixReadOnly === "undefined") return { s: 1, tx: 0, ty: 0 };
  const m = new DOMMatrixReadOnly(transform);
  return { s: m.a, tx: m.e, ty: m.f };
}

/**
 * A face's opacity through a camera move, as keyframes on the move's clock: shown while its words
 * are wholly inside the bento's box, gone just before they would cross its edge and back just
 * after they are clear of it, so no summary is ever cut off by the edge mid-pan. `holdUntil` keeps
 * it hidden while the same cell's detail is still leaving. Null when it never changes.
 */
export function faceFrames(
  words: Box,
  view: { w: number; h: number },
  from: Camera,
  to: Camera,
  duration: number,
  ease: (t: number) => number,
  holdUntil = 0,
  ramp = 120,
  stepMs = 10,
): Keyframe[] | null {
  const n = Math.round(duration / stepMs);
  const edge = 3; // the bento's padding: its box clips 3px outside the grid
  const inside: boolean[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i * stepMs;
    const p = ease(Math.min(1, t / duration));
    const s = from.s + (to.s - from.s) * p;
    const x = from.tx + (to.tx - from.tx) * p + s * words.x;
    const y = from.ty + (to.ty - from.ty) * p + s * words.y;
    inside.push(
      t >= holdUntil && x >= -edge && y >= -edge && x + s * words.w <= view.w + edge && y + s * words.h <= view.h + edge,
    );
  }
  if (inside.every((v) => v === inside[0])) return null;
  const opacity = inside.map((v, i) => {
    if (!v) return 0;
    let before = Infinity;
    let after = Infinity;
    for (let j = i; j >= 0; j--) if (!inside[j]) ((before = (i - j) * stepMs), (j = -1));
    for (let j = i; j <= n; j++) if (!inside[j]) ((after = (j - i) * stepMs), (j = n + 1));
    return Math.min(1, before / ramp, after / ramp);
  });
  return opacity.map((o, i) => ({ offset: i / n, opacity: Number(o.toFixed(3)) }));
}

/** Where a face's words sit on the grid, unscaled: the union of its children's boxes. */
function wordsBox(cell: HTMLElement): Box {
  const face = cell.querySelector<HTMLElement>(":scope > .uipack-deck-bento__face");
  const kids = face ? Array.from(face.children).filter((k): k is HTMLElement => k instanceof HTMLElement) : [];
  if (!kids.length) return { x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth, h: cell.offsetHeight };
  // A face's children are laid out in the cell (its offsetParent); SVG children have no offsets.
  const boxes = kids.map((k) => ({ x: k.offsetLeft ?? 0, y: k.offsetTop ?? 0, w: k.offsetWidth ?? 0, h: k.offsetHeight ?? 0 }));
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: cell.offsetLeft + x0, y: cell.offsetTop + y0, w: x1 - x0, h: y1 - y0 };
}

const inBox = (b: Box, cam: Camera, view: { w: number; h: number }) => {
  const x = cam.tx + cam.s * b.x;
  const y = cam.ty + cam.s * b.y;
  return x >= -3 && y >= -3 && x + cam.s * b.w <= view.w + 3 && y + cam.s * b.h <= view.h + 3;
};

/** How long the cell being left keeps its detail before it fades (CSS, bento.css), and the fade. */
const DETAIL_HOLD = 420;
const DETAIL_FADE = 200;

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
  const [camera, setCamera] = useState<Camera | null>(null);
  // Where the camera was when this move began (mid-flight, if a press interrupted the last one).
  const fromRef = useRef<Camera>({ s: 1, tx: 0, ty: 0 });
  const facesRef = useRef<Animation[]>([]);
  // Whether the grid has been laid out once: a slide that opens at a tour stop starts there, still.
  const shownRef = useRef(false);
  const prefersReduced = usePrefersReducedMotion();

  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    // (Read only after the first layout: reading it before would start a transition on mount.)
    if (grid && shownRef.current) fromRef.current = cameraOf(getComputedStyle(grid).transform);
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

  // The summary faces around the focus. At rest a face shows (dimmed, beside a focused cell) when
  // its words fit inside the bento's box, and hides when the edge would cut them (`data-clipped`).
  // While the camera moves, each face follows its own words: it stays up through the pan while they
  // are inside the box and leaves just before they reach the edge, so the camera never glides over
  // blank cards, and never carries a cut-off line.
  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    facesRef.current.forEach((a) => a.cancel());
    facesRef.current = [];
    const view = { w: grid.offsetWidth, h: grid.offsetHeight };
    const to = camera ?? { s: 1, tx: 0, ty: 0 };
    const from = fromRef.current;
    fromRef.current = to;
    const first = !shownRef.current;
    shownRef.current = true;
    const moving =
      !first &&
      !thumbnail &&
      !prefersReduced &&
      grid.closest('[data-motion="none"]') === null &&
      typeof grid.animate === "function" &&
      (from.s !== to.s || from.tx !== to.tx || from.ty !== to.ty);
    const ease = cubicBezier(...deckMotion.travelCurve);
    for (const cell of Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-bento-cell]"))) {
      const id = cell.dataset.bentoCell;
      const words = wordsBox(cell);
      cell.toggleAttribute("data-clipped", Boolean(focus && id !== focus && !inBox(words, to, view)));
      // The focused cell's face gives way to its detail on its own timing (bento.css).
      if (!moving || id === focus) continue;
      const left = id === leaving && cell.querySelector(":scope > .uipack-deck-bento__detail");
      const frames = faceFrames(words, view, from, to, deckMotion.pan, ease, left ? DETAIL_HOLD + DETAIL_FADE : 0);
      const face = cell.querySelector<HTMLElement>(":scope > .uipack-deck-bento__face");
      if (frames && face) facesRef.current.push(face.animate(frames, { duration: deckMotion.pan, easing: "linear" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  useIsoLayoutEffect(() => () => facesRef.current.forEach((a) => a.cancel()), []);

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
          transition: `transform ${deckMotion.pan}ms ${deckMotion.travel}`,
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
