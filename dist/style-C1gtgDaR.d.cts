/**
 * The styles UI Pack ships, one value set each in src/styles (docs/system/style.md). A component's
 * `style` prop sets `data-ui-style` on its root; omitted, it follows the nearest ancestor that
 * sets one, else Technical. A swap changes tokens only: the same regions, boxes and reading order.
 */
type UiStyleId = "technical" | "landing" | "graphical";
interface UiStyleMeta {
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
    layout: {
        hero: "demo" | "figure";
        align: "center" | "start";
        steps: "cards" | "rows";
    };
}
declare const uiStyles: readonly UiStyleMeta[];
/** A conventional section order for a landing page, for pages that want a starting point. */
declare const sharedSectionOrder: readonly ["hero", "how", "mechanism", "proof", "faq", "pricing"];
/**
 * The ids to render, in order. Shared (the default): the page's own order, the same in every
 * style. "style" (opt-in): the style's `prefers` sequence, keeping only ids the page provides,
 * then any the sequence does not name, in the page's order, so no section is ever dropped.
 */
declare function sectionOrder(style: UiStyleId, available: readonly string[], layout?: "style" | "shared"): string[];
declare const isUiStyle: (value: unknown) => value is UiStyleId;
/** Options shared by `styleBootScript`, `styleBootPlugin` and `readStyle`. */
interface StyleBootOptions {
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
    /** Extra values `?style=` accepts, mapped to a style id: `{ "1": "technical", poster: "graphical" }`. */
    aliases?: Record<string, UiStyleId>;
    /**
     * Read a remembered style from localStorage when the URL names none. Default false: a visit
     * without `?style=` gets `fallback`, never a stale style some earlier page stored. Turn it on
     * only for a page with its own style switcher that writes `storageKey`.
     */
    persist?: boolean;
}
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
declare function styleBootScript({ param, themeParam, storageKey, themeStorageKey, fallback, aliases, persist, }?: StyleBootOptions): string;
/** The slice of a Vite plugin `styleBootPlugin` returns (typed here so uipack needs no Vite types). */
interface StyleBootPlugin {
    name: string;
    transformIndexHtml: {
        order: "pre";
        handler: (html: string) => string;
    };
}
/**
 * A Vite plugin that inlines `styleBootScript(options)` into index.html: in place of a
 * `<!--uipack-boot-->` comment if the page has one, else as the first thing in <head>, before any
 * stylesheet. `plugins: [styleBootPlugin({ aliases: { "1": "technical" } }), react()]`.
 */
declare function styleBootPlugin(options?: StyleBootOptions): StyleBootPlugin;
/**
 * The page's style, for the React root: `data-ui-style` on <html> if the boot script set it, else
 * `?style=` read with the same aliases, else `fallback`. Pass the options you gave the boot script.
 * `createRoot(el).render(<App uiStyle={readStyle({ aliases })} />)`.
 */
declare function readStyle({ param, fallback, aliases }?: StyleBootOptions): UiStyleId;

export { type StyleBootOptions as S, type UiStyleId as U, type StyleBootPlugin as a, type UiStyleMeta as b, sharedSectionOrder as c, styleBootPlugin as d, styleBootScript as e, isUiStyle as i, readStyle as r, sectionOrder as s, uiStyles as u };
