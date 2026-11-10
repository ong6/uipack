// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { build } from "esbuild";
import { cssBundles } from "../scripts/css-bundles";
import { entries } from "../scripts/entries";

// The package's entry points are declared in three places: scripts/entries.ts (tsup's entries),
// package.json exports and scripts/css-bundles.ts. A new entry must touch all three; these checks say which
// one was missed (docs/contributing.md, "A new package entry").
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  exports: Record<string, string | { types: string; default: string }>;
  files: string[];
};
const subpath = (name: string) => (name === "index" ? "." : `./${name}`);

describe("package entries", () => {
  // ES modules only (0.4.0): one `default` file per entry, its declarations under `types` (listed
  // first: TypeScript takes the first condition that matches). No `require` condition, no `main`.
  it("every tsup entry is exported as an ES module with its types, and every JS export has an entry", () => {
    for (const [name, source] of Object.entries(entries)) {
      expect(existsSync(source), source).toBe(true);
      const target = pkg.exports[subpath(name)];
      expect(target, `package.json exports "${subpath(name)}"`).toEqual({
        types: `./dist/${name}.d.ts`,
        default: `./dist/${name}.js`,
      });
      expect(Object.keys(target!)[0]).toBe("types");
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
    // The design-system spec ships too: the uipack-design skill reads node_modules/uipack/docs/system.
    expect(pkg.files).toContain("docs/system/*.md");
    // Its writing and layout folders, the recipes and the component looks, which skills link to.
    expect(pkg.files).toEqual(expect.arrayContaining(["docs/system/*/*.md", "docs/recipes/*.md", "docs/components/*.md"]));
    // The spec checker and the data it reads run from node_modules/uipack in a site.
    expect(pkg.files).toEqual(
      expect.arrayContaining(["scripts/check-spec.ts", "scripts/style-contract.ts", "scripts/site-model.ts"]),
    );
    // The web starter ships so a builder copies a working page instead of discovering the API.
    expect(pkg.files).toContain("examples/web-starter/*");
    // The agent skills and the agent guide ship so a site reads the guidance for the code it installed.
    expect(pkg.files).toContain("skills");
    expect(pkg.files).toContain("docs/agents/*.md");
  });
});

// A provider from one entry must reach a component from another (a FigureMotionContext.Provider from
// "uipack" around a preset from "uipack/presets"). That holds only if the built entries share one copy of
// each context: tsup's `splitting` puts shared modules in chunks.
it("built entries share one copy of each React context", () => {
  const created = new Map<string, number>();
  for (const f of readdirSync("dist").filter((f) => f.endsWith(".js"))) {
    // esbuild may rename the import (createContext2) when one chunk imports it twice; the call
    // may carry a pure annotation.
    for (const m of readFileSync(`dist/${f}`, "utf8").matchAll(
      /\b(\w+Context) = (?:\/\* @__PURE__ \*\/ )?(?:\w+\.)?createContext\d*\b/g,
    ))
      created.set(m[1], (created.get(m[1]) ?? 0) + 1);
  }
  expect(created.get("FigureMotionContext")).toBe(1);
  expect(created.get("FigureScaleContext")).toBe(1);
  for (const [name, n] of created) expect(n, name).toBe(1);
});

// The CommonJS build is gone (0.4.0); a stray format in tsup.config.ts would bring it back unexported.
it("dist holds no CommonJS files", () => {
  expect(readdirSync("dist").filter((f) => /\.(cjs|d\.cts)$/.test(f))).toEqual([]);
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
