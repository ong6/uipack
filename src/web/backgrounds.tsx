import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode, type RefObject } from "react";
import { usePrefersReducedMotion } from "../context";
import { useFinePointer, useInView } from "./hooks";
import { StarChart } from "./motif";

export interface BackgroundFrameProps {
  /** One ambient effect: GrainOverlay, DotGrid, LineGrid, Aurora, MaskedStar or BeamLines. */
  background: ReactNode;
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/** A positioned, clipped box that puts one decorative background behind its content. */
export function BackgroundFrame({ background, children, as: Tag = "div", className = "", style }: BackgroundFrameProps) {
  return (
    <Tag className={`uipack-web-bgframe ${className}`.trim()} style={style}>
      {background}
      <div className="uipack-web-bgframe__content">{children}</div>
    </Tag>
  );
}

export { GrainOverlay, type GrainOverlayProps } from "./motif";

export interface GridBackgroundProps {
  /** Cell size in px, on the 8-pt grid. Default 24. */
  size?: number;
  /** Fade the pattern out towards the edges. Default true. */
  fade?: boolean;
  /** Light the pattern under a fine pointer. Off on touch and under reduced motion. */
  spotlight?: boolean;
}

function useParentSpotlight(ref: RefObject<HTMLDivElement>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || !enabled) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = host.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      el.dataset.lit = "true";
    };
    const leave = () => delete el.dataset.lit;
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [ref, enabled]);
}

function GridBackground({ variant, size = 24, fade = true, spotlight = false }: GridBackgroundProps & { variant: "dots" | "lines" }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  useParentSpotlight(ref, spotlight && fine && !reduced);
  return (
    <div
      ref={ref}
      className="uipack-web-gridbg"
      data-bg={variant}
      data-fade={fade || undefined}
      aria-hidden="true"
      style={{ "--cell": `${size}px` } as CSSProperties}
    >
      {spotlight && <div className="uipack-web-gridbg__lit" />}
    </div>
  );
}

/** A dot pattern with a radial fade; optionally lit under the pointer. */
export function DotGrid(props: GridBackgroundProps) {
  return <GridBackground variant="dots" {...props} />;
}

/** A hairline grid with a radial fade; optionally lit under the pointer. */
export function LineGrid(props: GridBackgroundProps) {
  return <GridBackground variant="lines" {...props} />;
}

export interface AuroraProps {
  /** Seconds for one drift cycle. Slow is the point. Default 24. */
  duration?: number;
}

/**
 * Two or three blurred colour blobs from the theme tokens, drifting slowly. The blobs sit in
 * one layer at --web-aurora-opacity, so overlaps never add up past the contrast budget.
 * Paused off screen; still under reduced motion.
 */
export function Aurora({ duration = 24 }: AuroraProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className="uipack-web-aurora"
      data-bg="aurora"
      data-paused={!inView || undefined}
      aria-hidden="true"
      style={{ "--aurora-duration": `${duration}s` } as CSSProperties}
    >
      <i />
      <i />
      <i />
    </div>
  );
}

export interface MaskedStarProps {
  values?: number[];
  /** Mirror the star: "x" rises toward the start edge, "y" hangs from the top. Default "none". */
  flip?: "x" | "y" | "none";
  /** Where the copy sits; the mask clears that area. Default "center". */
  clear?: "center" | "start";
}

/** The star of the show behind a headline: flipped, then masked clear of the text. */
export function MaskedStar({ values, flip = "none", clear = "center" }: MaskedStarProps) {
  return (
    <div className="uipack-web-maskedstar" data-bg="star" data-flip={flip} data-clear={clear} aria-hidden="true">
      <StarChart values={values} />
    </div>
  );
}

export interface BeamLinesProps {
  /** Grid cell in px. Default 48. */
  size?: number;
  /** Number of beams. Default 5. */
  count?: number;
  /** Seconds for a beam to cross. Default 6. */
  duration?: number;
}

/**
 * Thin light beams travelling along grid lines, like packets on a connector. Positions are
 * deterministic, so server and client agree. Paused off screen; parked mid-line under reduced motion.
 */
export function BeamLines({ size = 48, count = 5, duration = 6 }: BeamLinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const beams = Array.from({ length: count }, (_, i) => ({
    axis: i % 2 === 0 ? "h" : "v",
    line: 2 + ((i * 3) % 7),
    delay: -((i * duration) / count) * 1.7,
    dur: duration * (0.8 + ((i * 7) % 5) / 10),
  }));
  return (
    <div
      ref={ref}
      className="uipack-web-beams"
      data-bg="beams"
      data-paused={!inView || undefined}
      aria-hidden="true"
      style={{ "--cell": `${size}px` } as CSSProperties}
    >
      {beams.map((b, i) => (
        <i
          key={i}
          data-axis={b.axis}
          style={
            {
              "--line": `${b.line * size}px`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
