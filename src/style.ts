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
   * A section sequence the style would pick for itself. Opt-in only (`WebPage layout="style"`):
   * by default a page keeps its author's order in every style, so a swap never moves a section.
   */
  prefers: readonly string[];
  /**
   * Layout defaults the style would pick for itself (what fills the hero's proof slot, alignment,
   * cards or numbered rows). Opt-in only, like `prefers`: the default layout is shared by every style.
   */
  layout: { hero: "demo" | "figure"; align: "center" | "start"; steps: "cards" | "rows" };
}

export const uiStyles: readonly UiStyleMeta[] = [
  {
    id: "technical",
    name: "Technical",
    summary: "Diagram-led blueprint: Prussian-blue ink, one amber mark, square hairlines, a drafting grid.",
    fonts: [
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2",
    ],
    preload: ["ibm-plex-sans-latin-600-normal.woff2"],
    prefers: ["hero", "how", "demo", "proof", "faq", "pricing"],
    layout: { hero: "figure", align: "start", steps: "rows" },
  },
  {
    id: "landing",
    name: "Landing",
    summary:
      "Product marketing in label stock: warm ivory and kraft, one ledger-green accent, editorial serif headlines, ruled forms with perforated divisions, no shadows.",
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
    summary:
      "Poster: bone paper, black ink, one signal-orange accent, condensed display caps, hard edges, one disc motif (the hero stamp).",
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

/** A conventional section order for a landing page, for pages that want a starting point. */
export const sharedSectionOrder = ["hero", "how", "mechanism", "proof", "faq", "pricing"] as const;

/**
 * The ids to render, in order. Shared (the default): the page's own order, the same in every
 * style. "style" (opt-in): the style's `prefers` sequence, keeping only ids the page provides,
 * then any the sequence does not name, in the page's order, so no section is ever dropped.
 */
export function sectionOrder(style: UiStyleId, available: readonly string[], layout: "style" | "shared" = "shared"): string[] {
  if (layout === "shared") return [...available];
  const wanted = uiStyles.find((s) => s.id === style)!.prefers.filter((id) => available.includes(id));
  return [...wanted, ...available.filter((id) => !wanted.includes(id))];
}

export const isUiStyle = (value: unknown): value is UiStyleId => uiStyles.some((s) => s.id === value);

/**
 * A blocking inline script for <head> that sets the style and the theme on <html> before the first
 * paint, so the page never flashes another style or theme. Put its output in a <script> before any
 * stylesheet.
 *
 * Style: `?style=` (a style id, or a key of `aliases`, e.g. `{ "1": "technical" }`), then
 * localStorage, then `fallback`; written to `data-ui-style`.
 * Theme: `?theme=light|dark`, then localStorage (`themeStorageKey`), else nothing, so the page
 * follows the system (`prefers-color-scheme`); `?theme=system` clears a stored choice. Written to
 * both `data-theme` (read by uipack/web and the figures) and `data-ui-theme` (the role layer).
 */
export function styleBootScript({
  param = "style",
  themeParam = "theme",
  storageKey = "uipack-style",
  themeStorageKey = "uipack-theme",
  fallback = "technical",
  aliases = {},
}: {
  param?: string;
  themeParam?: string;
  storageKey?: string;
  themeStorageKey?: string;
  fallback?: UiStyleId;
  /** Extra values `?style=` accepts, mapped to a style id: `{ "1": "technical", poster: "graphical" }`. */
  aliases?: Record<string, UiStyleId>;
} = {}): string {
  const map: Record<string, UiStyleId> = { ...aliases };
  for (const s of uiStyles) map[s.id] = s.id;
  const j = JSON.stringify;
  return (
    `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,m=${j(map)},L=localStorage,` +
    `g=function(k){return k&&Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},` +
    `s=g(q.get(${j(param)}))||g(L.getItem(${j(storageKey)}))||${j(fallback)};d.setAttribute("data-ui-style",s);` +
    `var t=q.get(${j(themeParam)});if(t==="system"){L.removeItem(${j(themeStorageKey)});t=null}` +
    `if(t!=="light"&&t!=="dark")t=L.getItem(${j(themeStorageKey)});` +
    `if(t==="light"||t==="dark"){d.setAttribute("data-theme",t);d.setAttribute("data-ui-theme",t)}}catch(e){}})();`
  );
}
