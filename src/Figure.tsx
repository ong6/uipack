import { CanvasView } from "./CanvasView";
import { SelectionContext, type SelectedItem } from "./selection";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  createElement,
} from "react";
import {
  FigureMotionContext,
  usePrefersReducedMotion,
  type FigureMotion,
} from "./context";
import { Legend, type LegendItem } from "./Legend";
import { FigureHoverContext, type FigureHover } from "./hover";
import { FigureScaleContext, DEFAULT_RENDER_WIDTH, fontFloor } from "./scale";

export interface FigureProps {
  /** Allow opening a zoomable canvas. */
  expandable?: boolean;
  /** "Figure 01" or "Fig. 3". Rendered mono, uppercase, before the eyebrow title. */
  number?: string;
  /** Short mono topic after the number: "What is Habitat?". */
  eyebrow?: string;
  title?: string;
  /** Heading element for the title, so the figure fits the page outline. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
  caption?: string;
  legend?: LegendItem[];
  /** Show Pause and Replay. Hidden automatically under reduced motion. */
  controls?: boolean;
  /** SVG viewBox for the wide drawing. */
  viewBox: string;
  /** Wide drawing. */
  children: ReactNode;
  /** Optional narrow drawing shown below 720px. */
  narrow?: ReactNode;
  narrowViewBox?: string;
  /** Accessible description of what the figure shows. */
  alt: string;
  className?: string;
  theme?: "light" | "dark";
  /** Canvas background: the dotted grid (default), plain, or ruled lines. */
  background?: "dots" | "plain" | "ruled";
  /**
   * Smallest rendered text size in CSS px. Every text part (Node, Lane, Label,
   * Chip, Badge, Group) clamps its font to this once the drawing's scale is
   * known. Default 11. 0 turns the floor off.
   */
  minFont?: number;
  /**
   * Width in CSS px the figure renders at, when known (static export, tests).
   * Otherwise it is measured after mount; before that, 1088 is assumed.
   */
  measuredWidth?: number;
  id?: string;
}

const vbWidth = (viewBox: string) => Number(viewBox.split(/\s+/)[2]) || 0;

// SSR-safe layout effect: the note is measured before paint in the browser.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const NOTE_GAP = 8;

/**
 * Place the selection note against its item, inside the canvas's scrolled
 * content: centred above the item (below when the canvas has no room above),
 * clamped to the visible part of the canvas.
 */
function placeNote(canvas: HTMLElement, note: HTMLElement, anchor: Element) {
  const box = anchor.querySelector(":scope > rect") ?? anchor;
  const c = canvas.getBoundingClientRect();
  const a = box.getBoundingClientRect();
  const w = note.offsetWidth;
  const h = note.offsetHeight;
  const x = a.left - c.left - canvas.clientLeft + canvas.scrollLeft;
  const y = a.top - c.top - canvas.clientTop + canvas.scrollTop;
  const minLeft = canvas.scrollLeft + NOTE_GAP;
  const maxLeft = canvas.scrollLeft + canvas.clientWidth - w - NOTE_GAP;
  const left = Math.max(minLeft, Math.min(x + a.width / 2 - w / 2, maxLeft));
  const above = y - NOTE_GAP - h;
  const top = above >= canvas.scrollTop + NOTE_GAP ? above : y + a.height + NOTE_GAP;
  return { left, top };
}

/** Rendered width of each drawing, measured by ResizeObserver; 0 while hidden. */
function useRenderedWidth(
  ref: React.RefObject<SVGSVGElement>,
  fixed?: number,
  layoutKey?: boolean,
): number {
  const [w, setW] = useState(fixed ?? DEFAULT_RENDER_WIDTH);
  useEffect(() => {
    if (fixed != null) return;
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setW(width);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fixed, layoutKey]);
  return fixed ?? w;
}

const PauseGlyph = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <rect x="2" y="1.5" width="3" height="9" rx="0.5" />
    <rect x="7" y="1.5" width="3" height="9" rx="0.5" />
  </svg>
);
const PlayGlyph = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 1.5 L10.5 6 L3 10.5 Z" />
  </svg>
);
const ReplayGlyph = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M6 1.5a4.5 4.5 0 1 1-4.2 2.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M1.5 1.5v3h3z" />
  </svg>
);

export function Figure({
  expandable = true,
  number,
  eyebrow,
  title,
  headingLevel = 3,
  caption,
  legend = [],
  controls = true,
  viewBox,
  children,
  narrow,
  narrowViewBox,
  alt,
  className,
  theme,
  background = "dots",
  minFont = 11,
  measuredWidth,
  id,
}: FigureProps) {
  const opener = useRef<HTMLButtonElement>(null);
  const auto = useId();
  const figId = id ?? `uipack-${auto.replace(/:/g, "")}`;
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selected, select] = useState<SelectedItem | null>(null);
  const [hoverFlow, setHoverFlow] = useState<string | null>(null);
  const [hoverKind, setHoverKind] = useState<string | null>(null);
  const hover = useMemo<FigureHover>(
    () => ({
      flow: selected?.flow ?? hoverFlow,
      kind: hoverKind,
      setFlow: setHoverFlow,
      setKind: setHoverKind,
    }),
    [hoverFlow, hoverKind, selected],
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const [notePos, setNotePos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const wideRef = useRef<SVGSVGElement>(null);
  const narrowRef = useRef<SVGSVGElement>(null);
  const wideW = useRenderedWidth(wideRef, measuredWidth, expanded);
  const narrowW = useRenderedWidth(narrowRef, measuredWidth, expanded);
  const wideScale = useMemo(
    () => ({ floor: fontFloor(vbWidth(viewBox), wideW, minFont) }),
    [viewBox, wideW, minFont],
  );
  const narrowScale = useMemo(
    () => ({
      floor: fontFloor(vbWidth(narrowViewBox ?? viewBox), narrowW, minFont),
    }),
    [narrowViewBox, viewBox, narrowW, minFont],
  );

  const svgs = () =>
    [wideRef.current, narrowRef.current].filter(Boolean) as SVGSVGElement[];

  useEffect(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);

  const motion = useMemo<FigureMotion>(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay],
  );

  const note = selected?.detail ? selected : null;
  useIsoLayoutEffect(() => {
    setNotePos(null);
    const canvas = canvasRef.current;
    const el = noteRef.current;
    const anchor = note?.anchor;
    if (!canvas || !el || !anchor) return;
    const place = () => {
      if (anchor.isConnected) setNotePos(placeNote(canvas, el, anchor));
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [note, zoom, expanded]);

  const showControls = controls && !reduced;
  const hasHead =
    expandable ||
    number ||
    eyebrow ||
    title ||
    caption ||
    legend.length ||
    showControls;

  return (
    <CanvasView
      restoreFocus={() => opener.current?.focus()}
      open={expanded}
      onClose={() => {
        setExpanded(false);
        setZoom(1);
        select(null);
      }}
      title={title ?? eyebrow ?? "Figure canvas"}
      theme={theme}
      layout="figure"
      zoom={{ value: zoom, min: 1, max: 3, onChange: setZoom }}
    >
      <SelectionContext.Provider value={{ enabled: true, selected, select }}>
        <FigureMotionContext.Provider value={motion}>
          <FigureHoverContext.Provider value={hover}>
            <figure
              id={figId}
              className={[
                "uipack",
                narrow ? "uipack--has-narrow" : "",
                expanded ? "uipack--expanded" : "",
                className ?? "",
              ]
                .join(" ")
                .trim()}
              data-theme={theme}
              data-hover-flow={hoverFlow ?? undefined}
              data-hover-kind={hoverKind ?? undefined}
              onKeyDown={(e) => {
                if (e.key === "Escape") select(null);
              }}
              style={
                {
                  // Opened, the canvas content is a flex column: auto centres it.
                  margin: expanded ? "auto 0" : 0,
                  "--figure-width": `${vbWidth(viewBox)}px`,
                } as React.CSSProperties
              }
            >
              {hasHead ? (
                <div className="uipack__head">
                  {number || eyebrow ? (
                    <p className="uipack__eyebrow">
                      {number}
                      {number && eyebrow ? " · " : ""}
                      {eyebrow}
                    </p>
                  ) : null}
                  {title
                    ? createElement(
                        `h${headingLevel}`,
                        { className: "uipack__title" },
                        title,
                      )
                    : null}
                  {caption ? (
                    <p className="uipack__caption">{caption}</p>
                  ) : null}
                  {showControls || expandable ? (
                    <div className="uipack__controls">
                      {expandable && !expanded && (
                        <button
                          type="button"
                          className="uipack__ctl"
                          ref={opener}
                          onClick={() => {
                            select(null);
                            setExpanded(true);
                          }}
                        >
                          Open canvas
                        </button>
                      )}
                      {showControls && (
                        <>
                          <button
                            type="button"
                            className="uipack__ctl uipack__ctl--motion"
                            onClick={replay}
                          >
                            <ReplayGlyph /> Replay
                          </button>
                          <button
                            type="button"
                            className="uipack__ctl uipack__ctl--motion"
                            onClick={toggle}
                            aria-pressed={!playing}
                          >
                            {playing ? <PauseGlyph /> : <PlayGlyph />}{" "}
                            {playing ? "Pause" : "Play"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                  <Legend items={legend} />
                </div>
              ) : null}
              <p className="uipack__sr" role="status">
                {note ? `${note.label}: ${note.detail}` : ""}
              </p>
              <div
                ref={canvasRef}
                className={`uipack__canvas uipack__canvas--${background}`}
                onClick={() => select(null)}
              >
                {note ? (
                  <div
                    ref={noteRef}
                    className="uipack__note"
                    aria-hidden="true"
                    data-placed={notePos ? "true" : undefined}
                    style={notePos ?? undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <strong>{note.label}</strong>
                    <span>{note.detail}</span>
                  </div>
                ) : null}
                <svg
                  ref={wideRef}
                  className="uipack--wide"
                  // Opened, the drawing is never narrower than 800px, so
                  // labels stay readable on a phone; pan to see the rest.
                  style={
                    expanded
                      ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` }
                      : undefined
                  }
                  viewBox={viewBox}
                  role="group"
                  aria-label={alt}
                >
                  <FigureScaleContext.Provider value={wideScale}>
                    {children}
                  </FigureScaleContext.Provider>
                </svg>
                {narrow ? (
                  <svg
                    ref={narrowRef}
                    className="uipack--narrow"
                    viewBox={narrowViewBox ?? viewBox}
                    role="group"
                    aria-label={alt}
                  >
                    <FigureScaleContext.Provider value={narrowScale}>
                      {narrow}
                    </FigureScaleContext.Provider>
                  </svg>
                ) : null}
              </div>
            </figure>
          </FigureHoverContext.Provider>
        </FigureMotionContext.Provider>
      </SelectionContext.Provider>
    </CanvasView>
  );
}
