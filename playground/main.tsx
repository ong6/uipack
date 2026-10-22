import { lazy, Suspense, StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "../src/theme.css";
import "./showcase.css";
import "../src/canvas.css";
import { App } from "./App";
import type { LibraryPage } from "./catalog";

const CatalogPages = lazy(() => import("./CatalogPages"));
const Slides = lazy(() => import("./SlideShowcase"));
const Web = lazy(() => import("./WebShowcase"));
const Docs = lazy(() => import("./DocsShowcase"));
const Article = lazy(() => import("./ArticleShowcase"));
const Placeholder = lazy(() => import("./Placeholder"));
const placeholder = (active: LibraryPage) => () => <Placeholder active={active} />;

/** One line per path; a branch adding a page adds a line here and an entry in catalog.ts. Unlisted paths render App. */
const routes: Record<string, ComponentType> = {
  "/slides": Slides,
  "/animations": Slides,
  "/web": Web,
  "/docs": Docs,
  "/article": Article,
  "/styles": CatalogPages,
  "/presentations": CatalogPages,
  "/deck": placeholder("deck"),
  "/mechanism": placeholder("mechanism"),
};

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";

// App serves "/", "/diagrams", "/charts" and "/assets".
const Page = routes[location.pathname.replace(/\/$/, "")] ?? App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p>Loading…</p>}>
      <Page />
    </Suspense>
  </StrictMode>,
);
