// The deployed docs site (https://ui.junxiong.dev, vercel.json): the head of each route's HTML file
// and the crawl files at its root, from the docs manifest. vite.config.ts writes them in a build and
// serves the crawl files in dev and preview; scripts/check-site.mjs crawls the result.
import { buildCrawlFiles } from "../src/web/crawl";
import { documentTitle, pageDefs } from "./catalog";
import { GALLERY_INTRO, GALLERY_PATH } from "./gallery-index";
import { LANDING_DESCRIPTION, LANDING_PATH, LANDING_TITLE } from "./landing-index";
import { routes } from "./routes";

/** Where the docs site is deployed. A build writes canonicals, sitemap.xml and llms.txt for it (`UIPACK_SITE_ORIGIN` overrides). */
export const SITE_ORIGIN = "https://ui.junxiong.dev";

/** The page that only demonstrates a landing page for an illustrative product (Tidy): never indexed. */
const NOINDEX_PATHS = new Set(["/web"]);

export interface SiteRoute {
  /** The route ("/foundations/style"); its file is `<path>.html`, "/" is index.html. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
  /** The page this route shows, as a path: itself, or the page an alias opens. */
  readonly canonical: string;
  readonly noindex: boolean;
}

/** Every route the site answers, once: the landing page, each page's path, the Assets gallery, then every alias. */
export function siteRoutes(): SiteRoute[] {
  const out = new Map<string, SiteRoute>();
  out.set(LANDING_PATH, {
    path: LANDING_PATH,
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    canonical: LANDING_PATH,
    noindex: false,
  });
  for (const p of pageDefs) {
    if (out.has(p.path)) continue;
    // Pages sharing a path (the decks) differ by query: the path's file carries the default one.
    const page = pageDefs.find((q) => q.path === p.path && q.isDefault) ?? p;
    out.set(p.path, {
      path: p.path,
      title: documentTitle(page),
      description: page.summary ?? page.intro,
      canonical: p.path,
      noindex: NOINDEX_PATHS.has(p.path),
    });
  }
  out.set(GALLERY_PATH, {
    path: GALLERY_PATH,
    title: "Assets · UiPack",
    description: GALLERY_INTRO,
    canonical: GALLERY_PATH,
    noindex: false,
  });
  for (const [path, id] of routes) {
    if (out.has(path) || path === "/index.html") continue;
    const target = out.get(pageDefs.find((p) => p.id === id)!.path)!;
    out.set(path, { ...target, path });
  }
  return [...out.values()];
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * `index.html` with one route's head: its title, description, canonical and Open Graph tags, and
 * `noindex` dropped unless the route keeps it. `route` undefined is the 404 page.
 */
export function routeHtml(html: string, origin: string, route?: SiteRoute) {
  const title = route?.title ?? "Page not found · UiPack";
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  if (!route) return out;
  const url = `${origin}${route.canonical}`;
  out = out.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeHtml(route.description)}$2`);
  if (!route.noindex) out = out.replace(/\n\s*<!--[^>]*-->\s*<meta name="robots" content="noindex" \/>/, "");
  // /web publishes its own canonical and Open Graph tags (useHead, from playground/web-seo.ts).
  if (route.noindex) return out;
  const tags = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="UiPack" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<link rel="describedby" type="text/markdown" href="/llms.txt" />`,
  ];
  return out.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
}

/**
 * robots.txt, sitemap.xml and llms.txt for the docs site at `origin`. llms.txt is the package's
 * own (`npm run docs:sync`) with its relative links made absolute: the site serves each file it
 * links at its repo path.
 */
export function siteCrawlFiles(origin: string, llmsTxt: string) {
  const site = origin.replace(/\/$/, "");
  const { "robots.txt": robots, "sitemap.xml": sitemap } = buildCrawlFiles({
    site,
    pages: siteRoutes()
      .filter((r) => r.canonical === r.path && !r.noindex)
      .map((r) => ({ path: r.path, title: r.title, description: r.description })),
    llms: { title: "UiPack", summary: "" },
  });
  const llms = llmsTxt.replace(/\]\((?![a-z][a-z0-9+.-]*:|#|\/)([^)\s]+)\)/gi, (_, path: string) => `](${site}/${path})`);
  return { "robots.txt": robots, "sitemap.xml": sitemap, "llms.txt": llms };
}
