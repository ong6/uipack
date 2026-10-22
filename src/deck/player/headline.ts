// A dev-only check that each slide's on-slide heading still says its `headline`: the two are
// written separately, so an edit to one can leave the storyline view reading an old claim.
import { useEffect, useRef, type RefObject } from "react";
import type { DeckSlide } from "../types";

// Bundlers replace `process.env.NODE_ENV`; a page loading the module as is has no `process`.
declare const process: { env: { NODE_ENV?: string } } | undefined;
const DEV = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

/** Text as a reader sees it: spaces collapsed (no-break ones too), and no final full stop. */
const plain = (text: string) =>
  text
    .replace(/[\s ]+/g, " ")
    .trim()
    .replace(/\.$/, "");

/** The slide's `headline` and its on-slide heading (its first h1 or h2), when the two differ. */
export function headlineDrift(slide: DeckSlide, layer: Element): { headline: string; heading: string } | null {
  if (!slide.headline) return null;
  const el = layer.querySelector("h1, h2");
  if (!el) return null;
  const heading = plain(el.textContent ?? "");
  return heading === plain(slide.headline) ? null : { headline: slide.headline, heading };
}

/**
 * In development, warns once per slide when its on-slide heading differs from its `headline`
 * (read from the shown slide's layer after it renders). Silent in production builds.
 */
export function useHeadlineCheck(layerRef: RefObject<HTMLElement | null>, slide: DeckSlide) {
  const warned = useRef(new Set<string>());
  useEffect(() => {
    const layer = layerRef.current;
    if (!DEV || !layer || warned.current.has(slide.id)) return;
    const drift = headlineDrift(slide, layer);
    if (!drift) return;
    warned.current.add(slide.id);
    console.warn(
      `uipack/deck: slide "${slide.id}" says one thing on the slide and another in its headline (the storyline view reads the headline).\n  headline: ${drift.headline}\n  on slide: ${drift.heading}`,
    );
  }, [layerRef, slide]);
}
