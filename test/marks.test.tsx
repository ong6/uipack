import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { marks, Wordmark, type MarkCell } from "../src";

// The uipack mark is one mark: three outlined squares and one filled dot. `live` moves the dot to
// another cell and `liveColor` colours it (the docs site's header does, per section); without
// `live` the wordmark is the markup every other consumer already has.

const cells = (html: string) => [...html.matchAll(/<rect [^>]*>/g)].map((m) => m[0]);
const attr = (tag: string, name: string) => tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1];

describe("Wordmark", () => {
  it("draws the mark as it always has when no cell is asked for", () => {
    expect(renderToStaticMarkup(<Wordmark />)).toBe(
      '<svg viewBox="0 0 140 32" width="105" height="24" role="img" aria-label="uipack" style="display:block">' +
        '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="4" y="4" width="10" height="10" rx="2"></rect>' +
        '<rect x="18" y="4" width="10" height="10" rx="2"></rect>' +
        '<rect x="4" y="18" width="10" height="10" rx="2"></rect>' +
        '<rect x="18" y="18" width="10" height="10" rx="5" fill="currentColor"></rect>' +
        "</g>" +
        '<text x="40" y="22" font-size="18" font-weight="600" font-family="var(--uipack-mono, var(--ui-font-label, ui-monospace, monospace))" letter-spacing=".02em" fill="currentColor">uipack</text>' +
        "</svg>",
    );
    // The default mark is the exported one, not a copy.
    expect(renderToStaticMarkup(<Wordmark />)).toContain(renderToStaticMarkup(marks.uipack));
  });

  it.each([0, 1, 2, 3] as MarkCell[])("live=%i puts the one dot on that cell, in the colour given", (live) => {
    const html = renderToStaticMarkup(<Wordmark live={live} liveColor="var(--hue)" />);
    const rects = cells(html);
    expect(rects).toHaveLength(4);
    // The cells keep the mark's grid, in reading order.
    expect(rects.map((r) => `${attr(r, "x")},${attr(r, "y")}`)).toEqual(["4,4", "18,4", "4,18", "18,18"]);
    expect(rects.map((r) => attr(r, "data-cell"))).toEqual(["0", "1", "2", "3"]);
    rects.forEach((rect, cell) => {
      if (cell === live) {
        // The dot: round, filled and stroked in the colour.
        expect(attr(rect, "data-live")).toBe("");
        expect(attr(rect, "rx")).toBe("5");
        expect(attr(rect, "fill")).toBe("var(--hue)");
        expect(attr(rect, "stroke")).toBe("var(--hue)");
        expect(attr(rect, "fill-opacity")).toBeUndefined();
      } else {
        // A square: outlined in the ink (the group's stroke), nothing painted inside.
        expect(attr(rect, "data-live")).toBeUndefined();
        expect(attr(rect, "rx")).toBe("2");
        expect(attr(rect, "stroke")).toBeUndefined();
        expect(attr(rect, "fill-opacity")).toBe("0");
      }
    });
    // The name stays in the ink.
    expect(html).toMatch(/<text [^>]*fill="currentColor">uipack<\/text>/);
  });

  it("the dot is the ink unless a colour is given, and the box never changes", () => {
    const html = renderToStaticMarkup(<Wordmark size={22} live={3} />);
    const dot = cells(html)[3];
    expect(attr(dot, "fill")).toBe("currentColor");
    expect(attr(dot, "stroke")).toBe("currentColor");
    const box = (h: string) => h.match(/^<svg [^>]*>/)![0];
    expect(box(html)).toBe(box(renderToStaticMarkup(<Wordmark size={22} />)));
  });
});
