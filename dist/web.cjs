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

// src/web/index.ts
var web_exports = {};
__export(web_exports, {
  AI_CRAWLERS: () => AI_CRAWLERS,
  Aurora: () => Aurora,
  BackgroundFrame: () => BackgroundFrame,
  BeamLines: () => BeamLines,
  Body: () => Body,
  CtaButton: () => CtaButton,
  DEFAULT_STAR_VALUES: () => DEFAULT_STAR_VALUES,
  DEFAULT_TIMING: () => DEFAULT_TIMING,
  DISPLAY_FROM_STEP: () => DISPLAY_FROM_STEP,
  DemoPlayer: () => DemoPlayer,
  DotGrid: () => DotGrid,
  DriftingGutters: () => DriftingGutters,
  EMPHASIS: () => EMPHASIS,
  Eyebrow: () => Eyebrow,
  FAQ: () => FAQ,
  FeatureGrid: () => FeatureGrid,
  GRID_COLUMNS: () => GRID_COLUMNS,
  GlassNav: () => GlassNav,
  GrainOverlay: () => GrainOverlay,
  Grid: () => Grid,
  GridItem: () => GridItem,
  HeadTags: () => HeadTags,
  Heading: () => Heading,
  JsonLd: () => JsonLd,
  LineGrid: () => LineGrid,
  MagneticButton: () => MagneticButton,
  Marquee: () => Marquee,
  MaskedStar: () => MaskedStar,
  NoiseLayer: () => NoiseLayer,
  NumberTicker: () => NumberTicker,
  Reveal: () => Reveal,
  RevealText: () => RevealText,
  RhymeIcon: () => RhymeIcon,
  SMOOTH_SCROLL_ATTR: () => SMOOTH_SCROLL_ATTR,
  SMOOTH_SCROLL_PREVENT_ATTR: () => SMOOTH_SCROLL_PREVENT_ATTR,
  SPACE: () => SPACE,
  ScrollTransform: () => ScrollTransform,
  Section: () => Section,
  SmoothScroll: () => SmoothScroll,
  SpotlightCard: () => SpotlightCard,
  StarChart: () => StarChart,
  StarHero: () => StarHero,
  Subhead: () => Subhead,
  TYPE_BASE_PX: () => TYPE_BASE_PX,
  TYPE_FACES: () => TYPE_FACES,
  TYPE_RATIO: () => TYPE_RATIO,
  TYPE_STEPS: () => TYPE_STEPS,
  TextScramble: () => TextScramble,
  TiltCard: () => TiltCard,
  WEB_FONT_FILES: () => WEB_FONT_FILES,
  WHEEL_LINE_PX: () => WHEEL_LINE_PX,
  WHEEL_PAGE_FRACTION: () => WHEEL_PAGE_FRACTION,
  WebSurface: () => WebSurface,
  article: () => article,
  breadcrumbList: () => breadcrumbList,
  buildCrawlFiles: () => buildCrawlFiles,
  createSmoothScroll: () => createSmoothScroll,
  curvePath: () => curvePath,
  demoCycle: () => demoCycle,
  demoEnd: () => demoEnd,
  demoFrame: () => demoFrame,
  easeOutExpo: () => easeOutExpo,
  faqPage: () => faqPage,
  followRate: () => followRate,
  followStep: () => followStep,
  fontPreloads: () => fontPreloads,
  formatLastmod: () => formatLastmod,
  headTagKey: () => headTagKey,
  headTagsToHtml: () => headTagsToHtml,
  jsonLd: () => jsonLd,
  jsonLdTag: () => jsonLdTag,
  llmsTxt: () => llmsTxt,
  normalizeWheel: () => normalizeWheel,
  offer: () => offer,
  organization: () => organization,
  pageMeta: () => pageMeta,
  product: () => product,
  ref: () => ref,
  resolveAiCrawlers: () => resolveAiCrawlers,
  robotsTxt: () => robotsTxt,
  scrambleFrame: () => scrambleFrame,
  scrollProgressOf: () => scrollProgressOf,
  serializeJsonLd: () => serializeJsonLd,
  sitemapXml: () => sitemapXml,
  slugify: () => slugify,
  smoothScrollTo: () => smoothScrollTo,
  softwareApplication: () => softwareApplication,
  stepStart: () => stepStart,
  typeMetrics: () => typeMetrics,
  typeRole: () => typeRole,
  typeScale: () => typeScale,
  useFinePointer: () => useFinePointer,
  useHead: () => useHead,
  useInView: () => useInView,
  useScrollProgress: () => useScrollProgress,
  useSmoothScroll: () => useSmoothScroll,
  webSite: () => webSite,
  withPaintTransition: () => withPaintTransition,
  withViewTransition: () => withViewTransition
});
module.exports = __toCommonJS(web_exports);

// src/web/Surface.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function WebSurface({ children, theme, as: Tag = "div", className = "", style }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: `uipack-web ${className}`.trim(), "data-theme": theme, "data-style": "landing", style, children });
}
function Grid({ children, className = "", as: Tag = "div" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: `uipack-web-grid ${className}`.trim(), children });
}
function GridItem({ children, span = [4, 4, 4], className = "", as: Tag = "div" }) {
  const style = { "--span-w": span[0], "--span-m": span[1], "--span-n": span[2] };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: `uipack-web-grid__item ${className}`.trim(), style, children });
}

// src/web/Text.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Eyebrow({ children, className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Tag, { id, className: `uipack-web-eyebrow ${className}`.trim(), children });
}
var DEFAULT_STEP = { 1: 6, 2: 4, 3: 2, 4: 1, 5: 0, 6: 0 };
function Heading({ children, level = 2, size, className = "", id }) {
  const Tag = `h${level}`;
  const step = size ?? DEFAULT_STEP[level];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Tag, { id, className: `uipack-web-heading ${className}`.trim(), "data-step": step, children });
}
function Subhead({ children, className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Tag, { id, className: `uipack-web-subhead ${className}`.trim(), children });
}
function Body({ children, emphasis = "low", className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Tag, { id, className: `uipack-web-body ${className}`.trim(), "data-emphasis": emphasis, children });
}

// src/web/CtaButton.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function CtaButton({ children, variant = "primary", href, size = "md", className = "", type = "button", ...rest }) {
  const cls = `uipack-web-cta ${className}`.trim();
  if (href)
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { className: cls, href, "data-variant": variant, "data-size": size, children });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: cls, type, "data-variant": variant, "data-size": size, ...rest, children });
}

// src/web/GlassNav.tsx
var import_react = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function GlassNav({ brand, links, cta, sticky = true, label = "Primary" }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const toggleRef = (0, import_react.useRef)(null);
  const listId = (0, import_react.useId)();
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("header", { className: "uipack-web-nav", "data-sticky": sticky || void 0, "data-open": open || void 0, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "uipack-web-nav__bar", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-web-nav__brand", children: brand }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("nav", { "aria-label": label, className: "uipack-web-nav__nav", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { id: listId, className: "uipack-web-nav__links", children: links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { href: l.href, onClick: () => setOpen(false), children: l.label }) }, l.href + l.label)) }) }),
    cta && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-web-nav__cta", children: cta }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "button",
      {
        ref: toggleRef,
        type: "button",
        className: "uipack-web-nav__toggle",
        "aria-expanded": open,
        "aria-controls": listId,
        onClick: () => setOpen((o) => !o),
        children: open ? "Close" : "Menu"
      }
    )
  ] }) });
}

// src/web/SpotlightCard.tsx
var import_react2 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function SpotlightCard({ children, href, className = "" }) {
  const ref2 = (0, import_react2.useRef)(null);
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const el = ref2.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    ref2.current?.style.removeProperty("--spot-x");
    ref2.current?.style.removeProperty("--spot-y");
  };
  const cls = `uipack-web-spotlight ${className}`.trim();
  if (href)
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { ref: (n) => ref2.current = n, className: cls, href, onPointerMove: onMove, onPointerLeave: onLeave, children });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref: (n) => ref2.current = n, className: cls, onPointerMove: onMove, onPointerLeave: onLeave, children });
}

// src/web/Section.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function Section({ eyebrow, title, intro, children, tone = "default", align = "start", id, className = "", lazyRender = false }) {
  const headingId = id ? `${id}-title` : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "section",
    {
      id,
      className: `uipack-web-section ${className}`.trim(),
      "data-tone": tone,
      "data-align": align,
      "data-lazy": lazyRender || void 0,
      "aria-labelledby": title ? headingId : void 0,
      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "uipack-web-section__inner", children: [
        (eyebrow || title || intro) && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "uipack-web-section__head", children: [
          eyebrow && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Eyebrow, { children: eyebrow }),
          title && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Heading, { level: 2, id: headingId, children: title }),
          intro && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Body, { children: intro })
        ] }),
        children
      ] })
    }
  );
}
function FeatureGrid({ features, spotlight = false }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Grid, { as: "ul", className: "uipack-web-features", children: features.map((f) => {
    const inner = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      f.icon && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "uipack-web-feature__icon", children: f.icon }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Heading, { level: 3, size: 1, children: f.href ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("a", { href: f.href, children: f.title }) : f.title }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Body, { children: f.body })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(GridItem, { as: "li", span: [4, 4, 4], children: spotlight ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SpotlightCard, { children: inner }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "uipack-web-feature", children: inner }) }, f.title);
  }) });
}

// src/web/RevealText.tsx
var import_react5 = require("react");

// src/context.tsx
var import_react4 = require("react");

// src/env.ts
var import_react3 = require("react");
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function prefersReducedMotion(win = typeof window === "undefined" ? void 0 : window) {
  return typeof win?.matchMedia === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// src/context.tsx
var noop = () => {
};
var FigureMotionContext = (0, import_react4.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function usePrefersReducedMotion() {
  const [reduced, setReduced] = (0, import_react4.useState)(false);
  (0, import_react4.useEffect)(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

// src/web/RevealText.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function RevealText({ text = "", lines, as: Tag = "p", className = "", stagger = 45 }) {
  const ref2 = (0, import_react5.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = (0, import_react5.useState)("static");
  (0, import_react5.useEffect)(() => {
    const el = ref2.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") {
      setState("static");
      return;
    }
    setState("waiting");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const units = lines ?? text.split(/\s+/).filter(Boolean);
  const byLine = !!lines;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tag, { ref: ref2, className: `uipack-web-reveal ${className}`.trim(), "data-state": state, "data-by": byLine ? "line" : "word", children: units.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_react5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "uipack-web-reveal__unit", style: { "--i": i, "--stagger": `${stagger}ms` }, children: u }),
    i < units.length - 1 ? " " : null
  ] }, i)) });
}

// src/web/motif.tsx
var import_react6 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
var DEFAULT_STAR_VALUES = [0, 1, 2, 5, 9, 16, 22, 31, 33, 35, 37, 37];
function curvePath(values, w, h, pad = 0) {
  if (values.length < 2) return `M0 ${h}L${w} ${h}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    i / (values.length - 1) * w,
    pad + (1 - (v - min) / span) * (h - pad * 2)
  ]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += `C${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}
function StarChart({ values = DEFAULT_STAR_VALUES, className = "" }) {
  const id = (0, import_react6.useId)().replace(/:/g, "");
  const W = 1200;
  const H = 560;
  const line = curvePath(values, W, H, 72);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "svg",
    {
      className: `uipack-web-star ${className}`.trim(),
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      focusable: "false",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("defs", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("linearGradient", { id: `${id}-fill`, x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "0", stopColor: "var(--web-accent)", stopOpacity: "0.42" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "0.55", stopColor: "var(--web-accent)", stopOpacity: "0.14" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "1", stopColor: "var(--web-accent)", stopOpacity: "0" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("linearGradient", { id: `${id}-line`, x1: "0", y1: "0", x2: "1", y2: "0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "0", stopColor: "var(--web-accent)", stopOpacity: "0" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "0.35", stopColor: "var(--web-accent)", stopOpacity: "0.9" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("stop", { offset: "1", stopColor: "var(--web-accent)" })
          ] })
        ] }),
        [0.25, 0.5, 0.75].map((f) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("line", { x1: "0", x2: W, y1: H * f, y2: H * f, className: "uipack-web-star__rule" }, f)),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: `${line}L${W} ${H}L0 ${H}Z`, fill: `url(#${id}-fill)`, className: "uipack-web-star__area" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: line, fill: "none", stroke: `url(#${id}-line)`, className: "uipack-web-star__glow", pathLength: 1 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: line, fill: "none", stroke: `url(#${id}-line)`, className: "uipack-web-star__line", pathLength: 1 })
      ]
    }
  );
}
function RhymeIcon({ at = 0.5, values = DEFAULT_STAR_VALUES, size = 40 }) {
  const d = curvePath(values, 28, 20, 2);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const idx = Math.round(Math.max(0, Math.min(1, at)) * (values.length - 1));
  const cx = 6 + idx / (values.length - 1) * 28;
  const cy = 10 + 2 + (1 - (values[idx] - min) / span) * 16;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { className: "uipack-web-rhyme", viewBox: "0 0 40 40", width: size, height: size, "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "0.5", y: "0.5", width: "39", height: "39", rx: "10" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d, transform: "translate(6 10)" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("line", { x1: cx, x2: cx, y1: cy, y2: "32" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx, cy, r: "3" })
  ] });
}
function GrainOverlay({ opacity = 0.07, frequency = 0.8 }) {
  const id = (0, import_react6.useId)().replace(/:/g, "");
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { className: "uipack-web-noise", "aria-hidden": "true", focusable: "false", style: { opacity }, "data-bg": "grain", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("filter", { id: `${id}-n`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("feTurbulence", { type: "fractalNoise", baseFrequency: frequency, numOctaves: "3", stitchTiles: "stitch" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("feColorMatrix", { type: "saturate", values: "0" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { width: "100%", height: "100%", filter: `url(#${id}-n)` })
  ] });
}
var NoiseLayer = GrainOverlay;

// src/web/StarHero.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function StarHero({ eyebrow, title, subtitle, actions, visual, values, children, noise = 0.07, headingId }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: "uipack-web-hero", "aria-labelledby": headingId, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "uipack-web-hero__visual", children: visual ?? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(StarChart, { values }) }),
    noise > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(NoiseLayer, { opacity: noise }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "uipack-web-hero__copy", children: [
      eyebrow && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Eyebrow, { children: eyebrow }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Heading, { level: 1, id: headingId, children: title }),
      subtitle && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Subhead, { children: subtitle }),
      actions && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "uipack-web-hero__actions", children: actions })
    ] }),
    children && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "uipack-web-hero__proof", children })
  ] });
}

// src/web/DemoPlayer.tsx
var import_react7 = require("react");

// src/web/timeline.ts
var DEFAULT_TIMING = { leadMs: 450, typeMs: 34, actionMs: 720, holdMs: 1800 };
var toAction = (a) => typeof a === "string" ? { label: a } : a;
function parts(step, t) {
  const typing = (step.prompt?.length ?? 0) * t.typeMs;
  const acting = (step.actions?.length ?? 0) * t.actionMs;
  const settle = t.leadMs + typing + acting;
  return { typing, acting, settle, total: settle + (step.hold ?? t.holdMs) };
}
function stepStart(steps, i, timing = DEFAULT_TIMING) {
  let at = 0;
  for (let k = 0; k < Math.min(i, steps.length); k++) at += parts(steps[k], timing).total;
  return at;
}
function demoEnd(steps, timing = DEFAULT_TIMING) {
  if (!steps.length) return 0;
  return stepStart(steps, steps.length - 1, timing) + parts(steps[steps.length - 1], timing).settle;
}
function demoCycle(steps, timing = DEFAULT_TIMING) {
  return stepStart(steps, steps.length, timing);
}
function metricThrough(steps, step, actionsDone, settled, initial) {
  let metric = initial;
  for (let k = 0; k <= step && k < steps.length; k++) {
    const actions = (steps[k].actions ?? []).map(toAction);
    const n = k < step ? actions.length : actionsDone;
    for (let a = 0; a < n; a++) if (actions[a].metric !== void 0) metric = actions[a].metric;
    if ((k < step || settled) && steps[k].metric !== void 0) metric = steps[k].metric;
  }
  return metric;
}
function demoFrame(steps, elapsed, timing = DEFAULT_TIMING, initialMetric) {
  if (!steps.length) return { step: 0, typed: 0, actionsDone: 0, settled: true, done: true, metric: initialMetric };
  const end = demoEnd(steps, timing);
  const t = Math.max(0, Math.min(elapsed, end));
  let step = 0;
  let local = t;
  while (step < steps.length - 1 && local >= parts(steps[step], timing).total) {
    local -= parts(steps[step], timing).total;
    step++;
  }
  const s = steps[step];
  const p = parts(s, timing);
  const promptLen = s.prompt?.length ?? 0;
  const nActions = s.actions?.length ?? 0;
  const typed = Math.max(0, Math.min(promptLen, Math.floor((local - timing.leadMs) / timing.typeMs) + 1));
  const typedEnd = timing.leadMs + p.typing;
  const actionsDone = local < typedEnd ? 0 : Math.min(nActions, Math.floor((local - typedEnd) / timing.actionMs));
  const settled = local >= p.settle;
  return {
    step,
    typed: local < timing.leadMs ? 0 : typed,
    actionsDone: settled ? nActions : actionsDone,
    settled,
    done: t >= end,
    metric: metricThrough(steps, step, settled ? nActions : actionsDone, settled, initialMetric)
  };
}

// src/web/DemoPlayer.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var TICK_MS = 40;
function lastWith(steps, upTo, pick) {
  for (let k = upTo; k >= 0; k--) {
    const v = pick(steps[k]);
    if (v !== void 0 && v !== null) return v;
  }
  return void 0;
}
function DemoPlayer({
  steps,
  label,
  address,
  initialMetric,
  metricLabel,
  placeholder = "Ask for something\u2026",
  autoplay = true,
  loop = false,
  timing: timingProp,
  cta,
  className = "",
  onStepChange
}) {
  const timing = (0, import_react7.useMemo)(() => ({ ...DEFAULT_TIMING, ...timingProp }), [timingProp]);
  const reduced = usePrefersReducedMotion();
  const rootRef = (0, import_react7.useRef)(null);
  const tabsRef = (0, import_react7.useRef)(null);
  const [elapsed, setElapsed] = (0, import_react7.useState)(0);
  const [playing, setPlaying] = (0, import_react7.useState)(autoplay);
  const [inView, setInView] = (0, import_react7.useState)(false);
  const id = (0, import_react7.useId)();
  const end = demoEnd(steps, timing);
  const cycle = demoCycle(steps, timing);
  (0, import_react7.useEffect)(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const running = playing && inView && !reduced;
  (0, import_react7.useEffect)(() => {
    if (!running) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setElapsed((e) => {
        const next = e + dt;
        if (loop) return next >= cycle ? 0 : next;
        return Math.min(next, end);
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, loop, cycle, end]);
  const finalFrame = demoFrame(steps, Infinity, timing, initialMetric);
  const frame = reduced ? finalFrame : demoFrame(steps, elapsed, timing, initialMetric);
  const finished = !loop && frame.done;
  (0, import_react7.useEffect)(() => {
    if (finished) setPlaying(false);
  }, [finished]);
  const step = steps[frame.step];
  (0, import_react7.useEffect)(() => {
    onStepChange?.(frame.step);
  }, [frame.step]);
  const seek = (0, import_react7.useCallback)(
    (i) => {
      setElapsed(stepStart(steps, i, timing));
      setPlaying(true);
    },
    [steps, timing]
  );
  const replay = () => seek(0);
  const toggle = () => {
    if (finished) return replay();
    setPlaying((p) => !p);
  };
  const onTabKey = (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next;
    if (e.key in keys) next = (frame.step + keys[e.key] + steps.length) % steps.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = steps.length - 1;
    if (next === void 0) return;
    e.preventDefault();
    seek(next);
    tabsRef.current?.querySelectorAll("button")[next]?.focus();
  };
  const promptStep = step?.prompt ? frame.step : lastWith(steps, frame.step, (s) => s.prompt ? steps.indexOf(s) : void 0);
  const promptText = promptStep === void 0 ? "" : steps[promptStep].prompt;
  const visiblePrompt = promptStep === frame.step ? promptText.slice(0, frame.typed) : promptText;
  const typing = !reduced && promptStep === frame.step && frame.typed < promptText.length;
  const actionStep = step?.actions?.length ? frame.step : lastWith(steps, frame.step, (s) => s.actions?.length ? steps.indexOf(s) : void 0);
  const actions = actionStep === void 0 ? [] : (steps[actionStep].actions ?? []).map(toAction);
  const isCurrent = actionStep === frame.step;
  const doneCount = isCurrent ? frame.actionsDone : actions.length;
  const promptDone = !step?.prompt || frame.typed >= (step.prompt?.length ?? 0);
  const runningIdx = isCurrent && promptDone && !frame.settled && frame.actionsDone < actions.length ? frame.actionsDone : -1;
  const screen = lastWith(steps, frame.settled ? frame.step : frame.step - 1, (s) => s.screen ?? void 0);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "section",
    {
      ref: rootRef,
      className: `uipack-web-demo ${className}`.trim(),
      "aria-label": label,
      "data-state": reduced ? "static" : finished ? "finished" : running ? "playing" : "paused",
      "data-step": frame.step,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__window", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__chrome", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "uipack-web-demo__dots", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("i", {}),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("i", {}),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("i", {})
            ] }),
            address && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__address", children: address })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__body", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__work", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__composer", "data-typing": typing || void 0, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__sr", children: promptText }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { "aria-hidden": "true", className: visiblePrompt ? "" : "uipack-web-demo__placeholder", children: visiblePrompt || placeholder }),
                typing && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__caret", "aria-hidden": "true" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ol", { className: "uipack-web-demo__log", "aria-label": "Agent actions", children: actions.map((a, i) => {
                const state = i < doneCount ? "done" : i === runningIdx ? "running" : "pending";
                if (state === "pending") return null;
                return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { "data-state": state, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__tick", "aria-hidden": "true", children: state === "done" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { viewBox: "0 0 16 16", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M3.5 8.5l3 3 6-7" }) }) : null }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: a.label }),
                  a.detail && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { children: a.detail }),
                  state === "running" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__sr", children: " (in progress)" })
                ] }, `${actionStep}-${i}`);
              }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__result", children: [
              frame.metric !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "uipack-web-demo__metric", children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { "data-testid": "demo-metric", children: frame.metric }, frame.metric),
                metricLabel && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: metricLabel })
              ] }),
              screen !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "uipack-web-demo__screen", children: screen }, frame.settled ? frame.step : frame.step - 1)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: reduced ? void 0 : "uipack-web-demo__sr", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ol", { className: "uipack-web-demo__static", "aria-label": reduced ? "Demo steps" : "Demo transcript", children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__num", children: String(i + 1).padStart(2, "0") }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("strong", { children: [
                s.label,
                " \xB7 ",
                s.title
              ] }),
              s.prompt && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                "\u201C",
                s.prompt,
                "\u201D"
              ] }),
              !!s.actions?.length && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ul", { children: s.actions.map(toAction).map((a) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
                a.label,
                a.detail ? ` (${a.detail})` : ""
              ] }, a.label)) })
            ] })
          ] }, s.id)) }),
          !reduced && finalFrame.metric !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: `Result: ${finalFrame.metric}${metricLabel ? ` ${metricLabel}` : ""}.` })
        ] }),
        !reduced && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__controls", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "uipack-web-demo__tabs", role: "group", "aria-label": "Demo steps", ref: tabsRef, onKeyDown: onTabKey, children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
            "button",
            {
              type: "button",
              "aria-current": i === frame.step ? "step" : void 0,
              "aria-controls": `${id}-caption`,
              onClick: () => seek(i),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "uipack-web-demo__num", children: String(i + 1).padStart(2, "0") }),
                " ",
                s.label
              ]
            },
            s.id
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "uipack-web-demo__buttons", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: toggle, children: playing && !finished ? "Pause" : "Play" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: replay, children: "Replay" }),
            cta
          ] })
        ] }),
        reduced && cta && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "uipack-web-demo__buttons", children: cta }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "uipack-web-demo__caption", id: `${id}-caption`, "aria-live": "polite", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "uipack-web-demo__num", children: [
            String(frame.step + 1).padStart(2, "0"),
            " / ",
            String(steps.length).padStart(2, "0")
          ] }),
          " ",
          step?.title
        ] })
      ]
    }
  );
}

// src/web/tokens.ts
var TYPE_BASE_PX = 16;
var TYPE_RATIO = 1.25;
function typeScale(step) {
  return Math.round(Math.pow(TYPE_RATIO, step) * 1e4) / 1e4;
}
var TYPE_FACES = {
  display: "Instrument Serif",
  text: "IBM Plex Sans",
  mono: "IBM Plex Mono"
};
var DISPLAY_FROM_STEP = 4;
function typeRole(step) {
  return step >= DISPLAY_FROM_STEP ? "display" : "text";
}
function typeMetrics(step) {
  if (step >= 6) return { role: "display", lineHeight: 1.02, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 5) return { role: "display", lineHeight: 1.05, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 4) return { role: "display", lineHeight: 1.1, letterSpacing: "-0.01em", weight: 400 };
  if (step >= 3) return { role: "text", lineHeight: 1.2, letterSpacing: "-0.015em", weight: 500 };
  if (step >= 2) return { role: "text", lineHeight: 1.3, letterSpacing: "-0.01em", weight: 600 };
  if (step >= 1) return { role: "text", lineHeight: 1.35, letterSpacing: "-0.005em", weight: 600 };
  return { role: "text", lineHeight: 1.5, letterSpacing: "0em", weight: 600 };
}
var TYPE_STEPS = [-1, 0, 1, 2, 3, 4, 5, 6];
var EMPHASIS = { high: 1, medium: 0.87, low: 0.66 };
var SPACE = [0, 8, 16, 24, 32, 48, 64, 96, 128];
var GRID_COLUMNS = { wide: 12, medium: 8, narrow: 4 };

// src/web/hooks.ts
var import_react8 = require("react");
function useInView(ref2, { threshold = 0, once = false, rootMargin } = {}) {
  const [inView, setInView] = (0, import_react8.useState)(false);
  (0, import_react8.useEffect)(() => {
    const el = ref2.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref2, threshold, once, rootMargin]);
  return inView;
}
function scrollProgressOf(rect, viewport) {
  const total = viewport + rect.height;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, (viewport - rect.top) / total));
}
function useScrollProgress(ref2) {
  const inView = useInView(ref2);
  const [progress, setProgress] = (0, import_react8.useState)(0);
  (0, import_react8.useEffect)(() => {
    const el = ref2.current;
    if (!el || !inView || typeof window === "undefined") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setProgress(scrollProgressOf(el.getBoundingClientRect(), window.innerHeight));
    };
    const schedule = () => {
      if (frame) return;
      frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(measure) : setTimeout(measure, 16);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    };
  }, [ref2, inView]);
  return progress;
}
function useFinePointer() {
  const [fine, setFine] = (0, import_react8.useState)(false);
  (0, import_react8.useEffect)(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return fine;
}
function transitionDocument() {
  const doc = typeof document === "undefined" ? void 0 : document;
  const reduced = prefersReducedMotion();
  return doc?.startViewTransition && !reduced ? doc : void 0;
}
function withViewTransition(update) {
  const doc = transitionDocument();
  if (!doc?.startViewTransition) {
    update();
    return Promise.resolve();
  }
  return doc.startViewTransition(update).finished.catch(() => void 0);
}
var PAINT_STEPS = 40;
var rand = (min, max) => min + Math.random() * (max - min);
var smooth = (t) => t * t * (3 - 2 * t);
var px = (v) => `${Math.round(v * 10) / 10}px`;
function rollDrips(width, height, duration) {
  const count = Math.max(7, Math.min(26, Math.round(width / 56)));
  const slot = width / count;
  return Array.from({ length: count }, (_, i) => {
    const w = rand(5, 18);
    return {
      x: i * slot + rand(0, slot - w),
      w,
      start: rand(0, 0.3) * duration,
      // ms after the pour begins
      g: w / 13 * rand(4e3, 9e3) * (height / 900),
      // px/s², heavier falls faster
      // How far it runs ahead before it thins out. Kept short so the sheet catches every
      // drip quickly and no element stays half-painted.
      max: rand(0.03, 0.12) * height
    };
  });
}
function paintFrame(t, width, height, drips, duration) {
  const sheet = smooth(Math.min(1, t / (duration * 0.85))) * (height * 1.14);
  const pos = ["0px 0px"];
  const size = [`${px(width)} ${px(sheet)}`];
  for (const d of drips) {
    const dt = Math.max(0, t - d.start) / 1e3;
    const len = d.max * (1 - Math.exp(-(0.5 * d.g * dt * dt) / d.max));
    pos.push(`${px(d.x)} ${px(sheet - 1)}`);
    size.push(`${px(d.w)} ${px(len + 1)}`);
    const bead = d.w * 1.35;
    pos.push(`${px(d.x - (bead - d.w) / 2)} ${px(sheet + len - bead / 2)}`);
    size.push(`${px(bead)} ${px(bead)}`);
  }
  return `mask-position: ${pos.join(", ")}; mask-size: ${size.join(", ")};`;
}
var paintCount = 0;
var PAINT_SWITCHING = "theme-switching";
function paintTransitionCss(width, height, duration = 750) {
  const drips = rollDrips(width, height, duration);
  const name = `uipack-paint-${Date.now().toString(36)}-${(paintCount++).toString(36)}`;
  const solid = "linear-gradient(#000, #000)";
  const tip = "radial-gradient(circle closest-side, #000 96%, transparent)";
  const images = [solid, ...drips.flatMap(() => [solid, tip])].join(", ");
  const keyframes = Array.from({ length: PAINT_STEPS + 1 }, (_, i) => {
    const t = i / PAINT_STEPS * duration;
    return `${Math.round(i / PAINT_STEPS * 1e4) / 100}% { ${paintFrame(t, width, height, drips, duration)} }`;
  }).join("\n");
  return `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
html.${PAINT_SWITCHING} *,
html.${PAINT_SWITCHING} *::before,
html.${PAINT_SWITCHING} *::after {
  transition: none !important;
}
::view-transition-new(root) {
  mask-image: ${images};
  mask-repeat: no-repeat;
  animation: ${name} ${duration}ms linear both;
}
@keyframes ${name} {
${keyframes}
}`;
}
function withPaintTransition(update, { duration = 750 } = {}) {
  const doc = transitionDocument();
  if (!doc?.startViewTransition) {
    update();
    return Promise.resolve();
  }
  const style = doc.createElement("style");
  style.dataset.uipackPaint = "";
  style.textContent = paintTransitionCss(window.innerWidth, window.innerHeight, duration);
  doc.head.appendChild(style);
  const root = doc.documentElement;
  root.classList.add(PAINT_SWITCHING);
  const cleanup = () => {
    style.remove();
    root.classList.remove(PAINT_SWITCHING);
  };
  let transition;
  try {
    transition = doc.startViewTransition(update);
  } catch (error) {
    cleanup();
    throw error;
  }
  return transition.finished.catch(() => void 0).finally(cleanup);
}

// src/web/backgrounds.tsx
var import_react9 = require("react");
var import_jsx_runtime11 = require("react/jsx-runtime");
function BackgroundFrame({ background, children, as: Tag = "div", className = "", style }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Tag, { className: `uipack-web-bgframe ${className}`.trim(), style, children: [
    background,
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "uipack-web-bgframe__content", children })
  ] });
}
function useParentSpotlight(ref2, enabled) {
  (0, import_react9.useEffect)(() => {
    const el = ref2.current;
    const host = el?.parentElement;
    if (!el || !host || !enabled) return;
    const move = (e) => {
      if (e.pointerType === "touch") return;
      const r = host.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      el.dataset.lit = "true";
    };
    const leave = () => delete el.dataset.lit;
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [ref2, enabled]);
}
function GridBackground({ variant, size = 24, fade = true, spotlight = false }) {
  const ref2 = (0, import_react9.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  useParentSpotlight(ref2, spotlight && fine && !reduced);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    "div",
    {
      ref: ref2,
      className: "uipack-web-gridbg",
      "data-bg": variant,
      "data-fade": fade || void 0,
      "aria-hidden": "true",
      style: { "--cell": `${size}px` },
      children: spotlight && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "uipack-web-gridbg__lit" })
    }
  );
}
function DotGrid(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GridBackground, { variant: "dots", ...props });
}
function LineGrid(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GridBackground, { variant: "lines", ...props });
}
function Aurora({ duration = 24 }) {
  const ref2 = (0, import_react9.useRef)(null);
  const inView = useInView(ref2);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "div",
    {
      ref: ref2,
      className: "uipack-web-aurora",
      "data-bg": "aurora",
      "data-paused": !inView || void 0,
      "aria-hidden": "true",
      style: { "--aurora-duration": `${duration}s` },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("i", {}),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("i", {}),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("i", {})
      ]
    }
  );
}
function MaskedStar({ values, flip = "none", clear = "center" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "uipack-web-maskedstar", "data-bg": "star", "data-flip": flip, "data-clear": clear, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(StarChart, { values }) });
}
function BeamLines({ size = 48, count = 5, duration = 6 }) {
  const ref2 = (0, import_react9.useRef)(null);
  const inView = useInView(ref2);
  const beams = Array.from({ length: count }, (_, i) => ({
    axis: i % 2 === 0 ? "h" : "v",
    line: 2 + i * 3 % 7,
    delay: -(i * duration / count) * 1.7,
    dur: duration * (0.8 + i * 7 % 5 / 10)
  }));
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    "div",
    {
      ref: ref2,
      className: "uipack-web-beams",
      "data-bg": "beams",
      "data-paused": !inView || void 0,
      "aria-hidden": "true",
      style: { "--cell": `${size}px` },
      children: beams.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        "i",
        {
          "data-axis": b.axis,
          style: {
            "--line": `${b.line * size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`
          }
        },
        i
      ))
    }
  );
}
function GutterSide({ side }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "uipack-web-gutters__side", "data-side": side, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "uipack-web-gutters__drift" }),
    [0, 1, 2].map((i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "uipack-web-gutters__signal", style: { "--i": i } }, i))
  ] });
}
function DriftingGutters({ contentWidth = 1120, top = 72, minViewport = 1280, drift = 48 }) {
  const custom = minViewport !== 1280;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "div",
    {
      className: "uipack-web-gutters",
      "data-bg": "gutters",
      "data-min": custom ? minViewport : void 0,
      "aria-hidden": "true",
      style: {
        "--gutters-content": typeof contentWidth === "number" ? `${contentWidth}px` : contentWidth,
        "--gutters-top": `${top}px`,
        "--gutters-drift": `${drift}s`
      },
      children: [
        custom && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("style", { children: `@media (min-width: ${minViewport}px) { .uipack-web-gutters[data-min="${minViewport}"] { display: block; } }` }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GutterSide, { side: "left" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GutterSide, { side: "right" })
      ]
    }
  );
}

// src/web/motion.tsx
var import_react10 = require("react");
var import_jsx_runtime12 = require("react/jsx-runtime");
function Reveal({ children, variant = "up", stagger = 80, as: Tag = "div", className = "" }) {
  const ref2 = (0, import_react10.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = (0, import_react10.useState)("static");
  (0, import_react10.useEffect)(() => {
    const el = ref2.current;
    if (!el) return;
    Array.from(el.children).forEach((c, i) => c.style.setProperty("--i", String(i)));
    if (reduced || typeof IntersectionObserver === "undefined") {
      setState("static");
      return;
    }
    setState("waiting");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        io.disconnect();
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
    Tag,
    {
      ref: ref2,
      className: `uipack-web-revealgroup ${className}`.trim(),
      "data-state": state,
      "data-variant": variant,
      style: { "--stagger": `${stagger}ms` },
      children
    }
  );
}
var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_-";
function scrambleFrame(text, t, mode, seed = 0) {
  const p = Math.max(0, Math.min(1, t));
  const settled = Math.floor(p * text.length);
  if (mode === "type") return text.slice(0, settled);
  let out = text.slice(0, settled);
  for (let i = settled; i < text.length; i++) {
    const ch = text[i];
    out += ch === " " ? " " : GLYPHS[(i * 7 + seed * 13) % GLYPHS.length];
  }
  return out;
}
function TextScramble({ text, mode = "scramble", duration = 1200, as: Tag = "span", className = "" }) {
  const ref2 = (0, import_react10.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref2, { once: true, threshold: 0.5 });
  const [t, setT] = (0, import_react10.useState)(1);
  const [tick, setTick] = (0, import_react10.useState)(0);
  const [armed, setArmed] = (0, import_react10.useState)(false);
  const started = (0, import_react10.useRef)(false);
  (0, import_react10.useEffect)(() => {
    setArmed(true);
    if (typeof IntersectionObserver !== "undefined" && !started.current) setT(0);
  }, []);
  (0, import_react10.useEffect)(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    const start = Date.now();
    setT(0);
    const timer = setInterval(() => {
      const p = (Date.now() - start) / duration;
      setT(Math.min(1, p));
      setTick((k) => k + 1);
      if (p >= 1) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [reduced, inView, duration]);
  const shown = reduced || t >= 1 ? text : scrambleFrame(text, t, mode, tick);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    Tag,
    {
      ref: ref2,
      className: `uipack-web-scramble ${className}`.trim(),
      "data-mode": mode,
      "data-done": shown === text || void 0,
      "data-armed": armed || void 0,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "uipack-web-scramble__ghost", children: text }),
        armed && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "uipack-web-scramble__live", "aria-hidden": "true", children: [
          shown,
          mode === "type" && shown !== text && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "uipack-web-demo__caret" })
        ] })
      ]
    }
  );
}
var easeOut = (t) => 1 - Math.pow(1 - t, 3);
function NumberTicker({ value, from = 0, duration = 1400, format, locale, prefix = "", suffix = "", className = "", face = "display" }) {
  const ref2 = (0, import_react10.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref2, { once: true, threshold: 0.6 });
  const [current, setCurrent] = (0, import_react10.useState)(value);
  const [armed, setArmed] = (0, import_react10.useState)(false);
  const started = (0, import_react10.useRef)(false);
  (0, import_react10.useEffect)(() => {
    setArmed(true);
    if (typeof IntersectionObserver !== "undefined" && !started.current) setCurrent(from);
  }, [from]);
  (0, import_react10.useEffect)(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    const start = Date.now();
    setCurrent(from);
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setCurrent(from + (value - from) * easeOut(p));
      if (p >= 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [reduced, inView, from, value, duration]);
  const fmt = new Intl.NumberFormat(locale, format ?? { maximumFractionDigits: 0 });
  const final = `${prefix}${fmt.format(value)}${suffix}`;
  const live = `${prefix}${fmt.format(reduced ? value : current)}${suffix}`;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { ref: ref2, className: `uipack-web-ticker ${className}`.trim(), "data-face": face, "data-armed": armed || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "uipack-web-scramble__ghost", children: final }),
    armed && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "uipack-web-scramble__live", "aria-hidden": "true", "data-testid": "ticker-live", children: live })
  ] });
}
function Marquee({ items, label, duration = 30, reverse = false }) {
  const ref2 = (0, import_react10.useRef)(null);
  const copyRef = (0, import_react10.useRef)(null);
  const inView = useInView(ref2);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = (0, import_react10.useState)(false);
  const [mounted, setMounted] = (0, import_react10.useState)(false);
  (0, import_react10.useEffect)(() => setMounted(true), []);
  (0, import_react10.useEffect)(() => {
    copyRef.current?.setAttribute("inert", "");
  }, [reduced, mounted]);
  const list = (copy) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("ul", { className: "uipack-web-marquee__list", ref: copy ? copyRef : void 0, "aria-hidden": copy || void 0, children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { children: item }, i)) });
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    "div",
    {
      ref: ref2,
      className: "uipack-web-marquee",
      role: "region",
      "aria-label": label,
      "data-static": reduced || void 0,
      "data-paused": paused || !inView || void 0,
      "data-reverse": reverse || void 0,
      style: { "--marquee-duration": `${duration}s` },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "uipack-web-marquee__viewport", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "uipack-web-marquee__track", children: [
          list(false),
          mounted && !reduced && list(true)
        ] }) }),
        !reduced && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "uipack-web-marquee__toggle", "aria-pressed": paused, onClick: () => setPaused((p) => !p), children: paused ? "Play" : "Pause" })
      ]
    }
  );
}
function useHoverMotion(apply, reset) {
  const ref2 = (0, import_react10.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const onPointerMove = (e) => {
    if (reduced || e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const el = ref2.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    apply(el, (e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => ref2.current && reset(ref2.current);
  return { ref: ref2, onPointerMove, onPointerLeave };
}
function TiltCard({ children, max = 5, href, className = "" }) {
  const { ref: ref2, onPointerMove, onPointerLeave } = useHoverMotion(
    (el, x, y) => {
      el.style.setProperty("--tilt-x", `${(-y * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(x * max * 2).toFixed(2)}deg`);
    },
    (el) => {
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
    }
  );
  const cls = `uipack-web-tilt ${className}`.trim();
  const props = { className: cls, onPointerMove, onPointerLeave };
  return href ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("a", { ref: (n) => ref2.current = n, href, ...props, children }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { ref: (n) => ref2.current = n, ...props, children });
}
function MagneticButton({ strength = 6, ...button }) {
  const { ref: ref2, onPointerMove, onPointerLeave } = useHoverMotion(
    (el, x, y) => {
      el.style.setProperty("--pull-x", `${(x * strength * 2).toFixed(1)}px`);
      el.style.setProperty("--pull-y", `${(y * strength * 2).toFixed(1)}px`);
    },
    (el) => {
      el.style.removeProperty("--pull-x");
      el.style.removeProperty("--pull-y");
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { ref: (n) => ref2.current = n, className: "uipack-web-magnetic", onPointerMove, onPointerLeave, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CtaButton, { ...button }) });
}
var lerp = ([a, b], t) => a + (b - a) * t;
function ScrollTransform({ children, rotate = [0, 0], scale = [1, 1], translateY = [0, 0], opacity = [1, 1], className = "" }) {
  const ref2 = (0, import_react10.useRef)(null);
  const reduced = usePrefersReducedMotion();
  const raw = useScrollProgress(ref2);
  const t = reduced ? 0.5 : raw;
  const style = {
    "--st-rotate": `${lerp(rotate, t).toFixed(2)}deg`,
    "--st-scale": lerp(scale, t).toFixed(3),
    "--st-y": `${lerp(translateY, t).toFixed(1)}px`,
    "--st-opacity": lerp(opacity, t).toFixed(3)
  };
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { ref: ref2, className: `uipack-web-scrollx ${className}`.trim(), "data-progress": t.toFixed(2), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "uipack-web-scrollx__inner", style, children }) });
}

// src/web/SmoothScroll.tsx
var import_react11 = require("react");
function followRate(lerp2) {
  const l = Math.min(0.999, Math.max(1e-3, lerp2));
  return -Math.log(1 - l) * 60;
}
function followStep(current, target, rate, dt) {
  return target + (current - target) * Math.exp(-rate * Math.max(0, dt));
}
function easeOutExpo(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}
var WHEEL_LINE_PX = 40;
var WHEEL_PAGE_FRACTION = 0.875;
function normalizeWheel(e, viewport) {
  if (e.deltaMode === 1) return { x: e.deltaX * WHEEL_LINE_PX, y: e.deltaY * WHEEL_LINE_PX };
  if (e.deltaMode === 2) return { x: e.deltaX * viewport.width * WHEEL_PAGE_FRACTION, y: e.deltaY * viewport.height * WHEEL_PAGE_FRACTION };
  return { x: e.deltaX, y: e.deltaY };
}
var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
var SMOOTH_SCROLL_ATTR = "data-uipack-smooth-scroll";
var SMOOTH_SCROLL_PREVENT_ATTR = "data-smooth-scroll-prevent";
var REDUCED = REDUCED_MOTION_QUERY;
var SCROLL_KEYS = /* @__PURE__ */ new Set([" ", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End"]);
var FINE = "(hover: hover) and (pointer: fine)";
var active = null;
var canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";
var matches = (q) => canUseDom() && typeof window.matchMedia === "function" && window.matchMedia(q).matches;
var maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
function safeQuery(selector) {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}
function resolveTop(target, offset) {
  if (typeof target === "number") return target - (offset ?? 0);
  let el = null;
  if (typeof target === "string") {
    el = target === "#" || target === "#top" ? document.getElementById("top") : safeQuery(target);
    if (!el && (target === "#" || target === "#top")) return 0;
  } else el = target;
  if (!el) return null;
  const clear = offset ?? (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  return el.getBoundingClientRect().top + window.scrollY - clear;
}
function nativeScrollTo(target, { offset, immediate } = {}) {
  if (!canUseDom()) return;
  const y = resolveTop(target, offset);
  if (y === null) return;
  window.scrollTo({ top: clamp(y, 0, maxScroll()), behavior: immediate || matches(REDUCED) ? "auto" : "smooth" });
}
function pageOwnsWheel(e) {
  const root = document.documentElement;
  if (getComputedStyle(root).overflowY === "hidden" || document.body && getComputedStyle(document.body).overflowY === "hidden") return false;
  const path = typeof e.composedPath === "function" ? e.composedPath() : [];
  const chain = path.length ? path : [];
  if (!chain.length) for (let n = e.target; n; n = n.parentElement) chain.push(n);
  for (const node of chain) {
    if (!(node instanceof Element) || node === root || node === document.body) continue;
    if (node.hasAttribute(SMOOTH_SCROLL_PREVENT_ATTR)) return false;
    if (node instanceof HTMLDialogElement && node.open) return false;
    if (node.scrollHeight > node.clientHeight + 1) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === "auto" || oy === "scroll" || oy === "overlay") return false;
    }
  }
  return true;
}
function focusTarget(el) {
  if (!(el instanceof HTMLElement)) return;
  if (!el.matches("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]")) {
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
  }
  el.focus({ preventScroll: true });
}
function createSmoothScroll({ lerp: lerp2 = 0.1, wheelMultiplier = 1, anchors = true } = {}) {
  if (!canUseDom()) {
    return { scrollTo: () => void 0, stop: () => void 0, enabled: false, destroy: () => void 0 };
  }
  const root = document.documentElement;
  const rate = followRate(lerp2);
  let enabled = false;
  let destroyed = false;
  let frame = 0;
  let last = 0;
  let current = window.scrollY;
  let target = current;
  let lastSet = current;
  let tween = null;
  let savedBehavior = "";
  let streak = 0;
  let aim = null;
  let keyAt = -Infinity;
  const animating = () => frame !== 0;
  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    streak = 0;
    tween = null;
    aim = null;
    current = target = window.scrollY;
  };
  const tick = (now) => {
    frame = 0;
    const dt = last ? Math.min(0.25, (now - last) / 1e3) : 1 / 60;
    last = now;
    if (aim?.el.isConnected) {
      const y = resolveTop(aim.el, aim.offset);
      if (y !== null) target = y;
    }
    target = clamp(target, 0, maxScroll());
    if (tween) {
      tween.to = target;
      const t = clamp((now - tween.start) / tween.duration, 0, 1);
      current = tween.from + (tween.to - tween.from) * easeOutExpo(t);
      if (t >= 1) current = tween.to;
    } else {
      current = followStep(current, target, rate, dt);
    }
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(window.scrollX, current);
    lastSet = window.scrollY;
    if (current === target) {
      last = 0;
      tween = null;
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const onWheel = (e) => {
    if (active !== controller || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const { x, y } = normalizeWheel(e, { width: window.innerWidth, height: window.innerHeight });
    if (y === 0 || Math.abs(x) > Math.abs(y)) return;
    if (maxScroll() <= 0 || !pageOwnsWheel(e)) return;
    e.preventDefault();
    if (!animating() || tween || aim) {
      current = window.scrollY;
      target = current;
      tween = null;
      aim = null;
    }
    target = clamp(target + y * wheelMultiplier, 0, maxScroll());
    run();
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (!animating()) {
      current = target = y;
      return;
    }
    const moved = y - lastSet;
    if (Math.abs(moved) <= 2) {
      streak = 0;
      return;
    }
    if (performance.now() - keyAt < 500 || ++streak >= 3) {
      stop();
      return;
    }
    current += moved;
    target = clamp(target + moved, 0, maxScroll());
    lastSet = y;
  };
  const onKeyDown = (e) => {
    if (SCROLL_KEYS.has(e.key)) keyAt = performance.now();
  };
  const onPointerDown = (e) => {
    if (animating() && (e.clientX >= root.clientWidth || e.clientY >= root.clientHeight)) stop();
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") stop();
  };
  const onResize = () => {
    target = clamp(target, 0, maxScroll());
  };
  const onClick = (e) => {
    if (!anchors || active !== controller || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!(a instanceof HTMLAnchorElement) || a.target && a.target !== "_self" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    let id = url.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
    }
    const el = id ? document.getElementById(id) : null;
    if (!el && id && id.toLowerCase() !== "top") return;
    e.preventDefault();
    controller.scrollTo(el ?? 0);
    if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
    if (el) focusTarget(el);
  };
  const attach = () => {
    root.setAttribute(SMOOTH_SCROLL_ATTR, "");
    savedBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    current = target = lastSet = window.scrollY;
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
  };
  const detach = () => {
    stop();
    root.removeAttribute(SMOOTH_SCROLL_ATTR);
    root.style.scrollBehavior = savedBehavior;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
  const queries = typeof window.matchMedia === "function" ? [window.matchMedia(REDUCED), window.matchMedia(FINE)] : [];
  const evaluate = () => {
    const next = !destroyed && queries.length === 2 && !queries[0].matches && queries[1].matches;
    if (next === enabled) return;
    enabled = next;
    if (enabled) attach();
    else detach();
  };
  const listen = (mq, on) => {
    if (typeof mq.addEventListener === "function") {
      if (on) mq.addEventListener("change", evaluate);
      else mq.removeEventListener("change", evaluate);
    } else if (on) mq.addListener(evaluate);
    else mq.removeListener(evaluate);
  };
  const controller = {
    scrollTo(t, options = {}) {
      if (!enabled) return nativeScrollTo(t, options);
      const el = typeof t === "string" ? safeQuery(t) : typeof t === "number" ? null : t;
      const y = resolveTop(el ?? t, options.offset);
      if (y === null) return;
      const to = clamp(y, 0, maxScroll());
      if (options.immediate) {
        stop();
        window.scrollTo(window.scrollX, to);
        current = target = lastSet = window.scrollY;
        return;
      }
      if (!animating()) current = lastSet = window.scrollY;
      target = to;
      aim = el ? { el, offset: options.offset } : null;
      tween = options.duration !== void 0 && options.duration > 0 ? { from: current, to, start: performance.now(), duration: options.duration } : null;
      run();
    },
    stop,
    get enabled() {
      return enabled;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      queries.forEach((mq) => listen(mq, false));
      document.removeEventListener("click", onClick);
      if (enabled) detach();
      enabled = false;
      if (active === controller) active = null;
    }
  };
  active = controller;
  queries.forEach((mq) => listen(mq, true));
  document.addEventListener("click", onClick);
  evaluate();
  return controller;
}
function smoothScrollTo(target, options) {
  if (active) active.scrollTo(target, options);
  else nativeScrollTo(target, options);
}
function useSmoothScroll({ lerp: lerp2 = 0.1, wheelMultiplier = 1, anchors = true } = {}) {
  const instance = (0, import_react11.useRef)(null);
  (0, import_react11.useEffect)(() => {
    const c = createSmoothScroll({ lerp: lerp2, wheelMultiplier, anchors });
    instance.current = c;
    return () => {
      c.destroy();
      if (instance.current === c) instance.current = null;
    };
  }, [lerp2, wheelMultiplier, anchors]);
  return (0, import_react11.useMemo)(
    () => ({
      scrollTo: (t, o) => instance.current ? instance.current.scrollTo(t, o) : nativeScrollTo(t, o),
      stop: () => instance.current?.stop(),
      get enabled() {
        return instance.current?.enabled ?? false;
      }
    }),
    []
  );
}
function SmoothScroll(props) {
  useSmoothScroll(props);
  return null;
}

// src/web/seo.ts
var isAbsolute = (u) => /^https?:\/\//i.test(u);
var nodeId = (url, name) => `${url.split("#")[0]}#${name}`;
function absoluteUrl(u, base) {
  return new URL(u, base).toString();
}
function pageMeta(o) {
  if (!isAbsolute(o.url)) throw new Error(`pageMeta: url must be absolute (got "${o.url}")`);
  const image = typeof o.image === "string" ? { url: o.image } : o.image;
  const imageUrl = image ? absoluteUrl(image.url, o.url) : void 0;
  const locale = (o.locale ?? "en_US").replace("-", "_");
  const tags = [
    { tag: "title", text: o.title },
    { tag: "meta", attrs: { name: "description", content: o.description } },
    { tag: "link", attrs: { rel: "canonical", href: o.url } }
  ];
  if (o.robots) tags.push({ tag: "meta", attrs: { name: "robots", content: o.robots } });
  const og = (property, content) => content !== void 0 && content !== "" && tags.push({ tag: "meta", attrs: { property, content: String(content) } });
  og("og:type", o.type ?? "website");
  og("og:title", o.title);
  og("og:description", o.description);
  og("og:url", o.url);
  og("og:site_name", o.siteName);
  og("og:locale", locale);
  if (image && imageUrl) {
    og("og:image", imageUrl);
    og("og:image:alt", image.alt);
    og("og:image:width", image.width);
    og("og:image:height", image.height);
  }
  const tw = (name, content) => content && tags.push({ tag: "meta", attrs: { name, content } });
  tw("twitter:card", imageUrl ? "summary_large_image" : "summary");
  tw("twitter:title", o.title);
  tw("twitter:description", o.description);
  tw("twitter:image", imageUrl);
  tw("twitter:image:alt", image?.alt);
  tw("twitter:site", o.twitterSite);
  return tags;
}
var escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function headTagsToHtml(tags) {
  return tags.map((t) => {
    if (t.tag === "title") return `<title>${escapeHtml(t.text)}</title>`;
    const attrs = Object.entries(t.attrs).map(([k, v]) => v === "" ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`).join("");
    if (t.tag === "script") return `<script${attrs}>${t.text}</script>`;
    return `<${t.tag}${attrs}>`;
  }).join("\n");
}
function headTagKey(t) {
  if (t.tag === "title") return "title";
  const a = t.attrs;
  if (t.tag === "meta") return a.name ? `meta:name:${a.name}` : a.property ? `meta:property:${a.property}` : `meta:${JSON.stringify(a)}`;
  if (t.tag === "link") return a.rel === "canonical" ? "link:canonical" : `link:${a.rel}:${a.href}`;
  return `script:${a.id ?? a.type}:${t.text.length}`;
}
var WEB_FONT_FILES = {
  display: "instrument-serif-latin-400-normal.woff2",
  "display-italic": "instrument-serif-latin-400-italic.woff2",
  text: "ibm-plex-sans-latin-400-normal.woff2",
  "text-500": "ibm-plex-sans-latin-500-normal.woff2",
  "text-600": "ibm-plex-sans-latin-600-normal.woff2",
  mono: "ibm-plex-mono-latin-400-normal.woff2",
  "mono-600": "ibm-plex-mono-latin-600-normal.woff2"
};
function fontPreloads({ faces = ["display"], base = "/fonts/", href, media } = {}) {
  const dir = base.endsWith("/") ? base : `${base}/`;
  return faces.map((face) => {
    const file = WEB_FONT_FILES[face];
    const attrs = { rel: "preload", href: href ? href(file, face) : `${dir}${file}`, as: "font", type: "font/woff2", crossorigin: "anonymous" };
    if (media) attrs.media = media;
    return { tag: "link", attrs };
  });
}
var ref = (node) => ({ "@id": typeof node === "string" ? node : node["@id"] });
function clean(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === void 0 || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
function organization(o) {
  return clean({ "@type": "Organization", "@id": o.id ?? nodeId(o.url, "organization"), name: o.name, url: o.url, logo: o.logo, description: o.description, sameAs: o.sameAs });
}
function webSite(o) {
  return clean({
    "@type": "WebSite",
    "@id": o.id ?? nodeId(o.url, "website"),
    name: o.name,
    url: o.url,
    description: o.description,
    inLanguage: o.inLanguage,
    publisher: o.publisher ? ref(o.publisher) : void 0
  });
}
function offer(o) {
  return clean({
    "@type": "Offer",
    name: o.name,
    description: o.description,
    url: o.url,
    price: o.price,
    priceCurrency: o.priceCurrency,
    availability: o.availability ? `https://schema.org/${o.availability}` : void 0,
    priceSpecification: o.billing ? {
      "@type": "UnitPriceSpecification",
      price: o.price,
      priceCurrency: o.priceCurrency,
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: o.billing }
    } : void 0,
    eligibleDuration: o.trialDays ? { "@type": "QuantitativeValue", value: o.trialDays, unitCode: "DAY" } : void 0
  });
}
function softwareApplication(o) {
  return clean({
    "@type": o.type ?? "SoftwareApplication",
    "@id": o.id ?? nodeId(o.url, "app"),
    name: o.name,
    description: o.description,
    url: o.url,
    image: o.image,
    applicationCategory: o.applicationCategory,
    operatingSystem: o.operatingSystem,
    offers: o.offers,
    publisher: o.publisher ? ref(o.publisher) : void 0,
    aggregateRating: o.aggregateRating ? { "@type": "AggregateRating", ...o.aggregateRating } : void 0
  });
}
function product(o) {
  return clean({
    "@type": "Product",
    "@id": o.id ?? nodeId(o.url, "product"),
    name: o.name,
    description: o.description,
    url: o.url,
    image: o.image,
    sku: o.sku,
    brand: o.brand ? { "@type": "Brand", name: o.brand } : void 0,
    offers: o.offers,
    aggregateRating: o.aggregateRating ? { "@type": "AggregateRating", ...o.aggregateRating } : void 0
  });
}
function faqPage(items, { url, id } = {}) {
  return clean({
    "@type": "FAQPage",
    "@id": id ?? (url ? `${url.split("#")[0]}#faq` : void 0),
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer }
    }))
  });
}
function breadcrumbList(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((b, i) => clean({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url }))
  };
}
function article(o) {
  const authors = (Array.isArray(o.author) ? o.author : [o.author]).map((a) => clean({ "@type": "Person", name: a.name, url: a.url }));
  return clean({
    "@type": o.type ?? "Article",
    headline: o.headline,
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    image: o.image,
    datePublished: o.datePublished,
    dateModified: o.dateModified ?? o.datePublished,
    author: authors.length === 1 ? authors[0] : authors,
    publisher: o.publisher ? ref(o.publisher) : void 0
  });
}
function jsonLd(...nodes) {
  if (nodes.length === 1) return { "@context": "https://schema.org", ...nodes[0] };
  return { "@context": "https://schema.org", "@graph": nodes };
}
var LS = String.fromCharCode(8232);
var PS = String.fromCharCode(8233);
function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").split(LS).join("\\u2028").split(PS).join("\\u2029");
}
function jsonLdTag(data, id) {
  return { tag: "script", attrs: id ? { type: "application/ld+json", id } : { type: "application/ld+json" }, text: serializeJsonLd(data) };
}
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

// src/web/Head.tsx
var import_react12 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
var REACT_ATTR = { crossorigin: "crossOrigin", "http-equiv": "httpEquiv", charset: "charSet", hreflang: "hrefLang" };
function toProps(attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs)) out[REACT_ATTR[k] ?? k] = v;
  return out;
}
function HeadTags({ tags }) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_jsx_runtime13.Fragment, { children: tags.map((t) => {
    const key = headTagKey(t);
    if (t.tag === "title") return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("title", { children: t.text }, key);
    if (t.tag === "script") return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("script", { ...toProps(t.attrs), dangerouslySetInnerHTML: { __html: t.text } }, key);
    return (0, import_react12.createElement)(t.tag, { key, ...toProps(t.attrs) });
  }) });
}
var MARK = "data-uipack-head";
function findExisting(t) {
  const head = document.head;
  if (t.tag === "title") return head.querySelector("title");
  const a = t.attrs;
  if (t.tag === "meta" && a.name) return head.querySelector(`meta[name="${CSS.escape(a.name)}"]`);
  if (t.tag === "meta" && a.property) return head.querySelector(`meta[property="${CSS.escape(a.property)}"]`);
  if (t.tag === "link" && a.rel === "canonical") return head.querySelector('link[rel="canonical"]');
  return null;
}
function useHead(tags) {
  const signature = JSON.stringify(tags);
  (0, import_react12.useEffect)(() => {
    if (typeof document === "undefined") return;
    const undo = [];
    for (const t of JSON.parse(signature)) {
      const existing = findExisting(t);
      if (t.tag === "title") {
        const prev = document.title;
        document.title = t.text;
        undo.push(() => document.title = prev);
        continue;
      }
      if (existing) {
        const prev = Array.from(existing.attributes).map((a) => [a.name, a.value]);
        for (const [k, v] of Object.entries(t.attrs)) existing.setAttribute(k, v);
        undo.push(() => {
          for (const a of Array.from(existing.attributes)) existing.removeAttribute(a.name);
          for (const [k, v] of prev) existing.setAttribute(k, v);
        });
        continue;
      }
      const el = document.createElement(t.tag);
      for (const [k, v] of Object.entries(t.attrs)) el.setAttribute(k, v);
      if (t.tag === "script") el.textContent = t.text;
      el.setAttribute(MARK, "");
      document.head.appendChild(el);
      undo.push(() => el.remove());
    }
    return () => undo.reverse().forEach((f) => f());
  }, [signature]);
}
function JsonLd({ data, id }) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("script", { type: "application/ld+json", id, dangerouslySetInnerHTML: { __html: serializeJsonLd(data) } });
}

// src/web/FAQ.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
var paragraphs = (answer) => answer.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
function FAQ({
  items,
  eyebrow = "FAQ",
  title = "Questions, answered",
  intro,
  id = "faq",
  url,
  jsonLd: jsonLd2 = true,
  variant = "list",
  tone,
  lazyRender = false
}) {
  const answer = (item) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "uipack-web-faq__answer", children: paragraphs(item.answer).map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "uipack-web-body", "data-emphasis": "medium", children: p }, i)) });
  const itemId = (item) => item.id ?? `${id}-${slugify(item.question)}`;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Section, { id, eyebrow, title, intro, tone, lazyRender, className: "uipack-web-faq", children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "uipack-web-faq__list", "data-variant": variant, children: items.map(
      (item) => variant === "accordion" ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("details", { className: "uipack-web-faq__item", id: itemId(item), children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("summary", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "uipack-web-faq__q", children: item.question }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "uipack-web-faq__icon", "aria-hidden": "true" })
        ] }),
        answer(item)
      ] }, item.question) : /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "uipack-web-faq__item", id: itemId(item), children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Heading, { level: 3, size: 1, className: "uipack-web-faq__q", children: item.question }),
        answer(item)
      ] }, item.question)
    ) }),
    jsonLd2 && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(JsonLd, { data: jsonLd(faqPage(items, { url })) })
  ] });
}

// src/web/crawl.ts
var AI_CRAWLERS = [
  { agent: "OAI-SearchBot", operator: "OpenAI", purpose: "search", note: "Shows the site in ChatGPT search answers. Blocked sites appear only as navigational links.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "ChatGPT-User", operator: "OpenAI", purpose: "user", note: "Fetches a page when a ChatGPT user asks. User-initiated, so OpenAI says robots.txt rules may not apply.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "GPTBot", operator: "OpenAI", purpose: "training", note: "Collects pages that may train OpenAI's foundation models. Independent of search.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "Claude-SearchBot", operator: "Anthropic", purpose: "search", note: "Indexes pages for Claude's search results. Blocking it reduces visibility in Claude answers.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "Claude-User", operator: "Anthropic", purpose: "user", note: "Fetches a page when a Claude user asks. Blocking it stops Claude retrieving the page for users.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "ClaudeBot", operator: "Anthropic", purpose: "training", note: "Collects pages that may train Anthropic's models.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "PerplexityBot", operator: "Perplexity", purpose: "search", note: "Indexes and links the site in Perplexity answers. Not used for training foundation models.", docs: "https://docs.perplexity.ai/guides/bots" },
  { agent: "Perplexity-User", operator: "Perplexity", purpose: "user", note: "Fetches a page when a Perplexity user asks. Perplexity says it generally ignores robots.txt.", docs: "https://docs.perplexity.ai/guides/bots" },
  { agent: "Google-Extended", operator: "Google", purpose: "training", note: "Gemini model training and grounding in Gemini Apps and Vertex AI. Does not affect Google Search or AI Overviews (Googlebot).", docs: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers" },
  { agent: "Applebot-Extended", operator: "Apple", purpose: "training", note: "Apple foundation-model training. It crawls nothing itself; Applebot search (Siri, Spotlight, Safari) is unaffected.", docs: "https://support.apple.com/en-us/119829" },
  { agent: "CCBot", operator: "Common Crawl", purpose: "training", note: "Common Crawl's open web archive, which many model training sets are built from.", docs: "https://commoncrawl.org/ccbot" }
];
function resolveAiCrawlers(policy = "allow-all") {
  const preset = typeof policy === "string" ? policy : policy.preset ?? "allow-all";
  const overrides = typeof policy === "string" ? {} : policy;
  const out = {};
  for (const c of AI_CRAWLERS) {
    const base = preset === "block-all" ? "disallow" : preset === "search-only" && c.purpose === "training" ? "disallow" : "allow";
    out[c.agent] = overrides[c.agent] ?? base;
  }
  return out;
}
var siteRoot = (site) => {
  if (!/^https?:\/\//i.test(site)) throw new Error(`buildCrawlFiles: site must be an absolute URL (got "${site}")`);
  return site.endsWith("/") ? site : `${site}/`;
};
var pageUrl = (site, path) => new URL(path.replace(/^\//, ""), siteRoot(site)).toString();
function checkPath(p) {
  if (!p.startsWith("/")) throw new Error(`robots.txt paths start with "/" (got "${p}")`);
  return p;
}
function robotsTxt({ site, aiCrawlers, disallow = [], sitemapPath = "/sitemap.xml" }) {
  const root = siteRoot(site);
  const paths = disallow.map(checkPath);
  const rules = resolveAiCrawlers(aiCrawlers);
  const preset = typeof aiCrawlers === "string" ? aiCrawlers : aiCrawlers?.preset ?? "allow-all";
  const allowLines = ["Allow: /", ...paths.map((p) => `Disallow: ${p}`)];
  const lines = [
    `# robots.txt for ${root}`,
    `# AI crawler stance: ${preset}${typeof aiCrawlers === "object" && Object.keys(aiCrawlers).some((k) => k !== "preset") ? " (with overrides)" : ""}.`,
    "# Search and user-triggered agents decide whether answer engines can find, fetch and cite",
    "# these pages; training agents decide whether the pages may train models.",
    "",
    "User-agent: *",
    ...allowLines
  ];
  for (const purpose of ["search", "user", "training"]) {
    lines.push("", `# ---- ${purpose === "search" ? "AI search indexes" : purpose === "user" ? "AI fetches a user asked for" : "AI model training"}`);
    for (const c of AI_CRAWLERS.filter((x) => x.purpose === purpose)) {
      const rule = rules[c.agent];
      lines.push("", `# ${c.operator}: ${rule === "allow" ? "allowed" : "blocked"}. ${c.note}`, `User-agent: ${c.agent}`);
      lines.push(...rule === "allow" ? allowLines : ["Disallow: /"]);
    }
  }
  lines.push("", `Sitemap: ${pageUrl(site, sitemapPath)}`, "");
  return lines.join("\n");
}
var escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
function formatLastmod(d) {
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) throw new Error("sitemap lastmod: invalid Date");
    return d.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.test(d)) throw new Error(`sitemap lastmod must be W3C datetime, e.g. 2026-10-22 (got "${d}")`);
  return d;
}
function sitemapXml({ site, pages }) {
  const origin = new URL(siteRoot(site)).origin;
  const urls = pages.filter((p) => !p.noindex && new URL(pageUrl(site, p.path)).origin === origin).map((p) => {
    const lastmod = p.lastmod ? `
    <lastmod>${formatLastmod(p.lastmod)}</lastmod>` : "";
    return `  <url>
    <loc>${escapeXml(pageUrl(site, p.path))}</loc>${lastmod}
  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}
var oneLine = (s) => s.replace(/\s+/g, " ").trim();
function llmsTxt({ site, pages, llms }) {
  const out = [`# ${oneLine(llms.title)}`, "", `> ${oneLine(llms.summary)}`];
  if (llms.details) out.push("", llms.details.trim());
  const sections = /* @__PURE__ */ new Map();
  const optional = [];
  for (const p of pages.filter((x) => !x.noindex)) {
    if (p.optional) optional.push(p);
    else sections.set(p.section ?? "Pages", [...sections.get(p.section ?? "Pages") ?? [], p]);
  }
  const item = (p) => `- [${oneLine(p.title).replace(/[[\]]/g, "")}](${pageUrl(site, p.markdown ?? p.path)})${p.description ? `: ${oneLine(p.description)}` : ""}`;
  for (const [name, list] of sections) out.push("", `## ${name}`, "", ...list.map(item));
  if (optional.length) out.push("", "## Optional", "", ...optional.map(item));
  return `${out.join("\n")}
`;
}
function buildCrawlFiles(o) {
  return {
    "robots.txt": robotsTxt(o),
    "sitemap.xml": sitemapXml(o),
    "llms.txt": llmsTxt(o)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AI_CRAWLERS,
  Aurora,
  BackgroundFrame,
  BeamLines,
  Body,
  CtaButton,
  DEFAULT_STAR_VALUES,
  DEFAULT_TIMING,
  DISPLAY_FROM_STEP,
  DemoPlayer,
  DotGrid,
  DriftingGutters,
  EMPHASIS,
  Eyebrow,
  FAQ,
  FeatureGrid,
  GRID_COLUMNS,
  GlassNav,
  GrainOverlay,
  Grid,
  GridItem,
  HeadTags,
  Heading,
  JsonLd,
  LineGrid,
  MagneticButton,
  Marquee,
  MaskedStar,
  NoiseLayer,
  NumberTicker,
  Reveal,
  RevealText,
  RhymeIcon,
  SMOOTH_SCROLL_ATTR,
  SMOOTH_SCROLL_PREVENT_ATTR,
  SPACE,
  ScrollTransform,
  Section,
  SmoothScroll,
  SpotlightCard,
  StarChart,
  StarHero,
  Subhead,
  TYPE_BASE_PX,
  TYPE_FACES,
  TYPE_RATIO,
  TYPE_STEPS,
  TextScramble,
  TiltCard,
  WEB_FONT_FILES,
  WHEEL_LINE_PX,
  WHEEL_PAGE_FRACTION,
  WebSurface,
  article,
  breadcrumbList,
  buildCrawlFiles,
  createSmoothScroll,
  curvePath,
  demoCycle,
  demoEnd,
  demoFrame,
  easeOutExpo,
  faqPage,
  followRate,
  followStep,
  fontPreloads,
  formatLastmod,
  headTagKey,
  headTagsToHtml,
  jsonLd,
  jsonLdTag,
  llmsTxt,
  normalizeWheel,
  offer,
  organization,
  pageMeta,
  product,
  ref,
  resolveAiCrawlers,
  robotsTxt,
  scrambleFrame,
  scrollProgressOf,
  serializeJsonLd,
  sitemapXml,
  slugify,
  smoothScrollTo,
  softwareApplication,
  stepStart,
  typeMetrics,
  typeRole,
  typeScale,
  useFinePointer,
  useHead,
  useInView,
  useScrollProgress,
  useSmoothScroll,
  webSite,
  withPaintTransition,
  withViewTransition
});
//# sourceMappingURL=web.cjs.map