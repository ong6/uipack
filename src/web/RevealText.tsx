import { Fragment, useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";
import { usePrefersReducedMotion } from "../context";

export interface RevealTextProps {
  /** Words reveal one by one. */
  text?: string;
  /** Or authored lines, which reveal one line at a time. */
  lines?: string[];
  as?: ElementType;
  className?: string;
  /** Milliseconds between units. */
  stagger?: number;
}

/**
 * Scroll-in reveal: words (or authored lines) rise into place when 30% is on screen.
 * IntersectionObserver plus CSS; the text is always in the DOM and fully visible
 * without JavaScript, without IntersectionObserver, and under reduced motion.
 */
export function RevealText({ text = "", lines, as: Tag = "p", className = "", stagger = 45 }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<"static" | "waiting" | "shown">("static");
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") {
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
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const units = lines ?? text.split(/\s+/).filter(Boolean);
  const byLine = !!lines;
  return (
    <Tag ref={ref} className={`uipack-web-reveal ${className}`.trim()} data-state={state} data-by={byLine ? "line" : "word"}>
      {units.map((u, i) => (
        <Fragment key={i}>
          <span className="uipack-web-reveal__unit" style={{ "--i": i, "--stagger": `${stagger}ms` } as CSSProperties}>
            {u}
          </span>
          {!byLine && i < units.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
