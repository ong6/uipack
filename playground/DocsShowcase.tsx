import {
  DocsLayout,
  DocsMarkdown,
  extractDocsHeadings,
  type DocsSection,
} from "../src/docs";
import "../src/docs/docs.css";
import { docsEntries } from "./catalog";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";

const source = `# Product guide

This layout keeps product navigation, readable prose, and local context visible without narrowing the article.

## Start with one workflow

Use the left navigation to move between pages. The right rail follows the headings in the current article.

> **Note:** On a narrow screen, documentation navigation moves into a disclosure and the local table of contents is hidden.

## Inspect the details

Inline \`code\`, fenced examples, and tables share the same measured reading column.

| Part | Purpose |
|---|---|
| Sidebar | Groups pages by section |
| Contents | Links to h2 and h3 headings |

### Follow the evidence

Heading links remain keyboard focusable and every page ends with previous and next navigation.
`;

const sections: DocsSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Getting started", href: "/docs/getting-started" },
    ],
  },
  {
    title: "How it works",
    items: [
      { title: "System overview", href: "/docs/system-overview" },
      { title: "Operations", href: "/docs/operations" },
    ],
  },
];

export default function DocsShowcase() {
  const { theme, flip } = useShowcaseTheme();
  const onThisPage = extractDocsHeadings(source)
    .filter((heading) => heading.level === 2 || heading.level === 3)
    .map(({ id, level, title }) => ({
      id,
      level: level as 2 | 3,
      title,
    }));

  return (
    <ShowcaseShell active="docs" theme={theme} flip={flip}>
      <section data-route="docs" data-catalog-entry={docsEntries[0].id}>
        <h2>{docsEntries[0].title}</h2>
        <p className="collection-intro">
          A three-column product documentation shell with responsive navigation,
          Markdown prose, heading anchors, and adjacent-page links.
        </p>
        <DocsLayout
          productTitle="Example product"
          productHref="/docs"
          sections={sections}
          activeHref="/docs"
          onThisPage={onThisPage}
          next={{ title: "Getting started", href: "/docs/getting-started" }}
          theme={theme}
        >
          <DocsMarkdown source={source} />
        </DocsLayout>
      </section>
    </ShowcaseShell>
  );
}
