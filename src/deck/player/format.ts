import type { DeckNotes, DeckSlide } from "../types";

/** A rail dot's offset along the controls' progress line. */
export const railAt = (i: number, count: number) => `${count > 1 ? (i / (count - 1)) * 100 : 0}%`;
export const pad = (n: number) => String(n).padStart(2, "0");
/** A slide's talk track, with a plain-string `notes` read as what to say. */
export const notesOf = (slide?: DeckSlide): DeckNotes | undefined =>
  !slide?.notes ? undefined : typeof slide.notes === "string" ? { say: slide.notes, delivery: "", next: undefined } : slide.notes;
