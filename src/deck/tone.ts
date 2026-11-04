import type { DeckSlide } from "./types";

/** The tone a slide is painted in: its `tone`, else "ink" when it is inverted, else "paper". */
export const toneOf = (slide: Pick<DeckSlide, "tone" | "invert">): NonNullable<DeckSlide["tone"]> =>
  slide.tone ?? (slide.invert ? "ink" : "paper");
