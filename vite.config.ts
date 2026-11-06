import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, realpathSync } from "node:fs";
import { extname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import type { OutputBundle, OutputChunk } from "rollup";
import { pageModules, routes } from "./playground/routes";
import { tidySeo } from "./playground/web-seo";
import { servedFiles } from "./playground/docs-links";

const CRAWL_TYPES: Record<string, string> = {
  "robots.txt": "text/plain; charset=utf-8",
  "sitemap.xml": "application/xml; charset=utf-8",
  "llms.txt": "text/plain; charset=utf-8",
};

/**
 * Serves the /web demo's robots.txt, sitemap.xml and llms.txt at the root (`publicDir` is off,
 * so without this they fall back to index.html). Dev and preview build them for the requesting
 * origin, matching the page's own "View generated" panel; a build also emits them, for
 * `UIPACK_PLAYGROUND_ORIGIN` (default https://tidy.example). The playground pages stay
 * `noindex`; these files only describe the demo, as a real site would serve them.
 * Paths under /.well-known/ get a 404 instead of the SPA fallback.
 */
function crawlFiles(): Plugin {
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const name = (req.url ?? "").split("?")[0].replace(/^\//, "");
    // Nothing is published under /.well-known (e.g. ai-catalog.json): answer 404, not the SPA's HTML.
    if (name.startsWith(".well-known/")) return void ((res.statusCode = 404), res.end());
    if (!(name in CRAWL_TYPES)) return next();
    const origin = `http://${req.headers.host ?? "localhost"}`;
    res.setHeader("Content-Type", CRAWL_TYPES[name]);
    res.end(tidySeo(origin).files[name as keyof ReturnType<typeof tidySeo>["files"]]);
  };
  return {
    name: "uipack-playground-crawl-files",
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
    generateBundle() {
      const { files } = tidySeo(process.env.UIPACK_PLAYGROUND_ORIGIN ?? "https://tidy.example");
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
 * /docs/system/README.md, /README.md), plus the images those files show, so the rendered page and
 * the file an agent reads are one source. Only the files the docs manifest names (and their
 * images) are served, in dev and preview; a build emits the same files.
 */
function docsRawFiles(): Plugin {
  const root = process.cwd();
  const read = (file: string) => readFileSync(resolve(root, file), "utf8");
  const files = () => new Set(servedFiles(read));
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
        const script =
          `{const a=${JSON.stringify(files.map((f) => base + f))},m=${JSON.stringify(modules)},r=${JSON.stringify(paths)};` +
          `for(const i of m[r[location.pathname.replace(/(.)\\/$/,"$1")]]||[]){const l=document.createElement("link");` +
          `l.href=a[i];l.crossOrigin="";if(a[i].endsWith(".css"))l.rel="preload",l.as="style";else l.rel="modulepreload";document.head.append(l)}}`;
        // Straight after <meta charset> (which must stay in the first 1024 bytes), before any
        // stylesheet: an inline script after one waits for it to load.
        const at = html.search(/<meta charset[^>]*>/);
        if (at < 0) throw new Error("route preloads: index.html has no <meta charset>");
        const end = html.indexOf(">", at) + 1;
        return `${html.slice(0, end)}\n    <script>${script}</script>${html.slice(end)}`;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), crawlFiles(), docsRawFiles(), routePreloads()],
  root: "playground",
  publicDir: false,
  appType: "spa",
  // The repo, plus node_modules where it really lives: a git worktree may symlink it from
  // another checkout, and files outside the allow list 404.
  server: { fs: { allow: ["..", realpathSync("node_modules")] } },
  define: { __UIPACK_ROOT__: JSON.stringify(process.cwd()) },
});
