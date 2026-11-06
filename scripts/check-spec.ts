// Checks a site spec against the template (docs/specs/TEMPLATE.md) and the core role contract.
//
//   npx tsx scripts/check-spec.ts docs/specs/technical.md
//   npx tsx node_modules/uipack/scripts/check-spec.ts STYLE.md     (from a site's own repo)
//
// Fails on a missing frontmatter key or required section, a contract role with neither a value
// nor a `TODO:`, an `extends` or `uses` that names nothing, an implemented spec without its style
// file, or a spec that sets a value a family it uses owns. test/specs.test.tsx runs it on every
// spec in docs/specs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CORE_ROLES } from "./style-contract";

/** The uipack checkout or install this script belongs to: families, specs and style files resolve here. */
const UIPACK_ROOT = (() => {
  try {
    return resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  } catch {
    // Not loaded from a file URL (a test runner's transform): the repo root it runs from.
    return process.cwd();
  }
})();

export const REQUIRED_KEYS = ["spec", "site", "extends", "uses", "status", "uipack"] as const;
export const REQUIRED_SECTIONS = [
  "Identity",
  "Role values",
  "Type",
  "Density and rhythm",
  "Ornaments",
  "Settings chosen",
  "Page types",
  "Reuse",
  "Open TODOs",
] as const;

export type Frontmatter = Record<string, string | string[]>;

/** The YAML frontmatter as flat keys: `key: value` and `key: [a, b]`. */
export function frontmatter(text: string): Frontmatter | null {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return null;
  const out: Frontmatter = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const value = kv[2].replace(/\s+#.*$/, "").trim();
    out[kv[1]] = value.startsWith("[")
      ? value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : value;
  }
  return out;
}

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

/** The text of one h2 section. */
function section(text: string, title: string) {
  const start = text.indexOf(`\n## ${title}\n`);
  if (start < 0) return "";
  const rest = text.slice(start + title.length + 5);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
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

/** The tokens a family fixes: the names in its doc's generated table (`--uipack-*` and the like). */
export function familyTokens(familyDoc: string) {
  return [...familyDoc.matchAll(/^\|\s*`(--[a-z0-9-]+)`/gm)].map((m) => m[1]);
}

export interface CheckOptions {
  /** Where docs/families and docs/specs live; default the uipack this script belongs to. */
  root?: string;
}

/** Every problem with a spec, as sentences; empty when it conforms. */
export function checkSpec(text: string, { root = UIPACK_ROOT }: CheckOptions = {}): string[] {
  const problems: string[] = [];
  const fm = frontmatter(text);
  if (!fm) return ["no frontmatter: start with the template's --- block"];
  for (const key of REQUIRED_KEYS) if (!fm[key]) problems.push(`frontmatter: missing ${key}`);
  const titles = sections(text);
  for (const title of REQUIRED_SECTIONS) if (!titles.includes(title)) problems.push(`missing section "## ${title}"`);

  const rows = roleRows(text);
  for (const role of CORE_ROLES) {
    const row = rows.get(`--ui-${role}`);
    if (!row) problems.push(`role --ui-${role}: no row in Role values (give a value or TODO:)`);
    else if (row.some((cell) => cell === "" || cell === "-"))
      problems.push(`role --ui-${role}: an empty cell (give a value or TODO:)`);
  }

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

  const uses = Array.isArray(fm.uses) ? fm.uses : fm.uses ? [fm.uses] : [];
  for (const family of uses) {
    const doc = join(root, "docs/families", `${family}.md`);
    if (!existsSync(doc)) {
      problems.push(`uses: no family "${family}" (docs/families/${family}.md)`);
      continue;
    }
    for (const token of familyTokens(readFileSync(doc, "utf8")))
      if (rows.has(token)) problems.push(`${token} belongs to the ${family} family: a spec that uses it may not set it`);
  }

  if (fm.status === "implemented") {
    const values = fm.values;
    if (typeof values !== "string" || !existsSync(join(root, values)))
      problems.push(`status implemented: values must name the style file (got "${values ?? ""}")`);
  } else if (fm.status !== "draft") problems.push(`status: "${fm.status}" (draft or implemented)`);
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
