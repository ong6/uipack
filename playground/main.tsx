import { lazy, Suspense, StrictMode } from "react";
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
        <shell.ShowcaseShell active="figures" theme={theme} flip={flip}>
          <drill.DrillSection theme={theme} />
        </shell.ShowcaseShell>
      );
    },
  })),
);

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {["/slides", "/animations"].includes(
      location.pathname.replace(/\/$/, ""),
    ) ? (
      <Suspense fallback={<p>Loading slides…</p>}>
        <Slides />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/web" ? (
      <Suspense fallback={<p>Loading web UI…</p>}>
        <Web />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/docs" ? (
      <Suspense fallback={<p>Loading docs layout…</p>}>
        <Docs />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/drill" ? (
      <Suspense fallback={<p>Loading drill-down…</p>}>
        <Drill />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/deck" ? (
      <Suspense fallback={<p>Loading deck…</p>}>
        <Deck />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/article" ? (
      <Suspense fallback={<p>Loading article parts…</p>}>
        <Article />
      </Suspense>
    ) : location.pathname.replace(/\/$/, "") === "/mechanism" ? (
      <Suspense fallback={<p>Loading mechanism…</p>}>
        <Mechanism />
      </Suspense>
    ) : ["/styles", "/presentations"].includes(
        location.pathname.replace(/\/$/, ""),
      ) ? (
      <Suspense fallback={<p>Loading collection…</p>}>
        <CatalogPages />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
