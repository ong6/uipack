import type { ObjectVariant } from './variants';
export const MARKET_BARS = 64;
export const MARKET_BAR_MS = 480;
export const MARKET_LOOP_MS = MARKET_BARS * MARKET_BAR_MS;
export function marketBar(index: number, variant: ObjectVariant = 0) {
  const closeAt = (i: number) => {
    const t = ((i % MARKET_BARS) + MARKET_BARS) % MARKET_BARS * Math.PI * 2 / MARKET_BARS;
    return 100 + 1.65 * Math.sin(t + variant) + .65 * Math.sin(t * 7 + variant * .6) + .28 * Math.sin(t * 13);
  };
  const open = closeAt(index - 1), close = closeAt(index);
  const phase = ((index % MARKET_BARS) + MARKET_BARS) % MARKET_BARS;
  const high = Math.max(open, close) + .12 + .14 * (1 + Math.sin(phase * Math.PI / 8)) / 2;
  const low = Math.min(open, close) - .12 - .12 * (1 + Math.cos(phase * Math.PI / 8)) / 2;
  const volume = 120 + Math.abs(close - open) * 540 + 50 * (1 + Math.cos(phase * Math.PI / 4));
  return { open, high, low, close, volume };
}
