// Where the deck is: the slide, its build step and the move in flight, with the moves a press makes
// (next, prev, go). The latest position is kept beside the state so quick repeated presses (a
// clicker's double tap) each apply to where the previous one left the deck, not to the last render.
import { useCallback, useRef, useState, type RefObject } from "react";
import { useIsoLayoutEffect } from "../../env";
import type { DeckSlide } from "../types";

export interface DeckView {
  index: number;
  step: number;
  /** The slide being left while a transition runs. */
  from: { index: number; step: number } | null;
  /** Bumped by every slide change, so a transition knows when a newer one replaced it. */
  seq: number;
}

/** The slide to open on: an index or a slide ID, clamped to the deck. */
export function startIndexOf(slides: readonly DeckSlide[], slide: string | number | undefined): number {
  const i = typeof slide === "number" ? slide : slide ? slides.findIndex((x) => x.id === slide) : 0;
  return Math.min(Math.max(i, 0), Math.max(slides.length - 1, 0));
}

/** The highest build step on a slide's layer: `data-build` on builds, `data-steps` on parts with their own stops (a bento tour). */
function buildsOn(layer: HTMLElement): number {
  return Array.from(layer.querySelectorAll("[data-build], [data-steps]")).reduce(
    (m, el) => Math.max(m, Number(el.getAttribute("data-build") ?? el.getAttribute("data-steps")) || 0),
    0,
  );
}

export interface DeckPositionOptions {
  slides: DeckSlide[];
  initial?: { slide?: string | number; step?: number };
  /** The current slide's layer, whose builds are counted after each slide change. */
  toRef: RefObject<HTMLDivElement | null>;
  /** Stops a running transition and leaves the layers at rest. */
  settle: () => void;
}

export function useDeckPosition({ slides, initial, toRef, settle }: DeckPositionOptions) {
  const count = slides.length;
  const [view, setView] = useState<DeckView>(() => ({
    index: startIndexOf(slides, initial?.slide),
    step: initial?.step ?? 0,
    from: null,
    seq: 0,
  }));
  const viewRef = useRef(view);
  const commit = useCallback((next: DeckView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  // The current slide's last build step, counted from its DOM after each slide change.
  const [maxStep, setMaxStep] = useState(0);
  useIsoLayoutEffect(() => {
    const layer = toRef.current;
    if (layer) setMaxStep(buildsOn(layer));
  }, [view.index, slides, toRef]);

  /** Show slide `index` at build `step` (Infinity: fully built), with a transition when the slide changes. */
  const go = useCallback(
    (index: number, step = 0) => {
      const target = Math.min(Math.max(index, 0), count - 1);
      settle();
      const v = viewRef.current;
      commit(
        v.index === target
          ? { ...v, step, from: null }
          : { index: target, step, from: { index: v.index, step: v.step }, seq: v.seq + 1 },
      );
    },
    [count, settle, commit],
  );

  const next = useCallback(() => {
    const v = viewRef.current;
    if (v.step < maxStep) commit({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go, maxStep, commit]);

  const prev = useCallback(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep);
    if (step > 0) commit({ ...v, step: step - 1 });
    else if (v.index > 0) go(v.index - 1, Infinity);
  }, [go, maxStep, commit]);

  return { view, viewRef, commit, go, next, prev, maxStep };
}
