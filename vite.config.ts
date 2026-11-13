import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import type { OutputBundle, OutputChunk } from "rollup";
import { pageDefs } from "./playground/catalog";
import { pageModules, routes } from "./playground/routes";
import { siteFiles } from "./playground/docs-links";
import { routeHtml, siteCrawlFiles, siteRoutes, SITE_ORIGIN } from "./playground/site";
import { SEARCH_INDEX_PATH, siteSearchIndex } from "./playground/search-index";
import { LANDING_MODULE, LANDING_PATH } from "./playground/landing-index";
import { GALLERY_PATH } from "./playground/gallery-index";
import { PAGE_TEXT_FILE, PAGE_TEXT_ID } from "./playground/page-ready";

/** The Assets tab's page module (main.tsx picks it for GALLERY_PATH). */
const GALLERY_MODULE = "GalleryShowcase";

/**
 * The entry's tag with the page's own before it: the page's module as a render-blocking module
 * script, like the entry, and a docs page's Markdown file in a JSON block. So when the entry runs,
 * the page has run and its text is in the document, and the entry renders the whole page in one go
 * before the first paint (main.tsx, page-ready.ts): the browser shows the page the reader came
 * from until then, never an empty shell. A JSON block never runs, so the Content-Security-Policy
 * needs no hash for it. `styles` are the page chunk's stylesheets in a build (the dev server's
 * modules add their own).
 */
function withPageScripts(
  html: string,
  module: string | undefined,
  text?: { file: string; source: string },
  styles: string[] = [],
) {
  const entry = /<script\b[^>]*\bblocking="render"[^>]*\bsrc="[^"]+"[^>]*><\/script>/.exec(html);
  if (!entry) throw new Error('page scripts: index.html has no entry script with blocking="render"');
  const tags = [
    text &&
      `<script type="application/json" id="${PAGE_TEXT_ID}" ${PAGE_TEXT_FILE}="${text.file}">${JSON.stringify(text.source).replace(/</g, "\\u003c")}</script>`,
    module && `<script blocking="render" type="module" crossorigin src="${module}"></script>`,
  ].filter(Boolean);
  const out = html.slice(0, entry.index) + tags.map((tag) => `${tag}\n    `).join("") + html.slice(entry.index);
  // A build's page chunk has stylesheets of its own, which a dynamic import would add: here, after the entry's.
  const links = styles.map((href) => `<link rel="stylesheet" crossorigin href="${href}">\n    `).join("");
  return out.replace("</head>", `${links}</head>`);
}

/** The page module and the Markdown file a path opens (the landing page and Assets have no file). */
function pageOf(path: string): { module?: string; file?: string } {
  const id = routes.get(path);
  if (id) return { module: pageModules[id], file: pageDefs.find((p) => p.id === id)?.file };
  return { module: path === LANDING_PATH ? LANDING_MODULE : path === GALLERY_PATH ? GALLERY_MODULE : undefined };
}

/** The dev server's half of `withPageScripts`: the page's source module, at the address main.tsx imports it by, and its file. */
function devPageScripts(): Plugin {
  return {
    name: "uipack-playground-page-scripts",
    apply: "serve",
    transformIndexHtml(html, ctx) {
      // Only the site's own document: another HTML file the server hosts (playground/dist-smoke) is
      // its own page, with no shell and no entry script.
      if (ctx.filename && ctx.filename !== resolve("playground/index.html")) return html;
      const path = (ctx.originalUrl ?? ctx.path).split(/[?#]/)[0].replace(/(.)\/$/, "$1");
      const { module, file } = pageOf(path);
      return withPageScripts(html, module && `/${module}.tsx`, file ? { file, source: readRepoFile(file) } : undefined);
    },
  };
}

const CRAWL_TYPES: Record<string, string> = {
  "robots.txt": "text/plain; charset=utf-8",
  "sitemap.xml": "application/xml; charset=utf-8",
  "llms.txt": "text/plain; charset=utf-8",
};

/** The origin a build writes canonicals, sitemap.xml and llms.txt for (playground/site.ts). */
const siteOrigin = (process.env.UIPACK_SITE_ORIGIN ?? SITE_ORIGIN).replace(/\/$/, "");
const readRepoFile = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

/**
 * Serves the docs site's robots.txt, sitemap.xml and llms.txt at the root (`publicDir` is off, so
 * without this they fall back to index.html): dev and preview build them for the requesting
 * origin, a build emits them for `siteOrigin`. Paths under /.well-known/ get a 404 instead of the
 * SPA fallback.
 */
function crawlFiles(): Plugin {
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const name = (req.url ?? "").split("?")[0].replace(/^\//, "");
    // Nothing is published under /.well-known (e.g. ai-catalog.json): answer 404, not the SPA's HTML.
    if (name.startsWith(".well-known/")) return void ((res.statusCode = 404), res.end());
    if (!(name in CRAWL_TYPES)) return next();
    const origin = `http://${req.headers.host ?? "localhost"}`;
    res.setHeader("Content-Type", CRAWL_TYPES[name]);
    res.end(siteCrawlFiles(origin, readRepoFile("llms.txt"))[name as keyof ReturnType<typeof siteCrawlFiles>]);
  };
  return {
    name: "uipack-playground-crawl-files",
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
    generateBundle() {
      const files = siteCrawlFiles(siteOrigin, readRepoFile("llms.txt"));
      for (const [fileName, source] of Object.entries(files)) this.emitFile({ type: "asset", fileName, source });
    },
  };
}

const RAW_TYPES: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/**
 * Serves each docs page's Markdown file as plain text at its repo path ("View as Markdown":
 * /docs/system/README.md, /README.md), plus the images those files show, the asset manifest's
 * previews and the files llms.txt links, so the rendered page and the file an agent reads are one
 * source. Only those files (`siteFiles`) are served, in dev and preview; a build emits the same files.
 */
function docsRawFiles(): Plugin {
  const root = process.cwd();
  const read = (file: string) => readFileSync(resolve(root, file), "utf8");
  const files = () => new Set(siteFiles(read));
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    let name = (req.url ?? "").split(/[?#]/)[0].replace(/^\//, "");
    try {
      name = decodeURIComponent(name);
    } catch {
      return next();
    }
    if (!files().has(name)) return next();
    res.setHeader("Content-Type", RAW_TYPES[extname(name)] ?? "application/octet-stream");
    res.end(readFileSync(resolve(root, name)));
  };
  return {
    name: "uipack-playground-docs-raw",
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
    generateBundle() {
      for (const fileName of files()) this.emitFile({ type: "asset", fileName, source: readFileSync(resolve(root, fileName)) });
    },
  };
}

/**
 * The docs search index (playground/search-index.ts) at /search-index.json: built from the docs
 * manifest and the Markdown files on each request in dev and preview, and emitted once in a build.
 * The shell fetches it the first time search opens.
 */
function searchIndex(): Plugin {
  const name = SEARCH_INDEX_PATH.slice(1);
  const build = () => JSON.stringify(siteSearchIndex(readRepoFile));
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if ((req.url ?? "").split("?")[0] !== SEARCH_INDEX_PATH) return next();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(build());
  };
  return {
    name: "uipack-playground-search-index",
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
    generateBundle() {
      this.emitFile({ type: "asset", fileName: name, source: build() });
    },
  };
}

/**
 * Lets the current page's chunk load in parallel with the entry. Each page is a lazy chunk
 * (main.tsx), which on its own would start only after the entry has downloaded and run. In a
 * build this adds an inline script to index.html that, for the path being opened, adds
 * `modulepreload` links for the page's chunk and its imports and `preload` links for its CSS
 * (not stylesheets: the lazy import still applies them, after they load, so nothing shows
 * unstyled). The route table is playground/routes.ts, plus the landing page at "/" and the Assets
 * tab. A docs page's Markdown is in its HTML (`withPageScripts`). playground/link-preload.ts reads
 * the same table to preload the page a link points at, where the browser cannot prerender it.
 */
function routePreloads(): Plugin {
  let base = "/";
  return {
    name: "uipack-playground-route-preloads",
    apply: "build",
    configResolved: (config) => void (base = config.base),
    transformIndexHtml: {
      order: "post",
      handler(html, { bundle }) {
        if (!bundle) return html;
        const chunks = Object.values(bundle as OutputBundle).filter((c): c is OutputChunk => c.type === "chunk");
        const closure = (c: OutputChunk, seen = new Set<string>()): Set<string> => {
          if (!seen.has(c.fileName)) {
            seen.add(c.fileName);
            for (const i of c.imports) closure(bundle[i] as OutputChunk, seen);
          }
          return seen;
        };
        const entry = new Set(chunks.filter((c) => c.isEntry).flatMap((c) => [...closure(c)]));
        // Every file once, then each page module's files as indexes into that list.
        const files: string[] = [];
        const modules: Record<string, number[]> = {};
        const index = (f: string) => (files.includes(f) ? files : files.push(f) && files).indexOf(f);
        for (const name of new Set([...Object.values(pageModules), LANDING_MODULE, GALLERY_MODULE])) {
          // A chunk that also carries modules other chunks import has no facade id; find it by its modules.
          const file = `/playground/${name}.tsx`;
          const chunk = chunks.find(
            (c) => c.isDynamicEntry && (c.facadeModuleId?.endsWith(file) ?? c.moduleIds.some((id) => id.endsWith(file))),
          );
          if (!chunk) throw new Error(`route preloads: no chunk for playground/${name}.tsx`);
          const own = [...closure(chunk)].filter((f) => !entry.has(f)).map((f) => bundle[f] as OutputChunk);
          const css = new Set(own.flatMap((c) => [...(c.viteMetadata?.importedCss ?? [])]));
          modules[name] = [...own.map((c) => c.fileName), ...css].map(index);
        }
        const paths = {
          ...Object.fromEntries([...routes].map(([path, id]) => [path, pageModules[id]])),
          [LANDING_PATH]: LANDING_MODULE,
          [GALLERY_PATH]: GALLERY_MODULE,
        };
        // The data is a JSON block, not script, so the script itself never changes and the site's
        // Content-Security-Policy allows it by its hash (vercel.json; checked by siteHtml below).
        const data = JSON.stringify({ a: files.map((f) => base + f), m: modules, r: paths }).replace(/</g, "\\u003c");
        const script =
          `{const{a,m,r}=JSON.parse(document.getElementById("uipack-preloads").textContent);` +
          `for(const i of m[r[location.pathname.replace(/(.)\\/$/,"$1")]]||[]){const l=document.createElement("link");` +
          `l.href=a[i];l.crossOrigin="";if(a[i].endsWith(".css"))l.rel="preload",l.as="style";else l.rel="modulepreload";document.head.append(l)}}`;
        // Straight after <meta charset> (which must stay in the first 1024 bytes), before any
        // stylesheet: an inline script after one waits for it to load.
        const at = html.search(/<meta charset[^>]*>/);
        if (at < 0) throw new Error("route preloads: index.html has no <meta charset>");
        const end = html.indexOf(">", at) + 1;
        // Vite writes the entry's tag afresh, without index.html's `blocking="render"`: put it back,
        // so the built page holds its first paint until the entry has rendered the shell (main.tsx).
        const entryTag = /<script type="module" crossorigin src="[^"]+"><\/script>/;
        const head = html.slice(0, html.indexOf("</head>"));
        if (!entryTag.test(head)) throw new Error("route preloads: the entry script is not in index.html's <head>");
        html = html.replace(entryTag, (tag) => tag.replace("<script ", '<script blocking="render" '));
        return `${html.slice(0, end)}\n    <script type="application/json" id="uipack-preloads">${data}</script>\n    <script>${script}</script>${html.slice(end)}`;
      },
    },
  };
}

/** The inline scripts in a built page, as CSP hash sources ('sha256-…'). JSON and JSON-LD blocks never run, so they need none. */
function inlineScriptHashes(html: string) {
  return [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs = ""]) => !/\ssrc=|type="application\/(ld\+)?json"/.test(attrs))
    .map(([, , body]) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`);
}

/**
 * Turns the build into the static docs site vercel.json deploys: one HTML file per route
 * (`<path>.html`, served at `<path>` by cleanUrls) with that page's title, description, canonical
 * and Open Graph tags, so a direct load or a refresh of any route is a real file, plus 404.html
 * for every other address (the shell renders its Page not found list). It fails the build when
 * vercel.json's Content-Security-Policy does not allow every inline script by its hash.
 */
function siteHtml(): Plugin {
  return {
    name: "uipack-playground-site-html",
    apply: "build",
    writeBundle({ dir }) {
      if (!dir) return;
      const html = readFileSync(join(dir, "index.html"), "utf8");
      // The preload table `routePreloads` wrote: every file, each module's files (its chunk first), each path's module.
      const table = JSON.parse(/<script type="application\/json" id="uipack-preloads">([\s\S]*?)<\/script>/.exec(html)![1]) as {
        a: string[];
        m: Record<string, number[]>;
        r: Record<string, string>;
      };
      for (const route of siteRoutes()) {
        const file = join(dir, route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`);
        mkdirSync(dirname(file), { recursive: true });
        // The page's module, render-blocking before the entry, and its Markdown (`withPageScripts`).
        const { file: text } = pageOf(route.path);
        const own = (table.m[table.r[route.path]] ?? []).map((i) => table.a[i]);
        const chunk = own[0];
        writeFileSync(
          file,
          withPageScripts(
            routeHtml(html, siteOrigin, route),
            chunk,
            text ? { file: text, source: readRepoFile(text) } : undefined,
            own.filter((f) => f.endsWith(".css")),
          ),
        );
      }
      writeFileSync(join(dir, "404.html"), routeHtml(html, siteOrigin));
      const vercel = JSON.parse(readRepoFile("vercel.json")) as { headers: { headers: { key: string; value: string }[] }[] };
      const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
      const missing = inlineScriptHashes(html).filter((hash) => !csp.includes(hash));
      if (missing.length)
        throw new Error(
          `vercel.json: the Content-Security-Policy's script-src does not allow these inline scripts of index.html: ${missing.join(" ")}. ` +
            `Replace the old hashes with them.`,
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), crawlFiles(), docsRawFiles(), searchIndex(), routePreloads(), devPageScripts(), siteHtml()],
  root: "playground",
  publicDir: false,
  appType: "spa",
  // The repo, plus node_modules where it really lives: a git worktree may symlink it from
  // another checkout, and files outside the allow list 404.
  server: { fs: { allow: ["..", realpathSync("node_modules")] } },
});
