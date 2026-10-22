import type { ReactNode } from "react";
import type { SpeechGuide } from "../presentations/types";
import type { SlideRole } from "./storyline";

export type DeckTheme = "light" | "dark";

/**
 * How a slide arrives. Going back plays the same transition in reverse.
 * - `advance` (default): the deck's one consistent move. The outgoing slide steps aside and
 *   the incoming slide's blocks settle in, in reading order.
 * - `morph`: elements wrapped in `<Morph id>` on both slides travel to their new place and size;
 *   everything else fades out and in. Keynote calls this Magic Move.
 * - `{ zoom: id }`: the camera flies into the `<Morph id>` element on the previous slide, and that
 *   element opens into this slide. Use it for "here is a part; now look inside it".
 * - `fade`: a plain crossfade. `none`: cut.
 */
export type DeckTransition = "advance" | "morph" | "fade" | "none" | { zoom: string };

export interface DeckRenderContext {
  /** Build step reached on this slide. `Infinity` means fully built. */
  step: number;
  /** False for the outgoing copy during a transition, thumbnails and the next-slide preview. */
  active: boolean;
  /** True in the overview grid and presenter previews. Render something cheap and still. */
  thumbnail: boolean;
  theme: DeckTheme;
  /** True when the viewer prefers reduced motion or `motion="none"` was passed. */
  reducedMotion: boolean;
}

export interface DeckSlide {
  /** Stable ID, used in URLs and by the presenter sync. */
  id: string;
  /** Short name for the overview, the counter and screen readers. */
  title: string;
  /** The action title on the slide: one sentence that states the point. Read in order, the
   * headlines should tell the whole argument (the storyline view and `lintDeck` check this). */
  headline?: string;
  /** What job the slide does in the argument. See `SLIDE_ROLES`. */
  role?: SlideRole;
  /** How this slide arrives. Defaults to the deck's `transition`, which defaults to `advance`. */
  transition?: DeckTransition;
  /** Background tone. The stage cross-fades between tones. */
  tone?: "paper" | "ink" | "accent";
  /** Talk track for the presenter view. A string is treated as `say`. */
  notes?: SpeechGuide | string;
  render: (context: DeckRenderContext) => ReactNode;
}

export interface DeckPosition {
  index: number;
  step: number;
}
