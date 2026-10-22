"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/deck/index.ts
var deck_exports = {};
__export(deck_exports, {
  BarChart: () => BarChart,
  Bento: () => Bento,
  BentoCell: () => BentoCell,
  Build: () => Build,
  CANVAS_HEIGHT: () => CANVAS_HEIGHT,
  CANVAS_WIDTH: () => CANVAS_WIDTH,
  CX_TYPE: () => CX_TYPE,
  Callout: () => Callout,
  ConsultingSlide: () => ConsultingSlide,
  DeckPlayer: () => DeckPlayer,
  DeckSlideContext: () => DeckSlideContext,
  HarveyBall: () => HarveyBall,
  HarveyTable: () => HarveyTable,
  KpiTiles: () => KpiTiles,
  LINT_RULES: () => LINT_RULES,
  LineChart: () => LineChart,
  MAX_TITLE_WORDS: () => MAX_TITLE_WORDS,
  MIN_TEXT_PX: () => MIN_TEXT_PX,
  Matrix2x2: () => Matrix2x2,
  Morph: () => Morph,
  Panel: () => Panel,
  REPEATABLE_ROLES: () => REPEATABLE_ROLES,
  Ref: () => Ref,
  SLIDE_ROLES: () => SLIDE_ROLES,
  STORYLINE_TEMPLATES: () => STORYLINE_TEMPLATES,
  Slide: () => Slide,
  SlideThumbnail: () => SlideThumbnail,
  SoWhat: () => SoWhat,
  Sparkline: () => Sparkline,
  StackedBar: () => StackedBar,
  Tracker: () => Tracker,
  WORDS_PER_MINUTE: () => WORDS_PER_MINUTE,
  Waterfall: () => Waterfall,
  bandLayout: () => bandLayout,
  barPath: () => barPath,
  bentoCamera: () => bentoCamera,
  bentoFocusAt: () => bentoFocusAt,
  bubbleRadius: () => bubbleRadius,
  calloutGeometry: () => calloutGeometry,
  deckMotion: () => deckMotion,
  flipFrom: () => flipFrom,
  formatStoryline: () => formatStoryline,
  formatValue: () => formatValue,
  formatter: () => formatter,
  getStorylineTemplate: () => getStorylineTemplate,
  harveyWedge: () => harveyWedge,
  linearScale: () => linearScale,
  lintDeck: () => lintDeck,
  niceStep: () => niceStep,
  niceTicks: () => niceTicks,
  resolveTransition: () => resolveTransition,
  runTransition: () => runTransition,
  spreadLabels: () => spreadLabels,
  stackSegments: () => stackSegments,
  storylineOf: () => storylineOf,
  talkSeconds: () => talkSeconds,
  templateOutline: () => templateOutline,
  textWidth: () => textWidth,
  useDeckSlide: () => useDeckSlide,
  waterfallBars: () => waterfallBars,
  wrapText: () => wrapText,
  zeroBasedDomain: () => zeroBasedDomain,
  zoomFrame: () => zoomFrame2,
  zoomSamples: () => zoomSamples2
});
module.exports = __toCommonJS(deck_exports);

// src/deck/DeckPlayer.tsx
var import_react2 = require("react");

// src/deck/parts.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var DeckSlideContext = (0, import_react.createContext)({
  step: Infinity,
  active: true,
  thumbnail: false,
  index: 0,
  count: 1
});
var useDeckSlide = () => (0, import_react.useContext)(DeckSlideContext);
function Morph({
  id,
  as: Tag = "div",
  fit,
  className,
  style,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { "data-morph": id, "data-morph-fit": fit, className, style, children });
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ["uipack-deck-slide", className].filter(Boolean).join(" "), "data-layout": layout, children: [
    eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "uipack-deck-eyebrow", children: eyebrow }),
    children,
    footer !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { className: "uipack-deck-footer", "data-morph": "deck-footer", "data-morph-fit": "stretch", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: footer }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
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

// src/zoom-math.ts
var easeInOutCubic = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
var smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function zoomFrame(target, width, height) {
  const Z = Math.min(width / target.w, height / target.h);
  if (!Number.isFinite(Z) || Z < 1.05) return null;
  const cx2 = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  return {
    Z,
    fx: (cx2 * Z - width / 2) / (Z - 1),
    fy: (cy * Z - height / 2) / (Z - 1)
  };
}
function innerClipStart(target, frame, width, height) {
  const map = (v, f) => (v - f) * frame.Z + f;
  const left = map(target.x, frame.fx);
  const top = map(target.y, frame.fy);
  const right = width - map(target.x + target.w, frame.fx);
  const bottom = height - map(target.y + target.h, frame.fy);
  return { top, right, bottom, left };
}
function zoomSamples(target, forward, width, height, { samples = 24, radius = 6 } = {}) {
  const frame = zoomFrame(target, width, height);
  if (!frame) return null;
  const start = innerClipStart(target, frame, width, height);
  const radiusStart = radius * frame.Z;
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = easeInOutCubic(forward ? t : 1 - t);
    const clipT = smoothstep(0.15, 0.85, p);
    const inset = (v) => (v * (1 - clipT)).toFixed(2);
    out.push({
      offset: t,
      p,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(${inset(start.top)}px ${inset(start.right)}px ${inset(start.bottom)}px ${inset(start.left)}px round ${(radiusStart * (1 - clipT)).toFixed(2)}px)`,
      innerOpacity: smoothstep(0.08, 0.4, p)
    });
  }
  return out;
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
var zoomFrame2 = (target, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => zoomFrame(target, width, height);
var zoomSamples2 = (target, forward, samples = 24, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => zoomSamples(target, forward, width, height, { samples, radius: 6 });
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
    const samples = local ? zoomSamples2(local, zoomInto) : null;
    if (!samples) kind = "fade";
    else {
      const frame = zoomFrame2(local);
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
var import_jsx_runtime2 = require("react/jsx-runtime");
var useIsoLayoutEffect = typeof window === "undefined" ? import_react2.useEffect : import_react2.useLayoutEffect;
function usePrefersReducedMotion(motion) {
  const [reduced, setReduced] = (0, import_react2.useState)(motion === "none");
  (0, import_react2.useEffect)(() => {
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
  const ref = (0, import_react2.useRef)(null);
  const [scale, setScale] = (0, import_react2.useState)(0);
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
var Layer = (0, import_react2.forwardRef)(function Layer2({ slide, index, count, step, active, thumbnail = false, theme, reducedMotion }, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-deck-layer__bg" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DeckSlideContext.Provider, { value: { step, active, thumbnail, index, count }, children: slide.render({ step, active, thumbnail, theme, reducedMotion }) })
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ref, className: "uipack-deck-thumb", "data-tone": slide.tone ?? "paper", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Layer, { slide, index, count, step: Infinity, active: false, thumbnail: true, theme, reducedMotion: true }) }) });
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
  const [view, setView] = (0, import_react2.useState)({ index: startIndex, step: initial?.step ?? 0, from: null, seq: 0 });
  const [overview, setOverview] = (0, import_react2.useState)(false);
  const [fullscreen, setFullscreen] = (0, import_react2.useState)(false);
  const [reading, setReading] = (0, import_react2.useState)(initialView === "read");
  const reducedMotion = usePrefersReducedMotion(motion);
  const { ref: stageRef, scale } = useCanvasScale();
  const rootRef = (0, import_react2.useRef)(null);
  const fromRef = (0, import_react2.useRef)(null);
  const toRef = (0, import_react2.useRef)(null);
  const overviewButtonRef = (0, import_react2.useRef)(null);
  const anims = (0, import_react2.useRef)([]);
  const maxStep = (0, import_react2.useRef)(0);
  const viewRef = (0, import_react2.useRef)(view);
  const commit = (next2) => {
    viewRef.current = next2;
    setView(next2);
  };
  const settle = () => {
    for (const a of anims.current) a.cancel();
    anims.current = [];
    stageRef.current?.querySelectorAll(".uipack-deck-layer").forEach((el) => {
      el.style.zIndex = "";
      el.style.visibility = "";
    });
  };
  const go = (0, import_react2.useCallback)(
    (index, step = 0) => {
      const target = Math.min(Math.max(index, 0), count - 1);
      settle();
      const v = viewRef.current;
      commit(
        v.index === target ? { ...v, step, from: null } : { index: target, step, from: { index: v.index, step: v.step }, seq: v.seq + 1 }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );
  const next = (0, import_react2.useCallback)(() => {
    const v = viewRef.current;
    if (v.step < maxStep.current) commit({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go]);
  const prev = (0, import_react2.useCallback)(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep.current);
    if (step > 0) commit({ ...v, step: step - 1 });
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
      if (viewRef.current.seq === seq) commit({ ...viewRef.current, from: null });
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
  const channel = (0, import_react2.useRef)(null);
  const remote = (0, import_react2.useRef)(false);
  const reported = (0, import_react2.useRef)({ index: view.index, step: view.step });
  (0, import_react2.useEffect)(() => {
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
        if (v.index === msg.index) commit({ ...v, step: msg.step ?? 0 });
        else go(msg.index, msg.step ?? 0);
      }
    };
    ch.postMessage({ type: "hello" });
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [id, go]);
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  const keyHandler = (0, import_react2.useRef)(onKeyDown);
  keyHandler.current = onKeyDown;
  (0, import_react2.useEffect)(() => {
    if (keyboard !== "global") return;
    const handler = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      keyHandler.current(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard]);
  const swipe = (0, import_react2.useRef)(null);
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
  const stage = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      ref: stageRef,
      className: "uipack-deck-stage",
      "data-tone": current.tone ?? "paper",
      onPointerDown,
      onPointerUp,
      onPointerCancel: () => swipe.current = null,
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-canvas", style: { transform: `scale(${scale})`, visibility: scale ? void 0 : "hidden" }, children: [
        from && view.from && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
  const controls = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-controls", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "uipack-deck-step", onClick: prev, disabled: atStart, "aria-label": "Previous", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2190" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-rail", "aria-hidden": "true", children: [
      slides.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { left: railAt(i, count) }, "data-passed": i <= view.index ? "" : void 0 }, s.id)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { style: { left: railAt(view.index, count) } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-deck-counter", children: [
      pad(view.index + 1),
      " / ",
      pad(count)
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "uipack-deck-step", onClick: next, disabled: atEnd, "aria-label": "Next", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2192" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-deck-tools", children: [
      mode === "audience" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setReading(true), children: "Read" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", ref: overviewButtonRef, onClick: () => setOverview(true), "aria-keyshortcuts": "G", children: "All slides" }),
      mode === "audience" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: openPresenter, "aria-keyshortcuts": "S", children: "Speaker view" }),
      typeof document !== "undefined" && document.fullscreenEnabled !== false && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: toggleFullscreen, "aria-keyshortcuts": "F", "aria-pressed": fullscreen, children: fullscreen ? "Exit full screen" : "Full screen" })
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
        reading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          mode === "presenter" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Presenter, { slides, index: view.index, theme, stage }) : stage,
          controls
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-deck-sr", "aria-live": "polite", children: [
          "Slide ",
          view.index + 1,
          " of ",
          count,
          ": ",
          current.title
        ] }),
        overview && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-read", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-read__head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
        "Reading \xB7 ",
        slides.length,
        " slides"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => onPresent(0), children: "Present" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { children: slides.map((s, i) => {
      const notes = notesOf(s);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SlideThumbnail, { slide: s, index: i, count: slides.length, theme }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-read__notes", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: pad(i + 1) }),
            " ",
            s.title
          ] }),
          notes?.say && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: notes.say }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => onPresent(i), "aria-label": `Present from slide ${i + 1}: ${s.title}`, children: "Present from here" })
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
  const ref = (0, import_react2.useRef)(null);
  const [tab, setTab] = (0, import_react2.useState)("slides");
  (0, import_react2.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref, className: "uipack-deck-overview", role: "dialog", "aria-modal": "true", "aria-label": "All slides", onKeyDown, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-overview__head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
        "All slides \xB7 ",
        slides.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-deck-overview__tabs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "aria-pressed": tab === "slides", onClick: () => setTab("slides"), children: "Slides" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "aria-pressed": tab === "storyline", onClick: () => setTab("storyline"), children: "Storyline" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: onClose, children: "Close" })
      ] })
    ] }),
    tab === "storyline" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Storyline, { slides, index, findings, onPick }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "uipack-deck-overview__grid", children: slides.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SlideThumbnail, { slide: s, index: i, count: slides.length, theme }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: pad(i + 1) }),
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-storyline", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-deck-storyline__intro", children: [
      "Read only the headlines. They should make the whole argument. Talk track \u2248 ",
      minutes,
      " min."
    ] }),
    deckWide.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "uipack-deck-storyline__findings", "aria-label": "Deck checks", children: deckWide.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { "data-severity": f.severity, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: severityLabel[f.severity] }),
      " ",
      f.message
    ] }, i)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { children: entries.map((e, i) => {
      const own = findings?.filter((f) => f.slideId === e.id) ?? [];
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { "data-appendix": e.appendix ? "" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "data-tile": "", "aria-current": i === index ? "true" : void 0, onClick: () => onPick(i), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-deck-storyline__num", children: pad(e.number) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-deck-storyline__role", children: e.roleLabel ?? "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-deck-storyline__title", children: e.title })
        ] }),
        own.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "uipack-deck-storyline__findings", children: own.map((f, j) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { "data-severity": f.severity, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: severityLabel[f.severity] }),
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
  const [started, setStarted] = (0, import_react2.useState)(() => Date.now());
  const [now, setNow] = (0, import_react2.useState)(() => Date.now());
  (0, import_react2.useEffect)(() => {
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - started) / 1e3));
  const notes = notesOf(slides[index]);
  const upcoming = slides[index + 1];
  const role = slides[index].role;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-deck-presenter", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-deck-presenter__current", children: stage }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { className: "uipack-deck-presenter__side", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "uipack-deck-presenter__next", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "Next" }),
        upcoming ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SlideThumbnail, { slide: upcoming, index: index + 1, count: slides.length, theme }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "uipack-deck-presenter__end", children: "End of deck" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "uipack-deck-presenter__clock", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { "aria-label": "Elapsed time", children: [
          pad(Math.floor(elapsed / 60)),
          ":",
          pad(elapsed % 60)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => {
          setStarted(Date.now());
          setNow(Date.now());
        }, children: "Reset clock" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "uipack-deck-presenter__notes", children: [
        role && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-deck-presenter__role", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: SLIDE_ROLES[role].label }),
          " answers \u201C",
          SLIDE_ROLES[role].question,
          "\u201D"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "Say" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: notes?.say ?? "No talk track for this slide." }),
        notes?.delivery && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "Delivery" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: notes.delivery })
        ] }),
        notes?.next && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "Bridge" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: notes.next })
        ] })
      ] })
    ] })
  ] });
}

// src/deck/bento.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function BentoCell(_) {
  return null;
}
function bentoCamera(cell, view, maxScale = 3, fill2 = 0.94) {
  const s = Math.max(1, Math.min(view.w * fill2 / cell.w, view.h * fill2 / cell.h, maxScale));
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
  const gridRef = (0, import_react3.useRef)(null);
  const [camera, setCamera] = (0, import_react3.useState)(null);
  (0, import_react3.useLayoutEffect)(() => {
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
  const cells = import_react3.Children.toArray(children).filter(
    (c) => (0, import_react3.isValidElement)(c) && c.type === BentoCell
  );
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      className: ["uipack-deck-bento", className].filter(Boolean).join(" "),
      "data-steps": tour.length ? tour.length + 1 : void 0,
      "data-focus": focus ?? void 0,
      style,
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "uipack-deck-bento__face", "aria-hidden": focused && p.detail ? true : void 0, children: p.children }),
                  p.detail && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "uipack-deck-bento__detail", "aria-hidden": focused ? void 0 : true, children: p.detail })
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

// src/deck/consulting/frame.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var cx = (...names) => names.filter(Boolean).join(" ");
function Tracker({ sections, current }) {
  const at = typeof current === "number" ? current : sections.indexOf(current);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("nav", { className: "uipack-cx-tracker", "aria-label": "Sections", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ol", { children: sections.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { "aria-current": i === at ? "step" : void 0, "data-done": i < at ? "" : void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("i", { "aria-hidden": "true" }),
    s
  ] }, s)) }) });
}
function ConsultingSlide({
  tracker,
  title,
  subtitle,
  sticker,
  takeaway,
  takeawayLabel = "So what",
  notes,
  source,
  label,
  rows,
  className,
  children
}) {
  const { index } = useDeckSlide();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: cx("uipack-deck-slide uipack-cx-slide", className), children: [
    (tracker || sticker) && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "uipack-cx-top", children: [
      tracker ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tracker, { ...tracker }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", {}),
      sticker && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "uipack-cx-sticker", children: sticker })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "uipack-cx-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "uipack-cx-title", children: import_react4.Children.map(title, (child) => typeof child === "string" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: child }) : child) }),
      subtitle && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "uipack-cx-subtitle", children: subtitle })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-cx-body", style: rows ? { gridTemplateRows: rows } : void 0, children }),
    takeaway && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "uipack-cx-takeaway", "aria-label": "So what", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: takeawayLabel }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: takeaway })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("footer", { className: "uipack-deck-footer uipack-cx-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "uipack-cx-footer__notes", children: [
        notes && notes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ol", { children: notes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: i + 1 }),
          n
        ] }, i)) }),
        source && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: "Source:" }),
          " ",
          source
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "uipack-cx-footer__page", children: [
        label && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: String(index + 1).padStart(2, "0") })
      ] })
    ] })
  ] });
}
function Ref({ n }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("sup", { className: "uipack-cx-ref", children: n });
}
var placement = ({ cols = 12, rows = 1, col, row }) => ({
  gridColumn: col ? `${col} / span ${cols}` : `span ${cols}`,
  gridRow: row ? `${row} / span ${rows}` : `span ${rows}`
});
function Panel({ title, unit, callout, morphId, emphasis, className, children, ...grid }) {
  const body = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "uipack-cx-panel__head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: title }),
        unit && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: unit })
      ] }),
      callout && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "uipack-cx-panel__callout", children: callout })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-cx-panel__body", children })
  ] });
  const props = {
    className: cx("uipack-cx-panel", emphasis && "uipack-cx-panel--emphasis", className),
    style: placement(grid)
  };
  return morphId ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Morph, { id: morphId, as: "section", fit: "stretch", ...props, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-cx-panel__inner", children: body }) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "uipack-cx-panel__inner", children: body }) });
}
function SoWhat({ title = "So what", children, ...grid }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "uipack-cx-sowhat", style: placement(grid), "aria-label": "So what", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { children })
  ] });
}

// src/deck/consulting/hooks.ts
var import_react5 = require("react");
var useIsoLayoutEffect2 = typeof window === "undefined" ? import_react5.useEffect : import_react5.useLayoutEffect;
function useChartSize(fixed, fallback = { width: 640, height: 360 }) {
  const ref = (0, import_react5.useRef)(null);
  const [size, setSize] = (0, import_react5.useState)({
    width: fixed?.width ?? fallback.width,
    height: fixed?.height ?? fallback.height
  });
  const fixedW = fixed?.width;
  const fixedH = fixed?.height;
  useIsoLayoutEffect2(() => {
    const el = ref.current;
    if (!el || fixedW !== void 0 && fixedH !== void 0) return;
    const measure = () => {
      const w = fixedW ?? el.clientWidth;
      const h = fixedH ?? el.clientHeight;
      if (w > 0 && h > 0) setSize((s) => Math.abs(s.width - w) < 0.5 && Math.abs(s.height - h) < 0.5 ? s : { width: w, height: h });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedW, fixedH]);
  return { ref, ...size };
}
function useGrown() {
  const { active, thumbnail } = useDeckSlide();
  const [grown, setGrown] = (0, import_react5.useState)(!active || thumbnail);
  (0, import_react5.useEffect)(() => {
    if (grown) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return grown;
}

// src/deck/consulting/scale.ts
var CX_TYPE = {
  min: 20,
  tick: 20,
  label: 22,
  value: 22,
  callout: 22,
  quadrant: 20
};
var MIN_TEXT_PX = CX_TYPE.min;
function linearScale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const f = ((v) => span === 0 ? r0 : r0 + (v - d0) / span * (r1 - r0));
  f.domain = [d0, d1];
  f.range = [r0, r1];
  f.invert = (px) => r1 === r0 ? d0 : d0 + (px - r0) / (r1 - r0) * span;
  return f;
}
function niceStep(span, count = 5) {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}
function niceTicks(min, max, count = 5) {
  if (min === max) {
    const pad2 = Math.abs(min) || 1;
    min -= pad2;
    max += pad2;
  }
  if (min > max) [min, max] = [max, min];
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Number(v.toFixed(10)));
  return { domain: [lo, hi], ticks };
}
function zeroBasedDomain(values) {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  return lo === hi ? [0, 1] : [lo, hi];
}
function bandLayout(count, start, length, fill2 = 0.6, maxMark = 48) {
  if (count <= 0) return [];
  const size = length / count;
  const mark = Math.max(1, Math.min(size * fill2, maxMark));
  return Array.from({ length: count }, (_, index) => {
    const s = start + index * size;
    return { index, start: s, size, markStart: s + (size - mark) / 2, mark, centre: s + size / 2 };
  });
}
function waterfallBars(steps) {
  let level = 0;
  return steps.map((s) => {
    if (s.total) {
      const v = s.value ?? level;
      level = v;
      return { label: s.label, kind: "total", value: v, from: 0, to: v };
    }
    const d = s.value ?? 0;
    const from = level;
    level += d;
    return { label: s.label, kind: d >= 0 ? "up" : "down", value: d, from, to: level };
  });
}
function stackSegments(values, percent = false) {
  const clean = values.map((v) => Number.isFinite(v) && v > 0 ? v : 0);
  const total = clean.reduce((a, b) => a + b, 0);
  let acc = 0;
  return clean.map((v, series) => {
    const share = total > 0 ? v / total : 0;
    const len = percent ? share * 100 : v;
    const seg = { series, value: values[series], from: acc, to: acc + len, share };
    acc += len;
    return seg;
  });
}
function harveyWedge(level, cx2, cy, r) {
  const q = Math.max(0, Math.min(4, Math.round(level)));
  if (q === 0) return "";
  if (q === 4) return `M${cx2 - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const angle = q / 4 * Math.PI * 2;
  const x = cx2 + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const large = q > 2 ? 1 : 0;
  return `M${cx2} ${cy}L${cx2} ${cy - r}A${r} ${r} 0 ${large} 1 ${round(x)} ${round(y)}Z`;
}
function bubbleRadius(size, maxSize, maxRadius, minRadius = 8) {
  if (!(maxSize > 0) || !(size > 0)) return minRadius;
  return Math.max(minRadius, Math.sqrt(size / maxSize) * maxRadius);
}
function barPath(orientation, base, end, crossStart, thickness, radius = 4) {
  const len = Math.abs(end - base);
  const r = Math.max(0, Math.min(radius, len, thickness / 2));
  const dir = end >= base ? 1 : -1;
  if (orientation === "horizontal") {
    const y0 = crossStart;
    const y1 = crossStart + thickness;
    return [
      `M${round(base)} ${round(y0)}`,
      `H${round(end - dir * r)}`,
      `Q${round(end)} ${round(y0)} ${round(end)} ${round(y0 + r)}`,
      `V${round(y1 - r)}`,
      `Q${round(end)} ${round(y1)} ${round(end - dir * r)} ${round(y1)}`,
      `H${round(base)}Z`
    ].join("");
  }
  const x0 = crossStart;
  const x1 = crossStart + thickness;
  return [
    `M${round(x0)} ${round(base)}`,
    `V${round(end - dir * r)}`,
    `Q${round(x0)} ${round(end)} ${round(x0 + r)} ${round(end)}`,
    `H${round(x1 - r)}`,
    `Q${round(x1)} ${round(end)} ${round(x1)} ${round(end - dir * r)}`,
    `V${round(base)}Z`
  ].join("");
}
var round = (v) => Math.round(v * 100) / 100;
function textWidth(text, size, weight = 400) {
  let em = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) em += 0.58;
    else if (/[A-Z]/.test(ch)) em += /[MW]/.test(ch) ? 0.86 : 0.66;
    else if (/[a-z]/.test(ch)) em += /[mw]/.test(ch) ? 0.8 : /[iljtf]/.test(ch) ? 0.3 : 0.54;
    else if (ch === " ") em += 0.27;
    else if (/[.,:;'’|!]/.test(ch)) em += 0.28;
    else if (/[$%€£+−\-–—/()]/.test(ch)) em += 0.6;
    else em += 0.62;
  }
  return em * size * (weight === 600 ? 1.05 : 1);
}
function wrapText(text, size, maxWidth, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidth(next, size) > maxWidth && lines.length < maxLines - 1) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function spreadLabels(ys, gap, min = -Infinity, max = Infinity) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => Math.min(Math.max(o.y, min), max));
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.length ? placed[placed.length - 1] - max : 0;
  if (overflow > 0) {
    placed[placed.length - 1] -= overflow;
    for (let k = placed.length - 2; k >= 0; k--) placed[k] = Math.min(placed[k], placed[k + 1] - gap);
  }
  const out = new Array(ys.length);
  order.forEach((o, k) => out[o.i] = placed[k]);
  return out;
}
function formatValue(value, options = {}) {
  const { decimals = 0, prefix = "", suffix = "", sign = false, compact = false } = options;
  let v = Math.abs(value);
  let unit = "";
  if (compact) {
    if (v >= 1e9) [v, unit] = [v / 1e9, "B"];
    else if (v >= 1e6) [v, unit] = [v / 1e6, "M"];
    else if (v >= 1e3) [v, unit] = [v / 1e3, "K"];
  }
  const body = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const isZero = Number(body.replace(/,/g, "")) === 0;
  const s = value < 0 && !isZero ? "\u2212" : sign && !isZero ? "+" : "";
  return `${s}${prefix}${body}${unit}${suffix}`;
}
var formatter = (options = {}) => (v) => formatValue(v, options);

// src/deck/consulting/charts.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var defaultFormat = (v) => formatValue(v, { decimals: Number.isInteger(v) ? 0 : 1 });
var fill = {
  accent: "var(--uipack-cx-accent)",
  context: "var(--uipack-cx-context)",
  total: "var(--uipack-cx-total)",
  good: "var(--uipack-cx-good)",
  bad: "var(--uipack-cx-bad)",
  series: (i) => `var(--uipack-cx-s${i % 4 + 1})`,
  seriesInk: (i) => `var(--uipack-cx-s${i % 4 + 1}-ink)`
};
function Frame({
  size,
  label,
  className,
  children
}) {
  const grown = useGrown();
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref: size.ref, className: ["uipack-cx-chart", className].filter(Boolean).join(" "), "data-grown": grown ? "" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "svg",
    {
      className: "uipack-cx-svg",
      width: size.width,
      height: size.height,
      viewBox: `0 0 ${size.width} ${size.height}`,
      role: "img",
      "aria-label": label,
      children
    }
  ) });
}
var growStyle = (origin, delay = 0) => ({ transformOrigin: origin, "--uipack-cx-delay": `${delay}ms` });
function Text({
  x,
  y,
  size = CX_TYPE.label,
  anchor = "start",
  weight,
  muted,
  baseline = "central",
  halo,
  children,
  className
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "text",
    {
      x,
      y,
      fontSize: Math.max(size, CX_TYPE.min),
      textAnchor: anchor,
      dominantBaseline: baseline,
      className: ["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong", halo && "uipack-cx-halo", className].filter(Boolean).join(" "),
      children
    }
  );
}
function Lines({ x, y, lines, size = CX_TYPE.label, anchor = "middle", weight, muted, top }) {
  const lh = size * 1.2;
  const y0 = top ? y + size * 0.8 : y - (lines.length - 1) * lh / 2;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "text",
    {
      x,
      y: y0,
      fontSize: Math.max(size, CX_TYPE.min),
      textAnchor: anchor,
      dominantBaseline: top ? "auto" : "central",
      className: ["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong"].filter(Boolean).join(" "),
      children: lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tspan", { x, dy: i === 0 ? 0 : lh, children: l }, i))
    }
  );
}
function calloutGeometry(point, at, text, maxWidth = 260, align = "start", size = CX_TYPE.callout) {
  const lines = wrapText(text, size, maxWidth, 4);
  const w = Math.max(...lines.map((l) => textWidth(l, size)));
  const h = lines.length * size * 1.25;
  const bx = align === "end" ? at.x - w : at.x;
  const box = { x: bx, y: at.y, w, h };
  const gap = 10;
  let x1;
  let y1;
  if (point.x < box.x - gap) {
    x1 = box.x - gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else if (point.x > box.x + w + gap) {
    x1 = box.x + w + gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else {
    x1 = Math.min(Math.max(point.x, box.x), box.x + w);
    y1 = point.y < box.y ? box.y - gap : box.y + h + gap;
  }
  return { lines, box, leader: { x1, y1, x2: point.x, y2: point.y } };
}
function Callout({ x, y, tx, ty, text, width = 260, align = "start" }) {
  const g = calloutGeometry({ x, y }, { x: tx, y: ty }, text, width, align);
  const size = CX_TYPE.callout;
  const textX = align === "end" ? g.box.x + g.box.w : g.box.x;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { className: "uipack-cx-callout", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-callout__leader", x1: g.leader.x1, y1: g.leader.y1, x2: x, y2: y }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { className: "uipack-cx-callout__ring", cx: x, cy: y, r: 9 }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { className: "uipack-cx-callout__dot", cx: x, cy: y, r: 3.5 }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "text",
      {
        x: textX,
        y: g.box.y + size * 0.85,
        fontSize: size,
        textAnchor: align,
        className: "uipack-cx-t uipack-cx-callout__text uipack-cx-halo",
        children: g.lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tspan", { x: textX, dy: i === 0 ? 0 : size * 1.25, children: l }, i))
      }
    )
  ] });
}
function BarChart({
  data,
  orientation = "horizontal",
  sort,
  format = defaultFormat,
  domain,
  reference,
  callout,
  ariaLabel,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const order = sort ?? (orientation === "horizontal" ? "desc" : "none");
  const rows = [...data];
  if (order !== "none") rows.sort((a, b) => order === "desc" ? b.value - a.value : a.value - b.value);
  const emphasis = rows.some((d) => d.highlight);
  const colour = (d) => !emphasis || d.highlight ? fill.accent : fill.context;
  const values = rows.map((d) => d.value);
  const dom = domain ?? zeroBasedDomain(reference ? [...values, reference.value] : values);
  const label = ariaLabel ?? `Bar chart. ${rows.map((d) => `${d.label}: ${format(d.value)}`).join("; ")}.`;
  const valueW = Math.max(...rows.map((d) => textWidth(format(d.value), CX_TYPE.value, 600))) + 14;
  const refTop = reference ? 40 : 4;
  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...rows.map((d) => textWidth(d.label, CX_TYPE.label))) + 20, W * 0.42);
    const x = linearScale(dom, [labelW, W - valueW]);
    const bands = bandLayout(rows.length, refTop, H - refTop, 0.62, 36);
    const zero2 = x(Math.max(dom[0], Math.min(0, dom[1])));
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
      reference && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { className: "uipack-cx-ref-line", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { x1: x(reference.value), x2: x(reference.value), y1: refTop - 8, y2: H }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: x(reference.value), y: 14, size: CX_TYPE.tick, anchor: "middle", muted: true, halo: true, children: reference.label })
      ] }),
      rows.map((d, i) => {
        const b = bands[i];
        const end = x(d.value);
        const lines = wrapText(d.label, CX_TYPE.label, labelW - 20, 2);
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Lines, { x: labelW - 16, y: b.centre, lines, anchor: "end", weight: d.highlight ? 600 : void 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "path",
            {
              className: "uipack-cx-grow",
              "data-axis": "x",
              style: { ...growStyle(d.value >= 0 ? "0% 50%" : "100% 50%", i * 40), fill: colour(d) },
              d: barPath("horizontal", zero2, end, b.markStart, b.mark),
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${d.label}: ${format(d.value)}` })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: d.value >= 0 ? end + 10 : end - 10, y: b.centre, anchor: d.value >= 0 ? "start" : "end", weight: 600, halo: true, children: format(d.value) })
        ] }, d.label);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-axis", x1: zero2, x2: zero2, y1: refTop - 4, y2: H }),
      callout && (() => {
        const i = rows.findIndex((d) => d.label === callout.label);
        if (i < 0) return null;
        const px = x(rows[i].value);
        const py = bands[i].centre;
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Callout, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
      })()
    ] });
  }
  const labelLines = rows.map((d) => d.label);
  const bandsProbe = bandLayout(rows.length, 0, W, 0.56, 64);
  const wrapped = labelLines.map((l) => wrapText(l, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 36;
  const y = linearScale(dom, [H - bottom, top]);
  const zero = y(Math.max(dom[0], Math.min(0, dom[1])));
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
    reference && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { className: "uipack-cx-ref-line", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { x1: 0, x2: W, y1: y(reference.value), y2: y(reference.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: W, y: y(reference.value) - 16, size: CX_TYPE.tick, anchor: "end", muted: true, children: reference.label })
    ] }),
    rows.map((d, i) => {
      const b = bandsProbe[i];
      const end = y(d.value);
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "path",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle(d.value >= 0 ? "50% 100%" : "50% 0%", i * 40), fill: colour(d) },
            d: barPath("vertical", zero, end, b.markStart, b.mark),
            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${d.label}: ${format(d.value)}` })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: b.centre, y: d.value >= 0 ? end - 16 : end + 16, anchor: "middle", weight: 600, halo: true, children: format(d.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Lines, { x: b.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: d.highlight ? 600 : void 0 })
      ] }, d.label);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: zero, y2: zero }),
    callout && (() => {
      const i = rows.findIndex((d) => d.label === callout.label);
      if (i < 0) return null;
      const px = bandsProbe[i].centre;
      const py = y(rows[i].value);
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Callout, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}
function Waterfall({ steps, format = defaultFormat, goodDirection = "up", domain, callout, ariaLabel, width, height }) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const bars = waterfallBars([...steps]);
  const levels = bars.flatMap((b) => [b.from, b.to]);
  const dom = domain ?? zeroBasedDomain(levels);
  const broken = dom[0] > 0;
  const bandsProbe = bandLayout(bars.length, 0, W, 0.62, 76);
  const wrapped = bars.map((b) => wrapText(b.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 6, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 40;
  const y = linearScale(dom, [H - bottom, top]);
  const base = y(dom[0]);
  const label = ariaLabel ?? `Waterfall. ${bars.map((b) => `${b.label}: ${b.kind === "total" ? format(b.value) : (b.value >= 0 ? "+" : "") + format(b.value)}`).join("; ")}.`;
  const show = (b) => b.kind === "total" ? format(b.value) : `${b.value > 0 ? "+" : ""}${format(b.value)}`;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
    bars.map((b, i) => {
      const band = bandsProbe[i];
      const next = bandsProbe[i + 1];
      const good = b.kind !== "total" && b.value >= 0 === (goodDirection === "up");
      const colour = b.kind === "total" ? fill.total : good ? fill.good : fill.bad;
      const yTop = y(Math.max(b.from, b.to));
      const yBot = b.kind === "total" ? base : y(Math.min(b.from, b.to));
      const h = Math.max(2, yBot - yTop);
      const labelY = yTop - 18;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { "data-kind": b.kind, children: [
        b.kind === "total" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "path",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle("50% 100%", i * 60), fill: colour },
            d: barPath("vertical", base, yTop, band.markStart, band.mark),
            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${b.label}: ${show(b)}` })
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "rect",
          {
            className: "uipack-cx-grow",
            "data-axis": "y",
            style: { ...growStyle(b.kind === "up" ? "50% 100%" : "50% 0%", i * 60), fill: colour },
            x: band.markStart,
            y: yTop,
            width: band.mark,
            height: h,
            rx: 2,
            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${b.label}: ${show(b)}` })
          }
        ),
        broken && b.kind === "total" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "path",
          {
            className: "uipack-cx-break",
            d: `M${band.markStart - 4} ${base - 18}l${band.mark + 8} -10M${band.markStart - 4} ${base - 8}l${band.mark + 8} -10`
          }
        ),
        next && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-connector", x1: band.markStart + band.mark, x2: next.markStart, y1: y(b.to), y2: y(b.to) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "text",
          {
            x: band.centre,
            y: labelY,
            fontSize: CX_TYPE.value,
            textAnchor: "middle",
            dominantBaseline: "central",
            className: "uipack-cx-t uipack-cx-t--strong uipack-cx-halo",
            children: [
              b.kind !== "total" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tspan", { className: "uipack-cx-arrow", "aria-hidden": "true", children: b.value >= 0 ? "\u25B2 " : "\u25BC " }),
              show(b)
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Lines, { x: band.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: b.kind === "total" ? 600 : void 0 })
      ] }, `${b.label}-${i}`);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: base, y2: base }),
    callout && (() => {
      const i = bars.findIndex((b2) => b2.label === callout.label);
      if (i < 0) return null;
      const b = bars[i];
      const px = bandsProbe[i].centre;
      const py = (y(b.from) + y(b.to)) / 2;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Callout, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}
function StackedBar({
  categories,
  series,
  mode = "absolute",
  orientation = "vertical",
  format = defaultFormat,
  segmentFormat,
  totals = true,
  ariaLabel,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const percent = mode === "percent";
  const stacks = categories.map((c) => stackSegments([...c.values], percent));
  const sums = categories.map((c) => c.values.reduce((a, b) => a + Math.max(0, b), 0));
  const max = percent ? 100 : Math.max(...sums, 1);
  const fmtSeg = (s) => percent ? `${Math.round(s.share * 100)}%` : (segmentFormat ?? format)(s.value);
  const label = ariaLabel ?? `Stacked bar chart, ${series.join(", ")}. ${categories.map((c, i) => `${c.label}: ${stacks[i].map((s, k) => `${series[k]} ${fmtSeg(s)}`).join(", ")}`).join("; ")}.`;
  const legendH = 36;
  let lx = 0;
  const legend = series.map((name, i) => {
    const item = { name, i, x: lx };
    lx += 18 + 10 + textWidth(name, CX_TYPE.tick) + 28;
    return item;
  });
  const legendEl = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("g", { className: "uipack-cx-legend", children: legend.map((l) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: l.x, y: 6, width: 18, height: 18, rx: 2, style: { fill: fill.series(l.i) } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: l.x + 28, y: 15, size: CX_TYPE.tick, children: l.name })
  ] }, l.name)) });
  const segLabel = (s, k, cx2, cy, room, thick) => {
    const t = fmtSeg(s);
    if (thick < CX_TYPE.value + 8 || textWidth(t, CX_TYPE.value, 600) + 12 > room) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "text",
      {
        x: cx2,
        y: cy,
        fontSize: CX_TYPE.value,
        textAnchor: "middle",
        dominantBaseline: "central",
        className: "uipack-cx-t--strong uipack-cx-seglabel",
        style: { fill: fill.seriesInk(k) },
        children: t
      }
    );
  };
  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...categories.map((c) => textWidth(c.label, CX_TYPE.label))) + 20, W * 0.4);
    const totalW = totals && !percent ? Math.max(...sums.map((s) => textWidth(format(s), CX_TYPE.value, 600))) + 14 : 4;
    const x = linearScale([0, max], [labelW, W - totalW]);
    const bands = bandLayout(categories.length, legendH + 8, H - legendH - 8, 0.62, 44);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
      legendEl,
      categories.map((c, i) => {
        const b = bands[i];
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Lines, { x: labelW - 16, y: b.centre, lines: wrapText(c.label, CX_TYPE.label, labelW - 20, 2), anchor: "end", weight: c.highlight ? 600 : void 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("g", { className: "uipack-cx-grow", "data-axis": "x", style: growStyle("0% 50%", i * 40), children: stacks[i].map((s, k) => {
            const x0 = x(s.from) + (k > 0 ? 1 : 0);
            const x1 = x(s.to) - (k < stacks[i].length - 1 ? 1 : 0);
            if (x1 - x0 <= 0.5) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "rect",
                {
                  style: { fill: fill.series(k) },
                  x: x0,
                  y: b.markStart,
                  width: x1 - x0,
                  height: b.mark,
                  children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
                }
              ),
              segLabel(s, k, (x0 + x1) / 2, b.centre, x1 - x0, b.mark)
            ] }, k);
          }) }),
          totals && !percent && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: x(sums[i]) + 10, y: b.centre, weight: 600, children: format(sums[i]) })
        ] }, c.label);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-axis", x1: labelW, x2: labelW, y1: legendH + 4, y2: H })
    ] });
  }
  const bandsProbe = bandLayout(categories.length, 0, W, 0.56, 88);
  const wrapped = categories.map((c) => wrapText(c.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = legendH + (totals && !percent ? 40 : 12);
  const y = linearScale([0, max], [H - bottom, top]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
    legendEl,
    categories.map((c, i) => {
      const b = bandsProbe[i];
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("g", { className: "uipack-cx-grow", "data-axis": "y", style: growStyle("50% 100%", i * 40), children: stacks[i].map((s, k) => {
          const last = k === stacks[i].length - 1;
          const y0 = y(s.from) - (k > 0 ? 1 : 0);
          const y1 = y(s.to) + (last ? 0 : 1);
          if (y0 - y1 <= 0.5) return null;
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
            last ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "path",
              {
                style: { fill: fill.series(k) },
                d: barPath("vertical", y0, y1, b.markStart, b.mark),
                children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "rect",
              {
                style: { fill: fill.series(k) },
                x: b.markStart,
                y: y1,
                width: b.mark,
                height: y0 - y1,
                children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${c.label}, ${series[k]}: ${fmtSeg(s)}` })
              }
            ),
            segLabel(s, k, b.centre, (y0 + y1) / 2, b.mark, y0 - y1)
          ] }, k);
        }) }),
        totals && !percent && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: b.centre, y: y(sums[i]) - 18, anchor: "middle", weight: 600, halo: true, children: format(sums[i]) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Lines, { x: b.centre, y: H - bottom + 12, lines: wrapped[i], top: true, weight: c.highlight ? 600 : void 0 })
      ] }, c.label);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-axis", x1: 0, x2: W, y1: H - bottom, y2: H - bottom })
  ] });
}
function LineChart({
  x: periods,
  series,
  format = defaultFormat,
  tickFormat,
  domain,
  reference,
  annotate,
  ariaLabel,
  width,
  height
}) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const all = series.flatMap((s) => s.values.filter((v) => v !== null));
  const nice = niceTicks(Math.min(...all, reference?.value ?? Infinity), Math.max(...all, reference?.value ?? -Infinity), 4);
  const dom = domain ?? nice.domain;
  const ticks = domain ? niceTicks(domain[0], domain[1], 4).ticks.filter((t) => t >= domain[0] && t <= domain[1]) : nice.ticks;
  const tf = tickFormat ?? format;
  const emphasis = series.some((s) => s.highlight);
  const stroke = (s, i) => emphasis ? s.highlight ? fill.accent : fill.context : fill.series(i);
  const lastOf = (s) => {
    for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return i;
    return -1;
  };
  const endText = series.map((s) => {
    const li = lastOf(s);
    return { name: s.name, value: li >= 0 ? format(s.values[li]) : "" };
  });
  const endW = Math.max(...endText.map((e) => textWidth(`${e.name} ${e.value}`, CX_TYPE.label, 600))) + 30;
  const tickW = Math.max(...ticks.map((t) => textWidth(tf(t), CX_TYPE.tick))) + 14;
  const left = tickW;
  const right = W - endW;
  const top = 18;
  const bottom = H - CX_TYPE.tick - 22;
  const xs = (i) => periods.length <= 1 ? left : left + i / (periods.length - 1) * (right - left - 16) + 8;
  const ys = linearScale(dom, [bottom, top]);
  const label = ariaLabel ?? `Line chart, ${periods[0]} to ${periods[periods.length - 1]}. ${series.map((s) => `${s.name}: ${s.values.map((v) => v === null ? "n/a" : format(v)).join(", ")}`).join("; ")}.`;
  const ends = series.map((s) => {
    const li = lastOf(s);
    return li >= 0 ? { x: xs(li), y: ys(s.values[li]) } : null;
  });
  const placed = spreadLabels(ends.map((e) => e?.y ?? 0), CX_TYPE.label * 1.3, top, bottom);
  const everyN = Math.max(1, Math.ceil(Math.max(...periods.map((p) => textWidth(p, CX_TYPE.tick))) / Math.max(1, (right - left) / periods.length - 12)));
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
    ticks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-grid", x1: left, x2: right, y1: ys(t), y2: ys(t) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: left - 12, y: ys(t), size: CX_TYPE.tick, anchor: "end", muted: true, className: "uipack-cx-tabular", children: tf(t) })
    ] }, t)),
    reference && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { className: "uipack-cx-ref-line", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { x1: left, x2: right, y1: ys(reference.value), y2: ys(reference.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: left + 8, y: ys(reference.value) - 16, size: CX_TYPE.tick, muted: true, halo: true, children: reference.label })
    ] }),
    periods.map(
      (p, i) => i % everyN === 0 || i === periods.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: xs(i), y: H - 10, size: CX_TYPE.tick, anchor: "middle", muted: true, baseline: "auto", children: p }, p) : null
    ),
    series.map((s, si) => {
      const pts = s.values.map((v, i) => v === null ? null : [xs(i), ys(v)]);
      let d = "";
      let pen = false;
      for (const p of pts) {
        if (!p) {
          pen = false;
          continue;
        }
        d += `${pen ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        pen = true;
      }
      const e = ends[si];
      const ly = placed[si];
      const nudged = e && Math.abs(ly - e.y) > 4;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { "data-highlight": s.highlight ? "" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { className: "uipack-cx-line uipack-cx-draw", pathLength: 1, d, style: { stroke: stroke(s, si) }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${s.name}: ${s.values.map((v, i) => `${periods[i]} ${v === null ? "n/a" : format(v)}`).join(", ")}` }) }),
        e && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { className: "uipack-cx-dot", cx: e.x, cy: e.y, r: 6, style: { fill: stroke(s, si) } }),
          nudged && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-leader", x1: e.x + 9, y1: e.y, x2: e.x + 20, y2: ly }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "text",
            {
              x: e.x + 22,
              y: ly,
              fontSize: CX_TYPE.label,
              dominantBaseline: "central",
              className: ["uipack-cx-t", s.highlight || !emphasis ? "uipack-cx-t--strong" : "uipack-cx-t--muted"].join(" "),
              children: [
                s.name,
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tspan", { className: "uipack-cx-t--strong", children: endText[si].value })
              ]
            }
          )
        ] })
      ] }, s.name);
    }),
    annotate && (() => {
      const si = typeof annotate.series === "number" ? annotate.series : series.findIndex((s) => s.name === annotate.series);
      const v = series[si]?.values[annotate.index];
      if (v === null || v === void 0) return null;
      const px = xs(annotate.index);
      const py = ys(v);
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Callout, { x: px, y: py, tx: px + annotate.dx, ty: py + annotate.dy, text: annotate.text, width: annotate.width, align: annotate.align });
    })()
  ] });
}
function Sparkline({ values, width = 132, height = 44 }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i) => 6 + i / (values.length - 1) * (width - 12);
  const y = linearScale(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - 6, 6]);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { className: "uipack-cx-spark", width, height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { className: "uipack-cx-spark__line", d }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { className: "uipack-cx-spark__dot", cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 5 })
  ] });
}
var Arrow = ({ direction }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { className: "uipack-cx-delta__arrow", width: "18", height: "18", viewBox: "0 0 18 18", "aria-hidden": "true", children: [
  direction === "up" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M9 2 L16 14 H2 Z" }),
  direction === "down" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M9 16 L16 4 H2 Z" }),
  direction === "flat" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M2 7 H16 V11 H2 Z" })
] });
function KpiTiles({ items, columns }) {
  const per = Math.max(1, columns ?? items.length);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "uipack-cx-kpis", style: { gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }, children: items.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "li",
    {
      className: "uipack-cx-kpi",
      "data-highlight": k.highlight ? "" : void 0,
      "data-first-col": i % per === 0 ? "" : void 0,
      "data-last-col": i % per === per - 1 ? "" : void 0,
      "data-next-row": i >= per ? "" : void 0,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "uipack-cx-kpi__label", children: k.label }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "uipack-cx-kpi__row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "uipack-cx-kpi__value", children: [
            k.morphId ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Morph, { id: k.morphId, as: "span", children: k.value }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: k.value }),
            k.unit && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("small", { children: k.unit })
          ] }),
          k.trend && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Sparkline, { values: k.trend })
        ] }),
        k.delta && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "uipack-cx-delta", "data-sentiment": k.delta.sentiment ?? "neutral", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Arrow, { direction: k.delta.direction }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: k.delta.text }),
          k.delta.period && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: k.delta.period })
        ] }),
        k.note && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "uipack-cx-kpi__note", children: k.note })
      ]
    },
    k.label
  )) });
}
function Matrix2x2({ x: xa, y: ya, points, quadrants, focus, maxRadius = 46, callout, ariaLabel, width, height }) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const fx = xa.format ?? defaultFormat;
  const fy = ya.format ?? defaultFormat;
  const xSplit = xa.split ?? (xa.domain[0] + xa.domain[1]) / 2;
  const ySplit = ya.split ?? (ya.domain[0] + ya.domain[1]) / 2;
  const yTicks = [ya.domain[0], ySplit, ya.domain[1]];
  const xTicks = [xa.domain[0], xSplit, xa.domain[1]];
  const tickW = Math.max(...yTicks.map((t) => textWidth(fy(t), CX_TYPE.tick))) + 12;
  const left = 34 + tickW;
  const right = W - 8;
  const top = 8;
  const bottom = H - 30 - 34;
  const xs = linearScale(xa.domain, [left, right]);
  const ys = linearScale(ya.domain, [bottom, top]);
  const maxSize = Math.max(...points.map((p) => p.size ?? 1));
  const midX = xs(xSplit);
  const midY = ys(ySplit);
  const quads = {
    tl: { x: left, y: top, w: midX - left, h: midY - top },
    tr: { x: midX, y: top, w: right - midX, h: midY - top },
    bl: { x: left, y: midY, w: midX - left, h: bottom - midY },
    br: { x: midX, y: midY, w: right - midX, h: bottom - midY }
  };
  const label = ariaLabel ?? `2 by 2 matrix: ${xa.label} against ${ya.label}. ${points.map((p) => `${p.label}: ${fx(p.x)}, ${fy(p.y)}${p.size !== void 0 ? `, size ${p.size}` : ""}`).join("; ")}.`;
  const sorted = [...points].sort((a, b) => (b.size ?? 1) - (a.size ?? 1));
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Frame, { size, label, children: [
    focus && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { className: "uipack-cx-quad-focus", ...{ x: quads[focus].x, y: quads[focus].y, width: quads[focus].w, height: quads[focus].h } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { className: "uipack-cx-plot-edge", x: left, y: top, width: right - left, height: bottom - top }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-split", x1: midX, x2: midX, y1: top, y2: bottom }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("line", { className: "uipack-cx-split", x1: left, x2: right, y1: midY, y2: midY }),
    quadrants && ["tl", "tr", "bl", "br"].map((q, i) => {
      const r = quads[q];
      const atRight = q === "tr" || q === "br";
      const atBottom = q === "bl" || q === "br";
      const lines = wrapText(quadrants[i].toUpperCase(), CX_TYPE.quadrant, r.w * 0.55, 2);
      const lh = CX_TYPE.quadrant * 1.25;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "text",
        {
          x: atRight ? r.x + r.w - 16 : r.x + 16,
          y: atBottom ? r.y + r.h - 16 - (lines.length - 1) * lh : r.y + 16 + CX_TYPE.quadrant * 0.8,
          fontSize: CX_TYPE.quadrant,
          textAnchor: atRight ? "end" : "start",
          className: "uipack-cx-quad-label",
          "data-focus": focus === q ? "" : void 0,
          children: lines.map((l, k) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tspan", { x: atRight ? r.x + r.w - 16 : r.x + 16, dy: k === 0 ? 0 : lh, children: l }, k))
        },
        q
      );
    }),
    yTicks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: left - 10, y: ys(t), size: CX_TYPE.tick, anchor: "end", muted: true, className: "uipack-cx-tabular", children: fy(t) }, `y${t}`)),
    xTicks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: xs(t), y: bottom + 24, size: CX_TYPE.tick, anchor: i === 0 ? "start" : i === 2 ? "end" : "middle", muted: true, className: "uipack-cx-tabular", children: fx(t) }, `x${t}`)),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: (left + right) / 2, y: H - 12, size: CX_TYPE.tick, anchor: "middle", weight: 600, baseline: "auto", children: `${xa.label} \u2192` }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "text",
      {
        transform: `translate(14 ${(top + bottom) / 2}) rotate(-90)`,
        fontSize: CX_TYPE.tick,
        textAnchor: "middle",
        dominantBaseline: "central",
        className: "uipack-cx-t uipack-cx-t--strong",
        children: `${ya.label} \u2192`
      }
    ),
    sorted.map((p, i) => {
      const cx2 = xs(p.x);
      const cy = ys(p.y);
      const r = bubbleRadius(p.size ?? 1, maxSize, maxRadius);
      const at = p.labelAt ?? "right";
      const lx = at === "right" ? cx2 + r + 10 : at === "left" ? cx2 - r - 10 : cx2;
      const ly = at === "top" ? cy - r - 18 : at === "bottom" ? cy + r + 20 : cy;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { "data-highlight": p.highlight ? "" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "circle",
          {
            className: "uipack-cx-bubble uipack-cx-grow",
            "data-axis": "both",
            cx: cx2,
            cy,
            r,
            style: { ...growStyle("50% 50%", i * 50), fill: p.highlight ? fill.accent : fill.context },
            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${p.label}: ${xa.label} ${fx(p.x)}, ${ya.label} ${fy(p.y)}` })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Text, { x: lx, y: ly, anchor: at === "right" ? "start" : at === "left" ? "end" : "middle", weight: p.highlight ? 600 : void 0, halo: true, children: p.label })
      ] }, p.label);
    }),
    callout && (() => {
      const p = points.find((q) => q.label === callout.label);
      if (!p) return null;
      const px = xs(p.x);
      const py = ys(p.y);
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Callout, { x: px, y: py, tx: px + callout.dx, ty: py + callout.dy, text: callout.text, width: callout.width, align: callout.align });
    })()
  ] });
}

// src/deck/consulting/HarveyTable.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var LEVEL_WORDS = ["None", "Low", "Medium", "High", "Full"];
function HarveyBall({ level, size = 36, label }) {
  const q = Math.max(0, Math.min(4, Math.round(level)));
  const r = size / 2 - 1.5;
  const c = size / 2;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "svg",
    {
      className: "uipack-cx-harvey",
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      "aria-label": label ?? `${LEVEL_WORDS[q]} (${q} of 4)`,
      "data-level": q,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { className: "uipack-cx-harvey__ring", cx: c, cy: c, r }),
        q > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { className: "uipack-cx-harvey__fill", d: harveyWedge(q, c, c, r) })
      ]
    }
  );
}
function HarveyTable({ columns, rows, corner = "Option", showKey = true, keyNote = "Full ball = most favourable" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "uipack-cx-harvey-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("colgroup", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("col", {}),
        columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("col", { style: c.width ? { width: c.width } : void 0 }, c.key))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { scope: "col", children: corner }),
        columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { scope: "col", "data-kind": c.kind ?? "harvey", children: c.label }, c.key))
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { "data-highlight": r.highlight ? "" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("th", { scope: "row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "uipack-cx-harvey-table__name", children: [
            r.label,
            r.highlight && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("em", { children: r.tag ?? "Recommended" })
          ] }),
          r.detail && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "uipack-cx-harvey-table__detail", children: r.detail })
        ] }),
        columns.map((c) => {
          const v = r.cells[c.key];
          return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { "data-kind": c.kind ?? "harvey", children: (c.kind ?? "harvey") === "harvey" && typeof v === "number" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HarveyBall, { level: v }) : v }, c.key);
        })
      ] }, i)) })
    ] }),
    showKey && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "uipack-cx-harvey-key", children: [
      LEVEL_WORDS.map((w, q) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HarveyBall, { level: q, size: 24, label: "" }),
        w
      ] }, w)),
      keyNote && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "uipack-cx-harvey-key__note", children: keyNote })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarChart,
  Bento,
  BentoCell,
  Build,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CX_TYPE,
  Callout,
  ConsultingSlide,
  DeckPlayer,
  DeckSlideContext,
  HarveyBall,
  HarveyTable,
  KpiTiles,
  LINT_RULES,
  LineChart,
  MAX_TITLE_WORDS,
  MIN_TEXT_PX,
  Matrix2x2,
  Morph,
  Panel,
  REPEATABLE_ROLES,
  Ref,
  SLIDE_ROLES,
  STORYLINE_TEMPLATES,
  Slide,
  SlideThumbnail,
  SoWhat,
  Sparkline,
  StackedBar,
  Tracker,
  WORDS_PER_MINUTE,
  Waterfall,
  bandLayout,
  barPath,
  bentoCamera,
  bentoFocusAt,
  bubbleRadius,
  calloutGeometry,
  deckMotion,
  flipFrom,
  formatStoryline,
  formatValue,
  formatter,
  getStorylineTemplate,
  harveyWedge,
  linearScale,
  lintDeck,
  niceStep,
  niceTicks,
  resolveTransition,
  runTransition,
  spreadLabels,
  stackSegments,
  storylineOf,
  talkSeconds,
  templateOutline,
  textWidth,
  useDeckSlide,
  waterfallBars,
  wrapText,
  zeroBasedDomain,
  zoomFrame,
  zoomSamples
});
//# sourceMappingURL=deck.cjs.map