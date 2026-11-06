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

Colour comes from `--docs-*` tokens on `.uipack-docs`. `palette="warm"` (the default) is the paper-and-blue look existing hosts use; `palette="technical"` maps the same tokens to UI Pack's Technical palette (forest `#205f49` / mint `#71dcb2` accent, `#14201b` dark surfaces), as the `/docs` playground page does. A host can also set any `--docs-*` token itself. The breadcrumb row spans the grid's width, so it starts on the navigation column's edge.

Desktop uses a grouped left sidebar, a prose column capped at 680px, and an h2/h3 table of contents that marks the section being read (`aria-current="location"`, updated on a frame-throttled scroll listener). Below 900px the sidebar becomes a native disclosure with a chevron that turns when open (Escape inside it closes it and returns focus to its summary), and the table of contents is hidden. The layout includes a content skip link, sticky navigation landmarks, focus treatments, and previous/next links: Previous sits on the left and Next on the right whichever exists, with their text on the column edges. `DocsMarkdown` supports GFM tables, inline and fenced code, blockquote callouts, and stable anchors on h1–h6 headings. Prose links are underlined, lists keep their markers inside the column, and below 900px a table keeps at least 10rem per column and scrolls inside its wrapper instead of squeezing. Labels are at least 12px and small links have 32px targets.

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
| `markdownHref`, `editHref`, `eyebrow` | A row above the page: a context line, "View as Markdown" and "Edit on GitHub" |

A nav item takes `items` for one level of sub-pages (a page's views), listed indented under it.

The playground is the reference host: `playground/ShowcaseShell.tsx` renders every page in this layout, its sidebar generated from `playground/docs-manifest.ts` (one entry per page: group, route, Markdown file, demo ids). A page renders its file through `DocsMarkdown` (`playground/MarkdownShowcase.tsx`, demos from `playground/demos.tsx`), or its showcase module until its Markdown is written. The dev server and the build serve each page's file as plain text at its repo path, which "View as Markdown" opens. `npm run docs:sync` regenerates the marked blocks (`<!-- generated:<name> -->…<!-- /generated -->`) and `llms.txt` from code and the manifest; `test/docs-manifest.test.tsx` fails when one is stale, a page has no file or a docs file has no page.
