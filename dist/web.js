import {
  usePrefersReducedMotion
} from "./chunk-FENTOHP4.js";

// src/web/Surface.tsx
import { jsx } from "react/jsx-runtime";
function WebSurface({ children, theme, as: Tag = "div", className = "", style }) {
  return /* @__PURE__ */ jsx(Tag, { className: `uipack-web ${className}`.trim(), "data-theme": theme, "data-style": "landing", style, children });
}
function Grid({ children, className = "", as: Tag = "div" }) {
  return /* @__PURE__ */ jsx(Tag, { className: `uipack-web-grid ${className}`.trim(), children });
}
function GridItem({ children, span = [4, 4, 4], className = "", as: Tag = "div" }) {
  const style = { "--span-w": span[0], "--span-m": span[1], "--span-n": span[2] };
  return /* @__PURE__ */ jsx(Tag, { className: `uipack-web-grid__item ${className}`.trim(), style, children });
}

// src/web/Text.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Eyebrow({ children, className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ jsx2(Tag, { id, className: `uipack-web-eyebrow ${className}`.trim(), children });
}
var DEFAULT_STEP = { 1: 6, 2: 4, 3: 2, 4: 1 };
function Heading({ children, level = 2, size, className = "", id }) {
  const Tag = `h${level}`;
  const step = size ?? DEFAULT_STEP[level];
  return /* @__PURE__ */ jsx2(Tag, { id, className: `uipack-web-heading ${className}`.trim(), "data-step": step, children });
}
function Subhead({ children, className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ jsx2(Tag, { id, className: `uipack-web-subhead ${className}`.trim(), children });
}
function Body({ children, emphasis = "low", className = "", as: Tag = "p", id }) {
  return /* @__PURE__ */ jsx2(Tag, { id, className: `uipack-web-body ${className}`.trim(), "data-emphasis": emphasis, children });
}

// src/web/CtaButton.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function CtaButton({ children, variant = "primary", href, size = "md", className = "", type = "button", ...rest }) {
  const cls = `uipack-web-cta ${className}`.trim();
  if (href)
    return /* @__PURE__ */ jsx3("a", { className: cls, href, "data-variant": variant, "data-size": size, children });
  return /* @__PURE__ */ jsx3("button", { className: cls, type, "data-variant": variant, "data-size": size, ...rest, children });
}

// src/web/GlassNav.tsx
import { useEffect, useId, useRef, useState } from "react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
function GlassNav({ brand, links, cta, sticky = true, label = "Primary" }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return /* @__PURE__ */ jsx4("header", { className: "uipack-web-nav", "data-sticky": sticky || void 0, "data-open": open || void 0, children: /* @__PURE__ */ jsxs("div", { className: "uipack-web-nav__bar", children: [
    /* @__PURE__ */ jsx4("div", { className: "uipack-web-nav__brand", children: brand }),
    /* @__PURE__ */ jsx4("nav", { "aria-label": label, className: "uipack-web-nav__nav", children: /* @__PURE__ */ jsx4("ul", { id: listId, className: "uipack-web-nav__links", children: links.map((l) => /* @__PURE__ */ jsx4("li", { children: /* @__PURE__ */ jsx4("a", { href: l.href, onClick: () => setOpen(false), children: l.label }) }, l.href + l.label)) }) }),
    cta && /* @__PURE__ */ jsx4("div", { className: "uipack-web-nav__cta", children: cta }),
    /* @__PURE__ */ jsx4(
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
import { useRef as useRef2 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function SpotlightCard({ children, href, className = "" }) {
  const ref = useRef2(null);
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    ref.current?.style.removeProperty("--spot-x");
    ref.current?.style.removeProperty("--spot-y");
  };
  const cls = `uipack-web-spotlight ${className}`.trim();
  if (href)
    return /* @__PURE__ */ jsx5("a", { ref: (n) => ref.current = n, className: cls, href, onPointerMove: onMove, onPointerLeave: onLeave, children });
  return /* @__PURE__ */ jsx5("div", { ref: (n) => ref.current = n, className: cls, onPointerMove: onMove, onPointerLeave: onLeave, children });
}

// src/web/Section.tsx
import { Fragment, jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
function Section({ eyebrow, title, intro, children, tone = "default", align = "start", id, className = "" }) {
  const headingId = id ? `${id}-title` : void 0;
  return /* @__PURE__ */ jsx6(
    "section",
    {
      id,
      className: `uipack-web-section ${className}`.trim(),
      "data-tone": tone,
      "data-align": align,
      "aria-labelledby": title ? headingId : void 0,
      children: /* @__PURE__ */ jsxs2("div", { className: "uipack-web-section__inner", children: [
        (eyebrow || title || intro) && /* @__PURE__ */ jsxs2("div", { className: "uipack-web-section__head", children: [
          eyebrow && /* @__PURE__ */ jsx6(Eyebrow, { children: eyebrow }),
          title && /* @__PURE__ */ jsx6(Heading, { level: 2, id: headingId, children: title }),
          intro && /* @__PURE__ */ jsx6(Body, { children: intro })
        ] }),
        children
      ] })
    }
  );
}
function FeatureGrid({ features, spotlight = false }) {
  return /* @__PURE__ */ jsx6(Grid, { as: "ul", className: "uipack-web-features", children: features.map((f) => {
    const inner = /* @__PURE__ */ jsxs2(Fragment, { children: [
      f.icon && /* @__PURE__ */ jsx6("div", { className: "uipack-web-feature__icon", children: f.icon }),
      /* @__PURE__ */ jsx6(Heading, { level: 3, size: 1, children: f.href ? /* @__PURE__ */ jsx6("a", { href: f.href, children: f.title }) : f.title }),
      /* @__PURE__ */ jsx6(Body, { children: f.body })
    ] });
    return /* @__PURE__ */ jsx6(GridItem, { as: "li", span: [4, 4, 4], children: spotlight ? /* @__PURE__ */ jsx6(SpotlightCard, { children: inner }) : /* @__PURE__ */ jsx6("div", { className: "uipack-web-feature", children: inner }) }, f.title);
  }) });
}

// src/web/RevealText.tsx
import { Fragment as Fragment2, useEffect as useEffect2, useRef as useRef3, useState as useState2 } from "react";
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function RevealText({ text = "", lines, as: Tag = "p", className = "", stagger = 45 }) {
  const ref = useRef3(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState2("static");
  useEffect2(() => {
    const el = ref.current;
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
  return /* @__PURE__ */ jsx7(Tag, { ref, className: `uipack-web-reveal ${className}`.trim(), "data-state": state, "data-by": byLine ? "line" : "word", children: units.map((u, i) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx7("span", { className: "uipack-web-reveal__unit", style: { "--i": i, "--stagger": `${stagger}ms` }, children: u }),
    !byLine && i < units.length - 1 ? " " : null
  ] }, i)) });
}

// src/web/motif.tsx
import { useId as useId2 } from "react";
import { jsx as jsx8, jsxs as jsxs4 } from "react/jsx-runtime";
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
  const id = useId2().replace(/:/g, "");
  const W = 1200;
  const H = 560;
  const line = curvePath(values, W, H, 72);
  return /* @__PURE__ */ jsxs4(
    "svg",
    {
      className: `uipack-web-star ${className}`.trim(),
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      focusable: "false",
      children: [
        /* @__PURE__ */ jsxs4("defs", { children: [
          /* @__PURE__ */ jsxs4("linearGradient", { id: `${id}-fill`, x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx8("stop", { offset: "0", stopColor: "var(--web-accent)", stopOpacity: "0.42" }),
            /* @__PURE__ */ jsx8("stop", { offset: "0.55", stopColor: "var(--web-accent)", stopOpacity: "0.14" }),
            /* @__PURE__ */ jsx8("stop", { offset: "1", stopColor: "var(--web-accent)", stopOpacity: "0" })
          ] }),
          /* @__PURE__ */ jsxs4("linearGradient", { id: `${id}-line`, x1: "0", y1: "0", x2: "1", y2: "0", children: [
            /* @__PURE__ */ jsx8("stop", { offset: "0", stopColor: "var(--web-accent)", stopOpacity: "0" }),
            /* @__PURE__ */ jsx8("stop", { offset: "0.35", stopColor: "var(--web-accent)", stopOpacity: "0.9" }),
            /* @__PURE__ */ jsx8("stop", { offset: "1", stopColor: "var(--web-accent)" })
          ] })
        ] }),
        [0.25, 0.5, 0.75].map((f) => /* @__PURE__ */ jsx8("line", { x1: "0", x2: W, y1: H * f, y2: H * f, className: "uipack-web-star__rule" }, f)),
        /* @__PURE__ */ jsx8("path", { d: `${line}L${W} ${H}L0 ${H}Z`, fill: `url(#${id}-fill)`, className: "uipack-web-star__area" }),
        /* @__PURE__ */ jsx8("path", { d: line, fill: "none", stroke: `url(#${id}-line)`, className: "uipack-web-star__glow", pathLength: 1 }),
        /* @__PURE__ */ jsx8("path", { d: line, fill: "none", stroke: `url(#${id}-line)`, className: "uipack-web-star__line", pathLength: 1 })
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
  return /* @__PURE__ */ jsxs4("svg", { className: "uipack-web-rhyme", viewBox: "0 0 40 40", width: size, height: size, "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ jsx8("rect", { x: "0.5", y: "0.5", width: "39", height: "39", rx: "10" }),
    /* @__PURE__ */ jsx8("path", { d, transform: "translate(6 10)" }),
    /* @__PURE__ */ jsx8("line", { x1: cx, x2: cx, y1: cy, y2: "32" }),
    /* @__PURE__ */ jsx8("circle", { cx, cy, r: "3" })
  ] });
}
function GrainOverlay({ opacity = 0.07, frequency = 0.8 }) {
  const id = useId2().replace(/:/g, "");
  return /* @__PURE__ */ jsxs4("svg", { className: "uipack-web-noise", "aria-hidden": "true", focusable: "false", style: { opacity }, "data-bg": "grain", children: [
    /* @__PURE__ */ jsxs4("filter", { id: `${id}-n`, children: [
      /* @__PURE__ */ jsx8("feTurbulence", { type: "fractalNoise", baseFrequency: frequency, numOctaves: "3", stitchTiles: "stitch" }),
      /* @__PURE__ */ jsx8("feColorMatrix", { type: "saturate", values: "0" })
    ] }),
    /* @__PURE__ */ jsx8("rect", { width: "100%", height: "100%", filter: `url(#${id}-n)` })
  ] });
}
var NoiseLayer = GrainOverlay;

// src/web/StarHero.tsx
import { jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
function StarHero({ eyebrow, title, subtitle, actions, visual, values, children, noise = 0.07, headingId }) {
  return /* @__PURE__ */ jsxs5("section", { className: "uipack-web-hero", "aria-labelledby": headingId, children: [
    /* @__PURE__ */ jsx9("div", { className: "uipack-web-hero__visual", children: visual ?? /* @__PURE__ */ jsx9(StarChart, { values }) }),
    noise > 0 && /* @__PURE__ */ jsx9(NoiseLayer, { opacity: noise }),
    /* @__PURE__ */ jsxs5("div", { className: "uipack-web-hero__copy", children: [
      eyebrow && /* @__PURE__ */ jsx9(Eyebrow, { children: eyebrow }),
      /* @__PURE__ */ jsx9(Heading, { level: 1, id: headingId, children: title }),
      subtitle && /* @__PURE__ */ jsx9(Subhead, { children: subtitle }),
      actions && /* @__PURE__ */ jsx9("div", { className: "uipack-web-hero__actions", children: actions })
    ] }),
    children && /* @__PURE__ */ jsx9("div", { className: "uipack-web-hero__proof", children })
  ] });
}

// src/web/DemoPlayer.tsx
import { useCallback, useEffect as useEffect3, useId as useId3, useMemo, useRef as useRef4, useState as useState3 } from "react";

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
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
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
  const timing = useMemo(() => ({ ...DEFAULT_TIMING, ...timingProp }), [timingProp]);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef4(null);
  const tabsRef = useRef4(null);
  const [elapsed, setElapsed] = useState3(0);
  const [playing, setPlaying] = useState3(autoplay);
  const [inView, setInView] = useState3(false);
  const id = useId3();
  const end = demoEnd(steps, timing);
  const cycle = demoCycle(steps, timing);
  useEffect3(() => {
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
  useEffect3(() => {
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
  const frame = reduced ? demoFrame(steps, Infinity, timing, initialMetric) : demoFrame(steps, elapsed, timing, initialMetric);
  const finished = !loop && frame.done;
  useEffect3(() => {
    if (finished) setPlaying(false);
  }, [finished]);
  const step = steps[frame.step];
  useEffect3(() => {
    onStepChange?.(frame.step);
  }, [frame.step]);
  const seek = useCallback(
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
  return /* @__PURE__ */ jsxs6(
    "section",
    {
      ref: rootRef,
      className: `uipack-web-demo ${className}`.trim(),
      "aria-label": label,
      "data-state": reduced ? "static" : finished ? "finished" : running ? "playing" : "paused",
      "data-step": frame.step,
      children: [
        /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__window", children: [
          /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__chrome", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxs6("span", { className: "uipack-web-demo__dots", children: [
              /* @__PURE__ */ jsx10("i", {}),
              /* @__PURE__ */ jsx10("i", {}),
              /* @__PURE__ */ jsx10("i", {})
            ] }),
            address && /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__address", children: address })
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__body", children: [
            /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__work", children: [
              /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__composer", "data-typing": typing || void 0, children: [
                /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__sr", children: promptText }),
                /* @__PURE__ */ jsx10("span", { "aria-hidden": "true", className: visiblePrompt ? "" : "uipack-web-demo__placeholder", children: visiblePrompt || placeholder }),
                typing && /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__caret", "aria-hidden": "true" })
              ] }),
              /* @__PURE__ */ jsx10("ol", { className: "uipack-web-demo__log", "aria-label": "Agent actions", children: actions.map((a, i) => {
                const state = i < doneCount ? "done" : i === runningIdx ? "running" : "pending";
                if (state === "pending") return null;
                return /* @__PURE__ */ jsxs6("li", { "data-state": state, children: [
                  /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__tick", "aria-hidden": "true", children: state === "done" ? /* @__PURE__ */ jsx10("svg", { viewBox: "0 0 16 16", children: /* @__PURE__ */ jsx10("path", { d: "M3.5 8.5l3 3 6-7" }) }) : null }),
                  /* @__PURE__ */ jsx10("span", { children: a.label }),
                  a.detail && /* @__PURE__ */ jsx10("small", { children: a.detail }),
                  state === "running" && /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__sr", children: " (in progress)" })
                ] }, `${actionStep}-${i}`);
              }) })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__result", children: [
              frame.metric !== void 0 && /* @__PURE__ */ jsxs6("p", { className: "uipack-web-demo__metric", children: [
                /* @__PURE__ */ jsx10("strong", { "data-testid": "demo-metric", children: frame.metric }, frame.metric),
                metricLabel && /* @__PURE__ */ jsx10("span", { children: metricLabel })
              ] }),
              screen !== void 0 && /* @__PURE__ */ jsx10("div", { className: "uipack-web-demo__screen", children: screen }, frame.settled ? frame.step : frame.step - 1)
            ] })
          ] })
        ] }),
        reduced ? /* @__PURE__ */ jsx10("ol", { className: "uipack-web-demo__static", "aria-label": "Demo steps", children: steps.map((s, i) => /* @__PURE__ */ jsxs6("li", { children: [
          /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__num", children: String(i + 1).padStart(2, "0") }),
          /* @__PURE__ */ jsxs6("div", { children: [
            /* @__PURE__ */ jsxs6("strong", { children: [
              s.label,
              " \xB7 ",
              s.title
            ] }),
            s.prompt && /* @__PURE__ */ jsxs6("p", { children: [
              "\u201C",
              s.prompt,
              "\u201D"
            ] }),
            !!s.actions?.length && /* @__PURE__ */ jsx10("ul", { children: s.actions.map(toAction).map((a) => /* @__PURE__ */ jsx10("li", { children: a.label }, a.label)) })
          ] })
        ] }, s.id)) }) : /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__controls", children: [
          /* @__PURE__ */ jsx10("div", { className: "uipack-web-demo__tabs", role: "group", "aria-label": "Demo steps", ref: tabsRef, onKeyDown: onTabKey, children: steps.map((s, i) => /* @__PURE__ */ jsxs6(
            "button",
            {
              type: "button",
              "aria-current": i === frame.step ? "step" : void 0,
              "aria-controls": `${id}-caption`,
              onClick: () => seek(i),
              children: [
                /* @__PURE__ */ jsx10("span", { className: "uipack-web-demo__num", children: String(i + 1).padStart(2, "0") }),
                " ",
                s.label
              ]
            },
            s.id
          )) }),
          /* @__PURE__ */ jsxs6("div", { className: "uipack-web-demo__buttons", children: [
            /* @__PURE__ */ jsx10("button", { type: "button", onClick: toggle, children: playing && !finished ? "Pause" : "Play" }),
            /* @__PURE__ */ jsx10("button", { type: "button", onClick: replay, children: "Replay" }),
            cta
          ] })
        ] }),
        reduced && cta && /* @__PURE__ */ jsx10("div", { className: "uipack-web-demo__buttons", children: cta }),
        /* @__PURE__ */ jsxs6("p", { className: "uipack-web-demo__caption", id: `${id}-caption`, "aria-live": "polite", children: [
          /* @__PURE__ */ jsxs6("span", { className: "uipack-web-demo__num", children: [
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
function typeMetrics(step) {
  if (step >= 5) return { lineHeight: 1.05, letterSpacing: "-0.03em" };
  if (step >= 3) return { lineHeight: 1.15, letterSpacing: "-0.02em" };
  if (step >= 1) return { lineHeight: 1.3, letterSpacing: "-0.01em" };
  return { lineHeight: 1.5, letterSpacing: "0em" };
}
var TYPE_STEPS = [-1, 0, 1, 2, 3, 4, 5, 6];
var EMPHASIS = { high: 1, medium: 0.87, low: 0.66 };
var SPACE = [0, 8, 16, 24, 32, 48, 64, 96, 128];
var GRID_COLUMNS = { wide: 12, medium: 8, narrow: 4 };

// src/web/hooks.ts
import { useEffect as useEffect4, useState as useState4 } from "react";
function useInView(ref, { threshold = 0, once = false, rootMargin } = {}) {
  const [inView, setInView] = useState4(false);
  useEffect4(() => {
    const el = ref.current;
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
  }, [ref, threshold, once, rootMargin]);
  return inView;
}
function scrollProgressOf(rect, viewport) {
  const total = viewport + rect.height;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, (viewport - rect.top) / total));
}
function useScrollProgress(ref) {
  const inView = useInView(ref);
  const [progress, setProgress] = useState4(0);
  useEffect4(() => {
    const el = ref.current;
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
  }, [ref, inView]);
  return progress;
}
function useFinePointer() {
  const [fine, setFine] = useState4(false);
  useEffect4(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return fine;
}
function transitionDocument() {
  const doc = typeof document === "undefined" ? void 0 : document;
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
var PAINT_STEPS = 48;
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
      start: rand(0, 0.4) * duration,
      // ms after the pour begins
      g: w / 13 * rand(1200, 3400) * (height / 900),
      // px/s², heavier falls faster
      max: rand(0.08, 0.5) * height
      // how far it can run before it thins out
    };
  });
}
function paintFrame(t, width, height, drips, duration) {
  const sheet = smooth(Math.min(1, t / (duration * 0.9))) * (height + 40);
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
function paintTransitionCss(width, height, duration = 1300) {
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
::view-transition-new(root) {
  mask-image: ${images};
  mask-repeat: no-repeat;
  animation: ${name} ${duration}ms linear both;
}
@keyframes ${name} {
${keyframes}
}`;
}
function withPaintTransition(update, { duration = 1300 } = {}) {
  const doc = transitionDocument();
  if (!doc?.startViewTransition) {
    update();
    return Promise.resolve();
  }
  const style = doc.createElement("style");
  style.dataset.uipackPaint = "";
  style.textContent = paintTransitionCss(window.innerWidth, window.innerHeight, duration);
  doc.head.appendChild(style);
  let transition;
  try {
    transition = doc.startViewTransition(update);
  } catch (error) {
    style.remove();
    throw error;
  }
  return transition.finished.catch(() => void 0).finally(() => style.remove());
}

// src/web/backgrounds.tsx
import { useEffect as useEffect5, useRef as useRef5 } from "react";
import { jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
function BackgroundFrame({ background, children, as: Tag = "div", className = "", style }) {
  return /* @__PURE__ */ jsxs7(Tag, { className: `uipack-web-bgframe ${className}`.trim(), style, children: [
    background,
    /* @__PURE__ */ jsx11("div", { className: "uipack-web-bgframe__content", children })
  ] });
}
function useParentSpotlight(ref, enabled) {
  useEffect5(() => {
    const el = ref.current;
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
  }, [ref, enabled]);
}
function GridBackground({ variant, size = 24, fade = true, spotlight = false }) {
  const ref = useRef5(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  useParentSpotlight(ref, spotlight && fine && !reduced);
  return /* @__PURE__ */ jsx11(
    "div",
    {
      ref,
      className: "uipack-web-gridbg",
      "data-bg": variant,
      "data-fade": fade || void 0,
      "aria-hidden": "true",
      style: { "--cell": `${size}px` },
      children: spotlight && /* @__PURE__ */ jsx11("div", { className: "uipack-web-gridbg__lit" })
    }
  );
}
function DotGrid(props) {
  return /* @__PURE__ */ jsx11(GridBackground, { variant: "dots", ...props });
}
function LineGrid(props) {
  return /* @__PURE__ */ jsx11(GridBackground, { variant: "lines", ...props });
}
function Aurora({ duration = 24 }) {
  const ref = useRef5(null);
  const inView = useInView(ref);
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      ref,
      className: "uipack-web-aurora",
      "data-bg": "aurora",
      "data-paused": !inView || void 0,
      "aria-hidden": "true",
      style: { "--aurora-duration": `${duration}s` },
      children: [
        /* @__PURE__ */ jsx11("i", {}),
        /* @__PURE__ */ jsx11("i", {}),
        /* @__PURE__ */ jsx11("i", {})
      ]
    }
  );
}
function MaskedStar({ values, flip = "none", clear = "center" }) {
  return /* @__PURE__ */ jsx11("div", { className: "uipack-web-maskedstar", "data-bg": "star", "data-flip": flip, "data-clear": clear, "aria-hidden": "true", children: /* @__PURE__ */ jsx11(StarChart, { values }) });
}
function BeamLines({ size = 48, count = 5, duration = 6 }) {
  const ref = useRef5(null);
  const inView = useInView(ref);
  const beams = Array.from({ length: count }, (_, i) => ({
    axis: i % 2 === 0 ? "h" : "v",
    line: 2 + i * 3 % 7,
    delay: -(i * duration / count) * 1.7,
    dur: duration * (0.8 + i * 7 % 5 / 10)
  }));
  return /* @__PURE__ */ jsx11(
    "div",
    {
      ref,
      className: "uipack-web-beams",
      "data-bg": "beams",
      "data-paused": !inView || void 0,
      "aria-hidden": "true",
      style: { "--cell": `${size}px` },
      children: beams.map((b, i) => /* @__PURE__ */ jsx11(
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
  return /* @__PURE__ */ jsxs7("div", { className: "uipack-web-gutters__side", "data-side": side, children: [
    /* @__PURE__ */ jsx11("div", { className: "uipack-web-gutters__drift" }),
    [0, 1, 2].map((i) => /* @__PURE__ */ jsx11("span", { className: "uipack-web-gutters__signal", style: { "--i": i } }, i))
  ] });
}
function DriftingGutters({ contentWidth = 1120, top = 72, minViewport = 1280, drift = 48 }) {
  const custom = minViewport !== 1280;
  return /* @__PURE__ */ jsxs7(
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
        custom && /* @__PURE__ */ jsx11("style", { children: `@media (min-width: ${minViewport}px) { .uipack-web-gutters[data-min="${minViewport}"] { display: block; } }` }),
        /* @__PURE__ */ jsx11(GutterSide, { side: "left" }),
        /* @__PURE__ */ jsx11(GutterSide, { side: "right" })
      ]
    }
  );
}

// src/web/motion.tsx
import {
  useEffect as useEffect6,
  useRef as useRef6,
  useState as useState5
} from "react";
import { jsx as jsx12, jsxs as jsxs8 } from "react/jsx-runtime";
function Reveal({ children, variant = "up", stagger = 80, as: Tag = "div", className = "" }) {
  const ref = useRef6(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState5("static");
  useEffect6(() => {
    const el = ref.current;
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
  return /* @__PURE__ */ jsx12(
    Tag,
    {
      ref,
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
  const ref = useRef6(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, threshold: 0.5 });
  const [t, setT] = useState5(1);
  const [tick, setTick] = useState5(0);
  const started = useRef6(false);
  useEffect6(() => {
    if (typeof IntersectionObserver !== "undefined" && !started.current) setT(0);
  }, []);
  useEffect6(() => {
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
  return /* @__PURE__ */ jsxs8(Tag, { ref, className: `uipack-web-scramble ${className}`.trim(), "data-mode": mode, "data-done": shown === text || void 0, children: [
    /* @__PURE__ */ jsx12("span", { className: "uipack-web-scramble__ghost", children: text }),
    /* @__PURE__ */ jsxs8("span", { className: "uipack-web-scramble__live", "aria-hidden": "true", children: [
      shown,
      mode === "type" && shown !== text && /* @__PURE__ */ jsx12("span", { className: "uipack-web-demo__caret" })
    ] })
  ] });
}
var easeOut = (t) => 1 - Math.pow(1 - t, 3);
function NumberTicker({ value, from = 0, duration = 1400, format, locale, prefix = "", suffix = "", className = "" }) {
  const ref = useRef6(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, threshold: 0.6 });
  const [current, setCurrent] = useState5(value);
  const started = useRef6(false);
  useEffect6(() => {
    if (typeof IntersectionObserver !== "undefined" && !started.current) setCurrent(from);
  }, [from]);
  useEffect6(() => {
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
  return /* @__PURE__ */ jsxs8("span", { ref, className: `uipack-web-ticker ${className}`.trim(), children: [
    /* @__PURE__ */ jsx12("span", { className: "uipack-web-scramble__ghost", children: final }),
    /* @__PURE__ */ jsx12("span", { className: "uipack-web-scramble__live", "aria-hidden": "true", "data-testid": "ticker-live", children: live })
  ] });
}
function Marquee({ items, label, duration = 30, reverse = false }) {
  const ref = useRef6(null);
  const copyRef = useRef6(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState5(false);
  useEffect6(() => {
    copyRef.current?.setAttribute("inert", "");
  }, [reduced]);
  const list = (copy) => /* @__PURE__ */ jsx12("ul", { className: "uipack-web-marquee__list", ref: copy ? copyRef : void 0, "aria-hidden": copy || void 0, children: items.map((item, i) => /* @__PURE__ */ jsx12("li", { children: item }, i)) });
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      ref,
      className: "uipack-web-marquee",
      role: "region",
      "aria-label": label,
      "data-static": reduced || void 0,
      "data-paused": paused || !inView || void 0,
      "data-reverse": reverse || void 0,
      style: { "--marquee-duration": `${duration}s` },
      children: [
        /* @__PURE__ */ jsx12("div", { className: "uipack-web-marquee__viewport", children: /* @__PURE__ */ jsxs8("div", { className: "uipack-web-marquee__track", children: [
          list(false),
          !reduced && list(true)
        ] }) }),
        !reduced && /* @__PURE__ */ jsx12("button", { type: "button", className: "uipack-web-marquee__toggle", "aria-pressed": paused, onClick: () => setPaused((p) => !p), children: paused ? "Play" : "Pause" })
      ]
    }
  );
}
function useHoverMotion(apply, reset) {
  const ref = useRef6(null);
  const reduced = usePrefersReducedMotion();
  const onPointerMove = (e) => {
    if (reduced || e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    apply(el, (e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => ref.current && reset(ref.current);
  return { ref, onPointerMove, onPointerLeave };
}
function TiltCard({ children, max = 5, href, className = "" }) {
  const { ref, onPointerMove, onPointerLeave } = useHoverMotion(
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
  return href ? /* @__PURE__ */ jsx12("a", { ref: (n) => ref.current = n, href, ...props, children }) : /* @__PURE__ */ jsx12("div", { ref: (n) => ref.current = n, ...props, children });
}
function MagneticButton({ strength = 6, ...button }) {
  const { ref, onPointerMove, onPointerLeave } = useHoverMotion(
    (el, x, y) => {
      el.style.setProperty("--pull-x", `${(x * strength * 2).toFixed(1)}px`);
      el.style.setProperty("--pull-y", `${(y * strength * 2).toFixed(1)}px`);
    },
    (el) => {
      el.style.removeProperty("--pull-x");
      el.style.removeProperty("--pull-y");
    }
  );
  return /* @__PURE__ */ jsx12("span", { ref: (n) => ref.current = n, className: "uipack-web-magnetic", onPointerMove, onPointerLeave, children: /* @__PURE__ */ jsx12(CtaButton, { ...button }) });
}
var lerp = ([a, b], t) => a + (b - a) * t;
function ScrollTransform({ children, rotate = [0, 0], scale = [1, 1], translateY = [0, 0], opacity = [1, 1], className = "" }) {
  const ref = useRef6(null);
  const reduced = usePrefersReducedMotion();
  const raw = useScrollProgress(ref);
  const t = reduced ? 0.5 : raw;
  const style = {
    "--st-rotate": `${lerp(rotate, t).toFixed(2)}deg`,
    "--st-scale": lerp(scale, t).toFixed(3),
    "--st-y": `${lerp(translateY, t).toFixed(1)}px`,
    "--st-opacity": lerp(opacity, t).toFixed(3)
  };
  return /* @__PURE__ */ jsx12("div", { ref, className: `uipack-web-scrollx ${className}`.trim(), "data-progress": t.toFixed(2), children: /* @__PURE__ */ jsx12("div", { className: "uipack-web-scrollx__inner", style, children }) });
}
export {
  Aurora,
  BackgroundFrame,
  BeamLines,
  Body,
  CtaButton,
  DEFAULT_STAR_VALUES,
  DEFAULT_TIMING,
  DemoPlayer,
  DotGrid,
  DriftingGutters,
  EMPHASIS,
  Eyebrow,
  FeatureGrid,
  GRID_COLUMNS,
  GlassNav,
  GrainOverlay,
  Grid,
  GridItem,
  Heading,
  LineGrid,
  MagneticButton,
  Marquee,
  MaskedStar,
  NoiseLayer,
  NumberTicker,
  Reveal,
  RevealText,
  RhymeIcon,
  SPACE,
  ScrollTransform,
  Section,
  SpotlightCard,
  StarChart,
  StarHero,
  Subhead,
  TYPE_BASE_PX,
  TYPE_RATIO,
  TYPE_STEPS,
  TextScramble,
  TiltCard,
  WebSurface,
  curvePath,
  demoCycle,
  demoEnd,
  demoFrame,
  scrambleFrame,
  scrollProgressOf,
  stepStart,
  typeMetrics,
  typeScale,
  useFinePointer,
  useInView,
  useScrollProgress,
  withPaintTransition,
  withViewTransition
};
//# sourceMappingURL=web.js.map