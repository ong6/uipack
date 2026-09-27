import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "../context";
import { CtaButton, type CtaButtonProps } from "./CtaButton";
import { useInView, useScrollProgress } from "./hooks";

/* ---------------------------------------------------------------- Reveal */

export interface RevealProps {
  children: ReactNode;
  /** fade, up (fade + 16px rise) or blur (fade + blur-in). Default "up". */
  variant?: "fade" | "up" | "blur";
  /** Milliseconds between direct children. Default 80. */
  stagger?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Reveals its direct children, staggered, the first time a fifth of it scrolls into view.
 * Only opacity, transform and filter change, so nothing shifts. Content is visible without
 * JavaScript, without IntersectionObserver and under reduced motion.
 */
export function Reveal({ children, variant = "up", stagger = 80, as: Tag = "div", className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<"static" | "waiting" | "shown">("static");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
    if (reduced || typeof IntersectionObserver === "undefined") {
      setState("static");
      return;
    }
    setState("waiting");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return (
    <Tag
      ref={ref}
      className={`uipack-web-revealgroup ${className}`.trim()}
      data-state={state}
      data-variant={variant}
      style={{ "--stagger": `${stagger}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- Text scramble / typewriter */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_-";

/** The frame of a scramble or typewriter at progress t (0..1). Pure, for tests and SSR. */
export function scrambleFrame(text: string, t: number, mode: "scramble" | "type", seed = 0): string {
  const p = Math.max(0, Math.min(1, t));
  const settled = Math.floor(p * text.length);
  if (mode === "type") return text.slice(0, settled);
  let out = text.slice(0, settled);
  for (let i = settled; i < text.length; i++) {
    const ch = text[i];
    out += ch === " " ? " " : GLYPHS[(i * 7 + seed * 13) % GLYPHS.length];
  }
  return out;
}

export interface TextScrambleProps {
  text: string;
  /** scramble resolves random glyphs left to right; type reveals one character at a time. */
  mode?: "scramble" | "type";
  /** Milliseconds for the whole line. Default 1200. */
  duration?: number;
  as?: ElementType;
  className?: string;
}

/**
 * A hero line that resolves once, the first time it is on screen. The final text reserves
 * the space, so the layout never moves, and screen readers get the final text only.
 */
export function TextScramble({ text, mode = "scramble", duration = 1200, as: Tag = "span", className = "" }: TextScrambleProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, threshold: 0.5 });
  const [t, setT] = useState(1);
  const [tick, setTick] = useState(0);
  const started = useRef(false);
  // Server and no-JS render the final text; once an observer can start the effect, wait unresolved.
  useEffect(() => {
    if (typeof IntersectionObserver !== "undefined" && !started.current) setT(0);
  }, []);
  useEffect(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    const start = Date.now();
    setT(0);
    const timer = setInterval(() => {
      const p = (Date.now() - start) / duration;
      setT(Math.min(1, p));
      setTick((k) => k + 1);
      if (p >= 1) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [reduced, inView, duration]);
  const shown = reduced || t >= 1 ? text : scrambleFrame(text, t, mode, tick);
  return (
    <Tag ref={ref} className={`uipack-web-scramble ${className}`.trim()} data-mode={mode} data-done={shown === text || undefined}>
      <span className="uipack-web-scramble__ghost">{text}</span>
      <span className="uipack-web-scramble__live" aria-hidden="true">
        {shown}
        {mode === "type" && shown !== text && <span className="uipack-web-demo__caret" />}
      </span>
    </Tag>
  );
}

/* ---------------------------------------------------------------- Number ticker */

export interface NumberTickerProps {
  value: number;
  from?: number;
  /** Milliseconds. Default 1400. */
  duration?: number;
  /** Intl.NumberFormat options, e.g. { maximumFractionDigits: 1 }. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to a proof stat the first time it is on screen. Tabular figures and a hidden copy
 * of the final value reserve the width; assistive tech reads the final value only.
 */
export function NumberTicker({ value, from = 0, duration = 1400, format, locale, prefix = "", suffix = "", className = "" }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, threshold: 0.6 });
  const [current, setCurrent] = useState(value);
  const started = useRef(false);
  // Server and no-JS render the final value; once an observer can start the count, wait at `from`.
  useEffect(() => {
    if (typeof IntersectionObserver !== "undefined" && !started.current) setCurrent(from);
  }, [from]);
  useEffect(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    const start = Date.now();
    setCurrent(from);
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setCurrent(from + (value - from) * easeOut(p));
      if (p >= 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [reduced, inView, from, value, duration]);
  const fmt = new Intl.NumberFormat(locale, format ?? { maximumFractionDigits: 0 });
  const final = `${prefix}${fmt.format(value)}${suffix}`;
  const live = `${prefix}${fmt.format(reduced ? value : current)}${suffix}`;
  return (
    <span ref={ref} className={`uipack-web-ticker ${className}`.trim()}>
      <span className="uipack-web-scramble__ghost">{final}</span>
      <span className="uipack-web-scramble__live" aria-hidden="true" data-testid="ticker-live">
        {live}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- Marquee */

export interface MarqueeProps {
  items: ReactNode[];
  /** Accessible name, e.g. "Tools I use". */
  label: string;
  /** Seconds for one full loop. Default 30. */
  duration?: number;
  reverse?: boolean;
}

/**
 * A logo or skill strip that scrolls. Pauses on hover, on focus, off screen and with its own
 * Pause button (moving content longer than five seconds needs one). Under reduced motion it is
 * a static, wrapping row. The duplicate copy is inert, so keyboard focus visits each item once.
 */
export function Marquee({ items, label, duration = 30, reverse = false }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    copyRef.current?.setAttribute("inert", "");
  }, [reduced]);
  const list = (copy: boolean) => (
    <ul className="uipack-web-marquee__list" ref={copy ? copyRef : undefined} aria-hidden={copy || undefined}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
  return (
    <div
      ref={ref}
      className="uipack-web-marquee"
      role="region"
      aria-label={label}
      data-static={reduced || undefined}
      data-paused={paused || !inView || undefined}
      data-reverse={reverse || undefined}
      style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
    >
      <div className="uipack-web-marquee__viewport">
        <div className="uipack-web-marquee__track">
          {list(false)}
          {!reduced && list(true)}
        </div>
      </div>
      {!reduced && (
        <button type="button" className="uipack-web-marquee__toggle" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Tilt + magnetic */

function useHoverMotion(apply: (el: HTMLElement, x: number, y: number) => void, reset: (el: HTMLElement) => void) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    apply(el, (e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => ref.current && reset(ref.current);
  return { ref, onPointerMove, onPointerLeave };
}

export interface TiltCardProps {
  children: ReactNode;
  /** Maximum tilt in degrees. Subtle: default 5. */
  max?: number;
  href?: string;
  className?: string;
}

/** A card that tilts a few degrees toward a mouse pointer. Nothing on touch or under reduced motion; keyboard focus lifts it. */
export function TiltCard({ children, max = 5, href, className = "" }: TiltCardProps) {
  const { ref, onPointerMove, onPointerLeave } = useHoverMotion(
    (el, x, y) => {
      el.style.setProperty("--tilt-x", `${(-y * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(x * max * 2).toFixed(2)}deg`);
    },
    (el) => {
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
    },
  );
  const cls = `uipack-web-tilt ${className}`.trim();
  const props = { className: cls, onPointerMove, onPointerLeave };
  return href ? (
    <a ref={(n) => (ref.current = n)} href={href} {...props}>
      {children}
    </a>
  ) : (
    <div ref={(n) => (ref.current = n)} {...props}>
      {children}
    </div>
  );
}

export interface MagneticButtonProps extends CtaButtonProps {
  /** Maximum pull in px. Subtle: default 6. */
  strength?: number;
}

/** A CtaButton that leans a few pixels toward a mouse pointer. The hit area never moves. */
export function MagneticButton({ strength = 6, ...button }: MagneticButtonProps) {
  const { ref, onPointerMove, onPointerLeave } = useHoverMotion(
    (el, x, y) => {
      el.style.setProperty("--pull-x", `${(x * strength * 2).toFixed(1)}px`);
      el.style.setProperty("--pull-y", `${(y * strength * 2).toFixed(1)}px`);
    },
    (el) => {
      el.style.removeProperty("--pull-x");
      el.style.removeProperty("--pull-y");
    },
  );
  return (
    <span ref={(n) => (ref.current = n)} className="uipack-web-magnetic" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <CtaButton {...button} />
    </span>
  );
}

/* ---------------------------------------------------------------- Scroll transform */

type Range = [from: number, to: number];

export interface ScrollTransformProps {
  children: ReactNode;
  /** Degrees across the scroll. */
  rotate?: Range;
  scale?: Range;
  /** Pixels. */
  translateY?: Range;
  opacity?: Range;
  className?: string;
}

const lerp = ([a, b]: Range, t: number) => a + (b - a) * t;

/**
 * Drives a transform from the element's scroll progress: reuse the hero's star further down
 * the page and let it turn or grow as the reader moves. Listens only while on screen; under
 * reduced motion it holds the midpoint.
 */
export function ScrollTransform({ children, rotate = [0, 0], scale = [1, 1], translateY = [0, 0], opacity = [1, 1], className = "" }: ScrollTransformProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const raw = useScrollProgress(ref);
  const t = reduced ? 0.5 : raw;
  const style = {
    "--st-rotate": `${lerp(rotate, t).toFixed(2)}deg`,
    "--st-scale": lerp(scale, t).toFixed(3),
    "--st-y": `${lerp(translateY, t).toFixed(1)}px`,
    "--st-opacity": lerp(opacity, t).toFixed(3),
  } as CSSProperties;
  return (
    <div ref={ref} className={`uipack-web-scrollx ${className}`.trim()} data-progress={t.toFixed(2)}>
      <div className="uipack-web-scrollx__inner" style={style}>
        {children}
      </div>
    </div>
  );
}
