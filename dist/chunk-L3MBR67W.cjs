'use strict';

// src/styles/technical-values.ts
var technicalValues = {
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
    "slide-line": "#b9c8d9"
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
    "slide-line": "#2e5180"
  }
};
var technicalFonts = {
  sans: "Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "'Archivo Expanded', Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'Martian Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace"
};

exports.technicalFonts = technicalFonts;
exports.technicalValues = technicalValues;
