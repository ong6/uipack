import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useIsoLayoutEffect } from "../env";
import {
  ContentsRail,
  flyNavMarker,
  MarkerGlyph,
  NAV_DOCK_X,
  NAV_SUB_DOCK_X,
  navRoute,
  prefersReducedMotion,
  readNavMemory,
  writeNavMemory,
  type DocsMarkerShape,
  type Point,
} from "./DocsMarkers";
import { DocsSearchButton, DocsSearchDialog, type DocsSearchOptions } from "./DocsSearch";

export interface DocsNavItem {
  title: string;
  href: string;
  /** Sub-pages listed under this one (a page with several views). One level deep. */
  items?: DocsNavItem[];
  /** A caption shown above this item when it differs from the previous item's (a group inside a section). */
  group?: string;
}

export interface DocsSection {
  title: string;
  items: DocsNavItem[];
  /** Keys the section's open state and its search results. Default: the title. */
  id?: string;
  /** A small decorative icon before the title (16px, drawn in the section's hue). */
  icon?: ReactNode;
  /**
   * The section's navigation hue, any CSS colour (a role: `var(--site-hue-build)`). It marks only
   * the heading's icon, the current-page marker and search results; text keeps the ink roles.
   */
  hue?: string;
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
  /**
   * The navigation below 900px. `true` (default): a disclosure above the page. `false`: none (the
   * host's header has its own menu). `"drawer"`: the sidebar slides in from the left as a modal
   * drawer, opened by the host's header button through `navigationOpen`.
   */
  mobileNavigation?: boolean | "drawer";
  /** With `mobileNavigation="drawer"`: whether the drawer is open. */
  navigationOpen?: boolean;
  /** With `mobileNavigation="drawer"`: the drawer asks to open or close (Escape, the scrim, its close button). */
  onNavigationOpenChange?: (open: boolean) => void;
  /** The sidebar's accessible name. Default "Documentation". */
  navigationLabel?: string;
  /**
   * Sections fold: each heading is a button with the section's page count, the current page's
   * section opens, and sub-pages hang from a tree line. Default false (every section open).
   */
  collapsible?: boolean;
  /**
   * How the current place is marked, in the sidebar and in "On this page". "bar" (default): a bar
   * beside the link. "plane" or "mark" (the uipack square mark): a marker that travels a dotted
   * path to the current heading as the reader scrolls, and in the sidebar from the page the reader
   * came from to the current one, tinted with the section's hue.
   */
  marker?: "bar" | DocsMarkerShape;
  /**
   * A sessionStorage key under which the sidebar remembers the page being left, its open sections
   * and its scroll, so the next page's marker travels from there. Default: none (it docks in place).
   */
  markerMemory?: string;
  /** Search: a box at the top of the sidebar and a ⌘K / Ctrl-K dialog over the host's index. */
  search?: DocsSearchOptions;
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

const keyOf = (section: DocsSection) => section.id ?? section.title;

/** Every item, sub-pages included, in reading order. */
function flatItems(items: DocsNavItem[]): DocsNavItem[] {
  return items.flatMap((item) => [item, ...flatItems(item.items ?? [])]);
}

const hasHref = (section: DocsSection, href: string) => flatItems(section.items).some((item) => item.href === href);

/** A section's items cut where their caption changes. */
function captionRuns(items: DocsNavItem[]) {
  const runs: { caption?: string; items: DocsNavItem[] }[] = [];
  for (const item of items) {
    const last = runs[runs.length - 1];
    if (last && last.caption === item.group) last.items.push(item);
    else runs.push({ caption: item.group, items: [item] });
  }
  return runs;
}

const hueStyle = (hue: string | undefined) => (hue ? ({ "--docs-hue": hue } as CSSProperties) : undefined);
const inert = (on: boolean) => (on ? ({ inert: "" } as object) : {});

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

function Chevron() {
  return (
    <svg className="uipack-docs__nav-chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

interface SectionNavigationProps {
  sections: DocsSection[];
  activeHref: string;
  label: string;
  collapsible: boolean;
  marker: "bar" | DocsMarkerShape;
  memoryKey?: string;
  /** This copy plays the trip from the remembered page (the sidebar; the drawer and disclosure dock in place). */
  travels: boolean;
}

/**
 * The sections and their pages. Collapsible, a section's heading is a button with its page count;
 * the current section opens (and, after a page change, any the reader had open). With a travelling
 * marker, a decorative SVG over the left edge draws it and its trail.
 */
function SectionNavigation({ sections, activeHref, label, collapsible, marker, memoryKey, travels }: SectionNavigationProps) {
  const uid = useId();
  const navRef = useRef<HTMLElement>(null);
  const glyph = useRef<SVGGElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const activeSection = sections.find((s) => hasHref(s, activeHref));
  const activeKey = activeSection ? keyOf(activeSection) : undefined;
  const keys = sections.map(keyOf);

  // What the page being left remembered: the trip starts at its link, with its sections open.
  const [memory] = useState(() => (travels && marker !== "bar" ? readNavMemory(memoryKey) : null));
  const trip = memory && memory.href !== activeHref ? memory : null;
  const [open, setOpen] = useState<Set<string>>(() => {
    const set = new Set(memory ? memory.open.filter((k) => keys.includes(k)) : []);
    // The current section opens now, or, at the end of a trip into it, as the marker arrives.
    if (activeKey && (!trip || prefersReducedMotion())) set.add(activeKey);
    return set;
  });
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const flying = useRef(false);
  // A trip is about to start: the marker stays hidden until it sets off from the old page's link.
  const pending = useRef(!!trip && marker !== "bar");

  const remember = useCallback(() => {
    const scroller = navRef.current?.closest<HTMLElement>(".uipack-docs__sidebar");
    writeNavMemory(memoryKey, { href: activeHref, open: [...openRef.current], scroll: scroller?.scrollTop ?? 0 });
  }, [memoryKey, activeHref]);

  useEffect(() => {
    if (!memoryKey || !travels) return;
    addEventListener("pagehide", remember);
    return () => removeEventListener("pagehide", remember);
  }, [memoryKey, travels, remember]);

  // The sidebar opens where the reader left it.
  useIsoLayoutEffect(() => {
    if (!memory) return;
    const scroller = navRef.current?.closest<HTMLElement>(".uipack-docs__sidebar");
    if (scroller) scroller.scrollTop = memory.scroll;
  }, [memory]);

  /** Where the marker docks beside a link, in the nav's coordinates; a link in a closed section docks on nothing. */
  const dockOf = useCallback((a: HTMLAnchorElement | null): Point | null => {
    const nav = navRef.current;
    if (!nav || !a) return null;
    const top = nav.getBoundingClientRect().top;
    const r = a.getBoundingClientRect();
    return { x: a.closest(".uipack-docs__nav-sub") ? NAV_SUB_DOCK_X : NAV_DOCK_X, y: r.top - top + r.height / 2 };
  }, []);

  const draw = useCallback((x: number, y: number, deg: number, path = "") => {
    glyph.current?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(1)})`);
    trail.current?.setAttribute("d", path);
  }, []);

  /** Sizes the drawing to the nav and docks the marker beside the current link (hidden when its section is shut). */
  const dock = useCallback(() => {
    const nav = navRef.current;
    if (!nav || !svg.current || flying.current || !nav.offsetParent) return;
    if (pending.current) {
      svg.current.setAttribute("data-hidden", "");
      return;
    }
    svg.current.setAttribute("height", String(nav.scrollHeight));
    svg.current.setAttribute("viewBox", `0 0 64 ${nav.scrollHeight}`);
    const a = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    const shut = !a || !!a.closest(".uipack-docs__nav-section:not([data-open])");
    svg.current.toggleAttribute("data-hidden", shut);
    const p = dockOf(a);
    if (p && !shut) draw(p.x, p.y, 0);
  }, [dockOf, draw]);

  // Follow the layout: a section folding, wrapping, fonts arriving, the drawer opening.
  useIsoLayoutEffect(() => {
    if (marker === "bar") return;
    dock();
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => dock());
    observer.observe(nav);
    return () => observer.disconnect();
  }, [marker, dock, open]);

  // The trip: from the page the reader left to this one, opening this page's section on arrival.
  useEffect(() => {
    const nav = navRef.current;
    if (!trip || marker === "bar") return;
    pending.current = false;
    // No trip to play (hidden sidebar, reduced motion, the old page not in it): open and dock in place.
    const settleInPlace = () => {
      if (activeKey) setOpen((s) => (s.has(activeKey) ? s : new Set(s).add(activeKey)));
      dock();
    };
    if (!nav || !nav.offsetParent || prefersReducedMotion()) return settleInPlace();
    const esc = (s: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"'));
    const target = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    const old = nav.querySelector<HTMLAnchorElement>(`a[href="${esc(trip.href)}"]`);
    // From the old link, or from its section's heading if that section is shut.
    const oldShut = old?.closest(".uipack-docs__nav-section:not([data-open])");
    const oldHeading = oldShut?.querySelector(".uipack-docs__nav-heading")?.getBoundingClientRect();
    const from = oldHeading
      ? { x: NAV_DOCK_X, y: oldHeading.top - nav.getBoundingClientRect().top + oldHeading.height / 2 }
      : dockOf(old);
    const to = dockOf(target);
    if (!from || !to || !svg.current) return settleInPlace();
    // Bring the destination into view, so the reader sees it land: now, and again once its section
    // has opened (a shut section is too short to scroll to).
    const scroller = nav.closest<HTMLElement>(".uipack-docs__sidebar");
    const reveal = () => {
      if (!scroller || !target) return;
      const sr = scroller.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      if (tr.top < sr.top + 24 || tr.bottom > sr.bottom - 24)
        scroller.scrollTo({
          top: scroller.scrollTop + tr.top - sr.top - sr.height / 2,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    };
    reveal();
    // It leaves in the hue of the section it came from and takes on the new one on the way.
    const fromHue = old?.closest<HTMLElement>(".uipack-docs__nav-section")?.style.getPropertyValue("--docs-hue");
    const toHue = activeSection?.hue;
    if (fromHue && toHue && fromHue !== toHue) {
      svg.current.style.transition = "none";
      svg.current.style.setProperty("--docs-hue", fromHue);
      void svg.current.getBoundingClientRect();
      svg.current.style.transition = "";
      requestAnimationFrame(() => svg.current?.style.setProperty("--docs-hue", toHue));
    }
    let revealTimer = 0;
    const arriving = activeKey && !openRef.current.has(activeKey) ? activeKey : null;
    const heading = arriving
      ? nav.querySelector(`[data-nav-section="${esc(arriving)}"] .uipack-docs__nav-heading`)?.getBoundingClientRect()
      : null;
    const navTop = nav.getBoundingClientRect().top;
    const gate = heading ? (to.y >= from.y ? heading.top - navTop : heading.bottom - navTop) : null;
    let opened = !arriving;
    const openNow = () => {
      if (opened || !arriving) return;
      opened = true;
      setOpen((s) => new Set(s).add(arriving));
      revealTimer = window.setTimeout(reveal, 300);
    };
    flying.current = true;
    svg.current.removeAttribute("data-hidden");
    svg.current.setAttribute("data-flying", "");
    const cancel = flyNavMarker(
      navRoute(from, to),
      marker,
      draw,
      () => {
        flying.current = false;
        openNow();
        svg.current?.removeAttribute("data-flying");
        dock();
      },
      (y) => {
        if (gate !== null && (to.y >= from.y ? y >= gate : y <= gate)) openNow();
      },
    );
    const track = svg.current;
    return () => {
      cancel();
      clearTimeout(revealTimer);
      flying.current = false;
      track.removeAttribute("data-flying");
    };
    // Once per page: the trip is fixed by the remembered page and this one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const travelling = marker !== "bar";
  return (
    <nav
      ref={navRef}
      className="uipack-docs__navigation"
      aria-label={label}
      data-collapsible={collapsible ? "" : undefined}
      data-marker={travelling ? marker : undefined}
      onClick={(e) => {
        if ((e.target as Element).closest("a[href]")) remember();
      }}
    >
      {travelling && (
        <svg
          ref={svg}
          className="uipack-docs__nav-track"
          aria-hidden="true"
          focusable="false"
          style={hueStyle(activeSection?.hue)}
          data-hidden=""
        >
          <path ref={trail} className="uipack-docs__nav-trail" />
          <g ref={glyph} className="uipack-docs__marker">
            <MarkerGlyph shape={marker} />
          </g>
        </svg>
      )}
      {sections.map((section) => {
        const key = keyOf(section);
        const isOpen = !collapsible || open.has(key);
        const bodyId = `${uid}-${key.replace(/\W+/g, "-")}`;
        const count = flatItems(section.items).length;
        const runs = captionRuns(section.items).map((run, i) => (
          <div className="uipack-docs__nav-group" key={`${run.caption ?? ""}-${i}`}>
            {run.caption && <p className="uipack-docs__nav-caption">{run.caption}</p>}
            <ul>
              {run.items.map((item) => (
                <NavigationItem key={item.href} item={item} activeHref={activeHref} />
              ))}
            </ul>
          </div>
        ));
        return (
          <section
            className="uipack-docs__nav-section"
            key={key}
            data-nav-section={key}
            data-open={isOpen ? "" : undefined}
            style={hueStyle(section.hue)}
          >
            {collapsible ? (
              <>
                <h2 className="uipack-docs__nav-heading">
                  <button type="button" aria-expanded={isOpen} aria-controls={bodyId} onClick={() => toggle(key)}>
                    {section.icon && (
                      <span className="uipack-docs__nav-icon" aria-hidden="true">
                        {section.icon}
                      </span>
                    )}
                    <span className="uipack-docs__nav-label">{section.title}</span>
                    <span className="uipack-docs__nav-count" aria-hidden="true">
                      {count}
                    </span>
                    <Chevron />
                  </button>
                </h2>
                <div className="uipack-docs__nav-body" id={bodyId} {...inert(!isOpen)}>
                  <div>
                    <div className="uipack-docs__nav-inner">{runs}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="uipack-docs__nav-heading">
                  {section.icon && (
                    <span className="uipack-docs__nav-icon" aria-hidden="true">
                      {section.icon}
                    </span>
                  )}
                  {section.title}
                </h2>
                {runs}
              </>
            )}
          </section>
        );
      })}
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

/**
 * A heading picked in "On this page" stays current while the page scrolls to it and after, until
 * the reader scrolls on (the last headings can never reach the reading line).
 */
function usePickedHeading() {
  const [picked, setPicked] = useState<string | null>(null);
  const settle = useRef({ timer: 0, at: null as number | null, scrolling: false, id: "" });
  /** Lands exactly on the heading when the smooth scroll ends: content above it may have grown meanwhile (lazy demos, faces). */
  const land = useCallback(() => {
    const s = settle.current;
    clearTimeout(s.timer);
    const heading = document.getElementById(s.id);
    if (heading) {
      const margin = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
      const off = heading.getBoundingClientRect().top - margin;
      const room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      if (Math.abs(off) > 2 && (off < 0 || room > 2))
        heading.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
    }
    s.scrolling = false;
    s.at = window.scrollY;
  }, []);
  useEffect(() => {
    if (!picked) return;
    const s = settle.current;
    const done = () => {
      if (s.scrolling) land();
    };
    const onScroll = () => {
      if (s.scrolling || s.at === null) return;
      if (Math.abs(window.scrollY - s.at) >= 6) setPicked(null);
    };
    addEventListener("scrollend", done);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scrollend", done);
      removeEventListener("scroll", onScroll);
    };
  }, [picked, land]);
  const pick = useCallback(
    (id: string, event: MouseEvent<HTMLAnchorElement>) => {
      const heading = document.getElementById(id);
      if (!heading || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      const s = settle.current;
      s.scrolling = true;
      s.at = null;
      s.id = id;
      clearTimeout(s.timer);
      // No scrollend (Safari before 26, or no scroll at all): land after the longest smooth scroll.
      s.timer = window.setTimeout(land, 1400);
      setPicked(id);
      heading.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      history.replaceState(history.state, "", `#${id}`);
    },
    [land],
  );
  return [picked, pick] as const;
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
  navigationOpen = false,
  onNavigationOpenChange,
  navigationLabel = "Documentation",
  collapsible = false,
  marker = "bar",
  markerMemory,
  search,
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
  const spied = useCurrentSection(onThisPage.map((item) => item.id));
  const [picked, pick] = usePickedHeading();
  const travelling = marker !== "bar";
  // A travelling marker always rests somewhere: on the first heading until the reader passes one.
  const currentSection = picked ?? spied ?? (travelling ? (onThisPage[0]?.id ?? null) : null);
  const current = flatItems(sections.flatMap((section) => section.items)).find((item) => item.href === activeHref);
  const currentHeading = onThisPage.find((item) => item.id === currentSection);
  const Article = landmark;
  const drawer = useRef<HTMLDialogElement>(null);
  const contents = useRef<HTMLDetailsElement>(null);
  const [searching, setSearching] = useState(false);

  // The drawer is a modal dialog: focus moves in and stays, Escape and the scrim close it, and the
  // page behind it holds still until it closes.
  useEffect(() => {
    const el = drawer.current;
    if (!el) return;
    if (navigationOpen && !el.open) el.showModal();
    else if (!navigationOpen && el.open) el.close();
    if (!navigationOpen) return;
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = was;
    };
  }, [navigationOpen]);

  // ⌘K / Ctrl-K opens search from anywhere on the page.
  useEffect(() => {
    if (!search) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [search]);

  const searchButton = search && <DocsSearchButton placeholder={search.placeholder} onOpen={() => setSearching(true)} />;
  const navProps = { sections, activeHref, label: navigationLabel, collapsible, marker, memoryKey: markerMemory };
  const pickHeading = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (contents.current) contents.current.open = false;
    pick(id, event);
  };

  return (
    <div
      className="uipack-docs"
      data-theme={theme}
      data-palette={palette}
      data-width={width === "wide" ? "wide" : undefined}
      data-marker={travelling ? marker : undefined}
      data-mobile-navigation={mobileNavigation === "drawer" ? "drawer" : undefined}
    >
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
      {mobileNavigation === true && (
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
            <SectionNavigation {...navProps} marker="bar" travels={false} />
          </div>
        </details>
      )}

      {mobileNavigation === "drawer" && (
        <dialog
          ref={drawer}
          className="uipack-docs__drawer"
          aria-label={`${navigationLabel} menu`}
          onClose={() => onNavigationOpenChange?.(false)}
          onCancel={(e) => {
            e.preventDefault();
            onNavigationOpenChange?.(false);
          }}
          onClick={(e) => {
            if (e.target === drawer.current) onNavigationOpenChange?.(false);
          }}
          // Tab cycles the drawer's own controls, never the dialog box or the browser's toolbar.
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const items = [...(drawer.current?.querySelectorAll<HTMLElement>("a[href], button") ?? [])].filter(
              (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
            );
            const first = items[0];
            const last = items[items.length - 1];
            if (!first || !last) return;
            const at = document.activeElement;
            if (e.shiftKey ? at === first || at === drawer.current : at === last) {
              e.preventDefault();
              (e.shiftKey ? last : first).focus();
            }
          }}
        >
          <div className="uipack-docs__drawer-head">
            <span>{docsTitle === "Product docs" ? "Docs" : docsTitle}</span>
            <button type="button" aria-label="Close navigation" onClick={() => onNavigationOpenChange?.(false)}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {searchButton}
          {navigationOpen && <SectionNavigation {...navProps} travels={false} />}
        </dialog>
      )}

      <div className="uipack-docs__grid" data-toc={onThisPage.length > 0 ? undefined : "none"}>
        <aside className="uipack-docs__sidebar">
          {searchButton}
          <SectionNavigation {...navProps} travels />
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
          {/* "On this page" as a disclosure where the contents column has no room (docs.css). */}
          {onThisPage.length > 0 && (
            <details className="uipack-docs__contents" ref={contents}>
              <summary>
                <svg className="uipack-docs__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M4 6l4 4 4-4" />
                </svg>
                <span>On this page</span>
                {currentHeading && <small>{currentHeading.title}</small>}
              </summary>
              <ol>
                {onThisPage.map((item) => (
                  <li key={item.id} data-level={item.level}>
                    <a
                      href={`#${item.id}`}
                      aria-current={item.id === currentSection ? "location" : undefined}
                      onClick={(event) => pickHeading(item.id, event)}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
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
            {travelling ? (
              <ContentsRail items={onThisPage} current={currentSection} shape={marker} onPick={pick} />
            ) : (
              <ol>
                {onThisPage.map((item) => (
                  <li key={item.id} data-level={item.level}>
                    <a href={`#${item.id}`} aria-current={item.id === currentSection ? "location" : undefined}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        )}
      </div>

      {search && (
        <DocsSearchDialog
          open={searching}
          onClose={() => setSearching(false)}
          options={search}
          sections={sections.map((s) => ({ id: keyOf(s), title: s.title, icon: s.icon, hue: s.hue }))}
        />
      )}
    </div>
  );
}
