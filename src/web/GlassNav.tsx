import { isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CtaButton } from "./CtaButton";

export interface GlassNavLink {
  label: string;
  href: string;
}

/** The nav's call to action as data: GlassNav draws the button, with `short` in a phone's bar. */
export interface GlassNavCta {
  label: ReactNode;
  href: string;
  /** The label in the bar below 720px, where the full one does not fit beside brand and Menu. */
  short?: ReactNode;
}

export interface GlassNavProps {
  /** Brand mark or name; wrap it in a link yourself if it should navigate. */
  brand: ReactNode;
  links: GlassNavLink[];
  /**
   * The page's one goal, repeated from the hero. It stays in the bar on a phone as a compact button
   * beside Menu; only in a container narrower than 340px does it move into the open menu. Pass
   * `{ label, href, short }` (or a `CtaButton` with `short`) so a long label has a phone version.
   */
  cta?: ReactNode | GlassNavCta;
  /** Stick to the top of the scroll container. Default true. */
  sticky?: boolean;
  label?: string;
}

/**
 * Sticky bar with a subtle backdrop blur and a hairline border. Links fold into a menu below 720px
 * (brand on the left, Menu on the right edge); the CTA stays beside Menu, compact, down to 340px.
 */
const isCtaData = (c: unknown): c is GlassNavCta =>
  typeof c === "object" && c !== null && !isValidElement(c) && !Array.isArray(c) && "href" in c && "label" in c;

export function GlassNav({ brand, links, cta: ctaProp, sticky = true, label = "Primary" }: GlassNavProps) {
  const cta = isCtaData(ctaProp) ? (
    <CtaButton href={ctaProp.href} short={ctaProp.short}>
      {ctaProp.label}
    </CtaButton>
  ) : (
    ctaProp
  );
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
