"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/docs/index.ts
var docs_exports = {};
__export(docs_exports, {
  DocsLayout: () => DocsLayout,
  DocsMarkdown: () => DocsMarkdown,
  extractDocsHeadings: () => extractDocsHeadings,
  slugifyDocsHeading: () => slugifyDocsHeading
});
module.exports = __toCommonJS(docs_exports);

// src/docs/DocsLayout.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function SectionNavigation({
  sections,
  activeHref
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "uipack-docs__navigation", "aria-label": "Documentation", children: sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "uipack-docs__nav-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: section.title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: section.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  const mobileNavigationId = (0, import_react.useId)();
  const current = sections.flatMap((section) => section.items).find((item) => item.href === activeHref);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-docs", "data-theme": theme, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: "uipack-docs__skip", href: "#docs-content", children: "Skip to documentation content" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-docs__identity", "aria-label": "Documentation home", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: productHref, children: productTitle }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "/" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: sections[0]?.items[0]?.href || activeHref, children: docsTitle })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: "uipack-docs__mobile-navigation", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { "aria-controls": mobileNavigationId, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Documentation" }),
        current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: current.title })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: mobileNavigationId, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionNavigation, { sections, activeHref }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-docs__grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", { className: "uipack-docs__sidebar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionNavigation, { sections, activeHref }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "section",
        {
          className: "uipack-docs__article",
          id: "docs-content",
          "aria-label": "Documentation content",
          tabIndex: -1,
          children: [
            children,
            (previous || next) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "nav",
              {
                className: "uipack-docs__pagination",
                "aria-label": "Previous and next documentation pages",
                children: [
                  previous ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: previous.href, rel: "prev", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Previous" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                      "\u2190 ",
                      previous.title
                    ] })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
                  next && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: next.href, rel: "next", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Next" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
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
      onThisPage.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "uipack-docs__toc", "aria-label": "On this page", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "On this page" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: onThisPage.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { "data-level": item.level, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `#${item.id}`, children: item.title }) }, item.id)) })
      ] })
    ] })
  ] });
}

// src/docs/DocsMarkdown.tsx
var import_react2 = require("react");
var import_react_markdown = __toESM(require("react-markdown"), 1);
var import_remark_gfm = __toESM(require("remark-gfm"), 1);
var import_jsx_runtime2 = require("react/jsx-runtime");
function textFromChildren(children) {
  return import_react2.Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }
    if ((0, import_react2.isValidElement)(child)) {
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
    return (0, import_react2.createElement)(
      `h${level}`,
      { ...props, id, "aria-label": title },
      children,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "a",
        {
          className: "uipack-docs__heading-anchor",
          href: `#${id}`,
          "aria-label": `Link to ${title}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "#" })
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
    table: ({ node: _node, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-docs__table", tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("table", { ...props }) })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-docs__prose", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react_markdown.default, { components, remarkPlugins: [import_remark_gfm.default], children: source }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DocsLayout,
  DocsMarkdown,
  extractDocsHeadings,
  slugifyDocsHeading
});
//# sourceMappingURL=docs.cjs.map