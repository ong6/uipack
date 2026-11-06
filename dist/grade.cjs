'use strict';

var zlib = require('zlib');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var url = require('url');

// src/grade/spec.ts
var CHECK_IDS = [
  "overflow-x",
  "text-clip",
  "text-overlap",
  "row-heights",
  "tap-targets",
  "contrast",
  "font-faces",
  "text-size",
  "img-alt",
  "heading-order",
  "one-h1",
  "focus-visible",
  "reduced-motion"
];
var CHECK_TITLES = {
  "overflow-x": "No page-wide horizontal overflow",
  "text-clip": "No text cut off by its box",
  "text-overlap": "No two runs of text drawn over each other",
  "row-heights": "Cards in a row share a height; paired boxes share a height",
  "tap-targets": "Every control meets the tap-target minimum",
  contrast: "Rendered text meets WCAG contrast",
  "font-faces": "Only the site's faces render",
  "text-size": "No text below the size floor",
  "img-alt": "Every image has alt text (empty for decoration)",
  "heading-order": "No skipped heading levels",
  "one-h1": "Exactly one visible h1",
  "focus-visible": "Keyboard focus is visible and not clipped",
  "reduced-motion": "Nothing keeps moving under reduced motion"
};
var DEFAULT_SPEC = {
  name: "site",
  faces: null,
  faceVars: [],
  symbolFaces: [
    "Apple Symbols",
    "Apple Color Emoji",
    "Segoe UI Symbol",
    "Segoe UI Emoji",
    "Noto Color Emoji",
    "Noto Sans Symbols"
  ],
  minTextPx: 12,
  textFloors: [],
  tapTargetPx: { coarse: 44, fine: 24 },
  contrast: { normal: 4.5, large: 3 },
  rowTolerancePx: { cards: 1, paired: 2 },
  cardMinHeightPx: 80,
  viewports: [
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844, touch: true }
  ],
  themes: { light: { colorScheme: "light" }, dark: { colorScheme: "dark" } },
  ready: { settleMs: 400 },
  scope: "body",
  ignore: [],
  ignoreByCheck: {},
  skip: {},
  maxFindings: 25,
  maxCrops: 6,
  maxTabs: 40
};
var UIPACK_SPEC = {
  name: "uipack-playground",
  // docs/design-direction.md: IBM Plex Sans for headings and text, IBM Plex Mono for labels.
  faces: ["IBM Plex Sans", "IBM Plex Mono"],
  faceVars: ["--ui-font-text", "--ui-font-display", "--ui-font-label"],
  textFloors: [
    { selector: "svg", px: 11, why: "figure text floor, e2e/geometry.spec.ts" },
    { selector: ".uipack-span, .uipack-stack", px: 11, why: "chart labels, docs/charts.md" }
  ],
  themes: {
    light: { colorScheme: "light", query: { theme: "light" } },
    dark: { colorScheme: "dark", query: { theme: "dark" } }
  },
  // Every page's h1 is in main: a Markdown docs page's own, a module page's title block, the Assets gallery's head.
  ready: { selector: "main h1", gone: ".showcase-loading", settleMs: 400 },
  // 3D scenes paint to a canvas; the ?host=notes stand-in copies another site's faces on purpose;
  // the Assets gallery's previews are inert, scaled-down pictures of parts graded on their own pages.
  ignore: ["canvas", "[data-host='notes']", ".gallery-preview"]
};
var isPlain = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function mergeSpec(base, over2) {
  if (!isPlain(base) || !isPlain(over2)) return over2 === void 0 ? base : over2;
  const out = { ...base };
  for (const [k, v] of Object.entries(over2)) out[k] = k in base ? mergeSpec(base[k], v) : v;
  return out;
}
function validateSpec(input) {
  const errors = [];
  if (!isPlain(input)) return ["the spec must be a JSON object"];
  const known = /* @__PURE__ */ new Set([...Object.keys(DEFAULT_SPEC), "extends", "styleSpec", "$schema", "notes"]);
  for (const k of Object.keys(input)) if (!known.has(k)) errors.push(`unknown field "${k}"`);
  const num = (path, v, min = 0) => {
    if (v !== void 0 && (typeof v !== "number" || !Number.isFinite(v) || v < min))
      errors.push(`${path} must be a number \u2265 ${min}`);
  };
  num("minTextPx", input.minTextPx);
  num("cardMinHeightPx", input.cardMinHeightPx);
  num("maxFindings", input.maxFindings, 1);
  num("maxCrops", input.maxCrops);
  num("maxTabs", input.maxTabs);
  for (const [field, keys] of [
    ["tapTargetPx", ["coarse", "fine"]],
    ["contrast", ["normal", "large"]],
    ["rowTolerancePx", ["cards", "paired"]]
  ]) {
    const v = input[field];
    if (v === void 0) continue;
    if (!isPlain(v)) errors.push(`${field} must be an object`);
    else for (const k of keys) num(`${field}.${k}`, v[k], field === "contrast" ? 1 : 0);
  }
  if (input.faces !== void 0 && input.faces !== null && !(Array.isArray(input.faces) && input.faces.every((f) => typeof f === "string")))
    errors.push("faces must be a list of family names, or null");
  if (input.viewports !== void 0) {
    if (!Array.isArray(input.viewports) || !input.viewports.length) errors.push("viewports must be a non-empty list");
    else
      input.viewports.forEach((v, i) => {
        if (!isPlain(v) || typeof v.name !== "string") errors.push(`viewports[${i}].name must be a string`);
        else {
          num(`viewports[${i}].width`, v.width, 200);
          num(`viewports[${i}].height`, v.height, 200);
        }
      });
  }
  if (input.textFloors !== void 0) {
    if (!Array.isArray(input.textFloors)) errors.push("textFloors must be a list");
    else
      input.textFloors.forEach((f, i) => {
        if (!isPlain(f) || typeof f.selector !== "string") errors.push(`textFloors[${i}].selector must be a string`);
        else num(`textFloors[${i}].px`, f.px, 1);
      });
  }
  for (const field of ["ignoreByCheck", "skip"]) {
    const v = input[field];
    if (v === void 0) continue;
    if (!isPlain(v)) errors.push(`${field} must be an object keyed by check id`);
    else
      for (const k of Object.keys(v))
        if (!CHECK_IDS.includes(k))
          errors.push(`${field}.${k}: no check has that id (${CHECK_IDS.join(", ")})`);
  }
  if (input.styleSpec !== void 0 && typeof input.styleSpec !== "string")
    errors.push("styleSpec must be a path to a style spec (.md)");
  if (input.extends !== void 0 && !["default", "uipack"].includes(input.extends))
    errors.push(`extends must be "default" or "uipack"`);
  return errors;
}
function resolveSpec(input = {}) {
  const errors = validateSpec(input);
  if (errors.length) throw new Error(`invalid site spec:
  ${errors.join("\n  ")}`);
  const { extends: base, styleSpec: _style, $schema: _s, notes: _n, ...rest } = input;
  const start = base === "uipack" ? mergeSpec(DEFAULT_SPEC, UIPACK_SPEC) : DEFAULT_SPEC;
  return mergeSpec(start, rest);
}

// src/grade/color.ts
function over(fg, bg) {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}
function flatten(layers, base = [255, 255, 255, 1]) {
  let out = base;
  const opaque = layers.findIndex((l) => l[3] >= 1);
  const stack = opaque >= 0 ? layers.slice(0, opaque + 1) : layers;
  for (const layer of [...stack].reverse()) out = over(layer, out);
  return out;
}
function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(fg, bg) {
  const a = luminance(over(fg, bg));
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function isLargeText(px, weight) {
  return px >= 24 || px >= 18.66 && weight >= 700;
}
function parseColor(input) {
  const s = input.trim().toLowerCase();
  if (s === "transparent") return [0, 0, 0, 0];
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const fn = s.match(/^rgba?\(([^)]+)\)$/);
  if (!fn) return null;
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const ch = (p) => p.endsWith("%") ? parseFloat(p) * 255 / 100 : parseFloat(p);
  const alpha = parts[3] === void 0 ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  const out = [ch(parts[0]), ch(parts[1]), ch(parts[2]), alpha];
  return out.every((v) => Number.isFinite(v)) ? out : null;
}

// src/grade/measure.ts
function measurePage(opt) {
  const doc = document;
  const root = doc.querySelector(opt.scope) ?? doc.body;
  const ignoreSel = opt.ignore.join(", ");
  const ignoredFor = (check) => [...opt.ignore, ...opt.ignoreByCheck[check] ?? []].join(", ");
  const skipped = (el, sel) => sel ? !!el.closest(sel) : false;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const boxOf = (r) => ({
    x: Math.round(r.left + sx),
    y: Math.round(r.top + sy),
    w: Math.round(r.width),
    h: Math.round(r.height)
  });
  const label = (el) => {
    const cls = [...el.classList].filter((c) => !c.startsWith("css-")).slice(0, 3);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls.length ? `.${cls.join(".")}` : ""}`;
  };
  const cssPath = (el) => {
    const parts = [];
    for (let e = el; e && e !== doc.documentElement && parts.length < 4; e = e.parentElement) {
      let part = label(e);
      const parent = e.parentElement;
      if (parent && !e.id) {
        const same = [...parent.children].filter((c) => c.tagName === e.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(e) + 1})`;
      }
      parts.unshift(part);
      if (e.id) break;
    }
    return parts.join(" > ");
  };
  const textOf = (el) => (el.textContent || el.getAttribute("aria-label") || el.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const spot = (el, r) => ({
    selector: cssPath(el),
    text: textOf(el),
    box: boxOf(r ?? el.getBoundingClientRect())
  });
  const styleCache = /* @__PURE__ */ new Map();
  const cs = (el) => {
    let s = styleCache.get(el);
    if (!s) styleCache.set(el, s = getComputedStyle(el));
    return s;
  };
  const hiddenCache = /* @__PURE__ */ new Map();
  const hidden = (el) => {
    const known = hiddenCache.get(el);
    if (known !== void 0) return known;
    const s = cs(el);
    let out = s.display === "none" || s.opacity === "0" || s.clipPath === "inset(50%)" || s.clip === "rect(0px, 0px, 0px, 0px)" || el.hasAttribute("hidden") || el instanceof HTMLElement && el.offsetWidth <= 1 && el.offsetHeight <= 1 && s.overflow === "hidden";
    if (!out && el.parentElement) out = hidden(el.parentElement);
    hiddenCache.set(el, out);
    return out;
  };
  const checks = (el) => typeof el.checkVisibility !== "function" || el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true });
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs(el).visibility !== "hidden" && !hidden(el) && checks(el);
  };
  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const colorCache = /* @__PURE__ */ new Map();
  const rgba = (c) => {
    const known = colorCache.get(c);
    if (known) return known;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out = [d[0], d[1], d[2], d[3] / 255];
    colorCache.set(c, out);
    return out;
  };
  const htmlBg = rgba(cs(doc.documentElement).backgroundColor);
  const bodyBg = rgba(cs(doc.body).backgroundColor);
  const base = htmlBg[3] >= 1 ? htmlBg : bodyBg[3] >= 1 ? bodyBg : [255, 255, 255, 1];
  const layersCache = /* @__PURE__ */ new Map();
  const layersOf = (el) => {
    if (layersCache.has(el)) return layersCache.get(el);
    const s = cs(el);
    let out;
    if (s.backgroundImage !== "none" && !(el === doc.body || el === doc.documentElement)) out = null;
    else {
      const own = rgba(s.backgroundColor);
      const rest = own[3] >= 1 || !el.parentElement ? [] : layersOf(el.parentElement);
      out = rest === null ? null : own[3] > 0 ? [own, ...rest] : rest;
    }
    layersCache.set(el, out);
    return out;
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= parseFloat(cs(e).opacity) || 0;
    return o;
  };
  const inScope = (el) => root.contains(el) && !skipped(el, ignoreSel);
  const all = [...root.querySelectorAll("*")].filter((el) => !el.closest("script, style, noscript, template, head"));
  const vw = doc.documentElement.clientWidth;
  const contained = (el) => {
    for (let a = el.parentElement; a && a !== doc.body && a !== doc.documentElement; a = a.parentElement)
      if (/(auto|scroll|hidden|clip)/.test(cs(a).overflowX)) return true;
    return false;
  };
  const overflowers = [];
  const pastEdge = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right + sx > vw + 1;
  };
  for (const el of all) {
    if (!inScope(el) || !pastEdge(el) || cs(el).position === "fixed" || hidden(el) || contained(el)) continue;
    if (el.parentElement && el.parentElement !== root && pastEdge(el.parentElement) && !contained(el.parentElement)) continue;
    overflowers.push(spot(el));
  }
  const texts = [];
  const lines = [];
  const clipped = [];
  const contrastIgnore = ignoredFor("contrast");
  const clipIgnore = ignoredFor("text-clip");
  const overlapIgnore = ignoredFor("text-overlap");
  let fontSamples = 0;
  const seenStacks = /* @__PURE__ */ new Set();
  for (const el of all) {
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && /\S/.test(n.textContent ?? ""));
    if (!own.length || !inScope(el) || !visible(el)) continue;
    const s = cs(el);
    const inSvg = el instanceof SVGElement;
    let px = parseFloat(s.fontSize);
    if (inSvg) {
      const m = el.getScreenCTM?.();
      if (m) px *= Math.hypot(m.a, m.b);
    }
    const ink = inSvg ? s.fill : s.color;
    const fg = /^url\(/.test(ink) ? null : [...rgba(ink)];
    const fill = s.getPropertyValue("-webkit-text-fill-color");
    const clipText = s.getPropertyValue("background-clip") === "text" || s.getPropertyValue("-webkit-background-clip") === "text";
    if (fg && fill && fill !== ink && !clipText) fg.splice(0, 4, ...rgba(fill));
    if (fg && fg[3] < 0.02 && !clipText) continue;
    if (fg) fg[3] *= opacityOf(el);
    const floor = opt.floors.findIndex((f) => !!el.closest(f));
    const disabled = !!el.closest(":disabled, [aria-disabled='true']");
    const sample = {
      ...spot(el),
      text: own.map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim().slice(0, 60),
      px: Math.round(px * 100) / 100,
      weight: parseInt(s.fontWeight, 10) || 400,
      family: s.fontFamily,
      color: clipText ? null : fg,
      layers: layersOf(el),
      base,
      floor,
      inSvg,
      disabled,
      contrastable: !inSvg && !skipped(el, contrastIgnore)
    };
    const index = texts.push(sample) - 1;
    el.setAttribute("data-uipack-grade-t", String(index));
    if (sample.contrastable && !disabled && sample.color && !sample.layers)
      el.setAttribute("data-uipack-grade-bg", String(index));
    if (!skipped(el, overlapIgnore)) {
      const rects = [];
      for (const n of own) {
        const range = doc.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(boxOf(r));
      }
      if (rects.length) lines.push({ owner: index, rects });
    }
    if (!skipped(el, clipIgnore) && !inSvg) {
      const lineClamp = s.getPropertyValue("-webkit-line-clamp");
      const intended = s.textOverflow === "ellipsis" || lineClamp && lineClamp !== "none";
      if (!intended) {
        let clip = null;
        for (let a = el; a && a !== doc.body; a = a.parentElement) {
          const as = cs(a);
          if (/(auto|scroll)/.test(as.overflowX + as.overflowY)) break;
          if (/(hidden|clip)/.test(as.overflowX + as.overflowY)) {
            clip = a;
            break;
          }
        }
        if (clip && !(cs(clip).textOverflow === "ellipsis")) {
          const c = clip.getBoundingClientRect();
          const range = doc.createRange();
          range.selectNodeContents(el);
          const t = range.getBoundingClientRect();
          const intersects = t.right > c.left && t.left < c.right && t.bottom > c.top && t.top < c.bottom;
          const over2 = Math.max(c.left - t.left, t.right - c.right, c.top - t.top, t.bottom - c.bottom);
          if (intersects && over2 > 1.5)
            clipped.push({ ...spot(el, t), clipBy: cssPath(clip), overflowPx: Math.round(over2 * 10) / 10 });
        }
      }
    }
    const key = `${s.fontFamily}|${s.fontWeight}|${s.fontStyle}`;
    if (fontSamples < opt.maxFontSamples && (!seenStacks.has(key) || fontSamples < opt.maxFontSamples / 2 || /[^\x20-\x7e]/.test(sample.text))) {
      seenStacks.add(key);
      el.setAttribute("data-uipack-grade-font", String(index));
      fontSamples++;
    }
  }
  const rows = [];
  const rowIgnore = ignoredFor("row-heights");
  const boxed = (el) => {
    const s = cs(el);
    return parseFloat(s.borderTopWidth) > 0 || rgba(s.backgroundColor)[3] > 0;
  };
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    const s = cs(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const h = (el) => Math.round(el.getBoundingClientRect().height);
  for (const parent of all) {
    if (!inScope(parent) || parent.closest("svg, canvas") || skipped(parent, rowIgnore) || hidden(parent)) continue;
    const s = cs(parent);
    const grid = s.display.includes("grid");
    const flexRow = s.display.includes("flex") && s.flexDirection.startsWith("row");
    if (!grid && !flexRow) continue;
    const byTop = /* @__PURE__ */ new Map();
    for (const kid of [...parent.children].filter(shown)) {
      const top = Math.round(kid.getBoundingClientRect().top);
      byTop.set(top, [...byTop.get(top) ?? [], kid]);
    }
    for (const row of byTop.values()) {
      if (row.length < 2) continue;
      const cardsRow = (grid || s.flexWrap === "wrap") && row.every((k) => boxed(k) && h(k) > opt.cardMinHeight);
      if (cardsRow) {
        rows.push({
          kind: "cards",
          where: `${label(parent)} > ${label(row[0])}`,
          heights: row.map(h),
          actions: row.map((k) => {
            const last = [...k.querySelectorAll("a, button")].filter(shown).pop();
            return last ? Math.round(last.getBoundingClientRect().top) : null;
          }),
          boxes: row.map((k) => boxOf(k.getBoundingClientRect()))
        });
        continue;
      }
      const n = row[0].children.length;
      if (n < 2 || row.some(boxed) || row.some((k) => k.children.length !== n)) continue;
      for (let i = 0; i < n; i++) {
        const boxes = row.map((k) => k.children[i]);
        if (!boxes.every((b) => shown(b) && boxed(b) && b.tagName.toLowerCase() !== "svg")) continue;
        const heights = boxes.map(h);
        if (Math.max(...heights) < 40) continue;
        rows.push({
          kind: "paired",
          where: `${label(parent)} > ${label(boxes[0])}`,
          heights,
          actions: null,
          boxes: boxes.map((b) => boxOf(b.getBoundingClientRect()))
        });
      }
    }
  }
  const controls = [...root.querySelectorAll("button, select, input:not([type=radio], [type=checkbox], [type=hidden])")].filter(
    (c) => visible(c) && inScope(c) && !c.closest("svg") && !skipped(c, rowIgnore)
  );
  const byParent = /* @__PURE__ */ new Map();
  for (const c of controls) byParent.set(c.parentElement, [...byParent.get(c.parentElement) ?? [], c]);
  for (const [parent, list2] of byParent) {
    const lineMap = /* @__PURE__ */ new Map();
    for (const c of list2) {
      const r = c.getBoundingClientRect();
      const mid = Math.round(r.top + r.height / 2);
      const key = [...lineMap.keys()].find((k) => Math.abs(k - mid) < 6) ?? mid;
      lineMap.set(key, [...lineMap.get(key) ?? [], c]);
    }
    for (const row of lineMap.values())
      if (row.length > 1)
        rows.push({
          kind: "controls",
          where: `${label(parent)}: ${row.map((c) => textOf(c).slice(0, 16)).join(" | ")}`,
          heights: row.map(h),
          actions: null,
          boxes: row.map((c) => boxOf(c.getBoundingClientRect()))
        });
  }
  const targetIgnore = ignoredFor("tap-targets");
  const targets = [];
  const interactive = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [role=menuitem], [role=option], [tabindex]:not([tabindex='-1'])";
  for (const el of root.querySelectorAll(interactive)) {
    if (!inScope(el) || skipped(el, targetIgnore) || !visible(el)) continue;
    if (el.parentElement?.closest(interactive)) continue;
    let r = el.getBoundingClientRect();
    if (el instanceof HTMLInputElement && ["checkbox", "radio"].includes(el.type)) {
      const lab = el.closest("label") ?? (el.id ? doc.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
      if (lab) r = lab.getBoundingClientRect();
    }
    const display = cs(el).display;
    const block = el.parentElement;
    const inline = display === "inline" && !!block && [...block.childNodes].some((n) => n !== el && n.nodeType === Node.TEXT_NODE && /\w/.test(n.textContent ?? ""));
    targets.push({ ...spot(el, r), inline });
  }
  const images = [];
  const imgIgnore = ignoredFor("img-alt");
  for (const el of root.querySelectorAll("img, input[type=image], [role=img], area[href]")) {
    if (!inScope(el) || skipped(el, imgIgnore) || el.closest("[aria-hidden='true']")) continue;
    const named = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || el.hasAttribute("title");
    if (el.matches("img, input[type=image], area") && !el.hasAttribute("alt") && !named)
      images.push({ ...spot(el), text: el.getAttribute("src")?.slice(-60) ?? "", issue: "no alt attribute" });
    else if (el.getAttribute("role") === "img" && !named && !el.querySelector(":scope > title"))
      images.push({ ...spot(el), issue: "role=img without an accessible name" });
  }
  const headings = [];
  for (const el of root.querySelectorAll("h1, h2, h3, h4, h5, h6, [role=heading][aria-level]")) {
    if (!inScope(el) || skipped(el, ignoredFor("heading-order")) || !visible(el)) continue;
    const level = /^H\d$/.test(el.tagName) ? Number(el.tagName[1]) : Number(el.getAttribute("aria-level"));
    headings.push({ ...spot(el), level });
  }
  return {
    url: location.href,
    title: doc.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    scrollWidth: doc.documentElement.scrollWidth,
    docHeight: doc.documentElement.scrollHeight,
    overflowers,
    clipped,
    texts,
    lines,
    rows,
    targets,
    images,
    headings,
    fontSamples,
    bodyBackground: cs(doc.body).backgroundColor
  };
}
function measureFocus(ignore) {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  if (ignore && el.closest(ignore))
    return { selector: "", text: "", box: { x: 0, y: 0, w: 0, h: 0 }, indicator: true, how: "ignored", clippedBy: null };
  const props = [
    "outlineStyle",
    "outlineWidth",
    "outlineColor",
    "boxShadow",
    "borderTopColor",
    "borderBottomColor",
    "backgroundColor",
    "color",
    "textDecorationLine",
    "display",
    "visibility",
    "opacity",
    "stroke",
    "strokeWidth",
    "fill"
  ];
  const read = (e, pseudo) => {
    if (!e) return "";
    const s2 = getComputedStyle(e, pseudo);
    return [...props.map((p) => s2[p]), pseudo ? s2.content : ""].join("|");
  };
  const parts = () => [el, el.parentElement, ...[...el.querySelectorAll("*")].slice(0, 12)];
  const snapshot = () => [
    read(el),
    read(el, "::before"),
    read(el, "::after"),
    ...parts().slice(1).map((e) => read(e))
  ];
  const s = getComputedStyle(el);
  const ringWidth = s.outlineStyle !== "none" ? parseFloat(s.outlineWidth) : 0;
  const shadow = s.boxShadow !== "none";
  const focused = snapshot();
  el.blur();
  const plain = snapshot();
  el.focus({ preventScroll: true });
  const names = [
    "self",
    "::before",
    "::after",
    "parent",
    ...parts().slice(2).map((e) => e?.tagName.toLowerCase() ?? "")
  ];
  const changed = [...new Set(names.filter((_, i) => focused[i] !== plain[i]))];
  const how = ringWidth >= 1 ? `outline ${ringWidth}px` : shadow && changed.includes("self") ? "box-shadow" : changed.length ? `changes ${changed.join(", ")}` : "";
  let clippedBy = null;
  if (ringWidth >= 1 && !el.closest("svg")) {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (/(hidden|clip|auto|scroll)/.test(as.overflowX + as.overflowY)) {
        const reach = ringWidth + parseFloat(s.outlineOffset);
        const r2 = el.getBoundingClientRect();
        const c = a.getBoundingClientRect();
        const onScreen = !(r2.right < c.left || r2.left > c.right);
        const room = Math.min(r2.left - c.left, c.right - r2.right, r2.top - c.top, c.bottom - r2.bottom);
        if (onScreen && room < reach - 0.5 && r2.left >= c.left - 0.5 && r2.right <= c.right + 0.5)
          clippedBy = `${a.tagName.toLowerCase()}.${[...a.classList].join(".")} (needs ${reach}px, has ${room.toFixed(1)}px)`;
        break;
      }
    }
  }
  const r = el.getBoundingClientRect();
  const cls = [...el.classList].slice(0, 3);
  return {
    selector: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls.length ? `.${cls.join(".")}` : ""}`,
    text: (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 40),
    box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    indicator: !!how,
    how,
    clippedBy
  };
}
function measureMotion(ignore) {
  const out = [];
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${[...el.classList].slice(0, 3).map((c) => `.${c}`).join("")}`;
  const boxOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  for (const a of document.getAnimations()) {
    if (a.playState !== "running") continue;
    const effect = a.effect;
    const target = effect?.target;
    if (!target || ignore && target.closest(ignore)) continue;
    const timing = effect.getComputedTiming();
    const remaining = (Number(timing.endTime) || 0) - (Number(a.currentTime) || 0);
    if (timing.iterations !== Infinity && remaining <= 1e3) continue;
    const props = [
      ...new Set(
        effect.getKeyframes().flatMap((k) => Object.keys(k).filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p)))
      )
    ];
    const label = a.animationName ?? a.transitionProperty ?? "script animation";
    out.push({
      selector: name(target),
      text: (target.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      box: boxOf(target),
      what: `${label} (${props.join(", ") || "?"}; ${timing.iterations === Infinity ? "loops" : `${Math.round(remaining)}ms left`})`
    });
  }
  for (const svg of document.querySelectorAll("svg")) {
    if (ignore && svg.closest(ignore) || !svg.getClientRects().length) continue;
    const smil = [...svg.querySelectorAll("animate, animateMotion, animateTransform")].filter(
      (a) => a.getAttribute("repeatCount") === "indefinite" || a.getAttribute("repeatDur") === "indefinite"
    );
    if (smil.length && !svg.animationsPaused())
      out.push({
        selector: name(svg),
        text: svg.getAttribute("aria-label")?.slice(0, 40) ?? "",
        box: boxOf(svg),
        what: `${smil.length} looping SVG animation(s) running`
      });
  }
  return out;
}

// src/grade/rules.ts
var result = (id, checked, findings, spec, note) => {
  const failures = findings.filter((f) => f.severity === "fail").length;
  const warns = findings.length - failures;
  return {
    id,
    status: failures ? "fail" : warns ? "warn" : "pass",
    checked,
    failures,
    findings: [...findings.filter((f) => f.severity === "fail"), ...findings.filter((f) => f.severity === "warn")].slice(
      0,
      spec.maxFindings
    ),
    note
  };
};
function checkOverflow(m, spec) {
  const over2 = m.scrollWidth - m.viewport.width;
  if (over2 <= 0) return result("overflow-x", 1, [], spec);
  const culprits = m.overflowers.length ? m.overflowers.map((o) => ({
    ...o,
    detail: `right edge at ${o.box.x + o.box.w}px, viewport ${m.viewport.width}px`,
    severity: "fail"
  })) : [{ selector: "html", text: "", detail: "", severity: "fail" }];
  culprits[0] = {
    ...culprits[0],
    detail: `page is ${m.scrollWidth}px wide at a ${m.viewport.width}px viewport (+${over2}px); ${culprits[0].detail}`
  };
  return { ...result("overflow-x", 1, culprits, spec), failures: 1 };
}
function checkTextClip(m, spec) {
  return result(
    "text-clip",
    m.texts.length,
    m.clipped.map((c) => ({ ...c, detail: `${c.overflowPx}px of text cut off by ${c.clipBy}`, severity: "fail" })),
    spec
  );
}
var area = (b) => b.w * b.h;
var intersect = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
function findOverlaps(lines, share = 0.4) {
  const flat = lines.flatMap((l) => l.rects.map((r) => ({ owner: l.owner, r }))).sort((a, b) => a.r.y - b.r.y);
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < flat.length; i++) {
    const a = flat[i];
    for (let j = i + 1; j < flat.length && flat[j].r.y < a.r.y + a.r.h; j++) {
      const b = flat[j];
      if (a.owner === b.owner) continue;
      const key = a.owner < b.owner ? `${a.owner}:${b.owner}` : `${b.owner}:${a.owner}`;
      if (seen.has(key)) continue;
      if (intersect(a.r, b.r) >= share * Math.min(area(a.r), area(b.r))) {
        seen.add(key);
        const x = Math.max(a.r.x, b.r.x);
        const y = Math.max(a.r.y, b.r.y);
        out.push([
          a.owner,
          b.owner,
          { x, y, w: Math.min(a.r.x + a.r.w, b.r.x + b.r.w) - x, h: Math.min(a.r.y + a.r.h, b.r.y + b.r.h) - y }
        ]);
      }
    }
  }
  return out;
}
function checkTextOverlap(m, spec, visible) {
  const seen = visible && new Set(visible.map(([a, b]) => `${a}:${b}`));
  return result(
    "text-overlap",
    m.lines.length,
    findOverlaps(m.lines).filter(([a, b]) => !seen || seen.has(`${a}:${b}`)).map(([a, b, box]) => ({
      selector: m.texts[a].selector,
      text: m.texts[a].text,
      box,
      detail: `drawn over "${m.texts[b].text.slice(0, 30)}" (${m.texts[b].selector})`,
      severity: "fail"
    })),
    spec
  );
}
function checkRows(m, spec) {
  const findings = [];
  for (const row of m.rows) {
    const spread = Math.max(...row.heights) - Math.min(...row.heights);
    const tol = row.kind === "paired" ? spec.rowTolerancePx.paired : spec.rowTolerancePx.cards;
    const union = (boxes) => {
      const x = Math.min(...boxes.map((b) => b.x));
      const y = Math.min(...boxes.map((b) => b.y));
      return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
    };
    if (spread > tol)
      findings.push({
        selector: row.where,
        text: "",
        box: union(row.boxes),
        detail: `${row.kind === "paired" ? "paired boxes" : row.kind} differ in height by ${spread}px: ${row.heights.join(" / ")}`,
        severity: "fail"
      });
    else if (row.kind === "cards" && row.actions?.every((a) => a !== null) && new Set(row.actions).size > 1)
      findings.push({
        selector: row.where,
        text: "",
        box: union(row.boxes),
        detail: `card actions sit on different lines: tops ${row.actions.join(" / ")}`,
        severity: "fail"
      });
  }
  return result("row-heights", m.rows.length, findings, spec);
}
function checkTargets(m, spec, touch) {
  const min = touch ? spec.tapTargetPx.coarse : spec.tapTargetPx.fine;
  const findings = m.targets.filter((t) => !t.inline && (t.box.w < min - 0.5 || t.box.h < min - 0.5)).map((t) => ({
    ...t,
    detail: `${t.box.w}\xD7${t.box.h}px, below ${min}\xD7${min}px (${touch ? "touch" : "pointer"})`,
    severity: "fail"
  }));
  const inline = m.targets.filter((t) => t.inline).length;
  return result(
    "tap-targets",
    m.targets.length,
    findings,
    spec,
    inline ? `${inline} inline text link(s) exempt (WCAG 2.5.8)` : void 0
  );
}
function sampleContrast(t) {
  if (!t.color) return null;
  if (t.layers) return contrastRatio(t.color, flatten(t.layers, t.base));
  if (t.sampled?.length) return Math.min(...t.sampled.map((bg) => contrastRatio(t.color, bg)));
  return null;
}
function checkContrast(m, spec) {
  const findings = [];
  let unknown = 0;
  let checked = 0;
  for (const t of m.texts) {
    if (!t.contrastable || t.disabled) continue;
    const ratio = sampleContrast(t);
    if (ratio === null) {
      unknown++;
      continue;
    }
    checked++;
    const large = isLargeText(t.px, t.weight);
    const min = large ? spec.contrast.large : spec.contrast.normal;
    if (ratio < min - 5e-3)
      findings.push({
        selector: t.selector,
        text: t.text,
        box: t.box,
        detail: `${ratio.toFixed(2)}:1, needs ${min}:1 (${t.px}px/${t.weight}${large ? ", large" : ""}${t.layers ? "" : ", background from pixels"})`,
        severity: "fail"
      });
  }
  const svg = m.texts.filter((t) => t.inSvg).length;
  const sampled = m.texts.filter((t) => t.contrastable && !t.layers && t.sampled?.length).length;
  const note = [
    sampled && `${sampled} over an image or gradient measured from pixels`,
    unknown && `${unknown} over an image or gradient not measured`,
    svg && `${svg} SVG text(s) left to the figure checks`
  ].filter(Boolean).join("; ");
  return result("contrast", checked, findings, spec, note || void 0);
}
var firstFamily = (stack) => stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
function faceAllowed(font, faces) {
  const fam = font.familyName.toLowerCase();
  const ps = (font.postScriptName ?? "").toLowerCase();
  return faces.some((f) => {
    const face = f.toLowerCase();
    return fam === face || fam.startsWith(`${face} `) || ps.startsWith(face.replace(/\s+/g, ""));
  });
}
var symbolCount = (text) => [...text].filter((c) => !/[\p{L}\p{N}\s.,;:!?'"()[\]{}\-–—/&%$#@*+=<>|_~`^’‘“”…·•]/u.test(c)).length;
function checkFaces(m, spec, platform, varFaces) {
  if (!spec.faces) return { ...result("font-faces", 0, [], spec, "faces: null in the spec; not checked"), status: "skip" };
  const faces = [...spec.faces, ...varFaces];
  const findings = [];
  for (const t of m.texts) {
    const first2 = firstFamily(t.family);
    if (!faces.some((f) => f.toLowerCase() === first2.toLowerCase()))
      findings.push({
        selector: t.selector,
        text: t.text,
        box: t.box,
        detail: `asks for "${first2}" first (${t.family.slice(0, 60)})`,
        severity: "fail"
      });
  }
  let note = platform ? `${platform.length} element(s) checked for the font actually drawn` : "rendered fonts not checked (needs Chromium)";
  for (const use of platform ?? []) {
    for (const f of use.fonts) {
      if (f.glyphCount === 0 || faceAllowed(f, faces)) continue;
      const symbols = spec.symbolFaces.some((s) => f.familyName.toLowerCase().startsWith(s.toLowerCase())) || f.glyphCount <= symbolCount(use.text);
      findings.push({
        selector: use.selector,
        text: use.text,
        box: use.box,
        detail: `${f.glyphCount} glyph(s) drawn in "${f.familyName}"${symbols ? " (symbols the site faces lack)" : ", a fallback: the site face did not load or lacks these letters"}`,
        severity: symbols ? "warn" : "fail"
      });
    }
  }
  if (varFaces.length) note += `; allowed: ${[...new Set(faces)].join(", ")}`;
  return result("font-faces", m.texts.length, findings, spec, note);
}
function checkTextSize(m, spec) {
  const findings = [];
  for (const t of m.texts) {
    const floor = t.floor >= 0 && spec.textFloors[t.floor] ? spec.textFloors[t.floor].px : spec.minTextPx;
    if (t.px < floor - 0.05)
      findings.push({ selector: t.selector, text: t.text, box: t.box, detail: `${t.px}px, floor ${floor}px`, severity: "fail" });
  }
  return result("text-size", m.texts.length, findings, spec);
}
function checkImages(m, spec) {
  return result(
    "img-alt",
    m.images.length,
    m.images.map((i) => ({ ...i, detail: i.issue, severity: "fail" })),
    spec
  );
}
function checkHeadingOrder(headings, spec) {
  const findings = [];
  let previous = headings.some((h) => h.level === 1) ? 1 : 0;
  for (const h of headings) {
    if (h.level > previous + 1)
      findings.push({
        ...h,
        detail: previous ? `h${h.level} follows an h${previous}` : `the first heading is an h${h.level}`,
        severity: "fail"
      });
    previous = h.level;
  }
  return result("heading-order", headings.length, findings, spec);
}
function checkOneH1(headings, spec) {
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 1) return result("one-h1", 1, [], spec);
  const findings = h1s.length ? h1s.map((h) => ({ ...h, detail: `${h1s.length} visible h1s`, severity: "fail" })) : [{ selector: "body", text: "", detail: "no visible h1", severity: "fail" }];
  return { ...result("one-h1", 1, findings, spec), failures: 1 };
}
function checkFocus(samples, misses, spec) {
  const real = samples.filter((s) => s.how !== "ignored");
  const findings = [];
  for (const s of real) {
    if (!s.indicator) findings.push({ ...s, detail: "no visible change when focused by keyboard", severity: "fail" });
    else if (s.clippedBy) findings.push({ ...s, detail: `focus ring clipped by ${s.clippedBy}`, severity: "fail" });
  }
  if (!real.length)
    return {
      ...result("focus-visible", 0, [], spec, `Tab reached no control (${misses} presses)`),
      status: misses ? "warn" : "pass"
    };
  return result("focus-visible", real.length, findings, spec, `${real.length} control(s) reached by Tab`);
}
function checkMotion(motion, frameDiff2, spec) {
  const findings = motion.map((a) => ({
    ...a,
    detail: `still running under reduced motion: ${a.what}`,
    severity: "fail"
  }));
  if (frameDiff2)
    findings.push({
      selector: "viewport",
      text: "",
      box: frameDiff2.box,
      detail: `${frameDiff2.changedPixels} pixel(s) changed between two frames 1s apart under reduced motion`,
      severity: "fail"
    });
  return result("reduced-motion", 1, findings, spec);
}
function evaluateView(m, x, spec, varFaces) {
  const run = {
    "overflow-x": () => checkOverflow(m, spec),
    "text-clip": () => checkTextClip(m, spec),
    "text-overlap": () => checkTextOverlap(m, spec, x.visibleOverlaps),
    "row-heights": () => checkRows(m, spec),
    "tap-targets": () => checkTargets(m, spec, x.touch),
    contrast: () => checkContrast(m, spec),
    "font-faces": () => checkFaces(m, spec, x.platformFonts, varFaces),
    "text-size": () => checkTextSize(m, spec),
    "img-alt": () => checkImages(m, spec),
    "heading-order": () => checkHeadingOrder(m.headings, spec),
    "one-h1": () => checkOneH1(m.headings, spec),
    "focus-visible": () => checkFocus(x.focus, x.focusMisses, spec),
    "reduced-motion": () => checkMotion(x.motion, x.frameDiff, spec)
  };
  return CHECK_IDS.map(
    (id) => spec.skip[id] ? { id, status: "skip", checked: 0, failures: 0, findings: [], note: spec.skip[id] } : run[id]()
  );
}

// src/grade/report.ts
var REPORT_VERSION = 1;
var RANK = { skip: 0, pass: 1, warn: 2, fail: 3 };
function summarise(views) {
  const summary = {};
  for (const id of CHECK_IDS) {
    const results = views.map((v) => ({ view: v.view, r: v.checks.find((c) => c.id === id) })).filter((x) => x.r);
    const worst = results.reduce((w, x) => RANK[x.r.status] > RANK[w] ? x.r.status : w, "skip");
    summary[id] = {
      status: worst,
      failures: results.reduce((n, x) => n + x.r.failures, 0),
      failedViews: results.filter((x) => x.r.status === "fail").map((x) => x.view)
    };
  }
  const errored = views.some((v) => v.errors.length && !v.checks.length);
  return { passed: !errored && Object.values(summary).every((s) => s.status !== "fail"), summary };
}
var cell = (r) => !r ? "\u2013" : r.status === "fail" ? `**FAIL ${r.failures}**` : r.status === "warn" ? `warn ${r.findings.length}` : r.status;
function toMarkdown(report, topPerCheck = 5) {
  const views = report.views.map((v) => v.view);
  const out = [
    `# Tier-1 grade: ${report.title || report.url}`,
    "",
    `**${report.passed ? "PASS" : "FAIL"}** \xB7 ${report.url} \xB7 spec \`${report.spec}\` \xB7 ${report.startedAt} \xB7 ${(report.durationMs / 1e3).toFixed(0)}s`,
    "",
    `| Check | ${views.join(" | ")} |`,
    `|---|${views.map(() => "---").join("|")}|`,
    ...CHECK_IDS.map(
      (id) => `| ${CHECK_TITLES[id]} (\`${id}\`) | ${report.views.map((v) => cell(v.checks.find((c) => c.id === id))).join(" | ")} |`
    )
  ];
  const notes = report.views.flatMap((v) => [
    ...v.themeApplied || v.theme === "light" ? [] : [`- ${v.view}: the dark theme did not change the page colour; it was graded as rendered.`],
    ...v.errors.map((e) => `- ${v.view}: ${e}`)
  ]);
  if (notes.length) out.push("", "## Notes", "", ...notes);
  for (const id of CHECK_IDS) {
    if (report.summary[id].status !== "fail" && report.summary[id].status !== "warn") continue;
    out.push("", `## ${CHECK_TITLES[id]} (\`${id}\`)`, "");
    for (const v of report.views) {
      const r = v.checks.find((c) => c.id === id);
      if (!r || !r.findings.length) continue;
      out.push(`- **${v.view}**: ${r.failures} failing${r.note ? ` (${r.note})` : ""}`);
      for (const f of r.findings.slice(0, topPerCheck))
        out.push(
          `  - ${f.severity === "warn" ? "warn: " : ""}\`${f.selector}\`${f.text ? ` "${f.text.slice(0, 40)}"` : ""}: ${f.detail}${f.crop ? ` ([crop](${f.crop}))` : ""}`
        );
      if (r.findings.length > topPerCheck) out.push(`  - \u2026 ${r.findings.length - topPerCheck} more in report.json`);
    }
  }
  return `${out.join("\n")}
`;
}
function decodePng(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error("not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = view.getUint32(pos);
    const type = String.fromCharCode(...buf.subarray(pos + 4, pos + 8));
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      const depth = body[8];
      colorType = body[9];
      if (depth !== 8 || colorType !== 2 && colorType !== 6 || body[12] !== 0)
        throw new Error(`unsupported PNG (depth ${depth}, colour type ${colorType}, interlace ${body[12]})`);
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[out + x - bpp] : 0;
      const b = y ? px[out - stride + x] : 0;
      const c = x >= bpp && y ? px[out - stride + x - bpp] : 0;
      const v = raw[src + x];
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = a + b >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[out + x] = v + pred & 255;
    }
  }
  if (bpp === 4) return { width, height, data: px };
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < px.length; i += 3, j += 4) {
    data[j] = px[i];
    data[j + 1] = px[i + 1];
    data[j + 2] = px[i + 2];
    data[j + 3] = 255;
  }
  return { width, height, data };
}
function diffBitmaps(a, b, tolerance = 8) {
  if (a.width !== b.width || a.height !== b.height)
    return { box: { x: 0, y: 0, w: Math.max(a.width, b.width), h: Math.max(a.height, b.height) }, changedPixels: -1 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  let changed = 0;
  for (let y = 0; y < a.height; y++)
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (Math.abs(a.data[i] - b.data[i]) > tolerance || Math.abs(a.data[i + 1] - b.data[i + 1]) > tolerance || Math.abs(a.data[i + 2] - b.data[i + 2]) > tolerance) {
        changed++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  return changed ? { box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, changedPixels: changed } : null;
}
function sampleBackground(bmp, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(bmp.width, Math.ceil(box.x + box.w));
  const y1 = Math.min(bmp.height, Math.ceil(box.y + box.h));
  if (x1 <= x0 || y1 <= y0) return null;
  const step = Math.max(1, Math.floor(Math.sqrt((x1 - x0) * (y1 - y0) / 4e3)));
  const px = [];
  for (let y = y0; y < y1; y += step)
    for (let x = x0; x < x1; x += step) {
      const i = (y * bmp.width + x) * 4;
      const c = [bmp.data[i], bmp.data[i + 1], bmp.data[i + 2], 1];
      px.push({ l: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], c });
    }
  px.sort((a, b) => a.l - b.l);
  return [px[Math.floor((px.length - 1) * 0.1)].c, px[Math.floor((px.length - 1) * 0.9)].c];
}
async function loadPlaywright() {
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const mod = await import(
        /* @vite-ignore */
        name
      );
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch {
    }
  }
  throw new Error("uipack-grade needs Playwright: npm i -D playwright && npx playwright install chromium");
}
var inPage = (page, fn, ...args) => page.evaluate(
  `(() => { const __name = (f) => f; return (${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(", ")}); })()`
);
function withQuery(url, query = {}) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  return u.toString();
}
async function settle(page, viewport, spec) {
  let height = await page.evaluate("document.documentElement.scrollHeight");
  for (let y = 0; y < height; y += Math.round(viewport.height * 0.8)) {
    await page.evaluate(`window.scrollTo(0, ${y})`);
    await page.waitForTimeout(120);
    height = await page.evaluate("document.documentElement.scrollHeight");
    if (y > 6e4) break;
  }
  await page.evaluate("window.scrollTo(0, 0)");
  await page.evaluate("document.fonts && document.fonts.ready.then(() => true)");
  await page.evaluate("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))");
  await page.waitForTimeout(spec.ready.settleMs);
}
async function platformFonts(context, page) {
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "[data-uipack-grade-font]"
    });
    const meta = await page.evaluate(`[...document.querySelectorAll("[data-uipack-grade-font]")].map((el) => {
      const r = el.getBoundingClientRect();
      const name = el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => "." + c).join("");
      return { i: Number(el.getAttribute("data-uipack-grade-font")), selector: name, text: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 60),
        box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
    })`);
    const out = [];
    for (const [k, nodeId] of nodeIds.entries()) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      if (meta[k]) out.push({ ...meta[k], fonts });
    }
    return out;
  } catch {
    return null;
  }
}
async function sampleBackgrounds(page, m) {
  const marked = m.texts.filter((t) => t.contrastable && !t.disabled && t.color && !t.layers);
  if (!marked.length) return;
  await page.evaluate(`(() => { const s = document.createElement("style"); s.id = "uipack-grade-hide";
    s.textContent = "[data-uipack-grade-bg] { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }";
    document.head.append(s); })()`);
  try {
    const bmp = decodePng(await page.screenshot({ fullPage: true, animations: "allow" }));
    for (const t of marked) {
      const bg = sampleBackground(bmp, t.box);
      if (bg) t.sampled = bg;
    }
  } catch {
  } finally {
    await page.evaluate(`document.getElementById("uipack-grade-hide")?.remove()`);
  }
}
async function seenOverlaps(page, pairs) {
  const out = [];
  const shot = async (b) => decodePng(
    await page.screenshot({
      fullPage: true,
      clip: { x: b.x, y: b.y, width: Math.max(2, b.w), height: Math.max(2, b.h) },
      animations: "allow"
    })
  );
  const hide = (i, on) => page.evaluate(`(() => { const el = document.querySelector('[data-uipack-grade-t="${i}"]'); if (!el) return;
      if (${on}) { el.style.setProperty("color", "transparent", "important"); el.style.setProperty("-webkit-text-fill-color", "transparent", "important"); el.style.setProperty("text-shadow", "none", "important"); }
      else { el.style.removeProperty("color"); el.style.removeProperty("-webkit-text-fill-color"); el.style.removeProperty("text-shadow"); } })()`);
  for (const [k, [a, b, box]] of pairs.entries()) {
    if (k >= 60) {
      out.push([a, b]);
      continue;
    }
    try {
      const base = await shot(box);
      const drawn = [];
      for (const i of [a, b]) {
        await hide(i, true);
        drawn.push(diffBitmaps(base, await shot(box), 24) !== null);
        await hide(i, false);
      }
      if (drawn.every(Boolean)) out.push([a, b]);
    } catch {
    }
  }
  return out;
}
async function frameDiff(page) {
  const a = decodePng(await page.screenshot({ animations: "allow", caret: "initial" }));
  await page.waitForTimeout(1e3);
  const b = decodePng(await page.screenshot({ animations: "allow", caret: "initial" }));
  const d = diffBitmaps(a, b);
  if (!d) return null;
  const sy = await page.evaluate("scrollY");
  return { ...d, box: { ...d.box, y: d.box.y + sy } };
}
async function focusWalk(page, spec, crops) {
  const samples = [];
  let cropped = 0;
  const seen = /* @__PURE__ */ new Set();
  let misses = 0;
  await page.evaluate(
    "window.scrollTo(0, 0); document.activeElement && document.activeElement.blur && document.activeElement.blur()"
  );
  for (let i = 0; i < spec.maxTabs; i++) {
    await page.keyboard.press("Tab");
    const s = await inPage(
      page,
      measureFocus,
      [...spec.ignore, ...spec.ignoreByCheck["focus-visible"] ?? []].join(", ")
    );
    if (!s) {
      if (++misses > 2) break;
      continue;
    }
    const key = `${s.selector}@${s.box.x},${s.box.y}`;
    if (seen.has(key)) break;
    seen.add(key);
    if (crops && (!s.indicator || s.clippedBy) && cropped < spec.maxCrops) {
      const sy = await page.evaluate("scrollY");
      const sx = await page.evaluate("scrollX");
      const rel = `crops/${crops[1]}-focus-visible-${++cropped}.png`;
      try {
        const pad = 12;
        fs.writeFileSync(
          path.join(crops[0], rel),
          await page.screenshot({
            clip: {
              x: Math.max(0, s.box.x - sx - pad),
              y: Math.max(0, s.box.y - sy - pad),
              width: s.box.w + pad * 2,
              height: s.box.h + pad * 2
            },
            animations: "allow"
          })
        );
        s.crop = rel;
      } catch {
        cropped--;
      }
    }
    samples.push(s);
  }
  return { samples, misses };
}
async function crop(page, box, docHeight, docWidth, file) {
  const pad = 8;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const w = Math.min(box.w + pad * 2, 1600, docWidth - x);
  const h = Math.min(box.h + pad * 2, 1200, docHeight - y);
  if (w < 2 || h < 2) return false;
  try {
    fs.writeFileSync(file, await page.screenshot({ fullPage: true, clip: { x, y, width: w, height: h }, animations: "allow" }));
    return true;
  } catch {
    return false;
  }
}
async function gradeUrl(url, spec, opts = {}) {
  const started = Date.now();
  const log = opts.log ?? (() => {
  });
  const out = opts.outDir;
  const shots = out && opts.screenshots !== false;
  if (out) {
    fs.mkdirSync(path.join(out, "crops"), { recursive: true });
    if (shots) fs.mkdirSync(path.join(out, "shots"), { recursive: true });
  }
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const views = [];
  let title = "";
  const lightColour = /* @__PURE__ */ new Map();
  try {
    for (const viewport of spec.viewports.filter((v) => !opts.views || opts.views.includes(v.name))) {
      for (const theme of opts.themes ?? ["light", "dark"]) {
        const name = `${viewport.name}-${theme}`;
        log(`grading ${name}`);
        const setup = spec.themes[theme];
        const touch = !!viewport.touch;
        const view = {
          view: name,
          viewport: { width: viewport.width, height: viewport.height, touch },
          theme,
          themeApplied: true,
          bodyBackground: "",
          checks: [],
          errors: []
        };
        views.push(view);
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          isMobile: touch,
          hasTouch: touch,
          colorScheme: setup.colorScheme,
          reducedMotion: "reduce"
        });
        try {
          const page = await context.newPage();
          page.on("pageerror", (e) => view.errors.length < 5 && view.errors.push(`page error: ${e.message.slice(0, 160)}`));
          const init = `(() => { const d = document.documentElement; for (const [k, v] of Object.entries(${JSON.stringify(setup.htmlAttributes ?? {})})) d.setAttribute(k, v);
            try { for (const [k, v] of Object.entries(${JSON.stringify(setup.localStorage ?? {})})) localStorage.setItem(k, v); } catch (e) {} })()`;
          await page.addInitScript(init);
          await page.goto(withQuery(url, setup.query), { waitUntil: "load", timeout: 6e4 });
          try {
            if (spec.ready.selector) await page.waitForSelector(spec.ready.selector, { state: "visible", timeout: 2e4 });
            if (spec.ready.gone) await page.waitForSelector(spec.ready.gone, { state: "detached", timeout: 2e4 });
          } catch {
            view.errors.push(
              `ready condition not met within 20s (${spec.ready.selector ?? ""} ${spec.ready.gone ?? ""}); graded as rendered`
            );
          }
          await page.mouse.move(0, 0);
          await settle(page, viewport, spec);
          const varFaces = await page.evaluate(
            `(${JSON.stringify(spec.faceVars)}).map((v) => getComputedStyle(document.body).getPropertyValue(v)).filter(Boolean)`
          );
          const m = await inPage(page, measurePage, {
            scope: spec.scope,
            ignore: spec.ignore,
            ignoreByCheck: spec.ignoreByCheck,
            floors: spec.textFloors.map((f) => f.selector),
            cardMinHeight: spec.cardMinHeightPx,
            maxFontSamples: 400
          });
          title = title || m.title;
          const colour = await page.evaluate(
            "getComputedStyle(document.documentElement).backgroundColor + ' ' + getComputedStyle(document.body).backgroundColor"
          );
          view.bodyBackground = m.bodyBackground;
          if (theme === "light") lightColour.set(viewport.name, colour);
          else view.themeApplied = lightColour.get(viewport.name) !== colour;
          await sampleBackgrounds(page, m);
          const visibleOverlaps = await seenOverlaps(page, findOverlaps(m.lines));
          const fonts = await platformFonts(context, page);
          const motion = await inPage(
            page,
            measureMotion,
            [...spec.ignore, ...spec.ignoreByCheck["reduced-motion"] ?? []].join(", ")
          );
          const frames = spec.skip["reduced-motion"] ? null : await frameDiff(page);
          if (shots) {
            try {
              fs.writeFileSync(path.join(out, "shots", `${name}.png`), await page.screenshot({ fullPage: true, animations: "allow" }));
              view.screenshot = `shots/${name}.png`;
            } catch (e) {
              view.errors.push(`full-page screenshot failed: ${String(e).slice(0, 120)}`);
            }
          }
          const focus = spec.skip["focus-visible"] ? { samples: [], misses: 0 } : await focusWalk(page, spec, out ? [out, name] : void 0);
          view.checks = evaluateView(
            m,
            {
              platformFonts: fonts,
              focus: focus.samples,
              focusMisses: focus.misses,
              motion,
              frameDiff: frames,
              touch,
              visibleOverlaps
            },
            spec,
            varFaces.map(firstFamily)
          );
          if (out)
            for (const check of view.checks) {
              let n = 0;
              for (const f of check.findings) {
                if (f.crop || n >= spec.maxCrops || !f.box) continue;
                const rel = `crops/${name}-${check.id}-${n + 1}.png`;
                if (await crop(page, f.box, m.docHeight, m.scrollWidth, path.join(out, rel))) {
                  f.crop = rel;
                  n++;
                }
              }
            }
        } catch (e) {
          view.errors.push(`could not grade this view: ${String(e).slice(0, 300)}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  const report = {
    tool: "uipack-grade",
    reportVersion: REPORT_VERSION,
    url,
    title,
    spec: spec.name,
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    ...summarise(views),
    views
  };
  if (out) {
    fs.writeFileSync(path.join(out, "report.json"), `${JSON.stringify(report, null, 2)}
`);
    fs.writeFileSync(path.join(out, "summary.md"), toMarkdown(report));
  }
  return report;
}
var PACKET_VIEWS = [
  { name: "1440-light", width: 1440, height: 900, scale: 1, theme: "light" },
  { name: "1440-dark", width: 1440, height: 900, scale: 1, theme: "dark" },
  { name: "390-light", width: 390, height: 844, scale: 2, theme: "light" },
  { name: "390-dark", width: 390, height: 844, scale: 2, theme: "dark" }
];
var HINT_PATTERNS = [
  /\bui ?pack\b/i,
  /\bours\b/i,
  /\bour (version|system|library|output)\b/i,
  /\bgeneric (version|producer|output|side|agent|build)\b/i,
  /\bbaseline (version|producer|output|side|agent|build|page)\b/i,
  /\bimprover\b/i,
  /\bproducer\b/i,
  /\bcoordinator\b/i,
  /\bsystem under test\b/i,
  /\b(new|old|previous|current) version\b/i,
  /\btarget score\b/i
];
function findHints(text) {
  return HINT_PATTERNS.flatMap((re) => text.match(re)?.[0] ?? []);
}
function briefMarkdown(b) {
  const list2 = (xs = []) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `# Brief ${b.id} (version ${b.version}, frozen ${b.frozen})`,
    "",
    `**Product:** ${b.product}`,
    "",
    `**Audience:** ${b.audience}`,
    "",
    `**Task:** ${b.task}`,
    "",
    "## Facts",
    "",
    "Use only these facts; add none.",
    "",
    list2(b.facts),
    ...b.mustInclude?.length ? ["", "## Must include", "", list2(b.mustInclude)] : [],
    ...b.outOfScope?.length ? ["", "## Out of scope", "", list2(b.outOfScope)] : [],
    ""
  ].join("\n");
}
function rubricVersion(text) {
  const m = text.match(/^---[\s\S]*?^version:\s*["']?([\w.-]+)["']?\s*$[\s\S]*?^---/m);
  if (!m) throw new Error("the rubric has no `version:` in its frontmatter: judge only against a frozen, versioned rubric");
  return m[1];
}
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
function assignOrders(coin) {
  const first2 = coin() ? { A: "a", B: "b" } : { A: "b", B: "a" };
  return {
    "judge-1": first2,
    "judge-2": { A: first2.B, B: first2.A },
    "judge-3": coin() ? { A: "a", B: "b" } : { A: "b", B: "a" }
  };
}
var sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
async function capture(url, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  try {
    for (const v of PACKET_VIEWS) {
      const context = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: v.scale,
        colorScheme: v.theme,
        reducedMotion: "reduce",
        isMobile: v.width < 600,
        hasTouch: v.width < 600
      });
      try {
        const page = await context.newPage();
        await page.goto(withQuery(url, { theme: v.theme }), { waitUntil: "load", timeout: 6e4 });
        let h = await page.evaluate("document.documentElement.scrollHeight");
        for (let y = 0; y < h && y < 6e4; y += 600) {
          await page.evaluate(`window.scrollTo(0, ${y})`);
          await page.waitForTimeout(150);
          h = await page.evaluate("document.documentElement.scrollHeight");
        }
        await page.evaluate("window.scrollTo(0, 0)");
        await page.evaluate("document.fonts && document.fonts.ready.then(() => true)");
        await page.waitForTimeout(800);
        fs.writeFileSync(path.join(dir, `${v.name}.png`), await page.screenshot({ fullPage: true, animations: "allow" }));
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
async function screens(source, scratch) {
  let dir = source;
  if (/^https?:\/\//.test(source)) {
    dir = scratch;
    await capture(source, dir);
  } else if (!fs.existsSync(source) || !fs.statSync(source).isDirectory())
    throw new Error(`${source}: not a URL or a directory of <view>.png screenshots`);
  const files = /* @__PURE__ */ new Map();
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".png")) files.set(f.replace(/\.png$/, ""), path.join(dir, f));
  if (!files.size) throw new Error(`${source}: no .png screenshots`);
  return files;
}
var JUDGE_PROMPT = (version, hasAnchor) => `# Judge instructions

You are an independent design judge. Do not edit files or launch agents. You see two pages, A and B,
built to the same brief (brief.md)${hasAnchor ? ", and a reference page R, a known human-made page scored on the same rubric" : ""}.
Nothing here tells you who made which; do not guess, it does not matter.

1. Read brief.md, then rubric.md (version ${version}). Use the rubric unchanged.
2. Look at every screenshot: A-*.png, B-*.png${hasAnchor ? ", R-*.png" : ""} at each width and theme.
3. For each criterion, score A and B${hasAnchor ? " and R" : ""} 1-10 against the rubric's 3 / 6 / 9 descriptions, and cite the
   evidence (screenshot name and region, or quoted words). A severe flaw caps a score.
4. Decide which page better meets the brief overall: A, B or tie, and by how much (slight, clear, decisive).
   This preference is the result; the scores explain it.
5. List each page's top defects, most important first, each with where it is.

Return only JSON:
{"packet": "<this folder's name>", "rubric": "<rubric id>", "rubricVersion": "${version}",
 "criteria": [{"id": "<criterion id>", "A": n, "B": n${hasAnchor ? ', "R": n' : ""}, "evidence": {"A": "...", "B": "..."}}],
 "overall": {"A": n, "B": n${hasAnchor ? ', "R": n' : ""}},
 "preference": "A|B|tie", "margin": "slight|clear|decisive",
 "defects": {"A": ["..."], "B": ["..."]},
 "confidence": "high|medium|low, and why"}
`;
async function buildPacket(o) {
  const out = path.resolve(o.outDir);
  const keyFile = path.resolve(o.keyFile);
  if (!path.relative(out, keyFile).startsWith(".."))
    throw new Error("the key must live outside the packet folder, where no judge reads");
  const briefSource = fs.readFileSync(o.brief, "utf8");
  const brief = o.brief.endsWith(".json") ? briefMarkdown(JSON.parse(briefSource)) : briefSource;
  const rubric = fs.readFileSync(o.rubric, "utf8");
  const version = rubricVersion(rubric);
  const hints = [...findHints(brief).map((h) => `brief: "${h}"`), ...findHints(rubric).map((h) => `rubric: "${h}"`)];
  if (hints.length)
    throw new Error(`the judge material names a side or the system under test; rewrite it:
  ${hints.join("\n  ")}`);
  const scratch = path.join(path.dirname(keyFile), `.captures-${Date.now()}`);
  const src = { a: await screens(o.a, path.join(scratch, "a")), b: await screens(o.b, path.join(scratch, "b")) };
  const anchor = o.anchor ? await screens(o.anchor, path.join(scratch, "anchor")) : null;
  const views = [...src.a.keys()].filter((v) => src.b.has(v)).sort();
  if (!views.length) throw new Error("the two candidates share no screenshot view names");
  const rand = o.seed === void 0 ? () => crypto.randomInt(2) === 1 : (() => {
    const r = seeded(o.seed);
    return () => r() < 0.5;
  })();
  const orders = assignOrders(rand);
  const packets = [];
  for (const [name, order] of Object.entries(orders)) {
    const dir = path.join(out, name);
    fs.mkdirSync(dir, { recursive: true });
    for (const v of views) {
      fs.copyFileSync(src[order.A].get(v), path.join(dir, `A-${v}.png`));
      fs.copyFileSync(src[order.B].get(v), path.join(dir, `B-${v}.png`));
      if (anchor?.has(v)) fs.copyFileSync(anchor.get(v), path.join(dir, `R-${v}.png`));
    }
    fs.writeFileSync(path.join(dir, "brief.md"), brief);
    fs.writeFileSync(path.join(dir, "rubric.md"), rubric);
    fs.writeFileSync(path.join(dir, "judge-prompt.md"), JUDGE_PROMPT(version, !!anchor));
    packets.push(dir);
  }
  const key = {
    packets: orders,
    sources: { a: o.a, b: o.b, ...o.anchor ? { anchor: o.anchor } : {} },
    rubric: { file: path.basename(o.rubric), version, sha256: sha(rubric) },
    brief: { file: path.basename(o.brief), sha256: sha(briefSource) },
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  fs.mkdirSync(path.dirname(keyFile), { recursive: true });
  fs.writeFileSync(keyFile, `${JSON.stringify(key, null, 2)}
`);
  return { packets, keyFile };
}

// src/grade/tally.ts
var mean = (xs) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
var round = (x) => Math.round(x * 100) / 100;
function tallyJudges(key, verdicts) {
  const problems = [];
  const rows = verdicts.flatMap((v) => {
    const map2 = key.packets[v.packet];
    if (!map2) {
      problems.push(`verdict for unknown packet "${v.packet}"`);
      return [];
    }
    if (String(v.rubricVersion) !== String(key.rubric.version))
      problems.push(`${v.packet} scored rubric version ${v.rubricVersion}, the packet carried ${key.rubric.version}`);
    const side = (label) => map2[label];
    const score = (o, s) => side("A") === s ? o.A : o.B;
    const pref = v.preference === "tie" ? "tie" : side(v.preference);
    return [
      {
        packet: v.packet,
        a: score(v.overall, "a"),
        b: score(v.overall, "b"),
        anchor: v.overall.R ?? null,
        pref,
        firstShownWon: v.preference === "A",
        criteria: Object.fromEntries(v.criteria.map((c) => [c.id, score(c, "b") - score(c, "a")]))
      }
    ];
  });
  const prefersB = rows.reduce((n, r) => n + (r.pref === "b" ? 1 : r.pref === "tie" ? 0.5 : 0), 0);
  const deltas = rows.map((r) => r.b - r.a);
  let disagreement = false;
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      const opposite = rows[i].pref === "a" && rows[j].pref === "b" || rows[i].pref === "b" && rows[j].pref === "a";
      if (Math.abs(deltas[i] - deltas[j]) >= 2 || opposite) disagreement = true;
    }
  const ids = [...new Set(rows.flatMap((r) => Object.keys(r.criteria)))];
  const anchors = rows.map((r) => r.anchor).filter((x) => x !== null);
  const m = {
    a: round(mean(rows.map((r) => r.a))),
    b: round(mean(rows.map((r) => r.b))),
    anchor: anchors.length ? round(mean(anchors)) : null
  };
  if (rows.length < 2) problems.push("fewer than two judges: run the second judge in the opposite order");
  return {
    judges: rows.length,
    winRateB: rows.length ? round(prefersB / rows.length) : 0,
    overallDeltas: deltas,
    meanOverallDelta: round(mean(deltas)),
    criterionDeltas: Object.fromEntries(
      ids.map((id) => [id, round(mean(rows.filter((r) => id in r.criteria).map((r) => r.criteria[id])))])
    ),
    mean: m,
    relativeToAnchor: m.anchor === null ? null : { a: round(m.a - m.anchor), b: round(m.b - m.anchor) },
    preferredFirstShown: rows.filter((r) => r.firstShownWon).length,
    disagreement,
    needsThirdJudge: disagreement && rows.length < 3,
    problems
  };
}
function formatTally(t) {
  const lines = [
    `Judges: ${t.judges}${t.needsThirdJudge ? " (disagree by 2+ or opposite preferences: run a third judge)" : t.disagreement ? " (disagreement resolved by a third judge)" : ""}`,
    `Win rate of B over A: ${(t.winRateB * 100).toFixed(0)}%`,
    `Paired overall delta (B \u2212 A): mean ${t.meanOverallDelta >= 0 ? "+" : ""}${t.meanOverallDelta} (per judge: ${t.overallDeltas.join(", ")})`,
    `Per criterion (B \u2212 A): ${Object.entries(t.criterionDeltas).map(([k, v]) => `${k} ${v >= 0 ? "+" : ""}${v}`).join(", ")}`,
    t.relativeToAnchor ? `Against the anchor (${t.mean.anchor}): A ${t.relativeToAnchor.a >= 0 ? "+" : ""}${t.relativeToAnchor.a}, B ${t.relativeToAnchor.b >= 0 ? "+" : ""}${t.relativeToAnchor.b}` : "No anchor scored: absolute numbers are not interpretable",
    `Position: ${t.preferredFirstShown} of ${t.judges} judge(s) preferred the side shown first`,
    ...t.problems.map((p) => `Problem: ${p}`)
  ];
  return lines.join("\n");
}

// src/grade/ledger.ts
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
function validateLedger(entries) {
  const out = [];
  const ids = /* @__PURE__ */ new Set();
  entries.forEach((e, i) => {
    const at = (msg) => out.push(`line ${i + 1}${isObj(e) && nonEmpty(e.id) ? ` (${String(e.id)})` : ""}: ${msg}`);
    if (!isObj(e)) return at("not a JSON object");
    for (const f of ["id", "defect", "claimedFix", "improver"]) if (!nonEmpty(e[f])) at(`${f} is required`);
    if (nonEmpty(e.id)) {
      if (ids.has(e.id)) at("duplicate id");
      ids.add(e.id);
    }
    if (!["claimed", "verified", "failed"].includes(e.status)) at(`status must be claimed, verified or failed`);
    const lives = e.livesAt;
    if (!isObj(lives) || !nonEmpty(lives.repo) || !nonEmpty(lives.path)) at("livesAt needs repo and path");
    else if (!/^[0-9a-f]{7,40}$/.test(String(lives.commit ?? "")))
      at("livesAt.commit must be a commit hash (a fix in a scratch copy does not count)");
    if (e.status !== "claimed") {
      const proof = e.proof;
      if (!isObj(proof) || !nonEmpty(proof.producerRun) || !nonEmpty(proof.evidence))
        at("a verified or failed fix needs proof.producerRun and proof.evidence");
      if (!nonEmpty(e.checkedBy)) at("a verified or failed fix needs checkedBy");
    }
    if (nonEmpty(e.checkedBy) && e.checkedBy === e.improver) at("checkedBy must be someone other than the improver");
  });
  return out;
}

// scripts/style-contract.ts
var CORE_ROLES = [
  "paper",
  "surface",
  "surface-raised",
  "surface-2",
  "ink",
  "ink-2",
  "ink-3",
  "line",
  "line-soft",
  "accent",
  "on-accent",
  "accent-surface",
  "accent-ink-2",
  "accent-line",
  "flow-request",
  "flow-response",
  "flow-change",
  "data-pos",
  "data-neg",
  "data-context",
  "data-1",
  "data-2",
  "data-3",
  "data-4",
  "on-data-1",
  "on-data-2",
  "on-data-3",
  "on-data-4",
  "inv-paper",
  "inv-surface",
  "inv-ink",
  "inv-ink-2",
  "inv-line",
  "inv-accent",
  "inv-node",
  "node",
  "line-solid",
  "accent-ink",
  "data-neg-ink",
  "alert",
  "warn",
  "slide-font-text",
  "slide-font-label",
  "slide-font-display",
  "web-font-text",
  "web-font-label",
  "web-font-display",
  "font-text",
  "font-label",
  "font-display",
  "display-weight",
  "display-tracking",
  "display-case",
  "label-tracking",
  "radius",
  "radius-sm",
  "radius-xs",
  "radius-pill",
  "stroke",
  "rule-width",
  "density",
  "type-ratio",
  "measure",
  "ease-settle",
  "ease-travel",
  "dur-quick",
  "dur-base",
  "dur-slow",
  // Ornament slots
  "backdrop",
  "backdrop-mask",
  "frame-border",
  "frame-shadow",
  "card-shadow",
  "marker-size",
  "marker-shape",
  "marker-color",
  "section-rule",
  "nav-fill",
  "nav-blur",
  "grain",
  "glow",
  "cta-shadow",
  "cta-shadow-hover",
  "display-scale",
  "em-style",
  "em-color",
  "star-fill",
  // Added with Technical's Cyanotype values (2026-11-05)
  "accent-stroke",
  "flow-error",
  "font-heading",
  "canvas-pattern",
  "cta-fill",
  "on-cta",
  "em-decoration",
  "num-ring"
];

// scripts/site-model.ts
var PAGE_TYPES = [
  { id: "landing", name: "Landing", use: "A product, launch or announcement page with one goal" },
  { id: "documentation", name: "Documentation", use: "Product docs or a reference page in a navigable shell" },
  { id: "article", name: "Article", use: "A long read or a blog post" },
  { id: "deck", name: "Deck", use: "Slides, presented or read alone: an HTML deck is a page of the site" },
  { id: "dashboard", name: "Dashboard", use: "A screen of live numbers, tables and status someone checks" }
];
var LAYOUT_ARCHETYPES = [
  {
    id: "product-landing",
    pageType: "landing",
    name: "Product landing",
    file: "docs/system/layout/landing.md",
    grid: "12 / 8 / 4 columns (container 1024px and up, 640px, below); gutters 32px wide, 24px below 1024px; one 1120px max width for every section",
    regions: "Nav, hero, sections, closing band, footer",
    order: "The author's; a style's `prefers` order only on opt-in",
    hero: "Split: copy on 5 columns, the product's real output on 7, stacked below 1024px",
    code: "`WebPage`, `StarHero`, `Section` (`uipack/web`)"
  },
  {
    id: "docs-shell",
    pageType: "documentation",
    name: "Docs shell",
    file: "docs/system/layout/documentation.md",
    grid: "Sidebar, article column at the reading measure, On this page; one column below 900px",
    regions: "Header, sidebar, context row, article, On this page, pager",
    order: "h1, what the page is for, the values table, the detail, related pages",
    hero: "None: the page's h1 and its first line",
    code: "`DocsLayout`, `DocsMarkdown` (`uipack/docs`)"
  },
  {
    id: "layer-article",
    pageType: "article",
    name: "Layered long read",
    file: "docs/system/layout/article.md",
    grid: "One text column at the reading measure; figures and `wide` clusters break out to the figure slot",
    regions: "Title, lede, a run of sections, each from the article parts",
    order: "Each section: head strip, heading, prose, terms, change note, callout, links, notes",
    hero: "The title and a one-sentence lede; a figure only when it carries the claim",
    code: "`LayerSection` parts (`uipack/article`)"
  },
  {
    id: "slide-canvas",
    pageType: "deck",
    name: "Slide canvas",
    file: "docs/system/layout/deck-slide.md",
    grid: "A 1920\xD71080 canvas scaled to its frame, inside a fixed safe area",
    regions: "Eyebrow (optional), headline, lede (optional), body, footer",
    order: "The storyline's roles, one archetype per slide",
    hero: "A cover slide: the outcome as the title",
    code: "`DeckPlayer`, `Slide` and the archetype factories (`uipack/deck`)"
  },
  {
    id: "one-question-dashboard",
    pageType: "dashboard",
    name: "One-question dashboard",
    file: "docs/system/layout/dashboard.md",
    grid: "The landing grid: 12 / 8 / 4 columns, 32 / 24px gutters",
    regions: "Title row, headline numbers, the chart, records, time, source",
    order: "Top to bottom in the order of the regions",
    hero: "Three or four headline numbers of equal weight",
    code: "`Proof`, `ProductWindow`, `DataTable`, the charts (`uipack/web`, `uipack/charts`)"
  }
];
var CUSTOM_LAYOUT_ROWS = ["Grid", "Regions", "Section order", "Hero"];
var WRITING_STYLE_ROWS = ["Tone and register", "Title form", "Copy density", "House words", "Budgets"];
var COMPONENTS = [
  {
    id: "diagrams",
    name: "Diagrams",
    doc: "docs/components/diagrams.md",
    members: "`Figure`, the presets, `DrillFigure`, `SpanChart` and `LayerStack` (`uipack`, `uipack/presets`, `uipack/drill`, `uipack/charts`)",
    pick: "one",
    looks: [
      {
        id: "blueprint",
        name: "Blueprint",
        mode: "fixed",
        fixed: "Card surface, node shapes and 6px node radius, the four flow colours and packet shapes, label face, strokes, the 11px type floor",
        takes: "Light or dark only"
      }
    ]
  },
  {
    id: "3d",
    name: "3D object scenes",
    doc: "docs/components/3d.md",
    members: "`ObjectScene` and its player (`uipack/objects`)",
    pick: "several",
    looks: [
      {
        id: "studio",
        name: "Studio objects",
        mode: "flex",
        fixed: "Product photography: one object on a seamless sweep, one lens family, shaped key, real shadow",
        takes: "Night room from the ink, rim from the accent; a `palette` prop overrides both"
      },
      {
        id: "paper-theatre",
        name: "Paper worlds",
        mode: "fixed",
        fixed: "Cut-card toy theatres, viridian and persimmon frames on cream, one warm lantern",
        takes: "Light or dark only"
      },
      {
        id: "kinetic",
        name: "Kinetic sculptures",
        mode: "fixed",
        fixed: "Brass armatures, glazed stoneware, slate bases, a gallery spot at night",
        takes: "Light or dark only"
      },
      {
        id: "cartoon",
        name: "Cartoon worlds",
        mode: "fixed",
        fixed: "Floating toy islands, toon ramp, day and night palettes of their own",
        takes: "Light or dark only"
      },
      {
        id: "realistic",
        name: "Realistic close-ups",
        mode: "fixed",
        fixed: "Macro still lifes on real surfaces, depth of field, window light by day, a desk lamp at night",
        takes: "Light or dark only"
      },
      {
        id: "abstract",
        name: "Abstract forms",
        mode: "fixed",
        fixed: "Refractive glass in front of lacquer bars, a spectral caustic",
        takes: "Light or dark only"
      }
    ]
  },
  {
    id: "mechanism",
    name: "Mechanism",
    doc: "docs/components/mechanism.md",
    members: "`VerificationGate`, `GateMachine`, `MechanismFrame` (`uipack/mechanism`)",
    pick: "one",
    looks: [
      {
        id: "isometric",
        name: "Isometric machine",
        mode: "flex",
        fixed: "Isometric solids shaded in four tones by facing, one lit part, motion by springs",
        takes: "Tones from the paper and ink, the lit part from the accent, card labels in the label face"
      }
    ]
  }
];

// scripts/check-spec.ts
var UIPACK_ROOT = (() => {
  try {
    return path.resolve(url.fileURLToPath(new URL(".", void 0)), "..");
  } catch {
    return process.cwd();
  }
})();
var REQUIRED_KEYS = ["spec", "site", "extends", "pages", "layouts", "components", "status", "uipack"];
var REQUIRED_SECTIONS = [
  "Identity",
  "Role values",
  "Type",
  "Density and rhythm",
  "Ornaments",
  "Layout",
  "Writing style",
  "Component looks",
  "Reuse",
  "Open TODOs"
];
function splitTop(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "[" || ch === "{") depth++;
    if (ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function parseValue(value) {
  if (value.startsWith("[") && value.endsWith("]")) return splitTop(value.slice(1, -1));
  if (value.startsWith("{") && value.endsWith("}")) {
    const map2 = {};
    for (const pair of splitTop(value.slice(1, -1))) {
      const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(pair);
      if (!kv) continue;
      const v = parseValue(kv[2].trim());
      map2[kv[1]] = typeof v === "string" || Array.isArray(v) ? v : JSON.stringify(v);
    }
    return map2;
  }
  return value;
}
function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    out[kv[1]] = parseValue(kv[2].replace(/\s+#.*$/, "").trim());
  }
  return out;
}
var list = (v) => Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
var map = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
function sections(text) {
  const out = [];
  let fence = false;
  for (const line of text.split("\n")) {
    if (/^(`{3,}|~{3,})/.test(line)) fence = !fence;
    else if (!fence && line.startsWith("## ")) out.push(line.slice(3).trim());
  }
  return out;
}
function section(text, title, level = 2) {
  const hashes = "#".repeat(level);
  const start = text.indexOf(`
${hashes} ${title}
`);
  if (start < 0) return "";
  const rest = text.slice(start + title.length + level + 3);
  const end = rest.search(new RegExp(`\\n#{1,${level}} `));
  return end < 0 ? rest : rest.slice(0, end);
}
function rowLabels(text) {
  return [...text.matchAll(/^\|\s*(?:\*\*)?([^|*]+?)(?:\*\*)?\s*\|/gm)].map((m) => m[1].trim());
}
function roleRows(text) {
  const rows = /* @__PURE__ */ new Map();
  for (const line of section(text, "Role values").split("\n")) {
    const m = /^\|\s*`(--[a-z0-9-]+)`\s*\|(.*)\|(.*)\|\s*$/.exec(line);
    if (m) rows.set(m[1], [m[2].trim(), m[3].trim()]);
  }
  return rows;
}
function fixedTokens(componentDoc) {
  return [...componentDoc.matchAll(/^\|\s*`(--[a-z0-9-]+)`/gm)].map((m) => m[1]);
}
function pickedLooks(fm) {
  const out = {};
  for (const [component, looks] of Object.entries(map(fm.components))) out[component] = list(looks);
  if (!fm.components)
    for (const family of list(fm.uses)) {
      const component = COMPONENTS.find((c) => c.id === family);
      out[family] = component ? [component.looks[0].id] : [];
    }
  return out;
}
function checkSpec(text, { root = UIPACK_ROOT } = {}) {
  const problems = [];
  const fm = frontmatter(text);
  if (!fm) return ["no frontmatter: start with the template's --- block"];
  const legacy = !fm.components && fm.uses;
  for (const key of REQUIRED_KEYS)
    if (!fm[key] && !(key === "components" && legacy)) problems.push(`frontmatter: missing ${key}`);
  if (fm.components && fm.uses) problems.push("frontmatter: components: replaces uses:; keep only components");
  const titles = sections(text);
  for (const title of REQUIRED_SECTIONS) if (!titles.includes(title)) problems.push(`missing section "## ${title}"`);
  const rows = roleRows(text);
  for (const role of CORE_ROLES) {
    const row = rows.get(`--ui-${role}`);
    if (!row) problems.push(`role --ui-${role}: no row in Role values (give a value or TODO:)`);
    else if (row.some((cell2) => cell2 === "" || cell2 === "-"))
      problems.push(`role --ui-${role}: an empty cell (give a value or TODO:)`);
  }
  const specsDir = path.join(root, "docs/specs");
  const specIds = fs.existsSync(specsDir) ? fs.readdirSync(specsDir).filter((f) => f.endsWith(".md")).map((f) => frontmatter(fs.readFileSync(path.join(specsDir, f), "utf8"))?.spec).filter((id) => typeof id === "string" && !id.startsWith("TODO")) : [];
  const ext = fm.extends;
  if (typeof ext === "string" && ext !== "core" && !specIds.includes(ext))
    problems.push(`extends: "${ext}" is neither core nor a spec in docs/specs`);
  const pages = list(fm.pages);
  const layouts = map(fm.layouts);
  const layoutText = section(text, "Layout");
  for (const id of pages) {
    const type = PAGE_TYPES.find((t) => t.id === id);
    if (!type) {
      problems.push(`pages: no page type "${id}" (${PAGE_TYPES.map((t) => t.id).join(", ")})`);
      continue;
    }
    const pick = layouts[id];
    if (!pick) {
      problems.push(`layouts: page type "${id}" has no layout (an archetype id, or custom)`);
      continue;
    }
    const sub = section(layoutText.startsWith("\n") ? layoutText : `
${layoutText}`, type.name, 3);
    if (!sub.trim()) problems.push(`Layout: no "### ${type.name}" for page type "${id}"`);
    if (pick === "custom") {
      const labels = rowLabels(sub);
      for (const row of CUSTOM_LAYOUT_ROWS)
        if (!labels.includes(row)) problems.push(`Layout, ${type.name}: a custom layout needs a "${row}" row`);
    } else {
      const archetype = LAYOUT_ARCHETYPES.find((a) => a.id === pick);
      if (!archetype) problems.push(`layouts: no archetype "${pick}" (docs/system/layout/README.md lists them)`);
      else if (archetype.pageType !== id)
        problems.push(`layouts: "${pick}" is a ${archetype.pageType} archetype, not a ${id} one`);
    }
  }
  for (const id of Object.keys(layouts)) if (!pages.includes(id)) problems.push(`layouts: "${id}" is not in pages:`);
  const writing = rowLabels(section(text, "Writing style"));
  if (titles.includes("Writing style")) {
    for (const row of WRITING_STYLE_ROWS) if (!writing.includes(row)) problems.push(`Writing style: no "${row}" row`);
  }
  for (const [componentId, looks] of Object.entries(pickedLooks(fm))) {
    const component = COMPONENTS.find((c) => c.id === componentId);
    if (!component) {
      problems.push(`components: no component "${componentId}" (${COMPONENTS.map((c) => c.id).join(", ")})`);
      continue;
    }
    if (!looks.length) problems.push(`components: ${componentId} picks no look`);
    if (component.pick === "one" && looks.length > 1)
      problems.push(`components: ${componentId} takes one look, got ${looks.length}`);
    for (const lookId of looks) {
      const look = component.looks.find((l) => l.id === lookId);
      if (!look) {
        problems.push(`components: ${componentId} offers no look "${lookId}" (${component.looks.map((l) => l.id).join(", ")})`);
        continue;
      }
      if (look.mode !== "fixed") continue;
      const doc = path.join(root, component.doc);
      if (!fs.existsSync(doc)) continue;
      for (const token of fixedTokens(fs.readFileSync(doc, "utf8")))
        if (rows.has(token))
          problems.push(`${token} is fixed by the ${look.name} look (${component.id}): a spec that picks it may not set it`);
    }
  }
  if (fm.status === "implemented") {
    const values = fm.values;
    if (typeof values !== "string" || !fs.existsSync(path.join(root, values)))
      problems.push(`status implemented: values must name the style file (got "${typeof values === "string" ? values : ""}")`);
  } else if (fm.status !== "draft") problems.push(`status: "${String(fm.status)}" (draft or implemented)`);
  return problems;
}
if (process.argv[1] && void 0 === url.pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: tsx scripts/check-spec.ts <spec.md> [...]");
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    const problems = checkSpec(fs.readFileSync(file, "utf8"));
    console.log(problems.length ? `\u2717 ${file}
  ${problems.join("\n  ")}` : `\u2713 ${file}`);
    failed || (failed = problems.length > 0);
  }
  process.exit(failed ? 1 : 0);
}

// src/grade/style-spec.ts
var first = (stack) => {
  const f = stack.replace(/`/g, "").split(",")[0].trim().replace(/^["']|["']$/g, "");
  return !f || /^var\(|^TODO/i.test(f) ? null : f;
};
function facesFromStyleSpec(text) {
  const rows = roleRows(text);
  const fromRoles = [...rows.entries()].filter(([name]) => /^--ui-font-/.test(name)).flatMap(([, [light, dark]]) => [first(light), first(dark)]).filter((f) => !!f);
  if (fromRoles.length) return [...new Set(fromRoles)];
  const type = text.split(/\n## /).find((s) => s.startsWith("Type\n")) ?? "";
  const faces = type.split("\n").filter((l) => l.startsWith("|") && !/^\|\s*(Medium|-)/.test(l)).flatMap((l) => l.split("|").slice(2, -1)).map((cell2) => /^\s*([A-Z][\w-]*(?: [A-Z][\w-]*)*)/.exec(cell2)?.[1]).filter((f) => !!f && !/^TODO/.test(f));
  return [...new Set(faces)];
}
function specFromStyleDoc(text) {
  const fm = frontmatter(text);
  if (!fm) throw new Error("not a style spec: no frontmatter (docs/specs/TEMPLATE.md)");
  const faces = facesFromStyleSpec(text);
  const name = typeof fm.spec === "string" && !/^TODO/.test(fm.spec) ? fm.spec : "site";
  return { name, faces: faces.length ? faces : null };
}

// src/grade/cli.ts
var USAGE = `usage: uipack-grade check <url> [--spec uipack|default|STYLE.md|config.json] [--out dir] [--views 1440,390] [--themes light,dark] [--no-shots]
       uipack-grade spec [file.json]
       uipack-grade packet --brief brief.md --rubric rubric.md --a <url|dir> --b <url|dir> --out dir --key key.json [--anchor <url|dir>] [--seed n]
       uipack-grade tally --key key.json judge-1.json judge-2.json [judge-3.json]
       uipack-grade ledger ledger.jsonl`;
function parse(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next === void 0 || next.startsWith("--")) flags[a.slice(2)] = true;
      else flags[a.slice(2)] = argv[++i];
    } else rest.push(a);
  }
  return { flags, rest };
}
var TECHNICAL = ["docs/specs/technical.md", "node_modules/uipack/docs/specs/technical.md"];
function loadSpec(arg) {
  if (arg === void 0 || arg === true || arg === "default") return resolveSpec({});
  if (arg === "uipack") {
    const doc = TECHNICAL.find((p) => fs.existsSync(p));
    const style2 = doc ? specFromStyleDoc(fs.readFileSync(doc, "utf8")) : {};
    return mergeSpec(resolveSpec({ extends: "uipack" }), style2.faces ? { faces: style2.faces } : {});
  }
  if (/\.md$/i.test(arg)) return mergeSpec(resolveSpec({}), specFromStyleDoc(fs.readFileSync(arg, "utf8")));
  const config = JSON.parse(fs.readFileSync(arg, "utf8"));
  const resolved = resolveSpec(config);
  if (typeof config.styleSpec !== "string") return resolved;
  const style = specFromStyleDoc(fs.readFileSync(path.join(path.dirname(arg), config.styleSpec), "utf8"));
  return mergeSpec(resolved, Object.fromEntries(Object.entries(style).filter(([k]) => !(k in config))));
}
var str = (v) => typeof v === "string" ? v : void 0;
var readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
async function main(argv) {
  const [command, ...args] = argv;
  const { flags, rest } = parse(args);
  try {
    if (command === "check") {
      const url = rest[0];
      if (!url) return console.error(USAGE), 2;
      const spec = loadSpec(flags.spec);
      const host = new URL(url);
      const out = str(flags.out) ?? `grade-report/${`${host.hostname}${host.pathname}`.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "")}`;
      const report = await gradeUrl(url, spec, {
        outDir: out,
        views: str(flags.views)?.split(","),
        themes: str(flags.themes)?.split(","),
        screenshots: !flags["no-shots"],
        log: (l) => console.error(l)
      });
      const failing = Object.entries(report.summary).filter(([, s]) => s.status === "fail");
      console.log(`${report.passed ? "PASS" : "FAIL"} ${url} (${spec.name})`);
      for (const [id, s] of failing) console.log(`  ${id}: ${s.failures} failure(s) in ${s.failedViews.join(", ")}`);
      for (const v of report.views) for (const e of v.errors) console.log(`  ${v.view}: ${e}`);
      console.log(`report: ${out}/report.json, ${out}/summary.md`);
      return report.passed ? 0 : 1;
    }
    if (command === "spec") {
      console.log(JSON.stringify(loadSpec(rest[0]), null, 2));
      return 0;
    }
    if (command === "packet") {
      const need = ["brief", "rubric", "a", "b", "out", "key"].filter((k) => !str(flags[k]));
      if (need.length) return console.error(`missing --${need.join(", --")}
${USAGE}`), 2;
      const res = await buildPacket({
        brief: str(flags.brief),
        rubric: str(flags.rubric),
        a: str(flags.a),
        b: str(flags.b),
        anchor: str(flags.anchor),
        outDir: str(flags.out),
        keyFile: str(flags.key),
        seed: str(flags.seed) ? Number(flags.seed) : void 0
      });
      console.log(`packets: ${res.packets.join(", ")}
key (never show judges): ${res.keyFile}`);
      return 0;
    }
    if (command === "tally") {
      const key = str(flags.key);
      if (!key || rest.length < 2) return console.error(USAGE), 2;
      const t = tallyJudges(
        readJson(key),
        rest.map((p) => readJson(p))
      );
      console.log(formatTally(t));
      return t.needsThirdJudge ? 1 : 0;
    }
    if (command === "ledger") {
      if (!rest[0]) return console.error(USAGE), 2;
      const lines = fs.readFileSync(rest[0], "utf8").split("\n").filter((l) => l.trim());
      const problems = validateLedger(lines.map((l) => JSON.parse(l)));
      for (const p of problems) console.log(p);
      console.log(
        problems.length ? `${problems.length} problem(s)` : `${lines.length} entr${lines.length === 1 ? "y" : "ies"} OK`
      );
      return problems.length ? 1 : 0;
    }
    console.error(USAGE);
    return 2;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

exports.CHECK_IDS = CHECK_IDS;
exports.CHECK_TITLES = CHECK_TITLES;
exports.DEFAULT_SPEC = DEFAULT_SPEC;
exports.HINT_PATTERNS = HINT_PATTERNS;
exports.JUDGE_PROMPT = JUDGE_PROMPT;
exports.PACKET_VIEWS = PACKET_VIEWS;
exports.REPORT_VERSION = REPORT_VERSION;
exports.UIPACK_SPEC = UIPACK_SPEC;
exports.assignOrders = assignOrders;
exports.briefMarkdown = briefMarkdown;
exports.buildPacket = buildPacket;
exports.checkContrast = checkContrast;
exports.checkFaces = checkFaces;
exports.checkFocus = checkFocus;
exports.checkHeadingOrder = checkHeadingOrder;
exports.checkImages = checkImages;
exports.checkMotion = checkMotion;
exports.checkOneH1 = checkOneH1;
exports.checkOverflow = checkOverflow;
exports.checkRows = checkRows;
exports.checkTargets = checkTargets;
exports.checkTextClip = checkTextClip;
exports.checkTextOverlap = checkTextOverlap;
exports.checkTextSize = checkTextSize;
exports.contrastRatio = contrastRatio;
exports.decodePng = decodePng;
exports.diffBitmaps = diffBitmaps;
exports.evaluateView = evaluateView;
exports.faceAllowed = faceAllowed;
exports.facesFromStyleSpec = facesFromStyleSpec;
exports.findHints = findHints;
exports.findOverlaps = findOverlaps;
exports.firstFamily = firstFamily;
exports.flatten = flatten;
exports.formatTally = formatTally;
exports.gradeUrl = gradeUrl;
exports.isLargeText = isLargeText;
exports.loadPlaywright = loadPlaywright;
exports.loadSpec = loadSpec;
exports.luminance = luminance;
exports.main = main;
exports.measureFocus = measureFocus;
exports.measureMotion = measureMotion;
exports.measurePage = measurePage;
exports.mergeSpec = mergeSpec;
exports.over = over;
exports.parseColor = parseColor;
exports.resolveSpec = resolveSpec;
exports.rubricVersion = rubricVersion;
exports.sampleContrast = sampleContrast;
exports.seeded = seeded;
exports.specFromStyleDoc = specFromStyleDoc;
exports.summarise = summarise;
exports.tallyJudges = tallyJudges;
exports.toMarkdown = toMarkdown;
exports.validateLedger = validateLedger;
exports.validateSpec = validateSpec;
exports.withQuery = withQuery;
