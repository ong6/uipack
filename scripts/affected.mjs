#!/usr/bin/env node
// Run only the tests a change touches (owner, 2026-11-04). CI still runs everything.
//
//   npm run test:affected            unit + browser tests for what changed since origin/main
//   npm run test:affected -- --dry   print the plan, run nothing
//   npm run test:affected -- --base HEAD~1 --unit   (or --e2e)
//
// Changed files = commits since the base, plus staged, unstaged and untracked work.
// Unit tests: `vitest related` follows the import graph from every changed source file, plus
// any changed test file. Browser tests: Playwright cannot see which app code a spec exercises
// (the app is served by Vite), so AREAS maps source paths to the specs that cover them.
// A changed spec always runs. Locally the browser run is Chromium only.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chromiumGroups, GL } from "./check-e2e-shards.mjs";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "origin/main";
const dry = flag("--dry");
const onlyUnit = flag("--unit");
const onlyE2e = flag("--e2e");

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
const changed = [
  ...new Set([
    ...git("diff", "--name-only", `${base}...HEAD`),
    ...git("diff", "--name-only", "HEAD"),
    ...git("ls-files", "--others", "--exclude-standard"),
  ]),
].filter((f) => existsSync(f) || f.startsWith("e2e/") || f.startsWith("test/"));

const FIGURES = [
  "geometry",
  "diagram-themes",
  "hover",
  "packet",
  "figure-keyboard",
  "entrance",
  "canvas",
  "canvas-gestures",
  "drill",
  "reduced",
  "static",
];
// The shell draws every page's header, context line and nav, so the pages whose specs read those run too.
const SHELL = [
  "nav",
  "docs-shell",
  "page-audit",
  "showcase",
  "brand-mark",
  "site-consistency",
  "gallery",
  "assets-gallery",
  "web",
  "showcase-content",
  "foundations",
  "docs",
  "tier1",
  "charts",
  "geometry",
  "canvas",
];

/** First matching rule wins. A path no rule matches runs no browser test. */
const AREAS = [
  // The role layer and the style registry, plus the pages whose look they set.
  [/^src\/styles\/|^src\/style\.ts$/, ["web", "deck", "page-audit", "geometry"]],
  [/^src\/charts\//, ["charts"]],
  [/^src\/article\//, ["article"]],
  [/^src\/deck\/consulting\//, ["deck-consulting"]],
  [/^src\/deck\//, ["deck"]],
  [/^src\/presentations\//, ["deck", "showcase"]],
  [/^src\/mechanism\//, ["mechanism"]],
  [/^src\/web\//, ["web", "tier1"]],
  [
    /^playground\/(WebShowcase|web-showcase|web-seo|webTidyFlow|DeckShowcase|deck-showcase)/,
    ["web", "deck", "showcase-content", "tier1"],
  ],
  // The sample product's facts and section order: the content guard.
  [/^playground\/tidyFacts/, ["showcase-content", "web"]],
  [/^src\/objects\//, ["objects", "art-directions", "contact-directions"]],
  [/^src\/slides\//, ["slides"]],
  [/^src\/browser\/|^assets\//, ["assets"]],
  // The marks: the docs site's header draws the wordmark, its dot on the page's section.
  [/^src\/marks\//, ["brand-mark", "assets"]],
  [/^src\/drill\//, ["drill", "geometry"]],
  [/^src\/static\//, ["static"]],
  // The grader: its browser spec runs the checks on a page with planted defects.
  // tier1 runs it on a few docs-site pages.
  [/^src\/grade\/|^scripts\/grade/, ["grade", "tier1"]],
  [
    /^src\/docs\/|^playground\/Docs/,
    ["docs", "docs-shell", "site-consistency", "foundations", "nav", "tier1", "charts", "geometry", "canvas"],
  ],
  // The docs site: its manifest, the Markdown page, demos, links and generated blocks.
  [
    /^playground\/(docs-manifest|docs-links|demos|MarkdownShowcase)|^scripts\/(docs-sync|check-spec|style-contract|site-model|check-agent-docs)|^docs\/(?!system\/)|^README\.md$|^llms\.txt$/,
    ["foundations", "nav", "page-audit"],
  ],
  [/^src\/(CanvasView|canvas)/, ["canvas", "canvas-gestures", "diagram-themes"]],
  // Diagram themes and the parts they colour, with their docs demos.
  [
    /^src\/(diagram-theme|UserFlow|Sequence)|^playground\/(DiagramThemesDemo|diagramThemes|diagram-themes-demo)/,
    [...FIGURES, "diagram-themes", "tier1"],
  ],
  // Root parts, theme, presets and the figures page: every figure-level spec.
  [/^src\/[^/]+\.(tsx?|css)$|^src\/presets\/|^playground\/figures\//, [...FIGURES, "tier1"]],
  // The Rules pages and their demos: outline, overflow and the nav rows.
  [
    /^playground\/(rulesDemos|foundations)|^docs\/(system|recipes|examples)\//,
    ["foundations", "nav", "page-audit", "showcase-content"],
  ],
  // The landing page (/): its module, words, figures and previews, and the release line it shows.
  [/^playground\/(LandingShowcase|landing|release)/, ["landing", "site-consistency", "tier1"]],
  // The site map: the landing page's footer and a not-found page.
  [/^playground\/(SiteMap|site-map)/, ["landing", "site-consistency", "nav"]],
  // The live-preview stage the landing page and the Assets tab share.
  [/^playground\/preview-stage/, ["landing", "assets-gallery"]],
  [
    /^playground\/(ShowcaseShell|showcase\.css|catalog|figure-rows|routes|nav|main|scroll-memory|index\.html|site-palette|site-settings|search-index)/,
    [...SHELL, "landing"],
  ],
  // The Assets tab: its page, its data and the registries it draws from.
  [
    /^playground\/(GalleryShowcase|gallery-showcase|gallery-index|deckExamples|presentationExamples|figures\/)/,
    ["assets-gallery", "site-consistency"],
  ],
  // The deployed site's route files and crawl files: CI's site job crawls the build (npm run check:site);
  // nav covers the routes on the dev server.
  [/^playground\/site\.ts$|^scripts\/(check-site|serve-site)|^vercel\.json$/, ["nav"]],
  // The /styles and /presentations pages (CatalogShowcase): slide starters and the style catalog demo.
  [/^playground\/(CatalogShowcase|StylePreviews|presentations\.css)/, ["web", "page-audit", "showcase"]],
  // Component demos embedded in their docs pages.
  [/^playground\/(ArticleShowcase|article-showcase)/, ["article"]],
  [/^playground\/FiguresShowcase/, [...FIGURES, "charts", "assets", "gallery"]],
  [/^playground\/(MechanismShowcase|mechanism-showcase)/, ["mechanism"]],
  [/^playground\/(SlideShowcase|slides-showcase)/, ["slides", "objects"]],
  // The figure geometry check a site runs; geometry.spec runs it on every figure of the diagrams page.
  [/^bin\/(uipack-figure-check|figure-check-cli)/, ["geometry"]],
  // dist/ is built, not committed: what changes the build (and the page that loads it) runs the smoke
  // test, which needs a fresh `npm run build`.
  [/^(tsup\.config\.ts|scripts\/(entries|css-bundles|build-css)\.ts|playground\/dist-smoke\/)/, ["dist-smoke"]],
];

const specs = new Set();
const unmapped = [];
const shared = changed.filter((f) =>
  /^(e2e\/(helpers|fixtures|global-setup|page-audit)\.ts|playwright\.config\.ts|vite\.config\.ts|package\.json)$/.test(f),
);
if (shared.length) {
  const { gl, rest } = chromiumGroups();
  [...gl, ...rest].forEach((file) => specs.add(file.slice(4, -8)));
}
for (const f of changed) {
  if (shared.includes(f)) continue;
  const m = f.match(/^e2e\/(.+)\.spec\.ts$/);
  if (m) {
    specs.add(m[1]);
    continue;
  }
  if (f.startsWith("e2e/")) {
    unmapped.push(`${f} (shared e2e helper: run the specs that use it)`);
    continue;
  }
  const rule = AREAS.find(([re]) => re.test(f));
  if (rule) rule[1].forEach((s) => specs.add(s));
  else if (/^(src|playground)\//.test(f)) unmapped.push(f);
}
const e2e = [...specs].map((s) => `e2e/${s}.spec.ts`).filter((p) => existsSync(p));
const sources = changed.filter((f) => /^(src|playground|scripts)\/.*\.(tsx?|mjs)$/.test(f));
const tests = changed.filter((f) => /^test\/.*\.test\.tsx?$/.test(f) && existsSync(f));
// A docs file has no import graph: any change to one runs the docs-site checks (manifest, links,
// generated blocks, llms.txt).
if (changed.some((f) => /^docs\/.*\.md$|^README\.md$|^llms\.txt$/.test(f)) && !tests.includes("test/docs-manifest.test.tsx"))
  tests.push("test/docs-manifest.test.tsx");
if (
  changed.some((f) => /^docs\/.*\.md$|^README\.md$|^AGENTS\.md$|^skills\/|^scripts\/check-agent-docs/.test(f)) &&
  !tests.includes("test/agent-docs.test.tsx")
)
  tests.push("test/agent-docs.test.tsx");

console.log(`Changed since ${base}: ${changed.length} file(s)`);
console.log(`Unit: vitest related ${sources.length} source file(s) + ${tests.length} changed test file(s)`);
console.log(`Browser (chromium): ${e2e.length ? e2e.join(" ") : "none"}`);
if (shared.length)
  console.log(`Full Chromium suite: shared configuration changed (${shared.join(", ")}); GL workers=1, non-GL workers=4`);
if (unmapped.length) console.log(`No browser spec mapped for:\n  ${unmapped.join("\n  ")}`);
if (dry) process.exit(0);

let failed = false;
const run = (cmd, a) => {
  const r = spawnSync(cmd, a, { stdio: "inherit" });
  if (r.status !== 0) failed = true;
};
if (!onlyE2e && (sources.length || tests.length))
  run("npx", ["vitest", "related", "--run", "--passWithNoTests", ...sources, ...tests]);
// Software WebGL starves under parallel workers (paint budgets and lost contexts), so the 3D specs
// run on one worker, everything else on four.
const gl = e2e.filter((p) => GL.test(p));
const rest = e2e.filter((p) => !GL.test(p));
if (!onlyUnit && rest.length) run("npx", ["playwright", "test", ...rest, "--project=chromium", "--workers=4"]);
if (!onlyUnit && gl.length) run("npx", ["playwright", "test", ...gl, "--project=chromium", "--workers=1"]);
process.exit(failed ? 1 : 0);
