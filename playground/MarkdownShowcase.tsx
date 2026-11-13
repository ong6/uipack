import { useEffect, useMemo, useState } from "react";
import { DocsMarkdown, extractDocsHeadings, type DocsMarkdownBlock, type DocsTocItem } from "../src/docs";
import "../src/docs/docs.css";
import { resolvePage, type PageDef } from "./catalog";
import { DemoBlock, demos, withDemos } from "./demos";
import { resolveDocsUrl } from "./docs-links";
import { PAGE_TEXT_FILE, PAGE_TEXT_ID, pageReady } from "./page-ready";
import { routePath, routes } from "./routes";
import { useShowcaseTheme, useShowcaseToc } from "./ShowcaseShell";

// Every Markdown file a page can render, each its own small chunk, loaded when its page opens.
const sources = import.meta.glob<string>(["../docs/**/*.md", "../README.md"], { query: "?raw", import: "default" });

/**
 * A file's YAML frontmatter (a spec's `extends`, `uses`…) shown as a yaml block under its title, so
 * readers see what an agent reads; GitHub renders it as a table, DocsMarkdown would not.
 */
function showFrontmatter(text: string) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return text;
  const rest = text.slice(m[0].length);
  const title = /^(# .*\n)/.exec(rest.trimStart());
  const body = rest.trimStart();
  const block = "```yaml\n" + m[1] + "\n```\n";
  return title ? `${title[1]}\n${block}${body.slice(title[1].length)}` : block + body;
}

/**
 * A sub-view's h1 names the view too ("Deck player · Bento") when the file's `#` is the page's
 * title, so the deck examples that share docs/deck.md still say which one is open.
 */
export function withSubViewTitle(text: string, page: Pick<PageDef, "title" | "label" | "query"> | undefined) {
  if (!page?.query || !page.title) return text;
  return text.replace(/^# (.+)$/m, (line, h1: string) => (h1.trim() === page.title ? `# ${h1.trim()} · ${page.label}` : line));
}

/**
 * A sample file's page is titled by its manifest label ("Spec template"): the file's own `#`, a
 * placeholder for whoever copies it, follows as an h2. The file is unchanged.
 */
export function withSampleTitle(text: string, page: Pick<PageDef, "label" | "sampleFile"> | undefined) {
  if (!page?.sampleFile) return text;
  return text.replace(/^# (.+)$/m, (_, h1: string) => `# ${page.label}\n\n## ${h1.trim()}`);
}

/** The page for this address: the manifest entry whose route it is. */
function currentPage(): PageDef | undefined {
  const id = routes.get(routePath(location.pathname));
  return id ? resolvePage(id, location.search) : undefined;
}

/** A page's file as the page renders it: its frontmatter shown, its title, its demos in place. */
const pageSource = (text: string, page: PageDef | undefined) =>
  withDemos(withSubViewTitle(showFrontmatter(withSampleTitle(text, page)), page), page?.demos);

/** The h2 and h3 headings of a page's text, for "On this page". */
const pageToc = (source: string): DocsTocItem[] =>
  extractDocsHeadings(source)
    .filter((h) => h.level === 2 || h.level === 3)
    .map(({ id, level, title }) => ({ id, level: level as 2 | 3, title }));

// The current page's text, ready before the first render.
let prepared: { page: PageDef; source: string } | undefined;

/**
 * Takes the current page's Markdown from the document, which carries it in a JSON block (the build
 * and the dev server write it: vite.config.ts, `withPageScripts`), so the page's first frame has
 * its text and "On this page" already, with no "Loading…" line and no request in between. Returns
 * the page's headings, which the shell needs for that first frame; undefined when the block is not
 * this page's file (a deck sub-view's, say), and the page then loads its file itself.
 */
function prepareNow(): DocsTocItem[] | undefined {
  const page = currentPage();
  const block = document.getElementById(PAGE_TEXT_ID);
  if (!page || !block || block.getAttribute(PAGE_TEXT_FILE) !== page.file) return undefined;
  let text: unknown;
  try {
    text = JSON.parse(block.textContent ?? "");
  } catch {
    return undefined;
  }
  if (typeof text !== "string") return undefined;
  const source = pageSource(text, page);
  prepared = { page, source };
  return pageToc(source);
}

/**
 * A docs page: the page's Markdown file (docs-manifest.ts `file`) rendered by DocsMarkdown, with its
 * `uipack-demo` blocks as live demos and its links pointed at the site's pages. The file's `#` is
 * the page's one h1 (a sample file's page takes the manifest's label, `withSampleTitle`); its h2 and h3 headings fill the shell's "On this page".
 */
export default function MarkdownShowcase() {
  const { theme } = useShowcaseTheme();
  const page = currentPage();
  const file = page?.file;
  // The text main.tsx had ready before the first render (`prepareNow`), else loaded here.
  const [source, setSource] = useState<string | null>(() => (page && prepared?.page === page ? prepared.source : null));
  const [failed, setFailed] = useState(false);
  const load = file ? sources[`../${file}`] : undefined;

  useEffect(() => {
    if (!load || source !== null) return;
    let live = true;
    load().then(
      (text) => live && setSource(pageSource(text, page)),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
    // `page` is the manifest's own entry (a stable object), so this runs once per address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, page]);

  const toc = useMemo(() => (source ? pageToc(source) : []), [source]);
  useShowcaseToc(toc);

  const blocks = useMemo(
    () => ({
      "uipack-demo": ({ id }: DocsMarkdownBlock) => (demos[id] ? <DemoBlock id={id} /> : undefined),
    }),
    [],
  );

  if (failed || !load) return <p role="status">This page&rsquo;s Markdown file ({file}) could not be loaded.</p>;
  if (source === null)
    return (
      <p className="showcase-loading" role="status">
        Loading {page?.label}…
      </p>
    );
  return (
    <DocsMarkdown
      source={source}
      blocks={blocks}
      resolveUrl={(url, kind) => (file ? resolveDocsUrl(file, url, kind, theme) : url)}
    />
  );
}

pageReady("MarkdownShowcase", { default: MarkdownShowcase, prepareNow });
