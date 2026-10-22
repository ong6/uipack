// Proven storylines for the decks an engineer gives inside a company: the beats in order, each
// with its role, purpose and an example action title.
import type { SlideRole, StoryMove } from "./roles";
import type { StorySlide } from "./rules";

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
        example: "We need Platform leads to approve a two-week schema freeze from 20 May",
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
        example: "A queue ends timeouts; thumbnails arrive about 5 seconds later",
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
        example: "Platform leads: decide by 14 March so the work is staffed in Q2",
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
        example: "A central counter adds a 2 ms network hop to every request",
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
        example: "Support agents can now issue refunds in one click instead of a two-day ticket",
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
        example: "Config changes skipped canary, so the bad value reached all 14 regions at once",
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
        example: "Two product teams launched on the new API in three weeks, without our help",
        guidance: "Multipliers are what reviewers look for at senior levels.",
      },
      {
        role: "problem",
        purpose: "What didn't land, and what changed because of it.",
        titlePattern: "<Miss> happened; we now <changed practice>",
        example: "The fraud-rule rewrite slipped three months; we now ship rules behind flags",
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
