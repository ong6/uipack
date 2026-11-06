// The Rules, recipes and examples state the system's numbers and sequences. Every system change
// (new writing budgets, a new section on /web) used to leave hand-written copies stale, and readers
// then met a guide that contradicted the code or the page it teaches. These checks fail on that
// drift: numbers live in generated blocks (npm run docs:sync), and each generated sequence is
// checked against the thing that renders it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { SLOT_BUDGETS, TITLE_WORDS, WORD_GUIDES } from "../src/deck/budgets";
import { FIGURE_GRID } from "../src";
import * as web from "../src/web";
import * as presets from "../src/presets";
import { docsMarkdownFiles } from "../scripts/docs-sync";
import { pageDefs as libraryPages } from "../playground/catalog";
import { tidyChrome, tidySections } from "../playground/tidyFacts";
import { exampleSectionIds } from "../playground/WebShowcase";
import { LAYER_SECTION_PARTS } from "../examples/articleSectionParts";
import { LayerSection, inference } from "../examples/articleParts";

const root = resolve(__dirname, "..");
const read = (f: string) => readFileSync(resolve(root, f), "utf8");

/** Every word budget the system defines, normalised ("2–5", "≤6"). */
function allowedWordBudgets(): Set<string> {
  const out = new Set<string>();
  const add = (r: number | readonly number[]) => out.add(typeof r === "number" ? `≤${r}` : `${r[0]}–${r[1]}`);
  add(WORD_GUIDES.presentedTitle.aim);
  add(WORD_GUIDES.presentedTitle.max);
  add(WORD_GUIDES.readAloneTitle);
  add(WORD_GUIDES.webSectionHead);
  add(WORD_GUIDES.drawingLabel);
  add(WORD_GUIDES.pointWords);
  add(WORD_GUIDES.cueWords);
  for (const b of Object.values(SLOT_BUDGETS)) {
    if (b.maxWords === undefined) continue;
    out.add(`≤${b.maxWords}`);
    if (b.minWords !== undefined) out.add(`${b.minWords}–${b.maxWords}`);
  }
  for (const n of Object.values(TITLE_WORDS)) out.add(`≤${n}`);
  return out;
}

/** The text outside generated blocks and code fences. */
const prose = (text: string) =>
  text.replace(/<!-- generated:[\w-]+ -->[\s\S]*?<!-- \/generated -->/g, "").replace(/^(`{3,})[\s\S]*?^\1/gm, "");

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

const rulesFiles = docsMarkdownFiles().filter((f) => /^docs\/(system|recipes|examples)\//.test(f));

describe("the docs state only the system's own budgets", () => {
  it("the Rules, recipes and examples state word budgets only inside generated blocks", () => {
    const literal = rulesFiles.flatMap((f) => statedBudgets(prose(read(f))).map((b) => `${f}:${b.line} "${b.phrase}"`));
    expect(literal, "state budgets through a generated block (scripts/docs-sync.ts)").toEqual([]);
  });

  it("every word budget any other docs page states is one the system defines", () => {
    const allowed = allowedWordBudgets();
    const stale = docsMarkdownFiles().flatMap((f) =>
      statedBudgets(read(f))
        .filter((b) => !allowed.has(b.budget))
        .map((b) => `${f}:${b.line} "${b.phrase}"`),
    );
    expect(stale, "budgets not in src/deck/budgets.ts").toEqual([]);
  });

  it("the presented headline rule says the aim and the check in the same words everywhere", () => {
    const { aim, max } = WORD_GUIDES.presentedTitle;
    // The aims are Technical's writing style; the core states only the forms and their ceilings.
    for (const f of ["docs/specs/technical.md", "docs/system/do-and-dont.md"])
      expect(read(f), f).toContain(`aim for ${aim.join("–")} words; the check stops at ${max}`);
    const core = ["docs/system/README.md", "docs/system/writing/README.md", "docs/system/writing/talks.md"];
    for (const f of core) {
      expect(read(f), f).toContain(`the check stops at ${TITLE_WORDS.presented} words`);
      expect(read(f), f).not.toContain(`aim for ${aim.join("–")} words`);
    }
  });

  it("the slot budget table matches SLOT_BUDGETS", () => {
    const doc = read("docs/system/writing/general.md");
    const table = doc.slice(doc.indexOf("<!-- generated:slot-budgets -->"), doc.indexOf("<!-- /generated -->"));
    const rows = table.split("\n").filter((l) => /^\| [a-z]/.test(l));
    expect(rows.length).toBeGreaterThan(10);
    for (const row of rows) {
      const [cell, budget] = row
        .split("|")
        .slice(1, 3)
        .map((c) => c.trim());
      for (const slot of cell
        .replace(/\(.*?\)/g, "")
        .split("/")
        .map((s) => s.trim()) as (keyof typeof SLOT_BUDGETS)[]) {
        const b = SLOT_BUDGETS[slot];
        if (!b || slot === "headline" || b.maxWords === undefined) continue;
        expect(budget, slot).toContain(
          b.minWords !== undefined ? `${b.minWords}–${b.maxWords} words` : `at most ${b.maxWords} words`,
        );
      }
    }
  });
});

describe("generated sequences match what renders them", () => {
  it("the landing recipe's section order is the order /web renders", () => {
    expect(tidySections.map((s) => s.id)).toEqual(exampleSectionIds());
  });

  it("every part the landing recipe names is a real export", () => {
    const exports = new Set([...Object.keys(web), ...Object.keys(presets)]);
    const missing = [...tidySections.flatMap((s) => s.parts), ...tidyChrome.nav, ...tidyChrome.footer].filter(
      (p) => !exports.has(p),
    );
    expect(missing).toEqual([]);
  });

  it("the article section order is the order LayerSection renders", () => {
    const html = renderToStaticMarkup(<LayerSection section={inference} id="x" />);
    const at = (part: string) => {
      const marker: Record<string, RegExp> = {
        LayerHead: /uipack-layerhead/,
        "<h2> or <h3>": /<h3 id="x"/,
        "<p>": /<p>/,
        TermList: /uipack-terms/,
        ChangeNote: /uipack-change/,
        Callout: /uipack-callout/,
        LinkList: /uipack-links/,
        NoteCluster: /uipack-cluster/,
      };
      return html.search(marker[part]);
    };
    const positions = LAYER_SECTION_PARTS.map((p) => at(p.part));
    expect(
      positions.every((n) => n >= 0),
      JSON.stringify(positions),
    ).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("the figure grid's narrow width is the one theme.css switches at", () => {
    expect(read("src/theme.css")).toContain(`@media (max-width: ${FIGURE_GRID.narrowBelow}px)`);
  });
});

describe("the sidebar's sub-pages", () => {
  it("each sub-page follows its parent, in the same group", () => {
    libraryPages.forEach((p, i) => {
      if (!p.parent) return;
      const parent = libraryPages.findIndex((q) => q.id === p.parent);
      expect(parent, p.id).toBeGreaterThanOrEqual(0);
      expect(parent, p.id).toBeLessThan(i);
      expect(libraryPages[parent].group, p.id).toBe(p.group);
    });
  });
});
