"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/static/index.tsx
var static_exports = {};
__export(static_exports, {
  DARK: () => DARK,
  LIGHT: () => LIGHT,
  inlineVars: () => inlineVars,
  renderStatic: () => renderStatic,
  resolvePalette: () => resolvePalette,
  wrapText: () => wrapText
});
module.exports = __toCommonJS(static_exports);
var import_react3 = require("react");
var import_server = require("react-dom/server");

// src/scale.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var FigureScaleContext = (0, import_react.createContext)({ floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth, renderWidth, minFont) {
  if (!vbWidth || !renderWidth || !minFont) return 0;
  return minFont * vbWidth / renderWidth;
}
function FigureScaleProvider({ floor, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FigureScaleContext.Provider, { value: { floor }, children });
}

// src/context.tsx
var import_react2 = require("react");
var noop = () => {
};
var FigureMotionContext = (0, import_react2.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});

// src/tokens.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var TOKEN_SHAPE = {
  request: "square",
  response: "circle",
  change: "diamond",
  accent: "square",
  neutral: "circle"
};
function tokenColor(kind) {
  switch (kind) {
    case "request":
      return "var(--uipack-token-request)";
    case "response":
      return "var(--uipack-token-response)";
    case "change":
      return "var(--uipack-token-change)";
    case "accent":
      return "var(--uipack-accent)";
    default:
      return "currentColor";
  }
}
function Token({ shape, kind = "neutral", r = 5, cx = 0, cy = 0, style }) {
  const s = shape ?? TOKEN_SHAPE[kind];
  const fill = tokenColor(kind);
  const common = { fill, stroke: "var(--uipack-bg)", strokeWidth: 1.5, style };
  if (s === "circle") return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx, cy, r, ...common });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/static/index.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var LIGHT = {
  fg: "#1a1c1a",
  muted: "#5c625e",
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#f4f6f4",
  grid: "rgba(26, 28, 26, 0.16)",
  border: "rgba(26, 28, 26, 0.22)",
  accent: "#205f49",
  "token-request": "#4f6fe6",
  "token-response": "#3fb27f",
  "token-change": "#9a63e0",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
};
var DARK = {
  ...LIGHT,
  fg: "#e8ece9",
  muted: "#9aa39e",
  bg: "#0e1512",
  surface: "#14201b",
  "surface-raised": "#1a2a23",
  grid: "rgba(232, 236, 233, 0.16)",
  border: "rgba(232, 236, 233, 0.22)",
  accent: "#71dcb2",
  "token-request": "#8ea4ff",
  "token-response": "#5fd39b",
  "token-change": "#c39aff"
};
function resolvePalette(theme) {
  const p = !theme || theme === "light" ? LIGHT : theme === "dark" ? DARK : { ...theme.base === "dark" ? DARK : LIGHT, ...stripBase(theme) };
  return { ...p, mono: p.mono.replace(/"/g, "'"), sans: p.sans.replace(/"/g, "'") };
}
function stripBase(t) {
  const { base: _base, ...rest } = t;
  return rest;
}
function inlineVars(markup, p) {
  return markup.replace(/var\(--uipack-([a-z-]+)(?:,\s*[^)]*)?\)/g, (_, k) => p[k] ?? "currentColor");
}
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function wrapText(text, chars) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if ((line + " " + word).trim().length > chars && line) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
function figureOf(input) {
  if ((0, import_react3.isValidElement)(input)) {
    const pp = input.props;
    if (typeof pp.parts === "function" && pp.spec) {
      const parts = pp.parts(pp.spec, pp.id ?? "static");
      const m = pp.spec.figure;
      return { children: parts.wide, viewBox: parts.viewBox, legend: parts.legend, number: m.number, eyebrow: m.eyebrow, title: m.title, caption: m.caption, alt: m.alt };
    }
    const p = input.props;
    return { children: p.children, viewBox: p.viewBox, legend: p.legend, number: p.number, eyebrow: p.eyebrow, title: p.title, caption: p.caption, alt: p.alt, background: p.background };
  }
  return input;
}
function renderStatic(input, opts = {}) {
  const fig = figureOf(input);
  const p = resolvePalette(opts.theme);
  const motion = opts.motion ?? true;
  const frame = opts.frame ?? true;
  const paint = opts.background ?? true;
  const [vx, vy, vw, vh] = fig.viewBox.split(/\s+/).map(Number);
  const ctx = { playing: motion, reduced: !motion, cycle: 0, toggle: () => {
  }, replay: () => {
  }, prerender: motion };
  const g = globalThis;
  const prev = g.__UIPACK_PRERENDER__;
  g.__UIPACK_PRERENDER__ = motion;
  let drawing;
  try {
    const floor = fontFloor(vw, opts.width ?? DEFAULT_RENDER_WIDTH, opts.minFont ?? 11);
    drawing = inlineVars(
      (0, import_server.renderToStaticMarkup)(
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FigureMotionContext.Provider, { value: ctx, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FigureScaleProvider, { floor, children: fig.children }) })
      ),
      p
    );
  } finally {
    g.__UIPACK_PRERENDER__ = prev;
  }
  const pad = 28;
  let hy = 0;
  const head = [];
  if (frame) {
    hy = 24;
    const eyebrow = [fig.number, fig.eyebrow].filter(Boolean).join(" \xB7 ");
    if (eyebrow) {
      hy += 11;
      head.push(`<text x="${pad}" y="${hy}" font-family="${p.mono}" font-size="11" font-weight="700" letter-spacing=".08em" fill="${p.fg}">${esc(eyebrow.toUpperCase())}</text>`);
      hy += 8;
    }
    if (fig.title) {
      hy += 20;
      head.push(`<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="20" font-weight="700" letter-spacing="-0.01em" fill="${p.fg}">${esc(fig.title)}</text>`);
      hy += 6;
    }
    if (fig.caption) {
      const cols = Math.max(40, Math.floor((vw - pad * 2) / 7.2));
      for (const line of wrapText(fig.caption, Math.min(cols, 96))) {
        hy += 19;
        head.push(`<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="14" fill="${p.muted}">${esc(line)}</text>`);
      }
      hy += 4;
    }
    if (fig.legend?.length) {
      hy += 24;
      let lx = pad;
      for (const it of fig.legend) {
        const kind = it.kind ?? "neutral";
        const tok = inlineVars((0, import_server.renderToStaticMarkup)(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Token, { kind, shape: it.shape ?? TOKEN_SHAPE[kind], r: 5.5, cx: lx + 6, cy: hy - 4 })), p);
        head.push(tok, `<text x="${lx + 20}" y="${hy}" font-family="${p.sans}" font-size="13" fill="${p.fg}">${esc(it.label)}</text>`);
        lx += 20 + it.label.length * 7.4 + 24;
      }
    }
    hy += 20;
  }
  const H = hy + vh;
  const bgId = "uipack-static-dots";
  const canvas = paint ? fig.background === "plain" ? `<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/>` : fig.background === "ruled" ? `<defs><pattern id="${bgId}" width="${vw}" height="24" patternUnits="userSpaceOnUse"><rect width="${vw}" height="1" fill="${p.grid}"/></pattern></defs><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>` : `<defs><pattern id="${bgId}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${p.grid}"/></pattern></defs><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>` : "";
  const border = frame ? `<rect x="0.5" y="0.5" width="${vw - 1}" height="${H - 1}" rx="4" fill="${paint ? p.bg : "none"}" stroke="${p.border}"/>` + (hy ? `<line x1="0" y1="${hy}" x2="${vw}" y2="${hy}" stroke="${p.border}"/>` : "") : "";
  const width = opts.width ?? vw;
  const height = Math.round(width / vw * H);
  const label = fig.alt ? ` role="img" aria-label="${esc(fig.alt)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${H}" width="${width}" height="${height}" color="${p.fg}" font-family="${esc(p.sans)}"${label}><style>text{user-select:none}</style>` + border + canvas + head.join("") + `<g transform="translate(${-vx},${hy - vy})">${drawing}</g></svg>
`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DARK,
  LIGHT,
  inlineVars,
  renderStatic,
  resolvePalette,
  wrapText
});
//# sourceMappingURL=static.cjs.map