import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { FigureMotionContext, usePrefersReducedMotion, type FigureMotion } from "./context";
import { Legend, type LegendItem } from "./Legend";

export interface FigureProps {
  /** "Figure 01" or "Fig. 3". Rendered mono, uppercase, before the eyebrow title. */
  number?: string;
  /** Short mono topic after the number: "What is Habitat?". */
  eyebrow?: string;
  title?: string;
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
  id?: string;
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
    <path d="M6 1.5a4.5 4.5 0 1 1-4.2 2.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M1.5 1.5v3h3z" />
  </svg>
);

export function Figure({
  number,
  eyebrow,
  title,
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
  id,
}: FigureProps) {
  const auto = useId();
  const figId = id ?? `uipack-${auto.replace(/:/g, "")}`;
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const wideRef = useRef<SVGSVGElement>(null);
  const narrowRef = useRef<SVGSVGElement>(null);

  const svgs = () => [wideRef.current, narrowRef.current].filter(Boolean) as SVGSVGElement[];

  useEffect(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing]);

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

  const showControls = controls && !reduced;
  const hasHead = number || eyebrow || title || caption || legend.length || showControls;

  return (
    <FigureMotionContext.Provider value={motion}>
      <figure
        id={figId}
        className={["uipack", narrow ? "uipack--has-narrow" : "", className ?? ""].join(" ").trim()}
        data-theme={theme}
        style={{ margin: 0 }}>
        {hasHead ? (
          <div className="uipack__head">
            {number || eyebrow ? (
              <p className="uipack__eyebrow">
                {number}
                {number && eyebrow ? " · " : ""}
                {eyebrow}
              </p>
            ) : null}
            {title ? <h3 className="uipack__title">{title}</h3> : null}
            {caption ? <p className="uipack__caption">{caption}</p> : null}
            {showControls ? (
              <div className="uipack__controls">
                <button type="button" className="uipack__ctl uipack__ctl--motion" onClick={replay}>
                  <ReplayGlyph /> Replay
                </button>
                <button type="button" className="uipack__ctl uipack__ctl--motion" onClick={toggle} aria-pressed={!playing}>
                  {playing ? <PauseGlyph /> : <PlayGlyph />} {playing ? "Pause" : "Play"}
                </button>
              </div>
            ) : null}
            <Legend items={legend} />
          </div>
        ) : null}
        <div className="uipack__canvas">
          <svg ref={wideRef} className="uipack--wide" viewBox={viewBox} role="img" aria-label={alt}>
            {children}
          </svg>
          {narrow ? (
            <svg ref={narrowRef} className="uipack--narrow" viewBox={narrowViewBox ?? viewBox} role="img" aria-label={alt}>
              {narrow}
            </svg>
          ) : null}
        </div>
      </figure>
    </FigureMotionContext.Provider>
  );
}
