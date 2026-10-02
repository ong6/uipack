# Product documentation layout

`uipack/docs` owns the reusable product-docs shell and Markdown renderer. Import its scoped CSS once in the consumer.

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

Desktop uses a grouped left sidebar, a prose column capped at 680px, and an h2/h3 table of contents that marks the section being read (`aria-current="location"`, updated on a frame-throttled scroll listener). Below 900px the sidebar becomes a native disclosure with a chevron that turns when open, and the table of contents is hidden. The layout includes a content skip link, sticky navigation landmarks, focus treatments, and previous/next links: Previous sits on the left and Next on the right whichever exists, with their text on the column edges. `DocsMarkdown` supports GFM tables, inline and fenced code, blockquote callouts, and stable anchors on h1–h6 headings. Prose links are underlined, lists keep their markers inside the column, and below 900px a table keeps at least 10rem per column and scrolls inside its wrapper instead of squeezing. Labels are at least 12px and small links have 32px targets.
