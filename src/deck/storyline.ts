/**
 * The content layer for decks: what each slide is for, proven storylines for the decks an engineer
 * gives inside a company, and a linter for the argument (not the pixels).
 *
 * Plain data and pure functions: no React, no DOM, no runtime imports but the shared speaking pace
 * (src/speech.ts). Everything here serialises
 * to JSON, so a CLI, an editor panel or the player's speaker view can all read it.
 *
 * Practice it encodes: answer first (Minto's pyramid), SCQA for decisions, action titles that
 * read as claims, the ghost-deck test (the titles alone tell the argument), one idea per slide,
 * numbers that carry a source, and a closing ask with a decision, an owner and a date.
 *
 * This barrel is the module's public face; the parts live in storyline/:
 * - roles.ts: slide roles and their purpose;
 * - templates.ts: the storylines, beat by beat;
 * - rules.ts: the slide shape the linter reads, its rules and findings;
 * - heuristics.ts: how titles, numbers, owners, dates and sources are read;
 * - checks.ts: each rule's check, lintDeck and talkSeconds;
 * - ghost.ts: the ghost deck (storylineOf, formatStoryline).
 */
export { SLIDE_ROLES, REPEATABLE_ROLES, type SlideRole, type SlideRoleInfo, type StoryMove } from "./storyline/roles";
export {
  STORYLINE_TEMPLATES,
  getStorylineTemplate,
  templateOutline,
  type StoryBeat,
  type StorylineTemplate,
  type StorylineTemplateId,
} from "./storyline/templates";
export {
  LINT_RULES,
  MAX_TITLE_WORDS,
  WORDS_PER_MINUTE,
  type StorySlide,
  type LintSeverity,
  type LintRule,
  type LintFinding,
  type LintOptions,
} from "./storyline/rules";
export { LINT_CHECKS, lintDeck, talkSeconds, type LintCheck } from "./storyline/checks";
export { storylineOf, formatStoryline, type StorylineEntry } from "./storyline/ghost";
