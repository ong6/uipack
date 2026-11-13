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
import { isMarkerShape, useActivated, type DocsMarkerMorph, type DocsMarkerShape } from "../src/docs/DocsMarkers";
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

/** How the mark changes between sections (the docs layout's `markerMorph`): in a portal (owner, 2026-11-12). */
export const SITE_MORPH: DocsMarkerMorph = "portal";

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

/** The keyframes of the header mark's portal (showcase.css): into the ring, and back out. */
const PORTAL_IN = "showcase-brand-portal-in";
const PORTAL_OUT = "showcase-brand-portal-out";
/** The portal's first half, in ms (the base duration role): the mark changes as it ends. */
const PORTAL_HALF = 320;

/**
 * Which state the header mark shows: the page's section, or neutral. Every page is its own load, so
 * the state the reader left is kept for the visit (sessionStorage): the mark is first drawn there,
 * then changes to this page's in a portal (showcase.css plays it on the anchor `props` go on: the
 * mark turns into a ring, the state changes while it is out of sight, and it comes back out). The
 * portal opens once the page's first paint is in (`--site-mark-wait`, showcase.css), or, when the
 * sidebar marker reaches its own portal sooner (`onMarkerTrip`, the docs layout's prop), with that,
 * so the two change together; it never waits longer than that, however far the sidebar's marker has
 * to travel. A prerendered page (index.html's speculation rules) starts it when the reader sees the
 * page, and keeps its state for the visit then: what it writes before that is thrown away. With
 * reduced motion, with nothing remembered, or with `hop` off (the landing page, whose mark loops),
 * it is drawn in place.
 */
export function useBrandMark(
  section: DocsSectionId | undefined,
  { hop = true }: { hop?: boolean } = {},
): {
  state: BrandState;
  live: MarkCell;
  liveColor: string | undefined;
  /** For the brand's anchor: the state drawn and the portal's half in play. */
  props: AnchorHTMLAttributes<HTMLAnchorElement> & { ref: RefObject<HTMLAnchorElement> } & Record<`data-${string}`, unknown>;
  onMarkerTrip: (ms: number, changeAt?: number) => void;
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
  // When the sidebar marker changes in its portal, in ms (its effect runs before this hook's).
  const changeAt = useRef<number | undefined>(undefined);
  const onMarkerTrip = useCallback((_ms: number, at?: number) => {
    changeAt.current = at;
  }, []);
  const [portal, setPortal] = useState<{ half: "in" | "out"; wait?: number } | null>(null);
  const activated = useActivated();
  useEffect(() => {
    if (!activated) return;
    try {
      sessionStorage.setItem(BRAND_KEY, now);
    } catch {
      /* no storage */
    }
    if (state !== now)
      setPortal({ half: "in", wait: changeAt.current === undefined ? undefined : Math.max(0, changeAt.current - PORTAL_HALF) });
    // Once per page, when the reader sees it: the change is fixed by the remembered state and this page's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, activated]);
  // Each half's end moves it on (`onAnimationEnd`); with nothing to play (no stylesheet, no CSS
  // animations) it changes at once.
  const anchor = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!portal) return;
    const playing = anchor.current?.getAnimations?.({ subtree: true }) ?? [];
    const name = portal.half === "in" ? PORTAL_IN : PORTAL_OUT;
    if (playing.some((a) => (a as CSSAnimation).animationName === name)) return;
    setState(now);
    setPortal(null);
  }, [portal, now]);
  const cell = brandCell(state);
  return {
    state,
    live: cell ?? 3,
    liveColor: cell === undefined ? undefined : sectionHue(state as DocsSectionId),
    props: {
      ref: anchor,
      "data-brand": state,
      "data-brand-hop": portal?.half,
      style: portal
        ? ({
            "--brand-hop-hue": brandHue(now),
            // The sidebar's portal when it comes within the settle, else the settle: one clock.
            ...(portal.wait === undefined ? null : { "--brand-hop-wait": `min(${portal.wait}ms, var(--site-mark-wait))` }),
          } as CSSProperties)
        : undefined,
      onAnimationEnd: (event: AnimationEvent) => {
        if (event.animationName === PORTAL_IN) {
          setState(now);
          setPortal({ half: "out" });
        } else if (event.animationName === PORTAL_OUT) setPortal(null);
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
