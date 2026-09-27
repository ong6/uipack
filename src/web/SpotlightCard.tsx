import { useRef, type PointerEvent, type ReactNode } from "react";

export interface SpotlightCardProps {
  children: ReactNode;
  /** Makes the whole card a link. Otherwise put links inside it. */
  href?: string;
  className?: string;
}

/**
 * A card whose fill and border glow follow a fine pointer. CSS variables carry the position,
 * so moving the pointer never re-renders. Off on touch and under reduced motion; keyboard
 * focus shows the same highlight, fixed at the top edge.
 */
export function SpotlightCard({ children, href, className = "" }: SpotlightCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    ref.current?.style.removeProperty("--spot-x");
    ref.current?.style.removeProperty("--spot-y");
  };
  const cls = `uipack-web-spotlight ${className}`.trim();
  if (href)
    return (
      <a ref={(n) => (ref.current = n)} className={cls} href={href} onPointerMove={onMove} onPointerLeave={onLeave}>
        {children}
      </a>
    );
  return (
    <div ref={(n) => (ref.current = n)} className={cls} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
