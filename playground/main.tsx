import { lazy, Suspense, StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "../src/theme.css";
import "./showcase.css";
import "../src/canvas.css";
import { App } from "./App";

const CatalogPages = lazy(() => import("./CatalogPages"));
const Slides = lazy(() => import("./SlideShowcase"));
const Web = lazy(() => import("./WebShowcase"));
const Docs = lazy(() => import("./DocsShowcase"));
const Article = lazy(() => import("./ArticleShowcase"));
const Deck = lazy(() => import("./DeckShowcase"));
const Mechanism = lazy(() => import("./MechanismShowcase"));
// Temporary: /drill shows the drill-down section until the diagrams page mounts it.
const Drill = lazy(() =>
  Promise.all([import("./ShowcaseShell"), import("./DrillSection")]).then(([shell, drill]) => ({
    default: function DrillPage() {
      const { theme, flip } = shell.useShowcaseTheme();
      return (
        <shell.ShowcaseShell active="drill" theme={theme} flip={flip}>
          <drill.DrillSection theme={theme} />
        </shell.ShowcaseShell>
      );
    },
  })),
);

/** One line per path; a branch adding a page adds a line here and an entry in catalog.ts. Unlisted paths render App. */
const routes: Record<string, ComponentType> = {
  "/slides": Slides,
  "/animations": Slides,
  "/web": Web,
  "/docs": Docs,
  "/article": Article,
  "/styles": CatalogPages,
  "/presentations": CatalogPages,
  "/deck": Deck,
  "/mechanism": Mechanism,
  "/drill": Drill,
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
