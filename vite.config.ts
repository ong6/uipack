import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import type { OutputBundle, OutputChunk } from "rollup";
import { pageModules, routes } from "./playground/routes";
import { siteFiles } from "./playground/docs-links";
import { routeHtml, siteCrawlFiles, siteRoutes, SITE_ORIGIN } from "./playground/site";

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
 * Lets the current page's chunk load in parallel with the entry. Each page is a lazy chunk
 * (main.tsx), which on its own would start only after the entry has downloaded and run. In a
 * build this adds an inline script to index.html that, for the path being opened, adds
 * `modulepreload` links for the page's chunk and its imports and `preload` links for its CSS
 * (not stylesheets: the lazy import still applies them, after they load, so nothing shows
 * unstyled). The route table is playground/routes.ts.
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
        for (const name of new Set(Object.values(pageModules))) {
          const chunk = chunks.find((c) => c.isDynamicEntry && c.facadeModuleId?.endsWith(`/playground/${name}.tsx`));
          if (!chunk) throw new Error(`route preloads: no chunk for playground/${name}.tsx`);
          const own = [...closure(chunk)].filter((f) => !entry.has(f)).map((f) => bundle[f] as OutputChunk);
          const css = new Set(own.flatMap((c) => [...(c.viteMetadata?.importedCss ?? [])]));
          modules[name] = [...own.map((c) => c.fileName), ...css].map(index);
        }
        const paths = Object.fromEntries([...routes].map(([path, id]) => [path, pageModules[id]]));
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
      for (const route of siteRoutes()) {
        const file = join(dir, route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, routeHtml(html, siteOrigin, route));
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
  plugins: [react(), crawlFiles(), docsRawFiles(), routePreloads(), siteHtml()],
  root: "playground",
  publicDir: false,
  appType: "spa",
  // The repo, plus node_modules where it really lives: a git worktree may symlink it from
  // another checkout, and files outside the allow list 404.
  server: { fs: { allow: ["..", realpathSync("node_modules")] } },
});
