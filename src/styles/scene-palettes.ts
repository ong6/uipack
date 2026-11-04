/**
 * Technical's values for renderers that cannot read CSS: WebGL materials and canvas drawing.
 * The CSS roles (src/styles/technical.css) are the source; these mirror them for the 3D entries
 * (uipack/slides, uipack/objects) and must change with them. Other styles do not apply to a
 * WebGL scene: a 3D art direction is its own style (docs/system/style.md, "3D").
 */

/** The 3D animation player's scene colours (uipack/slides), as CSS colour strings for three.js. */
export const technicalSlidePalettes = {
  dark: {
    background: "#0e1512", // surface
    surface: "#14201b", // surface-raised
    ink: "#e8ece9",
    muted: "#9aa39e", // ink-2
    rule: "#43544b", // slide-line
    accent: "#71dcb2",
    request: "#8ea4ff",
    response: "#5fd39b",
    change: "#c39aff",
  },
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    ink: "#1a1c1a",
    muted: "#5c625e",
    rule: "#bac3bc",
    accent: "#205f49",
    request: "#4f6fe6",
    response: "#3fb27f",
    change: "#9a63e0",
  },
} as const;

/**
 * The Studio object scenes' four material roles (uipack/objects): paper, ink, muted, accent.
 * Material colours, lit by the scene, so darker and greyer than the flat CSS values they map to.
 */
export const studioObjectPalettes = {
  light: { paper: 0xf3efe7, ink: 0x292e32, muted: 0x9aaba5, accent: 0x205f49 },
  dark: { paper: 0xd8ded9, ink: 0x394c48, muted: 0x81958a, accent: 0x71bda3 },
};
