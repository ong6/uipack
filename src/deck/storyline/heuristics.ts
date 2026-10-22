// How the linter reads English: what makes a title a topic rather than a claim, a number a claim,
// a closing ask concrete (a decision, an owner, a firm date) and a source a named one. Pure text
// tests over the slides' words; the checks (checks.ts) decide what to report.
//
// Module-level regular expressions and sets built by a call are marked pure, so a consumer who
// imports only a constant from uipack/deck can drop all of this.
import type { SlideRole } from "./roles";
import type { StorySlide } from "./rules";

export const TOPIC_LABELS = new Set([
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
  "why now",
]);

const MONTH =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const WEEKDAY = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";

/** A calendar date someone can put in a diary: a month, a weekday, a numeric date, a named quarter or half, or today. */
const capitalised = (alternatives: string) =>
  alternatives.replace(/(^|\|)([a-z])/g, (_, bar: string, c: string) => bar + c.toUpperCase());
export const DATE_RE = new RegExp(
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
export const RELATIVE_DATE_RE =
  /\b(?:(?:this|next|coming|following) (?:week|month|quarter|half|sprint|year|cycle)|end of (?:the )?(?:week|month|quarter|half|year)|soon|asap|going forward|in the future|over time|eventually|later this year)\b/i;

export const DECISION_RE =
  /\b(?:approve|approves|decide|decision|agree|choose|pick|sign(?:s)? off|fund|staff|prioriti[sz]e|review|commit|allocate|assign|adopt|join|try|confirm|accept|enable|switch|turn on|send|share|sponsor|support|unblock|escalate|ship|green-?light|vote|nominate|give|grant|lend|provide|attend|book|hire|move|freeze|pause|stop|start|own)\b/i;

/**
 * A role that can own an ask: "the payments director", "VP Eng", "@handle". Pronouns ("we",
 * "you"), a bare "the team" and a capitalised word ("Support", "Bob") name nobody who would know
 * the ask is theirs.
 */
const OWNER_ROLE_RE =
  /\b(?:manager|managers|director|directors|head of|committee|board|council|on-call|architect|architects|approver|approvers|reviewer|reviewers)\b|(?:^|[\s(])@\w/i;
/**
 * Words that name an owner only with a qualifier in front ("platform leads", "the service owner",
 * "our exec sponsor"). Alone they are a placeholder ("owner TBD", "Leads to approve") or a verb
 * ("we will lead the review"), and a placeholder after them ("platform owner: TBD") names nobody.
 */
const QUALIFIED_OWNER_RE =
  /([\p{L}][\p{L}'’-]*)\s+(?:lead|leads|owner|owners|sponsor|sponsors|chair)\b(?![\s:,–—-]*(?:TBD|TBC|TBA|tbd|to be (?:decided|confirmed|named|agreed)|unknown|unassigned|\?))/gu;
/** Words that can't qualify an owner: pronouns, articles, modals and links ("we will lead", "the owner"). */
const NOT_A_QUALIFIER = new Set(
  (
    "i we you they he she it me us them this that these those which who whom what the a an our your their my his her its " +
    "will would can could should shall may might must to and or but then also please not never always just " +
    "do does did let lets let's help who'll we'll i'll you'll they'll whoever someone somebody anyone nobody no"
  ).split(" "),
);
/** Job-title acronyms, case-sensitive so "3 pm" and "them" don't count. */
const OWNER_ACRONYM_RE = /\b(?:VPs?|SVPs?|EVPs?|CEO|CTO|CFO|COO|CPO|CIO|CISO|PMs?|EMs?|TLs?|TPMs?|SREs?)\b/;
/** "<name> team", "<name> org": a named group. "the team", "our team" don't count. */
const NAMED_GROUP_RE =
  /\b(?!the\b|our\b|my\b|your\b|this\b|that\b|a\b|whole\b|entire\b|each\b|every\b|any\b|other\b|same\b|new\b)[\p{L}-]+ (?:team|teams|org|group|squad|guild|committee)\b/iu;
/** "Release Engineering owns it": a named group stated as the owner. */
const NAMED_OWNS_RE = /\b\p{Lu}[\p{L}-]*(?: \p{Lu}[\p{L}-]*)* (?:owns|will own)\b/u;

/** A date said with a shrug isn't one: "Monday-ish", "next Monday maybe", "14 March, TBC". */
const HEDGED_DATE_RE =
  /-?\bish\b|\b(?:maybe|perhaps|probably|possibly|hopefully|tentatively|roughly|approximately|sometime|some time|or so|give or take|if possible|ideally|TBD|TBC|TBA|tbd|tbc)\b/i;

/** Number words, for quantities written out. */
const NUM_WORD =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|dozen";
/** Units a quantity is measured in: time, share, multiples, money, data and people. */
const UNIT =
  "ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|quarters?|years?|sprints?|percent|per cent|percentage points?|points?|pts|times|dollars|cents|euros|pounds|[KMGT]B|engineers?|engineer-(?:days|weeks|months)|people|persons?|hires?|headcount|FTEs?";
/** A multiple or a fraction: "twice as fast", "cut by half", "a third of queries". */
const MULTIPLE_RE =
  /\b(?:twice|half|halve[ds]?|halving|double[ds]?|doubling|triple[ds]?|tripling|quadrupled|tenfold|[a-z]+-fold|a third|thirds|two-thirds|a quarter|a fifth|a tenth)\b/i;
/** A number word with its unit: "three weeks", "one engineer", "nine more months", "a two-day ticket". */
const NUMBER_UNIT_RE = new RegExp(
  String.raw`\b(?:${NUM_WORD})(?:[\s-]+(?:more|fewer|extra|full|whole|additional|business|working|calendar))?[\s-]+(?:${UNIT})\b`,
  "i",
);
/** Two quantities compared: "one meeting, not three", "from forty to six", "nine in ten". */
const NUMBER_COMPARISON_RE = new RegExp(
  String.raw`\b(?:${NUM_WORD}|\d[\d,.]*)\b[^.;:!?]{0,40}?\b(?:not|instead of|rather than|vs\.?|versus|against|down from|up from|from|to|of|in|out of)\s+(?:about\s+|around\s+|a\s+|the\s+|every\s+)?(?:${NUM_WORD})\b`,
  "i",
);

/** Outcome words for slide one: what changed for the business. */
export const OUTCOME_RE =
  /\b(?:faster|slower|cheaper|safer|fewer|more|less|cut|cuts|saved?|saves|saving|grew|grow|fell|fall|rose|raised?|reduced?|reduces|improved?|improves|doubled?|halved?|ended|ends|stops?|stopped|prevents?|unblock(?:s|ed)?|launch(?:es|ed)?|ship(?:s|ped)?|on track|at risk|done|delivered|won|lost|missed|recovered|restored)\b/i;

/**
 * Where a number came from: a named artifact a reader could open. A kind of evidence counts with a
 * name: a word in front ("the search latency dashboard", "load test", "the Q3 user survey") or an
 * ID or name after it ("benchmark suite", "dashboard SRCH-12"). Bare or hedged mentions don't: "the
 * test I ran once on staging, trust me", "a report someone mentioned", "the dashboard chat".
 */
const SOURCE_KIND_RE =
  /^(?:dashboards?|quer(?:y|ies)|tests?|surveys?|reports?|benchmarks?|logs?|experiments?|traces?|telemetry|studies|study|forecasts?|trackers?|ledgers?|notebooks?|spreadsheets?)$/i;
/** Named sources in a fixed phrase. */
const SOURCE_PHRASE_RE =
  /\b(?:management|finance|financial) accounts\b|\b(?:cost|capacity|pricing|financial|forecast) model\b|https?:\/\/|\bwww\.\w/i;
/** Words that make a sentence's source hearsay. */
const HEDGED_SOURCE_RE =
  /\b(?:trust me|someone|somebody|said so|i think|i believe|i heard|i guess|heard|mentioned|rumou?rs?|anecdotal(?:ly)?|ballpark|eyeball(?:ed)?|gut feel(?:ing)?|from memory|my laptop|off the top of my head|guess(?:ed|timate)?|ran (?:it )?once|once on staging)\b/i;
/** What follows a kind of evidence that makes it a modifier, not the source: "the dashboard chat". */
const SOURCE_MODIFIED_RE =
  /^(?:chat|channel|thread|meeting|call|conversation|discussion|rumou?r|gossip|screenshot|people|team|owner)$/i;
/** Words after a kind of evidence that name it: "benchmark suite", "test run 4". */
const SOURCE_NAME_AFTER_RE = /^(?:suite|suites|run|runs|notebook|sheet|page|tab|panel|export|entry|row|link|doc|id)$/i;
const SOURCE_STOP = new Set(
  (
    "i we you they he she it me us them this that these those which who what the a an our your their my his her its " +
    "some any one per from in on at of by for to with and or but see source sources is was were are be been said says " +
    "ran run did do so just once maybe probably trust according"
  ).split(" "),
);

export function namedSource(text: string): boolean {
  if (SOURCE_PHRASE_RE.test(text)) return true;
  // Sentences; a decimal point ("0.41") or an abbreviation doesn't end one.
  return text.split(/(?<!\d)[.;!?](?!\d)|\n/).some((sentence) => {
    if (HEDGED_SOURCE_RE.test(sentence)) return false;
    const words = sentence
      .split(/[\s,:()“”"]+/)
      .filter(Boolean)
      .map((w) => w.replace(/['’]s$/, ""));
    return words.some((word, i) => {
      if (!SOURCE_KIND_RE.test(word)) return false;
      const before = words[i - 1];
      const after = words[i + 1];
      if (after && SOURCE_MODIFIED_RE.test(after)) return false;
      const namedBefore = Boolean(before && /^[\p{L}\p{N}]/u.test(before) && !SOURCE_STOP.has(before.toLowerCase()));
      const namedAfter = Boolean(
        after && (/\d/.test(after) || (/^\p{Lu}/u.test(after) && after !== "I") || SOURCE_NAME_AFTER_RE.test(after)),
      );
      return namedBefore || namedAfter;
    });
  });
}

/** Titles that open like a topic, however long: "Overview of…", "How X works", "Status of…". */
export const TOPIC_OPENING_RE =
  /^(?:overview of|an overview of|introduction to|intro to|update on|an update on|status\b|some of|how\b[^.;:?!]*\bworks?\b|thanks\b|thank you\b|any questions\b|questions\b)/i;

/** The opening phrase that makes a title read as a topic, for the finding's message. */
export function topicOpening(title: string): string {
  const m = title.match(TOPIC_OPENING_RE)?.[0] ?? "";
  return /^how\b/i.test(m) ? "How … works" : `${m}…`;
}

/** A closing slide that hands the room to questions instead of asking for something. */
export const QUESTIONS_SLIDE_RE = /^(?:any |final |your )?(?:questions?|q ?& ?a|q and a|thanks?|thank you|discussion)\b/i;
/** A slide that is the plan by its title. */
const PLAN_TITLE_RE = /^(?:next steps?|what's next|whats next|roadmap|the plan|plan)\b/i;

export function wordsOf(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.%,&/-]*/gu) ?? [];
}

export function headlineOf(slide: StorySlide): string {
  return (slide.headline ?? slide.title ?? "").trim();
}

export function sayOf(notes: StorySlide["notes"]): string {
  if (!notes) return "";
  return (typeof notes === "string" ? notes : notes.say).trim();
}

export function notesText(notes: StorySlide["notes"]): string {
  if (!notes) return "";
  return typeof notes === "string" ? notes : [notes.say, notes.delivery, notes.next ?? ""].join(" ");
}

export function normaliseLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}&' -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether `phrase` starts or ends with a known topic label. */
export function edgeLabel(phrase: string): string | undefined {
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
export function hasClaimNumber(text: string): boolean {
  const stripped = text
    .replace(new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH})\b`, "gi"), " ")
    .replace(new RegExp(String.raw`\b(?:${MONTH})\s+\d{1,2}(?:st|nd|rd|th)?\b`, "gi"), " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b[QH][1-4](?:\s*(?:FY)?'?\d{2,4})?\b/gi, " ")
    .replace(/\bFY\s?'?\d{2,4}\b/gi, " ")
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\bv\d+(?:\.\d+)*\b/gi, " ")
    // A product's version ("Kafka 3 migration", "Python 3.12"), unless a unit or a counted plural follows.
    .replace(
      /\b\p{Lu}[\p{L}]*\s+\d+(?:\.\d+)*\b(?!\s*(?:%|[x×]\b|ms\b|of\b|to\b|in\b|out of\b|per\b|vs\b|versus\b|more\b|fewer\b|less\b|times\b|(?!(?:is|was|has|does|this|its|us)\b)\p{L}{2,}s\b))/gu,
      " ",
    )
    .replace(/\b(?:p|sev-?)\d\b/gi, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ");
  return /\d/.test(stripped);
}

/**
 * An owner someone would recognise as themselves: a role ("platform leads", "VP Eng"), a named
 * team ("the payments team"), an @handle or "<Name> owns it". "We", "you", "the team" and a bare
 * capitalised word are not owners.
 */
export function hasOwner(text: string): boolean {
  const qualified = Array.from(text.matchAll(QUALIFIED_OWNER_RE)).some((m) => !NOT_A_QUALIFIER.has(m[1].toLowerCase()));
  return (
    qualified || OWNER_ROLE_RE.test(text) || OWNER_ACRONYM_RE.test(text) || NAMED_GROUP_RE.test(text) || NAMED_OWNS_RE.test(text)
  );
}

/** A date someone can put in a diary, said firmly: a clause with a date and no hedge ("Monday-ish", "maybe"). */
export function hasFirmDate(text: string): boolean {
  return text.split(/[,;!?()\n—–]|\.(?!\d)/).some((clause) => DATE_RE.test(clause) && !HEDGED_DATE_RE.test(clause));
}

/**
 * A claim is specific when it quantifies something: a number that isn't a date or a version, a
 * multiple or fraction ("twice", "a third"), a number word with its unit ("three weeks", "one
 * engineer") or two quantities compared ("one meeting, not three", "nine in ten"). A bare count
 * ("Two teams worked hard"), "no regressions" and a proper noun don't: "The new Kafka pipeline is
 * much better than before" says nothing.
 */
export function isSpecific(text: string): boolean {
  return hasClaimNumber(text) || MULTIPLE_RE.test(text) || NUMBER_UNIT_RE.test(text) || NUMBER_COMPARISON_RE.test(text);
}

/** Roles read from titles, for a deck with none tagged: enough to run answer-first and closing-ask. */
export function inferRoles(slides: readonly StorySlide[]): (SlideRole | undefined)[] {
  return slides.map((slide, i) => {
    const text = headlineOf(slide);
    if (i === 0) return isSpecific(text) || OUTCOME_RE.test(text) ? "answer" : "cover";
    if (PLAN_TITLE_RE.test(text)) return "plan";
    if (
      i === slides.length - 1 &&
      !QUESTIONS_SLIDE_RE.test(text) &&
      DECISION_RE.test(text) &&
      (hasOwner(text) || hasFirmDate(text))
    ) {
      return "ask";
    }
    return undefined;
  });
}
