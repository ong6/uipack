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
    layout: {
        hero: "demo" | "figure";
        align: "center" | "start";
        steps: "cards" | "rows";
    };
}
declare const uiStyles: readonly UiStyleMeta[];
/** The section order every style renders when the layout is shared (the swap test's order). */
declare const sharedSectionOrder: readonly ["hero", "how", "mechanism", "proof", "faq", "pricing"];
/**
 * The ids to render, in order: the style's recommended sequence (layout "style") or the shared
 * one, keeping only ids the page provides.
 */
declare function sectionOrder(style: UiStyleId, available: readonly string[], layout?: "style" | "shared"): string[];
declare const isUiStyle: (value: unknown) => value is UiStyleId;
/**
 * A blocking inline script for <head> that sets `data-ui-style` and `data-ui-theme` on <html>
 * before the first paint, from a URL parameter, then localStorage, then the default. Put its
 * output in a <script> before any stylesheet so the page never flashes another style.
 */
declare function styleBootScript({ param, themeParam, storageKey, fallback, }?: {
    param?: string;
    themeParam?: string;
    storageKey?: string;
    fallback?: UiStyleId;
}): string;

export { type UiStyleId as U, type UiStyleMeta as a, sharedSectionOrder as b, styleBootScript as c, isUiStyle as i, sectionOrder as s, uiStyles as u };
