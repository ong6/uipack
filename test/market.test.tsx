import { describe, it, expect } from "vitest";
import { marketBar, MARKET_BARS } from "../src/objects/market";
describe("illustrative continuous OHLC feed", () => {
  it("preserves price and volume meaning across its repeated history", () => {
    for (let i = -1; i <= MARKET_BARS * 2; i++) {
      const bar = marketBar(i);
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      expect(bar.open).toBeCloseTo(marketBar(i - 1).close, 10);
      expect(bar.volume).toBeGreaterThan(0);
      expect(bar.low).toBeGreaterThan(96.5);
      expect(bar.high).toBeLessThan(103.5);
      expect(bar).toEqual(marketBar(i + MARKET_BARS));
    }
  });
});
