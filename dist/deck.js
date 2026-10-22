import {
  useLayerFlight
} from "./chunk-6YWE3SYB.js";
import {
  innerClipStart,
  smoothstep,
  zoomFrame
} from "./chunk-VZ4PJUMF.js";
import {
  useIsoLayoutEffect,
  usePrefersReducedMotion
} from "./chunk-KYO6UXHN.js";

// src/deck/DeckPlayer.tsx
import {
  useCallback as useCallback2,
  useEffect as useEffect4,
  useRef as useRef5,
  useState as useState5
} from "react";

// src/deck/player/format.ts
var railAt = (i, count) => `${count > 1 ? i / (count - 1) * 100 : 0}%`;
var pad = (n) => String(n).padStart(2, "0");
var notesOf = (slide) => !slide?.notes ? void 0 : typeof slide.notes === "string" ? { say: slide.notes, delivery: "", next: void 0 } : slide.notes;

// src/deck/player/Controls.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Controls({
  slides,
  index,
  atStart,
  atEnd,
  mode,
  canFullscreen,
  fullscreen,
  overviewButtonRef,
  onPrev,
  onNext,
  onRead,
  onPrint,
  onOverview,
  onPresenter,
  onFullscreen
}) {
  const count = slides.length;
  return /* @__PURE__ */ jsxs("div", { className: "uipack-deck-controls", children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "uipack-deck-step", onClick: onPrev, disabled: atStart, "aria-label": "Previous", children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2190" }) }),
    /* @__PURE__ */ jsxs("div", { className: "uipack-deck-rail", "aria-hidden": "true", children: [
      slides.map((s, i) => /* @__PURE__ */ jsx("span", { style: { left: railAt(i, count) }, "data-passed": i <= index ? "" : void 0 }, s.id)),
      /* @__PURE__ */ jsx("i", { style: { left: railAt(index, count) } })
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "uipack-deck-counter", children: [
      pad(index + 1),
      " / ",
      pad(count)
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "uipack-deck-step", onClick: onNext, disabled: atEnd, "aria-label": "Next", children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2192" }) }),
    /* @__PURE__ */ jsxs("span", { className: "uipack-deck-tools", children: [
      mode === "audience" && /* @__PURE__ */ jsx("button", { type: "button", onClick: onRead, children: "Read" }),
      mode === "audience" && /* @__PURE__ */ jsx("button", { type: "button", onClick: onPrint, title: "Download as PDF or print: one slide per 16:9 page", children: "PDF / Print" }),
      /* @__PURE__ */ jsx("button", { type: "button", ref: overviewButtonRef, onClick: onOverview, "aria-keyshortcuts": "G", children: "All slides" }),
      mode === "audience" && /* @__PURE__ */ jsx("button", { type: "button", onClick: onPresenter, "aria-keyshortcuts": "S", children: "Speaker view" }),
      canFullscreen && /* @__PURE__ */ jsx("button", { type: "button", onClick: onFullscreen, "aria-keyshortcuts": "F", "aria-pressed": fullscreen, children: fullscreen ? "Exit full screen" : "Full screen" })
    ] })
  ] });
}

// src/deck/player/Layer.tsx
import { forwardRef, useCallback, useRef, useState } from "react";

// src/deck/parts.tsx
import { createContext, useContext } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var DeckSlideContext = createContext({
  step: Infinity,
  active: true,
  thumbnail: false,
  index: 0,
  count: 1
});
var useDeckSlide = () => useContext(DeckSlideContext);
function Morph({
  id,
  as: Tag = "div",
  fit,
  className,
  style,
  children
}) {
  return /* @__PURE__ */ jsx2(Tag, { "data-morph": id, "data-morph-fit": fit, className, style, children });
}
function Build({
  step,
  as: Tag = "div",
  className,
  style,
  children
}) {
  const { step: reached } = useDeckSlide();
  const built = reached >= step;
  return /* @__PURE__ */ jsx2(
    Tag,
    {
      "data-build": step,
      "data-built": built ? "" : void 0,
      "aria-hidden": built ? void 0 : true,
      className,
      style,
      children
    }
  );
}
function Slide({
  eyebrow,
  footer,
  layout = "stack",
  className,
  children
}) {
  const { index, count } = useDeckSlide();
  return /* @__PURE__ */ jsxs2("div", { className: ["uipack-deck-slide", className].filter(Boolean).join(" "), "data-layout": layout, children: [
    eyebrow && /* @__PURE__ */ jsx2("p", { className: "uipack-deck-eyebrow", children: eyebrow }),
    children,
    footer !== null && /* @__PURE__ */ jsxs2("footer", { className: "uipack-deck-footer", "data-morph": "deck-footer", "data-morph-fit": "stretch", children: [
      /* @__PURE__ */ jsx2("span", { children: footer }),
      /* @__PURE__ */ jsxs2("span", { children: [
        String(index + 1).padStart(2, "0"),
        " / ",
        String(count).padStart(2, "0")
      ] })
    ] })
  ] });
}

// src/deck/transitions.ts
var CANVAS_WIDTH = 1920;
var CANVAS_HEIGHT = 1080;
var deckMotion = {
  quick: 160,
  base: 320,
  slow: 560,
  morph: 760,
  zoom: 1150,
  stagger: 45,
  settle: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  travel: "cubic-bezier(0.55, 0, 0.15, 1)",
  /** The zoom camera's progress (in log scale): moving by 10% of the clock, landing softly. */
  camera: "cubic-bezier(0.3, 0.05, 0.25, 1)"
};
function cubicBezier(x1, y1, x2, y2) {
  const cx2 = 3 * x1;
  const bx = 3 * (x2 - x1) - cx2;
  const ax = 1 - cx2 - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t) => ((ax * t + bx) * t + cx2) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx2;
  return (time) => {
    let t = time;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (x(t) - time) / d));
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
var cameraEase = cubicBezier(0.3, 0.05, 0.25, 1);
function resolveTransition(from, to, transitionOf, fallback = "advance") {
  if (from === to) return { kind: "none" };
  if (Math.abs(from - to) !== 1) return { kind: "fade" };
  const t = transitionOf(Math.max(from, to)) ?? fallback;
  return typeof t === "string" ? { kind: t } : { kind: "zoom", zoom: t.zoom };
}
var slideZoomFrame = (target, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => zoomFrame(target, width, height);
function slideZoomSamples(target, forward, samples = 24, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  const frame = zoomFrame(target, width, height);
  if (!frame) return null;
  const start = innerClipStart(target, frame, width, height);
  const radiusStart = 6 * frame.Z;
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = forward ? cameraEase(t) : 1 - cameraEase(t);
    const clipT = smoothstep(0.08, 0.55, p);
    const inset = (v) => (v * (1 - clipT)).toFixed(2);
    out.push({
      offset: t,
      p,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(${inset(start.top)}px ${inset(start.right)}px ${inset(start.bottom)}px ${inset(start.left)}px round ${(radiusStart * (1 - clipT)).toFixed(2)}px)`,
      innerOpacity: smoothstep(0.08, 0.36, p)
    });
  }
  return out;
}
function flipFrom(from, to, scale, fit = "auto", textScale) {
  if (textScale && fit !== "stretch") {
    return {
      transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${textScale.toFixed(4)})`
    };
  }
  let sx = from.w / Math.max(to.w, 0.01);
  let sy = from.h / Math.max(to.h, 0.01);
  const aspectGap = Math.abs(Math.log(from.w / from.h / (to.w / to.h)));
  if (fit === "uniform" || fit === "auto" && aspectGap < 0.25) {
    sx = sy;
  }
  return {
    transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
  };
}
var lerpRect = (a, b, p) => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p
});
var overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
var rectOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
function blocksOf(layer) {
  let node = layer.querySelector(".uipack-deck-slide") ?? layer;
  if (node === layer) {
    while (node.children.length === 1 && node.firstElementChild) node = node.firstElementChild;
  }
  return Array.from(node.children).filter(
    (el) => el instanceof HTMLElement && !el.classList.contains("uipack-deck-layer__bg") && // The footer sits in the same place on every slide; it crossfades rather than moving.
    !el.classList.contains("uipack-deck-footer")
  );
}
function partitionForMorph(root, keys) {
  const matched = /* @__PURE__ */ new Map();
  const rest = [];
  const containers = [];
  const walk = (el) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) && !(child instanceof SVGElement)) continue;
      if (child.classList.contains("uipack-deck-layer__bg")) continue;
      const key = child.getAttribute("data-morph");
      if (key && keys.has(key)) matched.set(key, child);
      else if (keys.size && child.querySelector(Array.from(keys, (k) => `[data-morph="${CSS.escape(k)}"]`).join(","))) {
        containers.push(child);
        walk(child);
      } else rest.push(child);
    }
  };
  walk(root);
  return { matched, rest, containers };
}
function paintsBox(el) {
  const cs = getComputedStyle(el);
  const clear = (c) => c === "transparent" || /rgba\(.*,\s*0\)$/.test(c);
  return !clear(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 && !clear(cs.borderTopColor) || parseFloat(cs.borderLeftWidth) > 0 && !clear(cs.borderLeftColor) || cs.boxShadow && cs.boxShadow !== "none";
}
function paintFrames(el, visible) {
  const cs = getComputedStyle(el);
  const shown = { backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor, boxShadow: cs.boxShadow };
  const clear = { backgroundColor: "transparent", borderColor: "transparent", boxShadow: "none" };
  return visible === "from" ? [shown, clear] : [clear, shown];
}
var unbuilt = (el) => el.hasAttribute("data-build") && !el.hasAttribute("data-built");
var isText = (el) => /^(H[1-6]|P|SPAN|B|STRONG|EM|SMALL|LABEL|Q|BLOCKQUOTE)$/.test(el.tagName);
var fontSizeOf = (el) => parseFloat(getComputedStyle(el).fontSize) || 1;
var morphKeys = (layer) => new Set(Array.from(layer.querySelectorAll("[data-morph]"), (el) => el.getAttribute("data-morph")));
function runTransition(opts) {
  const { from, to, direction, scale, reducedMotion } = opts;
  let { kind } = opts.transition;
  if (typeof from.animate !== "function") return [];
  if (reducedMotion && kind !== "none") kind = "fade";
  const anims = [];
  const play = (el, keyframes, options) => {
    anims.push(el.animate(keyframes, { fill: "both", ...options }));
  };
  const bgOf = (layer) => layer.querySelector(":scope > .uipack-deck-layer__bg");
  if (kind === "zoom") {
    const zoomInto = direction === 1;
    const outer = zoomInto ? from : to;
    const inner = zoomInto ? to : from;
    const target = outer.querySelector(`[data-morph="${CSS.escape(opts.transition.zoom ?? "")}"]`);
    const layerRect = rectOf(outer);
    const box = target && rectOf(target);
    const local = box && {
      x: (box.x - layerRect.x) / scale,
      y: (box.y - layerRect.y) / scale,
      w: box.w / scale,
      h: box.h / scale
    };
    const samples = local ? slideZoomSamples(local, zoomInto) : null;
    if (!samples) kind = "fade";
    else {
      const frame = slideZoomFrame(local);
      const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
      inner.style.zIndex = "2";
      const timing = { duration: deckMotion.zoom, easing: "linear" };
      play(outer, samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin })), timing);
      play(inner, samples.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })), timing);
      for (const child of Array.from(target.children)) {
        play(child, samples.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0.01, 0.09, s.p) })), timing);
      }
      if (paintsBox(target)) {
        const frames = paintFrames(target, "from");
        play(
          target,
          zoomInto ? [frames[0], { ...frames[1], offset: 0.22 }, frames[1]] : [frames[1], { ...frames[1], offset: 0.78 }, frames[0]],
          timing
        );
      }
      const around = partitionForMorph(outer, /* @__PURE__ */ new Set([opts.transition.zoom])).rest;
      const fade = zoomInto ? [{ opacity: 1, easing: "ease-out" }, { opacity: 0, offset: 0.3 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: 0.7, easing: "ease-in" }, { opacity: 1 }];
      for (const el of around) play(el, fade, timing);
      return anims;
    }
  }
  if (kind === "morph") {
    const fromKeys = morphKeys(from);
    const shared = new Set([...morphKeys(to)].filter((k) => fromKeys.has(k)));
    if (shared.size === 0) kind = "fade";
    else {
      const out = partitionForMorph(from, shared);
      const inn = partitionForMorph(to, shared);
      const travel = { duration: deckMotion.morph, easing: deckMotion.travel };
      const path = [];
      const early = [];
      for (const key of shared) {
        const a = out.matched.get(key);
        const b = inn.matched.get(key);
        if (!a || !b) continue;
        const ra = rectOf(a);
        const rb = rectOf(b);
        const fit = b.getAttribute("data-morph-fit") ?? "auto";
        const text = isText(a) && isText(b) ? fontSizeOf(a) / fontSizeOf(b) : void 0;
        const [bIn, aOut] = text ? [0.08, 0.06] : [0.3, 0.36];
        const start = text ? { x: ra.x, y: ra.y, w: rb.w * text, h: rb.h * text } : ra;
        for (const p of [0.7, 0.85, 0.95]) path.push(lerpRect(start, rb, p));
        for (const p of [0, 0.1, 0.25, 0.45, 0.65, 0.85, 1]) early.push(lerpRect(start, rb, p));
        const fromB = flipFrom(ra, rb, scale, fit, text).transform;
        const fromA = flipFrom(rb, ra, scale, fit, text && 1 / text).transform;
        const swap = { duration: deckMotion.morph, easing: "linear" };
        play(b, [{ transformOrigin: "0 0", transform: fromB }, { transformOrigin: "0 0", transform: "none" }], travel);
        play(b, [{ opacity: 0 }, { opacity: 1, offset: bIn }, { opacity: 1 }], swap);
        play(a, [{ transformOrigin: "0 0", transform: "none" }, { transformOrigin: "0 0", transform: fromA }], travel);
        play(a, [{ opacity: 1 }, { opacity: 1, offset: text ? 0 : bIn * 0.6 }, { opacity: 0, offset: aOut }, { opacity: 0 }], swap);
      }
      const leave = { duration: deckMotion.quick, easing: deckMotion.exit };
      const besideOut = (el) => Boolean(el.parentElement && out.containers.includes(el.parentElement) && isText(el.parentElement));
      const crossed = (el) => {
        const r = rectOf(el);
        return early.some((p) => overlaps(p, r));
      };
      const fromArea = rectOf(from).w * rectOf(from).h;
      const outgoing = out.rest.flatMap((el) => {
        const r = rectOf(el);
        const kids = Array.from(el.children).filter((c) => c instanceof HTMLElement);
        return r.w * r.h > fromArea / 6 && kids.length > 1 && crossed(el) ? kids : [el];
      });
      for (const el of outgoing) {
        if (besideOut(el)) play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.morph * 0.08, easing: "linear" });
        else if (crossed(el)) play(el, [{ opacity: 1 }, { opacity: 0 }], leave);
        else play(el, [{ opacity: 1 }, { opacity: 1, offset: 0.55, easing: "ease-in-out" }, { opacity: 0 }], { duration: deckMotion.morph * 0.6, easing: "linear" });
      }
      for (const el of out.containers) if (paintsBox(el)) play(el, paintFrames(el, "from"), leave);
      const beside = (el) => Boolean(el.parentElement && inn.containers.includes(el.parentElement) && isText(el.parentElement));
      const underPath = (el) => {
        const r = rectOf(el);
        return path.some((p) => overlaps(p, r));
      };
      const layerArea = rectOf(to).w * rectOf(to).h;
      const incoming = inn.rest.flatMap((el) => {
        const r = rectOf(el);
        const kids = Array.from(el.children).filter((c) => c instanceof HTMLElement);
        return r.w * r.h > layerArea / 6 && kids.length > 1 && underPath(el) ? kids : [el];
      }).filter((el) => !unbuilt(el));
      let i = 0;
      for (const el of incoming) {
        if (beside(el) || underPath(el)) {
          play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: deckMotion.base, delay: deckMotion.morph * 0.72, easing: deckMotion.settle });
        } else {
          play(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
            duration: deckMotion.slow,
            delay: deckMotion.morph * 0.4 + Math.min(i++, 6) * deckMotion.stagger,
            easing: deckMotion.settle
          });
        }
      }
      for (const el of inn.containers) {
        if (paintsBox(el)) play(el, paintFrames(el, "to"), { duration: deckMotion.slow, delay: deckMotion.morph * 0.4, easing: deckMotion.settle });
      }
      const bg = bgOf(to);
      if (bg) play(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 0.62 }, { opacity: 1 }], { duration: deckMotion.morph, easing: "linear" });
      return anims;
    }
  }
  if (kind === "advance") {
    from.style.zIndex = "2";
    const shift = 40 * direction;
    play(from, [{ transform: "none" }, { transform: `translateX(${-shift}px)` }], { duration: deckMotion.base, easing: deckMotion.exit });
    play(from, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.quick, easing: "ease-in" });
    const blocks = blocksOf(to).filter((el) => !unbuilt(el));
    (blocks.length ? blocks : [to]).forEach(
      (el, i) => play(el, [{ opacity: 0, transform: `translateX(${shift * 1.4}px)` }, { opacity: 1, transform: "none" }], {
        duration: deckMotion.slow,
        delay: deckMotion.quick + Math.min(i, 7) * deckMotion.stagger,
        easing: deckMotion.settle
      })
    );
    return anims;
  }
  if (kind === "fade") {
    from.style.zIndex = "2";
    play(from, [{ opacity: 1 }, { opacity: 0 }], {
      duration: reducedMotion ? deckMotion.quick : deckMotion.base,
      easing: "ease-out"
    });
  }
  return anims;
}

// src/deck/player/Layer.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function useCanvasScale() {
  const el = useRef(null);
  const [node, setNode] = useState(null);
  const ref = useCallback((next) => {
    el.current = next;
    setNode(next);
  }, []);
  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    if (!node) return;
    const measure = () => setScale(node.clientWidth / CANVAS_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);
  return { ref, el, scale };
}
var Layer = forwardRef(function Layer2({ slide, index, count, step, active, thumbnail = false, theme, reducedMotion }, ref) {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      ref,
      className: "uipack-deck-layer",
      "data-tone": slide.tone ?? "paper",
      "data-slide": slide.id,
      role: thumbnail ? void 0 : "group",
      "aria-roledescription": thumbnail ? void 0 : "slide",
      "aria-label": thumbnail ? void 0 : `${index + 1} of ${count}: ${slide.title}`,
      "aria-hidden": active ? void 0 : true,
      ...active ? {} : { inert: "" },
      children: [
        /* @__PURE__ */ jsx3("div", { className: "uipack-deck-layer__bg" }),
        /* @__PURE__ */ jsx3(DeckSlideContext.Provider, { value: { step, active, thumbnail, index, count }, children: slide.render({ step, active, thumbnail, theme, reducedMotion }) })
      ]
    }
  );
});
function SlideThumbnail({
  slide,
  index,
  count,
  theme = "light",
  step = Infinity
}) {
  const { ref, scale } = useCanvasScale();
  return /* @__PURE__ */ jsx3("div", { ref, className: "uipack-deck-thumb", "data-tone": slide.tone ?? "paper", children: /* @__PURE__ */ jsx3("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: /* @__PURE__ */ jsx3(Layer, { slide, index, count, step, active: false, thumbnail: true, theme, reducedMotion: true }) }) });
}

// src/deck/player/Overview.tsx
import { useEffect, useRef as useRef2, useState as useState2 } from "react";

// src/deck/storyline.ts
var SLIDE_ROLES = {
  cover: {
    label: "Cover",
    question: "What is this and why am I here?",
    job: "State the outcome the talk is about, in business terms, not the name of the system."
  },
  answer: {
    label: "Answer",
    question: "What's the point?",
    job: "The governing thought: the result, the recommendation or the thesis, in one sentence."
  },
  context: {
    label: "Context",
    question: "Where are we?",
    job: "The situation the room already agrees with. One slide, no history lesson."
  },
  problem: {
    label: "Problem",
    question: "What changed or went wrong?",
    job: "The complication that makes action necessary now, sized with a number."
  },
  evidence: {
    label: "Evidence",
    question: "Why should I believe it?",
    job: "One finding per slide: value, baseline, window and source."
  },
  mechanism: {
    label: "Mechanism",
    question: "How does it work?",
    job: "The system or cause, from overview into one part at a time."
  },
  option: {
    label: "Options",
    question: "What else could we do?",
    job: "Real alternatives, including doing nothing, compared on the same criteria."
  },
  recommendation: {
    label: "Recommendation",
    question: "Which one, and what do we give up?",
    job: "The chosen option, why it wins, and the trade-off accepted."
  },
  plan: {
    label: "Plan",
    question: "What happens next?",
    job: "Milestones, cost and how we'll know it worked."
  },
  risk: {
    label: "Risk",
    question: "What could go wrong?",
    job: "The top risk, its impact, the mitigation and the tripwire."
  },
  ask: {
    label: "Ask",
    question: "What do you need from me?",
    job: "A specific decision or action, with an owner and a date."
  },
  demo: {
    label: "Demo",
    question: "Show me.",
    job: "The real thing, one rehearsed path, with a recorded fallback."
  },
  appendix: {
    label: "Appendix",
    question: "Where's the detail?",
    job: "Backup for questions and async readers. Not presented."
  }
};
var REPEATABLE_ROLES = ["evidence", "mechanism", "demo", "appendix"];
var STORYLINE_TEMPLATES = [
  {
    id: "project-update",
    name: "Project update / results",
    use: "Status to leadership or stakeholders: where it stands, what it delivered, what you need.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    remember: "Whether it's on track, the one number that proves it, and what you need from them.",
    beats: [
      {
        role: "answer",
        purpose: "Status and headline result in one sentence.",
        titlePattern: "<Project> is <on track | at risk | done>: <result against goal>",
        example: "Search indexing migration is on track: 70% of traffic moved, no regressions",
        guidance: "Lead with the status word. If it is at risk, say so here, not on slide five."
      },
      {
        role: "evidence",
        purpose: "The result against the goal agreed at the start.",
        titlePattern: "<Metric> moved from <baseline> to <now> against a <target> goal",
        example: "Index freshness improved from 40 minutes to 6 against a 10-minute goal",
        guidance: "Same metric and baseline as the last update. Source and window on the slide.",
        repeatable: true
      },
      {
        role: "evidence",
        purpose: "Progress against the plan, including what slipped and why.",
        titlePattern: "<N of M> milestones done; <milestone> slipped <time> because <cause>",
        example: "Four of six milestones are done; backfill slipped two weeks on quota",
        guidance: "Report slips plainly with their cause. Surprises later cost more trust than slips now."
      },
      {
        role: "risk",
        purpose: "The one risk leadership should know about, and what you are doing about it.",
        titlePattern: "<Risk> could <impact>; <mitigation> by <date>",
        example: "Shard rebalancing could delay cutover; a dry run on 12 May will tell us",
        guidance: "One risk with a mitigation beats a red-amber-green table of ten.",
        optional: true
      },
      {
        role: "plan",
        purpose: "The next milestones with dates.",
        titlePattern: "Next: <milestone> by <date>, then <milestone>",
        example: "Next: full cutover by 30 May, then the old cluster is retired in June",
        guidance: "Dates, not quarters, for anything within six weeks."
      },
      {
        role: "ask",
        purpose: "The one thing you need from this audience.",
        titlePattern: "We need <owner> to <decide/do> by <date>",
        example: "We need Platform leads to approve a two-week schema freeze from 20 May",
        guidance: "If you need nothing, say 'no asks; next update on <date>'. Silence reads as hiding."
      }
    ]
  },
  {
    id: "decision-request",
    name: "Proposal / decision request",
    use: "You want a decision, budget or headcount. SCQA with the recommendation stated up front.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    remember: "The choice, what it costs, what it returns, and the date they have to decide by.",
    beats: [
      {
        role: "answer",
        purpose: "The recommendation and the ask in one line, before any background.",
        titlePattern: "We should <action> to <outcome>; we need <decision or resource>",
        example: "Move image resizing to a queue to stop upload timeouts; we need one engineer",
        guidance: "Minto's governing thought. Executives may stop here; the rest is support."
      },
      {
        role: "context",
        purpose: "Situation: what the room already accepts.",
        titlePattern: "<System> does <job> for <who>",
        example: "Uploads resize every image inline before the request returns",
        guidance: "One slide. If the room would nod at every word, it's the right context."
      },
      {
        role: "problem",
        purpose: "Complication: what broke or changed, sized, and why now.",
        titlePattern: "<Problem> costs <metric> and grows <rate>",
        example: "Large uploads time out 4% of the time, and volume doubles by Q4",
        guidance: "A number with a source. 'Why now' turns a nice-to-have into a decision."
      },
      {
        role: "option",
        purpose: "Two or three real options, including doing nothing, on the same criteria.",
        titlePattern: "<N> options: <A>, <B> or do nothing, compared on <criteria>",
        example: "Three options: bigger servers, a resize queue, or doing nothing",
        guidance: "One comparison slide. A straw-man option tells the room the answer was rigged."
      },
      {
        role: "recommendation",
        purpose: "Why the chosen option wins and what you trade away.",
        titlePattern: "<Option> wins on <criterion>; the cost is <trade-off>",
        example: "A queue ends timeouts; thumbnails arrive a few seconds later",
        guidance: "Naming the cost is what makes the recommendation credible."
      },
      {
        role: "plan",
        purpose: "Cost, timeline and how you will know it worked.",
        titlePattern: "<Effort> over <time>; done when <measurable result>",
        example: "Six engineer-weeks; done when upload timeouts drop below 0.1%",
        guidance: "A success metric decided now stops the goalposts moving later."
      },
      {
        role: "risk",
        purpose: "The main risk and the tripwire that makes you reverse.",
        titlePattern: "If <signal>, we <fallback>",
        example: "If queue lag passes one minute, we fall back to inline resizing",
        guidance: "Reversibility lowers the bar for a yes.",
        optional: true
      },
      {
        role: "ask",
        purpose: "The decision, who makes it, by when.",
        titlePattern: "Decide <what> by <date> so <owner> can <next step>",
        example: "Platform leads: decide by 14 March so the work is staffed in Q2",
        guidance: "Repeat the ask from slide one, word for word if possible."
      }
    ]
  },
  {
    id: "deep-dive",
    name: "Technical deep dive",
    use: "Explaining a system to engineers: why it matters, how it works, trade-offs, what's next.",
    slides: { min: 7, max: 12 },
    minutes: { min: 12, max: 25 },
    answerFirst: false,
    remember: "One idea about how the system works, the number that shows it works, and the trade-off it makes.",
    beats: [
      {
        role: "answer",
        purpose: "The one idea the audience should leave with.",
        titlePattern: "<System> achieves <property> by <key idea>",
        example: "The rate limiter adds 0.2 ms by deciding locally and syncing counts later",
        guidance: "A thesis, not a title. Everything after it explains or tests this sentence."
      },
      {
        role: "problem",
        purpose: "Why it matters: the constraint that makes the obvious design fail.",
        titlePattern: "<Naive approach> fails because <constraint>",
        example: "A central counter adds a network hop to every request",
        guidance: "Engineers care about the design only once they feel the constraint."
      },
      {
        role: "mechanism",
        purpose: "The whole system on one slide, three to five parts.",
        titlePattern: "<N> parts: <A>, <B> and <C>",
        example: "Three parts: a local bucket, a sync loop and a global budget",
        guidance: "Wrap each part in <Morph id> so the next slide can zoom into it."
      },
      {
        role: "mechanism",
        purpose: "Zoom into the part that holds the key idea. One part per slide.",
        titlePattern: "<Part> <does what> so that <property>",
        example: "Each local bucket refills from its share of the global budget",
        guidance: "Zoom in, explain, come back out. Never zoom two levels without returning.",
        move: "zoom",
        repeatable: true
      },
      {
        role: "mechanism",
        purpose: "Show the same thing changing: a request moving, state before and after.",
        titlePattern: "<Event> <changes what> while <what stays>",
        example: "A burst drains one bucket while the others keep serving",
        guidance: "Morph the same diagram rather than drawing a second one.",
        move: "morph",
        optional: true
      },
      {
        role: "evidence",
        purpose: "Measured behaviour, with method and source.",
        titlePattern: "<Test> shows <result> at <load>",
        example: "Load tests show 0.2 ms added latency and 3% overshoot at peak",
        guidance: "Say how it was measured. A benchmark without a method is an anecdote."
      },
      {
        role: "option",
        purpose: "Trade-offs and rejected alternatives.",
        titlePattern: "We chose <X> over <Y>: <gain>, at the cost of <loss>",
        example: "We accept brief overshoot in exchange for no extra network hop",
        guidance: "The trade-off slide is where senior engineers decide whether to trust you."
      },
      {
        role: "plan",
        purpose: "What's next and the open questions.",
        titlePattern: "Next: <work>; open question: <question>",
        example: "Next: per-tenant budgets in Q3; fairness under bursts is still open",
        guidance: "Open questions invite the experts in the room to help.",
        optional: true
      },
      {
        role: "ask",
        purpose: "What you want from the experts in the room.",
        titlePattern: "<Review/adopt/try> <what> by <date>",
        example: "Storage team: review the sync design doc by Friday; I'll fold in every comment",
        guidance: "Engineers respond to a specific review request, not 'any questions?'."
      }
    ]
  },
  {
    id: "launch-demo",
    name: "Launch / demo",
    use: "Something shipped or is about to: show the before and after, earn adoption.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 12 },
    answerFirst: true,
    remember: "What users can do now that they couldn't before, the early result, and who switches it on next.",
    beats: [
      {
        role: "answer",
        purpose: "What shipped, for whom, and the change it makes.",
        titlePattern: "<Who> can now <do what> <how much better>",
        example: "Support agents can now issue refunds in one click instead of a ticket",
        guidance: "The user and the outcome, not the feature name."
      },
      {
        role: "problem",
        purpose: "The before: who felt the pain, sized.",
        titlePattern: "<Task> took <time/cost> because <cause>",
        example: "Refunds took two days because every one needed an engineer",
        guidance: "Make the before concrete enough that the demo is a relief."
      },
      {
        role: "demo",
        purpose: "The after, in the product. One rehearsed path.",
        titlePattern: "Watch <user> <do task> in <time>",
        example: "Watch an agent refund a duplicate charge in under a minute",
        guidance: "Live with a recorded fallback. Morph from the before screen to the after.",
        move: "morph",
        repeatable: true
      },
      {
        role: "mechanism",
        purpose: "Just enough how-it-works to trust it: guardrails and limits.",
        titlePattern: "<Guardrail> keeps <risk> in check",
        example: "Refunds over an agent's limit still route to a lead for approval",
        guidance: "Answer the question the room is already asking: what stops misuse?",
        optional: true
      },
      {
        role: "evidence",
        purpose: "Early results, with window and source, and what isn't measured yet.",
        titlePattern: "In <window>, <result>",
        example: "In the first two weeks, 1,200 refunds skipped the engineering queue",
        guidance: "Usage beats opinions. Say 'not measured yet' rather than imply a result."
      },
      {
        role: "plan",
        purpose: "Rollout: who gets it when, and what comes next.",
        titlePattern: "<Audience> gets it by <date>; <next feature> comes next",
        example: "All support regions get it by 1 June; partial refunds come next",
        guidance: "Tell people exactly when it reaches them."
      },
      {
        role: "ask",
        purpose: "Adoption, feedback or a sponsor.",
        titlePattern: "<Owner>: <turn on/try/send> <what> by <date>",
        example: "Team leads: switch your queues on by 15 May and send feedback to me",
        guidance: "Name who acts and where feedback goes."
      }
    ]
  },
  {
    id: "postmortem",
    name: "Postmortem / incident review",
    use: "After an incident: what happened, why, and what changes. Blameless and specific.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    remember: "The impact in one number, the cause in one sentence, and the fix that stops it happening again.",
    beats: [
      {
        role: "answer",
        purpose: "Summary: what happened, impact, cause, status.",
        titlePattern: "<Trigger> caused <impact> for <duration>; <status>",
        example: "A bad config push took checkout down for 42 minutes; fixed and guarded",
        guidance: "Everyone in the room wants this sentence first. Systems, not names."
      },
      {
        role: "evidence",
        purpose: "Impact: who, how many, how long, with source.",
        titlePattern: "<N> <users/orders> affected over <duration>",
        example: "About 18,000 orders failed; most customers retried within an hour",
        guidance: "Give the denominator and the source (dashboard, logs, finance)."
      },
      {
        role: "evidence",
        purpose: "Timeline: detection, response, mitigation. Where the minutes went.",
        titlePattern: "Detected in <t>; mitigated in <t> because <reason>",
        example: "Alerts fired after 9 minutes; rollback took 25 because the tool was slow",
        guidance: "The gaps in the timeline are usually the real findings."
      },
      {
        role: "mechanism",
        purpose: "Root cause: how the failure propagated.",
        titlePattern: "<Condition> let <fault> reach <blast radius>",
        example: "A missing default let one bad value disable every payment provider",
        guidance: "Zoom into the failing component from a system overview.",
        move: "zoom"
      },
      {
        role: "problem",
        purpose: "Why it wasn't caught: testing, detection and response gaps.",
        titlePattern: "<Process gap> let <cause> reach <scope>",
        example: "Config changes skipped canary, so the bad value reached all regions at once",
        guidance: "Ask why the safeguards missed it, not who pushed the change."
      },
      {
        role: "plan",
        purpose: "Action items: prevent, detect, mitigate, each with owner and date.",
        titlePattern: "<N> fixes: <prevent>, <detect>, <mitigate> by <date>",
        example: "Three fixes: canary config pushes, schema defaults and faster rollback by June",
        guidance: "Fewer, owned, dated actions beat a long list nobody tracks."
      },
      {
        role: "ask",
        purpose: "The prioritisation or help the fixes need.",
        titlePattern: "Prioritise <fix> in <planning cycle>; <owner> owns it",
        example: "Prioritise the canary work in Q3 planning; Release Engineering owns it",
        guidance: "Action items without an ask for capacity tend to slip."
      }
    ]
  },
  {
    id: "review-highlights",
    name: "Quarterly / performance review highlights",
    use: "Your or your team's period in review: impact, not activity.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    remember: "Two or three outcomes with numbers, what other teams can now do, and the one ask.",
    beats: [
      {
        role: "answer",
        purpose: "Headline impact for the period: outcomes, not tasks.",
        titlePattern: "This <period> we <outcome> and <outcome>",
        example: "This half we cut payment failures by a third and unblocked two launches",
        guidance: "If a reviewer reads one slide, this is it."
      },
      {
        role: "evidence",
        purpose: "One outcome per slide: result, baseline, source, and your part in it.",
        titlePattern: "<Change> moved <metric> from <baseline> to <now>",
        example: "Smarter retries cut failed payments from 3% to 2% of attempts",
        guidance: "Say what you did versus what the team did. Credit others by name.",
        repeatable: true
      },
      {
        role: "evidence",
        purpose: "Leverage: what others can do now because of the work.",
        titlePattern: "<Who> can now <do what> without <old cost>",
        example: "Two product teams launched on the new API without our help",
        guidance: "Multipliers are what reviewers look for at senior levels."
      },
      {
        role: "problem",
        purpose: "What didn't land, and what changed because of it.",
        titlePattern: "<Miss> happened; we now <changed practice>",
        example: "The fraud-rule rewrite slipped a quarter; we now ship rules behind flags",
        guidance: "One honest miss makes the wins believable.",
        optional: true
      },
      {
        role: "plan",
        purpose: "Next period's bets, tied to the org's goals.",
        titlePattern: "Next <period>: <bet> to support <org goal>",
        example: "Next half: halve payout latency to support instant withdrawals",
        guidance: "Link each bet to a goal your leadership already owns."
      },
      {
        role: "ask",
        purpose: "The support you need: scope, headcount, sponsorship.",
        titlePattern: "We need <owner> to <support> by <date>",
        example: "We need the payments director to approve one more engineer by July",
        guidance: "A review without an ask leaves your growth to someone else's memory."
      }
    ]
  }
];
function getStorylineTemplate(id) {
  const found = STORYLINE_TEMPLATES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown storyline template: ${id}`);
  return found;
}
function templateOutline(template) {
  const t = typeof template === "string" ? getStorylineTemplate(template) : template;
  return t.beats.map((beat, i) => ({ id: `${t.id}-${i + 1}`, title: beat.example, role: beat.role }));
}
var LINT_RULES = {
  "deck-empty": { severity: "error", check: "The deck has at least one slide." },
  "duplicate-id": { severity: "error", check: "Slide IDs are unique (they appear in URLs and presenter sync)." },
  "title-present": { severity: "error", check: "Every slide has an action title." },
  "title-claim": {
    severity: "error",
    check: "The title states a claim of three or more words, not a topic label like 'Background' or 'Architecture'."
  },
  "title-length": { severity: "warn", check: "The title is at most 14 words." },
  "title-specific": {
    severity: "warn",
    check: "An answer or evidence title carries a quantity: a number, a number word ('twice', 'a third') or a from\u2192to or X vs Y comparison with one. Adjectives ('better', 'great') and names don't count."
  },
  "one-idea": { severity: "tip", check: "The title is one sentence: one idea per slide." },
  "notes-present": { severity: "warn", check: "Every presented slide has a talk track." },
  "number-source": {
    severity: "warn",
    check: "A number in a title names its source in the notes (a dashboard, query, test, survey, report, benchmark, logs, experiment or URL) or in the slide's `source`."
  },
  "roles-missing": {
    severity: "warn",
    check: "Slides are tagged with roles. Without them, roles are inferred from the titles and only the answer-first and closing-ask checks run."
  },
  "answer-first": {
    severity: "error",
    check: "The answer or recommendation appears within the first three content slides."
  },
  "outcome-first": {
    severity: "tip",
    check: "Slide one names the business outcome (faster, cheaper, safer, by how much), not the system that produced it."
  },
  "closing-ask": { severity: "error", check: "The last presented slide is an ask." },
  "ask-concrete": {
    severity: "warn",
    check: "The ask names a decision or action, an owner (a team or role such as 'platform leads', 'the payments team', 'VP Eng' or an @handle; not 'we', 'the team' or a bare name) and a calendar date ('next quarter' is not one)."
  },
  "role-repeat": {
    severity: "warn",
    check: "No two adjacent slides share a role, except evidence, mechanism, demo and appendix."
  },
  "deck-length": { severity: "warn", check: "About one to two minutes per presented slide." },
  "talk-time": {
    severity: "warn",
    check: "The talk track fits the time budget at 135 words a minute, and covers at least half of it."
  }
};
var MAX_TITLE_WORDS = 14;
var WORDS_PER_MINUTE = 135;
var TOPIC_LABELS = /* @__PURE__ */ new Set(
  [
    "about me",
    "action items",
    "agenda",
    "alternatives",
    "appendix",
    "approach",
    "architecture",
    "background",
    "budget",
    "challenges",
    "conclusion",
    "conclusions",
    "context",
    "cost",
    "costs",
    "data",
    "deep dive",
    "demo",
    "design",
    "executive summary",
    "faq",
    "findings",
    "goals",
    "highlights",
    "how it works",
    "impact",
    "intro",
    "introduction",
    "issues",
    "key takeaways",
    "kpis",
    "learnings",
    "lessons learned",
    "live demo",
    "metrics",
    "motivation",
    "next",
    "next steps",
    "objectives",
    "options",
    "overview",
    "plan",
    "problem",
    "problem statement",
    "progress",
    "q&a",
    "q and a",
    "questions",
    "recap",
    "recommendation",
    "recommendations",
    "requirements",
    "results",
    "risks",
    "risks and mitigations",
    "roadmap",
    "root cause",
    "scope",
    "solution",
    "status",
    "status update",
    "success metrics",
    "summary",
    "system architecture",
    "takeaways",
    "team",
    "thank you",
    "thanks",
    "timeline",
    "trade-offs",
    "tradeoffs",
    "update",
    "what's next",
    "whats next",
    "why",
    "why now"
  ]
);
var MONTH = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
var WEEKDAY = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";
var capitalised = (alternatives) => alternatives.replace(/(^|\|)([a-z])/g, (_, bar, c) => bar + c.toUpperCase());
var DATE_RE = new RegExp(
  [
    // Capitalised, so "may", "sat" and "wed" as ordinary words don't count as dates.
    `\\b(?:${capitalised(MONTH)})\\b`,
    `\\b(?:${capitalised(WEEKDAY)})\\b`,
    String.raw`\b\d{4}-\d{2}-\d{2}\b`,
    String.raw`\b\d{1,2}/\d{1,2}\b`,
    String.raw`\b(?:FY\s?'?\d{2,4}\s?)?[QH][1-4]\b`,
    String.raw`\b(?:[Tt]oday|[Tt]omorrow|[Tt]onight|EOD|eod)\b`
  ].join("|")
);
var RELATIVE_DATE_RE = /\b(?:(?:this|next|coming|following) (?:week|month|quarter|half|sprint|year|cycle)|end of (?:the )?(?:week|month|quarter|half|year)|soon|asap|going forward|in the future|over time|eventually|later this year)\b/i;
var DECISION_RE = /\b(?:approve|approves|decide|decision|agree|choose|pick|sign(?:s)? off|fund|staff|prioriti[sz]e|review|commit|allocate|assign|adopt|join|try|confirm|accept|enable|switch|turn on|send|share|sponsor|support|unblock|escalate|ship|green-?light|vote|nominate|give|grant|lend|provide|attend|book|hire|move|freeze|pause|stop|start|own)\b/i;
var OWNER_ROLE_RE = /\b(?:owner|owners|lead|leads|manager|managers|director|directors|head of|sponsor|sponsors|committee|board|council|on-call|chair|architect|architects|approver|approvers|reviewer|reviewers)\b|(?:^|[\s(])@\w/i;
var OWNER_ACRONYM_RE = /\b(?:VPs?|SVPs?|EVPs?|CEO|CTO|CFO|COO|CPO|CIO|CISO|PMs?|EMs?|TLs?|TPMs?|SREs?)\b/;
var NAMED_GROUP_RE = /\b(?!the\b|our\b|my\b|your\b|this\b|that\b|a\b|whole\b|entire\b|each\b|every\b|any\b|other\b|same\b|new\b)[\p{L}-]+ (?:team|teams|org|group|squad|guild|committee)\b/iu;
var NAMED_OWNS_RE = /\b\p{Lu}[\p{L}-]*(?: \p{Lu}[\p{L}-]*)* (?:owns|will own)\b/u;
var NUMBER_WORD_RE = /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|million|billion|dozen|half|halve[ds]?|twice|double[ds]?|triple[ds]?|third|thirds|quarter of|zero|no (?:rollbacks?|regressions?|incidents?|outages?|errors?|downtime))\b/i;
var OUTCOME_RE = /\b(?:faster|slower|cheaper|safer|fewer|more|less|cut|cuts|saved?|saves|saving|grew|grow|fell|fall|rose|raised?|reduced?|reduces|improved?|improves|doubled?|halved?|ended|ends|stops?|stopped|prevents?|unblock(?:s|ed)?|launch(?:es|ed)?|ship(?:s|ped)?|on track|at risk|done|delivered|won|lost|missed|recovered|restored)\b/i;
var SOURCE_RE = /\b(?:dashboards?|quer(?:y|ies)|tests?|load[- ]tests?|a\/b|surveys?|reports?|benchmarks?|logs?|experiments?|traces?|telemetry|studies|study|(?:management|finance|financial) accounts|(?:cost|capacity|pricing|financial) model)\b|https?:\/\/|\bwww\.\w/i;
var TOPIC_OPENING_RE = /^(?:overview of|an overview of|introduction to|intro to|update on|an update on|status\b|some of|how\b[^.;:?!]*\bworks?\b|thanks\b|thank you\b|any questions\b|questions\b)/i;
function topicOpening(title) {
  const m = title.match(TOPIC_OPENING_RE)?.[0] ?? "";
  return /^how\b/i.test(m) ? "How \u2026 works" : `${m}\u2026`;
}
var QUESTIONS_SLIDE_RE = /^(?:any |final |your )?(?:questions?|q ?& ?a|q and a|thanks?|thank you|discussion)\b/i;
var PLAN_TITLE_RE = /^(?:next steps?|what's next|whats next|roadmap|the plan|plan)\b/i;
function wordsOf(text) {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.%,&/-]*/gu) ?? [];
}
function headlineOf(slide) {
  return (slide.headline ?? slide.title ?? "").trim();
}
function sayOf(notes) {
  if (!notes) return "";
  return (typeof notes === "string" ? notes : notes.say).trim();
}
function notesText(notes) {
  if (!notes) return "";
  return typeof notes === "string" ? notes : [notes.say, notes.delivery, notes.next ?? ""].join(" ");
}
function normaliseLabel(text) {
  return text.toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}\p{N}&' -]+/gu, " ").replace(/\s+/g, " ").trim();
}
function edgeLabel(phrase) {
  const words = phrase.split(" ");
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const head = words.slice(0, n).join(" ");
    const tail = words.slice(-n).join(" ");
    if (TOPIC_LABELS.has(head)) return head;
    if (TOPIC_LABELS.has(tail)) return tail;
  }
  return void 0;
}
function hasClaimNumber(text) {
  const stripped = text.replace(new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH})\b`, "gi"), " ").replace(new RegExp(String.raw`\b(?:${MONTH})\s+\d{1,2}(?:st|nd|rd|th)?\b`, "gi"), " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b[QH][1-4](?:\s*(?:FY)?'?\d{2,4})?\b/gi, " ").replace(/\bFY\s?'?\d{2,4}\b/gi, " ").replace(/\b(?:19|20)\d{2}\b/g, " ").replace(/\bv\d+(?:\.\d+)*\b/gi, " ").replace(/\b(?:p|sev-?)\d\b/gi, " ").replace(/\b\d{1,2}:\d{2}\b/g, " ");
  return /\d/.test(stripped);
}
function hasOwner(text) {
  return OWNER_ROLE_RE.test(text) || OWNER_ACRONYM_RE.test(text) || NAMED_GROUP_RE.test(text) || NAMED_OWNS_RE.test(text);
}
function isSpecific(text) {
  return hasClaimNumber(text) || NUMBER_WORD_RE.test(text);
}
function inferRoles(slides) {
  return slides.map((slide, i) => {
    const text = headlineOf(slide);
    if (i === 0) return isSpecific(text) || OUTCOME_RE.test(text) ? "answer" : "cover";
    if (PLAN_TITLE_RE.test(text)) return "plan";
    if (i === slides.length - 1 && !QUESTIONS_SLIDE_RE.test(text) && DECISION_RE.test(text) && (hasOwner(text) || DATE_RE.test(text))) {
      return "ask";
    }
    return void 0;
  });
}
function lintDeck(slides, options = {}) {
  const findings = [];
  const add = (rule, severity, message, slideId) => findings.push(slideId === void 0 ? { rule, severity, message } : { slideId, rule, severity, message });
  if (slides.length === 0) {
    add("deck-empty", "error", "The deck has no slides.");
    return findings;
  }
  const template = options.template ? getStorylineTemplate(options.template) : void 0;
  const answerFirst = options.answerFirst ?? template?.answerFirst ?? true;
  const seen = /* @__PURE__ */ new Set();
  for (const slide of slides) {
    if (seen.has(slide.id)) add("duplicate-id", "error", `Slide ID "${slide.id}" is used more than once.`, slide.id);
    seen.add(slide.id);
  }
  for (const slide of slides) {
    const headline = headlineOf(slide);
    const isAppendix = slide.role === "appendix";
    const isCover = slide.role === "cover";
    if (!headline) {
      add("title-present", "error", "No title. Write the slide's point as a sentence.", slide.id);
    } else if (!isAppendix) {
      const words = wordsOf(headline);
      const label = normaliseLabel(headline);
      const prefix = headline.includes(":") ? normaliseLabel(headline.slice(0, headline.indexOf(":"))) : "";
      const soften = (s) => isCover ? "tip" : s;
      if (TOPIC_LABELS.has(label)) {
        add(
          "title-claim",
          soften("error"),
          `"${headline}" is a topic label. Say what the audience should conclude from this slide.`,
          slide.id
        );
      } else if (words.length < 3) {
        add("title-claim", soften("warn"), `"${headline}" is under three words; it reads as a label, not a claim.`, slide.id);
      } else if (words.length <= 4 && edgeLabel(label)) {
        add("title-claim", soften("warn"), `"${headline}" reads like a section label. State the finding instead.`, slide.id);
      } else if (prefix && TOPIC_LABELS.has(prefix) && prefix !== "next") {
        add(
          "title-claim",
          soften("tip"),
          `"${headline}" opens with a section label. Lead with the claim; put the section in the eyebrow.`,
          slide.id
        );
      } else if (TOPIC_OPENING_RE.test(headline)) {
        add(
          "title-claim",
          soften("warn"),
          `"${headline}" opens like a topic ("${topicOpening(headline)}"), however long it runs. Say what the audience should conclude.`,
          slide.id
        );
      }
      if (words.length > MAX_TITLE_WORDS) {
        add(
          "title-length",
          "warn",
          `Title is ${words.length} words; keep it to ${MAX_TITLE_WORDS} or move detail to the body.`,
          slide.id
        );
      }
      if ((slide.role === "answer" || slide.role === "evidence") && !isSpecific(headline)) {
        add(
          "title-specific",
          "warn",
          `"${headline}" could describe any quarter. Put the quantity in the title: the number, or the from\u2192to it moved.`,
          slide.id
        );
      }
      if (/[.!?]["”’)]?\s+\S/.test(headline)) {
        add("one-idea", "tip", "Title has more than one sentence. One idea per slide: split it or pick one.", slide.id);
      }
    }
    if (!isAppendix && !sayOf(slide.notes)) {
      add("notes-present", "warn", "No talk track. Notes carry what you say; the title carries the claim.", slide.id);
    }
    if (headline && slide.role !== "plan" && slide.role !== "ask" && !isAppendix && hasClaimNumber(headline) && !SOURCE_RE.test(notesText(slide.notes)) && !(slide.source && slide.source.trim())) {
      add(
        "number-source",
        "warn",
        "The title has a number but no source. Name where it came from (a dashboard, query, test, survey, report, benchmark, logs, experiment or URL) and its window in the notes, or set the slide's `source`.",
        slide.id
      );
    }
  }
  const tagged = slides.some((s) => s.role);
  const inferred = tagged ? void 0 : inferRoles(slides);
  const roleAt = (s) => inferred ? inferred[slides.indexOf(s)] : s.role;
  const presented = slides.filter((s) => s.role !== "appendix");
  if (inferred) {
    add(
      "roles-missing",
      "warn",
      "No slide has a role. Roles were guessed from the titles for the answer-first and closing-ask checks; tag each slide's role for the rest."
    );
  }
  if (answerFirst) {
    const content = presented.filter((s) => roleAt(s) !== "cover");
    const at = content.findIndex((s) => roleAt(s) === "answer" || roleAt(s) === "recommendation");
    if (at === -1) {
      add(
        "answer-first",
        "error",
        inferred ? `No slide states the answer: "${headlineOf(slides[0])}" opens the deck without a conclusion. Put the result or recommendation first, with its number.` : "No slide states the answer or recommendation. Put the conclusion up front (role 'answer')."
      );
    } else if (at > 2) {
      add(
        "answer-first",
        "warn",
        `The answer arrives on content slide ${at + 1}. Move it into the first three; busy readers stop early.`,
        content[at].id
      );
    }
    const first = presented[0];
    const text = first ? headlineOf(first) : "";
    if (first && text && !isSpecific(text) && !OUTCOME_RE.test(text)) {
      add(
        "outcome-first",
        "tip",
        "Slide one names the work, not the outcome. Say what got faster, cheaper or safer for the business, and by how much.",
        first.id
      );
    }
  }
  const asks = presented.filter((s) => roleAt(s) === "ask");
  const last = presented[presented.length - 1];
  const closesOnQuestions = last && QUESTIONS_SLIDE_RE.test(headlineOf(last));
  if (asks.length === 0) {
    add(
      "closing-ask",
      "error",
      closesOnQuestions ? `The deck closes on "${headlineOf(last)}", so the ask is missing. End on the decision or action you need, from whom, by when, and take questions with it on screen.` : "No ask. End with the decision or action you need, from whom, by when.",
      closesOnQuestions ? last.id : void 0
    );
  } else if (last && roleAt(last) !== "ask") {
    add("closing-ask", "warn", "The deck doesn't end on the ask. Close on it so it's the last thing on screen.", last.id);
  }
  for (const ask of asks) {
    const text = `${headlineOf(ask)}. ${notesText(ask.notes)}`;
    const missing = [];
    if (!DECISION_RE.test(text)) missing.push("a decision or action verb");
    if (!hasOwner(text)) missing.push("an owner");
    if (!DATE_RE.test(text)) missing.push("a date");
    if (missing.length) {
      const relative = text.match(RELATIVE_DATE_RE)?.[0];
      const hints = [
        missing.includes("an owner") && `Name the team or role who acts ("platform leads", "the payments team", "VP Eng", an @handle); 'we', 'the team' and a bare name don't say whose it is.`,
        missing.includes("a date") && relative && `"${relative}" moves with the calendar; give a date such as 14 March.`
      ].filter(Boolean);
      add("ask-concrete", "warn", [`The ask is missing ${missing.join(", ")}.`, ...hints].join(" "), ask.id);
    }
  }
  for (let i = 1; i < slides.length && !inferred; i++) {
    const prev = slides[i - 1].role;
    const role = slides[i].role;
    if (!role || role !== prev || REPEATABLE_ROLES.includes(role)) continue;
    const message = role === "option" ? "Two option slides in a row. Compare the options side by side on one slide, on the same criteria." : `Two ${SLIDE_ROLES[role].label.toLowerCase()} slides in a row. Merge them, or give the second its own role.`;
    add("role-repeat", "warn", message, slides[i].id);
  }
  const count = presented.length;
  const budget = options.minutes ?? template?.minutes.max;
  if (options.minutes !== void 0 && count > 0) {
    if (count > options.minutes) {
      add(
        "deck-length",
        "warn",
        `${count} slides for ${options.minutes} minutes is under a minute each. Cut, merge, or move detail to the appendix.`
      );
    } else if (options.minutes / count > 2) {
      add(
        "deck-length",
        "tip",
        `${count} slides for ${options.minutes} minutes is over two minutes each. Fine for discussion; otherwise split a dense slide.`
      );
    }
  } else if (template && (count < template.slides.min || count > template.slides.max)) {
    add(
      "deck-length",
      "tip",
      `${count} presented slides; a ${template.name.toLowerCase()} usually runs ${template.slides.min}\u2013${template.slides.max}.`
    );
  }
  if (budget !== void 0) {
    const seconds = talkSeconds(slides);
    const floor = options.minutes ?? template.minutes.min;
    if (seconds > budget * 60) {
      add(
        "talk-time",
        "warn",
        `The talk track runs about ${Math.round(seconds / 60)} minutes at ${WORDS_PER_MINUTE} words a minute, over the ${budget}-minute budget.`
      );
    } else if (seconds < floor * 30 && presented.every((s) => sayOf(s.notes))) {
      add(
        "talk-time",
        "warn",
        `The talk track covers about ${formatDuration(seconds)} of the ${floor}-minute budget, under half. Write what you'll say in full sentences; a forwarded deck and the speaker view's clock both read it.`
      );
    }
  }
  return findings;
}
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return m ? `${m} min${sec ? ` ${sec} s` : ""}` : `${sec} s`;
}
function talkSeconds(slides) {
  const words = slides.filter((s) => s.role !== "appendix").reduce((sum, s) => sum + (sayOf(s.notes).match(/\S+/g)?.length ?? 0), 0);
  return Math.round(words / WORDS_PER_MINUTE * 60);
}
function storylineOf(slides) {
  return slides.map((slide, i) => {
    const entry = {
      number: i + 1,
      id: slide.id,
      title: headlineOf(slide),
      appendix: slide.role === "appendix"
    };
    if (slide.role) {
      entry.role = slide.role;
      entry.roleLabel = SLIDE_ROLES[slide.role].label;
    }
    return entry;
  });
}
function formatStoryline(slides) {
  return storylineOf(slides).map((e) => `${e.number}. ${e.roleLabel ? `[${e.roleLabel}] ` : ""}${e.title || "(untitled)"}`).join("\n");
}

// src/deck/player/Storyline.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var severityLabel = { error: "Fix", warn: "Check", tip: "Tip" };
function Storyline({
  slides,
  index,
  findings,
  onPick
}) {
  const entries = storylineOf(slides);
  const deckWide = findings?.filter((f) => !f.slideId) ?? [];
  const minutes = Math.round(talkSeconds(slides) / 6) / 10;
  return /* @__PURE__ */ jsxs4("div", { className: "uipack-deck-storyline", children: [
    /* @__PURE__ */ jsxs4("p", { className: "uipack-deck-storyline__intro", children: [
      "Read only the headlines. They should make the whole argument. Talk track \u2248 ",
      minutes,
      " min."
    ] }),
    deckWide.length > 0 && /* @__PURE__ */ jsx4("ul", { className: "uipack-deck-storyline__findings", "aria-label": "Deck checks", children: deckWide.map((f, i) => /* @__PURE__ */ jsxs4("li", { "data-severity": f.severity, children: [
      /* @__PURE__ */ jsx4("b", { children: severityLabel[f.severity] }),
      " ",
      f.message
    ] }, i)) }),
    /* @__PURE__ */ jsx4("ol", { children: entries.map((e, i) => {
      const own = findings?.filter((f) => f.slideId === e.id) ?? [];
      return /* @__PURE__ */ jsxs4("li", { "data-appendix": e.appendix ? "" : void 0, children: [
        /* @__PURE__ */ jsxs4("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
          /* @__PURE__ */ jsx4("span", { className: "uipack-deck-storyline__num", children: pad(e.number) }),
          /* @__PURE__ */ jsx4("span", { className: "uipack-deck-storyline__role", children: e.roleLabel ?? "\u2014" }),
          /* @__PURE__ */ jsx4("span", { className: "uipack-deck-storyline__title", children: e.title })
        ] }),
        own.length > 0 && /* @__PURE__ */ jsx4("ul", { className: "uipack-deck-storyline__findings", children: own.map((f, j) => /* @__PURE__ */ jsxs4("li", { "data-severity": f.severity, children: [
          /* @__PURE__ */ jsx4("b", { children: severityLabel[f.severity] }),
          " ",
          f.message
        ] }, j)) })
      ] }, e.id);
    }) })
  ] });
}

// src/deck/player/Overview.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function focusables(root) {
  return Array.from(root?.querySelectorAll(FOCUSABLE) ?? []).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0
  );
}
function Overview({
  slides,
  index,
  theme,
  findings,
  onPick,
  onClose
}) {
  const ref = useRef2(null);
  const [tab, setTab] = useState2("slides");
  const close = useRef2(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelector('[aria-current="true"]')?.focus();
    const made = [];
    for (let el = root; el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sibling of Array.from(el.parentElement.children)) {
        if (sibling === el || sibling.hasAttribute("inert")) continue;
        sibling.setAttribute("inert", "");
        made.push(sibling);
      }
    }
    const onDocumentKeyDown = (e) => {
      if (e.defaultPrevented || root.contains(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const items = focusables(root);
        items[e.shiftKey ? items.length - 1 : 0]?.focus();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
      for (const el of made) el.removeAttribute("inert");
    };
  }, []);
  const onKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const items = focusables(ref.current);
    const at = items.indexOf(document.activeElement);
    if (e.key === "Tab") {
      e.preventDefault();
      if (!items.length) return;
      const step = e.shiftKey ? -1 : 1;
      items[at < 0 ? e.shiftKey ? items.length - 1 : 0 : (at + step + items.length) % items.length].focus();
      return;
    }
    const tiles = items.filter((b) => b.dataset.tile !== void 0);
    const ti = tiles.indexOf(document.activeElement);
    if (ti >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      tiles[Math.min(Math.max(ti + (e.key === "ArrowRight" ? 1 : -1), 0), tiles.length - 1)].focus();
    }
  };
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      ref,
      className: "uipack-deck-overview",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "All slides",
      onKeyDown,
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: [
        /* @__PURE__ */ jsxs5("div", { className: "uipack-deck-overview__head", children: [
          /* @__PURE__ */ jsxs5("p", { children: [
            "All slides \xB7 ",
            slides.length
          ] }),
          /* @__PURE__ */ jsxs5("span", { className: "uipack-deck-overview__tabs", children: [
            /* @__PURE__ */ jsx5("button", { type: "button", "aria-pressed": tab === "slides", onClick: () => setTab("slides"), children: "Slides" }),
            /* @__PURE__ */ jsx5("button", { type: "button", "aria-pressed": tab === "storyline", onClick: () => setTab("storyline"), children: "Storyline" }),
            /* @__PURE__ */ jsx5("button", { type: "button", onClick: onClose, children: "Close" })
          ] })
        ] }),
        tab === "storyline" ? /* @__PURE__ */ jsx5(Storyline, { slides, index, findings, onPick }) : /* @__PURE__ */ jsx5("ol", { className: "uipack-deck-overview__grid", children: slides.map((s, i) => /* @__PURE__ */ jsx5("li", { children: /* @__PURE__ */ jsxs5("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
          /* @__PURE__ */ jsx5(SlideThumbnail, { slide: s, index: i, count: slides.length, theme }),
          /* @__PURE__ */ jsxs5("span", { children: [
            /* @__PURE__ */ jsx5("b", { children: pad(i + 1) }),
            " ",
            s.title
          ] })
        ] }) }, s.id)) })
      ]
    }
  );
}

// src/deck/player/Presenter.tsx
import { useEffect as useEffect2, useState as useState3 } from "react";
import { Fragment, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var clock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(Math.round(seconds) % 60)}`;
function slidePlan(slides, budget) {
  const own = slides.map((s) => s.role === "appendix" ? 0 : (notesOf(s)?.say.match(/\S+/g)?.length ?? 0) / WORDS_PER_MINUTE * 60);
  const total = own.reduce((a, b) => a + b, 0);
  const k = budget && total ? budget / total : 1;
  let at = 0;
  return own.map((sec) => {
    const start = at;
    at += sec * k;
    return { start, end: at };
  });
}
function Presenter({
  slides,
  index,
  theme,
  stage,
  cue,
  minutes
}) {
  const [started, setStarted] = useState3(() => Date.now());
  const [now, setNow] = useState3(() => Date.now());
  useEffect2(() => {
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - started) / 1e3));
  const plan = slidePlan(slides, minutes ? minutes * 60 : void 0);
  const budget = plan.length ? plan[plan.length - 1].end : 0;
  const { start, end } = plan[index] ?? { start: 0, end: 0 };
  const drift = elapsed > end ? elapsed - end : elapsed < start ? elapsed - start : 0;
  const pace = Math.abs(drift) < 15 ? "on pace" : drift > 0 ? `${clock(drift)} behind` : `${clock(-drift)} ahead`;
  const notes = notesOf(slides[index]);
  const upcoming = slides[index + 1];
  const role = slides[index].role;
  return /* @__PURE__ */ jsxs6("div", { className: "uipack-deck-presenter", children: [
    /* @__PURE__ */ jsx6("div", { className: "uipack-deck-presenter__current", children: stage }),
    /* @__PURE__ */ jsxs6("aside", { className: "uipack-deck-presenter__side", children: [
      /* @__PURE__ */ jsxs6("section", { className: "uipack-deck-presenter__next", children: [
        /* @__PURE__ */ jsx6("h3", { children: "Next press" }),
        cue && /* @__PURE__ */ jsx6("p", { className: "uipack-deck-presenter__cue", children: cue }),
        /* @__PURE__ */ jsx6("h3", { children: "Next slide" }),
        upcoming ? /* @__PURE__ */ jsx6(SlideThumbnail, { slide: upcoming, index: index + 1, count: slides.length, theme }) : /* @__PURE__ */ jsx6("p", { className: "uipack-deck-presenter__end", children: "End of deck" })
      ] }),
      /* @__PURE__ */ jsxs6("section", { className: "uipack-deck-presenter__clock", children: [
        /* @__PURE__ */ jsx6("span", { "aria-label": "Elapsed time", children: clock(elapsed) }),
        budget > 0 && /* @__PURE__ */ jsxs6("span", { className: "uipack-deck-presenter__budget", children: [
          /* @__PURE__ */ jsxs6("span", { "aria-label": minutes ? "Time budget" : "Talk track length", children: [
            "/ ",
            clock(budget)
          ] }),
          /* @__PURE__ */ jsxs6("span", { className: "uipack-deck-presenter__pace", "data-pace": Math.abs(drift) < 15 ? "on" : drift > 0 ? "behind" : "ahead", children: [
            pace,
            " \xB7 this slide ",
            clock(start),
            "\u2013",
            clock(end)
          ] }),
          /* @__PURE__ */ jsxs6("span", { className: "uipack-deck-presenter__bar", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx6("i", { style: { left: `${start / budget * 100}%`, width: `${(end - start) / budget * 100}%` } }),
            /* @__PURE__ */ jsx6("b", { style: { left: `${Math.min(1, elapsed / budget) * 100}%` } })
          ] })
        ] }),
        /* @__PURE__ */ jsx6(
          "button",
          {
            type: "button",
            onClick: () => {
              setStarted(Date.now());
              setNow(Date.now());
            },
            children: "Reset clock"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs6("section", { className: "uipack-deck-presenter__notes", children: [
        role && /* @__PURE__ */ jsxs6("p", { className: "uipack-deck-presenter__role", children: [
          /* @__PURE__ */ jsx6("b", { children: SLIDE_ROLES[role].label }),
          " answers \u201C",
          SLIDE_ROLES[role].question,
          "\u201D"
        ] }),
        /* @__PURE__ */ jsx6("h3", { children: "Say" }),
        /* @__PURE__ */ jsx6("p", { children: notes?.say ?? "No talk track for this slide." }),
        notes?.delivery && /* @__PURE__ */ jsxs6(Fragment, { children: [
          /* @__PURE__ */ jsx6("h3", { children: "Delivery" }),
          /* @__PURE__ */ jsx6("p", { children: notes.delivery })
        ] }),
        notes?.next && /* @__PURE__ */ jsxs6(Fragment, { children: [
          /* @__PURE__ */ jsx6("h3", { children: "Bridge" }),
          /* @__PURE__ */ jsx6("p", { children: notes.next })
        ] })
      ] })
    ] })
  ] });
}

// src/deck/player/Print.tsx
import { useEffect as useEffect3, useRef as useRef3 } from "react";
import { createPortal } from "react-dom";

// src/deck/player/details.ts
import { useState as useState4 } from "react";
function detailStopsOf(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll("[data-detail-stops]")).flatMap((part) => {
    const tour = (part.dataset.tour ?? "").split(" ");
    return (part.dataset.detailStops ?? "").split(" ").map(Number).filter((step) => step > 0).map((step) => {
      const id = tour[step - 1] ?? String(step);
      const detail = part.querySelector(`[data-bento-cell="${CSS.escape(id)}"] .uipack-deck-bento__detail`);
      return { step, label: detail?.firstElementChild?.textContent?.trim() || id };
    });
  });
}
function useDetailStops(ref, key) {
  const [stops, setStops] = useState4([]);
  useIsoLayoutEffect(() => {
    const next = detailStopsOf(ref.current);
    setStops((prev) => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
  }, [ref, key]);
  return stops;
}

// src/deck/player/Print.tsx
import { Fragment as Fragment2, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function Printout({ slides, theme, notes = false }) {
  return /* @__PURE__ */ jsx7("div", { className: "uipack-deck-print", "data-notes": notes ? "" : void 0, children: slides.map((s, i) => /* @__PURE__ */ jsx7(PrintSlide, { slide: s, index: i, count: slides.length, theme, notes }, s.id)) });
}
function PrintSlide({ slide: s, index: i, count, theme, notes }) {
  const ref = useRef3(null);
  const stops = useDetailStops(ref, s);
  const talk = notesOf(s);
  const page = (step, detail) => /* @__PURE__ */ jsxs7(
    "section",
    {
      ref: detail ? void 0 : ref,
      className: "uipack-deck-print__page",
      "data-tone": s.tone ?? "paper",
      "data-detail": detail ? "" : void 0,
      "aria-label": `${pad(i + 1)}: ${s.title}${detail ? `, detail: ${detail}` : ""}`,
      children: [
        /* @__PURE__ */ jsx7("div", { className: "uipack-deck-print__slide", children: /* @__PURE__ */ jsx7("div", { className: "uipack-deck-canvas", children: /* @__PURE__ */ jsx7(Layer, { slide: s, index: i, count, step, active: false, thumbnail: true, theme, reducedMotion: true }) }) }),
        notes && /* @__PURE__ */ jsxs7("div", { className: "uipack-deck-print__notes", children: [
          /* @__PURE__ */ jsxs7("p", { className: "uipack-deck-print__title", children: [
            /* @__PURE__ */ jsx7("span", { children: pad(i + 1) }),
            " ",
            s.title,
            detail && /* @__PURE__ */ jsx7(Fragment2, { children: " \xB7 detail" })
          ] }),
          /* @__PURE__ */ jsx7("h3", { children: detail ?? s.headline ?? s.title }),
          !detail && talk?.say && /* @__PURE__ */ jsx7("p", { children: talk.say })
        ] })
      ]
    },
    step
  );
  return /* @__PURE__ */ jsxs7(Fragment2, { children: [
    page(Infinity),
    stops.map((stop) => page(stop.step, stop.label))
  ] });
}
function PrintJob({
  slides,
  theme,
  title,
  notes,
  onDone
}) {
  const done = useRef3(onDone);
  done.current = onDone;
  useEffect3(() => {
    let cancelled = false;
    const previous = document.title;
    const finish = () => {
      window.removeEventListener("afterprint", finish);
      window.removeEventListener("focus", finish);
      document.title = previous;
      if (!cancelled) done.current();
      cancelled = true;
    };
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    void (async () => {
      await (document.fonts?.ready ?? Promise.resolve());
      await frame();
      await frame();
      if (cancelled) return;
      document.title = title;
      window.addEventListener("afterprint", finish);
      window.print();
      setTimeout(() => !cancelled && window.addEventListener("focus", finish, { once: true }), 0);
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", finish);
      window.removeEventListener("focus", finish);
      document.title = previous;
    };
  }, [title]);
  return createPortal(
    /* @__PURE__ */ jsx7("div", { className: "uipack-deck-print-root", children: /* @__PURE__ */ jsx7("div", { className: "uipack-deck", "data-theme": theme, children: /* @__PURE__ */ jsx7(Printout, { slides, theme, notes }) }) }),
    document.body
  );
}

// src/deck/player/Reader.tsx
import { useRef as useRef4 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function Reader({
  slides,
  theme,
  onPresent
}) {
  return /* @__PURE__ */ jsxs8("div", { className: "uipack-deck-read", children: [
    /* @__PURE__ */ jsxs8("div", { className: "uipack-deck-read__head", children: [
      /* @__PURE__ */ jsxs8("p", { children: [
        "Reading \xB7 ",
        slides.length,
        " slides"
      ] }),
      /* @__PURE__ */ jsx8("button", { type: "button", onClick: () => onPresent(0), children: "Present" })
    ] }),
    /* @__PURE__ */ jsx8("ol", { children: slides.map((s, i) => /* @__PURE__ */ jsx8(ReadItem, { slide: s, index: i, count: slides.length, theme, onPresent }, s.id)) })
  ] });
}
function ReadItem({
  slide: s,
  index: i,
  count,
  theme,
  onPresent
}) {
  const ref = useRef4(null);
  const stops = useDetailStops(ref, s);
  const notes = notesOf(s);
  return /* @__PURE__ */ jsxs8("li", { children: [
    /* @__PURE__ */ jsxs8("div", { ref, className: "uipack-deck-read__stills", children: [
      /* @__PURE__ */ jsx8(SlideThumbnail, { slide: s, index: i, count, theme }),
      stops.map((stop) => /* @__PURE__ */ jsxs8("figure", { className: "uipack-deck-read__detail", children: [
        /* @__PURE__ */ jsx8(SlideThumbnail, { slide: s, index: i, count, theme, step: stop.step }),
        /* @__PURE__ */ jsxs8("figcaption", { children: [
          "Detail \xB7 ",
          stop.label
        ] })
      ] }, stop.step))
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "uipack-deck-read__notes", children: [
      /* @__PURE__ */ jsxs8("p", { className: "uipack-deck-read__title", children: [
        /* @__PURE__ */ jsx8("span", { children: pad(i + 1) }),
        " ",
        s.title
      ] }),
      /* @__PURE__ */ jsx8("h2", { children: s.headline ?? s.title }),
      notes?.say && /* @__PURE__ */ jsx8("p", { children: notes.say }),
      /* @__PURE__ */ jsx8("button", { type: "button", onClick: () => onPresent(i), "aria-label": `Present from slide ${i + 1}: ${s.title}`, children: "Present from here" })
    ] })
  ] });
}

// src/deck/DeckPlayer.tsx
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function DeckPlayer(props) {
  if (props.slides.length === 0) return /* @__PURE__ */ jsx9(EmptyDeck, { ...props });
  return /* @__PURE__ */ jsx9(Player, { ...props });
}
function EmptyDeck({ title, theme = "light", className }) {
  return /* @__PURE__ */ jsx9(
    "div",
    {
      className: ["uipack-deck", className].filter(Boolean).join(" "),
      "data-theme": theme,
      role: "region",
      "aria-label": title,
      "aria-roledescription": "slide deck",
      children: /* @__PURE__ */ jsx9("div", { className: "uipack-deck-stage uipack-deck-empty", children: /* @__PURE__ */ jsx9("p", { children: "No slides" }) })
    }
  );
}
function Player({
  slides,
  id,
  title,
  theme = "light",
  transition = "advance",
  motion = "auto",
  mode = "audience",
  initial,
  onPositionChange,
  presenterHref,
  keyboard = "focus",
  view: initialView = "present",
  printNotes = false,
  lint = false,
  minutes,
  className
}) {
  const count = slides.length;
  const startIndex = (() => {
    const s = initial?.slide;
    const i = typeof s === "number" ? s : s ? slides.findIndex((x) => x.id === s) : 0;
    return Math.min(Math.max(i, 0), Math.max(count - 1, 0));
  })();
  const [view, setView] = useState5({ index: startIndex, step: initial?.step ?? 0, from: null, seq: 0 });
  const [overview, setOverview] = useState5(false);
  const [fullscreen, setFullscreen] = useState5(false);
  const [reading, setReading] = useState5(initialView === "read");
  const [printing, setPrinting] = useState5(false);
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = motion === "none" || prefersReduced;
  const { ref: stageRef, el: stageEl, scale } = useCanvasScale();
  const rootRef = useRef5(null);
  const fromRef = useRef5(null);
  const toRef = useRef5(null);
  const overviewButtonRef = useRef5(null);
  const [maxStep, setMaxStep] = useState5(0);
  const viewRef = useRef5(view);
  const commit = (next2) => {
    viewRef.current = next2;
    setView(next2);
  };
  const { settle, fly } = useLayerFlight(
    () => stageEl.current?.querySelectorAll(".uipack-deck-layer").forEach((el) => {
      el.style.zIndex = "";
      el.style.visibility = "";
    })
  );
  const go = useCallback2(
    (index, step = 0) => {
      const target = Math.min(Math.max(index, 0), count - 1);
      settle();
      const v = viewRef.current;
      commit(
        v.index === target ? { ...v, step, from: null } : { index: target, step, from: { index: v.index, step: v.step }, seq: v.seq + 1 }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );
  const next = useCallback2(() => {
    const v = viewRef.current;
    if (v.step < maxStep) commit({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go, maxStep]);
  const prev = useCallback2(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep);
    if (step > 0) commit({ ...v, step: step - 1 });
    else if (v.index > 0) go(v.index - 1, Infinity);
  }, [go, maxStep]);
  useIsoLayoutEffect(() => {
    const layer = toRef.current;
    if (!layer) return;
    setMaxStep(
      Array.from(layer.querySelectorAll("[data-build], [data-steps]")).reduce(
        (m, el) => Math.max(m, Number(el.getAttribute("data-build") ?? el.getAttribute("data-steps")) || 0),
        0
      )
    );
  }, [view.index, slides]);
  const [cue, setCue] = useState5("");
  useIsoLayoutEffect(() => {
    if (mode !== "presenter") return;
    setCue(nextCue(toRef.current, Math.min(view.step, maxStep), maxStep, slides[view.index + 1]));
  }, [mode, view.index, view.step, maxStep, slides]);
  useIsoLayoutEffect(() => {
    if (!view.from) return;
    const from2 = fromRef.current;
    const to = toRef.current;
    const seq = view.seq;
    const done = () => {
      settle();
      if (from2) from2.style.visibility = "hidden";
      if (viewRef.current.seq === seq) commit({ ...viewRef.current, from: null });
    };
    if (!from2 || !to || !scale) return done();
    const resolved = resolveTransition(view.from.index, view.index, (i) => slides[i]?.transition, transition);
    const started = runTransition({
      transition: resolved,
      from: from2,
      to,
      direction: view.index > view.from.index ? 1 : -1,
      scale,
      reducedMotion
    });
    fly(started, done);
  }, [view.seq]);
  const channel = useRef5(null);
  const remote = useRef5(false);
  const reported = useRef5({ index: view.index, step: view.step });
  useEffect4(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`uipack-deck:${id}`);
    channel.current = ch;
    ch.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "hello") {
        const v = viewRef.current;
        ch.postMessage({ type: "go", index: v.index, step: v.step });
      } else if (msg.type === "go" && typeof msg.index === "number") {
        const v = viewRef.current;
        if (v.index === msg.index && v.step === msg.step) return;
        remote.current = true;
        if (v.index === msg.index) commit({ ...v, step: msg.step ?? 0 });
        else go(msg.index, msg.step ?? 0);
      }
    };
    ch.postMessage({ type: "hello" });
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [id, go]);
  useEffect4(() => {
    const last = reported.current;
    if (last.index === view.index && last.step === view.step) return;
    reported.current = { index: view.index, step: view.step };
    onPositionChange?.({ index: view.index, step: view.step, id: slides[view.index].id });
    if (remote.current) {
      remote.current = false;
      return;
    }
    channel.current?.postMessage({ type: "go", index: view.index, step: view.step });
  }, [view.index, view.step]);
  const [canFullscreen, setCanFullscreen] = useState5(false);
  useEffect4(() => {
    setCanFullscreen(document.fullscreenEnabled !== false);
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void rootRef.current?.requestFullscreen?.();
    rootRef.current?.focus();
  };
  const openPresenter = () => {
    let href = presenterHref;
    if (!href) {
      const url = new URL(location.href);
      url.searchParams.set("presenter", "1");
      url.searchParams.set("slide", slides[view.index].id);
      href = url.toString();
    }
    window.open(href, `uipack-deck-speaker-${id}`, "popup,width=1280,height=820");
  };
  const closeOverview = () => {
    setOverview(false);
    requestAnimationFrame(() => overviewButtonRef.current?.focus());
  };
  const onKeyDown = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || overview || reading) return;
    const t = e.target;
    if (t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""], [data-deck-keys="own"]')) return;
    const onControl = Boolean(t?.closest?.("button, a, summary")) && t !== rootRef.current;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        prev();
        break;
      case " ":
      case "Enter":
        if (onControl) return;
        if (e.shiftKey) prev();
        else next();
        break;
      case "Home":
        go(0, 0);
        break;
      case "End":
        go(count - 1, Infinity);
        break;
      case "g":
      case "G":
      case "o":
        setOverview(true);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "s":
      case "S":
        if (mode === "presenter") return;
        openPresenter();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const keyHandler = useRef5(onKeyDown);
  keyHandler.current = onKeyDown;
  useEffect4(() => {
    if (keyboard !== "global") return;
    const handler = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      keyHandler.current(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard]);
  const swipe = useRef5(null);
  const onPointerDown = (e) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  };
  const current = slides[view.index];
  const from = view.from ? slides[view.from.index] : null;
  const stepNow = Math.min(view.step, maxStep);
  const atStart = view.index === 0 && stepNow === 0;
  const atEnd = view.index === count - 1 && view.step >= maxStep;
  const stage = /* @__PURE__ */ jsx9(
    "div",
    {
      ref: stageRef,
      className: "uipack-deck-stage",
      "data-tone": current.tone ?? "paper",
      onPointerDown,
      onPointerUp,
      onPointerCancel: () => swipe.current = null,
      children: /* @__PURE__ */ jsxs9("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: [
        from && view.from && /* @__PURE__ */ jsx9(
          Layer,
          {
            ref: fromRef,
            slide: from,
            index: view.from.index,
            count,
            step: view.from.step,
            active: false,
            theme,
            reducedMotion
          },
          `layer-${view.from.index}`
        ),
        /* @__PURE__ */ jsx9(
          Layer,
          {
            ref: toRef,
            slide: current,
            index: view.index,
            count,
            step: view.step,
            active: true,
            theme,
            reducedMotion
          },
          `layer-${view.index}`
        )
      ] })
    }
  );
  const controls = /* @__PURE__ */ jsx9(
    Controls,
    {
      slides,
      index: view.index,
      atStart,
      atEnd,
      mode,
      canFullscreen,
      fullscreen,
      overviewButtonRef,
      onPrev: prev,
      onNext: next,
      onRead: () => setReading(true),
      onPrint: () => setPrinting(true),
      onOverview: () => setOverview(true),
      onPresenter: openPresenter,
      onFullscreen: toggleFullscreen
    }
  );
  return /* @__PURE__ */ jsxs9(
    "div",
    {
      ref: rootRef,
      className: ["uipack-deck", className].filter(Boolean).join(" "),
      "data-theme": theme,
      "data-mode": mode,
      "data-motion": reducedMotion ? "none" : "auto",
      "data-index": view.index,
      "data-step": Number.isFinite(view.step) ? view.step : "all",
      "data-transitioning": view.from ? "" : void 0,
      role: "region",
      "aria-label": title,
      "aria-roledescription": "slide deck",
      "aria-keyshortcuts": "ArrowLeft ArrowRight Space Home End G F S",
      tabIndex: 0,
      onKeyDown,
      children: [
        initialView === "print" ? /* @__PURE__ */ jsx9(Printout, { slides, theme, notes: printNotes }) : reading ? /* @__PURE__ */ jsx9(
          Reader,
          {
            slides,
            theme,
            onPresent: (i) => {
              setReading(false);
              go(i, 0);
              requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
            }
          }
        ) : /* @__PURE__ */ jsxs9(Fragment3, { children: [
          mode === "presenter" ? /* @__PURE__ */ jsx9(
            Presenter,
            {
              slides,
              index: view.index,
              theme,
              stage,
              cue,
              minutes: minutes ?? (typeof lint === "object" ? lint.minutes : void 0)
            }
          ) : stage,
          controls
        ] }),
        printing && /* @__PURE__ */ jsx9(
          PrintJob,
          {
            slides,
            theme,
            title,
            notes: printNotes,
            onDone: () => {
              setPrinting(false);
              rootRef.current?.focus({ preventScroll: true });
            }
          }
        ),
        /* @__PURE__ */ jsxs9("p", { className: "uipack-deck-sr", "aria-live": "polite", children: [
          "Slide ",
          view.index + 1,
          " of ",
          count,
          ": ",
          current.title
        ] }),
        overview && /* @__PURE__ */ jsx9(
          Overview,
          {
            slides,
            index: view.index,
            theme,
            findings: lint ? lintDeck(slides, lint === true ? {} : lint) : void 0,
            onPick: (i) => {
              go(i, 0);
              setOverview(false);
              requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
            },
            onClose: closeOverview
          }
        )
      ]
    }
  );
}
function nextCue(layer, step, maxStep, upcoming) {
  const words = (el, max = 64) => {
    const t = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    return t.length > max ? `${t.slice(0, max - 1).trimEnd()}\u2026` : t;
  };
  if (layer && step < maxStep) {
    const next = step + 1;
    const tour = layer.querySelector("[data-tour]");
    if (tour) {
      const ids = (tour.dataset.tour ?? "").split(" ");
      if (next > ids.length) return `Build ${next} of ${maxStep}: camera pulls back to the whole grid`;
      const cell = tour.querySelector(`[data-bento-cell="${CSS.escape(ids[next - 1])}"]`);
      const label = words(cell?.querySelector(".uipack-deck-bento__detail > *")) || words(cell?.querySelector(".uipack-deck-bento-label")) || ids[next - 1];
      return `Build ${next} of ${maxStep}: camera to ${label}`;
    }
    const build = layer.querySelector(`[data-build="${next}"]`);
    return `Build ${next} of ${maxStep}${build ? `: ${words(build)}` : ""}`;
  }
  return upcoming ? `Next slide: ${upcoming.title}` : "End of deck";
}

// src/deck/bento.tsx
import {
  Children,
  isValidElement,
  useRef as useRef6,
  useState as useState6
} from "react";
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function BentoCell(_) {
  return null;
}
function bentoCamera(cell, view, maxScale = 3, fill2 = 0.94) {
  const s = Math.max(1, Math.min(view.w * fill2 / cell.w, view.h * fill2 / cell.h, maxScale));
  return {
    s,
    tx: view.w / 2 - s * (cell.x + cell.w / 2),
    ty: view.h / 2 - s * (cell.y + cell.h / 2)
  };
}
var bentoFocusAt = (step, tour) => step >= 1 && step <= tour.length ? tour[step - 1] : null;
function Bento({ columns = 6, rows = 4, tour = [], maxScale = 3, className, style, children }) {
  const { step, thumbnail } = useDeckSlide();
  const focus = bentoFocusAt(step, tour);
  const gridRef = useRef6(null);
  const [camera, setCamera] = useState6(null);
  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || !focus) return setCamera(null);
    const cell = grid.querySelector(`[data-bento-cell="${CSS.escape(focus)}"]`);
    if (!cell) return setCamera(null);
    setCamera(
      bentoCamera(
        { x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth, h: cell.offsetHeight },
        { w: grid.offsetWidth, h: grid.offsetHeight },
        maxScale
      )
    );
  }, [focus, maxScale]);
  const cells = Children.toArray(children).filter(
    (c) => isValidElement(c) && c.type === BentoCell
  );
  const detailStops = tour.map((id, i) => cells.some((c) => c.props.id === id && c.props.detail) ? i + 1 : 0).filter(Boolean);
  return /* @__PURE__ */ jsx10(
    "div",
    {
      className: ["uipack-deck-bento", className].filter(Boolean).join(" "),
      "data-steps": tour.length ? tour.length + 1 : void 0,
      "data-tour": tour.length ? tour.join(" ") : void 0,
      "data-detail-stops": detailStops.length ? detailStops.join(" ") : void 0,
      "data-still": thumbnail ? "" : void 0,
      "data-focus": focus ?? void 0,
      style,
      children: /* @__PURE__ */ jsx10(
        "div",
        {
          ref: gridRef,
          className: "uipack-deck-bento__grid",
          style: {
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            transform: camera ? `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` : void 0
          },
          children: cells.map(({ props: p }) => {
            const focused = focus === p.id;
            return /* @__PURE__ */ jsxs10(
              "div",
              {
                className: ["uipack-deck-bento__cell", p.className].filter(Boolean).join(" "),
                "data-bento-cell": p.id,
                "data-morph": p.id,
                "data-tone": p.tone && p.tone !== "surface" ? p.tone : void 0,
                "data-focused": focused ? "" : void 0,
                "data-dimmed": focus && !focused ? "" : void 0,
                style: { gridColumn: `span ${p.col ?? 2}`, gridRow: `span ${p.row ?? 1}` },
                children: [
                  /* @__PURE__ */ jsx10("div", { className: "uipack-deck-bento__face", "aria-hidden": focused && p.detail ? true : void 0, children: p.children }),
                  p.detail && /* @__PURE__ */ jsx10("div", { className: "uipack-deck-bento__detail", "aria-hidden": focused ? void 0 : true, children: p.detail })
                ]
              },
              p.id
            );
          })
        }
      )
    }
  );
}

// src/deck/starter.tsx
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
function starterDeck(template, { footer } = {}) {
  const t = getStorylineTemplate(template);
  return templateOutline(t).map((s, i) => {
    const beat = t.beats[i];
    return {
      id: s.id,
      title: s.title,
      headline: s.title,
      role: beat.role,
      render: () => /* @__PURE__ */ jsxs11(Slide, { eyebrow: `${SLIDE_ROLES[beat.role].label} \xB7 draft`, footer: footer ?? t.name, children: [
        /* @__PURE__ */ jsx11("h2", { className: "uipack-deck-heading", children: s.title }),
        /* @__PURE__ */ jsx11("p", { className: "uipack-deck-lede", children: beat.titlePattern }),
        /* @__PURE__ */ jsx11("p", { className: "uipack-deck-body uipack-deck-starter-note", children: beat.guidance })
      ] })
    };
  });
}

// src/deck/consulting/frame.tsx
import { Children as Children2 } from "react";
import { Fragment as Fragment4, jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
var cx = (...names) => names.filter(Boolean).join(" ");
function Tracker({ sections, current }) {
  const at = typeof current === "number" ? current : sections.indexOf(current);
  return /* @__PURE__ */ jsx12("nav", { className: "uipack-cx-tracker", "aria-label": "Sections", children: /* @__PURE__ */ jsx12("ol", { children: sections.map((s, i) => /* @__PURE__ */ jsxs12("li", { "aria-current": i === at ? "step" : void 0, "data-done": i < at ? "" : void 0, children: [
    /* @__PURE__ */ jsx12("i", { "aria-hidden": "true" }),
    s
  ] }, s)) }) });
}
function ConsultingSlide({
  tracker,
  title,
  subtitle,
  sticker,
  takeaway,
  takeawayLabel = "So what",
  notes,
  source,
  label,
  rows,
  className,
  children
}) {
  const { index } = useDeckSlide();
  return /* @__PURE__ */ jsxs12("div", { className: cx("uipack-deck-slide uipack-cx-slide", className), children: [
    (tracker || sticker) && /* @__PURE__ */ jsxs12("div", { className: "uipack-cx-top", children: [
      tracker ? /* @__PURE__ */ jsx12(Tracker, { ...tracker }) : /* @__PURE__ */ jsx12("span", {}),
      sticker && /* @__PURE__ */ jsx12("p", { className: "uipack-cx-sticker", children: sticker })
    ] }),
    /* @__PURE__ */ jsxs12("header", { className: "uipack-cx-head", children: [
      /* @__PURE__ */ jsx12("h2", { className: "uipack-cx-title", children: Children2.map(title, (child) => typeof child === "string" ? /* @__PURE__ */ jsx12("span", { children: child }) : child) }),
      subtitle && /* @__PURE__ */ jsx12("p", { className: "uipack-cx-subtitle", children: subtitle })
    ] }),
    /* @__PURE__ */ jsx12("div", { className: "uipack-cx-body", style: rows ? { gridTemplateRows: rows } : void 0, children }),
    takeaway && /* @__PURE__ */ jsxs12("aside", { className: "uipack-cx-takeaway", "aria-label": "So what", children: [
      /* @__PURE__ */ jsx12("b", { children: takeawayLabel }),
      /* @__PURE__ */ jsx12("p", { children: takeaway })
    ] }),
    /* @__PURE__ */ jsxs12("footer", { className: "uipack-deck-footer uipack-cx-footer", children: [
      /* @__PURE__ */ jsxs12("div", { className: "uipack-cx-footer__notes", children: [
        notes && notes.length > 0 && /* @__PURE__ */ jsx12("ol", { children: notes.map((n, i) => /* @__PURE__ */ jsxs12("li", { children: [
          /* @__PURE__ */ jsx12("span", { children: i + 1 }),
          n
        ] }, i)) }),
        source && /* @__PURE__ */ jsxs12("p", { children: [
          /* @__PURE__ */ jsx12("b", { children: "Source:" }),
          " ",
          source
        ] })
      ] }),
      /* @__PURE__ */ jsxs12("p", { className: "uipack-cx-footer__page", children: [
        label && /* @__PURE__ */ jsx12("span", { children: label }),
        /* @__PURE__ */ jsx12("b", { children: String(index + 1).padStart(2, "0") })
      ] })
    ] })
  ] });
}
function Ref({ n }) {
  return /* @__PURE__ */ jsx12("sup", { className: "uipack-cx-ref", children: n });
}
var placement = ({ cols = 12, rows = 1, col, row }) => ({
  gridColumn: col ? `${col} / span ${cols}` : `span ${cols}`,
  gridRow: row ? `${row} / span ${rows}` : `span ${rows}`
});
function Panel({ title, unit, callout, morphId, emphasis, className, children, ...grid }) {
  const body = /* @__PURE__ */ jsxs12(Fragment4, { children: [
    /* @__PURE__ */ jsxs12("header", { className: "uipack-cx-panel__head", children: [
      /* @__PURE__ */ jsxs12("div", { children: [
        /* @__PURE__ */ jsx12("h3", { children: title }),
        unit && /* @__PURE__ */ jsx12("p", { children: unit })
      ] }),
      callout && /* @__PURE__ */ jsx12("p", { className: "uipack-cx-panel__callout", children: callout })
    ] }),
    /* @__PURE__ */ jsx12("div", { className: "uipack-cx-panel__body", children })
  ] });
  const props = {
    className: cx("uipack-cx-panel", emphasis && "uipack-cx-panel--emphasis", className),
    style: placement(grid)
  };
  return morphId ? /* @__PURE__ */ jsx12(Morph, { id: morphId, as: "section", fit: "stretch", ...props, children: /* @__PURE__ */ jsx12("div", { className: "uipack-cx-panel__inner", children: body }) }) : /* @__PURE__ */ jsx12("section", { ...props, children: /* @__PURE__ */ jsx12("div", { className: "uipack-cx-panel__inner", children: body }) });
}
function SoWhat({ title = "So what", children, ...grid }) {
  return /* @__PURE__ */ jsxs12("aside", { className: "uipack-cx-sowhat", style: placement(grid), "aria-label": "So what", children: [
    /* @__PURE__ */ jsx12("b", { children: title }),
    /* @__PURE__ */ jsx12("div", { children })
  ] });
}

// src/deck/consulting/scale.ts
var CX_TYPE = {
  min: 20,
  tick: 20,
  label: 22,
  value: 22,
  callout: 22,
  quadrant: 20
};
var MIN_TEXT_PX = CX_TYPE.min;
function linearScale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const f = ((v) => span === 0 ? r0 : r0 + (v - d0) / span * (r1 - r0));
  f.domain = [d0, d1];
  f.range = [r0, r1];
  f.invert = (px) => r1 === r0 ? d0 : d0 + (px - r0) / (r1 - r0) * span;
  return f;
}
function niceStep(span, count = 5) {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}
function niceTicks(min, max, count = 5) {
  if (min === max) {
    const pad2 = Math.abs(min) || 1;
    min -= pad2;
    max += pad2;
  }
  if (min > max) [min, max] = [max, min];
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Number(v.toFixed(10)));
  return { domain: [lo, hi], ticks };
}
function zeroBasedDomain(values) {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  return lo === hi ? [0, 1] : [lo, hi];
}
function bandLayout(count, start, length, fill2 = 0.6, maxMark = 48) {
  if (count <= 0) return [];
  const size = length / count;
  const mark = Math.max(1, Math.min(size * fill2, maxMark));
  return Array.from({ length: count }, (_, index) => {
    const s = start + index * size;
    return { index, start: s, size, markStart: s + (size - mark) / 2, mark, centre: s + size / 2 };
  });
}
function waterfallBars(steps) {
  let level = 0;
  return steps.map((s) => {
    if (s.total) {
      const v = s.value ?? level;
      level = v;
      return { label: s.label, kind: "total", value: v, from: 0, to: v };
    }
    const d = s.value ?? 0;
    const from = level;
    level += d;
    return { label: s.label, kind: d >= 0 ? "up" : "down", value: d, from, to: level };
  });
}
function stackSegments(values, percent = false) {
  const clean = values.map((v) => Number.isFinite(v) && v > 0 ? v : 0);
  const total = clean.reduce((a, b) => a + b, 0);
  let acc = 0;
  return clean.map((v, series) => {
    const share = total > 0 ? v / total : 0;
    const len = percent ? share * 100 : v;
    const seg = { series, value: values[series], from: acc, to: acc + len, share };
    acc += len;
    return seg;
  });
}
var harveyQuarters = (level) => Math.max(0, Math.min(4, Math.round(level)));
function harveyWedge(level, cx2, cy, r) {
  const q = harveyQuarters(level);
  if (q === 0) return "";
  if (q === 4) return `M${cx2 - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const angle = q / 4 * Math.PI * 2;
  const x = cx2 + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const large = q > 2 ? 1 : 0;
  return `M${cx2} ${cy}L${cx2} ${cy - r}A${r} ${r} 0 ${large} 1 ${round(x)} ${round(y)}Z`;
}
function bubbleRadius(size, maxSize, maxRadius, minRadius = 8) {
  if (!(maxSize > 0) || !(size > 0)) return minRadius;
  return Math.max(minRadius, Math.sqrt(size / maxSize) * maxRadius);
}
function barPath(orientation, base, end, crossStart, thickness, radius = 4) {
  const len = Math.abs(end - base);
  const r = Math.max(0, Math.min(radius, len, thickness / 2));
  const dir = end >= base ? 1 : -1;
  if (orientation === "horizontal") {
    const y0 = crossStart;
    const y1 = crossStart + thickness;
    return [
      `M${round(base)} ${round(y0)}`,
      `H${round(end - dir * r)}`,
      `Q${round(end)} ${round(y0)} ${round(end)} ${round(y0 + r)}`,
      `V${round(y1 - r)}`,
      `Q${round(end)} ${round(y1)} ${round(end - dir * r)} ${round(y1)}`,
      `H${round(base)}Z`
    ].join("");
  }
  const x0 = crossStart;
  const x1 = crossStart + thickness;
  return [
    `M${round(x0)} ${round(base)}`,
    `V${round(end - dir * r)}`,
    `Q${round(x0)} ${round(end)} ${round(x0 + r)} ${round(end)}`,
    `H${round(x1 - r)}`,
    `Q${round(x1)} ${round(end)} ${round(x1)} ${round(end - dir * r)}`,
    `V${round(base)}Z`
  ].join("");
}
var round = (v) => Math.round(v * 100) / 100;
function textWidth(text, size, weight = 400) {
  let em = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) em += 0.58;
    else if (/[A-Z]/.test(ch)) em += /[MW]/.test(ch) ? 0.86 : 0.66;
    else if (/[a-z]/.test(ch)) em += /[mw]/.test(ch) ? 0.8 : /[iljtf]/.test(ch) ? 0.3 : 0.54;
    else if (ch === " ") em += 0.27;
    else if (/[.,:;'’|!]/.test(ch)) em += 0.28;
    else if (/[$%€£+−\-–—/()]/.test(ch)) em += 0.6;
    else em += 0.62;
  }
  return em * size * (weight === 600 ? 1.05 : 1);
}
function wrapToWidth(text, size, maxWidth, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidth(next, size) > maxWidth && lines.length < maxLines - 1) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function spreadLabels(ys, gap, min = -Infinity, max = Infinity) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => Math.min(Math.max(o.y, min), max));
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.length ? placed[placed.length - 1] - max : 0;
  if (overflow > 0) {
    placed[placed.length - 1] -= overflow;
    for (let k = placed.length - 2; k >= 0; k--) placed[k] = Math.min(placed[k], placed[k + 1] - gap);
  }
  const out = new Array(ys.length);
  order.forEach((o, k) => out[o.i] = placed[k]);
  return out;
}
function formatValue(value, options = {}) {
  const { decimals = 0, prefix = "", suffix = "", sign = false, compact = false } = options;
  let v = Math.abs(value);
  let unit = "";
  if (compact) {
    if (v >= 1e9) [v, unit] = [v / 1e9, "B"];
    else if (v >= 1e6) [v, unit] = [v / 1e6, "M"];
    else if (v >= 1e3) [v, unit] = [v / 1e3, "K"];
  }
  const body = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const isZero = Number(body.replace(/,/g, "")) === 0;
  const s = value < 0 && !isZero ? "\u2212" : sign && !isZero ? "+" : "";
  return `${s}${prefix}${body}${unit}${suffix}`;
}
var formatter = (options = {}) => (v) => formatValue(v, options);

// src/deck/consulting/charts/Annotation.tsx
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
function annotationGeometry(point, at, text, maxWidth = 260, align = "start", size = CX_TYPE.callout) {
  const lines = wrapToWidth(text, size, maxWidth, 4);
  const w = Math.max(...lines.map((l) => textWidth(l, size)));
  const h = lines.length * size * 1.25;
  const bx = align === "end" ? at.x - w : at.x;
  const box = { x: bx, y: at.y, w, h };
  const gap = 10;
  let x1;
  let y1;
  if (point.x < box.x - gap) {
    x1 = box.x - gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else if (point.x > box.x + w + gap) {
    x1 = box.x + w + gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else {
    x1 = Math.min(Math.max(point.x, box.x), box.x + w);
    y1 = point.y < box.y ? box.y - gap : box.y + h + gap;
  }
  return { lines, box, leader: { x1, y1, x2: point.x, y2: point.y } };
}
function Annotation({ x, y, tx, ty, text, width = 260, align = "start" }) {
  const g = annotationGeometry({ x, y }, { x: tx, y: ty }, text, width, align);
  const size = CX_TYPE.callout;
  const textX = align === "end" ? g.box.x + g.box.w : g.box.x;
  return /* @__PURE__ */ jsxs13("g", { className: "uipack-cx-callout", children: [
    /* @__PURE__ */ jsx13("line", { className: "uipack-cx-callout__leader", x1: g.leader.x1, y1: g.leader.y1, x2: x, y2: y }),
    /* @__PURE__ */ jsx13("circle", { className: "uipack-cx-callout__ring", cx: x, cy: y, r: 9 }),
    /* @__PURE__ */ jsx13("circle", { className: "uipack-cx-callout__dot", cx: x, cy: y, r: 3.5 }),
    /* @__PURE__ */ jsx13(
      "text",
      {
        x: textX,
        y: g.box.y + size * 0.85,
        fontSize: size,
        textAnchor: align,
        className: "uipack-cx-t uipack-cx-callout__text uipack-cx-halo",
        children: g.lines.map((l, i) => /* @__PURE__ */ jsx13("tspan", { x: textX, dy: i === 0 ? 0 : size * 1.25, children: l }, i))
      }
    )
  ] });
}

// src/deck/consulting/hooks.ts
import { useEffect as useEffect5, useRef as useRef7, useState as useState7 } from "react";
function useChartSize(fixed, fallback = { width: 640, height: 360 }) {
  const ref = useRef7(null);
  const [size, setSize] = useState7({
    width: fixed?.width ?? fallback.width,
    height: fixed?.height ?? fallback.height
  });
  const fixedW = fixed?.width;
  const fixedH = fixed?.height;
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || fixedW !== void 0 && fixedH !== void 0) return;
    const measure = () => {
      const w = fixedW ?? el.clientWidth;
      const h = fixedH ?? el.clientHeight;
      if (w > 0 && h > 0) setSize((s) => Math.abs(s.width - w) < 0.5 && Math.abs(s.height - h) < 0.5 ? s : { width: w, height: h });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedW, fixedH]);
  return { ref, ...size };
}
function useGrown() {
  const { active, thumbnail } = useDeckSlide();
  const [grown, setGrown] = useState7(!active || thumbnail);
  useEffect5(() => {
    if (grown) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return grown;
}

// src/deck/consulting/charts/shared.tsx
import { jsx as jsx14 } from "react/jsx-runtime";
var defaultFormat = (v) => formatValue(v, { decimals: Number.isInteger(v) ? 0 : 1 });
var fill = {
  accent: "var(--uipack-cx-accent)",
  context: "var(--uipack-cx-context)",
  total: "var(--uipack-cx-total)",
  good: "var(--uipack-cx-good)",
  bad: "var(--uipack-cx-bad)",
  series: (i) => `var(--uipack-cx-s${i % 4 + 1})`,
  seriesInk: (i) => `var(--uipack-cx-s${i % 4 + 1}-ink)`
};
function Frame({
  size,
  label,
  className,
  children
}) {
  const grown = useGrown();
  return /* @__PURE__ */ jsx14("div", { ref: size.ref, className: ["uipack-cx-chart", className].filter(Boolean).join(" "), "data-grown": grown ? "" : void 0, children: /* @__PURE__ */ jsx14(
    "svg",
    {
      className: "uipack-cx-svg",
      width: size.width,
      height: size.height,
      viewBox: `0 0 ${size.width} ${size.height}`,
      role: "img",
      "aria-label": label,
      children
    }
  ) });
}
var growStyle = (origin, delay = 0) => ({ transformOrigin: origin, "--uipack-cx-delay": `${delay}ms` });
function Text({
  x,
  y,
  size = CX_TYPE.label,
  anchor = "start",
  weight,
  muted,
  baseline = "central",
  halo,
  children,
  className
}) {
  return /* @__PURE__ */ jsx14(
    "text",
    {
      x,
      y,
      fontSize: Math.max(size, CX_TYPE.min),
      textAnchor: anchor,
      dominantBaseline: baseline,
      className: ["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong", halo && "uipack-cx-halo", className].filter(Boolean).join(" "),
      children
    }
  );
}
function Lines({ x, y, lines, size = CX_TYPE.label, anchor = "middle", weight, muted, top }) {
  const lh = size * 1.2;
  const y0 = top ? y + size * 0.8 : y - (lines.length - 1) * lh / 2;
  return /* @__PURE__ */ jsx14(
    "text",
    {
      x,
      y: y0,
      fontSize: Math.max(size, CX_TYPE.min),
      textAnchor: anchor,
      dominantBaseline: top ? "auto" : "central",
      className: ["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong"].filter(Boolean).join(" "),
      children: lines.map((l, i) => /* @__PURE__ */ jsx14("tspan", { x, dy: i === 0 ? 0 : lh, children: l }, i))
    }
  );
}

// src/deck/consulting/charts/BarChart.tsx
import { jsx as jsx15, jsxs as jsxs14 } from "react/jsx-runtime";
function BarChart({
  data,
  orientation = "horizontal",
  sort,
  format = defaultFormat,
  domain,
  reference,
  callout,
  alt,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const order = sort ?? (orientation === "horizontal" ? "desc" : "none");
  const rows = [...data];
  if (order !== "none") rows.sort((a, b) => order === "desc" ? b.value - a.value : a.value - b.value);
  const emphasis = rows.some((d) => d.highlight);
  const colour = (d) => !emphasis || d.highlight ? fill.accent : fill.context;
  const values = rows.map((d) => d.value);
  const dom = domain ?? zeroBasedDomain(reference ? [...values, reference.value] : values);
  const label = alt ?? `Bar chart. ${rows.map((d) => `${d.label}: ${format(d.value)}`).join("; ")}.`;
  const valueW = Math.max(...rows.map((d) => textWidth(format(d.value), CX_TYPE.value, 600))) + 14;
  const refTop = reference ? 40 : 4;
  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...rows.map((d) => textWidth(d.label, CX_TYPE.label))) + 20, W * 0.42);
    const x = linearScale(dom, [labelW, W - valueW]);
    const bands = bandLayout(rows.length, refTop, H - refTop, 0.62, 36);
    const zero2 = x(Math.max(dom[0], Math.min(0, dom[1])));
    return /* @__PURE__ */ jsxs14(Frame, { size, label, children: [
      reference && /* @__PURE__ */ jsxs14("g", { className: "uipack-cx-ref-line", children: [
        /* @__PURE__ */ jsx15("line", { x1: x(reference.value), x2: x(reference.value), y1: refTop - 8, y2: H }),
        /* @__PURE__ */ jsx15(Text, { x: x(reference.value), y: 14, size: CX_TYPE.tick, anchor: "middle", muted: true, halo: true, children: reference.label })
      ] }),
      rows.map((d, i) => {
        const b = bands[i];
        const end = x(d.value);
        const lines = wrapToWidth(d.label, CX_TYPE.label, labelW - 20, 2);
        return /* @__PURE__ */ jsxs14("g", { children: [
          /* @__PURE__ */ jsx15(Lines, { x: labelW - 16, y: b.centre, lines, anchor: "end", weight: d.highlight ? 600 : void 0 }),
          /* @__PURE__ */ jsx15(
            "path",
            {
              className: "uipack-cx-grow",
              "data-axis": "x",
              style: { ...growStyle(d.value >= 0 ? "0% 50%" : "100% 50%", i * 40), fill: colour(d) },
              d: barPath("horizontal", zero2, end, b.markStart, b.mark),
              children: /* @__PURE__ */ jsx15("title", { children: `${d.label}: ${format(d.value)}` })
            }
          ),
          /* @__PURE__ */ jsx15(Text, { x: d.value >= 0 ? end + 10 : end - 10, y: b.centre, anchor: d.value >= 0 ? "start" : "end", weight: 600, halo: true, children: format(d.value) })
        ] }, d.label);
      }),
      /* @__PURE__ */ jsx15("line", { className: "uipack-cx-axis", x1: zero2, x2: zero2, y1: refTop - 4, y2: H }),
      callout && (() => {
        const i = rows.findIndex((d) => d.label === callout.label);
        if (i < 0) return null;
        const px = x(rows[i].value);
        const py = bands[i].centre;
        return /* @__PURE__ */ jsx15(Annotation, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
      })()
    ] });
  }
  const labelLines = rows.map((d) => d.label);
  const bandsProbe = bandLayout(rows.length, 0, W, 0.56, 64);
  const wrapped = labelLines.map((l) => wrapToWidth(l, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 36;
  const y = linearScale(dom, [H - bottom, top]);
  const zero = y(Math.max(dom[0], Math.min(0, dom[1])));
  return /* @__PURE__ */ jsxs14(Frame, { size, label, children: [
    reference && /* @__PURE__ */ jsxs14("g", { className: "uipack-cx-ref-line", children: [
      /* @__PURE__ */ jsx15("line", { x1: 0, x2: W, y1: y(reference.value), y2: y(reference.value) }),
      /* @__PURE__ */ jsx15(Text, { x: W, y: y(reference.value) - 16, size: CX_TYPE.tick, anchor: "end", muted: true, children: reference.label })
    ] }),
    rows.map((d, i) => {
      const b = bandsProbe[i];
      const end = y(d.value);
      return /* @__PURE__ */ jsxs14("g", { children: [
        /* @__PURE__ */ jsx15(
          "path",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle(d.value >= 0 ? "50% 100%" : "50% 0%", i * 40), fill: colour(d) },
            d: barPath("vertical", zero, end, b.markStart, b.mark),
            children: /* @__PURE__ */ jsx15("title", { children: `${d.label}: ${format(d.value)}` })
          }
        ),
        /* @__PURE__ */ jsx15(Text, { x: b.centre, y: d.value >= 0 ? end - 16 : end + 16, anchor: "middle", weight: 600, halo: true, children: format(d.value) }),
        /* @__PURE__ */ jsx15(Lines, { x: b.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: d.highlight ? 600 : void 0 })
      ] }, d.label);
    }),
    /* @__PURE__ */ jsx15("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: zero, y2: zero }),
    callout && (() => {
      const i = rows.findIndex((d) => d.label === callout.label);
      if (i < 0) return null;
      const px = bandsProbe[i].centre;
      const py = y(rows[i].value);
      return /* @__PURE__ */ jsx15(Annotation, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}

// src/deck/consulting/charts/KpiTiles.tsx
import { jsx as jsx16, jsxs as jsxs15 } from "react/jsx-runtime";
function Sparkline({ values, width = 132, height = 44 }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i) => 6 + i / (values.length - 1) * (width - 12);
  const y = linearScale(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - 6, 6]);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  return /* @__PURE__ */ jsxs15("svg", { className: "uipack-cx-spark", width, height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx16("path", { className: "uipack-cx-spark__line", d }),
    /* @__PURE__ */ jsx16("circle", { className: "uipack-cx-spark__dot", cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 5 })
  ] });
}
var Arrow = ({ direction }) => /* @__PURE__ */ jsxs15("svg", { className: "uipack-cx-delta__arrow", width: "18", height: "18", viewBox: "0 0 18 18", "aria-hidden": "true", children: [
  direction === "up" && /* @__PURE__ */ jsx16("path", { d: "M9 2 L16 14 H2 Z" }),
  direction === "down" && /* @__PURE__ */ jsx16("path", { d: "M9 16 L16 4 H2 Z" }),
  direction === "flat" && /* @__PURE__ */ jsx16("path", { d: "M2 7 H16 V11 H2 Z" })
] });
function KpiTiles({ items, columns }) {
  const per = Math.max(1, columns ?? items.length);
  return /* @__PURE__ */ jsx16("ul", { className: "uipack-cx-kpis", style: { gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }, children: items.map((k, i) => /* @__PURE__ */ jsxs15(
    "li",
    {
      className: "uipack-cx-kpi",
      "data-highlight": k.highlight ? "" : void 0,
      "data-first-col": i % per === 0 ? "" : void 0,
      "data-last-col": i % per === per - 1 ? "" : void 0,
      "data-next-row": i >= per ? "" : void 0,
      children: [
        /* @__PURE__ */ jsx16("p", { className: "uipack-cx-kpi__label", children: k.label }),
        /* @__PURE__ */ jsxs15("div", { className: "uipack-cx-kpi__row", children: [
          /* @__PURE__ */ jsxs15("p", { className: "uipack-cx-kpi__value", children: [
            k.morphId ? /* @__PURE__ */ jsx16(Morph, { id: k.morphId, as: "span", children: k.value }) : /* @__PURE__ */ jsx16("span", { children: k.value }),
            k.unit && /* @__PURE__ */ jsx16("small", { children: k.unit })
          ] }),
          k.trend && /* @__PURE__ */ jsx16(Sparkline, { values: k.trend })
        ] }),
        k.delta && /* @__PURE__ */ jsxs15("p", { className: "uipack-cx-delta", "data-sentiment": k.delta.sentiment ?? "neutral", children: [
          /* @__PURE__ */ jsx16(Arrow, { direction: k.delta.direction }),
          /* @__PURE__ */ jsx16("b", { children: k.delta.text }),
          k.delta.period && /* @__PURE__ */ jsx16("span", { children: k.delta.period })
        ] }),
        k.note && /* @__PURE__ */ jsx16("p", { className: "uipack-cx-kpi__note", children: k.note })
      ]
    },
    k.label
  )) });
}

// src/deck/consulting/charts/LineChart.tsx
import { Fragment as Fragment5, jsx as jsx17, jsxs as jsxs16 } from "react/jsx-runtime";
function LineChart({
  x: periods,
  series,
  format = defaultFormat,
  tickFormat,
  domain,
  reference,
  annotate,
  alt,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const all = series.flatMap((s) => s.values.filter((v) => v !== null));
  const nice = niceTicks(Math.min(...all, reference?.value ?? Infinity), Math.max(...all, reference?.value ?? -Infinity), 4);
  const dom = domain ?? nice.domain;
  const ticks = domain ? niceTicks(domain[0], domain[1], 4).ticks.filter((t) => t >= domain[0] && t <= domain[1]) : nice.ticks;
  const tf = tickFormat ?? format;
  const emphasis = series.some((s) => s.highlight);
  const stroke = (s, i) => emphasis ? s.highlight ? fill.accent : fill.context : fill.series(i);
  const lastOf = (s) => {
    for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return i;
    return -1;
  };
  const endText = series.map((s) => {
    const li = lastOf(s);
    return { name: s.name, value: li >= 0 ? format(s.values[li]) : "" };
  });
  const endW = Math.max(...endText.map((e) => textWidth(`${e.name} ${e.value}`, CX_TYPE.label, 600))) + 30;
  const tickW = Math.max(...ticks.map((t) => textWidth(tf(t), CX_TYPE.tick))) + 14;
  const left = tickW;
  const right = W - endW;
  const top = 18;
  const bottom = H - CX_TYPE.tick - 22;
  const xs = (i) => periods.length <= 1 ? left : left + i / (periods.length - 1) * (right - left - 16) + 8;
  const ys = linearScale(dom, [bottom, top]);
  const label = alt ?? `Line chart, ${periods[0]} to ${periods[periods.length - 1]}. ${series.map((s) => `${s.name}: ${s.values.map((v) => v === null ? "n/a" : format(v)).join(", ")}`).join("; ")}.`;
  const ends = series.map((s) => {
    const li = lastOf(s);
    return li >= 0 ? { x: xs(li), y: ys(s.values[li]) } : null;
  });
  const placed = spreadLabels(ends.map((e) => e?.y ?? 0), CX_TYPE.label * 1.3, top, bottom);
  const everyN = Math.max(1, Math.ceil(Math.max(...periods.map((p) => textWidth(p, CX_TYPE.tick))) / Math.max(1, (right - left) / periods.length - 12)));
  return /* @__PURE__ */ jsxs16(Frame, { size, label, children: [
    ticks.map((t) => /* @__PURE__ */ jsxs16("g", { children: [
      /* @__PURE__ */ jsx17("line", { className: "uipack-cx-grid", x1: left, x2: right, y1: ys(t), y2: ys(t) }),
      /* @__PURE__ */ jsx17(Text, { x: left - 12, y: ys(t), size: CX_TYPE.tick, anchor: "end", muted: true, className: "uipack-cx-tabular", children: tf(t) })
    ] }, t)),
    reference && /* @__PURE__ */ jsxs16("g", { className: "uipack-cx-ref-line", children: [
      /* @__PURE__ */ jsx17("line", { x1: left, x2: right, y1: ys(reference.value), y2: ys(reference.value) }),
      /* @__PURE__ */ jsx17(Text, { x: left + 8, y: ys(reference.value) - 16, size: CX_TYPE.tick, muted: true, halo: true, children: reference.label })
    ] }),
    periods.map(
      (p, i) => i % everyN === 0 || i === periods.length - 1 ? /* @__PURE__ */ jsx17(Text, { x: xs(i), y: H - 10, size: CX_TYPE.tick, anchor: "middle", muted: true, baseline: "auto", children: p }, p) : null
    ),
    series.map((s, si) => {
      const pts = s.values.map((v, i) => v === null ? null : [xs(i), ys(v)]);
      let d = "";
      let pen = false;
      for (const p of pts) {
        if (!p) {
          pen = false;
          continue;
        }
        d += `${pen ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        pen = true;
      }
      const e = ends[si];
      const ly = placed[si];
      const nudged = e && Math.abs(ly - e.y) > 4;
      return /* @__PURE__ */ jsxs16("g", { "data-highlight": s.highlight ? "" : void 0, children: [
        /* @__PURE__ */ jsx17("path", { className: "uipack-cx-line uipack-cx-draw", pathLength: 1, d, style: { stroke: stroke(s, si) }, children: /* @__PURE__ */ jsx17("title", { children: `${s.name}: ${s.values.map((v, i) => `${periods[i]} ${v === null ? "n/a" : format(v)}`).join(", ")}` }) }),
        e && /* @__PURE__ */ jsxs16(Fragment5, { children: [
          /* @__PURE__ */ jsx17("circle", { className: "uipack-cx-dot", cx: e.x, cy: e.y, r: 6, style: { fill: stroke(s, si) } }),
          nudged && /* @__PURE__ */ jsx17("line", { className: "uipack-cx-leader", x1: e.x + 9, y1: e.y, x2: e.x + 20, y2: ly }),
          /* @__PURE__ */ jsxs16(
            "text",
            {
              x: e.x + 22,
              y: ly,
              fontSize: CX_TYPE.label,
              dominantBaseline: "central",
              className: ["uipack-cx-t", s.highlight || !emphasis ? "uipack-cx-t--strong" : "uipack-cx-t--muted"].join(" "),
              children: [
                s.name,
                " ",
                /* @__PURE__ */ jsx17("tspan", { className: "uipack-cx-t--strong", children: endText[si].value })
              ]
            }
          )
        ] })
      ] }, s.name);
    }),
    annotate && (() => {
      const si = typeof annotate.series === "number" ? annotate.series : series.findIndex((s) => s.name === annotate.series);
      const v = series[si]?.values[annotate.index];
      if (v === null || v === void 0) return null;
      const px = xs(annotate.index);
      const py = ys(v);
      return /* @__PURE__ */ jsx17(Annotation, { x: px, y: py, tx: px + annotate.dx, ty: py + annotate.dy, text: annotate.text, width: annotate.width, align: annotate.align });
    })()
  ] });
}

// src/deck/consulting/charts/Matrix2x2.tsx
import { jsx as jsx18, jsxs as jsxs17 } from "react/jsx-runtime";
function Matrix2x2({ x: xa, y: ya, points, quadrants, focus, maxRadius = 46, callout, alt, width, height }) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const fx = xa.format ?? defaultFormat;
  const fy = ya.format ?? defaultFormat;
  const xSplit = xa.split ?? (xa.domain[0] + xa.domain[1]) / 2;
  const ySplit = ya.split ?? (ya.domain[0] + ya.domain[1]) / 2;
  const yTicks = [ya.domain[0], ySplit, ya.domain[1]];
  const xTicks = [xa.domain[0], xSplit, xa.domain[1]];
  const tickW = Math.max(...yTicks.map((t) => textWidth(fy(t), CX_TYPE.tick))) + 12;
  const left = 34 + tickW;
  const right = W - 8;
  const top = 8;
  const bottom = H - 30 - 34;
  const xs = linearScale(xa.domain, [left, right]);
  const ys = linearScale(ya.domain, [bottom, top]);
  const maxSize = Math.max(...points.map((p) => p.size ?? 1));
  const midX = xs(xSplit);
  const midY = ys(ySplit);
  const quads = {
    tl: { x: left, y: top, w: midX - left, h: midY - top },
    tr: { x: midX, y: top, w: right - midX, h: midY - top },
    bl: { x: left, y: midY, w: midX - left, h: bottom - midY },
    br: { x: midX, y: midY, w: right - midX, h: bottom - midY }
  };
  const label = alt ?? `2 by 2 matrix: ${xa.label} against ${ya.label}. ${points.map((p) => `${p.label}: ${fx(p.x)}, ${fy(p.y)}${p.size !== void 0 ? `, size ${p.size}` : ""}`).join("; ")}.`;
  const sorted = [...points].sort((a, b) => (b.size ?? 1) - (a.size ?? 1));
  return /* @__PURE__ */ jsxs17(Frame, { size, label, children: [
    focus && /* @__PURE__ */ jsx18("rect", { className: "uipack-cx-quad-focus", ...{ x: quads[focus].x, y: quads[focus].y, width: quads[focus].w, height: quads[focus].h } }),
    /* @__PURE__ */ jsx18("rect", { className: "uipack-cx-plot-edge", x: left, y: top, width: right - left, height: bottom - top }),
    /* @__PURE__ */ jsx18("line", { className: "uipack-cx-split", x1: midX, x2: midX, y1: top, y2: bottom }),
    /* @__PURE__ */ jsx18("line", { className: "uipack-cx-split", x1: left, x2: right, y1: midY, y2: midY }),
    quadrants && ["tl", "tr", "bl", "br"].map((q, i) => {
      const r = quads[q];
      const atRight = q === "tr" || q === "br";
      const atBottom = q === "bl" || q === "br";
      const lines = wrapToWidth(quadrants[i].toUpperCase(), CX_TYPE.quadrant, r.w * 0.55, 2);
      const lh = CX_TYPE.quadrant * 1.25;
      return /* @__PURE__ */ jsx18(
        "text",
        {
          x: atRight ? r.x + r.w - 16 : r.x + 16,
          y: atBottom ? r.y + r.h - 16 - (lines.length - 1) * lh : r.y + 16 + CX_TYPE.quadrant * 0.8,
          fontSize: CX_TYPE.quadrant,
          textAnchor: atRight ? "end" : "start",
          className: "uipack-cx-quad-label",
          "data-focus": focus === q ? "" : void 0,
          children: lines.map((l, k) => /* @__PURE__ */ jsx18("tspan", { x: atRight ? r.x + r.w - 16 : r.x + 16, dy: k === 0 ? 0 : lh, children: l }, k))
        },
        q
      );
    }),
    yTicks.map((t) => /* @__PURE__ */ jsx18(Text, { x: left - 10, y: ys(t), size: CX_TYPE.tick, anchor: "end", muted: true, className: "uipack-cx-tabular", children: fy(t) }, `y${t}`)),
    xTicks.map((t, i) => /* @__PURE__ */ jsx18(Text, { x: xs(t), y: bottom + 24, size: CX_TYPE.tick, anchor: i === 0 ? "start" : i === 2 ? "end" : "middle", muted: true, className: "uipack-cx-tabular", children: fx(t) }, `x${t}`)),
    /* @__PURE__ */ jsx18(Text, { x: (left + right) / 2, y: H - 12, size: CX_TYPE.tick, anchor: "middle", weight: 600, baseline: "auto", children: `${xa.label} \u2192` }),
    /* @__PURE__ */ jsx18(
      "text",
      {
        transform: `translate(14 ${(top + bottom) / 2}) rotate(-90)`,
        fontSize: CX_TYPE.tick,
        textAnchor: "middle",
        dominantBaseline: "central",
        className: "uipack-cx-t uipack-cx-t--strong",
        children: `${ya.label} \u2192`
      }
    ),
    sorted.map((p, i) => {
      const cx2 = xs(p.x);
      const cy = ys(p.y);
      const r = bubbleRadius(p.size ?? 1, maxSize, maxRadius);
      const at = p.labelAt ?? "right";
      const lx = at === "right" ? cx2 + r + 10 : at === "left" ? cx2 - r - 10 : cx2;
      const ly = at === "top" ? cy - r - 18 : at === "bottom" ? cy + r + 20 : cy;
      return /* @__PURE__ */ jsxs17("g", { "data-highlight": p.highlight ? "" : void 0, children: [
        /* @__PURE__ */ jsx18(
          "circle",
          {
            className: "uipack-cx-bubble uipack-cx-grow",
            "data-axis": "both",
            cx: cx2,
            cy,
            r,
            style: { ...growStyle("50% 50%", i * 50), fill: p.highlight ? fill.accent : fill.context },
            children: /* @__PURE__ */ jsx18("title", { children: `${p.label}: ${xa.label} ${fx(p.x)}, ${ya.label} ${fy(p.y)}` })
          }
        ),
        /* @__PURE__ */ jsx18(Text, { x: lx, y: ly, anchor: at === "right" ? "start" : at === "left" ? "end" : "middle", weight: p.highlight ? 600 : void 0, halo: true, children: p.label })
      ] }, p.label);
    }),
    callout && (() => {
      const p = points.find((q) => q.label === callout.label);
      if (!p) return null;
      const px = xs(p.x);
      const py = ys(p.y);
      return /* @__PURE__ */ jsx18(Annotation, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}

// src/deck/consulting/charts/StackedBar.tsx
import { jsx as jsx19, jsxs as jsxs18 } from "react/jsx-runtime";
function StackedBar({
  categories,
  series,
  mode = "absolute",
  orientation = "vertical",
  format = defaultFormat,
  segmentFormat,
  totals = true,
  alt,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const percent = mode === "percent";
  const stacks = categories.map((c) => stackSegments([...c.values], percent));
  const sums = categories.map((c) => c.values.reduce((a, b) => a + Math.max(0, b), 0));
  const max = percent ? 100 : Math.max(...sums, 1);
  const fmtSeg = (s) => percent ? `${Math.round(s.share * 100)}%` : (segmentFormat ?? format)(s.value);
  const label = alt ?? `Stacked bar chart, ${series.join(", ")}. ${categories.map((c, i) => `${c.label}: ${stacks[i].map((s, k) => `${series[k]} ${fmtSeg(s)}`).join(", ")}`).join("; ")}.`;
  const legendH = 36;
  let lx = 0;
  const legend = series.map((name, i) => {
    const item = { name, i, x: lx };
    lx += 18 + 10 + textWidth(name, CX_TYPE.tick) + 28;
    return item;
  });
  const legendEl = /* @__PURE__ */ jsx19("g", { className: "uipack-cx-legend", children: legend.map((l) => /* @__PURE__ */ jsxs18("g", { children: [
    /* @__PURE__ */ jsx19("rect", { x: l.x, y: 6, width: 18, height: 18, rx: 2, style: { fill: fill.series(l.i) } }),
    /* @__PURE__ */ jsx19(Text, { x: l.x + 28, y: 15, size: CX_TYPE.tick, children: l.name })
  ] }, l.name)) });
  const segLabel = (s, k, cx2, cy, room, thick) => {
    const t = fmtSeg(s);
    if (thick < CX_TYPE.value + 8 || textWidth(t, CX_TYPE.value, 600) + 12 > room) return null;
    return /* @__PURE__ */ jsx19(
      "text",
      {
        x: cx2,
        y: cy,
        fontSize: CX_TYPE.value,
        textAnchor: "middle",
        dominantBaseline: "central",
        className: "uipack-cx-t--strong uipack-cx-seglabel",
        style: { fill: fill.seriesInk(k) },
        children: t
      }
    );
  };
  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...categories.map((c) => textWidth(c.label, CX_TYPE.label))) + 20, W * 0.4);
    const totalW = totals && !percent ? Math.max(...sums.map((s) => textWidth(format(s), CX_TYPE.value, 600))) + 14 : 4;
    const x = linearScale([0, max], [labelW, W - totalW]);
    const bands = bandLayout(categories.length, legendH + 8, H - legendH - 8, 0.62, 44);
    return /* @__PURE__ */ jsxs18(Frame, { size, label, children: [
      legendEl,
      categories.map((c, i) => {
        const b = bands[i];
        return /* @__PURE__ */ jsxs18("g", { children: [
          /* @__PURE__ */ jsx19(Lines, { x: labelW - 16, y: b.centre, lines: wrapToWidth(c.label, CX_TYPE.label, labelW - 20, 2), anchor: "end", weight: c.highlight ? 600 : void 0 }),
          /* @__PURE__ */ jsx19("g", { className: "uipack-cx-grow", "data-axis": "x", style: growStyle("0% 50%", i * 40), children: stacks[i].map((s, k) => {
            const x0 = x(s.from) + (k > 0 ? 1 : 0);
            const x1 = x(s.to) - (k < stacks[i].length - 1 ? 1 : 0);
            if (x1 - x0 <= 0.5) return null;
            return /* @__PURE__ */ jsxs18("g", { children: [
              /* @__PURE__ */ jsx19(
                "rect",
                {
                  style: { fill: fill.series(k) },
                  x: x0,
                  y: b.markStart,
                  width: x1 - x0,
                  height: b.mark,
                  children: /* @__PURE__ */ jsx19("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
                }
              ),
              segLabel(s, k, (x0 + x1) / 2, b.centre, x1 - x0, b.mark)
            ] }, k);
          }) }),
          totals && !percent && /* @__PURE__ */ jsx19(Text, { x: x(sums[i]) + 10, y: b.centre, weight: 600, children: format(sums[i]) })
        ] }, c.label);
      }),
      /* @__PURE__ */ jsx19("line", { className: "uipack-cx-axis", x1: labelW, x2: labelW, y1: legendH + 4, y2: H })
    ] });
  }
  const bandsProbe = bandLayout(categories.length, 0, W, 0.56, 88);
  const wrapped = categories.map((c) => wrapToWidth(c.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = legendH + (totals && !percent ? 40 : 12);
  const y = linearScale([0, max], [H - bottom, top]);
  return /* @__PURE__ */ jsxs18(Frame, { size, label, children: [
    legendEl,
    categories.map((c, i) => {
      const b = bandsProbe[i];
      return /* @__PURE__ */ jsxs18("g", { children: [
        /* @__PURE__ */ jsx19("g", { className: "uipack-cx-grow", "data-axis": "y", style: growStyle("50% 100%", i * 40), children: stacks[i].map((s, k) => {
          const last = k === stacks[i].length - 1;
          const y0 = y(s.from) - (k > 0 ? 1 : 0);
          const y1 = y(s.to) + (last ? 0 : 1);
          if (y0 - y1 <= 0.5) return null;
          return /* @__PURE__ */ jsxs18("g", { children: [
            last ? /* @__PURE__ */ jsx19(
              "path",
              {
                style: { fill: fill.series(k) },
                d: barPath("vertical", y0, y1, b.markStart, b.mark),
                children: /* @__PURE__ */ jsx19("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
              }
            ) : /* @__PURE__ */ jsx19(
              "rect",
              {
                style: { fill: fill.series(k) },
                x: b.markStart,
                y: y1,
                width: b.mark,
                height: y0 - y1,
                children: /* @__PURE__ */ jsx19("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
              }
            ),
            segLabel(s, k, b.centre, (y0 + y1) / 2, b.mark, y0 - y1)
          ] }, k);
        }) }),
        totals && !percent && /* @__PURE__ */ jsx19(Text, { x: b.centre, y: y(sums[i]) - 18, anchor: "middle", weight: 600, halo: true, children: format(sums[i]) }),
        /* @__PURE__ */ jsx19(Lines, { x: b.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: c.highlight ? 600 : void 0 })
      ] }, c.label);
    }),
    /* @__PURE__ */ jsx19("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: H - bottom, y2: H - bottom })
  ] });
}

// src/deck/consulting/charts/Waterfall.tsx
import { jsx as jsx20, jsxs as jsxs19 } from "react/jsx-runtime";
function Waterfall({ steps, format = defaultFormat, goodDirection = "up", domain, callout, alt, width, height }) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const bars = waterfallBars([...steps]);
  const levels = bars.flatMap((b) => [b.from, b.to]);
  const dom = domain ?? zeroBasedDomain(levels);
  const broken = dom[0] > 0;
  const bandsProbe = bandLayout(bars.length, 0, W, 0.62, 76);
  const wrapped = bars.map((b) => wrapToWidth(b.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 6, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 40;
  const y = linearScale(dom, [H - bottom, top]);
  const base = y(dom[0]);
  const label = alt ?? `Waterfall. ${bars.map((b) => `${b.label}: ${b.kind === "total" ? format(b.value) : (b.value >= 0 ? "+" : "") + format(b.value)}`).join("; ")}.`;
  const show = (b) => b.kind === "total" ? format(b.value) : `${b.value > 0 ? "+" : ""}${format(b.value)}`;
  return /* @__PURE__ */ jsxs19(Frame, { size, label, children: [
    bars.map((b, i) => {
      const band = bandsProbe[i];
      const next = bandsProbe[i + 1];
      const good = b.kind !== "total" && b.value >= 0 === (goodDirection === "up");
      const colour = b.kind === "total" ? fill.total : good ? fill.good : fill.bad;
      const yTop = y(Math.max(b.from, b.to));
      const yBot = b.kind === "total" ? base : y(Math.min(b.from, b.to));
      const h = Math.max(2, yBot - yTop);
      const labelY = yTop - 18;
      return /* @__PURE__ */ jsxs19("g", { "data-kind": b.kind, children: [
        b.kind === "total" ? /* @__PURE__ */ jsx20(
          "path",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle("50% 100%", i * 60), fill: colour },
            d: barPath("vertical", base, yTop, band.markStart, band.mark),
            children: /* @__PURE__ */ jsx20("title", { children: `${b.label}: ${show(b)}` })
          }
        ) : /* @__PURE__ */ jsx20(
          "rect",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle(b.kind === "up" ? "50% 100%" : "50% 0%", i * 60), fill: colour },
            x: band.markStart,
            y: yTop,
            width: band.mark,
            height: h,
            rx: 2,
            children: /* @__PURE__ */ jsx20("title", { children: `${b.label}: ${show(b)}` })
          }
        ),
        broken && b.kind === "total" && /* @__PURE__ */ jsx20(
          "path",
          {
            className: "uipack-cx-break",
            d: `M${band.markStart - 4} ${base - 18}l${band.mark + 8} -10M${band.markStart - 4} ${base - 8}l${band.mark + 8} -10`
          }
        ),
        next && /* @__PURE__ */ jsx20("line", { className: "uipack-cx-connector", x1: band.markStart + band.mark, x2: next.markStart, y1: y(b.to), y2: y(b.to) }),
        /* @__PURE__ */ jsxs19(
          "text",
          {
            x: band.centre,
            y: labelY,
            fontSize: CX_TYPE.value,
            textAnchor: "middle",
            dominantBaseline: "central",
            className: "uipack-cx-t uipack-cx-t--strong uipack-cx-halo",
            children: [
              b.kind !== "total" && /* @__PURE__ */ jsx20("tspan", { className: "uipack-cx-arrow", "aria-hidden": "true", children: b.value >= 0 ? "\u25B2 " : "\u25BC " }),
              show(b)
            ]
          }
        ),
        /* @__PURE__ */ jsx20(Lines, { x: band.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: b.kind === "total" ? 600 : void 0 })
      ] }, `${b.label}-${i}`);
    }),
    /* @__PURE__ */ jsx20("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: base, y2: base }),
    callout && (() => {
      const i = bars.findIndex((b2) => b2.label === callout.label);
      if (i < 0) return null;
      const b = bars[i];
      const px = bandsProbe[i].centre;
      const py = (y(b.from) + y(b.to)) / 2;
      return /* @__PURE__ */ jsx20(Annotation, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}

// src/deck/consulting/HarveyTable.tsx
import { jsx as jsx21, jsxs as jsxs20 } from "react/jsx-runtime";
var LEVEL_WORDS = ["None", "Low", "Medium", "High", "Full"];
function HarveyBall({ level, size = 36, label }) {
  const q = harveyQuarters(level);
  const r = size / 2 - 1.5;
  const c = size / 2;
  return /* @__PURE__ */ jsxs20(
    "svg",
    {
      className: "uipack-cx-harvey",
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      "aria-label": label ?? `${LEVEL_WORDS[q]} (${q} of 4)`,
      "data-level": q,
      children: [
        /* @__PURE__ */ jsx21("circle", { className: "uipack-cx-harvey__ring", cx: c, cy: c, r }),
        q > 0 && /* @__PURE__ */ jsx21("path", { className: "uipack-cx-harvey__fill", d: harveyWedge(q, c, c, r) })
      ]
    }
  );
}
function HarveyTable({ columns, rows, corner = "Option", showKey = true, keyNote = "Full ball = most favourable" }) {
  return /* @__PURE__ */ jsxs20("div", { className: "uipack-cx-harvey-table", children: [
    /* @__PURE__ */ jsxs20("table", { children: [
      /* @__PURE__ */ jsxs20("colgroup", { children: [
        /* @__PURE__ */ jsx21("col", {}),
        columns.map((c) => /* @__PURE__ */ jsx21("col", { style: c.width ? { width: c.width } : void 0 }, c.key))
      ] }),
      /* @__PURE__ */ jsx21("thead", { children: /* @__PURE__ */ jsxs20("tr", { children: [
        /* @__PURE__ */ jsx21("th", { scope: "col", children: corner }),
        columns.map((c) => /* @__PURE__ */ jsx21("th", { scope: "col", "data-kind": c.kind ?? "harvey", children: c.label }, c.key))
      ] }) }),
      /* @__PURE__ */ jsx21("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsxs20("tr", { "data-highlight": r.highlight ? "" : void 0, children: [
        /* @__PURE__ */ jsxs20("th", { scope: "row", children: [
          /* @__PURE__ */ jsxs20("span", { className: "uipack-cx-harvey-table__name", children: [
            r.label,
            r.highlight && /* @__PURE__ */ jsx21("em", { children: r.tag ?? "Recommended" })
          ] }),
          r.detail && /* @__PURE__ */ jsx21("span", { className: "uipack-cx-harvey-table__detail", children: r.detail })
        ] }),
        columns.map((c) => {
          const v = r.cells[c.key];
          return /* @__PURE__ */ jsx21("td", { "data-kind": c.kind ?? "harvey", children: (c.kind ?? "harvey") === "harvey" && typeof v === "number" ? /* @__PURE__ */ jsx21(HarveyBall, { level: v }) : v }, c.key);
        })
      ] }, i)) })
    ] }),
    showKey && /* @__PURE__ */ jsxs20("p", { className: "uipack-cx-harvey-key", children: [
      LEVEL_WORDS.map((w, q) => /* @__PURE__ */ jsxs20("span", { children: [
        /* @__PURE__ */ jsx21(HarveyBall, { level: q, size: 24, label: "" }),
        w
      ] }, w)),
      keyNote && /* @__PURE__ */ jsx21("span", { className: "uipack-cx-harvey-key__note", children: keyNote })
    ] })
  ] });
}
export {
  Annotation,
  BarChart,
  Bento,
  BentoCell,
  Build,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CX_TYPE,
  ConsultingSlide,
  DeckPlayer,
  DeckSlideContext,
  HarveyBall,
  HarveyTable,
  KpiTiles,
  LINT_RULES,
  LineChart,
  MAX_TITLE_WORDS,
  MIN_TEXT_PX,
  Matrix2x2,
  Morph,
  Panel,
  REPEATABLE_ROLES,
  Ref,
  SLIDE_ROLES,
  STORYLINE_TEMPLATES,
  Slide,
  SlideThumbnail,
  SoWhat,
  Sparkline,
  StackedBar,
  Tracker,
  WORDS_PER_MINUTE,
  Waterfall,
  annotationGeometry,
  bandLayout,
  barPath,
  bentoCamera,
  bentoFocusAt,
  bubbleRadius,
  deckMotion,
  flipFrom,
  formatStoryline,
  formatValue,
  formatter,
  getStorylineTemplate,
  harveyQuarters,
  harveyWedge,
  linearScale,
  lintDeck,
  niceStep,
  niceTicks,
  resolveTransition,
  runTransition,
  slideZoomFrame,
  slideZoomSamples,
  spreadLabels,
  stackSegments,
  starterDeck,
  storylineOf,
  talkSeconds,
  templateOutline,
  textWidth,
  useDeckSlide,
  waterfallBars,
  wrapToWidth,
  zeroBasedDomain
};
