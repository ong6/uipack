'use strict';

// src/styles/scene-palettes.ts
var technicalSlidePalettes = {
  dark: {
    background: "#0e1512",
    // surface
    surface: "#14201b",
    // surface-raised
    ink: "#e8ece9",
    muted: "#9aa39e",
    // ink-2
    rule: "#43544b",
    // slide-line
    accent: "#71dcb2",
    request: "#8ea4ff",
    response: "#5fd39b",
    change: "#c39aff"
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
    change: "#9a63e0"
  }
};
var studioObjectPalettes = {
  light: { paper: 15986663, ink: 2698802, muted: 10136485, accent: 2121545 },
  dark: { paper: 14212825, ink: 3755080, muted: 8492426, accent: 7454115 }
};

exports.studioObjectPalettes = studioObjectPalettes;
exports.technicalSlidePalettes = technicalSlidePalettes;
