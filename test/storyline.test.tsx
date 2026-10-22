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
    title: "Move resizing to a queue to stop upload timeouts",
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
    title: "A queue ends timeouts; thumbnails arrive a few seconds later",
    role: "recommendation",
    notes: "The queue wins, and the cost is a short delay on thumbnails.",
  },
  {
    id: "ask",
    title: "Decide by 14 March so Platform can staff it in Q2",
    role: "ask",
    notes: "I need a decision from you by 14 March.",
  },
  { id: "backup", title: "Load test details", role: "appendix" },
];

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
      for (const field of [beat.purpose, beat.titlePattern, beat.example, beat.guidance]) {
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
    expect(Object.keys(LINT_RULES)).toHaveLength(15);
  });
});

describe("lintDeck", () => {
  it("passes a clean answer-first deck", () => {
    expect(lintDeck(good, { template: "decision-request", minutes: 8 })).toEqual([]);
  });

  it("accepts DeckSlide objects as they are", () => {
    const slide: DeckSlide = {
      id: "one",
      title: "Uploads stop timing out once resizing moves to a queue",
      notes: "Here's the point.",
      render: () => null,
    };
    expect(rulesOf(lintDeck([slide]))).toEqual(["roles-missing"]);
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

  it("roles-missing skips the storyline checks", () => {
    const bare = good.map(({ role: _role, ...rest }) => rest);
    const rules = rulesOf(lintDeck(bare));
    expect(rules).toContain("roles-missing");
    expect(rules).not.toContain("answer-first");
    expect(rules).not.toContain("closing-ask");
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
      const [hit] = ask("We need Platform to approve one more engineer");
      expect(hit.message).toBe("The ask is missing a date.");
    });

    it("accepts verb, owner and date across title and notes", () => {
      expect(ask("Approve the queue migration", "We need your call by Friday.")).toEqual([]);
      expect(ask("Prioritise the canary work in Q3 planning; Release Engineering owns it")).toEqual([]);
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
    expect(find(lintDeck(deck, { minutes: 10 }), "talk-time")).toEqual([]);
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
      title: "Move resizing to a queue to stop upload timeouts",
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
        "1. [Answer] Move resizing to a queue to stop upload timeouts",
        "2. [Context] Uploads resize every image before the request returns",
        "3. (untitled)",
      ].join("\n"),
    );
  });
});
