import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DocsLayout, DocsMarkdown, extractDocsHeadings, type DocsMarkdownBlock, type DocsSection } from "../src/docs";

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
    // A short inline token is marked to stay on one line (docs.css).
    expect(html).toContain('<code class="uipack-docs__token">paper mode</code>');
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

describe("DocsMarkdown host blocks", () => {
  const page = `# Page

Lead with a [ref link][ref].

\`\`\`uipack-demo layer-swap wide
Swap the writing or the layout.
\`\`\`

## After the demo

More text, the [same link][ref].

\`\`\`\`md
\`\`\`uipack-demo quoted
Inside a longer fence: documentation, not a demo.
\`\`\`
\`\`\`\`

- A list item

  \`\`\`uipack-demo indented
  Inside a list item: stays code.
  \`\`\`

[ref]: https://example.com/ref
`;
  const demo = (block: DocsMarkdownBlock) => (
    <div data-testid={`demo-${block.id}`}>
      {block.flags.join(",")}|{block.value}
    </div>
  );

  it("renders exactly as before when no blocks are registered", () => {
    expect(renderToString(<DocsMarkdown source={page} />)).toBe(renderToString(<DocsMarkdown source={page} blocks={{}} />));
    const { container } = render(<DocsMarkdown source={page} />);
    expect(container.querySelectorAll(".uipack-docs__prose")).toHaveLength(1);
    expect(container.querySelector(".uipack-docs__block")).toBeNull();
    expect(container.querySelector("code.language-uipack-demo")).toHaveTextContent("Swap the writing or the layout.");
  });

  it("replaces a registered top-level fence with the host's node, outside the prose", () => {
    const { container } = render(<DocsMarkdown source={page} blocks={{ "uipack-demo": demo }} />);
    const block = container.querySelector(".uipack-docs__block")!;
    expect(block).toHaveAttribute("data-block", "uipack-demo");
    expect(block).toHaveAttribute("data-block-id", "layer-swap");
    expect(block).toHaveAttribute("data-width", "wide");
    expect(block.closest(".uipack-docs__prose")).toBeNull();
    expect(screen.getByTestId("demo-layer-swap")).toHaveTextContent("wide|Swap the writing or the layout.");
    // Only that fence: one inside a longer fence or a list item stays code.
    expect(container.querySelectorAll(".uipack-docs__block")).toHaveLength(1);
    expect(container.textContent).toContain("Inside a longer fence");
    expect(container.textContent).toContain("Inside a list item: stays code.");
    expect(container.querySelectorAll(".uipack-docs__flow > .uipack-docs__prose")).toHaveLength(2);
  });

  it("keeps heading ids and reference links across the cut", () => {
    const { container } = render(<DocsMarkdown source={page} blocks={{ "uipack-demo": demo }} />);
    const ids = extractDocsHeadings(page).map((h) => h.id);
    expect([...container.querySelectorAll("h1, h2")].map((h) => h.id)).toEqual(ids);
    const refs = [...container.querySelectorAll("a")].filter((a) => a.getAttribute("href") === "https://example.com/ref");
    expect(refs).toHaveLength(2);
  });

  it("keeps the code block when the host declines a block", () => {
    const { container } = render(<DocsMarkdown source={page} blocks={{ "uipack-demo": () => undefined }} />);
    expect(container.querySelector(".uipack-docs__block")).toBeNull();
    expect(container.querySelector("code.language-uipack-demo")).toBeInTheDocument();
  });

  it("lets the host rewrite links and images, after sanitising", () => {
    const { container } = render(
      <DocsMarkdown
        source={"[Style](style.md#roles) ![Shot](shot.png) [Bad](javascript:alert(1))"}
        resolveUrl={(url, kind) => `/${kind}/${url}`}
      />,
    );
    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveAttribute("href", "/link/style.md#roles");
    expect(container.querySelector("img")).toHaveAttribute("src", "/image/shot.png");
    expect(links[1].getAttribute("href") ?? "").not.toContain("javascript");
  });
});

describe("DocsLayout host options", () => {
  it("defaults keep the identity row, the disclosure, a section article and the prose width", () => {
    const { container } = render(
      <DocsLayout productTitle="Product" productHref="/product" sections={sections} activeHref="/docs">
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__identity")).toBeInTheDocument();
    expect(container.querySelector(".uipack-docs__mobile-navigation")).toBeInTheDocument();
    expect(container.querySelector("section#docs-content")).toHaveAccessibleName("Documentation content");
    expect(container.querySelector(".uipack-docs")).not.toHaveAttribute("data-width");
    expect(container.querySelector(".uipack-docs__page-bar")).toBeNull();
  });

  it("takes a host header, a main landmark, a wide column, source links and nested items", () => {
    const { container } = render(
      <DocsLayout
        productTitle="Product"
        productHref="/product"
        header={<header>Site header</header>}
        mobileNavigation={false}
        navigationLabel="Library"
        width="wide"
        landmark="main"
        contentId="site-main"
        contentLabel="Overview"
        contentClassName="site-page"
        markdownHref="/docs/README.md"
        editHref="https://github.com/o/r/edit/main/docs/README.md"
        eyebrow={<span>Start here</span>}
        sections={[
          {
            title: "Components",
            items: [{ title: "Deck player", href: "/deck", items: [{ title: "Bento", href: "/deck?deck=bento" }] }],
          },
        ]}
        activeHref="/deck?deck=bento"
      >
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__identity")).toBeNull();
    expect(screen.getByRole("banner")).toHaveTextContent("Site header");
    expect(container.querySelector(".uipack-docs__mobile-navigation")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Library" })).toBeInTheDocument();
    expect(container.querySelector(".uipack-docs")).toHaveAttribute("data-width", "wide");
    expect(screen.getByRole("main", { name: "Overview" })).toHaveClass("uipack-docs__article", "site-page");
    expect(screen.getByRole("link", { name: "Skip to documentation content" })).toHaveAttribute("href", "#site-main");
    expect(screen.getByRole("link", { name: "View as Markdown" })).toHaveAttribute("href", "/docs/README.md");
    expect(screen.getByRole("link", { name: "Edit on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/o/r/edit/main/docs/README.md",
    );
    expect(screen.getByRole("link", { name: "Bento" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Deck player" })).not.toHaveAttribute("aria-current");
    expect(container.querySelector(".uipack-docs__grid")).toHaveAttribute("data-toc", "none");
  });
});
