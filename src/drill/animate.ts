import { smoothstep, zoomFrame, zoomSamples, type Rect } from "../zoom-math";

/** The drill-down clock. */
export const drillMotion = {
  zoom: 1000,
  fade: 320,
  reduced: 160,
} as const;

export interface DrillRunOptions {
  kind: "in" | "out" | "fade";
  /** Layer being left, and layer being opened. */
  from: HTMLElement;
  to: HTMLElement;
  /** The drillable node, inside the outer (parent) layer. */
  target: Element | null;
  stage: HTMLElement;
  /** Background source for the inner layer, so its dots line up with the canvas. */
  canvas: HTMLElement | null;
  reduced: boolean;
  duration?: number;
}

/** Visible copy of the node that opens `id` inside a layer: the wide or the narrow drawing, whichever is shown. */
export function findDrillNode(layer: Element, id: string): Element | null {
  const all = Array.from(layer.querySelectorAll(`[data-drill="${cssEscape(id)}"]`));
  return all.find((el) => el.getBoundingClientRect().width > 0) ?? all[0] ?? null;
}

const cssEscape = (s: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&"));

/** The node's box: the Node's own rect. */
const boxOf = (node: Element) => node.querySelector('[data-uipack="node"] > rect') ?? node;

/** Parts of the node that give way as the level inside appears; the box stays as the frame. */
const faceOf = (node: Element) =>
  Array.from(
    node.querySelectorAll<SVGElement>(
      '[data-uipack="node"] > :not(rect):not(.uipack__touch-target), .uipack-drill-node__mark',
    ),
  );

/** Give the inner layer the canvas background, aligned with the canvas so the swap at the end is seamless. */
function paintInner(inner: HTMLElement, canvas: HTMLElement | null) {
  if (!canvas) return;
  const cs = getComputedStyle(canvas);
  const c = canvas.getBoundingClientRect();
  const l = inner.getBoundingClientRect();
  inner.style.backgroundColor = cs.backgroundColor;
  inner.style.backgroundImage = cs.backgroundImage;
  inner.style.backgroundSize = cs.backgroundSize;
  inner.style.backgroundPosition = `${(c.left + canvas.clientLeft - l.left).toFixed(2)}px ${(c.top + canvas.clientTop - l.top).toFixed(2)}px`;
}

/** Undo what `runDrill` set directly on the layers. */
export function clearLayer(el: HTMLElement) {
  el.style.removeProperty("z-index");
  el.style.removeProperty("background-color");
  el.style.removeProperty("background-image");
  el.style.removeProperty("background-size");
  el.style.removeProperty("background-position");
  delete el.dataset.role;
}

/**
 * Start a move between two mounted layers. A zoom is one scale about a fixed
 * point: the parent grows by Z^p, the child by Z^(p-1), so the child stays
 * locked inside the node box while its clip (shaped like the box, with its
 * corner radius) opens to the whole stage. Returns the animations so the
 * caller can reverse or finish them; empty when the platform has no Web
 * Animations.
 */
export function runDrill(opts: DrillRunOptions): Animation[] {
  const { from, to, stage, canvas, reduced } = opts;
  if (typeof from.animate !== "function") return [];
  const anims: Animation[] = [];
  const play = (el: Element, keyframes: Keyframe[], timing: KeyframeAnimationOptions) => {
    anims.push((el as HTMLElement).animate(keyframes, { fill: "both", ...timing }));
  };
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  let kind = reduced ? "fade" : opts.kind;
  let samples: ReturnType<typeof zoomSamples> = null;
  let local: Rect | null = null;
  let k = 1;
  if (kind !== "fade" && opts.target) {
    const s = stage.getBoundingClientRect();
    const boxEl = boxOf(opts.target);
    const r = boxEl.getBoundingClientRect();
    local = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    // Screen pixels per user unit, for the corner radius.
    const userW = (boxEl as SVGRectElement).width?.baseVal?.value;
    if (userW) k = r.width / userW;
    samples = zoomSamples(local, kind === "in", W, H, { samples: 32, radius: 6 * k });
  }
  if (!samples || !local) kind = "fade";

  if (kind === "fade") {
    to.dataset.role = "inner";
    to.style.zIndex = "2";
    paintInner(to, canvas);
    const timing = { duration: reduced ? drillMotion.reduced : drillMotion.fade, easing: "ease" };
    play(to, [{ opacity: 0 }, { opacity: 1 }], timing);
    play(from, [{ opacity: 1 }, { opacity: 0 }], timing);
    return anims;
  }

  const forward = kind === "in";
  const outer = forward ? from : to;
  const inner = forward ? to : from;
  const frame = zoomFrame(local!, W, H)!;
  const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
  inner.dataset.role = "inner";
  inner.style.zIndex = "2";
  paintInner(inner, canvas);
  const timing = { duration: opts.duration ?? drillMotion.zoom, easing: "linear" };
  // At the end the child is a hair smaller than the stage; the parent leaves just before, so its
  // magnified node border never shows as a sliver at the edges.
  play(
    outer,
    samples!.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin, opacity: 1 - smoothstep(0.88, 0.99, s.p) })),
    timing,
  );
  play(
    inner,
    samples!.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })),
    timing,
  );
  // The node's words, preview and marker give way as the level inside appears.
  for (const part of faceOf(opts.target!)) {
    play(part, samples!.map((s) => ({ offset: s.offset, opacity: 1 - s.innerOpacity })), timing);
  }
  // The glow would balloon with the zoom: it leaves first.
  const halo = opts.target!.querySelector(".uipack-drill-node__halo");
  if (halo) play(halo, samples!.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0, 0.25, s.p) })), timing);
  return anims;
}
