import { useEffect, useId, useState, type ReactNode } from "react";

export interface DocsNavItem {
  title: string;
  href: string;
  /** Sub-pages listed under this one (a page with several views). One level deep. */
  items?: DocsNavItem[];
}

export interface DocsSection {
  title: string;
  items: DocsNavItem[];
}

export interface DocsTocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface DocsLayoutProps {
  productTitle: string;
  productHref: string;
  docsTitle?: string;
  sections: DocsSection[];
  activeHref: string;
  onThisPage?: DocsTocItem[];
  previous?: DocsNavItem | null;
  next?: DocsNavItem | null;
  theme?: "light" | "dark";
  /**
   * The colour tokens. "warm" (the default) is the paper-and-blue look hosts already use;
   * "technical" takes UI Pack's Technical palette (forest/mint accent, green-black dark).
   */
  palette?: "warm" | "technical";
  /**
   * "prose" (the default) keeps the article at the 680px measure. "wide" lets the article column
   * grow to the space between the sidebar and the table of contents: prose still stops at 680px,
   * while a `DocsMarkdown` block flagged `wide` (a deck, a web page, a 3D scene) and any child
   * wrapped in `.uipack-docs__block[data-width="wide"]` take the full column.
   */
  width?: "prose" | "wide";
  /** The host's own banner (its logo and theme toggle) in place of the product / docs identity row. */
  header?: ReactNode;
  /** The below-900px navigation disclosure. Turn it off when the host's header has its own menu. Default true. */
  mobileNavigation?: boolean;
  /** The sidebar's accessible name. Default "Documentation". */
  navigationLabel?: string;
  /** The page's Markdown source as plain text ("View as Markdown"), shown above the page. */
  markdownHref?: string;
  /** Where to edit the page's source ("Edit on GitHub"), shown above the page. */
  editHref?: string;
  /** A short line before those links (the page's group, say). */
  eyebrow?: ReactNode;
  /** The article's element: "section" (default) inside a host page that has its own main, or "main". */
  landmark?: "section" | "main";
  /** The article's id, the skip link's target. Default "docs-content". */
  contentId?: string;
  /** The article's accessible name. Default "Documentation content". */
  contentLabel?: string;
  /** Classes added to the article, for a host that styles its page there. */
  contentClassName?: string;
  children: ReactNode;
}

function NavigationItem({ item, activeHref }: { item: DocsNavItem; activeHref: string }) {
  return (
    <li>
      <a href={item.href} aria-current={item.href === activeHref ? "page" : undefined}>
        {item.title}
      </a>
      {item.items && item.items.length > 0 && (
        <ul className="uipack-docs__nav-sub" aria-label={item.title}>
          {item.items.map((sub) => (
            <NavigationItem key={sub.href} item={sub} activeHref={activeHref} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SectionNavigation({
  sections,
  activeHref,
  label,
}: Pick<DocsLayoutProps, "sections" | "activeHref"> & { label: string }) {
  return (
    <nav className="uipack-docs__navigation" aria-label={label}>
      {sections.map((section) => (
        <section className="uipack-docs__nav-section" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <NavigationItem key={item.href} item={item} activeHref={activeHref} />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

/** Every item, sub-pages included, in reading order. */
function flatItems(items: DocsNavItem[]): DocsNavItem[] {
  return items.flatMap((item) => [item, ...flatItems(item.items ?? [])]);
}

/**
 * The id of the section being read: the last heading whose top has passed the
 * reading line, 30% down the viewport (the last one in view once the page
 * can scroll no further). Measured on a passive, frame-throttled scroll
 * listener: an IntersectionObserver alone misses a jump between two points
 * where no heading changes visibility, such as two long sections.
 */
function useCurrentSection(ids: string[]) {
  const [current, setCurrent] = useState<string | null>(null);
  // Keyed by the ids' values, so a fresh array with the same ids does not re-measure.
  const key = ids.join(" ");
  useEffect(() => {
    const headings = (key ? key.split(" ") : [])
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let next: string | null = null;
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top <= line || (atEnd && top < window.innerHeight)) next = heading.id;
      }
      setCurrent(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key]);
  return current;
}

export function DocsLayout({
  productTitle,
  productHref,
  docsTitle = "Product docs",
  sections,
  activeHref,
  onThisPage = [],
  previous,
  next,
  theme,
  palette = "warm",
  width = "prose",
  header,
  mobileNavigation = true,
  navigationLabel = "Documentation",
  markdownHref,
  editHref,
  eyebrow,
  landmark = "section",
  contentId = "docs-content",
  contentLabel = "Documentation content",
  contentClassName,
  children,
}: DocsLayoutProps) {
  const mobileNavigationId = useId();
  const currentSection = useCurrentSection(onThisPage.map((item) => item.id));
  const current = flatItems(sections.flatMap((section) => section.items)).find((item) => item.href === activeHref);
  const Article = landmark;

  return (
    <div className="uipack-docs" data-theme={theme} data-palette={palette} data-width={width === "wide" ? "wide" : undefined}>
      <a className="uipack-docs__skip" href={`#${contentId}`}>
        Skip to documentation content
      </a>

      {header ?? (
        <div className="uipack-docs__identity" aria-label="Documentation home">
          <a href={productHref}>{productTitle}</a>
          <span aria-hidden="true">/</span>
          <a href={sections[0]?.items[0]?.href || activeHref}>{docsTitle}</a>
        </div>
      )}

      {/* Escape inside the open menu closes it and hands focus back to its summary. */}
      {mobileNavigation && (
        <details
          className="uipack-docs__mobile-navigation"
          onKeyDown={(e) => {
            const details = e.currentTarget;
            if (e.key !== "Escape" || !details.open || e.defaultPrevented) return;
            e.preventDefault();
            details.open = false;
            details.querySelector("summary")?.focus();
          }}
        >
          <summary aria-controls={mobileNavigationId}>
            <span>Documentation</span>
            {current && <small>{current.title}</small>}
            <svg className="uipack-docs__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </summary>
          <div id={mobileNavigationId}>
            <SectionNavigation sections={sections} activeHref={activeHref} label={navigationLabel} />
          </div>
        </details>
      )}

      <div className="uipack-docs__grid" data-toc={onThisPage.length > 0 ? undefined : "none"}>
        <aside className="uipack-docs__sidebar">
          <SectionNavigation sections={sections} activeHref={activeHref} label={navigationLabel} />
        </aside>

        <Article
          className={contentClassName ? `uipack-docs__article ${contentClassName}` : "uipack-docs__article"}
          id={contentId}
          aria-label={contentLabel}
          tabIndex={-1}
        >
          {(markdownHref || editHref || eyebrow) && (
            <div className="uipack-docs__page-bar">
              {eyebrow}
              {(markdownHref || editHref) && (
                <span className="uipack-docs__source-links">
                  {markdownHref && <a href={markdownHref}>View as Markdown</a>}
                  {editHref && <a href={editHref}>Edit on GitHub</a>}
                </span>
              )}
            </div>
          )}
          {children}

          {(previous || next) && (
            <nav className="uipack-docs__pagination" aria-label="Previous and next documentation pages">
              {previous && (
                <a href={previous.href} rel="prev">
                  <small>Previous</small>
                  <span>← {previous.title}</span>
                </a>
              )}
              {next && (
                <a href={next.href} rel="next">
                  <small>Next</small>
                  <span>{next.title} →</span>
                </a>
              )}
            </nav>
          )}
        </Article>

        {onThisPage.length > 0 && (
          <aside className="uipack-docs__toc" aria-label="On this page">
            <p>On this page</p>
            <ol>
              {onThisPage.map((item) => (
                <li key={item.id} data-level={item.level}>
                  <a href={`#${item.id}`} aria-current={item.id === currentSection ? "location" : undefined}>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
