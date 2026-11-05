import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface GlassNavLink {
  label: string;
  href: string;
}

export interface GlassNavProps {
  /** Brand mark or name; wrap it in a link yourself if it should navigate. */
  brand: ReactNode;
  links: GlassNavLink[];
  /**
   * The page's one goal, repeated from the hero. It stays in the bar on a phone as a compact button
   * beside Menu; only in a container narrower than 340px does it move into the open menu.
   */
  cta?: ReactNode;
  /** Stick to the top of the scroll container. Default true. */
  sticky?: boolean;
  label?: string;
}

/**
 * Sticky bar with a subtle backdrop blur and a hairline border. Links fold into a menu below 720px
 * (brand on the left, Menu on the right edge); the CTA stays beside Menu, compact, down to 340px.
 */
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
            {cta && (
              <li className="uipack-web-nav__menu-cta" onClick={() => setOpen(false)}>
                {cta}
              </li>
            )}
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
