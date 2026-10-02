// src/docs/DocsLayout.tsx
import { useId } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function SectionNavigation({
  sections,
  activeHref
}) {
  return /* @__PURE__ */ jsx("nav", { className: "uipack-docs__navigation", "aria-label": "Documentation", children: sections.map((section) => /* @__PURE__ */ jsxs("section", { className: "uipack-docs__nav-section", children: [
    /* @__PURE__ */ jsx("h2", { children: section.title }),
    /* @__PURE__ */ jsx("ul", { children: section.items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "a",
      {
        href: item.href,
        "aria-current": item.href === activeHref ? "page" : void 0,
        children: item.title
      }
    ) }, item.href)) })
  ] }, section.title)) });
}
function DocsLayout({
  productTitle,
  productHref,
  docsTitle = "Product docs",
  sections,
  activeHref,
  onThisPage = [],
  previous,
  next,
  theme,
  children
}) {
  const mobileNavigationId = useId();
  const current = sections.flatMap((section) => section.items).find((item) => item.href === activeHref);
  return /* @__PURE__ */ jsxs("div", { className: "uipack-docs", "data-theme": theme, children: [
    /* @__PURE__ */ jsx("a", { className: "uipack-docs__skip", href: "#docs-content", children: "Skip to documentation content" }),
    /* @__PURE__ */ jsxs("div", { className: "uipack-docs__identity", "aria-label": "Documentation home", children: [
      /* @__PURE__ */ jsx("a", { href: productHref, children: productTitle }),
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "/" }),
      /* @__PURE__ */ jsx("a", { href: sections[0]?.items[0]?.href || activeHref, children: docsTitle })
    ] }),
    /* @__PURE__ */ jsxs("details", { className: "uipack-docs__mobile-navigation", children: [
      /* @__PURE__ */ jsxs("summary", { "aria-controls": mobileNavigationId, children: [
        /* @__PURE__ */ jsx("span", { children: "Documentation" }),
        current && /* @__PURE__ */ jsx("small", { children: current.title })
      ] }),
      /* @__PURE__ */ jsx("div", { id: mobileNavigationId, children: /* @__PURE__ */ jsx(SectionNavigation, { sections, activeHref }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "uipack-docs__grid", children: [
      /* @__PURE__ */ jsx("aside", { className: "uipack-docs__sidebar", children: /* @__PURE__ */ jsx(SectionNavigation, { sections, activeHref }) }),
      /* @__PURE__ */ jsxs(
        "section",
        {
          className: "uipack-docs__article",
          id: "docs-content",
          "aria-label": "Documentation content",
          tabIndex: -1,
          children: [
            children,
            (previous || next) && /* @__PURE__ */ jsxs(
              "nav",
              {
                className: "uipack-docs__pagination",
                "aria-label": "Previous and next documentation pages",
                children: [
                  previous ? /* @__PURE__ */ jsxs("a", { href: previous.href, rel: "prev", children: [
                    /* @__PURE__ */ jsx("small", { children: "Previous" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "\u2190 ",
                      previous.title
                    ] })
                  ] }) : /* @__PURE__ */ jsx("span", {}),
                  next && /* @__PURE__ */ jsxs("a", { href: next.href, rel: "next", children: [
                    /* @__PURE__ */ jsx("small", { children: "Next" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      next.title,
                      " \u2192"
                    ] })
                  ] })
                ]
              }
            )
          ]
        }
      ),
      onThisPage.length > 0 && /* @__PURE__ */ jsxs("aside", { className: "uipack-docs__toc", "aria-label": "On this page", children: [
        /* @__PURE__ */ jsx("p", { children: "On this page" }),
        /* @__PURE__ */ jsx("ol", { children: onThisPage.map((item) => /* @__PURE__ */ jsx("li", { "data-level": item.level, children: /* @__PURE__ */ jsx("a", { href: `#${item.id}`, children: item.title }) }, item.id)) })
      ] })
    ] })
  ] });
}

// src/docs/DocsMarkdown.tsx
import {
  Children,
  createElement,
  isValidElement
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsx as jsx2 } from "react/jsx-runtime";
function textFromChildren(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }
    if (isValidElement(child)) {
      return textFromChildren(child.props.children);
    }
    return "";
  }).join("");
}
function plainHeadingText(markdown) {
  return markdown.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_~]/g, "").replace(/<[^>]+>/g, "").trim();
}
function slugifyDocsHeading(value) {
  return value.normalize("NFKD").toLocaleLowerCase("en-US").replace(/[’']/g, "").replace(/[^\p{Letter}\p{Number}\s-]/gu, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}
function extractDocsHeadings(source) {
  const headings = [];
  const occurrences = /* @__PURE__ */ new Map();
  let fence = null;
  source.split("\n").forEach((line, index) => {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = null;
      return;
    }
    if (fence) return;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return;
    const title = plainHeadingText(match[2]);
    const baseId = slugifyDocsHeading(title) || `heading-${index + 1}`;
    const count = occurrences.get(baseId) || 0;
    occurrences.set(baseId, count + 1);
    headings.push({
      id: count === 0 ? baseId : `${baseId}-${count}`,
      level: match[1].length,
      line: index + 1,
      title
    });
  });
  return headings;
}
function headingComponent(level, headingIds) {
  return function DocsHeading({ node, children, ...props }) {
    const title = textFromChildren(children);
    const id = headingIds.get(node?.position?.start.line || 0) || slugifyDocsHeading(title);
    return createElement(
      `h${level}`,
      { ...props, id, "aria-label": title },
      children,
      " ",
      /* @__PURE__ */ jsx2(
        "a",
        {
          className: "uipack-docs__heading-anchor",
          href: `#${id}`,
          "aria-label": `Link to ${title}`,
          children: /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "#" })
        }
      )
    );
  };
}
function DocsMarkdown({ source }) {
  const headingIds = new Map(
    extractDocsHeadings(source).map((heading) => [heading.line, heading.id])
  );
  const components = {
    h1: headingComponent(1, headingIds),
    h2: headingComponent(2, headingIds),
    h3: headingComponent(3, headingIds),
    h4: headingComponent(4, headingIds),
    h5: headingComponent(5, headingIds),
    h6: headingComponent(6, headingIds),
    table: ({ node: _node, ...props }) => /* @__PURE__ */ jsx2("div", { className: "uipack-docs__table", tabIndex: 0, children: /* @__PURE__ */ jsx2("table", { ...props }) })
  };
  return /* @__PURE__ */ jsx2("div", { className: "uipack-docs__prose", children: /* @__PURE__ */ jsx2(ReactMarkdown, { components, remarkPlugins: [remarkGfm], children: source }) });
}
export {
  DocsLayout,
  DocsMarkdown,
  extractDocsHeadings,
  slugifyDocsHeading
};
//# sourceMappingURL=docs.js.map