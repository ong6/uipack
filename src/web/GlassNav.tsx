import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface GlassNavLink {
  label: string;
  href: string;
}

export interface GlassNavProps {
  /** Brand mark or name; wrap it in a link yourself if it should navigate. */
  brand: ReactNode;
  links: GlassNavLink[];
  /** The page's one goal, repeated from the hero. */
  cta?: ReactNode;
  /** Stick to the top of the scroll container. Default true. */
  sticky?: boolean;
  label?: string;
}

/** Sticky bar with a subtle backdrop blur and a hairline border. Links fold into a menu in narrow containers. */
export function GlassNav({ brand, links, cta, sticky = true, label = "Primary" }: GlassNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="uipack-web-nav" data-sticky={sticky || undefined} data-open={open || undefined}>
      <div className="uipack-web-nav__bar">
        <div className="uipack-web-nav__brand">{brand}</div>
        <nav aria-label={label} className="uipack-web-nav__nav">
          <ul id={listId} className="uipack-web-nav__links">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {cta && <div className="uipack-web-nav__cta">{cta}</div>}
        <button
          ref={toggleRef}
          type="button"
          className="uipack-web-nav__toggle"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
