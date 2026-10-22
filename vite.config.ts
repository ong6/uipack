import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import { tidySeo } from "./playground/web-seo";

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
 * `noindex`; these files only describe the demo, as a real Landing site would serve them.
 */
function crawlFiles(): Plugin {
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const name = (req.url ?? "").split("?")[0].replace(/^\//, "");
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

export default defineConfig({
  plugins: [react(), crawlFiles()],
  root: "playground",
  publicDir: false,
  appType: "spa",
  server: { fs: { allow: [".."] } },
  define: { __UIPACK_ROOT__: JSON.stringify(process.cwd()) },
});
