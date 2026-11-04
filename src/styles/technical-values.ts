/**
 * Technical's colour roles as literals, for output that cannot read CSS custom properties: static
 * SVG export (`uipack/static`, `renderSlideSvg`) consumed through <img>, a README or a slide.
 * A mirror of src/styles/technical.css; test/styles.test.tsx fails when the two drift.
 */
export interface TechnicalColors {
  paper: string;
  surface: string;
  "surface-raised": string;
  "surface-2": string;
  ink: string;
  "ink-2": string;
  /** Ink at 22% (borders) and 16% (grid), as rgba. */
  line: string;
  "line-soft": string;
  accent: string;
  "flow-request": string;
  "flow-response": string;
  "flow-change": string;
  /** Slides: the starters' rule (optional role --ui-slide-line). */
  "slide-line": string;
}

export const technicalValues: Record<"light" | "dark", TechnicalColors> = {
  light: {
    paper: "#f6f5f1",
    surface: "#ffffff",
    "surface-raised": "#ffffff",
    "surface-2": "#f4f6f4",
    ink: "#1a1c1a",
    "ink-2": "#5c625e",
    line: "rgba(26, 28, 26, 0.22)",
    "line-soft": "rgba(26, 28, 26, 0.16)",
    accent: "#205f49",
    "flow-request": "#4f6fe6",
    "flow-response": "#3fb27f",
    "flow-change": "#9a63e0",
    "slide-line": "#bac3bc",
  },
  dark: {
    paper: "#0a100d",
    surface: "#0e1512",
    "surface-raised": "#14201b",
    "surface-2": "#1b2a24",
    ink: "#e8ece9",
    "ink-2": "#9aa39e",
    line: "rgba(232, 236, 233, 0.22)",
    "line-soft": "rgba(232, 236, 233, 0.16)",
    accent: "#71dcb2",
    "flow-request": "#8ea4ff",
    "flow-response": "#5fd39b",
    "flow-change": "#c39aff",
    "slide-line": "#43544b",
  },
};

/** Technical's type stacks, quoted for use inside an SVG attribute. */
export const technicalFonts = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
} as const;
