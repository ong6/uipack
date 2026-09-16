import { anchor, pathFromPoints, pointAlong, route } from "../src";

describe("geometry", () => {
  it("anchor picks the edge centre by default", () => {
    const b = { x: 10, y: 20, w: 100, h: 40 };
    expect(anchor(b, "right")).toEqual([110, 40]);
    expect(anchor(b, "bottom", 0.25)).toEqual([35, 60]);
  });
  it("route returns two points for a straight line", () => {
    expect(route([0, 0], [100, 0])).toEqual([[0, 0], [100, 0]]);
  });
  it("route elbows horizontally first at the midpoint", () => {
    expect(route([0, 0], [100, 50], "h")).toEqual([[0, 0], [50, 0], [50, 50], [100, 50]]);
  });
  it("route elbows at an absolute x when given a number", () => {
    expect(route([0, 0], [100, 50], 80, "h")).toEqual([[0, 0], [80, 0], [80, 50], [100, 50]]);
  });
  it("pathFromPoints rounds corners with a quadratic", () => {
    const d = pathFromPoints([[0, 0], [50, 0], [50, 50]], 6);
    expect(d).toBe("M0,0 L44,0 Q50,0 50,6 L50,50");
  });
  it("pathFromPoints clamps the radius to half the shortest segment", () => {
    const d = pathFromPoints([[0, 0], [4, 0], [4, 50]], 6);
    expect(d).toBe("M0,0 L2,0 Q4,0 4,2 L4,50");
  });
  it("pointAlong walks the polyline by length", () => {
    expect(pointAlong([[0, 0], [100, 0], [100, 100]], 0.5)).toEqual([100, 0]);
    expect(pointAlong([[0, 0], [100, 0], [100, 100]], 0.75)).toEqual([100, 50]);
  });
});
