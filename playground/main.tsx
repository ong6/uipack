/// <reference types="vite/client" />
import { lazy, Suspense, StrictMode, useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
// Only the role layer, Technical's values and the shell's CSS are eager; each page imports its own
// (theme.css with the figures; the other styles' value sets where a page can switch style), which
// loads with its chunk.
import "../src/styles/roles.css";
import "../src/styles/technical.css";
import "../src/web/fonts.css";
// The docs site's own values over Technical's (docs/specs/docs-site.md): its dark palette and its
// navigation hues. After technical.css, and unlayered, so they win.
import "./site-palette.css";
import "./showcase.css";
import { libraryGroups, pageDefs, pageHeading, pageHref, resolvePage } from "./catalog";
import { pageModules, routePath, routes } from "./routes";
import { figureRows } from "./figure-rows";
import { ShowcaseShell, ShowcaseThemeProvider, useShowcaseTheme } from "./ShowcaseShell";
import { GALLERY_PATH } from "./gallery-index";

// Every page module is its own chunk, with its own CSS. The shell (header, h1, intro) is in this
// entry and renders at once; the page fills in below it when its chunk arrives. In a build,
// index.html preloads the current page's chunk alongside this one.
const pageLoaders = import.meta.glob<{ default: ComponentType }>("./*Showcase.tsx");

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

/**
 * A link to a #fragment on a lazy page: the browser looked for the target before the page's chunk
 * had rendered it, so it stayed at the top. Once the page has mounted (or as soon as the target
 * appears, for a page that renders in stages) this jumps to it, without smooth scrolling, and moves
 * focus there, so Tab carries on from the target. Content above it that is still loading (faces,
 * images) would push it down, so it stays aligned for two seconds or until the reader scrolls,
 * taps or types. Form controls are left to their page, which may own them (the charts select the
 * filter a hash names).
 */
let hashOpened = false;
const READER_INPUT = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
function OpenHashTarget() {
  useEffect(() => {
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* keep the raw id */
    }
    if (!id || hashOpened) return;
    // Once per load, and outliving StrictMode's remount: the alignment ends on its own.
    const open = () => {
      const el = document.getElementById(id);
      if (!el) return false;
      hashOpened = true;
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) return true;
      const align = () => el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
      align();
      if (!el.matches("a[href], button, summary, [tabindex], [contenteditable]")) {
        el.setAttribute("tabindex", "-1");
        el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
      }
      el.focus({ preventScroll: true });
      const resized = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(align);
      resized?.observe(document.body);
      const release = () => {
        resized?.disconnect();
        clearTimeout(timer);
        for (const type of READER_INPUT) removeEventListener(type, release, true);
      };
      const timer = setTimeout(release, 2000);
      for (const type of READER_INPUT) addEventListener(type, release, { capture: true, passive: true });
      return true;
    };
    if (open()) return;
    const watch = new MutationObserver(() => open() && watch.disconnect());
    watch.observe(document.body, { childList: true, subtree: true });
    const stop = setTimeout(() => watch.disconnect(), 5000);
    return () => {
      watch.disconnect();
      clearTimeout(stop);
    };
  }, []);
  return null;
}

// The diagram catalogue used to be "/": an old link to one of its sections moves to the catalogue's page.
if (routePath(location.pathname) === "/" && figureRows.some(([id]) => `#${id}` === location.hash))
  history.replaceState(null, "", `/components/diagrams${location.search}${location.hash}`);

const path = routePath(location.pathname);
const active = routes.get(path);
// The deck's printable page and its speaker window are documents of their own, without the shell:
// DeckShowcase renders them; every other /deck address is the deck's docs page.
const standalone = path === "/deck" && (params.get("view") === "print" || params.get("presenter") === "1");
// The Assets tab is a mode of the shell outside the docs manifest: GalleryShowcase renders it.
const gallery = path === GALLERY_PATH;
const module = standalone ? "DeckShowcase" : gallery ? "GalleryShowcase" : active && pageModules[active];
const load = module && pageLoaders[`./${module}.tsx`];
if ((active || gallery) && !load) throw new Error(`No playground/${module}.tsx for page "${active}"`);
const Page = load ? lazy(load) : NotFound;
// While the page's chunk loads, the shell stays and a status line under the intro says so.
const loading = gallery
  ? "Loading the assets"
  : active
    ? `Loading ${pageHeading(resolvePage(active, location.search))}`
    : "Loading";
const page = (
  <Suspense
    fallback={
      <p className="showcase-loading" role="status">
        {loading}…
      </p>
    }
  >
    <Page />
    <OpenHashTarget />
  </Suspense>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ShowcaseThemeProvider>
      {standalone ? page : <ShowcaseShell active={gallery ? "gallery" : (active ?? "not-found")}>{page}</ShowcaseShell>}
    </ShowcaseThemeProvider>
  </StrictMode>,
);
