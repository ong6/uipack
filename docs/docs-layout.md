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
