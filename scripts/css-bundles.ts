// The CSS files the package ships: each dist file is its sources concatenated in order.
// One list for the build (scripts/build-css.ts) and the test that checks package.json
// exports every one of them (test/package.test.tsx). A new entry with styles adds a line here
// and a "./<name>.css" export in package.json.

export const cssBundles: { out: string; from: string[] }[] = [
  // The canvas workspace styles ride along with every entry that opens a canvas.
  { out: "theme.css", from: ["src/theme.css", "src/canvas.css"] },
  { out: "browser.css", from: ["src/browser/browser.css"] },
  { out: "presentations.css", from: ["src/presentations/presentations.css"] },
  { out: "slides.css", from: ["src/slides/slides.css", "src/canvas.css"] },
  { out: "objects.css", from: ["src/objects/objects.css", "src/canvas.css"] },
  { out: "web.css", from: ["src/web/web.css", "src/web/gutters.css"] },
  { out: "web-gutters.css", from: ["src/web/gutters.css"] },
  { out: "docs.css", from: ["src/docs/docs.css"] },
  { out: "charts.css", from: ["src/charts/charts.css"] },
  { out: "article.css", from: ["src/article/article.css"] },
  { out: "deck.css", from: ["src/deck/deck.css", "src/deck/bento.css", "src/deck/consulting/consulting.css"] },
  { out: "mechanism.css", from: ["src/mechanism/mechanism.css"] },
];

/** Self-hosted font files (and their licences) copied to dist/fonts for `uipack/fonts/*`. */
export const fontFiles = { dir: "src/web/fonts", out: "fonts", match: /\.(woff2|txt)$/ };
