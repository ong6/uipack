import { render } from "@testing-library/react";
import { CurvePlot, Figure, Sheet, TreeRail, curveAt, type CurvePoint } from "../src";

const wrap = (ui: React.ReactNode) =>
  render(
    <Figure viewBox="0 0 400 300" alt="test">
      {ui}
    </Figure>,
  );

const STEP: CurvePoint[] = [
  [0, 0.9],
  [0.1, 0.9],
  [0.2, 0.5],
  [0.3, 0.1],
  [0.4, 0.1],
  [1, 0.1],
];

describe("curveAt", () => {
  it("passes through every point", () => {
    for (const [x, y] of STEP) expect(curveAt(STEP, x)).toBeCloseTo(y, 6);
  });
  it("never overshoots a plateau or dips below a floor (monotone)", () => {
    for (let x = 0; x <= 1; x += 0.005) {
      const y = curveAt(STEP, x);
      expect(y).toBeLessThanOrEqual(0.9 + 1e-9);
      expect(y).toBeGreaterThanOrEqual(0.1 - 1e-9);
    }
    expect(curveAt(STEP, 0.05)).toBeCloseTo(0.9, 9);
    expect(curveAt(STEP, 0.7)).toBeCloseTo(0.1, 9);
  });
});

describe("CurvePlot", () => {
  it("draws upper-cased axis titles, pinned notes and one accent ring", () => {
    const { container } = wrap(
      <CurvePlot
        x={40}
        y={20}
        w={300}
        h={200}
        points={STEP}
        xTitle="Items"
        yTitle="Size"
        notes={[
          { at: 0.05, label: "Start" },
          { at: 0.3, label: "Knee", accent: true },
        ]}
        measure={{ at: 0.8, label: "Floor" }}
      />,
    );
    const text = container.textContent!;
    for (const t of ["ITEMS", "SIZE", "START", "KNEE", "FLOOR"]) expect(text).toContain(t);
    expect(container.querySelectorAll('[data-uipack="curve-note"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-uipack="curve-note"] circle')).toHaveLength(1);
    expect(container.querySelector('[data-uipack="curve-measure"]')).not.toBeNull();
  });
});

describe("TreeRail and Sheet", () => {
  it("puts a junction dot at every branch", () => {
    const { container } = wrap(<TreeRail x={10} y={0} rows={[20, 60, 100]} to={40} />);
    expect(container.querySelectorAll('[data-uipack="tree-rail"] [data-uipack="junction"]')).toHaveLength(3);
    expect(container.querySelector('[data-uipack="tree-rail"] path')!.getAttribute("d")).toBe(
      "M10,0 V100 M10,20 H40 M10,60 H40 M10,100 H40",
    );
  });
  it("labels a sheet with its upper-cased name and draws the rule only with contents", () => {
    const { container, rerender } = wrap(<Sheet x={0} y={0} w={300} h={80} name="a.zip" title="Archive" />);
    expect(container.textContent).toContain("A.ZIP");
    expect(container.querySelector('[data-uipack="sheet"] line')).toBeNull();
    rerender(
      <Figure viewBox="0 0 400 300" alt="test">
        <Sheet x={0} y={0} w={300} h={160} name="a.zip" title="Archive">
          <rect />
        </Sheet>
      </Figure>,
    );
    expect(container.querySelector('[data-uipack="sheet"] line')).not.toBeNull();
  });
});
