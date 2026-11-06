import { libraryPages, pageDefs, type LibraryPage } from "./catalog";

/**
 * The playground module (`playground/<name>.tsx`, default export) that renders each page, loaded
 * lazily as its own chunk: MarkdownShowcase, which renders the page's `file` with its demos. (The
 * deck's print and speaker windows render DeckShowcase without the shell; main.tsx picks it.)
 * Every module is named `<Name>Showcase`: main.tsx's import.meta.glob loads only `*Showcase`.
 * The build reads this table too, to preload the current page's chunk from index.html (vite.config.ts).
 */
export const pageModules = Object.fromEntries(pageDefs.map((p) => [p.id, "MarkdownShowcase"])) as Readonly<
  Record<LibraryPage, string>
>;

/**
 * Older or shorthand paths that open a page: /slides (3D animations), /diagrams and /drill (the
 * diagram catalogue, which used to be "/"), /start (the home page), the Foundations guides folded
 * into other pages, /index.html.
 */
const aliases: Record<string, LibraryPage> = {
  "/slides": "animations",
  "/diagrams": "figures",
  "/drill": "figures",
  "/start": "start",
  "/foundations/mix": "foundations",
  "/foundations/recipes": "recipes",
  "/index.html": "start",
};

/** Path to page id. Pages that share a path (the decks) map to the first; the shell resolves the query. */
export const routes = new Map<string, LibraryPage>();
for (const p of libraryPages) if (!routes.has(p.path)) routes.set(p.path, p.id);
for (const [path, id] of Object.entries(aliases)) routes.set(path, id);

/** A location's path as the route table keys it: no trailing slash, except "/". */
export const routePath = (pathname: string) => pathname.replace(/(.)\/$/, "$1");
