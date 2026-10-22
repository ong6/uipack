import { lazy, Suspense, StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "../src/theme.css";
import "./showcase.css";
import "../src/canvas.css";
import { App } from "./App";
import { libraryGroups, libraryPages, pageDefs, pageHref, type LibraryPage } from "./catalog";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";

const CatalogPages = lazy(() => import("./CatalogPages"));
const Slides = lazy(() => import("./SlideShowcase"));
const Web = lazy(() => import("./WebShowcase"));
const Docs = lazy(() => import("./DocsShowcase"));
const Article = lazy(() => import("./ArticleShowcase"));
const Deck = lazy(() => import("./DeckShowcase"));
const Mechanism = lazy(() => import("./MechanismShowcase"));

/**
 * The component that renders each `libraryPages` entry. Keyed by page id, so a page added to
 * catalog.ts fails the typecheck until it is given a component here. Pages that share a path
 * (the deck sub-views) share a component; App serves "/", "/charts" and "/assets".
 */
const pageComponents: Record<LibraryPage, ComponentType> = {
  figures: App,
  charts: App,
  article: Article,
  deck: Deck,
  "deck-bento": Deck,
  "deck-consulting": Deck,
  presentations: CatalogPages,
  animations: Slides,
  mechanism: Mechanism,
  web: Web,
  docs: Docs,
  styles: CatalogPages,
  assets: App,
};

/** Older or shorthand paths that open a page: /slides (3D animations), /diagrams, /drill (the drill-down section), /index.html. */
const aliases: Record<string, LibraryPage> = { "/slides": "animations", "/diagrams": "figures", "/drill": "figures", "/index.html": "figures" };

const routes = new Map<string, ComponentType>(libraryPages.map((p) => [p.path, pageComponents[p.id]]));
for (const [path, id] of Object.entries(aliases)) routes.set(path, pageComponents[id]);

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";

/** An address that names no page says so and lists every page, rather than showing another page. */
function NotFound() {
  const { theme, flip } = useShowcaseTheme();
  return (
    <ShowcaseShell active="not-found" theme={theme} flip={flip}>
      <section className="showcase-not-found">
        <div className="showcase-not-found__groups">
          {libraryGroups.map((g) => (
            <section key={g.id} aria-labelledby={`not-found-${g.id}`}>
              <h2 id={`not-found-${g.id}`} className="showcase-subhead">
                {g.label}
              </h2>
              <ul>
                {pageDefs
                  .filter((p) => p.group === g.id)
                  .map((p) => (
                    <li key={p.id}>
                      <a href={pageHref(p, theme)}>{p.query && p.title ? `${p.title} · ${p.label}` : p.label}</a>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </ShowcaseShell>
  );
}

const Page = routes.get(location.pathname.replace(/(.)\/$/, "$1")) ?? NotFound;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p>Loading…</p>}>
      <Page />
    </Suspense>
  </StrictMode>,
);
