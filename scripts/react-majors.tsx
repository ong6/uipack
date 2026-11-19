// Builds uipack's consumers against whichever React is installed, the way a site does: CI's
// react-majors job builds dist/ on the locked React 18, swaps in React 18 or 19 (react, react-dom and
// their types), then runs this with the major it installed:
//   npx tsx scripts/react-majors.tsx 19
// It checks the installed major is that one, typechecks examples/web-starter and playground/dist-smoke
// against dist/'s types (skipLibCheck off, so dist/*.d.ts is checked too), bundles both with Vite and
// renders the starter page, a preset figure and a deck to HTML. The registry's sites span both majors
// (docs/specs/registry.md; junxiong.dev is on React 18, the blog on React 19).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { build } from "vite";
import { agentLoop } from "uipack/presets";
import { DeckPlayer, Slide } from "uipack/deck";
import App from "../examples/web-starter/App";

const expected = process.argv[2];
if (!/^\d+$/.test(expected ?? "")) throw new Error("usage: npx tsx scripts/react-majors.tsx <react major>");
const require = createRequire(import.meta.url);
for (const name of ["react", "react-dom", "@types/react", "@types/react-dom"]) {
  const version: string = require(`${name}/package.json`).version;
  if (version.split(".")[0] !== expected)
    throw new Error(`${name} is ${version}, not React ${expected}: the swap did not happen`);
  console.log(`ok ${name} ${version}`);
}

const consumers = ["examples/web-starter", "playground/dist-smoke"];
// One flag set for both consumers; no tsconfig file, so nothing else in the repo is pulled in.
execFileSync(
  process.execPath,
  [
    require.resolve("typescript/bin/tsc"),
    ...["--noEmit", "--strict", "--skipLibCheck", "false", "--jsx", "react-jsx", "--module", "esnext"],
    ...["--moduleResolution", "bundler", "--target", "es2020", "--lib", "es2020,dom,dom.iterable", "--types", "react"],
    ...["examples/web-starter/main.tsx", "playground/dist-smoke/main.ts"],
  ],
  { stdio: "inherit" },
);
console.log("ok typecheck against dist/ types");

const out = mkdtempSync(join(tmpdir(), "uipack-react-majors-"));
try {
  for (const root of consumers) {
    await build({ configFile: false, root, logLevel: "warn", build: { outDir: join(out, root), emptyOutDir: true } });
    console.log(`ok vite build ${root}`);
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

const rendered = {
  "web-starter": renderToString(h(App, { uiStyle: "technical" })),
  "preset figure": renderToString(agentLoop()),
  deck: renderToString(
    h(DeckPlayer, {
      id: "smoke",
      title: "Smoke deck",
      slides: [{ id: "one", title: "First", render: () => h(Slide, null, "First slide") }],
    }),
  ),
};
for (const [name, html] of Object.entries(rendered)) {
  if (html.length < 200) throw new Error(`${name} rendered ${html.length} characters`);
  console.log(`ok render ${name} (${html.length} characters)`);
}
