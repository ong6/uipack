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
const SHELL = ["nav", "page-audit", "showcase", "gallery"];

/** First matching rule wins. A path no rule matches runs no browser test. */
const AREAS = [
  // The role layer and the style registry: every swap, plus the pages whose look they set.
  [/^src\/styles\/|^src\/style\.ts$/, ["style-swap", "web", "deck", "page-audit", "geometry"]],
  [/^src\/charts\//, ["charts"]],
  [/^src\/article\//, ["article"]],
  [/^src\/deck\/consulting\//, ["deck-consulting"]],
  [/^src\/deck\//, ["deck", "style-swap"]],
  [/^src\/presentations\//, ["deck", "showcase"]],
  [/^src\/mechanism\//, ["mechanism"]],
  [/^src\/web\//, ["web", "style-swap"]],
  [/^playground\/(WebShowcase|web-showcase|webTidyFlow|DeckShowcase|deck-showcase|style-switch)/, ["web", "deck", "style-swap", "showcase-content"]],
  // The sample product's facts and the guides' stated budgets: the content guard.
  [/^playground\/(tidyFacts|guideFacts)/, ["showcase-content"]],
  [/^src\/objects\//, ["objects", "art-directions", "contact-directions"]],
  [/^src\/slides\//, ["slides"]],
  [/^src\/browser\/|^assets\//, ["assets"]],
  [/^src\/drill\//, ["drill", "geometry"]],
  [/^src\/static\//, ["static"]],
  [/^src\/docs\/|^playground\/Docs/, ["docs"]],
  [/^src\/(CanvasView|canvas)/, ["canvas", "canvas-gestures"]],
  // Root parts, theme, presets and the figures page: every figure-level spec.
  [/^src\/[^/]+\.(tsx?|css)$|^src\/presets\/|^playground\/figures\//, FIGURES],
  // The Foundations guide pages: their outline, scale, alignment and overflow, and the nav rows.
  [/^playground\/(Foundations|foundations)|^docs\/system\//, ["foundations", "nav", "page-audit", "showcase-content"]],
  [/^playground\/(ShowcaseShell|showcase\.css|catalog|routes|nav|main|index\.html)/, [...SHELL, "style-swap"]],
  [/^dist\//, ["dist-smoke"]],
];

const specs = new Set();
const unmapped = [];
for (const f of changed) {
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

console.log(`Changed since ${base}: ${changed.length} file(s)`);
console.log(`Unit: vitest related ${sources.length} source file(s) + ${tests.length} changed test file(s)`);
console.log(`Browser (chromium): ${e2e.length ? e2e.join(" ") : "none"}`);
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
const GL = /\/(art-directions|contact-directions|objects)\.spec\.ts$/;
const gl = e2e.filter((p) => GL.test(p));
const rest = e2e.filter((p) => !GL.test(p));
if (!onlyUnit && rest.length) run("npx", ["playwright", "test", ...rest, "--project=chromium", "--workers=4"]);
if (!onlyUnit && gl.length) run("npx", ["playwright", "test", ...gl, "--project=chromium", "--workers=1"]);
process.exit(failed ? 1 : 0);
