// What each slide is for: the roles a storyline is built from, with their purpose and checks.
import type { TransitionKind } from "../transitions";

/**
 * The job a slide does in the argument. Thirteen roles cover every beat of the six storylines
 * below; each maps to one question a listener silently asks. `cover` and `appendix` frame the
 * talk; the other eleven carry it.
 */
export type SlideRole =
  | "cover"
  | "answer"
  | "context"
  | "problem"
  | "evidence"
  | "mechanism"
  | "option"
  | "recommendation"
  | "plan"
  | "risk"
  | "ask"
  | "demo"
  | "appendix";

export interface SlideRoleInfo {
  label: string;
  /** The listener's question this slide answers. */
  question: string;
  /** What a slide in this role must do. */
  job: string;
}

export const SLIDE_ROLES: Readonly<Record<SlideRole, SlideRoleInfo>> = {
  cover: {
    label: "Cover",
    question: "What is this and why am I here?",
    job: "State the outcome the talk is about, in business terms, not the name of the system.",
  },
  answer: {
    label: "Answer",
    question: "What's the point?",
    job: "The governing thought: the result, the recommendation or the thesis, in one sentence.",
  },
  context: {
    label: "Context",
    question: "Where are we?",
    job: "The situation the room already agrees with. One slide, no history lesson.",
  },
  problem: {
    label: "Problem",
    question: "What changed or went wrong?",
    job: "The complication that makes action necessary now, sized with a number.",
  },
  evidence: {
    label: "Evidence",
    question: "Why should I believe it?",
    job: "One finding per slide: value, baseline, window and source.",
  },
  mechanism: {
    label: "Mechanism",
    question: "How does it work?",
    job: "The system or cause, from overview into one part at a time.",
  },
  option: {
    label: "Options",
    question: "What else could we do?",
    job: "Real alternatives, including doing nothing, compared on the same criteria.",
  },
  recommendation: {
    label: "Recommendation",
    question: "Which one, and what do we give up?",
    job: "The chosen option, why it wins, and the trade-off accepted.",
  },
  plan: {
    label: "Plan",
    question: "What happens next?",
    job: "Milestones, cost and how we'll know it worked.",
  },
  risk: {
    label: "Risk",
    question: "What could go wrong?",
    job: "The top risk, its impact, the mitigation and the tripwire.",
  },
  ask: {
    label: "Ask",
    question: "What do you need from me?",
    job: "A specific decision or action, with an owner and a date.",
  },
  demo: {
    label: "Demo",
    question: "Show me.",
    job: "The real thing, one rehearsed path, with a recorded fallback.",
  },
  appendix: {
    label: "Appendix",
    question: "Where's the detail?",
    job: "Backup for questions and async readers. Not presented.",
  },
};

/** Roles whose titles must quantify their claim; a plan needs a date or a number. */
export const QUANTIFIED_ROLES: readonly SlideRole[] = ["answer", "evidence", "problem", "recommendation"];

/** Roles that may sit next to themselves: stacked findings, a zoom through parts, demo steps, backup. */
export const REPEATABLE_ROLES: readonly SlideRole[] = ["evidence", "mechanism", "demo", "appendix"];

/** How a beat should arrive in the deck player: one of its authored transitions. `advance` unless the story needs the other two. */
export type StoryMove = Extract<TransitionKind, "advance" | "morph" | "zoom">;
