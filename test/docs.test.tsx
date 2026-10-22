import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DocsLayout, DocsMarkdown, extractDocsHeadings, type DocsSection } from "../src/docs";

const source = `# Overview

## First step

> **Note:** Keep the boundary visible.

Use \`paper mode\`.

| State | Meaning |
|---|---|
| ready | The input passed. |

### Details

<!-- sources: private-review-path.md -->
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
    expect(extractDocsHeadings("## Same\n\n```md\n## Ignored\n```\n\n## Same")).toEqual([
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
    expect(screen.getAllByRole("link", { name: "Overview" })[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("complementary", { name: "On this page" })).toHaveTextContent("First step");
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
    expect(html).not.toContain("private-review-path");
  });

  it("keeps Markdown heading levels by default", () => {
    const html = renderToString(<DocsMarkdown source={source} />);
    expect(html).toMatch(/<h1 id="overview"/);
    expect(html).toMatch(/<h2 id="first-step"/);
  });

  it("shifts heading levels by headingOffset so a host page keeps the only h1", () => {
    const html = renderToString(<DocsMarkdown source={`${source}\n#### Four\n\n###### Six\n`} headingOffset={1} />);
    expect(html).not.toMatch(/<h1[\s>]/);
    expect(html).toMatch(/<h2 id="overview"/);
    expect(html).toMatch(/<h3 id="first-step"/);
    expect(html).toMatch(/<h4 id="details"/);
    expect(html).toMatch(/<h5 id="four"/);
    // Clamped at h6, and anchors are unchanged by the offset.
    expect(html).toMatch(/<h6 id="six"/);
    expect(html).toContain('href="#first-step"');
  });

  it("reports rendered levels from extractDocsHeadings with the same offset", () => {
    expect(extractDocsHeadings("# Title\n\n## Part\n\n###### Deep", { headingOffset: 1 }).map((h) => [h.id, h.level])).toEqual([
      ["title", 2],
      ["part", 3],
      ["deep", 6],
    ]);
    expect(extractDocsHeadings("# Title").map((h) => h.level)).toEqual([1]);
  });

  it("gives tables their column count so narrow layouts can scroll them", () => {
    const html = renderToString(<DocsMarkdown source={"| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |"} />);
    expect(html).toContain("--docs-table-columns:3");
  });

  it("places a lone previous link without a placeholder", () => {
    const { container } = render(
      <DocsLayout
        productTitle="Product"
        productHref="/product"
        sections={sections}
        activeHref="/docs/next"
        previous={{ title: "Overview", href: "/docs" }}
      >
        <p>Last page</p>
      </DocsLayout>,
    );
    const pagination = container.querySelector(".uipack-docs__pagination")!;
    expect(pagination.children).toHaveLength(1);
    expect(pagination.firstElementChild).toHaveAttribute("rel", "prev");
    expect(container.querySelector(".uipack-docs__chevron")).toBeInTheDocument();
  });
});
