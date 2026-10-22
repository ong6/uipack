import type { ReactNode } from "react";
import { Slide } from "./parts";
import { SLIDE_ROLES, getStorylineTemplate, templateOutline, type StorylineTemplateId } from "./storyline";
import type { DeckSlide } from "./types";

/**
 * A playable first draft of a storyline template: one slide per beat, titled with the template's
 * example claim, showing the title pattern and how to write it. Every slide is a stub to replace:
 * keep the `id` and `role`, rewrite `headline` with your facts, then swap `render` for real content
 * and add `notes`. `lintDeck` flags every slide still missing a talk track.
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
      render: () => (
        <Slide eyebrow={`${SLIDE_ROLES[beat.role].label} · draft`} footer={footer ?? t.name}>
          <h2 className="uipack-deck-heading">{s.title}</h2>
          <p className="uipack-deck-lede">{beat.titlePattern}</p>
          <p className="uipack-deck-body uipack-deck-starter-note">{beat.guidance}</p>
        </Slide>
      ),
    };
  });
}
