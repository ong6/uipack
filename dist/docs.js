import { useId, useState, useEffect, createElement, Children, isValidElement } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// src/docs/DocsLayout.tsx
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
function useCurrentSection(ids) {
  const [current, setCurrent] = useState(null);
  const key = ids.join(" ");
  useEffect(() => {
    const headings = ids.map((id) => document.getElementById(id)).filter((element) => element !== null);
    if (headings.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let next = null;
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top <= line || atEnd && top < window.innerHeight) next = heading.id;
      }
      setCurrent(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key]);
  return current;
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
  palette = "warm",
  children
}) {
  const mobileNavigationId = useId();
  const currentSection = useCurrentSection(onThisPage.map((item) => item.id));
  const current = sections.flatMap((section) => section.items).find((item) => item.href === activeHref);
  return /* @__PURE__ */ jsxs("div", { className: "uipack-docs", "data-theme": theme, "data-palette": palette, children: [
    /* @__PURE__ */ jsx("a", { className: "uipack-docs__skip", href: "#docs-content", children: "Skip to documentation content" }),
    /* @__PURE__ */ jsxs("div", { className: "uipack-docs__identity", "aria-label": "Documentation home", children: [
      /* @__PURE__ */ jsx("a", { href: productHref, children: productTitle }),
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "/" }),
      /* @__PURE__ */ jsx("a", { href: sections[0]?.items[0]?.href || activeHref, children: docsTitle })
    ] }),
    /* @__PURE__ */ jsxs(
      "details",
      {
        className: "uipack-docs__mobile-navigation",
        onKeyDown: (e) => {
          const details = e.currentTarget;
          if (e.key !== "Escape" || !details.open || e.defaultPrevented) return;
          e.preventDefault();
          details.open = false;
          details.querySelector("summary")?.focus();
        },
        children: [
          /* @__PURE__ */ jsxs("summary", { "aria-controls": mobileNavigationId, children: [
            /* @__PURE__ */ jsx("span", { children: "Documentation" }),
            current && /* @__PURE__ */ jsx("small", { children: current.title }),
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: "uipack-docs__chevron",
                viewBox: "0 0 16 16",
                "aria-hidden": "true",
                focusable: "false",
                children: /* @__PURE__ */ jsx("path", { d: "M4 6l4 4 4-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { id: mobileNavigationId, children: /* @__PURE__ */ jsx(SectionNavigation, { sections, activeHref }) })
        ]
      }
    ),
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
                  previous && /* @__PURE__ */ jsxs("a", { href: previous.href, rel: "prev", children: [
                    /* @__PURE__ */ jsx("small", { children: "Previous" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "\u2190 ",
                      previous.title
                    ] })
                  ] }),
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
        /* @__PURE__ */ jsx("ol", { children: onThisPage.map((item) => /* @__PURE__ */ jsx("li", { "data-level": item.level, children: /* @__PURE__ */ jsx(
          "a",
          {
            href: `#${item.id}`,
            "aria-current": item.id === currentSection ? "location" : void 0,
            children: item.title
          }
        ) }, item.id)) })
      ] })
    ] })
  ] });
}
function shiftLevel(level, offset = 0) {
  const shift = Number.isFinite(offset) ? Math.trunc(offset) : 0;
  return Math.min(6, Math.max(1, level + shift));
}
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
function extractDocsHeadings(source, { headingOffset = 0 } = {}) {
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
      level: shiftLevel(match[1].length, headingOffset),
      line: index + 1,
      title
    });
  });
  return headings;
}
function tableColumns(node) {
  const row = (node?.children ?? []).flatMap((part) => part.tagName === "tr" ? [part] : part.children ?? []).find((part) => part.tagName === "tr");
  const cells = (row?.children ?? []).filter(
    (cell) => cell.tagName === "th" || cell.tagName === "td"
  ).length;
  return Math.max(1, cells || 2);
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
      /* @__PURE__ */ jsx(
        "a",
        {
          className: "uipack-docs__heading-anchor",
          href: `#${id}`,
          "aria-label": `Link to ${title}`,
          children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "#" })
        }
      )
    );
  };
}
function DocsMarkdown({ source, headingOffset = 0 }) {
  const headingIds = new Map(
    extractDocsHeadings(source).map((heading2) => [heading2.line, heading2.id])
  );
  const heading = (level) => headingComponent(shiftLevel(level, headingOffset), headingIds);
  const components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    table: ({ node, ...props }) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "uipack-docs__table",
        tabIndex: 0,
        style: { "--docs-table-columns": tableColumns(node) },
        children: /* @__PURE__ */ jsx("table", { ...props })
      }
    )
  };
  return /* @__PURE__ */ jsx("div", { className: "uipack-docs__prose", children: /* @__PURE__ */ jsx(ReactMarkdown, { components, remarkPlugins: [remarkGfm], skipHtml: true, children: source }) });
}

export { DocsLayout, DocsMarkdown, extractDocsHeadings, slugifyDocsHeading };
