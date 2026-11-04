'use strict';

// src/styles/technical-values.ts
var technicalValues = {
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
    "slide-line": "#bac3bc"
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
    "slide-line": "#43544b"
  }
};
var technicalFonts = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace"
};

exports.technicalFonts = technicalFonts;
exports.technicalValues = technicalValues;
