import type { ReactNode } from "react";
import type { SpeechGuide } from "../speech";
import type { SlideRole } from "./storyline";
import type { SlotName } from "./budgets";

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

/** A slide's talk track: the shared speech guide, plus what to say at each camera stop. */
export interface DeckNotes extends SpeechGuide {
  /**
   * What to say at a camera stop, by the stop's cell ID (a bento `tour` entry): the relevant part
   * of `say`. The speaker view leads with it at that stop and the notes PDF prints it under that
   * stop's detail page; without it both show `say`.
   */
  stops?: Record<string, string>;
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
  /**
   * Invert the slide within its style: the style's inverse roles (dark ground in a light deck,
   * light ground in a dark one). Sugar for `tone: "ink"`; an explicit `tone` wins. It is a variant
   * of the style, not another style.
   */
  invert?: boolean;
  /** The eyebrow, as data, so `lintDeck` can check its budget (the archetype factories set it). */
  eyebrow?: string;
  /** The one-sentence lede, as data. */
  lede?: string;
  /** On-slide source line for the slide's numbers. */
  source?: string;
  /** Body points, as data: at most three, each within the `point` budget. */
  points?: readonly string[];
  /** Other slot text the slide declares, checked against `SLOT_BUDGETS`. */
  slots?: Partial<Record<SlotName, string>>;
  /** Talk track for the presenter view. A string is treated as `say`. */
  notes?: DeckNotes | string;
  render: (context: DeckRenderContext) => ReactNode;
}

export interface DeckPosition {
  index: number;
  step: number;
}
