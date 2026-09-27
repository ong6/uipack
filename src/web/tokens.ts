/** Landing style type scale: 16px base, Major Third (x1.25), expressed in rem. */
export const TYPE_BASE_PX = 16;
export const TYPE_RATIO = 1.25;

/** Font size for a scale step, in rem, rounded to 4 places. Step 0 is the body size. */
export function typeScale(step: number): number {
  return Math.round(Math.pow(TYPE_RATIO, step) * 10000) / 10000;
}

/** Tighter tracking and leading as the size grows; body copy stays at 1.5. */
export function typeMetrics(step: number): { lineHeight: number; letterSpacing: string } {
  if (step >= 5) return { lineHeight: 1.05, letterSpacing: "-0.03em" };
  if (step >= 3) return { lineHeight: 1.15, letterSpacing: "-0.02em" };
  if (step >= 1) return { lineHeight: 1.3, letterSpacing: "-0.01em" };
  return { lineHeight: 1.5, letterSpacing: "0em" };
}

export const TYPE_STEPS = [-1, 0, 1, 2, 3, 4, 5, 6] as const;
export type TypeStep = (typeof TYPE_STEPS)[number];

/** Opacity emphasis for text on any Landing surface (Material's high / medium / low). */
export const EMPHASIS = { high: 1, medium: 0.87, low: 0.66 } as const;

/** 8-point spacing, in px. */
export const SPACE = [0, 8, 16, 24, 32, 48, 64, 96, 128] as const;

/** 12 / 8 / 4 columns at wide (>= 1024px container), medium (>= 640px) and narrow widths. */
export const GRID_COLUMNS = { wide: 12, medium: 8, narrow: 4 } as const;
