import type { Page } from "@playwright/test";

// Packet centre in SVG user units: bounding rect mapped through the root
// SVG's viewBox scale, so Chromium and WebKit agree and scroll never matters.
export async function packetCentre(page: Page) {
  return page.evaluate(() => {
    const g = document.getElementById("e2e-packet")!;
    const svg = g.closest("svg")!;
    const s = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = s.width / vb.width;
    const r = g.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
  });
}

// A point along the connector the packet rides, in user units. t is 0..1.
export async function pathPoint(page: Page, t: number) {
  return page.evaluate((t) => {
    const p = document.getElementById("e2e-conn") as unknown as SVGPathElement;
    const pt = p.getPointAtLength(p.getTotalLength() * t);
    return { x: pt.x, y: pt.y };
  }, t);
}

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

