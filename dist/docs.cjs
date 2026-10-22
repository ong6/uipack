"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/docs/DocsLayout.tsx
var _react = require('react');
var _jsxruntime = require('react/jsx-runtime');
function SectionNavigation({
  sections,
  activeHref
}) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "uipack-docs__navigation", "aria-label": "Documentation", children: sections.map((section) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "section", { className: "uipack-docs__nav-section", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { children: section.title }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { children: section.items.map((item) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  const [current, setCurrent] = _react.useState.call(void 0, null);
  const key = ids.join(" ");
  _react.useEffect.call(void 0, () => {
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
  children
}) {
  const mobileNavigationId = _react.useId.call(void 0, );
  const currentSection = useCurrentSection(onThisPage.map((item) => item.id));
  const current = sections.flatMap((section) => section.items).find((item) => item.href === activeHref);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-docs", "data-theme": theme, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "a", { className: "uipack-docs__skip", href: "#docs-content", children: "Skip to documentation content" }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-docs__identity", "aria-label": "Documentation home", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "a", { href: productHref, children: productTitle }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "aria-hidden": "true", children: "/" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "a", { href: _optionalChain([sections, 'access', _ => _[0], 'optionalAccess', _2 => _2.items, 'access', _3 => _3[0], 'optionalAccess', _4 => _4.href]) || activeHref, children: docsTitle })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "details", { className: "uipack-docs__mobile-navigation", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "summary", { "aria-controls": mobileNavigationId, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "Documentation" }),
        current && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "small", { children: current.title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "svg",
          {
            className: "uipack-docs__chevron",
            viewBox: "0 0 16 16",
            "aria-hidden": "true",
            focusable: "false",
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M4 6l4 4 4-4" })
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { id: mobileNavigationId, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SectionNavigation, { sections, activeHref }) })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-docs__grid", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "aside", { className: "uipack-docs__sidebar", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SectionNavigation, { sections, activeHref }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "section",
        {
          className: "uipack-docs__article",
          id: "docs-content",
          "aria-label": "Documentation content",
          tabIndex: -1,
          children: [
            children,
            (previous || next) && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              "nav",
              {
                className: "uipack-docs__pagination",
                "aria-label": "Previous and next documentation pages",
                children: [
                  previous && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "a", { href: previous.href, rel: "prev", children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "small", { children: "Previous" }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { children: [
                      "\u2190 ",
                      previous.title
                    ] })
                  ] }),
                  next && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "a", { href: next.href, rel: "next", children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "small", { children: "Next" }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { children: [
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
      onThisPage.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "aside", { className: "uipack-docs__toc", "aria-label": "On this page", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: "On this page" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ol", { children: onThisPage.map((item) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { "data-level": item.level, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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

// src/docs/DocsMarkdown.tsx





var _reactmarkdown = require('react-markdown'); var _reactmarkdown2 = _interopRequireDefault(_reactmarkdown);
var _remarkgfm = require('remark-gfm'); var _remarkgfm2 = _interopRequireDefault(_remarkgfm);

function textFromChildren(children) {
  return _react.Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }
    if (_react.isValidElement.call(void 0, child)) {
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
function tableColumns(node) {
  const row = (_nullishCoalesce(_optionalChain([node, 'optionalAccess', _5 => _5.children]), () => ( []))).flatMap((part) => part.tagName === "tr" ? [part] : _nullishCoalesce(part.children, () => ( []))).find((part) => part.tagName === "tr");
  const cells = (_nullishCoalesce(_optionalChain([row, 'optionalAccess', _6 => _6.children]), () => ( []))).filter(
    (cell) => cell.tagName === "th" || cell.tagName === "td"
  ).length;
  return Math.max(1, cells || 2);
}
function headingComponent(level, headingIds) {
  return function DocsHeading({ node, children, ...props }) {
    const title = textFromChildren(children);
    const id = headingIds.get(_optionalChain([node, 'optionalAccess', _7 => _7.position, 'optionalAccess', _8 => _8.start, 'access', _9 => _9.line]) || 0) || slugifyDocsHeading(title);
    return _react.createElement.call(void 0, 
      `h${level}`,
      { ...props, id, "aria-label": title },
      children,
      " ",
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "a",
        {
          className: "uipack-docs__heading-anchor",
          href: `#${id}`,
          "aria-label": `Link to ${title}`,
          children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "aria-hidden": "true", children: "#" })
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
    table: ({ node, ...props }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "div",
      {
        className: "uipack-docs__table",
        tabIndex: 0,
        style: { "--docs-table-columns": tableColumns(node) },
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "table", { ...props })
      }
    )
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-docs__prose", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _reactmarkdown2.default, { components, remarkPlugins: [_remarkgfm2.default], skipHtml: true, children: source }) });
}





exports.DocsLayout = DocsLayout; exports.DocsMarkdown = DocsMarkdown; exports.extractDocsHeadings = extractDocsHeadings; exports.slugifyDocsHeading = slugifyDocsHeading;
