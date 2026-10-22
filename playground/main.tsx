/// <reference types="vite/client" />
import { lazy, Suspense, StrictMode, useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
// Only the shell's CSS is eager; each page imports its own (theme.css with the figures), which loads with its chunk.
import "./showcase.css";
import { libraryGroups, pageDefs, pageHeading, pageHref, resolvePage } from "./catalog";
import { pageModules, routePath, routes } from "./routes";
import { ShowcaseShell, ShowcaseThemeProvider, useShowcaseTheme } from "./ShowcaseShell";

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
    <OpenHashTarget />
  </Suspense>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ShowcaseThemeProvider>
      {standalone ? page : <ShowcaseShell active={active ?? "not-found"}>{page}</ShowcaseShell>}
    </ShowcaseThemeProvider>
  </StrictMode>,
);
