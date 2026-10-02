import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  DocsLayout,
  DocsMarkdown,
  extractDocsHeadings,
  type DocsSection,
} from "../src/docs";

const source = `# Overview

## First step

> **Note:** Keep the boundary visible.

Use \`paper mode\`.

| State | Meaning |
|---|---|
| ready | The input passed. |

### Details
`;

const sections: DocsSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Next page", href: "/docs/next" },
    ],
  },
];

describe("product documentation", () => {
  it("extracts stable unique heading anchors outside code fences", () => {
    expect(
      extractDocsHeadings("## Same\n\n```md\n## Ignored\n```\n\n## Same"),
    ).toEqual([
      { id: "same", level: 2, line: 1, title: "Same" },
      { id: "same-1", level: 2, line: 7, title: "Same" },
    ]);
  });

  it("renders navigation landmarks, current page, contents, and neighbours", () => {
    render(
      <DocsLayout
        productTitle="Product"
        productHref="/product"
        sections={sections}
        activeHref="/docs"
        onThisPage={[{ id: "first-step", title: "First step", level: 2 }]}
        next={{ title: "Next page", href: "/docs/next" }}
      >
        <DocsMarkdown source={source} />
      </DocsLayout>,
    );

    expect(screen.getAllByRole("navigation", { name: "Documentation" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Overview" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("complementary", { name: "On this page" })).toHaveTextContent(
      "First step",
    );
    expect(
      screen.getByRole("navigation", {
        name: "Previous and next documentation pages",
      }),
    ).toHaveTextContent("Next page");
  });

  it("renders GFM tables, inline code, callouts, and heading links during SSR", () => {
    const html = renderToString(<DocsMarkdown source={source} />);
    expect(html).toContain("<table>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<code>paper mode</code>");
    expect(html).toContain('id="first-step"');
    expect(html).toContain('href="#details"');
  });
});
