import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useIsoLayoutEffect } from "../env";
import type { DocsNavItem, DocsSection } from "./DocsLayout";
import {
  flyNavMarker,
  MarkerGlyph,
  markerTransform,
  NAV_DOCK_X,
  NAV_SUB_DOCK_X,
  navRoute,
  navTripDuration,
  prefersReducedMotion,
  readNavMemory,
  writeNavMemory,
  type DocsMarkerCell,
  type DocsMarkerShape,
  type Point,
} from "./DocsMarkers";

/**
 * The docs layout's sidebar: its sections and their pages, folding when collapsible, with the
 * travelling marker's track. DocsLayout renders it in the sidebar, the drawer and the disclosure.
 */

const keyOf = (section: DocsSection) => section.id ?? section.title;

/** Every item, sub-pages included, in reading order. */
export function flatItems(items: DocsNavItem[]): DocsNavItem[] {
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
/** The marker's track: its section's hue and, when the host sets one, the mark's dot colour. */
const trackStyle = (hue: string | undefined, dot: string | undefined) =>
  ({ ...(hue ? { "--docs-hue": hue } : {}), ...(dot ? { "--docs-marker-dot": dot } : {}) }) as CSSProperties;
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

export interface SectionNavigationProps {
  sections: DocsSection[];
  activeHref: string;
  label: string;
  collapsible: boolean;
  marker: "bar" | DocsMarkerShape;
  /** The mark's live cell and its dot's colour (DocsLayout's `markerLive` and `markerColor`). */
  live?: DocsMarkerCell;
  dot?: string;
  memoryKey?: string;
  /** The marker sets off on a trip that lands in `ms` (DocsLayout's `onMarkerTrip`). */
  onTrip?: (ms: number) => void;
  /** This copy plays the trip from the remembered page (the sidebar; the drawer and disclosure dock in place). */
  travels: boolean;
}

/**
 * The sections and their pages. Collapsible, a section's heading is a button with its page count;
 * the current section opens (and, after a page change, any the reader had open). With a travelling
 * marker, a decorative SVG over the left edge draws it and its trail.
 */
export function SectionNavigation({
  sections,
  activeHref,
  label,
  collapsible,
  marker,
  live,
  dot,
  memoryKey,
  onTrip,
  travels,
}: SectionNavigationProps) {
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
  // Until the trip's last stretch the marker is drawn as it was on the page being left: that
  // section's hue, and the mark's dot on that page's cell in its colour.
  const [leaving, setLeaving] = useState(() => !!trip && marker !== "bar" && !prefersReducedMotion());
  const leftSection = leaving && trip ? sections.find((s) => hasHref(s, trip.href)) : undefined;
  const shown =
    leaving && trip ? { hue: leftSection?.hue ?? activeSection?.hue, live: trip.live ?? live, dot: trip.dot ?? dot } : null;

  const remember = useCallback(() => {
    const scroller = navRef.current?.closest<HTMLElement>(".uipack-docs__sidebar");
    writeNavMemory(memoryKey, { href: activeHref, open: [...openRef.current], scroll: scroller?.scrollTop ?? 0, live, dot });
  }, [memoryKey, activeHref, live, dot]);

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

  const draw = useCallback((x: number, y: number, deg: number, path = "", sx = 1, sy = 1) => {
    glyph.current?.setAttribute("transform", markerTransform(x, y, deg, sx, sy));
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
      setLeaving(false);
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
    const route = navRoute(from, to);
    onTrip?.(navTripDuration(route));
    // The plane takes on the new section's hue on the way; the mark changes as its last hop lifts.
    const arrive = () => setLeaving(false);
    const hueFrame = marker === "plane" ? requestAnimationFrame(arrive) : 0;
    const cancel = flyNavMarker(
      route,
      marker,
      draw,
      () => {
        flying.current = false;
        openNow();
        arrive();
        svg.current?.removeAttribute("data-flying");
        dock();
      },
      (y) => {
        if (gate !== null && (to.y >= from.y ? y >= gate : y <= gate)) openNow();
      },
      arrive,
    );
    const track = svg.current;
    return () => {
      cancel();
      cancelAnimationFrame(hueFrame);
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
          style={trackStyle(shown ? shown.hue : activeSection?.hue, shown ? shown.dot : dot)}
          data-hidden=""
        >
          <path ref={trail} className="uipack-docs__nav-trail" />
          <g ref={glyph} className="uipack-docs__marker">
            <MarkerGlyph shape={marker} live={shown ? shown.live : live} />
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
