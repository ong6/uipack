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

Desktop uses a grouped left sidebar, a prose column capped at 680px, and an h2/h3 table of contents. Below 900px the sidebar becomes a native disclosure and the table of contents is hidden. The layout includes a content skip link, sticky navigation landmarks, focus treatments, and previous/next links. `DocsMarkdown` supports GFM tables, inline and fenced code, blockquote callouts, and stable anchors on h1–h6 headings.
