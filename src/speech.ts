// What a presenter says over a slide, shared by uipack/presentations (SlideStarter, SpeakerGuide)
// and uipack/deck (a slide's notes, the storyline's timing), so neither entry imports the other.
// Types and constants only: no React, no DOM.

/** A slide's talk track: the words, how to deliver them, and the bridge to the next slide. */
export interface SpeechGuide {
  /** The words to say. Keep this conversational and short enough for one slide. */
  say: string;
  /** One practical cue for pace, emphasis, or where to direct attention. */
  delivery: string;
  /** Optional bridge into the following slide. */
  next?: string;
}

/** Speaking pace for timing a talk track: a steady presenting pace, slower than conversation. */
export const WORDS_PER_MINUTE = 135;
