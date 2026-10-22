/**
 * The content layer for decks: what each slide is for, proven storylines for the decks an engineer
 * gives inside a company, and a linter for the argument (not the pixels).
 *
 * Plain data and pure functions: no React, no DOM, no runtime imports. Everything here serialises
 * to JSON, so a CLI, an editor panel or the player's speaker view can all read it.
 *
 * Practice it encodes: answer first (Minto's pyramid), SCQA for decisions, action titles that
 * read as claims, the ghost-deck test (the titles alone tell the argument), one idea per slide,
 * numbers that carry a source, and a closing ask with a decision, an owner and a date.
 */
import type { SpeechGuide } from "../presentations/types";
import type { TransitionKind } from "./transitions";

// ---------------------------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------------------------

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

/** Roles that may sit next to themselves: stacked findings, a zoom through parts, demo steps, backup. */
export const REPEATABLE_ROLES: readonly SlideRole[] = ["evidence", "mechanism", "demo", "appendix"];

/** How a beat should arrive in the deck player: one of its authored transitions. `advance` unless the story needs the other two. */
export type StoryMove = Extract<TransitionKind, "advance" | "morph" | "zoom">;

// ---------------------------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------------------------

export interface StoryBeat {
  role: SlideRole;
  /** What this beat must achieve. */
  purpose: string;
  /** The action-title shape, with `<placeholders>`. */
  titlePattern: string;
  /** A filled title for a generic engineering project. Illustrative, not real data. */
  example: string;
  /** How to write it well, and the common mistake. */
  guidance: string;
  /** Suggested arrival. Omitted means `advance`. */
  move?: StoryMove;
  /** The beat can be dropped in a short version. */
  optional?: boolean;
  /** The beat can expand into several consecutive slides. */
  repeatable?: boolean;
}

export type StorylineTemplateId =
  | "project-update"
  | "decision-request"
  | "deep-dive"
  | "launch-demo"
  | "postmortem"
  | "review-highlights";

export interface StorylineTemplate {
  id: StorylineTemplateId;
  name: string;
  /** When to reach for it. */
  use: string;
  /** Presented slides, appendix excluded. */
  slides: { min: number; max: number };
  /** Speaking time in minutes, discussion excluded. */
  minutes: { min: number; max: number };
  /** Whether the answer or recommendation must land in the first three content slides. */
  answerFirst: boolean;
  /**
   * What leadership remembers a week later, if the deck works. Write slide one and the ask so
   * these are the things a reader can repeat; everything else is support.
   */
  remember: string;
  beats: readonly StoryBeat[];
}

export const STORYLINE_TEMPLATES: readonly StorylineTemplate[] = [
  {
    id: "project-update",
    name: "Project update / results",
    use: "Status to leadership or stakeholders: where it stands, what it delivered, what you need.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    remember: "Whether it's on track, the one number that proves it, and what you need from them.",
    beats: [
      {
        role: "answer",
        purpose: "Status and headline result in one sentence.",
        titlePattern: "<Project> is <on track | at risk | done>: <result against goal>",
        example: "Search indexing migration is on track: 70% of traffic moved, no regressions",
        guidance: "Lead with the status word. If it is at risk, say so here, not on slide five.",
      },
      {
        role: "evidence",
        purpose: "The result against the goal agreed at the start.",
        titlePattern: "<Metric> moved from <baseline> to <now> against a <target> goal",
        example: "Index freshness improved from 40 minutes to 6 against a 10-minute goal",
        guidance: "Same metric and baseline as the last update. Source and window on the slide.",
        repeatable: true,
      },
      {
        role: "evidence",
        purpose: "Progress against the plan, including what slipped and why.",
        titlePattern: "<N of M> milestones done; <milestone> slipped <time> because <cause>",
        example: "Four of six milestones are done; backfill slipped two weeks on quota",
        guidance: "Report slips plainly with their cause. Surprises later cost more trust than slips now.",
      },
      {
        role: "risk",
        purpose: "The one risk leadership should know about, and what you are doing about it.",
        titlePattern: "<Risk> could <impact>; <mitigation> by <date>",
        example: "Shard rebalancing could delay cutover; a dry run on 12 May will tell us",
        guidance: "One risk with a mitigation beats a red-amber-green table of ten.",
        optional: true,
      },
      {
        role: "plan",
        purpose: "The next milestones with dates.",
        titlePattern: "Next: <milestone> by <date>, then <milestone>",
        example: "Next: full cutover by 30 May, then the old cluster is retired in June",
        guidance: "Dates, not quarters, for anything within six weeks.",
      },
      {
        role: "ask",
        purpose: "The one thing you need from this audience.",
        titlePattern: "We need <owner> to <decide/do> by <date>",
        example: "We need Platform to approve a two-week schema freeze from 20 May",
        guidance: "If you need nothing, say 'no asks; next update on <date>'. Silence reads as hiding.",
      },
    ],
  },
  {
    id: "decision-request",
    name: "Proposal / decision request",
    use: "You want a decision, budget or headcount. SCQA with the recommendation stated up front.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    remember: "The choice, what it costs, what it returns, and the date they have to decide by.",
    beats: [
      {
        role: "answer",
        purpose: "The recommendation and the ask in one line, before any background.",
        titlePattern: "We should <action> to <outcome>; we need <decision or resource>",
        example: "Move image resizing to a queue to stop upload timeouts; we need one engineer",
        guidance: "Minto's governing thought. Executives may stop here; the rest is support.",
      },
      {
        role: "context",
        purpose: "Situation: what the room already accepts.",
        titlePattern: "<System> does <job> for <who>",
        example: "Uploads resize every image inline before the request returns",
        guidance: "One slide. If the room would nod at every word, it's the right context.",
      },
      {
        role: "problem",
        purpose: "Complication: what broke or changed, sized, and why now.",
        titlePattern: "<Problem> costs <metric> and grows <rate>",
        example: "Large uploads time out 4% of the time, and volume doubles by Q4",
        guidance: "A number with a source. 'Why now' turns a nice-to-have into a decision.",
      },
      {
        role: "option",
        purpose: "Two or three real options, including doing nothing, on the same criteria.",
        titlePattern: "<N> options: <A>, <B> or do nothing, compared on <criteria>",
        example: "Three options: bigger servers, a resize queue, or doing nothing",
        guidance: "One comparison slide. A straw-man option tells the room the answer was rigged.",
      },
      {
        role: "recommendation",
        purpose: "Why the chosen option wins and what you trade away.",
        titlePattern: "<Option> wins on <criterion>; the cost is <trade-off>",
        example: "A queue ends timeouts; thumbnails arrive a few seconds later",
        guidance: "Naming the cost is what makes the recommendation credible.",
      },
      {
        role: "plan",
        purpose: "Cost, timeline and how you will know it worked.",
        titlePattern: "<Effort> over <time>; done when <measurable result>",
        example: "Six engineer-weeks; done when upload timeouts drop below 0.1%",
        guidance: "A success metric decided now stops the goalposts moving later.",
      },
      {
        role: "risk",
        purpose: "The main risk and the tripwire that makes you reverse.",
        titlePattern: "If <signal>, we <fallback>",
        example: "If queue lag passes one minute, we fall back to inline resizing",
        guidance: "Reversibility lowers the bar for a yes.",
        optional: true,
      },
      {
        role: "ask",
        purpose: "The decision, who makes it, by when.",
        titlePattern: "Decide <what> by <date> so <owner> can <next step>",
        example: "Decide by 14 March so Platform can staff the work in Q2",
        guidance: "Repeat the ask from slide one, word for word if possible.",
      },
    ],
  },
  {
    id: "deep-dive",
    name: "Technical deep dive",
    use: "Explaining a system to engineers: why it matters, how it works, trade-offs, what's next.",
    slides: { min: 7, max: 12 },
    minutes: { min: 12, max: 25 },
    answerFirst: false,
    remember: "One idea about how the system works, the number that shows it works, and the trade-off it makes.",
    beats: [
      {
        role: "answer",
        purpose: "The one idea the audience should leave with.",
        titlePattern: "<System> achieves <property> by <key idea>",
        example: "The rate limiter adds 0.2 ms by deciding locally and syncing counts later",
        guidance: "A thesis, not a title. Everything after it explains or tests this sentence.",
      },
      {
        role: "problem",
        purpose: "Why it matters: the constraint that makes the obvious design fail.",
        titlePattern: "<Naive approach> fails because <constraint>",
        example: "A central counter adds a network hop to every request",
        guidance: "Engineers care about the design only once they feel the constraint.",
      },
      {
        role: "mechanism",
        purpose: "The whole system on one slide, three to five parts.",
        titlePattern: "<N> parts: <A>, <B> and <C>",
        example: "Three parts: a local bucket, a sync loop and a global budget",
        guidance: "Wrap each part in <Morph id> so the next slide can zoom into it.",
      },
      {
        role: "mechanism",
        purpose: "Zoom into the part that holds the key idea. One part per slide.",
        titlePattern: "<Part> <does what> so that <property>",
        example: "Each local bucket refills from its share of the global budget",
        guidance: "Zoom in, explain, come back out. Never zoom two levels without returning.",
        move: "zoom",
        repeatable: true,
      },
      {
        role: "mechanism",
        purpose: "Show the same thing changing: a request moving, state before and after.",
        titlePattern: "<Event> <changes what> while <what stays>",
        example: "A burst drains one bucket while the others keep serving",
        guidance: "Morph the same diagram rather than drawing a second one.",
        move: "morph",
        optional: true,
      },
      {
        role: "evidence",
        purpose: "Measured behaviour, with method and source.",
        titlePattern: "<Test> shows <result> at <load>",
        example: "Load tests show 0.2 ms added latency and 3% overshoot at peak",
        guidance: "Say how it was measured. A benchmark without a method is an anecdote.",
      },
      {
        role: "option",
        purpose: "Trade-offs and rejected alternatives.",
        titlePattern: "We chose <X> over <Y>: <gain>, at the cost of <loss>",
        example: "We accept brief overshoot in exchange for no extra network hop",
        guidance: "The trade-off slide is where senior engineers decide whether to trust you.",
      },
      {
        role: "plan",
        purpose: "What's next and the open questions.",
        titlePattern: "Next: <work>; open question: <question>",
        example: "Next: per-tenant budgets in Q3; fairness under bursts is still open",
        guidance: "Open questions invite the experts in the room to help.",
        optional: true,
      },
      {
        role: "ask",
        purpose: "What you want from the experts in the room.",
        titlePattern: "<Review/adopt/try> <what> by <date>",
        example: "Storage team: review the sync design doc by Friday; I'll fold in every comment",
        guidance: "Engineers respond to a specific review request, not 'any questions?'.",
      },
    ],
  },
  {
    id: "launch-demo",
    name: "Launch / demo",
    use: "Something shipped or is about to: show the before and after, earn adoption.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 12 },
    answerFirst: true,
    remember: "What users can do now that they couldn't before, the early result, and who switches it on next.",
    beats: [
      {
        role: "answer",
        purpose: "What shipped, for whom, and the change it makes.",
        titlePattern: "<Who> can now <do what> <how much better>",
        example: "Support agents can now issue refunds in one click instead of a ticket",
        guidance: "The user and the outcome, not the feature name.",
      },
      {
        role: "problem",
        purpose: "The before: who felt the pain, sized.",
        titlePattern: "<Task> took <time/cost> because <cause>",
        example: "Refunds took two days because every one needed an engineer",
        guidance: "Make the before concrete enough that the demo is a relief.",
      },
      {
        role: "demo",
        purpose: "The after, in the product. One rehearsed path.",
        titlePattern: "Watch <user> <do task> in <time>",
        example: "Watch an agent refund a duplicate charge in under a minute",
        guidance: "Live with a recorded fallback. Morph from the before screen to the after.",
        move: "morph",
        repeatable: true,
      },
      {
        role: "mechanism",
        purpose: "Just enough how-it-works to trust it: guardrails and limits.",
        titlePattern: "<Guardrail> keeps <risk> in check",
        example: "Refunds over an agent's limit still route to a lead for approval",
        guidance: "Answer the question the room is already asking: what stops misuse?",
        optional: true,
      },
      {
        role: "evidence",
        purpose: "Early results, with window and source, and what isn't measured yet.",
        titlePattern: "In <window>, <result>",
        example: "In the first two weeks, 1,200 refunds skipped the engineering queue",
        guidance: "Usage beats opinions. Say 'not measured yet' rather than imply a result.",
      },
      {
        role: "plan",
        purpose: "Rollout: who gets it when, and what comes next.",
        titlePattern: "<Audience> gets it by <date>; <next feature> comes next",
        example: "All support regions get it by 1 June; partial refunds come next",
        guidance: "Tell people exactly when it reaches them.",
      },
      {
        role: "ask",
        purpose: "Adoption, feedback or a sponsor.",
        titlePattern: "<Owner>: <turn on/try/send> <what> by <date>",
        example: "Team leads: switch your queues on by 15 May and send feedback to me",
        guidance: "Name who acts and where feedback goes.",
      },
    ],
  },
  {
    id: "postmortem",
    name: "Postmortem / incident review",
    use: "After an incident: what happened, why, and what changes. Blameless and specific.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    remember: "The impact in one number, the cause in one sentence, and the fix that stops it happening again.",
    beats: [
      {
        role: "answer",
        purpose: "Summary: what happened, impact, cause, status.",
        titlePattern: "<Trigger> caused <impact> for <duration>; <status>",
        example: "A bad config push took checkout down for 42 minutes; fixed and guarded",
        guidance: "Everyone in the room wants this sentence first. Systems, not names.",
      },
      {
        role: "evidence",
        purpose: "Impact: who, how many, how long, with source.",
        titlePattern: "<N> <users/orders> affected over <duration>",
        example: "About 18,000 orders failed; most customers retried within an hour",
        guidance: "Give the denominator and the source (dashboard, logs, finance).",
      },
      {
        role: "evidence",
        purpose: "Timeline: detection, response, mitigation. Where the minutes went.",
        titlePattern: "Detected in <t>; mitigated in <t> because <reason>",
        example: "Alerts fired after 9 minutes; rollback took 25 because the tool was slow",
        guidance: "The gaps in the timeline are usually the real findings.",
      },
      {
        role: "mechanism",
        purpose: "Root cause: how the failure propagated.",
        titlePattern: "<Condition> let <fault> reach <blast radius>",
        example: "A missing default let one bad value disable every payment provider",
        guidance: "Zoom into the failing component from a system overview.",
        move: "zoom",
      },
      {
        role: "problem",
        purpose: "Why it wasn't caught: testing, detection and response gaps.",
        titlePattern: "<Process gap> let <cause> reach <scope>",
        example: "Config changes skipped canary, so the bad value reached all regions at once",
        guidance: "Ask why the safeguards missed it, not who pushed the change.",
      },
      {
        role: "plan",
        purpose: "Action items: prevent, detect, mitigate, each with owner and date.",
        titlePattern: "<N> fixes: <prevent>, <detect>, <mitigate> by <date>",
        example: "Three fixes: canary config pushes, schema defaults and faster rollback by June",
        guidance: "Fewer, owned, dated actions beat a long list nobody tracks.",
      },
      {
        role: "ask",
        purpose: "The prioritisation or help the fixes need.",
        titlePattern: "Prioritise <fix> in <planning cycle>; <owner> owns it",
        example: "Prioritise the canary work in Q3 planning; Release Engineering owns it",
        guidance: "Action items without an ask for capacity tend to slip.",
      },
    ],
  },
  {
    id: "review-highlights",
    name: "Quarterly / performance review highlights",
    use: "Your or your team's period in review: impact, not activity.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    remember: "Two or three outcomes with numbers, what other teams can now do, and the one ask.",
    beats: [
      {
        role: "answer",
        purpose: "Headline impact for the period: outcomes, not tasks.",
        titlePattern: "This <period> we <outcome> and <outcome>",
        example: "This half we cut payment failures by a third and unblocked two launches",
        guidance: "If a reviewer reads one slide, this is it.",
      },
      {
        role: "evidence",
        purpose: "One outcome per slide: result, baseline, source, and your part in it.",
        titlePattern: "<Change> moved <metric> from <baseline> to <now>",
        example: "Smarter retries cut failed payments from 3% to 2% of attempts",
        guidance: "Say what you did versus what the team did. Credit others by name.",
        repeatable: true,
      },
      {
        role: "evidence",
        purpose: "Leverage: what others can do now because of the work.",
        titlePattern: "<Who> can now <do what> without <old cost>",
        example: "Two product teams launched on the new API without our help",
        guidance: "Multipliers are what reviewers look for at senior levels.",
      },
      {
        role: "problem",
        purpose: "What didn't land, and what changed because of it.",
        titlePattern: "<Miss> happened; we now <changed practice>",
        example: "The fraud-rule rewrite slipped a quarter; we now ship rules behind flags",
        guidance: "One honest miss makes the wins believable.",
        optional: true,
      },
      {
        role: "plan",
        purpose: "Next period's bets, tied to the org's goals.",
        titlePattern: "Next <period>: <bet> to support <org goal>",
        example: "Next half: halve payout latency to support instant withdrawals",
        guidance: "Link each bet to a goal your leadership already owns.",
      },
      {
        role: "ask",
        purpose: "The support you need: scope, headcount, sponsorship.",
        titlePattern: "We need <owner> to <support> by <date>",
        example: "We need the payments director to approve one more engineer by July",
        guidance: "A review without an ask leaves your growth to someone else's memory.",
      },
    ],
  },
];

export function getStorylineTemplate(id: StorylineTemplateId): StorylineTemplate {
  const found = STORYLINE_TEMPLATES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown storyline template: ${id}`);
  return found;
}

/** A template's example titles as a scaffold deck: one slide per beat, ready to rewrite. */
export function templateOutline(template: StorylineTemplate | StorylineTemplateId): StorySlide[] {
  const t = typeof template === "string" ? getStorylineTemplate(template) : template;
  return t.beats.map((beat, i) => ({ id: `${t.id}-${i + 1}`, title: beat.example, role: beat.role }));
}

// ---------------------------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------------------------

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
  notes?: SpeechGuide | string;
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
  | "talk-time";

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
    check: "An answer or evidence title carries a number, a comparison or a named result, not an adjective like 'great' or 'good'.",
  },
  "one-idea": { severity: "tip", check: "The title is one sentence: one idea per slide." },
  "notes-present": { severity: "warn", check: "Every presented slide has a talk track." },
  "number-source": { severity: "warn", check: "A number in a title has a source in the notes or on the slide." },
  "roles-missing": { severity: "tip", check: "Slides are tagged with roles, so the storyline checks can run." },
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
    check: "The ask names a decision or action, an owner (a team, role or person, not 'we' or 'the team') and a calendar date ('next quarter' is not one).",
  },
  "role-repeat": {
    severity: "warn",
    check: "No two adjacent slides share a role, except evidence, mechanism, demo and appendix.",
  },
  "deck-length": { severity: "warn", check: "About one to two minutes per presented slide." },
  "talk-time": { severity: "warn", check: "The talk track fits the time budget at 135 words a minute." },
};

export const MAX_TITLE_WORDS = 14;
/** Matches `estimateSpeechSeconds` in the presentations module. */
export const WORDS_PER_MINUTE = 135;

const TOPIC_LABELS = new Set(
  [
    "about me", "action items", "agenda", "alternatives", "appendix", "approach", "architecture",
    "background", "budget", "challenges", "conclusion", "conclusions", "context", "cost", "costs",
    "data", "deep dive", "demo", "design", "executive summary", "faq", "findings", "goals",
    "highlights", "how it works", "impact", "intro", "introduction", "issues", "key takeaways",
    "kpis", "learnings", "lessons learned", "live demo", "metrics", "motivation", "next",
    "next steps", "objectives", "options", "overview", "plan", "problem", "problem statement",
    "progress", "q&a", "q and a", "questions", "recap", "recommendation", "recommendations",
    "requirements", "results", "risks", "risks and mitigations", "roadmap", "root cause", "scope",
    "solution", "status", "status update", "success metrics", "summary", "system architecture",
    "takeaways", "team", "thank you", "thanks", "timeline", "trade-offs", "tradeoffs", "update",
    "what's next", "whats next", "why", "why now",
  ],
);

const MONTH = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const WEEKDAY = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";

/** A calendar date someone can put in a diary: a month, a weekday, a numeric date, a named quarter or half, or today. */
const capitalised = (alternatives: string) => alternatives.replace(/(^|\|)([a-z])/g, (_, bar: string, c: string) => bar + c.toUpperCase());
const DATE_RE = new RegExp(
  [
    // Capitalised, so "may", "sat" and "wed" as ordinary words don't count as dates.
    `\\b(?:${capitalised(MONTH)})\\b`,
    `\\b(?:${capitalised(WEEKDAY)})\\b`,
    String.raw`\b\d{4}-\d{2}-\d{2}\b`,
    String.raw`\b\d{1,2}/\d{1,2}\b`,
    String.raw`\b(?:FY\s?'?\d{2,4}\s?)?[QH][1-4]\b`,
    String.raw`\b(?:[Tt]oday|[Tt]omorrow|[Tt]onight|EOD|eod)\b`,
  ].join("|"),
);

/** Relative time that slides as the calendar moves: "next quarter", "soon", "going forward". */
const RELATIVE_DATE_RE =
  /\b(?:(?:this|next|coming|following) (?:week|month|quarter|half|sprint|year|cycle)|end of (?:the )?(?:week|month|quarter|half|year)|soon|asap|going forward|in the future|over time|eventually|later this year)\b/i;

const DECISION_RE =
  /\b(?:approve|approves|decide|decision|agree|choose|pick|sign(?:s)? off|fund|staff|prioriti[sz]e|review|commit|allocate|assign|adopt|join|try|confirm|accept|enable|switch|turn on|send|share|sponsor|support|unblock|escalate|ship|green-?light|vote|nominate|give|grant|lend|provide|attend|book|hire|move|freeze|pause|stop|start|own)\b/i;

/** A role that can own an ask. Pronouns ("we", "you") and a bare "the team" name nobody. */
const OWNER_ROLE_RE =
  /\b(?:owner|owners|owns|lead|leads|manager|managers|director|directors|vp|vps|head of|pm|pms|em|ems|tl|tls|sponsor|sponsors|committee|board|council|ceo|cto|cfo|coo|cpo|on-call|chair)\b|@\w/i;
/** "<name> team", "<name> org": a named group. "the team", "our team" don't count. */
const NAMED_GROUP_RE = /\b(?!the\b|our\b|my\b|your\b|this\b|that\b|a\b|whole\b|entire\b)[\p{L}-]+ (?:team|teams|org|group|squad|guild)\b/iu;

/** Pronouns and openers that are capitalised but name no one. */
const NOT_AN_OWNER = /^(?:I|I'll|I'm|I've|I'd|OK|Please|Thanks|Thank)$/;

/** Number words that make a claim specific: "twice as fast", "a third", "one engineer". */
const NUMBER_WORD_RE =
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|million|billion|dozen|half|halve[ds]?|twice|double[ds]?|triple[ds]?|third|thirds|quarter of|zero|no (?:rollbacks?|regressions?|incidents?|outages?|errors?|downtime))\b/i;

/** A comparison against something named: a baseline, a target, an alternative. */
const COMPARISON_RE =
  /\b(?:than|versus|vs\.?|compared (?:to|with)|instead of|rather than|ahead of|behind|beat|beats|missed|against (?:a|an|the|our|its|their) \w+)\b|\bfrom\b[^.;:]{1,40}?\bto\b/i;

/** Outcome words for slide one: what changed for the business. */
const OUTCOME_RE =
  /\b(?:faster|slower|cheaper|safer|fewer|more|less|cut|cuts|saved?|saves|saving|grew|grow|fell|fall|rose|raised?|reduced?|reduces|improved?|improves|doubled?|halved?|ended|ends|stops?|stopped|prevents?|unblock(?:s|ed)?|launch(?:es|ed)?|ship(?:s|ped)?|on track|at risk|done|delivered|won|lost|missed|recovered|restored)\b/i;

const SOURCE_RE =
  /\b(?:source|sources|sourced|per|from|measured|dashboard|according|data|logs?|survey|benchmark|experiment|query|report|ticket|estimate|estimated|study|trace|traces|a\/b)\b|https?:\/\//i;

const NOT_A_NAME = new RegExp(`^(?:${MONTH}|${WEEKDAY}|[QH][1-4]|FY\\d*)$`, "i");

function wordsOf(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.%,&/-]*/gu) ?? [];
}

function headlineOf(slide: StorySlide): string {
  return (slide.headline ?? slide.title ?? "").trim();
}

function sayOf(notes: StorySlide["notes"]): string {
  if (!notes) return "";
  return (typeof notes === "string" ? notes : notes.say).trim();
}

function notesText(notes: StorySlide["notes"]): string {
  if (!notes) return "";
  return typeof notes === "string" ? notes : [notes.say, notes.delivery, notes.next ?? ""].join(" ");
}

function normaliseLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}&' -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether `phrase` starts or ends with a known topic label. */
function edgeLabel(phrase: string): string | undefined {
  const words = phrase.split(" ");
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const head = words.slice(0, n).join(" ");
    const tail = words.slice(-n).join(" ");
    if (TOPIC_LABELS.has(head)) return head;
    if (TOPIC_LABELS.has(tail)) return tail;
  }
  return undefined;
}

/** Strip numbers that are dates, quarters, versions or severities, then look for a digit. */
function hasClaimNumber(text: string): boolean {
  const stripped = text
    .replace(new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH})\b`, "gi"), " ")
    .replace(new RegExp(String.raw`\b(?:${MONTH})\s+\d{1,2}(?:st|nd|rd|th)?\b`, "gi"), " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b[QH][1-4](?:\s*(?:FY)?'?\d{2,4})?\b/gi, " ")
    .replace(/\bFY\s?'?\d{2,4}\b/gi, " ")
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\bv\d+(?:\.\d+)*\b/gi, " ")
    .replace(/\b(?:p|sev-?)\d\b/gi, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ");
  return /\d/.test(stripped);
}

/** A capitalised word mid-sentence, other than a month, weekday, quarter or "I": likely a name, team or product. */
function hasProperNoun(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  return words.some((w, i) => {
    if (i === 0 || /[.!?:;]["”’)]?$/.test(words[i - 1])) return false;
    const bare = w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}']+$/gu, "");
    return /^\p{Lu}/u.test(bare) && !NOT_A_NAME.test(bare) && !NOT_AN_OWNER.test(bare);
  });
}

/** A named owner: a role, a named team, an @handle or a proper noun. "We", "you" and "the team" are not owners. */
function hasOwner(text: string): boolean {
  return OWNER_ROLE_RE.test(text) || NAMED_GROUP_RE.test(text) || hasProperNoun(text);
}

/** A claim is specific when it carries a number, a comparison or a named result. */
function isSpecific(text: string): boolean {
  return /\d/.test(text) || NUMBER_WORD_RE.test(text) || COMPARISON_RE.test(text) || hasProperNoun(text);
}

/**
 * Check a deck's argument: action titles, answer first, a concrete closing ask, role rhythm,
 * talk tracks, sources for numbers, and length against the time budget. Pure; no DOM.
 */
export function lintDeck(slides: readonly StorySlide[], options: LintOptions = {}): LintFinding[] {
  const findings: LintFinding[] = [];
  const add = (rule: LintRule, severity: LintSeverity, message: string, slideId?: string) =>
    findings.push(slideId === undefined ? { rule, severity, message } : { slideId, rule, severity, message });

  if (slides.length === 0) {
    add("deck-empty", "error", "The deck has no slides.");
    return findings;
  }

  const template = options.template ? getStorylineTemplate(options.template) : undefined;
  const answerFirst = options.answerFirst ?? template?.answerFirst ?? true;

  const seen = new Set<string>();
  for (const slide of slides) {
    if (seen.has(slide.id)) add("duplicate-id", "error", `Slide ID "${slide.id}" is used more than once.`, slide.id);
    seen.add(slide.id);
  }

  // Per-slide checks.
  for (const slide of slides) {
    const headline = headlineOf(slide);
    const isAppendix = slide.role === "appendix";
    const isCover = slide.role === "cover";

    if (!headline) {
      add("title-present", "error", "No title. Write the slide's point as a sentence.", slide.id);
    } else if (!isAppendix) {
      const words = wordsOf(headline);
      const label = normaliseLabel(headline);
      const prefix = headline.includes(":") ? normaliseLabel(headline.slice(0, headline.indexOf(":"))) : "";
      const soften = (s: LintSeverity): LintSeverity => (isCover ? "tip" : s);
      if (TOPIC_LABELS.has(label)) {
        add(
          "title-claim",
          soften("error"),
          `"${headline}" is a topic label. Say what the audience should conclude from this slide.`,
          slide.id,
        );
      } else if (words.length < 3) {
        add("title-claim", soften("warn"), `"${headline}" is under three words; it reads as a label, not a claim.`, slide.id);
      } else if (words.length <= 4 && edgeLabel(label)) {
        add("title-claim", soften("warn"), `"${headline}" reads like a section label. State the finding instead.`, slide.id);
      } else if (prefix && TOPIC_LABELS.has(prefix) && prefix !== "next") {
        add(
          "title-claim",
          soften("tip"),
          `"${headline}" opens with a section label. Lead with the claim; put the section in the eyebrow.`,
          slide.id,
        );
      }
      if (words.length > MAX_TITLE_WORDS) {
        add(
          "title-length",
          "warn",
          `Title is ${words.length} words; keep it to ${MAX_TITLE_WORDS} or move detail to the body.`,
          slide.id,
        );
      }
      if ((slide.role === "answer" || slide.role === "evidence") && !isSpecific(headline)) {
        add(
          "title-specific",
          "warn",
          `"${headline}" could describe any quarter. Put the number, the comparison or the named result in the title.`,
          slide.id,
        );
      }
      if (/[.!?]["”’)]?\s+\S/.test(headline)) {
        add("one-idea", "tip", "Title has more than one sentence. One idea per slide: split it or pick one.", slide.id);
      }
    }

    if (!isAppendix && !sayOf(slide.notes)) {
      add("notes-present", "warn", "No talk track. Notes carry what you say; the title carries the claim.", slide.id);
    }

    if (
      headline &&
      slide.role !== "plan" &&
      slide.role !== "ask" &&
      !isAppendix &&
      hasClaimNumber(headline) &&
      !SOURCE_RE.test(notesText(slide.notes)) &&
      !(slide.source && slide.source.trim())
    ) {
      add(
        "number-source",
        "warn",
        "The title has a number but no source. Add where it came from (dashboard, query, test, window) to the notes or the slide.",
        slide.id,
      );
    }
  }

  const presented = slides.filter((s) => s.role !== "appendix");
  const tagged = slides.some((s) => s.role);

  // Storyline checks need roles.
  if (!tagged) {
    add("roles-missing", "tip", "No slide has a role, so answer-first, closing-ask and rhythm checks were skipped.");
  } else {
    if (answerFirst) {
      const content = presented.filter((s) => s.role !== "cover");
      const at = content.findIndex((s) => s.role === "answer" || s.role === "recommendation");
      if (at === -1) {
        add(
          "answer-first",
          "error",
          "No slide states the answer or recommendation. Put the conclusion up front (role 'answer').",
        );
      } else if (at > 2) {
        add(
          "answer-first",
          "warn",
          `The answer arrives on content slide ${at + 1}. Move it into the first three; busy readers stop early.`,
          content[at].id,
        );
      }
    }

    if (answerFirst) {
      const first = presented[0];
      const text = first ? headlineOf(first) : "";
      if (first && text && !isSpecific(text) && !OUTCOME_RE.test(text)) {
        add(
          "outcome-first",
          "tip",
          "Slide one names the work, not the outcome. Say what got faster, cheaper or safer for the business, and by how much.",
          first.id,
        );
      }
    }

    const asks = presented.filter((s) => s.role === "ask");
    const last = presented[presented.length - 1];
    if (asks.length === 0) {
      add("closing-ask", "error", "No ask. End with the decision or action you need, from whom, by when.");
    } else if (last && last.role !== "ask") {
      add("closing-ask", "warn", "The deck doesn't end on the ask. Close on it so it's the last thing on screen.", last.id);
    }

    for (const ask of asks) {
      const text = `${headlineOf(ask)}. ${notesText(ask.notes)}`;
      const missing: string[] = [];
      if (!DECISION_RE.test(text)) missing.push("a decision or action verb");
      if (!hasOwner(text)) missing.push("an owner");
      if (!DATE_RE.test(text)) missing.push("a date");
      if (missing.length) {
        const relative = text.match(RELATIVE_DATE_RE)?.[0];
        const hints = [
          missing.includes("an owner") && "Name the team or person who acts; 'we' and 'the team' name nobody.",
          missing.includes("a date") && relative && `"${relative}" moves with the calendar; give a date such as 14 March.`,
        ].filter(Boolean);
        add("ask-concrete", "warn", [`The ask is missing ${missing.join(", ")}.`, ...hints].join(" "), ask.id);
      }
    }

    for (let i = 1; i < slides.length; i++) {
      const prev = slides[i - 1].role;
      const role = slides[i].role;
      if (!role || role !== prev || REPEATABLE_ROLES.includes(role)) continue;
      const message =
        role === "option"
          ? "Two option slides in a row. Compare the options side by side on one slide, on the same criteria."
          : `Two ${SLIDE_ROLES[role].label.toLowerCase()} slides in a row. Merge them, or give the second its own role.`;
      add("role-repeat", "warn", message, slides[i].id);
    }
  }

  // Length against the budget.
  const count = presented.length;
  const budget = options.minutes ?? template?.minutes.max;
  if (options.minutes !== undefined && count > 0) {
    if (count > options.minutes) {
      add(
        "deck-length",
        "warn",
        `${count} slides for ${options.minutes} minutes is under a minute each. Cut, merge, or move detail to the appendix.`,
      );
    } else if (options.minutes / count > 2) {
      add(
        "deck-length",
        "tip",
        `${count} slides for ${options.minutes} minutes is over two minutes each. Fine for discussion; otherwise split a dense slide.`,
      );
    }
  } else if (template && (count < template.slides.min || count > template.slides.max)) {
    add(
      "deck-length",
      "tip",
      `${count} presented slides; a ${template.name.toLowerCase()} usually runs ${template.slides.min}–${template.slides.max}.`,
    );
  }

  if (budget !== undefined) {
    const seconds = talkSeconds(slides);
    if (seconds > budget * 60) {
      add(
        "talk-time",
        "warn",
        `The talk track runs about ${Math.round(seconds / 60)} minutes at ${WORDS_PER_MINUTE} words a minute, over the ${budget}-minute budget.`,
      );
    }
  }

  return findings;
}

/** Estimated speaking time of the presented slides' `say` text, in seconds. */
export function talkSeconds(slides: readonly StorySlide[]): number {
  const words = slides
    .filter((s) => s.role !== "appendix")
    .reduce((sum, s) => sum + (sayOf(s.notes).match(/\S+/g)?.length ?? 0), 0);
  return Math.round((words / WORDS_PER_MINUTE) * 60);
}

// ---------------------------------------------------------------------------------------------
// Ghost deck
// ---------------------------------------------------------------------------------------------

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
