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
function NoiseLayer({ opacity = 0.08 }) {
  const id = useId2().replace(/:/g, "");
  return /* @__PURE__ */ jsxs4("svg", { className: "uipack-web-noise", "aria-hidden": "true", focusable: "false", style: { opacity }, children: [
    /* @__PURE__ */ jsxs4("filter", { id: `${id}-n`, children: [
      /* @__PURE__ */ jsx8("feTurbulence", { type: "fractalNoise", baseFrequency: "0.8", numOctaves: "3", stitchTiles: "stitch" }),
      /* @__PURE__ */ jsx8("feColorMatrix", { type: "saturate", values: "0" })
    ] }),
    /* @__PURE__ */ jsx8("rect", { width: "100%", height: "100%", filter: `url(#${id}-n)` })
  ] });
}

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
export {
  Body,
  CtaButton,
  DEFAULT_STAR_VALUES,
  DEFAULT_TIMING,
  DemoPlayer,
  EMPHASIS,
  Eyebrow,
  FeatureGrid,
  GRID_COLUMNS,
  GlassNav,
  Grid,
  GridItem,
  Heading,
  NoiseLayer,
  RevealText,
  RhymeIcon,
  SPACE,
  Section,
  SpotlightCard,
  StarChart,
  StarHero,
  Subhead,
  TYPE_BASE_PX,
  TYPE_RATIO,
  TYPE_STEPS,
  WebSurface,
  curvePath,
  demoCycle,
  demoEnd,
  demoFrame,
  stepStart,
  typeMetrics,
  typeScale
};
//# sourceMappingURL=web.js.map