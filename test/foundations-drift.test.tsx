// The Foundations guides restate the system's values in prose and tables. Every system change
// (a new Technical, new writing budgets) used to leave those copies stale, and readers then met a
// guide that contradicted the docs or the page it teaches. These checks fail on that drift.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SLOT_BUDGETS, TITLE_WORDS } from "../src/deck/budgets";
import { sectionOrder } from "../src/style";
import { libraryPages } from "../playground/catalog";
import { allowedWordBudgets, guideSources } from "../playground/guideFacts";
import { recipes } from "../playground/FoundationsShowcase";
import { exampleSectionIds } from "../playground/WebShowcase";

const root = resolve(__dirname, "..");
const read = (f: string) => readFileSync(resolve(root, f), "utf8");
const guideFiles = [
  "playground/FoundationsShowcase.tsx",
  "docs/system/README.md",
  "docs/system/style.md",
  "docs/system/writing.md",
  "docs/system/layout.md",
];

/** Each word budget stated in a text, normalised: "2–5 words" → "2–5", "at most 6 words" → "≤6". */
function statedBudgets(text: string) {
  const found: { phrase: string; budget: string; line: number }[] = [];
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/(\d+)\s?[–-]\s?(\d+)(?:\s|&nbsp;)(?:plain\s)?words?\b/g))
      found.push({ phrase: m[0], budget: `${m[1]}–${m[2]}`, line: i + 1 });
    for (const m of line.matchAll(/at most (\d+) words?\b/g)) found.push({ phrase: m[0], budget: `≤${m[1]}`, line: i + 1 });
  });
  return found;
}

describe("Foundations guides and docs state only the system's own budgets", () => {
  it("every word budget a guide or a docs/system page states is one the system defines", () => {
    const allowed = allowedWordBudgets();
    const stale = guideFiles.flatMap((f) =>
      statedBudgets(read(f))
        .filter((b) => !allowed.has(b.budget))
        .map((b) => `${f}:${b.line} "${b.phrase}"`),
    );
    expect(stale, `budgets not in playground/guideFacts.ts or src/deck/budgets.ts`).toEqual([]);
  });

  it("the slot budget table in docs/system/writing.md matches SLOT_BUDGETS", () => {
    const doc = read("docs/system/writing.md");
    const table = doc.slice(doc.indexOf("## Slot budgets"), doc.indexOf("## Diagrams"));
    const rows = table.split("\n").filter((l) => /^\| [a-z]/.test(l));
    expect(rows.length).toBeGreaterThan(10);
    const wrong: string[] = [];
    for (const row of rows) {
      const [cell, budget] = row
        .split("|")
        .slice(1, 3)
        .map((c) => c.trim());
      const slots = cell
        .replace(/\(.*?\)/g, "")
        .split("/")
        .map((s) => s.trim()) as (keyof typeof SLOT_BUDGETS)[];
      for (const slot of slots) {
        const b = SLOT_BUDGETS[slot];
        if (!b) continue;
        if (slot === "headline") {
          if (
            !budget.includes(`at most ${TITLE_WORDS.presented} words`) ||
            !budget.includes(`at most ${TITLE_WORDS["read-alone"]}`)
          )
            wrong.push(`${slot}: "${budget}"`);
          continue;
        }
        if (b.maxWords === undefined) continue;
        const want = b.minWords !== undefined ? `${b.minWords}–${b.maxWords} words` : `at most ${b.maxWords} words`;
        if (!budget.includes(want)) wrong.push(`${slot}: "${budget}" (want "${want}")`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe("Foundations guides agree with the pages they teach", () => {
  const guides = libraryPages.filter((p) => p.group === "foundations" && p.path.startsWith("/foundations"));

  it("the Recipes guide's web sequences are the order /web renders", () => {
    const name: Record<string, string> = {
      "hero + product output": "hero",
      steps: "how",
      mechanism: "mechanism",
      "mechanism figure": "mechanism",
      demo: "demo",
      proof: "proof",
      FAQ: "faq",
      pricing: "pricing",
      closing: "closing",
    };
    const web = recipes.filter((r) => r.href.startsWith("/web"));
    expect(web.length).toBeGreaterThan(0);
    for (const r of web) {
      const rendered = sectionOrder("technical", exampleSectionIds(), "shared");
      expect(
        r.sequence.map((s) => name[s] ?? `?${s}`),
        r.name,
      ).toEqual(rendered);
    }
  });

  it("the Foundations navigation separates the guides the pager counts from the reference pages", () => {
    const group = libraryPages.filter((p) => p.group === "foundations");
    const run = (p: (typeof group)[number]) => ("run" in p ? (p as { run?: string }).run : undefined);
    expect(
      group.every((p) => run(p)),
      "every Foundations page names its run",
    ).toBe(true);
    expect(group.filter((p) => run(p) === "Guides").map((p) => p.path)).toEqual(guides.map((g) => g.path));
  });

  it("every guide names where its full rules live", () => {
    for (const g of guides) expect(guideSources[g.path]?.length, g.path).toBeGreaterThan(0);
  });
});
