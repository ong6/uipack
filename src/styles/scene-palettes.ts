/**
 * Technical's values for a renderer that cannot read CSS: the 3D animation player's canvas
 * (uipack/slides). The CSS roles (src/styles/technical.css) are the source; these mirror them and
 * must change with them. The object scenes (uipack/objects) read the roles from CSS instead.
 */

/** The 3D animation player's scene colours (uipack/slides), as CSS colour strings for three.js. */
export const technicalSlidePalettes = {
  dark: {
    background: "#0d2a4f", // surface
    surface: "#12345f", // surface-raised
    ink: "#edf3fb",
    muted: "#acc2dc", // ink-2
    rule: "#2e5180", // slide-line
    accent: "#f0c45a",
    request: "#8fd6ff",
    response: "#8be6ae",
    change: "#d2b4ff",
  },
  light: {
    background: "#fcfdfe",
    surface: "#ffffff",
    ink: "#0b2748",
    muted: "#3d5878",
    rule: "#b9c8d9",
    accent: "#9c5700",
    request: "#0b77a3",
    response: "#2b7a4b",
    change: "#7048c0",
  },
} as const;
