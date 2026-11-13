import { blueprint, defineDiagramTheme } from "../src";

// Example diagram themes for the docs demos (docs/components/diagrams.md, "Diagram themes"). A site
// defines its own the same way, in its own repo; uipack ships only `blueprint`.

/**
 * Blueprint as the docs site shows it: Technical's ink, accent and flow hues, on the site's charcoal
 * in dark (the surfaces of playground/site-palette.css) instead of Blueprint's own navy. The owner,
 * 2026-11-12: no blue ground in the site's dark mode, this specimen included.
 */
export const siteBlueprint = defineDiagramTheme({
  name: "blueprint",
  light: blueprint.light,
  dark: { ...blueprint.dark, surface: "#16181b", "surface-raised": "#1c1f23", "surface-2": "#22262a" },
  canvas: "grid",
});

/** Warm paper with a cobalt accent and a dot grid. Faces stay the page's (the docs site holds to Technical's). */
export const warmPaper = defineDiagramTheme({
  name: "warm-paper",
  light: {
    ink: "#1d1b16",
    "ink-2": "#5c574c",
    surface: "#faf6ee",
    "surface-raised": "#fffdf8",
    "surface-2": "#f0e9dc",
    accent: "#2346c8",
    "flow-request": "#0f7480",
    "flow-response": "#3c7a3a",
    "flow-change": "#8e44ad",
    "flow-error": "#c0392b",
  },
  dark: {
    ink: "#f1ece2",
    "ink-2": "#b9b1a2",
    surface: "#1b1915",
    "surface-raised": "#24211c",
    "surface-2": "#2d2a23",
    accent: "#8ea8ff",
    "flow-request": "#63c7cf",
    "flow-response": "#8fd18a",
    "flow-change": "#d4a2ec",
    "flow-error": "#ff8f7d",
  },
  canvas: "dots",
});

/** Terracotta on clay: a darker accent ink for words, a plain ground. */
export const terracotta = defineDiagramTheme({
  name: "terracotta",
  light: {
    ink: "#2b1d16",
    "ink-2": "#6b5345",
    surface: "#fbf4ee",
    "surface-raised": "#fffaf6",
    "surface-2": "#f3e4d8",
    accent: "#c0582c",
    "accent-ink": "#9a4422",
    "flow-request": "#2f6f8f",
    "flow-response": "#4f7d3a",
    "flow-change": "#7a4fa0",
    "flow-error": "#b3261e",
  },
  dark: {
    ink: "#f6e9df",
    "ink-2": "#c8ae9c",
    surface: "#21160f",
    "surface-raised": "#2b1d15",
    "surface-2": "#35241a",
    accent: "#e8875c",
    "flow-request": "#79bfe0",
    "flow-response": "#a3d189",
    "flow-change": "#c7a6ee",
    "flow-error": "#ff8a7a",
  },
  canvas: "plain",
});
