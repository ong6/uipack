'use strict';

var chunkUAE3UZQU_cjs = require('./chunk-UAE3UZQU.cjs');
var chunk7HPFTZIE_cjs = require('./chunk-7HPFTZIE.cjs');
var chunkFZZROK2F_cjs = require('./chunk-FZZROK2F.cjs');
var chunkPT2CSIXM_cjs = require('./chunk-PT2CSIXM.cjs');
var react = require('react');
var server = require('react-dom/server');
var jsxRuntime = require('react/jsx-runtime');

var paletteOf = (c) => ({
  fg: c.ink,
  muted: c["ink-2"],
  bg: c.surface,
  surface: c["surface-raised"],
  "surface-raised": c["surface-2"],
  grid: c["line-soft"],
  border: c.line,
  accent: c.accent,
  "accent-ink": c.accent,
  "token-request": c["flow-request"],
  "token-response": c["flow-response"],
  "token-change": c["flow-change"],
  "token-error": c["flow-error"],
  mono: chunkFZZROK2F_cjs.technicalFonts.mono,
  sans: chunkFZZROK2F_cjs.technicalFonts.sans
});
var LIGHT = paletteOf(chunkFZZROK2F_cjs.technicalValues.light);
var DARK = paletteOf(chunkFZZROK2F_cjs.technicalValues.dark);
function themePalette(theme, mode = "light") {
  const c = chunk7HPFTZIE_cjs.diagramColors(theme, mode);
  const face = (v, fallback) => v && !v.includes("var(") ? v : fallback;
  return {
    fg: c.ink,
    muted: c["ink-2"],
    bg: c.surface,
    surface: c["surface-raised"],
    "surface-raised": c["surface-2"],
    grid: c["line-soft"],
    border: c.line,
    accent: c.accent,
    "accent-ink": c["accent-ink"],
    "token-request": c["flow-request"],
    "token-response": c["flow-response"],
    "token-change": c["flow-change"],
    "token-error": c["flow-error"],
    mono: face(theme.fonts?.label, chunkFZZROK2F_cjs.technicalFonts.mono),
    sans: face(theme.fonts?.text, chunkFZZROK2F_cjs.technicalFonts.sans)
  };
}
function resolvePalette(theme, mode = "light") {
  let p;
  if (!theme || theme === "light") p = LIGHT;
  else if (theme === "dark") p = DARK;
  else if (chunk7HPFTZIE_cjs.isDiagramTheme(theme)) p = themePalette(theme, mode);
  else {
    const rest = stripBase(theme);
    p = { ...theme.base === "dark" ? DARK : LIGHT, ...rest };
    if (rest.accent && !rest["accent-ink"]) p["accent-ink"] = rest.accent;
  }
  return { ...p, mono: p.mono.replace(/"/g, "'"), sans: p.sans.replace(/"/g, "'") };
}
function stripBase(t) {
  const { base: _base, ...rest } = t;
  return rest;
}
function draftingGrid(id, ink, y) {
  const line = (size, opacity) => `<path d="M ${size} 0 V ${size} M 0 ${size} H ${size}" fill="none" stroke="${ink}" stroke-opacity="${opacity}" stroke-width="1"/>`;
  return `<pattern id="${id}-minor" width="12" height="12" patternUnits="userSpaceOnUse">${line(12, 0.05)}</pattern><pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse" y="${y}"><rect width="60" height="60" fill="url(#${id}-minor)"/>${line(60, 0.12)}</pattern>`;
}
function inlineVars(markup, p) {
  return markup.replace(
    /var\(--uipack-([a-z-]+)(?:,\s*(?:[^()]|\([^()]*\))*)?\)/g,
    (_, k) => p[k] ?? "currentColor"
  );
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
  if (react.isValidElement(input)) {
    const toStatic = input.type.toStatic;
    if (typeof toStatic === "function") return toStatic(input.props);
    const pp = input.props;
    if (typeof pp.parts === "function" && pp.spec) {
      const parts = pp.parts(pp.spec, pp.id ?? "static");
      const m = pp.spec.figure;
      return {
        children: parts.wide,
        viewBox: parts.viewBox,
        legend: parts.legend,
        number: m.number,
        eyebrow: m.eyebrow,
        title: m.title,
        caption: m.caption,
        alt: m.alt
      };
    }
    const p = input.props;
    return {
      children: p.children,
      viewBox: p.viewBox,
      legend: p.legend,
      number: p.number,
      eyebrow: p.eyebrow,
      title: p.title,
      caption: p.caption,
      alt: p.alt,
      background: p.background
    };
  }
  return input;
}
function svgMarkup(children) {
  const html = server.renderToStaticMarkup(/* @__PURE__ */ jsxRuntime.jsx("svg", { children }));
  return html.slice("<svg>".length, -"</svg>".length);
}
function renderStatic(input, opts = {}) {
  const fig = figureOf(input);
  const p = resolvePalette(opts.theme, opts.mode);
  const ground = fig.background === "plain" || fig.background === "ruled" ? fig.background : chunk7HPFTZIE_cjs.isDiagramTheme(opts.theme) ? opts.theme.canvas ?? "grid" : "dots";
  const motion = opts.motion ?? true;
  const frame = opts.frame ?? true;
  const paint = opts.background ?? true;
  const [vx, vy, vw, vh] = fig.viewBox.split(/\s+/).map(Number);
  const ctx = {
    playing: motion,
    reduced: !motion,
    cycle: 0,
    toggle: () => {
    },
    replay: () => {
    },
    prerender: motion
  };
  const g = globalThis;
  const prev = g.__UIPACK_PRERENDER__;
  g.__UIPACK_PRERENDER__ = motion;
  let drawing;
  try {
    const floor = chunkUAE3UZQU_cjs.fontFloor(vw, opts.width ?? chunkUAE3UZQU_cjs.DEFAULT_RENDER_WIDTH, opts.minFont ?? 11);
    drawing = inlineVars(
      svgMarkup(
        /* @__PURE__ */ jsxRuntime.jsx(chunkPT2CSIXM_cjs.FigureMotionContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxRuntime.jsx(chunkUAE3UZQU_cjs.FigureScaleProvider, { floor, children: fig.children }) })
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
      head.push(
        `<text x="${pad}" y="${hy}" font-family="${p.mono}" font-size="11" font-weight="700" letter-spacing=".08em" fill="${p.fg}">${esc(eyebrow.toUpperCase())}</text>`
      );
      hy += 8;
    }
    if (fig.title) {
      hy += 20;
      head.push(
        `<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="20" font-weight="700" letter-spacing="-0.01em" fill="${p.fg}">${esc(fig.title)}</text>`
      );
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
        const tok = inlineVars(
          svgMarkup(/* @__PURE__ */ jsxRuntime.jsx(chunkUAE3UZQU_cjs.Token, { kind, shape: it.shape ?? chunkUAE3UZQU_cjs.TOKEN_SHAPE[kind], r: 5.5, cx: lx + 6, cy: hy - 4 })),
          p
        );
        head.push(
          tok,
          `<text x="${lx + 20}" y="${hy}" font-family="${p.sans}" font-size="13" fill="${p.fg}">${esc(it.label)}</text>`
        );
        lx += 20 + it.label.length * 7.4 + 24;
      }
    }
    hy += 20;
  }
  const H = hy + vh;
  const bgId = "uipack-static-dots";
  const fill = `<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/>`;
  const patterned = (pattern) => `<defs>${pattern}</defs>${fill}<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>`;
  const canvas = !paint ? "" : ground === "plain" ? fill : ground === "ruled" ? patterned(
    `<pattern id="${bgId}" width="${vw}" height="24" patternUnits="userSpaceOnUse"><rect width="${vw}" height="1" fill="${p.grid}"/></pattern>`
  ) : ground === "grid" ? patterned(draftingGrid(bgId, p.fg, hy)) : patterned(
    `<pattern id="${bgId}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${p.grid}"/></pattern>`
  );
  const border = frame ? `<rect x="0.5" y="0.5" width="${vw - 1}" height="${H - 1}" rx="4" fill="${paint ? p.bg : "none"}" stroke="${p.border}"/>` + (hy ? `<line x1="0" y1="${hy}" x2="${vw}" y2="${hy}" stroke="${p.border}"/>` : "") : "";
  const width = opts.width ?? vw;
  const height = Math.round(width / vw * H);
  const label = fig.alt ? ` role="img" aria-label="${esc(fig.alt)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${H}" width="${width}" height="${height}" color="${p.fg}" font-family="${esc(p.sans)}"${label}><style>text{user-select:none}</style>` + border + canvas + head.join("") + `<g transform="translate(${-vx},${hy - vy})">${drawing}</g></svg>
`;
}

exports.DARK = DARK;
exports.LIGHT = LIGHT;
exports.inlineVars = inlineVars;
exports.renderStatic = renderStatic;
exports.resolvePalette = resolvePalette;
exports.themePalette = themePalette;
exports.wrapText = wrapText;
