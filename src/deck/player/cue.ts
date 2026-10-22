// The speaker view's cue for the next press: the next build, tour stop or slide.
import { useState, type RefObject } from "react";
import { useIsoLayoutEffect } from "../../env";
import type { DeckSlide } from "../types";

/**
 * What the next press does, for the speaker: the next build (its first words), the next tour stop
 * (the cell's detail title or label), the pull-back after a tour, or the next slide.
 */
export function nextCue(layer: HTMLElement | null, step: number, maxStep: number, upcoming: DeckSlide | undefined): string {
  const words = (el: Element | null | undefined, max = 64) => {
    const t = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
  };
  if (layer && step < maxStep) {
    const next = step + 1;
    const tour = layer.querySelector<HTMLElement>("[data-tour]");
    if (tour) {
      const ids = (tour.dataset.tour ?? "").split(" ");
      if (next > ids.length) return `Build ${next} of ${maxStep}: camera pulls back to the whole grid`;
      const cell = tour.querySelector(`[data-bento-cell="${CSS.escape(ids[next - 1])}"]`);
      const label =
        words(cell?.querySelector(".uipack-deck-bento__detail > *")) ||
        words(cell?.querySelector(".uipack-deck-bento-label")) ||
        ids[next - 1];
      return `Build ${next} of ${maxStep}: camera to ${label}`;
    }
    const build = layer.querySelector(`[data-build="${next}"]`);
    return `Build ${next} of ${maxStep}${build ? `: ${words(build)}` : ""}`;
  }
  return upcoming ? `Next slide: ${upcoming.title}` : "End of deck";
}

/** The camera stop a build step shows on a slide with a tour (a bento), by its cell ID; null elsewhere. */
export function stopAt(layer: HTMLElement | null, step: number): string | null {
  const tour = layer?.querySelector<HTMLElement>("[data-tour]");
  const ids = (tour?.dataset.tour ?? "").split(" ").filter(Boolean);
  return step >= 1 && step <= ids.length ? ids[step - 1] : null;
}

/**
 * The cue and the camera stop on screen, read from the current slide's layer after each move; only
 * the speaker view needs them.
 */
export function useNextCue(
  enabled: boolean,
  toRef: RefObject<HTMLElement | null>,
  index: number,
  step: number,
  maxStep: number,
  slides: DeckSlide[],
) {
  const [cue, setCue] = useState<{ cue: string; stop: string | null }>({ cue: "", stop: null });
  useIsoLayoutEffect(() => {
    if (!enabled) return;
    const at = Math.min(step, maxStep);
    setCue({ cue: nextCue(toRef.current, at, maxStep, slides[index + 1]), stop: stopAt(toRef.current, at) });
  }, [enabled, toRef, index, step, maxStep, slides]);
  return cue;
}
