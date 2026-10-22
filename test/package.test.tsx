// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { build } from "esbuild";
import { cssBundles } from "../scripts/css-bundles";
import { entries } from "../scripts/entries";

// The package's entry points are declared in three places: scripts/entries.ts (tsup's entries),
// package.json exports and scripts/css-bundles.ts. A new entry must touch all three; these checks say which
// one was missed (docs/contributing.md, "A new package entry").
type Conditions = { types: string; default: string };
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  exports: Record<string, string | { import: Conditions; require: Conditions }>;
  files: string[];
};
const subpath = (name: string) => (name === "index" ? "." : `./${name}`);

describe("package entries", () => {
  // Each module system gets its own declarations: in a "type": "module" package a .d.ts types an ES
  // module, so `require` must point at the .d.cts tsup writes beside the .cjs (attw, `npm run attw`).
  it("every tsup entry is exported with ESM and CJS, each with its own types, and every JS export has an entry", () => {
    for (const [name, source] of Object.entries(entries)) {
      expect(existsSync(source), source).toBe(true);
      expect(pkg.exports[subpath(name)], `package.json exports "${subpath(name)}"`).toEqual({
        import: { types: `./dist/${name}.d.ts`, default: `./dist/${name}.js` },
        require: { types: `./dist/${name}.d.cts`, default: `./dist/${name}.cjs` },
      });
    }
    const jsExports = Object.entries(pkg.exports)
      .filter(([, v]) => typeof v === "object")
      .map(([k]) => k);
    expect(jsExports.sort()).toEqual(Object.keys(entries).map(subpath).sort());
  });

  it("every CSS bundle is exported, and every CSS export is built from sources that exist", () => {
    const cssExports = Object.entries(pkg.exports).filter(([k]) => k.endsWith(".css"));
    expect(cssExports.map(([k]) => k).sort()).toEqual(cssBundles.map((b) => `./${b.out}`).sort());
    for (const [key, target] of cssExports) expect(target).toBe(`./dist${key.slice(1)}`);
    for (const b of cssBundles) for (const file of b.from) expect(existsSync(file), file).toBe(true);
  });

  // attw resolves every export to type declarations; a stylesheet has none, so .attw.json skips exactly
  // the CSS exports (JSON has no comments: the reason lives here and in docs/contributing.md).
  it("attw skips exactly the CSS exports", () => {
    const attw = JSON.parse(readFileSync(".attw.json", "utf8")) as { excludeEntrypoints: string[] };
    const cssExports = Object.keys(pkg.exports).filter((k) => k.endsWith(".css"));
    expect([...attw.excludeEntrypoints].sort()).toEqual(cssExports.sort());
  });

  it("every doc ships with the package", () => {
    expect(pkg.files).toContain("docs/*.md");
  });
});

// A provider from one entry must reach a component from another (a FigureMotionContext.Provider from
// "uipack" around a preset from "uipack/presets"). That holds only if the built entries share one copy of
// each context: tsup's `splitting` puts shared modules in chunks, for CJS as well as ESM.
describe("built entries share one copy of each React context", () => {
  const files = readdirSync("dist").filter((f) => f.endsWith(".js") || f.endsWith(".cjs"));
  for (const ext of [".js", ".cjs"]) {
    it(`dist/*${ext}`, () => {
      const created = new Map<string, number>();
      for (const f of files.filter((f) => f.endsWith(ext))) {
        // esbuild may rename the import (createContext2) when one chunk imports it twice; the call
        // may carry a pure annotation, and in CJS goes through the required module (react., _react.,
        // (0, import_react.)).
        for (const m of readFileSync(`dist/${f}`, "utf8").matchAll(
          /\b(\w+Context) = (?:\/\* @__PURE__ \*\/ )?(?:\w+\.|\(0, \w+\.)?createContext\d*\b/g,
        ))
          created.set(m[1], (created.get(m[1]) ?? 0) + 1);
      }
      expect(created.get("FigureMotionContext")).toBe(1);
      expect(created.get("FigureScaleContext")).toBe(1);
      for (const [name, n] of created) expect(n, name).toBe(1);
    });
  }
});

// CommonJS cannot parse import.meta: one left in a .cjs chunk makes require() of it throw.
it("no CommonJS file mentions import.meta", () => {
  for (const f of readdirSync("dist").filter((f) => f.endsWith(".cjs")))
    expect(readFileSync(`dist/${f}`, "utf8"), f).not.toMatch(/\bimport\.meta\b/);
});

// A consumer who imports one constant from uipack/deck must not pay for the storyline linter: its
// module-level regular expressions and sets are marked pure (src/deck/storyline/heuristics.ts), so a
// bundler drops them with the rest of the unused code.
it("importing one constant from the built deck entry leaves the storyline heuristics behind", async () => {
  const result = await build({
    stdin: { contents: 'import { WORDS_PER_MINUTE } from "./dist/deck.js"; console.log(WORDS_PER_MINUTE);', resolveDir: "." },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    logLevel: "silent",
    external: ["react", "react-dom", "react/jsx-runtime", "three", "gsap"],
  });
  const out = result.outputFiles[0]!.text;
  expect(out).not.toMatch(/new RegExp|new Set/);
});
