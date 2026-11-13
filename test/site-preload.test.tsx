import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preloadLinkedPages } from "../playground/link-preload";
import { useActivated } from "../src/docs/DocsMarkers";

// The docs site loads the next page ahead of the click (docs/specs/docs-site.md, "Page changes"):
// Chromium prerenders it from index.html's speculation rules, other browsers preload its files.

describe("the speculation rules in index.html", () => {
  const html = readFileSync(resolve(process.cwd(), "playground/index.html"), "utf8");
  const body = /<script type="speculationrules">([\s\S]*?)<\/script>/.exec(html)?.[1];

  it("are valid JSON (a browser drops a rule set it cannot parse, silently): one prerender rule for the site's own pages, on hover or press", () => {
    expect(body).toBeDefined();
    const rules = JSON.parse(body!) as { prerender: { where: { and: unknown[] }; eagerness: string }[] };
    expect(Object.keys(rules)).toEqual(["prerender"]);
    expect(rules.prerender).toHaveLength(1);
    expect(rules.prerender[0].eagerness).toBe("moderate");
    const [pages, ...not] = rules.prerender[0].where.and;
    expect(pages).toEqual({ href_matches: "/*" });
    // Files, the deck's own windows, links into the page, the current page and links that open elsewhere.
    expect(not).toEqual([
      { not: { href_matches: "/*.*" } },
      { not: { href_matches: "/*\\?*view=print*" } },
      { not: { href_matches: "/*\\?*presenter=1*" } },
      { not: { selector_matches: "[href^='#'], [aria-current='page'], [target='_blank'], [download]" } },
    ]);
  });
});

describe("the first paint in index.html", () => {
  const html = readFileSync(resolve(process.cwd(), "playground/index.html"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const style = /<style>([\s\S]*?)<\/style>/.exec(head)?.[1] ?? "";

  it("has the ground and the colour scheme inline, before any script, in the site's own two colours", () => {
    const palette = readFileSync(resolve(process.cwd(), "playground/site-palette.css"), "utf8");
    const [, light, dark] = /--show-bg:\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/.exec(palette)!;
    expect(head.indexOf("<style>")).toBeGreaterThan(0);
    expect(head.indexOf("<style>")).toBeLessThan(head.indexOf("<script"));
    expect(head).toContain('<meta name="color-scheme" content="light dark" />');
    const rules = style.replace(/\s+/g, " ");
    // The system's scheme first, then the reader's choice (data-theme, set by the theme script).
    expect(rules).toContain(`html { background: ${light}; color-scheme: light; }`);
    expect(rules).toContain(`@media (prefers-color-scheme: dark) { html { background: ${dark}; color-scheme: dark; } }`);
    expect(rules).toContain(`html[data-theme="light"] { background: ${light}; color-scheme: light; }`);
    expect(rules).toContain(`html[data-theme="dark"] { background: ${dark}; color-scheme: dark; }`);
  });

  it("opts into cross-document view transitions, but not with reduced motion", () => {
    expect(style.replace(/\s+/g, " ")).toContain(
      "@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }",
    );
    expect(style.match(/@view-transition/g)).toHaveLength(1);
  });

  it("holds until the entry has rendered: a render-blocking module script in the head", () => {
    expect(head).toContain('<script type="module" blocking="render" src="/main.tsx"></script>');
    expect(html.slice(html.indexOf("</head>"))).not.toContain("<script");
  });
});

describe("preloadLinkedPages, where there are no speculation rules", () => {
  const table = {
    a: ["/assets/Page-1.js", "/assets/Page-1.css", "/assets/Landing-2.js", "/assets/Landing-2.css"],
    m: { MarkdownShowcase: [0, 1], LandingShowcase: [2, 3] },
    r: { "/": "LandingShowcase", "/foundations/style": "MarkdownShowcase", "/start/install": "MarkdownShowcase" },
  };
  const listeners: [string, EventListener][] = [];
  const setup = (supports: boolean, withTable = true) => {
    document.head.innerHTML = withTable
      ? `<script type="application/json" id="uipack-preloads">${JSON.stringify(table)}</script>`
      : "";
    document.body.innerHTML = `<a id="style" href="/foundations/style?theme=light"><span>Style</span></a>
      <a id="install" href="/start/install?theme=light">Install</a><a id="file" href="/docs/install.md">File</a>
      <a id="out" href="https://example.com/foundations/style">Out</a><a id="tab" href="/start/install" target="_blank">Tab</a>`;
    vi.spyOn(HTMLScriptElement, "supports").mockReturnValue(supports);
    const add = vi.spyOn(window, "addEventListener").mockImplementation(((type: string, listener: EventListener) => {
      listeners.push([type, listener]);
    }) as typeof window.addEventListener);
    preloadLinkedPages();
    add.mockRestore();
  };
  const fire = (type: string, target: Element) => {
    for (const [t, listener] of listeners) if (t === type) listener({ type, target } as unknown as Event);
  };
  const links = () =>
    [...document.head.querySelectorAll("link")].map((l) => [l.rel, l.getAttribute("href"), l.getAttribute("as")]);

  afterEach(() => {
    listeners.length = 0;
    vi.restoreAllMocks();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  if (!("supports" in HTMLScriptElement))
    (HTMLScriptElement as unknown as { supports: (type: string) => boolean }).supports = () => false;

  it("preloads a linked page's module and styles when the reader points at its link, once", () => {
    setup(false);
    expect(listeners.map(([t]) => t).sort()).toEqual(["focusin", "pointerdown", "pointerover", "touchstart"]);
    // The pointer is on the link's text, not the link itself.
    fire("pointerover", document.querySelector("#style span")!);
    expect(links()).toEqual([
      ["modulepreload", "/assets/Page-1.js", null],
      ["preload", "/assets/Page-1.css", "style"],
    ]);
    fire("pointerdown", document.querySelector("#style")!);
    expect(links()).toHaveLength(2);
    // Another page of the same kind needs nothing more: its text comes in its own HTML.
    fire("focusin", document.querySelector("#install")!);
    expect(links()).toHaveLength(2);
    // A file, another site and a link that opens elsewhere preload nothing.
    for (const id of ["file", "out", "tab"]) fire("pointerover", document.querySelector(`#${id}`)!);
    expect(links()).toHaveLength(2);
  });

  it("does nothing where the browser prerenders, or on the dev server, which has no preload table", () => {
    setup(true);
    expect(listeners).toEqual([]);
    setup(false, false);
    expect(listeners).toEqual([]);
  });
});

describe("useActivated", () => {
  afterEach(() => {
    delete (document as { prerendering?: boolean }).prerendering;
  });

  it("is false while the document is prerendered and true from the moment it is shown", () => {
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useActivated());
      return null;
    }
    (document as { prerendering?: boolean }).prerendering = true;
    render(<Probe />);
    expect(seen.at(-1)).toBe(false);
    act(() => {
      (document as { prerendering?: boolean }).prerendering = false;
      document.dispatchEvent(new Event("prerenderingchange"));
    });
    expect(seen.at(-1)).toBe(true);
  });

  it("is true on an ordinary load", () => {
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useActivated());
      return null;
    }
    render(<Probe />);
    expect(seen).toEqual([true]);
  });
});
