import type { DeckTransition } from "./types";
import { cubicBezier, lerpRect } from "../math";
import { smoothstep, zoomFrame, type Rect, type ZoomSample } from "../zoom-math";

/** Slides are authored on one fixed canvas and scaled to fit, so sizes in slides are canvas pixels. */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

/** The travel curve's control points: `deckMotion.travel` in CSS, and sampled where a move needs the eased value. */
const TRAVEL_CURVE = [0.55, 0, 0.15, 1] as const;

/** The deck's one clock. Every transition and build reads these, so a deck moves consistently. */
export const deckMotion = {
  quick: 160,
  base: 320,
  slow: 560,
  morph: 760,
  zoom: 1150,
  /** A bento camera move, cell to cell or back to the whole grid. */
  pan: 860,
  stagger: 45,
  /** When an advance's incoming blocks start: while the outgoing slide is still leaving (it is gone at `quick`), so no frame is blank. */
  handoff: 90,
  settle: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  // Literals, not built from the curves: a module-level call would keep this module in every bundle
  // that imports the deck entry, used or not. test/deck.test.tsx checks they match the curves.
  travel: "cubic-bezier(0.55, 0, 0.15, 1)",
  travelCurve: TRAVEL_CURVE,
  /** The zoom camera's progress (in log scale): moving by 10% of the clock, landing softly. */
  camera: "cubic-bezier(0.3, 0.05, 0.25, 1)",
} as const;

/** The zoom camera's eased progress: the same curve as `deckMotion.camera`, for sampled keyframes. */
const cameraEase = /*#__PURE__*/ cubicBezier(0.3, 0.05, 0.25, 1);

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

/**
 * The window a zoom opens the incoming slide in: the largest 16:9 box that fits inside the target
 * with a small margin, centred in it. The camera flies into this window, so the incoming slide is
 * drawn whole inside the target from the first frame (never cropped to the target's own shape) and
 * the target's box stays round it as a frame.
 */
export function slideZoomWindow(target: Rect, width = CANVAS_WIDTH, height = CANVAS_HEIGHT, margin = 0.06): Rect {
  const m = Math.min(target.w, target.h) * margin;
  const s = Math.max(0, Math.min((target.w - 2 * m) / width, (target.h - 2 * m) / height));
  const w = width * s;
  const h = height * s;
  return { x: target.x + (target.w - w) / 2, y: target.y + (target.h - h) / 2, w, h };
}

/**
 * Sampled keyframes for a zoom on the slide canvas. `forward` flies in; backwards plays the same
 * path out. The camera flies into the target's 16:9 window (`slideZoomWindow`): the outer slide
 * scales by Z^p about one fixed point and the inner slide by Z^(p-1) about the same point, so the
 * inner slide sits in the window, whole, for the whole flight and fills the canvas as it lands.
 * Scale is even in log space and p follows `deckMotion.camera`, so the camera is visibly moving
 * by 10% of the clock. The inner slide keeps the target's corner radius until the last stretch,
 * and appears in the first moments of the flight, as the target's own words leave.
 */
export function slideZoomSamples(
  target: Rect,
  forward: boolean,
  samples = 24,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  /** The target's corner radius, canvas pixels. */
  radius = 6,
): ZoomSample[] | null {
  const frame = zoomFrame(slideZoomWindow(target, width, height), width, height);
  if (!frame) return null;
  const out: ZoomSample[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = forward ? cameraEase(t) : 1 - cameraEase(t);
    // In the inner slide's own (unscaled) coordinates the corner is Z times larger; it squares off
    // as the slide lands, so the full frame has no rounded corners of its own.
    const corner = radius * frame.Z * (1 - smoothstep(0.6, 1, p));
    out.push({
      offset: t,
      p,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(0px round ${corner.toFixed(2)}px)`,
      innerOpacity: smoothstep(0.03, 0.12, p),
    });
  }
  return out;
}

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
  const aspectGap = Math.abs(Math.log(from.w / from.h / (to.w / to.h)));
  if (fit === "uniform" || (fit === "auto" && aspectGap < 0.25)) {
    // Match line height, so a heading that changes size keeps its letterforms.
    sx = sy;
  }
  return {
    transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
  };
}

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

/** A build not yet revealed: its own CSS keeps it hidden, so a transition must not fade it in. */
const unbuilt = (el: Element) => el.hasAttribute("data-build") && !el.hasAttribute("data-built");

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
    const radius = target ? parseFloat(getComputedStyle(target).borderTopLeftRadius) / scale || 0 : 0;
    const samples = local ? slideZoomSamples(local, zoomInto, 24, CANVAS_WIDTH, CANVAS_HEIGHT, radius) : null;
    if (!samples) kind = "fade";
    else {
      const frame = slideZoomFrame(slideZoomWindow(local!))!;
      const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
      inner.style.zIndex = "2";
      const timing = { duration: deckMotion.zoom, easing: "linear" };
      // The camera: the outer slide scales up about the fixed point, carrying the target's box with
      // it, opaque, from the first frame; the incoming slide rides inside the box's 16:9 window.
      play(
        outer,
        samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin })),
        timing,
      );
      play(
        inner,
        samples.map((s) => ({
          offset: s.offset,
          transform: s.inner,
          transformOrigin: origin,
          clipPath: s.clip,
          opacity: s.innerOpacity,
        })),
        timing,
      );
      // The target's own words leave as the slide inside it appears (they would read as doubled
      // text otherwise); its box stays as the frame the camera flies into.
      for (const child of Array.from(target!.children)) {
        play(
          child,
          samples.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0, 0.05, s.p) })),
          timing,
        );
      }
      // Its fill stays to the end, but its edge (border, ring) leaves in the middle of the flight,
      // once the slide inside has the eye, so the camera never drags thick scaled-up bars across the
      // screen as it lands.
      if (paintsBox(target!)) {
        const cs = getComputedStyle(target!);
        const edge = { borderColor: cs.borderTopColor, boxShadow: cs.boxShadow };
        const clear = { borderColor: "transparent", boxShadow: "none" };
        // The clock offsets at which the camera passes p = 0.42 and 0.66 (p runs down on a zoom out).
        const at = (p: number) => samples.find((s) => (zoomInto ? s.p >= p : s.p <= p))?.offset ?? 1;
        play(
          target!,
          zoomInto
            ? [edge, { ...edge, offset: at(0.42) }, { ...clear, offset: at(0.66) }, clear]
            : [clear, { ...clear, offset: at(0.66) }, { ...edge, offset: at(0.42) }, edge],
          timing,
        );
      }
      // Everything around the target clears over the first quarter of a zoom in (and returns over
      // the last quarter of a zoom out), before the camera has scaled it far enough to cut its words
      // off at the canvas edge: mid-flight only the target and the slide inside it are on screen.
      const around = partitionForMorph(outer, new Set([opts.transition.zoom!])).rest;
      const fade = zoomInto
        ? [{ opacity: 1, easing: "ease-in-out" }, { opacity: 0, offset: 0.25 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 0, offset: 0.75, easing: "ease-in-out" }, { opacity: 1 }];
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
      // Everywhere they pass: outgoing blocks on the way leave at once.
      const early: Rect[] = [];
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
        for (const p of [0, 0.1, 0.25, 0.45, 0.65, 0.85, 1]) early.push(lerpRect(start, rb, p));
        const fromB = flipFrom(ra, rb, scale, fit, text).transform;
        const fromA = flipFrom(rb, ra, scale, fit, text && 1 / text).transform;
        // Movement eases; the swap runs on clock time, so "8%" means the first 61 ms, not 8% of an
        // eased path that has barely started.
        const swap = { duration: deckMotion.morph, easing: "linear" };
        play(
          b,
          [
            { transformOrigin: "0 0", transform: fromB },
            { transformOrigin: "0 0", transform: "none" },
          ],
          travel,
        );
        play(b, [{ opacity: 0 }, { opacity: 1, offset: bIn }, { opacity: 1 }], swap);
        play(
          a,
          [
            { transformOrigin: "0 0", transform: "none" },
            { transformOrigin: "0 0", transform: fromA },
          ],
          travel,
        );
        play(
          a,
          [{ opacity: 1 }, { opacity: 1, offset: text ? 0 : bIn * 0.6 }, { opacity: 0, offset: aOut }, { opacity: 0 }],
          swap,
        );
      }
      // The outgoing slide clears early, so nothing else shares the screen with the travellers:
      // its blocks fade, and the boxes around a traveller (a tile, a panel) lose their paint.
      // Words on a traveller's line leave with its outgoing copy, so they never sit beside the larger
      // incoming copy that takes its place.
      const leave = { duration: deckMotion.quick, easing: deckMotion.exit };
      const besideOut = (el: HTMLElement) =>
        Boolean(el.parentElement && out.containers.includes(el.parentElement) && isText(el.parentElement));
      const crossed = (el: HTMLElement) => {
        const r = rectOf(el);
        return early.some((p) => overlaps(p, r));
      };
      // Blocks the traveller crosses leave at once, so it never passes over words. The rest of the
      // outgoing slide holds for a third of the flight and is gone by 60%, crossfading with the
      // incoming blocks (from 40%), so the slide never clears to a lone number on a blank page.
      // A large block (a grid of panels) is judged panel by panel.
      const fromArea = rectOf(from).w * rectOf(from).h;
      const outgoing = out.rest.flatMap((el) => {
        const r = rectOf(el);
        const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
        return r.w * r.h > fromArea / 6 && kids.length > 1 && crossed(el) ? kids : [el];
      });
      // Words that sit where the incoming slide has words of its own (an eyebrow, a heading) hand
      // over rather than crossfade, so two lines of text never print over each other: the outgoing
      // copy holds for a third of the flight and is gone by half, and the incoming one starts there.
      const incomingText = inn.rest.filter((el) => isText(el) && !unbuilt(el)).map(rectOf);
      const handedOver: Rect[] = [];
      for (const el of outgoing) {
        if (besideOut(el)) play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.morph * 0.08, easing: "linear" });
        else if (crossed(el)) play(el, [{ opacity: 1 }, { opacity: 0 }], leave);
        else if (isText(el) && incomingText.some((r) => overlaps(r, rectOf(el)))) {
          handedOver.push(rectOf(el));
          play(el, [{ opacity: 1 }, { opacity: 1, offset: 0.66, easing: "ease-in" }, { opacity: 0 }], {
            duration: deckMotion.morph * 0.5,
            easing: "linear",
          });
        } else
          play(el, [{ opacity: 1 }, { opacity: 1, offset: 0.55, easing: "ease-in-out" }, { opacity: 0 }], {
            duration: deckMotion.morph * 0.6,
            easing: "linear",
          });
      }
      for (const el of out.containers) if (paintsBox(el)) play(el, paintFrames(el, "from"), leave);
      // Incoming blocks settle in once the outgoing slide has cleared. Blocks a traveller still has
      // to cross, and words on its line (a title around a number), wait until it has nearly landed
      // in the gap left for it, so nothing fades in underneath it.
      const beside = (el: HTMLElement) =>
        Boolean(el.parentElement && inn.containers.includes(el.parentElement) && isText(el.parentElement));
      const underPath = (el: HTMLElement) => {
        const r = rectOf(el);
        return path.some((p) => overlaps(p, r));
      };
      // A large block (a grid of panels) is judged panel by panel, so one corner on the path
      // doesn't hold back the whole slide.
      const layerArea = rectOf(to).w * rectOf(to).h;
      const incoming = inn.rest
        .flatMap((el) => {
          const r = rectOf(el);
          const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
          return r.w * r.h > layerArea / 6 && kids.length > 1 && underPath(el) ? kids : [el];
        })
        .filter((el) => !unbuilt(el));
      let i = 0;
      for (const el of incoming) {
        if (beside(el) || underPath(el)) {
          play(el, [{ opacity: 0 }, { opacity: 1 }], {
            duration: deckMotion.base,
            delay: deckMotion.morph * 0.72,
            easing: deckMotion.settle,
          });
        } else {
          const after = isText(el) && handedOver.some((r) => overlaps(r, rectOf(el))) ? deckMotion.morph * 0.5 : 0;
          play(
            el,
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: deckMotion.slow,
              delay: Math.max(after, deckMotion.morph * 0.4 + Math.min(i++, 6) * deckMotion.stagger),
              easing: deckMotion.settle,
            },
          );
        }
      }
      for (const el of inn.containers) {
        if (paintsBox(el))
          play(el, paintFrames(el, "to"), {
            duration: deckMotion.slow,
            delay: deckMotion.morph * 0.4,
            easing: deckMotion.settle,
          });
      }
      // The incoming background (it paints over the outgoing layer) crosses over as the outgoing
      // slide finishes leaving, at 45–62% of the clock, so it never veils the outgoing panels
      // early; invisible when tones match.
      const bg = bgOf(to);
      if (bg)
        play(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 0.62 }, { opacity: 1 }], {
          duration: deckMotion.morph,
          easing: "linear",
        });
      return anims;
    }
  }

  if (kind === "advance") {
    from.style.zIndex = "2";
    const shift = 40 * direction;
    // The old slide steps aside on the base clock but is gone from view within `quick` (160 ms). The
    // new slide's blocks start at `handoff` (90 ms), while it is still leaving, so the two crossfade
    // and no frame between them is blank (a blink on a projector); their opposite slides keep the
    // overlap brief and readable.
    play(from, [{ transform: "none" }, { transform: `translateX(${-shift}px)` }], {
      duration: deckMotion.base,
      easing: deckMotion.exit,
    });
    play(from, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.quick, easing: "ease-in" });
    const blocks = blocksOf(to).filter((el) => !unbuilt(el));
    (blocks.length ? blocks : [to]).forEach((el, i) =>
      play(
        el,
        [
          { opacity: 0, transform: `translateX(${shift * 1.4}px)` },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: deckMotion.slow,
          delay: deckMotion.handoff + Math.min(i, 7) * deckMotion.stagger,
          easing: deckMotion.settle,
        },
      ),
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
