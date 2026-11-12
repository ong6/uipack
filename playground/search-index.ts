// The docs site's search index, built from the docs manifest at build time: every page's Markdown
// file as search entries (uipack/docs `docsSearchEntries`: the page's opening, then each h2 and h3
// section), packed into one JSON file. vite.config.ts serves it at /search-index.json in dev and
// emits it in a build; the shell's search loads it the first time the dialog opens.
import { docsSearchEntries, packDocsSearchIndex, type DocsSearchEntry, type DocsSearchIndexFile } from "../src/docs/search";
import { docsManifest, type DocsPageEntry } from "./docs-manifest";

export { SEARCH_INDEX_PATH } from "./search-index-path";

const hrefOf = (p: DocsPageEntry) => {
  const query = new URLSearchParams(p.query).toString();
  return query ? `${p.path}?${query}` : p.path;
};

/**
 * Every page once: a file several pages render (the deck guide behind its three examples) is
 * indexed under the first of them. A sub-page is titled with its parent ("Writing: General rules"),
 * a sub-view with its page ("Deck player"), so a result says where it lands.
 */
export function siteSearchIndex(read: (file: string) => string): DocsSearchIndexFile {
  const seen = new Set<string>();
  const entries: DocsSearchEntry[] = [];
  const all = docsManifest.flatMap((g) => g.pages.map((p: DocsPageEntry) => ({ p, section: g.section })));
  for (const { p, section } of all) {
    if (seen.has(p.file)) continue;
    seen.add(p.file);
    const parent = p.parent ? all.find((q) => q.p.id === p.parent)?.p : undefined;
    const title = p.title ?? (parent ? `${parent.label}: ${p.label}` : p.label);
    entries.push(...docsSearchEntries(read(p.file), { title, href: hrefOf(p), section }));
  }
  return packDocsSearchIndex(entries);
}
