import { useEffect, useState, type ReactNode } from "react";
import type { MarkCell } from "../src";
import type { DocsMarkerShape } from "../src/docs";
import type { DocsSectionId } from "./docs-manifest";

/**
 * The docs site's settings (its spec, docs/specs/docs-site.md, "Navigation"): the location marker's
 * shape, used by the sidebar and by "On this page", and each section's icon. `?marker=mark` or
 * `?marker=plane` overrides the shape for the rest of the visit (sessionStorage), so the two can be
 * compared live; the default is the site's.
 */
export const SITE_MARKER: DocsMarkerShape = "plane";

const MARKER_KEY = "uipack-docs-marker";

/** The marker for this page load: the query's, else the one remembered this visit, else the site's. */
export function markerSetting(search = location.search): DocsMarkerShape {
  const asked = new URLSearchParams(search).get("marker");
  const valid = (v: unknown): v is DocsMarkerShape => v === "plane" || v === "mark";
  try {
    if (valid(asked)) sessionStorage.setItem(MARKER_KEY, asked);
    const kept = sessionStorage.getItem(MARKER_KEY);
    return valid(kept) ? kept : SITE_MARKER;
  } catch {
    return valid(asked) ? asked : SITE_MARKER;
  }
}

/** The sessionStorage key the sidebar keeps the page being left under, so the next page's marker travels from it. */
export const NAV_MEMORY_KEY = "uipack-docs-nav";

/** Each section's hue, a role the site's palette sets (site-palette.css). */
export const sectionHue = (id: DocsSectionId) => `var(--site-hue-${id})`;

/**
 * The header mark's cell for each section (the spec's "The mark"): the mark's four cells in reading
 * order are Start, Rules, Build and Check. Reference has no cell: its pages, the Assets tab, the
 * landing page and a not-found page show the mark as the package draws it, the dot bottom right in
 * the ink.
 */
export const BRAND_CELLS: Partial<Record<DocsSectionId, MarkCell>> = { start: 0, rules: 1, build: 2, check: 3 };

const BRAND_KEY = "uipack-docs-brand";
const NEUTRAL = "neutral";
type BrandState = DocsSectionId | typeof NEUTRAL;

/**
 * Which state the header mark shows: the page's section, or neutral. Every page is its own load, so
 * the state the reader left is kept for the visit (sessionStorage): the mark is first drawn there,
 * then set to this page's, and the dot's CSS transition (showcase.css) carries it across. With
 * reduced motion, or with nothing remembered, it is drawn in place.
 */
export function useBrandMark(section: DocsSectionId | undefined): {
  state: BrandState;
  live: MarkCell;
  liveColor: string | undefined;
} {
  const now: BrandState = section && section in BRAND_CELLS ? section : NEUTRAL;
  const [state, setState] = useState<BrandState>(() => {
    try {
      const left = sessionStorage.getItem(BRAND_KEY);
      const known = left === NEUTRAL || (left !== null && left in BRAND_CELLS);
      if (known && !matchMedia("(prefers-reduced-motion: reduce)").matches) return left as BrandState;
    } catch {
      /* no storage: drawn in place */
    }
    return now;
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(BRAND_KEY, now);
    } catch {
      /* no storage */
    }
    // Two frames, so the state the reader left is painted before the dot moves.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setState(now));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [now]);
  const cell = state === NEUTRAL ? undefined : BRAND_CELLS[state];
  return { state, live: cell ?? 3, liveColor: cell === undefined ? undefined : sectionHue(state as DocsSectionId) };
}

/** Each section's icon: 24-unit line drawings, stroked in the section's hue by the docs layout. */
const ICON_PATHS: Record<DocsSectionId, ReactNode> = {
  start: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10.2 8.6 15.4 12l-5.2 3.4z" />
    </>
  ),
  rules: (
    <>
      <path d="M4.5 19.5v-15l15 15z" />
      <path d="M8.5 15.5v-4.2l4.2 4.2z" />
      <path d="M4.5 9h2M4.5 13h2" />
    </>
  ),
  build: (
    <>
      <path d="M12 3.2 19.6 7.5v9L12 20.8l-7.6-4.3v-9z" />
      <path d="M12 12l7.6-4.5M12 12v8.8M12 12 4.4 7.5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.4 12.3 2.6 2.6 4.8-5.2" />
    </>
  ),
  reference: (
    <>
      <path d="M5 18.5V5.5A2 2 0 0 1 7 3.5h12v13H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12" />
      <path d="M9 7.5h6" />
    </>
  ),
};

export function SectionIcon({ id, size = 15 }: { id: DocsSectionId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className="site-section-icon">
      {ICON_PATHS[id]}
    </svg>
  );
}
