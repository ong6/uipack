// The linter's vocabulary: the slide shape it reads, its rules and their wording, and its findings.
import { WORDS_PER_MINUTE, type SpeechGuide } from "../../speech";
import type { SlideRole } from "./roles";
import type { StorylineTemplateId } from "./templates";

/**
 * The minimal slide shape the linter reads. A `DeckSlide` already fits; add `role`, and
 * `headline` when the visible action title differs from the short overview `title`.
 */
export interface StorySlide {
  id: string;
  /** Short name. Used as the action title when `headline` is absent. */
  title: string;
  role?: SlideRole;
  /** Talk track. A string is treated as `say`. */
  notes?: (SpeechGuide & { stops?: Record<string, string> }) | string;
  /** The action title shown on the slide. */
  headline?: string;
  /** On-slide source line for the slide's numbers. */
  source?: string;
}

export type LintSeverity = "error" | "warn" | "tip";

export type LintRule =
  | "deck-empty"
  | "duplicate-id"
  | "title-present"
  | "title-claim"
  | "title-length"
  | "title-specific"
  | "one-idea"
  | "notes-present"
  | "number-source"
  | "roles-missing"
  | "answer-first"
  | "outcome-first"
  | "closing-ask"
  | "ask-concrete"
  | "role-repeat"
  | "deck-length"
  | "talk-time"
  | "template-beats";

export interface LintFinding {
  slideId?: string;
  rule: LintRule;
  severity: LintSeverity;
  message: string;
}

export interface LintOptions {
  /** Applies the template's answer-first setting and its slide and time ranges. */
  template?: StorylineTemplateId;
  /** Speaking time budget in minutes. */
  minutes?: number;
  /** Override the answer-first check. Defaults to the template's setting, else true. */
  answerFirst?: boolean;
}

/** The checklist, for docs and UI. `severity` is the strongest a rule reports. */
export const LINT_RULES: Readonly<Record<LintRule, { severity: LintSeverity; check: string }>> = {
  "deck-empty": { severity: "error", check: "The deck has at least one slide." },
  "duplicate-id": { severity: "error", check: "Slide IDs are unique (they appear in URLs and presenter sync)." },
  "title-present": { severity: "error", check: "Every slide has an action title." },
  "title-claim": {
    severity: "error",
    check: "The title states a claim of three or more words, not a topic label like 'Background' or 'Architecture'.",
  },
  "title-length": { severity: "warn", check: "The title is at most 14 words." },
  "title-specific": {
    severity: "warn",
    check:
      "An answer, evidence, problem or recommendation title quantifies its claim: a number that isn't a date or a version, a multiple or fraction ('twice', 'a third'), a number word with a unit ('three weeks', 'one engineer'), or a comparison of two quantities ('one meeting, not three'). A plan title carries a date or a number. A bare count ('two teams', 'one big improvement'), 'no regressions', adjectives and names don't count.",
  },
  "one-idea": { severity: "tip", check: "The title is one sentence: one idea per slide." },
  "notes-present": { severity: "warn", check: "Every presented slide has a talk track." },
  "number-source": {
    severity: "warn",
    check:
      "A number in a title names its source in the notes: a named artifact ('the search latency dashboard', 'load test 12', 'the Q3 user survey') or a URL, with no hedge ('trust me', 'someone mentioned', 'said so'); or in the slide's `source`.",
  },
  "roles-missing": {
    severity: "warn",
    check:
      "Slides are tagged with roles. Without them, roles are inferred from the titles and only the answer-first and closing-ask checks run.",
  },
  "answer-first": {
    severity: "error",
    check: "The answer or recommendation appears within the first three content slides.",
  },
  "outcome-first": {
    severity: "tip",
    check: "Slide one names the business outcome (faster, cheaper, safer, by how much), not the system that produced it.",
  },
  "closing-ask": { severity: "error", check: "The last presented slide is an ask." },
  "ask-concrete": {
    severity: "warn",
    check:
      "The ask names a decision or action, an owner (a team or role such as 'platform leads', 'the payments team', 'VP Eng' or an @handle; not 'we', 'the team', a bare name, 'owner TBD' or 'lead' as a verb) and a firm calendar date ('next quarter', 'Monday-ish' and 'next Monday maybe' are not).",
  },
  "role-repeat": {
    severity: "warn",
    check: "No two adjacent slides share a role, except evidence, mechanism, demo and appendix.",
  },
  "deck-length": { severity: "warn", check: "About one to two minutes per presented slide." },
  "talk-time": {
    severity: "warn",
    check: "The talk track fits the time budget at 135 words a minute, and covers at least half of it.",
  },
  "template-beats": {
    severity: "warn",
    check:
      "With a template, every beat it requires has a slide in that role: a decision request has its options, a postmortem its plan.",
  },
};

export const MAX_TITLE_WORDS = 14;
// The speaking pace (135 words a minute) is shared with the presentations entry's estimateSpeechSeconds.
export { WORDS_PER_MINUTE };
