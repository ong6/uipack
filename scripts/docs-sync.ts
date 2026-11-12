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
import { SLOT_BUDGETS, TITLE_WORDS, WORD_GUIDES, type SlotBudget, type SlotName } from "../src/deck/budgets";
import { SLIDE_ROLES } from "../src/deck/storyline/roles";
import { STORYLINE_TEMPLATES } from "../src/deck/storyline/templates";
import { LINT_RULES } from "../src/deck/storyline/rules";
import { WORDS_PER_MINUTE } from "../src/speech";
import { FIGURE_GRID } from "../src/geometry";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../src/deck/transitions";
import { GRID_COLUMNS, SPACE, TYPE_BASE_PX, TYPE_RATIO } from "../src/web/tokens";
import { sectionOrder, uiStyles } from "../src/style";
import { tidyChrome, tidySections } from "../playground/tidyFacts";
import { figureRows } from "../playground/figure-rows";
import { LAYER_SECTION_PARTS } from "../examples/articleSectionParts";
import { docsManifest, docsPages, docsSections, siteRegistry, type DocsPageEntry } from "../playground/docs-manifest";
import { objectDirections, objectLooks, objectVariants } from "../src/objects/variants";
import { frontmatter } from "./check-spec";
import { COMPONENTS, LAYOUT_ARCHETYPES, PAGE_TYPES } from "./site-model";
import { CORE_ROLES, lightDark, parseValueSet } from "./style-contract";

const pagesOf = (g: (typeof docsManifest)[number]): readonly DocsPageEntry[] => g.pages;
/** A group as the sidebar places it: its section, then its caption ("Build · Components"; "Start" for an untitled group). */
const groupName = (g: (typeof docsManifest)[number]): string => {
  const section = docsSections.find((s) => s.id === g.section)!.label;
  return "caption" in g && g.caption === false ? section : `${section} · ${g.label}`;
};
/** A page as the site names it: "Deck player: Bento" for a sub-view, "Article parts: Verification" for a sub-page. */
const pageName = (p: DocsPageEntry): string => {
  if (p.title) return `${p.title}: ${p.label}`;
  const parent = p.parent && docsPages.find((q) => q.id === p.parent);
  return parent ? `${parent.label}: ${p.label}` : p.label;
};

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
  { slots: ["point"], name: "point (body line)", note: `; ${WORD_GUIDES.pointsPerSlide.join("–")} a slide` },
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

/** The slot budget table in docs/system/writing/general.md, from `SLOT_BUDGETS` and `TITLE_WORDS`. */
export function slotBudgetTable() {
  const covered = SLOT_ROWS.flatMap((r) => r.slots);
  const missing = (Object.keys(SLOT_BUDGETS) as SlotName[]).filter((s) => !covered.includes(s));
  if (missing.length) throw new Error(`docs:sync: add slot(s) ${missing.join(", ")} to SLOT_ROWS in scripts/docs-sync.ts`);
  const rows = SLOT_ROWS.map(({ slots, name, note = "" }) => {
    const budgets = slots.map((s) => SLOT_BUDGETS[s]);
    let budget: string;
    if (slots[0] === "headline") {
      const b = budgets[0];
      budget = `presented: at most ${TITLE_WORDS.presented} words (aim for ${WORD_GUIDES.presentedTitle.aim.join("–")}); read-alone: at most ${TITLE_WORDS["read-alone"]}, on at most ${b.maxLines} lines`;
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
        `- **${groupName(g)}:** ${pagesOf(g)
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
    return lines.length ? `## ${groupName(g)}\n\n${lines.join("\n")}` : "";
  });
  return [
    "# UiPack",
    "",
    "> Jun Xiong's own design system for his sites and work presentations: diagrams, slides, web pages, motion and 3D, as React and SVG components with the rules for writing and laying them out. The Markdown in this package is written for agents; the docs site (https://ui.junxiong.dev) renders the same files and serves each one as Markdown at its repo path.",
    "",
    "Agents: read docs/agents/README.md first, then the skill for your job in skills/ (README.md indexes them); the design system itself starts at docs/system/README.md. Agent instructions are in AGENTS.md. Generated from playground/docs-manifest.ts by `npm run docs:sync`; do not edit by hand.",
    "",
    `Install (ES modules only; not on npm): \`npm install ${tarballUrl()}\`.`,
    "",
    ...sections.filter(Boolean).flatMap((s) => [s, ""]),
    skillsSection(),
    "",
  ].join("\n");
}

/** Every component uipack/web exports, its props type and its source file, read from src/web/index.ts. */
export function webParts() {
  const src = readFileSync(join(root, "src/web/index.ts"), "utf8");
  const rows: string[] = [];
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*"\.\/([^"]+)"/g)) {
    const names = m[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const types = new Set(names.filter((n) => n.startsWith("type ")).map((n) => n.slice(5).trim()));
    for (const n of names) {
      if (n.startsWith("type ") || !/^[A-Z]/.test(n)) continue;
      const props = types.has(`${n}Props`) ? `\`${n}Props\`` : "";
      const file =
        [".tsx", ".ts"].map((ext) => `src/web/${m[2]}${ext}`).find((f) => existsSync(join(root, f))) ?? `src/web/${m[2]}`;
      rows.push(`| \`${n}\` | ${props} | \`${file}\` |`);
    }
  }
  return ["| Part | Props type | Source |", "| --- | --- | --- |", ...rows].join("\n");
}

/** The job skills in skills/ for llms.txt: each SKILL.md with the first sentence of its description. */
export function skillsSection() {
  const dir = join(root, "skills");
  const lines = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "SKILL.md")))
    .map((e) => {
      const md = readFileSync(join(dir, e.name, "SKILL.md"), "utf8");
      const desc = (md.match(/^description:\s*>?-?\s*\n?([\s\S]*?)\n(?:[a-z-]+:|---)/m)?.[1] ?? "").replace(/\s+/g, " ").trim();
      const first = desc.split(/(?<=\.)\s/)[0];
      return `- [${e.name}](skills/${e.name}/SKILL.md): ${first}`;
    });
  return `## Skills\n\n- [Skills index](skills/README.md): one skill per job; read the one for your job after docs/agents/README.md.\n${lines.join("\n")}`;
}

/* ------------------------------------------------------------------ specs, component looks, registry */

const code = (v: string) => `\`${v.replace(/\|/g, "\\|")}\``;

/** A spec's own value file (frontmatter `values`), as role to value. */
function specValues(file: string): Map<string, string> {
  const fm = frontmatter(readFileSync(join(root, file), "utf8"));
  const values = fm?.values;
  if (typeof values !== "string" || !existsSync(join(root, values)))
    throw new Error(`${file}: spec-roles needs frontmatter values: <style file>`);
  return parseValueSet(readFileSync(join(root, values), "utf8"));
}

/** The spec in docs/specs whose `spec:` id is `id`. */
function specFile(id: string) {
  const name = readdirSync(join(root, "docs/specs")).find(
    (f) => f.endsWith(".md") && frontmatter(readFileSync(join(root, "docs/specs", f), "utf8"))?.spec === id,
  );
  return name && `docs/specs/${name}`;
}

/**
 * A spec's Role values table: every role its style file (frontmatter `values`) sets, light and dark.
 * A spec that extends another and names a file of its own values (the docs site's, over Technical)
 * gets the base spec's roles with its own laid over them.
 */
export function specRoles(file: string) {
  const fm = frontmatter(readFileSync(join(root, file), "utf8"));
  const base = typeof fm?.extends === "string" && fm.extends !== "core" ? specFile(fm.extends) : undefined;
  const own = specValues(file);
  const set = base ? new Map([...specValues(base), ...own]) : own;
  const rows = [...set].map(([name, value]) => {
    const [light, dark] = lightDark(value);
    return `| ${code(`--ui-${name}`)} | ${code(light)} | ${code(dark)} |`;
  });
  return ["| Role | Light | Dark |", "| --- | --- | --- |", ...rows].join("\n");
}

/** A spec's navigation hues: the `--site-hue-<section>` roles its value file sets, light and dark. */
export function navHues(file: string) {
  const values = frontmatter(readFileSync(join(root, file), "utf8"))?.values;
  if (typeof values !== "string") throw new Error(`${file}: nav-hues needs frontmatter values: <file>`);
  const css = readFileSync(join(root, values), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const rows = [...css.matchAll(/--site-hue-([a-z0-9-]+):\s*([^;]+);/g)].map(([, section, value]) => {
    const [light, dark] = lightDark(value.replace(/\s+/g, " ").trim());
    const label = section.charAt(0).toUpperCase() + section.slice(1);
    return `| ${label} | ${code(`--site-hue-${section}`)} | ${code(light)} | ${code(dark)} |`;
  });
  return ["| Section | Role | Light | Dark |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

/** The template's Role values table: every contract role, both cells a TODO to fill. */
export function contractRoles() {
  const rows = CORE_ROLES.map((role) => `| ${code(`--ui-${role}`)} | TODO: | TODO: |`);
  return ["| Role | Light | Dark |", "| --- | --- | --- |", ...rows].join("\n");
}

/**
 * The diagram tokens: what each figure token reads (src/theme.css), first a diagram theme's role
 * (its carrier, --uipack-diagram-<role>), then the page's role, and the built-in `blueprint`
 * theme's value (Technical's, src/styles/technical.css).
 */
export function diagramFamily() {
  const theme = readFileSync(join(root, "src/theme.css"), "utf8");
  const block = theme.slice(theme.indexOf(".uipack {"), theme.indexOf("}", theme.indexOf(".uipack {")));
  const technical = parseValueSet(readFileSync(join(root, "src/styles/technical.css"), "utf8"));
  const rows = [
    ...block.matchAll(
      /(--uipack-[a-z0-9-]+):\s*var\((?:--uipack-diagram-([a-z0-9-]+),\s*var\()?--(ui|uipack)-([a-z0-9-]+)[^;]*;/g,
    ),
  ].map(([, token, themeRole, ns, role]) => {
    const [light, dark] = ns === "ui" ? lightDark(technical.get(role) ?? "") : ["as the accent", "as the accent"];
    return `| ${code(token)} | ${themeRole ? code(themeRole) : "not themed"} | ${code(`--${ns}-${role}`)} | ${code(light)} | ${code(dark)} |`;
  });
  return [
    "| Token | Theme role | Outside a theme, reads | Blueprint light | Blueprint dark |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** The latest release: package.json's version, which a release tags as `v<version>` on main (docs/releases.md). */
export const releaseVersion = (): string => JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

/** The release tarball the release workflow attaches to tag `v<version>` (.github/workflows/release.yml). */
export const tarballUrl = (version = releaseVersion()) =>
  `https://github.com/ong6/uipack/releases/download/v${version}/uipack-${version}.tgz`;

/** The install line a site runs for the latest release. */
export const installCommand = (version = releaseVersion()) => ["```sh", `npm install ${tarballUrl(version)}`, "```"].join("\n");

const semver = (v: string) => /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number) ?? null;

/** A site's pin against the latest release: "current" (uipack itself), a release tag, or a commit. */
export function pinStatus(pin: string, version: string): string {
  if (pin === "current") return "the release source";
  const have = semver(pin);
  const latest = semver(version);
  if (!have || !latest) return `commit pin: move to \`v${version}\``;
  const order = have.findIndex((n, i) => n !== latest[i]);
  if (order < 0) return "up to date";
  return have[order] < latest[order] ? `behind: move to \`v${version}\`` : `ahead of \`v${version}\` (unreleased tag)`;
}

/** docs/specs/registry.md's table, from `siteRegistry` and package.json's version. */
export function registryTable(from: string, version = releaseVersion()) {
  const rows = siteRegistry.map((s) => {
    const spec = s.spec.includes(":")
      ? `\`${s.spec}\` (${s.specStatus === "todo" ? "TODO" : "written"})`
      : `[${s.spec}](${rel(from, s.spec)})`;
    return `| ${s.site} | ${s.repo} | ${spec} | ${s.components.join(", ")} | \`${s.pins}\` | ${pinStatus(s.pins, version)} | ${s.notes} |`;
  });
  return [
    `| Site | Repo | Spec | Component looks | Pins uipack | Against \`v${version}\` | Notes |`,
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/* ------------------------------------------------------------------ site model */

/** The page types a spec can list in `pages:` (scripts/site-model.ts). */
export function pageTypes() {
  const rows = PAGE_TYPES.map((t) => {
    const archetypes = LAYOUT_ARCHETYPES.filter((a) => a.pageType === t.id).map((a) => `\`${a.id}\``);
    return `| \`${t.id}\` | ${t.use} | ${archetypes.join(", ") || "none yet"} |`;
  });
  return ["| Page type | Use it for | Archetypes |", "| --- | --- | --- |", ...rows].join("\n");
}

/** The layout archetype library (LAYOUT_ARCHETYPES), each linked to its doc; the full card is at the top of each doc. */
export function layoutArchetypes(from: string) {
  const rows = LAYOUT_ARCHETYPES.map((a) => `| [\`${a.id}\`](${rel(from, a.file)}) | ${a.pageType} | ${a.regions} | ${a.hero} |`);
  return ["| Archetype | Page type | Regions | Hero |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

/** One archetype's card, for the top of its own doc. */
export function layoutArchetype(file: string) {
  const cards = LAYOUT_ARCHETYPES.filter((a) => a.file === file);
  if (!cards.length) throw new Error(`${file}: no archetype in scripts/site-model.ts names this file`);
  return cards
    .map((a) =>
      [
        `- **Archetype:** \`${a.id}\` (${a.name}), for the \`${a.pageType}\` page type.`,
        `- **Grid:** ${a.grid}.`,
        `- **Regions:** ${a.regions}.`,
        `- **Section order:** ${a.order}.`,
        `- **Hero:** ${a.hero}.`,
        `- **Rendered by:** ${a.code}.`,
      ].join("\n"),
    )
    .join("\n\n");
}

/** Every component and its looks, with each look's mode (COMPONENTS). */
export function componentLooks(from: string) {
  const rows = COMPONENTS.flatMap((c) =>
    c.looks.map(
      (l, i) =>
        `| ${i === 0 ? `[${c.name}](${rel(from, c.doc)}) (\`${c.id}\`, picks ${c.pick})` : ""} | \`${l.id}\` ${l.name} | \`${l.mode}\` | ${l.fixed} | ${l.takes} |`,
    ),
  );
  return [
    "| Component | Look | Mode | The same on every site | Takes from the site |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** One component's looks, for its own doc. */
export function componentLookList(file: string) {
  const c = COMPONENTS.find((x) => x.doc === file);
  if (!c) throw new Error(`${file}: no component in scripts/site-model.ts names this doc`);
  const rows = c.looks.map((l) => `| \`${l.id}\` | ${l.name} | \`${l.mode}\` | ${l.fixed} | ${l.takes} |`);
  return [
    `A spec picks ${c.pick === "one" ? "one look" : "one or more looks"}: \`components: { ${c.id}: ${c.pick === "one" ? c.looks[0].id : `[${c.looks.map((l) => l.id).join(", ")}]`} }\`.`,
    "",
    "| Look | Name | Mode | The same on every site | Takes from the site |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** Which 3D looks each subject offers, its default first (objectLooks in src/objects/variants.ts). */
export function objectLookTable() {
  const ids = COMPONENTS.find((c) => c.id === "3d")!.looks.map((l) => l.id);
  const header = `| Subject | ${ids.map((id) => `\`${id}\``).join(" | ")} |`;
  const rows = Object.entries(objectLooks).map(([kind, variants]) => {
    const cells = ids.map((id) => {
      const offered = variants.filter((v) => (kind === "contact" && v < 3 ? "studio" : objectDirections[v].id) === id);
      if (!offered.length) return "";
      const first = variants[0] === offered[0] ? " (default)" : "";
      return `${offered.map((v) => (objectVariants[kind as keyof typeof objectVariants] as Record<number, string>)[v].replace(/^[^·]*·\s*/, "")).join(", ")}${first}`;
    });
    return `| ${kind} | ${cells.join(" | ")} |`;
  });
  return [header, `| --- |${ids.map(() => " --- |").join("")}`, ...rows].join("\n");
}

/* ------------------------------------------------------------------ writing guidance */

const dash = (r: readonly number[]) => r.join("–");

/** The headline rule in one sentence, the same words everywhere it appears (writing, talks, overview). */
export function headlineRule() {
  const t = WORD_GUIDES.presentedTitle;
  return [
    `- **Presented** (a speaker in the room): aim for ${dash(t.aim)} words; the check stops at ${t.max} (\`title-length\`). A verdict you would say aloud.`,
    `- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of ${dash(WORD_GUIDES.readAloneTitle)} words.`,
    `- **Web section head:** ${dash(WORD_GUIDES.webSectionHead)} plain words naming what the reader gets.`,
  ].join("\n");
}

/** The title forms a spec chooses from per page type, with the core ceiling each one's check enforces. */
export function titleForms() {
  return [
    `- **Short spoken verdict** (a speaker in the room): the check stops at ${TITLE_WORDS.presented} words (\`title-length\`, \`presented\` mode).`,
    `- **Full-sentence claim** (read without its author: a pre-read, a forwarded deck, a figure): one sentence; the check stops at ${TITLE_WORDS["read-alone"]} words (\`read-alone\` mode).`,
    `- **Plain name** (a web section head, a docs heading): names what the reader gets, never a sentence; held to the headline slot's ${SLOT_BUDGETS.headline.maxWords} words, not linted on the web yet.`,
  ].join("\n");
}

/** The lengths the Blueprint diagram look fixes for every site: its labels and its title. */
export function figureLengths() {
  const g = WORD_GUIDES;
  return [
    "| Text | Length | The check |",
    "| --- | --- | --- |",
    `| Label in a drawing | ${dash(g.drawingLabel)} words | \`slot-budget\` stops at ${SLOT_BUDGETS.label.maxWords} |`,
    `| Figure title | ${dash(g.readAloneTitle)} words, one sentence | \`title-length\` stops at ${g.readAloneTitle[1]} |`,
  ].join("\n");
}

/** Every guidance range the writing docs state, with the check behind it where one exists. */
export function wordGuides() {
  const g = WORD_GUIDES;
  const rows = [
    ["Presented slide title", `aim for ${dash(g.presentedTitle.aim)} words`, `\`title-length\` stops at ${g.presentedTitle.max}`],
    [
      "Read-alone title, figure title",
      `${dash(g.readAloneTitle)} words, one sentence`,
      `\`title-length\` stops at ${g.readAloneTitle[1]}`,
    ],
    ["Web section head", `${dash(g.webSectionHead)} words`, "not linted"],
    ["Label in a drawing", `${dash(g.drawingLabel)} words`, `\`slot-budget\` stops at ${SLOT_BUDGETS.label.maxWords}`],
    ["Slide points", `${dash(g.pointsPerSlide)} a slide, each at most ${g.pointWords} words`, "`slot-budget`"],
    ["Speaker cues (`say`, presented)", `at most ${g.cueWords} words`, "`notes-cues`"],
  ];
  return ["| Text | Length | The check |", "| --- | --- | --- |", ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

/** The slide roles (SLIDE_ROLES): what each one answers and its job. */
export function slideRoles() {
  const rows = Object.entries(SLIDE_ROLES).map(([id, r]) => `| \`${id}\` | ${r.question} | ${r.job} |`);
  return ["| Role | Answers | Its job |", "| --- | --- | --- |", ...rows].join("\n");
}

/** The storyline templates (STORYLINE_TEMPLATES): when to use each, its size and its beats in order. */
export function storylines() {
  const rows = STORYLINE_TEMPLATES.map((t) => {
    const beats = t.beats.map((b) => (b.optional ? `(${b.role})` : b.role)).join(" → ");
    return `| ${t.name} | \`${t.id}\` | ${t.use} | ${dash([t.slides.min, t.slides.max])} | ${dash([t.minutes.min, t.minutes.max])} | ${beats} |`;
  });
  return [
    "| Storyline | `starterDeck` / `template` id | Use it for | Slides | Minutes | Beats in order (optional in brackets) |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** The pace a read-alone talk track is timed at (WORDS_PER_MINUTE, which `talk-time` reads). */
export function talkPace() {
  return `- **Pace:** about ${WORDS_PER_MINUTE} words a minute; \`talk-time\` times the track at that pace against the deck's \`minutes\`.\n- **A slide:** about a minute when presented, so about ${WORDS_PER_MINUTE} words of track when read alone.`;
}

/** Every rule `lintDeck` runs (LINT_RULES), with its severity and what it checks. */
export function lintRules() {
  const rows = Object.entries(LINT_RULES).map(([id, r]) => `| \`${id}\` | ${r.severity} | ${r.check.replace(/\|/g, "\\|")} |`);
  return ["| Rule | Severity | What it checks |", "| --- | --- | --- |", ...rows].join("\n");
}

/* ------------------------------------------------------------------ layout facts */

/** The slide canvas and its safe area, from CANVAS_WIDTH/HEIGHT and the slide frame in deck.css. */
export function slideCanvas() {
  const css = readFileSync(join(root, "src/deck/deck.css"), "utf8");
  const rule = /\.uipack-deck-slide \{[^}]*?padding: (\d+)px (\d+)px (\d+)px;/.exec(css);
  if (!rule) throw new Error("docs:sync: no padding on .uipack-deck-slide in src/deck/deck.css");
  const [, top, sides, bottom] = rule;
  return `- **Canvas:** ${CANVAS_WIDTH}×${CANVAS_HEIGHT}, scaled to fit its frame.\n- **Safe area:** ${top} top, ${sides} each side, ${bottom} bottom (canvas pixels).`;
}

/** The web grid and spacing scale (GRID_COLUMNS, SPACE, the type scale's base and ratio). */
export function webGrid() {
  return [
    `- **Columns:** ${GRID_COLUMNS.wide} at a container of 1024px and up, ${GRID_COLUMNS.medium} from 640px, ${GRID_COLUMNS.narrow} below.`,
    `- **Spacing:** ${SPACE.filter(Boolean).join(", ")} px; nothing between the steps.`,
    `- **Type:** a ${TYPE_BASE_PX}px base on a ${TYPE_RATIO} ratio.`,
  ].join("\n");
}

/** Technical's opt-in section order (`uiStyles[].prefers`, used only with `WebPage layout="style"`). */
export function webStyleOrder() {
  return uiStyles.map((s) => `- **${s.name}:** ${s.prefers.join(" → ")}`).join("\n");
}

/** The /web sample's sections in render order, with the exports each is built from (tidySections). */
export function webSectionOrder() {
  const ids = sectionOrder(
    "technical",
    tidySections.map((s) => s.id),
    "shared",
  );
  const lines = ids.map((id, i) => {
    const s = tidySections.find((x) => x.id === id)!;
    return `${i + 1}. **${s.name}** (\`${s.id}\`): ${s.parts.map((p) => `\`${p}\``).join(", ")}`;
  });
  return [
    `- Above the sections, the nav: ${tidyChrome.nav.map((p) => `\`${p}\``).join(", ")}.`,
    "",
    ...lines,
    "",
    `- Below them, the footer: ${tidyChrome.footer.map((p) => `\`${p}\``).join(", ")}.`,
  ].join("\n");
}

/** The figure grid (FIGURE_GRID in src/geometry.ts). */
export function figureGrid() {
  const g = FIGURE_GRID;
  return [
    `- **Grid:** ${g.step}px. Node positions, widths and gaps are multiples of ${g.step}; columns share x and rows share y (\`grid()\` rounds to it).`,
    `- **Margins:** ${g.margin} inside the \`viewBox\`.`,
    `- **Gaps:** ${g.flowGap} between nodes in a flow (${g.minFlowGap} at least, to leave room for arrow labels), ${g.groupGap} between groups; group padding ${g.groupPadding}.`,
    `- **Nodes:** ${g.nodeHeight} tall with a label, ${g.nodeHeightWithSub} with a sub-label.`,
    `- **Narrow:** below ${g.narrowBelow}px a figure shows its authored narrow drawing.`,
  ].join("\n");
}

/** The diagram patterns (playground/figure-rows.ts), simplest first: the claim shape each one draws. */
export function figurePatterns() {
  const rows = figureRows.map(([, title]) => {
    const [name, shape] = title.split(/:\s*/);
    return `| ${shape ? shape.charAt(0).toUpperCase() + shape.slice(1) : "—"} | ${name} |`;
  });
  return ["| Claim shape | Pattern |", "| --- | --- |", ...rows].join("\n");
}

/** The diagram catalogue's index: each pattern linked to its section, the claim it draws and its parts. */
export function figureIndex() {
  const rows = figureRows.map(([id, title, tags]) => {
    const [name, shape] = title.split(/:\s*/);
    return `| [${name}](#${id}) | ${shape ?? ""} | ${tags.join(", ")} |`;
  });
  return ["| Pattern | Draws | Built from |", "| --- | --- | --- |", ...rows].join("\n");
}

/** A long article's layer section, in the order LayerSection renders its parts. */
export function articleSectionOrder() {
  return LAYER_SECTION_PARTS.map((p, i) => `${i + 1}. \`${p.part}\`: ${p.what}`).join("\n");
}

/* ------------------------------------------------------------------ blocks */

/** Each generated block's writer; `file` is the repo path of the Markdown file holding it. */
export const generators: Record<string, (file: string) => string> = {
  "slot-budgets": () => slotBudgetTable(),
  "site-map": (file) => siteMap(file),
  "spec-roles": (file) => specRoles(file),
  "nav-hues": (file) => navHues(file),
  "contract-roles": () => contractRoles(),
  "diagram-family": () => diagramFamily(),
  "site-registry": (file) => registryTable(file),
  install: () => installCommand(),
  "page-types": () => pageTypes(),
  "layout-archetypes": (file) => layoutArchetypes(file),
  "layout-archetype": (file) => layoutArchetype(file),
  "component-looks": (file) => componentLooks(file),
  "component-look-list": (file) => componentLookList(file),
  "object-looks": () => objectLookTable(),
  "title-forms": () => titleForms(),
  "figure-lengths": () => figureLengths(),
  "headline-rule": () => headlineRule(),
  "word-guides": () => wordGuides(),
  "slide-roles": () => slideRoles(),
  storylines: () => storylines(),
  "lint-rules": () => lintRules(),
  "web-parts": () => webParts(),
  "talk-pace": () => talkPace(),
  "slide-canvas": () => slideCanvas(),
  "web-grid": () => webGrid(),
  "web-style-order": () => webStyleOrder(),
  "web-section-order": () => webSectionOrder(),
  "figure-patterns": () => figurePatterns(),
  "figure-grid": () => figureGrid(),
  "figure-index": () => figureIndex(),
  "article-section-order": () => articleSectionOrder(),
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
