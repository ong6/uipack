import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import type { MarkCell } from "../src";
import { isMarkerMorph, isMarkerShape, type DocsMarkerMorph, type DocsMarkerShape } from "../src/docs/DocsMarkers";
import type { DocsSectionId } from "./docs-manifest";

/**
 * The docs site's settings (its spec, docs/specs/docs-site.md, "Navigation"): the location marker's
 * shape, used by the sidebar and by "On this page", and each section's icon. The site's marker is
 * the uipack mark, hopping; `?marker=plane` (the package's paper plane) or `?marker=mark` overrides
 * the shape for the rest of the visit (sessionStorage), so the two can be compared live.
 */
export const SITE_MARKER: DocsMarkerShape = "mark";

const MARKER_KEY = "uipack-docs-marker";

/** The marker for this page load: the query's, else the one remembered this visit, else the site's. */
export function markerSetting(search = location.search): DocsMarkerShape {
  const asked = new URLSearchParams(search).get("marker");
  try {
    if (isMarkerShape(asked)) sessionStorage.setItem(MARKER_KEY, asked);
    const kept = sessionStorage.getItem(MARKER_KEY);
    return isMarkerShape(kept) ? kept : SITE_MARKER;
  } catch {
    return isMarkerShape(asked) ? asked : SITE_MARKER;
  }
}

/**
 * How the mark changes between sections (the docs layout's `markerMorph`). The site's is "none"
 * until the owner picks one; `?morph=pause`, `?morph=portal` or `?morph=flip` shows that option for
 * the rest of the visit, `?morph=none` goes back.
 */
export const SITE_MORPH: DocsMarkerMorph = "none";

const MORPH_KEY = "uipack-docs-morph";

export function morphSetting(search = location.search): DocsMarkerMorph {
  const asked = new URLSearchParams(search).get("morph");
  try {
    if (isMarkerMorph(asked)) sessionStorage.setItem(MORPH_KEY, asked);
    const kept = sessionStorage.getItem(MORPH_KEY);
    return isMarkerMorph(kept) ? kept : SITE_MORPH;
  } catch {
    return isMarkerMorph(asked) ? asked : SITE_MORPH;
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

const brandCell = (state: BrandState): MarkCell | undefined => (state === NEUTRAL ? undefined : BRAND_CELLS[state]);
/** The dot's colour in a state: the section's hue, or the ink on the neutral mark. */
const brandHue = (state: BrandState) => (brandCell(state) === undefined ? "currentColor" : sectionHue(state as DocsSectionId));

/**
 * The mark's state for a page, for the docs layout's own marker (`markerLive`, `markerColor`): the
 * same cell and colour the header's mark shows, so the sidebar and "On this page" carry the logo
 * in the page's section state.
 */
export function markerState(section: DocsSectionId | undefined): { live: MarkCell; color: string } {
  const cell = section ? BRAND_CELLS[section] : undefined;
  return cell === undefined ? { live: 3, color: "var(--ui-ink)" } : { live: cell, color: sectionHue(section!) };
}

/** The name of the keyframes whose end lands the header mark's hop (showcase.css). */
const BRAND_HOP = "showcase-brand-lift";

/**
 * Which state the header mark shows: the page's section, or neutral. Every page is its own load, so
 * the state the reader left is kept for the visit (sessionStorage): the mark is first drawn there,
 * then its dot hops to this page's cell (showcase.css plays the hop on the anchor `props` go on;
 * the state changes as it lands, and the cell it left redraws as a square). The hop waits for the
 * page to settle, and for the sidebar marker when it is travelling (`onMarkerTrip`, the docs
 * layout's prop), so the two land together. With reduced motion, with nothing remembered, or with
 * `hop` off (the landing page, whose mark loops), it is drawn in place.
 */
export function useBrandMark(
  section: DocsSectionId | undefined,
  { hop = true }: { hop?: boolean } = {},
): {
  state: BrandState;
  live: MarkCell;
  liveColor: string | undefined;
  /** For the brand's anchor: the state drawn, the hop in flight and the cell just left. */
  props: AnchorHTMLAttributes<HTMLAnchorElement> & { ref: RefObject<HTMLAnchorElement> } & Record<`data-${string}`, unknown>;
  onMarkerTrip: (ms: number) => void;
} {
  const now: BrandState = section && section in BRAND_CELLS ? section : NEUTRAL;
  const [state, setState] = useState<BrandState>(() => {
    try {
      const left = sessionStorage.getItem(BRAND_KEY);
      const known = left === NEUTRAL || (left !== null && left in BRAND_CELLS);
      if (hop && known && !matchMedia("(prefers-reduced-motion: reduce)").matches) return left as BrandState;
    } catch {
      /* no storage: drawn in place */
    }
    return now;
  });
  // The sidebar marker's trip, in ms, when it is travelling (its effect runs before this hook's).
  const trip = useRef(0);
  const onMarkerTrip = useCallback((ms: number) => {
    trip.current = ms;
  }, []);
  const [hopping, setHopping] = useState<{ trip: number } | null>(null);
  const [left, setLeft] = useState<MarkCell | null>(null);
  const land = useCallback(() => {
    setHopping(null);
    setState((was) => {
      if (was !== now) setLeft(brandCell(was) ?? 3);
      return now;
    });
  }, [now]);
  useEffect(() => {
    try {
      sessionStorage.setItem(BRAND_KEY, now);
    } catch {
      /* no storage */
    }
    if (state !== now) setHopping({ trip: trip.current });
    // Once per page: the hop is fixed by the remembered state and this page's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);
  // The hop's end lands it (`onAnimationEnd`); with no hop to play (no stylesheet, no CSS
  // animations) it lands at once.
  const anchor = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!hopping) return;
    const playing = anchor.current?.getAnimations?.({ subtree: true }) ?? [];
    if (!playing.some((a) => (a as CSSAnimation).animationName === BRAND_HOP)) land();
  }, [hopping, land]);
  const cell = brandCell(state);
  const from = cell ?? 3;
  const to = brandCell(now) ?? 3;
  return {
    state,
    live: from,
    liveColor: cell === undefined ? undefined : sectionHue(state as DocsSectionId),
    props: {
      ref: anchor,
      "data-brand": state,
      "data-brand-hop": hopping ? "" : undefined,
      "data-brand-to": hopping ? to : undefined,
      "data-brand-left": left ?? undefined,
      style: hopping
        ? ({
            // In cells: showcase.css turns them into the mark's units.
            "--brand-hop-x": (to % 2) - (from % 2),
            "--brand-hop-y": (to >> 1) - (from >> 1),
            "--brand-hop-hue": brandHue(now),
            "--brand-trip": `${hopping.trip}ms`,
          } as CSSProperties)
        : undefined,
      onAnimationEnd: (event: AnimationEvent) => {
        if (event.animationName === BRAND_HOP) land();
      },
    },
    onMarkerTrip,
  };
}

/** A section's hue as `--docs-hue` on an element, the name the docs layout and the site's CSS read it by. */
export const sectionHueStyle = (id: DocsSectionId) => ({ "--docs-hue": sectionHue(id) }) as CSSProperties;

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
