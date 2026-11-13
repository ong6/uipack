import { routePath } from "./routes";

/** The build's preload table (vite.config.ts, `routePreloads`): every file once, each page module's files, each path's module and its Markdown chunk. */
interface Preloads {
  a: string[];
  m: Record<string, number[]>;
  r: Record<string, string>;
  d: Record<string, number>;
}

/**
 * The likely next page, loaded ahead of the click, where the browser has no Speculation Rules
 * (Safari, Firefox; in Chromium index.html's rules prerender the whole page instead). When the
 * reader points at, presses or focuses a link to another page of the site, the files that page
 * needs beyond this one's (its module and styles from another kind of page, and always its Markdown
 * chunk) are preloaded, so the load that follows the click finds them in the cache. Built sites
 * only: the dev server has no preload table, and does nothing here.
 */
export function preloadLinkedPages() {
  if (typeof HTMLScriptElement.supports === "function" && HTMLScriptElement.supports("speculationrules")) return;
  let table: Preloads;
  try {
    table = JSON.parse(document.getElementById("uipack-preloads")?.textContent ?? "") as Preloads;
  } catch {
    return;
  }
  const here = routePath(location.pathname);
  const seen = new Set<string>([here]);
  const preload = (event: Event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.origin !== location.origin || link.target === "_blank" || link.hasAttribute("download")) return;
    const path = routePath(link.pathname);
    if (seen.has(path)) return;
    seen.add(path);
    const files = [...(table.m[table.r[path]] ?? []), ...(path in table.d ? [table.d[path]] : [])].map((i) => table.a[i]);
    for (const href of files) {
      // What this page loaded itself is in the module map and the cache already.
      if (document.querySelector(`link[href="${href}"]`)) continue;
      const l = document.createElement("link");
      l.href = href;
      l.crossOrigin = "";
      if (href.endsWith(".css")) {
        l.rel = "preload";
        l.setAttribute("as", "style");
      } else l.rel = "modulepreload";
      document.head.append(l);
    }
  };
  for (const type of ["pointerover", "pointerdown", "touchstart", "focusin"])
    addEventListener(type, preload, { capture: true, passive: true });
}
