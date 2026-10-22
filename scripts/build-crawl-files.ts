// Writes robots.txt, sitemap.xml, llms.txt (and llms-full.txt when pages carry content) for a Landing site with buildCrawlFiles().
//
//   npx tsx scripts/build-crawl-files.ts --out dist-site
//   npx tsx scripts/build-crawl-files.ts --config ./crawl.config.ts --out public
//   npx tsx scripts/build-crawl-files.ts --site https://tidy.example   # print the demo's files
//
// --config  a module whose default export is BuildCrawlFilesOptions (or a function of the --site
//           value returning one). Without it, the /web demo's own config (playground/web-seo.ts).
// --site    origin for the demo config. Default https://tidy.example.
// --out     directory to write the files into. Without it, they print to stdout.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildCrawlFiles, type BuildCrawlFilesOptions } from "../src/web/crawl";
import { tidySeo } from "../playground/web-seo";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const site = arg("site") ?? "https://tidy.example";
const configPath = arg("config");
const out = arg("out");

let options: BuildCrawlFilesOptions;
if (configPath) {
  const mod = await import(pathToFileURL(resolve(configPath)).href);
  const exported = mod.default ?? mod.config;
  options = typeof exported === "function" ? exported(site) : exported;
} else {
  options = tidySeo(site).crawl;
}

const files = buildCrawlFiles(options);
if (out) {
  mkdirSync(out, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(out, name), body);
    console.log(`wrote ${join(out, name)} (${body.length} bytes)`);
  }
} else {
  for (const [name, body] of Object.entries(files)) console.log(`==> ${name} <==\n${body}`);
}
