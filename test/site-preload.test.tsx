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

describe("preloadLinkedPages, where there are no speculation rules", () => {
  const table = {
    a: ["/assets/Page-1.js", "/assets/Page-1.css", "/assets/Landing-2.js", "/assets/style-3.js", "/assets/install-4.js"],
    m: { MarkdownShowcase: [0, 1], LandingShowcase: [2] },
    r: { "/": "LandingShowcase", "/foundations/style": "MarkdownShowcase", "/start/install": "MarkdownShowcase" },
    d: { "/foundations/style": 3, "/start/install": 4 },
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

  it("preloads a linked page's module, styles and Markdown chunk when the reader points at its link, once", () => {
    setup(false);
    expect(listeners.map(([t]) => t).sort()).toEqual(["focusin", "pointerdown", "pointerover", "touchstart"]);
    // The pointer is on the link's text, not the link itself.
    fire("pointerover", document.querySelector("#style span")!);
    expect(links()).toEqual([
      ["modulepreload", "/assets/Page-1.js", null],
      ["preload", "/assets/Page-1.css", "style"],
      ["modulepreload", "/assets/style-3.js", null],
    ]);
    fire("pointerdown", document.querySelector("#style")!);
    expect(links()).toHaveLength(3);
    // Another page of the same kind: only its own Markdown chunk is new.
    fire("focusin", document.querySelector("#install")!);
    expect(links().at(-1)).toEqual(["modulepreload", "/assets/install-4.js", null]);
    expect(links()).toHaveLength(4);
    // A file, another site and a link that opens elsewhere preload nothing.
    for (const id of ["file", "out", "tab"]) fire("pointerover", document.querySelector(`#${id}`)!);
    expect(links()).toHaveLength(4);
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
