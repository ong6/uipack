// Keeps every number, sequence and list the docs state in step with the code they describe.
//
//   npm run docs:sync            rewrite stale generated blocks and llms.txt
//   npm run docs:sync -- --check list what is stale and exit 1, writing nothing
//
// A generated block in a Markdown file is the text between `<!-- generated:<name> -->` and
// `<!-- /generated -->`; `generators[name]` writes it from code. The markers are HTML comments, so
// the file still reads as plain Markdown on GitHub and in node_modules, and DocsMarkdown skips
// them. Edit outside the markers; inside, change the code and rerun. llms.txt (the package root)
// is written whole from the docs manifest. test/docs-manifest.test.tsx fails when anything here
// is stale, so CI catches a change that forgot to run this.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { SLOT_BUDGETS, TITLE_WORDS, type SlotBudget, type SlotName } from "../src/deck/budgets";
import { wordRules } from "../playground/guideFacts";
import { docsManifest, docsPages, siteRegistry, type DocsPageEntry } from "../playground/docs-manifest";
import { frontmatter } from "./check-spec";
import { CORE_ROLES, lightDark, parseValueSet } from "./style-contract";

const pagesOf = (g: (typeof docsManifest)[number]): readonly DocsPageEntry[] => g.pages;
/** A page as the site names it: "Deck player: Bento" for a sub-view. */
const pageName = (p: DocsPageEntry) => (p.title ? `${p.title}: ${p.label}` : p.label);

// npm runs scripts from the repo root, and so does vitest.
const root = process.cwd();

/* ------------------------------------------------------------------ slot budgets */

const OVERFLOW: Record<SlotBudget["overflow"], string> = {
  wrap: "wraps",
  "wrap-balance": "wraps, balanced",
  ellipsis: "ellipsis",
};

/** The table's rows in reading order: the slots, how each is named, and any note a row adds. */
const SLOT_ROWS: { slots: SlotName[]; name?: string; note?: string }[] = [
  { slots: ["eyebrow"], name: "eyebrow (optional)" },
  { slots: ["headline"] },
  { slots: ["title"], note: " (overview and screen readers)" },
  { slots: ["lede"], name: "lede (optional)" },
  { slots: ["point"], name: "point (body line)", note: `; ${wordRules.pointsPerSlide.join("–")} a slide` },
  { slots: ["label"] },
  { slots: ["quote"] },
  { slots: ["attribution"] },
  { slots: ["value", "number"] },
  { slots: ["unit"] },
  { slots: ["baseline"] },
  { slots: ["action"] },
  { slots: ["owner"] },
  { slots: ["date"] },
  { slots: ["source"] },
];

/** "1–4 words, one line, never a sentence" from a slot's budget. */
function budgetText(slot: SlotName, b: SlotBudget) {
  const parts: string[] = [];
  if (b.maxWords !== undefined)
    parts.push(b.minWords !== undefined ? `${b.minWords}–${b.maxWords} words` : `at most ${b.maxWords} words`);
  if (b.maxLines !== undefined) parts.push(b.maxLines === 1 ? "one line" : `${b.maxLines} lines`);
  if (b.maxSentences === 0) parts.push(slot === "point" ? "a fragment with no full stop" : "never a sentence");
  else if (b.maxSentences === 1) parts.push("one sentence");
  else if (b.maxSentences !== undefined) parts.push(`${b.maxSentences} sentences`);
  return parts.join(", ");
}

/** The slot budget table in docs/system/writing.md, from `SLOT_BUDGETS` and `TITLE_WORDS`. */
export function slotBudgetTable() {
  const covered = SLOT_ROWS.flatMap((r) => r.slots);
  const missing = (Object.keys(SLOT_BUDGETS) as SlotName[]).filter((s) => !covered.includes(s));
  if (missing.length) throw new Error(`docs:sync: add slot(s) ${missing.join(", ")} to SLOT_ROWS in scripts/docs-sync.ts`);
  const rows = SLOT_ROWS.map(({ slots, name, note = "" }) => {
    const budgets = slots.map((s) => SLOT_BUDGETS[s]);
    let budget: string;
    if (slots[0] === "headline") {
      const b = budgets[0];
      budget = `presented: at most ${TITLE_WORDS.presented} words (aim for ${wordRules.presentedTitleAim.join("–")}); read-alone: at most ${TITLE_WORDS["read-alone"]}, on at most ${b.maxLines} lines`;
    } else if (slots.length > 1) {
      budget = `at most ${budgets.map((b) => b.maxChars).join(" / ")} characters`;
    } else {
      const b = budgets[0];
      budget =
        b.maxChars !== undefined && b.maxWords === undefined ? `at most ${b.maxChars} characters` : budgetText(slots[0], b);
    }
    const overflow = [...new Set(budgets.map((b) => OVERFLOW[b.overflow]))].join(" / ");
    return `| ${name ?? slots.join(" / ")} | ${budget}${note} | ${overflow} |`;
  });
  return ["| Slot | Budget | When it runs over |", "| --- | --- | --- |", ...rows].join("\n");
}

/* ------------------------------------------------------------------ site map and llms.txt */

const rel = (from: string, file: string) => relative(dirname(from), file) || file.split("/").pop()!;

/** One line per sidebar group, each page linked to its file: the site's map, readable on GitHub. */
export function siteMap(from: string) {
  return docsManifest
    .map(
      (g) =>
        `- **${g.label}:** ${pagesOf(g)
          .map((p) => `[${pageName(p)}](${rel(from, p.file)})`)
          .join(", ")}`,
    )
    .join("\n");
}

/**
 * llms.txt at the package root (llmstxt.org): what UiPack is, then each docs file once under its
 * sidebar group, with the line that says what it is for. Paths are relative, so they resolve in
 * a clone, in node_modules/uipack and on GitHub.
 */
export function llmsTxt() {
  const seen = new Set<string>();
  const sections = docsManifest.map((g) => {
    const lines = pagesOf(g)
      .filter((p) => !seen.has(p.file) && seen.add(p.file))
      .map((p) => `- [${pageName(p)}](${p.file}): ${p.summary ?? p.intro}`);
    return lines.length ? `## ${g.label}\n\n${lines.join("\n")}` : "";
  });
  return [
    "# UiPack",
    "",
    "> A design system that draws explanations: diagrams, slides, web pages, motion and 3D, as React and SVG components. Its documentation is the Markdown in this package; the docs site renders the same files.",
    "",
    "Agents: read docs/agents/README.md first, then the skill for your job in skills/ (README.md indexes them); the design system itself starts at docs/system/README.md. Agent instructions are in AGENTS.md. Generated from playground/docs-manifest.ts by `npm run docs:sync`; do not edit by hand.",
    "",
    ...sections.filter(Boolean).flatMap((s) => [s, ""]),
  ].join("\n");
}

/* ------------------------------------------------------------------ specs, families, registry */

const code = (v: string) => `\`${v.replace(/\|/g, "\\|")}\``;

/** A spec's Role values table: every role its style file (frontmatter `values`) sets, light and dark. */
export function specRoles(file: string) {
  const values = frontmatter(readFileSync(join(root, file), "utf8"))?.values;
  if (typeof values !== "string" || !existsSync(join(root, values)))
    throw new Error(`${file}: spec-roles needs frontmatter values: <style file>`);
  const rows = [...parseValueSet(readFileSync(join(root, values), "utf8"))].map(([name, value]) => {
    const [light, dark] = lightDark(value);
    return `| ${code(`--ui-${name}`)} | ${code(light)} | ${code(dark)} |`;
  });
  return ["| Role | Light | Dark |", "| --- | --- | --- |", ...rows].join("\n");
}

/** The template's Role values table: every contract role, both cells a TODO to fill. */
export function contractRoles() {
  const rows = CORE_ROLES.map((role) => `| ${code(`--ui-${role}`)} | TODO: | TODO: |`);
  return ["| Role | Light | Dark |", "| --- | --- | --- |", ...rows].join("\n");
}

/** The diagram family's tokens: what each figure token reads (src/theme.css) and Technical's value. */
export function diagramFamily() {
  const theme = readFileSync(join(root, "src/theme.css"), "utf8");
  const block = theme.slice(theme.indexOf(".uipack {"), theme.indexOf("}", theme.indexOf(".uipack {")));
  const technical = parseValueSet(readFileSync(join(root, "src/styles/technical.css"), "utf8"));
  const rows = [...block.matchAll(/(--uipack-[a-z0-9-]+):\s*var\(--ui-([a-z0-9-]+)[^;]*;/g)].map(([, token, role]) => {
    const [light, dark] = lightDark(technical.get(role) ?? "");
    return `| ${code(token)} | ${code(`--ui-${role}`)} | ${code(light)} | ${code(dark)} |`;
  });
  return ["| Token | Reads today | Light | Dark |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

/** docs/specs/registry.md's table, from `siteRegistry`. */
export function registryTable(from: string) {
  const rows = siteRegistry.map((s) => {
    const spec = s.spec.includes(":")
      ? `\`${s.spec}\` (${s.specStatus === "todo" ? "TODO" : "written"})`
      : `[${s.spec}](${rel(from, s.spec)})`;
    return `| ${s.site} | ${s.repo} | ${spec} | ${s.families.join(", ")} | \`${s.pins}\` | ${s.notes} |`;
  });
  return ["| Site | Repo | Spec | Families | Pins uipack | Notes |", "| --- | --- | --- | --- | --- | --- |", ...rows].join("\n");
}

/* ------------------------------------------------------------------ blocks */

/** Each generated block's writer; `file` is the repo path of the Markdown file holding it. */
export const generators: Record<string, (file: string) => string> = {
  "slot-budgets": () => slotBudgetTable(),
  "site-map": (file) => siteMap(file),
  "spec-roles": (file) => specRoles(file),
  "contract-roles": () => contractRoles(),
  "diagram-family": () => diagramFamily(),
  "site-registry": (file) => registryTable(file),
};

const BLOCK = /(<!-- generated:([\w-]+) -->\n)([\s\S]*?)(<!-- \/generated -->)/g;

/** The names of the generated blocks in a Markdown source, in order. */
export const blockNames = (source: string) => [...source.matchAll(BLOCK)].map((m) => m[2]);

/** `source` with every generated block rewritten; throws on a block no generator writes. */
export function syncSource(file: string, source: string) {
  return source.replace(BLOCK, (_m, open: string, name: string, _body: string, close: string) => {
    const write = generators[name];
    if (!write) throw new Error(`${file}: no generator "${name}" (scripts/docs-sync.ts)`);
    return `${open}${write(file)}\n${close}`;
  });
}

/** Every Markdown file under docs/ (repo paths), images and asset folders aside. */
export function docsMarkdownFiles(dir = "docs"): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const path = `${dir}/${e.name}`;
    if (e.isDirectory()) return path === "docs/assets" || path === "docs/presets" ? [] : docsMarkdownFiles(path);
    return e.name.endsWith(".md") ? [path] : [];
  });
}

/** The files `docs:sync` owns: every docs Markdown file and manifest file (for their blocks), and llms.txt. */
export function syncTargets() {
  const files = [...new Set([...docsMarkdownFiles(), ...docsPages.map((p) => p.file)])].filter((f) => existsSync(join(root, f)));
  const out = files.map((file) => {
    const current = readFileSync(join(root, file), "utf8");
    return { file, current, next: syncSource(file, current) };
  });
  const llms = join(root, "llms.txt");
  out.push({ file: "llms.txt", current: existsSync(llms) ? readFileSync(llms, "utf8") : "", next: llmsTxt() });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const stale = syncTargets().filter((t) => t.current !== t.next);
  for (const t of stale) {
    if (!check) writeFileSync(join(root, t.file), t.next);
    console.log(`${check ? "stale" : "wrote"} ${t.file}`);
  }
  if (!stale.length) console.log("docs:sync: every generated block and llms.txt is current");
  if (check && stale.length) process.exit(1);
}
