/**
 * The styles UI Pack ships, one value set each in src/styles (docs/system/style.md). A component's
 * `style` prop sets `data-ui-style` on its root; omitted, it follows the nearest ancestor that
 * sets one, else Technical. A swap changes tokens only: the same regions, boxes and reading order.
 */
export type UiStyleId = "technical" | "landing" | "graphical";

export interface UiStyleMeta {
  id: UiStyleId;
  name: string;
  /** One line: what it is for. */
  summary: string;
  /** Self-hosted faces the style fetches on /web (uipack/fonts/*), as measured by Lighthouse. */
  fonts: readonly string[];
  /** The display face to preload for a hero headline, if any (fontPreloads). */
  preload: readonly string[];
  /**
   * The web section sequence the style recommends for the same content (research brief: order is
   * part of a look). A recommendation only: every style renders every layout.
   */
  prefers: readonly string[];
  /**
   * The layout defaults the style recommends, applied by `WebPage` (layout="style") and by the
   * style's layout CSS: what fills the hero's proof slot, how the hero and section heads align,
   * and whether steps are cards or numbered rows. A recommendation only: layout="shared" renders
   * every style on the same layout.
   */
  layout: { hero: "demo" | "figure"; align: "center" | "start"; steps: "cards" | "rows" };
}

export const uiStyles: readonly UiStyleMeta[] = [
  {
    id: "technical",
    name: "Technical",
    summary: "Diagram-led: warm paper, ink, one forest accent, thin rules, 6px radius, a dotted grid.",
    fonts: [
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2",
    ],
    preload: [],
    prefers: ["hero", "how", "demo", "proof", "faq", "pricing"],
    layout: { hero: "figure", align: "start", steps: "rows" },
  },
  {
    id: "landing",
    name: "Landing",
    summary: "The generic landing page: lavender band, indigo CTA, editorial serif headlines, glass and grain.",
    fonts: [
      "instrument-serif-latin-400-normal.woff2",
      "instrument-serif-latin-400-italic.woff2",
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2",
    ],
    preload: ["instrument-serif-latin-400-normal.woff2", "instrument-serif-latin-400-italic.woff2"],
    prefers: ["hero", "how", "mechanism", "proof", "faq", "pricing"],
    layout: { hero: "demo", align: "center", steps: "cards" },
  },
  {
    id: "graphical",
    name: "Graphical",
    summary: "Poster: bone paper, black ink, one signal-orange accent, condensed display caps, hard edges, one disc motif.",
    fonts: [
      "anton-latin-400-normal.woff2",
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2",
    ],
    preload: ["anton-latin-400-normal.woff2"],
    prefers: ["hero", "proof", "how", "mechanism", "pricing", "faq"],
    layout: { hero: "demo", align: "center", steps: "cards" },
  },
];

/** The section order every style renders when the layout is shared (the swap test's order). */
export const sharedSectionOrder = ["hero", "how", "mechanism", "proof", "faq", "pricing"] as const;

/**
 * The ids to render, in order: the style's recommended sequence (layout "style") or the shared
 * one, keeping only ids the page provides.
 */
export function sectionOrder(style: UiStyleId, available: readonly string[], layout: "style" | "shared" = "style"): string[] {
  const wanted = layout === "shared" ? sharedSectionOrder : uiStyles.find((s) => s.id === style)!.prefers;
  return wanted.filter((id) => available.includes(id));
}

export const isUiStyle = (value: unknown): value is UiStyleId => uiStyles.some((s) => s.id === value);

/**
 * A blocking inline script for <head> that sets `data-ui-style` and `data-ui-theme` on <html>
 * before the first paint, from a URL parameter, then localStorage, then the default. Put its
 * output in a <script> before any stylesheet so the page never flashes another style.
 */
export function styleBootScript({
  param = "style",
  themeParam = "theme",
  storageKey = "uipack-style",
  fallback = "technical",
}: { param?: string; themeParam?: string; storageKey?: string; fallback?: UiStyleId } = {}): string {
  const ids = JSON.stringify(uiStyles.map((s) => s.id));
  return (
    `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,ids=${ids},` +
    `s=q.get(${JSON.stringify(param)})||localStorage.getItem(${JSON.stringify(storageKey)});` +
    `if(ids.indexOf(s)<0)s=${JSON.stringify(fallback)};d.setAttribute("data-ui-style",s);` +
    `var t=q.get(${JSON.stringify(themeParam)});if(t==="light"||t==="dark")d.setAttribute("data-ui-theme",t)}catch(e){}})();`
  );
}
