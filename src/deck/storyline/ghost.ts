// The ghost deck: the titles alone, in order with their roles. Read it alone; it should tell the argument.
import { SLIDE_ROLES, type SlideRole } from "./roles";
import type { StorySlide } from "./rules";
import { headlineOf } from "./heuristics";

export interface StorylineEntry {
  /** 1-based slide number. */
  number: number;
  id: string;
  /** The action title (`headline`, else `title`). */
  title: string;
  role?: SlideRole;
  roleLabel?: string;
  appendix: boolean;
}

/** The ghost deck: titles in order with their roles. Read it alone; it should tell the argument. */
export function storylineOf(slides: readonly StorySlide[]): StorylineEntry[] {
  return slides.map((slide, i) => {
    const entry: StorylineEntry = {
      number: i + 1,
      id: slide.id,
      title: headlineOf(slide),
      appendix: slide.role === "appendix",
    };
    if (slide.role) {
      entry.role = slide.role;
      entry.roleLabel = SLIDE_ROLES[slide.role].label;
    }
    return entry;
  });
}

/** The ghost deck as plain text, one line per slide, for copying into a doc or a review. */
export function formatStoryline(slides: readonly StorySlide[]): string {
  return storylineOf(slides)
    .map((e) => `${e.number}. ${e.roleLabel ? `[${e.roleLabel}] ` : ""}${e.title || "(untitled)"}`)
    .join("\n");
}
