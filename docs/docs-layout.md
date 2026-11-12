# Product documentation layout

`uipack/docs` owns the reusable product-docs shell and Markdown renderer. Import its scoped CSS once in the consumer.

The entry imports `react-markdown` and `remark-gfm` (its `DocsMarkdown` renderer uses them). They are optional peer dependencies, not dependencies, so a project that never imports `uipack/docs` does not install them. Add both when you use this entry; without them the import fails at build time:

```sh
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1
```

```tsx
import { DocsLayout, DocsMarkdown, extractDocsHeadings } from "uipack/docs";
import "uipack/docs.css";

const headings = extractDocsHeadings(markdown)
  .filter(({ level }) => level === 2 || level === 3)
  .map(({ id, level, title }) => ({ id, level, title }));

<DocsLayout
  productTitle="Product"
  productHref="/product"
  sections={[{ title: "Start here", items: [{ title: "Overview", href: "/docs" }] }]}
  activeHref="/docs"
  onThisPage={headings}
  theme="light"
>
  <DocsMarkdown source={markdown} />
</DocsLayout>;
```

The shell, live, with real navigation and Markdown:

```uipack-demo docs-layout wide
An example product's docs page in DocsLayout: grouped sidebar, prose, on-this-page and the next link.
```

Colour comes from `--docs-*` tokens on `.uipack-docs`. `palette="warm"` (the default) is the paper-and-blue look existing hosts use; `palette="technical"` maps the same tokens to the Technical palette, as this site does. A host can also set any `--docs-*` token itself. The breadcrumb row spans the grid's width, so it starts on the navigation column's edge.

Desktop uses a grouped left sidebar, a prose column capped at 680px, and an h2/h3 table of contents that marks the section being read (`aria-current="location"`, updated on a frame-throttled scroll listener). Below 900px the sidebar becomes a native disclosure with a chevron that turns when open (Escape inside it closes it and returns focus to its summary), and the table of contents becomes an "On this page" disclosure above the page that names the current heading (also under `width="wide"` below 1280px). The layout includes a content skip link, sticky navigation landmarks, focus treatments, and previous/next links: Previous sits on the left and Next on the right whichever exists, with their text on the column edges. `DocsMarkdown` supports GFM tables, inline and fenced code, blockquote callouts, and stable anchors on h1–h6 headings. Prose links are underlined, lists keep their markers inside the column, and below 900px a table keeps at least 10rem per column and scrolls inside its wrapper instead of squeezing. Labels are at least 12px and small links have 32px targets.

## Inside a page that already has an `h1`

`DocsMarkdown` renders Markdown `#` as `h1`. When the host page has its own `h1` (a site header, a product page that embeds a README), pass `headingOffset` so the page keeps one:

```tsx
<DocsMarkdown source={readme} headingOffset={1} /> // # → h2, ## → h3, … clamped at h6
```

The default is 0, so existing pages render as before. Anchor ids come from the heading text and do not change. Pass the same offset to `extractDocsHeadings(markdown, { headingOffset: 1 })` so each heading's `level` is the rendered one, and filter the table of contents on those levels.

## Live blocks inside the Markdown

`DocsMarkdown` can render a fenced block as the host's own React node, so a page embeds a live demo while the raw file still names it and says what it shows. Register a renderer per fence language; the first word after the language is the block's id and the rest are flags:

````md
```uipack-demo layer-swap wide
One unit drawn as a slide and as a web section: swap the writing or the layout.
```
````

```tsx
<DocsMarkdown
  source={markdown}
  blocks={{ "uipack-demo": ({ id, flags, value }) => (demos[id] ? <Demo id={id} /> : undefined) }}
/>
```

Only an unindented fence becomes a block; one inside a list item, a quote or a longer fence stays code, and a renderer that returns `undefined` keeps the code block. The block renders in `.uipack-docs__block` (with `data-block`, `data-block-id` and `data-width="wide"` for the `wide` flag) between prose runs, not inside one, so the demo keeps its own styles: no prose type, link colour or box-sizing reset reaches it. Link reference definitions and heading anchors work across the cut. Without `blocks`, rendering is unchanged.

`resolveUrl(url, kind)` rewrites every link (`kind: "link"`) and image (`"image"`) after the default sanitising, so a host can send `style.md#roles` to its own route for that file and serve images from where it keeps them.

## Wide demos, the host's own header and source links

`width="wide"` lets the article column take the space between the sidebar and the table of contents (220px and 176px columns, the contents hidden below 1280px). Prose and ordinary blocks keep the 680px measure; a `wide` block (a deck, a `/web` page, a 3D scene) takes the whole column and never widens the page, at 1440 or 390. Without a table of contents the article takes that column too.

A site that already has a banner uses these, all optional and off by default:

| Prop | Does |
| --- | --- |
| `header` | Rendered in place of the product / docs identity row: the site's logo, theme toggle and phone menu |
| `mobileNavigation={false}` | Drops the below-900px disclosure when the header's menu lists the pages |
| `navigationLabel` | The sidebar's accessible name (default "Documentation"), so a docs layout shown inside the page keeps its own |
| `landmark="main"`, `contentId`, `contentLabel`, `contentClassName` | The article as the page's `<main>`, the skip link's target, its name and the host's classes |
| `markdownHref`, `editHref`, `eyebrow`, `pageMeta` | A row above the page: where the page sits (`eyebrow`: its section, its parent page), then facts about it (`pageMeta`: its style, say), "View as Markdown" and "Edit on GitHub" |

A nav item takes `items` for one level of sub-pages (a page's views), listed indented under it, and `group` for a caption shown above it when it differs from the previous item's (groups inside a section).

## Sections, the travelling marker, the drawer and search

All optional and off by default; the docs site uses every one ([its spec](specs/docs-site.md#navigation)).

| Prop | Does |
| --- | --- |
| `collapsible` | Each section's heading is a button (`aria-expanded`) with its icon, its page count and a chevron; the current page's section opens, the others fold. Sub-pages hang from a tree line. Three text levels: section label (mono caps, ink), page (14px, ink-2), sub-page (13px, ink-2, on the tree line) |
| `DocsSection.id`, `.icon`, `.hue` | Keys a section (its open state, its search results), a decorative 16px icon, and its navigation hue, any CSS colour: it marks only the heading's icon, the current-page marker and the section's search results, never text |
| `marker="plane"` or `"mark"` | The current place as a travelling marker instead of a bar: a paper plane, or the UiPack square mark. In "On this page" it travels a dotted path (a step right for each h3, the read part in the accent) to the heading being read, and a heading picked there scrolls into view and stays current until the reader scrolls on. In the sidebar it docks beside the current page in its section's hue (beside the link, or on a sub-page's tree line). The plane glides; the mark hops like a game piece: small arcs off its path (4 to 7px), each landing with a soft squash, one hop for each 36px, none shorter than 150ms and nine at most, over 300ms plus 3ms a pixel; each hop is a plain arc, a full turn, a lean, two quick skips or a pop, to either side, a fresh pick every trip. In "On this page" a hop cut short by the next heading makes for the latest one, never a queue. Decorative (`aria-hidden`); the current page keeps its weight and tinted row |
| `markerLive`, `markerColor` | With `marker="mark"`: which cell is the mark's dot (a `DocsMarkerCell`, 0 to 3 in reading order; default 3, bottom right) and the dot's colour, any CSS colour (default the section's hue in the sidebar, the accent in "On this page"; it is the `--docs-marker-dot` variable). The three squares are the ink. The mark is drawn for marker size (14px: 5px squares on a 1.25px line). A host uses the pair to show a state per page, as the docs site does with its sections |
| `markerMorph` | With `marker="mark"` and `markerMemory`: how the mark changes its dot's cell and colour on a trip between pages whose marks differ. `"none"` (default): as its last hop lifts. `"portal"`: it stops for 560ms before its last hop, a dashed ring opens, the mark turns into it and comes back out changed. `onMarkerTrip(ms, changeAt)` reports the trip with the stop, and when in it the mark changes |
| `markerMemory` | A sessionStorage key: on leaving a page the sidebar remembers it, its open sections, its scroll and the mark's cell and colour, and on the next page the marker travels from that page's link along the page column to the new one, crossing sections, the new section opening as it arrives. The plane flies with a short dotted trail, starting in the old section's hue and taking the new one; the mark hops, leaving the same trail on the column, as the old page's mark until its last hop lifts, then with this page's cell and colour. Reduced motion: it jumps |
| `onMarkerTrip` | Called with the trip's length in ms as the sidebar's marker sets off (not when it docks in place), so a host can time something of its own to the landing |
| `mobileNavigation="drawer"`, `navigationOpen`, `onNavigationOpenChange` | Below 900px the sidebar is a modal drawer from the left (`<dialog>`, named "`navigationLabel` menu"): the host's header button opens it; Escape, the scrim and its close button close it and focus returns to the button; Tab cycles inside it and the page behind holds still |
| `search` | A box at the top of the sidebar and drawer, and ⌘K / Ctrl-K, open one search dialog: a combobox over results grouped by section (each in its hue), arrow keys to move, Enter to open, Escape to close; full screen below 600px. `load()` returns the entries, called once on first open; `resolveHref` rewrites a result's address (to keep a theme query, say) |

Search is hand-rolled, with no library, WebAssembly or inline script, so it runs under a strict Content-Security-Policy. A site builds its index at build time: `docsSearchEntries(markdown, { title, href, section })` cuts each page at its h2 and h3 headings (anchor ids as `DocsMarkdown` renders them, code fences left out), and `packDocsSearchIndex(entries)` writes the compact file (each page once; each entry's first 280 characters for its snippet and its other words once, for matching), about a third the size of the full text. In the browser, `unpackDocsSearchIndex(file)` and `searchDocs(entries, query)` rank it: every word must match a word start (or inside a word from three letters), case and accents folded; a match in the page title counts most, then a heading, then the text. The docs site's index is `playground/search-index.ts`, served at `/search-index.json`.

The playground is the reference host: `playground/ShowcaseShell.tsx` renders every page in this layout, its sidebar generated from `playground/docs-manifest.ts` (one entry per page: group, route, Markdown file, demo ids). Every page renders its file through `DocsMarkdown` (`playground/MarkdownShowcase.tsx`, demos from `playground/demos.tsx`); only the deck's print and speaker windows render without the shell. The dev server and the build serve each page's file as plain text at its repo path, which "View as Markdown" opens. `npm run docs:sync` regenerates the marked blocks (`<!-- generated:<name> -->…<!-- /generated -->`) and `llms.txt` from code and the manifest; `test/docs-manifest.test.tsx` fails when one is stale, a page has no file or a docs file has no page.
