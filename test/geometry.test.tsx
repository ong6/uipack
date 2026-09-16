import { anchor, grid, pathFromPoints, pointAlong, polylineLength, route, trim } from "../src";

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
  it("trim shortens both ends along the segments", () => {
    expect(trim([[0, 0], [100, 0]], 2, 12)).toEqual([[2, 0], [88, 0]]);
    expect(trim([[0, 0], [10, 0], [10, 50]], 0, 12)).toEqual([[0, 0], [10, 0], [10, 38]]);
    expect(trim([[0, 0], [10, 0], [10, 5]], 0, 12)).toEqual([[0, 0], [3, 0]]); // eats the last segment
  });
  it("trim collapses to the midpoint instead of inverting", () => {
    expect(trim([[0, 0], [10, 0]], 6, 6)).toEqual([[5, 0], [5, 0]]);
  });
  it("polylineLength and grid", () => {
    expect(polylineLength([[0, 0], [30, 0], [30, 40]])).toBe(70);
    expect(grid(117)).toBe(120);
    expect(grid(116)).toBe(120);
    expect(grid(115)).toBe(112);
  });
});
