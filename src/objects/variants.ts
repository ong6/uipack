import type { ObjectKind } from "./scenes";

/** Curated looks. Numeric IDs stay stable for screenshots and consumer previews. */
export type ObjectVariant = 0 | 1 | 2;
export const objectVariants: Record<ObjectKind, readonly [string, string, string]> = {
  ai: ["Forest terminal", "Midnight terminal", "Warm graphite"],
  contact: ["Forest inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Forest hardware", "Blue hardware", "Copper hardware"],
  travel: ["Forest route", "Coastal route", "Terracotta route"],
  reading: ["Forest cloth", "Oxblood cloth", "Midnight cloth"],
};
export function chooseObjectVariant(random = Math.random): ObjectVariant {
  return Math.min(2, Math.max(0, Math.floor(random() * 3))) as ObjectVariant;
}
