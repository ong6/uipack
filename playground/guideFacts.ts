/**
 * The numbers the Foundations guides state, in one place. The guides render budgets from here (or
 * straight from `src/deck/budgets`), so a change to the system's values reaches the guides; any
 * word budget a guide or a `docs/system` page states as a literal must equal one of these, or
 * `test/foundations-drift.test.tsx` fails with the phrase and the file.
 */
import { SLOT_BUDGETS, TITLE_WORDS } from "../src/deck/budgets";

type Range = readonly [min: number, max: number];

/** Rules that are guidance on top of a slot's hard budget (the budget is the cap the linter checks). */
export const wordRules = {
  /** A presented slide's title: aim for a short verdict; the check stops at `TITLE_WORDS.presented`. */
  presentedTitleAim: [2, 5] as Range,
  presentedTitleMax: TITLE_WORDS.presented,
  /** A title read without its speaker: the claim as one sentence. */
  readAloneTitle: [3, TITLE_WORDS["read-alone"]] as Range,
  /** A web section head: short and plain, naming what the reader gets. */
  webSectionHead: [2, 5] as Range,
  /** A label inside a drawing: two or three words, under the label slot's cap. */
  drawingLabel: [2, SLOT_BUDGETS.label.maxWords!] as Range,
  /** A slide's body points per slide (a count of points, not words). */
  pointsPerSlide: [2, 4] as Range,
} as const;

const range = ([a, b]: Range) => `${a}–${b}`;

/** "2–5 words", for prose. */
export const words = (r: Range) => `${range(r)} words`;

/**
 * Every word budget a guide may state, as normalised phrases ("2–5", "≤6"): the guidance rules
 * above and each slot's budget in `SLOT_BUDGETS` and `TITLE_WORDS`.
 */
export function allowedWordBudgets(): Set<string> {
  const out = new Set<string>();
  for (const r of Object.values(wordRules)) {
    if (typeof r === "number") out.add(`≤${r}`);
    else out.add(range(r));
  }
  for (const b of Object.values(SLOT_BUDGETS)) {
    if (b.maxWords === undefined) continue;
    out.add(`≤${b.maxWords}`);
    if (b.minWords !== undefined) out.add(`${b.minWords}–${b.maxWords}`);
  }
  for (const n of Object.values(TITLE_WORDS)) out.add(`≤${n}`);
  return out;
}

/** Where each guide's full rules live: the doc it renders in full, or the doc sections it links to. */
export const guideSources: Record<string, { file: string; anchor?: string; label: string }[]> = {
  "/foundations": [{ file: "README.md", label: "The design system overview" }],
  "/foundations/style": [{ file: "style.md", label: "Style roles" }],
  "/foundations/writing": [{ file: "writing.md", label: "Writing" }],
  "/foundations/layout": [{ file: "layout.md", label: "Layout" }],
  "/foundations/mix": [
    { file: "README.md", anchor: "three-layers-swapped-independently", label: "Three layers, swapped independently" },
    { file: "style.md", label: "Style roles, with the treatment roles each style fills" },
  ],
  "/foundations/recipes": [
    { file: "layout.md", anchor: "slides", label: "Slide archetypes and sequences" },
    { file: "layout.md", anchor: "web", label: "Web page layout" },
    { file: "writing.md", anchor: "slot-budgets", label: "Slot budgets" },
  ],
  "/foundations/do-and-dont": [
    { file: "writing.md", anchor: "rules-for-every-medium", label: "Writing rules, AI tells included" },
    { file: "../web-principles.md", label: "Web principles" },
  ],
};
