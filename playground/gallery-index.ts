// Data only, no component imports: the shell (entry chunk) reads it for the Docs/Assets tabs and
// each docs page's "See it in Assets" link; GalleryShowcase.tsx builds the cards from the registries.

/** The Assets tab: every asset uipack draws, as a gallery, outside the docs manifest. */
export const GALLERY_PATH = "/gallery";

/**
 * The gallery's categories, in order. `pages` are the docs pages whose assets a category shows:
 * each card links to one of them, and each of those pages links back to its category.
 */
export const galleryCategories = [
  { id: "architecture", label: "Architecture", pages: ["figures", "figure-api", "drill"] },
  { id: "slides", label: "Slides", pages: ["deck", "deck-bento", "deck-consulting", "presentations"] },
  { id: "demos", label: "Demos", pages: ["web", "mechanism"] },
  { id: "3d", label: "3D", pages: ["objects", "animations"] },
  { id: "components", label: "Components", pages: ["charts", "article", "docs"] },
  { id: "icons", label: "Icons and marks", pages: ["assets"] },
] as const;

export type GalleryCategory = (typeof galleryCategories)[number]["id"];

/** The gallery address for a category, with the theme. */
export function galleryHref(theme: string, category?: GalleryCategory) {
  const params = new URLSearchParams({ theme });
  return `${GALLERY_PATH}?${params}${category ? `#gallery-${category}` : ""}`;
}

/** The category whose cards come from a docs page, for the page's link back to the gallery. */
export function galleryCategoryForPage(pageId: string): GalleryCategory | undefined {
  return galleryCategories.find((c) => (c.pages as readonly string[]).includes(pageId))?.id;
}
