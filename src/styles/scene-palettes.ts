/**
 * Technical's values for renderers that cannot read CSS: WebGL materials and canvas drawing.
 * The CSS roles (src/styles/technical.css) are the source; these mirror them for the 3D entries
 * (uipack/slides, uipack/objects) and must change with them. Other styles do not apply to a
 * WebGL scene: a 3D art direction is its own style (docs/system/style.md, "3D").
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

/**
 * The Studio object scenes' four material roles (uipack/objects): paper, ink, muted, accent.
 * Material colours, lit by the scene, so darker and greyer than the flat CSS values they map to.
 */
export const studioObjectPalettes = {
  light: { paper: 0xeef2f6, ink: 0x1a3352, muted: 0x93a6bc, accent: 0x9c5700 },
  dark: { paper: 0xd5dde7, ink: 0x22405f, muted: 0x7d93ad, accent: 0xd9ad4a },
};
