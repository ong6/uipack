// Runs a slide change's transition once both layers are in the DOM, before the browser paints, and
// lands it by dropping the outgoing layer. A newer change replaces a running one (useLayerFlight).
import type { RefObject } from "react";
import { useIsoLayoutEffect, useLatest } from "../../env";
import { useLayerFlight } from "../../flight";
import { resolveTransition, runTransition } from "../transitions";
import type { DeckSlide, DeckTransition } from "../types";
import type { DeckView } from "./usePosition";

export interface DeckTransitionOptions {
  view: DeckView;
  viewRef: { readonly current: DeckView };
  commit: (next: DeckView) => void;
  fromRef: RefObject<HTMLDivElement | null>;
  toRef: RefObject<HTMLDivElement | null>;
  /** Screen pixels per canvas pixel; 0 until the stage is measured. */
  scale: number;
  slides: DeckSlide[];
  /** The deck's default transition. */
  transition: DeckTransition;
  reducedMotion: boolean;
  fly: ReturnType<typeof useLayerFlight>["fly"];
  settle: () => void;
}

export function useDeckTransition({
  view,
  viewRef,
  commit,
  fromRef,
  toRef,
  scale,
  slides,
  transition,
  reducedMotion,
  fly,
  settle,
}: DeckTransitionOptions) {
  // The effect runs once per slide change (view.seq), so it reads the rest through a ref.
  const latestRef = useLatest({ view, scale, slides, transition, reducedMotion });
  useIsoLayoutEffect(() => {
    const { view, scale, slides, transition, reducedMotion } = latestRef.current;
    if (!view.from) return;
    const from = fromRef.current;
    const to = toRef.current;
    const seq = view.seq;
    const done = () => {
      settle();
      // Hide the outgoing copy until React removes it, so it never flashes back at full opacity.
      if (from) from.style.visibility = "hidden";
      if (viewRef.current.seq === seq) commit({ ...viewRef.current, from: null });
    };
    if (!from || !to || !scale) return done();
    const resolved = resolveTransition(view.from.index, view.index, (i) => slides[i]?.transition, transition);
    const started = runTransition({
      transition: resolved,
      from,
      to,
      direction: view.index > view.from.index ? 1 : -1,
      scale,
      reducedMotion,
    });
    fly(started, done);
  }, [view.seq, latestRef, fromRef, toRef, viewRef, commit, fly, settle]);
}
