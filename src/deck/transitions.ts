import type { DeckTransition } from "./types";
import { zoomFrame as zoomFrameAt, zoomSamples as zoomSamplesAt, type Rect } from "../zoom-math";

/** Slides are authored on one fixed canvas and scaled to fit, so sizes in slides are canvas pixels. */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

/** The deck's one clock. Every transition and build reads these, so a deck moves consistently. */
export const deckMotion = {
  quick: 160,
  base: 320,
  slow: 560,
  morph: 760,
  zoom: 1150,
  stagger: 45,
  settle: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  travel: "cubic-bezier(0.55, 0, 0.15, 1)",
} as const;

export type { Rect } from "../zoom-math";

export type TransitionKind = "advance" | "morph" | "fade" | "none" | "zoom";

export interface ResolvedTransition {
  kind: TransitionKind;
  zoom?: string;
}

/**
 * The transition between two positions. Adjacent moves use the later slide's transition, so going
 * back reverses the way you came in. Jumps (overview, Home/End) crossfade.
 */
export function resolveTransition(
  from: number,
  to: number,
  transitionOf: (index: number) => DeckTransition | undefined,
  fallback: DeckTransition = "advance",
): ResolvedTransition {
  if (from === to) return { kind: "none" };
  if (Math.abs(from - to) !== 1) return { kind: "fade" };
  const t = transitionOf(Math.max(from, to)) ?? fallback;
  return typeof t === "string" ? { kind: t } : { kind: "zoom", zoom: t.zoom };
}

/** The deck's zoom is the shared fixed-point zoom (`src/zoom-math.ts`) on the 1920×1080 canvas. */
export const zoomFrame = (target: Rect, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => zoomFrameAt(target, width, height);

/** Sampled keyframes for a zoom on the slide canvas. `forward` flies in; backwards plays the same path out. */
export const zoomSamples = (target: Rect, forward: boolean, samples = 24, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) =>
  zoomSamplesAt(target, forward, width, height, { samples, radius: 6 });

/**
 * FLIP: the transform that puts an element laid out at `to` where it was at `from`.
 * `scale` converts screen pixels back to canvas pixels. Similar shapes scale uniformly so text
 * keeps its proportions; differently shaped boxes stretch.
 */
export function flipFrom(
  from: Rect,
  to: Rect,
  scale: number,
  fit: "auto" | "uniform" | "stretch" = "auto",
  /** For text: the font-size ratio. Text may rewrap between slides, so its box shape is no guide. */
  textScale?: number,
) {
  if (textScale && fit !== "stretch") {
    return {
      transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${textScale.toFixed(4)})`,
    };
  }
  let sx = from.w / Math.max(to.w, 0.01);
  let sy = from.h / Math.max(to.h, 0.01);
  const aspectGap = Math.abs(Math.log((from.w / from.h) / (to.w / to.h)));
  if (fit === "uniform" || (fit === "auto" && aspectGap < 0.25)) {
    // Match line height, so a heading that changes size keeps its letterforms.
    sx = sy;
  }
  return {
    transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
  };
}

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** Top-level blocks of a slide, in reading order: what `advance` staggers in. */
export function blocksOf(layer: HTMLElement): HTMLElement[] {
  let node: Element = layer.querySelector(".uipack-deck-slide") ?? layer;
  if (node === layer) {
    while (node.children.length === 1 && node.firstElementChild) node = node.firstElementChild;
  }
  return Array.from(node.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement &&
      !el.classList.contains("uipack-deck-layer__bg") &&
      // The footer sits in the same place on every slide; it crossfades rather than moving.
      !el.classList.contains("uipack-deck-footer"),
  );
}

/**
 * Split a slide for a morph: matched elements travel; every other block that contains no matched
 * element fades as one piece.
 */
export function partitionForMorph(root: Element, keys: Set<string>) {
  const matched = new Map<string, HTMLElement>();
  const rest: HTMLElement[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) && !(child instanceof SVGElement)) continue;
      if (child.classList.contains("uipack-deck-layer__bg")) continue;
      const key = child.getAttribute("data-morph");
      if (key && keys.has(key)) matched.set(key, child as HTMLElement);
      else if (keys.size && child.querySelector(Array.from(keys, (k) => `[data-morph="${CSS.escape(k)}"]`).join(","))) walk(child);
      else rest.push(child as HTMLElement);
    }
  };
  walk(root);
  return { matched, rest };
}

const isText = (el: Element) => /^(H[1-6]|P|SPAN|B|STRONG|EM|SMALL|LABEL|Q|BLOCKQUOTE)$/.test(el.tagName);
const fontSizeOf = (el: Element) => parseFloat(getComputedStyle(el).fontSize) || 1;

const morphKeys = (layer: Element) =>
  new Set(Array.from(layer.querySelectorAll("[data-morph]"), (el) => el.getAttribute("data-morph")!));

export interface RunOptions {
  transition: ResolvedTransition;
  from: HTMLElement;
  to: HTMLElement;
  direction: 1 | -1;
  /** Screen pixels per canvas pixel. */
  scale: number;
  reducedMotion: boolean;
}

/** Start a transition between two mounted layers. Returns the animations so a caller can cancel them. */
export function runTransition(opts: RunOptions): Animation[] {
  const { from, to, direction, scale, reducedMotion } = opts;
  let { kind } = opts.transition;
  if (typeof from.animate !== "function") return [];
  if (reducedMotion && kind !== "none") kind = "fade";
  const anims: Animation[] = [];
  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    anims.push((el as HTMLElement).animate(keyframes, { fill: "both", ...options }));
  };
  const bgOf = (layer: HTMLElement) => layer.querySelector<HTMLElement>(":scope > .uipack-deck-layer__bg");

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
      h: box.h / scale,
    };
    const samples = local ? zoomSamples(local, zoomInto) : null;
    if (!samples) kind = "fade";
    else {
      const frame = zoomFrame(local!)!;
      const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
      inner.style.zIndex = "2";
      const timing = { duration: deckMotion.zoom, easing: "linear" };
      play(outer, samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin })), timing);
      play(inner, samples.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })), timing);
      // The target's own words give way as the slide inside it appears; its box stays as the frame.
      for (const child of Array.from(target!.children)) {
        play(child, samples.map((s) => ({ offset: s.offset, opacity: 1 - s.innerOpacity })), timing);
      }
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
      for (const key of shared) {
        const a = out.matched.get(key);
        const b = inn.matched.get(key);
        if (!a || !b) continue;
        const ra = rectOf(a);
        const rb = rectOf(b);
        const fit = (b.getAttribute("data-morph-fit") as "auto" | "uniform" | "stretch" | null) ?? "auto";
        const text = isText(a) && isText(b) ? fontSizeOf(a) / fontSizeOf(b) : undefined;
        // Text often rewraps between slides, so its two copies swap early and briefly while still
        // close together; shapes hold until the incoming copy is solid.
        const [x0, x1] = text ? [0.06, 0.32] : [0, 0.45];
        const fromB = flipFrom(ra, rb, scale, fit, text).transform;
        const fromA = flipFrom(rb, ra, scale, fit, text && 1 / text).transform;
        play(b, [
          { offset: 0, transformOrigin: "0 0", transform: fromB, opacity: 0 },
          { offset: x0, opacity: 0 },
          { offset: x1, opacity: 1 },
          { offset: 1, transformOrigin: "0 0", transform: "none", opacity: 1 },
        ], travel);
        play(a, [
          { offset: 0, transformOrigin: "0 0", transform: "none", opacity: 1 },
          { offset: text ? x0 : x1, opacity: 1 },
          { offset: text ? x1 : 1, opacity: 0 },
          { offset: 1, transformOrigin: "0 0", transform: fromA, opacity: 0 },
        ], travel);
      }
      for (const el of out.rest) play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.base * 0.75, easing: deckMotion.exit });
      inn.rest.forEach((el, i) =>
        play(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
          duration: deckMotion.slow,
          delay: deckMotion.morph * 0.5 + Math.min(i, 6) * deckMotion.stagger,
          easing: deckMotion.settle,
        }),
      );
      // The incoming background only shows once the travellers have crossed; it is invisible when tones match.
      const bg = bgOf(to);
      if (bg) play(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], travel);
      return anims;
    }
  }

  if (kind === "advance") {
    from.style.zIndex = "2";
    const shift = 40 * direction;
    play(from, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-shift}px)` }], {
      duration: deckMotion.base,
      easing: deckMotion.exit,
    });
    const blocks = blocksOf(to);
    (blocks.length ? blocks : [to]).forEach((el, i) =>
      play(el, [{ opacity: 0, transform: `translateX(${shift * 1.4}px)` }, { opacity: 1, transform: "none" }], {
        duration: deckMotion.slow,
        delay: deckMotion.quick * 0.6 + Math.min(i, 7) * deckMotion.stagger,
        easing: deckMotion.settle,
      }),
    );
    return anims;
  }

  if (kind === "fade") {
    from.style.zIndex = "2";
    play(from, [{ opacity: 1 }, { opacity: 0 }], {
      duration: reducedMotion ? deckMotion.quick : deckMotion.base,
      easing: "ease-out",
    });
  }
  return anims;
}
