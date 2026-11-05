// The linter's vocabulary: the slide shape it reads, its rules and their wording, and its findings.
import { WORDS_PER_MINUTE, type SpeechGuide } from "../../speech";
import type { SlideRole } from "./roles";
import type { StorylineTemplateId } from "./templates";
import { TITLE_WORDS, type DeckMode, type SlotName } from "../budgets";

/**
 * The minimal slide shape the linter reads. A `DeckSlide` already fits; add `role`, and
 * `headline` when the visible action title differs from the short overview `title`.
 */
export interface StorySlide {
  id: string;
  /** Short name. Used as the on-slide title when `headline` is absent. */
  title: string;
  role?: SlideRole;
  /** Talk track. A string is treated as `say`. */
  notes?: (SpeechGuide & { stops?: Record<string, string> }) | string;
  /** The title shown on the slide: a short spoken verdict when presented, the full conclusion when read alone. */
  headline?: string;
  /** On-slide source line for the slide's numbers. */
  source?: string;
  /** The eyebrow above the headline, when the slide has one (optional, off by default), as data. */
  eyebrow?: string;
  /** The one-sentence lede under the headline, when the slide has one (optional, off by default), as data. */
  lede?: string;
  /** Body points, as data: 2–4 fragments, each within the `point` budget. */
  points?: readonly string[];
  /** Any other slot text the slide declares (quote, value, owner…), checked against `SLOT_BUDGETS`. */
  slots?: Partial<Record<SlotName, string>>;
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
  | "template-beats"
  | "slot-budget"
  | "notes-cues"
  | "slide-shape"
  | "ai-tells";

export interface LintFinding {
  slideId?: string;
  rule: LintRule;
  severity: LintSeverity;
  message: string;
}

export interface LintOptions {
  /**
   * How the deck is meant to be read. `presented` (default): short titles, fragment points and cue
   * notes, for a speaker who talks freely. `read-alone`: full-sentence titles and a full talk track,
   * for a deck sent without its speaker (a pre-read, a forwarded deck, a consulting readout).
   */
  mode?: DeckMode;
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
  "title-present": { severity: "error", check: "Every slide has a title." },
  "title-claim": {
    severity: "error",
    check:
      "Presented: a content slide's title is a short verdict the speaker can say ('Crashes down by two thirds', 'Start time: 0.2 s slower'); a bare topic label ('Crash rate') warns except on a cover, section, mechanism, demo or appendix slide, and a word that names the slide's kind ('Background', 'Results', 'Next steps') warns everywhere. Read-alone: the title states a claim of three or more words, not a topic label.",
  },
  "title-length": {
    severity: "warn",
    check:
      "Presented: the title is at most 6 words, a spoken verdict, never a sentence to read out. Read-alone: at most 14 words.",
  },
  "title-specific": {
    severity: "warn",
    check:
      "An answer, evidence, problem or recommendation slide quantifies its claim, in the title or (presented) a point: a number that isn't a date or a version, a multiple or fraction ('twice', 'a third'), a number word with a unit ('three weeks', 'one engineer'), or a comparison of two quantities ('from 40 to 6 minutes'). A plan title carries a date or a number. A bare count ('two teams', 'one big improvement'), 'no regressions', adjectives and names don't count.",
  },
  "one-idea": { severity: "tip", check: "The title is one sentence: one idea per slide." },
  "notes-present": {
    severity: "warn",
    check: "Every presented slide has speaker notes: cues when presented, a talk track when read alone.",
  },
  "number-source": {
    severity: "warn",
    check:
      "A number in a title or a point names its source in the notes: a named artifact ('the search latency dashboard', 'load test 12', 'the Q3 user survey') or a URL, with no hedge ('trust me', 'someone mentioned', 'said so'); or in the slide's `source`.",
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
    check:
      "The notes fit the time budget at 135 words a minute. Read-alone decks' talk tracks also cover at least half of it (the minutes given, else the template's shortest length, capped at one minute per presented slide); a presented deck's cues aren't timed.",
  },
  "template-beats": {
    severity: "warn",
    check:
      "With a template, every beat it requires has a slide in that role: a decision request has its options, a postmortem its plan.",
  },
  "slot-budget": {
    severity: "warn",
    check:
      "Every slot the slide declares as data (title, eyebrow, headline lines, lede, body points, and archetype slots such as quote, value, owner and date) fits its text budget in SLOT_BUDGETS: an eyebrow is one to four words, a lede one sentence, a headline at most two lines, a body point a fragment of at most 8 words on one line and at most four a slide, a label no sentence.",
  },
  "notes-cues": {
    severity: "warn",
    check:
      "Presented: each slide's `say` is cues, not a script: at most 60 words (the claim to say, the number to point at), with the bridge in `next`.",
  },
  "slide-shape": {
    severity: "warn",
    check:
      "The deck doesn't repeat one shape on every slide: not eyebrow + headline + lede throughout, and (presented) not the same title form throughout ('Topic: verdict' or a full sentence on every slide). Mix labels, verdicts and the occasional question.",
  },
  "ai-tells": {
    severity: "warn",
    check:
      "No templated rhetoric: a 'X, not Y' contrast or an appended comparison ('…, twice as fast as March') on more than one slide warns; a semicolon joining two clauses in a title, lede or point is a tip.",
  },
};

/** The read-alone title limit; a presented title stops at `TITLE_WORDS.presented`. */
export const MAX_TITLE_WORDS = TITLE_WORDS["read-alone"];
// The speaking pace (135 words a minute) is shared with the presentations entry's estimateSpeechSeconds.
export { WORDS_PER_MINUTE };
