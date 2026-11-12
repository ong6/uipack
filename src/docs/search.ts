import { extractDocsHeadings } from "./DocsMarkdown";

/**
 * Docs search, hand-rolled: a site builds a static index of its pages at build time
 * (`docsSearchEntries` per Markdown page, then `packDocsSearchIndex`), serves it as one JSON file,
 * and `DocsLayout`'s `search` loads it on first open and ranks it with `searchDocs`. No library,
 * no WebAssembly and no inline script, so it runs under a strict Content-Security-Policy.
 */

/** One searchable unit: a page's opening (no heading) or one of its h2/h3 sections. */
export interface DocsSearchEntry {
  /** The page's title, as the sidebar names it. */
  page: string;
  /** The page's address, without a fragment. */
  href: string;
  /** The `DocsSection.id` the page sits in: results are grouped by it, in its hue. */
  section?: string;
  /** The section's heading; empty for the page's opening. */
  heading: string;
  /** The heading's anchor id, for `href#anchor`; empty for the page's opening. */
  anchor: string;
  /** The section's text, as plain words (no Markdown syntax, no code blocks); in a packed index, its opening only. */
  text: string;
  /** In a packed index: the other words of the section past `text`, once each, matched but never shown. */
  terms?: string;
}

/**
 * The index file: each page once, then its entries as `[page index, heading, anchor, opening,
 * terms]`: the section's first words for the result's snippet, then every other word it uses,
 * once, for matching. About a third the size of the full text.
 */
export interface DocsSearchIndexFile {
  v: 1;
  pages: { t: string; h: string; s?: string }[];
  entries: [number, string, string, string, string][];
}

/** A ranked result: the entry, its score and a snippet of its text around the first match. */
export interface DocsSearchResult {
  entry: DocsSearchEntry;
  score: number;
  snippet: string;
}

const strip = (s: string) =>
  s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, " ")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+|^\s*\d+\.\s+/gm, "")
    .replace(/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/**
 * A Markdown page as search entries: the text before its first h2 (title and lead) as the page's
 * opening, then one entry per h2 and h3 with the text up to the next of either. Code fences and
 * frontmatter are left out; generated tables stay (their cells are content). Anchor ids are the
 * ones DocsMarkdown renders (`extractDocsHeadings`), so a result lands on its heading.
 */
export function docsSearchEntries(markdown: string, page: { title: string; href: string; section?: string }): DocsSearchEntry[] {
  const source = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines = source.split("\n");
  const cuts = extractDocsHeadings(source).filter((h) => h.level === 2 || h.level === 3);
  const textOf = (from: number, to: number) => {
    let fence: string | null = null;
    const kept: string[] = [];
    for (const line of lines.slice(from, to)) {
      const f = /^\s*(`{3,}|~{3,})/.exec(line);
      if (f) {
        if (!fence) fence = f[1][0];
        else if (fence === f[1][0]) fence = null;
        continue;
      }
      if (!fence && !/^#{1,6}\s/.test(line)) kept.push(line);
    }
    return strip(kept.join("\n"));
  };
  const base = { page: page.title, href: page.href, section: page.section };
  const out: DocsSearchEntry[] = [{ ...base, heading: "", anchor: "", text: textOf(0, cuts[0]?.line ?? lines.length) }];
  cuts.forEach((h, i) => {
    out.push({ ...base, heading: h.title, anchor: h.id, text: textOf(h.line + 1, cuts[i + 1]?.line ?? lines.length) });
  });
  return out;
}

const wordsOf = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*[\p{L}\p{N}]|[\p{L}\p{N}]/gu) ?? [];

/**
 * Entries as the compact index file a site serves: pages listed once, each entry's text cut to its
 * opening (`opening` characters, at a word) and the rest kept as its distinct words of three or
 * more letters that the opening and heading do not already hold.
 */
export function packDocsSearchIndex(entries: readonly DocsSearchEntry[], { opening = 280 } = {}): DocsSearchIndexFile {
  const pages: DocsSearchIndexFile["pages"] = [];
  const at = new Map<string, number>();
  const rows: DocsSearchIndexFile["entries"] = [];
  for (const e of entries) {
    let i = at.get(e.href);
    if (i === undefined) {
      i = pages.push(e.section ? { t: e.page, h: e.href, s: e.section } : { t: e.page, h: e.href }) - 1;
      at.set(e.href, i);
    }
    const head = e.text.length > opening ? e.text.slice(0, opening).replace(/\s+\S*$/, "") : e.text;
    const known = new Set([...wordsOf(head), ...wordsOf(e.heading), ...wordsOf(e.terms ?? "")]);
    const rest = [...new Set(wordsOf(e.text.slice(head.length)))].filter((w) => w.length > 2 && !known.has(w));
    const terms = [e.terms ?? "", rest.join(" ")].filter(Boolean).join(" ");
    rows.push([i, e.heading, e.anchor, head, terms]);
  }
  return { v: 1, pages, entries: rows };
}

/** The entries of an index file. */
export function unpackDocsSearchIndex(file: DocsSearchIndexFile): DocsSearchEntry[] {
  return file.entries.map(([i, heading, anchor, text, terms]) => {
    const p = file.pages[i];
    return { page: p.t, href: p.h, section: p.s, heading, anchor, text, terms };
  });
}

const fold = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const words = (s: string) => fold(s).match(/[\p{L}\p{N}]+/gu) ?? [];

interface Prepared {
  entry: DocsSearchEntry;
  page: string;
  heading: string;
  text: string;
  terms: string;
}
const prepared = new WeakMap<readonly DocsSearchEntry[], Prepared[]>();
function prepare(entries: readonly DocsSearchEntry[]) {
  let p = prepared.get(entries);
  if (!p) {
    p = entries.map((entry) => ({
      entry,
      page: fold(entry.page),
      heading: fold(entry.heading),
      text: fold(entry.text),
      terms: fold(entry.terms ?? ""),
    }));
    prepared.set(entries, p);
  }
  return p;
}

/** How well `token` matches `field`: 3 a whole word, 2 the start of a word, 1 inside a word, 0 not at all. */
function hit(field: string, token: string) {
  let at = field.indexOf(token);
  if (at < 0) return 0;
  let best = 1;
  while (at >= 0 && best < 3) {
    const before = at === 0 || !/[\p{L}\p{N}]/u.test(field[at - 1]);
    if (before) {
      const after = at + token.length >= field.length || !/[\p{L}\p{N}]/u.test(field[at + token.length]);
      best = Math.max(best, after ? 3 : 2);
    }
    at = field.indexOf(token, at + 1);
  }
  return best;
}

function snippetOf(text: string, folded: string, tokens: string[], room = 150) {
  let at = -1;
  for (const t of tokens) {
    const i = folded.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0 || at < room / 3) return text.length > room ? `${text.slice(0, room).replace(/\s+\S*$/, "")} …` : text;
  const start = text.lastIndexOf(" ", at - Math.round(room / 3)) + 1;
  const cut = text.slice(start, start + room);
  return `… ${start + room < text.length ? `${cut.replace(/\s+\S*$/, "")} …` : cut}`;
}

/**
 * The entries that match every word of `query` (a word matches the start of a word, or inside one
 * from three letters), best first. A word in the page title counts most, then in a heading, then
 * in the text; whole words beat prefixes, and the whole query as a phrase adds to each. One result
 * per page and heading. An empty query has no results.
 */
export function searchDocs(entries: readonly DocsSearchEntry[], query: string, limit = 40): DocsSearchResult[] {
  const tokens = [...new Set(words(query))];
  if (!tokens.length) return [];
  const phrase = tokens.join(" ");
  const out: DocsSearchResult[] = [];
  for (const p of prepare(entries)) {
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      const inside = t.length >= 3;
      const scoreOf = (field: string) => {
        const h = hit(field, t);
        return h === 1 && !inside ? 0 : h;
      };
      const title = scoreOf(p.page);
      const heading = scoreOf(p.heading);
      const text = Math.max(scoreOf(p.text), scoreOf(p.terms));
      if (!title && !heading && !text) {
        ok = false;
        break;
      }
      score += title * 5 + heading * 3 + Math.min(text, 2) * 1;
    }
    if (!ok) continue;
    if (tokens.length > 1) {
      if (p.page.includes(phrase)) score += 8;
      if (p.heading.includes(phrase)) score += 5;
      if (p.text.includes(phrase)) score += 5;
    }
    // A page's opening ranks above its sections when the title is what matched.
    if (!p.entry.heading && tokens.every((t) => hit(p.page, t) >= 2)) score += 6;
    if (p.page === phrase) score += 10;
    if (p.heading === phrase) score += 6;
    out.push({ entry: p.entry, score, snippet: snippetOf(p.entry.text, p.text, tokens) });
  }
  out.sort((a, b) => b.score - a.score || a.entry.page.localeCompare(b.entry.page));
  return out.slice(0, limit);
}

/** Groups results by section, in the order of each section's best result. */
export function groupDocsResults(results: readonly DocsSearchResult[]) {
  const groups = new Map<string, DocsSearchResult[]>();
  for (const r of results) {
    const key = r.entry.section ?? "";
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return [...groups].map(([section, items]) => ({ section, items }));
}
