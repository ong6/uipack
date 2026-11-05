// Proven storylines for the decks an engineer gives inside a company: the beats in order, each
// with its role, purpose, an example short title with its fragment points (presented), and the
// same beat as a full-sentence title (read-alone).
import type { SlideRole, StoryMove } from "./roles";
import type { StorySlide } from "./rules";
import type { DeckMode } from "../budgets";

export interface StoryBeat {
  role: SlideRole;
  /** What this beat must achieve. */
  purpose: string;
  /** The short title's shape, with `<placeholders>`: a verdict, a question, or a label on a mechanism or demo beat. */
  titlePattern: string;
  /** A filled short title for a generic engineering project (presented). Illustrative, not real data. */
  example: string;
  /** The example's body: 2–4 fragments that carry the numbers and cues (presented). */
  points: readonly string[];
  /** The same beat as a full-sentence title, for a deck read without its speaker (read-alone). */
  readAlone: string;
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
  "project-update" | "decision-request" | "deep-dive" | "launch-demo" | "postmortem" | "review-highlights";

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
        titlePattern: "<Project>: <on track | at risk | done>",
        example: "Index migration: on track",
        points: ["70% of traffic moved", "No regressions"],
        readAlone: "Search indexing migration is on track: 70% of traffic moved, no regressions",
        guidance: "Lead with the status word. If it is at risk, say so here, not on slide five.",
      },
      {
        role: "evidence",
        purpose: "The result against the goal agreed at the start.",
        titlePattern: "<Metric>: <before> → <after>",
        example: "Freshness: 40 → 6 min",
        points: ["Goal: 10 min", "Source: the indexing dashboard"],
        readAlone: "Index freshness improved from 40 minutes to 6 against a 10-minute goal",
        guidance: "Same metric and baseline as the last update. Source and window on the slide.",
        repeatable: true,
      },
      {
        role: "evidence",
        purpose: "Progress against the plan, including what slipped and why.",
        titlePattern: "Milestones: <N of M>",
        example: "Milestones: 4 of 6",
        points: ["Backfill slipped 2 weeks", "Cause: storage quota"],
        readAlone: "Four of six milestones are done and backfill is two weeks late on quota",
        guidance: "Report slips plainly with their cause. Surprises later cost more trust than slips now.",
      },
      {
        role: "risk",
        purpose: "The one risk leadership should know about, and what you are doing about it.",
        titlePattern: "Could <milestone> slip?",
        example: "Could cutover slip?",
        points: ["Shard rebalancing may run long", "Dry run on 12 May decides"],
        readAlone: "A dry run on 12 May will show whether shard rebalancing delays cutover",
        guidance: "One risk with a mitigation beats a red-amber-green table of ten.",
        optional: true,
      },
      {
        role: "plan",
        purpose: "The next milestones with dates.",
        titlePattern: "Next: <milestone> <date>",
        example: "Next: cutover 30 May",
        points: ["Old cluster retired in June"],
        readAlone: "Next: full cutover by 30 May, then the old cluster is retired in June",
        guidance: "Dates, not quarters, for anything within six weeks.",
      },
      {
        role: "ask",
        purpose: "The one thing you need from this audience.",
        titlePattern: "<Decision> by <date>",
        example: "Schema freeze from 20 May",
        points: ["Platform leads to approve", "Two weeks"],
        readAlone: "We need Platform leads to approve a two-week schema freeze from 20 May",
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
        titlePattern: "<Recommendation>",
        example: "Resize uploads in a queue",
        points: ["Ends upload timeouts", "Needs one engineer"],
        readAlone: "One engineer can end upload timeouts by moving resizing to a queue",
        guidance: "Minto's governing thought. Executives may stop here; the rest is support.",
      },
      {
        role: "context",
        purpose: "Situation: what the room already accepts.",
        titlePattern: "<What the system does> today",
        example: "Every upload resizes inline",
        points: ["Every image, before the request returns"],
        readAlone: "Uploads resize every image inline before the request returns",
        guidance: "One slide. If the room would nod at every word, it's the right context.",
      },
      {
        role: "problem",
        purpose: "Complication: what broke or changed, sized, and why now.",
        titlePattern: "<How often it fails>",
        example: "4% of large uploads time out",
        points: ["Volume doubles by Q4"],
        readAlone: "Large uploads time out 4% of the time, and volume doubles by Q4",
        guidance: "A number with a source. 'Why now' turns a nice-to-have into a decision.",
      },
      {
        role: "option",
        purpose: "Two or three real options, including doing nothing, on the same criteria.",
        titlePattern: "<N> options compared",
        example: "Three options compared",
        points: ["Bigger servers", "A resize queue", "Do nothing"],
        readAlone: "Three options: bigger servers, a resize queue, or doing nothing",
        guidance: "One comparison slide. A straw-man option tells the room the answer was rigged.",
      },
      {
        role: "recommendation",
        purpose: "Why the chosen option wins and what you trade away.",
        titlePattern: "Why <option> wins",
        example: "Why the queue wins",
        points: ["Cost: thumbnails about 5 s later"],
        readAlone: "A queue ends timeouts at the cost of thumbnails arriving 5 seconds later",
        guidance: "Naming the cost is what makes the recommendation credible.",
      },
      {
        role: "plan",
        purpose: "Cost, timeline and how you will know it worked.",
        titlePattern: "<Effort>",
        example: "Six engineer-weeks",
        points: ["Done when timeouts drop below 0.1%"],
        readAlone: "Six engineer-weeks, done when upload timeouts drop below 0.1%",
        guidance: "A success metric decided now stops the goalposts moving later.",
      },
      {
        role: "risk",
        purpose: "The main risk and the tripwire that makes you reverse.",
        titlePattern: "Tripwire: <signal>",
        example: "Tripwire: queue lag over 1 min",
        points: ["Fall back to inline resizing"],
        readAlone: "If queue lag passes one minute, we fall back to inline resizing",
        guidance: "Reversibility lowers the bar for a yes.",
        optional: true,
      },
      {
        role: "ask",
        purpose: "The decision, who makes it, by when.",
        titlePattern: "Decide by <date>",
        example: "Decide by 14 March",
        points: ["Platform leads", "So Q2 can staff it"],
        readAlone: "Platform leads: decide by 14 March so the work is staffed in Q2",
        guidance: "Repeat the ask from slide one.",
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
        titlePattern: "<System> at <number>",
        example: "A rate limiter at 0.2 ms",
        points: ["Decides locally", "Syncs counts later"],
        readAlone: "The rate limiter adds 0.2 ms by deciding locally and syncing counts later",
        guidance: "State the one idea up front; everything after it explains or tests it. Say the full thesis aloud.",
      },
      {
        role: "problem",
        purpose: "Why it matters: the constraint that makes the obvious design fail.",
        titlePattern: "<Naive approach> costs <number>",
        example: "A central counter costs 2 ms",
        points: ["One network hop", "On every request"],
        readAlone: "A central counter adds a 2 ms network hop to every request",
        guidance: "Engineers care about the design only once they feel the constraint.",
      },
      {
        role: "mechanism",
        purpose: "The whole system on one slide, three to five parts.",
        titlePattern: "<N> parts",
        example: "Three parts",
        points: ["Local bucket", "Sync loop", "Global budget"],
        readAlone: "Three parts: a local bucket, a sync loop and a global budget",
        guidance: "Wrap each part in <Morph id> so the next slide can zoom into it.",
      },
      {
        role: "mechanism",
        purpose: "Zoom into the part that holds the key idea. One part per slide.",
        titlePattern: "<Part>",
        example: "The local bucket",
        points: ["Refills from its share of the budget"],
        readAlone: "Each local bucket refills from its share of the global budget",
        guidance: "Zoom in, explain, come back out. Never zoom two levels without returning.",
        move: "zoom",
        repeatable: true,
      },
      {
        role: "mechanism",
        purpose: "Show the same thing changing: a request moving, state before and after.",
        titlePattern: "<Event>",
        example: "A burst",
        points: ["Drains one bucket", "The others keep serving"],
        readAlone: "A burst drains one bucket while the others keep serving",
        guidance: "Morph the same diagram rather than drawing a second one.",
        move: "morph",
        optional: true,
      },
      {
        role: "evidence",
        purpose: "Measured behaviour, with method and source.",
        titlePattern: "<Test>: <result>",
        example: "Load test: +0.2 ms",
        points: ["3% overshoot at peak", "Source: load test 12"],
        readAlone: "Load tests show 0.2 ms added latency and 3% overshoot at peak",
        guidance: "Say how it was measured. A benchmark without a method is an anecdote.",
      },
      {
        role: "option",
        purpose: "Trade-offs and rejected alternatives.",
        titlePattern: "<Cost accepted> is the price",
        example: "Brief overshoot is the price",
        points: ["Buys: no extra network hop"],
        readAlone: "We accept brief overshoot in exchange for no extra network hop",
        guidance: "The trade-off slide is where senior engineers decide whether to trust you.",
      },
      {
        role: "plan",
        purpose: "What's next and the open questions.",
        titlePattern: "Next: <work>, <date>",
        example: "Next: per-tenant budgets, Q3",
        points: ["Open: fairness under bursts"],
        readAlone: "Next: per-tenant budgets in Q3, with fairness under bursts still open",
        guidance: "Open questions invite the experts in the room to help.",
        optional: true,
      },
      {
        role: "ask",
        purpose: "What you want from the experts in the room.",
        titlePattern: "<Review / adopt / try> <what>",
        example: "Review the sync design",
        points: ["Storage team, by Friday", "Every comment folded in"],
        readAlone: "Storage team: review the sync design doc by Friday",
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
        titlePattern: "<What users can now do>",
        example: "Refunds take one click",
        points: ["Support agents, no ticket", "Was a two-day wait"],
        readAlone: "Support agents can now issue refunds in one click instead of a two-day ticket",
        guidance: "The user and the outcome, not the feature name.",
      },
      {
        role: "problem",
        purpose: "The before: who felt the pain, sized.",
        titlePattern: "<Task> took <time>",
        example: "Refunds took two days",
        points: ["Every one needed an engineer"],
        readAlone: "Refunds took two days because every one needed an engineer",
        guidance: "Make the before concrete enough that the demo is a relief.",
      },
      {
        role: "demo",
        purpose: "The after, in the product. One rehearsed path.",
        titlePattern: "Watch: <task>",
        example: "Watch: a duplicate charge",
        points: ["Refunded in under a minute"],
        readAlone: "Watch an agent refund a duplicate charge in under a minute",
        guidance: "Live with a recorded fallback. Morph from the before screen to the after.",
        move: "morph",
        repeatable: true,
      },
      {
        role: "mechanism",
        purpose: "Just enough how-it-works to trust it: guardrails and limits.",
        titlePattern: "<Guardrail>",
        example: "Limits still apply",
        points: ["Over an agent's limit → a lead approves"],
        readAlone: "Refunds over an agent's limit still route to a lead for approval",
        guidance: "Answer the question the room is already asking: what stops misuse?",
        optional: true,
      },
      {
        role: "evidence",
        purpose: "Early results, with window and source, and what isn't measured yet.",
        titlePattern: "<Result>",
        example: "1,200 refunds skipped engineering",
        points: ["In the first two weeks", "Source: the refunds log"],
        readAlone: "In the first two weeks, 1,200 refunds skipped the engineering queue",
        guidance: "Usage beats opinions. Say 'not measured yet' rather than imply a result.",
      },
      {
        role: "plan",
        purpose: "Rollout: who gets it when, and what comes next.",
        titlePattern: "<Audience> by <date>",
        example: "All regions by 1 June",
        points: ["Partial refunds next"],
        readAlone: "All support regions get it by 1 June, then partial refunds",
        guidance: "Tell people exactly when it reaches them.",
      },
      {
        role: "ask",
        purpose: "Adoption, feedback or a sponsor.",
        titlePattern: "<Turn on / try / send> <what>",
        example: "Switch your queues on",
        points: ["Team leads, by 15 May", "Feedback to me"],
        readAlone: "Team leads: switch your queues on by 15 May and send feedback to me",
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
        titlePattern: "<What> down <duration>",
        example: "Checkout down 42 minutes",
        points: ["Bad config push", "Fixed and guarded"],
        readAlone: "A bad config push took checkout down for 42 minutes and is now guarded",
        guidance: "Everyone in the room wants this sentence first. Systems, not names.",
      },
      {
        role: "evidence",
        purpose: "Impact: who, how many, how long, with source.",
        titlePattern: "<N> <orders/users> affected",
        example: "About 18,000 failed orders",
        points: ["Most customers retried within an hour"],
        readAlone: "About 18,000 orders failed and most customers retried within an hour",
        guidance: "Give the denominator and the source (dashboard, logs, finance).",
      },
      {
        role: "evidence",
        purpose: "Timeline: detection, response, mitigation. Where the minutes went.",
        titlePattern: "Where the minutes went",
        example: "Where the minutes went",
        points: ["Alerts: 9 min", "Rollback: 25 min, slow tool"],
        readAlone: "Alerts took 9 minutes and a slow rollback tool took 25 more",
        guidance: "The gaps in the timeline are usually the real findings.",
      },
      {
        role: "mechanism",
        purpose: "Root cause: how the failure propagated.",
        titlePattern: "<The fault>",
        example: "One missing default",
        points: ["One bad value", "Every payment provider off"],
        readAlone: "A missing default let one bad value disable every payment provider",
        guidance: "Zoom into the failing component from a system overview.",
        move: "zoom",
      },
      {
        role: "problem",
        purpose: "Why it wasn't caught: testing, detection and response gaps.",
        titlePattern: "Why didn't <safeguard> catch it?",
        example: "Why didn't canary catch it?",
        points: ["Config pushes skipped canary", "All 14 regions at once"],
        readAlone: "Config changes skipped canary, so the bad value reached all 14 regions at once",
        guidance: "Ask why the safeguards missed it, not who pushed the change.",
      },
      {
        role: "plan",
        purpose: "Action items: prevent, detect, mitigate, each with owner and date.",
        titlePattern: "<N> fixes by <date>",
        example: "Three fixes by June",
        points: ["Canary config pushes", "Schema defaults", "Faster rollback"],
        readAlone: "Three fixes: canary config pushes, schema defaults and faster rollback by June",
        guidance: "Fewer, owned, dated actions beat a long list nobody tracks.",
      },
      {
        role: "ask",
        purpose: "The prioritisation or help the fixes need.",
        titlePattern: "Prioritise <fix> in <cycle>",
        example: "Prioritise canary work in Q3",
        points: ["Release Engineering owns it"],
        readAlone: "Prioritise the canary work in Q3 planning so Release Engineering owns it",
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
        titlePattern: "<Outcome with its size>",
        example: "A third fewer payment failures",
        points: ["Two launches unblocked"],
        readAlone: "Payment failures fell by a third this half, and two launches were unblocked",
        guidance: "If a reviewer reads one slide, this is it.",
      },
      {
        role: "evidence",
        purpose: "One outcome per slide: result, baseline, source, and your part in it.",
        titlePattern: "<Metric>: <before> → <after>",
        example: "Failed payments: 3% → 2%",
        points: ["Since smarter retries shipped", "Share of all attempts"],
        readAlone: "Failed payments went from 3% to 2% of attempts after smarter retries shipped",
        guidance: "Say what you did versus what the team did. Credit others by name.",
        repeatable: true,
      },
      {
        role: "evidence",
        purpose: "Leverage: what others can do now because of the work.",
        titlePattern: "<Who>, <how fast>",
        example: "Two teams, three weeks",
        points: ["Launched on the new API", "Without our help"],
        readAlone: "Two product teams launched on the new API in three weeks, without our help",
        guidance: "Multipliers are what reviewers look for at senior levels.",
      },
      {
        role: "problem",
        purpose: "What didn't land, and what changed because of it.",
        titlePattern: "<Work> slipped <duration>",
        example: "Fraud rules slipped 3 months",
        points: ["Now: rules ship behind flags"],
        readAlone: "The fraud-rule rewrite slipped three months, so rules now ship behind flags",
        guidance: "One honest miss makes the wins believable.",
        optional: true,
      },
      {
        role: "plan",
        purpose: "Next period's bets, tied to the org's goals.",
        titlePattern: "Next <period>: <bet>",
        example: "Next half: halve payout latency",
        points: ["For instant withdrawals"],
        readAlone: "Next half: halve payout latency to support instant withdrawals",
        guidance: "Link each bet to a goal your leadership already owns.",
      },
      {
        role: "ask",
        purpose: "The support you need: scope, headcount, sponsorship.",
        titlePattern: "<Support> by <date>",
        example: "One more engineer by July",
        points: ["Payments director to approve"],
        readAlone: "We need the payments director to approve one more engineer by July",
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

/**
 * A template's examples as a scaffold deck: one slide per beat, ready to rewrite. Presented (the
 * default), each slide is the short title and its points; read-alone, the full-sentence title.
 */
export function templateOutline(
  template: StorylineTemplate | StorylineTemplateId,
  { mode = "presented" }: { mode?: DeckMode } = {},
): StorySlide[] {
  const t = typeof template === "string" ? getStorylineTemplate(template) : template;
  return t.beats.map((beat, i) =>
    mode === "presented"
      ? { id: `${t.id}-${i + 1}`, title: beat.example, role: beat.role, points: beat.points }
      : { id: `${t.id}-${i + 1}`, title: beat.readAlone, role: beat.role },
  );
}
