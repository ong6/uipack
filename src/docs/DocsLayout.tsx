import { useEffect, useId, useState, type ReactNode } from "react";

export interface DocsNavItem {
  title: string;
  href: string;
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
  children: ReactNode;
}

function SectionNavigation({
  sections,
  activeHref,
}: Pick<DocsLayoutProps, "sections" | "activeHref">) {
  return (
    <nav className="uipack-docs__navigation" aria-label="Documentation">
      {sections.map((section) => (
        <section className="uipack-docs__nav-section" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={item.href === activeHref ? "page" : undefined}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
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
  const key = ids.join(" ");
  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  children,
}: DocsLayoutProps) {
  const mobileNavigationId = useId();
  const currentSection = useCurrentSection(onThisPage.map((item) => item.id));
  const current = sections
    .flatMap((section) => section.items)
    .find((item) => item.href === activeHref);

  return (
    <div className="uipack-docs" data-theme={theme}>
      <a className="uipack-docs__skip" href="#docs-content">
        Skip to documentation content
      </a>

      <div className="uipack-docs__identity" aria-label="Documentation home">
        <a href={productHref}>{productTitle}</a>
        <span aria-hidden="true">/</span>
        <a href={sections[0]?.items[0]?.href || activeHref}>{docsTitle}</a>
      </div>

      <details className="uipack-docs__mobile-navigation">
        <summary aria-controls={mobileNavigationId}>
          <span>Documentation</span>
          {current && <small>{current.title}</small>}
          <svg
            className="uipack-docs__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </summary>
        <div id={mobileNavigationId}>
          <SectionNavigation sections={sections} activeHref={activeHref} />
        </div>
      </details>

      <div className="uipack-docs__grid">
        <aside className="uipack-docs__sidebar">
          <SectionNavigation sections={sections} activeHref={activeHref} />
        </aside>

        <section
          className="uipack-docs__article"
          id="docs-content"
          aria-label="Documentation content"
          tabIndex={-1}
        >
          {children}

          {(previous || next) && (
            <nav
              className="uipack-docs__pagination"
              aria-label="Previous and next documentation pages"
            >
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
        </section>

        {onThisPage.length > 0 && (
          <aside className="uipack-docs__toc" aria-label="On this page">
            <p>On this page</p>
            <ol>
              {onThisPage.map((item) => (
                <li key={item.id} data-level={item.level}>
                  <a
                    href={`#${item.id}`}
                    aria-current={item.id === currentSection ? "location" : undefined}
                  >
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
