// src/deck/DeckPlayer.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";

// src/deck/parts.tsx
import { createContext, useContext } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var DeckSlideContext = createContext({
  step: Infinity,
  active: true,
  thumbnail: false,
  index: 0,
  count: 1
});
var useDeckSlide = () => useContext(DeckSlideContext);
function Morph({
  id,
  as: Tag = "div",
  fit,
  className,
  style,
  children
}) {
  return /* @__PURE__ */ jsx(Tag, { "data-morph": id, "data-morph-fit": fit, className, style, children });
}
function Build({
  step,
  as: Tag = "div",
  className,
  style,
  children
}) {
  const { step: reached } = useDeckSlide();
  const built = reached >= step;
  return /* @__PURE__ */ jsx(
    Tag,
    {
      "data-build": step,
      "data-built": built ? "" : void 0,
      "aria-hidden": built ? void 0 : true,
      className,
      style,
      children
    }
  );
}
function Slide({
  eyebrow,
  footer,
  layout = "stack",
  className,
  children
}) {
  const { index, count } = useDeckSlide();
  return /* @__PURE__ */ jsxs("div", { className: ["uipack-deck-slide", className].filter(Boolean).join(" "), "data-layout": layout, children: [
    eyebrow && /* @__PURE__ */ jsx("p", { className: "uipack-deck-eyebrow", children: eyebrow }),
    children,
    footer !== null && /* @__PURE__ */ jsxs("footer", { className: "uipack-deck-footer", "data-morph": "deck-footer", "data-morph-fit": "stretch", children: [
      /* @__PURE__ */ jsx("span", { children: footer }),
      /* @__PURE__ */ jsxs("span", { children: [
        String(index + 1).padStart(2, "0"),
        " / ",
        String(count).padStart(2, "0")
      ] })
    ] })
  ] });
}

// src/deck/storyline.ts
var SLIDE_ROLES = {
  cover: {
    label: "Cover",
    question: "What is this and why am I here?",
    job: "Name the talk. Best when its title already states the answer."
  },
  answer: {
    label: "Answer",
    question: "What's the point?",
    job: "The governing thought: the result, the recommendation or the thesis, in one sentence."
  },
  context: {
    label: "Context",
    question: "Where are we?",
    job: "The situation the room already agrees with. One slide, no history lesson."
  },
  problem: {
    label: "Problem",
    question: "What changed or went wrong?",
    job: "The complication that makes action necessary now, sized with a number."
  },
  evidence: {
    label: "Evidence",
    question: "Why should I believe it?",
    job: "One finding per slide: value, baseline, window and source."
  },
  mechanism: {
    label: "Mechanism",
    question: "How does it work?",
    job: "The system or cause, from overview into one part at a time."
  },
  option: {
    label: "Options",
    question: "What else could we do?",
    job: "Real alternatives, including doing nothing, compared on the same criteria."
  },
  recommendation: {
    label: "Recommendation",
    question: "Which one, and what do we give up?",
    job: "The chosen option, why it wins, and the trade-off accepted."
  },
  plan: {
    label: "Plan",
    question: "What happens next?",
    job: "Milestones, cost and how we'll know it worked."
  },
  risk: {
    label: "Risk",
    question: "What could go wrong?",
    job: "The top risk, its impact, the mitigation and the tripwire."
  },
  ask: {
    label: "Ask",
    question: "What do you need from me?",
    job: "A specific decision or action, with an owner and a date."
  },
  demo: {
    label: "Demo",
    question: "Show me.",
    job: "The real thing, one rehearsed path, with a recorded fallback."
  },
  appendix: {
    label: "Appendix",
    question: "Where's the detail?",
    job: "Backup for questions and async readers. Not presented."
  }
};
var REPEATABLE_ROLES = ["evidence", "mechanism", "demo", "appendix"];
var STORYLINE_TEMPLATES = [
  {
    id: "project-update",
    name: "Project update / results",
    use: "Status to leadership or stakeholders: where it stands, what it delivered, what you need.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    beats: [
      {
        role: "answer",
        purpose: "Status and headline result in one sentence.",
        titlePattern: "<Project> is <on track | at risk | done>: <result against goal>",
        example: "Search indexing migration is on track: 70% of traffic moved, no regressions",
        guidance: "Lead with the status word. If it is at risk, say so here, not on slide five."
      },
      {
        role: "evidence",
        purpose: "The result against the goal agreed at the start.",
        titlePattern: "<Metric> moved from <baseline> to <now> against a <target> goal",
        example: "Index freshness improved from 40 minutes to 6 against a 10-minute goal",
        guidance: "Same metric and baseline as the last update. Source and window on the slide.",
        repeatable: true
      },
      {
        role: "evidence",
        purpose: "Progress against the plan, including what slipped and why.",
        titlePattern: "<N of M> milestones done; <milestone> slipped <time> because <cause>",
        example: "Four of six milestones are done; backfill slipped two weeks on quota",
        guidance: "Report slips plainly with their cause. Surprises later cost more trust than slips now."
      },
      {
        role: "risk",
        purpose: "The one risk leadership should know about, and what you are doing about it.",
        titlePattern: "<Risk> could <impact>; <mitigation> by <date>",
        example: "Shard rebalancing could delay cutover; a dry run on 12 May will tell us",
        guidance: "One risk with a mitigation beats a red-amber-green table of ten.",
        optional: true
      },
      {
        role: "plan",
        purpose: "The next milestones with dates.",
        titlePattern: "Next: <milestone> by <date>, then <milestone>",
        example: "Next: full cutover by 30 May, then the old cluster is retired in June",
        guidance: "Dates, not quarters, for anything within six weeks."
      },
      {
        role: "ask",
        purpose: "The one thing you need from this audience.",
        titlePattern: "We need <owner> to <decide/do> by <date>",
        example: "We need Platform to approve a two-week schema freeze from 20 May",
        guidance: "If you need nothing, say 'no asks; next update on <date>'. Silence reads as hiding."
      }
    ]
  },
  {
    id: "decision-request",
    name: "Proposal / decision request",
    use: "You want a decision, budget or headcount. SCQA with the recommendation stated up front.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    beats: [
      {
        role: "answer",
        purpose: "The recommendation and the ask in one line, before any background.",
        titlePattern: "We should <action> to <outcome>; we need <decision or resource>",
        example: "Move image resizing to a queue to stop upload timeouts; we need one engineer",
        guidance: "Minto's governing thought. Executives may stop here; the rest is support."
      },
      {
        role: "context",
        purpose: "Situation: what the room already accepts.",
        titlePattern: "<System> does <job> for <who>",
        example: "Uploads resize every image inline before the request returns",
        guidance: "One slide. If the room would nod at every word, it's the right context."
      },
      {
        role: "problem",
        purpose: "Complication: what broke or changed, sized, and why now.",
        titlePattern: "<Problem> costs <metric> and grows <rate>",
        example: "Large uploads time out 4% of the time, and volume doubles by Q4",
        guidance: "A number with a source. 'Why now' turns a nice-to-have into a decision."
      },
      {
        role: "option",
        purpose: "Two or three real options, including doing nothing, on the same criteria.",
        titlePattern: "<N> options: <A>, <B> or do nothing, compared on <criteria>",
        example: "Three options: bigger servers, a resize queue, or doing nothing",
        guidance: "One comparison slide. A straw-man option tells the room the answer was rigged."
      },
      {
        role: "recommendation",
        purpose: "Why the chosen option wins and what you trade away.",
        titlePattern: "<Option> wins on <criterion>; the cost is <trade-off>",
        example: "A queue ends timeouts; thumbnails arrive a few seconds later",
        guidance: "Naming the cost is what makes the recommendation credible."
      },
      {
        role: "plan",
        purpose: "Cost, timeline and how you will know it worked.",
        titlePattern: "<Effort> over <time>; done when <measurable result>",
        example: "Six engineer-weeks; done when upload timeouts drop below 0.1%",
        guidance: "A success metric decided now stops the goalposts moving later."
      },
      {
        role: "risk",
        purpose: "The main risk and the tripwire that makes you reverse.",
        titlePattern: "If <signal>, we <fallback>",
        example: "If queue lag passes one minute, we fall back to inline resizing",
        guidance: "Reversibility lowers the bar for a yes.",
        optional: true
      },
      {
        role: "ask",
        purpose: "The decision, who makes it, by when.",
        titlePattern: "Decide <what> by <date> so <owner> can <next step>",
        example: "Decide by 14 March so Platform can staff the work in Q2",
        guidance: "Repeat the ask from slide one, word for word if possible."
      }
    ]
  },
  {
    id: "deep-dive",
    name: "Technical deep dive",
    use: "Explaining a system to engineers: why it matters, how it works, trade-offs, what's next.",
    slides: { min: 7, max: 12 },
    minutes: { min: 12, max: 25 },
    answerFirst: false,
    beats: [
      {
        role: "answer",
        purpose: "The one idea the audience should leave with.",
        titlePattern: "<System> achieves <property> by <key idea>",
        example: "The rate limiter stays fast by deciding locally and syncing counts later",
        guidance: "A thesis, not a title. Everything after it explains or tests this sentence."
      },
      {
        role: "problem",
        purpose: "Why it matters: the constraint that makes the obvious design fail.",
        titlePattern: "<Naive approach> fails because <constraint>",
        example: "A central counter adds a network hop to every request",
        guidance: "Engineers care about the design only once they feel the constraint."
      },
      {
        role: "mechanism",
        purpose: "The whole system on one slide, three to five parts.",
        titlePattern: "<N> parts: <A>, <B> and <C>",
        example: "Three parts: a local bucket, a sync loop and a global budget",
        guidance: "Wrap each part in <Morph id> so the next slide can zoom into it."
      },
      {
        role: "mechanism",
        purpose: "Zoom into the part that holds the key idea. One part per slide.",
        titlePattern: "<Part> <does what> so that <property>",
        example: "Each local bucket refills from its share of the global budget",
        guidance: "Zoom in, explain, come back out. Never zoom two levels without returning.",
        move: "zoom",
        repeatable: true
      },
      {
        role: "mechanism",
        purpose: "Show the same thing changing: a request moving, state before and after.",
        titlePattern: "<Event> <changes what> while <what stays>",
        example: "A burst drains one bucket while the others keep serving",
        guidance: "Morph the same diagram rather than drawing a second one.",
        move: "morph",
        optional: true
      },
      {
        role: "evidence",
        purpose: "Measured behaviour, with method and source.",
        titlePattern: "<Test> shows <result> at <load>",
        example: "Load tests show 0.2 ms added latency and 3% overshoot at peak",
        guidance: "Say how it was measured. A benchmark without a method is an anecdote."
      },
      {
        role: "option",
        purpose: "Trade-offs and rejected alternatives.",
        titlePattern: "We chose <X> over <Y>: <gain>, at the cost of <loss>",
        example: "We accept brief overshoot in exchange for no extra network hop",
        guidance: "The trade-off slide is where senior engineers decide whether to trust you."
      },
      {
        role: "plan",
        purpose: "What's next and the open questions.",
        titlePattern: "Next: <work>; open question: <question>",
        example: "Next: per-tenant budgets in Q3; fairness under bursts is still open",
        guidance: "Open questions invite the experts in the room to help.",
        optional: true
      },
      {
        role: "ask",
        purpose: "What you want from the experts in the room.",
        titlePattern: "<Review/adopt/try> <what> by <date>",
        example: "Review the sync design doc by Friday; I'll fold in every comment",
        guidance: "Engineers respond to a specific review request, not 'any questions?'."
      }
    ]
  },
  {
    id: "launch-demo",
    name: "Launch / demo",
    use: "Something shipped or is about to: show the before and after, earn adoption.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 12 },
    answerFirst: true,
    beats: [
      {
        role: "answer",
        purpose: "What shipped, for whom, and the change it makes.",
        titlePattern: "<Who> can now <do what> <how much better>",
        example: "Support agents can now issue refunds in one click instead of a ticket",
        guidance: "The user and the outcome, not the feature name."
      },
      {
        role: "problem",
        purpose: "The before: who felt the pain, sized.",
        titlePattern: "<Task> took <time/cost> because <cause>",
        example: "Refunds took two days because every one needed an engineer",
        guidance: "Make the before concrete enough that the demo is a relief."
      },
      {
        role: "demo",
        purpose: "The after, in the product. One rehearsed path.",
        titlePattern: "Watch <user> <do task> in <time>",
        example: "Watch an agent refund a duplicate charge in under a minute",
        guidance: "Live with a recorded fallback. Morph from the before screen to the after.",
        move: "morph",
        repeatable: true
      },
      {
        role: "mechanism",
        purpose: "Just enough how-it-works to trust it: guardrails and limits.",
        titlePattern: "<Guardrail> keeps <risk> in check",
        example: "Refunds over an agent's limit still route to a lead for approval",
        guidance: "Answer the question the room is already asking: what stops misuse?",
        optional: true
      },
      {
        role: "evidence",
        purpose: "Early results, with window and source, and what isn't measured yet.",
        titlePattern: "In <window>, <result>",
        example: "In the first two weeks, 1,200 refunds skipped the engineering queue",
        guidance: "Usage beats opinions. Say 'not measured yet' rather than imply a result."
      },
      {
        role: "plan",
        purpose: "Rollout: who gets it when, and what comes next.",
        titlePattern: "<Audience> gets it by <date>; <next feature> comes next",
        example: "All support regions get it by 1 June; partial refunds come next",
        guidance: "Tell people exactly when it reaches them."
      },
      {
        role: "ask",
        purpose: "Adoption, feedback or a sponsor.",
        titlePattern: "<Owner>: <turn on/try/send> <what> by <date>",
        example: "Team leads: switch your queues on by 15 May and send feedback to me",
        guidance: "Name who acts and where feedback goes."
      }
    ]
  },
  {
    id: "postmortem",
    name: "Postmortem / incident review",
    use: "After an incident: what happened, why, and what changes. Blameless and specific.",
    slides: { min: 6, max: 9 },
    minutes: { min: 8, max: 15 },
    answerFirst: true,
    beats: [
      {
        role: "answer",
        purpose: "Summary: what happened, impact, cause, status.",
        titlePattern: "<Trigger> caused <impact> for <duration>; <status>",
        example: "A bad config push took checkout down for 42 minutes; fixed and guarded",
        guidance: "Everyone in the room wants this sentence first. Systems, not names."
      },
      {
        role: "evidence",
        purpose: "Impact: who, how many, how long, with source.",
        titlePattern: "<N> <users/orders> affected over <duration>",
        example: "About 18,000 orders failed; most customers retried within an hour",
        guidance: "Give the denominator and the source (dashboard, logs, finance)."
      },
      {
        role: "evidence",
        purpose: "Timeline: detection, response, mitigation. Where the minutes went.",
        titlePattern: "Detected in <t>; mitigated in <t> because <reason>",
        example: "Alerts fired after 9 minutes; rollback took 25 because the tool was slow",
        guidance: "The gaps in the timeline are usually the real findings."
      },
      {
        role: "mechanism",
        purpose: "Root cause: how the failure propagated.",
        titlePattern: "<Condition> let <fault> reach <blast radius>",
        example: "A missing default let one bad value disable every payment provider",
        guidance: "Zoom into the failing component from a system overview.",
        move: "zoom"
      },
      {
        role: "problem",
        purpose: "Why it wasn't caught: testing, detection and response gaps.",
        titlePattern: "<Process gap> let <cause> reach <scope>",
        example: "Config changes skipped canary, so the bad value reached all regions at once",
        guidance: "Ask why the safeguards missed it, not who pushed the change."
      },
      {
        role: "plan",
        purpose: "Action items: prevent, detect, mitigate, each with owner and date.",
        titlePattern: "<N> fixes: <prevent>, <detect>, <mitigate> by <date>",
        example: "Three fixes: canary config pushes, schema defaults and faster rollback by June",
        guidance: "Fewer, owned, dated actions beat a long list nobody tracks."
      },
      {
        role: "ask",
        purpose: "The prioritisation or help the fixes need.",
        titlePattern: "Prioritise <fix> in <planning cycle>; <owner> owns it",
        example: "Prioritise the canary work in Q3 planning; Release Engineering owns it",
        guidance: "Action items without an ask for capacity tend to slip."
      }
    ]
  },
  {
    id: "review-highlights",
    name: "Quarterly / performance review highlights",
    use: "Your or your team's period in review: impact, not activity.",
    slides: { min: 5, max: 8 },
    minutes: { min: 5, max: 10 },
    answerFirst: true,
    beats: [
      {
        role: "answer",
        purpose: "Headline impact for the period: outcomes, not tasks.",
        titlePattern: "This <period> we <outcome> and <outcome>",
        example: "This half we cut payment failures by a third and unblocked two launches",
        guidance: "If a reviewer reads one slide, this is it."
      },
      {
        role: "evidence",
        purpose: "One outcome per slide: result, baseline, source, and your part in it.",
        titlePattern: "<Change> moved <metric> from <baseline> to <now>",
        example: "Smarter retries cut failed payments from 3% to 2% of attempts",
        guidance: "Say what you did versus what the team did. Credit others by name.",
        repeatable: true
      },
      {
        role: "evidence",
        purpose: "Leverage: what others can do now because of the work.",
        titlePattern: "<Who> can now <do what> without <old cost>",
        example: "Two product teams launched on the new API without our help",
        guidance: "Multipliers are what reviewers look for at senior levels."
      },
      {
        role: "problem",
        purpose: "What didn't land, and what changed because of it.",
        titlePattern: "<Miss> happened; we now <changed practice>",
        example: "The fraud-rule rewrite slipped a quarter; we now ship rules behind flags",
        guidance: "One honest miss makes the wins believable.",
        optional: true
      },
      {
        role: "plan",
        purpose: "Next period's bets, tied to the org's goals.",
        titlePattern: "Next <period>: <bet> to support <org goal>",
        example: "Next half: halve payout latency to support instant withdrawals",
        guidance: "Link each bet to a goal your leadership already owns."
      },
      {
        role: "ask",
        purpose: "The support you need: scope, headcount, sponsorship.",
        titlePattern: "We need <owner> to <support> by <date>",
        example: "We need you to approve one more engineer by July for the payouts work",
        guidance: "A review without an ask leaves your growth to someone else's memory."
      }
    ]
  }
];
function getStorylineTemplate(id) {
  const found = STORYLINE_TEMPLATES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown storyline template: ${id}`);
  return found;
}
function templateOutline(template) {
  const t = typeof template === "string" ? getStorylineTemplate(template) : template;
  return t.beats.map((beat, i) => ({ id: `${t.id}-${i + 1}`, title: beat.example, role: beat.role }));
}
var LINT_RULES = {
  "deck-empty": { severity: "error", check: "The deck has at least one slide." },
  "duplicate-id": { severity: "error", check: "Slide IDs are unique (they appear in URLs and presenter sync)." },
  "title-present": { severity: "error", check: "Every slide has an action title." },
  "title-claim": {
    severity: "error",
    check: "The title states a claim of three or more words, not a topic label like 'Background' or 'Architecture'."
  },
  "title-length": { severity: "warn", check: "The title is at most 14 words." },
  "one-idea": { severity: "tip", check: "The title is one sentence: one idea per slide." },
  "notes-present": { severity: "warn", check: "Every presented slide has a talk track." },
  "number-source": { severity: "warn", check: "A number in a title has a source in the notes or on the slide." },
  "roles-missing": { severity: "tip", check: "Slides are tagged with roles, so the storyline checks can run." },
  "answer-first": {
    severity: "error",
    check: "The answer or recommendation appears within the first three content slides."
  },
  "closing-ask": { severity: "error", check: "The last presented slide is an ask." },
  "ask-concrete": { severity: "warn", check: "The ask names a decision or action, an owner and a date." },
  "role-repeat": {
    severity: "warn",
    check: "No two adjacent slides share a role, except evidence, mechanism, demo and appendix."
  },
  "deck-length": { severity: "warn", check: "About one to two minutes per presented slide." },
  "talk-time": { severity: "warn", check: "The talk track fits the time budget at 135 words a minute." }
};
var MAX_TITLE_WORDS = 14;
var WORDS_PER_MINUTE = 135;
var TOPIC_LABELS = /* @__PURE__ */ new Set(
  [
    "about me",
    "action items",
    "agenda",
    "alternatives",
    "appendix",
    "approach",
    "architecture",
    "background",
    "budget",
    "challenges",
    "conclusion",
    "conclusions",
    "context",
    "cost",
    "costs",
    "data",
    "deep dive",
    "demo",
    "design",
    "executive summary",
    "faq",
    "findings",
    "goals",
    "highlights",
    "how it works",
    "impact",
    "intro",
    "introduction",
    "issues",
    "key takeaways",
    "kpis",
    "learnings",
    "lessons learned",
    "live demo",
    "metrics",
    "motivation",
    "next",
    "next steps",
    "objectives",
    "options",
    "overview",
    "plan",
    "problem",
    "problem statement",
    "progress",
    "q&a",
    "q and a",
    "questions",
    "recap",
    "recommendation",
    "recommendations",
    "requirements",
    "results",
    "risks",
    "risks and mitigations",
    "roadmap",
    "root cause",
    "scope",
    "solution",
    "status",
    "status update",
    "success metrics",
    "summary",
    "system architecture",
    "takeaways",
    "team",
    "thank you",
    "thanks",
    "timeline",
    "trade-offs",
    "tradeoffs",
    "update",
    "what's next",
    "whats next",
    "why",
    "why now"
  ]
);
var MONTH = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
var WEEKDAY = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";
var DATE_RE = new RegExp(
  [
    `\\b(?:${MONTH})\\b`,
    `\\b(?:${WEEKDAY})\\b`,
    String.raw`\b\d{4}-\d{2}-\d{2}\b`,
    String.raw`\b\d{1,2}/\d{1,2}\b`,
    String.raw`\b[QH][1-4]\b`,
    String.raw`\b(?:today|tomorrow|tonight|eod|eow|eom|eoq)\b`,
    String.raw`\b(?:this|next) (?:week|month|quarter|sprint|sync|review)\b`,
    String.raw`\bend of (?:the )?(?:day|week|month|quarter|sprint|half|year)\b`,
    String.raw`\bwithin \w+ (?:days?|weeks?|months?)\b`
  ].join("|"),
  "i"
);
var DECISION_RE = /\b(?:approve|approves|decide|decision|agree|choose|pick|sign(?:s)? off|fund|staff|prioriti[sz]e|review|commit|allocate|assign|adopt|join|try|confirm|accept|enable|switch|turn on|send|share|sponsor|support|unblock|escalate|ship|green-?light|vote|nominate|give|grant|lend|provide|attend|book|hire|move|freeze|pause|stop|start|own)\b/i;
var OWNER_WORD_RE = /\b(?:owner|owners|owns|lead|leads|manager|managers|director|vp|pm|em|tl|team|teams|sponsor|i|i'll|we|we'll|you|me|us)\b|@\w/i;
var SOURCE_RE = /\b(?:source|sources|sourced|per|from|measured|dashboard|according|data|logs?|survey|benchmark|experiment|query|report|ticket|estimate|estimated|study|trace|traces|a\/b)\b|https?:\/\//i;
var NOT_A_NAME = new RegExp(`^(?:${MONTH}|${WEEKDAY}|[QH][1-4])$`, "i");
function wordsOf(text) {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.%,&/-]*/gu) ?? [];
}
function headlineOf(slide) {
  return (slide.headline ?? slide.title ?? "").trim();
}
function sayOf(notes) {
  if (!notes) return "";
  return (typeof notes === "string" ? notes : notes.say).trim();
}
function notesText(notes) {
  if (!notes) return "";
  return typeof notes === "string" ? notes : [notes.say, notes.delivery, notes.next ?? ""].join(" ");
}
function normaliseLabel(text) {
  return text.toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}\p{N}&' -]+/gu, " ").replace(/\s+/g, " ").trim();
}
function edgeLabel(phrase) {
  const words = phrase.split(" ");
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const head = words.slice(0, n).join(" ");
    const tail = words.slice(-n).join(" ");
    if (TOPIC_LABELS.has(head)) return head;
    if (TOPIC_LABELS.has(tail)) return tail;
  }
  return void 0;
}
function hasClaimNumber(text) {
  const stripped = text.replace(new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH})\b`, "gi"), " ").replace(new RegExp(String.raw`\b(?:${MONTH})\s+\d{1,2}(?:st|nd|rd|th)?\b`, "gi"), " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b[QH][1-4](?:\s*(?:FY)?'?\d{2,4})?\b/gi, " ").replace(/\bFY\s?'?\d{2,4}\b/gi, " ").replace(/\b(?:19|20)\d{2}\b/g, " ").replace(/\bv\d+(?:\.\d+)*\b/gi, " ").replace(/\b(?:p|sev-?)\d\b/gi, " ").replace(/\b\d{1,2}:\d{2}\b/g, " ");
  return /\d/.test(stripped);
}
function hasOwner(text) {
  if (OWNER_WORD_RE.test(text)) return true;
  const words = text.split(/\s+/).filter(Boolean);
  return words.some((w, i) => {
    if (i === 0 || /[.!?:;]["”’)]?$/.test(words[i - 1])) return false;
    const bare = w.replace(/[^\p{L}\p{N}]/gu, "");
    return /^\p{Lu}/u.test(bare) && !NOT_A_NAME.test(bare);
  });
}
function lintDeck(slides, options = {}) {
  const findings = [];
  const add = (rule, severity, message, slideId) => findings.push(slideId === void 0 ? { rule, severity, message } : { slideId, rule, severity, message });
  if (slides.length === 0) {
    add("deck-empty", "error", "The deck has no slides.");
    return findings;
  }
  const template = options.template ? getStorylineTemplate(options.template) : void 0;
  const answerFirst = options.answerFirst ?? template?.answerFirst ?? true;
  const seen = /* @__PURE__ */ new Set();
  for (const slide of slides) {
    if (seen.has(slide.id)) add("duplicate-id", "error", `Slide ID "${slide.id}" is used more than once.`, slide.id);
    seen.add(slide.id);
  }
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
      const soften = (s) => isCover ? "tip" : s;
      if (TOPIC_LABELS.has(label)) {
        add(
          "title-claim",
          soften("error"),
          `"${headline}" is a topic label. Say what the audience should conclude from this slide.`,
          slide.id
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
          slide.id
        );
      }
      if (words.length > MAX_TITLE_WORDS) {
        add(
          "title-length",
          "warn",
          `Title is ${words.length} words; keep it to ${MAX_TITLE_WORDS} or move detail to the body.`,
          slide.id
        );
      }
      if (/[.!?]["”’)]?\s+\S/.test(headline)) {
        add("one-idea", "tip", "Title has more than one sentence. One idea per slide: split it or pick one.", slide.id);
      }
    }
    if (!isAppendix && !sayOf(slide.notes)) {
      add("notes-present", "warn", "No talk track. Notes carry what you say; the title carries the claim.", slide.id);
    }
    if (headline && slide.role !== "plan" && slide.role !== "ask" && !isAppendix && hasClaimNumber(headline) && !SOURCE_RE.test(notesText(slide.notes)) && !(slide.source && slide.source.trim())) {
      add(
        "number-source",
        "warn",
        "The title has a number but no source. Add where it came from (dashboard, query, test, window) to the notes or the slide.",
        slide.id
      );
    }
  }
  const presented = slides.filter((s) => s.role !== "appendix");
  const tagged = slides.some((s) => s.role);
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
          "No slide states the answer or recommendation. Put the conclusion up front (role 'answer')."
        );
      } else if (at > 2) {
        add(
          "answer-first",
          "warn",
          `The answer arrives on content slide ${at + 1}. Move it into the first three; busy readers stop early.`,
          content[at].id
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
      const missing = [];
      if (!DECISION_RE.test(text)) missing.push("a decision or action verb");
      if (!hasOwner(text)) missing.push("an owner");
      if (!DATE_RE.test(text)) missing.push("a date");
      if (missing.length) {
        add("ask-concrete", "warn", `The ask is missing ${missing.join(", ")}.`, ask.id);
      }
    }
    for (let i = 1; i < slides.length; i++) {
      const prev = slides[i - 1].role;
      const role = slides[i].role;
      if (!role || role !== prev || REPEATABLE_ROLES.includes(role)) continue;
      const message = role === "option" ? "Two option slides in a row. Compare the options side by side on one slide, on the same criteria." : `Two ${SLIDE_ROLES[role].label.toLowerCase()} slides in a row. Merge them, or give the second its own role.`;
      add("role-repeat", "warn", message, slides[i].id);
    }
  }
  const count = presented.length;
  const budget = options.minutes ?? template?.minutes.max;
  if (options.minutes !== void 0 && count > 0) {
    if (count > options.minutes) {
      add(
        "deck-length",
        "warn",
        `${count} slides for ${options.minutes} minutes is under a minute each. Cut, merge, or move detail to the appendix.`
      );
    } else if (options.minutes / count > 2) {
      add(
        "deck-length",
        "tip",
        `${count} slides for ${options.minutes} minutes is over two minutes each. Fine for discussion; otherwise split a dense slide.`
      );
    }
  } else if (template && (count < template.slides.min || count > template.slides.max)) {
    add(
      "deck-length",
      "tip",
      `${count} presented slides; a ${template.name.toLowerCase()} usually runs ${template.slides.min}\u2013${template.slides.max}.`
    );
  }
  if (budget !== void 0) {
    const seconds = talkSeconds(slides);
    if (seconds > budget * 60) {
      add(
        "talk-time",
        "warn",
        `The talk track runs about ${Math.round(seconds / 60)} minutes at ${WORDS_PER_MINUTE} words a minute, over the ${budget}-minute budget.`
      );
    }
  }
  return findings;
}
function talkSeconds(slides) {
  const words = slides.filter((s) => s.role !== "appendix").reduce((sum, s) => sum + (sayOf(s.notes).match(/\S+/g)?.length ?? 0), 0);
  return Math.round(words / WORDS_PER_MINUTE * 60);
}
function storylineOf(slides) {
  return slides.map((slide, i) => {
    const entry = {
      number: i + 1,
      id: slide.id,
      title: headlineOf(slide),
      appendix: slide.role === "appendix"
    };
    if (slide.role) {
      entry.role = slide.role;
      entry.roleLabel = SLIDE_ROLES[slide.role].label;
    }
    return entry;
  });
}
function formatStoryline(slides) {
  return storylineOf(slides).map((e) => `${e.number}. ${e.roleLabel ? `[${e.roleLabel}] ` : ""}${e.title || "(untitled)"}`).join("\n");
}

// src/deck/transitions.ts
var CANVAS_WIDTH = 1920;
var CANVAS_HEIGHT = 1080;
var deckMotion = {
  quick: 160,
  base: 320,
  slow: 560,
  morph: 760,
  zoom: 1150,
  stagger: 45,
  settle: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  travel: "cubic-bezier(0.55, 0, 0.15, 1)"
};
function resolveTransition(from, to, transitionOf, fallback = "advance") {
  if (from === to) return { kind: "none" };
  if (Math.abs(from - to) !== 1) return { kind: "fade" };
  const t = transitionOf(Math.max(from, to)) ?? fallback;
  return typeof t === "string" ? { kind: t } : { kind: "zoom", zoom: t.zoom };
}
var easeInOutCubic = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
var smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function zoomFrame(target, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  const Z = Math.min(width / target.w, height / target.h);
  if (!Number.isFinite(Z) || Z < 1.05) return null;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  return {
    Z,
    fx: (cx * Z - width / 2) / (Z - 1),
    fy: (cy * Z - height / 2) / (Z - 1)
  };
}
function innerClipStart(target, frame, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  const map = (v, f) => (v - f) * frame.Z + f;
  const left = map(target.x, frame.fx);
  const top = map(target.y, frame.fy);
  const right = width - map(target.x + target.w, frame.fx);
  const bottom = height - map(target.y + target.h, frame.fy);
  return { top, right, bottom, left };
}
function zoomSamples(target, forward, samples = 24, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  const frame = zoomFrame(target, width, height);
  if (!frame) return null;
  const start = innerClipStart(target, frame, width, height);
  const radiusStart = 6 * frame.Z;
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = easeInOutCubic(forward ? t : 1 - t);
    const clipT = smoothstep(0.15, 0.85, p);
    const inset = (v) => (v * (1 - clipT)).toFixed(2);
    out.push({
      offset: t,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(${inset(start.top)}px ${inset(start.right)}px ${inset(start.bottom)}px ${inset(start.left)}px round ${(radiusStart * (1 - clipT)).toFixed(2)}px)`,
      innerOpacity: smoothstep(0.08, 0.4, p)
    });
  }
  return out;
}
function flipFrom(from, to, scale, fit = "auto", textScale) {
  if (textScale && fit !== "stretch") {
    return {
      transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${textScale.toFixed(4)})`
    };
  }
  let sx = from.w / Math.max(to.w, 0.01);
  let sy = from.h / Math.max(to.h, 0.01);
  const aspectGap = Math.abs(Math.log(from.w / from.h / (to.w / to.h)));
  if (fit === "uniform" || fit === "auto" && aspectGap < 0.25) {
    sx = sy;
  }
  return {
    transform: `translate(${((from.x - to.x) / scale).toFixed(2)}px, ${((from.y - to.y) / scale).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
  };
}
var rectOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
function blocksOf(layer) {
  let node = layer.querySelector(".uipack-deck-slide") ?? layer;
  if (node === layer) {
    while (node.children.length === 1 && node.firstElementChild) node = node.firstElementChild;
  }
  return Array.from(node.children).filter(
    (el) => el instanceof HTMLElement && !el.classList.contains("uipack-deck-layer__bg") && // The footer sits in the same place on every slide; it crossfades rather than moving.
    !el.classList.contains("uipack-deck-footer")
  );
}
function partitionForMorph(root, keys) {
  const matched = /* @__PURE__ */ new Map();
  const rest = [];
  const walk = (el) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) && !(child instanceof SVGElement)) continue;
      if (child.classList.contains("uipack-deck-layer__bg")) continue;
      const key = child.getAttribute("data-morph");
      if (key && keys.has(key)) matched.set(key, child);
      else if (keys.size && child.querySelector(Array.from(keys, (k) => `[data-morph="${CSS.escape(k)}"]`).join(","))) walk(child);
      else rest.push(child);
    }
  };
  walk(root);
  return { matched, rest };
}
var isText = (el) => /^(H[1-6]|P|SPAN|B|STRONG|EM|SMALL|LABEL|Q|BLOCKQUOTE)$/.test(el.tagName);
var fontSizeOf = (el) => parseFloat(getComputedStyle(el).fontSize) || 1;
var morphKeys = (layer) => new Set(Array.from(layer.querySelectorAll("[data-morph]"), (el) => el.getAttribute("data-morph")));
function runTransition(opts) {
  const { from, to, direction, scale, reducedMotion } = opts;
  let { kind } = opts.transition;
  if (typeof from.animate !== "function") return [];
  if (reducedMotion && kind !== "none") kind = "fade";
  const anims = [];
  const play = (el, keyframes, options) => {
    anims.push(el.animate(keyframes, { fill: "both", ...options }));
  };
  const bgOf = (layer) => layer.querySelector(":scope > .uipack-deck-layer__bg");
  if (kind === "zoom") {
    const zoomInto = direction === 1;
    const outer = zoomInto ? from : to;
    const inner = zoomInto ? to : from;
    const target = outer.querySelector(`[data-morph="${CSS.escape(opts.transition.zoom ?? "")}"]`);
    const layerRect = rectOf(outer);
    const box = target && rectOf(target);
    const local = box && {
      x: (box.x - layerRect.x) / scale,
      y: (box.y - layerRect.y) / scale,
      w: box.w / scale,
      h: box.h / scale
    };
    const samples = local ? zoomSamples(local, zoomInto) : null;
    if (!samples) kind = "fade";
    else {
      const frame = zoomFrame(local);
      const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
      inner.style.zIndex = "2";
      const timing = { duration: deckMotion.zoom, easing: "linear" };
      play(outer, samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin })), timing);
      play(inner, samples.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })), timing);
      for (const child of Array.from(target.children)) {
        play(child, samples.map((s) => ({ offset: s.offset, opacity: 1 - s.innerOpacity })), timing);
      }
      return anims;
    }
  }
  if (kind === "morph") {
    const fromKeys = morphKeys(from);
    const shared = new Set([...morphKeys(to)].filter((k) => fromKeys.has(k)));
    if (shared.size === 0) kind = "fade";
    else {
      const out = partitionForMorph(from, shared);
      const inn = partitionForMorph(to, shared);
      const travel = { duration: deckMotion.morph, easing: deckMotion.travel };
      for (const key of shared) {
        const a = out.matched.get(key);
        const b = inn.matched.get(key);
        if (!a || !b) continue;
        const ra = rectOf(a);
        const rb = rectOf(b);
        const fit = b.getAttribute("data-morph-fit") ?? "auto";
        const text = isText(a) && isText(b) ? fontSizeOf(a) / fontSizeOf(b) : void 0;
        const [x0, x1] = text ? [0.06, 0.32] : [0, 0.45];
        const fromB = flipFrom(ra, rb, scale, fit, text).transform;
        const fromA = flipFrom(rb, ra, scale, fit, text && 1 / text).transform;
        play(b, [
          { offset: 0, transformOrigin: "0 0", transform: fromB, opacity: 0 },
          { offset: x0, opacity: 0 },
          { offset: x1, opacity: 1 },
          { offset: 1, transformOrigin: "0 0", transform: "none", opacity: 1 }
        ], travel);
        play(a, [
          { offset: 0, transformOrigin: "0 0", transform: "none", opacity: 1 },
          { offset: text ? x0 : x1, opacity: 1 },
          { offset: text ? x1 : 1, opacity: 0 },
          { offset: 1, transformOrigin: "0 0", transform: fromA, opacity: 0 }
        ], travel);
      }
      for (const el of out.rest) play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: deckMotion.base * 0.75, easing: deckMotion.exit });
      inn.rest.forEach(
        (el, i) => play(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
          duration: deckMotion.slow,
          delay: deckMotion.morph * 0.5 + Math.min(i, 6) * deckMotion.stagger,
          easing: deckMotion.settle
        })
      );
      const bg = bgOf(to);
      if (bg) play(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], travel);
      return anims;
    }
  }
  if (kind === "advance") {
    from.style.zIndex = "2";
    const shift = 40 * direction;
    play(from, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-shift}px)` }], {
      duration: deckMotion.base,
      easing: deckMotion.exit
    });
    const blocks = blocksOf(to);
    (blocks.length ? blocks : [to]).forEach(
      (el, i) => play(el, [{ opacity: 0, transform: `translateX(${shift * 1.4}px)` }, { opacity: 1, transform: "none" }], {
        duration: deckMotion.slow,
        delay: deckMotion.quick * 0.6 + Math.min(i, 7) * deckMotion.stagger,
        easing: deckMotion.settle
      })
    );
    return anims;
  }
  if (kind === "fade") {
    from.style.zIndex = "2";
    play(from, [{ opacity: 1 }, { opacity: 0 }], {
      duration: reducedMotion ? deckMotion.quick : deckMotion.base,
      easing: "ease-out"
    });
  }
  return anims;
}

// src/deck/DeckPlayer.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function usePrefersReducedMotion(motion) {
  const [reduced, setReduced] = useState(motion === "none");
  useEffect(() => {
    if (motion === "none") return setReduced(true);
    if (typeof matchMedia === "undefined") return setReduced(false);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [motion]);
  return reduced;
}
function useCanvasScale() {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / CANVAS_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}
var railAt = (i, count) => `${count > 1 ? i / (count - 1) * 100 : 0}%`;
var pad = (n) => String(n).padStart(2, "0");
var notesOf = (slide) => !slide?.notes ? void 0 : typeof slide.notes === "string" ? { say: slide.notes, delivery: "", next: void 0 } : slide.notes;
var Layer = forwardRef(function Layer2({ slide, index, count, step, active, thumbnail = false, theme, reducedMotion }, ref) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ref,
      className: "uipack-deck-layer",
      "data-tone": slide.tone ?? "paper",
      "data-slide": slide.id,
      role: thumbnail ? void 0 : "group",
      "aria-roledescription": thumbnail ? void 0 : "slide",
      "aria-label": thumbnail ? void 0 : `${index + 1} of ${count}: ${slide.title}`,
      "aria-hidden": active ? void 0 : true,
      ...active ? {} : { inert: "" },
      children: [
        /* @__PURE__ */ jsx2("div", { className: "uipack-deck-layer__bg" }),
        /* @__PURE__ */ jsx2(DeckSlideContext.Provider, { value: { step, active, thumbnail, index, count }, children: slide.render({ step, active, thumbnail, theme, reducedMotion }) })
      ]
    }
  );
});
function SlideThumbnail({
  slide,
  index,
  count,
  theme = "light"
}) {
  const { ref, scale } = useCanvasScale();
  return /* @__PURE__ */ jsx2("div", { ref, className: "uipack-deck-thumb", "data-tone": slide.tone ?? "paper", children: /* @__PURE__ */ jsx2("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: /* @__PURE__ */ jsx2(Layer, { slide, index, count, step: Infinity, active: false, thumbnail: true, theme, reducedMotion: true }) }) });
}
function DeckPlayer({
  slides,
  id,
  title,
  theme = "light",
  transition = "advance",
  motion = "auto",
  mode = "audience",
  initial,
  onPositionChange,
  presenterHref,
  keyboard = "focus",
  view: initialView = "present",
  lint = false,
  className
}) {
  const count = slides.length;
  const startIndex = (() => {
    const s = initial?.slide;
    const i = typeof s === "number" ? s : s ? slides.findIndex((x) => x.id === s) : 0;
    return Math.min(Math.max(i, 0), Math.max(count - 1, 0));
  })();
  const [view, setView] = useState({ index: startIndex, step: initial?.step ?? 0, from: null, seq: 0 });
  const [overview, setOverview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [reading, setReading] = useState(initialView === "read");
  const reducedMotion = usePrefersReducedMotion(motion);
  const { ref: stageRef, scale } = useCanvasScale();
  const rootRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const overviewButtonRef = useRef(null);
  const anims = useRef([]);
  const maxStep = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;
  const settle = () => {
    for (const a of anims.current) a.cancel();
    anims.current = [];
    stageRef.current?.querySelectorAll(".uipack-deck-layer").forEach((el) => {
      el.style.zIndex = "";
      el.style.visibility = "";
    });
  };
  const go = useCallback(
    (index, step = 0) => {
      const target = Math.min(Math.max(index, 0), count - 1);
      settle();
      setView(
        (v) => v.index === target ? { ...v, step, from: null } : { index: target, step, from: { index: v.index, step: v.step }, seq: v.seq + 1 }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );
  const next = useCallback(() => {
    const v = viewRef.current;
    if (v.step < maxStep.current) setView({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go]);
  const prev = useCallback(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep.current);
    if (step > 0) setView({ ...v, step: step - 1 });
    else if (v.index > 0) go(v.index - 1, Infinity);
  }, [go]);
  useIsoLayoutEffect(() => {
    const layer = toRef.current;
    if (!layer) return;
    maxStep.current = Array.from(layer.querySelectorAll("[data-build], [data-steps]")).reduce(
      (m, el) => Math.max(m, Number(el.getAttribute("data-build") ?? el.getAttribute("data-steps")) || 0),
      0
    );
  }, [view.index, slides]);
  useIsoLayoutEffect(() => {
    if (!view.from) return;
    const from2 = fromRef.current;
    const to = toRef.current;
    const seq = view.seq;
    const done = () => {
      settle();
      if (from2) from2.style.visibility = "hidden";
      setView((v) => v.seq === seq ? { ...v, from: null } : v);
    };
    if (!from2 || !to || !scale) return done();
    const resolved = resolveTransition(view.from.index, view.index, (i) => slides[i]?.transition, transition);
    const started = runTransition({
      transition: resolved,
      from: from2,
      to,
      direction: view.index > view.from.index ? 1 : -1,
      scale,
      reducedMotion
    });
    anims.current = started;
    if (!started.length) return done();
    Promise.all(started.map((a) => a.finished)).then(() => {
      if (viewRef.current.seq === seq) done();
    }, () => {
    });
  }, [view.seq]);
  const channel = useRef(null);
  const remote = useRef(false);
  const reported = useRef({ index: view.index, step: view.step });
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`uipack-deck:${id}`);
    channel.current = ch;
    ch.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "hello") {
        const v = viewRef.current;
        ch.postMessage({ type: "go", index: v.index, step: v.step });
      } else if (msg.type === "go" && typeof msg.index === "number") {
        const v = viewRef.current;
        if (v.index === msg.index && v.step === msg.step) return;
        remote.current = true;
        if (v.index === msg.index) setView({ ...v, step: msg.step ?? 0 });
        else go(msg.index, msg.step ?? 0);
      }
    };
    ch.postMessage({ type: "hello" });
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [id, go]);
  useEffect(() => {
    const last = reported.current;
    if (last.index === view.index && last.step === view.step) return;
    reported.current = { index: view.index, step: view.step };
    onPositionChange?.({ index: view.index, step: view.step, id: slides[view.index].id });
    if (remote.current) {
      remote.current = false;
      return;
    }
    channel.current?.postMessage({ type: "go", index: view.index, step: view.step });
  }, [view.index, view.step]);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void rootRef.current?.requestFullscreen?.();
    rootRef.current?.focus();
  };
  const openPresenter = () => {
    let href = presenterHref;
    if (!href) {
      const url = new URL(location.href);
      url.searchParams.set("presenter", "1");
      url.searchParams.set("slide", slides[view.index].id);
      href = url.toString();
    }
    window.open(href, `uipack-deck-speaker-${id}`, "popup,width=1280,height=820");
  };
  const closeOverview = () => {
    setOverview(false);
    requestAnimationFrame(() => overviewButtonRef.current?.focus());
  };
  const onKeyDown = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || overview || reading) return;
    const t = e.target;
    if (t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""], [data-deck-keys="own"]')) return;
    const onControl = Boolean(t?.closest?.("button, a, summary")) && t !== rootRef.current;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        prev();
        break;
      case " ":
      case "Enter":
        if (onControl) return;
        if (e.shiftKey) prev();
        else next();
        break;
      case "Home":
        go(0, 0);
        break;
      case "End":
        go(count - 1, Infinity);
        break;
      case "g":
      case "G":
      case "o":
        setOverview(true);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "s":
      case "S":
        if (mode === "presenter") return;
        openPresenter();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const keyHandler = useRef(onKeyDown);
  keyHandler.current = onKeyDown;
  useEffect(() => {
    if (keyboard !== "global") return;
    const handler = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      keyHandler.current(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard]);
  const swipe = useRef(null);
  const onPointerDown = (e) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  };
  const current = slides[view.index];
  const from = view.from ? slides[view.from.index] : null;
  const stepNow = Math.min(view.step, maxStep.current);
  const atStart = view.index === 0 && stepNow === 0;
  const atEnd = view.index === count - 1 && view.step >= maxStep.current;
  const stage = /* @__PURE__ */ jsx2(
    "div",
    {
      ref: stageRef,
      className: "uipack-deck-stage",
      "data-tone": current.tone ?? "paper",
      onPointerDown,
      onPointerUp,
      onPointerCancel: () => swipe.current = null,
      children: /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: [
        from && view.from && /* @__PURE__ */ jsx2(
          Layer,
          {
            ref: fromRef,
            slide: from,
            index: view.from.index,
            count,
            step: view.from.step,
            active: false,
            theme,
            reducedMotion
          },
          `layer-${view.from.index}`
        ),
        /* @__PURE__ */ jsx2(
          Layer,
          {
            ref: toRef,
            slide: current,
            index: view.index,
            count,
            step: view.step,
            active: true,
            theme,
            reducedMotion
          },
          `layer-${view.index}`
        )
      ] })
    }
  );
  const controls = /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-controls", children: [
    /* @__PURE__ */ jsx2("button", { type: "button", className: "uipack-deck-step", onClick: prev, disabled: atStart, "aria-label": "Previous", children: /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\u2190" }) }),
    /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-rail", "aria-hidden": "true", children: [
      slides.map((s, i) => /* @__PURE__ */ jsx2("span", { style: { left: railAt(i, count) }, "data-passed": i <= view.index ? "" : void 0 }, s.id)),
      /* @__PURE__ */ jsx2("i", { style: { left: railAt(view.index, count) } })
    ] }),
    /* @__PURE__ */ jsxs2("span", { className: "uipack-deck-counter", children: [
      pad(view.index + 1),
      " / ",
      pad(count)
    ] }),
    /* @__PURE__ */ jsx2("button", { type: "button", className: "uipack-deck-step", onClick: next, disabled: atEnd, "aria-label": "Next", children: /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\u2192" }) }),
    /* @__PURE__ */ jsxs2("span", { className: "uipack-deck-tools", children: [
      mode === "audience" && /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => setReading(true), children: "Read" }),
      /* @__PURE__ */ jsx2("button", { type: "button", ref: overviewButtonRef, onClick: () => setOverview(true), "aria-keyshortcuts": "G", children: "All slides" }),
      mode === "audience" && /* @__PURE__ */ jsx2("button", { type: "button", onClick: openPresenter, "aria-keyshortcuts": "S", children: "Speaker view" }),
      typeof document !== "undefined" && document.fullscreenEnabled !== false && /* @__PURE__ */ jsx2("button", { type: "button", onClick: toggleFullscreen, "aria-keyshortcuts": "F", "aria-pressed": fullscreen, children: fullscreen ? "Exit full screen" : "Full screen" })
    ] })
  ] });
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ref: rootRef,
      className: ["uipack-deck", className].filter(Boolean).join(" "),
      "data-theme": theme,
      "data-mode": mode,
      "data-motion": reducedMotion ? "none" : "auto",
      "data-index": view.index,
      "data-step": Number.isFinite(view.step) ? view.step : "all",
      "data-transitioning": view.from ? "" : void 0,
      role: "region",
      "aria-label": title,
      "aria-roledescription": "slide deck",
      "aria-keyshortcuts": "ArrowLeft ArrowRight Space Home End G F S",
      tabIndex: 0,
      onKeyDown,
      children: [
        reading ? /* @__PURE__ */ jsx2(
          Reader,
          {
            slides,
            theme,
            onPresent: (i) => {
              setReading(false);
              go(i, 0);
              requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
            }
          }
        ) : /* @__PURE__ */ jsxs2(Fragment, { children: [
          mode === "presenter" ? /* @__PURE__ */ jsx2(Presenter, { slides, index: view.index, theme, stage }) : stage,
          controls
        ] }),
        /* @__PURE__ */ jsxs2("p", { className: "uipack-deck-sr", "aria-live": "polite", children: [
          "Slide ",
          view.index + 1,
          " of ",
          count,
          ": ",
          current.title
        ] }),
        overview && /* @__PURE__ */ jsx2(
          Overview,
          {
            slides,
            index: view.index,
            theme,
            findings: lint ? lintDeck(slides, lint === true ? {} : lint) : void 0,
            onPick: (i) => {
              go(i, 0);
              closeOverview();
            },
            onClose: closeOverview
          }
        )
      ]
    }
  );
}
function Reader({
  slides,
  theme,
  onPresent
}) {
  return /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-read", children: [
    /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-read__head", children: [
      /* @__PURE__ */ jsxs2("p", { children: [
        "Reading \xB7 ",
        slides.length,
        " slides"
      ] }),
      /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => onPresent(0), children: "Present" })
    ] }),
    /* @__PURE__ */ jsx2("ol", { children: slides.map((s, i) => {
      const notes = notesOf(s);
      return /* @__PURE__ */ jsxs2("li", { children: [
        /* @__PURE__ */ jsx2(SlideThumbnail, { slide: s, index: i, count: slides.length, theme }),
        /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-read__notes", children: [
          /* @__PURE__ */ jsxs2("h3", { children: [
            /* @__PURE__ */ jsx2("span", { children: pad(i + 1) }),
            " ",
            s.title
          ] }),
          notes?.say && /* @__PURE__ */ jsx2("p", { children: notes.say }),
          /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => onPresent(i), "aria-label": `Present from slide ${i + 1}: ${s.title}`, children: "Present from here" })
        ] })
      ] }, s.id);
    }) })
  ] });
}
function Overview({
  slides,
  index,
  theme,
  findings,
  onPick,
  onClose
}) {
  const ref = useRef(null);
  const [tab, setTab] = useState("slides");
  useEffect(() => {
    ref.current?.querySelector('[aria-current="true"]')?.focus();
  }, []);
  const onKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const buttons = Array.from(ref.current?.querySelectorAll("button") ?? []);
    const at = buttons.indexOf(document.activeElement);
    if (e.key === "Tab" && buttons.length) {
      if (e.shiftKey && at <= 0) {
        e.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (!e.shiftKey && at === buttons.length - 1) {
        e.preventDefault();
        buttons[0].focus();
      }
    }
    const tiles = buttons.filter((b) => b.dataset.tile !== void 0);
    const ti = tiles.indexOf(document.activeElement);
    if (ti >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      tiles[Math.min(Math.max(ti + (e.key === "ArrowRight" ? 1 : -1), 0), tiles.length - 1)].focus();
    }
  };
  return /* @__PURE__ */ jsxs2("div", { ref, className: "uipack-deck-overview", role: "dialog", "aria-modal": "true", "aria-label": "All slides", onKeyDown, children: [
    /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-overview__head", children: [
      /* @__PURE__ */ jsxs2("p", { children: [
        "All slides \xB7 ",
        slides.length
      ] }),
      /* @__PURE__ */ jsxs2("span", { className: "uipack-deck-overview__tabs", children: [
        /* @__PURE__ */ jsx2("button", { type: "button", "aria-pressed": tab === "slides", onClick: () => setTab("slides"), children: "Slides" }),
        /* @__PURE__ */ jsx2("button", { type: "button", "aria-pressed": tab === "storyline", onClick: () => setTab("storyline"), children: "Storyline" }),
        /* @__PURE__ */ jsx2("button", { type: "button", onClick: onClose, children: "Close" })
      ] })
    ] }),
    tab === "storyline" ? /* @__PURE__ */ jsx2(Storyline, { slides, index, findings, onPick }) : /* @__PURE__ */ jsx2("ol", { className: "uipack-deck-overview__grid", children: slides.map((s, i) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs2("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
      /* @__PURE__ */ jsx2(SlideThumbnail, { slide: s, index: i, count: slides.length, theme }),
      /* @__PURE__ */ jsxs2("span", { children: [
        /* @__PURE__ */ jsx2("b", { children: pad(i + 1) }),
        " ",
        s.title
      ] })
    ] }) }, s.id)) })
  ] });
}
var severityLabel = { error: "Fix", warn: "Check", tip: "Tip" };
function Storyline({
  slides,
  index,
  findings,
  onPick
}) {
  const entries = storylineOf(slides);
  const deckWide = findings?.filter((f) => !f.slideId) ?? [];
  const minutes = Math.round(talkSeconds(slides) / 6) / 10;
  return /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-storyline", children: [
    /* @__PURE__ */ jsxs2("p", { className: "uipack-deck-storyline__intro", children: [
      "Read only the headlines. They should make the whole argument. Talk track \u2248 ",
      minutes,
      " min."
    ] }),
    deckWide.length > 0 && /* @__PURE__ */ jsx2("ul", { className: "uipack-deck-storyline__findings", "aria-label": "Deck checks", children: deckWide.map((f, i) => /* @__PURE__ */ jsxs2("li", { "data-severity": f.severity, children: [
      /* @__PURE__ */ jsx2("b", { children: severityLabel[f.severity] }),
      " ",
      f.message
    ] }, i)) }),
    /* @__PURE__ */ jsx2("ol", { children: entries.map((e, i) => {
      const own = findings?.filter((f) => f.slideId === e.id) ?? [];
      return /* @__PURE__ */ jsxs2("li", { "data-appendix": e.appendix ? "" : void 0, children: [
        /* @__PURE__ */ jsxs2("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
          /* @__PURE__ */ jsx2("span", { className: "uipack-deck-storyline__num", children: pad(e.number) }),
          /* @__PURE__ */ jsx2("span", { className: "uipack-deck-storyline__role", children: e.roleLabel ?? "\u2014" }),
          /* @__PURE__ */ jsx2("span", { className: "uipack-deck-storyline__title", children: e.title })
        ] }),
        own.length > 0 && /* @__PURE__ */ jsx2("ul", { className: "uipack-deck-storyline__findings", children: own.map((f, j) => /* @__PURE__ */ jsxs2("li", { "data-severity": f.severity, children: [
          /* @__PURE__ */ jsx2("b", { children: severityLabel[f.severity] }),
          " ",
          f.message
        ] }, j)) })
      ] }, e.id);
    }) })
  ] });
}
function Presenter({
  slides,
  index,
  theme,
  stage
}) {
  const [started, setStarted] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - started) / 1e3));
  const notes = notesOf(slides[index]);
  const upcoming = slides[index + 1];
  const role = slides[index].role;
  return /* @__PURE__ */ jsxs2("div", { className: "uipack-deck-presenter", children: [
    /* @__PURE__ */ jsx2("div", { className: "uipack-deck-presenter__current", children: stage }),
    /* @__PURE__ */ jsxs2("aside", { className: "uipack-deck-presenter__side", children: [
      /* @__PURE__ */ jsxs2("section", { className: "uipack-deck-presenter__next", children: [
        /* @__PURE__ */ jsx2("h3", { children: "Next" }),
        upcoming ? /* @__PURE__ */ jsx2(SlideThumbnail, { slide: upcoming, index: index + 1, count: slides.length, theme }) : /* @__PURE__ */ jsx2("p", { className: "uipack-deck-presenter__end", children: "End of deck" })
      ] }),
      /* @__PURE__ */ jsxs2("section", { className: "uipack-deck-presenter__clock", children: [
        /* @__PURE__ */ jsxs2("span", { "aria-label": "Elapsed time", children: [
          pad(Math.floor(elapsed / 60)),
          ":",
          pad(elapsed % 60)
        ] }),
        /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => {
          setStarted(Date.now());
          setNow(Date.now());
        }, children: "Reset clock" })
      ] }),
      /* @__PURE__ */ jsxs2("section", { className: "uipack-deck-presenter__notes", children: [
        role && /* @__PURE__ */ jsxs2("p", { className: "uipack-deck-presenter__role", children: [
          /* @__PURE__ */ jsx2("b", { children: SLIDE_ROLES[role].label }),
          " answers \u201C",
          SLIDE_ROLES[role].question,
          "\u201D"
        ] }),
        /* @__PURE__ */ jsx2("h3", { children: "Say" }),
        /* @__PURE__ */ jsx2("p", { children: notes?.say ?? "No talk track for this slide." }),
        notes?.delivery && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Delivery" }),
          /* @__PURE__ */ jsx2("p", { children: notes.delivery })
        ] }),
        notes?.next && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("h3", { children: "Bridge" }),
          /* @__PURE__ */ jsx2("p", { children: notes.next })
        ] })
      ] })
    ] })
  ] });
}

// src/deck/bento.tsx
import {
  Children,
  isValidElement,
  useLayoutEffect as useLayoutEffect2,
  useRef as useRef2,
  useState as useState2
} from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function BentoCell(_) {
  return null;
}
function bentoCamera(cell, view, maxScale = 3, fill = 0.94) {
  const s = Math.max(1, Math.min(view.w * fill / cell.w, view.h * fill / cell.h, maxScale));
  return {
    s,
    tx: view.w / 2 - s * (cell.x + cell.w / 2),
    ty: view.h / 2 - s * (cell.y + cell.h / 2)
  };
}
var bentoFocusAt = (step, tour) => step >= 1 && step <= tour.length ? tour[step - 1] : null;
function Bento({ columns = 6, rows = 4, tour = [], maxScale = 3, className, style, children }) {
  const { step, thumbnail } = useDeckSlide();
  const focus = thumbnail ? null : bentoFocusAt(step, tour);
  const gridRef = useRef2(null);
  const [camera, setCamera] = useState2(null);
  useLayoutEffect2(() => {
    const grid = gridRef.current;
    if (!grid || !focus) return setCamera(null);
    const cell = grid.querySelector(`[data-bento-cell="${CSS.escape(focus)}"]`);
    if (!cell) return setCamera(null);
    setCamera(
      bentoCamera(
        { x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth, h: cell.offsetHeight },
        { w: grid.offsetWidth, h: grid.offsetHeight },
        maxScale
      )
    );
  }, [focus, maxScale]);
  const cells = Children.toArray(children).filter(
    (c) => isValidElement(c) && c.type === BentoCell
  );
  return /* @__PURE__ */ jsx3(
    "div",
    {
      className: ["uipack-deck-bento", className].filter(Boolean).join(" "),
      "data-steps": tour.length ? tour.length + 1 : void 0,
      "data-focus": focus ?? void 0,
      style,
      children: /* @__PURE__ */ jsx3(
        "div",
        {
          ref: gridRef,
          className: "uipack-deck-bento__grid",
          style: {
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            transform: camera ? `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` : void 0
          },
          children: cells.map(({ props: p }) => {
            const focused = focus === p.id;
            return /* @__PURE__ */ jsxs3(
              "div",
              {
                className: ["uipack-deck-bento__cell", p.className].filter(Boolean).join(" "),
                "data-bento-cell": p.id,
                "data-morph": p.id,
                "data-tone": p.tone && p.tone !== "surface" ? p.tone : void 0,
                "data-focused": focused ? "" : void 0,
                "data-dimmed": focus && !focused ? "" : void 0,
                style: { gridColumn: `span ${p.col ?? 2}`, gridRow: `span ${p.row ?? 1}` },
                children: [
                  /* @__PURE__ */ jsx3("div", { className: "uipack-deck-bento__face", "aria-hidden": focused && p.detail ? true : void 0, children: p.children }),
                  p.detail && /* @__PURE__ */ jsx3("div", { className: "uipack-deck-bento__detail", "aria-hidden": focused ? void 0 : true, children: p.detail })
                ]
              },
              p.id
            );
          })
        }
      )
    }
  );
}
export {
  Bento,
  BentoCell,
  Build,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DeckPlayer,
  DeckSlideContext,
  LINT_RULES,
  MAX_TITLE_WORDS,
  Morph,
  REPEATABLE_ROLES,
  SLIDE_ROLES,
  STORYLINE_TEMPLATES,
  Slide,
  SlideThumbnail,
  WORDS_PER_MINUTE,
  bentoCamera,
  bentoFocusAt,
  deckMotion,
  flipFrom,
  formatStoryline,
  getStorylineTemplate,
  lintDeck,
  resolveTransition,
  runTransition,
  storylineOf,
  talkSeconds,
  templateOutline,
  useDeckSlide,
  zoomFrame,
  zoomSamples
};
//# sourceMappingURL=deck.js.map