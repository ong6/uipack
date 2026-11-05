import type { ReactNode } from "react";
import { Slide } from "./parts";
import { SLIDE_ROLES, getStorylineTemplate, templateOutline, type StorylineTemplateId } from "./storyline";
import type { DeckSlide } from "./types";

/**
 * A playable first draft of a storyline template: one slide per beat, with the template's example
 * short title and its fragment points (a presented deck), the title pattern and how to write it.
 * Every slide is a stub to replace: keep the `id` and `role`, rewrite `headline` and `points` with
 * your facts, then swap `render` for real content and add cue `notes`. `lintDeck` flags every slide
 * still missing its notes.
 */
export function starterDeck(template: StorylineTemplateId, { footer }: { footer?: ReactNode } = {}): DeckSlide[] {
  const t = getStorylineTemplate(template);
  return templateOutline(t).map((s, i) => {
    const beat = t.beats[i];
    return {
      id: s.id,
      title: s.title,
      headline: s.title,
      role: beat.role,
      points: beat.points,
      render: () => (
        <Slide footer={footer ?? t.name} layout="points">
          <h2 className="uipack-deck-heading">{s.title}</h2>
          <ul className="uipack-deck-points">
            {beat.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="uipack-deck-body uipack-deck-starter-note">
            {SLIDE_ROLES[beat.role].label} · draft. Title: {beat.titlePattern}. {beat.guidance}
          </p>
        </Slide>
      ),
    };
  });
}
