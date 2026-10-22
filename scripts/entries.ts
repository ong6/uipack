// The package's JavaScript entries: name -> source. tsup builds dist/<name>.{js,cjs,d.ts} from each,
// and package.json exports "./<name>" ("." for index). test/package.test.tsx checks the two agree.
export const entries: Record<string, string> = {
  index: "src/index.ts",
  presets: "src/presets/index.ts",
  browser: "src/browser/index.tsx",
  static: "src/static/index.tsx",
  slides: "src/slides/index.ts",
  presentations: "src/presentations/index.ts",
  objects: "src/objects/index.tsx",
  web: "src/web/index.ts",
  docs: "src/docs/index.ts",
  charts: "src/charts/index.ts",
  article: "src/article/index.ts",
  deck: "src/deck/index.ts",
  mechanism: "src/mechanism/index.ts",
};
