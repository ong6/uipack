// @vitest-environment node
import { clamp, cubicBezier, lerpRect, progress, smoothstep } from "../src/math";
import { deckMotion } from "../src/deck";

describe("shared math", () => {
  it("clamps, and measures progress through a span", () => {
    expect([clamp(-1), clamp(0.4), clamp(2), clamp(5, 0, 3)]).toEqual([0, 0.4, 1, 3]);
    expect([progress(5, 10, 20), progress(15, 10, 20), progress(25, 10, 20)]).toEqual([0, 0.5, 1]);
    expect([smoothstep(0, 1, 0), smoothstep(0, 1, 0.5), smoothstep(0, 1, 1)]).toEqual([0, 0.5, 1]);
  });

  it("interpolates every edge of a rect", () => {
    expect(lerpRect({ x: 0, y: 10, w: 100, h: 50 }, { x: 100, y: 30, w: 200, h: 150 }, 0.25)).toEqual({
      x: 25,
      y: 15,
      w: 125,
      h: 75,
    });
  });

  it("samples a CSS cubic-bezier: exact ends, the identity for a straight curve, and monotonic in between", () => {
    const ease = cubicBezier(0.3, 0.05, 0.25, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBeCloseTo(1, 6);
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
    for (const t of [0.1, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 6);
    const samples = Array.from({ length: 21 }, (_, i) => ease(i / 20));
    for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  });

  it("the deck's CSS curves are written as literals that match the sampled curves", () => {
    expect(deckMotion.travel).toBe(`cubic-bezier(${deckMotion.travelCurve.join(", ")})`);
    // The camera's sampled ease (transitions.ts, cameraEase) uses these four numbers.
    expect(deckMotion.camera).toBe("cubic-bezier(0.3, 0.05, 0.25, 1)");
  });
});
