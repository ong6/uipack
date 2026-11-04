/**
 * Slot text budgets: how much text each slot of the shared slide region map holds before it stops
 * reading at a glance (docs/system/writing.md, "Each word has one place to live"; layout.md,
 * "Regions"). Every archetype fills these slots, so a budget holds in every layout and every style.
 * `lintDeck` reports a slot over budget as `slot-budget`.
 *
 * Plain data and pure functions, no React: a CLI or an editor can read it.
 */

/** A named slot of the slide region map. */
export type SlotName =
  | "title"
  | "eyebrow"
  | "headline"
  | "lede"
  | "label"
  | "quote"
  | "attribution"
  | "value"
  | "unit"
  | "baseline"
  | "number"
  | "action"
  | "owner"
  | "date"
  | "source";

/** What the slot does when its text runs past the box (the CSS the archetypes ship). */
export type SlotOverflow =
  /** Wraps onto more lines, balanced; the region below moves down. */
  | "wrap-balance"
  /** Wraps onto more lines; the region below moves down. */
  | "wrap"
  /** Stays on one line and is clipped with an ellipsis; the full text stays in the DOM. */
  | "ellipsis";

export interface SlotBudget {
  /** Where the slot sits and what it says, for docs and lint messages. */
  role: string;
  minWords?: number;
  maxWords?: number;
  /** Most characters; for a number or a code, where words do not measure it. */
  maxChars?: number;
  /** Most lines at the slot's measure (`charsPerLine`, an estimate for Plex Sans at the slot's size). */
  maxLines?: number;
  charsPerLine?: number;
  /** Most sentences: one for a lede, never a sentence in a label. */
  maxSentences?: number;
  overflow: SlotOverflow;
}

/**
 * The budget table. Sizes are canvas pixels on the 1920×1080 slide, so the measures hold at any
 * screen size. The headline's word limit is also `MAX_TITLE_WORDS` (rule `title-length`).
 */
export const SLOT_BUDGETS: Readonly<Record<SlotName, SlotBudget>> = {
  title: {
    role: "Short name for the overview, counter and screen readers; never longer than a headline",
    maxWords: 14,
    overflow: "ellipsis",
  },
  eyebrow: {
    role: "Above the headline: the section, not the claim",
    minWords: 1,
    maxWords: 4,
    maxLines: 1,
    charsPerLine: 40,
    maxSentences: 0,
    overflow: "wrap",
  },
  headline: {
    role: "The claim as one sentence",
    minWords: 3,
    maxWords: 14,
    maxLines: 2,
    charsPerLine: 44,
    maxSentences: 1,
    overflow: "wrap-balance",
  },
  lede: {
    role: "Under the headline: one sentence of why or caveat",
    maxWords: 30,
    maxLines: 3,
    charsPerLine: 60,
    maxSentences: 1,
    overflow: "wrap",
  },
  label: { role: "Inside a drawing or a tile", maxWords: 3, maxSentences: 0, overflow: "wrap" },
  quote: {
    role: "Quote archetype: the words someone said",
    maxWords: 30,
    maxLines: 4,
    charsPerLine: 40,
    maxSentences: 2,
    overflow: "wrap-balance",
  },
  attribution: {
    role: "Quote archetype: who said it, in what role",
    maxWords: 8,
    maxLines: 1,
    charsPerLine: 60,
    maxSentences: 0,
    overflow: "wrap",
  },
  value: { role: "Fact archetype: the one number", maxChars: 6, overflow: "wrap" },
  unit: { role: "Fact archetype: what the number counts", maxWords: 4, maxSentences: 0, overflow: "wrap" },
  baseline: {
    role: "Fact archetype: the comparison and window",
    maxWords: 12,
    maxLines: 1,
    charsPerLine: 70,
    maxSentences: 1,
    overflow: "wrap",
  },
  number: { role: "Section archetype: the part number", maxChars: 3, overflow: "wrap" },
  action: {
    role: "End archetype: the decision or action asked for",
    minWords: 2,
    maxWords: 12,
    maxLines: 2,
    charsPerLine: 32,
    maxSentences: 1,
    overflow: "wrap",
  },
  owner: {
    role: "End archetype: who decides or acts (a team or role)",
    minWords: 1,
    maxWords: 5,
    maxSentences: 0,
    overflow: "wrap",
  },
  date: { role: "End archetype: a calendar date", minWords: 1, maxWords: 4, maxSentences: 0, overflow: "wrap" },
  source: {
    role: "Footer: the named artifact behind the numbers",
    maxWords: 30,
    maxLines: 2,
    charsPerLine: 110,
    overflow: "wrap",
  },
};

/** Words as a reader counts them: separators like "·" and "—" are not words. */
export const slotWords = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

/** Sentences: a full stop, question or exclamation mark followed by a space and a capital, or the end. */
export function slotSentences(text: string) {
  const t = text.trim();
  if (!t) return 0;
  const inner = t.match(/[.!?](?=\s+[A-Z“"])/g)?.length ?? 0;
  return inner + (/[.!?]["”)]?$/.test(t) ? 1 : 0);
}

/** Estimated lines at the slot's measure, wrapping on words. */
export function slotLines(text: string, charsPerLine: number) {
  let lines = 1;
  let used = 0;
  for (const word of text.trim().split(/\s+/)) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need > charsPerLine && used > 0) {
      lines++;
      used = word.length;
    } else used = need;
  }
  return lines;
}

/** What is wrong with `text` in `slot`, as short reasons; empty when it fits. */
export function slotProblems(slot: SlotName, text: string): string[] {
  const b = SLOT_BUDGETS[slot];
  const words = slotWords(text).length;
  const out: string[] = [];
  if (b.minWords !== undefined && words < b.minWords) out.push(`${words} word${words === 1 ? "" : "s"}, at least ${b.minWords}`);
  if (b.maxWords !== undefined && words > b.maxWords) out.push(`${words} words, at most ${b.maxWords}`);
  if (b.maxChars !== undefined && text.trim().length > b.maxChars)
    out.push(`${text.trim().length} characters, at most ${b.maxChars}`);
  if (b.maxLines !== undefined && b.charsPerLine) {
    const lines = slotLines(text, b.charsPerLine);
    if (lines > b.maxLines) out.push(`about ${lines} lines, at most ${b.maxLines}`);
  }
  if (b.maxSentences !== undefined) {
    const n = slotSentences(text);
    if (b.maxSentences === 0 && n > 0 && words > 3) out.push("a sentence, where a label belongs");
    else if (b.maxSentences > 0 && n > b.maxSentences) out.push(`${n} sentences, at most ${b.maxSentences}`);
  }
  return out;
}
