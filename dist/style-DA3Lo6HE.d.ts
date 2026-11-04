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
}
declare const uiStyles: readonly UiStyleMeta[];
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

export { type UiStyleId as U, type UiStyleMeta as a, isUiStyle as i, styleBootScript as s, uiStyles as u };
