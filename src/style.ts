/**
 * The styles UI Pack ships, one value set each in src/styles (docs/system/style.md). Technical is
 * the one implemented style, the uipack site's spec (docs/specs/technical.md). Each other website
 * has its own spec (docs/specs/README.md); uipack renders one by adding one value set in
 * src/styles, registering it here (the id below and an entry in `uiStyles`), and testing it.
 * A component's `uiStyle` prop sets `data-ui-style` on its root; omitted, it follows the nearest
 * ancestor that sets one, else Technical. A swap changes tokens only: the same regions, boxes and
 * reading order.
 */
export type UiStyleId = "technical";

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

/** Options shared by `styleBootScript`, `styleBootPlugin` and `readStyle`. */
export interface StyleBootOptions {
  /** The query parameter that picks the style. Default "style". */
  param?: string;
  /** The query parameter that picks the theme. Default "theme". */
  themeParam?: string;
  /** localStorage key for a remembered style; read only when `persist` is true. */
  storageKey?: string;
  /** localStorage key for a remembered theme (a theme toggle writes it). */
  themeStorageKey?: string;
  /** The style without a (valid) `?style=`. Default "technical". */
  fallback?: UiStyleId;
  /** Extra values `?style=` accepts, mapped to a style id: `{ "1": "technical", blueprint: "technical" }`. */
  aliases?: Record<string, UiStyleId>;
  /**
   * Read a remembered style from localStorage when the URL names none. Default false: a visit
   * without `?style=` gets `fallback`, never a stale style some earlier page stored. Turn it on
   * only for a page with its own style switcher that writes `storageKey`.
   */
  persist?: boolean;
}

const styleMap = (aliases: Record<string, UiStyleId> = {}) => {
  const map: Record<string, UiStyleId> = { ...aliases };
  for (const s of uiStyles) map[s.id] = s.id;
  return map;
};

/**
 * A blocking inline script for <head> that sets the style and the theme on <html> before the first
 * paint, so the page never flashes another style or theme. Put its output in a <script> before any
 * stylesheet (with Vite, `styleBootPlugin()` does it).
 *
 * Style: `?style=` (a style id, or a key of `aliases`, e.g. `{ "1": "technical" }`), then
 * localStorage only if `persist`, then `fallback`; written to `data-ui-style`.
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
  persist = false,
}: StyleBootOptions = {}): string {
  const map = styleMap(aliases);
  const j = JSON.stringify;
  const stored = persist ? `g(L.getItem(${j(storageKey)}))||` : "";
  return (
    `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,m=${j(map)},L=localStorage,` +
    `g=function(k){return k&&Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},` +
    `s=g(q.get(${j(param)}))||${stored}${j(fallback)};d.setAttribute("data-ui-style",s);` +
    `var t=q.get(${j(themeParam)});if(t==="system"){L.removeItem(${j(themeStorageKey)});t=null}` +
    `if(t!=="light"&&t!=="dark")t=L.getItem(${j(themeStorageKey)});` +
    `if(t==="light"||t==="dark"){d.setAttribute("data-theme",t);d.setAttribute("data-ui-theme",t)}}catch(e){}})();`
  );
}

/** The slice of a Vite plugin `styleBootPlugin` returns (typed here so uipack needs no Vite types). */
export interface StyleBootPlugin {
  name: string;
  transformIndexHtml: { order: "pre"; handler: (html: string) => string };
}

/**
 * A Vite plugin that inlines `styleBootScript(options)` into index.html: in place of a
 * `<!--uipack-boot-->` comment if the page has one, else as the first thing in <head>, before any
 * stylesheet. `plugins: [styleBootPlugin({ aliases: { "1": "technical" } }), react()]`.
 */
export function styleBootPlugin(options: StyleBootOptions = {}): StyleBootPlugin {
  const tag = `<script>${styleBootScript(options)}</script>`;
  return {
    name: "uipack-style-boot",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.includes("<!--uipack-boot-->")
          ? html.replace("<!--uipack-boot-->", tag)
          : html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}\n    ${tag}`),
    },
  };
}

/**
 * The page's style, for the React root: `data-ui-style` on <html> if the boot script set it, else
 * `?style=` read with the same aliases, else `fallback`. Pass the options you gave the boot script.
 * `createRoot(el).render(<App uiStyle={readStyle({ aliases })} />)`.
 */
export function readStyle({ param = "style", fallback = "technical", aliases = {} }: StyleBootOptions = {}): UiStyleId {
  const map = styleMap(aliases);
  const pick = (k: string | null | undefined) => (k && Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null);
  if (typeof document !== "undefined") {
    const set = pick(document.documentElement.getAttribute("data-ui-style"));
    if (set) return set;
  }
  const search = typeof location !== "undefined" ? location.search : "";
  return pick(new URLSearchParams(search).get(param)) ?? fallback;
}
