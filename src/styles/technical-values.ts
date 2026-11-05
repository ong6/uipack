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
  /** Ink at 26% (borders) and 13% (grid), as rgba. */
  line: string;
  "line-soft": string;
  accent: string;
  "flow-request": string;
  "flow-response": string;
  "flow-change": string;
  /** Slides: the starters' rule (optional role --tune-slide-line). */
  "slide-line": string;
}

export const technicalValues: Record<"light" | "dark", TechnicalColors> = {
  light: {
    paper: "#f3f6f9",
    surface: "#fcfdfe",
    "surface-raised": "#ffffff",
    "surface-2": "#e2e9f1",
    ink: "#0b2748",
    "ink-2": "#3d5878",
    line: "rgba(11, 39, 72, 0.26)",
    "line-soft": "rgba(11, 39, 72, 0.13)",
    accent: "#9c5700",
    "flow-request": "#0b77a3",
    "flow-response": "#2b7a4b",
    "flow-change": "#7048c0",
    "slide-line": "#b9c8d9",
  },
  dark: {
    paper: "#0a2342",
    surface: "#0d2a4f",
    "surface-raised": "#12345f",
    "surface-2": "#11315a",
    ink: "#edf3fb",
    "ink-2": "#acc2dc",
    line: "rgba(237, 243, 251, 0.26)",
    "line-soft": "rgba(237, 243, 251, 0.13)",
    accent: "#f0c45a",
    "flow-request": "#8fd6ff",
    "flow-response": "#8be6ae",
    "flow-change": "#d2b4ff",
    "slide-line": "#2e5180",
  },
};

/**
 * Technical's type stacks, quoted for use inside an SVG attribute. A static SVG shown through
 * <img> cannot load web fonts, so it names IBM Plex Sans and IBM Plex Mono (used where installed)
 * before the system stacks.
 */
export const technicalFonts = {
  sans: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
} as const;
