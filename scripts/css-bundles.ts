// The CSS files the package ships: each dist file is its sources concatenated in order.
// One list for the build (scripts/build-css.ts) and the test that checks package.json
// exports every one of them (test/package.test.tsx). A new entry with styles adds a line here
// and a "./<name>.css" export in package.json.

/** The role layer and every style's value set (src/styles). Every entry's stylesheet starts with
 * it, so an entry works on its own and `style="…"` works on any entry; importing two entries
 * repeats identical declarations, which is harmless. `uipack/styles.css` is the layer alone. */
export const styleFiles = ["src/styles/roles.css", "src/styles/technical.css", "src/styles/landing.css", "src/styles/graphical.css"];

const withRoles = (...files: string[]) => [...styleFiles, ...files];

export const cssBundles: { out: string; from: string[] }[] = [
  { out: "styles.css", from: styleFiles },
  // The canvas workspace styles ride along with every entry that opens a canvas.
  { out: "theme.css", from: withRoles("src/theme.css", "src/canvas.css") },
  { out: "browser.css", from: withRoles("src/browser/browser.css") },
  { out: "presentations.css", from: withRoles("src/presentations/presentations.css") },
  { out: "slides.css", from: withRoles("src/slides/slides.css", "src/canvas.css") },
  { out: "objects.css", from: withRoles("src/objects/objects.css", "src/canvas.css") },
  { out: "web.css", from: withRoles("src/web/fonts.css", "src/web/web.css", "src/web/web-styles.css", "src/web/gutters.css") },
  { out: "web-gutters.css", from: withRoles("src/web/gutters.css") },
  { out: "docs.css", from: withRoles("src/docs/docs.css") },
  { out: "charts.css", from: withRoles("src/charts/charts.css") },
  { out: "article.css", from: withRoles("src/article/article.css") },
  {
    out: "deck.css",
    from: withRoles("src/web/fonts.css", "src/deck/deck.css", "src/deck/bento.css", "src/deck/consulting/consulting.css"),
  },
  { out: "mechanism.css", from: withRoles("src/mechanism/mechanism.css") },
];

/** Self-hosted font files (and their licences) copied to dist/fonts for `uipack/fonts/*`. */
export const fontFiles = { dir: "src/web/fonts", out: "fonts", match: /\.(woff2|txt)$/ };
