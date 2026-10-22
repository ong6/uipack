import type { DeckSlide } from "../src/deck/types";
import {
  LINT_RULES,
  MAX_TITLE_WORDS,
  REPEATABLE_ROLES,
  SLIDE_ROLES,
  STORYLINE_TEMPLATES,
  formatStoryline,
  getStorylineTemplate,
  lintDeck,
  storylineOf,
  talkSeconds,
  templateOutline,
  type LintFinding,
  type LintRule,
  type SlideRole,
  type StorySlide,
} from "../src/deck/storyline";

const say = (text: string) => ({ say: text, delivery: "Pause after the number.", next: "" });

/** A clean, answer-first proposal deck. */
const good: StorySlide[] = [
  {
    id: "answer",
    title: "Move resizing to a queue to stop upload timeouts with one engineer",
    role: "answer",
    notes: say("We should move image resizing to a queue. That ends upload timeouts, and we need one engineer."),
  },
  {
    id: "context",
    title: "Uploads resize every image before the request returns",
    role: "context",
    notes: "Today every upload waits for resizing to finish.",
  },
  {
    id: "problem",
    title: "Large uploads time out 4% of the time",
    role: "problem",
    notes: say("Four percent of large uploads time out. Source: the upload dashboard, last 30 days."),
  },
  {
    id: "options",
    title: "Three options: bigger servers, a queue, or doing nothing",
    role: "option",
    notes: "Here are the three options on cost, latency and risk.",
  },
  {
    id: "rec",
    title: "A queue ends timeouts; thumbnails arrive about 5 seconds later",
    role: "recommendation",
    notes: "The queue wins, and the cost is a short delay on thumbnails, per the resize load test.",
  },
  {
    id: "ask",
    title: "Decide by 14 March so Platform leads can staff it in Q2",
    role: "ask",
    notes: "I need a decision from you by 14 March.",
  },
  { id: "backup", title: "Load test details", role: "appendix" },
];

/** The same deck with every presented slide's talk track padded by `words` words, to fill a time budget. */
const spoken = (deck: StorySlide[], words: number): StorySlide[] =>
  deck.map((s) => {
    if (s.role === "appendix") return s;
    const text = typeof s.notes === "string" ? s.notes : (s.notes?.say ?? "");
    return { ...s, notes: say(`${text} ${Array.from({ length: words }, () => "word").join(" ")}`) };
  });

const rulesOf = (findings: LintFinding[]) => findings.map((f) => f.rule);
const find = (findings: LintFinding[], rule: LintRule) => findings.filter((f) => f.rule === rule);
const withSlide = (deck: StorySlide[], id: string, patch: Partial<StorySlide>) =>
  deck.map((s) => (s.id === id ? { ...s, ...patch } : s));

describe("storyline templates", () => {
  const roles = Object.keys(SLIDE_ROLES) as SlideRole[];
  const titleRules: LintRule[] = ["title-present", "title-claim", "title-length", "one-idea"];

  it("covers the six internal deck types with unique IDs", () => {
    expect(STORYLINE_TEMPLATES.map((t) => t.id).sort()).toEqual(
      ["decision-request", "deep-dive", "launch-demo", "postmortem", "project-update", "review-highlights"],
    );
    expect(getStorylineTemplate("postmortem").name).toMatch(/postmortem/i);
    expect(() => getStorylineTemplate("nope" as never)).toThrow();
  });

  it.each(STORYLINE_TEMPLATES.map((t) => [t.id, t] as const))("%s is internally consistent", (_, t) => {
    const required = t.beats.filter((b) => !b.optional).length;
    expect(t.slides.min).toBeLessThanOrEqual(t.slides.max);
    expect(required).toBeLessThanOrEqual(t.slides.max);
    expect(t.beats.length).toBeLessThanOrEqual(t.slides.max);
    expect(t.minutes.min).toBeLessThanOrEqual(t.minutes.max);
    // About one to two minutes per slide.
    expect(t.minutes.max).toBeGreaterThanOrEqual(t.slides.min);
    expect(t.minutes.min).toBeLessThanOrEqual(t.slides.max * 2);

    for (const beat of t.beats) {
      expect(roles).toContain(beat.role);
      for (const field of [beat.purpose, beat.titlePattern, beat.example, beat.guidance, t.remember]) {
        expect(field.trim().length).toBeGreaterThan(0);
      }
    }
    // Ends on an ask; answer-first templates state it in the first three beats.
    expect(t.beats[t.beats.length - 1].role).toBe("ask");
    if (t.answerFirst) {
      expect(t.beats.slice(0, 3).some((b) => b.role === "answer" || b.role === "recommendation")).toBe(true);
    }
    // Serialisable as plain data.
    expect(JSON.parse(JSON.stringify(t))).toEqual(t);
  });

  it.each(STORYLINE_TEMPLATES.map((t) => [t.id, t] as const))("%s example ghost deck passes its own lint", (_, t) => {
    const outline = templateOutline(t);
    expect(outline).toHaveLength(t.beats.length);
    const findings = lintDeck(outline, { template: t.id });
    // Examples are titles only, so notes and number sources are expected gaps.
    const relevant = findings.filter((f) => f.rule !== "notes-present" && f.rule !== "number-source");
    expect(relevant).toEqual([]);
    for (const slide of outline) {
      expect(find(lintDeck([slide]), "title-claim")).toEqual([]);
      expect(slide.title.split(/\s+/).length).toBeLessThanOrEqual(MAX_TITLE_WORDS);
    }
    expect(findings.filter((f) => titleRules.includes(f.rule))).toEqual([]);
  });

  it("only suggests zoom and morph where the story needs them", () => {
    const moves = STORYLINE_TEMPLATES.flatMap((t) => t.beats.map((b) => b.move ?? "advance"));
    const special = moves.filter((m) => m !== "advance").length;
    expect(special).toBeGreaterThan(0);
    expect(special / moves.length).toBeLessThan(0.2);
  });

  it("describes every role and every lint rule", () => {
    for (const role of roles) {
      expect(SLIDE_ROLES[role].label).toBeTruthy();
      expect(SLIDE_ROLES[role].question).toBeTruthy();
    }
    expect(REPEATABLE_ROLES).toContain("evidence");
    expect(Object.keys(LINT_RULES)).toHaveLength(18);
  });
});

describe("lintDeck", () => {
  it("passes a clean answer-first deck", () => {
    // Seven presented slides at about 90 words each fill half of eight minutes. The template needs a plan.
    const plan: StorySlide = {
      id: "plan",
      title: "Six engineer-weeks; done when upload timeouts drop below 0.1%",
      role: "plan",
      notes: "Two engineers for three weeks.",
    };
    const full = [...good.slice(0, 5), plan, ...good.slice(5)];
    expect(lintDeck(spoken(full, 80), { template: "decision-request", minutes: 8 })).toEqual([]);
    expect(find(lintDeck(spoken(good, 80), { template: "decision-request", minutes: 8 }), "template-beats")).toEqual([
      expect.objectContaining({ severity: "warn", message: expect.stringMatching(/needs a plan slide/) }),
    ]);
  });

  it("accepts DeckSlide objects as they are", () => {
    const slide: DeckSlide = {
      id: "one",
      title: "Uploads stop timing out once resizing moves to a queue",
      notes: "Here's the point.",
      render: () => null,
    };
    // One untagged slide: its role is inferred (an answer), so the missing ask is still reported.
    expect(rulesOf(lintDeck([slide]))).toEqual(["roles-missing", "closing-ask"]);
  });

  it("deck-empty", () => {
    expect(lintDeck([])).toEqual([{ rule: "deck-empty", severity: "error", message: expect.any(String) }]);
  });

  it("duplicate-id", () => {
    const deck = [...good, { ...good[1] }];
    const hits = find(lintDeck(deck), "duplicate-id");
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ slideId: "context", severity: "error" });
  });

  it("title-present", () => {
    const hits = find(lintDeck(withSlide(good, "context", { title: "  " })), "title-present");
    expect(hits).toEqual([expect.objectContaining({ slideId: "context", severity: "error" })]);
  });

  describe("title-claim", () => {
    const claim = (title: string, role: SlideRole = "context") =>
      find(lintDeck(withSlide(good, "context", { title, role })), "title-claim");

    it.each(["Background", "Architecture", "Agenda", "Next steps", "Q&A", "Thank you!", "What's next?"])(
      "rejects the bare label %s",
      (title) => {
        expect(claim(title)).toEqual([expect.objectContaining({ slideId: "context", severity: "error" })]);
      },
    );

    it("warns on titles under three words and short label phrases", () => {
      expect(claim("Latency improved")[0].severity).toBe("warn");
      expect(claim("Q3 status update")[0].severity).toBe("warn");
      expect(claim("Search system architecture")[0].severity).toBe("warn");
    });

    it("tips a label prefix and softens a cover", () => {
      expect(claim("Background: every upload resizes inline today")[0].severity).toBe("tip");
      expect(claim("Overview", "cover")[0].severity).toBe("tip");
    });

    it("accepts claims and skips the appendix", () => {
      expect(claim("Uploads resize every image before returning")).toEqual([]);
      expect(claim("Next: cutover by 30 May, then retire the old cluster")).toEqual([]);
      expect(claim("Appendix", "appendix")).toEqual([]);
    });

    it("reads the headline when it differs from the short title", () => {
      const deck = withSlide(good, "context", { title: "Context", headline: "Uploads resize inline before returning" });
      expect(find(lintDeck(deck), "title-claim")).toEqual([]);
      expect(storylineOf(deck)[1].title).toBe("Uploads resize inline before returning");
    });
  });

  it("title-length", () => {
    const long = "This title keeps going with one clause after another until the room stops reading it entirely";
    const hits = find(lintDeck(withSlide(good, "context", { title: long })), "title-length");
    expect(hits).toEqual([expect.objectContaining({ slideId: "context", severity: "warn" })]);
  });

  it("one-idea", () => {
    const hits = find(
      lintDeck(withSlide(good, "context", { title: "Uploads resize inline. The queue fixes it." })),
      "one-idea",
    );
    expect(hits).toEqual([expect.objectContaining({ slideId: "context", severity: "tip" })]);
  });

  it("notes-present, skipping the appendix", () => {
    const hits = find(lintDeck(withSlide(good, "rec", { notes: { say: " ", delivery: "Slow down." } })), "notes-present");
    expect(hits.map((h) => h.slideId)).toEqual(["rec"]);
  });

  describe("number-source", () => {
    const check = (patch: Partial<StorySlide>) =>
      find(lintDeck(withSlide(good, "context", { title: "Uploads take 9 seconds at p95", ...patch })), "number-source");

    it("flags an unsourced number", () => {
      expect(check({ notes: "They're slow." })).toEqual([expect.objectContaining({ slideId: "context", severity: "warn" })]);
    });

    it("accepts a source in notes or on the slide", () => {
      expect(check({ notes: "Source: upload dashboard, last 30 days." })).toEqual([]);
      expect(check({ notes: "They're slow.", source: "Upload dashboard, Oct 1–30" })).toEqual([]);
    });

    it("ignores dates, quarters, versions, and plan or ask slides", () => {
      expect(check({ title: "The v2 rollout lands in Q3 2026 on 14 March", notes: "No source." })).toEqual([]);
      expect(check({ role: "plan", notes: "Target." })).toEqual([]);
    });
  });

  it("roles-missing is a warning, and roles inferred from titles still run answer-first and closing-ask", () => {
    const bare = good.filter((s) => s.role !== "appendix").map(({ role: _role, ...rest }) => rest);
    const findings = lintDeck(bare);
    expect(find(findings, "roles-missing")).toEqual([expect.objectContaining({ severity: "warn" })]);
    // Slide one states the answer and the last slide asks for a decision with an owner and a date.
    expect(find(findings, "answer-first")).toEqual([]);
    expect(find(findings, "closing-ask")).toEqual([]);
    // Rhythm needs real roles.
    expect(find(findings, "role-repeat")).toEqual([]);
  });

  describe("answer-first", () => {
    it("errors when no slide states the answer", () => {
      const deck = good.filter((s) => s.id !== "answer" && s.id !== "rec");
      expect(find(lintDeck(deck), "answer-first")[0].severity).toBe("error");
    });

    it("warns when the answer is after the third content slide, ignoring a cover", () => {
      const late = [good[1], good[2], good[3], good[4], good[0], good[5]].map((s) =>
        s.id === "rec" ? { ...s, role: "evidence" as const } : s,
      );
      const hits = find(lintDeck(late), "answer-first");
      expect(hits).toEqual([expect.objectContaining({ severity: "warn", slideId: "answer" })]);

      const withCover: StorySlide[] = [
        { id: "cover", title: "Upload reliability proposal", role: "cover", notes: "Hi." },
        ...good.slice(1, 3),
        good[0],
        ...good.slice(3),
      ];
      expect(find(lintDeck(withCover), "answer-first")).toEqual([]);
    });

    it("is off for deep dives unless forced", () => {
      const deck = good.filter((s) => s.id !== "answer" && s.id !== "rec");
      expect(find(lintDeck(deck, { template: "deep-dive" }), "answer-first")).toEqual([]);
      expect(find(lintDeck(deck, { template: "deep-dive", answerFirst: true }), "answer-first")).toHaveLength(1);
    });
  });

  describe("closing-ask", () => {
    it("errors without an ask", () => {
      const hits = find(lintDeck(good.filter((s) => s.role !== "ask")), "closing-ask");
      expect(hits).toEqual([expect.objectContaining({ severity: "error" })]);
    });

    it("warns when the ask isn't last, ignoring the appendix", () => {
      const deck = [...good.slice(0, 4), good[5], good[4], good[6]];
      const hits = find(lintDeck(deck), "closing-ask");
      expect(hits).toEqual([expect.objectContaining({ severity: "warn", slideId: "rec" })]);
      expect(find(lintDeck(good), "closing-ask")).toEqual([]);
    });
  });

  describe("ask-concrete", () => {
    const ask = (title: string, notes = "Thanks.") =>
      find(lintDeck(withSlide(good, "ask", { title, notes })), "ask-concrete");

    it("lists what a vague ask is missing", () => {
      const [hit] = ask("Thoughts and questions welcome");
      expect(hit).toMatchObject({ slideId: "ask", severity: "warn" });
      expect(hit.message).toMatch(/decision or action verb/);
      expect(hit.message).toMatch(/owner/);
      expect(hit.message).toMatch(/date/);
    });

    it("flags a missing date only", () => {
      const [hit] = ask("We need Platform leads to approve one more engineer");
      expect(hit.message).toBe("The ask is missing a date.");
    });

    it("accepts verb, owner and date across title and notes", () => {
      expect(ask("Approve the queue migration", "We need the platform leads' call by Friday.")).toEqual([]);
      expect(ask("Prioritise the canary work in Q3 planning; Release Engineering owns it")).toEqual([]);
      expect(ask("Storage team: review the design doc by 14 March")).toEqual([]);
    });

    it("rejects a vague ask: no named owner, and a date that moves with the calendar", () => {
      const [hit] = ask("Please support the team going forward next quarter");
      expect(hit).toMatchObject({ slideId: "ask", severity: "warn" });
      expect(hit.message).toMatch(/missing an owner, a date/);
      expect(hit.message).not.toMatch(/verb/);
    });

    it("treats pronouns as no owner and relative dates as no date", () => {
      expect(ask("We need you to approve one more engineer by July")[0].message).toMatch(/^The ask is missing an owner\./);
      const [relative] = ask("Platform leads: approve one more engineer next quarter");
      expect(relative.message).toMatch(/missing a date/);
      expect(relative.message).toMatch(/"next quarter" moves with the calendar/);
      // "may" the verb is not May the month.
      expect(ask("Platform leads may approve one more engineer")[0].message).toMatch(/missing a date/);
    });
  });

  describe("title-specific", () => {
    const specific = (title: string, role: SlideRole = "evidence") =>
      find(lintDeck(withSlide(good, "context", { title, role, notes: "Source: search dashboard, Q3." })), "title-specific");

    it.each([
      "Search is in a good place and the team did great work",
      "Things are trending in the right direction overall",
      "Please support the team going forward next quarter",
    ])("flags the vague claim %s", (title) => {
      expect(specific(title)).toEqual([expect.objectContaining({ slideId: "context", severity: "warn" })]);
      expect(specific(title, "answer")).toHaveLength(1);
    });

    it("accepts a number, a number word or a comparison with a quantity", () => {
      expect(specific("Caching did most of it: 140 of 214 ms saved, six launches, no rollbacks")).toEqual([]);
      expect(specific("Search got twice as fast this quarter, and cheaper to run")).toEqual([]);
      expect(specific("The new ranker beats the old one on 9 of 10 query classes")).toEqual([]);
      expect(specific("Two product teams launched on the new API in three weeks")).toEqual([]);
      expect(specific("Answer-first reviews were decided in one meeting, not three")).toEqual([]);
      expect(specific("Nine in ten slides should simply advance")).toEqual([]);
    });

    it("checks answer, evidence, problem and recommendation slides; plans need a date or a number", () => {
      expect(specific("Things are trending in the right direction overall", "context")).toEqual([]);
      expect(specific("Uploads time out a lot and it is getting worse", "problem")).toHaveLength(1);
      expect(specific("Large uploads time out 4% of the time", "problem")).toEqual([]);
      expect(specific("The queue option is clearly the best choice", "recommendation")).toHaveLength(1);
      expect(specific("A queue ends timeouts; thumbnails arrive about 5 seconds later", "recommendation")).toEqual([]);
      const [plan] = specific("We will keep improving things going forward", "plan");
      expect(plan).toMatchObject({ severity: "warn", message: expect.stringMatching(/no date and no number/) });
      expect(specific("Next: full cutover by 30 May, then retire the old cluster", "plan")).toEqual([]);
      expect(specific("Six engineer-weeks; done when timeouts drop below 0.1%", "plan")).toEqual([]);
    });
  });

  describe("outcome-first", () => {
    it("tips when slide one names the system instead of the outcome", () => {
      const deck = withSlide(good, "answer", { title: "The new upload pipeline architecture explained" });
      expect(find(lintDeck(deck), "outcome-first")).toEqual([expect.objectContaining({ slideId: "answer", severity: "tip" })]);
      expect(find(lintDeck(good), "outcome-first")).toEqual([]);
    });

    it("is off for teaching talks that build up to their idea", () => {
      const deck = withSlide(good, "answer", { title: "The new upload pipeline architecture explained" });
      expect(find(lintDeck(deck, { template: "deep-dive" }), "outcome-first")).toEqual([]);
    });
  });

  describe("role-repeat", () => {
    it("warns on adjacent non-repeatable roles, with option-specific advice", () => {
      const deck = withSlide(good, "rec", { role: "option" });
      const [hit] = find(lintDeck(deck), "role-repeat");
      expect(hit).toMatchObject({ slideId: "rec", severity: "warn" });
      expect(hit.message).toMatch(/side by side/);
      const problems = withSlide(good, "options", { role: "problem" });
      expect(find(lintDeck(problems), "role-repeat")[0].message).toMatch(/problem slides/);
    });

    it("allows stacked evidence and a zoom through mechanism slides", () => {
      const deck = withSlide(withSlide(good, "context", { role: "evidence" }), "problem", { role: "evidence" });
      expect(find(lintDeck(deck), "role-repeat")).toEqual([]);
      const zoom = withSlide(withSlide(good, "context", { role: "mechanism" }), "problem", { role: "mechanism" });
      expect(find(lintDeck(zoom), "role-repeat")).toEqual([]);
    });
  });

  describe("deck-length", () => {
    it("warns when slides outnumber minutes, excluding the appendix", () => {
      expect(find(lintDeck(good, { minutes: 5 }), "deck-length")[0].severity).toBe("warn");
      expect(find(lintDeck(good, { minutes: 6 }), "deck-length")).toEqual([]);
    });

    it("tips over two minutes a slide, and a count outside the template's range", () => {
      expect(find(lintDeck(good, { minutes: 20 }), "deck-length")[0].severity).toBe("tip");
      const short = good.filter((s) => s.id === "answer" || s.id === "ask");
      expect(find(lintDeck(short, { template: "decision-request" }), "deck-length")[0].message).toMatch(/6–9/);
    });
  });

  it("talk-time", () => {
    const long = Array.from({ length: 300 }, () => "word").join(" ");
    const deck = withSlide(good, "context", { notes: long });
    expect(talkSeconds(deck)).toBeGreaterThan(120);
    const hits = find(lintDeck(deck, { minutes: 2 }), "talk-time");
    expect(hits).toEqual([expect.objectContaining({ severity: "warn" })]);
    expect(find(lintDeck(deck, { minutes: 4 }), "talk-time")).toEqual([]);
  });

  describe("talk-time: a track too short for the budget", () => {
    it("warns when every slide has a track but together they cover under half the minutes", () => {
      const [hit] = find(lintDeck(good, { minutes: 8 }), "talk-time");
      expect(hit).toMatchObject({ severity: "warn" });
      expect(hit.message).toMatch(/under half/);
      expect(find(lintDeck(spoken(good, 80), { minutes: 8 }), "talk-time")).toEqual([]);
    });

    it("uses the template's shortest length when no minutes are given", () => {
      // decision-request runs 8–15 minutes: half of 8 is 4 minutes, about 540 words.
      expect(find(lintDeck(spoken(good, 60), { template: "decision-request" }), "talk-time")).toHaveLength(1);
      expect(find(lintDeck(spoken(good, 80), { template: "decision-request" }), "talk-time")).toEqual([]);
    });

    it("stays quiet without a budget, and while slides still lack a track (notes-present reports those)", () => {
      expect(find(lintDeck(good), "talk-time")).toEqual([]);
      const missing = withSlide(good, "context", { notes: undefined });
      expect(find(lintDeck(missing, { minutes: 8 }), "talk-time")).toEqual([]);
      expect(find(lintDeck(missing, { minutes: 8 }), "notes-present")).toHaveLength(1);
    });
  });
});

/** The phrases a reviewer used to show the checks were easy to pass; each must fail, and its fix pass. */
describe("lintDeck: claims that are easy to fake", () => {
  const n = (text: string) => ({ say: text, delivery: "" });

  describe("an untagged deck still gets the story checks", () => {
    const labels: StorySlide[] = [
      { id: "a", title: "Background", notes: n("x") },
      { id: "b", title: "Architecture", notes: n("x") },
      { id: "c", title: "Results", notes: n("x") },
      { id: "d", title: "Next steps", notes: n("x") },
      { id: "e", title: "Questions?", notes: n("x") },
    ];

    it("warns that roles are missing, then reports no answer and no ask", () => {
      const findings = lintDeck(labels);
      expect(find(findings, "roles-missing")).toEqual([expect.objectContaining({ severity: "warn" })]);
      expect(find(findings, "answer-first")).toEqual([expect.objectContaining({ severity: "error" })]);
      const [ask] = find(findings, "closing-ask");
      expect(ask).toMatchObject({ severity: "error", slideId: "e" });
      expect(ask.message).toMatch(/closes on "Questions\?", so the ask is missing/);
    });

    it.each(["Thank you", "Q&A", "Any questions?", "Thanks!"])("a last slide reading %s means the ask is missing", (title) => {
      const deck = [...labels.slice(0, 4), { id: "e", title, notes: n("x") }];
      expect(find(lintDeck(deck), "closing-ask")[0].message).toMatch(/so the ask is missing/);
    });

    it("reads a first-slide claim as the answer, \"Next steps\" as the plan and a dated request as the ask", () => {
      const deck: StorySlide[] = [
        { id: "a", title: "Search got twice as fast this quarter", notes: n("Source: latency dashboard.") },
        { id: "b", title: "Caching saved 140 of the 214 ms", notes: n("Source: latency dashboard.") },
        { id: "c", title: "Next steps", notes: n("x") },
        { id: "d", title: "Platform leads: approve two engineers by 20 October", notes: n("x") },
      ];
      const findings = lintDeck(deck);
      expect(find(findings, "answer-first")).toEqual([]);
      expect(find(findings, "closing-ask")).toEqual([]);
      expect(find(findings, "ask-concrete")).toEqual([]);
    });

    it("runs ask-concrete on an inferred ask", () => {
      const deck: StorySlide[] = [
        { id: "a", title: "Search got twice as fast this quarter", notes: n("Source: latency dashboard.") },
        { id: "d", title: "Approve two engineers by 20 October", notes: n("Thanks.") },
      ];
      expect(find(lintDeck(deck), "ask-concrete")[0].message).toMatch(/missing an owner/);
    });
  });

  describe("title-specific ignores proper nouns and comparisons without a quantity", () => {
    const check = (title: string) =>
      find(lintDeck(withSlide(good, "context", { title, role: "evidence", notes: "Source: dashboard." })), "title-specific");

    it.each([
      "The new Kafka pipeline is much better than before",
      "The team worked really hard on Redis",
      "Kafka beats RabbitMQ on throughput",
      "Latency moved from bad to good after the Envoy rollout",
      "The Q3 launch went well",
    ])("flags %s", (title) => {
      expect(check(title)).toHaveLength(1);
    });

    it.each([
      "The new Kafka pipeline moves twice the events of the old one",
      "Redis cut p95 from 40 ms to 12 ms",
      "Kafka beats RabbitMQ 3 to 1 on throughput",
      "A third of queries now skip the index",
    ])("accepts %s", (title) => {
      expect(check(title)).toEqual([]);
    });
  });

  describe("ask owners are teams or roles, not a capitalised word", () => {
    const ask = (title: string, notes = "Thanks.") => find(lintDeck(withSlide(good, "ask", { title, notes })), "ask-concrete");

    it.each([
      ["Please continue to Support this effort by 14 March", "Thanks Bob"],
      ["Approve the migration by 14 March", "Thanks, Priya and Sam."],
      ["Decide by 3 pm on Friday", "Thanks."],
      ["We need the team to approve this by 14 March", "Thanks."],
    ])("flags %s as having no owner", (title, notes) => {
      expect(ask(title, notes)[0].message).toMatch(/missing an owner/);
    });

    it.each([
      "Platform leads: approve two engineers by 14 March",
      "We need the payments team to approve this by 14 March",
      "VP Eng to approve the headcount by 14 March",
      "@dana to approve the design doc by Friday",
      "Dana, our platform lead, to approve the design doc by Friday",
      "Approve the rollout by 14 March; Release Engineering owns it",
    ])("accepts %s", (title) => {
      expect(ask(title)).toEqual([]);
    });
  });

  describe("number-source needs a source a reader could open", () => {
    const check = (notes: string, source?: string) =>
      find(lintDeck(withSlide(good, "context", { title: "Latency improved by 50% across the board", notes, source })), "number-source");

    it.each(["I measured this from my laptop once.", "Per my notes, from last week.", "According to the team."])("flags %s", (notes) => {
      expect(check(notes)).toHaveLength(1);
    });

    it.each([
      "Source: search latency dashboard, p95 over 7 days.",
      "From the BigQuery query in the doc.",
      "Load test on 12 May, 3 runs.",
      "Per the Q3 user survey.",
      "Weekly reliability report.",
      "Benchmark suite, 10 runs.",
      "Gateway logs, 1–30 Sept.",
      "A/B experiment 214.",
      "See https://example.com/latency.",
    ])("accepts %s", (notes) => {
      expect(check(notes)).toEqual([]);
    });

    it("accepts the slide's source field", () => {
      expect(check("I measured this from my laptop once.", "Latency dashboard, Sept")).toEqual([]);
    });
  });

  describe("a number word must quantify something, and a version isn't a quantity", () => {
    const check = (title: string, role: SlideRole = "evidence") =>
      find(lintDeck(withSlide(good, "context", { title, role, notes: "Source: search latency dashboard, Q3." })), "title-specific");

    it.each([
      "Two teams worked hard and things are better",
      "One big improvement in search quality",
      "No regressions and lots of wins",
      "We upgraded to v2 and Kafka 3 for 2025",
      "The Kafka 3 migration is now complete",
    ])("flags %s", (title) => {
      expect(check(title)).toHaveLength(1);
      expect(check(title, "answer")).toHaveLength(1);
    });

    it.each([
      "Two teams cut p95 latency by half",
      "One cache tier saved 140 ms at p95",
      "No regressions across 6 launches this quarter",
      "Kafka 3 cut consumer lag from 9 s to 2 s",
      "Upgrading to Kafka 3 took two weeks, not six",
      "Platform leads need 2 engineers for the shard",
    ])("accepts %s", (title) => {
      expect(check(title)).toEqual([]);
    });
  });

  describe("a source is a named artifact, not hearsay", () => {
    const check = (notes: string, source?: string) =>
      find(lintDeck(withSlide(good, "context", { title: "Errors dropped from 3% to 1% after the retry change", notes, source })), "number-source");

    it.each([
      "Per the test I ran once on staging, trust me.",
      "From a report someone mentioned in a meeting.",
      "Finance said so in the dashboard chat.",
      "Source: dashboard.",
      "There's a test for it somewhere.",
    ])("flags %s", (notes) => {
      expect(check(notes)).toHaveLength(1);
    });

    it.each([
      "Per load test 12 on staging, 3 runs.",
      "From the Q3 finance report, page 4.",
      "Finance's revenue dashboard, 1–30 Sept.",
      "Source: the checkout error dashboard, 7-day mean.",
    ])("accepts %s", (notes) => {
      expect(check(notes)).toEqual([]);
    });

    it("accepts the slide's source field over hearsay notes", () => {
      expect(check("Someone mentioned it.", "Checkout error dashboard, Sept")).toEqual([]);
    });
  });

  describe("an ask's owner isn't a placeholder or a verb, and its date isn't hedged", () => {
    const ask = (title: string, notes = "Thanks.") => find(lintDeck(withSlide(good, "ask", { title, notes })), "ask-concrete");

    it.each([
      ["Approve the shard; owner TBD, date in the next sync", "Next Monday maybe", /missing an owner, a date/],
      ["We will lead the review in Q3", "Thanks.", /missing an owner\./],
      ["Leads to approve the shard by 14 March", "Thanks.", /missing an owner\./],
      ["Approve the shard by 14 March; platform owner: TBD", "Thanks.", /missing an owner\./],
      ["Platform leads: approve the shard Monday-ish", "Thanks.", /missing a date\. The date is hedged/],
      ["Platform leads: approve the shard next Monday maybe", "Thanks.", /missing a date/],
      ["Support the engineering team going forward on Monday-ish timelines", "Thanks.", /missing a date/],
    ])("flags %s", (title, notes, message) => {
      const [hit] = ask(title, notes);
      expect(hit?.message).toMatch(message);
    });

    it.each([
      "Platform leads: approve the shard by Monday 9 November",
      "The storage owner approves the shard by 14 March",
      "Our exec sponsor signs off by Friday",
      "Team leads: send me your next review's titles by 6 November",
    ])("accepts %s", (title) => {
      expect(ask(title)).toEqual([]);
    });
  });

  describe("template-beats", () => {
    it("warns when a template's required beat has no slide, and names it", () => {
      const noOptions = good.filter((s) => s.id !== "options");
      const hits = find(lintDeck(noOptions, { template: "decision-request" }), "template-beats");
      expect(hits).toHaveLength(1);
      expect(hits[0].message).toMatch(/"option"/);
    });

    it("skips optional beats, decks without a template, and untagged decks", () => {
      expect(find(lintDeck(templateOutline("decision-request").filter((s) => s.role !== "risk"), { template: "decision-request" }), "template-beats")).toEqual([]);
      expect(find(lintDeck(good.filter((s) => s.id !== "options")), "template-beats")).toEqual([]);
      const bare = good.map(({ role: _role, ...rest }) => rest);
      expect(find(lintDeck(bare, { template: "decision-request" }), "template-beats")).toEqual([]);
    });

    it.each(STORYLINE_TEMPLATES.map((t) => t.id))("%s: its own outline has every beat", (id) => {
      expect(find(lintDeck(templateOutline(id), { template: id }), "template-beats")).toEqual([]);
    });
  });

  describe("titles that open like a topic", () => {
    const claim = (title: string) => find(lintDeck(withSlide(good, "context", { title })), "title-claim");

    it.each([
      "Overview of the caching project and its many results so far",
      "How the new pipeline architecture works end to end",
      "Status of the migration across every region this quarter",
      "Some of the results we observed during the rollout",
      "Introduction to the new search ranking model for the review",
      "Update on the indexing migration and what comes next",
    ])("flags %s", (title) => {
      expect(claim(title)).toEqual([expect.objectContaining({ severity: "warn" })]);
    });

    it.each([
      "The new pipeline works because each stage retries alone",
      "Migration is on track: 70% of traffic moved",
      "Caching cut p95 latency by half",
    ])("accepts %s", (title) => {
      expect(claim(title)).toEqual([]);
    });
  });

  it("is pure: input untouched, same output twice", () => {
    const before = JSON.stringify(good);
    const a = lintDeck(good, { minutes: 3 });
    expect(lintDeck(good, { minutes: 3 })).toEqual(a);
    expect(JSON.stringify(good)).toBe(before);
  });
});

describe("storylineOf", () => {
  it("lists titles in order with roles, marking the appendix", () => {
    const outline = storylineOf(good);
    expect(outline.map((e) => e.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(outline[0]).toEqual({
      number: 1,
      id: "answer",
      title: "Move resizing to a queue to stop upload timeouts with one engineer",
      role: "answer",
      roleLabel: "Answer",
      appendix: false,
    });
    expect(outline[6].appendix).toBe(true);
    expect(storylineOf([{ id: "x", title: "Untagged slide title here" }])[0]).not.toHaveProperty("role");
  });

  it("formats a plain-text ghost deck", () => {
    const text = formatStoryline([...good.slice(0, 2), { id: "bare", title: "" }]);
    expect(text).toBe(
      [
        "1. [Answer] Move resizing to a queue to stop upload timeouts with one engineer",
        "2. [Context] Uploads resize every image before the request returns",
        "3. (untitled)",
      ].join("\n"),
    );
  });
});
