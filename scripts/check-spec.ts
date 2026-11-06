// Checks a site spec against the template (docs/specs/TEMPLATE.md), the core role contract and the
// site model (scripts/site-model.ts: page types, layout archetypes, component looks).
//
//   npx tsx scripts/check-spec.ts docs/specs/technical.md
//   npx tsx node_modules/uipack/scripts/check-spec.ts STYLE.md     (from a site's own repo)
//
// Fails on a missing frontmatter key or required section; a contract role with neither a value nor
// a `TODO:`; an `extends` that names nothing; a page type in `pages:` with no layout picked or
// defined; a Writing style table missing a row; a component or look that doesn't exist or that the
// component doesn't offer; a spec that sets a value a fixed look it picks owns; and an implemented
// spec without its style file. `uses: [diagrams]` (the older form) still reads as
// `components: { diagrams: blueprint }`. test/specs.test.tsx runs it on every spec in docs/specs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CORE_ROLES } from "./style-contract";
import { COMPONENTS, CUSTOM_LAYOUT_ROWS, LAYOUT_ARCHETYPES, PAGE_TYPES, WRITING_STYLE_ROWS } from "./site-model";

/** The uipack checkout or install this script belongs to: component docs, specs and style files resolve here. */
const UIPACK_ROOT = (() => {
  try {
    return resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  } catch {
    // Not loaded from a file URL (a test runner's transform): the repo root it runs from.
    return process.cwd();
  }
})();

export const REQUIRED_KEYS = ["spec", "site", "extends", "pages", "layouts", "components", "status", "uipack"] as const;
export const REQUIRED_SECTIONS = [
  "Identity",
  "Role values",
  "Type",
  "Density and rhythm",
  "Ornaments",
  "Layout",
  "Writing style",
  "Component looks",
  "Reuse",
  "Open TODOs",
] as const;

export type FrontmatterValue = string | string[] | { [key: string]: string | string[] };
export type Frontmatter = Record<string, FrontmatterValue>;

/** Splits on commas outside brackets and braces. */
function splitTop(s: string) {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "[" || ch === "{") depth++;
    if (ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** A frontmatter value: `a`, `[a, b]` or `{ key: a, other: [b, c] }` (one level). */
function parseValue(value: string): FrontmatterValue {
  if (value.startsWith("[") && value.endsWith("]")) return splitTop(value.slice(1, -1));
  if (value.startsWith("{") && value.endsWith("}")) {
    const map: Record<string, string | string[]> = {};
    for (const pair of splitTop(value.slice(1, -1))) {
      const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(pair);
      if (!kv) continue;
      const v = parseValue(kv[2].trim());
      map[kv[1]] = typeof v === "string" || Array.isArray(v) ? v : JSON.stringify(v);
    }
    return map;
  }
  return value;
}

/** The YAML frontmatter as flat keys: `key: value`, `key: [a, b]` and `key: { k: v, k2: [a, b] }`. */
export function frontmatter(text: string): Frontmatter | null {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return null;
  const out: Frontmatter = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    out[kv[1]] = parseValue(kv[2].replace(/\s+#.*$/, "").trim());
  }
  return out;
}

const list = (v: FrontmatterValue | undefined): string[] => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []);
const map = (v: FrontmatterValue | undefined): Record<string, string | string[]> =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

/** h2 titles, outside code fences. */
function sections(text: string) {
  const out: string[] = [];
  let fence = false;
  for (const line of text.split("\n")) {
    if (/^(`{3,}|~{3,})/.test(line)) fence = !fence;
    else if (!fence && line.startsWith("## ")) out.push(line.slice(3).trim());
  }
  return out;
}

/** The text of one section at a heading level (`## ` by default), up to the next heading at that level or above. */
function section(text: string, title: string, level = 2) {
  const hashes = "#".repeat(level);
  const start = text.indexOf(`\n${hashes} ${title}\n`);
  if (start < 0) return "";
  const rest = text.slice(start + title.length + level + 3);
  const end = rest.search(new RegExp(`\\n#{1,${level}} `));
  return end < 0 ? rest : rest.slice(0, end);
}

/** The first cells of a section's table rows. */
function rowLabels(text: string) {
  return [...text.matchAll(/^\|\s*(?:\*\*)?([^|*]+?)(?:\*\*)?\s*\|/gm)].map((m) => m[1].trim());
}

/** Rows of the Role values table: `--name` to its light and dark cells. */
export function roleRows(text: string) {
  const rows = new Map<string, [string, string]>();
  for (const line of section(text, "Role values").split("\n")) {
    const m = /^\|\s*`(--[a-z0-9-]+)`\s*\|(.*)\|(.*)\|\s*$/.exec(line);
    if (m) rows.set(m[1], [m[2].trim(), m[3].trim()]);
  }
  return rows;
}

/** The tokens a fixed look fixes: the names in its component doc's generated table (`--uipack-*` and the like). */
export function fixedTokens(componentDoc: string) {
  return [...componentDoc.matchAll(/^\|\s*`(--[a-z0-9-]+)`/gm)].map((m) => m[1]);
}

/** The component looks a spec picks: `components:`, or the older `uses: [diagrams]` (each family's first look). */
export function pickedLooks(fm: Frontmatter): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [component, looks] of Object.entries(map(fm.components))) out[component] = list(looks);
  if (!fm.components)
    for (const family of list(fm.uses)) {
      const component = COMPONENTS.find((c) => c.id === family);
      out[family] = component ? [component.looks[0].id] : [];
    }
  return out;
}

export interface CheckOptions {
  /** Where docs/components and docs/specs live; default the uipack this script belongs to. */
  root?: string;
}

/** Every problem with a spec, as sentences; empty when it conforms. */
export function checkSpec(text: string, { root = UIPACK_ROOT }: CheckOptions = {}): string[] {
  const problems: string[] = [];
  const fm = frontmatter(text);
  if (!fm) return ["no frontmatter: start with the template's --- block"];
  const legacy = !fm.components && fm.uses;
  for (const key of REQUIRED_KEYS)
    if (!fm[key] && !(key === "components" && legacy)) problems.push(`frontmatter: missing ${key}`);
  if (fm.components && fm.uses) problems.push("frontmatter: components: replaces uses:; keep only components");
  const titles = sections(text);
  for (const title of REQUIRED_SECTIONS) if (!titles.includes(title)) problems.push(`missing section "## ${title}"`);

  // Roles.
  const rows = roleRows(text);
  for (const role of CORE_ROLES) {
    const row = rows.get(`--ui-${role}`);
    if (!row) problems.push(`role --ui-${role}: no row in Role values (give a value or TODO:)`);
    else if (row.some((cell) => cell === "" || cell === "-"))
      problems.push(`role --ui-${role}: an empty cell (give a value or TODO:)`);
  }

  // Base spec.
  const specsDir = join(root, "docs/specs");
  const specIds = existsSync(specsDir)
    ? readdirSync(specsDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => frontmatter(readFileSync(join(specsDir, f), "utf8"))?.spec)
        .filter((id): id is string => typeof id === "string" && !id.startsWith("TODO"))
    : [];
  const ext = fm.extends;
  if (typeof ext === "string" && ext !== "core" && !specIds.includes(ext))
    problems.push(`extends: "${ext}" is neither core nor a spec in docs/specs`);

  // Layout: every page type used has an archetype picked, or a layout defined under ## Layout.
  const pages = list(fm.pages);
  const layouts = map(fm.layouts);
  const layoutText = section(text, "Layout");
  for (const id of pages) {
    const type = PAGE_TYPES.find((t) => t.id === id);
    if (!type) {
      problems.push(`pages: no page type "${id}" (${PAGE_TYPES.map((t) => t.id).join(", ")})`);
      continue;
    }
    const pick = layouts[id];
    if (!pick) {
      problems.push(`layouts: page type "${id}" has no layout (an archetype id, or custom)`);
      continue;
    }
    const sub = section(layoutText.startsWith("\n") ? layoutText : `\n${layoutText}`, type.name, 3);
    if (!sub.trim()) problems.push(`Layout: no "### ${type.name}" for page type "${id}"`);
    if (pick === "custom") {
      const labels = rowLabels(sub);
      for (const row of CUSTOM_LAYOUT_ROWS)
        if (!labels.includes(row)) problems.push(`Layout, ${type.name}: a custom layout needs a "${row}" row`);
    } else {
      const archetype = LAYOUT_ARCHETYPES.find((a) => a.id === pick);
      if (!archetype) problems.push(`layouts: no archetype "${pick}" (docs/system/layout/README.md lists them)`);
      else if (archetype.pageType !== id)
        problems.push(`layouts: "${pick}" is a ${archetype.pageType} archetype, not a ${id} one`);
    }
  }
  for (const id of Object.keys(layouts)) if (!pages.includes(id)) problems.push(`layouts: "${id}" is not in pages:`);

  // Writing style.
  const writing = rowLabels(section(text, "Writing style"));
  if (titles.includes("Writing style"))
    for (const row of WRITING_STYLE_ROWS) if (!writing.includes(row)) problems.push(`Writing style: no "${row}" row`);

  // Component looks: each exists and is offered; fixed looks keep their values.
  for (const [componentId, looks] of Object.entries(pickedLooks(fm))) {
    const component = COMPONENTS.find((c) => c.id === componentId);
    if (!component) {
      problems.push(`components: no component "${componentId}" (${COMPONENTS.map((c) => c.id).join(", ")})`);
      continue;
    }
    if (!looks.length) problems.push(`components: ${componentId} picks no look`);
    if (component.pick === "one" && looks.length > 1)
      problems.push(`components: ${componentId} takes one look, got ${looks.length}`);
    for (const lookId of looks) {
      const look = component.looks.find((l) => l.id === lookId);
      if (!look) {
        problems.push(`components: ${componentId} offers no look "${lookId}" (${component.looks.map((l) => l.id).join(", ")})`);
        continue;
      }
      if (look.mode !== "fixed") continue;
      const doc = join(root, component.doc);
      if (!existsSync(doc)) continue;
      for (const token of fixedTokens(readFileSync(doc, "utf8")))
        if (rows.has(token))
          problems.push(`${token} is fixed by the ${look.name} look (${component.id}): a spec that picks it may not set it`);
    }
  }

  // Status.
  if (fm.status === "implemented") {
    const values = fm.values;
    if (typeof values !== "string" || !existsSync(join(root, values)))
      problems.push(`status implemented: values must name the style file (got "${typeof values === "string" ? values : ""}")`);
  } else if (fm.status !== "draft") problems.push(`status: "${String(fm.status)}" (draft or implemented)`);
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: tsx scripts/check-spec.ts <spec.md> [...]");
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    const problems = checkSpec(readFileSync(file, "utf8"));
    console.log(problems.length ? `✗ ${file}\n  ${problems.join("\n  ")}` : `✓ ${file}`);
    failed ||= problems.length > 0;
  }
  process.exit(failed ? 1 : 0);
}
