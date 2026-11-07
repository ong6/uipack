import { figureFindings } from "../bin/uipack-figure-check.mjs";

// The figure geometry check a site runs (bin/uipack-figure-check.mjs): its decisions on plain
// geometry, in user units. The browser half (collectFigures) runs in e2e/geometry.spec.ts.
const label = { text: "REST-RULE BREACH", x: 56, y: 480, w: 150, h: 17 };
const vertical = (x: number, y0: number, y1: number) => ({
  pts: Array.from({ length: (y1 - y0) / 2 + 1 }, (_, i) => [x, y0 + i * 2] as [number, number]),
});
const horizontal = (y: number, x0: number, x1: number) => ({
  pts: Array.from({ length: (x1 - x0) / 2 + 1 }, (_, i) => [x0 + i * 2, y] as [number, number]),
});

describe("figureFindings", () => {
  it("fails a connector that crosses a label away from its middle (the 390 overlap)", () => {
    const { problems } = figureFindings({ labels: [label], lines: [vertical(196, 472, 512)], boxes: [] });
    expect(problems).toEqual(['a connector crosses the label "REST-RULE BREACH" at 196,482']);
  });

  it("passes a label sitting on its own line: run along it, or centred on a vertical arrow", () => {
    const along = horizontal(488, 20, 260);
    const centred = vertical(131, 440, 540);
    expect(figureFindings({ labels: [label], lines: [along, centred], boxes: [] }).problems).toEqual([]);
  });

  it("fails a label drawn over a node or over another label", () => {
    const node = { kind: "node" as const, text: "Validate", x: 200, y: 470, w: 160, h: 56 };
    const other = { text: "ORDER", x: 120, y: 484, w: 44, h: 17 };
    expect(figureFindings({ labels: [label, other], lines: [], boxes: [node] }).problems).toEqual([
      'the label "REST-RULE BREACH" is drawn over the node "Validate"',
      'the labels "REST-RULE BREACH" and "ORDER" overlap',
    ]);
  });

  it("lists, without failing, a connector with no label beside it", () => {
    const { problems, unlabelled } = figureFindings({ labels: [label], lines: [horizontal(200, 600, 700)], boxes: [] });
    expect(problems).toEqual([]);
    expect(unlabelled).toEqual(["600,200 → 700,200"]);
  });
});
