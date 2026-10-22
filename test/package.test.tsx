import { existsSync, readdirSync, readFileSync } from "node:fs";
import { cssBundles } from "../scripts/css-bundles";
import { entries } from "../scripts/entries";

// The package's entry points are declared in three places: scripts/entries.ts (tsup's entries),
// package.json exports and scripts/css-bundles.ts. A new entry must touch all three; these checks say which
// one was missed (docs/contributing.md, "A new package entry").
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { exports: Record<string, string | Record<string, string>>; files: string[] };
const subpath = (name: string) => (name === "index" ? "." : `./${name}`);

describe("package entries", () => {
  it("every tsup entry is exported with types, ESM and CJS, and every JS export has an entry", () => {
    for (const [name, source] of Object.entries(entries)) {
      expect(existsSync(source), source).toBe(true);
      expect(pkg.exports[subpath(name)], `package.json exports "${subpath(name)}"`).toEqual({
        types: `./dist/${name}.d.ts`,
        import: `./dist/${name}.js`,
        require: `./dist/${name}.cjs`,
      });
    }
    const jsExports = Object.entries(pkg.exports).filter(([, v]) => typeof v === "object").map(([k]) => k);
    expect(jsExports.sort()).toEqual(Object.keys(entries).map(subpath).sort());
  });

  it("every CSS bundle is exported, and every CSS export is built from sources that exist", () => {
    const cssExports = Object.entries(pkg.exports).filter(([k]) => k.endsWith(".css"));
    expect(cssExports.map(([k]) => k).sort()).toEqual(cssBundles.map((b) => `./${b.out}`).sort());
    for (const [key, target] of cssExports) expect(target).toBe(`./dist${key.slice(1)}`);
    for (const b of cssBundles) for (const file of b.from) expect(existsSync(file), file).toBe(true);
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
        for (const m of readFileSync(`dist/${f}`, "utf8").matchAll(/\b(\w+Context) = (?:_react\.|\(0, \w+\.)?createContext\b/g))
          created.set(m[1], (created.get(m[1]) ?? 0) + 1);
      }
      expect(created.get("FigureMotionContext")).toBe(1);
      expect(created.get("FigureScaleContext")).toBe(1);
      for (const [name, n] of created) expect(n, name).toBe(1);
    });
  }
});
