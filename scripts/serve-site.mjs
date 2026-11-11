// Serves the built docs site (playground/dist, from `npm run build:site`) the way Vercel does with
// vercel.json: its headers (the Content-Security-Policy included), clean URLs (`/x` serves x.html,
// `/x.html` and `/x/` redirect to `/x`) and 404.html with a 404 for every other address. For checking
// the build locally: scripts/check-site.ts starts it, or run it on its own.
//
//   node scripts/serve-site.mjs [--port 4173] [--dir playground/dist]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
};

/** vercel.json's `headers` as [RegExp, headers] pairs; its sources here are plain regular expressions. */
function headerRules(root) {
  const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
  return (config.headers ?? []).map((rule) => [new RegExp(`^${rule.source}$`), rule.headers]);
}

/** Starts the server; resolves with its origin and a close function. */
export function serveSite({ port = 0, dir = "playground/dist", root = process.cwd() } = {}) {
  const base = resolve(root, dir);
  if (!existsSync(join(base, "index.html"))) throw new Error(`serve-site: ${dir}/index.html is missing; run npm run build:site`);
  const rules = headerRules(root);
  const isFile = (f) => existsSync(f) && statSync(f).isFile();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      path = url.pathname;
    }
    const redirect = (to) => void (res.writeHead(308, { Location: to + url.search }), res.end());
    if (path.length > 1 && path.endsWith("/")) return redirect(path.replace(/\/+$/, ""));
    if (path.endsWith(".html")) return redirect(path === "/index.html" ? "/" : path.slice(0, -5));
    const file = normalize(join(base, path));
    if (!file.startsWith(base)) return void ((res.statusCode = 400), res.end());
    let found;
    if (path === "/") found = join(base, "index.html");
    else if (isFile(file)) found = file;
    else if (!extname(path) && isFile(`${file}.html`)) found = `${file}.html`;
    const served = found ?? join(base, "404.html");
    for (const [re, headers] of rules) if (re.test(url.pathname)) for (const h of headers) res.setHeader(h.key, h.value);
    res.setHeader("Content-Type", TYPES[extname(served)] ?? "application/octet-stream");
    res.statusCode = found ? 200 : 404;
    res.end(req.method === "HEAD" ? undefined : readFileSync(served));
  });
  return new Promise((done) =>
    server.listen(port, "127.0.0.1", () => {
      const { port: bound } = server.address();
      done({ origin: `http://127.0.0.1:${bound}`, close: () => new Promise((c) => server.close(c)) });
    }),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const { origin } = await serveSite({ port: Number(arg("port") ?? 4173), dir: arg("dir") });
  console.log(`serve-site: ${origin}`);
}
