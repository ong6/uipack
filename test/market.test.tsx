import { describe, it, expect } from "vitest";
import { marketBar, MARKET_BARS } from "../src/objects/market";
describe("illustrative continuous OHLC feed", () => {
  for (const variant of [0, 1, 2] as const) it(`variant ${variant} preserves price and volume meaning across its repeated history`, () => {
    for (let i = -1; i <= MARKET_BARS * 2; i++) {
      const bar = marketBar(i, variant);
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      expect(bar.open).toBeCloseTo(marketBar(i - 1, variant).close, 10);
      expect(bar.volume).toBeGreaterThan(0);
      expect(bar.low).toBeGreaterThan(96.5);
      expect(bar.high).toBeLessThan(103.5);
      expect(bar).toEqual(marketBar(i + MARKET_BARS, variant));
    }
  });
});
