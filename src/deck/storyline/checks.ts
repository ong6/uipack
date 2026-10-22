// The linter: each rule's check over the deck, run in order by lintDeck, and the talk-length estimate.
import { WORDS_PER_MINUTE } from "../../speech";
import { QUANTIFIED_ROLES, REPEATABLE_ROLES, SLIDE_ROLES, type SlideRole } from "./roles";
import { getStorylineTemplate, type StorylineTemplate } from "./templates";
import { MAX_TITLE_WORDS, type LintFinding, type LintOptions, type LintRule, type LintSeverity, type StorySlide } from "./rules";
import {
  TOPIC_LABELS,
  DATE_RE,
  RELATIVE_DATE_RE,
  DECISION_RE,
  OUTCOME_RE,
  namedSource,
  TOPIC_OPENING_RE,
  topicOpening,
  QUESTIONS_SLIDE_RE,
  wordsOf,
  headlineOf,
  sayOf,
  notesText,
  normaliseLabel,
  edgeLabel,
  hasClaimNumber,
  hasOwner,
  hasFirmDate,
  isSpecific,
  inferRoles,
} from "./heuristics";

/** What every check reads: the deck, its options, and what is derived from them once. */
interface LintContext {
  slides: readonly StorySlide[];
  options: LintOptions;
  template?: StorylineTemplate;
  /** Whether the answer-first checks run: the option, else the template's setting, else true. */
  answerFirst: boolean;
  /** Roles read from the titles when no slide has one; undefined when the author tagged roles. */
  inferred?: (SlideRole | undefined)[];
  /** A slide's role: the author's, else the inferred one. */
  roleAt: (slide: StorySlide) => SlideRole | undefined;
  /** The slides presented: all but the appendix. */
  presented: readonly StorySlide[];
  /** The presented slides whose role is the ask. */
  asks: readonly StorySlide[];
}
type Report = (severity: LintSeverity, message: string, slideId?: string) => void;

/** One rule of the checklist (`LINT_RULES` has its wording) and the check that reports it. */
export interface LintCheck {
  rule: LintRule;
  check: (deck: LintContext, report: Report) => void;
}

/** A presented slide with a title: what the per-slide title checks read. */
function titledSlides(deck: LintContext) {
  return deck.slides
    .filter((slide) => slide.role !== "appendix")
    .map((slide) => ({ slide, headline: headlineOf(slide) }))
    .filter(({ headline }) => headline);
}

/**
 * The checks, in the order their findings are listed: the deck's identity, then each slide's title
 * and notes, then the storyline (answer, ask, rhythm, beats), then length. A slide's own findings
 * keep this order. Every other check assumes at least one slide, so `deck-empty` stops the run.
 */
export const LINT_CHECKS: readonly LintCheck[] = [
  {
    rule: "deck-empty",
    check: ({ slides }, report) => {
      if (slides.length === 0) report("error", "The deck has no slides.");
    },
  },
  {
    rule: "duplicate-id",
    check: ({ slides }, report) => {
      const seen = new Set<string>();
      for (const slide of slides) {
        if (seen.has(slide.id)) report("error", `Slide ID "${slide.id}" is used more than once.`, slide.id);
        seen.add(slide.id);
      }
    },
  },
  {
    rule: "title-present",
    check: ({ slides }, report) => {
      for (const slide of slides)
        if (!headlineOf(slide)) report("error", "No title. Write the slide's point as a sentence.", slide.id);
    },
  },
  {
    rule: "title-claim",
    check: (deck, report) => {
      for (const { slide, headline } of titledSlides(deck)) {
        const words = wordsOf(headline);
        const label = normaliseLabel(headline);
        const prefix = headline.includes(":") ? normaliseLabel(headline.slice(0, headline.indexOf(":"))) : "";
        // A cover may be a label; it is only a tip there.
        const soften = (s: LintSeverity): LintSeverity => (slide.role === "cover" ? "tip" : s);
        if (TOPIC_LABELS.has(label)) {
          report(
            soften("error"),
            `"${headline}" is a topic label. Say what the audience should conclude from this slide.`,
            slide.id,
          );
        } else if (words.length < 3) {
          report(soften("warn"), `"${headline}" is under three words; it reads as a label, not a claim.`, slide.id);
        } else if (words.length <= 4 && edgeLabel(label)) {
          report(soften("warn"), `"${headline}" reads like a section label. State the finding instead.`, slide.id);
        } else if (prefix && TOPIC_LABELS.has(prefix) && prefix !== "next") {
          report(
            soften("tip"),
            `"${headline}" opens with a section label. Lead with the claim; put the section in the eyebrow.`,
            slide.id,
          );
        } else if (TOPIC_OPENING_RE.test(headline)) {
          report(
            soften("warn"),
            `"${headline}" opens like a topic ("${topicOpening(headline)}"), however long it runs. Say what the audience should conclude.`,
            slide.id,
          );
        }
      }
    },
  },
  {
    rule: "title-length",
    check: (deck, report) => {
      for (const { slide, headline } of titledSlides(deck)) {
        const words = wordsOf(headline).length;
        if (words > MAX_TITLE_WORDS)
          report("warn", `Title is ${words} words; keep it to ${MAX_TITLE_WORDS} or move detail to the body.`, slide.id);
      }
    },
  },
  {
    rule: "title-specific",
    check: (deck, report) => {
      for (const { slide, headline } of titledSlides(deck)) {
        if (slide.role && QUANTIFIED_ROLES.includes(slide.role) && !isSpecific(headline)) {
          report(
            "warn",
            `"${headline}" could describe any quarter. Put the quantity in the title: the number with its unit, or the from→to it moved; a bare count ("two teams") doesn't say how much.`,
            slide.id,
          );
        } else if (slide.role === "plan" && !isSpecific(headline) && !hasFirmDate(headline)) {
          report("warn", `"${headline}" has no date and no number. Say when each milestone lands, or what it costs.`, slide.id);
        }
      }
    },
  },
  {
    rule: "one-idea",
    check: (deck, report) => {
      for (const { slide, headline } of titledSlides(deck))
        if (/[.!?]["”’)]?\s+\S/.test(headline))
          report("tip", "Title has more than one sentence. One idea per slide: split it or pick one.", slide.id);
    },
  },
  {
    rule: "notes-present",
    check: ({ presented }, report) => {
      for (const slide of presented)
        if (!sayOf(slide.notes))
          report("warn", "No talk track. Notes carry what you say; the title carries the claim.", slide.id);
    },
  },
  {
    rule: "number-source",
    check: (deck, report) => {
      for (const { slide, headline } of titledSlides(deck)) {
        if (slide.role === "plan" || slide.role === "ask" || !hasClaimNumber(headline)) continue;
        if (namedSource(notesText(slide.notes)) || (slide.source && slide.source.trim())) continue;
        report(
          "warn",
          'The title has a number but no source. Name the artifact it came from ("the search latency dashboard", "load test 12", "the Q3 user survey", a URL) and its window in the notes, or set the slide\'s `source`. Hearsay ("someone mentioned", "trust me") doesn\'t count.',
          slide.id,
        );
      }
    },
  },
  {
    // Storyline checks need roles. An untagged deck gets roles read from its titles (slide one is
    // the cover or the answer, "Next steps" is the plan, a last slide asking for something is the
    // ask), so a deck of topic labels still hears that it has no answer and no ask.
    rule: "roles-missing",
    check: ({ inferred }, report) => {
      if (inferred)
        report(
          "warn",
          "No slide has a role. Roles were guessed from the titles for the answer-first and closing-ask checks; tag each slide's role for the rest.",
        );
    },
  },
  {
    rule: "answer-first",
    check: ({ answerFirst, presented, roleAt, inferred, slides }, report) => {
      if (!answerFirst) return;
      const content = presented.filter((s) => roleAt(s) !== "cover");
      const at = content.findIndex((s) => roleAt(s) === "answer" || roleAt(s) === "recommendation");
      if (at === -1) {
        report(
          "error",
          inferred
            ? `No slide states the answer: "${headlineOf(slides[0])}" opens the deck without a conclusion. Put the result or recommendation first, with its number.`
            : "No slide states the answer or recommendation. Put the conclusion up front (role 'answer').",
        );
      } else if (at > 2) {
        report(
          "warn",
          `The answer arrives on content slide ${at + 1}. Move it into the first three; busy readers stop early.`,
          content[at].id,
        );
      }
    },
  },
  {
    rule: "outcome-first",
    check: ({ answerFirst, presented }, report) => {
      const first = presented[0];
      const text = first ? headlineOf(first) : "";
      if (answerFirst && first && text && !isSpecific(text) && !OUTCOME_RE.test(text)) {
        report(
          "tip",
          "Slide one names the work, not the outcome. Say what got faster, cheaper or safer for the business, and by how much.",
          first.id,
        );
      }
    },
  },
  {
    rule: "closing-ask",
    check: ({ presented, asks, roleAt }, report) => {
      const last = presented[presented.length - 1];
      const closesOnQuestions = last && QUESTIONS_SLIDE_RE.test(headlineOf(last));
      if (asks.length === 0) {
        report(
          "error",
          closesOnQuestions
            ? `The deck closes on "${headlineOf(last)}", so the ask is missing. End on the decision or action you need, from whom, by when, and take questions with it on screen.`
            : "No ask. End with the decision or action you need, from whom, by when.",
          closesOnQuestions ? last.id : undefined,
        );
      } else if (last && roleAt(last) !== "ask") {
        report("warn", "The deck doesn't end on the ask. Close on it so it's the last thing on screen.", last.id);
      }
    },
  },
  {
    rule: "ask-concrete",
    check: ({ asks }, report) => {
      for (const ask of asks) {
        const text = `${headlineOf(ask)}. ${notesText(ask.notes)}`;
        const missing: string[] = [];
        if (!DECISION_RE.test(text)) missing.push("a decision or action verb");
        if (!hasOwner(text)) missing.push("an owner");
        if (!hasFirmDate(text)) missing.push("a date");
        if (!missing.length) continue;
        const relative = text.match(RELATIVE_DATE_RE)?.[0];
        const hedged = DATE_RE.test(text) && !relative;
        const hints = [
          missing.includes("an owner") &&
            "Name the team or role who acts (\"platform leads\", \"the payments team\", \"VP Eng\", an @handle); 'we', 'the team', a bare name and 'owner TBD' don't say whose it is.",
          missing.includes("a date") && relative && `"${relative}" moves with the calendar; give a date such as 14 March.`,
          missing.includes("a date") && hedged && 'The date is hedged ("-ish", "maybe", "TBC"); commit to one.',
        ].filter(Boolean);
        report("warn", [`The ask is missing ${missing.join(", ")}.`, ...hints].join(" "), ask.id);
      }
    },
  },
  {
    // Rhythm needs the author's roles; guesses would only echo the titles.
    rule: "role-repeat",
    check: ({ slides, inferred }, report) => {
      if (inferred) return;
      for (let i = 1; i < slides.length; i++) {
        const prev = slides[i - 1].role;
        const role = slides[i].role;
        if (!role || role !== prev || REPEATABLE_ROLES.includes(role)) continue;
        const message =
          role === "option"
            ? "Two option slides in a row. Compare the options side by side on one slide, on the same criteria."
            : `Two ${SLIDE_ROLES[role].label.toLowerCase()} slides in a row. Merge them, or give the second its own role.`;
        report("warn", message, slides[i].id);
      }
    },
  },
  {
    // A template's required beats: a decision request without its options slide has skipped a step.
    rule: "template-beats",
    check: ({ template, inferred, presented }, report) => {
      if (!template || inferred) return;
      const have = new Set(presented.map((s) => s.role));
      const required = [...new Set(template.beats.filter((b) => !b.optional).map((b) => b.role))];
      const missing = required.filter((r) => !have.has(r));
      if (missing.length === 1) {
        const beat = template.beats.find((b) => b.role === missing[0])!;
        const label = SLIDE_ROLES[missing[0]].label.toLowerCase();
        report(
          "warn",
          `A ${template.name.toLowerCase()} needs ${/^[aeiou]/.test(label) ? "an" : "a"} ${label} slide (${beat.purpose.charAt(0).toLowerCase()}${beat.purpose.slice(1).replace(/\.$/, "")}), and no slide has role "${missing[0]}".`,
        );
      } else if (missing.length > 1) {
        report(
          "warn",
          `A ${template.name.toLowerCase()} needs these beats, and no slide has their role: ${missing.map((r) => `"${r}"`).join(", ")}.`,
        );
      }
    },
  },
  {
    rule: "deck-length",
    check: ({ presented, options, template }, report) => {
      const count = presented.length;
      if (options.minutes !== undefined && count > 0) {
        if (count > options.minutes) {
          report(
            "warn",
            `${count} slides for ${options.minutes} minutes is under a minute each. Cut, merge, or move detail to the appendix.`,
          );
        } else if (options.minutes / count > 2) {
          report(
            "tip",
            `${count} slides for ${options.minutes} minutes is over two minutes each. Fine for discussion; otherwise split a dense slide.`,
          );
        }
      } else if (template && (count < template.slides.min || count > template.slides.max)) {
        report(
          "tip",
          `${count} presented slides; a ${template.name.toLowerCase()} usually runs ${template.slides.min}–${template.slides.max}.`,
        );
      }
    },
  },
  {
    rule: "talk-time",
    check: ({ slides, presented, options, template }, report) => {
      const budget = options.minutes ?? template?.minutes.max;
      if (budget === undefined) return;
      const seconds = talkSeconds(slides);
      // The shortest budget this talk should fill: the given minutes, else the template's minimum.
      const floor = options.minutes ?? template!.minutes.min;
      if (seconds > budget * 60) {
        report(
          "warn",
          `The talk track runs about ${Math.round(seconds / 60)} minutes at ${WORDS_PER_MINUTE} words a minute, over the ${budget}-minute budget.`,
        );
      } else if (seconds < floor * 30 && presented.every((s) => sayOf(s.notes))) {
        // Only once every slide has a track: a missing one is already its own finding.
        report(
          "warn",
          `The talk track covers about ${formatDuration(seconds)} of the ${floor}-minute budget, under half. Write what you'll say in full sentences; a forwarded deck and the speaker view's clock both read it.`,
        );
      }
    },
  },
];

function lintContext(slides: readonly StorySlide[], options: LintOptions): LintContext {
  const template = options.template ? getStorylineTemplate(options.template) : undefined;
  const inferred = slides.some((s) => s.role) ? undefined : inferRoles(slides);
  const roleAt = (s: StorySlide) => (inferred ? inferred[slides.indexOf(s)] : s.role);
  const presented = slides.filter((s) => s.role !== "appendix");
  return {
    slides,
    options,
    template,
    answerFirst: options.answerFirst ?? template?.answerFirst ?? true,
    inferred,
    roleAt,
    presented,
    asks: presented.filter((s) => roleAt(s) === "ask"),
  };
}

/**
 * Check a deck's argument: action titles, answer first, a concrete closing ask, role rhythm,
 * talk tracks, sources for numbers, and length against the time budget. Runs `LINT_CHECKS` in
 * order. Pure; no DOM.
 */
export function lintDeck(slides: readonly StorySlide[], options: LintOptions = {}): LintFinding[] {
  const findings: LintFinding[] = [];
  const deck = lintContext(slides, options);
  for (const { rule, check } of LINT_CHECKS) {
    check(deck, (severity, message, slideId) =>
      findings.push(slideId === undefined ? { rule, severity, message } : { slideId, rule, severity, message }),
    );
    if (rule === "deck-empty" && findings.length) break;
  }
  return findings;
}

/** "1 min 32 s", "45 s": a short spoken length. */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return m ? `${m} min${sec ? ` ${sec} s` : ""}` : `${sec} s`;
}

/** Estimated speaking time of the presented slides' `say` text, in seconds. */
export function talkSeconds(slides: readonly StorySlide[]): number {
  const words = slides
    .filter((s) => s.role !== "appendix")
    .reduce((sum, s) => sum + (sayOf(s.notes).match(/\S+/g)?.length ?? 0), 0);
  return Math.round((words / WORDS_PER_MINUTE) * 60);
}
