import {
  FigureMotionContext,
  TOKEN_SHAPE,
  Token
} from "./chunk-M6VHM6HZ.js";

// src/static/index.tsx
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { jsx } from "react/jsx-runtime";
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
  if (!theme || theme === "light") return LIGHT;
  if (theme === "dark") return DARK;
  const { base, ...rest } = theme;
  return { ...base === "dark" ? DARK : LIGHT, ...rest };
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
  if (isValidElement(input)) {
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
    drawing = inlineVars(renderToStaticMarkup(/* @__PURE__ */ jsx(FigureMotionContext.Provider, { value: ctx, children: fig.children })), p);
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
        const tok = inlineVars(renderToStaticMarkup(/* @__PURE__ */ jsx(Token, { kind, shape: it.shape ?? TOKEN_SHAPE[kind], r: 5.5, cx: lx + 6, cy: hy - 4 })), p);
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${H}" width="${width}" height="${height}" color="${p.fg}" font-family="${p.sans}"${label}><style>text{user-select:none}</style>` + border + canvas + head.join("") + `<g transform="translate(${-vx},${hy - vy})">${drawing}</g></svg>
`;
}
export {
  DARK,
  LIGHT,
  inlineVars,
  renderStatic,
  resolvePalette,
  wrapText
};
//# sourceMappingURL=static.js.map