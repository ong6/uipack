// Agent-readability check for uipack's own docs (tier 1 of the agent-docs rubric,
// docs/grading/agent-docs.md). The docs' reader is an agent with a token budget: it starts at an
// entry file, follows links to the one file its task needs, reads that file's opening to decide
// whether to go on, and jumps by heading. This script measures what makes that work:
//   - reach: link hops from the entry files (README.md, AGENTS.md) to every docs file;
//   - opening: each file states what it is for in its first paragraph, before any table or code;
//   - jumpability: no stretch of prose longer than SECTION_LIMIT words without a heading (tables
//     don't count: an agent scans them by row);
//   - size: words per file (reported; a long file is fine when it is headed and routed).
// Run: npx tsx scripts/check-agent-docs.ts [--json]. Exit 1 when a hard rule fails.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { docsMarkdownFiles } from "./docs-sync";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");

export const ENTRY_FILES = ["README.md", "AGENTS.md"] as const;
/** Every docs file is at most this many link hops from an entry file. */
export const MAX_HOPS = 3;
/** The opening paragraph (what the file is for) is at most this many words. */
export const OPENING_LIMIT = 90;
/** No run of prose between two headings is longer than this many words. */
export const SECTION_LIMIT = 900;
/** A file over this many words is reported as long (not a failure). */
export const LONG_FILE = 3000;

export interface AgentDocsRow {
  file: string;
  words: number;
  hops: number | null;
  openingWords: number;
  openingOk: boolean;
  longestSection: { heading: string; words: number };
}

const words = (s: string) => (s.match(/[A-Za-z0-9][\w'’.-]*/g) ?? []).length;

/** Strip fenced code and generated-block markers; keep the text an agent reads. */
function prose(md: string) {
  return md.replace(/^```[\s\S]*?^```/gm, "").replace(/<!--[\s\S]*?-->/g, "");
}

/** The first paragraph after the h1: the text that says what the file is for. */
export function opening(md: string): { text: string; ok: boolean } {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines = body.split("\n");
  let i = lines.findIndex((l) => /^# /.test(l));
  i = i < 0 ? 0 : i + 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  const para: string[] = [];
  while (i < lines.length && lines[i].trim() !== "") para.push(lines[i++]);
  const text = para.join(" ");
  // A heading, table, list, code fence, image or quote first means the file never says what it is for.
  const ok = text.length > 0 && !/^(#|\||[-*] |\d+\. |```|!\[|>)/.test(text.trim());
  return { text, ok };
}

function longestSection(md: string) {
  let best = { heading: "(top)", words: 0 };
  let heading = "(top)";
  let count = 0;
  for (const line of prose(md).split("\n")) {
    const h = line.match(/^#{1,6} (.*)/);
    if (h) {
      if (count > best.words) best = { heading, words: count };
      heading = h[1];
      count = 0;
    } else if (!line.trimStart().startsWith("|")) count += words(line); // a table is scannable by row
  }
  if (count > best.words) best = { heading, words: count };
  return best;
}

/** Relative Markdown links from one file to other Markdown files in the repo. */
function mdLinks(file: string): string[] {
  const src = readFileSync(join(root, file), "utf8").replace(/^```[\s\S]*?^```/gm, "");
  const out = new Set<string>();
  for (const m of src.matchAll(/\]\(([^)\s#]+\.md)(#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    const target = normalize(join(dirname(file), m[1]));
    if (!target.startsWith("..") && existsSync(join(root, target))) out.add(target);
  }
  return [...out];
}

/** Breadth-first link hops from the entry files to every Markdown file reachable. */
export function hopsFromEntries(): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const e of ENTRY_FILES) if (existsSync(join(root, e))) (dist.set(e, 0), queue.push(e));
  while (queue.length) {
    const f = queue.shift()!;
    for (const t of mdLinks(f)) if (!dist.has(t)) (dist.set(t, dist.get(f)! + 1), queue.push(t));
  }
  return dist;
}

export function agentDocsReport(): AgentDocsRow[] {
  const hops = hopsFromEntries();
  return docsMarkdownFiles().map((file) => {
    const md = readFileSync(join(root, file), "utf8");
    const o = opening(md);
    const openingWords = words(o.text);
    return {
      file,
      words: words(prose(md)),
      hops: hops.get(file) ?? null,
      openingWords,
      openingOk: o.ok && openingWords <= OPENING_LIMIT,
      longestSection: longestSection(md),
    };
  });
}

/** The hard rules; each string is one failure. */
export function agentDocsFailures(rows = agentDocsReport()): string[] {
  const out: string[] = [];
  for (const r of rows) {
    if (r.hops === null) out.push(`${r.file}: not linked from README.md or AGENTS.md by any chain of links`);
    else if (r.hops > MAX_HOPS) out.push(`${r.file}: ${r.hops} hops from an entry file (max ${MAX_HOPS})`);
    if (!r.openingOk)
      out.push(`${r.file}: the first paragraph after the title must say what the file is for, in prose of at most ${OPENING_LIMIT} words (has ${r.openingWords})`);
    if (r.longestSection.words > SECTION_LIMIT)
      out.push(`${r.file}: ${r.longestSection.words} words under "${r.longestSection.heading}" without a heading (max ${SECTION_LIMIT})`);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = agentDocsReport();
  if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
  else {
    const total = rows.reduce((n, r) => n + r.words, 0);
    console.log(`${rows.length} docs files, ${total} words. Hop counts from ${ENTRY_FILES.join(", ")}:`);
    const byHop = new Map<string, number>();
    for (const r of rows) byHop.set(String(r.hops ?? "unreached"), (byHop.get(String(r.hops ?? "unreached")) ?? 0) + 1);
    console.log([...byHop].map(([h, n]) => `  ${h}: ${n}`).join("\n"));
    const long = rows.filter((r) => r.words > LONG_FILE).sort((a, b) => b.words - a.words);
    if (long.length) console.log(`Long files (over ${LONG_FILE} words; fine when headed and routed):\n${long.map((r) => `  ${r.words} ${r.file}`).join("\n")}`);
  }
  const fails = agentDocsFailures(rows);
  for (const f of fails) console.log(`FAIL ${f}`);
  console.log(fails.length ? `${fails.length} failure(s)` : "agent-docs check: pass");
  process.exit(fails.length ? 1 : 0);
}

