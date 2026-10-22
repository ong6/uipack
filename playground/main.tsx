/// <reference types="vite/client" />
import { lazy, Suspense, StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
// Only the shell's CSS is eager; each page imports its own (theme.css with the figures), which loads with its chunk.
import "./showcase.css";
import { libraryGroups, pageDefs, pageHeading, pageHref, resolvePage } from "./catalog";
import { pageModules, routePath, routes } from "./routes";
import { ShowcaseShell, ShowcaseThemeProvider, useShowcaseTheme } from "./ShowcaseShell";

// Every page module is its own chunk, with its own CSS. The shell (header, h1, intro) is in this
// entry and renders at once; the page fills in below it when its chunk arrives. In a build,
// index.html preloads the current page's chunk alongside this one.
const pageLoaders = import.meta.glob<{ default: ComponentType }>(["./App.tsx", "./CatalogPages.tsx", "./*Showcase.tsx"]);

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";

/** An address that names no page says so and lists every page, rather than showing another page. */
function NotFound() {
  const { theme } = useShowcaseTheme();
  return (
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
  );
}

const path = routePath(location.pathname);
const active = routes.get(path);
const load = active && pageLoaders[`./${pageModules[active]}.tsx`];
if (active && !load) throw new Error(`No playground/${pageModules[active]}.tsx for page "${active}"`);
const Page = load ? lazy(load) : NotFound;
// The deck's printable page and its speaker window are documents of their own, without the shell.
const standalone = path === "/deck" && (params.get("view") === "print" || params.get("presenter") === "1");
// While the page's chunk loads, the shell stays and a status line under the intro says so.
const loading = active ? `Loading ${pageHeading(resolvePage(active, location.search))}` : "Loading";
const page = (
  <Suspense
    fallback={
      <p className="showcase-loading" role="status">
        {loading}…
      </p>
    }
  >
    <Page />
  </Suspense>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ShowcaseThemeProvider>{standalone ? page : <ShowcaseShell active={active ?? "not-found"}>{page}</ShowcaseShell>}</ShowcaseThemeProvider>
  </StrictMode>,
);
