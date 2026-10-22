import type { DeckTransition } from "./types";
import { smoothstep, zoomFrame, zoomSamples, type Rect } from "../zoom-math";

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

/**
 * The deck's zoom is the shared fixed-point zoom (`zoomFrame` in the root entry) on the 1920×1080
 * canvas. Named apart from the root's, whose third argument is a width, not a sample count.
 */
export const slideZoomFrame = (target: Rect, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => zoomFrame(target, width, height);

/** Sampled keyframes for a zoom on the slide canvas. `forward` flies in; backwards plays the same path out. */
export const slideZoomSamples = (target: Rect, forward: boolean, samples = 24, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) =>
  zoomSamples(target, forward, width, height, { samples, radius: 6 });

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

const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p,
});
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

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
 * element fades as one piece. `containers` are the elements walked into to reach a matched one
 * (a tile, a panel, a title around a number): they can't fade without taking the traveller with
 * them, so a transition fades their paint instead.
 */
export function partitionForMorph(root: Element, keys: Set<string>) {
  const matched = new Map<string, HTMLElement>();
  const rest: HTMLElement[] = [];
  const containers: HTMLElement[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) && !(child instanceof SVGElement)) continue;
      if (child.classList.contains("uipack-deck-layer__bg")) continue;
      const key = child.getAttribute("data-morph");
      if (key && keys.has(key)) matched.set(key, child as HTMLElement);
      else if (keys.size && child.querySelector(Array.from(keys, (k) => `[data-morph="${CSS.escape(k)}"]`).join(","))) {
        containers.push(child as HTMLElement);
        walk(child);
      } else rest.push(child as HTMLElement);
    }
  };
  walk(root);
  return { matched, rest, containers };
}

/** Whether an element paints a box of its own: a fill, a border or a shadow. */
function paintsBox(el: Element) {
  const cs = getComputedStyle(el);
  const clear = (c: string) => c === "transparent" || /rgba\(.*,\s*0\)$/.test(c);
  return (
    !clear(cs.backgroundColor) ||
    (parseFloat(cs.borderTopWidth) > 0 && !clear(cs.borderTopColor)) ||
    (parseFloat(cs.borderLeftWidth) > 0 && !clear(cs.borderLeftColor)) ||
    (cs.boxShadow && cs.boxShadow !== "none")
  );
}

/** Keyframes that take a box's paint (not its content) between visible and clear. */
function paintFrames(el: Element, visible: "from" | "to"): Keyframe[] {
  const cs = getComputedStyle(el);
  const shown = { backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor, boxShadow: cs.boxShadow };
  const clear = { backgroundColor: "transparent", borderColor: "transparent", boxShadow: "none" };
  return visible === "from" ? [shown, clear] : [clear, shown];
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
    const samples = local ? slideZoomSamples(local, zoomInto) : null;
    if (!samples) kind = "fade";
    else {
      const frame = slideZoomFrame(local!)!;
      const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
      inner.style.zIndex = "2";
      const timing = { duration: deckMotion.zoom, easing: "linear" };
      play(outer, samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin })), timing);
      play(inner, samples.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })), timing);
      // The target's own words leave before the slide inside it appears (they would read as doubled
      // text otherwise); its box stays as the frame.
      for (const child of Array.from(target!.children)) {
        play(child, samples.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0.01, 0.09, s.p) })), timing);
      }
      // Everything around the target clears in the first 30% of a zoom in (and returns in the last
      // 30% of a zoom out), so two dense slides never overlap: only the target and what opens
      // inside it are on screen mid-flight.
      const around = partitionForMorph(outer, new Set([opts.transition.zoom!])).rest;
      const fade = zoomInto
        ? [{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }];
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
      // Where the travellers still are in the second half of the flight, in screen pixels.
      const path: Rect[] = [];
      for (const key of shared) {
        const a = out.matched.get(key);
        const b = inn.matched.get(key);
        if (!a || !b) continue;
        const ra = rectOf(a);
        const rb = rectOf(b);
        const fit = (b.getAttribute("data-morph-fit") as "auto" | "uniform" | "stretch" | null) ?? "auto";
        const text = isText(a) && isText(b) ? fontSizeOf(a) / fontSizeOf(b) : undefined;
        // One copy is on screen at a time. Text may rewrap between slides, so the incoming copy takes
        // over in the first 8% of the flight, before either has moved, and travels alone. Shapes
        // crossfade while their boxes coincide, the incoming one solid by 30%.
        const [bIn, aOut] = text ? [0.08, 0.06] : [0.3, 0.36];
        const start = text ? { x: ra.x, y: ra.y, w: rb.w * text, h: rb.h * text } : ra;
        // Eased progress from about 45% of the flight on, when incoming blocks become visible.
        for (const p of [0.7, 0.85, 0.95]) path.push(lerpRect(start, rb, p));
        const fromB = flipFrom(ra, rb, scale, fit, text).transform;
        const fromA = flipFrom(rb, ra, scale, fit, text && 1 / text).transform;
        // Movement eases; the swap runs on clock time, so "8%" means the first 61 ms, not 8% of an
        // eased path that has barely started.
        const swap = { duration: deckMotion.morph, easing: "linear" };
        play(b, [{ transformOrigin: "0 0", transform: fromB }, { transformOrigin: "0 0", transform: "none" }], travel);
        play(b, [{ opacity: 0 }, { opacity: 1, offset: bIn }, { opacity: 1 }], swap);
        play(a, [{ transformOrigin: "0 0", transform: "none" }, { transformOrigin: "0 0", transform: fromA }], travel);
        play(a, [{ opacity: 1 }, { opacity: 1, offset: text ? 0 : bIn * 0.6 }, { opacity: 0, offset: aOut }, { opacity: 0 }], swap);
      }
      // The outgoing slide clears early, so nothing else shares the screen with the travellers:
      // its blocks fade, and the boxes around a traveller (a tile, a panel) lose their paint.
      const leave = { duration: deckMotion.quick, easing: deckMotion.exit };
      for (const el of out.rest) play(el, [{ opacity: 1 }, { opacity: 0 }], leave);
      for (const el of out.containers) if (paintsBox(el)) play(el, paintFrames(el, "from"), leave);
      // Incoming blocks settle in once the outgoing slide has cleared. Blocks a traveller still has
      // to cross, and words on its line (a title around a number), wait until it has nearly landed
      // in the gap left for it, so nothing fades in underneath it.
      const beside = (el: HTMLElement) => Boolean(el.parentElement && inn.containers.includes(el.parentElement) && isText(el.parentElement));
      const underPath = (el: HTMLElement) => {
        const r = rectOf(el);
        return path.some((p) => overlaps(p, r));
      };
      // A large block (a grid of panels) is judged panel by panel, so one corner on the path
      // doesn't hold back the whole slide.
      const layerArea = rectOf(to).w * rectOf(to).h;
      const incoming = inn.rest.flatMap((el) => {
        const r = rectOf(el);
        const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
        return r.w * r.h > layerArea / 6 && kids.length > 1 && underPath(el) ? kids : [el];
      });
      let i = 0;
      for (const el of incoming) {
        if (beside(el) || underPath(el)) {
          play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: deckMotion.base, delay: deckMotion.morph * 0.72, easing: deckMotion.settle });
        } else {
          play(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
            duration: deckMotion.slow,
            delay: deckMotion.morph * 0.4 + Math.min(i++, 6) * deckMotion.stagger,
            easing: deckMotion.settle,
          });
        }
      }
      for (const el of inn.containers) {
        if (paintsBox(el)) play(el, paintFrames(el, "to"), { duration: deckMotion.slow, delay: deckMotion.morph * 0.4, easing: deckMotion.settle });
      }
      // The incoming background crosses over while the outgoing slide clears; invisible when tones match.
      const bg = bgOf(to);
      if (bg) play(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.15 }, { opacity: 1, offset: 0.55 }, { opacity: 1 }], travel);
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
