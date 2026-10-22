/** Landing style type scale: 16px base, Major Third (x1.25), expressed in rem. */
export const TYPE_BASE_PX = 16;
export const TYPE_RATIO = 1.25;

/** Font size for a scale step, in rem, rounded to 4 places. Step 0 is the body size. */
export function typeScale(step: number): number {
  return Math.round(Math.pow(TYPE_RATIO, step) * 10000) / 10000;
}

/** The three type roles. Display: headlines and big numbers. Text: everything read or pressed. Mono: labels and data. */
export type TypeRole = "display" | "text" | "mono";

/** Default faces per role (web.css: --web-font-display, --web-font-text, --web-font-mono). */
export const TYPE_FACES = {
  display: "Instrument Serif",
  text: "IBM Plex Sans",
  mono: "IBM Plex Mono",
} as const satisfies Record<TypeRole, string>;

/** The first heading step set in the display face (39px; 31px in narrow containers). */
export const DISPLAY_FROM_STEP = 4;

/** Which face a heading at this step uses: display from step 4 up, text below it. */
export function typeRole(step: number): Exclude<TypeRole, "mono"> {
  return step >= DISPLAY_FROM_STEP ? "display" : "text";
}

/**
 * Leading and tracking per heading step, matching web.css. Display steps carry the single
 * display weight with light tracking (the serif is already narrow); text steps tighten
 * gradually toward body copy at 1.5. Step 3 drops to 500 so a 31px sans heading does not
 * outweigh a 39px display one.
 */
export function typeMetrics(step: number): { role: Exclude<TypeRole, "mono">; lineHeight: number; letterSpacing: string; weight: number } {
  if (step >= 6) return { role: "display", lineHeight: 1.02, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 5) return { role: "display", lineHeight: 1.05, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 4) return { role: "display", lineHeight: 1.1, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 3) return { role: "text", lineHeight: 1.2, letterSpacing: "-0.015em", weight: 500 };
  if (step >= 2) return { role: "text", lineHeight: 1.3, letterSpacing: "-0.01em", weight: 600 };
  if (step >= 1) return { role: "text", lineHeight: 1.35, letterSpacing: "-0.005em", weight: 600 };
  return { role: "text", lineHeight: 1.5, letterSpacing: "0em", weight: 600 };
}

export const TYPE_STEPS = [-1, 0, 1, 2, 3, 4, 5, 6] as const;
export type TypeStep = (typeof TYPE_STEPS)[number];

/** Opacity emphasis for text on any Landing surface (Material's high / medium / low). */
export const EMPHASIS = { high: 1, medium: 0.87, low: 0.66 } as const;

/** 8-point spacing, in px. */
export const SPACE = [0, 8, 16, 24, 32, 48, 64, 96, 128] as const;

/** 12 / 8 / 4 columns at wide (>= 1024px container), medium (>= 640px) and narrow widths. */
export const GRID_COLUMNS = { wide: 12, medium: 8, narrow: 4 } as const;
