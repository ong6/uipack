import { libraryPages, type LibraryPage } from "./catalog";

/**
 * The playground module (`playground/<name>.tsx`, default export) that renders each
 * `libraryPages` entry, loaded lazily as its own chunk. Keyed by page id, so a page added to
 * catalog.ts fails the typecheck until it is mapped here. Pages that share a module read the path
 * (App serves "/", "/charts" and "/assets"); the deck sub-views share a path and a module.
 * A new module is named `<Name>Showcase`: main.tsx's import.meta.glob loads only `App`,
 * `CatalogPages` and `*Showcase` (test/catalog.test.tsx checks every name here).
 * The build reads this table too, to preload the current page's chunk from index.html (vite.config.ts).
 */
export const pageModules = {
  figures: "App",
  charts: "App",
  article: "ArticleShowcase",
  deck: "DeckShowcase",
  "deck-bento": "DeckShowcase",
  "deck-consulting": "DeckShowcase",
  presentations: "CatalogPages",
  animations: "SlideShowcase",
  mechanism: "MechanismShowcase",
  web: "WebShowcase",
  docs: "DocsShowcase",
  styles: "CatalogPages",
  assets: "App",
} as const satisfies Record<LibraryPage, string>;

/** Older or shorthand paths that open a page: /slides (3D animations), /diagrams, /drill (the drill-down section), /index.html. */
const aliases: Record<string, LibraryPage> = {
  "/slides": "animations",
  "/diagrams": "figures",
  "/drill": "figures",
  "/index.html": "figures",
};

/** Path to page id. Pages that share a path (the decks) map to the first; the shell resolves the query. */
export const routes = new Map<string, LibraryPage>();
for (const p of libraryPages) if (!routes.has(p.path)) routes.set(p.path, p.id);
for (const [path, id] of Object.entries(aliases)) routes.set(path, id);

/** A location's path as the route table keys it: no trailing slash, except "/". */
export const routePath = (pathname: string) => pathname.replace(/(.)\/$/, "$1");
