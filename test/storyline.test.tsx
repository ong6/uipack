import type { DeckSlide } from "../src/deck/types";
import {
  LINT_CHECKS,
  LINT_RULES,
  MAX_TITLE_WORDS,
  REPEATABLE_ROLES,
  SLIDE_ROLES,
  STORYLINE_TEMPLATES,
  formatStoryline,
  getStorylineTemplate,
  lintDeck as lintAny,
  storylineOf,
  talkSeconds,
  templateOutline,
  type LintFinding,
  type LintOptions,
  type LintRule,
  type SlideRole,
  type StorySlide,
} from "../src/deck/storyline";
import { SLOT_BUDGETS, TITLE_WORDS, slotLines, slotProblems, slotSentences, slotWords } from "../src/deck/budgets";

/**
 * Most suites below check a deck of full-sentence titles and talk tracks, so they lint it read-alone
 * (sent without the speaker). The presented default has its own suite at the end.
 */
const lintDeck = (slides: readonly StorySlide[], options: LintOptions = {}) =>
  lintAny(slides, { mode: "read-alone", ...options });
const lintPresented = (slides: readonly StorySlide[], options: LintOptions = {}) => lintAny(slides, options);

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
    title: "A queue ends timeouts at the cost of thumbnails arriving 5 seconds later",
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
    expect(STORYLINE_TEMPLATES.map((t) => t.id).sort()).toEqual([
      "decision-request",
      "deep-dive",
      "launch-demo",
      "postmortem",
      "project-update",
      "review-highlights",
    ]);
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
    const findings = lintPresented(outline, { template: t.id });
    // Examples are titles only, so notes and number sources are expected gaps.
    const relevant = findings.filter((f) => f.rule !== "notes-present" && f.rule !== "number-source");
    expect(relevant).toEqual([]);
    for (const slide of outline) {
      expect(find(lintPresented([slide]), "title-claim")).toEqual([]);
      expect(slide.title.split(/\s+/).length).toBeLessThanOrEqual(TITLE_WORDS.presented);
      expect(slide.points?.length).toBeGreaterThan(0);
    }
    expect(findings.filter((f) => titleRules.includes(f.rule))).toEqual([]);
    // The same beats as full-sentence titles, for a deck sent without its speaker.
    const readAlone = templateOutline(t, { mode: "read-alone" });
    const written = lintDeck(readAlone, { template: t.id }).filter(
      (f) => f.rule !== "notes-present" && f.rule !== "number-source",
    );
    expect(written).toEqual([]);
    for (const slide of readAlone) expect(slide.title.split(/\s+/).length).toBeLessThanOrEqual(MAX_TITLE_WORDS);
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
    expect(Object.keys(LINT_RULES)).toHaveLength(23);
  });
});

describe("lintDeck", () => {
  it("has one check per rule of the checklist, and every finding names its check's rule", () => {
    expect(LINT_CHECKS.map((c) => c.rule).sort()).toEqual(Object.keys(LINT_RULES).sort());
    expect(new Set(LINT_CHECKS.map((c) => c.rule)).size).toBe(LINT_CHECKS.length);
    // A finding never reports a severity stronger than its rule's documented one.
    const rank = { tip: 0, warn: 1, error: 2 };
    const findings = [
      lintDeck([]),
      lintDeck(good),
      lintDeck([
        { id: "a", title: "Overview" },
        { id: "a", title: "" },
      ]),
    ].flat();
    for (const f of findings) expect(rank[f.severity], f.rule).toBeLessThanOrEqual(rank[LINT_RULES[f.rule].severity]);
  });

  it("passes a clean answer-first deck", () => {
    // Seven presented slides at about 90 words each fill half of eight minutes. The template needs a plan.
    const plan: StorySlide = {
      id: "plan",
      title: "Six engineer-weeks, done when upload timeouts drop below 0.1%",
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
    const hits = find(lintDeck(withSlide(good, "context", { title: "Uploads resize inline. The queue fixes it." })), "one-idea");
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
    const ask = (title: string, notes = "Thanks.") => find(lintDeck(withSlide(good, "ask", { title, notes })), "ask-concrete");

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
      // decision-request runs 8–15 minutes, capped at a minute for each of the six presented slides:
      // half of 6 is 3 minutes, about 405 words.
      expect(find(lintDeck(spoken(good, 40), { template: "decision-request" }), "talk-time")).toHaveLength(1);
      expect(find(lintDeck(spoken(good, 80), { template: "decision-request" }), "talk-time")).toEqual([]);
    });

    it("caps the template's floor at a minute a presented slide, for a deck the brief fixes short", () => {
      // Three presented slides: the floor is 3 minutes, not decision-request's 8; half is about 200 words.
      const short = spoken(good.slice(0, 3), 70);
      expect(find(lintDeck(short, { template: "decision-request" }), "talk-time")).toEqual([]);
      expect(find(lintDeck(spoken(good.slice(0, 3), 40), { template: "decision-request" }), "talk-time")).toHaveLength(1);
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

    it('reads a first-slide claim as the answer, "Next steps" as the plan and a dated request as the ask', () => {
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
      find(
        lintDeck(withSlide(good, "context", { title: "Latency improved by 50% across the board", notes, source })),
        "number-source",
      );

    it.each(["I measured this from my laptop once.", "Per my notes, from last week.", "According to the team."])(
      "flags %s",
      (notes) => {
        expect(check(notes)).toHaveLength(1);
      },
    );

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
      find(
        lintDeck(withSlide(good, "context", { title, role, notes: "Source: search latency dashboard, Q3." })),
        "title-specific",
      );

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
      find(
        lintDeck(withSlide(good, "context", { title: "Errors dropped from 3% to 1% after the retry change", notes, source })),
        "number-source",
      );

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
      expect(
        find(
          lintDeck(
            templateOutline("decision-request").filter((s) => s.role !== "risk"),
            { template: "decision-request" },
          ),
          "template-beats",
        ),
      ).toEqual([]);
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

describe("slot-budget", () => {
  const budget = (slide: Partial<StorySlide>) =>
    find(lintDeck(withSlide(good, "context", slide)), "slot-budget").filter((f) => f.slideId === "context");

  it("passes slots inside their budgets", () => {
    expect(
      budget({
        eyebrow: "Upload pipeline",
        lede: "Resizing waits on the request today.",
        slots: { label: "Resize queue", value: "4%", owner: "Platform leads", date: "14 March" },
      }),
    ).toEqual([]);
  });

  it("flags an eyebrow over four words and a lede of two sentences", () => {
    const hits = budget({ eyebrow: "Team leads · how we run reviews today", lede: "It waits. Then it fails." });
    expect(hits.map((h) => h.message)).toEqual([
      expect.stringMatching(/^Eyebrow .*7 words, at most 4/),
      expect.stringMatching(/^Lede .*2 sentences, at most 1/),
    ]);
  });

  it("flags a label that is a sentence, a long number and a headline past two lines", () => {
    expect(budget({ slots: { label: "This box resizes every image." } })[0].message).toMatch(/a sentence, where a label belongs/);
    expect(budget({ slots: { value: "1,234,567" } })[0].message).toMatch(/9 characters, at most 6/);
    const long = "Uploads resize every single large image before the request returns, so the slowest uploads time out";
    expect(budget({ headline: long })[0].message).toMatch(/about 3 lines/);
  });

  it("flags a body point over its budget, a full sentence and more than four points", () => {
    expect(budget({ points: ["First response: 9 h → 2 h"] })).toEqual([]);
    const long = "About one ticket in seventeen now reaches the wrong product area, up from one in twenty-five";
    expect(budget({ points: [long] })[0].message).toMatch(/^Point .*16 words, at most 8/);
    expect(budget({ points: ["The first response now takes two hours."] })[0].message).toMatch(
      /a full sentence, where a fragment belongs/,
    );
    expect(budget({ points: ["One", "Two", "Three", "Four", "Five"] })[0].message).toMatch(/5 body points; keep it to 4/);
  });

  it("reads separators as no words and counts sentences only at their ends", () => {
    expect(slotWords("Q3 · review · Illustrative")).toEqual(["Q3", "review", "Illustrative"]);
    expect(slotSentences("p95 fell 2.4× in Q3.")).toBe(1);
    expect(slotSentences("No full stop")).toBe(0);
    expect(slotLines("one two three", 7)).toBe(2);
    expect(slotProblems("owner", "Platform leads")).toEqual([]);
  });

  it("budgets every slot, with an overflow behaviour each", () => {
    for (const [slot, b] of Object.entries(SLOT_BUDGETS)) {
      expect(b.overflow, slot).toMatch(/^(wrap|wrap-balance|ellipsis)$/);
      expect(b.maxWords ?? b.maxChars, slot).toBeGreaterThan(0);
    }
    expect(SLOT_BUDGETS.headline.maxWords).toBe(MAX_TITLE_WORDS);
  });
});

describe("lintDeck: presented decks (the default)", () => {
  const cues = (say: string, next = "") => ({ say, delivery: "Point at the number.", next });

  /** The owner's review deck, rewritten: short titles, fragment points, cue notes. */
  const presented: StorySlide[] = [
    {
      id: "answer",
      title: "Review decisions: 3 meetings → 1",
      role: "answer",
      points: ["Same teams, same 6 months", "Only change: the answer moved to slide 1"],
      notes: cues(
        "Answer-first reviews decided in one meeting.\nBefore/after of two windows, not a test.\nSource: the platform review log.",
        "What a buried answer costs",
      ),
    },
    {
      id: "problem",
      title: "19 days to decide",
      role: "problem",
      points: ["Three meetings", "Answer on the last slide"],
      notes: cues("Buried answers took 19 days.\nSource: the platform review log, median of 13 reviews."),
    },
    {
      id: "evidence",
      title: "Search: twice as fast",
      role: "evidence",
      points: ["p95 198 ms, half of March", "5 indexes → 1"],
      source: "Search latency dashboard, March against October",
      notes: cues("Twice as fast since March.\nOne index, plus the cache."),
    },
    {
      id: "risk",
      title: "Will the cache hold?",
      role: "risk",
      points: ["71% full today", "Tripwire at 85%"],
      notes: cues("It fills before the peak.\nSource: the cache capacity forecast."),
    },
    {
      id: "ask",
      title: "Send your titles",
      role: "ask",
      points: ["Team leads", "By 6 November"],
      notes: cues("Send me your next review's titles, answer first."),
    },
  ];

  it("passes a deck of short titles, fragment points and cue notes", () => {
    expect(lintPresented(presented)).toEqual([]);
  });

  it("warns when a title is a sentence to read out, and points at read-alone mode", () => {
    const long = "Answer-first reviews were decided in one meeting, not three";
    const [hit] = find(lintPresented(withSlide(presented, "problem", { title: long })), "title-length");
    expect(hit).toMatchObject({ slideId: "problem", severity: "warn" });
    expect(hit.message).toMatch(/sentence to read out/);
    expect(hit.message).toMatch(/read-alone/);
    // The same title is fine in a deck sent without its speaker.
    expect(find(lintDeck(withSlide(presented, "problem", { title: long })), "title-length")).toEqual([]);
  });

  it("accepts verdicts and questions, and warns on a label title on a content slide", () => {
    const claim = (title: string, role?: SlideRole) =>
      find(lintPresented(withSlide(presented, "risk", { title, ...(role ? { role } : {}) })), "title-claim");
    expect(claim("Will the cache hold?")).toEqual([]);
    expect(claim("Android crashes down by two thirds")).toEqual([]);
    expect(claim("Start time: 0.2 s slower")).toEqual([]);
    expect(claim("Approve iOS by 9 January")).toEqual([]);
    expect(claim("Starts got slower")).toEqual([]);
    for (const label of ["Crash rate", "Same work on iOS", "Slower starts?"]) {
      const [hit] = claim(label);
      expect(hit).toMatchObject({ severity: "warn", slideId: "risk" });
      expect(hit.message).toMatch(/topic label on a content slide/);
    }
    // Labels stay fine where a slide only names its part: a mechanism zoom, a section divider, the cover.
    expect(claim("The local bucket", "mechanism")).toEqual([]);
    expect(
      find(lintPresented(withSlide(presented, "risk", { title: "Crash rate", slots: { number: "02" } })), "title-claim"),
    ).toEqual([]);
    expect(claim("Results")[0].message).toMatch(/names the kind of slide/);
    expect(claim("Next steps")[0].message).toMatch(/names the kind of slide/);
    expect(claim("Overview", "cover")[0].severity).toBe("tip");
  });

  it("reads the quantity from the points, not only the title", () => {
    const specific = (points: string[]) =>
      find(lintPresented(withSlide(presented, "evidence", { title: "Search got faster", points })), "title-specific");
    expect(specific(["p95 198 ms, half of March"])).toEqual([]);
    expect(specific(["Much faster", "Users are happier"])[0].message).toMatch(/in the title or a point/);
  });

  it("asks for a source when a point carries the number", () => {
    const deck = withSlide(presented, "evidence", { source: undefined, notes: cues("Twice as fast.") });
    expect(find(lintPresented(deck), "number-source").map((f) => f.slideId)).toEqual(["evidence"]);
  });

  it("reads the ask's owner and date from its points", () => {
    expect(find(lintPresented(presented), "ask-concrete")).toEqual([]);
    const vague = withSlide(presented, "ask", { points: ["Soon"] });
    expect(find(lintPresented(vague), "ask-concrete")[0].message).toMatch(/an owner, a date/);
  });

  it("notes-cues: warns when the notes are a script, not cues; off when read alone", () => {
    const script = Array.from({ length: 70 }, () => "word").join(" ");
    const deck = withSlide(presented, "problem", { notes: cues(script) });
    expect(find(lintPresented(deck), "notes-cues")).toEqual([
      expect.objectContaining({ slideId: "problem", severity: "warn", message: expect.stringMatching(/70 words, a script/) }),
    ]);
    expect(find(lintDeck(deck), "notes-cues")).toEqual([]);
  });

  it("notes-cues: warns on notes that are only stage directions, tips one beside content", () => {
    const only = withSlide(presented, "evidence", {
      notes: cues("Walk the figure left to right.\nPoint at the 9, then the old 40."),
    });
    expect(find(lintPresented(only), "notes-cues")).toEqual([
      expect.objectContaining({ slideId: "evidence", severity: "warn", message: expect.stringMatching(/only stage directions/) }),
    ]);
    const mixed = withSlide(presented, "evidence", {
      notes: cues("Desktop only: 61.2 → 63.0 over four weeks.\nPoint at the 9."),
    });
    expect(find(lintPresented(mixed), "notes-cues")).toEqual([
      expect.objectContaining({ slideId: "evidence", severity: "tip", message: expect.stringMatching(/move it to `delivery`/) }),
    ]);
    expect(find(lintDeck(only), "notes-cues")).toEqual([]);
  });

  describe("causal-claim", () => {
    it("warns on a cause verb in a deck that shows a before/after, outside mechanism, plan and ask", () => {
      const lifted = withSlide(presented, "answer", { title: "Cached cards lifted checkout" });
      expect(find(lintPresented(lifted), "causal-claim")).toEqual([
        expect.objectContaining({ slideId: "answer", severity: "warn", message: expect.stringMatching(/claims a cause/) }),
      ]);
      for (const point of ["Tickets fell because of the cache", "Retries drove failures down", "Caching cut tickets"])
        expect(find(lintPresented(withSlide(presented, "problem", { points: [point] })), "causal-claim"), point).toHaveLength(1);
      // Said as timing, it's fine; so is a mechanism slide saying how the part works.
      expect(
        find(lintPresented(withSlide(presented, "answer", { title: "Checkout: 61.2% → 63.0% since caching" })), "causal-claim"),
      ).toEqual([]);
      expect(
        find(
          lintPresented([
            ...presented,
            { id: "how", title: "The cache cuts provider calls", role: "mechanism", notes: cues("One call a day.") },
          ]),
          "causal-claim",
        ),
      ).toEqual([]);
      // No before/after anywhere: nothing to overclaim from.
      const noCompare = presented.map((s) => ({
        ...s,
        title: s.title.replace(/→/g, "to"),
        points: (s.points ?? []).filter((p) => !p.includes("→")),
      }));
      expect(find(lintPresented(withSlide(noCompare, "answer", { title: "Caching cut tickets" })), "causal-claim")).toEqual([]);
    });

    it("tips when no cue says it is a before/after, not a controlled test", () => {
      const silent = withSlide(presented, "answer", {
        notes: cues("Answer-first reviews decided in one meeting.\nSource: the platform review log."),
      });
      expect(find(lintPresented(silent), "causal-claim")).toEqual([
        expect.objectContaining({ severity: "tip", message: expect.stringMatching(/never says so/) }),
      ]);
      expect(find(lintPresented(presented), "causal-claim")).toEqual([]);
    });
  });

  it("talk-time: cues are not timed against the budget's floor", () => {
    expect(find(lintPresented(presented, { minutes: 8 }), "talk-time")).toEqual([]);
    expect(find(lintDeck(presented, { minutes: 8 }), "talk-time")).toHaveLength(1);
  });

  describe("slide-shape", () => {
    it("warns when every slide has eyebrow, headline and lede, in either mode", () => {
      const templated = presented.map((s) => ({ ...s, eyebrow: "Reviews", lede: "One plain sentence." }));
      for (const lint of [lintPresented, lintDeck])
        expect(find(lint(templated), "slide-shape")).toEqual([
          expect.objectContaining({ severity: "warn", message: expect.stringMatching(/same three parts/) }),
        ]);
      // One slide without them breaks the template.
      expect(find(lintPresented(templated.map((s, i) => (i ? s : { ...s, eyebrow: undefined }))), "slide-shape")).toEqual([]);
    });

    it('warns when every presented title is "Topic: verdict", or every one a sentence', () => {
      const colons = presented.map((s, i) => ({
        ...s,
        title: `Part ${i + 1}: ${s.title.split(":").pop()!.replace("?", "").trim()}`,
      }));
      expect(find(lintPresented(colons), "slide-shape")[0].message).toMatch(/Topic: verdict/);
      const sentences = presented.map((s, i) => ({ ...s, title: `This is slide number ${i + 1} and it says one long thing` }));
      expect(find(lintPresented(sentences), "slide-shape")[0].message).toMatch(/full sentence/);
      expect(find(lintDeck(sentences), "slide-shape")).toEqual([]);
    });

    it("doesn't call a deck of plain labels one shape (title-claim flags labels on content slides)", () => {
      const labels = presented.map((s, i) => ({ ...s, title: ["Reviews", "Meetings", "Latency", "Cache", "Titles"][i] }));
      expect(find(lintPresented(labels), "slide-shape")).toEqual([]);
    });
  });

  describe("ai-tells", () => {
    it('warns on "X, not Y" or an appended comparison on more than one slide', () => {
      const deck = withSlide(withSlide(presented, "answer", { title: "One meeting, not three" }), "problem", {
        points: ["Decided in days, not weeks"],
      });
      expect(find(lintPresented(deck), "ai-tells")).toEqual([
        expect.objectContaining({
          severity: "warn",
          slideId: "problem",
          message: expect.stringMatching(/2 slides use a "X, not Y"/),
        }),
      ]);
      expect(find(lintPresented(withSlide(presented, "answer", { title: "One meeting, not three" })), "ai-tells")).toEqual([]);
      const kickers = withSlide(
        withSlide(presented, "evidence", { lede: "Search answers in 198 ms, twice as fast as March" }),
        "risk",
        {
          lede: "The cache fills in weeks, faster than planned",
        },
      );
      expect(find(lintPresented(kickers), "ai-tells")[0].message).toMatch(/comparison bolted onto the claim/);
    });

    it("tips a semicolon balancing two clauses", () => {
      const deck = withSlide(presented, "answer", {
        lede: "Same teams and the same six months; only the order of the slides changed.",
      });
      expect(find(lintPresented(deck), "ai-tells")).toEqual([
        expect.objectContaining({ severity: "tip", slideId: "answer", message: expect.stringMatching(/semicolon/) }),
      ]);
    });
  });
});
