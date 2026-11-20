// Kinetic slide parts: a number that counts up as its slide arrives, a line whose letters rise in,
// and the drifting wireframe Polyhedra backdrop. Every style can use them (the Motion style's decks
// do). Each shows its finished state in thumbnails, the read view, print and reduced motion.
import { useEffect, useMemo, useRef, type ElementType } from "react";
import { useIsoLayoutEffect } from "../env";
import { useDeckSlide } from "./parts";
import { deckMotion } from "./transitions";
import { SOLIDS, poseAt, project, scatter, type PolyhedronSpec } from "./polyhedra";

/** Whether a kinetic part should move: on the live slide, never in a thumbnail or with reduced motion. */
function useLive() {
  const { active, thumbnail, reducedMotion } = useDeckSlide();
  return active && !thumbnail && !reducedMotion;
}

/** Decimal places in a number as written (`12.5` has one), so a count keeps the value's precision. */
const decimalsOf = (n: number) => {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
};

/** The ease a count follows: fast at first, landing softly (ease-out quint). */
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

export interface CountUpProps {
  /** The number to land on. */
  value: number;
  /** Where the count starts. Default 0. */
  from?: number;
  /** Text before and after the number: `prefix="$"`, `suffix="+"`, `suffix="K"`. */
  prefix?: string;
  suffix?: string;
  /** Formats each frame's number. Default: grouped (`286,884`) with the value's own decimals. */
  format?: (n: number) => string;
  /** Count when this build step is reached, rather than when the slide arrives. */
  step?: number;
  className?: string;
}

/**
 * A number that counts up to its value as its slide arrives (`deckMotion.count`, easing out). Its
 * width is held by the final value, so the line never reflows while it counts; screen readers,
 * thumbnails, print and reduced motion get the final value only.
 */
export function CountUp({ value, from = 0, prefix = "", suffix = "", format, step, className }: CountUpProps) {
  const live = useLive();
  const { step: reached } = useDeckSlide();
  const started = live && (step === undefined || reached >= step);
  const fmt = useMemo(() => {
    if (format) return format;
    const nf = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalsOf(value),
      maximumFractionDigits: decimalsOf(value),
    });
    return (n: number) => nf.format(n);
  }, [format, value]);
  const final = `${prefix}${fmt(value)}${suffix}`;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !started) return;
    const begin = performance.now() + deckMotion.handoff;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / deckMotion.count));
      const n = from + (value - from) * easeOutQuint(t);
      el.dataset.value = t >= 1 ? final : `${prefix}${fmt(decimalsOf(value) ? n : Math.round(n))}${suffix}`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    el.dataset.value = `${prefix}${fmt(from)}${suffix}`;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, from, value, prefix, suffix, fmt, final]);

  const cls = ["uipack-deck-count", className].filter(Boolean).join(" ");
  // Still (a thumbnail, the read view, print, reduced motion): the value as plain, selectable text.
  if (!started) return <span className={cls}>{final}</span>;
  return (
    <span className={cls}>
      <span className="uipack-deck-sr">{final}</span>
      {/* Drawn from data-value (CSS ::before), so the text is in the page once, in the line above:
          the final value holds the width and the counting copy sits over it. */}
      <span className="uipack-deck-count__hold" aria-hidden="true" data-value={final} />
      <span ref={ref} className="uipack-deck-count__run" aria-hidden="true" data-value={final} />
    </span>
  );
}

export interface LetterRevealProps {
  /** The words, as plain text. */
  children: string;
  /** The element to render. Default `span`, to sit inside a title or heading. */
  as?: ElementType;
  /** Reveal at this build step rather than when the slide arrives. */
  step?: number;
  className?: string;
}

/**
 * A line whose letters rise in from a blur, left to right, as its slide arrives: for a headline or
 * its second voice. Words never break mid-word; the stagger shrinks with length so the last letter
 * starts within 480 ms. Screen readers get the words once; the still states show them whole.
 */
export function LetterReveal({ children, as: Tag = "span", step, className }: LetterRevealProps) {
  const live = useLive();
  const { step: reached } = useDeckSlide();
  const moving = live && (step === undefined || reached >= step);
  const hidden = live && step !== undefined && reached < step;
  const words = children.split(/(\s+)/);
  const letters = children.replace(/\s+/g, "").length;
  const stagger = Math.min(28, 480 / Math.max(1, letters));
  let i = 0;
  const cls = ["uipack-deck-reveal", className].filter(Boolean).join(" ");
  // Still: the words as plain, selectable text.
  if (!moving && !hidden) return <Tag className={cls}>{children}</Tag>;
  return (
    <Tag className={cls} data-reveal={moving ? "" : hidden ? "hidden" : undefined}>
      {/* The words once, for screen readers and textContent; the letters draw from data-char. */}
      <span className="uipack-deck-sr">{children}</span>
      <span aria-hidden="true">
        {words.map((w, wi) =>
          /^\s+$/.test(w) ? (
            w
          ) : (
            <span key={wi} className="uipack-deck-reveal__word">
              {Array.from(w, (ch) => (
                <span
                  key={i}
                  className="uipack-deck-reveal__char"
                  style={{ animationDelay: `${(deckMotion.handoff + i++ * stagger).toFixed(0)}ms` }}
                  data-char={ch}
                />
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}

export interface PolyhedraProps {
  /** How many solids, scattered round the canvas edges. Default 9. Ignored when `solids` is given. */
  count?: number;
  /** Seed for the scatter: the same seed draws the same field. */
  seed?: number;
  /** Place the solids yourself (canvas pixels on 1920×1080). */
  solids?: readonly PolyhedronSpec[];
}

/**
 * Wireframe solids drifting and turning slowly behind a deck's slides: the Motion style's ambient
 * effect (one per viewport, so a deck with it adds no other). Pass it as `DeckPlayer backdrop`: it
 * is drawn into every slide's background on one shared clock, so the field stays put as slides
 * change and travels with a slide that turns or slides. Faint ink lines, the far edges dashed, one
 * solid in the accent and one bolder with accent vertices. Still in thumbnails, print and reduced
 * motion; paused while off screen; 30 frames a second on touch screens.
 */
export function Polyhedra({ count = 9, seed = 1, solids }: PolyhedraProps) {
  const live = useLive();
  const specs = useMemo(() => solids ?? scatter(count, seed), [solids, count, seed]);
  const svgRef = useRef<SVGSVGElement>(null);
  // The still pose: what thumbnails, print and reduced motion show, and the first paint otherwise.
  const still = useMemo(() => specs.map((s, i) => draw(s, i, 0)), [specs]);

  // A layout effect, so a slide that mounts mid-talk draws the current pose before its first paint
  // instead of flashing the still pose.
  useIsoLayoutEffect(() => {
    const svg = svgRef.current;
    if (!live || !svg) return;
    const groups = Array.from(svg.querySelectorAll<SVGGElement>(":scope > g"));
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    let visible = true;
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
          })
        : null;
    io?.observe(svg);
    let raf = 0;
    let frame = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || (coarse && frame++ % 2)) return;
      // performance.now() is the page's clock, so every copy of the backdrop draws the same pose.
      const t = now / 1000;
      specs.forEach((s, i) => {
        const g = groups[i];
        if (!g) return;
        const p = draw(s, i, t);
        const [near, far, dots] = g.children as unknown as [SVGPathElement, SVGPathElement, SVGPathElement];
        near.setAttribute("d", p.near);
        far.setAttribute("d", p.far);
        if (dots) dots.setAttribute("d", p.dots);
      });
    };
    tick(performance.now());
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [live, specs]);

  return (
    <svg ref={svgRef} className="uipack-deck-polyhedra" viewBox="0 0 1920 1080" aria-hidden="true" focusable="false">
      {specs.map((s, i) => (
        <g key={i} data-line={s.tone}>
          <path className="uipack-deck-polyhedra__near" d={still[i].near} />
          <path className="uipack-deck-polyhedra__far" d={still[i].far} />
          {s.dots && <path className="uipack-deck-polyhedra__dots" d={still[i].dots} />}
        </g>
      ))}
    </svg>
  );
}

/** One solid's paths at time `t`: near edges, far edges, and a dot on each near vertex. */
function draw(spec: PolyhedronSpec, index: number, t: number) {
  const pose = poseAt(spec, index, t);
  const p = project(SOLIDS[spec.solid], pose.x, pose.y, spec.size, pose.rx, pose.ry, pose.rz);
  const dots = spec.dots
    ? p.points
        .filter((q) => q.z > 0)
        .map((q) => `M${q.x.toFixed(1)} ${q.y.toFixed(1)}h0.01`)
        .join("")
    : "";
  return { near: p.near, far: p.far, dots };
}
