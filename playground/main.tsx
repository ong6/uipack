import { lazy, Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/theme.css";
import "./showcase.css";
import "../src/canvas.css";
import { App } from "./App";

const CatalogPages = lazy(() => import("./CatalogPages"));
const Slides = lazy(() => import("./SlideShowcase"));

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
